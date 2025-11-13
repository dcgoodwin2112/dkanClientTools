/**
 * Tests for SQL Query
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - SQL Query', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  it('should execute SQL query with GET by default', async () => {
    const mockResult = [
      { id: 1, name: 'Test 1', value: 100 },
      { id: 2, name: 'Test 2', value: 200 },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    })

    const result = await client.querySql({
      query: 'SELECT * FROM datastore_12345 LIMIT 10',
      show_db_columns: false,
    })

    // show_db_columns: false is not included in the URL (only added when truthy)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/datastore/sql?query=SELECT+*+FROM+datastore_12345+LIMIT+10',
      expect.objectContaining({
        method: 'GET',
      })
    )
    expect(result).toEqual(mockResult)
    expect(result).toHaveLength(2)
  })

  it('should execute SQL query with POST when specified', async () => {
    const mockResult = [
      { id: 1, name: 'Test 1', value: 100 },
      { id: 2, name: 'Test 2', value: 200 },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    })

    const result = await client.querySql({
      query: 'SELECT * FROM datastore_12345 LIMIT 10',
      show_db_columns: false,
      method: 'POST',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/datastore/sql',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          query: 'SELECT * FROM datastore_12345 LIMIT 10',
          show_db_columns: false,
        }),
      })
    )
    expect(result).toEqual(mockResult)
    expect(result).toHaveLength(2)
  })

  it('should execute aggregate SQL queries', async () => {
    const mockResult = [
      { total: 100, avg_value: 50.5, max_value: 200 },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    })

    const result = await client.querySql({
      query: 'SELECT COUNT(*) as total, AVG(value) as avg_value, MAX(value) as max_value FROM datastore_12345',
    })

    expect(result[0].total).toBe(100)
    expect(result[0].avg_value).toBe(50.5)
  })
})
