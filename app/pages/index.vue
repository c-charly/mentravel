<script setup lang="ts">
import { FAQ, HOME } from '~~/content/editorial'
import { CITIES, CLASSES, CLASS_IDS, EQUIPMENTS, ROUTES, fareFor } from '~~/content/network'
import type { CityId } from '#shared/types'

const { t } = useI18n()
const { loc, fcfa, city, duration } = useL10n()
useSeoMeta({
  title: () => t('home.seoTitle'),
  description: () => t('home.seoDescription'),
  ogTitle: 'MEN TRAVEL',
})

const pairs: [CityId, CityId][] = [
  ['yaounde', 'douala'],
  ['yaounde', 'kribi'],
  ['douala', 'kribi'],
]
const soft: Record<CityId, string> = { yaounde: 'var(--yde-soft)', douala: 'var(--dla-soft)', kribi: 'var(--kri-soft)' }
const dot: Record<CityId, string> = { yaounde: 'var(--yde)', douala: 'var(--dla)', kribi: 'var(--kri)' }
const info = (a: CityId, b: CityId) => ROUTES.find((r) => r.from === a && r.to === b)!
const nextCity: Record<CityId, CityId> = { yaounde: 'douala', douala: 'kribi', kribi: 'douala' }
const lineStops: CityId[] = ['yaounde', 'douala', 'kribi']
const minFare = (c: (typeof CLASS_IDS)[number]) => Math.min(...ROUTES.map((r) => fareFor(r.from, r.to, c).one))
const tone = { yde: 'var(--yde-soft)', dla: 'var(--dla-soft)', kri: 'var(--kri-soft)' } as const
const toneInk = { yde: 'var(--yde-ink)', dla: 'var(--dla-ink)', kri: 'var(--kri-ink)' } as const
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="hero-soft -mt-16 pt-16">
      <div class="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:pb-24">
        <div class="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span class="chip surface !shadow-none"><i class="size-2 rounded-full bg-secondary" />{{ loc(HOME.badge) }}</span>
            <h1 class="display mt-6 text-[clamp(2.25rem,5vw,4rem)] leading-[1.04] tracking-[-0.04em]">{{ loc(HOME.heroTitle) }}</h1>
            <p class="t-sub mt-6 max-w-xl text-muted">{{ loc(HOME.heroLead) }}</p>
          </div>
          <div class="relative hidden lg:block">
            <MediaFrame id="hero-road" rounded class="border border-line" />
            <div class="surface absolute -bottom-5 -left-6 flex items-center gap-3 px-4 py-3">
              <span class="grid size-9 place-items-center rounded-xl bg-secondary/20"><Icon name="lucide:wifi" class="size-[1.1rem]" /></span>
              <span class="text-sm font-semibold leading-tight">{{ $t('home.onboardChip') }}<br /><span class="font-normal text-muted">{{ $t('home.onboardChipSub') }}</span></span>
            </div>
          </div>
        </div>
        <MediaFrame id="hero-road" rounded class="mt-8 border border-line lg:hidden" />
        <div class="mt-12 max-w-5xl"><HomeSearch /></div>
        <ul class="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
          <li v-for="(tr, i) in HOME.trust" :key="i" class="flex items-center gap-2">
            <Icon :name="tr.icon" class="size-[1.1rem] text-base-content" />{{ loc(tr.text) }}
          </li>
        </ul>
      </div>
    </section>

    <!-- Trois villes -->
    <section class="mx-auto max-w-7xl px-5 pt-24 sm:px-8">
      <h2 class="display t-title">{{ loc(HOME.citiesTitle) }}</h2>
      <p class="mt-3 max-w-xl text-muted">{{ loc(HOME.citiesLead) }}</p>
      <ul class="mt-10 grid gap-5 md:grid-cols-3">
        <li v-for="id in lineStops" :key="id">
          <NuxtLinkLocale :to="{ path: '/reserver', query: { de: id, vers: nextCity[id], etape: 'date' } }" class="group relative block overflow-hidden rounded-3xl">
            <MediaFrame :id="`city-${id}`" class="transition-transform duration-700 ease-route group-hover:scale-[1.03]" />
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent p-5 pt-16 text-white">
              <h3 class="display text-2xl">{{ city(id) }}</h3>
              <p class="mt-1 text-sm text-white/85">{{ loc(CITIES[id].tagline) }}</p>
              <span class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b1b2b]">
                {{ $t('home.leaveFrom', { city: city(id) }) }}<Icon name="lucide:arrow-right" class="size-4" />
              </span>
            </div>
          </NuxtLinkLocale>
        </li>
      </ul>
    </section>

    <!-- Lignes populaires -->
    <section class="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="display t-title">{{ loc(HOME.routesTitle) }}</h2>
          <p class="mt-3 max-w-xl text-muted">{{ loc(HOME.routesLead) }}</p>
        </div>
        <NuxtLinkLocale to="/trajets" class="btn btn-ghost btn-sm">{{ $t('home.allRoutes') }}<Icon name="lucide:arrow-right" class="size-4" /></NuxtLinkLocale>
      </div>
      <ul class="mt-10 grid gap-5 md:grid-cols-3">
        <li v-for="[a, b] in pairs" :key="`${a}${b}`">
          <NuxtLinkLocale :to="`/trajets/${a}-${b}`" class="group surface block overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]">
            <div class="relative p-6 pb-14" :style="{ background: `linear-gradient(125deg, ${soft[a]}, ${soft[b]})` }">
              <p class="flex flex-wrap items-center gap-x-2 text-lg font-semibold">
                <i class="size-2.5 rounded-full" :style="{ background: dot[a] }" />{{ city(a) }}
                <Icon name="lucide:arrow-right" class="size-4 text-muted" />
                <i class="size-2.5 rounded-full" :style="{ background: dot[b] }" />{{ city(b) }}
              </p>
              <span class="chip absolute bottom-4 left-6 !bg-base-100/85 backdrop-blur">{{ info(a, b).km }} km, {{ duration(info(a, b).durationMin) }}</span>
            </div>
            <div class="flex items-end justify-between gap-3 p-6">
              <div>
                <p class="text-sm text-muted">{{ loc(HOME.fromLabel) }}</p>
                <p class="display tnum text-2xl">{{ fcfa(fareFor(a, b, 'business').one) }}</p>
              </div>
              <span class="inline-flex items-center gap-1 text-sm font-semibold">
                {{ loc(HOME.seeTimes) }}<Icon name="lucide:arrow-right" class="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </NuxtLinkLocale>
        </li>
      </ul>
    </section>

    <!-- Classes -->
    <section class="bg-base-200/70 py-20">
      <div class="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 class="display t-title">{{ loc(HOME.classesTitle) }}</h2>
        <p class="mt-3 max-w-xl text-muted">{{ loc(HOME.classesLead) }}</p>
        <ul class="mt-10 grid gap-5 md:grid-cols-3">
          <li v-for="c in CLASS_IDS" :key="c" class="surface flex flex-col overflow-hidden">
            <MediaFrame :id="`class-${c}`" />
            <div class="flex flex-1 flex-col p-6">
            <div class="flex items-center justify-between">
              <span class="chip"><ClassMark :id="c" swatch />{{ loc(CLASSES[c].tier) }}</span>
              <span class="mono text-sm text-muted">{{ CLASSES[c].layoutLabel }}</span>
            </div>
            <h3 class="display mt-5 text-2xl">{{ CLASSES[c].name }}</h3>
            <p class="mt-1 text-muted">{{ loc(CLASSES[c].tagline) }}</p>
            <ul class="mt-5 grid flex-1 content-start gap-2.5 text-sm">
              <li v-for="e in CLASSES[c].equipments.slice(0, 5)" :key="e" class="flex items-center gap-2.5">
                <Icon :name="EQUIPMENTS[e]!.icon" class="size-4 text-muted" />{{ loc(EQUIPMENTS[e]!.label) }}
              </li>
            </ul>
            <div class="mt-6 flex items-center justify-between border-t border-line pt-5">
              <p><span class="text-sm text-muted">{{ loc(HOME.fromLabel) }}</span> <span class="display tnum text-xl">{{ fcfa(minFare(c)) }}</span></p>
              <NuxtLinkLocale :to="{ path: '/reserver', query: { etape: 'date' } }" class="btn btn-outline btn-sm">{{ loc(HOME.chooseClass) }}</NuxtLinkLocale>
            </div>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Comment ca marche -->
    <section class="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <h2 class="display t-title max-w-2xl">{{ loc(HOME.stepsTitle) }}</h2>
      <ol class="mt-12 grid gap-10 md:grid-cols-3">
        <li v-for="(s, i) in HOME.steps" :key="i">
          <span class="grid size-11 place-items-center rounded-full bg-base-200 text-lg font-bold">{{ i + 1 }}</span>
          <h3 class="display mt-5 text-xl">{{ loc(s.title) }}</h3>
          <p class="mt-2 max-w-sm text-muted">{{ loc(s.text) }}</p>
        </li>
      </ol>
    </section>

    <!-- Pourquoi -->
    <section class="bg-base-200/70 py-20">
      <div class="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 class="display t-title max-w-2xl">{{ loc(HOME.whyTitle) }}</h2>
        <ul class="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="(w, i) in HOME.why" :key="i">
            <span class="grid size-12 place-items-center rounded-2xl" :style="{ background: tone[w.tone as keyof typeof tone], color: toneInk[w.tone as keyof typeof toneInk] }">
              <Icon :name="w.icon" class="size-6" />
            </span>
            <h3 class="display mt-5 text-lg">{{ loc(w.title) }}</h3>
            <p class="mt-2 text-muted">{{ loc(w.text) }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- Billet verifiable -->
    <section class="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-2">
      <div>
        <h2 class="display t-title">{{ loc(HOME.ticketTitle) }}</h2>
        <p class="mt-5 max-w-lg text-lg text-muted">{{ loc(HOME.ticketText) }}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLinkLocale to="/verifier/MT-K7N2QX-4HDM" class="btn btn-primary"><Icon name="lucide:badge-check" class="size-5" />{{ $t('home.tryDemo') }}</NuxtLinkLocale>
          <NuxtLinkLocale to="/mon-voyage" class="btn btn-outline">{{ loc(HOME.tripCta) }}</NuxtLinkLocale>
        </div>
      </div>
      <div class="mx-auto w-full max-w-sm rounded-[1.75rem] bg-white p-6 text-[#0b1b2b] ring-1 ring-black/5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs text-slate-500">PNR</p>
            <p class="mono text-lg font-bold">MT-K7N2QX-4HDM</p>
          </div>
          <StampStatut stamp="authentic" />
        </div>
        <p class="display mt-6 text-2xl">Yaoundé <Icon name="lucide:arrow-right" class="mx-1 inline size-5 text-slate-400" /> Douala</p>
        <dl class="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div><dt class="text-slate-500">{{ $t('ticket.holder') }}</dt><dd class="font-semibold"><MaskedText value="M******" /> <MaskedText value="J******" /></dd></div>
          <div><dt class="text-slate-500">{{ $t('ticket.phone') }}</dt><dd class="font-semibold"><MaskedText value="+237 6** ** ** 33" /></dd></div>
        </dl>
        <p class="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500"><Icon name="lucide:eye-off" class="size-4" />{{ $t('ticket.maskedNote') }}</p>
      </div>
    </section>

    <!-- Chiffres -->
    <section class="border-y border-line">
      <dl class="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-4">
        <div v-for="(n, i) in HOME.numbers" :key="i">
          <dd class="display text-4xl"><Compteur :to="n.to" :decimals="n.to % 1 ? 1 : 0" />{{ loc(n.suffix) }}</dd>
          <dt class="mt-1 text-sm text-muted">{{ loc(n.label) }}</dt>
        </div>
      </dl>
    </section>

    <!-- FAQ -->
    <section class="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.5fr]">
      <div>
        <h2 class="display t-title">{{ loc(HOME.faqTitle) }}</h2>
        <NuxtLinkLocale to="/aide" class="btn btn-outline mt-6">{{ loc(HOME.faqAll) }}</NuxtLinkLocale>
      </div>
      <div class="divide-y divide-[var(--line)] border-y border-line">
        <details v-for="f in FAQ.slice(0, 5)" :key="f.id" class="group py-5">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
            {{ loc(f.q) }}
            <Icon name="lucide:plus" class="size-5 shrink-0 text-muted transition-transform group-open:rotate-45" />
          </summary>
          <p class="mt-3 max-w-prose text-muted">{{ loc(f.a) }}</p>
        </details>
      </div>
    </section>

    <!-- Appel final -->
    <section class="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
      <div class="rounded-[2rem] bg-primary px-8 py-14 text-primary-content sm:px-14 sm:py-16">
        <h2 class="display t-title max-w-2xl">{{ loc(HOME.finalTitle) }}</h2>
        <p class="mt-4 max-w-lg opacity-80">{{ loc(HOME.finalText) }}</p>
        <NuxtLinkLocale to="/reserver" class="btn btn-lg mt-8 border-0 bg-primary-content text-primary hover:brightness-95">
          {{ loc(HOME.finalCta) }}<Icon name="lucide:arrow-right" class="size-5" />
        </NuxtLinkLocale>
      </div>
    </section>
  </div>
</template>
