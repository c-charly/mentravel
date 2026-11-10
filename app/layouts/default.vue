<template>
  <div class="min-h-dvh">
    <a href="#contenu" class="btn btn-primary fixed left-4 top-4 z-[60] -translate-y-20 focus:translate-y-0">
      {{ $t('nav.skip') }}
    </a>
    <SiteHeader />
    <main id="contenu">
      <slot />
    </main>
    <SiteFooter />
    <WhatsappButton />
  </div>
</template>
