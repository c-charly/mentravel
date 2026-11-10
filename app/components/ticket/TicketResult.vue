<script setup lang="ts">
// Charge un billet par PNR: version complete si un jeton valide existe, sinon version masquee.
import type { FullTicket, MaskedTicket } from '#shared/types'
import { ApiError } from '~/composables/useMtApi'

const props = defineProps<{ pnr: string; token?: string; verify?: boolean }>()

const api = useMtApi()
const cache = useTicketCache()
const { t } = useI18n()

type State = 'loading' | 'masked' | 'full' | 'unknown' | 'throttled' | 'error'
const state = ref<State>('loading')
const masked = ref<MaskedTicket | null>(null)
const full = ref<FullTicket | null>(null)
const activeToken = ref<string | undefined>(props.token)
const note = ref('')
const offline = ref(false)

async function load() {
  state.value = 'loading'
  note.value = ''
  offline.value = false
  const token = activeToken.value ?? cache.load(props.pnr)?.token
  if (token) {
    try {
      const tk = await api.ticket(props.pnr, token)
      full.value = tk
      activeToken.value = token
      cache.save(tk, token)
      state.value = 'full'
      return
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        if (props.token) note.value = t('ticket.badLink')
        activeToken.value = undefined
      }
    }
  }
  try {
    masked.value = await api.verify(props.pnr)
    state.value = 'masked'
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) state.value = 'unknown'
    else if (e instanceof ApiError && e.status === 429) state.value = 'throttled'
    else {
      // Hors ligne: dernier etat connu du billet
      const saved = cache.load(props.pnr)
      if (saved) {
        full.value = saved.ticket
        activeToken.value = saved.token
        offline.value = true
        state.value = 'full'
      } else state.value = 'error'
    }
  }
}

onMounted(load)
watch(() => [props.pnr, props.token], load)

function onUnlocked(token: string) {
  activeToken.value = token
  void load()
}

const current = computed(() => full.value ?? masked.value)
</script>

<template>
  <div>
    <div v-if="state === 'loading'" class="mx-auto max-w-xl space-y-3" aria-busy="true">
      <div class="h-24 animate-pulse rounded-2xl bg-base-200" />
      <div class="h-80 animate-pulse rounded-2xl bg-base-200" />
    </div>

    <div v-else-if="state === 'unknown'" class="mx-auto max-w-xl text-center">
      <StampStatut stamp="unknown" />
      <h2 class="display mt-6 text-2xl">{{ $t('verify.unknownTitle') }}</h2>
      <p class="mx-auto mt-3 max-w-md text-muted">{{ $t('verify.unknownText') }}</p>
      <NuxtLinkLocale :to="verify ? '/verifier' : '/mon-voyage'" class="btn btn-primary mt-5">
        {{ $t('verify.tryAgain') }}
      </NuxtLinkLocale>
    </div>

    <div v-else-if="state === 'throttled'" class="mx-auto max-w-xl rounded-2xl bg-base-200 p-6" role="alert">
      <p class="font-semibold">{{ $t('verify.throttled') }}</p>
    </div>

    <div v-else-if="state === 'error'" class="mx-auto max-w-xl rounded-2xl bg-error/10 p-6" role="alert">
      <p class="font-semibold">{{ $t('verify.errorTitle') }}</p>
      <p class="mt-1 text-muted">{{ $t('common.offline') }}</p>
      <button type="button" class="btn btn-primary btn-sm mt-3" @click="load">{{ $t('common.retry') }}</button>
    </div>

    <div v-else-if="current" class="grid gap-8">
      <p v-if="offline" class="mx-auto flex w-full max-w-xl items-center gap-2 rounded-xl bg-base-200 p-3 text-sm font-semibold" role="status">
        <Icon name="lucide:cloud-off" class="size-5 shrink-0" />{{ $t('ticket.offlineNote') }}
      </p>
      <p v-if="note" class="mx-auto flex w-full max-w-xl items-center gap-2 rounded-2xl bg-base-200 p-3.5 text-sm font-medium" role="status">
        <Icon name="lucide:info" class="size-5 shrink-0" />{{ note }}
      </p>
      <TicketPanel
        :ticket="current"
        :token="activeToken"
        :actions="state === 'full'"
        journey
        plan
      />
      <UnlockPanel v-if="state === 'masked' && current.stamp !== 'cancelled'" :pnr="pnr" @unlocked="onUnlocked" />
    </div>
  </div>
</template>
