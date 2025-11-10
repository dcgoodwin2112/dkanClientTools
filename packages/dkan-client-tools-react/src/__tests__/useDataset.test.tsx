/**
 * Tests for useDataset hook
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import { useDataset } from '../useDataset'

describe('useDataset', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 }, // Disable retries for tests
    })
  })

  it('should fetch dataset successfully', async () => {
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

    vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue(mockDataset)

    function TestComponent() {
      const { data, isLoading, error } = useDataset({ identifier: 'test-123' })

      if (isLoading) return <div>Loading...</div>
      if (error) return <div>Error: {error.message}</div>
      if (!data) return null

      return <div>Title: {data.title}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Title: Test Dataset')).toBeInTheDocument()
    })

    expect(mockClient.fetchDataset).toHaveBeenCalledWith('test-123')
  })

  it('should handle fetch error', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockRejectedValue(new Error('Network error'))

    function TestComponent() {
      const { data, isLoading, error } = useDataset({ identifier: 'test-123' })

      if (isLoading) return <div>Loading...</div>
      if (error) return <div>Error: {error.message}</div>
      if (!data) return null

      return <div>Title: {data.title}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })
  })

  it('should respect enabled option', async () => {
    const fetchSpy = vi.spyOn(mockClient, 'fetchDataset')

    function TestComponent() {
      const { data, isLoading } = useDataset({
        identifier: 'test-123',
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

    // Should not have called fetchDataset since enabled is false
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('should support conditional fetching', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue({
      identifier: 'test-123',
      title: 'Test',
    } as any)

    function TestComponent() {
      const [id, setId] = React.useState<string | null>(null)
      const { data } = useDataset({
        identifier: id || '',
        enabled: !!id,
      })

      return (
        <div>
          <button onClick={() => setId('test-123')}>Load Dataset</button>
          {data && <div>Title: {data.title}</div>}
        </div>
      )
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    expect(fetchSpy).not.toHaveBeenCalled()

    const button = screen.getByText('Load Dataset')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Title: Test')).toBeInTheDocument()
    })

    expect(fetchSpy).toHaveBeenCalledWith('test-123')
  })

  it('should cache results', async () => {
    const fetchSpy = vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue({
      identifier: 'test-123',
      title: 'Test Dataset',
    } as any)

    function TestComponent() {
      const query1 = useDataset({ identifier: 'test-123' })
      const query2 = useDataset({ identifier: 'test-123' })

      return (
        <div>
          <div>Query1: {query1.data?.title || 'Loading'}</div>
          <div>Query2: {query2.data?.title || 'Loading'}</div>
        </div>
      )
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Query1: Test Dataset')).toBeInTheDocument()
      expect(screen.getByText('Query2: Test Dataset')).toBeInTheDocument()
    })

    // Should only fetch once due to caching
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('should provide query state', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue({
      identifier: 'test-123',
      title: 'Test',
    } as any)

    function TestComponent() {
      const { isLoading, isSuccess, isError, isFetching, status } = useDataset({
        identifier: 'test-123',
      })

      return (
        <div>
          <div>Loading: {isLoading.toString()}</div>
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

    // Initial state
    expect(screen.getByText(/Loading: true/)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Success: true/)).toBeInTheDocument()
      expect(screen.getByText(/Status: success/)).toBeInTheDocument()
    })
  })

  it('should support staleTime option', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue({
      identifier: 'test-123',
      title: 'Test',
    } as any)

    function TestComponent() {
      const { data } = useDataset({
        identifier: 'test-123',
        staleTime: 60000, // 1 minute
      })

      return <div>{data?.title || 'Loading'}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  it('should handle multiple datasets simultaneously', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockImplementation(async (id) => ({
      identifier: id,
      title: `Dataset ${id}`,
    } as any))

    function TestComponent() {
      const dataset1 = useDataset({ identifier: 'id-1' })
      const dataset2 = useDataset({ identifier: 'id-2' })
      const dataset3 = useDataset({ identifier: 'id-3' })

      return (
        <div>
          <div>{dataset1.data?.title || 'Loading 1'}</div>
          <div>{dataset2.data?.title || 'Loading 2'}</div>
          <div>{dataset3.data?.title || 'Loading 3'}</div>
        </div>
      )
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Dataset id-1')).toBeInTheDocument()
      expect(screen.getByText('Dataset id-2')).toBeInTheDocument()
      expect(screen.getByText('Dataset id-3')).toBeInTheDocument()
    })
  })
})
