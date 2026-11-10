// Demandes de devis pour la location d'autocar.
import { estimateQuote } from '../../shared/quote'
import { isIsoDate, todayDouala } from '../../shared/time'
import type { QuoteInput, TripKind } from '../../shared/types'
import { isValidName, isValidPhone } from '../../shared/validation'
import { randomChars } from '../utils/random'
import { getDb, persist, type StoredQuote } from '../utils/store'

const KINDS: TripKind[] = ['one-way', 'round-trip', 'charter']

export function validateQuote(input: Partial<QuoteInput>, now = Date.now()): string[] {
  const bad: string[] = []
  if (!isValidName(input.name ?? '')) bad.push('name')
  if (!isValidPhone(input.phone ?? '')) bad.push('phone')
  if (!KINDS.includes(input.tripKind as TripKind)) bad.push('tripKind')
  const n = Number(input.passengers)
  if (!Number.isInteger(n) || n < 1 || n > 500) bad.push('passengers')
  if (!(input.fromPlace ?? '').trim()) bad.push('fromPlace')
  if (!(input.toPlace ?? '').trim()) bad.push('toPlace')
  if (!input.startDate || !isIsoDate(input.startDate) || input.startDate < todayDouala(now)) bad.push('startDate')
  if (input.tripKind !== 'one-way' && input.endDate && (!isIsoDate(input.endDate) || input.endDate < (input.startDate ?? ''))) {
    bad.push('endDate')
  }
  return bad
}

export function createQuote(input: QuoteInput, now = Date.now()): StoredQuote {
  const db = getDb()
  const estimate = estimateQuote({ ...input, passengers: Number(input.passengers) })
  const quote: StoredQuote = {
    ...input,
    passengers: Number(input.passengers),
    reference: `DV-${randomChars(6)}`,
    createdAt: new Date(now).toISOString(),
    estimateMinFcfa: estimate.minFcfa,
    estimateMaxFcfa: estimate.maxFcfa,
  }
  db.quotes.push(quote)
  persist()
  return quote
}
