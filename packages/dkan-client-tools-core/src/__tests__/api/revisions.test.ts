/**
 * Tests for Revisions and Moderation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Revisions and Moderation', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  it('should get all revisions for an item', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { identifier: 'rev1', state: 'published', published: true, modified: '2024-01-01', message: '' },
        { identifier: 'rev2', state: 'draft', published: false, modified: '2024-01-02', message: '' },
      ],
    })

    const revisions = await client.getRevisions('dataset', 'test-123')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/metastore/schemas/dataset/items/test-123/revisions',
      expect.any(Object)
    )
    expect(revisions).toHaveLength(2)
    expect(revisions[0].state).toBe('published')
  })

  it('should get a specific revision', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        identifier: 'rev1',
        state: 'published',
        published: true,
        modified: '2024-01-01',
        message: 'Initial version',
      }),
    })

    const revision = await client.getRevision('dataset', 'test-123', 'rev1')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/metastore/schemas/dataset/items/test-123/revisions/rev1',
      expect.any(Object)
    )
    expect(revision.identifier).toBe('rev1')
  })

  it('should create a new revision', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ endpoint: 'dataset', identifier: 'test-123' }),
    })

    const result = await client.createRevision('dataset', 'test-123', {
      state: 'published',
      message: 'Publishing to production',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/metastore/schemas/dataset/items/test-123/revisions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ state: 'published', message: 'Publishing to production' }),
      })
    )
    expect(result.identifier).toBe('test-123')
  })

  it('should change dataset workflow state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ endpoint: 'dataset', identifier: 'test-123' }),
    })

    const result = await client.changeDatasetState('test-123', 'published', 'Ready for production')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/metastore/schemas/dataset/items/test-123/revisions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ state: 'published', message: 'Ready for production' }),
      })
    )
    expect(result.identifier).toBe('test-123')
  })
})
