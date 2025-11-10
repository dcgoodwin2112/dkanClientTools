/**
 * Tests for Dataset CRUD operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Dataset CRUD', () => {
  let client: DkanApiClient

  const mockDataset = {
    identifier: 'test-123',
    title: 'Test Dataset',
    description: 'Test',
    accessLevel: 'public' as const,
    modified: '2024-01-01',
    keyword: ['test'],
    publisher: { name: 'Test' },
    contactPoint: { '@type': 'vcard:Contact', fn: 'Test', hasEmail: 'test@example.com' },
  }

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  it('should create a dataset', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ endpoint: 'dataset', identifier: 'test-123' }),
    })

    const result = await client.createDataset(mockDataset)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/metastore/schemas/dataset/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockDataset),
      })
    )
    expect(result.identifier).toBe('test-123')
  })

  it('should update a dataset', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ endpoint: 'dataset', identifier: 'test-123' }),
    })

    const result = await client.updateDataset('test-123', mockDataset)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/metastore/schemas/dataset/items/test-123',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockDataset),
      })
    )
    expect(result.identifier).toBe('test-123')
  })

  it('should patch a dataset', async () => {
    const partial = { title: 'Updated Title' }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ endpoint: 'dataset', identifier: 'test-123' }),
    })

    const result = await client.patchDataset('test-123', partial)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/metastore/schemas/dataset/items/test-123',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(partial),
      })
    )
    expect(result.identifier).toBe('test-123')
  })

  it('should delete a dataset', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Dataset deleted successfully' }),
    })

    const result = await client.deleteDataset('test-123')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/metastore/schemas/dataset/items/test-123',
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(result.message).toContain('deleted')
  })
})
