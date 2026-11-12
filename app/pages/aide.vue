<script setup lang="ts">
import { FAQ, FAQ_GROUPS, type FaqItem } from '~~/content/editorial'
import { BRAND } from '~~/content/network'

const { t } = useI18n()
const { loc, lang } = useL10n()
useSeoMeta({ title: () => t('help.seoTitle'), description: () => t('help.seoDescription') })

const query = ref('')
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const filtered = computed(() => {
  const q = norm(query.value.trim())
  if (!q) return FAQ
  return FAQ.filter((f) => norm(loc(f.q) + ' ' + loc(f.a)).includes(q))
})
const groups = computed(() =>
  (Object.keys(FAQ_GROUPS) as FaqItem['group'][])
    .map((g) => ({ id: g, items: filtered.value.filter((f) => f.group === g) }))
    .filter((g) => g.items.length),
)

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((f) => ({
            '@type': 'Question',
            name: f.q[lang.value],
            acceptedAnswer: { '@type': 'Answer', text: f.a[lang.value] },
          })),
        }),
      ),
    },
  ],
})
</script>

<template>
  <div>
    <PageHeader :title="$t('help.title')" :lead="$t('help.lead')" />

    <div class="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <div v-stagger="{ each: 0.1, y: 28 }" class="grid gap-4 sm:grid-cols-3">
        <a :href="`https://wa.me/${BRAND.whatsapp}`" target="_blank" rel="noopener" class="surface flex items-center gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
          <span class="grid size-11 place-items-center rounded-2xl bg-[#1fa855] text-white"><Icon name="simple-icons:whatsapp" class="size-5" /></span>
          <span><span class="block font-semibold">WhatsApp</span><span class="text-sm text-muted">{{ loc(BRAND.hours) }}</span></span>
        </a>
        <a :href="`tel:${BRAND.phoneRaw}`" class="surface flex items-center gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
          <span class="grid size-11 place-items-center rounded-2xl bg-base-200"><Icon name="lucide:phone" class="size-5" /></span>
          <span><span class="block font-semibold">{{ BRAND.phoneDisplay }}</span><span class="text-sm text-muted">{{ loc(BRAND.hours) }}</span></span>
        </a>
        <a :href="`mailto:${BRAND.email}`" class="surface flex items-center gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
          <span class="grid size-11 place-items-center rounded-2xl bg-base-200"><Icon name="lucide:mail" class="size-5" /></span>
          <span><span class="block font-semibold">{{ BRAND.email }}</span><span class="text-sm text-muted">{{ $t('help.mailNote') }}</span></span>
        </a>
      </div>

      <div class="mt-16 max-w-3xl">
        <label v-reveal class="block">
          <span class="mb-2 block font-semibold">{{ $t('help.search') }}</span>
          <span class="input flex w-full items-center gap-2.5">
            <Icon name="lucide:search" class="size-5 shrink-0 text-muted" />
            <input v-model="query" type="search" class="grow bg-transparent outline-none" :placeholder="$t('help.searchPlaceholder')" />
          </span>
        </label>

        <p v-if="!groups.length" class="mt-8 text-muted" role="status">{{ $t('help.noResult') }}</p>
        <div v-for="g in groups" :key="g.id" class="mt-12">
          <h2 class="display text-xl">{{ loc(FAQ_GROUPS[g.id]) }}</h2>
          <div class="mt-3 divide-y divide-[var(--line)] border-y border-line">
            <details v-for="f in g.items" :key="f.id" v-accordion class="group py-5">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {{ loc(f.q) }}
                <Icon name="lucide:plus" class="size-5 shrink-0 text-muted transition-transform group-open:rotate-45" />
              </summary>
              <p class="mt-3 max-w-prose text-muted">{{ loc(f.a) }}</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
