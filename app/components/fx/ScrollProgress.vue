<script setup lang="ts">
// Fine barre ambre de progression de lecture, collee sous la barre de navigation.
// Invisible sans JavaScript ou avec mouvement reduit (elle reste a l'echelle 0).
const bar = ref<HTMLElement | null>(null)

useGsapScope(bar, ({ gsap, root }) => {
  const to = gsap.quickTo(root, 'scaleX', { duration: 0.3, ease: 'power2.out' })
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    to(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
  }
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
  // La hauteur de la page change avec le contenu (changement de page, donnees qui arrivent)
  const observer = new ResizeObserver(update)
  observer.observe(document.body)
  update()
  return () => {
    window.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)
    observer.disconnect()
  }
})
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]" aria-hidden="true">
    <div ref="bar" class="h-full w-full bg-secondary" style="transform: scaleX(0); transform-origin: 0 50%" />
  </div>
</template>
