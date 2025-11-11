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
  // IIFE Full Build (WITH compiler) - For runtime template strings
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsVue',
    platform: 'browser',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: false,
    dts: false,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.full.js' }),
    noExternal: [], // Bundle everything
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/vue - Full Build WITH template compiler (~661KB unminified, ~250KB minified) */',
      }
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
        '__VUE_PROD_DEVTOOLS__': 'false',
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
      }
      options.footer = {
        js: 'if (typeof window !== "undefined") { window.DkanClientToolsVue = DkanClientToolsVue; }'
      }
    },
  },
  // IIFE Full Build (WITH compiler) - Minified
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsVue',
    platform: 'browser',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: true,
    dts: false,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.full.min.js' }),
    noExternal: [], // Bundle everything
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/vue - Full Build WITH template compiler (250KB) - Use for runtime template strings */',
      }
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
        '__VUE_PROD_DEVTOOLS__': 'false',
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
      }
      options.footer = {
        js: 'if (typeof window !== "undefined") { window.DkanClientToolsVue = DkanClientToolsVue; }'
      }
    },
  },
  // IIFE Runtime-Only Build (WITHOUT compiler) - For pre-compiled templates
  {
    entry: ['src/index-runtime.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsVue',
    platform: 'browser',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: false,
    dts: false,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.runtime.js' }),
    noExternal: [], // Bundle everything
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/vue - Runtime-Only Build WITHOUT compiler (~490KB unminified, ~180KB minified) - Templates must be pre-compiled */',
      }
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
        '__VUE_PROD_DEVTOOLS__': 'false',
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
      }
      options.footer = {
        js: 'if (typeof window !== "undefined") { window.DkanClientToolsVue = DkanClientToolsVue; }'
      }
    },
  },
  // IIFE Runtime-Only Build (WITHOUT compiler) - Minified
  {
    entry: ['src/index-runtime.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsVue',
    platform: 'browser',
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: true,
    dts: false,
    outDir: 'dist',
    outExtension: () => ({ js: '.global.runtime.min.js' }),
    noExternal: [], // Bundle everything
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/vue - Runtime-Only Build WITHOUT compiler (180KB) - Use for pre-compiled templates or render functions */',
      }
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
        '__VUE_PROD_DEVTOOLS__': 'false',
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
      }
      options.footer = {
        js: 'if (typeof window !== "undefined") { window.DkanClientToolsVue = DkanClientToolsVue; }'
      }
    },
  },
])
