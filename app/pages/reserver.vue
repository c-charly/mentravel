<script setup lang="ts">
// Page de reservation: une phrase, un calendrier code-barres, une frise, un plan de bus, un billet qui se remplit.
import { CLASSES, CLASS_IDS } from '~~/content/network'
import { roundTripSaving } from '#shared/pricing'
import { expandTime } from '#shared/time'
import type { ClassId, DepartureInfo, FullTicket, OfferInfo, SeatsResponse } from '#shared/types'
import { applyQuerySync, asStr, isClass, resolveStep } from '~/utils/bookingRoute'

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
const { fcfa, city, dateLong, dateShort } = useL10n()

const legIdx = computed(() => store.activeLeg)
const leg = computed(() => store.leg)
const legRoute = computed(() => store.activeRoute)
const minDate = computed(() => (legIdx.value === 1 ? store.legs[0].date : null))

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
  await transition(() => go('horaire'))
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

async function changeDate() {
  await transition(() => go('date'))
}

function onCitiesChanged() {
  void go('date', 0, true)
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
  <div class="mx-auto px-5 pb-36 pt-8" :class="showAside ? 'max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-14' : 'max-w-3xl'">
    <div class="min-w-0">
      <h2 ref="heading" tabindex="-1" class="sr-only">{{ stepTitle }}</h2>

      <!-- Mobile: acces au billet en cours -->
      <button
        v-if="showAside && store.step !== 'date' && store.step !== 'sieges'"
        type="button"
        class="btn btn-outline btn-sm mb-5 w-full justify-between lg:hidden"
        @click="ticketSheet?.showModal()"
      >
        <span class="flex items-center gap-2"><Icon name="lucide:ticket" class="size-4" />{{ $t('booking.yourTicket') }}</span>
        <span class="tnum">{{ store.totalFcfa ? fcfa(store.totalFcfa) : '' }}</span>
      </button>

      <!-- Etape 1: date -->
      <div v-if="store.step === 'date'" class="grid gap-8">
        <div v-if="legIdx === 0" class="grid gap-5">
          <h1 class="display text-3xl sm:text-4xl">{{ $t('booking.whereWhen') }}</h1>
          <PhraseTrajet show-trip @change="onCitiesChanged" />
          <p v-if="store.roundTrip && saving > 0" class="flex items-center gap-1.5 text-sm font-semibold text-success">
            <Icon name="lucide:circle-check" class="size-4" />{{ $t('booking.saveUpTo', { amount: fcfa(saving) }) }}
          </p>
        </div>
        <div v-else>
          <p class="text-sm text-muted">{{ city(store.from) }} - {{ city(store.to) }}, {{ store.legs[0].date ? dateShort(store.legs[0].date) : '' }}</p>
          <h1 class="display mt-1 text-3xl sm:text-4xl">
            {{ $t('booking.phraseReturn', { from: city(legRoute.from), to: city(legRoute.to) }) }}
          </h1>
        </div>
        <CalendrierCodeBarres
          :from="legRoute.from"
          :to="legRoute.to"
          :leg="legIdx"
          :min-date="minDate"
          :selected="leg.date"
          @select="onPickDate"
        />
      </div>

      <!-- Etape 2: horaire -->
      <div v-else-if="store.step === 'horaire'" class="grid gap-6">
        <h1 class="display text-3xl sm:text-4xl">{{ $t('booking.titleSchedule') }}</h1>
        <PhraseTrajet v-if="legIdx === 0" @change="onCitiesChanged" />
        <p v-else class="text-lg font-semibold">{{ city(legRoute.from) }} - {{ city(legRoute.to) }}</p>
        <button
          v-if="leg.date"
          type="button"
          class="surface flex w-fit items-center gap-3 !rounded-full px-5 py-2.5 text-left"
          style="view-transition-name: picked-day"
          @click="changeDate"
        >
          <Icon name="lucide:calendar" class="size-5" />
          <span class="font-bold capitalize">{{ dateLong(leg.date) }}</span>
          <span class="text-sm text-muted underline">{{ $t('booking.changeDate') }}</span>
        </button>
        <div class="flex flex-wrap gap-2" role="group" :aria-label="$t('calendar.filter')">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
            :class="store.classFilter === 'all' ? 'bg-base-content text-base-100' : 'bg-base-200 hover:bg-base-300'"
            :aria-pressed="store.classFilter === 'all'"
            @click="store.classFilter = 'all'"
          >
            {{ $t('calendar.allClasses') }}
          </button>
          <button
            v-for="c in CLASS_IDS"
            :key="c"
            type="button"
            class="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
            :class="store.classFilter === c ? 'bg-base-content text-base-100' : 'bg-base-200 hover:bg-base-300'"
            :aria-pressed="store.classFilter === c"
            @click="store.classFilter = c"
          >
            <ClassMark :id="c" />{{ CLASSES[c].name }}
          </button>
        </div>
        <FriseHoraire
          v-if="leg.date"
          :from="legRoute.from"
          :to="legRoute.to"
          :date="leg.date"
          :selected-id="leg.departureId"
          :selected-class="leg.classId"
          @pick="onPickOffer"
        />
      </div>

      <!-- Etape 3: sieges -->
      <div v-else-if="store.step === 'sieges'" class="grid gap-6">
        <div>
          <p class="text-sm text-muted">
            {{ city(legRoute.from) }} - {{ city(legRoute.to) }}
            <span v-if="store.roundTrip">, {{ legIdx === 0 ? $t('booking.outbound') : $t('booking.inbound') }}</span>
          </p>
          <h1 class="display mt-1 text-3xl sm:text-4xl">{{ $t('booking.titleSeats') }}</h1>
          <p v-if="leg.classId && leg.date" class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
            <span class="font-semibold capitalize text-base-content">{{ dateLong(leg.date) }}</span>
            <span class="mono">{{ leg.time }} - {{ leg.arrivalTime }}</span>
            <span class="flex items-center gap-1.5"><ClassMark :id="leg.classId" />{{ CLASSES[leg.classId].name }}</span>
            <button type="button" class="underline" @click="go('horaire')">{{ $t('booking.changeSchedule') }}</button>
          </p>
          <p class="mt-3 max-w-xl text-muted">{{ $t('booking.seatsIntro', { n: seatsData?.maxSeats ?? 5 }) }}</p>
        </div>

        <div v-if="store.conflictSeats.length" class="flex items-start gap-3 rounded-2xl bg-error/10 p-4" role="alert">
          <Icon name="lucide:circle-alert" class="mt-0.5 size-5 shrink-0 text-error" />
          <p class="font-semibold">{{ $t('booking.seatsTaken', { seats: store.conflictSeats.join(', ') }) }}</p>
        </div>
        <div v-if="limitHit" class="flex items-start gap-3 rounded-2xl bg-base-200 p-4" role="status">
          <Icon name="lucide:info" class="mt-0.5 size-5 shrink-0" />
          <p class="font-semibold">{{ $t('booking.seatsLimit', { n: seatsData?.maxSeats ?? 5 }) }}</p>
        </div>

        <div v-if="seatsFailed" class="rounded-2xl bg-error/10 p-5" role="alert">
          <p class="font-semibold">{{ $t('booking.seatsError') }}</p>
          <button type="button" class="btn btn-primary btn-sm mt-3" @click="loadSeats()">{{ $t('common.retry') }}</button>
        </div>
        <div v-else-if="seatsLoading || !seatsData" class="mx-auto h-96 w-64 animate-pulse rounded-t-[3.5rem] rounded-b-2xl bg-base-200" aria-busy="true" />
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

        <!-- Barre d'action collee en bas -->
        <div class="surface sticky bottom-4 z-30 p-3 shadow-[var(--shadow-lift)]">
          <div class="flex flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate font-bold">
                <template v-if="leg.seatIds.length">
                  {{ $t('booking.seatsChosen', { n: leg.seatIds.length }, leg.seatIds.length) }}
                  <span class="mono ml-1">{{ leg.seatIds.join(' ') }}</span>
                </template>
                <template v-else>{{ $t('booking.noSeat') }}</template>
              </p>
              <p class="tnum text-sm text-muted">
                {{ leg.seatIds.length ? fcfa(leg.unitPrice * leg.seatIds.length) : fcfa(leg.unitPrice) + ' ' + $t('booking.perSeat') }}
              </p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm lg:hidden" @click="ticketSheet?.showModal()">
              <Icon name="lucide:ticket" class="size-5" />
              <span class="sr-only">{{ $t('booking.yourTicket') }}</span>
            </button>
            <button type="button" class="btn btn-primary" :disabled="!leg.seatIds.length || seatsBusy" @click="continueSeats">
              <Icon v-if="seatsBusy || store.holdBusy" name="lucide:loader" class="size-5 animate-spin" />
              {{ store.roundTrip && legIdx === 0 ? $t('booking.chooseReturn') : $t('booking.continue') }}
              <Icon v-if="!seatsBusy && !store.holdBusy" name="lucide:arrow-right" class="size-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Etape 4: titulaire -->
      <div v-else-if="store.step === 'titulaire'" class="grid gap-6">
        <div v-if="store.roundTrip" class="flex flex-wrap gap-2 text-sm">
          <button v-for="i in 2" :key="i" type="button" class="btn btn-outline btn-sm" @click="editSeatsLeg((i - 1) as 0 | 1)">
            <Icon name="lucide:armchair" class="size-4" />
            {{ i === 1 ? $t('booking.outbound') : $t('booking.inbound') }}: {{ store.legs[i - 1]!.seatIds.join(' ') }}
          </button>
        </div>
        <FormTitulaire :busy="holderBusy" :error="holderError" @submit="submitHolder" />
      </div>

      <!-- Etape 5: paiement -->
      <PaiementMobileMoney v-else-if="store.step === 'paiement'" @paid="onPaid" @back="backFromPayment" />

      <!-- Etape 6: billet -->
      <div v-else class="grid gap-8">
        <div class="max-w-xl">
          <span class="grid size-14 place-items-center rounded-full bg-success text-success-content">
            <Icon name="lucide:check" class="size-8" />
          </span>
          <h1 class="display mt-4 text-3xl sm:text-4xl">{{ $t('done.title') }}</h1>
          <p class="mt-3 text-muted">{{ $t('done.text') }}</p>
        </div>

        <div v-if="tickets.length > 1" class="flex gap-2" role="tablist">
          <button
            v-for="(tk, i) in tickets"
            :key="tk.pnr"
            type="button"
            role="tab"
            :aria-selected="activeTicket === i"
            class="btn btn-sm"
            :class="activeTicket === i ? 'btn-neutral' : 'btn-outline'"
            @click="activeTicket = i"
          >
            {{ i === 0 ? $t('booking.outbound') : $t('booking.inbound') }}
          </button>
        </div>
        <div
          v-if="tickets[activeTicket]"
          :style="{ animation: 'ticket-print 0.9s var(--ease-route) both' }"
        >
          <TicketPanel
            :ticket="tickets[activeTicket]!"
            :token="store.result?.bookings[activeTicket]?.accessToken"
            actions
            stamp-animate
          />
        </div>
        <div v-else class="surface p-6">
          <p class="font-semibold">{{ $t('done.fetchFailed') }}</p>
          <NuxtLinkLocale to="/mon-voyage" class="btn btn-primary btn-sm mt-3">{{ $t('nav.myTrip') }}</NuxtLinkLocale>
        </div>

        <div class="mx-auto flex w-full max-w-xl flex-wrap gap-2">
          <button type="button" class="btn btn-outline" @click="newBooking">
            <Icon name="lucide:plus" class="size-5" />{{ $t('done.again') }}
          </button>
          <NuxtLinkLocale to="/" class="btn btn-ghost">{{ $t('done.home') }}</NuxtLinkLocale>
        </div>
      </div>
    </div>

    <!-- Billet en cours (bureau) -->
    <aside v-if="showAside" class="hidden lg:block" :aria-label="$t('booking.yourTicket')">
      <div class="sticky top-32">
        <BilletEnCours />
        <p class="mt-4 flex items-start gap-2 text-sm text-muted">
          <Icon name="lucide:shield-check" class="mt-0.5 size-4 shrink-0" />{{ $t('booking.reassure') }}
        </p>
      </div>
    </aside>

    <!-- Billet en cours (mobile) -->
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
        <Icon name="lucide:hourglass" class="size-8 text-dla" />
        <h2 class="display mt-3 text-3xl">{{ $t('booking.expiredTitle') }}</h2>
        <p class="mt-3 text-muted">{{ $t('booking.expiredText') }}</p>
        <div class="modal-action flex-wrap">
          <button type="button" class="btn btn-primary" :disabled="resuming" @click="resumeSeats">
            <Icon v-if="resuming" name="lucide:loader" class="size-5 animate-spin" />
            {{ $t('booking.resume') }}
          </button>
          <button type="button" class="btn btn-ghost" @click="chooseAgain">{{ $t('booking.chooseAgain') }}</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
