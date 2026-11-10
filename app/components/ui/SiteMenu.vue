<script setup lang="ts">
// Menu mobile: feuille douce qui descend sous la barre, jamais plein ecran.
const dialog = ref<HTMLDialogElement | null>(null)
const localePath = useLocalePath()
const route = useRoute()

const items = [
  { to: '/reserver', key: 'book', icon: 'lucide:ticket' },
  { to: '/trajets', key: 'routes', icon: 'lucide:route' },
  { to: '/classes', key: 'classes', icon: 'lucide:armchair' },
  { to: '/a-bord', key: 'onboard', icon: 'lucide:wifi' },
  { to: '/colis', key: 'parcels', icon: 'lucide:package' },
  { to: '/location-bus', key: 'charter', icon: 'lucide:bus' },
  { to: '/mon-voyage', key: 'myTrip', icon: 'lucide:map-pin' },
  { to: '/verifier', key: 'verify', icon: 'lucide:badge-check' },
  { to: '/aide', key: 'help', icon: 'lucide:headset' },
]

function open() {
  dialog.value?.showModal()
}
function close() {
  dialog.value?.close()
}
watch(() => route.fullPath, close)
defineExpose({ open, close })
</script>

<template>
  <dialog
    ref="dialog"
    class="fixed inset-x-0 top-0 m-0 max-h-dvh w-full max-w-none overflow-y-auto rounded-b-3xl bg-base-100 p-0 text-base-content shadow-[var(--shadow-lift)] backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    aria-label="Menu"
    @click="($event.target as HTMLElement).tagName === 'DIALOG' && close()"
  >
    <div class="mx-auto max-w-lg px-5 pb-6 pt-4">
      <div class="flex h-10 items-center justify-between">
        <BrandMark />
        <button type="button" class="btn btn-ghost btn-circle btn-sm" :aria-label="$t('nav.close')" @click="close">
          <Icon name="lucide:x" class="size-5" />
        </button>
      </div>
      <nav class="mt-3" :aria-label="$t('nav.main')">
        <ul class="grid gap-0.5">
          <li v-for="item in items" :key="item.to">
            <NuxtLink
              :to="localePath(item.to)"
              class="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-base-200"
            >
              <Icon :name="item.icon" class="size-5 text-muted" />
              {{ $t(`nav.${item.key}`) }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="mt-4 flex items-center justify-between border-t border-line pt-4">
        <ThemeLang />
        <NuxtLink :to="localePath('/reserver')" class="btn btn-primary">{{ $t('nav.book') }}</NuxtLink>
      </div>
    </div>
  </dialog>
</template>
