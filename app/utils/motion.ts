// Le mouvement est-il autorise par l'utilisateur ? (prefers-reduced-motion)
export function motionAllowed(): boolean {
  if (!import.meta.client) return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
