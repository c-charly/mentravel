<script setup lang="ts">
// Nombre formate (separateur de milliers et virgule decimale selon la langue).
const props = defineProps<{ to: number; decimals?: number }>()
const { num } = useL10n()
const text = computed(() => (props.decimals ? props.to.toFixed(props.decimals).replace('.', ',') : num(Math.round(props.to))))
</script>

<template>
  <span class="tnum">{{ text }}</span>
</template>
