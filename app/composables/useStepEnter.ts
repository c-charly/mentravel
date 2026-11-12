// Rejoue une entree douce quand l'ecran d'un parcours change (etape suivante ou precedente).
// Cible: les blocs du conteneur (hors titre masque), et si le premier est une grille, ses enfants un par un.
import type { Ref } from 'vue'

export function useStepEnter(root: Ref<HTMLElement | null>, key: () => unknown, skip?: (now: unknown) => boolean) {
  watch(key, async (now) => {
    if (!canAnimate() || skip?.(now)) return
    await nextTick()
    const mods = await loadGsap().catch(() => null)
    const el = root.value
    if (!mods || !el || !canAnimate()) return

    const blocks = Array.from(el.children).filter((c) => !c.classList.contains('sr-only')) as HTMLElement[]
    const first = blocks[0]
    const targets = first && first.classList.contains('grid') && first.children.length > 1
      ? [...(Array.from(first.children) as HTMLElement[]), ...blocks.slice(1)]
      : blocks
    if (!targets.length) return

    mods.gsap.fromTo(
      targets,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, overwrite: 'auto', clearProps: 'opacity,transform' },
    )
  })
}
