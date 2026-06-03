import tailwindcss from "@tailwindcss/vite";

const isDev = process.env.NODE_ENV !== 'production'

// Content-Security-Policy. Nuxt injects inline hydration scripts/state, so
// 'unsafe-inline' is required for scripts unless you adopt nonce-based CSP.
// Vite's dev server additionally needs 'unsafe-eval' for HMR.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // Production serves the chat/game socket same-origin (wss://), which 'self'
  // already covers. The ws:/wss: wildcard is only needed for Vite HMR in dev.
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
].join('; ')

const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': contentSecurityPolicy,
  // Only meaningful over HTTPS; harmless (ignored) over plain HTTP.
  ...(isDev ? {} : { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' }),
}

export default defineNuxtConfig({
  nitro: {
    experimental: {
      websocket: true
    }
  },

  routeRules: {
    '/**': { headers: securityHeaders },
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt', '@nuxt/fonts'],
  fonts: {
    families: [
      { name: 'Inter', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] }
    ],
  },
  future: {
    compatibilityVersion: 4
  },
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})
