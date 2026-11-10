<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>

<template>
  <span class="inline-flex items-center gap-2.5" aria-label="MEN TRAVEL">
    <span class="grid size-8 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-content">
      <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55" />
        <circle cx="5" cy="12" r="2.6" style="fill: var(--yde)" />
        <circle cx="12" cy="12" r="2.6" style="fill: var(--dla)" />
        <circle cx="19" cy="12" r="2.6" style="fill: var(--kri)" />
      </svg>
    </span>
    <span v-if="!compact" class="text-[0.95rem] font-bold tracking-tight">MEN TRAVEL</span>
  </span>
</template>
