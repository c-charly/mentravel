<script setup lang="ts">
import { ONBOARD } from '~~/content/editorial'

const { t } = useI18n()
const { loc } = useL10n()
useSeoMeta({ title: () => t('onboard.seoTitle'), description: () => loc(ONBOARD.lead) })
</script>

<template>
  <div>
    <PageHeader :title="loc(ONBOARD.title)" :lead="loc(ONBOARD.lead)" />

    <div class="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
      <ul class="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="p in ONBOARD.panels" :key="p.id">
          <MediaFrame :id="p.id" rounded />
          <div class="mt-5 flex items-start gap-3.5">
            <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-base-200"><Icon :name="p.icon" class="size-5" /></span>
            <div>
              <h2 class="display text-lg">{{ loc(p.title) }}</h2>
              <p class="mt-1.5 text-muted">{{ loc(p.text) }}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <section class="bg-base-200/70 py-20">
      <div class="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 class="display t-title">{{ loc(ONBOARD.videosTitle) }}</h2>
        <div class="mt-10 grid gap-8 md:grid-cols-2">
          <figure v-for="(v, i) in ONBOARD.videos" :key="i">
            <MediaFrame :id="i === 0 ? 'meal-onboard' : 'entertainment'" rounded />
            <figcaption class="mt-4">
              <span class="display text-lg">{{ loc(v.title) }}</span>
              <span class="mt-1 block text-muted">{{ loc(v.text) }}</span>
            </figcaption>
          </figure>
        </div>
        <NuxtLinkLocale to="/reserver" class="btn btn-primary btn-lg mt-12">
          {{ $t('nav.book') }}<Icon name="lucide:arrow-right" class="size-5" />
        </NuxtLinkLocale>
      </div>
    </section>
  </div>
</template>
