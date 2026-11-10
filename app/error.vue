<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error.statusCode === 404)
const localePath = useLocalePath()
const { t } = useI18n()
useHead({ title: () => (is404.value ? t('error.title404') : t('error.title500')) })
const home = () => clearError({ redirect: localePath('/') })
</script>

<template>
  <div class="hero-soft grid min-h-dvh place-items-center px-6">
    <div class="max-w-xl text-center">
      <p class="display text-[clamp(5rem,16vw,9rem)] leading-none text-base-content/15">{{ error.statusCode }}</p>
      <h1 class="display -mt-2 text-3xl sm:text-4xl">{{ is404 ? $t('error.title404') : $t('error.title500') }}</h1>
      <p class="mt-4 text-lg text-muted">{{ is404 ? $t('error.text404') : $t('error.text500') }}</p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" class="btn btn-primary btn-lg" @click="home">{{ $t('error.home') }}</button>
        <NuxtLink :to="localePath('/reserver')" class="btn btn-outline btn-lg" @click="clearError()">{{ $t('nav.book') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>
