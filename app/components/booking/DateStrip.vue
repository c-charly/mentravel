<script setup lang="ts">
// Choix du jour: une bande horizontale de jours (point vert, orange ou "Complet") et un calendrier mensuel.
// Remplace l'ancien calendrier a barres: un seul geste, une seule lecture.
import { SETTINGS } from '~~/content/network'
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
const { weekday, dateLong, monthYear } = useL10n()

const data = ref<CalendarResponse | null>(null)
const loading = ref(true)
const failed = ref(false)
const track = ref<HTMLElement | null>(null)
const sheet = ref<HTMLDialogElement | null>(null)
const viewMonth = ref('')

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
})
watch(() => [props.from, props.to], () => {
  data.value = null
  void load()
})

type Status = 'none' | 'past' | 'full' | 'tight' | 'ok'
interface Day {
  date: string
  num: number
  status: Status
  left: number
  first: boolean
}

const days = computed<Day[]>(() => {
  const d = data.value
  if (!d) return []
  const filter = store.classFilter
  return d.days.map((day, i) => {
    const relevant = day.departures.filter((dep) => filter === 'all' || dep.left[filter] !== undefined)
    let left = 0
    let cap = 0
    for (const dep of relevant) {
      for (const c of Object.keys(dep.left) as ClassId[]) {
        if (filter !== 'all' && c !== filter) continue
        left += dep.left[c] ?? 0
        cap += d.capacity[c] ?? 0
      }
    }
    let status: Status
    if (props.minDate && day.date < props.minDate) status = 'past'
    else if (relevant.length === 0) status = 'none'
    else if (left === 0) status = 'full'
    else if (cap > 0 && left / cap < SETTINGS.tightRatio) status = 'tight'
    else status = 'ok'
    return { date: day.date, num: parseIsoDate(day.date).getUTCDate(), status, left, first: i > 0 && day.date.endsWith('-01') }
  })
})
const byDate = computed(() => new Map(days.value.map((d) => [d.date, d])))
const selectable = (d?: Day) => !!d && (d.status === 'ok' || d.status === 'tight')

// Premier jour utile choisi d'office: l'utilisateur voit tout de suite des departs
watch(days, (list) => {
  if (props.selected || !list.length) return
  const first = list.find(selectable)
  if (first) emit('select', first.date)
})

// Le jour choisi reste visible dans la bande
watch(
  () => [props.selected, days.value.length],
  async () => {
    await nextTick()
    const el = track.value?.querySelector<HTMLElement>('[aria-pressed="true"]')
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: motionAllowed() ? 'smooth' : 'auto' })
  },
)

function scrollBy(dir: 1 | -1) {
  track.value?.scrollBy({ left: dir * track.value.clientWidth * 0.75, behavior: 'smooth' })
}

function labelOf(d: Day): string {
  const base = dateLong(d.date)
  if (d.status === 'full') return `${base}. ${t('calendar.full')}`
  if (d.status === 'none') return `${base}. ${t('calendar.none')}`
  if (d.status === 'past') return `${base}. ${t('calendar.unavailable')}`
  return `${base}. ${t('calendar.seatsLeft', { n: d.left }, d.left)}${d.status === 'tight' ? `. ${t('calendar.tight')}` : ''}`
}

