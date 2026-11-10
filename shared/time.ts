// Utilitaires de temps. Tout est calcule au fuseau Africa/Douala (UTC+1, sans heure d'ete).
import { SETTINGS } from '../content/network'

const MIN = 60_000
const DAY = 24 * 60 * MIN

export function toDoualaDate(ms: number): Date {
  return new Date(ms + SETTINGS.utcOffsetMinutes * MIN)
}

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function todayDouala(nowMs = Date.now()): string {
  return isoDate(toDoualaDate(nowMs))
}

export function minutesOfDayDouala(nowMs = Date.now()): number {
  const d = toDoualaDate(nowMs)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

export function parseIsoDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!))
}

export function addDays(date: string, n: number): string {
  return isoDate(new Date(parseIsoDate(date).getTime() + n * DAY))
}

export function dayOfWeek(date: string): number {
  // 0 = dimanche
  return parseIsoDate(date).getUTCDay()
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return isoDate(parseIsoDate(value)) === value
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h! * 60 + m!
}

export function minutesToTime(total: number): string {
  const t = ((total % 1440) + 1440) % 1440
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
}

export function arrivalOf(departureTime: string, durationMin: number): { time: string; nextDay: boolean } {
  const total = timeToMinutes(departureTime) + durationMin
  return { time: minutesToTime(total), nextDay: total >= 1440 }
}

// Instant absolu (ms UTC) d'un depart ou d'une arrivee
export function instantOf(date: string, time: string, extraMin = 0): number {
  const base = parseIsoDate(date).getTime()
  return base + (timeToMinutes(time) + extraMin) * MIN - SETTINGS.utcOffsetMinutes * MIN
}

export function compactTime(time: string): string {
  return time.replace(':', '')
}

export function expandTime(compact: string): string {
  return `${compact.slice(0, 2)}:${compact.slice(2, 4)}`
}
