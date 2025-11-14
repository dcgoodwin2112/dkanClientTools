/**
 * Edge Case Tests
 *
 * Tests for edge cases and boundary conditions:
 * - Large pagination scenarios
 * - Unicode and special character handling
 * - Malformed JSON responses
 * - Empty and null values
 * - Network timeout scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient, DkanApiError } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Edge Cases', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({
      baseUrl: 'https://example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('Large Pagination', () => {
    it('should handle very large offset values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total: 100000,
        }),
      })

      const result = await client.searchDatasets({
        page: 1000,
        'page-size': 100,
      })

      expect(result.results).toEqual([])
      expect(result.total).toBe(100000)
    })

    it('should handle offset beyond available results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total: 50,
        }),
      })

      const result = await client.searchDatasets({
        page: 100,
        'page-size': 10,
      })

      expect(result.results).toEqual([])
    })

    it('should handle maximum page size', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: new Array(1000).fill({ id: 'test' }),
          total: 5000,
        }),
      })

      const result = await client.searchDatasets({
        'page-size': 1000,
      })

      expect(result.results).toHaveLength(1000)
    })

    it('should handle datastore queries with very large limits', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: new Array(10000).fill({ field: 'value' }),
          count: 10000,
        }),
      })

      const result = await client.queryDatastore('dataset-1', 0, {
        limit: 10000,
      })

      expect(result.results).toHaveLength(10000)
      expect(result.count).toBe(10000)
    })

    it('should handle datastore query with offset exceeding available rows', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          count: 0,
        }),
      })

      const result = await client.queryDatastore('dataset-1', 0, {
        offset: 999999,
        limit: 100,
      })

      expect(result.results).toEqual([])
      expect(result.count).toBe(0)
    })
  })

  describe('Unicode and Special Characters', () => {
    it('should handle Unicode characters in dataset identifiers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: 'dataset-测试-🚀',
          title: 'Unicode Dataset',
        }),
      })

      const result = await client.getDataset('dataset-测试-🚀')

      expect(result.identifier).toBe('dataset-测试-🚀')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('dataset-测试-🚀'),
        expect.any(Object)
      )
    })

    it('should handle Unicode in search queries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              identifier: 'test-1',
              title: 'Données françaises',
            },
            {
              identifier: 'test-2',
              title: '日本のデータ',
            },
          ],
          total: 2,
        }),
      })

      const result = await client.searchDatasets({
        keyword: 'données',
      })

      expect(result.results).toHaveLength(2)
      expect(result.results[0].title).toBe('Données françaises')
      expect(result.results[1].title).toBe('日本のデータ')
    })

    it('should handle special characters in datastore queries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { name: "O'Brien", email: 'test@example.com' },
            { name: 'Smith & Jones', email: 'another@test.com' },
          ],
          count: 2,
        }),
      })

      const result = await client.queryDatastore('dataset-1', 0, {
        conditions: [
          { property: 'name', value: "O'Brien", operator: '=' },
        ],
      })

      expect(result.results[0].name).toBe("O'Brien")
      expect(result.results[1].name).toBe('Smith & Jones')
    })

    it('should handle Unicode in dataset titles and descriptions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: 'test-1',
          title: 'Αρχαίο ελληνικό κείμενο',
          description: 'محتوى عربي للاختبار',
          keyword: ['Тестовое слово', '中文关键词'],
        }),
      })

      const result = await client.getDataset('test-1')

      expect(result.title).toBe('Αρχαίο ελληνικό κείμενο')
      expect(result.description).toBe('محتوى عربي للاختبار')
      expect(result.keyword).toContain('Тестовое слово')
      expect(result.keyword).toContain('中文关键词')
    })

    it('should handle emojis in dataset metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: 'emoji-test',
          title: 'Dataset with Emojis 🎉🚀📊',
          description: 'Testing emoji support ✅',
        }),
      })

      const result = await client.getDataset('emoji-test')

      expect(result.title).toContain('🎉')
      expect(result.description).toContain('✅')
    })
  })

  describe('Malformed and Invalid Responses', () => {
    it('should handle malformed JSON in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'This is not valid JSON {{{',
      })

      await expect(client.getDataset('test-1')).rejects.toThrow(DkanApiError)
    })

    it('should handle empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => '',
      })

      await expect(client.getDataset('nonexistent')).rejects.toThrow(DkanApiError)
    })

    it('should handle response with missing required fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing identifier, title, description
        }),
      })

      const result = await client.getDataset('incomplete')

      expect(result).toBeDefined()
      // Should not throw, just return incomplete data
    })

    it('should handle JSON with unexpected structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          unexpected: 'structure',
          data: {
            nested: {
              deeply: 'value',
            },
          },
        }),
      })

      const result = await client.getDataset('unexpected')

      expect(result).toBeDefined()
      expect(result).toHaveProperty('unexpected')
    })

    it('should handle response that throws during JSON parsing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('JSON parsing failed')
        },
      })

      await expect(client.getDataset('broken')).rejects.toThrow('JSON parsing failed')
    })

    it('should handle partial JSON in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => '{"error": "Invalid',
      })

      await expect(client.getDataset('test')).rejects.toThrow(DkanApiError)
    })
  })

  describe('Empty and Null Values', () => {
    it('should handle empty string as dataset identifier', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid identifier',
      })

      await expect(client.getDataset('')).rejects.toThrow()
    })

    it('should handle null values in dataset fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: 'test-1',
          title: 'Test Dataset',
          description: null,
          keyword: null,
          theme: null,
          distribution: null,
        }),
      })

      const result = await client.getDataset('test-1')

      expect(result.identifier).toBe('test-1')
      expect(result.description).toBeNull()
      expect(result.keyword).toBeNull()
    })

    it('should handle empty arrays in search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total: 0,
        }),
      })

      const result = await client.searchDatasets({ keyword: 'nonexistent' })

      expect(result.results).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should handle empty conditions array in datastore query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: 1 }],
          count: 1,
        }),
      })

      const result = await client.queryDatastore('dataset-1', 0, {
        conditions: [],
        limit: 10,
      })

      expect(result.results).toHaveLength(1)
    })

    it('should handle undefined optional parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: 'test-1',
          title: 'Test',
        }),
      })

      const result = await client.getDataset('test-1', undefined)

      expect(result.identifier).toBe('test-1')
    })
  })

  describe('Network and Timeout Scenarios', () => {
    it('should handle network timeout with retry disabled', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      await expect(client.getDataset('test-1')).rejects.toThrow('Network timeout')
    })

    it('should handle connection refused', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      await expect(client.getDataset('test-1')).rejects.toThrow('ECONNREFUSED')
    })

    it('should handle DNS resolution failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ENOTFOUND'))

      await expect(client.getDataset('test-1')).rejects.toThrow('ENOTFOUND')
    })

    it('should handle abort signal', async () => {
      mockFetch.mockRejectedValueOnce(new Error('The operation was aborted'))

      await expect(client.getDataset('test-1')).rejects.toThrow('aborted')
    })
  })

  describe('Boundary Values', () => {
    it('should handle zero as page size', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total: 100,
        }),
      })

      const result = await client.searchDatasets({
        'page-size': 0,
      })

      expect(result.results).toEqual([])
    })

    it('should handle negative offset (should be rejected by API)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid offset',
      })

      await expect(
        client.queryDatastore('dataset-1', 0, {
          offset: -10,
        })
      ).rejects.toThrow()
    })

    it('should handle very long dataset identifiers', async () => {
      const longId = 'a'.repeat(500)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: longId,
          title: 'Long ID Dataset',
        }),
      })

      const result = await client.getDataset(longId)

      expect(result.identifier).toBe(longId)
    })

    it('should handle very long search queries', async () => {
      const longQuery = 'search term '.repeat(100)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total: 0,
        }),
      })

      const result = await client.searchDatasets({
        fulltext: longQuery,
      })

      expect(result.results).toEqual([])
    })

    it('should handle maximum integer values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total: Number.MAX_SAFE_INTEGER,
        }),
      })

      const result = await client.searchDatasets({})

      expect(result.total).toBe(Number.MAX_SAFE_INTEGER)
    })
  })

  describe('Special Query Conditions', () => {
    it('should handle wildcard characters in LIKE operator', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { name: 'test123' },
            { name: 'test456' },
          ],
          count: 2,
        }),
      })

      const result = await client.queryDatastore('dataset-1', 0, {
        conditions: [
          { property: 'name', value: 'test%', operator: 'like' },
        ],
      })

      expect(result.results).toHaveLength(2)
    })

    it('should handle regex special characters in match operator', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { email: 'user@example.com' },
          ],
          count: 1,
        }),
      })

      const result = await client.queryDatastore('dataset-1', 0, {
        conditions: [
          { property: 'email', value: '.*@example\\.com', operator: 'match' },
        ],
      })

      expect(result.results).toHaveLength(1)
    })

    it('should handle multiple conditions with different operators', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { age: 25, name: 'John', city: 'NYC' },
          ],
          count: 1,
        }),
      })

      const result = await client.queryDatastore('dataset-1', 0, {
        conditions: [
          { property: 'age', value: 18, operator: '>' },
          { property: 'name', value: 'John', operator: '=' },
          { property: 'city', value: 'NYC', operator: 'like' },
        ],
      })

      expect(result.results).toHaveLength(1)
    })
  })

  describe('Array and Multi-field Sorting', () => {
    it('should handle multi-field sorting with mismatched array lengths', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total: 0,
        }),
      })

      // More sort fields than sort orders
      const result = await client.searchDatasets({
        sort: ['modified', 'title', 'identifier'],
        'sort-order': ['desc', 'asc'],
      })

      expect(result.results).toEqual([])
    })

    it('should handle empty sort array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total: 0,
        }),
      })

      const result = await client.searchDatasets({
        sort: [],
      })

      expect(result.results).toEqual([])
    })
  })
})
