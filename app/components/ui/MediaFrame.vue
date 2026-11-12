<script setup lang="ts">
// Cadre de visuel: photo reelle si `src` est renseigne dans content/media.ts, sinon un visuel doux de remplacement.
import { MEDIA } from '~~/content/media'

// `parallax`: le visuel se deplace doucement dans son cadre pendant le defilement (GSAP)
const props = defineProps<{ id: string; rounded?: boolean; parallax?: boolean }>()
const { loc } = useL10n()
const media = computed(() => MEDIA[props.id])
const tones: Record<string, { bg: string; ink: string }> = {
  yde: { bg: 'var(--yde-soft)', ink: 'var(--yde-ink)' },
  dla: { bg: 'var(--dla-soft)', ink: 'var(--dla-ink)' },
  kri: { bg: 'var(--kri-soft)', ink: 'var(--kri-ink)' },
  night: { bg: 'var(--amber-soft)', ink: 'var(--color-base-content)' },
}
</script>

<template>
  <figure
    v-if="media"
    class="relative overflow-hidden"
    :class="rounded ? 'rounded-3xl' : ''"
    :style="{ aspectRatio: media.ratio }"
  >
    <img
      v-if="media.src"
      v-parallax="parallax ? {} : false"
      :src="media.src"
      :alt="loc(media.alt)"
      loading="lazy"
      decoding="async"
      class="absolute inset-0 size-full object-cover"
    />
    <div
      v-else
      v-parallax="parallax ? {} : false"
      class="absolute inset-0 grid place-items-center"
      :style="{ background: `linear-gradient(145deg, ${tones[media.tone]!.bg}, var(--color-base-200))`, color: tones[media.tone]!.ink }"
      role="img"
      :aria-label="loc(media.alt)"
    >
      <span class="absolute -right-10 -top-10 size-48 rounded-full bg-base-100/60" aria-hidden="true" />
      <span class="absolute -bottom-12 -left-8 size-40 rounded-full bg-base-100/40" aria-hidden="true" />
      <svg viewBox="0 0 120 60" class="relative w-2/5 max-w-40 opacity-70" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="14" y="10" width="92" height="34" rx="9" />
        <path d="M14 28h92M40 10v18M66 10v18M92 10v18" />
        <circle cx="34" cy="48" r="5" />
        <circle cx="86" cy="48" r="5" />
      </svg>
    </div>
  </figure>
</template>
