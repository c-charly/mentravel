// Types des directives d'animation (plugins/motion.ts) pour vue-tsc.
import type { ObjectDirective } from 'vue'
import type { ParallaxOptions, StaggerOptions } from '~/directives/shared'

declare module 'vue' {
  interface GlobalDirectives {
    vReveal: ObjectDirective<HTMLElement, StaggerOptions | undefined>
    vStagger: ObjectDirective<HTMLElement, StaggerOptions | undefined>
    vParallax: ObjectDirective<HTMLElement, ParallaxOptions | false | undefined>
    vAccordion: ObjectDirective<HTMLDetailsElement>
  }
}

export {}
