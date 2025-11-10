/**
 * Tests for useDataset composable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref, computed, nextTick } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useDataset } from '../useDataset'
import { waitForOptions } from './setup'

describe('useDataset', () => {
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

  it('should fetch dataset successfully', async () => {
    const mockDataset = {
      identifier: 'test-123',
      title: 'Test Dataset',
      description: 'Test description',
      accessLevel: 'public' as const,
      modified: '2024-01-01',
      keyword: ['test'],
      publisher: { name: 'Test Publisher' },
      contactPoint: {
        '@type': 'vcard:Contact',
        fn: 'Test Contact',
        hasEmail: 'test@example.com',
      },
    }

    vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue(mockDataset)

    const TestComponent = defineComponent({
      setup() {
        const { data, isLoading, error } = useDataset({ identifier: ref('test-123') })

        return () => {
          if (isLoading.value) return h('div', 'Loading...')
          if (error.value) return h('div', `Error: ${error.value.message}`)
          if (!data.value) return null

          return h('div', `Title: ${data.value.title}`)
        }
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    expect(wrapper.text()).toBe('Loading...')

    await flushPromises()
    await nextTick()

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Title: Test Dataset')
    }, waitForOptions)

    expect(mockClient.fetchDataset).toHaveBeenCalledWith('test-123')
  })

  it('should handle fetch error', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockRejectedValue(new Error('Network error'))

    const TestComponent = defineComponent({
      setup() {
        const { data, isLoading, error } = useDataset({ identifier: ref('test-123') })

        return () => {
          if (isLoading.value) return h('div', 'Loading...')
          if (error.value) return h('div', `Error: ${error.value.message}`)
          if (!data.value) return null

          return h('div', `Title: ${data.value.title}`)
        }
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await flushPromises()
    await nextTick()

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Error: Network error')
    }, waitForOptions)
  })

  it('should respect enabled option', async () => {
    const fetchSpy = vi.spyOn(mockClient, 'fetchDataset')

    const TestComponent = defineComponent({
      setup() {
        const { data, isLoading } = useDataset({
          identifier: ref('test-123'),
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

    await flushPromises()
    await nextTick()

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Loading: no')
    }, waitForOptions)

    // Should not have called fetchDataset since enabled is false
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('should support conditional fetching', async () => {
    const fetchSpy = vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue({
      identifier: 'test-123',
      title: 'Test',
    } as any)

    const TestComponent = defineComponent({
      setup() {
        const id = ref<string | null>(null)
        const enabled = computed(() => !!id.value)
        const { data } = useDataset({
          identifier: computed(() => id.value || ''),
          enabled,
        })

        const loadDataset = () => {
          id.value = 'test-123'
        }

        return () => h('div', [
          h('button', { onClick: loadDataset }, 'Load Dataset'),
          data.value ? h('div', `Title: ${data.value.title}`) : null,
        ])
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    expect(fetchSpy).not.toHaveBeenCalled()

    await wrapper.find('button').trigger('click')

    await flushPromises()
    await nextTick()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Title: Test')
    }, waitForOptions)

    expect(fetchSpy).toHaveBeenCalledWith('test-123')
  })

  it('should cache results', async () => {
    const fetchSpy = vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue({
      identifier: 'test-123',
      title: 'Test Dataset',
    } as any)

    const TestComponent = defineComponent({
      setup() {
        const query1 = useDataset({ identifier: ref('test-123') })
        const query2 = useDataset({ identifier: ref('test-123') })

        return () => h('div', [
          h('div', `Query1: ${query1.data.value?.title || 'Loading'}`),
          h('div', `Query2: ${query2.data.value?.title || 'Loading'}`),
        ])
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await flushPromises()
    await nextTick()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Query1: Test Dataset')
      expect(wrapper.text()).toContain('Query2: Test Dataset')
    }, waitForOptions)

    // Should only fetch once due to caching
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('should provide query state', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue({
      identifier: 'test-123',
      title: 'Test',
    } as any)

    const TestComponent = defineComponent({
      setup() {
        const { isLoading, isSuccess, isError, isFetching, status } = useDataset({
          identifier: ref('test-123'),
        })

        return () => h('div', [
          h('div', `Loading: ${isLoading.value}`),
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

    // Initial state
    expect(wrapper.text()).toContain('Loading: true')

    await flushPromises()
    await nextTick()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Success: true')
      expect(wrapper.text()).toContain('Status: success')
    }, waitForOptions)
  })

  it('should support staleTime option', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue({
      identifier: 'test-123',
      title: 'Test',
    } as any)

    const TestComponent = defineComponent({
      setup() {
        const { data } = useDataset({
          identifier: ref('test-123'),
          staleTime: ref(60000), // 1 minute
        })

        return () => h('div', data.value?.title || 'Loading')
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await flushPromises()
    await nextTick()

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Test')
    }, waitForOptions)
  })

  it('should handle multiple datasets simultaneously', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockImplementation(async (id) => ({
      identifier: id,
      title: `Dataset ${id}`,
    } as any))

    const TestComponent = defineComponent({
      setup() {
        const dataset1 = useDataset({ identifier: ref('id-1') })
        const dataset2 = useDataset({ identifier: ref('id-2') })
        const dataset3 = useDataset({ identifier: ref('id-3') })

        return () => h('div', [
          h('div', dataset1.data.value?.title || 'Loading 1'),
          h('div', dataset2.data.value?.title || 'Loading 2'),
          h('div', dataset3.data.value?.title || 'Loading 3'),
        ])
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await flushPromises()
    await nextTick()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Dataset id-1')
      expect(wrapper.text()).toContain('Dataset id-2')
      expect(wrapper.text()).toContain('Dataset id-3')
    }, waitForOptions)
  })

  it('should work with reactive parameters', async () => {
    const mockDataset = {
      identifier: 'test-123',
      title: 'Test Dataset',
    }
    vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue(mockDataset as any)

    const TestComponent = defineComponent({
      setup() {
        const identifier = ref('test-123')
        const { data } = useDataset({ identifier })

        return () => h('div', data.value?.title || 'loading')
      },
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[DkanClientPlugin, { client: mockClient }]],
      },
    })

    await flushPromises()
    await nextTick()

    await vi.waitFor(() => {
      expect(wrapper.text()).toBe('Test Dataset')
    }, waitForOptions)
  })
})
