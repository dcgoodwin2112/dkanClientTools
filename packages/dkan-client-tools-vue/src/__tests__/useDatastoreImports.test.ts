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
    it('should fetch datastore statistics successfully', async () => {
      const mockStats = {
        numOfRows: 1500,
        numOfColumns: 8,
        columns: {
          id: { type: 'integer' },
          name: { type: 'string' },
          created_at: { type: 'date' },
        },
      }
      vi.spyOn(mockClient, 'getDatastoreStatistics').mockResolvedValue(mockStats)
      const wrapper = mount(defineComponent({
        setup() {
          const { data: stats, isLoading } = useDatastoreStatistics({ identifier: ref('resource-1') })
          return () => h('div', isLoading.value ? 'Loading' : `Rows: ${stats.value?.numOfRows} | Columns: ${stats.value?.numOfColumns}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Rows: 1500 | Columns: 8'))
    })

    it('should handle loading state', () => {
      vi.spyOn(mockClient, 'getDatastoreStatistics').mockImplementation(() => new Promise(() => {}))
      const wrapper = mount(defineComponent({
        setup() {
          const { data, isLoading } = useDatastoreStatistics({ identifier: ref('resource-1') })
          return () => h('div', `Loading: ${isLoading.value} | Data: ${data.value ? 'yes' : 'no'}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      expect(wrapper.text()).toBe('Loading: true | Data: no')
    })

    it('should handle error state', async () => {
      vi.spyOn(mockClient, 'getDatastoreStatistics').mockRejectedValue(new Error('Statistics not found'))
      const wrapper = mount(defineComponent({
        setup() {
          const { error, isLoading } = useDatastoreStatistics({ identifier: ref('resource-1') })
          return () => h('div', isLoading.value ? 'Loading' : (error.value ? `Error: ${error.value.message}` : 'Success'))
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Error: Statistics not found'))
    })

    it('should handle enabled option', () => {
      const statsSpy = vi.spyOn(mockClient, 'getDatastoreStatistics').mockResolvedValue({ numOfRows: 100, numOfColumns: 5, columns: {} })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDatastoreStatistics({ identifier: ref('resource-1'), enabled: ref(false) })
          return () => h('div', `Data: ${data.value ? 'yes' : 'no'}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      expect(wrapper.text()).toBe('Data: no')
      expect(statsSpy).not.toHaveBeenCalled()
    })

    it('should not fetch when identifier is empty', () => {
      const statsSpy = vi.spyOn(mockClient, 'getDatastoreStatistics').mockResolvedValue({ numOfRows: 100, numOfColumns: 5, columns: {} })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDatastoreStatistics({ identifier: ref('') })
          return () => h('div', `Data: ${data.value ? 'yes' : 'no'}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      expect(wrapper.text()).toBe('Data: no')
      expect(statsSpy).not.toHaveBeenCalled()
    })

    it('should display column information', async () => {
      const mockStats = {
        numOfRows: 2500,
        numOfColumns: 4,
        columns: {
          id: { type: 'integer' },
          title: { type: 'string' },
          count: { type: 'number' },
          active: { type: 'boolean' },
        },
      }
      vi.spyOn(mockClient, 'getDatastoreStatistics').mockResolvedValue(mockStats)
      const wrapper = mount(defineComponent({
        setup() {
          const { data: stats } = useDatastoreStatistics({ identifier: ref('resource-1') })
          return () => h('div', stats.value ? `Total: ${stats.value.numOfRows} | Columns: ${Object.keys(stats.value.columns).join(', ')}` : 'Loading')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Total: 2500 | Columns: id, title, count, active'))
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
