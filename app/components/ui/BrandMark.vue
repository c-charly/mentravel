<script setup lang="ts">
import logo from '/logo.png'
defineProps<{ compact?: boolean, mobile?: boolean }>()
</script>

<template>
  <span class="inline-flex items-center gap-2.5" aria-label="MEN TRAVEL">
    <img :src="logo" alt="" class="size-12">
    <div v-if="!compact" :class="mobile ? 'sm:block hidden' : 'block'">
      <p class="text-[20px] font-extrabold tracking-tight text-primary">MEN TRAVEL</p>
      <p class="text-[8px] text-[#9F7727] text-bold uppercase tracking-[-5]">Une autre vision du VOYAGE</p>
    </div>
    
  </span>
</template>
