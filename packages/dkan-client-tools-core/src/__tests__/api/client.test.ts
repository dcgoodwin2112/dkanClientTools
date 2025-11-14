/**
 * Tests for DkanApiClient Core Functionality
 *
 * Tests core HTTP client infrastructure:
 * - Constructor and configuration
 * - Authentication (token and basic auth)
 * - Retry logic for network failures
 * - Error handling and DkanApiError creation
 * - Utility methods (getBaseUrl, getDefaultOptions, getOpenApiDocsUrl)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DkanApiClient } from '../../api/client'
import { DkanApiError } from '../../types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Core Functionality', () => {
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

  describe('Authentication', () => {
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
  })

  describe('Error Handling', () => {
    it('should throw DkanApiError on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Dataset not found',
      })

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 0 },
      })

      await expect(client.getDataset('nonexistent')).rejects.toThrow(DkanApiError)
      await expect(client.getDataset('nonexistent')).rejects.toThrow('HTTP 404: Not Found')
    })

    it('should extract error details from JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({
          message: 'Validation failed',
          status: 400,
          timestamp: '2025-11-13T17:00:00Z',
          data: {
            field: 'title',
            error: 'Required field missing',
          },
        }),
      })

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 0 },
      })

      try {
        await client.getDataset('invalid-id')
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(DkanApiError)
        const apiError = error as DkanApiError
        expect(apiError.message).toBe('Validation failed')
        expect(apiError.statusCode).toBe(400)
        expect(apiError.timestamp).toBe('2025-11-13T17:00:00Z')
        expect(apiError.data).toEqual({
          field: 'title',
          error: 'Required field missing',
        })
      }
    })

    it('should handle error response without timestamp', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => JSON.stringify({
          message: 'Dataset not found',
        }),
      })

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 0 },
      })

      try {
        await client.getDataset('missing-id')
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(DkanApiError)
        const apiError = error as DkanApiError
        expect(apiError.message).toBe('Dataset not found')
        expect(apiError.timestamp).toBeUndefined()
        expect(apiError.data).toBeUndefined()
      }
    })

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error occurred',
      })

      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 0 },
      })

      try {
        await client.searchDatasets({})
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(DkanApiError)
        const apiError = error as DkanApiError
        expect(apiError.message).toContain('500')
        expect(apiError.statusCode).toBe(500)
        expect(apiError.timestamp).toBeUndefined()
      }
    })
  })

  describe('Retry Logic', () => {
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
        defaultOptions: { retry: 2, retryDelay: 1 },
      })

      await expect(client.getDataset('test')).rejects.toThrow(DkanApiError)
      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries

      mockFetch.mockReset()
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
        defaultOptions: { retry: 0 },
      })

      await expect(client.getDataset('test')).rejects.toThrow(DkanApiError)

      // Should only call fetch once (no retries for HTTP errors)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Utility Methods', () => {
    it('should return base URL', () => {
      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      expect(client.getBaseUrl()).toBe('https://example.com')
    })

    it('should return default options', () => {
      const client = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: {
          retry: 5,
          retryDelay: 2000,
        },
      })
      const options = client.getDefaultOptions()
      expect(options.retry).toBe(5)
      expect(options.retryDelay).toBe(2000)
    })

    it('should return OpenAPI docs URL', () => {
      const client = new DkanApiClient({ baseUrl: 'https://example.com' })
      const docsUrl = client.getOpenApiDocsUrl()
      expect(docsUrl).toBe('https://example.com/api/1')
    })

    it('should handle baseUrl with trailing slash in OpenAPI docs URL', () => {
      const client = new DkanApiClient({ baseUrl: 'https://example.com/' })
      const docsUrl = client.getOpenApiDocsUrl()
      expect(docsUrl).toBe('https://example.com/api/1')
    })
  })
})
