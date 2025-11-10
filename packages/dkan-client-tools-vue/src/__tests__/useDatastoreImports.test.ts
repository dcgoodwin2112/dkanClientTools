/**
 * Tests for useDatastoreImports composables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useDatastoreImports, useDatastoreImport, useDatastoreStatistics, useTriggerDatastoreImport, useDeleteDatastore } from '../useDatastoreImports'

describe('useDatastoreImports', () => {
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

  describe('useDatastoreImports', () => {
    it('should list all imports', async () => {
      vi.spyOn(mockClient, 'listDatastoreImports').mockResolvedValue({
        'resource-1': { status: 'done', importer: { state: { num_records: 1000 } } },
        'resource-2': { status: 'in_progress' },
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDatastoreImports()
          return () => h('div', `Count: ${Object.keys(data.value || {}).length}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 2'))
    })
  })

  describe('useDatastoreImport', () => {
    it('should get specific import', async () => {
      vi.spyOn(mockClient, 'listDatastoreImports').mockResolvedValue({
        'resource-1': { status: 'done', importer: { state: { num_records: 500 } } },
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDatastoreImport({ identifier: ref('resource-1') })
          return () => h('div', data.value?.status || 'Loading')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('done'))
    })
  })

  describe('useDatastoreStatistics', () => {
    it('should fetch statistics', async () => {
      vi.spyOn(mockClient, 'getDatastoreStatistics').mockResolvedValue({
        num_records: 1000,
        columns: ['id', 'name'],
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDatastoreStatistics({ identifier: ref('resource-1') })
          return () => h('div', `Records: ${data.value?.num_records || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Records: 1000'))
    })
  })

  describe('useTriggerDatastoreImport', () => {
    it('should trigger import', async () => {
      vi.spyOn(mockClient, 'triggerDatastoreImport').mockResolvedValue({ message: 'Import started' })
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useTriggerDatastoreImport()
          return () => h('button', {
            onClick: () => mutation.mutate('resource-1')
          }, mutation.isSuccess.value ? 'Triggered' : 'Trigger')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('Triggered'))
    })
  })

  describe('useDeleteDatastore', () => {
    it('should delete datastore', async () => {
      vi.spyOn(mockClient, 'deleteDatastore').mockResolvedValue({ message: 'Deleted' })
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useDeleteDatastore()
          return () => h('button', {
            onClick: () => mutation.mutate('resource-1')
          }, mutation.isSuccess.value ? 'Deleted' : 'Delete')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('Deleted'))
    })
  })
})
