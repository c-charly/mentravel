// Validation du titulaire et utilitaires telephone / piece d'identite.
import type { Holder, IdType, Operator } from '../shared/types'

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('237') && digits.length === 12) return digits.slice(3)
  return digits
}

export function isValidPhone(input: string): boolean {
  return /^6\d{8}$/.test(normalizePhone(input))
}

export function formatPhoneNational(input: string): string {
  const d = normalizePhone(input).slice(0, 9)
  const parts = [d.slice(0, 1), d.slice(1, 3), d.slice(3, 5), d.slice(5, 7), d.slice(7, 9)]
  return parts.filter(Boolean).join(' ')
}

export function formatPhoneIntl(input: string): string {
  return `+237 ${formatPhoneNational(input)}`
}

// Detection de l'operateur Mobile Money selon le prefixe (Cameroun)
export function detectOperator(input: string): Operator | null {
  const d = normalizePhone(input)
  if (d.length < 3) return null
  const p3 = Number(d.slice(0, 3))
  if ((p3 >= 650 && p3 <= 654) || (p3 >= 670 && p3 <= 679) || (p3 >= 680 && p3 <= 684)) return 'mtn'
  if ((p3 >= 655 && p3 <= 659) || (p3 >= 690 && p3 <= 699)) return 'orange'
  return null
}

export function normalizeId(input: string): string {
  return input.toUpperCase().replace(/[\s\-./]/g, '')
}

export function isValidIdNumber(input: string): boolean {
  const n = normalizeId(input)
  return /^[A-Z0-9]{5,20}$/.test(n)
}

const NAME_RE = /^[\p{L}][\p{L}' -]{1,59}$/u

export function isValidName(input: string): boolean {
  return NAME_RE.test(input.trim())
}

export type HolderErrorKey =
  | 'lastName'
  | 'firstName'
  | 'phone'
  | 'idNumber'
  | 'idType'

export function validateHolder(h: Partial<Holder>): Partial<Record<HolderErrorKey, true>> {
  const errors: Partial<Record<HolderErrorKey, true>> = {}
  if (!isValidName(h.lastName ?? '')) errors.lastName = true
  if (!isValidName(h.firstName ?? '')) errors.firstName = true
  if (!isValidPhone(h.phone ?? '')) errors.phone = true
  if (!isValidIdNumber(h.idNumber ?? '')) errors.idNumber = true
  const types: IdType[] = ['cni', 'passport', 'other']
  if (!types.includes(h.idType as IdType)) errors.idType = true
  return errors
}

export function formatPnrInput(raw: string): string {
  // Masque guide MT-XXXXXX-XXXX, collage accepte
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const body = clean.startsWith('MT') ? clean.slice(2) : clean
  const a = body.slice(0, 6)
  const b = body.slice(6, 10)
  if (!a) return clean.length ? 'MT-' : ''
  return b ? `MT-${a}-${b}` : `MT-${a}`
}

export const PNR_PATTERN = /^MT-[A-HJ-NP-Z2-9]{6}-[A-HJ-NP-Z2-9]{4}$/

export function isValidPnr(pnr: string): boolean {
  return PNR_PATTERN.test(pnr)
}
