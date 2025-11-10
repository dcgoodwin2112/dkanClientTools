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
    external: ['react', '@dkan-client-tools/core', '@tanstack/react-query'],
  },
  // IIFE build for browsers and Drupal (with externals)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsReact',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: false,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.js' }),
    external: ['react', 'react-dom', '@dkan-client-tools/core', '@tanstack/react-query'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/react - IIFE build. Requires: React, DkanClientTools, TanStackReactQuery */',
      }
    },
  },
  // Minified IIFE build for production (with externals)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsReact',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: true,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.min.js' }),
    external: ['react', 'react-dom', '@dkan-client-tools/core', '@tanstack/react-query'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/react - Minified IIFE. Requires: React, DkanClientTools, TanStackReactQuery */',
      }
    },
  },
])
