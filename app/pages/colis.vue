<script setup lang="ts">
import { CITY_IDS } from '~~/content/network'
import { estimateParcel } from '#shared/quote'
import { todayDouala } from '#shared/time'
import { formatPhoneNational, isValidName, isValidPhone, normalizePhone } from '#shared/validation'
import type { CityId, ParcelKind, ParcelStage, ParcelView } from '#shared/types'

const { t } = useI18n()
const { city, fcfa, dateLong } = useL10n()
const api = useMtApi()
useSeoMeta({ title: () => t('parcels.seoTitle'), description: () => t('parcels.seoDescription') })

const tab = ref<'send' | 'track'>('send')
const kinds: ParcelKind[] = ['document', 'small', 'medium', 'large']
const stages: ParcelStage[] = ['registered', 'dropped', 'onboard', 'arrived', 'delivered']
const stageIcons: Record<ParcelStage, string> = {
  registered: 'lucide:clipboard-list',
  dropped: 'lucide:building-2',
  onboard: 'lucide:bus',
  arrived: 'lucide:map-pin',
  delivered: 'lucide:package-check',
}
const today = todayDouala()

const form = reactive({
  senderName: '',
  senderPhone: '',
  senderEmail: '',
  kind: 'small' as ParcelKind,
  weightKg: 3,
  from: 'yaounde' as CityId,
  to: 'douala' as CityId,
  sendDate: today,
  declaredValue: '' as string,
  receiverName: '',
  receiverPhone: '',
  notes: '',
})
const touched = ref(false)
const busy = ref(false)
const failed = ref(false)
const created = ref<ParcelView | null>(null)

const errors = computed(() => ({
  senderName: !isValidName(form.senderName),
  senderPhone: !isValidPhone(form.senderPhone),
  receiverName: !isValidName(form.receiverName),
  receiverPhone: !isValidPhone(form.receiverPhone),
  weightKg: !(form.weightKg > 0 && form.weightKg <= 200),
  route: form.from === form.to,
  sendDate: !form.sendDate || form.sendDate < today,
}))
const valid = computed(() => !Object.values(errors.value).some(Boolean))
const estimate = computed(() => estimateParcel(form.kind, Number(form.weightKg) || 0, form.from, form.to))

function swapIfSame(changed: 'from' | 'to') {
  if (form.from !== form.to) return
  const other = CITY_IDS.find((c) => c !== form[changed])!
  if (changed === 'from') form.to = other
  else form.from = other
}

