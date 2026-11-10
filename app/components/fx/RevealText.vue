<script setup lang="ts">
// Revele un texte mot par mot quand il entre dans l'ecran.
// Sans JavaScript ou avec mouvement reduit, le texte reste visible (la classe "js" est posee dans le head).
const props = defineProps<{ text: string; tag?: string; step?: number }>()
const root = ref<HTMLElement | null>(null)
const shown = ref(false)
const words = computed(() => props.text.split(' '))

onMounted(() => {
  if (!motionAllowed()) {
    shown.value = true
    return
  }
  const { stop } = useIntersectionObserver(
    root,
    ([entry]) => {
      if (entry?.isIntersecting) {
        shown.value = true
        stop()
      }
    },
    { threshold: 0.3 },
  )
})
</script>

<template>
  <component :is="tag ?? 'p'" ref="root" :aria-label="text">
    <span v-for="(w, i) in words" :key="i" class="inline-block overflow-hidden align-bottom" aria-hidden="true">
      <span
        class="reveal-word inline-block"
        :class="shown ? 'is-shown' : ''"
        :style="{ transitionDelay: `${i * (step ?? 40)}ms` }"
      >{{ w }}</span><span v-if="i < words.length - 1">&nbsp;</span>
    </span>
  </component>
</template>
