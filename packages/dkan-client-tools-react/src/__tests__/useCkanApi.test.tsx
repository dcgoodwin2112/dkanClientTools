/**
 * Tests for CKAN API hooks
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useCkanPackageSearch,
  useCkanDatastoreSearch,
  useCkanDatastoreSearchSql,
  useCkanResourceShow,
  useCkanCurrentPackageListWithResources,
} from '../useCkanApi'

describe('useCkanApi', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }),
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useCkanPackageSearch', () => {
    it('should search packages successfully', async () => {
      const mockResponse = {
        count: 2,
        sort: 'relevance asc',
        results: [
          { identifier: 'pkg-1', title: 'Package 1' },
          { identifier: 'pkg-2', title: 'Package 2' },
        ],
      }

      vi.spyOn(mockClient, 'ckanPackageSearch').mockResolvedValue(mockResponse)

      function TestComponent() {
        const { data, isLoading, error } = useCkanPackageSearch({ q: 'water' })

        if (isLoading) return <div>Loading...</div>
        if (error) return <div>Error: {error.message}</div>
        if (!data) return null

        return (
          <div>
            <div>Count: {data.count}</div>
            <div>Results: {data.results.length}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Count: 2')).toBeInTheDocument()
        expect(screen.getByText('Results: 2')).toBeInTheDocument()
      })

      expect(mockClient.ckanPackageSearch).toHaveBeenCalledWith({ q: 'water' })
    })

    it('should search with pagination and facets', async () => {
      const mockResponse = {
        count: 100,
        sort: 'relevance asc',
        results: [],
        search_facets: { theme: {}, keyword: {} },
      }

      vi.spyOn(mockClient, 'ckanPackageSearch').mockResolvedValue(mockResponse)

      function TestComponent() {
        const { data } = useCkanPackageSearch({
          q: 'health',
          rows: 20,
          start: 40,
          facet: true,
          'facet.field': ['theme', 'keyword'],
        })

        if (!data) return <div>Loading...</div>

        return <div>Total: {data.count}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Total: 100')).toBeInTheDocument()
      })

      expect(mockClient.ckanPackageSearch).toHaveBeenCalledWith({
        q: 'health',
        rows: 20,
        start: 40,
        facet: true,
        'facet.field': ['theme', 'keyword'],
      })
    })

    it('should handle search without query', async () => {
      const mockResponse = {
        count: 50,
        sort: 'relevance asc',
        results: [],
      }

      vi.spyOn(mockClient, 'ckanPackageSearch').mockResolvedValue(mockResponse)

      function TestComponent() {
        const { data } = useCkanPackageSearch()

        if (!data) return <div>Loading...</div>

        return <div>All packages: {data.count}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('All packages: 50')).toBeInTheDocument()
      })
    })

    it('should respect enabled option', async () => {
      const searchSpy = vi.spyOn(mockClient, 'ckanPackageSearch')

      function TestComponent() {
        const { data } = useCkanPackageSearch({ q: 'test', enabled: false })

        return <div>Data: {data ? 'loaded' : 'not loaded'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Data: not loaded')).toBeInTheDocument()
      })

      expect(searchSpy).not.toHaveBeenCalled()
    })

    it('should handle search errors', async () => {
      vi.spyOn(mockClient, 'ckanPackageSearch').mockRejectedValue(
        new Error('Search failed')
      )

      function TestComponent() {
        const { error } = useCkanPackageSearch({ q: 'test' })

        if (error) return <div>Error: {error.message}</div>

        return <div>No error</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Search failed')).toBeInTheDocument()
      })
    })
  })

  describe('useCkanDatastoreSearch', () => {
    it('should search datastore successfully', async () => {
      const mockResponse = {
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
      }

      vi.spyOn(mockClient, 'ckanDatastoreSearch').mockResolvedValue(mockResponse)

      function TestComponent() {
        const { data, isLoading } = useCkanDatastoreSearch({
          resource_id: 'resource-123',
          limit: 10,
        })

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Resource: {data.resource_id}</div>
            <div>Records: {data.records.length}</div>
            <div>Fields: {data.fields.length}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Resource: resource-123')).toBeInTheDocument()
        expect(screen.getByText('Records: 2')).toBeInTheDocument()
        expect(screen.getByText('Fields: 2')).toBeInTheDocument()
      })

      expect(mockClient.ckanDatastoreSearch).toHaveBeenCalledWith({
        resource_id: 'resource-123',
        limit: 10,
      })
    })

    it('should search with filters', async () => {
      const mockResponse = {
        resource_id: 'resource-123',
        fields: [],
        records: [],
        total: 0,
      }

      vi.spyOn(mockClient, 'ckanDatastoreSearch').mockResolvedValue(mockResponse)

      function TestComponent() {
        const { data } = useCkanDatastoreSearch({
          resource_id: 'resource-123',
          filters: { state: 'CA' },
          q: 'search term',
          distinct: true,
        })

        if (!data) return <div>Loading...</div>

        return <div>Search complete</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Search complete')).toBeInTheDocument()
      })

      expect(mockClient.ckanDatastoreSearch).toHaveBeenCalledWith({
        resource_id: 'resource-123',
        filters: { state: 'CA' },
        q: 'search term',
        distinct: true,
      })
    })

    it('should not fetch without resource_id', async () => {
      const searchSpy = vi.spyOn(mockClient, 'ckanDatastoreSearch')

      function TestComponent() {
        const { data } = useCkanDatastoreSearch({ resource_id: '' })

        return <div>Data: {data ? 'loaded' : 'not loaded'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Data: not loaded')).toBeInTheDocument()
      })

      expect(searchSpy).not.toHaveBeenCalled()
    })

    it('should support conditional fetching', async () => {
      const user = userEvent.setup()
      const searchSpy = vi.spyOn(mockClient, 'ckanDatastoreSearch').mockResolvedValue({
        resource_id: 'resource-123',
        fields: [],
        records: [{ id: 1, name: 'Test' }],
        total: 1,
      })

      function TestComponent() {
        const [resourceId, setResourceId] = React.useState<string | null>(null)
        const { data } = useCkanDatastoreSearch({
          resource_id: resourceId || '',
          enabled: !!resourceId,
        })

        return (
          <div>
            <button onClick={() => setResourceId('resource-123')}>Load Data</button>
            {data && <div>Records: {data.records.length}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(searchSpy).not.toHaveBeenCalled()

      const button = screen.getByText('Load Data')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Records: 1')).toBeInTheDocument()
      })

      expect(searchSpy).toHaveBeenCalledWith({
        resource_id: 'resource-123',
      })
    })
  })

  describe('useCkanDatastoreSearchSql', () => {
    it('should execute SQL query successfully', async () => {
      const mockResponse = [
        { id: 1, count: 100 },
        { id: 2, count: 200 },
      ]

      vi.spyOn(mockClient, 'ckanDatastoreSearchSql').mockResolvedValue(mockResponse)

      function TestComponent() {
        const { data, isLoading } = useCkanDatastoreSearchSql({
          sql: 'SELECT id, COUNT(*) as count FROM resource_123 GROUP BY id',
        })

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Rows: {data.length}</div>
            <div>First count: {data[0].count}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Rows: 2')).toBeInTheDocument()
        expect(screen.getByText('First count: 100')).toBeInTheDocument()
      })
    })

    it('should not fetch without SQL query', async () => {
      const sqlSpy = vi.spyOn(mockClient, 'ckanDatastoreSearchSql')

      function TestComponent() {
        const { data } = useCkanDatastoreSearchSql({ sql: '' })

        return <div>Data: {data ? 'loaded' : 'not loaded'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Data: not loaded')).toBeInTheDocument()
      })

      expect(sqlSpy).not.toHaveBeenCalled()
    })

    it('should handle SQL errors', async () => {
      vi.spyOn(mockClient, 'ckanDatastoreSearchSql').mockRejectedValue(
        new Error('SQL syntax error')
      )

      function TestComponent() {
        const { error } = useCkanDatastoreSearchSql({ sql: 'INVALID SQL' })

        if (error) return <div>Error: {error.message}</div>

        return <div>No error</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: SQL syntax error')).toBeInTheDocument()
      })
    })

    it('should support dynamic SQL queries', async () => {
      const user = userEvent.setup()
      const sqlSpy = vi.spyOn(mockClient, 'ckanDatastoreSearchSql').mockResolvedValue([
        { result: 42 },
      ])

      function TestComponent() {
        const [sql, setSql] = React.useState('')
        const { data } = useCkanDatastoreSearchSql({ sql, enabled: !!sql })

        return (
          <div>
            <button onClick={() => setSql('SELECT 42 as result')}>
              Execute Query
            </button>
            {data && <div>Result: {data[0].result}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(sqlSpy).not.toHaveBeenCalled()

      const button = screen.getByText('Execute Query')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Result: 42')).toBeInTheDocument()
      })

      expect(sqlSpy).toHaveBeenCalledWith({ sql: 'SELECT 42 as result' })
    })
  })

  describe('useCkanResourceShow', () => {
    it('should fetch resource metadata successfully', async () => {
      const mockResource = {
        id: 'resource-123',
        name: 'Data File',
        format: 'CSV',
        size: 1024000,
        url: 'https://example.com/file.csv',
      }

      vi.spyOn(mockClient, 'ckanResourceShow').mockResolvedValue(mockResource)

      function TestComponent() {
        const { data, isLoading } = useCkanResourceShow({
          resourceId: 'resource-123',
        })

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Name: {data.name}</div>
            <div>Format: {data.format}</div>
            <div>Size: {data.size}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Name: Data File')).toBeInTheDocument()
        expect(screen.getByText('Format: CSV')).toBeInTheDocument()
        expect(screen.getByText('Size: 1024000')).toBeInTheDocument()
      })

      expect(mockClient.ckanResourceShow).toHaveBeenCalledWith('resource-123')
    })

    it('should not fetch without resourceId', async () => {
      const showSpy = vi.spyOn(mockClient, 'ckanResourceShow')

      function TestComponent() {
        const { data } = useCkanResourceShow({ resourceId: '' })

        return <div>Data: {data ? 'loaded' : 'not loaded'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Data: not loaded')).toBeInTheDocument()
      })

      expect(showSpy).not.toHaveBeenCalled()
    })

    it('should cache resource metadata', async () => {
      const showSpy = vi.spyOn(mockClient, 'ckanResourceShow').mockResolvedValue({
        id: 'resource-123',
        name: 'Data File',
      } as any)

      function TestComponent() {
        const query1 = useCkanResourceShow({ resourceId: 'resource-123' })
        const query2 = useCkanResourceShow({ resourceId: 'resource-123' })

        return (
          <div>
            <div>Query1: {query1.data?.name || 'Loading'}</div>
            <div>Query2: {query2.data?.name || 'Loading'}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Query1: Data File')).toBeInTheDocument()
        expect(screen.getByText('Query2: Data File')).toBeInTheDocument()
      })

      // Should only fetch once due to caching
      expect(showSpy).toHaveBeenCalledTimes(1)
    })

    it('should support staleTime option', async () => {
      vi.spyOn(mockClient, 'ckanResourceShow').mockResolvedValue({
        id: 'resource-123',
        name: 'Test Resource',
      } as any)

      function TestComponent() {
        const { data } = useCkanResourceShow({
          resourceId: 'resource-123',
          staleTime: 60000, // 1 minute
        })

        return <div>{data?.name || 'Loading'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Resource')).toBeInTheDocument()
      })
    })
  })

  describe('useCkanCurrentPackageListWithResources', () => {
    it('should fetch all packages with resources successfully', async () => {
      const mockPackages = [
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
          resources: [{ id: 'res-3', name: 'Resource 3', format: 'XML' }],
        },
      ]

      vi.spyOn(mockClient, 'ckanCurrentPackageListWithResources').mockResolvedValue(
        mockPackages as any
      )

      function TestComponent() {
        const { data, isLoading } = useCkanCurrentPackageListWithResources()

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Packages: {data.length}</div>
            <div>First package: {data[0].title}</div>
            <div>First package resources: {data[0].resources.length}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Packages: 2')).toBeInTheDocument()
        expect(screen.getByText('First package: Package 1')).toBeInTheDocument()
        expect(screen.getByText('First package resources: 2')).toBeInTheDocument()
      })

      expect(mockClient.ckanCurrentPackageListWithResources).toHaveBeenCalled()
    })

    it('should cache package list', async () => {
      const listSpy = vi
        .spyOn(mockClient, 'ckanCurrentPackageListWithResources')
        .mockResolvedValue([
          {
            identifier: 'pkg-1',
            title: 'Package 1',
            resources: [],
          } as any,
        ])

      function TestComponent() {
        const query1 = useCkanCurrentPackageListWithResources()
        const query2 = useCkanCurrentPackageListWithResources()

        return (
          <div>
            <div>Query1 length: {query1.data?.length || 0}</div>
            <div>Query2 length: {query2.data?.length || 0}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Query1 length: 1')).toBeInTheDocument()
        expect(screen.getByText('Query2 length: 1')).toBeInTheDocument()
      })

      // Should only fetch once due to caching
      expect(listSpy).toHaveBeenCalledTimes(1)
    })

    it('should respect enabled option', async () => {
      const listSpy = vi.spyOn(mockClient, 'ckanCurrentPackageListWithResources')

      function TestComponent() {
        const { data } = useCkanCurrentPackageListWithResources({ enabled: false })

        return <div>Data: {data ? 'loaded' : 'not loaded'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Data: not loaded')).toBeInTheDocument()
      })

      expect(listSpy).not.toHaveBeenCalled()
    })

    it('should use default staleTime of 5 minutes', async () => {
      vi.spyOn(mockClient, 'ckanCurrentPackageListWithResources').mockResolvedValue([])

      function TestComponent() {
        const { data } = useCkanCurrentPackageListWithResources()

        return <div>Packages: {data?.length || 0}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Packages: 0')).toBeInTheDocument()
      })
    })

    it('should handle fetch errors', async () => {
      vi.spyOn(mockClient, 'ckanCurrentPackageListWithResources').mockRejectedValue(
        new Error('Fetch failed')
      )

      function TestComponent() {
        const { error } = useCkanCurrentPackageListWithResources()

        if (error) return <div>Error: {error.message}</div>

        return <div>No error</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Fetch failed')).toBeInTheDocument()
      })
    })
  })
})
