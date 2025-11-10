import { defineConfig } from 'tsup'

export default defineConfig([
  // ESM and CJS builds for bundlers and Node.js
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    outDir: 'dist',
    external: ['vue', '@dkan-client-tools/core', '@tanstack/vue-query'],
  },
  // IIFE build for browsers (with externals)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsVue',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: false,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.js' }),
    external: ['vue', '@dkan-client-tools/core', '@tanstack/vue-query'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/vue - IIFE build. Requires: Vue, DkanClientTools, TanStackVueQuery */',
      }
    },
  },
  // Minified IIFE build for production (with externals)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsVue',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: true,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.min.js' }),
    external: ['vue', '@dkan-client-tools/core', '@tanstack/vue-query'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/vue - Minified IIFE. Requires: Vue, DkanClientTools, TanStackVueQuery */',
      }
    },
  },
])
