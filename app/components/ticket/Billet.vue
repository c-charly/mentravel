<script setup lang="ts">
// Le billet: objet central du produit. Meme composant pour la version complete et la version masquee.
import QRCode from 'qrcode'
import { CLASSES } from '~~/content/network'
import type { FullTicket, MaskedTicket } from '#shared/types'

const props = defineProps<{ ticket: MaskedTicket | FullTicket; print?: boolean; stampAnimate?: boolean }>()

const { city, dateShort, fcfa, duration } = useL10n()
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
  <div class="ticket-wrap mx-auto w-full max-w-[44rem]">
    <article ref="el" class="ticket overflow-hidden rounded-[1.1rem]" :aria-label="$t('ticket.aria', { pnr: ticket.pnr })">
      <!-- Bandeau -->
      <div class="flex items-center justify-between gap-3 bg-[#031225] px-4 py-2 text-[#f4efe6]">
        <span class="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" stroke="#f4efe6" stroke-width="2" stroke-linecap="round" opacity="0.6" />
            <circle cx="5" cy="12" r="2.8" fill="#3ddc9e" />
            <circle cx="12" cy="12" r="2.8" fill="#ff9250" />
            <circle cx="19" cy="12" r="2.8" fill="#34d3e3" />
          </svg>
          <span class="text-xs font-bold tracking-tight">MEN TRAVEL</span>
        </span>
        <span class="text-xs font-semibold text-[#f4efe6]/80">{{ CLASSES[ticket.classId].name }}</span>
      </div>

      <div class="grid sm:grid-cols-[1fr_var(--stub-w)]">
        <!-- Corps -->
        <div class="min-w-0 px-4 pb-3 pt-3">
          <div class="flex items-center gap-3">
            <div class="min-w-0">
              <p class="display text-[1.55rem] leading-none sm:text-[1.7rem]">{{ city(ticket.route.fromCity) }}</p>
              <p class="mt-1 truncate text-[0.68rem] text-[#031225]/65">{{ ticket.route.boardingPoint }}</p>
            </div>
            <div class="relative h-4 min-w-8 flex-1" aria-hidden="true">
              <span class="absolute inset-x-1 top-1/2 h-[2px] -translate-y-1/2 bg-[#031225]" />
              <span class="absolute left-0 top-1/2 size-3 -translate-y-1/2 rounded-full" :style="{ background: colors[ticket.route.fromCity] }" />
              <Icon name="lucide:bus" class="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 bg-[#fbf8f2] px-0.5" />
              <span class="absolute right-0 top-1/2 size-3 -translate-y-1/2 rounded-full" :style="{ background: colors[ticket.route.toCity] }" />
            </div>
            <div class="min-w-0 text-right">
              <p class="display text-[1.55rem] leading-none sm:text-[1.7rem]">{{ city(ticket.route.toCity) }}</p>
              <p class="mt-1 truncate text-[0.68rem] text-[#031225]/65">{{ ticket.route.arrivalPoint }}</p>
            </div>
          </div>

          <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-4 sm:text-[0.82rem]">
            <div>
              <dt class="text-[#031225]/60">{{ $t('ticket.date') }}</dt>
              <dd class="font-bold capitalize">{{ dateShort(ticket.date) }}</dd>
            </div>
            <div>
              <dt class="text-[#031225]/60">{{ $t('ticket.departure') }} / {{ $t('ticket.arrival') }}</dt>
              <dd class="mono font-bold">{{ ticket.departureTime }} - {{ ticket.arrivalTime }}<span v-if="ticket.arrivalNextDay" class="text-[0.65rem]"> +1</span></dd>
            </div>
            <div>
              <dt class="text-[#031225]/60">{{ $t('ticket.seats') }}</dt>
              <dd class="mono flex flex-wrap gap-1 font-bold">
                <span v-for="s in ticket.seatIds" :key="s" class="rounded border border-[#031225] px-1">{{ s }}</span>
              </dd>
            </div>
            <div>
              <dt class="text-[#031225]/60">{{ $t('ticket.passengers') }} / {{ $t('ticket.duration') }}</dt>
              <dd class="font-bold">{{ ticket.passengerCount }} / {{ duration(ticket.route.durationMin) }}</dd>
            </div>
          </dl>

          <div class="ticket-dash mt-3" />
          <dl class="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3 sm:text-[0.82rem]">
            <div class="col-span-2 sm:col-span-1">
              <dt class="text-[#031225]/60">{{ $t('ticket.holder') }}</dt>
              <dd class="font-bold">
                <template v-if="full">{{ full.firstName }} {{ full.lastName }}</template>
                <template v-else>
                  <MaskedText :value="ticket.holderMasked.firstName" /><span class="mx-0.5" /><MaskedText :value="ticket.holderMasked.lastName" />
                </template>
              </dd>
            </div>
            <div>
              <dt class="text-[#031225]/60">{{ $t('ticket.phone') }}</dt>
              <dd class="mono font-bold">
                <template v-if="full">{{ phoneDisplay(full.phone) }}</template>
                <MaskedText v-else :value="ticket.holderMasked.phone" />
              </dd>
            </div>
            <div>
              <dt class="text-[#031225]/60">{{ $t('ticket.idNumber') }}</dt>
              <dd class="mono font-bold">
                <template v-if="full">{{ full.idNumber }}</template>
                <MaskedText v-else :value="ticket.holderMasked.idNumber" />
              </dd>
            </div>
          </dl>
          <p v-if="!full" class="mt-2 flex items-center gap-1 text-[0.68rem] text-[#031225]/60">
            <Icon name="lucide:eye-off" class="size-3.5" />{{ $t('ticket.maskedNote') }}
          </p>
        </div>

        <!-- Souche: QR, PNR, montant, tampon -->
        <div class="ticket-dash-v flex h-[var(--stub-h)] items-center gap-3 border-t-[1.5px] border-dashed border-[#031225]/30 px-4 sm:h-auto sm:flex-col sm:justify-center sm:gap-2 sm:border-l-[1.5px] sm:border-t-0 sm:px-3 sm:py-3">
          <img v-if="qr" :src="qr" width="84" height="84" class="size-[76px] shrink-0 rounded sm:size-[88px]" :alt="$t('ticket.qrAlt')" />
          <span v-else class="size-[76px] shrink-0 animate-pulse rounded bg-[#031225]/10 sm:size-[88px]" />
          <div class="min-w-0 flex-1 sm:flex-none sm:text-center">
            <p class="mono text-[0.78rem] font-bold leading-tight">{{ ticket.pnr }}</p>
            <p class="display tnum mt-0.5 text-lg leading-none">{{ fcfa(ticket.amountPaidFcfa > 0 ? ticket.amountPaidFcfa : ticket.amountFcfa) }}</p>
            <p class="mt-0.5 text-[0.65rem] text-[#031225]/60">{{ ticket.amountPaidFcfa > 0 ? $t('ticket.paid') : $t('ticket.amountDue') }}</p>
            <div class="mt-1.5"><StampStatut :stamp="ticket.stamp" variant="stamp" :animate="stampAnimate" /></div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>
