<script setup lang="ts">
// En-tete commun des pages interieures: titre, introduction, halos doux.
defineProps<{ title: string; lead?: string; eyebrow?: string }>()
</script>

<template>
  <section class="hero-soft -mt-16 pt-16">
    <div class="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
      <span v-if="eyebrow" class="chip surface !shadow-none">{{ eyebrow }}</span>
      <h1 class="display mt-5 max-w-4xl text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.04] tracking-[-0.04em]">{{ title }}</h1>
      <p v-if="lead" class="t-sub mt-5 max-w-2xl text-muted">{{ lead }}</p>
      <slot />
    </div>
  </section>
</template>
