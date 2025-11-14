/**
 * Tests for Metastore Operations
 *
 * Covers all metastore functionality:
 * - listSchemas() - Get all available schemas
 * - getSchema() - Get individual schema definition
 * - getSchemaItems() - Get all items for a schema
 * - getDatasetFacets() - Get available facets for search
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Metastore Operations', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({
      baseUrl: 'https://example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('listSchemas', () => {
    it('should fetch all available schemas', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ['dataset', 'data-dictionary', 'distribution'],
      })

      const result = await client.listSchemas()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas',
        expect.any(Object)
      )
      expect(result).toEqual(['dataset', 'data-dictionary', 'distribution'])
      expect(result).toHaveLength(3)
    })

    it('should return empty array when no schemas exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const result = await client.listSchemas()

      expect(result).toEqual([])
    })
  })

  describe('getSchema', () => {
    it('should fetch dataset schema definition', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: 'Dataset Schema',
          type: 'object',
          properties: {
            identifier: { type: 'string' },
            title: { type: 'string' },
          },
        }),
      })

      const schema = await client.getSchema('dataset')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset',
        expect.any(Object)
      )
      expect(schema.title).toBe('Dataset Schema')
      expect(schema.properties).toHaveProperty('identifier')
    })

    it('should fetch data-dictionary schema', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: 'Data Dictionary Schema',
          type: 'object',
        }),
      })

      const schema = await client.getSchema('data-dictionary')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/data-dictionary',
        expect.any(Object)
      )
      expect(schema.title).toBe('Data Dictionary Schema')
    })

    it('should throw error for non-existent schema', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Schema not found',
      })

      await expect(client.getSchema('nonexistent')).rejects.toThrow()
    })
  })

  describe('getSchemaItems', () => {
    it('should fetch schema items without show-reference-ids', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { identifier: 'dataset-1', title: 'Dataset 1' },
          { identifier: 'dataset-2', title: 'Dataset 2' },
        ],
      })

      await client.getSchemaItems('dataset')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items',
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

    it('should fetch data-dictionary items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { identifier: 'dict-1', data: { title: 'Dictionary 1' } },
          { identifier: 'dict-2', data: { title: 'Dictionary 2' } },
        ],
      })

      const items = await client.getSchemaItems('data-dictionary')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/data-dictionary/items',
        expect.any(Object)
      )
      expect(items).toHaveLength(2)
    })
  })

  describe('getDatasetFacets', () => {
    it('should fetch facets from /api/1/search/facets endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            type: 'theme',
            values: [
              { value: 'Environment', count: 10 },
              { value: 'Health', count: 5 },
            ],
          },
          {
            type: 'keyword',
            values: [
              { value: 'data', count: 20 },
              { value: 'statistics', count: 15 },
            ],
          },
          {
            type: 'publisher',
            values: [
              { value: 'Agency A', count: 8 },
              { value: 'Agency B', count: 12 },
            ],
          },
        ],
      })

      const facets = await client.getDatasetFacets()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/search/facets',
        expect.any(Object)
      )
      expect(facets.theme).toEqual(['Environment', 'Health'])
      expect(facets.keyword).toEqual(['data', 'statistics'])
      expect(facets.publisher).toEqual(['Agency A', 'Agency B'])
    })

    it('should handle empty facets response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const facets = await client.getDatasetFacets()

      expect(facets.theme).toEqual([])
      expect(facets.keyword).toEqual([])
      expect(facets.publisher).toEqual([])
    })

    it('should handle facets with simple string values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            type: 'theme',
            values: ['Environment', 'Health'],
          },
        ],
      })

      const facets = await client.getDatasetFacets()

      expect(facets.theme).toEqual(['Environment', 'Health'])
    })

    it('should handle partial facets (only some types present)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            type: 'theme',
            values: [{ value: 'Environment', count: 10 }],
          },
        ],
      })

      const facets = await client.getDatasetFacets()

      expect(facets.theme).toEqual(['Environment'])
      expect(facets.keyword).toEqual([])
      expect(facets.publisher).toEqual([])
    })
  })
})
