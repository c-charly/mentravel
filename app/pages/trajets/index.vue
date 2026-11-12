<script setup lang="ts">
import { CITIES, CLASSES, CLASS_IDS, ROUTES, fareFor } from '~~/content/network'
import type { CityId } from '#shared/types'

const { t } = useI18n()
const { fcfa, duration, city } = useL10n()
useSeoMeta({ title: () => t('routes.seoTitle'), description: () => t('routes.seoDescription') })
const localePath = useLocalePath()

const pairs: [CityId, CityId][] = [
  ['yaounde', 'douala'],
  ['yaounde', 'kribi'],
  ['douala', 'kribi'],
]
const pos: Record<CityId, { x: number; y: number }> = {
  yaounde: { x: 330, y: 70 },
  douala: { x: 70, y: 300 },
  kribi: { x: 560, y: 320 },
}
const colors: Record<CityId, string> = { yaounde: 'var(--yde)', douala: 'var(--dla)', kribi: 'var(--kri)' }
const info = (a: CityId, b: CityId) => ROUTES.find((r) => r.from === a && r.to === b)!
const mid = (a: CityId, b: CityId) => ({ x: (pos[a].x + pos[b].x) / 2, y: (pos[a].y + pos[b].y) / 2 })

// La carte se construit quand elle entre dans l'ecran: les villes apparaissent, les lignes se tracent, puis les distances
const mapBox = ref<HTMLElement | null>(null)
useGsapScope(
  mapBox,
  ({ gsap, root }) => {
    const cities = root.querySelectorAll('[data-city]')
    const lines = root.querySelectorAll('[data-draw]')
    const labels = root.querySelectorAll('[data-label]')
    const finish = () => {
      root.querySelectorAll('[data-draw]').forEach((n) => n.setAttribute('data-draw-done', ''))
      root.querySelectorAll('[data-fade]').forEach((n) => n.setAttribute('data-fade-done', ''))
      // Les etiquettes sont placees par un attribut transform: on ne vide que leur opacite
      gsap.set(cities, { clearProps: 'opacity,transform' })
      gsap.set(labels, { clearProps: 'opacity' })
    }
    gsap
      .timeline({ scrollTrigger: { trigger: root, start: 'top 85%' }, onComplete: finish })
      .fromTo(cities, { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.15, ease: 'back.out(2)' })
      .fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, stagger: 0.25, ease: 'power2.inOut' }, '-=0.3')
      .fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.15 }, '-=0.7')
  },
  (root) => {
    root.querySelectorAll('[data-draw]').forEach((n) => n.setAttribute('data-draw-done', ''))
    root.querySelectorAll('[data-fade]').forEach((n) => n.setAttribute('data-fade-done', ''))
  },
)
</script>

<template>
  <div>
    <PageHeader :title="$t('routes.title')" :lead="$t('routes.lead')" />

    <div class="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <!-- Carte -->
      <div ref="mapBox" v-reveal.fade class="surface p-4 sm:p-8">
        <svg viewBox="0 0 640 380" class="mx-auto w-full max-w-3xl" role="img" :aria-label="$t('routes.mapLabel')">
          <g v-for="[a, b] in pairs" :key="`${a}${b}`">
            <a :href="localePath(`/trajets/${a}-${b}`)">
              <line :x1="pos[a].x" :y1="pos[a].y" :x2="pos[b].x" :y2="pos[b].y" pathLength="1" data-draw stroke="currentColor" stroke-opacity="0.25" stroke-width="3" stroke-linecap="round" />
              <line :x1="pos[a].x" :y1="pos[a].y" :x2="pos[b].x" :y2="pos[b].y" stroke="transparent" stroke-width="30" />
              <g data-label data-fade :transform="`translate(${mid(a, b).x} ${mid(a, b).y})`">
                <rect x="-60" y="-21" width="120" height="42" rx="21" fill="var(--color-base-100)" stroke="var(--line-strong)" stroke-width="1" />
                <text text-anchor="middle" y="-2" font-size="13" font-weight="700" fill="currentColor">{{ info(a, b).km }} km</text>
                <text text-anchor="middle" y="13" font-size="12" fill="var(--muted)">{{ duration(info(a, b).durationMin) }}</text>
              </g>
            </a>
          </g>
          <g v-for="id in (['yaounde', 'douala', 'kribi'] as CityId[])" :key="id" data-city data-fade>
            <circle :cx="pos[id].x" :cy="pos[id].y" r="22" :fill="colors[id]" fill-opacity="0.18" />
            <circle :cx="pos[id].x" :cy="pos[id].y" r="11" :fill="colors[id]" />
            <text :x="pos[id].x" :y="pos[id].y + (id === 'yaounde' ? -34 : 46)" text-anchor="middle" font-size="24" font-weight="700" fill="currentColor">{{ CITIES[id].name }}</text>
          </g>
        </svg>
        <p class="mt-2 text-center text-sm text-muted">{{ $t('routes.mapHint') }}</p>
      </div>

      <!-- Grille tarifaire -->
      <section class="mt-16" aria-labelledby="tarifs">
        <h2 id="tarifs" v-reveal class="display t-title">{{ $t('routes.fares') }}</h2>
        <div class="surface mt-8 overflow-x-auto">
          <table class="w-full min-w-[40rem] border-collapse text-left">
            <caption class="sr-only">{{ $t('routes.fares') }}</caption>
            <thead>
              <tr class="border-b border-line text-sm text-muted">
                <th scope="col" class="px-6 py-4 font-medium">{{ $t('routes.line') }}</th>
                <th v-for="c in CLASS_IDS" :key="c" scope="col" class="px-4 py-4 font-medium">
                  <span class="flex items-center gap-2"><ClassMark :id="c" swatch />{{ CLASSES[c].name }}</span>
                </th>
              </tr>
            </thead>
            <tbody v-stagger="{ each: 0.12, y: 20, start: 'top 92%' }">
              <tr v-for="[a, b] in pairs" :key="`${a}${b}`" class="border-b border-line align-top last:border-0">
                <th scope="row" class="px-6 py-5">
                  <NuxtLink :to="localePath(`/trajets/${a}-${b}`)" class="display text-lg hover:underline">{{ city(a) }} - {{ city(b) }}</NuxtLink>
                  <span class="mt-1 block text-sm font-normal text-muted">{{ info(a, b).km }} km, {{ duration(info(a, b).durationMin) }}</span>
                </th>
                <td v-for="c in CLASS_IDS" :key="c" class="px-4 py-5">
                  <span class="display tnum block text-lg">{{ fcfa(fareFor(a, b, c).one) }}</span>
                  <span class="tnum text-sm text-muted">{{ $t('routes.roundTrip') }} {{ fcfa(fareFor(a, b, c).round) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-4 text-sm text-muted">{{ $t('routes.bothWays') }}</p>
      </section>
    </div>
  </div>
</template>
