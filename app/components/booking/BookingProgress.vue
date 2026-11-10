<script setup lang="ts">
// Progression: cinq segments fins, l'etape courante est annoncee en clair.
import { STEP_ORDER, type BookingStep } from '~/stores/booking'

const store = useBookingStore()
const { go } = useBookingNav()
const { t } = useI18n()

const visible: BookingStep[] = ['date', 'horaire', 'sieges', 'titulaire', 'paiement']
const currentIdx = computed(() => Math.min(STEP_ORDER.indexOf(store.step), visible.length))
const legTag = computed(() =>
  store.roundTrip && ['date', 'horaire', 'sieges'].includes(store.step)
    ? ` (${store.activeLeg === 0 ? t('booking.outbound') : t('booking.inbound')})`
    : '',
)

function jump(step: BookingStep) {
  if (!store.canGo(step) || step === store.step) return
  void go(step)
}
</script>

<template>
  <nav class="mx-auto max-w-6xl px-5 pb-3" :aria-label="$t('booking.progress')">
    <ol class="flex gap-1.5">
      <li v-for="(s, i) in visible" :key="s" class="flex-1">
        <button
          type="button"
          class="block h-1.5 w-full rounded-full transition-colors duration-500 disabled:cursor-default"
          :class="i < currentIdx ? 'bg-primary' : i === currentIdx ? 'bg-primary/50' : 'bg-base-300'"
          :disabled="!store.canGo(s)"
          :aria-current="i === currentIdx ? 'step' : undefined"
          :aria-label="$t(`booking.steps.${s}`)"
          @click="jump(s)"
        />
      </li>
    </ol>
    <p class="mt-2 text-sm font-semibold" aria-live="polite">
      {{ $t(`booking.steps.${store.step}`) }}{{ legTag }}
      <span v-if="store.step !== 'billet'" class="font-normal text-muted">
        {{ $t('booking.stepOf', { n: Math.min(currentIdx + 1, visible.length), total: visible.length }) }}
      </span>
    </p>
  </nav>
</template>
