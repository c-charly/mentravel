<script setup lang="ts">
// Le recapitulatif qui se remplit au fil de la reservation.
import { CLASSES } from '~~/content/network'
import { maskDisplay } from '~/utils/maskPreview'

const store = useBookingStore()
const { city, dateShort, fcfa } = useL10n()

const colors = { yaounde: 'var(--yde)', douala: 'var(--dla)', kribi: 'var(--kri)' } as const

const holderLine = computed(() => {
  const h = store.holder
  if (!h.lastName && !h.firstName) return ''
  return `${maskDisplay(h.firstName)} ${maskDisplay(h.lastName)}`.trim()
})
</script>

<template>
  <div class="surface p-5">
    <h2 class="text-base font-semibold">{{ $t('booking.yourTicket') }}</h2>

    <div v-for="i in store.legCount" :key="i" class="mt-5" :class="i === 2 ? 'border-t border-line pt-5' : ''">
      <p v-if="store.roundTrip" class="mb-2 text-xs font-semibold text-muted">
        {{ i === 1 ? $t('booking.outbound') : $t('booking.inbound') }}
      </p>
      <div class="flex items-center gap-2.5">
        <span class="size-2.5 shrink-0 rounded-full" :style="{ background: colors[store.routeOf((i - 1) as 0 | 1).from] }" />
        <span class="font-semibold">{{ city(store.routeOf((i - 1) as 0 | 1).from) }}</span>
        <Icon name="lucide:arrow-right" class="size-4 text-muted" />
        <span class="size-2.5 shrink-0 rounded-full" :style="{ background: colors[store.routeOf((i - 1) as 0 | 1).to] }" />
        <span class="font-semibold">{{ city(store.routeOf((i - 1) as 0 | 1).to) }}</span>
      </div>

      <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt class="text-muted">{{ $t('ticket.date') }}</dt>
          <dd class="font-semibold">
            <span v-if="store.legs[i - 1]!.date" class="capitalize">{{ dateShort(store.legs[i - 1]!.date!) }}</span>
            <span v-else class="font-normal text-muted">{{ $t('booking.toChoose') }}</span>
          </dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('ticket.time') }}</dt>
          <dd class="tnum font-semibold">
            <template v-if="store.legs[i - 1]!.time">{{ store.legs[i - 1]!.time }} - {{ store.legs[i - 1]!.arrivalTime }}</template>
            <span v-else class="font-normal text-muted">{{ $t('booking.toChoose') }}</span>
          </dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('ticket.class') }}</dt>
          <dd class="font-semibold">
            <template v-if="store.legs[i - 1]!.classId">{{ CLASSES[store.legs[i - 1]!.classId!].name }}</template>
            <span v-else class="font-normal text-muted">{{ $t('booking.toChoose') }}</span>
          </dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('ticket.seats') }}</dt>
          <dd class="mono font-semibold">
            <template v-if="store.legs[i - 1]!.seatIds.length">{{ store.legs[i - 1]!.seatIds.join(' ') }}</template>
            <span v-else class="font-sans font-normal text-muted">{{ $t('booking.toChoose') }}</span>
          </dd>
        </div>
      </dl>
    </div>

    <div class="mt-5 grid gap-3 border-t border-line pt-4 text-sm">
      <div class="flex items-center justify-between gap-3">
        <span class="text-muted">{{ $t('ticket.holder') }}</span>
        <span class="font-semibold">
          <MaskedText v-if="holderLine" :value="holderLine" />
          <span v-else class="font-normal text-muted">{{ $t('booking.toFill') }}</span>
        </span>
      </div>
      <div class="flex items-end justify-between gap-3">
        <span class="text-muted">{{ $t('ticket.total') }}</span>
        <span class="display tnum text-2xl">{{ store.totalFcfa ? fcfa(store.totalFcfa) : '0 FCFA' }}</span>
      </div>
    </div>
  </div>
</template>
