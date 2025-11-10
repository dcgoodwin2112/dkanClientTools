import { defineConfig } from 'vite'

export default defineConfig({
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
