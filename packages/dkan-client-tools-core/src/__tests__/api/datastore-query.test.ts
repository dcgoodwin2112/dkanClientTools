/**
 * Tests for Datastore Query Operations
 *
 * Covers all datastore query functionality:
 * - queryDatastore() - Query single resource (POST/GET)
 * - queryDatastoreMulti() - Query multiple resources with joins (POST/GET)
 * - getDatastoreSchema() - Get schema with data dictionary
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Datastore Query Operations', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({
      baseUrl: 'https://example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('queryDatastore', () => {
    it('should query datastore with POST request (default)', async () => {
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

    it('should query datastore with complex options', async () => {
      const options = {
        conditions: [
          { property: 'field1', value: 'test', operator: '=' },
          { property: 'field2', value: 100, operator: '>' },
        ],
        sorts: [{ property: 'field1', order: 'asc' }],
        limit: 50,
        offset: 10,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ results: [], count: 0 }),
      })

      await client.queryDatastore('dataset-123', 0, options)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(options),
        })
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
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
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

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
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

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
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

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.format).toBe('csv')
    })
  })

  describe('queryDatastoreMulti', () => {
    it('should query multiple resources with POST (default)', async () => {
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
  })

  describe('getDatastoreSchema', () => {
    it('should fetch datastore schema', async () => {
      const mockSchema = {
        results: [],
        count: 0,
        schema: {
          'mock-resource-id': {
            fields: {
              field1: { type: 'string' },
              field2: { type: 'number' },
            },
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockSchema,
      })

      const result = await client.getDatastoreSchema('dataset-123', 0)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/datastore/query/dataset-123/0?schema=true',
        expect.any(Object)
      )
      expect(result.schema).toBeDefined()
      expect(result.schema.fields).toHaveLength(2)
    })

    it('should include data dictionary in schema when available', async () => {
      const mockSchemaWithDict = {
        results: [],
        count: 0,
        schema: {
          'mock-resource-id': {
            fields: {
              population: {
                type: 'number',
                title: 'Population',
                description: 'Total population count',
              },
            },
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSchemaWithDict,
      })

      const result = await client.getDatastoreSchema('dataset-123', 0)

      expect(result.schema.fields[0].title).toBe('Population')
      expect(result.schema.fields[0].description).toBe('Total population count')
    })
  })
})
