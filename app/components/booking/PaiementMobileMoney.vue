<script setup lang="ts">
// Paiement Mobile Money (simule). L'operateur est detecte a partir du numero.
import { BRAND } from '~~/content/network'
import { detectOperator, formatPhoneNational, isValidPhone, normalizePhone } from '#shared/validation'
import type { PaymentSim } from '#shared/types'

const emit = defineEmits<{ paid: []; back: [] }>()
const store = useBookingStore()
const api = useMtApi()
const route = useRoute()
const { fcfa } = useL10n()

type Phase = 'form' | 'waiting' | 'failed' | 'timeout' | 'lost' | 'seats_lost'
const phase = ref<Phase>('form')
const phone = ref(store.holder.phone)
const formError = ref('')
const startError = ref('')
const secondsLeft = ref(90)
const paymentId = ref<string | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null
let errorsInRow = 0

const operator = computed(() => detectOperator(phone.value))
const phoneOk = computed(() => isValidPhone(phone.value))
const unsupported = computed(() => phoneOk.value && !operator.value)

function onPhone(e: Event) {
  phone.value = formatPhoneNational((e.target as HTMLInputElement).value)
}

const sim = computed<PaymentSim | undefined>(() => {
  const v = route.query.sim
  return v === 'fail' || v === 'timeout' || v === 'success' ? v : undefined
})

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}
onBeforeUnmount(stopPolling)

async function poll() {
  if (!paymentId.value) return
  try {
    const p = await api.payment(paymentId.value)
    errorsInRow = 0
    secondsLeft.value = Math.max(0, secondsLeft.value - 2)
    if (p.status === 'success') {
      stopPolling()
      store.setPayment(p)
      store.paying = false
      emit('paid')
    } else if (p.status === 'failed') {
      stopPolling()
      store.paying = false
      phase.value = p.reason === 'seats_lost' ? 'seats_lost' : 'failed'
    } else if (p.status === 'timeout' || secondsLeft.value <= 0) {
      stopPolling()
      store.paying = false
      phase.value = 'timeout'
    }
  } catch {
    errorsInRow += 1
    if (errorsInRow >= 3) {
      stopPolling()
      phase.value = 'lost'
    }
  }
}

function startPolling() {
  stopPolling()
  errorsInRow = 0
  pollTimer = setInterval(() => void poll(), 2000)
}

async function pay() {
  formError.value = ''
  startError.value = ''
  if (!phoneOk.value || !operator.value) {
    formError.value = unsupported.value ? 'unsupported' : 'invalid'
    return
  }
  if (!store.result) return
  try {
    const p = await api.startPayment({
      pnrs: store.result.bookings.map((b) => b.pnr),
      phone: normalizePhone(phone.value),
      sim: sim.value,
    })
    paymentId.value = p.paymentId
    secondsLeft.value = 90
    store.paying = true
    phase.value = 'waiting'
    startPolling()
  } catch (e) {
    const code = (e as { code?: string }).code
    startError.value = code === 'expired' ? 'expired' : 'generic'
    if (code === 'expired') store.markExpired()
  }
}

async function checkAgain() {
  phase.value = 'waiting'
  startPolling()
  await poll()
}

function cancelWaiting() {
  stopPolling()
  store.paying = false
  phase.value = 'form'
}

const ussd = computed(() => (operator.value === 'orange' ? BRAND.ussd.orange : BRAND.ussd.mtn))
const opName = computed(() => (operator.value === 'orange' ? 'Orange Money' : 'MTN MoMo'))
</script>

