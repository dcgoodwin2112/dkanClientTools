/**
 * Tests for useDatasetProperties composables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useDatasetProperties, usePropertyValues, useAllPropertiesWithValues } from '../useDatasetProperties'

describe('useDatasetProperties', () => {
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

  describe('useDatasetProperties', () => {
    it('should fetch properties', async () => {
      vi.spyOn(mockClient, 'getDatasetProperties').mockResolvedValue(['theme', 'keyword', 'publisher'])
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDatasetProperties()
          return () => h('div', `Count: ${data.value?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 3'))
    })
  })

  describe('usePropertyValues', () => {
    it('should fetch property values', async () => {
      vi.spyOn(mockClient, 'getPropertyValues').mockResolvedValue(['Health', 'Education', 'Finance'])
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = usePropertyValues({ property: ref('theme') })
          return () => h('div', `Count: ${data.value?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 3'))
    })
  })

  describe('useAllPropertiesWithValues', () => {
    it('should fetch all properties with values', async () => {
      vi.spyOn(mockClient, 'getAllPropertiesWithValues').mockResolvedValue({
        theme: ['Health', 'Education'],
        keyword: ['data', 'open'],
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useAllPropertiesWithValues()
          return () => h('div', `Properties: ${Object.keys(data.value || {}).length}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Properties: 2'))
    })
  })
})
