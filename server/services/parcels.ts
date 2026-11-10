// Colis (courrier): creation et suivi par numero de suivi uniquement.
import { instantOf, isIsoDate, todayDouala } from '../../shared/time'
import { estimateParcel } from '../../shared/quote'
import type { ParcelInput, ParcelKind, ParcelStage, ParcelView } from '../../shared/types'
import { isValidName, isValidPhone } from '../../shared/validation'
import { getRoute } from '../../content/network'
import { getDb, persist, type StoredParcel } from '../utils/store'
import { randomChars } from '../utils/random'

const KINDS: ParcelKind[] = ['document', 'small', 'medium', 'large']

export function validateParcel(input: Partial<ParcelInput>, now = Date.now()): string[] {
  const bad: string[] = []
  if (!isValidName(input.senderName ?? '')) bad.push('senderName')
  if (!isValidPhone(input.senderPhone ?? '')) bad.push('senderPhone')
  if (!isValidName(input.receiverName ?? '')) bad.push('receiverName')
  if (!isValidPhone(input.receiverPhone ?? '')) bad.push('receiverPhone')
  if (!KINDS.includes(input.kind as ParcelKind)) bad.push('kind')
  const w = Number(input.weightKg)
  if (!Number.isFinite(w) || w <= 0 || w > 200) bad.push('weightKg')
  if (!input.from || !input.to || input.from === input.to || !getRoute(input.from, input.to)) bad.push('route')
  if (!input.sendDate || !isIsoDate(input.sendDate) || input.sendDate < todayDouala(now)) bad.push('sendDate')
  return bad
}

// Progression simulee d'apres la date d'envoi (aucune interface de controle dans ce perimetre)
export function parcelStage(p: StoredParcel, now = Date.now()): ParcelStage {
  const route = getRoute(p.from, p.to)
  const dropAt = instantOf(p.sendDate, '08:00')
  const boardAt = instantOf(p.sendDate, '12:00')
  const arriveAt = instantOf(p.sendDate, '12:00', route?.durationMin ?? 300)
  if (now >= arriveAt + 3 * 3600_000) return 'delivered'
  if (now >= arriveAt) return 'arrived'
  if (now >= boardAt) return 'onboard'
  if (now >= dropAt) return 'dropped'
  return 'registered'
}

function toView(p: StoredParcel, now = Date.now()): ParcelView {
  return {
    trackingId: p.trackingId,
    kind: p.kind,
    from: p.from,
    to: p.to,
    sendDate: p.sendDate,
    weightKg: p.weightKg,
    stage: parcelStage(p, now),
    estimateFcfa: p.estimateFcfa,
    receiverMasked: `${p.receiverName.trim().charAt(0).toUpperCase()}******`,
    createdAt: p.createdAt,
  }
}

export function createParcel(input: ParcelInput, now = Date.now()): ParcelView {
  const db = getDb()
  let trackingId = `CL-${randomChars(8)}`
  while (db.parcels[trackingId]) trackingId = `CL-${randomChars(8)}`
  const stored: StoredParcel = {
    ...input,
    weightKg: Number(input.weightKg),
    trackingId,
    estimateFcfa: estimateParcel(input.kind, Number(input.weightKg), input.from, input.to),
    createdAt: new Date(now).toISOString(),
  }
  db.parcels[trackingId] = stored
  persist()
  return toView(stored, now)
}

export function getParcel(trackingId: string, now = Date.now()): ParcelView | null {
  const p = getDb().parcels[trackingId.toUpperCase()]
  return p ? toView(p, now) : null
}
