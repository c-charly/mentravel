// Catalogue: departs, disponibilites, plans de sieges.
// Un depart = un horaire sur une ligne, un jour donne. Il propose plusieurs classes a la fois.
import {
  CLASS_IDS,
  CLASSES,
  SETTINGS,
  fareFor,
  getRoute,
  getRouteById,
  timetableFor,
} from '../../content/network'
import { capacityOf, getLayout } from '../../shared/seats'
import {
  addDays,
  arrivalOf,
  compactTime,
  dayOfWeek,
  expandTime,
  instantOf,
  isIsoDate,
  todayDouala,
} from '../../shared/time'
import type {
  CalendarDay,
  CalendarResponse,
  CityId,
  ClassId,
  DepartureInfo,
  SeatInfo,
  SeatsResponse,
} from '../../shared/types'
import { getConfig } from '../utils/config'
import { hashString, seededRandom } from '../utils/random'
import { bookedSeatsOf } from './bookingIndex'
import { heldSeatsOf } from './holds'

export function buildDepartureId(from: CityId, to: CityId, date: string, time: string): string {
  return `${from}-${to}_${date}_${compactTime(time)}`
}

export interface ParsedDeparture {
  id: string
  from: CityId
  to: CityId
  date: string
  time: string
  classes: ClassId[]
}

export function parseDepartureId(id: string): ParsedDeparture | null {
  const [routeId, date, compact] = id.split('_')
  if (!routeId || !date || !compact || !/^\d{4}$/.test(compact) || !isIsoDate(date)) return null
  const route = getRouteById(routeId)
  if (!route) return null
  const time = expandTime(compact)
  const entry = timetableFor(route.from, route.to).find((e) => e.time === time)
  if (!entry) return null
  return { id, from: route.from, to: route.to, date, time, classes: entry.classes }
}

export function isDeparted(date: string, time: string, now = Date.now()): boolean {
  return instantOf(date, time) - SETTINGS.bookingCutoffMinutes * 60_000 <= now
}

// ---------- occupation simulee, deterministe ----------

function dayFill(routeId: string, date: string): number {
  const rng = seededRandom(`day|${routeId}|${date}`)
  const bucket = rng()
  let base: number
  if (bucket < 0.06) base = 0.02
  else if (bucket < 0.4) base = 0.15 + rng() * 0.3
  else if (bucket < 0.76) base = 0.45 + rng() * 0.3
  else if (bucket < 0.96) base = 0.75 + rng() * 0.17
  else base = 1.25
  const dow = dayOfWeek(date)
  if (dow === 5 || dow === 0) base += 0.1
  return base
}

function departureFill(id: string, routeId: string, date: string, time: string, classId: ClassId): number {
  const rng = seededRandom(`dep|${id}|${classId}`)
  const hour = Number(time.slice(0, 2))
  const rush = (hour >= 5 && hour <= 8) || hour === 17 ? 0.08 : 0
  const classFactor = classId === 'masterclass-plus' ? 0.06 : classId === 'masterclass-s' ? 0.03 : 0
  return dayFill(routeId, date) + rush + classFactor + (rng() - 0.5) * 0.3
}

const takenCache = new Map<string, Set<string>>()

export function seededTakenSeats(depId: string, classId: ClassId): Set<string> {
  const key = `${depId}|${classId}`
  const cached = takenCache.get(key)
  if (cached) return cached
  const parsed = parseDepartureId(depId)
  const result = new Set<string>()
  if (parsed) {
    const route = getRoute(parsed.from, parsed.to)!
    const ratio = Math.min(1, Math.max(0, departureFill(depId, route.id, parsed.date, parsed.time, classId)))
    const ids = getLayout(classId).seats.map((s) => s.id)
    const rng = seededRandom(`seats|${depId}|${classId}`)
    const shuffled = [...ids].sort(() => rng() - 0.5)
    const count = Math.min(ids.length, Math.round(ratio * ids.length))
    shuffled.slice(0, count).forEach((s) => result.add(s))
  }
  if (takenCache.size > 20000) takenCache.clear()
  takenCache.set(key, result)
  return result
}

