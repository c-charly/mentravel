<script setup lang="ts">
// Devis de location: une question par ecran, une estimation qui se precise a chaque reponse.
import { CITIES, CITY_IDS } from '~~/content/network'
import { BUS_SIZES, estimateQuote } from '#shared/quote'
import { todayDouala } from '#shared/time'
import { formatPhoneNational, isValidName, isValidPhone, normalizePhone } from '#shared/validation'
import type { TripKind } from '#shared/types'

const { t } = useI18n()
const { fcfa } = useL10n()
const api = useMtApi()
useSeoMeta({ title: () => t('charter.seoTitle'), description: () => t('charter.seoDescription') })

type StepId = 'kind' | 'passengers' | 'route' | 'dates' | 'details' | 'contact' | 'recap' | 'done'
const order: StepId[] = ['kind', 'passengers', 'route', 'dates', 'details', 'contact', 'recap', 'done']
const step = ref<StepId>('kind')
const idx = computed(() => order.indexOf(step.value))
const today = todayDouala()

const form = reactive({
  tripKind: 'round-trip' as TripKind,
  passengers: 30,
  fromPlace: '',
  toPlace: '',
  startDate: '',
  endDate: '',
  occasion: '',
  notes: '',
  name: '',
  phone: '',
  email: '',
})
const kinds: { id: TripKind; icon: string }[] = [
  { id: 'one-way', icon: 'lucide:arrow-right' },
  { id: 'round-trip', icon: 'lucide:arrow-left-right' },
  { id: 'charter', icon: 'lucide:calendar-range' },
]

const showError = ref(false)
const busy = ref(false)
const failed = ref(false)
const reference = ref('')

const estimate = computed(() =>
  estimateQuote({
    tripKind: form.tripKind,
    passengers: form.passengers,
    fromPlace: form.fromPlace,
    toPlace: form.toPlace,
    startDate: form.startDate || today,
    endDate: form.endDate || undefined,
  }),
)

function stepValid(s: StepId): boolean {
  if (s === 'passengers') return Number.isInteger(form.passengers) && form.passengers >= 1 && form.passengers <= 500
  if (s === 'route') return form.fromPlace.trim().length > 1 && form.toPlace.trim().length > 1
  if (s === 'dates') {
    if (!form.startDate || form.startDate < today) return false
    if (form.tripKind !== 'one-way' && form.endDate && form.endDate < form.startDate) return false
    return true
  }
  if (s === 'contact') return isValidName(form.name) && isValidPhone(form.phone)
  return true
}

function next() {
  showError.value = false
  if (!stepValid(step.value)) {
    showError.value = true
    return
  }
  step.value = order[idx.value + 1]!
}
function back() {
  showError.value = false
  if (idx.value > 0) step.value = order[idx.value - 1]!
}
function pickKind(k: TripKind) {
  form.tripKind = k
  step.value = 'passengers'
}
function stepPassengers(delta: number) {
  form.passengers = Math.min(500, Math.max(1, form.passengers + delta))
}
function onPhone(e: Event) {
  form.phone = formatPhoneNational((e.target as HTMLInputElement).value)
}

