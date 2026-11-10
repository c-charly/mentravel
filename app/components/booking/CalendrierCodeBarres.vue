<script setup lang="ts">
// Calendrier "code-barres": chaque jour est un code-barres, une barre par depart.
// La hauteur d'une barre = places restantes, les motifs distinguent les classes.
import { CLASSES, CLASS_IDS, SETTINGS } from '~~/content/network'
import { addDays, dayOfWeek, parseIsoDate } from '#shared/time'
import type { CalendarResponse, CityId, ClassId } from '#shared/types'

const props = defineProps<{
  from: CityId
  to: CityId
  leg: 0 | 1
  minDate?: string | null
  selected?: string | null
}>()
const emit = defineEmits<{ select: [date: string] }>()

const store = useBookingStore()
const api = useMtApi()
const { t } = useI18n()
const { weekday, dateLong, monthYear, num } = useL10n()

const data = ref<CalendarResponse | null>(null)
const loading = ref(true)
const failed = ref(false)
const hovered = ref<string | null>(null)

async function load() {
  loading.value = !data.value
  failed.value = false
  try {
    data.value = await api.calendar(props.from, props.to)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  void load()
  useEventListener(window, 'focus', () => void load())
  useEventListener(window, 'online', () => void load())
})
watch(() => [props.from, props.to], () => {
  data.value = null
  void load()
})

type DayStatus = 'none' | 'past' | 'full' | 'tight' | 'ok'

interface BarView {
  id: string
  time: string
  ratio: number
  left: number
  segments: { classId: ClassId; left: number }[]
}

interface DayView {
  kind: 'day'
  date: string
  dow: number
  status: DayStatus
  left: number
  count: number
  bars: BarView[]
  firstOfMonth: boolean
}

const totalCapacity = computed(() => CLASS_IDS.reduce((s, c) => s + (data.value?.capacity[c] ?? 0), 0))

const scaleMax = computed(() =>
  store.classFilter === 'all' ? totalCapacity.value : (data.value?.capacity[store.classFilter] ?? 1),
)

const days = computed<DayView[]>(() => {
  const d = data.value
  if (!d) return []
  const filter = store.classFilter
  return d.days.map((day, i) => {
    const bars: BarView[] = day.departures.map((dep) => {
      const classes = (Object.keys(dep.left) as ClassId[]).filter((c) => filter === 'all' || c === filter)
      const segments = classes.map((c) => ({ classId: c, left: dep.left[c] ?? 0 }))
      const left = segments.reduce((s, x) => s + x.left, 0)
      return {
        id: dep.id,
        time: dep.time,
        ratio: classes.length ? Math.min(1, left / scaleMax.value) : 0,
        left,
        segments,
      }
    })
    const relevant = day.departures.filter((dep) => filter === 'all' || dep.left[filter] !== undefined)
    const left = bars.reduce((s, b) => s + b.left, 0)
    const cap = relevant.reduce(
      (s, dep) =>
        s +
        (Object.keys(dep.left) as ClassId[])
          .filter((c) => filter === 'all' || c === filter)
          .reduce((x, c) => x + (d.capacity[c] ?? 0), 0),
      0,
    )
    let status: DayStatus
    if (props.minDate && day.date < props.minDate) status = 'past'
    else if (relevant.length === 0) status = 'none'
    else if (left === 0) status = 'full'
    else if (cap > 0 && left / cap < SETTINGS.tightRatio) status = 'tight'
    else status = 'ok'
    const dow = ((dayOfWeek(day.date) + 6) % 7) + 1
    return {
      kind: 'day',
      date: day.date,
      dow,
      status,
      left,
      count: relevant.length,
      bars,
      firstOfMonth: i === 0 || day.date.endsWith('-01'),
    }
  })
})

type Item = DayView | { kind: 'month'; key: string; label: string }

const items = computed<Item[]>(() => {
  const out: Item[] = []
  let lastMonth = ''
  for (const day of days.value) {
    const m = day.date.slice(0, 7)
    if (m !== lastMonth) {
      out.push({ kind: 'month', key: m, label: monthYear(day.date) })
      lastMonth = m
    }
    out.push(day)
  }
  return out
})

function selectable(day: DayView) {
  return day.status === 'ok' || day.status === 'tight'
}

