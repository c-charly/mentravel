import type { ScrollTrigger as ScrollTriggerClass } from 'gsap/ScrollTrigger'

// Le mouvement est-il autorise par l'utilisateur ? (prefers-reduced-motion)
export function motionAllowed(): boolean {
  if (!import.meta.client) return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Peut-on lancer une animation GSAP maintenant ?
// Non cote serveur, en test, si le mouvement est reduit, ou si la page est repassee en mode statique
// (classe "anim-off" posee par le script du head quand GSAP tarde trop, ou par useGsap en cas d'echec).
export function canAnimate(): boolean {
  if (!import.meta.client) return false
  if (import.meta.env.MODE === 'test') return false
  if (!motionAllowed()) return false
  return !document.documentElement.classList.contains('anim-off')
}

// Joue `play` une seule fois, des que `el` atteint la ligne `start` (ex: "top 88%"), puis se detruit.
// Un element deja au-dessus de cette ligne quand le declencheur est cree (visible des le chargement, ou page
// ouverte en milieu de defilement) ne rappelle jamais onEnter chez ScrollTrigger: on joue alors tout de suite.
// Retourne une fonction de nettoyage.
export function onceInView(ScrollTrigger: typeof ScrollTriggerClass, el: Element, start: string, play: () => void): () => void {
  let played = false
  const handle: { st?: ReturnType<typeof ScrollTrigger.create> } = {}
  const fire = () => {
    if (played) return
    played = true
    handle.st?.kill()
    play()
  }
  handle.st = ScrollTrigger.create({ trigger: el, start, onEnter: fire })
  if (played) handle.st.kill()
  else if (handle.st.progress > 0 || handle.st.isActive) fire()
  return () => handle.st?.kill()
}
