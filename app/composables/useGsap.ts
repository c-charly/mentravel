// Chargement paresseux de GSAP + ScrollTrigger (uniquement cote client, apres le premier rendu).
// Le module est charge une seule fois: tous les appels partagent la meme promesse.
// Classes posees sur <html>: "anim-on" quand GSAP est pret, "anim-off" s'il ne peut pas se charger
// (le CSS ne masque alors plus rien, voir main.css).
type GsapModules = {
  gsap: typeof import('gsap').gsap
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger
}

let loading: Promise<GsapModules> | null = null

export function loadGsap(): Promise<GsapModules> {
  if (!loading) {
    loading = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger)
      gsap.defaults({ ease: 'power3.out', duration: 0.8 })
      // Sur mobile, la barre d'adresse qui se replie ne doit pas recalculer toutes les positions
      ScrollTrigger.config({ ignoreMobileResize: true })
      // Si le delai de securite est deja passe (anim-off), la page reste statique
      if (!document.documentElement.classList.contains('anim-off')) document.documentElement.classList.add('anim-on')
      return { gsap, ScrollTrigger }
    })
    loading.catch(() => document.documentElement.classList.add('anim-off'))
  }
  return loading
}
