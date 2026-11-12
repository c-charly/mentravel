// Animation propre a un composant: charge GSAP, execute `setup` dans un contexte GSAP
// (tweens et ScrollTriggers sont annules au demontage) et ne fait rien si le mouvement est reduit.
// `setup` peut renvoyer une fonction de nettoyage (ecouteurs, etc.).
// `onSkip` est appele si l'animation n'a pas lieu (mouvement reduit, GSAP indisponible): il doit rendre visible
// tout ce que le CSS masquait en attendant l'animation.
import type { Ref } from 'vue'

type Mods = Awaited<ReturnType<typeof loadGsap>>

export function useGsapScope(
  root: Ref<HTMLElement | null>,
  setup: (mods: Mods & { root: HTMLElement }) => unknown,
  onSkip?: (root: HTMLElement) => void,
) {
  let ctx: { revert: () => void } | null = null
  let cleanup: (() => void) | null = null
  let dead = false

  onBeforeUnmount(() => {
    dead = true
    cleanup?.()
    ctx?.revert()
  })

  onMounted(async () => {
    if (!canAnimate()) {
      if (root.value) onSkip?.(root.value)
      return
    }
    const mods = await loadGsap().catch(() => null)
    const el = root.value
    if (!el || dead) return
    if (!mods || !canAnimate()) {
      onSkip?.(el)
      return
    }
    ctx = mods.gsap.context(() => {
      const out = setup({ ...mods, root: el })
      if (typeof out === 'function') cleanup = out as () => void
    }, el)
  })
}
