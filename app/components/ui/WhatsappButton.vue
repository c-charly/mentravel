<script setup lang="ts">
const config = useRuntimeConfig()
const { t } = useI18n()
const href = computed(
  () => `https://wa.me/${config.public.whatsappNumber}?text=${encodeURIComponent(t('whatsapp.hello'))}`,
)
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener"
    class="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-[#1fa855] text-white shadow-[var(--shadow-lift)] transition-transform hover:scale-105 print:hidden"
    :aria-label="$t('whatsapp.label')"
  >
    <Icon name="simple-icons:whatsapp" class="size-6" />
  </a>
</template>