const byDate = computed(() => new Map(days.value.map((d) => [d.date, d])))

// Raccourcis: aujourd'hui, demain, ce week-end
const shortcuts = computed(() => {
  const today = data.value?.today
  if (!today) return []
  const dow = dayOfWeek(today)
  const toSat = (6 - dow + 7) % 7
  const weekend = dow === 0 ? today : addDays(today, toSat)
  return [
    { key: 'today', date: today },
    { key: 'tomorrow', date: addDays(today, 1) },
    { key: 'weekend', date: weekend },
  ].filter((s, i, arr) => arr.findIndex((x) => x.date === s.date) === i)
})

function labelOf(day: DayView): string {
  const base = dateLong(day.date)
  if (day.status === 'full') return `${base}. ${t('calendar.full')}`
  if (day.status === 'none') return `${base}. ${t('calendar.none')}`
  if (day.status === 'past') return `${base}. ${t('calendar.unavailable')}`
  const tight = day.status === 'tight' ? ` ${t('calendar.tight')}.` : ''
  return `${base}. ${t('calendar.departures', { n: day.count }, day.count)}, ${t('calendar.seatsLeft', { n: day.left }, day.left)}.${tight}`
}

const preview = computed(() => (hovered.value ? byDate.value.get(hovered.value) : null))

const patClass = (c: ClassId) => (c === 'business' ? 'pat-business' : c === 'masterclass-s' ? 'pat-s' : 'pat-plus')

function dayNumber(date: string): number {
  return parseIsoDate(date).getUTCDate()
}
</script>

