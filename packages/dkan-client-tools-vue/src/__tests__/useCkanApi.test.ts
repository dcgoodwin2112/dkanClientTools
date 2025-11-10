/**
 * Tests for useCkanApi composables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useCkanPackageSearch, useCkanDatastoreSearch, useCkanDatastoreSearchSql, useCkanResourceShow, useCkanCurrentPackageListWithResources } from '../useCkanApi'

describe('useCkanApi', () => {
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

  describe('useCkanPackageSearch', () => {
    it('should search packages', async () => {
      vi.spyOn(mockClient, 'ckanPackageSearch').mockResolvedValue({
        success: true,
        result: { count: 10, results: [] },
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useCkanPackageSearch({ query: ref('health') })
          return () => h('div', `Count: ${data.value?.result.count || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 10'))
    })
  })

  describe('useCkanDatastoreSearch', () => {
    it('should search datastore', async () => {
      vi.spyOn(mockClient, 'ckanDatastoreSearch').mockResolvedValue({
        success: true,
        result: { records: [{ id: 1 }], total: 1 },
      } as any)
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useCkanDatastoreSearch({ resource_id: ref('resource-1') })
          return () => h('div', `Records: ${data.value?.result.records.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Records: 1'))
    })
  })

  describe('useCkanDatastoreSearchSql', () => {
    it('should search with SQL', async () => {
      vi.spyOn(mockClient, 'ckanDatastoreSearchSql').mockResolvedValue({
        success: true,
        result: { records: [{ count: 100 }] },
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useCkanDatastoreSearchSql({ sql: ref('SELECT COUNT(*) FROM resource') })
          return () => h('div', `Rows: ${data.value?.result.records.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Rows: 1'))
    })
  })

  describe('useCkanResourceShow', () => {
    it('should show resource', async () => {
      vi.spyOn(mockClient, 'ckanResourceShow').mockResolvedValue({
        success: true,
        result: { id: 'resource-1', name: 'Resource 1' },
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useCkanResourceShow({ resourceId: ref('resource-1') })
          return () => h('div', data.value?.result.name || 'Loading')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Resource 1'))
    })
  })

  describe('useCkanCurrentPackageListWithResources', () => {
    it('should list packages with resources', async () => {
      vi.spyOn(mockClient, 'ckanCurrentPackageListWithResources').mockResolvedValue({
        success: true,
        result: [{ id: 'pkg-1', resources: [] }],
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useCkanCurrentPackageListWithResources()
          return () => h('div', `Packages: ${data.value?.result.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Packages: 1'))
    })
  })
})
