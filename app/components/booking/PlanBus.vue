<script setup lang="ts">
// Plan du bus vu de dessus (avant en haut). Les sieges deviennent des couchettes en MasterClass Plus.
import type { ClassId, SeatInfo, SeatLayout } from '#shared/types'

const props = defineProps<{
  layout: SeatLayout
  seats: SeatInfo[]
  classId: ClassId
  selected?: string[]
  highlight?: string[]
  max?: number
  readonly?: boolean
}>()
const emit = defineEmits<{ toggle: [id: string]; limit: [] }>()

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)

const statusOf = computed(() => new Map(props.seats.map((s) => [s.id, s.status])))
const seatById = computed(() => new Map(props.layout.seats.map((s) => [`${s.row}-${s.col}`, s])))
const rows = computed(() => Array.from({ length: props.layout.rows }, (_, i) => i + 1))
const cols = computed(() => props.layout.columns.length)

const dims = computed(() => {
  if (props.classId === 'masterclass-plus') return { w: 68, h: 100 }
  if (props.classId === 'masterclass-s') return { w: 58, h: 64 }
  return { w: 48, h: 48 }
})

const template = computed(() => {
  const left = props.layout.aisleAfter + 1
  const right = cols.value - left
  const cell = `${dims.value.w}px`
  return `1.5rem repeat(${left}, ${cell}) 1.75rem repeat(${right}, ${cell})`
})

// Colonne CSS d'un siege: on saute la ligne de numerotation et le couloir
function gridCol(col: number) {
  return col + 2 + (col > props.layout.aisleAfter ? 1 : 0)
}

type Visual = 'free' | 'selected' | 'taken' | 'held' | 'mine'

function visual(id: string): Visual {
  if (props.highlight?.includes(id)) return 'mine'
  if (props.selected?.includes(id)) return 'selected'
  const s = statusOf.value.get(id)
  return s === 'taken' ? 'taken' : s === 'held' ? 'held' : 'free'
}

function label(id: string): string {
  const v = visual(id)
  const base = `${t('plan.seat')} ${id}`
  if (v === 'mine') return `${base}, ${t('plan.yours')}`
  if (v === 'selected') return `${base}, ${t('plan.selected')}`
  if (v === 'taken') return `${base}, ${t('plan.taken')}`
  if (v === 'held') return `${base}, ${t('plan.held')}`
  return `${base}, ${t('plan.free')}`
}

function click(id: string) {
  if (props.readonly) return
  const v = visual(id)
  if (v === 'taken' || v === 'held') return
  if (v === 'free' && props.max && (props.selected?.length ?? 0) >= props.max) {
    emit('limit')
    return
  }
  emit('toggle', id)
}

function onKey(e: KeyboardEvent, row: number, col: number) {
  const dir = ({ ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] } as Record<string, [number, number]>)[e.key]
  if (!dir) return
  e.preventDefault()
  let r = row + dir[0]
  let c = col + dir[1]
  while (r >= 1 && r <= props.layout.rows && c >= 0 && c < cols.value) {
    const el = root.value?.querySelector<HTMLButtonElement>(`[data-r="${r}"][data-c="${c}"]`)
    if (el && !el.disabled) {
      el.focus()
      return
    }
    r += dir[0]
    c += dir[1]
  }
}
</script>

