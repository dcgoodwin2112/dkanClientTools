/**
 * Tests for Data Dictionary CRUD
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Data Dictionary CRUD', () => {
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
