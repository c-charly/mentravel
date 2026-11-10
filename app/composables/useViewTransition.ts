// Execute un changement d'etat dans une transition de vue (si supportee et si le mouvement est permis).
export function useViewTransition() {
  const reduced = usePreferredReducedMotion()

  return async function run(update: () => void | Promise<void>) {
    if (!import.meta.client) {
      await update()
      return
    }
    const doc = document as Document & {
      startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> }
    }
    if (!doc.startViewTransition || reduced.value === 'reduce') {
      await update()
      return
    }
    const t = doc.startViewTransition(async () => {
      await update()
      await nextTick()
    })
    await t.finished.catch(() => undefined)
  }
}
