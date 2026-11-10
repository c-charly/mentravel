<script setup lang="ts">
// Billet + fil du voyage + plan du bus + actions. Reutilise dans la confirmation, le suivi et la verification.
import { CLASSES } from '~~/content/network'
import type { FullTicket, MaskedTicket, SeatsResponse } from '#shared/types'

const props = defineProps<{
  ticket: MaskedTicket | FullTicket
  token?: string
  actions?: boolean
  journey?: boolean
  plan?: boolean
  stampAnimate?: boolean
}>()

const { t } = useI18n()
const { city, dateLong } = useL10n()
const config = useRuntimeConfig()
const billet = ref<{ el: HTMLElement | null } | null>(null)
const { busy, message, savePdf, savePng, copyLink, shareWhatsapp, addToCalendar } = useTicketActions(
  () => billet.value?.el ?? null,
)

const isFull = computed(() => 'holder' in props.ticket)
const link = computed(() => {
  const base = import.meta.client ? window.location.origin : (config.public.siteUrl as string)
  return `${base}/billet/${props.ticket.pnr}${props.token ? `?t=${props.token}` : ''}`
})

const layout = computed(() => props.ticket.layout)
const seatsForPlan = computed<SeatsResponse['seats']>(() => props.ticket.seatMap)
const availability = computed(() => props.ticket.availability)
</script>

<template>
  <div class="grid gap-8">
    <Billet ref="billet" :ticket="ticket" :stamp-animate="stampAnimate" />

    <div v-if="actions && isFull" class="mx-auto grid w-full max-w-xl gap-3">
      <div class="grid gap-2 sm:grid-cols-2">
        <button type="button" class="btn btn-primary" :disabled="busy" @click="savePdf(ticket.pnr)">
          <Icon name="lucide:file-down" class="size-5" />{{ $t('ticket.downloadPdf') }}
        </button>
        <button type="button" class="btn btn-outline" :disabled="busy" @click="savePng(ticket.pnr)">
          <Icon name="lucide:image-down" class="size-5" />{{ $t('ticket.downloadImage') }}
        </button>
        <button type="button" class="btn btn-success" :disabled="busy" @click="shareWhatsapp(ticket.pnr, link)">
          <Icon name="simple-icons:whatsapp" class="size-5" />{{ $t('ticket.shareWhatsapp') }}
        </button>
        <button type="button" class="btn btn-outline" @click="copyLink(link)">
          <Icon name="lucide:copy" class="size-5" />{{ $t('ticket.copyLink') }}
        </button>
      </div>
      <button
        type="button"
        class="btn btn-ghost"
        @click="addToCalendar(ticket, `${city(ticket.route.fromCity)} - ${city(ticket.route.toCity)}`, ticket.route.boardingPoint)"
      >
        <Icon name="lucide:calendar-plus" class="size-5" />{{ $t('ticket.addCalendar') }}
      </button>
      <p v-if="message" class="text-center text-sm font-semibold text-success" role="status">{{ message }}</p>
    </div>

    <section v-if="journey" class="mx-auto w-full max-w-xl" :aria-label="$t('journey.title')">
      <h2 class="display mb-5 text-xl">{{ $t('journey.title') }}</h2>
      <FilVoyage :stage="ticket.stage" />
    </section>

    <section v-if="plan" class="mx-auto w-full max-w-xl" :aria-label="$t('plan.label')">
      <h2 class="display mb-1 text-xl">{{ $t('verify.yourSeats') }}</h2>
      <p class="mb-4 text-muted">{{ CLASSES[ticket.classId].name }}, {{ dateLong(ticket.date) }}, {{ ticket.departureTime }}</p>
      <PlanBus :layout="layout" :seats="seatsForPlan" :class-id="ticket.classId" :highlight="ticket.seatIds" readonly />
      <ul class="mt-5 grid gap-2">
        <li
          v-for="a in availability"
          :key="a.classId"
          class="flex items-center justify-between rounded-xl bg-base-200 px-4 py-3 text-sm"
        >
          <span class="flex items-center gap-2 font-semibold"><ClassMark :id="a.classId" />{{ CLASSES[a.classId].name }}</span>
          <span class="tnum">{{ t('verify.seatsLeft', { n: a.seatsLeft, total: a.capacity }) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
