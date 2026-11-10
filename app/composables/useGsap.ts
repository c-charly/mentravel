// Chargement paresseux de GSAP + ScrollTrigger (uniquement cote client, apres le premier rendu).
export async function loadGsap() {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
  gsap.registerPlugin(ScrollTrigger)
  return { gsap, ScrollTrigger }
}

export function motionAllowed(): boolean {
  if (!import.meta.client) return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
