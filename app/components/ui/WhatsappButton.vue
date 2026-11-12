<script setup lang="ts">
const config = useRuntimeConfig()
const { t } = useI18n()
const href = computed(
  () => `https://wa.me/${config.public.whatsappNumber}?text=${encodeURIComponent(t('whatsapp.hello'))}`,
)

// Apparition en rebond apres l'arrivee, puis quelques ondes discretes pour attirer l'oeil (quatre, pas plus)
const root = ref<HTMLElement | null>(null)
useGsapScope(root, ({ gsap, root: el }) => {
  const ring = el.querySelector('[data-ring]')
  if (!ring) return
  gsap.fromTo(
    ring,
    { scale: 1, opacity: 0.45 },
    { scale: 1.9, opacity: 0, duration: 1.4, ease: 'power2.out', repeat: 3, repeatDelay: 0.8, delay: 2.4 },
  )
})
</script>

<template>
  <div ref="root" v-reveal.scale.now="{ delay: 1.2, y: 0, scale: 0.4, ease: 'back.out(2.2)', duration: 0.8 }" class="fixed bottom-5 right-5 z-40 print:hidden">
    <span data-ring class="pointer-events-none absolute inset-0 rounded-full bg-[#1fa855] opacity-0" aria-hidden="true" />
    <a
      :href="href"
      target="_blank"
      rel="noopener"
      class="relative grid size-12 place-items-center rounded-full bg-[#1fa855] text-white shadow-[var(--shadow-lift)] transition-transform hover:scale-105"
      :aria-label="$t('whatsapp.label')"
    >
      <Icon name="simple-icons:whatsapp" class="size-6" />
    </a>
  </div>
</template>