<template>
  <section aria-labelledby="cal-title">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h2 id="cal-title" class="display text-2xl">
        {{ leg === 1 ? $t('calendar.titleReturn') : $t('calendar.title') }}
      </h2>
      <div class="flex flex-wrap gap-2" role="group" :aria-label="$t('calendar.shortcuts')">
        <button
          v-for="s in shortcuts"
          :key="s.key"
          type="button"
          class="rounded-full border border-line px-3.5 py-2 text-sm font-medium transition-colors enabled:hover:bg-base-200 disabled:opacity-40"
          :disabled="!byDate.get(s.date) || !selectable(byDate.get(s.date)!)"
          @click="emit('select', s.date)"
        >
          {{ $t(`calendar.${s.key}`) }}
        </button>
      </div>
    </div>

    <!-- Filtre par classe = legende -->
    <div class="mt-4 flex flex-wrap gap-2" role="group" :aria-label="$t('calendar.filter')">
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
        <i class="inline-block size-3.5 rounded-[5px]" :class="patClass(c)" aria-hidden="true" />
        {{ CLASSES[c].name }}
      </button>
    </div>
    <p class="mt-3 text-sm text-muted">{{ $t('calendar.howTo') }}</p>

    <div v-if="failed" class="mt-6 rounded-2xl bg-error/10 p-5" role="alert">
      <p class="font-semibold">{{ $t('calendar.errorTitle') }}</p>
      <p class="mt-1 text-muted">{{ $t('calendar.errorText') }}</p>
      <button type="button" class="btn btn-primary btn-sm mt-3" @click="load">
        <Icon name="lucide:refresh-cw" class="size-4" />
        {{ $t('common.retry') }}
      </button>
    </div>

    <div v-else-if="loading" class="mt-6 grid gap-2 md:grid-cols-7" aria-busy="true">
      <div v-for="n in 14" :key="n" class="h-16 animate-pulse rounded-2xl bg-base-200 md:h-28" />
    </div>

    <div v-else class="mt-6">
      <div class="mb-2 hidden grid-cols-7 gap-2 text-xs font-medium text-muted md:grid" aria-hidden="true">
        <span v-for="d in ['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08']" :key="d" class="px-1 capitalize">
          {{ weekday(d) }}
        </span>
      </div>
      <div class="cal-grid grid gap-2 md:grid-cols-7">
        <template v-for="item in items" :key="item.kind === 'month' ? item.key : item.date">
          <h3 v-if="item.kind === 'month'" class="col-span-full mt-5 text-base font-semibold capitalize first:mt-0">
            {{ item.label }}
          </h3>
          <button
            v-else
            type="button"
            class="cal-cell group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-[border-color,box-shadow,background-color] duration-200 md:flex-col md:items-stretch md:gap-2"
            :class="[
              item.dow === 1 ? 'mt-2 md:mt-0' : '',
              selected === item.date ? 'border-primary bg-base-200 ring-2 ring-primary' : 'border-line bg-base-100',
              selectable(item) ? 'cursor-pointer hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-soft)]' : 'cursor-not-allowed opacity-50',
            ]"
            :style="item.firstOfMonth ? { '--cs': item.dow } : undefined"
            :disabled="!selectable(item)"
            :aria-pressed="selected === item.date"
            :aria-label="labelOf(item)"
            @click="emit('select', item.date)"
            @mouseenter="hovered = item.date"
            @mouseleave="hovered = null"
            @focus="hovered = item.date"
            @blur="hovered = null"
          >
            <span class="flex w-24 shrink-0 items-baseline gap-2 md:w-auto md:justify-between">
              <span class="display text-2xl">{{ dayNumber(item.date) }}</span>
              <span class="text-sm capitalize text-muted md:hidden">{{ weekday(item.date) }}</span>
              <span v-if="minDate === item.date" class="rounded-full bg-base-content px-2 py-0.5 text-[0.7rem] font-semibold text-base-100">
                {{ $t('booking.outbound') }}
              </span>
            </span>

            <span
              class="relative flex h-9 min-w-0 flex-1 items-end gap-[2px] md:h-12 md:flex-none"
              :class="item.status === 'full' ? 'opacity-35' : ''"
              aria-hidden="true"
            >
              <span
                v-for="bar in item.bars"
                :key="bar.id"
                class="flex h-full min-w-[2px] max-w-[9px] flex-1 flex-col justify-end"
              >
                <span
                  class="flex w-full flex-col-reverse overflow-hidden rounded-full"
                  :style="{
                    height: `${bar.ratio * 100}%`,
                    minHeight: bar.left > 0 ? '3px' : '0',
                    transition: 'height 0.5s var(--ease-route)',
                  }"
                >
                  <i
                    v-for="seg in bar.segments"
                    :key="seg.classId"
                    class="block w-full"
                    :class="patClass(seg.classId)"
                    :style="{ flexGrow: seg.left, flexBasis: 0, transition: 'flex-grow 0.5s var(--ease-route)' }"
                  />
                </span>
              </span>
              <span
                v-if="item.status === 'none' || item.status === 'past'"
                class="absolute inset-x-0 bottom-0 h-px bg-base-content/20"
              />
            </span>

            <span class="w-24 shrink-0 text-right text-xs leading-tight md:w-auto md:text-left" aria-hidden="true">
              <template v-if="item.status === 'full'">
                <span class="font-semibold text-error">{{ $t('calendar.full') }}</span>
              </template>
              <template v-else-if="item.status === 'none' || item.status === 'past'">
                <span class="text-muted">{{ item.status === 'none' ? $t('calendar.noneShort') : '' }}</span>
              </template>
              <template v-else>
                <span class="tnum font-semibold">{{ $t('calendar.seatsLeft', { n: num(item.left) }, item.left) }}</span>
                <span v-if="item.status === 'tight'" class="mt-0.5 flex items-center justify-end gap-1 font-semibold text-dla-ink md:justify-start">
                  <Icon name="lucide:hourglass" class="size-3" />
                  {{ $t('calendar.tight') }}
                </span>
              </template>
            </span>
          </button>
        </template>
      </div>

      <!-- Apercu au survol ou au focus (bureau) -->
      <div aria-live="polite">
        <div v-if="preview && preview.bars.length" class="surface pointer-events-none fixed bottom-6 left-1/2 z-30 hidden w-[min(34rem,90vw)] -translate-x-1/2 px-4 py-3 text-sm md:block">
          <p class="font-semibold capitalize">{{ dateLong(preview.date) }}</p>
          <p class="mono mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span v-for="b in preview.bars" :key="b.id" :class="b.left === 0 ? 'text-muted line-through' : ''">
              {{ b.time }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (min-width: 768px) {
  .cal-cell[style*='--cs'] {
    grid-column-start: var(--cs);
  }
}
</style>