async function submit() {
  busy.value = true
  failed.value = false
  try {
    const res = await api.createQuote({
      name: form.name.trim(),
      phone: normalizePhone(form.phone),
      email: form.email.trim() || undefined,
      tripKind: form.tripKind,
      passengers: form.passengers,
      fromPlace: form.fromPlace.trim(),
      toPlace: form.toPlace.trim(),
      startDate: form.startDate,
      endDate: form.tripKind !== 'one-way' && form.endDate ? form.endDate : undefined,
      occasion: form.occasion.trim() || undefined,
      notes: form.notes.trim() || undefined,
    })
    reference.value = res.reference
    step.value = 'done'
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}

const heading = ref<HTMLElement | null>(null)
watch(step, async () => {
  await nextTick()
  heading.value?.focus({ preventScroll: true })
})

// Entree douce a chaque etape du tunnel
const stepRoot = ref<HTMLElement | null>(null)
useStepEnter(stepRoot, () => step.value)
</script>

<template>
  <div>
    <PageHeader :title="$t(`charter.q.${step}`)" :lead="step !== 'done' ? $t(`charter.hint.${step}`) : undefined" :eyebrow="$t('charter.kicker')">
      <div v-if="step !== 'done'" class="mt-8 flex max-w-md items-center gap-1.5" role="progressbar" :aria-valuenow="idx + 1" aria-valuemin="1" aria-valuemax="7" :aria-label="$t('charter.progress')">
        <span v-for="n in 7" :key="n" class="h-1.5 flex-1 rounded-full transition-colors duration-500" :class="n <= idx + 1 ? 'bg-primary' : 'bg-base-300'" />
      </div>
    </PageHeader>

    <div class="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <div class="grid gap-12 lg:grid-cols-[1fr_21rem]">
        <div ref="stepRoot">
          <h2 ref="heading" tabindex="-1" class="sr-only">{{ $t(`charter.q.${step}`) }}</h2>

          <!-- Type de course -->
          <div v-if="step === 'kind'" class="grid gap-3 sm:grid-cols-3">
            <button v-for="k in kinds" :key="k.id" type="button" class="surface flex flex-col items-start gap-2 p-5 text-left transition-shadow hover:shadow-[var(--shadow-lift)]" :class="form.tripKind === k.id ? 'ring-2 ring-primary' : ''" @click="pickKind(k.id)">
              <span class="grid size-10 place-items-center rounded-2xl bg-base-200"><Icon :name="k.icon" class="size-5" /></span>
              <span class="display mt-2 text-lg">{{ $t(`charter.kinds.${k.id}.name`) }}</span>
              <span class="text-sm text-muted">{{ $t(`charter.kinds.${k.id}.text`) }}</span>
            </button>
          </div>

          <!-- Passagers -->
          <div v-else-if="step === 'passengers'">
            <div class="flex items-center gap-4">
              <button type="button" class="btn btn-circle btn-outline btn-lg" :aria-label="$t('charter.less')" @click="stepPassengers(-5)"><Icon name="lucide:minus" class="size-6" /></button>
              <input v-model.number="form.passengers" type="number" min="1" max="500" inputmode="numeric" class="input display w-32 text-center text-3xl" :aria-label="$t('charter.q.passengers')" />
              <button type="button" class="btn btn-circle btn-outline btn-lg" :aria-label="$t('charter.more')" @click="stepPassengers(5)"><Icon name="lucide:plus" class="size-6" /></button>
            </div>
            <ul class="mt-6 flex flex-wrap gap-2" :aria-label="$t('charter.sizes')">
              <li v-for="s in BUS_SIZES" :key="s" class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors" :class="estimate.busSize === s ? 'bg-base-content text-base-100' : 'bg-base-200 text-muted'">
                {{ s }} {{ $t('charter.seats') }}
              </li>
            </ul>
            <p class="mt-4 font-medium" aria-live="polite">{{ $t('charter.suggest', { n: estimate.busCount, size: estimate.busSize }, estimate.busCount) }}</p>
          </div>

          <!-- Itineraire -->
          <div v-else-if="step === 'route'" class="grid max-w-xl gap-5">
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('charter.fromPlace') }}</span>
              <input v-model="form.fromPlace" list="mt-cities" class="input w-full" :class="showError && form.fromPlace.trim().length < 2 ? 'is-invalid' : ''" autocomplete="off" />
            </label>
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('charter.toPlace') }}</span>
              <input v-model="form.toPlace" list="mt-cities" class="input w-full" :class="showError && form.toPlace.trim().length < 2 ? 'is-invalid' : ''" autocomplete="off" />
            </label>
            <datalist id="mt-cities"><option v-for="c in CITY_IDS" :key="c" :value="CITIES[c].name" /></datalist>
          </div>

          <!-- Dates -->
          <div v-else-if="step === 'dates'" class="grid max-w-xl gap-5 sm:grid-cols-2">
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('charter.startDate') }}</span>
              <input v-model="form.startDate" type="date" :min="today" class="input w-full" :class="showError && !stepValid('dates') ? 'is-invalid' : ''" />
            </label>
            <label v-if="form.tripKind !== 'one-way'">
              <span class="mb-1.5 block text-sm font-medium">{{ form.tripKind === 'charter' ? $t('charter.lastDay') : $t('charter.returnDate') }}</span>
              <input v-model="form.endDate" type="date" :min="form.startDate || today" class="input w-full" />
            </label>
          </div>

          <!-- Details -->
          <div v-else-if="step === 'details'" class="grid max-w-xl gap-5">
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('charter.occasion') }}</span>
              <input v-model="form.occasion" class="input w-full" :placeholder="$t('charter.occasionPh')" />
            </label>
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('charter.notes') }}</span>
              <textarea v-model="form.notes" rows="4" class="textarea w-full" />
            </label>
          </div>

          <!-- Contact -->
          <div v-else-if="step === 'contact'" class="grid max-w-xl gap-5">
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.fullName') }}</span>
              <input v-model="form.name" class="input w-full" :class="showError && !isValidName(form.name) ? 'is-invalid' : ''" autocomplete="name" />
            </label>
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('holder.phone') }}</span>
              <span class="input flex w-full items-center gap-2" :class="showError && !isValidPhone(form.phone) ? 'is-invalid' : ''">
                <span class="mono font-semibold text-muted">+237</span>
                <input :value="form.phone" class="mono grow bg-transparent outline-none" inputmode="tel" autocomplete="tel-national" @input="onPhone" />
              </span>
            </label>
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.email') }}</span>
              <input v-model="form.email" type="email" class="input w-full" autocomplete="email" />
            </label>
          </div>

          <!-- Recapitulatif -->
          <div v-else-if="step === 'recap'" class="max-w-xl">
            <dl class="surface divide-y divide-[var(--line)]">
              <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-muted">{{ $t('charter.q.kind') }}</dt><dd class="font-semibold">{{ $t(`charter.kinds.${form.tripKind}.name`) }}</dd></div>
              <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-muted">{{ $t('charter.passengers') }}</dt><dd class="font-semibold">{{ form.passengers }}</dd></div>
              <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-muted">{{ $t('charter.route') }}</dt><dd class="text-right font-semibold">{{ form.fromPlace }} - {{ form.toPlace }}</dd></div>
              <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-muted">{{ $t('charter.dates') }}</dt><dd class="font-semibold">{{ form.startDate }}<template v-if="form.endDate"> - {{ form.endDate }}</template></dd></div>
              <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-muted">{{ $t('charter.contact') }}</dt><dd class="text-right font-semibold">{{ form.name }}, +237 {{ form.phone }}</dd></div>
            </dl>
            <p v-if="failed" class="mt-4 rounded-2xl bg-error/10 p-3.5 font-medium text-error" role="alert">{{ $t('parcels.errGeneric') }}</p>
            <button type="button" class="btn btn-primary btn-lg mt-6" :disabled="busy" @click="submit">
              <Icon v-if="busy" name="lucide:loader" class="size-5 animate-spin" />{{ $t('charter.send') }}
            </button>
          </div>

          <!-- Termine -->
          <div v-else class="surface max-w-xl p-6 sm:p-8">
            <span class="grid size-12 place-items-center rounded-full bg-success text-success-content"><Icon name="lucide:check" class="size-6" /></span>
            <p class="mt-5 text-sm text-muted">{{ $t('charter.reference') }}</p>
            <p class="mono text-2xl font-bold">{{ reference }}</p>
            <p class="mt-4 text-lg text-muted">{{ $t('charter.doneText') }}</p>
            <NuxtLinkLocale to="/" class="btn btn-outline mt-6">{{ $t('done.home') }}</NuxtLinkLocale>
          </div>

          <p v-if="showError" class="mt-5 flex items-center gap-2 font-medium text-error" role="alert">
            <Icon name="lucide:circle-alert" class="size-5" />{{ $t('charter.errStep') }}
          </p>

          <div v-if="step !== 'kind' && step !== 'recap' && step !== 'done'" class="mt-8 flex gap-2">
            <button type="button" class="btn btn-ghost" @click="back"><Icon name="lucide:arrow-left" class="size-5" />{{ $t('charter.back') }}</button>
            <button type="button" class="btn btn-primary" @click="next">{{ $t('booking.continue') }}<Icon name="lucide:arrow-right" class="size-5" /></button>
          </div>
          <button v-if="step === 'recap'" type="button" class="btn btn-ghost mt-3" @click="back"><Icon name="lucide:arrow-left" class="size-5" />{{ $t('charter.back') }}</button>
        </div>

        <!-- Estimation en direct -->
        <aside v-if="step !== 'kind' && step !== 'done'" v-reveal.left="{ x: 36 }" :aria-label="$t('charter.estimateTitle')">
          <div class="surface sticky top-24 p-6" aria-live="polite">
            <p class="text-sm text-muted">{{ $t('charter.estimateTitle') }}</p>
            <p class="display tnum mt-2 text-2xl">{{ fcfa(estimate.minFcfa) }}<br />{{ $t('charter.to') }} {{ fcfa(estimate.maxFcfa) }}</p>
            <p class="mt-3 text-sm text-muted">{{ $t('charter.estimateNote', { n: estimate.busCount, size: estimate.busSize }) }}</p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
