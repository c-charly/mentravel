// Etat de la reservation. Une reservation = un depart + une classe + n sieges + un seul titulaire.
// Aller-retour: deux trajets enchaines, un seul paiement.
import { defineStore } from 'pinia'
import { legAmounts } from '#shared/pricing'
import type {
  CityId,
  ClassId,
  CreateBookingResponse,
  Holder,
  HoldResponse,
  PaymentResponse,
} from '#shared/types'
import { ApiError } from '~/composables/useMtApi'

export type BookingStep = 'date' | 'horaire' | 'sieges' | 'titulaire' | 'paiement' | 'billet'

export const STEP_ORDER: BookingStep[] = ['date', 'horaire', 'sieges', 'titulaire', 'paiement', 'billet']
export const BOOKING_STEPS = STEP_ORDER

export interface LegState {
  date: string | null
  departureId: string | null
  time: string | null
  arrivalTime: string | null
  arrivalNextDay: boolean
  classId: ClassId | null
  unitPrice: number
  seatIds: string[]
  confirmed: boolean
  hold: HoldResponse | null
}

function emptyLeg(): LegState {
  return {
    date: null,
    departureId: null,
    time: null,
    arrivalTime: null,
    arrivalNextDay: false,
    classId: null,
    unitPrice: 0,
    seatIds: [],
    confirmed: false,
    hold: null,
  }
}

export interface HolderForm {
  lastName: string
  firstName: string
  phone: string
  idType: Holder['idType']
  idNumber: string
}

