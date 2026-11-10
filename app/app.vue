<script setup lang="ts">
const { dataTheme } = useThemePref()
const i18nHead = useLocaleHead({ seo: true })

useHead({
  htmlAttrs: {
    lang: () => i18nHead.value.htmlAttrs?.lang,
    'data-theme': () => dataTheme.value,
  },
  link: computed(() => i18nHead.value.link ?? []),
  meta: computed(() => i18nHead.value.meta ?? []),
  script: [{ innerHTML: "document.documentElement.classList.add('js')", tagPosition: 'head' }],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
