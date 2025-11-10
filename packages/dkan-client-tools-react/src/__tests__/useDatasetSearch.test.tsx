/**
 * Tests for useDatasetSearch hook
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import { useDatasetSearch } from '../useDatasetSearch'

describe('useDatasetSearch', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 }, // Disable retries for tests
    })
  })

  it('should search datasets with default options', async () => {
    const mockResponse = {
      total: 10,
      results: [
        { identifier: '1', title: 'Dataset 1' },
        { identifier: '2', title: 'Dataset 2' },
      ],
    }

    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue(mockResponse as any)

    function TestComponent() {
      const { data, isLoading } = useDatasetSearch()

      if (isLoading) return <div>Loading...</div>
      if (!data) return null

      return <div>Found {data.total} datasets</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Found 10 datasets')).toBeInTheDocument()
    })

    expect(mockClient.searchDatasets).toHaveBeenCalledWith(undefined)
  })

  it('should search with keyword filter', async () => {
    const mockResponse = {
      total: 5,
      results: [{ identifier: '1', title: 'Health Dataset' }],
    }

    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue(mockResponse as any)

    function TestComponent() {
      const { data } = useDatasetSearch({
        searchOptions: { keyword: 'health' },
      })

      return <div>Results: {data?.results.length || 0}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Results: 1')).toBeInTheDocument()
    })

    expect(mockClient.searchDatasets).toHaveBeenCalledWith({ keyword: 'health' })
  })

  it('should search with multiple filters', async () => {
    const mockResponse = { total: 3, results: [] }

    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue(mockResponse as any)

    function TestComponent() {
      const { data } = useDatasetSearch({
        searchOptions: {
          keyword: 'health',
          theme: 'Health',
          'page-size': 20,
          page: 1,
          sort: 'modified',
          'sort-order': 'desc',
        },
      })

      return <div>Total: {data?.total || 0}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Total: 3')).toBeInTheDocument()
    })

    expect(mockClient.searchDatasets).toHaveBeenCalledWith({
      keyword: 'health',
      theme: 'Health',
      'page-size': 20,
      page: 1,
      sort: 'modified',
      'sort-order': 'desc',
    })
  })

  it('should handle search error', async () => {
    vi.spyOn(mockClient, 'searchDatasets').mockRejectedValue(new Error('Search failed'))

    function TestComponent() {
      const { error, isLoading } = useDatasetSearch()

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
      expect(screen.getByText('Error: Search failed')).toBeInTheDocument()
    })
  })

  it('should respect enabled option', async () => {
    const searchSpy = vi.spyOn(mockClient, 'searchDatasets')

    function TestComponent() {
      const { isLoading } = useDatasetSearch({ enabled: false })
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

    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('should refetch when search options change', async () => {
    const user = userEvent.setup()
    const searchSpy = vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
      total: 0,
      results: [],
    } as any)

    function TestComponent() {
      const [keyword, setKeyword] = React.useState('health')
      const { data } = useDatasetSearch({
        searchOptions: { keyword },
      })

      return (
        <div>
          <button onClick={() => setKeyword('education')}>Change Keyword</button>
          <div>Total: {data?.total || 0}</div>
        </div>
      )
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith({ keyword: 'health' })
    })

    const button = screen.getByText('Change Keyword')
    await user.click(button)

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith({ keyword: 'education' })
    })

    expect(searchSpy).toHaveBeenCalledTimes(2)
  })

  it('should provide all query states', async () => {
    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
      total: 5,
      results: [],
    } as any)

    function TestComponent() {
      const { isSuccess, isError, isFetching, status } = useDatasetSearch()

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

  it('should cache search results', async () => {
    const searchSpy = vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
      total: 5,
      results: [],
    } as any)

    function TestComponent() {
      // Two hooks with same search options
      const search1 = useDatasetSearch({ searchOptions: { keyword: 'test' } })
      const search2 = useDatasetSearch({ searchOptions: { keyword: 'test' } })

      return (
        <div>
          <div>Total1: {search1.data?.total || 0}</div>
          <div>Total2: {search2.data?.total || 0}</div>
        </div>
      )
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Total1: 5')).toBeInTheDocument()
      expect(screen.getByText('Total2: 5')).toBeInTheDocument()
    })

    // Should only search once due to caching
    expect(searchSpy).toHaveBeenCalledTimes(1)
  })

  it('should handle empty results', async () => {
    vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
      total: 0,
      results: [],
    } as any)

    function TestComponent() {
      const { data } = useDatasetSearch()

      if (!data) return <div>Loading</div>

      return (
        <div>
          {data.results.length === 0 ? (
            <div>No results found</div>
          ) : (
            <div>Found results</div>
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
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })
})
