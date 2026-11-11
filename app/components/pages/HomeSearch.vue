<script setup lang="ts">
// Recherche de l'accueil: depart, arrivee, date, un seul bouton. Ouvre la reservation deja orientee.
import { CITY_IDS } from '~~/content/network'
import { todayDouala } from '#shared/time'
import type { CityId } from '#shared/types'

const api = useMtApi()
const localePath = useLocalePath()
const { city } = useL10n()
const today = todayDouala()

const from = ref<CityId>('yaounde')
const to = ref<CityId>('douala')
const date = ref('')
const swapTurns = ref(0)
const next = ref<{ time: string; left: number }[]>([])

const colors: Record<CityId, string> = { yaounde: 'var(--yde)', douala: 'var(--dla)', kribi: 'var(--kri)' }

function fixSame(changed: 'from' | 'to') {
  if (from.value !== to.value) return
  const other = CITY_IDS.find((c) => c !== (changed === 'from' ? from.value : to.value))!
  if (changed === 'from') to.value = other
  else from.value = other
}
function swap() {
  swapTurns.value += 1
  ;[from.value, to.value] = [to.value, from.value]
}

const query = computed(() => ({
  de: from.value,
  vers: to.value,
  ...(date.value ? { d: date.value, etape: 'horaire' } : { etape: 'date' }),
}))
const todayQuery = computed(() => ({ de: from.value, vers: to.value, d: today, etape: 'horaire' }))

async function loadNext() {
  try {
    const { departures } = await api.departures(from.value, to.value, today)
    next.value = departures
      .filter((d) => !d.departed)
      .map((d) => ({ time: d.departureTime, left: d.offers.reduce((s, o) => s + o.left, 0) }))
      .filter((d) => d.left > 0)
      .slice(0, 4)
  } catch {
    next.value = []
  }
}
onMounted(loadNext)
watch([from, to], loadNext)
</script>

<template>
  <div>
    <form class="surface rounded-[1.75rem] p-2 shadow-[var(--shadow-lift)] sm:p-2.5" novalidate @submit.prevent="navigateTo({ path: localePath('/reserver'), query })">
      <div class="grid gap-1 md:grid-cols-[1fr_auto_1fr_1fr_auto] md:items-center">
        <label class="field relative block rounded-[1.25rem] px-4 py-2.5 transition-colors hover:bg-base-200 focus-within:bg-base-200">
          <span class="text-xs font-medium text-muted">{{ $t('search.from') }}</span>
          <span class="flex items-center gap-2">
            <i class="size-2.5 shrink-0 rounded-full" :style="{ background: colors[from] }" />
            <select v-model="from" class="w-full cursor-pointer appearance-none bg-transparent pr-6 text-base font-semibold outline-none" @change="fixSame('from')">
              <option v-for="c in CITY_IDS" :key="c" :value="c">{{ city(c) }}</option>
            </select>
          </span>
          <Icon name="lucide:chevron-down" class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </label>

        <button
          type="button"
          class="z-10 mx-auto -my-2.5 grid size-9 place-items-center rounded-full border border-line bg-base-100 text-muted shadow-[var(--shadow-soft)] transition-colors hover:text-base-content md:my-0"
          :aria-label="$t('search.swap')"
          @click="swap"
        >
          <Icon name="lucide:arrow-left-right" class="size-4 rotate-90 transition-transform duration-500 md:rotate-0" :style="{ transform: `rotate(${swapTurns * 180}deg)` }" />
        </button>

        <label class="field relative block rounded-[1.25rem] px-4 py-2.5 transition-colors hover:bg-base-200 focus-within:bg-base-200">
          <span class="text-xs font-medium text-muted">{{ $t('search.to') }}</span>
          <span class="flex items-center gap-2">
            <i class="size-2.5 shrink-0 rounded-full" :style="{ background: colors[to] }" />
            <select v-model="to" class="w-full cursor-pointer appearance-none bg-transparent pr-6 text-base font-semibold outline-none" @change="fixSame('to')">
              <option v-for="c in CITY_IDS" :key="c" :value="c">{{ city(c) }}</option>
            </select>
          </span>
          <Icon name="lucide:chevron-down" class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </label>

        <label class="field block rounded-[1.25rem] px-4 py-2.5 transition-colors hover:bg-base-200 focus-within:bg-base-200">
          <span class="text-xs font-medium text-muted">{{ $t('search.date') }}</span>
          <input v-model="date" type="date" :min="today" class="block w-full bg-transparent text-base font-semibold outline-none" :aria-label="$t('search.date')" />
        </label>

        <button type="submit" class="btn btn-primary btn-lg w-full md:ml-1 md:w-auto">
          <Icon name="lucide:search" class="size-5" />{{ $t('search.cta') }}
        </button>
      </div>
    </form>

    <div v-if="next.length" class="mt-5 flex flex-wrap items-center gap-2" aria-live="polite">
      <span class="mr-1 text-sm text-muted">{{ $t('search.nextToday', { from: city(from), to: city(to) }) }}</span>
      <NuxtLinkLocale
        v-for="n in next"
        :key="n.time"
        :to="{ path: '/reserver', query: todayQuery }"
        class="chip surface !rounded-full !px-3.5 !py-1.5 transition-shadow hover:shadow-[var(--shadow-soft)]"
      >
        <span class="tnum font-bold">{{ n.time }}</span>
        <span class="font-normal text-muted">{{ $t('search.seats', { n: n.left }, n.left) }}</span>
      </NuxtLinkLocale>
    </div>
  </div>
</template>
