/**
 * Tests for Data Dictionary composables  
 * Converted from React tests - comprehensive coverage for query and list operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useDataDictionary, useDataDictionaryList, useDataDictionaryFromUrl, useDatastoreSchema } from '../useDataDictionary'

describe('useDataDictionary', () => {
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

  describe('useDataDictionary', () => {
    it('should fetch data dictionary successfully', async () => {
      const mockDictionary = {
        identifier: 'dict-123',
        data: { title: 'Test Dictionary', fields: [{ name: 'id', type: 'integer' as const }] },
      }
      vi.spyOn(mockClient, 'getDataDictionary').mockResolvedValue(mockDictionary)

      const wrapper = mount(defineComponent({
        setup() {
          const { data, isLoading } = useDataDictionary({ identifier: ref('dict-123') })
          return () => isLoading.value ? h('div', 'Loading...') : h('div', data.value?.data.title || 'None')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Test Dictionary'))
    })

    it('should handle errors', async () => {
      vi.spyOn(mockClient, 'getDataDictionary').mockRejectedValue(new Error('Not found'))
      const wrapper = mount(defineComponent({
        setup() {
          const { error } = useDataDictionary({ identifier: ref('dict-123') })
          return () => h('div', error.value?.message || 'No error')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Not found'))
    })

    it('should respect enabled option', () => {
      const spy = vi.spyOn(mockClient, 'getDataDictionary')
      mount(defineComponent({
        setup() {
          useDataDictionary({ identifier: ref('dict-123'), enabled: ref(false) })
          return () => h('div', 'test')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('useDataDictionaryList', () => {
    it('should fetch all dictionaries', async () => {
      vi.spyOn(mockClient, 'listDataDictionaries').mockResolvedValue([
        { identifier: '1', data: { title: 'Dict 1', fields: [] } },
      ])
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDataDictionaryList()
          return () => h('div', `Count: ${data.value?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 1'))
    })
  })

  describe('useDataDictionaryFromUrl', () => {
    it('should fetch from URL', async () => {
      vi.spyOn(mockClient, 'getDataDictionaryFromUrl').mockResolvedValue({
        identifier: '1', data: { title: 'URL Dict', fields: [] }
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDataDictionaryFromUrl({ url: ref('http://example.com') })
          return () => h('div', data.value?.data.title || 'Loading')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('URL Dict'))
    })
  })

  describe('useDatastoreSchema', () => {
    it('should fetch schema', async () => {
      vi.spyOn(mockClient, 'getDatastoreSchema').mockResolvedValue({
        schema: { fields: [{ name: 'id', type: 'integer' as const }] }
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDatastoreSchema({ datasetId: ref('ds-123') })
          return () => h('div', `Fields: ${data.value?.schema.fields.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Fields: 1'))
    })
  })
})
