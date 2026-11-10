<script setup lang="ts">
import { TERMS } from '~~/content/editorial'
const { t } = useI18n()
useSeoMeta({ title: () => t('legal.termsTitle'), description: () => t('legal.termsDescription') })
</script>

<template>
  <LegalPage :title="$t('legal.termsTitle')" :intro="$t('legal.termsIntro')" :sections="TERMS" />
</template>
