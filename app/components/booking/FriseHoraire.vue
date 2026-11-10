<script setup lang="ts">
// Frise horaire: une ligne verticale, un arret par depart, une voie par classe disponible.
import { CLASSES, EQUIPMENTS, SETTINGS } from '~~/content/network'
import type { CityId, ClassId, DepartureInfo, OfferInfo } from '#shared/types'

const props = defineProps<{
  from: CityId
  to: CityId
  date: string
  selectedId?: string | null
  selectedClass?: ClassId | null
}>()
const emit = defineEmits<{ pick: [departure: DepartureInfo, offer: OfferInfo] }>()

const store = useBookingStore()
const api = useMtApi()
const { loc, fcfa, num, duration } = useL10n()

const dotColor = computed(() => ({ yaounde: 'var(--yde)', douala: 'var(--dla)', kribi: 'var(--kri)' })[props.from])
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

const visible = computed(() =>
  departures.value.filter((d) => !d.departed).map((d) => ({
    ...d,
    offers: d.offers.filter((o) => store.classFilter === 'all' || o.classId === store.classFilter),
  })).filter((d) => d.offers.length > 0),
)
const hiddenByFilter = computed(
  () => departures.value.filter((d) => !d.departed).length > 0 && visible.value.length === 0,
)

function gauge(o: OfferInfo) {
  return Math.round((o.left / o.capacity) * 100)
}
</script>

<template>
  <section aria-labelledby="frise-title">
    <h2 id="frise-title" class="sr-only">{{ $t('schedule.title') }}</h2>

    <div v-if="failed" class="rounded-2xl bg-error/10 p-5" role="alert">
      <p class="font-semibold">{{ $t('schedule.errorTitle') }}</p>
      <button type="button" class="btn btn-primary btn-sm mt-3" @click="load()">
        <Icon name="lucide:refresh-cw" class="size-4" />
        {{ $t('common.retry') }}
      </button>
    </div>

    <div v-else-if="loading" class="grid gap-4" aria-busy="true">
      <div v-for="n in 4" :key="n" class="h-36 animate-pulse rounded-[1.25rem] bg-base-200" />
    </div>

    <div v-else-if="hiddenByFilter || visible.length === 0" class="rounded-[1.25rem] bg-base-200 p-10 text-center">
      <Icon name="lucide:search" class="mx-auto size-8 text-muted" />
      <p class="display mt-3 text-xl">{{ $t('schedule.emptyTitle') }}</p>
      <p class="mx-auto mt-2 max-w-md text-muted">
        {{ hiddenByFilter ? $t('schedule.emptyFilter') : $t('schedule.emptyDay') }}
      </p>
      <button v-if="hiddenByFilter" type="button" class="btn btn-primary mt-5" @click="store.classFilter = 'all'">
        {{ $t('calendar.allClasses') }}
      </button>
    </div>

    <ol v-else class="grid gap-4">
      <li v-for="d in visible" :key="d.id" class="surface overflow-hidden">
        <div class="flex items-center gap-4 px-5 pt-5 sm:gap-6 sm:px-6">
          <div class="min-w-0">
            <p class="display tnum text-3xl leading-none">{{ d.departureTime }}</p>
            <p class="mt-1.5 truncate text-xs text-muted">{{ d.boardingPoint }}</p>
          </div>
          <div class="flex min-w-0 flex-1 items-center gap-2" aria-hidden="true">
            <span class="size-2 shrink-0 rounded-full" :style="{ background: dotColor }" />
            <span class="h-px flex-1 bg-base-300" />
            <span class="chip hidden shrink-0 !py-0.5 text-xs sm:inline-flex">{{ duration(d.durationMin) }}</span>
            <span class="h-px flex-1 bg-base-300" />
            <span class="size-2 shrink-0 rounded-full border-2" :style="{ borderColor: dotColor }" />
          </div>
          <div class="min-w-0 text-right">
            <p class="display tnum text-3xl leading-none">
              {{ d.arrivalTime }}<sup v-if="d.arrivalNextDay" class="ml-0.5 text-xs font-semibold text-muted">+1</sup>
            </p>
            <p class="mt-1.5 truncate text-xs text-muted">{{ d.arrivalPoint }}</p>
          </div>
        </div>
        <p class="sr-only">{{ $t('schedule.arrives') }} {{ d.arrivalTime }}</p>

        <ul class="mt-4 grid gap-1 p-2 sm:p-3">
          <li v-for="o in d.offers" :key="o.classId">
            <button
              type="button"
              class="lane flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-3.5 py-3 text-left transition-colors sm:flex-nowrap"
              :class="[
                o.left === 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-base-200',
                selectedId === d.id && selectedClass === o.classId ? '!bg-base-200 ring-2 ring-primary' : 'bg-base-200/50',
              ]"
              :disabled="o.left === 0"
              :aria-pressed="selectedId === d.id && selectedClass === o.classId"
              :aria-label="`${d.departureTime}, ${CLASSES[o.classId].name}, ${o.left === 0 ? $t('calendar.full') : $t('calendar.seatsLeft', { n: o.left }, o.left)}, ${fcfa(o.price)}`"
              @click="emit('pick', d, o)"
            >
              <span class="flex min-w-0 flex-1 items-center gap-3">
                <ClassMark :id="o.classId" swatch />
                <span class="min-w-0">
                  <span class="block font-semibold leading-tight">{{ CLASSES[o.classId].name }}</span>
                  <span class="flex items-center gap-2 text-xs text-muted">
                    {{ loc(CLASSES[o.classId].tier) }}
                    <span class="flex gap-1.5" aria-hidden="true">
                      <Icon v-for="e in CLASSES[o.classId].equipments.slice(0, 4)" :key="e" :name="EQUIPMENTS[e]!.icon" class="size-3.5" />
                    </span>
                  </span>
                </span>
              </span>

              <span class="w-full sm:w-32">
                <span class="flex items-center justify-between text-xs">
                  <span v-if="o.left === 0" class="font-semibold text-error">{{ $t('calendar.full') }}</span>
                  <span v-else class="tnum font-medium">{{ $t('calendar.seatsLeft', { n: num(o.left) }, o.left) }}</span>
                </span>
                <span class="mt-1.5 block h-1 overflow-hidden rounded-full bg-base-300" aria-hidden="true">
                  <span
                    class="block h-full rounded-full"
                    :class="o.left <= SETTINGS.lastSeatsThreshold ? 'bg-dla' : 'bg-base-content/60'"
                    :style="{ width: `${gauge(o)}%`, transition: 'width 0.6s var(--ease-route)' }"
                  />
                </span>
                <span v-if="o.left > 0 && o.left <= SETTINGS.lastSeatsThreshold" class="mt-1 flex items-center gap-1 text-xs font-semibold text-dla-ink">
                  <Icon name="lucide:hourglass" class="size-3" />{{ $t('schedule.lastSeats') }}
                </span>
              </span>

              <span class="tnum ml-auto text-lg font-bold sm:w-28 sm:text-right">{{ fcfa(o.price) }}</span>
            </button>
          </li>
        </ul>
      </li>
    </ol>
  </section>
</template>
