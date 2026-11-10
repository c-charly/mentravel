<script setup lang="ts">
import { BAGGAGE } from '~~/content/editorial'
const { t } = useI18n()
useSeoMeta({ title: () => t('legal.baggageTitle'), description: () => t('legal.baggageDescription') })
</script>

<template>
  <LegalPage :title="$t('legal.baggageTitle')" :intro="$t('legal.baggageIntro')" :sections="BAGGAGE" />
</template>
