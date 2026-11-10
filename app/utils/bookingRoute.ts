// Lecture de l'URL de reservation: villes, aller-retour, dates, etape. Pure et idempotente,
// appelee par le middleware (avant le rendu du layout) puis a chaque changement d'URL.
import { CITY_IDS, CLASS_IDS } from '~~/content/network'
import { isIsoDate } from '#shared/time'
import type { CityId, ClassId } from '#shared/types'
import { BOOKING_STEPS, type BookingStep } from '~/stores/booking'

type Query = Record<string, unknown>
type Store = ReturnType<typeof useBookingStore>

export const asStr = (v: unknown) => (typeof v === 'string' ? v : undefined)
export const isCity = (v: unknown): v is CityId => CITY_IDS.includes(v as CityId)
export const isClass = (v: unknown): v is ClassId => CLASS_IDS.includes(v as ClassId)

export function applyQuerySync(store: Store, q: Query) {
  const de = asStr(q.de)
  const vers = asStr(q.vers)
  if (isCity(de) && isCity(vers) && de !== vers && (de !== store.from || vers !== store.to)) store.setCities(de, vers)
  if (q.ar !== undefined || asStr(q.etape)) store.setRoundTrip(asStr(q.ar) === '1')
  const keys: [0 | 1, string, string, string][] = [
    [0, 'd', 'h', 'c'],
    [1, 'rd', 'rh', 'rc'],
  ]
  for (const [i, dk, hk, ck] of keys) {
    if (i === 1 && !store.roundTrip) continue
    const d = asStr(q[dk])
    if (d && isIsoDate(d)) store.pickDate(i, d)
    const etape = asStr(q.etape)
    if (!asStr(q[hk]) && !asStr(q[ck]) && store.legs[i].departureId && etape && ['date', 'horaire'].includes(etape)) {
      store.resetLeg(i, true)
    }
  }
}

export function resolveStep(store: Store, q: Query) {
  const wanted = asStr(q.etape) as BookingStep | undefined
  store.activeLeg = asStr(q.leg) === '2' && store.roundTrip ? 1 : 0
  if (store.step === 'billet' && !wanted) {
    store.resetAll()
    return
  }
  const target: BookingStep = wanted && BOOKING_STEPS.includes(wanted) ? wanted : store.maxReachable()
  store.step = store.canGo(target) ? target : store.maxReachable()
}
