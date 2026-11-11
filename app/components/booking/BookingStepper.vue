<script setup lang="ts">
// Stepper compact: quatre etapes, l'etape courante est nommee, les etapes passees se rouvrent d'un clic.
import type { BookingStep } from '~/stores/booking'

defineProps<{ compact?: boolean }>()
const store = useBookingStore()
const { go } = useBookingNav()
const { t } = useI18n()

const steps: { key: string; target: BookingStep; matches: BookingStep[] }[] = [
  { key: 'depart', target: 'horaire', matches: ['date', 'horaire'] },
  { key: 'sieges', target: 'sieges', matches: ['sieges'] },
  { key: 'voyageur', target: 'titulaire', matches: ['titulaire'] },
  { key: 'paiement', target: 'paiement', matches: ['paiement'] },
]
const finished = computed(() => store.step === 'billet')
const current = computed(() => (finished.value ? steps.length : Math.max(0, steps.findIndex((s) => s.matches.includes(store.step)))))
const label = computed(() => (finished.value ? t('booking.stepper.done') : t(`booking.stepper.${steps[current.value]!.key}`)))

function jump(i: number) {
  const s = steps[i]!
  if (finished.value || i >= current.value || !store.canGo(s.target)) return
  void go(s.target)
}
</script>

<template>
  <!-- Mobile et tablette: points et etape courante -->
  <div v-if="compact" class="flex items-center justify-center gap-3 py-2.5" :aria-label="$t('booking.progress')" role="group">
    <ol class="flex items-center gap-1.5">
      <li v-for="(s, i) in steps" :key="s.key" class="h-1.5 rounded-full transition-all duration-500" :class="i < current ? 'w-3 bg-primary' : i === current ? 'w-6 bg-primary' : 'w-3 bg-base-300'" />
    </ol>
    <p class="text-sm" aria-live="polite">
      <span class="font-semibold">{{ label }}</span>
      <span v-if="!finished" class="ml-1.5 text-muted">{{ $t('booking.stepOf', { n: current + 1, total: steps.length }) }}</span>
    </p>
  </div>

  <!-- Bureau: pastilles numerotees et libelles -->
  <nav v-else :aria-label="$t('booking.progress')">
    <ol class="flex items-center">
      <li v-for="(s, i) in steps" :key="s.key" class="flex items-center">
        <button
          type="button"
          class="group flex items-center gap-2.5 rounded-full py-1 pr-3 text-sm transition-colors"
          :class="i < current ? 'cursor-pointer' : 'cursor-default'"
          :disabled="finished || i >= current || !store.canGo(s.target)"
          :aria-current="i === current && !finished ? 'step' : undefined"
          @click="jump(i)"
        >
          <span
            class="grid size-7 place-items-center rounded-full text-xs font-bold transition-colors"
            :class="
              i < current
                ? 'bg-primary text-primary-content'
                : i === current
                  ? 'bg-primary text-primary-content ring-4 ring-primary/15'
                  : 'border border-[var(--line-strong)] text-muted'
            "
          >
            <Icon v-if="i < current" name="lucide:check" class="size-3.5" />
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span :class="i === current && !finished ? 'font-semibold' : i < current ? 'font-medium group-hover:underline' : 'text-muted'">
            {{ $t(`booking.stepper.${s.key}`) }}
          </span>
        </button>
        <span v-if="i < steps.length - 1" class="mx-1 h-px w-7 transition-colors duration-500" :class="i < current ? 'bg-primary' : 'bg-base-300'" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>
