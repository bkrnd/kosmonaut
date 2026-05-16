// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    experimental: {
      websocket: true
    }
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt', '@nuxt/fonts'],
  fonts: {
    families: [
      { name: 'Inter', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] }
    ],
  }
})