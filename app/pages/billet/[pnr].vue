<script setup lang="ts">
definePageMeta({ layout: 'tool' })
const route = useRoute()
const { t } = useI18n()
const pnr = computed(() => String(route.params.pnr ?? '').toUpperCase())
const token = computed(() => (typeof route.query.t === 'string' ? route.query.t : undefined))
useSeoMeta({ title: () => `${t('ticket.pageTitle')} ${pnr.value}`, robots: 'noindex, nofollow' })
</script>

<template>
  <div>
    <h1 class="display mb-8 text-3xl sm:text-4xl">{{ $t('ticket.pageTitle') }}</h1>
    <TicketResult :pnr="pnr" :token="token" />
  </div>
</template>