async function submit() {
  touched.value = true
  failed.value = false
  if (!valid.value) return
  busy.value = true
  try {
    created.value = await api.createParcel({
      senderName: form.senderName.trim(),
      senderPhone: normalizePhone(form.senderPhone),
      senderEmail: form.senderEmail.trim() || undefined,
      kind: form.kind,
      weightKg: Number(form.weightKg),
      from: form.from,
      to: form.to,
      sendDate: form.sendDate,
      declaredValue: form.declaredValue ? Number(form.declaredValue) : undefined,
      receiverName: form.receiverName.trim(),
      receiverPhone: normalizePhone(form.receiverPhone),
      notes: form.notes.trim() || undefined,
    })
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}

// Suivi
const trackInput = ref('')
const tracked = ref<ParcelView | null>(null)
const trackState = ref<'idle' | 'loading' | 'unknown' | 'error'>('idle')
async function track(id = trackInput.value) {
  const clean = id.trim().toUpperCase()
  if (!/^CL-[A-Z0-9]{8}$/.test(clean)) {
    trackState.value = 'unknown'
    tracked.value = null
    return
  }
  trackState.value = 'loading'
  try {
    tracked.value = await api.parcel(clean)
    trackState.value = 'idle'
  } catch (e) {
    tracked.value = null
    trackState.value = (e as { status?: number }).status === 404 ? 'unknown' : 'error'
  }
}
function trackCreated() {
  if (!created.value) return
  tab.value = 'track'
  trackInput.value = created.value.trackingId
  void track(created.value.trackingId)
}
const phoneFmt = (key: 'senderPhone' | 'receiverPhone', e: Event) => {
  form[key] = formatPhoneNational((e.target as HTMLInputElement).value)
}
const stageIndex = (s: ParcelStage) => stages.indexOf(s)
</script>

<template>
  <div>
    <PageHeader :title="$t('parcels.title')" :lead="$t('parcels.lead')">
      <ol class="mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
        <li v-for="n in 3" :key="n" class="flex gap-3.5">
          <span class="grid size-8 shrink-0 place-items-center rounded-full bg-base-100 text-sm font-bold shadow-[var(--shadow-soft)]">{{ n }}</span>
          <span>
            <span class="block font-semibold">{{ $t(`parcels.step${n}.title`) }}</span>
            <span class="text-sm text-muted">{{ $t(`parcels.step${n}.text`) }}</span>
          </span>
        </li>
      </ol>
    </PageHeader>

    <div class="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <div class="inline-flex rounded-full bg-base-200 p-1" role="tablist">
        <button type="button" role="tab" :aria-selected="tab === 'send'" class="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors" :class="tab === 'send' ? 'bg-base-100 shadow-[var(--shadow-soft)]' : 'text-muted'" @click="tab = 'send'">
          <Icon name="lucide:package" class="size-4" />{{ $t('parcels.tabSend') }}
        </button>
        <button type="button" role="tab" :aria-selected="tab === 'track'" class="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors" :class="tab === 'track' ? 'bg-base-100 shadow-[var(--shadow-soft)]' : 'text-muted'" @click="tab = 'track'">
          <Icon name="lucide:search" class="size-4" />{{ $t('parcels.tabTrack') }}
        </button>
      </div>

      <!-- Envoi -->
      <div v-if="tab === 'send'" class="mt-8">
        <div v-if="created" class="surface max-w-2xl p-6 sm:p-8" role="status">
          <span class="grid size-12 place-items-center rounded-full bg-success text-success-content"><Icon name="lucide:check" class="size-6" /></span>
          <h2 class="display mt-5 text-3xl">{{ $t('parcels.doneTitle') }}</h2>
          <p class="mt-2 text-muted">{{ $t('parcels.doneText') }}</p>
          <p class="mt-6 text-sm text-muted">{{ $t('parcels.trackingId') }}</p>
          <p class="mono text-2xl font-bold">{{ created.trackingId }}</p>
          <p class="mt-4">
            {{ city(created.from) }} - {{ city(created.to) }}, {{ dateLong(created.sendDate) }}.
            <span class="font-semibold">{{ $t('parcels.estimate') }} {{ fcfa(created.estimateFcfa) }}</span>
          </p>
          <p class="mt-2 text-sm text-muted">{{ $t('parcels.estimateNote') }}</p>
          <div class="mt-6 flex flex-wrap gap-2">
            <button type="button" class="btn btn-primary" @click="trackCreated">{{ $t('parcels.followIt') }}</button>
            <button type="button" class="btn btn-ghost" @click="created = null">{{ $t('parcels.another') }}</button>
          </div>
        </div>

        <form v-else class="grid max-w-3xl gap-6" novalidate @submit.prevent="submit">
          <fieldset class="surface grid gap-4 p-6">
            <legend class="sr-only">{{ $t('parcels.sender') }}</legend>
            <h2 class="display text-xl">{{ $t('parcels.sender') }}</h2>
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.fullName') }}</span>
              <input v-model="form.senderName" class="input w-full" :class="touched && errors.senderName ? 'is-invalid' : ''" autocomplete="name" />
              <span v-if="touched && errors.senderName" class="mt-1 block text-sm font-medium text-error">{{ $t('holder.errName') }}</span>
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
              <label>
                <span class="mb-1.5 block text-sm font-medium">{{ $t('holder.phone') }}</span>
                <span class="input flex w-full items-center gap-2" :class="touched && errors.senderPhone ? 'is-invalid' : ''">
                  <span class="mono font-semibold text-muted">+237</span>
                  <input :value="form.senderPhone" class="mono grow bg-transparent outline-none" inputmode="tel" autocomplete="tel-national" @input="phoneFmt('senderPhone', $event)" />
                </span>
                <span v-if="touched && errors.senderPhone" class="mt-1 block text-sm font-medium text-error">{{ $t('holder.errPhone') }}</span>
              </label>
              <label>
                <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.email') }}</span>
                <input v-model="form.senderEmail" type="email" class="input w-full" autocomplete="email" />
              </label>
            </div>
          </fieldset>

          <fieldset class="surface grid gap-5 p-6">
            <legend class="sr-only">{{ $t('parcels.parcel') }}</legend>
            <h2 class="display text-xl">{{ $t('parcels.parcel') }}</h2>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" :aria-label="$t('parcels.kind')">
              <label
                v-for="k in kinds"
                :key="k"
                class="flex cursor-pointer flex-col gap-0.5 rounded-2xl border p-3.5 transition-colors hover:bg-base-200 has-[:checked]:border-base-content has-[:checked]:bg-base-200 has-[:checked]:ring-1 has-[:checked]:ring-base-content has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                :class="form.kind === k ? 'border-base-content' : 'border-line'"
              >
                <input v-model="form.kind" type="radio" class="sr-only" name="kind" :value="k" />
                <span class="font-semibold">{{ $t(`parcels.kinds.${k}.name`) }}</span>
                <span class="text-sm text-muted">{{ $t(`parcels.kinds.${k}.hint`) }}</span>
              </label>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <label>
                <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.weight') }}</span>
                <input v-model.number="form.weightKg" type="number" min="0.1" max="200" step="0.1" inputmode="decimal" class="input w-full" :class="touched && errors.weightKg ? 'is-invalid' : ''" />
              </label>
              <label>
                <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.sendDate') }}</span>
                <input v-model="form.sendDate" type="date" :min="today" class="input w-full" :class="touched && errors.sendDate ? 'is-invalid' : ''" />
              </label>
              <label>
                <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.from') }}</span>
                <select v-model="form.from" class="select w-full" @change="swapIfSame('from')">
                  <option v-for="c in CITY_IDS" :key="c" :value="c">{{ city(c) }}</option>
                </select>
              </label>
              <label>
                <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.to') }}</span>
                <select v-model="form.to" class="select w-full" @change="swapIfSame('to')">
                  <option v-for="c in CITY_IDS" :key="c" :value="c">{{ city(c) }}</option>
                </select>
              </label>
            </div>
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.declared') }}</span>
              <input v-model="form.declaredValue" type="number" min="0" inputmode="numeric" class="input w-full sm:w-1/2" />
            </label>
            <p class="flex items-center justify-between gap-3 rounded-2xl bg-base-200 px-4 py-3 font-semibold" aria-live="polite">
              <span class="flex items-center gap-2"><Icon name="lucide:receipt" class="size-5" />{{ $t('parcels.estimate') }}</span>
              <span class="display tnum text-xl">{{ fcfa(estimate) }}</span>
            </p>
            <p class="flex items-start gap-2 text-sm text-muted"><Icon name="lucide:ban" class="mt-0.5 size-4 shrink-0" />{{ $t('parcels.forbidden') }}</p>
          </fieldset>

          <fieldset class="surface grid gap-4 p-6">
            <legend class="sr-only">{{ $t('parcels.receiver') }}</legend>
            <h2 class="display text-xl">{{ $t('parcels.receiver') }}</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <label>
                <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.fullName') }}</span>
                <input v-model="form.receiverName" class="input w-full" :class="touched && errors.receiverName ? 'is-invalid' : ''" />
                <span v-if="touched && errors.receiverName" class="mt-1 block text-sm font-medium text-error">{{ $t('holder.errName') }}</span>
              </label>
              <label>
                <span class="mb-1.5 block text-sm font-medium">{{ $t('holder.phone') }}</span>
                <span class="input flex w-full items-center gap-2" :class="touched && errors.receiverPhone ? 'is-invalid' : ''">
                  <span class="mono font-semibold text-muted">+237</span>
                  <input :value="form.receiverPhone" class="mono grow bg-transparent outline-none" inputmode="tel" @input="phoneFmt('receiverPhone', $event)" />
                </span>
                <span v-if="touched && errors.receiverPhone" class="mt-1 block text-sm font-medium text-error">{{ $t('holder.errPhone') }}</span>
              </label>
            </div>
            <label>
              <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.notes') }}</span>
              <textarea v-model="form.notes" rows="3" class="textarea w-full" />
            </label>
          </fieldset>

          <p v-if="failed" class="rounded-2xl bg-error/10 p-3.5 font-medium text-error" role="alert">{{ $t('parcels.errGeneric') }}</p>
          <button type="submit" class="btn btn-primary btn-lg w-full sm:w-fit" :disabled="busy">
            <Icon v-if="busy" name="lucide:loader" class="size-5 animate-spin" />{{ $t('parcels.submit') }}
          </button>
        </form>
      </div>

      <!-- Suivi -->
      <div v-else class="mt-8 max-w-2xl">
        <form class="surface grid gap-3 p-6" novalidate @submit.prevent="track()">
          <label>
            <span class="mb-1.5 block text-sm font-medium">{{ $t('parcels.trackingId') }}</span>
            <input v-model="trackInput" class="input mono w-full text-lg tracking-wider" placeholder="CL-XXXXXXXX" autocapitalize="characters" autocomplete="off" />
          </label>
          <button type="submit" class="btn btn-primary w-fit" :disabled="trackState === 'loading'">{{ $t('parcels.trackCta') }}</button>
        </form>
        <p v-if="trackState === 'unknown'" class="mt-4 font-medium text-error" role="alert">{{ $t('parcels.unknown') }}</p>
        <p v-if="trackState === 'error'" class="mt-4 font-medium text-error" role="alert">{{ $t('common.offline') }}</p>

        <section v-if="tracked" class="surface mt-6 p-6" aria-live="polite">
          <p class="mono text-xl font-bold">{{ tracked.trackingId }}</p>
          <p class="mt-1 text-muted">{{ city(tracked.from) }} - {{ city(tracked.to) }}, {{ dateLong(tracked.sendDate) }}. {{ $t('parcels.receiverIs') }} <MaskedText :value="tracked.receiverMasked" />.</p>
          <ol class="mt-8 grid gap-0">
            <li v-for="(s, i) in stages" :key="s" class="relative flex items-center gap-4 pb-6 last:pb-0">
              <span v-if="i < stages.length - 1" class="absolute left-[1.05rem] top-9 h-[calc(100%-1.4rem)] w-0.5" :class="i < stageIndex(tracked.stage) ? 'bg-primary' : 'bg-base-300'" aria-hidden="true" />
              <span
                class="relative z-10 grid size-9 shrink-0 place-items-center rounded-full"
                :class="i < stageIndex(tracked.stage) ? 'bg-primary text-primary-content' : i === stageIndex(tracked.stage) ? 'bg-secondary text-secondary-content ring-4 ring-secondary/25' : 'bg-base-200 text-muted'"
              >
                <Icon :name="stageIcons[s]" class="size-[1.1rem]" />
              </span>
              <span :class="i === stageIndex(tracked.stage) ? 'font-semibold' : i < stageIndex(tracked.stage) ? '' : 'text-muted'">
                {{ $t(`parcels.stage.${s}`) }}
                <span v-if="i === stageIndex(tracked.stage)" class="sr-only">({{ $t('journey.current') }})</span>
              </span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  </div>
</template>
