<script setup lang="ts">
// Departs du jour: une carte par horaire, une pastille par classe. Un toucher sur une pastille = choix fait.
import { CLASSES, CLASS_IDS, SETTINGS } from '~~/content/network'
import { instantOf } from '#shared/time'
import type { CityId, ClassId, DepartureInfo, OfferInfo } from '#shared/types'

const props = defineProps<{
  from: CityId
  to: CityId
  date: string
  selectedId?: string | null
  selectedClass?: ClassId | null
  // Pour le retour: on masque les departs qui partent avant l'arrivee de l'aller (ms epoch)
  notBefore?: number | null
}>()
const emit = defineEmits<{ pick: [departure: DepartureInfo, offer: OfferInfo] }>()

const store = useBookingStore()
const api = useMtApi()
const { fcfa, num, duration, city } = useL10n()

const departures = ref<DepartureInfo[]>([])
const loading = ref(true)
const failed = ref(false)

async function load(silent = false) {
  if (!silent) loading.value = true
  failed.value = false
  try {
    departures.value = (await api.departures(props.from, props.to, props.date)).departures
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  void load()
  // Les places bougent: rafraichissement discret toutes les 30 secondes
  const { pause } = useIntervalFn(() => void load(true), 30_000)
  onBeforeUnmount(pause)
})
watch(() => [props.from, props.to, props.date], () => void load())

const available = computed(() =>
  departures.value.filter(
    (d) => !d.departed && (!props.notBefore || instantOf(d.date, d.departureTime) > props.notBefore),
  ),
)
const visible = computed(() =>
  available.value
    .map((d) => ({ ...d, offers: d.offers.filter((o) => store.classFilter === 'all' || o.classId === store.classFilter) }))
    .filter((d) => d.offers.length > 0),
)
const hiddenByFilter = computed(() => available.value.length > 0 && visible.value.length === 0)

const groups = computed(() => {
  const defs = [
    { key: 'morning', icon: 'lucide:sunrise', test: (h: number) => h < 12 },
    { key: 'afternoon', icon: 'lucide:sun', test: (h: number) => h >= 12 && h < 18 },
    { key: 'evening', icon: 'lucide:moon', test: (h: number) => h >= 18 },
  ]
  return defs
    .map((g) => ({ ...g, items: visible.value.filter((d) => g.test(Number(d.departureTime.slice(0, 2)))) }))
    .filter((g) => g.items.length)
})

const agencies = computed(() => available.value[0])
const dot = computed(() => ({ yaounde: 'var(--yde)', douala: 'var(--dla)', kribi: 'var(--kri)' })[props.from])

function tone(o: OfferInfo): 'full' | 'last' | 'ok' {
  if (o.left === 0) return 'full'
  return o.left <= SETTINGS.lastSeatsThreshold ? 'last' : 'ok'
}
const patClass = (c: ClassId) => (c === 'business' ? 'pat-business' : c === 'masterclass-s' ? 'pat-s' : 'pat-plus')
</script>

