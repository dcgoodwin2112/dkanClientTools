/**
 * Tests for DkanClientPlugin and useDkanClient
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin, useDkanClient } from '../plugin'

describe('DkanClientPlugin', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    // Create QueryClient from Vue Query
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 0 },
      },
    })

    // Create DkanClient with the Vue Query QueryClient
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
      queryClient, // Pass the QueryClient from vue-query!
    })
  })

  it('should provide DkanClient to child components', () => {
    const TestComponent = defineComponent({
      setup() {
        const client = useDkanClient()
        // Test that we can access the QueryClient
        const queryClient = client.getQueryClient()
        return () => h('div', queryClient ? 'client-provided' : 'no-client')
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    expect(wrapper.text()).toBe('client-provided')
  })

  it('should throw error when useDkanClient is used without plugin', () => {
    const TestComponent = defineComponent({
      setup() {
        try {
          useDkanClient()
        } catch (error) {
          return () => h('div', (error as Error).message)
        }
      },
    })

    const wrapper = mount(TestComponent)

    expect(wrapper.text()).toContain(
      'useDkanClient must be used in a Vue app with DkanClientPlugin installed'
    )
  })
})
