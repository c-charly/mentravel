<script setup lang="ts">
// Deverrouillage du billet complet par numero d'identification (jamais par telephone).
const props = defineProps<{ pnr: string }>()
const emit = defineEmits<{ unlocked: [token: string] }>()

const api = useMtApi()
const idNumber = ref('')
const busy = ref(false)
const error = ref<'' | 'invalid' | 'locked' | 'network' | 'empty'>('')
const retryMin = ref(15)

async function submit() {
  if (!idNumber.value.trim()) {
    error.value = 'empty'
    return
  }
  busy.value = true
  error.value = ''
  try {
    const res = await api.unlock(props.pnr, idNumber.value)
    emit('unlocked', res.token)
  } catch (e) {
    const err = e as { status?: number; code?: string; data?: { retryAfterSec?: number } }
    if (err.status === 429) {
      error.value = 'locked'
      retryMin.value = Math.max(1, Math.ceil((err.data?.retryAfterSec ?? 900) / 60))
    } else if (err.status === 401) error.value = 'invalid'
    else error.value = 'network'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="surface mx-auto w-full max-w-xl p-6" novalidate @submit.prevent="submit">
    <div class="flex items-start gap-3">
      <Icon name="lucide:lock" class="mt-1 size-6 shrink-0" />
      <div>
        <h2 class="display text-xl">{{ $t('unlock.title') }}</h2>
        <p class="mt-1 text-muted">{{ $t('unlock.text') }}</p>
      </div>
    </div>
    <label class="mt-4 block">
      <span class="mb-1.5 block font-semibold">{{ $t('unlock.label') }}</span>
      <input
        v-model="idNumber"
        class="input mono w-full"
        :class="error === 'invalid' || error === 'empty' ? 'is-invalid' : ''"
        autocomplete="off"
        autocapitalize="characters"
        enterkeyhint="go"
        :disabled="error === 'locked'"
        aria-describedby="unlock-msg"
      />
    </label>
    <p id="unlock-msg" class="mt-2 min-h-6 text-sm" :class="error ? 'font-semibold text-error' : 'text-muted'" :role="error ? 'alert' : undefined">
      <template v-if="error === 'invalid'">{{ $t('unlock.errInvalid') }}</template>
      <template v-else-if="error === 'empty'">{{ $t('unlock.errEmpty') }}</template>
      <template v-else-if="error === 'locked'">{{ $t('unlock.errLocked', { n: retryMin }) }}</template>
      <template v-else-if="error === 'network'">{{ $t('common.offline') }}</template>
      <template v-else>{{ $t('unlock.hint') }}</template>
    </p>
    <button type="submit" class="btn btn-primary mt-2 w-full sm:w-auto" :disabled="busy || error === 'locked'">
      <Icon v-if="busy" name="lucide:loader" class="size-5 animate-spin" />
      <Icon v-else name="lucide:lock-open" class="size-5" />
      {{ $t('unlock.cta') }}
    </button>
  </form>
</template>
