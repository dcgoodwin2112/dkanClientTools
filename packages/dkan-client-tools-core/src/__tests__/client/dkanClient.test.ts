/**
 * Tests for DkanClient
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanClient } from '../../client/dkanClient'
import { DkanApiClient } from '../../api/client'
import { QueryClient } from '@tanstack/query-core'

// Mock the API client
vi.mock('../../api/client')

describe('DkanClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create client with basic config', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })

      expect(client).toBeInstanceOf(DkanClient)
      expect(client.getApiClient()).toBeInstanceOf(DkanApiClient)
      expect(client.getQueryClient()).toBeInstanceOf(QueryClient)
    })

    it('should accept custom QueryClient', () => {
      const customQueryClient = new QueryClient()
      const client = new DkanClient({
        baseUrl: 'https://example.com',
        queryClient: customQueryClient,
      })

      expect(client.getQueryClient()).toBe(customQueryClient)
    })

    it('should create QueryClient with default options', () => {
      const client = new DkanClient({
        baseUrl: 'https://example.com',
        defaultOptions: {
          staleTime: 30000,
          cacheTime: 600000,
          retry: 5,
          retryDelay: 2000,
        },
      })

      const queryClient = client.getQueryClient()
      const defaultOptions = queryClient.getDefaultOptions()

      expect(defaultOptions.queries?.staleTime).toBe(30000)
      expect(defaultOptions.queries?.gcTime).toBe(600000)
      expect(defaultOptions.queries?.retry).toBe(5)
      expect(defaultOptions.queries?.retryDelay).toBe(2000)
    })

    it('should use sensible defaults when no options provided', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const queryClient = client.getQueryClient()
      const defaultOptions = queryClient.getDefaultOptions()

      expect(defaultOptions.queries?.staleTime).toBe(0)
      expect(defaultOptions.queries?.gcTime).toBe(5 * 60 * 1000)
      expect(defaultOptions.queries?.retry).toBe(3)
      expect(defaultOptions.queries?.retryDelay).toBe(1000)
    })
  })

  describe('Mount/Unmount', () => {
    it('should track mount count', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })

      expect(client.isMounted()).toBe(false)

      client.mount()
      expect(client.isMounted()).toBe(true)

      client.mount()
      expect(client.isMounted()).toBe(true)

      client.unmount()
      expect(client.isMounted()).toBe(true)

      client.unmount()
      expect(client.isMounted()).toBe(false)
    })

    it('should only mount QueryClient once', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const queryClient = client.getQueryClient()
      const mountSpy = vi.spyOn(queryClient, 'mount')

      client.mount()
      client.mount()
      client.mount()

      expect(mountSpy).toHaveBeenCalledTimes(1)
    })

    it('should only unmount QueryClient when count reaches zero', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const queryClient = client.getQueryClient()
      const unmountSpy = vi.spyOn(queryClient, 'unmount')

      client.mount()
      client.mount()

      client.unmount()
      expect(unmountSpy).not.toHaveBeenCalled()

      client.unmount()
      expect(unmountSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('API Methods', () => {
    it('should delegate fetchDataset to API client', async () => {
      const mockDataset = { identifier: 'test', title: 'Test Dataset' }

      vi.mocked(DkanApiClient.prototype.getDataset).mockResolvedValue(mockDataset as any)

      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const result = await client.fetchDataset('test')

      expect(DkanApiClient.prototype.getDataset).toHaveBeenCalledWith('test')
      expect(result).toEqual(mockDataset)
    })

    it('should delegate searchDatasets to API client', async () => {
      const mockResponse = {
        total: 10,
        results: [],
        facets: {},
      }

      vi.mocked(DkanApiClient.prototype.searchDatasets).mockResolvedValue(mockResponse)

      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const result = await client.searchDatasets({ keyword: 'health' })

      expect(DkanApiClient.prototype.searchDatasets).toHaveBeenCalledWith({ keyword: 'health' })
      expect(result).toEqual(mockResponse)
    })

    it('should delegate queryDatastore to API client', async () => {
      const mockResponse = {
        results: [{ field: 'value' }],
        count: 1,
      }

      vi.mocked(DkanApiClient.prototype.queryDatastore).mockResolvedValue(mockResponse)

      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const result = await client.queryDatastore('dataset-123', 0, { limit: 10 })

      expect(DkanApiClient.prototype.queryDatastore).toHaveBeenCalledWith(
        'dataset-123',
        0,
        { limit: 10 }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Query Cache Operations', () => {
    it('should prefetch query', async () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const queryClient = client.getQueryClient()
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery')

      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      await client.prefetchQuery(['test', 'key'], queryFn, { staleTime: 30000 })

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: ['test', 'key'],
        queryFn,
        staleTime: 30000,
      })
    })

    it('should get query data from cache', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const queryClient = client.getQueryClient()

      // Set some data
      queryClient.setQueryData(['test'], { value: 'cached' })

      const result = client.getQueryData(['test'])

      expect(result).toEqual({ value: 'cached' })
    })

    it('should set query data', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const data = { identifier: 'test', title: 'Test' }

      client.setQueryData(['dataset', 'test'], data)

      const retrieved = client.getQueryData(['dataset', 'test'])
      expect(retrieved).toEqual(data)
    })

    it('should invalidate queries', async () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const queryClient = client.getQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await client.invalidateQueries(['dataset'])

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['dataset'],
      })
    })

    it('should clear all caches', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const queryClient = client.getQueryClient()
      const clearSpy = vi.spyOn(queryClient, 'clear')

      // Set some data
      client.setQueryData(['test'], { data: 'test' })

      client.clear()

      expect(clearSpy).toHaveBeenCalled()
    })

    it('should remove specific queries', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const queryClient = client.getQueryClient()
      const removeSpy = vi.spyOn(queryClient, 'removeQueries')

      client.removeQueries(['dataset', 'test'])

      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: ['dataset', 'test'],
      })
    })

    it('should get query cache', () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })
      const queryCache = client.getQueryCache()

      expect(queryCache).toBeDefined()
      expect(queryCache.getAll).toBeDefined()
    })
  })

  describe('Integration', () => {
    it('should work with real QueryClient', async () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })

      // Mock API response
      const mockDataset = {
        identifier: 'test-123',
        title: 'Test Dataset',
        description: 'Description',
        accessLevel: 'public' as const,
        modified: '2024-01-01',
        keyword: ['test'],
        publisher: { name: 'Test' },
        contactPoint: {
          '@type': 'vcard:Contact',
          fn: 'Test Contact',
          hasEmail: 'test@example.com',
        },
      }

      vi.mocked(DkanApiClient.prototype.getDataset).mockResolvedValue(mockDataset)

      // Prefetch the query
      await client.prefetchQuery(
        ['dataset', 'test-123'],
        () => client.fetchDataset('test-123')
      )

      // Data should now be in cache
      const cached = client.getQueryData(['dataset', 'test-123'])
      expect(cached).toEqual(mockDataset)
    })

    it('should handle multiple concurrent operations', async () => {
      const client = new DkanClient({ baseUrl: 'https://example.com' })

      vi.mocked(DkanApiClient.prototype.getDataset).mockImplementation(
        async (id) => ({ identifier: id, title: `Dataset ${id}` } as any)
      )

      // Multiple concurrent prefetch operations
      await Promise.all([
        client.prefetchQuery(['dataset', '1'], () => client.fetchDataset('1')),
        client.prefetchQuery(['dataset', '2'], () => client.fetchDataset('2')),
        client.prefetchQuery(['dataset', '3'], () => client.fetchDataset('3')),
      ])

      expect(client.getQueryData(['dataset', '1'])).toBeDefined()
      expect(client.getQueryData(['dataset', '2'])).toBeDefined()
      expect(client.getQueryData(['dataset', '3'])).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should propagate API errors', async () => {
      const error = new Error('API Error')
      vi.mocked(DkanApiClient.prototype.getDataset).mockRejectedValue(error)

      const client = new DkanClient({ baseUrl: 'https://example.com' })

      await expect(client.fetchDataset('test')).rejects.toThrow('API Error')
    })

    it('should handle queryDatastore with default index', async () => {
      vi.mocked(DkanApiClient.prototype.queryDatastore).mockResolvedValue({
        results: [],
        count: 0,
      })

      const client = new DkanClient({ baseUrl: 'https://example.com' })
      await client.queryDatastore('dataset-123')

      // Should be called with undefined for index (uses default parameter)
      expect(DkanApiClient.prototype.queryDatastore).toHaveBeenCalledWith(
        'dataset-123',
        undefined,
        undefined
      )
    })
  })
})
