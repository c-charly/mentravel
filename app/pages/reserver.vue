<script setup lang="ts">
// Page de reservation guidee: 1 depart (jour + classe), 2 sieges, 3 voyageur, 4 paiement, puis le billet.
import { CLASSES, CLASS_IDS, getRoute } from '~~/content/network'
import { roundTripSaving } from '#shared/pricing'
import { expandTime, instantOf } from '#shared/time'
import type { ClassId, DepartureInfo, FullTicket, OfferInfo, SeatsResponse } from '#shared/types'
import { applyQuerySync, asStr, isClass, resolveStep } from '~/utils/bookingRoute'
import { suggestSeats } from '~/utils/seatPick'

definePageMeta({ layout: 'focus', middleware: 'booking' })

const { t } = useI18n()
useSeoMeta({
  title: () => t('booking.seoTitle'),
  description: () => t('booking.seoDescription'),
})

const store = useBookingStore()
const api = useMtApi()
const route = useRoute()
const { go } = useBookingNav()
const transition = useViewTransition()
const cache = useTicketCache()
const { fcfa, city, dateLong } = useL10n()

const legIdx = computed(() => store.activeLeg)
const leg = computed(() => store.leg)
const legRoute = computed(() => store.activeRoute)
const minDate = computed(() => (legIdx.value === 1 ? store.legs[0].date : null))
// Retour: on ne propose que des departs apres l'arrivee de l'aller
const notBefore = computed(() => {
  const l0 = store.legs[0]
  if (legIdx.value !== 1 || !l0.date || !l0.time) return null
  return instantOf(l0.date, l0.time, getRoute(store.from, store.to)?.durationMin ?? 0)
})

// ---------- synchronisation URL <-> etat ----------
// La lecture de l'URL (villes, dates, etape) est faite par le middleware "booking" avant le rendu.
type Query = Record<string, unknown>

function restoreHold(i: 0 | 1) {
  if (!import.meta.client) return
  try {
    const raw = sessionStorage.getItem('mt-holds-v1')
    const saved = raw ? (JSON.parse(raw) as Record<string, { departureId: string; classId: ClassId; holdId: string; seatIds: string[]; expiresAt: string; holdMinutes: number }>) : {}
    const s = saved[String(i)]
    const l = store.legs[i]
    if (s && s.departureId === l.departureId && s.classId === l.classId && new Date(s.expiresAt).getTime() > Date.now()) {
      l.hold = { holdId: s.holdId, departureId: s.departureId, classId: s.classId, seatIds: s.seatIds, expiresAt: s.expiresAt, holdMinutes: s.holdMinutes }
      l.seatIds = [...s.seatIds]
    }
  } catch {
    // Donnee illisible: on repart de zero
  }
}

async function hydrateOffers(q: Query) {
  const keys: [0 | 1, string, string, string, string][] = [
    [0, 'd', 'h', 'c', 'from'],
    [1, 'rd', 'rh', 'rc', 'to'],
  ]
  for (const [i, dk, hk, ck] of keys) {
    if (i === 1 && !store.roundTrip) continue
    const date = asStr(q[dk])
    const h = asStr(q[hk])
    const c = asStr(q[ck])
    if (!date || !h || !isClass(c) || !/^\d{4}$/.test(h)) continue
    const r = store.routeOf(i)
    const time = expandTime(h)
    const already = store.legs[i]
    if (already.date === date && already.time === time && already.classId === c && already.departureId) continue
    try {
      const { departures } = await api.departures(r.from, r.to, date)
      const dep = departures.find((d) => d.departureTime === time && !d.departed)
      const offer = dep?.offers.find((o) => o.classId === c && o.left > 0)
      if (dep && offer) {
        store.pickOffer(i, {
          departureId: dep.id,
          time: dep.departureTime,
          arrivalTime: dep.arrivalTime,
          arrivalNextDay: dep.arrivalNextDay,
          classId: offer.classId,
          unitPrice: offer.price,
        })
        restoreHold(i)
      }
    } catch {
      // Hors ligne: l'utilisateur reprendra a l'etape horaire
    }
  }
}

onMounted(async () => {
  await hydrateOffers(route.query)
  resolveStep(store, route.query)
  watch(
    () => route.fullPath,
    async () => {
      applyQuerySync(store, route.query)
      await hydrateOffers(route.query)
      resolveStep(store, route.query)
    },
  )
})

