// Retenue temporaire des sieges (10 minutes par defaut). Vit cote serveur pour rester
// coherente entre onglets et utilisateurs.
import { isValidSeat } from '../../shared/seats'
import type { ClassId, HoldResponse } from '../../shared/types'
import { getConfig } from '../utils/config'
import { generateId } from '../utils/random'

export interface Hold {
  id: string
  departureId: string
  classId: ClassId
  seatIds: string[]
  expiresAt: number
  ownerKey: string
}

const holds = new Map<string, Hold>()

export function purgeHolds(now = Date.now()): void {
  for (const [id, h] of holds) {
    if (h.expiresAt <= now) holds.delete(id)
  }
}

export function getHold(id: string, now = Date.now()): Hold | null {
  const h = holds.get(id)
  if (!h) return null
  if (h.expiresAt <= now) {
    holds.delete(id)
    return null
  }
  return h
}

export function heldSeatsOf(depId: string, classId: ClassId, exceptHoldId?: string, now = Date.now()): Set<string> {
  purgeHolds(now)
  const out = new Set<string>()
  for (const h of holds.values()) {
    if (h.departureId !== depId || h.classId !== classId || h.id === exceptHoldId) continue
    h.seatIds.forEach((s) => out.add(s))
  }
  return out
}

export function activeHoldsOfOwner(ownerKey: string, now = Date.now()): number {
  purgeHolds(now)
  let n = 0
  for (const h of holds.values()) if (h.ownerKey === ownerKey) n += 1
  return n
}

export type HoldError =
  | { code: 'invalid_seats' }
  | { code: 'too_many'; max: number }
  | { code: 'unavailable'; seatIds: string[] }

export interface CreateHoldInput {
  departureId: string
  classId: ClassId
  seatIds: string[]
  ownerKey: string
  replaceHoldId?: string
}

// takenOf et leftCheck sont injectes pour eviter une dependance circulaire avec le catalogue
export function createHold(
  input: CreateHoldInput,
  takenOf: (depId: string, classId: ClassId) => Set<string>,
  now = Date.now(),
): { ok: true; hold: HoldResponse } | { ok: false; error: HoldError } {
  const cfg = getConfig()
  const unique = [...new Set(input.seatIds)]
  if (unique.length === 0 || unique.some((s) => !isValidSeat(input.classId, s))) {
    return { ok: false, error: { code: 'invalid_seats' } }
  }
  if (unique.length > cfg.maxSeats) return { ok: false, error: { code: 'too_many', max: cfg.maxSeats } }
  if (input.replaceHoldId) {
    const old = holds.get(input.replaceHoldId)
    if (old) holds.delete(old.id)
  }
  const taken = takenOf(input.departureId, input.classId)
  const held = heldSeatsOf(input.departureId, input.classId, undefined, now)
  const conflicts = unique.filter((s) => taken.has(s) || held.has(s))
  if (conflicts.length) return { ok: false, error: { code: 'unavailable', seatIds: conflicts } }
  const id = generateId('hold')
  const expiresAt = now + cfg.holdMinutes * 60_000
  holds.set(id, {
    id,
    departureId: input.departureId,
    classId: input.classId,
    seatIds: unique,
    expiresAt,
    ownerKey: input.ownerKey,
  })
  return {
    ok: true,
    hold: {
      holdId: id,
      departureId: input.departureId,
      classId: input.classId,
      seatIds: unique,
      expiresAt: new Date(expiresAt).toISOString(),
      holdMinutes: cfg.holdMinutes,
    },
  }
}

// L'identifiant de retenue est un secret non devinable: il sert de capacite (pas de lien avec l'IP,
// qui change quand le telephone passe de la 4G au Wi-Fi). ownerKey ne sert qu'a limiter les abus.
export function releaseHold(id: string): boolean {
  return holds.delete(id)
}

export function consumeHold(id: string): void {
  holds.delete(id)
}

export function resetHoldsForTests(): void {
  holds.clear()
}
