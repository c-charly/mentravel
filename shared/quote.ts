// Estimations indicatives: location de bus et colis. Grille unique et coherente.
import { CITIES, CITY_IDS, getPair } from '../content/network'
import type { CityId, ParcelKind, QuoteInput } from '../shared/types'

export const BUS_SIZES = [15, 30, 50, 70] as const

const RATE_PER_KM: Record<number, number> = { 15: 650, 30: 900, 50: 1200, 70: 1500 }
const DAY_RATE: Record<number, number> = { 15: 120000, 30: 180000, 50: 260000, 70: 340000 }
const DEFAULT_KM = 180

export function busSizeFor(passengers: number): { size: number; count: number } {
  if (passengers > 70) return { size: 70, count: Math.ceil(passengers / 70) }
  const size = BUS_SIZES.find((s) => passengers <= s) ?? 70
  return { size, count: 1 }
}

export function cityFromText(text: string): CityId | null {
  const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return CITY_IDS.find((id) => t.includes(id)) ?? null
}

export function distanceBetween(fromPlace: string, toPlace: string): number {
  const a = cityFromText(fromPlace)
  const b = cityFromText(toPlace)
  if (a && b && a !== b) return getPair(a, b)?.km ?? DEFAULT_KM
  return DEFAULT_KM
}

export function daysBetween(start: string, end?: string): number {
  if (!end) return 1
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(ms / 86400000) + 1)
}

export interface QuoteEstimate {
  busSize: number
  busCount: number
  minFcfa: number
  maxFcfa: number
}

export function estimateQuote(input: Pick<QuoteInput, 'tripKind' | 'passengers' | 'fromPlace' | 'toPlace' | 'startDate' | 'endDate'>): QuoteEstimate {
  const { size, count } = busSizeFor(Math.max(1, input.passengers))
  const km = distanceBetween(input.fromPlace, input.toPlace)
  let base: number
  if (input.tripKind === 'charter') {
    base = DAY_RATE[size]! * daysBetween(input.startDate, input.endDate)
  } else if (input.tripKind === 'round-trip') {
    base = km * 2 * RATE_PER_KM[size]! * 0.9
  } else {
    base = km * RATE_PER_KM[size]!
  }
  const total = Math.round((base * count) / 5000) * 5000
  return {
    busSize: size,
    busCount: count,
    minFcfa: Math.round((total * 0.9) / 5000) * 5000,
    maxFcfa: Math.round((total * 1.15) / 5000) * 5000,
  }
}

const PARCEL_BASE: Record<ParcelKind, number> = {
  document: 1500,
  small: 3000,
  medium: 6000,
  large: 12000,
}

export function estimateParcel(kind: ParcelKind, weightKg: number, from: CityId, to: CityId): number {
  const km = getPair(from, to)?.km ?? DEFAULT_KM
  const distanceFactor = km >= 240 ? 1.25 : km >= 180 ? 1.1 : 1
  const extraKg = kind === 'large' ? Math.max(0, weightKg - 20) * 250 : kind === 'medium' ? Math.max(0, weightKg - 5) * 150 : 0
  return Math.round((PARCEL_BASE[kind] * distanceFactor + extraKg) / 100) * 100
}

export function cityName(id: CityId): string {
  return CITIES[id].name
}
