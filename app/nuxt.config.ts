export default defineNuxtConfig({
  devtools: { enabled: true },
  experimental: { appManifest: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Open DBML',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo/open-dbml-logo.png' },
        { rel: 'apple-touch-icon', href: '/logo/open-dbml-logo.png' }
      ]
    }
  }
})
