import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['development'],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
})
