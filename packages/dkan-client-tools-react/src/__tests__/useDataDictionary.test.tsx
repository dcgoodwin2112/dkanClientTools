/**
 * Tests for Data Dictionary hooks
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useDataDictionary,
  useDataDictionaryList,
  useDataDictionaryFromUrl,
  useDatastoreSchema,
} from '../useDataDictionary'

describe('useDataDictionary', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useDataDictionary', () => {
    it('should fetch data dictionary successfully', async () => {
      const mockDictionary = {
        identifier: 'dict-123',
        data: {
          title: 'Test Dictionary',
          fields: [
            { name: 'id', type: 'integer' as const, title: 'ID' },
            { name: 'name', type: 'string' as const, title: 'Name' },
            { name: 'email', type: 'string' as const, format: 'email' },
          ],
        },
      }

      vi.spyOn(mockClient, 'getDataDictionary').mockResolvedValue(mockDictionary)

      function TestComponent() {
        const { data, isLoading, error } = useDataDictionary({
          identifier: 'dict-123',
        })

        if (isLoading) return <div>Loading...</div>
        if (error) return <div>Error: {error.message}</div>
        if (!data) return null

        return (
          <div>
            <div>Title: {data.data.title}</div>
            <div>Fields: {data.data.fields.length}</div>
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
        expect(screen.getByText('Title: Test Dictionary')).toBeInTheDocument()
        expect(screen.getByText('Fields: 3')).toBeInTheDocument()
      })

      expect(mockClient.getDataDictionary).toHaveBeenCalledWith('dict-123')
    })

    it('should handle fetch error', async () => {
      vi.spyOn(mockClient, 'getDataDictionary').mockRejectedValue(
        new Error('Dictionary not found')
      )

      function TestComponent() {
        const { error } = useDataDictionary({ identifier: 'dict-123' })

        if (error) return <div>Error: {error.message}</div>

        return <div>No error</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Dictionary not found')).toBeInTheDocument()
      })
    })

    it('should respect enabled option', async () => {
      const fetchSpy = vi.spyOn(mockClient, 'getDataDictionary')

      function TestComponent() {
        const { data } = useDataDictionary({
          identifier: 'dict-123',
          enabled: false,
        })

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

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should support conditional fetching', async () => {
      const user = userEvent.setup()
      const fetchSpy = vi.spyOn(mockClient, 'getDataDictionary').mockResolvedValue({
        identifier: 'dict-123',
        data: {
          title: 'Test Dictionary',
          fields: [],
        },
      })

      function TestComponent() {
        const [id, setId] = React.useState<string | null>(null)
        const { data } = useDataDictionary({
          identifier: id || '',
          enabled: !!id,
        })

        return (
          <div>
            <button onClick={() => setId('dict-123')}>Load Dictionary</button>
            {data && <div>Title: {data.data.title}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(fetchSpy).not.toHaveBeenCalled()

      const button = screen.getByText('Load Dictionary')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Title: Test Dictionary')).toBeInTheDocument()
      })

      expect(fetchSpy).toHaveBeenCalledWith('dict-123')
    })

    it('should cache results', async () => {
      const fetchSpy = vi.spyOn(mockClient, 'getDataDictionary').mockResolvedValue({
        identifier: 'dict-123',
        data: {
          title: 'Test Dictionary',
          fields: [],
        },
      })

      function TestComponent() {
        const query1 = useDataDictionary({ identifier: 'dict-123' })
        const query2 = useDataDictionary({ identifier: 'dict-123' })

        return (
          <div>
            <div>Query1: {query1.data?.data.title || 'Loading'}</div>
            <div>Query2: {query2.data?.data.title || 'Loading'}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Query1: Test Dictionary')).toBeInTheDocument()
        expect(screen.getByText('Query2: Test Dictionary')).toBeInTheDocument()
      })

      // Should only fetch once due to caching
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('should support staleTime option', async () => {
      vi.spyOn(mockClient, 'getDataDictionary').mockResolvedValue({
        identifier: 'dict-123',
        data: {
          title: 'Test Dictionary',
          fields: [],
        },
      })

      function TestComponent() {
        const { data } = useDataDictionary({
          identifier: 'dict-123',
          staleTime: 60000, // 1 minute
        })

        return <div>{data?.data.title || 'Loading'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Dictionary')).toBeInTheDocument()
      })
    })

    it('should handle complex field definitions', async () => {
      const complexDictionary = {
        identifier: 'dict-complex',
        data: {
          title: 'Complex Dictionary',
          fields: [
            {
              name: 'email',
              type: 'string' as const,
              format: 'email',
              title: 'Email Address',
              description: 'User email',
              constraints: {
                required: true,
                pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
              },
            },
            {
              name: 'age',
              type: 'integer' as const,
              constraints: {
                minimum: 0,
                maximum: 120,
              },
            },
          ],
          indexes: [{ fields: [{ name: 'email' }] }],
        },
      }

      vi.spyOn(mockClient, 'getDataDictionary').mockResolvedValue(complexDictionary)

      function TestComponent() {
        const { data } = useDataDictionary({ identifier: 'dict-complex' })

        if (!data) return <div>Loading...</div>

        return (
          <div>
            <div>Email field: {data.data.fields[0].name}</div>
            <div>Email required: {data.data.fields[0].constraints?.required ? 'yes' : 'no'}</div>
            <div>Indexes: {data.data.indexes?.length || 0}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Email field: email')).toBeInTheDocument()
        expect(screen.getByText('Email required: yes')).toBeInTheDocument()
        expect(screen.getByText('Indexes: 1')).toBeInTheDocument()
      })
    })
  })

  describe('useDataDictionaryList', () => {
    it('should fetch all data dictionaries successfully', async () => {
      const mockList = [
        {
          identifier: 'dict-1',
          data: { title: 'Dictionary 1', fields: [] },
        },
        {
          identifier: 'dict-2',
          data: { title: 'Dictionary 2', fields: [] },
        },
        {
          identifier: 'dict-3',
          data: { title: 'Dictionary 3', fields: [] },
        },
      ]

      vi.spyOn(mockClient, 'listDataDictionaries').mockResolvedValue(mockList)

      function TestComponent() {
        const { data, isLoading, error } = useDataDictionaryList()

        if (isLoading) return <div>Loading...</div>
        if (error) return <div>Error: {error.message}</div>
        if (!data) return null

        return (
          <div>
            <div>Total: {data.length}</div>
            <div>First: {data[0].data.title}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Total: 3')).toBeInTheDocument()
        expect(screen.getByText('First: Dictionary 1')).toBeInTheDocument()
      })

      expect(mockClient.listDataDictionaries).toHaveBeenCalled()
    })

    it('should handle empty list', async () => {
      vi.spyOn(mockClient, 'listDataDictionaries').mockResolvedValue([])

      function TestComponent() {
        const { data } = useDataDictionaryList()

        if (!data) return <div>Loading...</div>

        return <div>Total: {data.length}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Total: 0')).toBeInTheDocument()
      })
    })

    it('should cache list results', async () => {
      const listSpy = vi.spyOn(mockClient, 'listDataDictionaries').mockResolvedValue([
        { identifier: 'dict-1', data: { title: 'Test', fields: [] } },
      ])

      function TestComponent() {
        const query1 = useDataDictionaryList()
        const query2 = useDataDictionaryList()

        return (
          <div>
            <div>Query1 count: {query1.data?.length || 0}</div>
            <div>Query2 count: {query2.data?.length || 0}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Query1 count: 1')).toBeInTheDocument()
        expect(screen.getByText('Query2 count: 1')).toBeInTheDocument()
      })

      // Should only fetch once due to caching
      expect(listSpy).toHaveBeenCalledTimes(1)
    })

    it('should respect enabled option', async () => {
      const listSpy = vi.spyOn(mockClient, 'listDataDictionaries')

      function TestComponent() {
        const { data } = useDataDictionaryList({ enabled: false })

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

    it('should handle fetch errors', async () => {
      vi.spyOn(mockClient, 'listDataDictionaries').mockRejectedValue(
        new Error('Failed to fetch list')
      )

      function TestComponent() {
        const { error } = useDataDictionaryList()

        if (error) return <div>Error: {error.message}</div>

        return <div>No error</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to fetch list')).toBeInTheDocument()
      })
    })
  })

  describe('useDataDictionaryFromUrl', () => {
    it('should fetch data dictionary from URL successfully', async () => {
      const mockDictionary = {
        identifier: 'dict-url',
        data: {
          title: 'URL Dictionary',
          fields: [
            { name: 'field1', type: 'string' as const },
            { name: 'field2', type: 'integer' as const },
          ],
        },
      }

      vi.spyOn(mockClient, 'getDataDictionaryFromUrl').mockResolvedValue(mockDictionary)

      function TestComponent() {
        const { data, isLoading } = useDataDictionaryFromUrl({
          url: 'https://example.com/dictionaries/dict-url',
        })

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Title: {data.data.title}</div>
            <div>Fields: {data.data.fields.length}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Title: URL Dictionary')).toBeInTheDocument()
        expect(screen.getByText('Fields: 2')).toBeInTheDocument()
      })

      expect(mockClient.getDataDictionaryFromUrl).toHaveBeenCalledWith(
        'https://example.com/dictionaries/dict-url'
      )
    })

    it('should handle distribution describedBy URLs', async () => {
      const mockDictionary = {
        identifier: 'dist-dict',
        data: {
          title: 'Distribution Dictionary',
          fields: [],
        },
      }

      const distribution = {
        describedBy: 'https://example.com/api/1/metastore/schemas/data-dictionary/items/dist-dict',
      }

      vi.spyOn(mockClient, 'getDataDictionaryFromUrl').mockResolvedValue(mockDictionary)

      function TestComponent() {
        const { data } = useDataDictionaryFromUrl({
          url: distribution.describedBy,
        })

        if (!data) return <div>Loading...</div>

        return <div>Title: {data.data.title}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Title: Distribution Dictionary')).toBeInTheDocument()
      })
    })

    it('should cache URL-based dictionaries separately', async () => {
      const fetchSpy = vi
        .spyOn(mockClient, 'getDataDictionaryFromUrl')
        .mockImplementation(async (url) => ({
          identifier: url.split('/').pop() || 'dict',
          data: {
            title: `Dictionary from ${url}`,
            fields: [],
          },
        }))

      function TestComponent() {
        const dict1 = useDataDictionaryFromUrl({ url: 'https://example.com/dict-1' })
        const dict2 = useDataDictionaryFromUrl({ url: 'https://example.com/dict-2' })

        return (
          <div>
            <div>Dict1: {dict1.data?.data.title || 'Loading'}</div>
            <div>Dict2: {dict2.data?.data.title || 'Loading'}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/Dict1: Dictionary from/)).toBeInTheDocument()
        expect(screen.getByText(/Dict2: Dictionary from/)).toBeInTheDocument()
      })

      // Should fetch twice (different URLs)
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('should respect enabled option', async () => {
      const fetchSpy = vi.spyOn(mockClient, 'getDataDictionaryFromUrl')

      function TestComponent() {
        const { data } = useDataDictionaryFromUrl({
          url: 'https://example.com/dict',
          enabled: false,
        })

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

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should handle URL fetch errors', async () => {
      vi.spyOn(mockClient, 'getDataDictionaryFromUrl').mockRejectedValue(
        new Error('URL not accessible')
      )

      function TestComponent() {
        const { error } = useDataDictionaryFromUrl({
          url: 'https://example.com/invalid',
        })

        if (error) return <div>Error: {error.message}</div>

        return <div>No error</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: URL not accessible')).toBeInTheDocument()
      })
    })
  })

  describe('useDatastoreSchema', () => {
    it('should fetch datastore schema successfully', async () => {
      const mockSchema = {
        schema: {
          fields: [
            { name: 'id', type: 'integer' as const, title: 'ID' },
            { name: 'name', type: 'string' as const, title: 'Name' },
            { name: 'date', type: 'date' as const, format: 'default' },
          ],
        },
      }

      vi.spyOn(mockClient, 'getDatastoreSchema').mockResolvedValue(mockSchema)

      function TestComponent() {
        const { data, isLoading } = useDatastoreSchema({
          datasetId: 'dataset-123',
          index: 0,
        })

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Fields: {data.schema.fields.length}</div>
            <div>First field: {data.schema.fields[0].name}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Fields: 3')).toBeInTheDocument()
        expect(screen.getByText('First field: id')).toBeInTheDocument()
      })

      expect(mockClient.getDatastoreSchema).toHaveBeenCalledWith('dataset-123', 0)
    })

    it('should use default index of 0', async () => {
      const mockSchema = {
        schema: {
          fields: [{ name: 'id', type: 'integer' as const }],
        },
      }

      const schemaSpy = vi
        .spyOn(mockClient, 'getDatastoreSchema')
        .mockResolvedValue(mockSchema)

      function TestComponent() {
        const { data } = useDatastoreSchema({
          datasetId: 'dataset-123',
        })

        if (!data) return <div>Loading...</div>

        return <div>Schema loaded</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Schema loaded')).toBeInTheDocument()
      })

      expect(schemaSpy).toHaveBeenCalledWith('dataset-123', undefined)
    })

    it('should fetch different distributions by index', async () => {
      const schemaSpy = vi
        .spyOn(mockClient, 'getDatastoreSchema')
        .mockImplementation(async (datasetId, index) => ({
          schema: {
            fields: [{ name: `field_dist_${index}`, type: 'string' as const }],
          },
        }))

      function TestComponent() {
        const dist0 = useDatastoreSchema({ datasetId: 'dataset-123', index: 0 })
        const dist1 = useDatastoreSchema({ datasetId: 'dataset-123', index: 1 })

        return (
          <div>
            <div>Dist0: {dist0.data?.schema.fields[0].name || 'Loading'}</div>
            <div>Dist1: {dist1.data?.schema.fields[0].name || 'Loading'}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Dist0: field_dist_0')).toBeInTheDocument()
        expect(screen.getByText('Dist1: field_dist_1')).toBeInTheDocument()
      })

      expect(schemaSpy).toHaveBeenCalledWith('dataset-123', 0)
      expect(schemaSpy).toHaveBeenCalledWith('dataset-123', 1)
    })

    it('should handle schema with indexes', async () => {
      const mockSchema = {
        schema: {
          fields: [
            { name: 'state', type: 'string' as const },
            { name: 'county', type: 'string' as const },
          ],
          indexes: [
            { fields: [{ name: 'state' }] },
            { fields: [{ name: 'state' }, { name: 'county' }] },
          ],
        },
      }

      vi.spyOn(mockClient, 'getDatastoreSchema').mockResolvedValue(mockSchema)

      function TestComponent() {
        const { data } = useDatastoreSchema({ datasetId: 'dataset-123' })

        if (!data) return <div>Loading...</div>

        return (
          <div>
            <div>Indexes: {data.schema.indexes?.length || 0}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Indexes: 2')).toBeInTheDocument()
      })
    })

    it('should respect enabled option', async () => {
      const schemaSpy = vi.spyOn(mockClient, 'getDatastoreSchema')

      function TestComponent() {
        const { data } = useDatastoreSchema({
          datasetId: 'dataset-123',
          enabled: false,
        })

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

      expect(schemaSpy).not.toHaveBeenCalled()
    })

    it('should cache schema results', async () => {
      const schemaSpy = vi.spyOn(mockClient, 'getDatastoreSchema').mockResolvedValue({
        schema: {
          fields: [{ name: 'id', type: 'integer' as const }],
        },
      })

      function TestComponent() {
        const query1 = useDatastoreSchema({ datasetId: 'dataset-123', index: 0 })
        const query2 = useDatastoreSchema({ datasetId: 'dataset-123', index: 0 })

        return (
          <div>
            <div>Query1 fields: {query1.data?.schema.fields.length || 0}</div>
            <div>Query2 fields: {query2.data?.schema.fields.length || 0}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Query1 fields: 1')).toBeInTheDocument()
        expect(screen.getByText('Query2 fields: 1')).toBeInTheDocument()
      })

      // Should only fetch once due to caching
      expect(schemaSpy).toHaveBeenCalledTimes(1)
    })

    it('should handle schema fetch errors', async () => {
      vi.spyOn(mockClient, 'getDatastoreSchema').mockRejectedValue(
        new Error('Schema not found')
      )

      function TestComponent() {
        const { error } = useDatastoreSchema({ datasetId: 'dataset-123' })

        if (error) return <div>Error: {error.message}</div>

        return <div>No error</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Schema not found')).toBeInTheDocument()
      })
    })

    it('should support staleTime option', async () => {
      vi.spyOn(mockClient, 'getDatastoreSchema').mockResolvedValue({
        schema: {
          fields: [{ name: 'id', type: 'integer' as const }],
        },
      })

      function TestComponent() {
        const { data } = useDatastoreSchema({
          datasetId: 'dataset-123',
          staleTime: 30000, // 30 seconds
        })

        return <div>Fields: {data?.schema.fields.length || 0}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Fields: 1')).toBeInTheDocument()
      })
    })
  })
})
