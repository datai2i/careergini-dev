import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: '51.89.225.112.nip.io',
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://api-gateway:3000',
        changeOrigin: true,
      },
    },
  },
})
