<script setup lang="ts">
// En-tete commun des pages interieures: titre, introduction, halos doux. L'entree se joue des l'arrivee sur la page.
defineProps<{ title: string; lead?: string; eyebrow?: string }>()
</script>

<template>
  <section class="hero-soft -mt-16 pt-16">
    <div class="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
      <span v-if="eyebrow" v-reveal.now class="chip surface !shadow-none">{{ eyebrow }}</span>
      <RevealText tag="h1" :text="title" now :delay="0.08" class="display mt-5 max-w-4xl text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.04] tracking-[-0.04em]" />
      <p v-if="lead" v-reveal.now="{ delay: 0.35 }" class="t-sub mt-5 max-w-2xl text-muted">{{ lead }}</p>
      <div v-if="$slots.default" v-reveal.now="{ delay: 0.5 }"><slot /></div>
    </div>
  </section>
</template>
