<script setup lang="ts">
// Barre de navigation: transparente en haut de page, verre depoli avec un trait fin ensuite.
const localePath = useLocalePath()
const route = useRoute()
const menu = ref<{ open: () => void } | null>(null)
const { y } = useWindowScroll()
const scrolled = computed(() => y.value > 8)

const links = [
  { to: '/trajets', key: 'routes' },
  { to: '/classes', key: 'classes' },
  { to: '/a-bord', key: 'onboard' },
  { to: '/colis', key: 'parcels' },
  { to: '/location-bus', key: 'charter' },
  { to: '/aide', key: 'help' },
]
const onBooking = computed(() => route.path.includes('/reserver'))
</script>

<template>
  <header class="sticky top-0 z-50">
    <div
      class="border-b transition-[background-color,border-color,backdrop-filter] duration-300"
      :class="scrolled ? 'border-line bg-base-100/80 backdrop-blur-xl' : 'border-transparent bg-transparent'"
    >
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <NuxtLink :to="localePath('/')" :aria-label="$t('nav.home')" class="shrink-0">
          <BrandMark />
        </NuxtLink>

        <nav class="hidden lg:block" :aria-label="$t('nav.main')">
          <ul class="flex items-center gap-0.5">
            <li v-for="l in links" :key="l.to">
              <NuxtLink
                :to="localePath(l.to)"
                class="rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-base-200 hover:text-base-content"
                active-class="!text-base-content"
              >
                {{ $t(`nav.${l.key}`) }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="ml-auto flex items-center gap-1.5">
          <NuxtLink
            :to="localePath('/mon-voyage')"
            class="btn btn-ghost btn-sm hidden min-h-9 gap-2 text-muted hover:text-base-content md:inline-flex"
          >
            <Icon name="lucide:ticket" class="size-4" />{{ $t('nav.myTrip') }}
          </NuxtLink>
          <div class="hidden lg:block"><ThemeLang /></div>
          <NuxtLink v-if="!onBooking" :to="localePath('/reserver')" class="btn btn-primary btn-sm min-h-10 px-5">
            {{ $t('nav.book') }}
          </NuxtLink>
          <button
            type="button"
            class="btn btn-ghost btn-circle btn-sm min-h-10 lg:hidden"
            :aria-label="$t('nav.menu')"
            @click="menu?.open()"
          >
            <Icon name="lucide:menu" class="size-6" />
          </button>
        </div>
      </div>
    </div>
    <SiteMenu ref="menu" />
  </header>
</template>
