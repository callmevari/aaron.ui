// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
  ],

  i18n: {
    locales: [
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'es',
    lazy: true,
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      fallbackLocale: 'es',
      alwaysRedirect: false,
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Aaron.pet',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover' },
        { name: 'description', content: 'Veterinary blood emergency connection app' },
      ],
    },
  },
})
