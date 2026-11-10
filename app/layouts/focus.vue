<script setup lang="ts">
// Mise en page de la reservation: une barre fine, la progression, rien d'autre.
const localePath = useLocalePath()
const store = useBookingStore()
const leaveDialog = ref<HTMLDialogElement | null>(null)
const whatsapp = useRuntimeConfig().public.whatsappNumber

async function leave() {
  leaveDialog.value?.close()
  await store.releaseAll()
  await navigateTo(localePath('/'))
}
function tryLeave() {
  if (store.hasActiveHold) leaveDialog.value?.showModal()
  else navigateTo(localePath('/'))
}
</script>

<template>
  <div class="min-h-dvh bg-base-100">
    <header class="sticky top-0 z-40 border-b border-line bg-base-100/85 backdrop-blur-xl">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5">
        <button type="button" :aria-label="$t('nav.home')" @click="tryLeave">
          <BrandMark />
        </button>
        <div class="flex items-center gap-1.5">
          <BookingCountdown />
          <a :href="`https://wa.me/${whatsapp}`" target="_blank" rel="noopener" class="btn btn-ghost btn-circle btn-sm min-h-10 sm:hidden" :aria-label="$t('whatsapp.label')">
            <Icon name="simple-icons:whatsapp" class="size-5" />
          </a>
          <div class="hidden sm:block"><ThemeLang /></div>
          <button type="button" class="btn btn-ghost btn-circle btn-sm min-h-10" :aria-label="$t('booking.leave')" @click="tryLeave">
            <Icon name="lucide:x" class="size-5" />
          </button>
        </div>
      </div>
      <BookingProgress />
    </header>
    <main id="contenu">
      <slot />
    </main>
    <div class="hidden sm:block"><WhatsappButton /></div>

    <dialog ref="leaveDialog" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box">
        <h2 class="display text-2xl">{{ $t('booking.leaveTitle') }}</h2>
        <p class="mt-3 text-muted">{{ $t('booking.leaveText') }}</p>
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="leave">{{ $t('booking.leaveConfirm') }}</button>
          <form method="dialog">
            <button class="btn btn-primary">{{ $t('booking.stay') }}</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>{{ $t('nav.close') }}</button></form>
    </dialog>
  </div>
</template>
