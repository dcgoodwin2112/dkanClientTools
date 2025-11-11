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
  // IIFE build for browsers and Drupal (self-contained with all dependencies)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsReact',
    platform: 'browser',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: false,
    dts: false,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.js' }),
    noExternal: [], // Bundle everything for now
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/react - IIFE build (self-contained, includes React/ReactDOM/ReactQuery) */',
      }
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
      }
      options.footer = {
        js: 'if (typeof window !== "undefined") { window.DkanClientToolsReact = DkanClientToolsReact; }'
      }
    },
  },
  // Minified IIFE build for production - bundles everything
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsReact',
    platform: 'browser',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: true,
    dts: false,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.min.js' }),
    noExternal: [], // Bundle everything
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/react - Minified IIFE (self-contained, includes React/ReactDOM/ReactQuery) */',
      }
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
      }
      options.footer = {
        js: 'if (typeof window !== "undefined") { window.DkanClientToolsReact = DkanClientToolsReact; }'
      }
    },
  },
])
