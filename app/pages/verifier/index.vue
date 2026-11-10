<script setup lang="ts">
import { formatPnrInput, isValidPnr } from '#shared/validation'

definePageMeta({ layout: 'tool' })
const { t } = useI18n()
useSeoMeta({ title: () => t('verify.seoTitle'), description: () => t('verify.seoDescription'), robots: 'noindex' })

const localePath = useLocalePath()
const pnr = ref('')
const touched = ref(false)
const valid = computed(() => isValidPnr(pnr.value))

function onInput(e: Event) {
  pnr.value = formatPnrInput((e.target as HTMLInputElement).value)
}
async function submit() {
  touched.value = true
  if (!valid.value) return
  await navigateTo(localePath(`/verifier/${pnr.value}`))
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <h1 class="display text-3xl sm:text-4xl">{{ $t('verify.title') }}</h1>
    <p class="mt-4 text-muted">{{ $t('verify.intro') }}</p>
    <form class="mt-8 grid gap-4" novalidate @submit.prevent="submit">
      <label>
        <span class="mb-1.5 block font-semibold">{{ $t('verify.pnrLabel') }}</span>
        <input
          :value="pnr"
          class="input mono w-full text-lg tracking-wider"
          :class="touched && !valid ? 'is-invalid' : ''"
          placeholder="MT-XXXXXX-XXXX"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          enterkeyhint="search"
          aria-describedby="pnr-hint"
          @input="onInput"
        />
        <span id="pnr-hint" class="mt-1.5 block text-sm" :class="touched && !valid ? 'font-semibold text-error' : 'text-muted'">
          {{ touched && !valid ? $t('verify.errFormat') : $t('verify.pnrHint') }}
        </span>
      </label>
      <button type="submit" class="btn btn-primary btn-lg w-full sm:w-fit">
        <Icon name="lucide:badge-check" class="size-5" />{{ $t('verify.cta') }}
      </button>
    </form>
    <p class="mt-8 flex items-start gap-2 text-sm text-muted">
      <Icon name="lucide:eye-off" class="mt-0.5 size-4 shrink-0" />{{ $t('verify.privacy') }}
    </p>
  </div>
</template>
