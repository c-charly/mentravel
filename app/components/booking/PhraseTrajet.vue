<script setup lang="ts">
// Selecteur de trajet: deux villes, un bouton pour inverser, et le choix aller simple ou aller-retour.
import { CITIES, CITY_IDS } from '~~/content/network'
import type { CityId } from '#shared/types'

const props = defineProps<{ locked?: boolean; showTrip?: boolean }>()
const emit = defineEmits<{ change: [] }>()

const store = useBookingStore()
const { city } = useL10n()
const picker = ref<HTMLDialogElement | null>(null)
const editing = ref<'from' | 'to'>('from')
const swapTurns = ref(0)

const colors: Record<CityId, string> = { yaounde: 'var(--yde)', douala: 'var(--dla)', kribi: 'var(--kri)' }

function openPicker(which: 'from' | 'to') {
  if (props.locked) return
  editing.value = which
  picker.value?.showModal()
}

function choose(id: CityId) {
  if (editing.value === 'from') {
    if (id === store.to) store.swapCities()
    else store.setCities(id, store.to)
  } else if (id === store.from) {
    store.swapCities()
  } else {
    store.setCities(store.from, id)
  }
  picker.value?.close()
  emit('change')
}

function swap() {
  if (props.locked) return
  swapTurns.value += 1
  store.swapCities()
  emit('change')
}

const current = computed(() => (editing.value === 'from' ? store.from : store.to))
const other = computed(() => (editing.value === 'from' ? store.to : store.from))
</script>

<template>
  <div>
    <div class="surface flex flex-wrap items-stretch gap-1 p-1.5 sm:flex-nowrap">
      <button
        type="button"
        class="min-w-0 flex-1 basis-[38%] rounded-2xl px-4 py-2.5 text-left transition-colors enabled:hover:bg-base-200"
        :disabled="locked"
        :aria-label="`${$t('booking.phraseFrom')} ${city(store.from)}. ${$t('booking.changeCity')}`"
        @click="openPicker('from')"
      >
        <span class="block text-xs font-medium text-muted">{{ $t('search.from') }}</span>
        <span class="flex items-center gap-2 text-base font-semibold">
          <i class="size-2.5 shrink-0 rounded-full" :style="{ background: colors[store.from] }" />{{ city(store.from) }}
        </span>
      </button>

      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center self-center rounded-full border border-line bg-base-100 text-muted transition-colors enabled:hover:text-base-content"
        :disabled="locked"
        :aria-label="$t('booking.swap')"
        @click="swap"
      >
        <Icon name="lucide:arrow-left-right" class="size-4 transition-transform duration-500 ease-route" :style="{ transform: `rotate(${swapTurns * 180}deg)` }" />
      </button>

      <button
        type="button"
        class="min-w-0 flex-1 basis-[38%] rounded-2xl px-4 py-2.5 text-left transition-colors enabled:hover:bg-base-200"
        :disabled="locked"
        :aria-label="`${$t('booking.phraseTo')} ${city(store.to)}. ${$t('booking.changeCity')}`"
        @click="openPicker('to')"
      >
        <span class="block text-xs font-medium text-muted">{{ $t('search.to') }}</span>
        <span class="flex items-center gap-2 text-base font-semibold">
          <i class="size-2.5 shrink-0 rounded-full" :style="{ background: colors[store.to] }" />{{ city(store.to) }}
        </span>
      </button>

      <div
        v-if="showTrip"
        class="flex w-full shrink-0 rounded-2xl bg-base-200 p-1 sm:ml-1 sm:w-auto"
        role="group"
        :aria-label="$t('booking.tripType')"
      >
        <button
          type="button"
          class="flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none"
          :class="!store.roundTrip ? 'bg-base-100 shadow-[var(--shadow-soft)]' : 'text-muted'"
          :aria-pressed="!store.roundTrip"
          @click="store.setRoundTrip(false)"
        >
          {{ $t('booking.oneWay') }}
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none"
          :class="store.roundTrip ? 'bg-base-100 shadow-[var(--shadow-soft)]' : 'text-muted'"
          :aria-pressed="store.roundTrip"
          @click="store.setRoundTrip(true)"
        >
          {{ $t('booking.addReturn') }}
        </button>
      </div>
    </div>

    <dialog ref="picker" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box">
        <h2 class="display text-2xl">{{ editing === 'from' ? $t('booking.pickFrom') : $t('booking.pickTo') }}</h2>
        <ul class="mt-5 grid gap-2">
          <li v-for="id in CITY_IDS" :key="id">
            <button
              type="button"
              class="flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors hover:bg-base-200"
              :class="id === current ? 'border-base-content' : 'border-line'"
              @click="choose(id)"
            >
              <span class="size-3 shrink-0 rounded-full" :style="{ background: colors[id] }" />
              <span class="flex-1">
                <span class="block text-lg font-semibold">{{ city(id) }}</span>
                <span class="text-sm text-muted">{{ id === other ? $t('booking.swapHint') : CITIES[id].agency }}</span>
              </span>
              <Icon v-if="id === current" name="lucide:check" class="size-5" />
            </button>
          </li>
        </ul>
        <div class="modal-action">
          <form method="dialog"><button class="btn btn-ghost">{{ $t('nav.close') }}</button></form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>{{ $t('nav.close') }}</button></form>
    </dialog>
  </div>
</template>
