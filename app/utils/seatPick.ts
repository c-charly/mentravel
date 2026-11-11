// "Choisir pour moi": des sieges cote a cote dans la rangee la plus proche de l'avant,
// sinon les premiers sieges libres.
import type { SeatInfo, SeatLayout } from '#shared/types'

export function suggestSeats(layout: SeatLayout, seats: SeatInfo[], n: number): string[] {
  const free = new Set(seats.filter((s) => s.status === 'free').map((s) => s.id))
  const rows = new Map<number, { id: string; col: number }[]>()
  for (const s of layout.seats) {
    if (!free.has(s.id)) continue
    const list = rows.get(s.row) ?? []
    list.push({ id: s.id, col: s.col })
    rows.set(s.row, list)
  }
  const orderedRows = [...rows.keys()].sort((a, b) => a - b)
  for (const r of orderedRows) {
    const list = rows.get(r)!.sort((a, b) => a.col - b.col)
    for (let i = 0; i + n <= list.length; i++) {
      if (list[i + n - 1]!.col - list[i]!.col === n - 1) return list.slice(i, i + n).map((x) => x.id)
    }
  }
  return orderedRows.flatMap((r) => rows.get(r)!.sort((a, b) => a.col - b.col).map((x) => x.id)).slice(0, n)
}
