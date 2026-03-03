export default defineNuxtConfig({
  devtools: { enabled: true },
  experimental: { appManifest: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'EcoSchema',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  }
})
