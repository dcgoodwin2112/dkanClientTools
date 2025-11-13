/**
 * Phase 1 - OpenAPI Alignment Tests
 *
 * Tests for new functionality added in Phase 1:
 * - show-reference-ids support for dataset methods
 * - Array sort parameters for search
 * - Expanded DatastoreQueryOptions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Phase 1 OpenAPI Alignment', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  describe('show-reference-ids support', () => {
    it('should fetch dataset with show-reference-ids parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: 'dataset-1',
          title: 'Test Dataset',
          distribution: [
            {
              identifier: 'dist-uuid-123',
              title: 'Distribution 1',
              format: 'csv',
            },
          ],
        }),
      })

      const dataset = await client.getDataset('dataset-1', { showReferenceIds: true })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items/dataset-1?show-reference-ids',
        expect.any(Object)
      )
      expect(dataset.distribution[0].identifier).toBe('dist-uuid-123')
    })

    it('should fetch dataset without show-reference-ids when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: 'dataset-1',
          title: 'Test Dataset',
        }),
      })

      await client.getDataset('dataset-1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items/dataset-1',
        expect.any(Object)
      )
    })

    it('should fetch schema items with show-reference-ids parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            identifier: 'dataset-1',
            distribution: [{ identifier: 'dist-uuid-1' }],
          },
          {
            identifier: 'dataset-2',
            distribution: [{ identifier: 'dist-uuid-2' }],
          },
        ],
      })

      const items = await client.getSchemaItems('dataset', { showReferenceIds: true })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items?show-reference-ids',
        expect.any(Object)
      )
      expect(items).toHaveLength(2)
    })

    it('should fetch schema items without show-reference-ids when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await client.getSchemaItems('dataset')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items',
        expect.any(Object)
      )
    })
  })

  describe('Array sort parameters', () => {
    it('should handle single sort parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, results: [] }),
      })

      await client.searchDatasets({ sort: 'title', 'sort-order': 'asc' })

      const fetchCall = mockFetch.mock.calls[0]
      const url = fetchCall[0] as string

      expect(url).toContain('sort=title')
      expect(url).toContain('sort-order=asc')
    })

    it('should handle array sort parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, results: [] }),
      })

      await client.searchDatasets({
        sort: ['modified', 'title'],
        'sort-order': ['desc', 'asc'],
      })

      const fetchCall = mockFetch.mock.calls[0]
      const url = fetchCall[0] as string

      // Check that both sort parameters are present
      expect(url).toContain('sort=modified')
      expect(url).toContain('sort=title')
      expect(url).toContain('sort-order=desc')
      expect(url).toContain('sort-order=asc')
    })

    it('should handle mixed array and single sort parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, results: [] }),
      })

      await client.searchDatasets({
        sort: ['modified', 'title'],
        'sort-order': 'desc', // Single value
      })

      const fetchCall = mockFetch.mock.calls[0]
      const url = fetchCall[0] as string

      expect(url).toContain('sort=modified')
      expect(url).toContain('sort=title')
      expect(url).toContain('sort-order=desc')
    })
  })

  describe('DatastoreQueryOptions expanded properties', () => {
    it('should accept resources parameter for multi-resource queries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      })

      const queryOptions = {
        resources: [
          { id: 'dist-1', alias: 'table1' },
          { id: 'dist-2', alias: 'table2' },
        ],
        limit: 10,
      }

      await client.queryDatastore('dataset-1', 0, queryOptions)

      expect(mockFetch).toHaveBeenCalled()
      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.resources).toHaveLength(2)
      expect(body.resources[0].alias).toBe('table1')
    })

    it('should accept groupings parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      })

      const queryOptions = {
        groupings: [
          { property: 'category' },
          { property: 'status', resource: 'table1' },
        ],
      }

      await client.queryDatastore('dataset-1', 0, queryOptions)

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.groupings).toHaveLength(2)
      expect(body.groupings[0].property).toBe('category')
    })

    it('should accept response control flags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      })

      const queryOptions = {
        count: true,
        results: true,
        schema: false,
        keys: true,
        format: 'json' as const,
        rowIds: false,
      }

      await client.queryDatastore('dataset-1', 0, queryOptions)

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.count).toBe(true)
      expect(body.results).toBe(true)
      expect(body.schema).toBe(false)
      expect(body.keys).toBe(true)
      expect(body.format).toBe('json')
      expect(body.rowIds).toBe(false)
    })

    it('should accept CSV format option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      })

      const queryOptions = {
        format: 'csv' as const,
        limit: 100,
      }

      await client.queryDatastore('dataset-1', 0, queryOptions)

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.format).toBe('csv')
    })
  })
})
