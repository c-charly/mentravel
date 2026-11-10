<script setup lang="ts">
// Affiche une valeur masquee par le serveur: chaque asterisque devient un point visuel.
const props = defineProps<{ value: string }>()
const parts = computed(() => props.value.split(''))
</script>

<template>
  <span class="mono inline-flex flex-wrap items-center" :aria-label="$t('ticket.hidden')">
    <template v-for="(c, i) in parts" :key="i">
      <i v-if="c === '*'" class="mask-dot" aria-hidden="true" />
      <span v-else-if="c === ' '" class="inline-block w-[0.5ch]" aria-hidden="true" />
      <span v-else aria-hidden="true">{{ c }}</span>
    </template>
  </span>
</template>
