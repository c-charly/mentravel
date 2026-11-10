<script setup lang="ts">
const { isNight, toggle } = useThemePref()
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const other = computed(() => (locales.value as { code: string }[]).find((l) => l.code !== locale.value)!)
</script>

<template>
  <div class="flex items-center gap-0.5">
    <NuxtLink
      :to="switchLocalePath(other.code as 'fr' | 'en')"
      class="btn btn-ghost btn-sm min-h-9 gap-1.5 px-3 text-muted hover:text-base-content"
      :aria-label="t('nav.switchLang')"
      :hreflang="other.code"
    >
      <Icon name="lucide:globe" class="size-4" />
      <span class="uppercase">{{ other.code }}</span>
    </NuxtLink>
    <button
      type="button"
      class="btn btn-ghost btn-circle btn-sm min-h-9 text-muted hover:text-base-content"
      :aria-label="isNight ? t('nav.lightMode') : t('nav.nightMode')"
      @click="toggle"
    >
      <Icon :name="isNight ? 'lucide:sun' : 'lucide:moon'" class="size-[1.1rem]" />
    </button>
  </div>
</template>