<template>
  <div ref="root" class="mx-auto w-fit max-w-full">
    <div
      class="relative rounded-t-[3.5rem] rounded-b-[1.75rem] border border-[var(--line-strong)] bg-base-100 px-5 pb-6 pt-4 shadow-[var(--shadow-soft)]"
      role="group"
      :aria-label="$t('plan.label')"
    >
      <div class="mb-4 flex items-center justify-center gap-2 border-b border-line pb-3 text-xs font-medium text-muted">
        <Icon name="lucide:chevron-up" class="size-4" />
        {{ $t('plan.front') }}
      </div>

      <div class="grid items-center justify-center gap-x-2 gap-y-2" :style="{ gridTemplateColumns: template }">
        <template v-for="r in rows" :key="r">
          <span class="mono text-center text-xs text-muted" :style="{ gridRow: r, gridColumn: 1 }" aria-hidden="true">{{ r }}</span>
          <template v-for="c in cols" :key="`${r}-${c}`">
            <template v-if="seatById.get(`${r}-${c - 1}`)">
              <component
                :is="readonly ? 'div' : 'button'"
                :type="readonly ? undefined : 'button'"
                :data-r="r"
                :data-c="c - 1"
                class="seat relative grid place-items-center rounded-xl border text-xs font-semibold transition-[transform,background-color,border-color,box-shadow] duration-150"
                :class="[
                  `seat-${visual(seatById.get(`${r}-${c - 1}`)!.id)}`,
                  classId === 'masterclass-plus' ? 'seat-bed' : '',
                ]"
                :style="{
                  gridRow: r,
                  gridColumn: gridCol(c - 1),
                  width: `${dims.w}px`,
                  height: `${dims.h}px`,
                }"
                :disabled="readonly ? undefined : ['taken', 'held'].includes(visual(seatById.get(`${r}-${c - 1}`)!.id))"
                :aria-label="label(seatById.get(`${r}-${c - 1}`)!.id)"
                :aria-pressed="readonly ? undefined : visual(seatById.get(`${r}-${c - 1}`)!.id) === 'selected'"
                @click="click(seatById.get(`${r}-${c - 1}`)!.id)"
                @keydown="onKey($event, r, c - 1)"
              >
                <template v-if="visual(seatById.get(`${r}-${c - 1}`)!.id) === 'taken'">
                  <Icon name="lucide:x" class="size-4 opacity-60" />
                </template>
                <template v-else-if="visual(seatById.get(`${r}-${c - 1}`)!.id) === 'held'">
                  <Icon name="lucide:clock" class="size-4 opacity-70" />
                </template>
                <template v-else-if="visual(seatById.get(`${r}-${c - 1}`)!.id) === 'selected'">
                  <span class="flex flex-col items-center leading-none">
                    <span class="mono">{{ seatById.get(`${r}-${c - 1}`)!.id }}</span>
                    <Icon name="lucide:check" class="mt-0.5 size-3.5" />
                  </span>
                </template>
                <template v-else-if="visual(seatById.get(`${r}-${c - 1}`)!.id) === 'mine'">
                  <span class="mono">{{ seatById.get(`${r}-${c - 1}`)!.id }}</span>
                  <span class="pointer-events-none absolute inset-0 rounded-xl border-2 border-secondary" style="animation: pulse-ring 1.8s ease-out infinite" aria-hidden="true" />
                </template>
                <span v-else class="mono">{{ seatById.get(`${r}-${c - 1}`)!.id }}</span>
              </component>
            </template>
          </template>
        </template>
      </div>
    </div>

    <ul class="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm" :aria-label="$t('plan.legend')">
      <li class="flex items-center gap-2"><i class="seat-chip seat-free" />{{ $t('plan.free') }}</li>
      <li v-if="!readonly" class="flex items-center gap-2"><i class="seat-chip seat-selected" />{{ $t('plan.selected') }}</li>
      <li v-else class="flex items-center gap-2"><i class="seat-chip seat-mine" />{{ $t('plan.yours') }}</li>
      <li class="flex items-center gap-2"><i class="seat-chip seat-taken" />{{ $t('plan.taken') }}</li>
      <li v-if="!readonly" class="flex items-center gap-2"><i class="seat-chip seat-held" />{{ $t('plan.held') }}</li>
    </ul>
  </div>
</template>

<style scoped>
.seat {
  border-color: var(--line-strong);
  background: var(--color-base-100);
  color: var(--color-base-content);
}
button.seat-free:hover {
  background: var(--color-base-200);
  border-color: var(--color-base-content);
  transform: translateY(-1px);
}
.seat-selected {
  background: var(--color-primary);
  color: var(--color-primary-content);
  border-color: var(--color-primary);
  animation: seat-pop 0.26s var(--ease-route);
}
.seat-mine {
  background: var(--color-secondary);
  color: var(--color-secondary-content);
  border-color: var(--color-secondary);
}
.seat-taken {
  border-color: transparent;
  background: var(--color-base-200);
  color: var(--muted);
  cursor: not-allowed;
}
.seat-held {
  border-style: dashed;
  border-color: color-mix(in oklab, var(--color-secondary) 70%, transparent);
  background: var(--amber-soft);
  cursor: not-allowed;
}
.seat-bed::before {
  content: '';
  position: absolute;
  top: 7px;
  left: 50%;
  width: 52%;
  height: 7px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: color-mix(in oklab, currentColor 22%, transparent);
}
.seat-chip {
  display: inline-block;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 0.4rem;
  border: 1px solid var(--line-strong);
}
.seat-chip.seat-selected,
.seat-chip.seat-mine {
  animation: none;
}
</style>
