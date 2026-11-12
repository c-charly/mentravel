// v-accordion: ouverture et fermeture en douceur d'un <details>.
// Le comportement natif est conserve (clavier, lecteurs d'ecran, recherche dans la page);
// si GSAP n'est pas encore charge ou si le mouvement est reduit, le <details> reste instantane.
import type { ObjectDirective } from 'vue'
import { canAnimate, gsapIfReady } from './shared'

const handlers = new WeakMap<HTMLElement, { summary: Element; onClick: (e: Event) => void }>()

export const vAccordion: ObjectDirective<HTMLDetailsElement> = {
  mounted(el) {
    if (!canAnimate()) return
    const summary = el.querySelector('summary')
    if (!summary) return

    const onClick = (e: Event) => {
      const mods = gsapIfReady()
      if (!mods || !canAnimate()) return
      e.preventDefault()
      const { gsap } = mods
      const content = Array.from(el.children).filter((c) => c !== summary) as HTMLElement[]
      if (!content.length) {
        el.open = !el.open
        return
      }

      if (el.open) {
        el.classList.add('is-closing')
        gsap.to(content, {
          height: 0,
          opacity: 0,
          marginTop: 0,
          overflow: 'hidden',
          duration: 0.32,
          ease: 'power2.inOut',
          overwrite: true,
          onComplete: () => {
            el.open = false
            el.classList.remove('is-closing')
            gsap.set(content, { clearProps: 'all' })
          },
        })
      } else {
        el.classList.remove('is-closing')
        el.open = true
        const margins = content.map((c) => getComputedStyle(c).marginTop)
        content.forEach((c, i) => {
          gsap.fromTo(
            c,
            { height: 0, opacity: 0, marginTop: 0, overflow: 'hidden' },
            {
              height: 'auto',
              opacity: 1,
              marginTop: margins[i],
              duration: 0.42,
              ease: 'power2.out',
              overwrite: true,
              onComplete: () => {
                gsap.set(c, { clearProps: 'all' })
              },
            },
          )
        })
      }
    }

    summary.addEventListener('click', onClick)
    handlers.set(el, { summary, onClick })
  },
  beforeUnmount(el) {
    const h = handlers.get(el)
    h?.summary.removeEventListener('click', h.onClick)
    handlers.delete(el)
  },
}
