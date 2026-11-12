<script setup lang="ts">
import type { LegalSection } from '~~/content/editorial'

defineProps<{ title: string; intro?: string; sections: LegalSection[] }>()
const { loc } = useL10n()
</script>

<template>
  <div>
    <PageHeader :title="title" :lead="intro" />
    <div class="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
      <div class="grid gap-12">
        <section v-for="(s, i) in sections" :key="i" v-reveal :aria-labelledby="`s${i}`">
          <h2 :id="`s${i}`" class="display text-xl sm:text-2xl">{{ loc(s.title) }}</h2>
          <p v-for="(p, j) in s.body" :key="j" class="mt-3 max-w-prose text-lg text-muted">{{ loc(p) }}</p>
        </section>
      </div>
      <NuxtLinkLocale to="/aide" class="btn btn-outline mt-14">
        <Icon name="lucide:headset" class="size-5" />{{ $t('legal.contactUs') }}
      </NuxtLinkLocale>
    </div>
  </div>
</template>
