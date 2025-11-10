/**
 * Tests for useDatastore composable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useDatastore } from '../useDatastore'

describe('useDatastore', () => {
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

  it('should query datastore successfully', async () => {
    const mockResponse = {
      results: [
        { id: 1, name: 'Row 1' },
        { id: 2, name: 'Row 2' },
      ],
      count: 2,
    }

    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue(mockResponse)

    const TestComponent = defineComponent({
      setup() {
        const { data, isLoading } = useDatastore({ datasetId: ref('dataset-123') })

        return () => {
          if (isLoading.value) return h('div', 'Loading...')
          if (!data.value) return null

          return h('div', `Rows: ${data.value.count}`)
        }
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Rows: 2')
    })

    expect(mockClient.queryDatastore).toHaveBeenCalledWith('dataset-123', undefined, undefined)
  })

  it('should query with specific index', async () => {
    const mockResponse = { results: [], count: 0 }

    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue(mockResponse)

    const TestComponent = defineComponent({
      setup() {
        const { data } = useDatastore({
          datasetId: ref('dataset-123'),
          index: ref(2),
        })

        return () => h('div', `Count: ${data.value?.count || 0}`)
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Count: 0')
    })

    expect(mockClient.queryDatastore).toHaveBeenCalledWith('dataset-123', 2, undefined)
  })

  it('should query with query options', async () => {
    const mockResponse = { results: [], count: 0 }

    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue(mockResponse)

    const queryOptions = {
      conditions: [{ property: 'status', value: 'active' }],
      limit: 10,
      offset: 0,
    }

    const TestComponent = defineComponent({
      setup() {
        const { data } = useDatastore({
          datasetId: ref('dataset-123'),
          queryOptions: ref(queryOptions),
        })

        return () => h('div', `Count: ${data.value?.count || 0}`)
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(mockClient.queryDatastore).toHaveBeenCalledWith(
        'dataset-123',
        undefined,
        queryOptions
      )
    })
  })

  it('should handle query error', async () => {
    vi.spyOn(mockClient, 'queryDatastore').mockRejectedValue(new Error('Query failed'))

    const TestComponent = defineComponent({
      setup() {
        const { error, isLoading } = useDatastore({ datasetId: ref('dataset-123') })

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
      expect(wrapper.text()).toBe('Error: Query failed')
    })
  })

  it('should respect enabled option', async () => {
    const querySpy = vi.spyOn(mockClient, 'queryDatastore')

    const TestComponent = defineComponent({
      setup() {
        const { isLoading } = useDatastore({
          datasetId: ref('dataset-123'),
          enabled: ref(false),
        })

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

    expect(querySpy).not.toHaveBeenCalled()
  })

  it('should refetch when dataset ID changes', async () => {
    const querySpy = vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 0,
    })

    const TestComponent = defineComponent({
      setup() {
        const datasetId = ref('dataset-1')
        const { data } = useDatastore({ datasetId })

        const changeDataset = () => {
          datasetId.value = 'dataset-2'
        }

        return () => h('div', [
          h('button', { onClick: changeDataset }, 'Change Dataset'),
          h('div', `Count: ${data.value?.count || 0}`),
        ])
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(querySpy).toHaveBeenCalledWith('dataset-1', undefined, undefined)
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    await vi.waitFor(() => {
      expect(querySpy).toHaveBeenCalledWith('dataset-2', undefined, undefined)
    })

    expect(querySpy).toHaveBeenCalledTimes(2)
  })

  it('should cache query results', async () => {
    const querySpy = vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 5,
    })

    const TestComponent = defineComponent({
      setup() {
        const query1 = useDatastore({ datasetId: ref('dataset-123') })
        const query2 = useDatastore({ datasetId: ref('dataset-123') })

        return () => h('div', [
          h('div', `Count1: ${query1.data.value?.count || 0}`),
          h('div', `Count2: ${query2.data.value?.count || 0}`),
        ])
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Count1: 5')
      expect(wrapper.text()).toContain('Count2: 5')
    })

    // Should only query once due to caching
    expect(querySpy).toHaveBeenCalledTimes(1)
  })

  it('should provide all query states', async () => {
    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 0,
    })

    const TestComponent = defineComponent({
      setup() {
        const { isSuccess, isError, isFetching, status } = useDatastore({
          datasetId: ref('dataset-123'),
        })

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

  it('should handle complex query with sorts and conditions', async () => {
    const querySpy = vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 0,
    })

    const queryOptions = {
      conditions: [
        { property: 'age', value: 18, operator: '>' as const },
        { property: 'status', value: 'active' },
      ],
      sorts: [{ property: 'name', order: 'asc' as const }],
      limit: 50,
      offset: 10,
    }

    const TestComponent = defineComponent({
      setup() {
        useDatastore({
          datasetId: ref('dataset-123'),
          index: ref(0),
          queryOptions: ref(queryOptions),
        })

        return () => h('div', 'Test')
      },
    })

    mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(querySpy).toHaveBeenCalledWith('dataset-123', 0, queryOptions)
    })
  })

  it('should handle empty results', async () => {
    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 0,
    })

    const TestComponent = defineComponent({
      setup() {
        const { data } = useDatastore({ datasetId: ref('dataset-123') })

        return () => {
          if (!data.value) return h('div', 'Loading')

          return h('div', data.value.results.length === 0 ? 'No data found' : 'Found data')
        }
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('No data found')
    })
  })
})