// Conserve les retenues le temps de la session (rechargement de page)
watch(
  () => store.legs.map((l) => l.hold),
  (holds) => {
    if (!import.meta.client) return
    const out: Record<string, unknown> = {}
    holds.forEach((h, i) => {
      if (h) out[String(i)] = { ...h, seatIds: store.legs[i]!.seatIds }
    })
    sessionStorage.setItem('mt-holds-v1', JSON.stringify(out))
  },
  { deep: true },
)

// ---------- etapes: date et horaire ----------
async function onPickDate(date: string) {
  store.pickDate(legIdx.value, date)
  // Meme ecran: on remplace l'entree d'historique et on ne remonte pas la page
  await go('horaire', legIdx.value, true, false)
}

async function onPickOffer(dep: DepartureInfo, offer: OfferInfo) {
  store.pickOffer(legIdx.value, {
    departureId: dep.id,
    time: dep.departureTime,
    arrivalTime: dep.arrivalTime,
    arrivalNextDay: dep.arrivalNextDay,
    classId: offer.classId,
    unitPrice: offer.price,
  })
  await go('sieges')
}

function onCitiesChanged() {
  void go('date', 0, true, false)
}

// ---------- etape: sieges ----------
const seatsData = ref<SeatsResponse | null>(null)
const seatsLoading = ref(false)
const seatsFailed = ref(false)
const limitHit = ref(false)

async function loadSeats(silent = false) {
  const l = leg.value
  if (!l.departureId || !l.classId) return
  if (!silent) seatsLoading.value = true
  seatsFailed.value = false
  try {
    seatsData.value = await api.seats(l.departureId, l.classId, l.hold?.holdId)
  } catch {
    seatsFailed.value = true
  } finally {
    seatsLoading.value = false
  }
}

watch(
  () => [store.step, leg.value.departureId, leg.value.classId, legIdx.value] as const,
  ([step]) => {
    if (step === 'sieges' && import.meta.client) {
      seatsData.value = null
      void loadSeats()
    }
  },
  { immediate: false },
)
onMounted(() => {
  if (store.step === 'sieges') void loadSeats()
  const { pause } = useIntervalFn(() => {
    if (store.step === 'sieges') void loadSeats(true)
  }, 15_000)
  onBeforeUnmount(pause)
})
watch(
  () => store.conflictSeats,
  (v) => {
    if (v.length) void loadSeats(true)
  },
)

function toggleSeat(id: string) {
  limitHit.value = false
  store.conflictSeats = []
  const cur = [...leg.value.seatIds]
  const i = cur.indexOf(id)
  if (i >= 0) cur.splice(i, 1)
  else cur.push(id)
  store.setSeats(legIdx.value, cur)
}

// "Choisir pour moi" et retrait d'un siege
const wanted = ref(1)
function autoPick() {
  if (!seatsData.value) return
  limitHit.value = false
  store.conflictSeats = []
  store.setSeats(legIdx.value, suggestSeats(seatsData.value.layout, seatsData.value.seats, wanted.value))
}
function removeSeat(id: string) {
  store.setSeats(legIdx.value, leg.value.seatIds.filter((s) => s !== id))
}
function stepWanted(delta: number) {
  wanted.value = Math.min(seatsData.value?.maxSeats ?? 5, Math.max(1, wanted.value + delta))
}

const seatsBusy = ref(false)
async function continueSeats() {
  if (!leg.value.seatIds.length || seatsBusy.value) return
  seatsBusy.value = true
  try {
    const ok = await store.confirmLeg(legIdx.value)
    if (!ok) {
      void loadSeats(true)
      return
    }
    if (store.roundTrip && legIdx.value === 0) await transition(() => go('date', 1))
    else await go('titulaire')
  } finally {
    seatsBusy.value = false
  }
}

async function editSeatsLeg(i: 0 | 1) {
  await go('sieges', i)
}

// ---------- etape: titulaire ----------
const holderBusy = ref(false)
const holderError = ref('')

async function submitHolder() {
  holderError.value = ''
  if (store.activeLegs.some((l) => !l.hold)) {
    store.markExpired()
    return
  }
  holderBusy.value = true
  try {
    const legsToSend = store.activeLegs.map((l) => ({ holdId: l.hold!.holdId }))
    const res = await api.createBookings({
      legs: legsToSend,
      holder: {
        lastName: store.holder.lastName,
        firstName: store.holder.firstName,
        phone: store.holder.phone,
        idType: store.holder.idType,
        idNumber: store.holder.idNumber,
      },
    })
    store.setResult(res)
    await go('paiement')
  } catch (e) {
    const code = (e as { code?: string }).code
    if (code === 'hold_expired') store.markExpired()
    else if (code === 'departed') holderError.value = t('holder.errDeparted')
    else if (code === 'network') holderError.value = t('common.offline')
    else holderError.value = t('holder.errGeneric')
  } finally {
    holderBusy.value = false
  }
}

