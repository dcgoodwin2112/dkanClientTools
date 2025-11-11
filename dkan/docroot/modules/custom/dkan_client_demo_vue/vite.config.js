import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],

  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'src/DatasetSearchWidget.vue'),
      name: 'DatasetSearchComponent',
      formats: ['iife'],
      fileName: () => 'dataset-search-component.js',
    },
    rollupOptions: {
      // Externalize DKAN Client Tools Vue (runtime-only)
      external: [
        '@dkan-client-tools/vue',
        'vue',
      ],
      output: {
        globals: {
          '@dkan-client-tools/vue': 'DkanClientToolsVue',
          'vue': 'DkanClientToolsVue.Vue',
        },
      },
    },
    outDir: 'js',
    emptyOutDir: false,
    minify: 'terser',
    sourcemap: true,
  },
})
