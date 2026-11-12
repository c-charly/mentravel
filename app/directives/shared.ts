// Outils communs aux directives d'animation.
import type { DirectiveBinding } from 'vue'
import { loadGsap } from '~/composables/useGsap'
import { canAnimate } from '~/utils/motion'

export type Mods = Awaited<ReturnType<typeof loadGsap>>

export interface RevealOptions {
  /** Decalage horizontal de depart, en px */
  x?: number
  /** Decalage vertical de depart, en px (negatif: vient du haut) */
  y?: number
  scale?: number
  rotate?: number
  /** Delai en secondes */
  delay?: number
  duration?: number
  ease?: string
  /** Position ScrollTrigger de declenchement, ex: "top 88%" */
  start?: string
  /** Joue tout de suite, sans attendre le defilement (haut de page, elements fixes) */
  now?: boolean
}

export interface StaggerOptions extends RevealOptions {
  /** Ecart en secondes entre deux enfants */
  each?: number
}

export interface ParallaxOptions {
  /** Amplitude du deplacement en % de la hauteur de l'element (defaut 8) */
  amount?: number
}

export type ResolvedReveal = Required<StaggerOptions>

// Modificateurs: .left .right .down .fade .scale .now ; la valeur passee a la directive l'emporte.
export function resolveReveal(binding: DirectiveBinding<StaggerOptions | undefined>): ResolvedReveal {
  const m = binding.modifiers
  const base: ResolvedReveal = {
    x: 0,
    y: 32,
    scale: 1,
    rotate: 0,
    delay: 0,
    duration: 0.9,
    ease: 'power3.out',
    start: 'top 88%',
    now: Boolean(m.now),
    each: 0.1,
  }
  if (m.left) Object.assign(base, { x: -48, y: 0 })
  else if (m.right) Object.assign(base, { x: 48, y: 0 })
  else if (m.down) base.y = -24
  else if (m.fade) base.y = 0
  if (m.scale) Object.assign(base, { scale: 0.92, y: Math.min(base.y, 16) })
  return { ...base, ...binding.value, now: base.now || Boolean(binding.value?.now) }
}

let ready: Mods | null = null
export function rememberGsap(mods: Mods) {
  ready = mods
}
// GSAP si deja charge, sinon null (les interactions se replient alors sur le comportement natif)
export function gsapIfReady() {
  return ready
}

// Execute `run` quand GSAP est pret, si l'element est toujours dans la page.
// Retourne une fonction de nettoyage a appeler au demontage.
export function withGsap(el: HTMLElement, run: (mods: Mods) => unknown): () => void {
  let cleanup: (() => void) | null = null
  let dead = false
  loadGsap()
    .then((mods) => {
      rememberGsap(mods)
      // GSAP peut arriver apres le delai de securite (connexion lente): la page est alors deja affichee
      // en statique, on ne l'anime pas apres coup.
      if (dead || !el.isConnected || !canAnimate()) return
      const out = run(mods)
      if (typeof out === 'function') cleanup = out as () => void
    })
    .catch(() => undefined)
  return () => {
    dead = true
    cleanup?.()
  }
}

export { canAnimate }
