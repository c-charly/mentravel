<script setup lang="ts">
// Le billet: objet central du produit. Meme composant pour la version complete et la version masquee.
import QRCode from 'qrcode'
import { CLASSES } from '~~/content/network'
import type { FullTicket, MaskedTicket } from '#shared/types'

const props = defineProps<{ ticket: MaskedTicket | FullTicket; print?: boolean; stampAnimate?: boolean }>()

const { city, dateLong, fcfa, duration } = useL10n()
const el = ref<HTMLElement | null>(null)
const qr = ref('')

const full = computed(() => ('holder' in props.ticket ? (props.ticket as FullTicket).holder : null))
const colors = { yaounde: 'var(--yde)', douala: 'var(--dla)', kribi: 'var(--kri)' } as const

onMounted(async () => {
  // QR genere cote client: l'origine reelle du site fait foi (pas une valeur de build)
  const base = window.location.origin
  try {
    qr.value = await QRCode.toDataURL(`${base}/verifier/${props.ticket.pnr}`, {
      margin: 1,
      width: 220,
      color: { dark: '#031225', light: '#fbf8f2' },
    })
  } catch {
    // Le PNR imprime sur le billet reste la verification de secours
    qr.value = ''
  }
})

function phoneDisplay(p: string) {
  const d = p.replace(/\D/g, '')
  return `+237 ${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`
}

defineExpose({ el })
</script>

<template>
  <article
    ref="el"
    class="relative mx-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] bg-white text-[#0b1b2b] shadow-[var(--shadow-lift)] ring-1 ring-black/5"
    :aria-label="$t('ticket.aria', { pnr: ticket.pnr })"
  >
    <!-- En-tete -->
    <div class="flex items-center justify-between gap-3 px-6 pt-6">
      <span class="inline-flex items-center gap-2.5">
        <span class="grid size-8 place-items-center rounded-[10px] bg-[#0b2545]">
          <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.55" />
            <circle cx="5" cy="12" r="2.6" fill="#3ddc9e" />
            <circle cx="12" cy="12" r="2.6" fill="#ff9250" />
            <circle cx="19" cy="12" r="2.6" fill="#34d3e3" />
          </svg>
        </span>
        <span class="text-sm font-bold tracking-tight">MEN TRAVEL</span>
      </span>
      <StampStatut :stamp="ticket.stamp" :animate="stampAnimate" />
    </div>

    <!-- Trajet -->
    <div class="px-6 pt-7">
      <div class="flex items-center gap-3">
        <div class="min-w-0">
          <p class="display text-3xl">{{ city(ticket.route.fromCity) }}</p>
          <p class="mt-0.5 truncate text-xs text-slate-500">{{ ticket.route.boardingPoint }}</p>
        </div>
        <div class="relative h-5 flex-1" aria-hidden="true">
          <span class="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
          <span class="absolute left-0 top-1/2 size-3 -translate-y-1/2 rounded-full" :style="{ background: colors[ticket.route.fromCity] }" />
          <Icon name="lucide:bus" class="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 bg-white px-0.5 text-slate-500" />
          <span class="absolute right-0 top-1/2 size-3 -translate-y-1/2 rounded-full" :style="{ background: colors[ticket.route.toCity] }" />
        </div>
        <div class="min-w-0 text-right">
          <p class="display text-3xl">{{ city(ticket.route.toCity) }}</p>
          <p class="mt-0.5 truncate text-xs text-slate-500">{{ ticket.route.arrivalPoint }}</p>
        </div>
      </div>

      <p class="mt-6 text-sm capitalize text-slate-500">{{ dateLong(ticket.date) }}</p>
      <div class="mt-1 flex items-baseline gap-3">
        <span class="mono text-3xl font-bold">{{ ticket.departureTime }}</span>
        <span class="text-slate-400">-</span>
        <span class="mono text-3xl font-bold">
          {{ ticket.arrivalTime }}<span v-if="ticket.arrivalNextDay" class="ml-1 text-base text-slate-500">+1</span>
        </span>
        <span class="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{{ duration(ticket.route.durationMin) }}</span>
      </div>

      <dl class="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
        <div>
          <dt class="text-slate-500">{{ $t('ticket.class') }}</dt>
          <dd class="font-semibold">{{ CLASSES[ticket.classId].name }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">{{ $t('ticket.passengers') }}</dt>
          <dd class="font-semibold">{{ ticket.passengerCount }}</dd>
        </div>
        <div class="col-span-2 sm:col-span-1">
          <dt class="text-slate-500">{{ $t('ticket.seats') }}</dt>
          <dd class="mono flex flex-wrap gap-1.5 font-semibold">
            <span v-for="s in ticket.seatIds" :key="s" class="rounded-lg bg-slate-100 px-2 py-0.5">{{ s }}</span>
          </dd>
        </div>
      </dl>
    </div>

    <!-- Titulaire -->
    <div class="mx-6 mt-6 border-t border-slate-100 pt-5">
      <dl class="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-slate-500">{{ $t('ticket.holder') }}</dt>
          <dd class="text-base font-semibold">
            <template v-if="full">{{ full.firstName }} {{ full.lastName }}</template>
            <template v-else>
              <MaskedText :value="ticket.holderMasked.firstName" />
              <span class="mx-1" />
              <MaskedText :value="ticket.holderMasked.lastName" />
            </template>
          </dd>
        </div>
        <div>
          <dt class="text-slate-500">{{ $t('ticket.phone') }}</dt>
          <dd class="mono text-base font-semibold">
            <template v-if="full">{{ phoneDisplay(full.phone) }}</template>
            <MaskedText v-else :value="ticket.holderMasked.phone" />
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-slate-500">{{ $t('ticket.idNumber') }}</dt>
          <dd class="mono text-base font-semibold">
            <template v-if="full">{{ full.idNumber }}</template>
            <MaskedText v-else :value="ticket.holderMasked.idNumber" />
          </dd>
        </div>
      </dl>
      <p v-if="!full" class="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Icon name="lucide:eye-off" class="size-4" />{{ $t('ticket.maskedNote') }}
      </p>
    </div>

    <!-- Pied: montant, PNR, QR -->
    <div class="mt-6 flex items-center justify-between gap-4 bg-slate-50 px-6 py-5">
      <div class="min-w-0">
        <p class="text-xs text-slate-500">{{ ticket.amountPaidFcfa > 0 ? $t('ticket.paid') : $t('ticket.amountDue') }}</p>
        <p class="display tnum text-2xl">{{ fcfa(ticket.amountPaidFcfa > 0 ? ticket.amountPaidFcfa : ticket.amountFcfa) }}</p>
        <p class="mt-3 text-xs text-slate-500">{{ $t('ticket.pnr') }}</p>
        <p class="mono text-lg font-bold tracking-tight">{{ ticket.pnr }}</p>
      </div>
      <div class="text-center">
        <img v-if="qr" :src="qr" width="104" height="104" class="size-[104px] rounded-lg" :alt="$t('ticket.qrAlt')" />
        <span v-else class="block size-[104px] animate-pulse rounded-lg bg-slate-200" />
        <p class="mt-1.5 max-w-[104px] text-[0.65rem] leading-tight text-slate-500">{{ $t('ticket.boardingNote') }}</p>
      </div>
    </div>
  </article>
</template>
