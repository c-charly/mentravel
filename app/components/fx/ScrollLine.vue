<script setup lang="ts">
// Le fil de la ligne: un trait fin qui se trace pendant le defilement, avec un arret par section marquee.
const progress = ref(0)
const stations = ref<{ top: number; color: string }[]>([])
const colors = ['var(--yde)', 'var(--dla)', 'var(--kri)']

function measure() {
  const doc = document.documentElement
  const total = Math.max(1, doc.scrollHeight - window.innerHeight)
  progress.value = Math.min(1, Math.max(0, window.scrollY / total))
}
function collect() {
  const doc = document.documentElement
  const total = Math.max(1, doc.scrollHeight)
  const nodes = [...document.querySelectorAll<HTMLElement>('[data-station]')]
  stations.value = nodes.map((n, i) => ({
    top: ((n.getBoundingClientRect().top + window.scrollY) / total) * 100,
    color: colors[i % colors.length]!,
  }))
}

onMounted(() => {
  measure()
  collect()
  window.addEventListener('scroll', measure, { passive: true })
  window.addEventListener('resize', collect)
  const t = window.setTimeout(collect, 800)
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', measure)
    window.removeEventListener('resize', collect)
    clearTimeout(t)
  })
})
</script>

<template>
  <div class="pointer-events-none fixed bottom-24 left-3 top-24 z-30 hidden w-4 xl:block" aria-hidden="true">
    <div class="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-current opacity-15" />
    <div
      class="absolute left-1/2 top-0 w-[3px] -translate-x-1/2 origin-top rounded bg-amber"
      :style="{ height: '100%', transform: `translateX(-50%) scaleY(${progress})` }"
    />
    <span
      v-for="(s, i) in stations"
      :key="i"
      class="absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full ring-2 ring-base-100"
      :style="{ top: `${s.top}%`, background: s.color }"
    />
  </div>
</template>