<template>
  <div class="grid gap-6">
    <div>
      <h2 class="display text-3xl sm:text-4xl">{{ $t('pay.title') }}</h2>
      <p class="mt-2 text-muted">{{ $t('pay.intro') }}</p>
    </div>

    <!-- Attente de validation sur le telephone -->
    <div v-if="phase === 'waiting'" class="surface p-8 text-center" role="status" aria-live="polite">
      <div class="relative mx-auto grid size-28 place-items-center">
        <span class="absolute inset-0 rounded-full bg-secondary/40" style="animation: pulse-ring 1.8s ease-out infinite" />
        <span class="absolute inset-0 rounded-full bg-secondary/30" style="animation: pulse-ring 1.8s ease-out 0.6s infinite" />
        <span class="relative grid size-20 place-items-center rounded-full bg-secondary text-secondary-content">
          <Icon name="lucide:smartphone" class="size-9" />
        </span>
      </div>
      <p class="display mt-5 text-2xl">{{ $t('pay.waitTitle') }}</p>
      <p class="mx-auto mt-2 max-w-md text-muted">
        {{ $t('pay.waitText', { op: opName, amount: fcfa(store.totalFcfa) }) }}
      </p>
      <progress class="progress progress-warning mx-auto mt-5 w-64" :value="90 - secondsLeft" max="90" :aria-label="$t('pay.waitTitle')" />
      <button type="button" class="btn btn-ghost btn-sm mt-4" @click="cancelWaiting">{{ $t('pay.cancel') }}</button>
    </div>

    <!-- Echecs: la selection est conservee, on peut reessayer -->
    <div v-else-if="phase !== 'form'" class="rounded-2xl bg-error/10 p-6" role="alert">
      <div class="flex items-start gap-3">
        <Icon :name="phase === 'lost' ? 'lucide:wifi-off' : 'lucide:circle-x'" class="mt-1 size-7 shrink-0 text-error" />
        <div>
          <p class="display text-2xl">{{ $t(`pay.fail.${phase}.title`) }}</p>
          <p class="mt-2 text-muted">{{ $t(`pay.fail.${phase}.text`) }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button v-if="phase === 'lost'" type="button" class="btn btn-primary" @click="checkAgain">
              <Icon name="lucide:refresh-cw" class="size-5" />{{ $t('pay.checkAgain') }}
            </button>
            <button v-else-if="phase === 'seats_lost'" type="button" class="btn btn-primary" @click="emit('back')">
              {{ $t('pay.chooseOther') }}
            </button>
            <button v-else type="button" class="btn btn-primary" @click="phase = 'form'">
              <Icon name="lucide:refresh-cw" class="size-5" />{{ $t('pay.retry') }}
            </button>
            <a :href="`https://wa.me/${BRAND.whatsapp}`" target="_blank" rel="noopener" class="btn btn-ghost">
              <Icon name="simple-icons:whatsapp" class="size-5" />{{ $t('pay.helpWhatsapp') }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <form v-else class="grid gap-5" novalidate @submit.prevent="pay">
      <label class="form-control">
        <span class="mb-1.5 block font-semibold">{{ $t('pay.number') }}</span>
        <span class="input flex w-full items-center gap-2" :class="formError ? 'is-invalid' : ''">
          <span class="mono shrink-0 font-bold text-muted">+237</span>
          <input
            :value="phone"
            class="mono grow bg-transparent outline-none"
            inputmode="tel"
            autocomplete="tel-national"
            enterkeyhint="done"
            placeholder="6 53 67 74 43"
            aria-describedby="pay-hint"
            :aria-invalid="!!formError"
            @input="onPhone"
          />
          <span
            v-if="operator"
            class="shrink-0 rounded-md px-2.5 py-1 text-xs font-bold text-night"
            :style="{ background: operator === 'orange' ? '#ff7900' : '#ffcc00' }"
          >
            {{ opName }}
          </span>
        </span>
        <span id="pay-hint" class="mt-1 block text-sm" :class="formError || unsupported ? 'font-semibold text-error' : 'text-muted'">
          {{ unsupported || formError === 'unsupported' ? $t('pay.errOperator') : formError ? $t('pay.errNumber') : $t('pay.numberHint') }}
        </span>
      </label>

      <p v-if="startError" class="flex items-start gap-2 rounded-2xl bg-error/10 p-3.5 font-medium text-error" role="alert">
        <Icon name="lucide:circle-alert" class="mt-0.5 size-5 shrink-0" />
        {{ startError === 'expired' ? $t('pay.errExpired') : $t('pay.errGeneric') }}
      </p>

      <button type="submit" class="btn btn-primary btn-lg w-full sm:w-auto">
        <Icon name="lucide:smartphone" class="size-5" />
        {{ $t('pay.cta', { amount: fcfa(store.totalFcfa) }) }}
      </button>

      <details v-if="operator" class="rounded-2xl border border-line p-4">
        <summary class="cursor-pointer font-semibold">{{ $t('pay.noPrompt') }}</summary>
        <p class="mt-2 text-muted">
          {{ $t('pay.ussdText', { op: opName }) }}
          <span class="mono mt-2 block text-2xl font-bold text-base-content">{{ ussd }}</span>
        </p>
      </details>
    </form>

    <button v-if="phase === 'form'" type="button" class="btn btn-ghost btn-sm w-fit" @click="emit('back')">
      <Icon name="lucide:arrow-left" class="size-4" />{{ $t('pay.back') }}
    </button>
  </div>
</template>
