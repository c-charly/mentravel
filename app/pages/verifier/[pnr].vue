<script setup lang="ts">
definePageMeta({ layout: 'tool' })
const route = useRoute()
const { t } = useI18n()
const pnr = computed(() => String(route.params.pnr ?? '').toUpperCase())
useSeoMeta({ title: () => `${t('verify.title')} ${pnr.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <div>
    <NuxtLinkLocale to="/verifier" class="btn btn-ghost btn-sm mb-4">
      <Icon name="lucide:arrow-left" class="size-4" />{{ $t('verify.another') }}
    </NuxtLinkLocale>
    <h1 class="display mb-8 text-3xl sm:text-4xl">{{ $t('verify.title') }}</h1>
    <TicketResult :pnr="pnr" verify />
  </div>
</template>
