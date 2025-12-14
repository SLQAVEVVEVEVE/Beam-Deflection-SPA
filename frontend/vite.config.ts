import { defineConfig, loadEnv } from 'vite'
import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Vite dev server with proxy to Rails API (http://localhost:3000/api)
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isTauri = mode === 'tauri' || !!env.TAURI_PLATFORM
  const base = isTauri ? './' : env.VITE_BASE_PATH || '/'
  const apiTarget = process.env.VITE_DEV_API_TARGET || env.VITE_DEV_API_TARGET || 'http://localhost:3000'

  let mkcertPlugin: PluginOption | null = null
  try {
    const mkcert = await import('vite-plugin-mkcert')
    mkcertPlugin = mkcert.default()
  } catch {
    // Optional dependency; only needed for local HTTPS convenience.
  }

  const configDir = path.dirname(fileURLToPath(import.meta.url))
  const certKeyPath = path.resolve(configDir, 'cert.key')
  const certCrtPath = path.resolve(configDir, 'cert.crt')
  const httpsConfig =
    fs.existsSync(certKeyPath) && fs.existsSync(certCrtPath)
      ? {
          key: fs.readFileSync(certKeyPath),
          cert: fs.readFileSync(certCrtPath),
        }
      : undefined

  return {
    base,
    build: {
      outDir: isTauri ? 'dist-tauri' : 'dist',
      emptyOutDir: true,
    },
    plugins: [
      react(),
      ...(mkcertPlugin ? [mkcertPlugin] : []),
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
      cors: true,
      headers: {
        'Access-Control-Allow-Private-Network': 'true',
      },
      host: true,
      port: 5173,
      strictPort: true,
      https: httpsConfig,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
