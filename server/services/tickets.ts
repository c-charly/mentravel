// Billets: vue masquee (publique, PNR seul), vue complete (jeton ou piece d'identite), deverrouillage.
import { createHash, timingSafeEqual } from 'node:crypto'
import { SETTINGS } from '../../content/network'
import { capacityOf, getLayout } from '../../shared/seats'
import { instantOf } from '../../shared/time'
import type {
  AvailabilityEntry,
  FullTicket,
  JourneyStage,
  MaskedTicket,
  SeatInfo,
  VerifyStamp,
} from '../../shared/types'
import { normalizeId } from '../../shared/validation'
import { getConfig } from '../utils/config'
import { maskHolder } from '../utils/mask'
import { clearFails, lockStatus, registerFail } from '../utils/rateLimit'
import type { StoredBooking } from '../utils/store'
import { bookingsOfGroup, findBooking } from './bookings'
import { getDepartureInfo, getSeats, takenSeatsOf } from './catalog'
import { heldSeatsOf } from './holds'

export function journeyStage(b: StoredBooking, now = Date.now()): JourneyStage {
  const dep = getDepartureInfo(b.departureId, now)
  if (!dep || (b.status !== 'paid' && b.status !== 'boarded')) return 'reserved'
  const start = instantOf(dep.date, dep.departureTime)
  const end = instantOf(dep.date, dep.departureTime, dep.durationMin)
  if (now >= end) return 'arrived'
  if (now >= start || b.status === 'boarded') return 'enroute'
  if (now >= start - SETTINGS.boardingOpensMinutesBefore * 60_000) return 'boarding'
  return 'paid'
}

export function verifyStamp(b: StoredBooking, now = Date.now()): VerifyStamp {
  switch (b.status) {
    case 'cancelled':
    case 'expired':
      return 'cancelled'
    case 'pending':
      return 'pending'
    case 'boarded':
      return 'used'
    default:
      return journeyStage(b, now) === 'arrived' ? 'used' : 'authentic'
  }
}

function availabilityOf(depId: string, now: number): AvailabilityEntry[] {
  const dep = getDepartureInfo(depId, now)
  if (!dep) return []
  return dep.offers.map((o) => ({ classId: o.classId, seatsLeft: o.left, capacity: o.capacity }))
}

function seatMapOf(b: StoredBooking, now: number): SeatInfo[] {
  const taken = takenSeatsOf(b.departureId, b.classId)
  const held = heldSeatsOf(b.departureId, b.classId, undefined, now)
  // Les sieges du billet sont toujours montres comme occupes (jamais de nom)
  b.seatIds.forEach((s) => taken.add(s))
  return getLayout(b.classId).seats.map((s) => ({
    id: s.id,
    status: taken.has(s.id) ? 'taken' : held.has(s.id) ? 'held' : 'free',
  }))
}

export function buildMaskedTicket(b: StoredBooking, now = Date.now()): MaskedTicket | null {
  const dep = getDepartureInfo(b.departureId, now)
  if (!dep) return null
  const linked = bookingsOfGroup(b.groupId).length
  return {
    pnr: b.pnr,
    departureId: b.departureId,
    status: b.status,
    stamp: verifyStamp(b, now),
    stage: journeyStage(b, now),
    classId: b.classId,
    passengerCount: b.seatIds.length,
    seatIds: b.seatIds,
    route: {
      fromCity: dep.from,
      toCity: dep.to,
      boardingPoint: dep.boardingPoint,
      arrivalPoint: dep.arrivalPoint,
      durationMin: dep.durationMin,
    },
    date: dep.date,
    departureTime: dep.departureTime,
    arrivalTime: dep.arrivalTime,
    arrivalNextDay: dep.arrivalNextDay,
    amountFcfa: b.amountFcfa,
    amountPaidFcfa: b.amountPaidFcfa,
    linkedCount: linked,
    holderMasked: maskHolder(b.holder),
    availability: availabilityOf(b.departureId, now),
    seatMap: seatMapOf(b, now),
    layout: getLayout(b.classId),
  }
}

export function getMaskedTicket(pnr: string, now = Date.now()): MaskedTicket | null {
  const b = findBooking(pnr, now)
  return b ? buildMaskedTicket(b, now) : null
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function getFullTicket(pnr: string, token: string, now = Date.now()): FullTicket | null {
  const b = findBooking(pnr, now)
  if (!b || !token || !safeEqual(token, b.accessToken)) return null
  const masked = buildMaskedTicket(b, now)
  if (!masked) return null
  const linkedPnrs = bookingsOfGroup(b.groupId)
    .filter((x) => x.pnr !== b.pnr)
    .map((x) => x.pnr)
  return { ...masked, holder: { ...b.holder }, linkedPnrs }
}

export type UnlockResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'locked'; retryAfterSec: number }
  | { ok: false; reason: 'invalid' }

// Deverrouillage par numero d'identification du titulaire. Le telephone n'intervient jamais.
export function unlockTicket(pnr: string, idNumber: string, ip: string, now = Date.now()): UnlockResult {
  const cfg = getConfig()
  const keys = [`unlock:${ip}:${pnr}`, `unlock:pnr:${pnr}`]
  for (const key of keys) {
    const lock = lockStatus(key, now)
    if (lock.locked) return { ok: false, reason: 'locked', retryAfterSec: lock.retryAfterSec }
  }
  const b = findBooking(pnr, now)
  const given = normalizeId(idNumber ?? '')
  const valid = !!b && given.length > 0 && safeEqual(given, normalizeId(b.holder.idNumber))
  if (!valid) {
    registerFail(keys[0]!, cfg.unlockMaxFails, cfg.unlockLockMinutes, now)
    // Plafond plus large par PNR pour freiner les essais repartis sur plusieurs adresses
    registerFail(keys[1]!, cfg.unlockMaxFails * 4, cfg.unlockLockMinutes * 2, now)
    return { ok: false, reason: 'invalid' }
  }
  keys.forEach(clearFails)
  return { ok: true, token: b.accessToken }
}

export function seatMapFor(depId: string, classId: StoredBooking['classId']) {
  return getSeats(depId, classId)
}

export function capacityFor(classId: StoredBooking['classId']): number {
  return capacityOf(classId)
}
