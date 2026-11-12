<script setup lang="ts">
const { dataTheme } = useThemePref()
const i18nHead = useLocaleHead({ seo: true })

useHead({
  htmlAttrs: {
    lang: () => i18nHead.value.htmlAttrs?.lang,
    'data-theme': () => dataTheme.value,
  },
  link: computed(() => i18nHead.value.link ?? []),
  meta: computed(() => i18nHead.value.meta ?? []),
  // "js": JavaScript actif. "anim-off": pas d'animation (mouvement reduit, ou GSAP pas pret apres 3 s,
  // typiquement sur une connexion lente): le CSS n'a alors rien a masquer et la page s'affiche telle quelle.
  script: [
    {
      innerHTML:
        "(function(d){var c=d.documentElement.classList;c.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches){c.add('anim-off');return}setTimeout(function(){if(!c.contains('anim-on'))c.add('anim-off')},3000)})(document)",
      tagPosition: 'head',
    },
  ],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
