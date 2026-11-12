<script setup lang="ts">
import { ABOUT } from '~~/content/editorial'
import { BRAND, CITIES, CITY_IDS } from '~~/content/network'

const { t } = useI18n()
const { loc } = useL10n()
useSeoMeta({ title: () => t('about.seoTitle'), description: () => loc(ABOUT.lead) })
const soft = { yaounde: 'var(--yde-soft)', douala: 'var(--dla-soft)', kribi: 'var(--kri-soft)' } as const
const ink = { yaounde: 'var(--yde-ink)', douala: 'var(--dla-ink)', kribi: 'var(--kri-ink)' } as const
</script>

<template>
  <div>
    <PageHeader :title="loc(ABOUT.title)" :lead="loc(ABOUT.lead)" :eyebrow="BRAND.name" />

    <section class="mx-auto grid max-w-7xl gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-2 lg:items-center">
      <div v-reveal.left><MediaFrame id="fleet-double-deck" rounded parallax /></div>
      <div v-stagger="{ each: 0.16, y: 26 }" class="grid gap-5 text-lg text-muted">
        <p v-for="(p, i) in ABOUT.story" :key="i">{{ loc(p) }}</p>
      </div>
    </section>

    <section class="border-y border-line">
      <dl v-stagger="{ each: 0.12, y: 30 }" class="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(f, i) in ABOUT.figures" :key="i">
          <dd class="display text-4xl">{{ loc(f.value) }}</dd>
          <dt class="mt-1 text-sm text-muted">{{ loc(f.label) }}</dt>
        </div>
      </dl>
    </section>

    <section class="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <h2 v-reveal class="display t-title">{{ loc(ABOUT.agenciesTitle) }}</h2>
      <ul v-stagger="{ each: 0.14, y: 40 }" class="mt-10 grid gap-5 sm:grid-cols-3">
        <li v-for="id in CITY_IDS" :key="id" class="surface p-6">
          <span class="grid size-10 place-items-center rounded-2xl" :style="{ background: soft[id], color: ink[id] }"><Icon name="lucide:map-pin" class="size-5" /></span>
          <h3 class="display mt-5 text-xl">{{ CITIES[id].name }}</h3>
          <p class="mt-1 text-muted">{{ CITIES[id].agency }}</p>
          <p class="mt-3 text-sm text-muted">{{ loc(BRAND.hours) }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>
