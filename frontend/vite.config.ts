import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Vite dev server with proxy to Rails API (http://localhost:3000/api)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isTauri = !!env.TAURI_PLATFORM
  const base = isTauri ? './' : env.VITE_BASE_PATH || '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png'],
        manifest: {
          name: 'Beam Deflection PWA',
          short_name: 'Beams',
          start_url: '.',
          scope: '.',
          display: 'standalone',
          background_color: '#f7f9fb',
          theme_color: '#f5b536',
          icons: [
            { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
            { src: 'logo.png', sizes: '192x192', type: 'image/png' },
            { src: 'logo.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