// ---- calendrier mensuel ----
const monthLabel = computed(() => (viewMonth.value ? monthYear(`${viewMonth.value}-01`) : ''))
const cells = computed(() => {
  if (!viewMonth.value) return []
  const [y, m] = viewMonth.value.split('-').map(Number) as [number, number]
  const first = `${viewMonth.value}-01`
  const offset = (dayOfWeek(first) + 6) % 7
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const out: ({ date: string; num: number } | null)[] = Array.from({ length: offset }, () => null)
  for (let i = 1; i <= total; i++) out.push({ date: `${viewMonth.value}-${String(i).padStart(2, '0')}`, num: i })
  return out
})
const today = computed(() => data.value?.today ?? '')
const canPrev = computed(() => !!today.value && viewMonth.value > today.value.slice(0, 7))
const canNext = computed(() => days.value.some((d) => d.date.slice(0, 7) > viewMonth.value))
function shiftMonth(dir: 1 | -1) {
  const [y, m] = viewMonth.value.split('-').map(Number) as [number, number]
  const d = new Date(Date.UTC(y, m - 1 + dir, 1))
  viewMonth.value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
function openSheet() {
  viewMonth.value = (props.selected ?? today.value ?? addDays(new Date().toISOString().slice(0, 10), 0)).slice(0, 7)
  sheet.value?.showModal()
}
function pickFromSheet(date: string) {
  emit('select', date)
  sheet.value?.close()
}
const weekdayInitials = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']
</script>

<template>
  <section class="min-w-0" :aria-label="leg === 1 ? $t('strip.titleReturn') : $t('strip.title')">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-base font-semibold">
        {{ leg === 1 ? $t('strip.titleReturn') : $t('strip.title') }}
        <span v-if="selected" class="ml-1 font-normal capitalize text-muted">{{ monthYear(selected) }}</span>
      </h2>
      <div class="flex items-center gap-1.5">
        <button type="button" class="hidden size-8 place-items-center rounded-full border border-line text-muted hover:bg-base-200 hover:text-base-content md:grid" :aria-label="$t('strip.earlier')" @click="scrollBy(-1)">
          <Icon name="lucide:chevron-left" class="size-4" />
        </button>
        <button type="button" class="hidden size-8 place-items-center rounded-full border border-line text-muted hover:bg-base-200 hover:text-base-content md:grid" :aria-label="$t('strip.later')" @click="scrollBy(1)">
          <Icon name="lucide:chevron-right" class="size-4" />
        </button>
        <button type="button" class="btn btn-outline btn-sm" @click="openSheet">
          <Icon name="lucide:calendar-days" class="size-4" />{{ $t('strip.calendar') }}
        </button>
      </div>
    </div>

    <div v-if="failed" class="mt-4 rounded-2xl bg-error/10 p-4" role="alert">
      <p class="font-semibold">{{ $t('calendar.errorTitle') }}</p>
      <button type="button" class="btn btn-primary btn-sm mt-3" @click="load">
        <Icon name="lucide:refresh-cw" class="size-4" />{{ $t('common.retry') }}
      </button>
    </div>

    <div v-else-if="loading" class="mt-4 flex gap-2 overflow-hidden" aria-busy="true">
      <div v-for="n in 9" :key="n" class="h-[4.6rem] w-[4.1rem] shrink-0 animate-pulse rounded-2xl bg-base-200" />
    </div>

    <div v-else class="relative mt-3">
      <ul ref="track" class="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1" role="list">
        <template v-for="d in days" :key="d.date">
          <li v-if="d.first" class="flex shrink-0 items-center px-1" aria-hidden="true">
            <span class="rounded-full bg-base-200 px-2.5 py-1 text-xs font-semibold capitalize">{{ monthYear(d.date).split(' ')[0] }}</span>
          </li>
          <li class="shrink-0 snap-start">
            <button
              type="button"
              class="flex w-[4.1rem] flex-col items-center rounded-2xl border px-1 pb-2.5 pt-2 transition-colors"
              :class="[
                selected === d.date ? 'border-primary bg-primary text-primary-content' : 'border-line bg-base-100',
                selectable(d) && selected !== d.date ? 'hover:bg-base-200' : '',
                !selectable(d) ? 'cursor-not-allowed opacity-45' : '',
              ]"
              :disabled="!selectable(d)"
              :aria-pressed="selected === d.date"
              :aria-label="labelOf(d)"
              @click="emit('select', d.date)"
            >
              <span class="text-[0.7rem] font-medium capitalize" :class="selected === d.date ? 'text-primary-content/75' : 'text-muted'">{{ weekday(d.date) }}</span>
              <span class="display text-xl leading-tight">{{ d.num }}</span>
              <span class="mt-1.5 flex h-2 items-center" aria-hidden="true">
                <i v-if="d.status === 'ok'" class="size-1.5 rounded-full bg-success" />
                <i v-else-if="d.status === 'tight'" class="size-1.5 rounded-full bg-secondary" />
                <span v-else-if="d.status === 'full'" class="text-[0.6rem] font-bold leading-none text-error">{{ $t('calendar.full') }}</span>
                <span v-else class="text-xs leading-none text-muted">-</span>
              </span>
            </button>
          </li>
        </template>
      </ul>
    </div>

    <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" :aria-label="$t('strip.legend')">
      <li class="flex items-center gap-1.5"><i class="size-2 rounded-full bg-success" />{{ $t('strip.legendOk') }}</li>
      <li class="flex items-center gap-1.5"><i class="size-2 rounded-full bg-secondary" />{{ $t('calendar.tight') }}</li>
      <li class="flex items-center gap-1.5"><span class="font-bold text-error">{{ $t('calendar.full') }}</span></li>
    </ul>

    <!-- Calendrier mensuel -->
    <dialog ref="sheet" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box max-w-md">
        <div class="flex items-center justify-between">
          <button type="button" class="btn btn-ghost btn-circle btn-sm" :disabled="!canPrev" :aria-label="$t('strip.prevMonth')" @click="shiftMonth(-1)">
            <Icon name="lucide:chevron-left" class="size-5" />
          </button>
          <h3 class="display text-lg capitalize">{{ monthLabel }}</h3>
          <button type="button" class="btn btn-ghost btn-circle btn-sm" :disabled="!canNext" :aria-label="$t('strip.nextMonth')" @click="shiftMonth(1)">
            <Icon name="lucide:chevron-right" class="size-5" />
          </button>
        </div>
        <div class="mt-4 grid grid-cols-7 gap-y-1 text-center text-xs font-medium text-muted" aria-hidden="true">
          <span v-for="w in weekdayInitials" :key="w" class="capitalize">{{ weekday(w).slice(0, 2) }}</span>
        </div>
        <div class="mt-1 grid grid-cols-7 gap-y-1">
          <template v-for="(c, i) in cells" :key="i">
            <span v-if="!c" />
            <button
              v-else
              type="button"
              class="mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-sm font-semibold transition-colors"
              :class="[
                selected === c.date ? 'bg-primary text-primary-content' : selectable(byDate.get(c.date)) ? 'hover:bg-base-200' : 'text-muted/60',
                c.date === today && selected !== c.date ? 'ring-1 ring-[var(--line-strong)]' : '',
              ]"
              :disabled="!selectable(byDate.get(c.date))"
              :aria-label="byDate.get(c.date) ? labelOf(byDate.get(c.date)!) : dateLong(c.date)"
              :aria-pressed="selected === c.date"
              @click="pickFromSheet(c.date)"
            >
              <span class="leading-none">{{ c.num }}</span>
              <i v-if="byDate.get(c.date)?.status === 'ok'" class="mt-1 size-1 rounded-full" :class="selected === c.date ? 'bg-primary-content' : 'bg-success'" />
              <i v-else-if="byDate.get(c.date)?.status === 'tight'" class="mt-1 size-1 rounded-full bg-secondary" />
              <i v-else-if="byDate.get(c.date)?.status === 'full'" class="mt-1 h-px w-3 bg-error" />
              <i v-else class="mt-1 size-1" />
            </button>
          </template>
        </div>
        <ul class="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          <li class="flex items-center gap-1.5"><i class="size-2 rounded-full bg-success" />{{ $t('strip.legendOk') }}</li>
          <li class="flex items-center gap-1.5"><i class="size-2 rounded-full bg-secondary" />{{ $t('calendar.tight') }}</li>
          <li class="flex items-center gap-1.5"><i class="h-px w-3 bg-error" />{{ $t('calendar.full') }}</li>
        </ul>
        <div class="modal-action"><form method="dialog"><button class="btn btn-ghost">{{ $t('nav.close') }}</button></form></div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>{{ $t('nav.close') }}</button></form>
    </dialog>
  </section>
</template>

<style scoped>
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
