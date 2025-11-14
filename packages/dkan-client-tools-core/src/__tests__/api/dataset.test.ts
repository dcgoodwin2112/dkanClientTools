/**
 * Tests for Dataset Operations
 *
 * Covers all dataset-related functionality:
 * - getDataset() - Fetch single dataset
 * - searchDatasets() - Search datasets with filters
 * - listAllDatasets() - Get all datasets
 * - createDataset() - Create new dataset
 * - updateDataset() - Full replacement update
 * - patchDataset() - Partial update
 * - deleteDataset() - Delete dataset
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'
import { DkanApiError } from '../../types'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Dataset Operations', () => {
  let client: DkanApiClient

  const mockDataset = {
    identifier: 'test-123',
    title: 'Test Dataset',
    description: 'Test description',
    accessLevel: 'public' as const,
    modified: '2024-01-01',
    keyword: ['test'],
    publisher: { name: 'Test Publisher' },
    contactPoint: {
      '@type': 'vcard:Contact',
      fn: 'Test Contact',
      hasEmail: 'test@example.com',
    },
  }

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  describe('getDataset', () => {
    it('should fetch dataset by identifier', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockDataset,
      })

      const result = await client.getDataset('test-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items/test-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockDataset)
    })

    it('should fetch dataset with show-reference-ids parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: 'dataset-1',
          title: 'Test Dataset',
          distribution: [
            {
              identifier: 'dist-uuid-123',
              title: 'Distribution 1',
              format: 'csv',
            },
          ],
        }),
      })

      const dataset = await client.getDataset('dataset-1', { showReferenceIds: true })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items/dataset-1?show-reference-ids',
        expect.any(Object)
      )
      expect(dataset.distribution[0].identifier).toBe('dist-uuid-123')
    })

    it('should fetch dataset without show-reference-ids when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          identifier: 'dataset-1',
          title: 'Test Dataset',
        }),
      })

      await client.getDataset('dataset-1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items/dataset-1',
        expect.any(Object)
      )
    })

    it('should throw DkanApiError on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Dataset not found',
      })

      const errorClient = new DkanApiClient({
        baseUrl: 'https://example.com',
        defaultOptions: { retry: 0 },
      })

      await expect(errorClient.getDataset('nonexistent')).rejects.toThrow(DkanApiError)
      await expect(errorClient.getDataset('nonexistent')).rejects.toThrow('HTTP 404: Not Found')
    })
  })

  describe('searchDatasets', () => {
    it('should search datasets with no filters', async () => {
      const mockResponse = {
        total: '10',
        results: {
          'id-1': { identifier: 'id-1', title: 'Dataset 1' },
          'id-2': { identifier: 'id-2', title: 'Dataset 2' },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
      })

      const result = await client.searchDatasets()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/search',
        expect.any(Object)
      )
      expect(result.total).toBe(10)
      expect(result.results).toHaveLength(2)
      expect(result.results[0]).toEqual({ identifier: 'id-1', title: 'Dataset 1' })
    })

    it('should search datasets with keyword filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ total: 5, results: {} }),
      })

      await client.searchDatasets({ keyword: 'health' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/search?keyword=health',
        expect.any(Object)
      )
    })

    it('should search datasets with multiple filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ total: 3, results: {} }),
      })

      await client.searchDatasets({
        keyword: 'health',
        theme: 'Health',
        page: 1,
        'page-size': 20,
        sort: 'modified',
        'sort-order': 'desc',
      })

      const url = (mockFetch.mock.calls[0][0] as string)
      expect(url).toContain('keyword=health')
      expect(url).toContain('theme=Health')
      expect(url).toContain('page=1')
      expect(url).toContain('page-size=20')
      expect(url).toContain('sort=modified')
      expect(url).toContain('sort-order=desc')
    })

    it('should handle single sort parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, results: [] }),
      })

      await client.searchDatasets({ sort: 'title', 'sort-order': 'asc' })

      const url = (mockFetch.mock.calls[0][0] as string)
      expect(url).toContain('sort=title')
      expect(url).toContain('sort-order=asc')
    })

    it('should handle array sort parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, results: [] }),
      })

      await client.searchDatasets({
        sort: ['modified', 'title'],
        'sort-order': ['desc', 'asc'],
      })

      const url = (mockFetch.mock.calls[0][0] as string)
      expect(url).toContain('sort=modified')
      expect(url).toContain('sort=title')
      expect(url).toContain('sort-order=desc')
      expect(url).toContain('sort-order=asc')
    })

    it('should handle mixed array and single sort parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, results: [] }),
      })

      await client.searchDatasets({
        sort: ['modified', 'title'],
        'sort-order': 'desc',
      })

      const url = (mockFetch.mock.calls[0][0] as string)
      expect(url).toContain('sort=modified')
      expect(url).toContain('sort=title')
      expect(url).toContain('sort-order=desc')
    })
  })

  describe('listAllDatasets', () => {
    it('should fetch all datasets', async () => {
      const mockResponse = {
        'id-1': { identifier: 'id-1', title: 'Dataset 1' },
        'id-2': { identifier: 'id-2', title: 'Dataset 2' },
        'id-3': { identifier: 'id-3', title: 'Dataset 3' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockResponse,
      })

      const result = await client.listAllDatasets()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/1/metastore/schemas/dataset/items',
        expect.any(Object)
      )
      expect(result).toHaveLength(3)
      expect(result[0].identifier).toBe('id-1')
      expect(result[1].identifier).toBe('id-2')
      expect(result[2].identifier).toBe('id-3')
    })

    it('should return empty array when no datasets exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({}),
      })

      const result = await client.listAllDatasets()

      expect(result).toEqual([])
    })
  })

  describe('createDataset', () => {
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
  })

  describe('updateDataset', () => {
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
  })

  describe('patchDataset', () => {
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
  })

  describe('deleteDataset', () => {
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
})
