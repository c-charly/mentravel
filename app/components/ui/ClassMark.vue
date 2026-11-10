<script setup lang="ts">
import { CLASSES } from '~~/content/network'
import type { ClassId } from '#shared/types'

const props = defineProps<{ id: ClassId; swatch?: boolean }>()
const strokes = computed(() => CLASSES[props.id].strokes)
const patternClass = computed(() =>
  props.id === 'business' ? 'pat-business' : props.id === 'masterclass-s' ? 'pat-s' : 'pat-plus',
)
</script>

<template>
  <span class="inline-flex items-center gap-2" aria-hidden="true">
    <i v-if="swatch" class="inline-block size-3.5 shrink-0 rounded-[5px]" :class="patternClass" />
    <span v-else class="flex items-end gap-[2px]">
      <i
        v-for="n in 3"
        :key="n"
        class="inline-block w-[3px] rounded-full"
        :class="n <= strokes ? 'bg-current' : 'bg-current opacity-20'"
        :style="{ height: `${6 + n * 3}px` }"
      />
    </span>
  </span>
</template>
