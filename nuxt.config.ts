import { readdirSync, readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'

// Icones citees dans content/ (equipements, textes): embarquees dans le bundle client,
// donc aucun appel a un service d'icones externe a l'execution.
const contentIcons = [
  ...new Set(
    readdirSync('content')
      .filter((f) => f.endsWith('.ts'))
      .flatMap((f) => readFileSync(`content/${f}`, 'utf8').match(/(?:lucide|simple-icons):[a-z0-9-]+/g) ?? []),
  ),
]

// Configuration Nuxt - MEN TRAVEL
// Toutes les valeurs sensibles ou ajustables passent par runtimeConfig (variables NUXT_*).
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },
  ssr: true,

  modules: ['@nuxtjs/i18n', '@pinia/nuxt', '@vueuse/nuxt', '@nuxt/icon', '@vite-pwa/nuxt', '@nuxt/eslint'],

  // Composants auto-importes sans prefixe de dossier (BrandMark et non UiBrandMark)
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  experimental: {
    viewTransition: true,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      titleTemplate: '%s | MEN TRAVEL',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#031225' },
        { name: 'color-scheme', content: 'light dark' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  i18n: {
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Francais', file: 'fr.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'mt_lang',
      redirectOn: 'root',
      fallbackLocale: 'fr',
    },
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },

  icon: {
    serverBundle: 'local',
    clientBundle: { scan: true, icons: contentIcons, sizeLimitKb: 300 },
    fallbackToApi: false,
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'MEN TRAVEL',
      short_name: 'MEN TRAVEL',
      description: 'Une autre vision du voyage. Bus Yaounde, Douala, Kribi.',
      theme_color: '#031225',
      background_color: '#031225',
      display: 'standalone',
      start_url: '/',
      lang: 'fr',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: undefined,
      globPatterns: ['**/*.{js,css,woff2,svg,png,ico}'],
      runtimeCaching: [
        {
          // Pages visitees (dont les billets deja ouverts) restent lisibles hors ligne
          urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: { cacheName: 'mt-pages', networkTimeoutSeconds: 4 },
        },
      ],
    },
    client: { installPrompt: false },
    devOptions: { enabled: false },
  },

  runtimeConfig: {
    // Surcharges possibles: NUXT_DATA_DIR, NUXT_ALLOW_SIM, NUXT_HOLD_MINUTES, NUXT_MAX_SEATS...
    dataDir: '.data',
    allowSim: 'true',
    holdMinutes: '10',
    maxSeats: '5',
    calendarDays: '60',
    paymentDelaySec: '4',
    unlockMaxFails: '5',
    unlockLockMinutes: '15',
    public: {
      siteUrl: 'http://localhost:3000',
      whatsappNumber: '237653677443',
    },
  },

  routeRules: {
    // Anciennes URLs du site source
    '/search': { redirect: { to: '/reserver', statusCode: 301 } },
    '/booking': { redirect: { to: '/reserver', statusCode: 301 } },
    '/today': { redirect: { to: '/reserver', statusCode: 301 } },
    '/suivi': { redirect: { to: '/mon-voyage', statusCode: 301 } },
    '/services-bord': { redirect: { to: '/a-bord', statusCode: 301 } },
    '/service-courrier': { redirect: { to: '/colis', statusCode: 301 } },
    '/galerie': { redirect: { to: '/a-bord', statusCode: 301 } },
    '/faq': { redirect: { to: '/aide', statusCode: 301 } },
    '/contact': { redirect: { to: '/aide', statusCode: 301 } },
    '/about': { redirect: { to: '/a-propos', statusCode: 301 } },
    '/login': { redirect: { to: '/', statusCode: 301 } },
    '/cgv': { redirect: { to: '/conditions', statusCode: 301 } },
    // Billets et verification: jamais indexes
    '/billet/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/verifier/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/mon-voyage': { headers: { 'X-Robots-Tag': 'noindex' } },
    '/api/**': { headers: { 'Cache-Control': 'no-store' } },
  },

  nitro: {
    compressPublicAssets: true,
  },

  eslint: { config: { stylistic: false } },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
