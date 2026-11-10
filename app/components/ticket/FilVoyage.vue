<script setup lang="ts">
// Le fil du voyage: de la reservation a l'arrivee.
import type { JourneyStage } from '#shared/types'

const props = defineProps<{ stage: JourneyStage }>()
const stages: JourneyStage[] = ['reserved', 'paid', 'boarding', 'enroute', 'arrived']
const icons: Record<JourneyStage, string> = {
  reserved: 'lucide:ticket',
  paid: 'lucide:wallet',
  boarding: 'lucide:door-open',
  enroute: 'lucide:bus',
  arrived: 'lucide:map-pin',
}
const idx = computed(() => stages.indexOf(props.stage))
</script>

<template>
  <ol class="grid gap-0 sm:grid-cols-5" :aria-label="$t('journey.title')">
    <li
      v-for="(s, i) in stages"
      :key="s"
      class="relative flex items-center gap-3 pb-5 sm:flex-col sm:items-start sm:gap-2.5 sm:pb-0"
      :aria-current="i === idx ? 'step' : undefined"
    >
      <span
        v-if="i < stages.length - 1"
        class="absolute left-[1.05rem] top-9 h-[calc(100%-1.4rem)] w-0.5 sm:left-11 sm:top-[1.05rem] sm:h-0.5 sm:w-[calc(100%-2.5rem)]"
        :class="i < idx ? 'bg-primary' : 'bg-base-300'"
        aria-hidden="true"
      />
      <span
        class="relative z-10 grid size-9 shrink-0 place-items-center rounded-full transition-colors"
        :class="
          i < idx
            ? 'bg-primary text-primary-content'
            : i === idx
              ? 'bg-secondary text-secondary-content ring-4 ring-secondary/25'
              : 'bg-base-200 text-muted'
        "
      >
        <Icon :name="icons[s]" class="size-[1.1rem]" />
      </span>
      <span class="text-sm" :class="i === idx ? 'font-semibold' : i < idx ? '' : 'text-muted'">
        {{ $t(`journey.${s}`) }}
        <span v-if="i === idx" class="sr-only">({{ $t('journey.current') }})</span>
      </span>
    </li>
  </ol>
</template>