export const useBookingStore = defineStore('booking', () => {
  const api = useMtApi()

  const from = ref<CityId>('yaounde')
  const to = ref<CityId>('douala')
  const roundTrip = ref(false)
  const legs = ref<[LegState, LegState]>([emptyLeg(), emptyLeg()])
  const activeLeg = ref<0 | 1>(0)
  const step = ref<BookingStep>('date')
  const classFilter = ref<'all' | ClassId>('all')
  const holder = ref<HolderForm>({ lastName: '', firstName: '', phone: '', idType: 'cni', idNumber: '' })
  const result = ref<CreateBookingResponse | null>(null)
  const payment = ref<PaymentResponse | null>(null)
  const paying = ref(false)
  const expired = ref(false)
  const conflictSeats = ref<string[]>([])
  const holdBusy = ref(false)
  const timers: Partial<Record<0 | 1, ReturnType<typeof setTimeout>>> = {}
  const versions: [number, number] = [0, 0]

  const legCount = computed(() => (roundTrip.value ? 2 : 1))
  const leg = computed(() => legs.value[activeLeg.value])
  const routeOf = (i: 0 | 1) => (i === 0 ? { from: from.value, to: to.value } : { from: to.value, to: from.value })
  const activeRoute = computed(() => routeOf(activeLeg.value))

  const activeLegs = computed(() => legs.value.slice(0, legCount.value))
  const amounts = computed(() => {
    const ready = activeLegs.value.every((l) => l.classId && l.seatIds.length)
    if (!ready) return [] as number[]
    return legAmounts(
      activeLegs.value.map((l, i) => ({
        ...routeOf(i as 0 | 1),
        classId: l.classId!,
        seatCount: l.seatIds.length,
      })),
    )
  })
  const totalFcfa = computed(() => amounts.value.reduce((s, n) => s + n, 0))
  const seatCount = computed(() => legs.value[0].seatIds.length)

  const holdExpiresAt = computed(() => {
    const times = activeLegs.value
      .map((l) => (l.hold ? new Date(l.hold.expiresAt).getTime() : 0))
      .filter((t) => t > 0)
    return times.length ? Math.min(...times) : 0
  })
  const hasActiveHold = computed(() => holdExpiresAt.value > Date.now())

  const allConfirmed = computed(() => activeLegs.value.every((l) => l.confirmed && l.seatIds.length > 0))

  // ---- navigation entre etapes ----
  function maxReachable(): BookingStep {
    if (result.value && payment.value?.status === 'success') return 'billet'
    if (result.value) return 'paiement'
    if (allConfirmed.value) return 'titulaire'
    const i = activeLeg.value
    const l = legs.value[i]
    if (l.classId && l.departureId) return 'sieges'
    if (l.date) return 'horaire'
    return 'date'
  }

  function canGo(target: BookingStep): boolean {
    return STEP_ORDER.indexOf(target) <= STEP_ORDER.indexOf(maxReachable())
  }

  // ---- releves de retenue ----
  function clearTimer(i: 0 | 1) {
    if (timers[i]) clearTimeout(timers[i])
    timers[i] = undefined
  }

  async function releaseLeg(i: 0 | 1) {
    clearTimer(i)
    versions[i] += 1
    const h = legs.value[i].hold
    legs.value[i].hold = null
    if (h) await api.release(h.holdId).catch(() => undefined)
  }

  async function releaseAll() {
    await Promise.all([releaseLeg(0), releaseLeg(1)])
  }

  function resetLeg(i: 0 | 1, keepDate = false) {
    const date = legs.value[i].date
    void releaseLeg(i)
    legs.value[i] = emptyLeg()
    if (keepDate) legs.value[i].date = date
  }

  function resetAll() {
    void releaseAll()
    legs.value = [emptyLeg(), emptyLeg()]
    activeLeg.value = 0
    step.value = 'date'
    result.value = null
    payment.value = null
    paying.value = false
    expired.value = false
    conflictSeats.value = []
  }

  // ---- choix du trajet ----
  function setCities(a: CityId, b: CityId) {
    if (a === from.value && b === to.value) return
    from.value = a
    to.value = b
    resetAll()
  }

  function swapCities() {
    setCities(to.value, from.value)
  }

  function setRoundTrip(value: boolean) {
    if (roundTrip.value === value) return
    roundTrip.value = value
    if (!value) {
      resetLeg(1)
      if (activeLeg.value === 1) activeLeg.value = 0
    }
  }

  function pickDate(i: 0 | 1, date: string) {
    if (legs.value[i].date === date) return
    resetLeg(i)
    legs.value[i].date = date
    if (i === 0 && legs.value[1].date && legs.value[1].date < date) resetLeg(1)
  }

  function pickOffer(
    i: 0 | 1,
    offer: {
      departureId: string
      time: string
      arrivalTime: string
      arrivalNextDay: boolean
      classId: ClassId
      unitPrice: number
    },
  ) {
    const l = legs.value[i]
    if (l.departureId !== offer.departureId || l.classId !== offer.classId) {
      void releaseLeg(i)
      l.seatIds = []
      l.confirmed = false
    }
    Object.assign(l, offer)
  }

  // ---- sieges et retenue ----
  function setSeats(i: 0 | 1, ids: string[]) {
    const l = legs.value[i]
    l.seatIds = ids
    l.confirmed = false
    clearTimer(i)
    timers[i] = setTimeout(() => void syncHold(i), 300)
  }

  async function syncHold(i: 0 | 1) {
    const l = legs.value[i]
    const version = ++versions[i]
    if (!l.departureId || !l.classId) return
    if (l.seatIds.length === 0) {
      await releaseLeg(i)
      return
    }
    holdBusy.value = true
    try {
      const hold = await api.hold({
        departureId: l.departureId,
        classId: l.classId,
        seatIds: l.seatIds,
        replaceHoldId: l.hold?.holdId,
      })
      if (version !== versions[i]) {
        void api.release(hold.holdId).catch(() => undefined)
        return
      }
      l.hold = hold
      expired.value = false
    } catch (e) {
      if (version !== versions[i]) return
      l.hold = null
      if (e instanceof ApiError && e.code === 'unavailable') {
        const bad = (e.data as { seatIds?: string[] } | undefined)?.seatIds ?? []
        conflictSeats.value = bad
        l.seatIds = l.seatIds.filter((s) => !bad.includes(s))
        if (l.seatIds.length) await syncHold(i)
      } else {
        throw e
      }
    } finally {
      holdBusy.value = false
    }
  }

  async function confirmLeg(i: 0 | 1): Promise<boolean> {
    const l = legs.value[i]
    clearTimer(i)
    if (!l.hold || [...l.hold.seatIds].sort().join() !== [...l.seatIds].sort().join()) await syncHold(i)
    if (!legs.value[i].hold || !legs.value[i].seatIds.length) return false
    l.confirmed = true
    return true
  }

  // Apres expiration: tenter de reprendre exactement la meme selection
  async function resume(): Promise<boolean> {
    expired.value = false
    for (const i of [0, 1] as const) {
      if (i >= legCount.value) continue
      const l = legs.value[i]
      if (!l.seatIds.length) continue
      l.hold = null
      await syncHold(i)
      if (!l.hold) return false
    }
    return true
  }

  function markExpired() {
    expired.value = true
    legs.value.forEach((l) => {
      l.hold = null
      l.confirmed = false
    })
    if (STEP_ORDER.indexOf(step.value) <= STEP_ORDER.indexOf('paiement')) {
      // Les billets non payes ne sont plus valides
      result.value = null
    }
  }

  function setResult(r: CreateBookingResponse) {
    result.value = r
  }

  function setPayment(p: PaymentResponse | null) {
    payment.value = p
  }

  return {
    from,
    to,
    roundTrip,
    legs,
    activeLeg,
    step,
    classFilter,
    holder,
    result,
    payment,
    paying,
    expired,
    conflictSeats,
    holdBusy,
    legCount,
    leg,
    activeRoute,
    activeLegs,
    amounts,
    totalFcfa,
    seatCount,
    holdExpiresAt,
    hasActiveHold,
    allConfirmed,
    routeOf,
    maxReachable,
    canGo,
    setCities,
    swapCities,
    setRoundTrip,
    pickDate,
    pickOffer,
    setSeats,
    syncHold,
    confirmLeg,
    releaseLeg,
    releaseAll,
    resetLeg,
    resetAll,
    resume,
    markExpired,
    setResult,
    setPayment,
  }
})
