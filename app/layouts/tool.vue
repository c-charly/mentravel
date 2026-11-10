<template>
  <div class="min-h-dvh bg-base-100">
    <SiteHeader />
    <main id="contenu" class="mx-auto max-w-5xl px-5 pb-24 pt-6 sm:px-8">
      <slot />
    </main>
    <SiteFooter />
    <WhatsappButton />
  </div>
</template>
