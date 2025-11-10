/**
 * Tests for useDatastore hook
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import { useDatastore } from '../useDatastore'

describe('useDatastore', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }),
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 }, // Disable retries for tests
    })
  })

  it('should query datastore successfully', async () => {
    const mockResponse = {
      results: [
        { id: 1, name: 'Row 1' },
        { id: 2, name: 'Row 2' },
      ],
      count: 2,
    }

    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue(mockResponse)

    function TestComponent() {
      const { data, isLoading } = useDatastore({ datasetId: 'dataset-123' })

      if (isLoading) return <div>Loading...</div>
      if (!data) return null

      return <div>Rows: {data.count}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Rows: 2')).toBeInTheDocument()
    })

    expect(mockClient.queryDatastore).toHaveBeenCalledWith('dataset-123', undefined, undefined)
  })

  it('should query with specific index', async () => {
    const mockResponse = { results: [], count: 0 }

    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue(mockResponse)

    function TestComponent() {
      const { data } = useDatastore({
        datasetId: 'dataset-123',
        index: 2,
      })

      return <div>Count: {data?.count || 0}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Count: 0')).toBeInTheDocument()
    })

    expect(mockClient.queryDatastore).toHaveBeenCalledWith('dataset-123', 2, undefined)
  })

  it('should query with query options', async () => {
    const mockResponse = { results: [], count: 0 }

    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue(mockResponse)

    const queryOptions = {
      conditions: [{ property: 'status', value: 'active' }],
      limit: 10,
      offset: 0,
    }

    function TestComponent() {
      const { data } = useDatastore({
        datasetId: 'dataset-123',
        queryOptions,
      })

      return <div>Count: {data?.count || 0}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(mockClient.queryDatastore).toHaveBeenCalledWith(
        'dataset-123',
        undefined,
        queryOptions
      )
    })
  })

  it('should handle query error', async () => {
    vi.spyOn(mockClient, 'queryDatastore').mockRejectedValue(new Error('Query failed'))

    function TestComponent() {
      const { error, isLoading } = useDatastore({ datasetId: 'dataset-123' })

      if (isLoading) return <div>Loading...</div>
      if (error) return <div>Error: {error.message}</div>

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

  it('should respect enabled option', async () => {
    const querySpy = vi.spyOn(mockClient, 'queryDatastore')

    function TestComponent() {
      const { isLoading } = useDatastore({
        datasetId: 'dataset-123',
        enabled: false,
      })

      return <div>Loading: {isLoading ? 'yes' : 'no'}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Loading: no')).toBeInTheDocument()
    })

    expect(querySpy).not.toHaveBeenCalled()
  })

  it('should refetch when dataset ID changes', async () => {
    const user = userEvent.setup()
    const querySpy = vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 0,
    })

    function TestComponent() {
      const [datasetId, setDatasetId] = React.useState('dataset-1')
      const { data } = useDatastore({ datasetId })

      return (
        <div>
          <button onClick={() => setDatasetId('dataset-2')}>Change Dataset</button>
          <div>Count: {data?.count || 0}</div>
        </div>
      )
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(querySpy).toHaveBeenCalledWith('dataset-1', undefined, undefined)
    })

    const button = screen.getByText('Change Dataset')
    await user.click(button)

    await waitFor(() => {
      expect(querySpy).toHaveBeenCalledWith('dataset-2', undefined, undefined)
    })

    expect(querySpy).toHaveBeenCalledTimes(2)
  })

  it('should cache query results', async () => {
    const querySpy = vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 5,
    })

    function TestComponent() {
      const query1 = useDatastore({ datasetId: 'dataset-123' })
      const query2 = useDatastore({ datasetId: 'dataset-123' })

      return (
        <div>
          <div>Count1: {query1.data?.count || 0}</div>
          <div>Count2: {query2.data?.count || 0}</div>
        </div>
      )
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Count1: 5')).toBeInTheDocument()
      expect(screen.getByText('Count2: 5')).toBeInTheDocument()
    })

    // Should only query once due to caching
    expect(querySpy).toHaveBeenCalledTimes(1)
  })

  it('should provide all query states', async () => {
    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 0,
    })

    function TestComponent() {
      const { isSuccess, isError, isFetching, status } = useDatastore({
        datasetId: 'dataset-123',
      })

      return (
        <div>
          <div>Success: {isSuccess.toString()}</div>
          <div>Error: {isError.toString()}</div>
          <div>Fetching: {isFetching.toString()}</div>
          <div>Status: {status}</div>
        </div>
      )
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Success: true/)).toBeInTheDocument()
      expect(screen.getByText(/Status: success/)).toBeInTheDocument()
    })
  })

  it('should handle complex query with sorts and conditions', async () => {
    const querySpy = vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 0,
    })

    const queryOptions = {
      conditions: [
        { property: 'age', value: 18, operator: '>' as const },
        { property: 'status', value: 'active' },
      ],
      sorts: [{ property: 'name', order: 'asc' as const }],
      limit: 50,
      offset: 10,
    }

    function TestComponent() {
      useDatastore({
        datasetId: 'dataset-123',
        index: 0,
        queryOptions,
      })

      return <div>Test</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(querySpy).toHaveBeenCalledWith('dataset-123', 0, queryOptions)
    })
  })

  it('should handle empty results', async () => {
    vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue({
      results: [],
      count: 0,
    })

    function TestComponent() {
      const { data } = useDatastore({ datasetId: 'dataset-123' })

      if (!data) return <div>Loading</div>

      return (
        <div>
          {data.results.length === 0 ? (
            <div>No data found</div>
          ) : (
            <div>Found data</div>
          )}
        </div>
      )
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })
})
