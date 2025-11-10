/**
 * Tests for DkanClientProvider and useDkanClient
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider, useDkanClient } from '../DkanClientProvider'

// Test component that uses the context
function TestComponent() {
  const client = useDkanClient()
  return <div>Client baseUrl: {client.getApiClient().getBaseUrl()}</div>
}

// Component that doesn't use provider (for error testing)
function OrphanComponent() {
  useDkanClient()
  return <div>Should not render</div>
}

describe('DkanClientProvider', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({ queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }), baseUrl: 'https://test.example.com' })
    vi.spyOn(mockClient, 'mount')
    vi.spyOn(mockClient, 'unmount')
  })

  it('should render children', () => {
    render(
      <DkanClientProvider client={mockClient}>
        <div>Test Child</div>
      </DkanClientProvider>
    )

    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide client to children via context', () => {
    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    expect(screen.getByText('Client baseUrl: https://test.example.com')).toBeInTheDocument()
  })

  it('should call client.mount() on mount', async () => {
    render(
      <DkanClientProvider client={mockClient}>
        <div>Test</div>
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(mockClient.mount).toHaveBeenCalledTimes(1)
    })
  })

  it('should call client.unmount() on unmount', async () => {
    const { unmount } = render(
      <DkanClientProvider client={mockClient}>
        <div>Test</div>
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(mockClient.mount).toHaveBeenCalled()
    })

    unmount()

    await waitFor(() => {
      expect(mockClient.unmount).toHaveBeenCalledTimes(1)
    })
  })

  it('should call mount/unmount only once when client changes', async () => {
    const { rerender } = render(
      <DkanClientProvider client={mockClient}>
        <div>Test</div>
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(mockClient.mount).toHaveBeenCalledTimes(1)
    })

    // Rerender with same client - shouldn't call mount again
    rerender(
      <DkanClientProvider client={mockClient}>
        <div>Test Updated</div>
      </DkanClientProvider>
    )

    expect(mockClient.mount).toHaveBeenCalledTimes(1)
  })

  it('should handle client replacement', async () => {
    const newClient = new DkanClient({ queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }), baseUrl: 'https://new.example.com' })
    vi.spyOn(newClient, 'mount')
    vi.spyOn(newClient, 'unmount')

    const { rerender } = render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(mockClient.mount).toHaveBeenCalledTimes(1)
    })

    // Replace client
    rerender(
      <DkanClientProvider client={newClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(mockClient.unmount).toHaveBeenCalledTimes(1)
      expect(newClient.mount).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText('Client baseUrl: https://new.example.com')).toBeInTheDocument()
  })

  it('should work with nested providers', () => {
    const innerClient = new DkanClient({ queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }), baseUrl: 'https://inner.example.com' })

    function NestedTest() {
      const client = useDkanClient()
      return <div>Inner: {client.getApiClient().getBaseUrl()}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <div>Outer</div>
        <DkanClientProvider client={innerClient}>
          <NestedTest />
        </DkanClientProvider>
      </DkanClientProvider>
    )

    expect(screen.getByText('Inner: https://inner.example.com')).toBeInTheDocument()
  })
})

describe('useDkanClient', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<OrphanComponent />)
    }).toThrow('useDkanClient must be used within a DkanClientProvider')

    consoleSpy.mockRestore()
  })

  it('should return the client from context', () => {
    const mockClient = new DkanClient({ queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }), baseUrl: 'https://test.example.com' })

    function ClientTest() {
      const client = useDkanClient()
      expect(client).toBe(mockClient)
      return <div>Success</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <ClientTest />
      </DkanClientProvider>
    )

    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  it('should allow access to client methods', async () => {
    const mockClient = new DkanClient({ queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }), baseUrl: 'https://test.example.com' })
    const mockFetchDataset = vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue({
      identifier: 'test-123',
      title: 'Test Dataset',
    } as any)

    function ClientMethodTest() {
      const client = useDkanClient()
      const [data, setData] = React.useState<string>('')

      React.useEffect(() => {
        client.fetchDataset('test-123').then(dataset => {
          setData(dataset.title)
        })
      }, [client])

      return <div>{data || 'Loading...'}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <ClientMethodTest />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Dataset')).toBeInTheDocument()
    })

    expect(mockFetchDataset).toHaveBeenCalledWith('test-123')
  })
})