export function takenSeatsOf(depId: string, classId: ClassId): Set<string> {
  const all = new Set(seededTakenSeats(depId, classId))
  bookedSeatsOf(depId, classId).forEach((s) => all.add(s))
  return all
}

export function seatsLeft(depId: string, classId: ClassId, now = Date.now()): number {
  const taken = takenSeatsOf(depId, classId)
  const held = heldSeatsOf(depId, classId, undefined, now)
  let blocked = taken.size
  held.forEach((s) => {
    if (!taken.has(s)) blocked += 1
  })
  return Math.max(0, capacityOf(classId) - blocked)
}

// ---------- departs ----------

export function getDepartureInfo(id: string, now = Date.now()): DepartureInfo | null {
  const p = parseDepartureId(id)
  if (!p) return null
  const route = getRoute(p.from, p.to)!
  const arr = arrivalOf(p.time, route.durationMin)
  return {
    id,
    routeId: route.id,
    from: p.from,
    to: p.to,
    date: p.date,
    departureTime: p.time,
    arrivalTime: arr.time,
    arrivalNextDay: arr.nextDay,
    durationMin: route.durationMin,
    boardingPoint: route.boardingPoint,
    arrivalPoint: route.arrivalPoint,
    departed: isDeparted(p.date, p.time, now),
    offers: p.classes.map((classId) => ({
      classId,
      price: fareFor(p.from, p.to, classId).one,
      capacity: capacityOf(classId),
      left: seatsLeft(id, classId, now),
    })),
  }
}

export function listDepartures(from: CityId, to: CityId, date: string, now = Date.now()): DepartureInfo[] {
  if (!isIsoDate(date) || !getRoute(from, to)) return []
  return timetableFor(from, to)
    .map((e) => getDepartureInfo(buildDepartureId(from, to, date, e.time), now))
    .filter((d): d is DepartureInfo => d !== null)
}

export function getCalendar(from: CityId, to: CityId, start?: string, days?: number, now = Date.now()): CalendarResponse {
  const cfg = getConfig()
  const today = todayDouala(now)
  const first = start && isIsoDate(start) && start >= today ? start : today
  const count = Math.min(Math.max(1, days ?? cfg.calendarDays), 120)
  const result: CalendarDay[] = []
  const table = timetableFor(from, to)
  for (let i = 0; i < count; i++) {
    const date = addDays(first, i)
    const route = getRoute(from, to)!
    const departures = table
      .filter((e) => !isDeparted(date, e.time, now))
      .map((e) => {
        const id = buildDepartureId(from, to, date, e.time)
        const left: Partial<Record<ClassId, number>> = {}
        e.classes.forEach((c) => {
          left[c] = seatsLeft(id, c, now)
        })
        return { id, time: e.time, arrival: arrivalOf(e.time, route.durationMin).time, left }
      })
    result.push({ date, departures })
  }
  const capacity = Object.fromEntries(CLASS_IDS.map((c) => [c, capacityOf(c)])) as Record<ClassId, number>
  return { from, to, today, capacity, days: result }
}

// ---------- plan des sieges ----------

export function getSeats(depId: string, classId: ClassId, ownHoldId?: string, now = Date.now()): SeatsResponse | null {
  const departure = getDepartureInfo(depId, now)
  if (!departure) return null
  const offer = departure.offers.find((o) => o.classId === classId)
  if (!offer) return null
  const taken = takenSeatsOf(depId, classId)
  const held = heldSeatsOf(depId, classId, ownHoldId, now)
  const seats: SeatInfo[] = getLayout(classId).seats.map((s) => ({
    id: s.id,
    status: taken.has(s.id) ? 'taken' : held.has(s.id) ? 'held' : 'free',
  }))
  return {
    departure,
    classId,
    price: offer.price,
    layout: getLayout(classId),
    seats,
    maxSeats: getConfig().maxSeats,
  }
}

export function classLabel(classId: ClassId): string {
  return CLASSES[classId].name
}

export function hashDay(date: string): number {
  return hashString(date)
}
