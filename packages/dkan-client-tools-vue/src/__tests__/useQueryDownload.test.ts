/**
 * Tests for useQueryDownload composables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useDownloadQuery, useDownloadQueryByDistribution } from '../useQueryDownload'

describe('useQueryDownload', () => {
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

  describe('useDownloadQuery', () => {
    it('should download query results', async () => {
      vi.spyOn(mockClient, 'downloadQuery').mockResolvedValue(new Blob(['data'], { type: 'text/csv' }))
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useDownloadQuery()
          return () => h('button', {
            onClick: () => mutation.mutate({ datasetId: 'ds-123', format: 'csv' })
          }, mutation.isSuccess.value ? 'Downloaded' : 'Download')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('Downloaded'))
    })

    it('should handle errors', async () => {
      vi.spyOn(mockClient, 'downloadQuery').mockRejectedValue(new Error('Download failed'))
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useDownloadQuery()
          return () => h('div', [
            h('button', { onClick: () => mutation.mutate({ datasetId: 'ds-123', format: 'csv' }) }, 'Download'),
            mutation.isError.value ? h('div', mutation.error.value?.message) : null,
          ])
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toContain('Download failed'))
    })
  })

  describe('useDownloadQueryByDistribution', () => {
    it('should download by distribution', async () => {
      vi.spyOn(mockClient, 'downloadQueryByDistribution').mockResolvedValue(new Blob(['data'], { type: 'text/csv' }))
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useDownloadQueryByDistribution()
          return () => h('button', {
            onClick: () => mutation.mutate({ datasetId: 'ds-123', distributionIndex: 0, format: 'csv' })
          }, mutation.isSuccess.value ? 'Downloaded' : 'Download')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('Downloaded'))
    })
  })
})
