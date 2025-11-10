/**
 * Test setup file
 * Runs before all tests
 */

import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Extend Vitest's expect with jest-dom matchers
expect.extend({})
