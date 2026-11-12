<script setup lang="ts">
import { CLASSES, CLASS_IDS, fareFor, getRouteById, timetableFor } from '~~/content/network'

const route = useRoute()
const { t } = useI18n()
const { fcfa, duration, city, loc } = useL10n()
const localePath = useLocalePath()

const r = getRouteById(String(route.params.ligne))
if (!r) throw createError({ statusCode: 404, statusMessage: 'Ligne introuvable', fatal: true })

const table = timetableFor(r.from, r.to)
const businessOnly = table.filter((e) => e.classes.length === 1).map((e) => e.time)
const master = table.filter((e) => e.classes.length > 1).map((e) => e.time)
const cheapest = fareFor(r.from, r.to, 'business').one
const back = `${r.to}-${r.from}`

useSeoMeta({
  title: () => t('line.seoTitle', { from: city(r.from), to: city(r.to), price: fcfa(cheapest) }),
  description: () => t('line.seoDescription', { from: city(r.from), to: city(r.to), km: r.km, duration: duration(r.durationMin) }),
})
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BusTrip',
        name: `${city(r.from)} - ${city(r.to)}`,
        provider: { '@type': 'Organization', name: 'MEN TRAVEL' },
        departureBusStop: { '@type': 'BusStop', name: r.boardingPoint },
        arrivalBusStop: { '@type': 'BusStop', name: r.arrivalPoint },
        offers: { '@type': 'Offer', priceCurrency: 'XAF', price: cheapest },
      }),
    },
  ],
})
</script>

<template>
  <div v-if="r">
    <PageHeader :title="`${city(r.from)} - ${city(r.to)}`" :lead="$t('line.seoDescription', { from: city(r.from), to: city(r.to), km: r.km, duration: duration(r.durationMin) })">
      <div class="mt-8 flex flex-wrap gap-3">
        <NuxtLinkLocale :to="{ path: '/reserver', query: { de: r.from, vers: r.to, etape: 'date' } }" class="btn btn-primary btn-lg">
          {{ $t('line.book') }}<Icon name="lucide:arrow-right" class="size-5" />
        </NuxtLinkLocale>
        <NuxtLink :to="localePath(`/trajets/${back}`)" class="btn btn-outline btn-lg">
          <Icon name="lucide:arrow-left-right" class="size-5" />{{ city(r.to) }} - {{ city(r.from) }}
        </NuxtLink>
      </div>
    </PageHeader>

    <div class="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <dl v-stagger="{ each: 0.1, y: 30 }" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="surface-muted p-5"><dt class="text-sm text-muted">{{ $t('line.distance') }}</dt><dd class="display tnum mt-1 text-2xl">{{ r.km }} km</dd></div>
        <div class="surface-muted p-5"><dt class="text-sm text-muted">{{ $t('line.duration') }}</dt><dd class="display tnum mt-1 text-2xl">{{ duration(r.durationMin) }}</dd></div>
        <div class="surface-muted p-5"><dt class="text-sm text-muted">{{ $t('line.boarding') }}</dt><dd class="mt-1 text-lg font-semibold">{{ r.boardingPoint }}</dd></div>
        <div class="surface-muted p-5"><dt class="text-sm text-muted">{{ $t('line.arrival') }}</dt><dd class="mt-1 text-lg font-semibold">{{ r.arrivalPoint }}</dd></div>
      </dl>

      <section class="mt-16" aria-labelledby="l-tarifs">
        <h2 id="l-tarifs" v-reveal class="display text-2xl sm:text-3xl">{{ $t('routes.fares') }}</h2>
        <ul v-stagger="{ each: 0.1, y: 22 }" class="surface mt-6 divide-y divide-[var(--line)]">
          <li v-for="c in CLASS_IDS" :key="c" class="flex flex-wrap items-center gap-x-6 gap-y-1 px-6 py-5">
            <ClassMark :id="c" swatch />
            <span class="display text-lg">{{ CLASSES[c].name }}</span>
            <span class="text-muted">{{ loc(CLASSES[c].tagline) }}</span>
            <span class="ml-auto text-right">
              <span class="display tnum block text-xl">{{ fcfa(fareFor(r.from, r.to, c).one) }}</span>
              <span class="tnum text-sm text-muted">{{ $t('routes.roundTrip') }} {{ fcfa(fareFor(r.from, r.to, c).round) }}</span>
            </span>
          </li>
        </ul>
      </section>

      <section class="mt-16 grid gap-10 md:grid-cols-[1fr_2fr]" aria-labelledby="l-horaires">
        <div v-reveal>
          <h2 id="l-horaires" class="display text-2xl sm:text-3xl">{{ $t('line.times') }}</h2>
          <p class="mt-2 text-muted">{{ $t('line.timesHint') }}</p>
        </div>
        <div class="grid gap-6">
          <div>
            <h3 class="font-semibold">{{ CLASSES.business.name }}</h3>
            <ul v-stagger.scale="{ each: 0.03, y: 0, scale: 0.7, duration: 0.5 }" class="mt-3 flex flex-wrap gap-2">
              <li v-for="tm in [...businessOnly, ...master].sort()" :key="tm" class="mono rounded-full bg-base-200 px-3.5 py-1.5 text-sm font-semibold">{{ tm }}</li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold">MasterClass S, MasterClass Plus</h3>
            <ul v-stagger.scale="{ each: 0.03, y: 0, scale: 0.7, duration: 0.5 }" class="mt-3 flex flex-wrap gap-2">
              <li v-for="tm in master" :key="tm" class="mono rounded-full bg-secondary/20 px-3.5 py-1.5 text-sm font-semibold">{{ tm }}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
