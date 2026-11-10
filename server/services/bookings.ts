// Reservations: creation a partir de retenues de sieges, un seul titulaire par reservation.
import { legAmounts } from '../../shared/pricing'
import { instantOf } from '../../shared/time'
import type { CreateBookingBody, CreateBookingResponse, CreatedBooking, Holder } from '../../shared/types'
import { validateHolder, normalizeId, normalizePhone } from '../../shared/validation'
import { generateId, generatePnr, generateToken } from '../utils/random'
import { getDb, persist, type StoredBooking } from '../utils/store'
import { getDepartureInfo } from './catalog'
import { getHold } from './holds'

export type CreateBookingError =
  | { code: 'invalid_holder'; fields: string[] }
  | { code: 'invalid_legs' }
  | { code: 'hold_expired' }
  | { code: 'departed' }
  | { code: 'return_before_outbound' }

function cleanHolder(h: Holder): Holder {
  return {
    lastName: h.lastName.trim().replace(/\s+/g, ' '),
    firstName: h.firstName.trim().replace(/\s+/g, ' '),
    phone: normalizePhone(h.phone),
    idType: h.idType,
    idNumber: normalizeId(h.idNumber),
  }
}

export function findBooking(pnr: string, now = Date.now()): StoredBooking | null {
  const b = getDb().bookings[pnr]
  if (!b) return null
  refreshBooking(b, now)
  return b
}

// Une reservation non payee dont la retenue a expire passe a "expired"
export function refreshBooking(b: StoredBooking, now = Date.now()): StoredBooking {
  if (b.status !== 'pending') return b
  const paymentRunning = (b.paymentPendingUntil ?? 0) > now
  if (!paymentRunning && (!b.holdId || !getHold(b.holdId, now))) {
    b.status = 'expired'
    persist()
  }
  return b
}

export function bookingsOfGroup(groupId: string): StoredBooking[] {
  return Object.values(getDb().bookings).filter((b) => b.groupId === groupId)
}

export function createBookings(
  body: CreateBookingBody,
  _ownerKey: string,
  now = Date.now(),
): { ok: true; result: CreateBookingResponse } | { ok: false; error: CreateBookingError } {
  const errors = validateHolder(body.holder ?? {})
  if (Object.keys(errors).length) return { ok: false, error: { code: 'invalid_holder', fields: Object.keys(errors) } }
  if (!Array.isArray(body.legs) || body.legs.length < 1 || body.legs.length > 2) {
    return { ok: false, error: { code: 'invalid_legs' } }
  }

  const holder = cleanHolder(body.holder)
  const holds = []
  for (const leg of body.legs) {
    const hold = leg?.holdId ? getHold(leg.holdId, now) : null
    if (!hold) return { ok: false, error: { code: 'hold_expired' } }
    const dep = getDepartureInfo(hold.departureId, now)
    if (!dep) return { ok: false, error: { code: 'invalid_legs' } }
    if (dep.departed) return { ok: false, error: { code: 'departed' } }
    holds.push({ hold, dep })
  }

  if (holds.length === 2) {
    const [out, back] = holds as [(typeof holds)[number], (typeof holds)[number]]
    const outEnd = instantOf(out.dep.date, out.dep.departureTime, out.dep.durationMin)
    if (instantOf(back.dep.date, back.dep.departureTime) <= outEnd) {
      return { ok: false, error: { code: 'return_before_outbound' } }
    }
  }

  const amounts = legAmounts(
    holds.map(({ hold, dep }) => ({
      from: dep.from,
      to: dep.to,
      classId: hold.classId,
      seatCount: hold.seatIds.length,
    })),
  )

  const db = getDb()
  const groupId = generateId('grp')
  const created: CreatedBooking[] = []

  holds.forEach(({ hold }, i) => {
    // Idempotence: si une reservation en attente existe deja pour cette retenue, on la met a jour
    const existing = Object.values(db.bookings).find((b) => b.holdId === hold.id && b.status === 'pending')
    let booking: StoredBooking
    if (existing) {
      existing.holder = holder
      existing.amountFcfa = amounts[i]!
      booking = existing
    } else {
      let pnr = generatePnr()
      while (db.bookings[pnr]) pnr = generatePnr()
      booking = {
        pnr,
        accessToken: generateToken(),
        groupId,
        departureId: hold.departureId,
        classId: hold.classId,
        seatIds: hold.seatIds,
        holder,
        amountFcfa: amounts[i]!,
        amountPaidFcfa: 0,
        status: 'pending',
        createdAt: new Date(now).toISOString(),
        holdId: hold.id,
      }
      db.bookings[pnr] = booking
    }
    created.push({
      pnr: booking.pnr,
      accessToken: booking.accessToken,
      departureId: booking.departureId,
      classId: booking.classId,
      seatIds: booking.seatIds,
      amountFcfa: booking.amountFcfa,
      expiresAt: new Date(hold.expiresAt).toISOString(),
    })
  })
  persist()
  return {
    ok: true,
    result: {
      groupId: created[0] ? db.bookings[created[0].pnr]!.groupId : groupId,
      totalFcfa: created.reduce((sum, b) => sum + b.amountFcfa, 0),
      bookings: created,
    },
  }
}
