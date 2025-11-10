/**
 * Test setup file for @dkan-client-tools/vue
 * Configures the test environment for Vue component and composable testing
 */

import { beforeEach, vi } from 'vitest'
import { config, flushPromises } from '@vue/test-utils'

// Configure Vue Test Utils globally
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

// Suppress Vue warnings in tests
config.global.config.warnHandler = () => {
  // Suppress warnings
}

// Increase default timeout for vi.waitFor()
vi.setConfig({
  testTimeout: 10000,
})

// Configure longer timeout for vi.waitFor in tests
export const waitForOptions = {
  timeout: 5000,
  interval: 50,
}

// Export helper for tests
export { flushPromises }
