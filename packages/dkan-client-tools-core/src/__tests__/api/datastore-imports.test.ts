/**
 * Tests for Datastore Imports
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Datastore Imports', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  it('should list all datastore imports', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        'resource-1': { status: 'done', importer: { state: { num_records: 100 } } },
        'resource-2': { status: 'in_progress' },
      }),
    })

    const imports = await client.listDatastoreImports()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/datastore/imports',
      expect.any(Object)
    )
    expect(imports['resource-1'].status).toBe('done')
  })

  it('should trigger a datastore import', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'in_progress' }),
    })

    const result = await client.triggerDatastoreImport({ resource_id: 'resource-1' })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/datastore/imports',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ resource_id: 'resource-1' }),
      })
    )
    expect(result.status).toBe('in_progress')
  })


  it('should delete a datastore', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Datastore deleted successfully' }),
    })

    const result = await client.deleteDatastore('resource-1')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/datastore/imports/resource-1',
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(result.message).toContain('deleted')
  })

  // Phase 1 - OpenAPI alignment tests
  it('should get datastore statistics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        numOfRows: 1000,
        numOfColumns: 15,
        columns: {
          field1: { type: 'string' },
          field2: { type: 'integer' },
        },
      }),
    })

    const stats = await client.getDatastoreStatistics('distribution-uuid')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/datastore/imports/distribution-uuid',
      expect.any(Object)
    )
    expect(stats.numOfRows).toBe(1000)
    expect(stats.numOfColumns).toBe(15)
    expect(stats.columns).toHaveProperty('field1')
  })
})
