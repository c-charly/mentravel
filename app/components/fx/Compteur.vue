<script setup lang="ts">
// Nombre formate (separateur de milliers et virgule decimale selon la langue) qui s'incremente de 0 a sa valeur
// quand il entre dans l'ecran. Le serveur rend la valeur finale: sans JavaScript ou avec mouvement reduit,
// le chiffre exact est la des le depart.
const props = defineProps<{ to: number; decimals?: number }>()
const { num } = useL10n()
const root = ref<HTMLElement | null>(null)
const shown = ref(props.to)
const text = computed(() => (props.decimals ? shown.value.toFixed(props.decimals).replace('.', ',') : num(Math.round(shown.value))))

useGsapScope(root, ({ gsap, ScrollTrigger, root: el }) => {
  const counter = { v: 0 }
  const stop = onceInView(ScrollTrigger, el, 'top 92%', () => {
    shown.value = 0
    gsap.to(counter, {
      v: props.to,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => {
        shown.value = counter.v
      },
      onComplete: () => {
        shown.value = props.to
      },
    })
  })
  return () => {
    stop()
    gsap.killTweensOf(counter)
  }
})
</script>

<template>
  <span ref="root" class="tnum">{{ text }}</span>
</template>
