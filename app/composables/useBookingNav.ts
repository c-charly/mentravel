// Navigation de la reservation: l'URL reflete l'etat (villes, dates, horaires, classes, etape).
// Jamais de donnees personnelles dans l'URL.
import { compactTime } from '#shared/time'
import type { BookingStep } from '~/stores/booking'

export function useBookingNav() {
  const store = useBookingStore()
  const router = useRouter()

  function queryFromStore(step: BookingStep, legIdx: 0 | 1): Record<string, string> {
    const q: Record<string, string> = { de: store.from, vers: store.to, etape: step }
    if (store.roundTrip) q.ar = '1'
    const l0 = store.legs[0]
    if (l0.date) q.d = l0.date
    if (l0.time && l0.classId) {
      q.h = compactTime(l0.time)
      q.c = l0.classId
    }
    if (store.roundTrip) {
      const l1 = store.legs[1]
      if (l1.date) q.rd = l1.date
      if (l1.time && l1.classId) {
        q.rh = compactTime(l1.time)
        q.rc = l1.classId
      }
      if (legIdx === 1) q.leg = '2'
    }
    return q
  }

  async function go(step: BookingStep, legIdx: 0 | 1 = store.activeLeg, replace = false) {
    store.activeLeg = legIdx
    store.step = step
    const query = queryFromStore(step, legIdx)
    if (replace) void router.replace({ query })
    else void router.push({ query })
    await nextTick()
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { go, queryFromStore }
}
