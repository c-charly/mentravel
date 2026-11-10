<script setup lang="ts">
import { CLASSES_PAGE } from '~~/content/editorial'
import { CLASSES, CLASS_IDS, EQUIPMENTS, ROUTES, fareFor } from '~~/content/network'

const { t } = useI18n()
const { loc, fcfa } = useL10n()
useSeoMeta({ title: () => t('classesPage.seoTitle'), description: () => loc(CLASSES_PAGE.lead) })

const tones = { business: 'var(--kri-soft)', 'masterclass-s': 'var(--dla-soft)', 'masterclass-plus': 'var(--yde-soft)' } as const
const allEquip = Object.keys(EQUIPMENTS)
const minFare = (c: (typeof CLASS_IDS)[number]) => Math.min(...ROUTES.map((r) => fareFor(r.from, r.to, c).one))

</script>

<template>
  <div>
    <PageHeader :title="loc(CLASSES_PAGE.title)" :lead="loc(CLASSES_PAGE.lead)" />

    <div class="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <ul class="grid gap-5 lg:grid-cols-3">
        <li v-for="id in CLASS_IDS" :key="id" class="surface flex flex-col overflow-hidden">
          <div class="p-6 pb-5" :style="{ background: tones[id] }">
            <div class="flex items-center justify-between">
              <span class="chip !bg-base-100/80"><ClassMark :id="id" swatch />{{ loc(CLASSES[id].tier) }}</span>
              <span class="mono text-sm text-muted">{{ CLASSES[id].layoutLabel }}</span>
            </div>
            <h2 class="display mt-6 text-3xl">{{ CLASSES[id].name }}</h2>
            <p class="mt-1 text-muted">{{ loc(CLASSES[id].tagline) }}</p>
          </div>
          <div class="flex flex-1 flex-col p-6">
            <p class="text-muted">{{ loc(CLASSES_PAGE.stories[id]) }}</p>
            <dl class="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div><dt class="text-muted">{{ loc(CLASSES_PAGE.layout) }}</dt><dd class="display text-lg">{{ CLASSES[id].layoutLabel }}</dd></div>
              <div><dt class="text-muted">{{ loc(CLASSES_PAGE.seats) }}</dt><dd class="display text-lg">{{ CLASSES[id].seats }}</dd></div>
              <div><dt class="text-muted">{{ loc(CLASSES_PAGE.rows) }}</dt><dd class="display text-lg">{{ CLASSES[id].rows }}</dd></div>
            </dl>
            <ul class="mt-5 grid flex-1 content-start gap-2.5 text-sm">
              <li v-for="e in CLASSES[id].equipments" :key="e" class="flex items-center gap-2.5">
                <Icon :name="EQUIPMENTS[e]!.icon" class="size-4 text-muted" />{{ loc(EQUIPMENTS[e]!.label) }}
              </li>
            </ul>
            <div class="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
              <p><span class="text-sm text-muted">{{ loc(CLASSES_PAGE.fromPrice) }}</span> <span class="display tnum text-xl">{{ fcfa(minFare(id)) }}</span></p>
              <NuxtLinkLocale :to="{ path: '/reserver', query: { etape: 'date' } }" class="btn btn-primary btn-sm">{{ loc(CLASSES_PAGE.bookClass) }}</NuxtLinkLocale>
            </div>
          </div>
        </li>
      </ul>

      <section class="mt-20">
        <h2 class="display t-title">{{ loc(CLASSES_PAGE.compare) }}</h2>
        <div class="surface mt-8 overflow-x-auto">
          <table class="w-full min-w-[34rem] border-collapse text-left">
            <caption class="sr-only">{{ loc(CLASSES_PAGE.compare) }}</caption>
            <thead>
              <tr class="border-b border-line text-sm text-muted">
                <th scope="col" class="px-6 py-4" />
                <th v-for="c in CLASS_IDS" :key="c" scope="col" class="px-4 py-4 font-semibold text-base-content">{{ CLASSES[c].name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in allEquip" :key="e" class="border-b border-line last:border-0">
                <th scope="row" class="flex items-center gap-2.5 px-6 py-3.5 font-medium">
                  <Icon :name="EQUIPMENTS[e]!.icon" class="size-4 text-muted" />{{ loc(EQUIPMENTS[e]!.label) }}
                </th>
                <td v-for="c in CLASS_IDS" :key="c" class="px-4 py-3.5">
                  <template v-if="CLASSES[c].equipments.includes(e)">
                    <Icon name="lucide:check" class="size-5 text-success" />
                    <span class="sr-only">{{ loc(CLASSES_PAGE.included) }}</span>
                  </template>
                  <template v-else>
                    <Icon name="lucide:minus" class="size-5 text-muted" />
                    <span class="sr-only">{{ loc(CLASSES_PAGE.notIncluded) }}</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>
