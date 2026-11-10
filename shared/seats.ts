// Plans de sieges par classe (vue de dessus, l'avant du bus en haut).
import { CLASSES } from '../content/network'
import type { ClassId, LayoutSeat, SeatLayout } from '../shared/types'

const COLUMNS: Record<ClassId, string[]> = {
  business: ['A', 'B', 'C', 'D'],
  'masterclass-s': ['A', 'B', 'C'],
  'masterclass-plus': ['A', 'B', 'C'],
}

const layoutCache = new Map<ClassId, SeatLayout>()

export function getLayout(classId: ClassId): SeatLayout {
  const cached = layoutCache.get(classId)
  if (cached) return cached
  const def = CLASSES[classId]
  const columns = COLUMNS[classId]
  const seats: LayoutSeat[] = []
  for (let row = 1; row <= def.rows; row++) {
    columns.forEach((letter, col) => {
      seats.push({ id: `${row}${letter}`, row, col })
    })
  }
  // Business: la derniere rangee perd un siege (acces toilettes), soit 35 places
  const final = classId === 'business' ? seats.filter((s) => s.id !== `${def.rows}D`) : seats
  const layout: SeatLayout = {
    classId,
    rows: def.rows,
    columns,
    aisleAfter: 1,
    seats: final,
  }
  layoutCache.set(classId, layout)
  return layout
}

export function capacityOf(classId: ClassId): number {
  return getLayout(classId).seats.length
}

export function isValidSeat(classId: ClassId, seatId: string): boolean {
  return getLayout(classId).seats.some((s) => s.id === seatId)
}
