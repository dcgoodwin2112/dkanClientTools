import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://dkan.ddev.site',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    conditions: ['development'],
  },
})
