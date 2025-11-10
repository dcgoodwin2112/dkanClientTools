/**
 * Tests for OpenAPI Documentation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - OpenAPI Documentation', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  it('should get OpenAPI specification', async () => {
    const mockSpec = {
      openapi: '3.0.0',
      info: { title: 'DKAN API', version: '2.0' },
      paths: {
        '/api/1/search': { get: { summary: 'Search datasets' } },
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpec,
    })

    const spec = await client.getOpenApiSpec()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/spec',
      expect.any(Object)
    )
    expect(spec.openapi).toBe('3.0.0')
    expect(spec.paths).toBeDefined()
  })

  it('should get OpenAPI docs URL', () => {
    const url = client.getOpenApiDocsUrl()

    expect(url).toBe('https://example.com/api/1/docs')
  })
})
