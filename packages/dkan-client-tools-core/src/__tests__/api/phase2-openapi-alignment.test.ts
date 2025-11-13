/**
 * Phase 2 - OpenAPI Alignment Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'
import { DkanApiError } from '../../types'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Phase 2 OpenAPI Alignment', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({
      baseUrl: 'https://example.com',
      defaultOptions: { retry: 0 }, // Disable retries for faster tests
    })
  })

  describe('getSchema() method', () => {
    it('should fetch individual schema definition', async () => {
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
  })

  describe('getDatasetFacets() API endpoint', () => {
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
  })

  describe('Enhanced DkanApiError', () => {
    it('should extract timestamp from error response', async () => {
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
})