// ---------- etape: paiement et billet ----------
const tickets = ref<FullTicket[]>([])
const activeTicket = ref(0)

async function onPaid() {
  const res = store.result
  if (!res) return
  const loaded: FullTicket[] = []
  for (const b of res.bookings) {
    try {
      const full = await api.ticket(b.pnr, b.accessToken)
      cache.save(full, b.accessToken)
      loaded.push(full)
    } catch {
      // Le billet reste recuperable depuis "Mon voyage"
    }
  }
  tickets.value = loaded
  activeTicket.value = 0
  if (import.meta.client) sessionStorage.removeItem('mt-holds-v1')
  await transition(() => go('billet'))
}

async function backFromPayment() {
  await go('titulaire')
}

async function newBooking() {
  store.resetAll()
  store.holder = { lastName: '', firstName: '', phone: '', idType: 'cni', idNumber: '' }
  tickets.value = []
  await go('date', 0)
}

// ---------- expiration ----------
const expiredDlg = ref<HTMLDialogElement | null>(null)
const resuming = ref(false)
watch(
  () => store.expired,
  (v) => {
    if (v && store.step !== 'billet') expiredDlg.value?.showModal()
    else expiredDlg.value?.close()
  },
)

async function resumeSeats() {
  resuming.value = true
  const ok = await store.resume()
  resuming.value = false
  expiredDlg.value?.close()
  if (ok) {
    store.legs.forEach((l, i) => {
      if (i < store.legCount) l.confirmed = true
    })
    await go(store.step === 'paiement' || store.step === 'titulaire' ? 'titulaire' : store.step)
  } else {
    await go('sieges', 0)
    void loadSeats()
  }
}

async function chooseAgain() {
  expiredDlg.value?.close()
  store.expired = false
  await go('sieges', 0)
  void loadSeats()
}

// ---------- divers ----------
const saving = computed(() => Math.max(...CLASS_IDS.map((c) => roundTripSaving(store.from, store.to, c))))
const ticketSheet = ref<HTMLDialogElement | null>(null)
const heading = ref<HTMLElement | null>(null)
watch(
  () => [store.step, store.activeLeg],
  async () => {
    await nextTick()
    heading.value?.focus({ preventScroll: true })
  },
)

const showAside = computed(() => store.step !== 'billet')

// Entree douce a chaque changement d'ecran (date et horaire forment un seul ecran; le billet a sa propre entree)
const stepRoot = ref<HTMLElement | null>(null)
const screen = computed(() => (store.step === 'date' || store.step === 'horaire' ? 'depart' : store.step))
useStepEnter(stepRoot, () => screen.value, (now) => now === 'billet')
const stepTitle = computed(() => {
  const s = store.step
  if (s === 'date') return legIdx.value === 1 ? t('booking.titleReturn') : t('booking.titleDate')
  if (s === 'horaire') return t('booking.titleSchedule')
  if (s === 'sieges') return t('booking.titleSeats')
  if (s === 'titulaire') return t('booking.titleHolder')
  if (s === 'paiement') return t('booking.titlePay')
  return t('booking.titleDone')
})
</script>

