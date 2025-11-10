/**
 * Tests for Data Dictionary Mutation composables
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useCreateDataDictionary, useUpdateDataDictionary, useDeleteDataDictionary } from '../useDataDictionaryMutations'

describe('useDataDictionaryMutations', () => {
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

  describe('useCreateDataDictionary', () => {
    it('should create successfully', async () => {
      vi.spyOn(mockClient, 'createDataDictionary').mockResolvedValue({ endpoint: 'data-dictionary', identifier: 'dict-123' })
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useCreateDataDictionary()
          return () => h('div', [
            h('button', { onClick: () => mutation.mutate({ identifier: 'dict-123', data: { title: 'Test', fields: [] } }) }, 'Create'),
            mutation.isSuccess.value ? h('div', 'Created') : null,
          ])
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toContain('Created'))
    })

    it('should handle errors', async () => {
      vi.spyOn(mockClient, 'createDataDictionary').mockRejectedValue(new Error('Failed'))
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useCreateDataDictionary()
          return () => h('div', [
            h('button', { onClick: () => mutation.mutate({} as any) }, 'Create'),
            mutation.isError.value ? h('div', mutation.error.value?.message) : null,
          ])
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toContain('Failed'))
    })
  })

  describe('useUpdateDataDictionary', () => {
    it('should update successfully', async () => {
      vi.spyOn(mockClient, 'updateDataDictionary').mockResolvedValue({ endpoint: 'data-dictionary', identifier: 'dict-123' })
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useUpdateDataDictionary()
          return () => h('button', {
            onClick: () => mutation.mutate({ identifier: 'dict-123', dictionary: { identifier: 'dict-123', data: { title: 'Updated', fields: [] } } })
          }, mutation.isSuccess.value ? 'Updated' : 'Update')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('Updated'))
    })
  })

  describe('useDeleteDataDictionary', () => {
    it('should delete successfully', async () => {
      vi.spyOn(mockClient, 'deleteDataDictionary').mockResolvedValue({ message: 'Deleted' })
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useDeleteDataDictionary()
          return () => h('button', {
            onClick: () => mutation.mutate('dict-123')
          }, mutation.isSuccess.value ? 'Deleted' : 'Delete')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('Deleted'))
    })
  })
})
