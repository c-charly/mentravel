<script setup lang="ts">
import type { CityId } from '#shared/types'

defineProps<{ id: CityId; strong?: boolean }>()
const { city } = useL10n()
const color: Record<CityId, string> = {
  yaounde: 'var(--yde)',
  douala: 'var(--dla)',
  kribi: 'var(--kri)',
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5" :class="strong ? 'font-bold' : ''">
    <span class="inline-block size-2.5 rounded-full" :style="{ background: color[id] }" aria-hidden="true" />
    {{ city(id) }}
  </span>
</template>
