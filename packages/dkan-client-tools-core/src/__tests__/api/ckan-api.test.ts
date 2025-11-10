/**
 * Tests for CKAN API Compatibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - CKAN API Compatibility', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  describe('Package List and Show', () => {
    it('should list datasets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ['dataset-1', 'dataset-2', 'dataset-3'],
      })

      const result = await client.listDatasets()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/3/action/package_list',
        expect.any(Object)
      )
      expect(result).toEqual(['dataset-1', 'dataset-2', 'dataset-3'])
    })

    it('should get dataset via CKAN API', async () => {
      const mockDataset = { identifier: 'test', title: 'Test' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: mockDataset }),
      })

      const result = await client.getDatasetCkan('test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/3/action/package_show?id=test',
        expect.any(Object)
      )
      expect(result).toEqual(mockDataset)
    })
  })

  describe('Package Search', () => {
    it('should search packages with basic query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            count: 10,
            sort: 'relevance asc',
            results: [
              { identifier: 'pkg-1', title: 'Package 1' },
              { identifier: 'pkg-2', title: 'Package 2' },
            ],
          },
        }),
      })

      const result = await client.ckanPackageSearch({ q: 'water' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/3/action/package_search?q=water',
        expect.any(Object)
      )
      expect(result.count).toBe(10)
      expect(result.results).toHaveLength(2)
    })

    it('should search with pagination and facets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            count: 100,
            sort: 'relevance asc',
            results: [],
            search_facets: { theme: {}, keyword: {} },
          },
        }),
      })

      const result = await client.ckanPackageSearch({
        q: 'health',
        rows: 20,
        start: 40,
        facet: true,
        'facet.field': ['theme', 'keyword'],
        'facet.limit': 10,
      })

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('q=health')
      expect(callUrl).toContain('rows=20')
      expect(callUrl).toContain('start=40')
      expect(callUrl).toContain('facet=true')
      expect(result.search_facets).toBeDefined()
    })
  })

  describe('Datastore Search', () => {
    it('should search datastore with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            resource_id: 'resource-123',
            fields: [
              { id: 'id', type: 'int' },
              { id: 'name', type: 'text' },
            ],
            records: [
              { id: 1, name: 'Record 1' },
              { id: 2, name: 'Record 2' },
            ],
            total: 2,
          },
        }),
      })

      const result = await client.ckanDatastoreSearch({
        resource_id: 'resource-123',
        filters: { state: 'CA' },
        limit: 10,
      })

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('resource_id=resource-123')
      expect(callUrl).toContain('limit=10')
      expect(result.records).toHaveLength(2)
      expect(result.fields).toHaveLength(2)
    })

    it('should search with full-text query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            resource_id: 'resource-123',
            fields: [],
            records: [],
            total: 0,
          },
        }),
      })

      await client.ckanDatastoreSearch({
        resource_id: 'resource-123',
        q: 'search term',
        distinct: true,
      })

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('q=search+term')
      expect(callUrl).toContain('distinct=true')
    })
  })

  describe('Datastore Search SQL', () => {
    it('should execute SQL query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            records: [
              { id: 1, count: 100 },
              { id: 2, count: 200 },
            ],
          },
        }),
      })

      const result = await client.ckanDatastoreSearchSql({
        sql: 'SELECT id, COUNT(*) as count FROM resource_123 GROUP BY id',
      })

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('datastore_search_sql')
      expect(callUrl).toContain('sql=')
      expect(result).toHaveLength(2)
      expect(result[0].count).toBe(100)
    })
  })

  describe('Resource Show', () => {
    it('should show resource metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            id: 'resource-123',
            name: 'Data File',
            format: 'CSV',
            size: 1024000,
            url: 'https://example.com/file.csv',
          },
        }),
      })

      const resource = await client.ckanResourceShow('resource-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/3/action/resource_show?id=resource-123',
        expect.any(Object)
      )
      expect(resource.id).toBe('resource-123')
      expect(resource.format).toBe('CSV')
      expect(resource.size).toBe(1024000)
    })
  })

  describe('Current Package List With Resources', () => {
    it('should list all packages with resources', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: [
            {
              identifier: 'pkg-1',
              title: 'Package 1',
              resources: [
                { id: 'res-1', name: 'Resource 1', format: 'CSV' },
                { id: 'res-2', name: 'Resource 2', format: 'JSON' },
              ],
            },
            {
              identifier: 'pkg-2',
              title: 'Package 2',
              resources: [
                { id: 'res-3', name: 'Resource 3', format: 'XML' },
              ],
            },
          ],
        }),
      })

      const packages = await client.ckanCurrentPackageListWithResources()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/3/action/current_package_list_with_resources',
        expect.any(Object)
      )
      expect(packages).toHaveLength(2)
      expect(packages[0].resources).toHaveLength(2)
      expect(packages[1].resources).toHaveLength(1)
    })
  })
})
