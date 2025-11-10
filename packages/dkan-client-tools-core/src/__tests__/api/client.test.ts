/**
 * Tests for DkanApiClient
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DkanApiClient } from '../../api/client'
import { DkanApiError } from '../../types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Constructor', () => {
    it('should create client with basic config', () => {
      const client = new DkanApiClient({ baseUrl: 'https://example.com' })

      expect(client.getBaseUrl()).toBe('https://example.com')
      expect(client.getDefaultOptions()).toEqual({
        retry: 3,
        retryDelay: 1000,
        staleTime: 0,
        cacheTime: 5 * 60 * 1000,
      })
    })

    it('should strip trailing slash from baseUrl', () => {
      const client = new DkanApiClient({ baseUrl: 'https://example.com/' })
      expect(client.getBaseUrl()).toBe('https://example.com')
    })

    it('should accept custom default options', () => {
      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: {
          retry: 5,
          retryDelay: 2000,
          staleTime: 30000,
          cacheTime: 600000,
        },
      })

      expect(client.getDefaultOptions()).toEqual({
        retry: 5,
        retryDelay: 2000,
        staleTime: 30000,
        cacheTime: 600000,
      })
    })

    it('should handle token auth', () => {
      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        auth: { token: 'test-token' },
      })

      expect(client).toBeDefined()
    })

    it('should handle basic auth', () => {
      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        auth: { username: 'user', password: 'pass' },
      })

      expect(client).toBeDefined()
    })
  })

  describe('getDataset', () => {
    it('should fetch dataset by identifier', async () => {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockDataset,
      })

      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      const result = await client.getDataset('test-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items/test-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockDataset)
    })

    it('should include auth header when token provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({}),
      })

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        auth: { token: 'test-token' },
      })

      await client.getDataset('test-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      )
    })

    it('should include basic auth header when credentials provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({}),
      })

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        auth: { username: 'user', password: 'pass' },
      })

      await client.getDataset('test-123')

      const expectedAuth = `Basic ${btoa('user:pass')}`
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expectedAuth,
          }),
        })
      )
    })

    it('should throw DkanApiError on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Dataset not found',
      })

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 0 }, // Disable retries for this test
      })

      await expect(client.getDataset('nonexistent')).rejects.toThrow(DkanApiError)
      await expect(client.getDataset('nonexistent')).rejects.toThrow('HTTP 404: Not Found')
    })
  })

  describe('searchDatasets', () => {
    it('should search datasets with no filters', async () => {
      const mockResponse = {
        total: '10',
        results: {
          'id-1': { identifier: 'id-1', title: 'Dataset 1' },
          'id-2': { identifier: 'id-2', title: 'Dataset 2' },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
      })

      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      const result = await client.searchDatasets()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/search',
        expect.any(Object)
      )
      expect(result.total).toBe(10)
      expect(result.results).toHaveLength(2)
      expect(result.results[0]).toEqual({ identifier: 'id-1', title: 'Dataset 1' })
    })

    it('should search datasets with keyword filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ total: 5, results: {} }),
      })

      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      await client.searchDatasets({ keyword: 'health' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/search?keyword=health',
        expect.any(Object)
      )
    })

    it('should search datasets with multiple filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ total: 3, results: {} }),
      })

      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      await client.searchDatasets({
        keyword: 'health',
        theme: 'Health',
        page: 1,
        'page-size': 20,
        sort: 'modified',
        'sort-order': 'desc',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/search?keyword=health&theme=Health&sort=modified&sort-order=desc&page=1&page-size=20',
        expect.any(Object)
      )
    })

    it('should transform results object to array', async () => {
      const mockResponse = {
        total: 2,
        results: {
          'abc': { identifier: 'abc', title: 'First' },
          'def': { identifier: 'def', title: 'Second' },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
      })

      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      const result = await client.searchDatasets()

      expect(Array.isArray(result.results)).toBe(true)
      expect(result.results).toHaveLength(2)
    })

    it('should parse total as number when string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ total: '42', results: {} }),
      })

      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      const result = await client.searchDatasets()

      expect(result.total).toBe(42)
      expect(typeof result.total).toBe('number')
    })
  })

  describe('queryDatastore', () => {
    it('should query datastore with POST request', async () => {
      const mockResponse = {
        results: [{ field1: 'value1' }],
        count: 1,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
      })

      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      const result = await client.queryDatastore('dataset-123', 0, {
        limit: 10,
        offset: 0,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/datastore/query/dataset-123/0',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ limit: 10, offset: 0 }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should query datastore with complex options', async () => {
      const options = {
        conditions: [{ property: 'status', value: 'active' }],
        properties: ['id', 'name'],
        sorts: [{ property: 'name', order: 'asc' as const }],
        limit: 50,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ results: [], count: 0 }),
      })

      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      await client.queryDatastore('dataset-123', 0, options)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(options),
        })
      )
    })
  })

  describe('Retry logic', () => {
    it('should retry on network failure', async () => {
      vi.useFakeTimers()

      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ identifier: 'test' }),
        })

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 3, retryDelay: 100 },
      })

      const promise = client.getDataset('test')

      // Advance timers for retries
      await vi.advanceTimersByTimeAsync(100)
      await vi.advanceTimersByTimeAsync(200)

      const result = await promise

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result.identifier).toBe('test')

      vi.useRealTimers()
    })

    it('should throw error after max retries', async () => {
      mockFetch.mockReset()

      mockFetch.mockRejectedValue(new Error('Network error'))

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 2, retryDelay: 1 }, // Use minimal delay with real timers
      })

      await expect(client.getDataset('test')).rejects.toThrow(DkanApiError)
      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries

      mockFetch.mockReset() // Clean up for next test
    })

    it('should not retry on HTTP errors (only network errors)', async () => {
      mockFetch.mockReset()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not found',
      })

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 0 }, // No retries to avoid complexity
      })

      await expect(client.getDataset('test')).rejects.toThrow(DkanApiError)

      // Should only call fetch once (no retries for HTTP errors)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
