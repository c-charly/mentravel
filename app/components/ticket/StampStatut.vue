<script setup lang="ts">
// Etat du billet. "stamp": tampon incline façon billet papier; "pill": pastille douce.
import type { VerifyStamp } from '#shared/types'

const props = defineProps<{ stamp: VerifyStamp; animate?: boolean; variant?: 'stamp' | 'pill' }>()

const map: Record<VerifyStamp, { icon: string; color: string; ink: string }> = {
  authentic: { icon: 'lucide:badge-check', color: '#0e9f6e', ink: '#0b7a57' },
  used: { icon: 'lucide:check-check', color: '#64748b', ink: '#475569' },
  cancelled: { icon: 'lucide:ban', color: '#dc2626', ink: '#b91c1c' },
  pending: { icon: 'lucide:hourglass', color: '#f5b53d', ink: '#8a5a00' },
  unknown: { icon: 'lucide:circle-help', color: '#dc2626', ink: '#b91c1c' },
}
const cfg = computed(() => map[props.stamp])
</script>

<template>
  <span
    v-if="variant === 'stamp'"
    class="stamp"
    :style="{ color: cfg.ink, animation: animate ? 'stamp-in 0.5s var(--ease-route) 0.5s both' : undefined }"
    role="status"
  >
    <Icon :name="cfg.icon" class="size-4" />
    {{ $t(`verify.stamp.${stamp}`) }}
  </span>
  <span
    v-else
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
    :class="animate ? 'rise-in' : ''"
    :style="{ background: `color-mix(in oklab, ${cfg.color} 16%, white)`, color: cfg.ink }"
    role="status"
  >
    <Icon :name="cfg.icon" class="size-4" />
    {{ $t(`verify.stamp.${stamp}`) }}
  </span>
</template>
