// v-stagger: les enfants directs apparaissent l'un apres l'autre quand le parent entre dans l'ecran.
// Memes modificateurs et options que v-reveal, plus `each` (ecart en secondes entre deux enfants).
// Pour un tableau, poser la directive sur <tbody> (ses enfants sont les lignes).
import type { ObjectDirective } from 'vue'
import { canAnimate, onceInView } from '~/utils/motion'
import { resolveReveal, withGsap } from './shared'
import type { StaggerOptions } from './shared'

const cleanups = new WeakMap<HTMLElement, () => void>()

export const vStagger: ObjectDirective<HTMLElement, StaggerOptions | undefined> = {
  created(el) {
    el.setAttribute('data-stagger', '')
  },
  mounted(el, binding) {
    if (!canAnimate()) {
      el.setAttribute('data-stagger-done', '')
      return
    }
    const o = resolveReveal(binding)
    cleanups.set(
      el,
      withGsap(el, ({ gsap, ScrollTrigger }) => {
        let kids: HTMLElement[] = []
        const play = () => {
          // Les enfants sont lus au moment de jouer: ceux ajoutes entre-temps sont pris en compte
          kids = Array.from(el.children) as HTMLElement[]
          if (!kids.length) {
            el.setAttribute('data-stagger-done', '')
            return
          }
          gsap.fromTo(
            kids,
            { opacity: 0, x: o.x, y: o.y, scale: o.scale, rotate: o.rotate },
            {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              rotate: 0,
              duration: o.duration,
              delay: o.delay,
              ease: o.ease,
              stagger: o.each,
              onComplete: () => {
                el.setAttribute('data-stagger-done', '')
                gsap.set(kids, { clearProps: 'opacity,transform' })
              },
            },
          )
        }
        if (o.now) {
          play()
          return () => gsap.killTweensOf(kids)
        }
        const stop = onceInView(ScrollTrigger, el, o.start, play)
        return () => {
          stop()
          gsap.killTweensOf(kids)
        }
      }),
    )
  },
  beforeUnmount(el) {
    cleanups.get(el)?.()
    cleanups.delete(el)
  },
  getSSRProps: () => ({ 'data-stagger': '' }),
}
