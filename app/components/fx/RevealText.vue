<script setup lang="ts">
// Revele un texte mot par mot (le mot monte depuis un masque) quand il entre dans l'ecran.
// Les mots sont rendus par le serveur et l'etat initial est masque par le CSS (data-split): sans JavaScript,
// avec mouvement reduit ou si GSAP ne charge pas, le texte reste visible. Rejoue quand le texte change.
// `step`: ecart entre deux mots en ms; `delay`: delai en secondes; `now`: joue sans attendre le defilement.
type Mods = Awaited<ReturnType<typeof loadGsap>>

const props = defineProps<{ text: string; tag?: string; step?: number; delay?: number; now?: boolean }>()
const root = ref<HTMLElement | null>(null)
const words = computed(() => props.text.split(' '))
let mods: Mods | null = null
let stop: (() => void) | null = null

const wordEls = () => root.value?.querySelectorAll('.reveal-word') ?? []

function play(immediate: boolean) {
  const el = root.value
  if (!el || !mods) return
  const { gsap, ScrollTrigger } = mods
  const run = () => {
    const targets = wordEls()
    gsap.fromTo(
      targets,
      { yPercent: 130, visibility: 'visible' },
      {
        yPercent: 0,
        duration: 0.95,
        ease: 'power4.out',
        stagger: (props.step ?? 40) / 1000,
        delay: props.delay ?? 0,
        onComplete: () => {
          el.setAttribute('data-split-done', '')
          gsap.set(targets, { clearProps: 'transform,visibility' })
        },
      },
    )
  }
  if (immediate) {
    run()
    return
  }
  stop = onceInView(ScrollTrigger, el, 'top 90%', run)
}

onMounted(async () => {
  const el = root.value
  if (!el) return
  if (!canAnimate()) {
    el.setAttribute('data-split-done', '')
    return
  }
  mods = await loadGsap().catch(() => null)
  if (!root.value) return
  if (!mods || !canAnimate()) {
    el.setAttribute('data-split-done', '')
    return
  }
  play(Boolean(props.now))
})

// Le texte change (autre langue, etape suivante): on rejoue l'entree des mots
watch(
  () => props.text,
  async () => {
    const el = root.value
    if (!el || !mods || !canAnimate()) return
    stop?.()
    mods.gsap.killTweensOf(wordEls())
    el.removeAttribute('data-split-done')
    await nextTick()
    play(true)
  },
)

onBeforeUnmount(() => {
  stop?.()
  mods?.gsap.killTweensOf(wordEls())
})
</script>

<template>
  <component :is="tag ?? 'p'" ref="root" data-split :aria-label="text">
    <template v-for="(w, i) in words" :key="i">
      <span class="word-mask" aria-hidden="true"><span class="reveal-word">{{ w }}</span></span><template v-if="i < words.length - 1">{{ ' ' }}</template>
    </template>
  </component>
</template>
