/**
 * Tests for Query Download
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Query Download', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  it('should download query results as CSV', async () => {
    const mockBlob = new Blob(['id,name\\n1,Test'], { type: 'text/csv' })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    })

    const result = await client.downloadQuery('dataset-123', 0, {
      format: 'csv',
      limit: 100,
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/datastore/query/dataset-123/0/download?format=csv&limit=100',
      expect.objectContaining({
        method: 'GET',
      })
    )
    expect(result).toBeInstanceOf(Blob)
  })

  it('should download query results as JSON', async () => {
    const mockBlob = new Blob(['[{\"id\":1,\"name\":\"Test\"}]'], { type: 'application/json' })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    })

    const result = await client.downloadQuery('dataset-123', 0, { format: 'json' })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/datastore/query/dataset-123/0/download?format=json',
      expect.objectContaining({ method: 'GET' })
    )
    expect(result).toBeInstanceOf(Blob)
  })

  it('should download query results by distribution ID', async () => {
    const mockBlob = new Blob(['data'], { type: 'text/csv' })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    })

    const result = await client.downloadQueryByDistribution('dist-123', {
      format: 'csv',
      conditions: [{ property: 'state', value: 'CA' }],
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/datastore/query/dist-123/download?format=csv&conditions=%5B%7B%22property%22%3A%22state%22%2C%22value%22%3A%22CA%22%7D%5D',
      expect.objectContaining({
        method: 'GET',
      })
    )
    expect(result).toBeInstanceOf(Blob)
  })

  it('should handle download errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(client.downloadQuery('dataset-123', 0)).rejects.toThrow()
  })
})
