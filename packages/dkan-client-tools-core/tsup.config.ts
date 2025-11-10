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
    external: ['@tanstack/query-core'],
  },
  // IIFE build for browsers and Drupal
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientTools',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: false,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.js' }),
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/core - IIFE build for browsers and Drupal */',
      }
    },
    noExternal: [],  // Bundle everything for standalone browser use
  },
  // Minified IIFE build for production
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientTools',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: true,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.min.js' }),
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/core - Minified IIFE build for browsers and Drupal */',
      }
    },
    noExternal: [],  // Bundle everything for standalone browser use
  },
])
