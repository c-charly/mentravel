// v-parallax: l'element se deplace lentement pendant le defilement (effet de profondeur).
// A poser sur une image ou un visuel place dans un cadre overflow-hidden: il est agrandi juste
// assez pour que le cadre reste toujours rempli. Valeur: { amount } en % de la hauteur (defaut 8).
import type { ObjectDirective } from 'vue'
import { canAnimate, withGsap } from './shared'
import type { ParallaxOptions } from './shared'

const cleanups = new WeakMap<HTMLElement, () => void>()

export const vParallax: ObjectDirective<HTMLElement, ParallaxOptions | false | undefined> = {
  mounted(el, binding) {
    if (binding.value === false || !canAnimate()) return
    const amount = binding.value?.amount ?? 8
    const scale = 1 + (amount * 2) / 100 + 0.01
    cleanups.set(
      el,
      withGsap(el, ({ gsap }) => {
        const tween = gsap.fromTo(
          el,
          { yPercent: -amount, scale },
          {
            yPercent: amount,
            scale,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
        return () => {
          tween.scrollTrigger?.kill()
          tween.kill()
        }
      }),
    )
  },
  beforeUnmount(el) {
    cleanups.get(el)?.()
    cleanups.delete(el)
  },
}
