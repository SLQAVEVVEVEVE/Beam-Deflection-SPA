import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server with proxy to Rails API (http://localhost:3000/api)
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
