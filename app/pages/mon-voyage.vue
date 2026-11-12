<script setup lang="ts">
import { formatPnrInput, isValidPnr } from '#shared/validation'

definePageMeta({ layout: 'tool' })
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const cache = useTicketCache()
useSeoMeta({ title: () => t('trip.seoTitle'), description: () => t('trip.seoDescription'), robots: 'noindex' })

const input = ref(typeof route.query.pnr === 'string' ? formatPnrInput(route.query.pnr) : '')
const touched = ref(false)
const pnr = ref(isValidPnr(input.value) ? input.value : '')
const valid = computed(() => isValidPnr(input.value))
const saved = ref<ReturnType<typeof cache.list>>([])
onMounted(() => (saved.value = cache.list()))

function onInput(e: Event) {
  input.value = formatPnrInput((e.target as HTMLInputElement).value)
}
function submit() {
  touched.value = true
  if (!valid.value) return
  pnr.value = input.value
  void router.replace({ query: { pnr: input.value } })
}
function open(p: string) {
  input.value = p
  pnr.value = p
  void router.replace({ query: { pnr: p } })
}
</script>

<template>
  <div>
    <h1 v-reveal.now class="display text-3xl sm:text-4xl">{{ $t('trip.title') }}</h1>
    <p v-reveal.now="{ delay: 0.1 }" class="mt-4 max-w-xl text-muted">{{ $t('trip.intro') }}</p>

    <form v-reveal.now="{ delay: 0.2 }" class="mt-8 grid max-w-xl gap-4" novalidate @submit.prevent="submit">
      <label>
        <span class="mb-1.5 block font-semibold">{{ $t('verify.pnrLabel') }}</span>
        <input
          :value="input"
          class="input mono w-full text-lg tracking-wider"
          :class="touched && !valid ? 'is-invalid' : ''"
          placeholder="MT-XXXXXX-XXXX"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          enterkeyhint="search"
          aria-describedby="trip-hint"
          @input="onInput"
        />
        <span id="trip-hint" class="mt-1.5 block text-sm" :class="touched && !valid ? 'font-semibold text-error' : 'text-muted'">
          {{ touched && !valid ? $t('verify.errFormat') : $t('verify.pnrHint') }}
        </span>
      </label>
      <button type="submit" class="btn btn-primary btn-lg w-full sm:w-fit">
        <Icon name="lucide:search" class="size-5" />{{ $t('trip.cta') }}
      </button>
    </form>

    <section v-if="saved.length && !pnr" class="mt-10 max-w-xl">
      <h2 class="display text-2xl">{{ $t('trip.saved') }}</h2>
      <ul class="mt-3 grid gap-2">
        <li v-for="s in saved" :key="s.ticket.pnr">
          <button type="button" class="surface flex w-full items-center justify-between px-4 py-3 text-left transition-shadow hover:shadow-[var(--shadow-lift)]" @click="open(s.ticket.pnr)">
            <span>
              <span class="mono block font-semibold">{{ s.ticket.pnr }}</span>
              <span class="text-sm text-muted">{{ s.ticket.date }}, {{ s.ticket.departureTime }}</span>
            </span>
            <Icon name="lucide:chevron-right" class="size-5" />
          </button>
        </li>
      </ul>
    </section>

    <div v-if="pnr" class="mt-12">
      <TicketResult :key="pnr" :pnr="pnr" />
    </div>
  </div>
</template>
