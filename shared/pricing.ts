// Calcul des montants. Une reservation = un depart + une classe + n sieges.
import { fareFor } from '../content/network'
import type { CityId, ClassId } from '../shared/types'

export interface LegPricingInput {
  from: CityId
  to: CityId
  classId: ClassId
  seatCount: number
}

// Aller simple: tarif x sieges.
export function oneWayAmount(leg: LegPricingInput): number {
  return fareFor(leg.from, leg.to, leg.classId).one * leg.seatCount
}

// Aller-retour: le tarif aller-retour de la grille ne s'applique que si les deux trajets
// sont la meme ligne dans les deux sens, dans la meme classe, avec le meme nombre de sieges.
// Le montant est reparti a parts egales sur les deux billets.
export function legAmounts(legs: LegPricingInput[]): number[] {
  if (legs.length === 1) return [oneWayAmount(legs[0]!)]
  const [out, back] = legs as [LegPricingInput, LegPricingInput]
  const symmetric =
    out.from === back.to &&
    out.to === back.from &&
    out.classId === back.classId &&
    out.seatCount === back.seatCount
  if (!symmetric) return [oneWayAmount(out), oneWayAmount(back)]
  const total = fareFor(out.from, out.to, out.classId).round * out.seatCount
  const first = Math.ceil(total / 2 / 100) * 100
  return [first, total - first]
}

export function roundTripSaving(from: CityId, to: CityId, classId: ClassId): number {
  const f = fareFor(from, to, classId)
  return f.one * 2 - f.round
}
