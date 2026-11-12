// v-reveal: l'element apparait (fondu + glissement) quand il entre dans l'ecran.
// Modificateurs: .left .right .down .fade .scale .now ; valeur: { x, y, scale, rotate, delay, duration, ease, start }.
// Etat initial masque par le CSS (data-reveal), pose aussi cote serveur pour eviter tout flash.
import type { ObjectDirective } from 'vue'
import { canAnimate, onceInView } from '~/utils/motion'
import { resolveReveal, withGsap } from './shared'
import type { StaggerOptions } from './shared'

const cleanups = new WeakMap<HTMLElement, () => void>()

export const vReveal: ObjectDirective<HTMLElement, StaggerOptions | undefined> = {
  created(el) {
    el.setAttribute('data-reveal', '')
  },
  mounted(el, binding) {
    if (!canAnimate()) {
      el.setAttribute('data-reveal-done', '')
      return
    }
    const o = resolveReveal(binding)
    cleanups.set(
      el,
      withGsap(el, ({ gsap, ScrollTrigger }) => {
        const play = () => {
          gsap.fromTo(
            el,
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
              onComplete: () => {
                el.setAttribute('data-reveal-done', '')
                gsap.set(el, { clearProps: 'opacity,transform' })
              },
            },
          )
        }
        if (o.now) {
          play()
          return () => gsap.killTweensOf(el)
        }
        const stop = onceInView(ScrollTrigger, el, o.start, play)
        return () => {
          stop()
          gsap.killTweensOf(el)
        }
      }),
    )
  },
  beforeUnmount(el) {
    cleanups.get(el)?.()
    cleanups.delete(el)
  },
  getSSRProps: () => ({ 'data-reveal': '' }),
}
