// Index des sieges definitivement pris par des reservations payees ou embarquees.
import { getDb } from '../utils/store'
import type { ClassId } from '../../shared/types'

export function bookedSeatsOf(depId: string, classId: ClassId): Set<string> {
  const out = new Set<string>()
  for (const b of Object.values(getDb().bookings)) {
    if (b.departureId !== depId || b.classId !== classId) continue
    if (b.status === 'paid' || b.status === 'boarded') b.seatIds.forEach((s) => out.add(s))
  }
  return out
}
