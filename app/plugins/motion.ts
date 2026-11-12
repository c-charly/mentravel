// Animations GSAP: enregistre les directives v-reveal, v-stagger, v-parallax et v-accordion.
// Cote serveur, seuls les attributs qui masquent l'etat initial sont rendus (pas de flash au chargement).
// Cote client, GSAP se telecharge des le demarrage, en parallele de l'hydratation.
import { vAccordion } from '~/directives/accordion'
import { vParallax } from '~/directives/parallax'
import { vReveal } from '~/directives/reveal'
import { rememberGsap } from '~/directives/shared'
import { vStagger } from '~/directives/stagger'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', vReveal)
  nuxtApp.vueApp.directive('stagger', vStagger)
  nuxtApp.vueApp.directive('parallax', vParallax)
  nuxtApp.vueApp.directive('accordion', vAccordion)

  if (!import.meta.client || !canAnimate()) return

  loadGsap()
    .then((mods) => {
      rememberGsap(mods)
      const refresh = () => mods.ScrollTrigger.refresh()
      // Les positions de declenchement se recalculent quand la page change, que les polices arrivent
      // ou que tout est charge: la hauteur de la page peut bouger a ces moments.
      nuxtApp.hook('page:finish', () => {
        requestAnimationFrame(refresh)
      })
      void document.fonts?.ready.then(refresh)
      window.addEventListener('load', refresh, { once: true })
    })
    .catch(() => undefined)
})
