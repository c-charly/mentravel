<script setup lang="ts">
import { BRAND } from '~~/content/network'

const localePath = useLocalePath()
const { loc } = useL10n()
const columns = [
  {
    key: 'travel',
    links: [
      { to: '/reserver', key: 'book' },
      { to: '/trajets', key: 'routes' },
      { to: '/classes', key: 'classes' },
      { to: '/a-bord', key: 'onboard' },
    ],
  },
  {
    key: 'services',
    links: [
      { to: '/colis', key: 'parcels' },
      { to: '/location-bus', key: 'charter' },
      { to: '/mon-voyage', key: 'myTrip' },
      { to: '/verifier', key: 'verify' },
    ],
  },
  {
    key: 'info',
    links: [
      { to: '/aide', key: 'help' },
      { to: '/a-propos', key: 'about' },
      { to: '/conditions', key: 'terms' },
      { to: '/bagages-annulation', key: 'baggage' },
      { to: '/confidentialite', key: 'privacy' },
    ],
  },
]
const label = (col: string, key: string) =>
  col === 'info' && ['terms', 'baggage', 'privacy', 'about', 'help'].includes(key) ? `footer.${key}` : `nav.${key}`
</script>

<template>
  <footer class="border-t border-line bg-base-200/70">
    <div class="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div class="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <BrandMark />
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-muted">{{ loc(BRAND.signature) }}. {{ $t('footer.blurb') }}</p>
          <ul class="mt-6 space-y-2.5 text-sm">
            <li>
              <a :href="`tel:${BRAND.phoneRaw}`" class="inline-flex items-center gap-2.5 hover:underline">
                <Icon name="lucide:phone" class="size-4 text-muted" />{{ BRAND.phoneDisplay }}
              </a>
            </li>
            <li>
              <a :href="`mailto:${BRAND.email}`" class="inline-flex items-center gap-2.5 hover:underline">
                <Icon name="lucide:mail" class="size-4 text-muted" />{{ BRAND.email }}
              </a>
            </li>
            <li class="flex items-center gap-2.5 text-muted">
              <Icon name="lucide:clock" class="size-4" />{{ loc(BRAND.hours) }}
            </li>
            <li class="flex items-center gap-2.5 text-muted">
              <Icon name="lucide:map-pin" class="size-4" />{{ BRAND.address }}
            </li>
          </ul>
        </div>

        <div class="grid gap-8 sm:grid-cols-3">
          <div v-for="col in columns" :key="col.key">
            <h2 class="text-sm font-semibold">{{ $t(`footer.${col.key}`) }}</h2>
            <ul class="mt-4 space-y-2.5 text-sm">
              <li v-for="l in col.links" :key="l.to">
                <NuxtLink :to="localePath(l.to)" class="text-muted transition-colors hover:text-base-content">
                  {{ $t(label(col.key, l.key)) }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{{ BRAND.name }}. {{ $t('footer.madeIn') }}</p>
        <div class="flex flex-wrap items-center gap-3">
          <span class="chip !bg-base-100 border border-line">Orange Money</span>
          <span class="chip !bg-base-100 border border-line">MTN MoMo</span>
          <ThemeLang />
        </div>
      </div>
    </div>
  </footer>
</template>
