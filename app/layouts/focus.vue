<script setup lang="ts">
// Mise en page de la reservation: une barre fine, le stepper centre, rien d'autre.
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
    <header class="sticky top-0 z-40 border-b border-line bg-base-100/90 backdrop-blur-xl">
      <div class="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-5 md:grid-cols-[1fr_auto_1fr]">
        <button type="button" class="justify-self-start" :aria-label="$t('nav.home')" @click="tryLeave">
          <BrandMark mobile/>
        </button>
        <div class="hidden md:block"><BookingStepper /></div>
        <div class="flex items-center justify-end gap-1.5">
          <BookingCountdown />
          <a :href="`https://wa.me/${whatsapp}`" target="_blank" rel="noopener" class="btn btn-ghost btn-circle btn-sm min-h-10" :aria-label="$t('whatsapp.label')">
            <Icon name="simple-icons:whatsapp" class="size-5" />
          </a>
          <div class="hidden lg:block"><ThemeLang /></div>
          <button type="button" class="btn btn-ghost btn-circle btn-sm min-h-10" :aria-label="$t('booking.leave')" @click="tryLeave">
            <Icon name="lucide:x" class="size-5" />
          </button>
        </div>
      </div>
      <div class="border-t border-line md:hidden"><BookingStepper compact /></div>
    </header>
    <main id="contenu">
      <slot />
    </main>

    <dialog ref="leaveDialog" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box">
        <h2 class="display text-2xl">{{ $t('booking.leaveTitle') }}</h2>
        <p class="mt-3 text-muted">{{ $t('booking.leaveText') }}</p>
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="leave">{{ $t('booking.leaveConfirm') }}</button>
          <form method="dialog"><button class="btn btn-primary">{{ $t('booking.stay') }}</button></form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>{{ $t('nav.close') }}</button></form>
    </dialog>
  </div>
</template>
