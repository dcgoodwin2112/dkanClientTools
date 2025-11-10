/**
 * Tests for useDatasetSearch composable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, computed } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useDatasetSearch } from '../useDatasetSearch'

describe('useDatasetSearch', () => {
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
      defaultOptions: { retry: 0 }, // Disable retries for tests
      queryClient, // Pass the QueryClient from vue-query!
    })
  })

  it('should search datasets with default options', async () => {
    const mockResponse = {
      total: 10,
      results: [
        { identifier: '1', title: 'Dataset 1' },
        { identifier: '2', title: 'Dataset 2' },
      ],
    }

    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue(mockResponse as any)

    const TestComponent = defineComponent({
      setup() {
        const { data, isLoading } = useDatasetSearch()

        return () => {
          if (isLoading.value) return h('div', 'Loading...')
          if (!data.value) return null

          return h('div', `Found ${data.value.total} datasets`)
        }
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Found 10 datasets')
    })

    expect(mockClient.searchDatasets).toHaveBeenCalledWith(undefined)
  })

  it('should search with keyword filter', async () => {
    const mockResponse = {
      total: 5,
      results: [{ identifier: '1', title: 'Health Dataset' }],
    }

    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue(mockResponse as any)

    const TestComponent = defineComponent({
      setup() {
        const { data } = useDatasetSearch({
          searchOptions: ref({ keyword: 'health' }),
        })

        return () => h('div', `Results: ${data.value?.results.length || 0}`)
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Results: 1')
    })

    expect(mockClient.searchDatasets).toHaveBeenCalledWith({ keyword: 'health' })
  })

  it('should search with multiple filters', async () => {
    const mockResponse = { total: 3, results: [] }

    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue(mockResponse as any)

    const TestComponent = defineComponent({
      setup() {
        const { data } = useDatasetSearch({
          searchOptions: ref({
            keyword: 'health',
            theme: 'Health',
            'page-size': 20,
            page: 1,
            sort: 'modified',
            'sort-order': 'desc',
          }),
        })

        return () => h('div', `Total: ${data.value?.total || 0}`)
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Total: 3')
    })

    expect(mockClient.searchDatasets).toHaveBeenCalledWith({
      keyword: 'health',
      theme: 'Health',
      'page-size': 20,
      page: 1,
      sort: 'modified',
      'sort-order': 'desc',
    })
  })

  it('should handle search error', async () => {
    vi.spyOn(mockClient, 'searchDatasets').mockRejectedValue(new Error('Search failed'))

    const TestComponent = defineComponent({
      setup() {
        const { error, isLoading } = useDatasetSearch()

        return () => {
          if (isLoading.value) return h('div', 'Loading...')
          if (error.value) return h('div', `Error: ${error.value.message}`)

          return h('div', 'Success')
        }
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Error: Search failed')
    })
  })

  it('should respect enabled option', async () => {
    const searchSpy = vi.spyOn(mockClient, 'searchDatasets')

    const TestComponent = defineComponent({
      setup() {
        const { isLoading } = useDatasetSearch({ enabled: ref(false) })
        return () => h('div', `Loading: ${isLoading.value ? 'yes' : 'no'}`)
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Loading: no')
    })

    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('should refetch when search options change', async () => {
    const searchSpy = vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
      total: 0,
      results: [],
    } as any)

    const TestComponent = defineComponent({
      setup() {
        const keyword = ref('health')
        const { data } = useDatasetSearch({
          searchOptions: computed(() => ({ keyword: keyword.value })),
        })

        const changeKeyword = () => {
          keyword.value = 'education'
        }

        return () => h('div', [
          h('button', { onClick: changeKeyword }, 'Change Keyword'),
          h('div', `Total: ${data.value?.total || 0}`),
        ])
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith({ keyword: 'health' })
    })

    await wrapper.find('button').trigger('click')

    await vi.waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith({ keyword: 'education' })
    })

    expect(searchSpy).toHaveBeenCalledTimes(2)
  })

  it('should provide all query states', async () => {
    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
      total: 5,
      results: [],
    } as any)

    const TestComponent = defineComponent({
      setup() {
        const { isSuccess, isError, isFetching, status } = useDatasetSearch()

        return () => h('div', [
          h('div', `Success: ${isSuccess.value}`),
          h('div', `Error: ${isError.value}`),
          h('div', `Fetching: ${isFetching.value}`),
          h('div', `Status: ${status.value}`),
        ])
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Success: true')
      expect(wrapper.text()).toContain('Status: success')
    })
  })

  it('should cache search results', async () => {
    const searchSpy = vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
      total: 5,
      results: [],
    } as any)

    const TestComponent = defineComponent({
      setup() {
        // Two hooks with same search options
        const search1 = useDatasetSearch({ searchOptions: ref({ keyword: 'test' }) })
        const search2 = useDatasetSearch({ searchOptions: ref({ keyword: 'test' }) })

        return () => h('div', [
          h('div', `Total1: ${search1.data.value?.total || 0}`),
          h('div', `Total2: ${search2.data.value?.total || 0}`),
        ])
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Total1: 5')
      expect(wrapper.text()).toContain('Total2: 5')
    })

    // Should only search once due to caching
    expect(searchSpy).toHaveBeenCalledTimes(1)
  })

  it('should handle empty results', async () => {
    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
      total: 0,
      results: [],
    } as any)

    const TestComponent = defineComponent({
      setup() {
        const { data } = useDatasetSearch()

        return () => {
          if (!data.value) return h('div', 'Loading')

          return h('div', data.value.results.length === 0 ? 'No results found' : 'Found results')
        }
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('No results found')
    })
  })
})
