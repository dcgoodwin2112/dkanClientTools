/**
 * Tests for table hooks
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useTableFromQuery,
  useDatasetSearchTable,
  useDatastoreTable,
} from '../useTables'
import { createDatasetColumns, createDatastoreColumns } from '../tableColumns'
import { useDatasetSearch } from '../useDatasetSearch'
import { useDatastore } from '../useDatastore'

describe('Table Hooks', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }),
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useTableFromQuery', () => {
    it('should create table instance with query data', async () => {
      const mockDatasets = [
        {
          identifier: 'test-1',
          title: 'Dataset 1',
          description: 'Description 1',
          accessLevel: 'public' as const,
          modified: '2024-01-01',
          keyword: ['test'],
          publisher: { name: 'Publisher 1' },
          contactPoint: {
            '@type': 'vcard:Contact',
            fn: 'Contact',
            hasEmail: 'test@example.com',
          },
        },
        {
          identifier: 'test-2',
          title: 'Dataset 2',
          description: 'Description 2',
          accessLevel: 'public' as const,
          modified: '2024-01-02',
          keyword: ['test'],
          publisher: { name: 'Publisher 2' },
          contactPoint: {
            '@type': 'vcard:Contact',
            fn: 'Contact',
            hasEmail: 'test@example.com',
          },
        },
      ]

      vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
        total: 2,
        results: mockDatasets,
      })

      function TestComponent() {
        const query = useDatasetSearch({ keyword: 'test' })
        const table = useTableFromQuery({
          query,
          data: query.data?.results ?? [],
          columns: createDatasetColumns(),
        })

        if (query.isLoading) return <div>Loading...</div>
        if (query.error) return <div>Error: {query.error.message}</div>

        return (
          <div>
            <div>Row count: {table.getRowModel().rows.length}</div>
            <div>Column count: {table.getAllColumns().length}</div>
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
        expect(screen.getByText('Row count: 2')).toBeInTheDocument()
      })

      expect(screen.getByText(/Column count:/)).toBeInTheDocument()
    })

    it('should handle empty data', async () => {
      vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
        total: 0,
        results: [],
      })

      function TestComponent() {
        const query = useDatasetSearch({ keyword: 'nonexistent' })
        const table = useTableFromQuery({
          query,
          data: query.data?.results ?? [],
          columns: createDatasetColumns(),
        })

        if (query.isLoading) return <div>Loading...</div>

        return <div>Row count: {table.getRowModel().rows.length}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Row count: 0')).toBeInTheDocument()
      })
    })
  })

  describe('useDatasetSearchTable', () => {
    it('should integrate dataset search with table', async () => {
      const mockDatasets = [
        {
          identifier: 'test-1',
          title: 'Health Dataset',
          description: 'Health data',
          accessLevel: 'public' as const,
          modified: '2024-01-01',
          keyword: ['health'],
          publisher: { name: 'CDC' },
          contactPoint: {
            '@type': 'vcard:Contact',
            fn: 'Contact',
            hasEmail: 'test@example.com',
          },
        },
      ]

      vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
        total: 1,
        results: mockDatasets,
      })

      function TestComponent() {
        const { table, query } = useDatasetSearchTable({
          searchOptions: { searchOptions: { keyword: 'health' } },
          columns: createDatasetColumns(),
        })

        if (query.isLoading) return <div>Loading...</div>
        if (query.error) return <div>Error: {query.error.message}</div>

        const rows = table.getRowModel().rows

        return (
          <div>
            <div>Total datasets: {rows.length}</div>
            {rows.map((row) => (
              <div key={row.id}>Dataset: {row.original.title}</div>
            ))}
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
        expect(screen.getByText('Total datasets: 1')).toBeInTheDocument()
        expect(screen.getByText('Dataset: Health Dataset')).toBeInTheDocument()
      })

      expect(mockClient.searchDatasets).toHaveBeenCalledWith({
        keyword: 'health',
      })
    })

    it('should handle search errors', async () => {
      vi.spyOn(mockClient, 'searchDatasets').mockRejectedValue(
        new Error('Search failed')
      )

      function TestComponent() {
        const { table, query } = useDatasetSearchTable({
          searchOptions: { searchOptions: { keyword: 'test' } },
          columns: createDatasetColumns(),
        })

        if (query.isLoading) return <div>Loading...</div>
        if (query.error) return <div>Error: {query.error.message}</div>

        return <div>Success</div>
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

    it('should support custom column configuration', async () => {
      vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
        total: 1,
        results: [
          {
            identifier: 'test-1',
            title: 'Test',
            description: 'Test',
            accessLevel: 'public' as const,
            modified: '2024-01-01',
            keyword: ['test'],
            publisher: { name: 'Test' },
            contactPoint: {
              '@type': 'vcard:Contact',
              fn: 'Contact',
              hasEmail: 'test@example.com',
            },
          },
        ],
      })

      function TestComponent() {
        const { table } = useDatasetSearchTable({
          searchOptions: { searchOptions: { keyword: 'test' } },
          columns: createDatasetColumns({
            showIdentifier: false,
            showDescription: true,
            showKeywords: true,
          }),
        })

        return <div>Columns: {table.getAllColumns().length}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/Columns:/)).toBeInTheDocument()
      })
    })
  })

  describe('useDatastoreTable', () => {
    it('should integrate datastore query with table', async () => {
      const mockDatastoreResponse = {
        results: [
          { name: 'John', age: 30, city: 'NYC' },
          { name: 'Jane', age: 25, city: 'SF' },
        ],
        count: 2,
        schema: {
          fields: [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'integer' },
            { name: 'city', type: 'string' },
          ],
        },
      }

      vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue(mockDatastoreResponse)

      function TestComponent() {
        const { table, query } = useDatastoreTable({
          datastoreOptions: {
            datasetId: 'test-dataset',
            index: 0,
          },
          columns: createDatastoreColumns({
            fields: mockDatastoreResponse.schema.fields,
          }),
        })

        if (query.isLoading) return <div>Loading...</div>
        if (query.error) return <div>Error: {query.error.message}</div>

        const rows = table.getRowModel().rows

        return (
          <div>
            <div>Total rows: {rows.length}</div>
            {rows.map((row, idx) => (
              <div key={idx}>Name: {row.original.name}</div>
            ))}
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
        expect(screen.getByText('Total rows: 2')).toBeInTheDocument()
        expect(screen.getByText('Name: John')).toBeInTheDocument()
        expect(screen.getByText('Name: Jane')).toBeInTheDocument()
      })

      expect(mockClient.queryDatastore).toHaveBeenCalledWith('test-dataset', 0, undefined)
    })

    it('should handle datastore query errors', async () => {
      vi.spyOn(mockClient, 'queryDatastore').mockRejectedValue(
        new Error('Query failed')
      )

      function TestComponent() {
        const { table, query } = useDatastoreTable({
          datastoreOptions: {
            datasetId: 'test-dataset',
            index: 0,
          },
          columns: createDatastoreColumns(),
        })

        if (query.isLoading) return <div>Loading...</div>
        if (query.error) return <div>Error: {query.error.message}</div>

        return <div>Success</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Query failed')).toBeInTheDocument()
      })
    })

    it('should handle empty datastore results', async () => {
      vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
        results: [],
        count: 0,
        schema: {
          fields: [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'integer' },
          ],
        },
      })

      function TestComponent() {
        const { table, query } = useDatastoreTable({
          datastoreOptions: {
            datasetId: 'test-dataset',
            index: 0,
          },
          columns: createDatastoreColumns(),
        })

        if (query.isLoading) return <div>Loading...</div>

        return <div>Rows: {table.getRowModel().rows.length}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Rows: 0')).toBeInTheDocument()
      })
    })
  })
})
