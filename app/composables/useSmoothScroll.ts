// Defilement doux (Lenis) pour les pages editoriales. Desactive sur ecrans tactiles et si le mouvement est reduit.
export function useSmoothScroll() {
  onMounted(async () => {
    if (!motionAllowed()) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    const [{ default: Lenis }, { ScrollTrigger }] = await Promise.all([
      import('lenis'),
      import('gsap/ScrollTrigger').then(async (m) => {
        const { gsap } = await import('gsap')
        gsap.registerPlugin(m.ScrollTrigger)
        return m
      }),
    ])
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 })
    lenis.on('scroll', ScrollTrigger.update)
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    onBeforeUnmount(() => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    })
  })
}
