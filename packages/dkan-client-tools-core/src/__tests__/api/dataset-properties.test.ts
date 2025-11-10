/**
 * Tests for Dataset Properties
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Dataset Properties', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  it('should get all dataset properties', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['theme', 'keyword', 'publisher', 'modified', 'accessLevel'],
    })

    const properties = await client.getDatasetProperties()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/properties',
      expect.any(Object)
    )
    expect(properties).toContain('theme')
    expect(properties).toContain('keyword')
  })

  it('should get values for a specific property', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['Education', 'Health', 'Transportation', 'Environment'],
    })

    const values = await client.getPropertyValues('theme')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/properties/theme',
      expect.any(Object)
    )
    expect(values).toHaveLength(4)
    expect(values).toContain('Education')
  })

  it('should get all properties with their values', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        theme: ['Education', 'Health'],
        keyword: ['open', 'data', 'government'],
        accessLevel: ['public', 'restricted public'],
      }),
    })

    const facets = await client.getAllPropertiesWithValues()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/properties?show_values=true',
      expect.any(Object)
    )
    expect(facets.theme).toHaveLength(2)
    expect(facets.keyword).toHaveLength(3)
    expect(facets.accessLevel).toContain('public')
  })
})
