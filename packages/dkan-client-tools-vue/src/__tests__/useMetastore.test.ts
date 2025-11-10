/**
 * Tests for useMetastore composables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query' // Import from vue-query, not query-core!
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useAllDatasets, useSchemas, useSchemaItems, useDatasetFacets } from '../useMetastore'

describe('useMetastore', () => {
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

  describe('useAllDatasets', () => {
    it('should fetch all datasets', async () => {
      const spy = vi.spyOn(mockClient, 'listAllDatasets').mockResolvedValue([
        { identifier: 'ds-1', title: 'Dataset 1', accessLevel: 'public', modified: '2024-01-01', keyword: [], publisher: { name: 'Pub' }, contactPoint: { '@type': 'vcard:Contact', fn: 'Contact', hasEmail: 'test@example.com' } },
      ] as any)
      const wrapper = mount(defineComponent({
        setup() {
          const { data, isLoading, error } = useAllDatasets()
          return () => h('div', `Count: ${data.value?.length || 0} | Loading: ${isLoading.value} | Error: ${error.value?.message || 'none'}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      console.log('Initial text:', wrapper.text())
      await vi.waitFor(() => {
        console.log('Checking text:', wrapper.text())
        console.log('Spy called:', spy.mock.calls.length, 'times')
        expect(wrapper.text()).toBe('Count: 1 | Loading: false | Error: none')
      }, { timeout: 5000 })
    })
  })

  describe('useSchemas', () => {
    it('should list schemas', async () => {
      vi.spyOn(mockClient, 'listSchemas').mockResolvedValue(['dataset', 'data-dictionary'])
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useSchemas()
          return () => h('div', `Count: ${data.value?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 2'))
    })
  })

  describe('useSchemaItems', () => {
    it('should fetch schema items', async () => {
      vi.spyOn(mockClient, 'getSchemaItems').mockResolvedValue([
        { identifier: 'item-1', data: { title: 'Item 1' } },
      ])
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useSchemaItems({ schemaId: ref('dataset') })
          return () => h('div', `Count: ${data.value?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 1'))
    })
  })

  describe('useDatasetFacets', () => {
    it('should fetch facets', async () => {
      vi.spyOn(mockClient, 'getDatasetFacets').mockResolvedValue({
        theme: { 'Health': 10, 'Education': 5 },
        keyword: { 'data': 15 },
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDatasetFacets()
          return () => h('div', `Themes: ${Object.keys(data.value?.theme || {}).length}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Themes: 2'))
    })
  })
})
