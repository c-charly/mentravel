<script setup lang="ts">
import { PRIVACY } from '~~/content/editorial'
const { t } = useI18n()
useSeoMeta({ title: () => t('legal.privacyTitle'), description: () => t('legal.privacyDescription') })
</script>

<template>
  <LegalPage :title="$t('legal.privacyTitle')" :intro="$t('legal.privacyIntro')" :sections="PRIVACY" />
</template>
