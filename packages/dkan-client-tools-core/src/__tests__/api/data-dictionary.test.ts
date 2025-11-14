/**
 * Tests for Data Dictionary Operations
 *
 * Covers all data dictionary functionality:
 * - getDataDictionary() - Fetch single data dictionary
 * - listDataDictionaries() - Get all data dictionaries
 * - getDataDictionaryFromUrl() - Fetch external data dictionary
 * - createDataDictionary() - Create new data dictionary
 * - updateDataDictionary() - Full replacement update
 * - deleteDataDictionary() - Delete data dictionary
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Data Dictionary Operations', () => {
  let client: DkanApiClient

  const mockDictionary = {
    identifier: 'dict-123',
    data: {
      title: 'Test Dictionary',
      fields: [
        { name: 'id', type: 'integer' as const, title: 'ID' },
        { name: 'name', type: 'string' as const, title: 'Name' },
      ],
    },
  }

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  describe('getDataDictionary', () => {
    it('should fetch data dictionary by identifier', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockDictionary,
      })

      const result = await client.getDataDictionary('dict-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/data-dictionary/items/dict-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockDictionary)
      expect(result.data.fields).toHaveLength(2)
    })

    it('should throw error when dictionary not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Data dictionary not found',
      })

      const errorClient = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 0 },
      })

      await expect(errorClient.getDataDictionary('nonexistent')).rejects.toThrow()
    })
  })

  describe('listDataDictionaries', () => {
    it('should fetch all data dictionaries', async () => {
      const mockResponse = {
        'dict-1': { identifier: 'dict-1', data: { title: 'Dictionary 1', fields: [] } },
        'dict-2': { identifier: 'dict-2', data: { title: 'Dictionary 2', fields: [] } },
        'dict-3': { identifier: 'dict-3', data: { title: 'Dictionary 3', fields: [] } },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
      })

      const result = await client.listDataDictionaries()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/data-dictionary/items',
        expect.any(Object)
      )
      expect(result).toHaveLength(3)
      expect(result[0].identifier).toBe('dict-1')
      expect(result[1].identifier).toBe('dict-2')
      expect(result[2].identifier).toBe('dict-3')
    })

    it('should return empty array when no dictionaries exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({}),
      })

      const result = await client.listDataDictionaries()

      expect(result).toEqual([])
    })
  })

  describe('getDataDictionaryFromUrl', () => {
    it('should fetch data dictionary from external URL', async () => {
      const externalDict = {
        title: 'External Dictionary',
        fields: [
          { name: 'lat', type: 'number', title: 'Latitude' },
          { name: 'lon', type: 'number', title: 'Longitude' },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => externalDict,
      })

      const result = await client.getDataDictionaryFromUrl('https://example.com/dict.json')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/dict.json'
      )
      expect(result).toEqual(externalDict)
      expect(result.fields).toHaveLength(2)
    })

    it('should handle fetch errors for external URLs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'URL not found',
      })

      const errorClient = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 0 },
      })

      await expect(
        errorClient.getDataDictionaryFromUrl('https://example.com/missing.json')
      ).rejects.toThrow()
    })

    it('should handle CORS errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(
        client.getDataDictionaryFromUrl('https://blocked.example.com/dict.json')
      ).rejects.toThrow('Failed to fetch')
    })
  })

  describe('createDataDictionary', () => {
    it('should create a data dictionary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ endpoint: 'data-dictionary', identifier: 'dict-123' }),
      })

      const result = await client.createDataDictionary(mockDictionary)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/data-dictionary/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockDictionary),
        })
      )
      expect(result.identifier).toBe('dict-123')
    })

    it('should create dictionary with complex field constraints', async () => {
      const complexDict = {
        identifier: 'complex-dict',
        data: {
          title: 'Complex Dictionary',
          fields: [
            {
              name: 'email',
              type: 'string' as const,
              format: 'email',
              constraints: {
                required: true,
                pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
              },
            },
            {
              name: 'age',
              type: 'integer' as const,
              constraints: {
                minimum: 0,
                maximum: 120,
              },
            },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ endpoint: 'data-dictionary', identifier: 'complex-dict' }),
      })

      const result = await client.createDataDictionary(complexDict)

      expect(result.identifier).toBe('complex-dict')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
      expect(body.data.fields[0].constraints.required).toBe(true)
      expect(body.data.fields[1].constraints.minimum).toBe(0)
    })

    it('should create dictionary with indexes', async () => {
      const dictWithIndexes = {
        identifier: 'indexed-dict',
        data: {
          title: 'Indexed Dictionary',
          fields: [
            { name: 'id', type: 'integer' as const },
            { name: 'state', type: 'string' as const },
          ],
          indexes: [
            { fields: [{ name: 'state' }] },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ endpoint: 'data-dictionary', identifier: 'indexed-dict' }),
      })

      const result = await client.createDataDictionary(dictWithIndexes)

      expect(result.identifier).toBe('indexed-dict')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
      expect(body.data.indexes).toHaveLength(1)
    })
  })

  describe('updateDataDictionary', () => {
    it('should update a data dictionary', async () => {
      const updatedDict = {
        ...mockDictionary,
        data: {
          ...mockDictionary.data,
          title: 'Updated Dictionary',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ endpoint: 'data-dictionary', identifier: 'dict-123' }),
      })

      const result = await client.updateDataDictionary('dict-123', updatedDict)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/data-dictionary/items/dict-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updatedDict),
        })
      )
      expect(result.identifier).toBe('dict-123')
    })
  })

  describe('deleteDataDictionary', () => {
    it('should delete a data dictionary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Data dictionary deleted successfully' }),
      })

      const result = await client.deleteDataDictionary('dict-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/data-dictionary/items/dict-123',
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(result.message).toContain('deleted')
    })
  })
})