<template>
  <section class="min-w-0" aria-labelledby="dep-title">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="dep-title" class="text-base font-semibold">{{ $t('schedule.title') }}</h2>
        <p v-if="agencies" class="mt-0.5 text-sm text-muted">
          {{ city(from) }}, {{ agencies.boardingPoint }}
          <Icon name="lucide:arrow-right" class="mx-0.5 inline size-3.5" />
          {{ city(to) }}, {{ agencies.arrivalPoint }}
        </p>
      </div>
      <div class="flex flex-wrap gap-1.5" role="group" :aria-label="$t('calendar.filter')">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
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
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
          :class="store.classFilter === c ? 'bg-base-content text-base-100' : 'bg-base-200 hover:bg-base-300'"
          :aria-pressed="store.classFilter === c"
          @click="store.classFilter = c"
        >
          <i class="inline-block size-3 rounded-[4px]" :class="patClass(c)" aria-hidden="true" />{{ CLASSES[c].name }}
        </button>
      </div>
    </div>

    <div v-if="failed" class="mt-5 rounded-2xl bg-error/10 p-5" role="alert">
      <p class="font-semibold">{{ $t('schedule.errorTitle') }}</p>
      <button type="button" class="btn btn-primary btn-sm mt-3" @click="load()">
        <Icon name="lucide:refresh-cw" class="size-4" />{{ $t('common.retry') }}
      </button>
    </div>

    <div v-else-if="loading" class="mt-5 grid gap-3" aria-busy="true">
      <div v-for="n in 4" :key="n" class="h-24 animate-pulse rounded-[1.25rem] bg-base-200" />
    </div>

    <div v-else-if="hiddenByFilter || visible.length === 0" class="mt-5 rounded-[1.25rem] bg-base-200 p-10 text-center">
      <Icon name="lucide:search" class="mx-auto size-8 text-muted" />
      <p class="display mt-3 text-xl">{{ $t('schedule.emptyTitle') }}</p>
      <p class="mx-auto mt-2 max-w-md text-muted">{{ hiddenByFilter ? $t('schedule.emptyFilter') : $t('schedule.emptyDay') }}</p>
      <button v-if="hiddenByFilter" type="button" class="btn btn-primary mt-5" @click="store.classFilter = 'all'">{{ $t('calendar.allClasses') }}</button>
    </div>

    <div v-else class="mt-5 grid gap-7">
      <div v-for="g in groups" :key="g.key">
        <h3 class="mb-2.5 flex items-center gap-2 text-sm font-semibold text-muted">
          <Icon :name="g.icon" class="size-4" />{{ $t(`schedule.period.${g.key}`) }}
        </h3>
        <ul class="grid gap-3">
          <li v-for="d in g.items" :key="d.id" class="surface p-4">
            <div class="grid gap-4 md:grid-cols-[11.5rem_1fr] md:items-center">
              <div class="flex items-center gap-2">
                <p class="display tnum text-[1rem] leading-none">{{ d.departureTime }}</p>
                <div class="flex flex-1 items-center gap-1.5 text-xs text-muted" aria-hidden="true">
                  <span class="size-1.5 rounded-full" :style="{ background: dot }" />
                  <span class="h-px flex-1 bg-base-300" />
                  <span class="tnum">{{ duration(d.durationMin) }}</span>
                  <span class="h-px flex-1 bg-base-300" />
                </div>
                <p class="display tnum text-[1rem] leading-none">
                  {{ d.arrivalTime }}<sup v-if="d.arrivalNextDay" class="ml-0.5 text-xs font-semibold text-muted">+1</sup>
                </p>
              </div>

              <ul class="grid gap-2 sm:grid-cols-3">
                <li v-for="o in d.offers" :key="o.classId">
                  <button
                    type="button"
                    class="lane flex h-full w-full flex-col rounded-2xl border px-3.5 py-2.5 text-left transition-colors"
                    :class="[
                      selectedId === d.id && selectedClass === o.classId
                        ? 'border-primary/30 bg-base-200/60'
                        : 'border-line',
                      tone(o) === 'full' ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/30 hover:bg-base-200/60',
                    ]"
                    :disabled="tone(o) === 'full'"
                    :aria-pressed="selectedId === d.id && selectedClass === o.classId"
                    :aria-label="`${d.departureTime}, ${CLASSES[o.classId].name}, ${tone(o) === 'full' ? $t('calendar.full') : $t('calendar.seatsLeft', { n: o.left }, o.left)}, ${fcfa(o.price)}`"
                    @click="emit('pick', d, o)"
                  >
                    <span class="flex items-center gap-2 whitespace-nowrap text-[0.82rem]">
                      <i class="inline-block size-3 shrink-0 rounded-[4px]" :class="patClass(o.classId)" aria-hidden="true" />{{ CLASSES[o.classId].name }}
                    </span>
                    <span class="display tnum mt-1 text-md font-medium leading-tight" :class="tone(o) === 'full' ? 'line-through' : ''">{{ fcfa(o.price) }}</span>
                    <span class="mt-1 text-xs font-light" :class="tone(o) === 'full' ? 'text-error' : tone(o) === 'last' ? 'text-dla-ink' : 'text-muted'">
                      <template v-if="tone(o) === 'full'">{{ $t('calendar.full') }}</template>
                      <template v-else-if="tone(o) === 'last'">{{ $t('schedule.lastLeft', { n: o.left }, o.left) }}</template>
                      <template v-else>{{ $t('calendar.seatsLeft', { n: num(o.left) }, o.left) }}</template>
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
