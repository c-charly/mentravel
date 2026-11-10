<script setup lang="ts">
// Compte a rebours de la retenue des sieges: anneau + temps, alerte a 2 minutes et a 30 secondes.
import { SETTINGS } from '~~/content/network'

const store = useBookingStore()
const { t } = useI18n()
const now = ref(Date.now())
const announce = ref('')

const { pause, resume } = useIntervalFn(() => (now.value = Date.now()), 1000, { immediate: false })
onMounted(() => {
  now.value = Date.now()
  resume()
})
onBeforeUnmount(pause)

const remainingSec = computed(() => Math.max(0, Math.ceil((store.holdExpiresAt - now.value) / 1000)))
const visible = computed(() => store.holdExpiresAt > 0 && store.step !== 'billet')
const mmss = computed(() => {
  const s = remainingSec.value
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})
const urgent = computed(() => remainingSec.value <= SETTINGS.alertSecondsLeft)
const circumference = 2 * Math.PI * 14
const dash = computed(() => {
  const full = SETTINGS.holdMinutes * 60
  return circumference * Math.min(1, remainingSec.value / full)
})

watch(remainingSec, (s, before) => {
  if (!visible.value || store.paying) return
  if (s <= 0 && before > 0) {
    store.markExpired()
    announce.value = t('booking.expiredShort')
  } else if (s === 120 || s === 60 || s === 30) {
    announce.value = t('booking.timeLeft', { time: mmss.value })
  }
})
</script>

<template>
  <div v-if="visible" class="flex items-center gap-2">
    <div
      v-if="store.paying"
      class="flex items-center gap-1.5 rounded-full bg-base-200 px-3 py-1.5 text-sm font-semibold"
    >
      <Icon name="lucide:loader" class="size-4 animate-spin" />
      {{ $t('booking.paymentRunning') }}
    </div>
    <div
      v-else
      class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
      :class="urgent ? 'bg-error/15 text-error' : 'bg-base-200'"
      role="timer"
      :aria-label="$t('booking.holdTimer')"
    >
      <svg viewBox="0 0 32 32" class="size-6 -rotate-90" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="`${dash} ${circumference}`"
          style="transition: stroke-dasharray 1s linear"
        />
      </svg>
      <span class="mono tnum">{{ mmss }}</span>
    </div>
    <span class="sr-only-live" aria-live="assertive">{{ announce }}</span>
  </div>
</template>
