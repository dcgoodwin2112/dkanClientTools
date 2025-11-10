/**
 * Tests for useDatasetProperties hooks
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useDatasetProperties,
  usePropertyValues,
  useAllPropertiesWithValues,
} from '../useDatasetProperties'

describe('useDatasetProperties', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 }, // Disable retries for tests
    })
  })

  describe('useDatasetProperties', () => {
    it('should fetch dataset properties successfully', async () => {
      const mockProperties = ['theme', 'keyword', 'publisher', 'accessLevel']

      vi.spyOn(mockClient, 'getDatasetProperties').mockResolvedValue(mockProperties)

      function TestComponent() {
        const { data, isLoading } = useDatasetProperties()

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Count: {data.length}</div>
            {data.map((prop) => (
              <div key={prop}>{prop}</div>
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
        expect(screen.getByText('Count: 4')).toBeInTheDocument()
        expect(screen.getByText('theme')).toBeInTheDocument()
        expect(screen.getByText('keyword')).toBeInTheDocument()
        expect(screen.getByText('publisher')).toBeInTheDocument()
        expect(screen.getByText('accessLevel')).toBeInTheDocument()
      })

      expect(mockClient.getDatasetProperties).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state', () => {
      vi.spyOn(mockClient, 'getDatasetProperties').mockImplementation(
        () => new Promise(() => {})
      )

      function TestComponent() {
        const { data, isLoading } = useDatasetProperties()

        return (
          <div>
            <div>Loading: {isLoading ? 'yes' : 'no'}</div>
            <div>Has data: {data ? 'yes' : 'no'}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Loading: yes')).toBeInTheDocument()
      expect(screen.getByText('Has data: no')).toBeInTheDocument()
    })

    it('should handle error state', async () => {
      const mockError = new Error('Failed to fetch properties')
      vi.spyOn(mockClient, 'getDatasetProperties').mockRejectedValue(mockError)

      function TestComponent() {
        const { error, isLoading } = useDatasetProperties()

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
        expect(screen.getByText('Error: Failed to fetch properties')).toBeInTheDocument()
      })
    })

    it('should handle enabled option', () => {
      const propertiesSpy = vi
        .spyOn(mockClient, 'getDatasetProperties')
        .mockResolvedValue([])

      function TestComponent() {
        const { data } = useDatasetProperties({ enabled: false })

        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(propertiesSpy).not.toHaveBeenCalled()
    })

    it('should use default staleTime of 5 minutes', async () => {
      const mockProperties = ['theme', 'keyword']
      vi.spyOn(mockClient, 'getDatasetProperties').mockResolvedValue(mockProperties)

      function TestComponent() {
        const { data } = useDatasetProperties()
        return <div>Has data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Has data: yes')).toBeInTheDocument()
      })

      expect(mockClient.getDatasetProperties).toHaveBeenCalled()
    })

    it('should accept custom staleTime', async () => {
      const mockProperties = ['theme']
      vi.spyOn(mockClient, 'getDatasetProperties').mockResolvedValue(mockProperties)

      function TestComponent() {
        const query = useDatasetProperties({ staleTime: 0 })
        return <div>Has data: {query.data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Has data: yes')).toBeInTheDocument()
      })
    })
  })

  describe('usePropertyValues', () => {
    it('should fetch property values successfully', async () => {
      const mockValues = ['Health', 'Education', 'Transportation', 'Finance']

      vi.spyOn(mockClient, 'getPropertyValues').mockResolvedValue(mockValues)

      function TestComponent() {
        const { data, isLoading } = usePropertyValues({ property: 'theme' })

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Count: {data.length}</div>
            {data.map((value) => (
              <div key={value}>{value}</div>
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
        expect(screen.getByText('Count: 4')).toBeInTheDocument()
        expect(screen.getByText('Health')).toBeInTheDocument()
        expect(screen.getByText('Education')).toBeInTheDocument()
      })

      expect(mockClient.getPropertyValues).toHaveBeenCalledWith('theme')
    })

    it('should not fetch when property is empty', () => {
      const valuesSpy = vi.spyOn(mockClient, 'getPropertyValues').mockResolvedValue([])

      function TestComponent() {
        const { data } = usePropertyValues({ property: '' })

        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      // Query is disabled when property is empty, so no data and no API call
      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(valuesSpy).not.toHaveBeenCalled()
    })

    it('should handle enabled option', () => {
      const valuesSpy = vi.spyOn(mockClient, 'getPropertyValues').mockResolvedValue([])

      function TestComponent() {
        const { data } = usePropertyValues({
          property: 'theme',
          enabled: false,
        })

        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(valuesSpy).not.toHaveBeenCalled()
    })

    it('should handle loading state', () => {
      vi.spyOn(mockClient, 'getPropertyValues').mockImplementation(
        () => new Promise(() => {})
      )

      function TestComponent() {
        const { data, isLoading } = usePropertyValues({ property: 'theme' })

        return (
          <div>
            <div>Loading: {isLoading ? 'yes' : 'no'}</div>
            <div>Has data: {data ? 'yes' : 'no'}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Loading: yes')).toBeInTheDocument()
      expect(screen.getByText('Has data: no')).toBeInTheDocument()
    })

    it('should handle error state', async () => {
      const mockError = new Error('Failed to fetch values')
      vi.spyOn(mockClient, 'getPropertyValues').mockRejectedValue(mockError)

      function TestComponent() {
        const { error, isLoading } = usePropertyValues({ property: 'theme' })

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
        expect(screen.getByText('Error: Failed to fetch values')).toBeInTheDocument()
      })
    })

    it('should use different query keys for different properties', async () => {
      const themeValues = ['Health', 'Education']
      const keywordValues = ['data', 'open', 'public']

      const valuesSpy = vi
        .spyOn(mockClient, 'getPropertyValues')
        .mockImplementation((property: string) => {
          if (property === 'theme') return Promise.resolve(themeValues)
          if (property === 'keyword') return Promise.resolve(keywordValues)
          return Promise.resolve([])
        })

      function TestComponent({ property }: { property: string }) {
        const { data } = usePropertyValues({ property })

        if (!data) return <div>Loading {property}...</div>

        return (
          <div>
            <div>
              {property}: {data.length}
            </div>
          </div>
        )
      }

      const { rerender } = render(
        <DkanClientProvider client={mockClient}>
          <TestComponent property="theme" />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('theme: 2')).toBeInTheDocument()
      })

      expect(valuesSpy).toHaveBeenCalledWith('theme')

      rerender(
        <DkanClientProvider client={mockClient}>
          <TestComponent property="keyword" />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('keyword: 3')).toBeInTheDocument()
      })

      expect(valuesSpy).toHaveBeenCalledWith('keyword')
      expect(valuesSpy).toHaveBeenCalledTimes(2)
    })

    it('should handle empty values array', async () => {
      vi.spyOn(mockClient, 'getPropertyValues').mockResolvedValue([])

      function TestComponent() {
        const { data, isLoading } = usePropertyValues({ property: 'publisher' })

        if (isLoading) return <div>Loading...</div>
        if (!data || data.length === 0) return <div>No values</div>

        return <div>Has values</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('No values')).toBeInTheDocument()
      })
    })
  })

  describe('useAllPropertiesWithValues', () => {
    it('should fetch all properties with values successfully', async () => {
      const mockData = {
        theme: ['Health', 'Education', 'Transportation'],
        keyword: ['data', 'open', 'public'],
        accessLevel: ['public', 'restricted public', 'non-public'],
      }

      vi.spyOn(mockClient, 'getAllPropertiesWithValues').mockResolvedValue(mockData)

      function TestComponent() {
        const { data, isLoading } = useAllPropertiesWithValues()

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Properties: {Object.keys(data).length}</div>
            {Object.entries(data).map(([prop, values]) => (
              <div key={prop}>
                {prop}: {values.length} values
              </div>
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
        expect(screen.getByText('Properties: 3')).toBeInTheDocument()
        expect(screen.getByText('theme: 3 values')).toBeInTheDocument()
        expect(screen.getByText('keyword: 3 values')).toBeInTheDocument()
        expect(screen.getByText('accessLevel: 3 values')).toBeInTheDocument()
      })

      expect(mockClient.getAllPropertiesWithValues).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state', () => {
      vi.spyOn(mockClient, 'getAllPropertiesWithValues').mockImplementation(
        () => new Promise(() => {})
      )

      function TestComponent() {
        const { data, isLoading } = useAllPropertiesWithValues()

        return (
          <div>
            <div>Loading: {isLoading ? 'yes' : 'no'}</div>
            <div>Has data: {data ? 'yes' : 'no'}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Loading: yes')).toBeInTheDocument()
      expect(screen.getByText('Has data: no')).toBeInTheDocument()
    })

    it('should handle error state', async () => {
      const mockError = new Error('Failed to fetch properties with values')
      vi.spyOn(mockClient, 'getAllPropertiesWithValues').mockRejectedValue(mockError)

      function TestComponent() {
        const { error, isLoading } = useAllPropertiesWithValues()

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
        expect(
          screen.getByText('Error: Failed to fetch properties with values')
        ).toBeInTheDocument()
      })
    })

    it('should handle enabled option', () => {
      const allPropertiesSpy = vi
        .spyOn(mockClient, 'getAllPropertiesWithValues')
        .mockResolvedValue({})

      function TestComponent() {
        const { data } = useAllPropertiesWithValues({ enabled: false })

        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(allPropertiesSpy).not.toHaveBeenCalled()
    })

    it('should handle empty properties object', async () => {
      vi.spyOn(mockClient, 'getAllPropertiesWithValues').mockResolvedValue({})

      function TestComponent() {
        const { data, isLoading } = useAllPropertiesWithValues()

        if (isLoading) return <div>Loading...</div>
        if (!data || Object.keys(data).length === 0) return <div>No properties</div>

        return <div>Has properties</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('No properties')).toBeInTheDocument()
      })
    })

    it('should handle properties with empty value arrays', async () => {
      const mockData = {
        theme: ['Health', 'Education'],
        keyword: [],
        publisher: ['Org A'],
      }

      vi.spyOn(mockClient, 'getAllPropertiesWithValues').mockResolvedValue(mockData)

      function TestComponent() {
        const { data, isLoading } = useAllPropertiesWithValues()

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            {Object.entries(data).map(([prop, values]) => (
              <div key={prop}>
                {prop}: {values.length === 0 ? 'empty' : values.length}
              </div>
            ))}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('theme: 2')).toBeInTheDocument()
        expect(screen.getByText('keyword: empty')).toBeInTheDocument()
        expect(screen.getByText('publisher: 1')).toBeInTheDocument()
      })
    })

    it('should use default staleTime of 5 minutes', async () => {
      const mockData = { theme: ['Health'] }
      vi.spyOn(mockClient, 'getAllPropertiesWithValues').mockResolvedValue(mockData)

      function TestComponent() {
        const { data } = useAllPropertiesWithValues()
        return <div>Has data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Has data: yes')).toBeInTheDocument()
      })

      expect(mockClient.getAllPropertiesWithValues).toHaveBeenCalled()
    })

    it('should handle complex faceted data structure', async () => {
      const mockData = {
        theme: ['Health', 'Education', 'Transportation', 'Public Safety'],
        keyword: ['open data', 'public', 'government', 'transparency'],
        publisher: ['City of Springfield', 'State DOT', 'Health Department'],
        accessLevel: ['public', 'restricted public'],
        'temporal.startDate': ['2020', '2021', '2022', '2023', '2024'],
      }

      vi.spyOn(mockClient, 'getAllPropertiesWithValues').mockResolvedValue(mockData)

      function TestComponent() {
        const { data, isLoading } = useAllPropertiesWithValues()

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        const totalValues = Object.values(data).reduce(
          (sum, values) => sum + values.length,
          0
        )

        return (
          <div>
            <div>Total properties: {Object.keys(data).length}</div>
            <div>Total values: {totalValues}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Total properties: 5')).toBeInTheDocument()
        expect(screen.getByText('Total values: 18')).toBeInTheDocument()
      })
    })
  })
})