<template>
  <div class="mx-auto px-5 pb-32 pt-7" :class="showAside ? 'max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12' : 'max-w-3xl'">
    <div ref="stepRoot" class="min-w-0">
      <h2 ref="heading" tabindex="-1" class="sr-only">{{ stepTitle }}</h2>

      <!-- Etape 1: depart (jour + classe) -->
      <div v-if="store.step === 'date' || store.step === 'horaire'" class="grid grid-cols-[minmax(0,1fr)] gap-6">
        <header>
          <span v-if="store.roundTrip" class="chip mb-3"><Icon :name="legIdx === 0 ? 'lucide:arrow-right' : 'lucide:arrow-left'" class="size-3.5" />{{ legIdx === 0 ? $t('booking.outbound') : $t('booking.inbound') }}</span>
          <h1 class="display text-3xl sm:text-4xl">{{ legIdx === 0 ? $t('booking.whereWhen') : $t('booking.returnWhen') }}</h1>
          <p class="mt-2 text-muted">{{ $t('booking.guideDepart') }}</p>
        </header>

        <PhraseTrajet v-if="legIdx === 0" show-trip @change="onCitiesChanged" />
        <div v-else class="surface flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4 font-semibold">
          {{ city(legRoute.from) }}<Icon name="lucide:arrow-right" class="size-4 text-muted" />{{ city(legRoute.to) }}
          <span class="text-sm font-normal text-muted">{{ $t('booking.returnAfter', { date: store.legs[0].date ? dateLong(store.legs[0].date) : '' }) }}</span>
        </div>
        <p v-if="store.roundTrip && legIdx === 0 && saving > 0" class="-mt-3 flex items-center gap-1.5 text-sm font-semibold text-success">
          <Icon name="lucide:circle-check" class="size-4" />{{ $t('booking.saveUpTo', { amount: fcfa(saving) }) }}
        </p>

        <div class="z-20 -mx-5 bg-base-100 px-5 py-3 md:sticky md:top-[4.05rem] md:border-b md:border-line">
          <DateStrip :from="legRoute.from" :to="legRoute.to" :leg="legIdx" :min-date="minDate" :selected="leg.date" @select="onPickDate" />
        </div>

        <DepartureList
          v-if="leg.date"
          :from="legRoute.from"
          :to="legRoute.to"
          :date="leg.date"
          :selected-id="leg.departureId"
          :selected-class="leg.classId"
          :not-before="notBefore"
          @pick="onPickOffer"
        />
      </div>

      <!-- Etape 2: sieges -->
      <div v-else-if="store.step === 'sieges'" class="grid grid-cols-[minmax(0,1fr)] gap-6">
        <header>
          <button type="button" class="btn btn-ghost btn-sm -ml-3 mb-2" @click="go('horaire')">
            <Icon name="lucide:arrow-left" class="size-4" />{{ $t('booking.backToDepart') }}
          </button>
          <h1 class="display text-3xl sm:text-4xl">{{ $t('booking.titleSeats') }}</h1>
          <p v-if="leg.classId && leg.date" class="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span class="chip capitalize">{{ dateLong(leg.date) }}</span>
            <span class="chip tnum">{{ leg.time }} - {{ leg.arrivalTime }}</span>
            <span class="chip"><ClassMark :id="leg.classId" swatch />{{ CLASSES[leg.classId].name }}</span>
          </p>
        </header>

        <div v-if="store.conflictSeats.length" class="flex items-start gap-3 rounded-2xl bg-error/10 p-4" role="alert">
          <Icon name="lucide:circle-alert" class="mt-0.5 size-5 shrink-0 text-error" />
          <p class="font-medium">{{ $t('booking.seatsTaken', { seats: store.conflictSeats.join(', ') }) }}</p>
        </div>
        <div v-if="limitHit" class="flex items-start gap-3 rounded-2xl bg-base-200 p-4" role="status">
          <Icon name="lucide:info" class="mt-0.5 size-5 shrink-0" />
          <p class="font-medium">{{ $t('booking.seatsLimit', { n: seatsData?.maxSeats ?? 5 }) }}</p>
        </div>

        <div v-if="seatsFailed" class="rounded-2xl bg-error/10 p-5" role="alert">
          <p class="font-semibold">{{ $t('booking.seatsError') }}</p>
          <button type="button" class="btn btn-primary btn-sm mt-3" @click="loadSeats()">{{ $t('common.retry') }}</button>
        </div>
        <template v-else>
          <!-- Aide: nombre de voyageurs et choix automatique -->
          <div class="surface flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
            <div class="flex items-center gap-3">
              <span class="text-sm font-semibold">{{ $t('booking.travellers') }}</span>
              <div class="flex items-center rounded-full border border-line">
                <button type="button" class="grid size-9 place-items-center rounded-full hover:bg-base-200 disabled:opacity-40" :disabled="wanted <= 1" :aria-label="$t('booking.less')" @click="stepWanted(-1)"><Icon name="lucide:minus" class="size-4" /></button>
                <span class="tnum w-6 text-center font-semibold" aria-live="polite">{{ wanted }}</span>
                <button type="button" class="grid size-9 place-items-center rounded-full hover:bg-base-200 disabled:opacity-40" :disabled="wanted >= (seatsData?.maxSeats ?? 5)" :aria-label="$t('booking.more')" @click="stepWanted(1)"><Icon name="lucide:plus" class="size-4" /></button>
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-sm" :disabled="!seatsData" @click="autoPick"><Icon name="lucide:wand-sparkles" class="size-4" />{{ $t('booking.autoPick') }}</button>
            <p class="text-sm text-muted">{{ $t('booking.orTap') }}</p>
          </div>

          <div v-if="seatsLoading || !seatsData" class="mx-auto h-96 w-64 animate-pulse rounded-t-[3.5rem] rounded-b-[1.75rem] bg-base-200" aria-busy="true" />
          <PlanBus
            v-else
            :layout="seatsData.layout"
            :seats="seatsData.seats"
            :class-id="seatsData.classId"
            :selected="leg.seatIds"
            :max="seatsData.maxSeats"
            @toggle="toggleSeat"
            @limit="limitHit = true"
          />
        </template>

        <!-- Barre d'action collee en bas -->
        <div class="surface sticky bottom-4 z-30 p-3">
          <div class="sm:flex space-y-3 items-center gap-3">
            <div class="min-w-0 flex-1">
              <ul v-if="leg.seatIds.length" class="flex flex-wrap items-center gap-1.5" :aria-label="$t('ticket.seats')">
                <li v-for="id in leg.seatIds" :key="id">
                  <button type="button" class="mono inline-flex items-center gap-1 rounded-full bg-base-200 py-1 pl-3 pr-2 text-sm font-semibold hover:bg-base-300" :aria-label="$t('booking.removeSeat', { seat: id })" @click="removeSeat(id)">
                    {{ id }}<Icon name="lucide:x" class="size-3.5" />
                  </button>
                </li>
              </ul>
              <p v-else class="flex items-center gap-2 text-sm font-medium text-muted"><Icon name="lucide:pointer" class="size-4" />{{ $t('booking.tapSeat') }}</p>
              <p class="tnum mt-1 text-sm" :class="leg.seatIds.length ? 'font-semibold' : 'text-muted'">
                {{ leg.seatIds.length ? fcfa(leg.unitPrice * leg.seatIds.length) : fcfa(leg.unitPrice) + ' ' + $t('booking.perSeat') }}
              </p>
            </div>
            <button type="button" class="btn btn-ghost btn-circle btn-sm lg:hidden" @click="ticketSheet?.showModal()">
              <Icon name="lucide:ticket" class="size-5" /><span class="sr-only">{{ $t('booking.yourTicket') }}</span>
            </button>
            <button type="button" class="btn btn-primary" :disabled="!leg.seatIds.length || seatsBusy" @click="continueSeats">
              <Icon v-if="seatsBusy || store.holdBusy" name="lucide:loader" class="size-5 animate-spin" />
              {{ store.roundTrip && legIdx === 0 ? $t('booking.chooseReturn') : $t('booking.continue') }}
              <Icon v-if="!seatsBusy && !store.holdBusy" name="lucide:arrow-right" class="size-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Etape 3: voyageur -->
      <div v-else-if="store.step === 'titulaire'" class="grid grid-cols-[minmax(0,1fr)] gap-6">
        <div class="flex flex-wrap items-center gap-2">
          <button v-if="!store.roundTrip" type="button" class="btn btn-ghost btn-sm -ml-3" @click="editSeatsLeg(0)">
            <Icon name="lucide:arrow-left" class="size-4" />{{ $t('booking.backToSeats') }}
          </button>
          <button v-for="i in (store.roundTrip ? 2 : 0)" :key="i" type="button" class="btn btn-outline btn-sm" @click="editSeatsLeg((i - 1) as 0 | 1)">
            <Icon name="lucide:armchair" class="size-4" />
            {{ i === 1 ? $t('booking.outbound') : $t('booking.inbound') }}: <span class="mono">{{ store.legs[i - 1]!.seatIds.join(' ') }}</span>
          </button>
        </div>
        <button
          type="button"
          class="surface flex w-full items-center justify-between px-4 py-3 text-left lg:hidden"
          @click="ticketSheet?.showModal()"
        >
          <span class="flex items-center gap-2 font-semibold"><Icon name="lucide:ticket" class="size-4" />{{ $t('booking.yourTicket') }}</span>
          <span class="tnum font-semibold">{{ store.totalFcfa ? fcfa(store.totalFcfa) : '' }}</span>
        </button>
        <FormTitulaire :busy="holderBusy" :error="holderError" @submit="submitHolder" />
      </div>

      <!-- Etape 4: paiement -->
      <div v-else-if="store.step === 'paiement'" class="grid grid-cols-[minmax(0,1fr)] gap-6">
        <button
          type="button"
          class="surface flex w-full items-center justify-between px-4 py-3 text-left lg:hidden"
          @click="ticketSheet?.showModal()"
        >
          <span class="flex items-center gap-2 font-semibold"><Icon name="lucide:ticket" class="size-4" />{{ $t('booking.yourTicket') }}</span>
          <span class="tnum font-semibold">{{ store.totalFcfa ? fcfa(store.totalFcfa) : '' }}</span>
        </button>
        <PaiementMobileMoney @paid="onPaid" @back="backFromPayment" />
      </div>

      <!-- Billet -->
      <div v-else class="grid grid-cols-[minmax(0,1fr)] gap-5">
        <div class="flex items-center gap-3">
          <span class="grid size-11 shrink-0 place-items-center rounded-full bg-success text-success-content"><Icon name="lucide:check" class="size-6" /></span>
          <div>
            <h1 class="display text-2xl sm:text-3xl">{{ $t('done.title') }}</h1>
            <p class="text-sm text-muted">{{ $t('done.textShort') }}</p>
          </div>
        </div>

        <div v-if="tickets.length > 1" class="flex gap-2" role="tablist">
          <button
            v-for="(tk, i) in tickets"
            :key="tk.pnr"
            type="button"
            role="tab"
            :aria-selected="activeTicket === i"
            class="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            :class="activeTicket === i ? 'bg-base-content text-base-100' : 'bg-base-200'"
            @click="activeTicket = i"
          >
            {{ i === 0 ? $t('booking.outbound') : $t('booking.inbound') }}
          </button>
        </div>
        <div v-if="tickets[activeTicket]" :style="{ animation: 'rise-in 0.7s var(--ease-route) both' }">
          <TicketPanel :ticket="tickets[activeTicket]!" :token="store.result?.bookings[activeTicket]?.accessToken" actions stamp-animate />
        </div>
        <div v-else class="surface p-6">
          <p class="font-semibold">{{ $t('done.fetchFailed') }}</p>
          <NuxtLinkLocale to="/mon-voyage" class="btn btn-primary btn-sm mt-3">{{ $t('nav.myTrip') }}</NuxtLinkLocale>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-outline btn-sm" @click="newBooking"><Icon name="lucide:plus" class="size-4" />{{ $t('done.again') }}</button>
          <NuxtLinkLocale to="/" class="btn btn-ghost btn-sm">{{ $t('done.home') }}</NuxtLinkLocale>
        </div>
      </div>
    </div>

    <!-- Recapitulatif (bureau) -->
    <aside v-if="showAside" class="hidden lg:block" :aria-label="$t('booking.yourTicket')">
      <div class="sticky top-24">
        <BilletEnCours />
        <p class="mt-4 flex items-start gap-2 text-sm text-muted">
          <Icon name="lucide:shield-check" class="mt-0.5 size-4 shrink-0" />{{ $t('booking.reassure') }}
        </p>
      </div>
    </aside>

    <!-- Recapitulatif (mobile) -->
    <dialog ref="ticketSheet" class="modal modal-bottom">
      <div class="modal-box bg-base-200">
        <BilletEnCours />
        <div class="modal-action"><form method="dialog"><button class="btn btn-primary">{{ $t('nav.close') }}</button></form></div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>{{ $t('nav.close') }}</button></form>
    </dialog>

    <!-- Selection expiree -->
    <dialog ref="expiredDlg" class="modal modal-bottom sm:modal-middle" @cancel.prevent>
      <div class="modal-box">
        <Icon name="lucide:hourglass" class="size-8 text-dla-ink" />
        <h2 class="display mt-3 text-2xl">{{ $t('booking.expiredTitle') }}</h2>
        <p class="mt-3 text-muted">{{ $t('booking.expiredText') }}</p>
        <div class="modal-action flex-wrap">
          <button type="button" class="btn btn-primary" :disabled="resuming" @click="resumeSeats">
            <Icon v-if="resuming" name="lucide:loader" class="size-5 animate-spin" />{{ $t('booking.resume') }}
          </button>
          <button type="button" class="btn btn-ghost" @click="chooseAgain">{{ $t('booking.chooseAgain') }}</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
