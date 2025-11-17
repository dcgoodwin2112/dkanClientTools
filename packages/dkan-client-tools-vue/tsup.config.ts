import { defineConfig } from 'tsup'
import type { Options } from 'tsup'

const vueDefines = {
  'process.env.NODE_ENV': '"production"',
  '__VUE_PROD_DEVTOOLS__': 'false',
  '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
}

const iifeBase: Partial<Options> = {
  format: ['iife'],
  globalName: 'DkanClientToolsVue',
  platform: 'browser',
  sourcemap: true,
  clean: false,
  treeshake: true,
  dts: false,
  outDir: 'dist',
  noExternal: [],
}

const addEsbuildOptions = (banner: string) => (options: any) => {
  options.banner = { js: banner }
  options.define = { ...options.define, ...vueDefines }
  options.footer = { js: 'if (typeof window !== "undefined") { window.DkanClientToolsVue = DkanClientToolsVue; }' }
}

export default defineConfig([
  // ESM and CJS builds
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
  // IIFE Full Build (with compiler)
  {
    ...iifeBase,
    entry: ['src/index.ts'],
    minify: false,
    outExtension: () => ({ js: '.global.full.js' }),
    esbuildOptions: addEsbuildOptions('/* @dkan-client-tools/vue - Full Build with compiler (~661KB, ~250KB min) */'),
  },
  {
    ...iifeBase,
    entry: ['src/index.ts'],
    minify: true,
    outExtension: () => ({ js: '.global.full.min.js' }),
    esbuildOptions: addEsbuildOptions('/* @dkan-client-tools/vue - Full Build with compiler (250KB) */'),
  },
  // IIFE Runtime-Only Build (without compiler)
  {
    ...iifeBase,
    entry: ['src/index-runtime.ts'],
    minify: false,
    outExtension: () => ({ js: '.global.runtime.js' }),
    esbuildOptions: addEsbuildOptions('/* @dkan-client-tools/vue - Runtime-only (~490KB, ~180KB min) */'),
  },
  {
    ...iifeBase,
    entry: ['src/index-runtime.ts'],
    minify: true,
    outExtension: () => ({ js: '.global.runtime.min.js' }),
    esbuildOptions: addEsbuildOptions('/* @dkan-client-tools/vue - Runtime-only (180KB) */'),
  },
])
