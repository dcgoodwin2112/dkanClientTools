/**
 * Phase 3 - OpenAPI Alignment Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Phase 3 OpenAPI Alignment', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({
      baseUrl: 'https://example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('queryDatastoreMulti() method', () => {
    it('should query multiple resources with POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: 1, name: 'Test 1' },
            { id: 2, name: 'Test 2' },
          ],
          count: 2,
        }),
      })

      const result = await client.queryDatastoreMulti({
        resources: [
          { id: 'resource-1', alias: 'r1' },
          { id: 'resource-2', alias: 'r2' },
        ],
        conditions: [{ property: 'name', value: 'Test' }],
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/datastore/query',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('resource-1'),
        })
      )
      expect(result.count).toBe(2)
      expect(result.results).toHaveLength(2)
    })

    it('should query multiple resources with GET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: 1 }],
          count: 1,
        }),
      })

      const result = await client.queryDatastoreMulti(
        {
          resources: [{ id: 'resource-1' }],
          limit: 10,
        },
        'GET'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/1/datastore/query?'),
        expect.any(Object)
      )
      expect(result.count).toBe(1)
    })
  })

  describe('queryDatastore() GET method support', () => {
    it('should query datastore with POST (default)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: 1 }],
          count: 1,
        }),
      })

      await client.queryDatastore('dataset-123', 0, {
        limit: 10,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/datastore/query/dataset-123/0',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should query datastore with GET method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: 1 }],
          count: 1,
        }),
      })

      await client.queryDatastore(
        'dataset-123',
        0,
        {
          limit: 10,
          offset: 0,
        },
        'GET'
      )

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('/api/1/datastore/query/dataset-123/0?')
      expect(callUrl).toContain('limit')
    })

    it('should handle GET request with no options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          count: 0,
        }),
      })

      await client.queryDatastore('dataset-123', 0, {}, 'GET')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/datastore/query/dataset-123/0',
        expect.any(Object)
      )
    })

    it('should serialize complex query options for GET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          count: 0,
        }),
      })

      await client.queryDatastore(
        'dataset-123',
        0,
        {
          conditions: [{ property: 'name', value: 'test' }],
          sorts: [{ property: 'id', order: 'asc' }],
          limit: 20,
        },
        'GET'
      )

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('conditions')
      expect(callUrl).toContain('sorts')
      expect(callUrl).toContain('limit')
    })
  })

  describe('Error handling for Phase 3 methods', () => {
    it('should handle queryDatastoreMulti errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({
          message: 'Invalid query parameters',
        }),
      })

      await expect(
        client.queryDatastoreMulti({
          resources: [{ id: 'invalid' }],
        })
      ).rejects.toThrow('Invalid query parameters')
    })

    it('should handle queryDatastore GET errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      })

      await expect(
        client.queryDatastore('dataset-123', 0, {}, 'GET')
      ).rejects.toThrow()
    })
  })
})
