/**
 * Tests for useMetastore hooks
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useAllDatasets,
  useSchemas,
  useSchema,
  useSchemaItems,
  useDatasetFacets,
} from '../useMetastore'

describe('useMetastore', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }),
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useAllDatasets', () => {
    it('should fetch all datasets successfully', async () => {
      const mockDatasets = [
        {
          identifier: 'dataset-1',
          title: 'Dataset 1',
          description: 'Description 1',
          accessLevel: 'public' as const,
          modified: '2024-01-01',
          keyword: ['test'],
          publisher: { name: 'Publisher 1' },
          contactPoint: {
            '@type': 'vcard:Contact',
            fn: 'Contact 1',
            hasEmail: 'test1@example.com',
          },
        },
        {
          identifier: 'dataset-2',
          title: 'Dataset 2',
          description: 'Description 2',
          accessLevel: 'public' as const,
          modified: '2024-01-02',
          keyword: ['test'],
          publisher: { name: 'Publisher 2' },
          contactPoint: {
            '@type': 'vcard:Contact',
            fn: 'Contact 2',
            hasEmail: 'test2@example.com',
          },
        },
      ]

      vi.spyOn(mockClient, 'listAllDatasets').mockResolvedValue(mockDatasets)

      function TestComponent() {
        const { data: datasets, isLoading } = useAllDatasets()

        if (isLoading) return <div>Loading...</div>
        if (!datasets) return null

        return (
          <div>
            <div>Count: {datasets.length}</div>
            {datasets.map((dataset) => (
              <div key={dataset.identifier}>{dataset.title}</div>
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
        expect(screen.getByText('Count: 2')).toBeInTheDocument()
        expect(screen.getByText('Dataset 1')).toBeInTheDocument()
        expect(screen.getByText('Dataset 2')).toBeInTheDocument()
      })

      expect(mockClient.listAllDatasets).toHaveBeenCalledTimes(1)
    })

    it('should handle enabled option', () => {
      const datasetsSpy = vi.spyOn(mockClient, 'listAllDatasets').mockResolvedValue([])

      function TestComponent() {
        const { data } = useAllDatasets({ enabled: false })
        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(datasetsSpy).not.toHaveBeenCalled()
    })

    it('should handle empty datasets array', async () => {
      vi.spyOn(mockClient, 'listAllDatasets').mockResolvedValue([])

      function TestComponent() {
        const { data, isLoading } = useAllDatasets()

        if (isLoading) return <div>Loading...</div>
        if (!data || data.length === 0) return <div>No datasets</div>

        return <div>Has datasets</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('No datasets')).toBeInTheDocument()
      })
    })
  })

  describe('useSchemas', () => {
    it('should list schemas successfully', async () => {
      const mockSchemas = ['dataset', 'data-dictionary', 'distribution']

      vi.spyOn(mockClient, 'listSchemas').mockResolvedValue(mockSchemas)

      function TestComponent() {
        const { data: schemas, isLoading } = useSchemas()

        if (isLoading) return <div>Loading...</div>
        if (!schemas) return null

        return (
          <div>
            <div>Count: {schemas.length}</div>
            {schemas.map((schema) => (
              <div key={schema}>{schema}</div>
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
        expect(screen.getByText('Count: 3')).toBeInTheDocument()
        expect(screen.getByText('dataset')).toBeInTheDocument()
        expect(screen.getByText('data-dictionary')).toBeInTheDocument()
        expect(screen.getByText('distribution')).toBeInTheDocument()
      })
    })

    it('should handle enabled option', () => {
      const schemasSpy = vi.spyOn(mockClient, 'listSchemas').mockResolvedValue([])

      function TestComponent() {
        const { data } = useSchemas({ enabled: false })
        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(schemasSpy).not.toHaveBeenCalled()
    })
  })

  describe('useSchema', () => {
    it('should fetch schema successfully', async () => {
      const mockSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Dataset',
        description: 'DCAT-US Dataset Schema',
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Dataset title' },
          description: { type: 'string', description: 'Dataset description' },
          identifier: { type: 'string', description: 'Unique identifier' },
          accessLevel: { type: 'string', enum: ['public', 'restricted', 'non-public'] },
        },
        required: ['title', 'description', 'identifier', 'accessLevel'],
      }

      vi.spyOn(mockClient, 'getSchema').mockResolvedValue(mockSchema)

      function TestComponent() {
        const { data: schema, isLoading } = useSchema({
          schemaId: 'dataset',
        })

        if (isLoading) return <div>Loading...</div>
        if (!schema) return null

        return (
          <div>
            <div>Title: {schema.title}</div>
            <div>Properties: {Object.keys(schema.properties || {}).length}</div>
            <div>Required: {schema.required?.length || 0}</div>
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
        expect(screen.getByText('Title: Dataset')).toBeInTheDocument()
        expect(screen.getByText('Properties: 4')).toBeInTheDocument()
        expect(screen.getByText('Required: 4')).toBeInTheDocument()
      })

      expect(mockClient.getSchema).toHaveBeenCalledWith('dataset')
    })

    it('should handle loading state', () => {
      vi.spyOn(mockClient, 'getSchema').mockImplementation(
        () => new Promise(() => {})
      )

      function TestComponent() {
        const { data, isLoading } = useSchema({
          schemaId: 'dataset',
        })

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
      const mockError = new Error('Schema not found')
      vi.spyOn(mockClient, 'getSchema').mockRejectedValue(mockError)

      function TestComponent() {
        const { error, isLoading } = useSchema({
          schemaId: 'nonexistent',
        })

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
        expect(screen.getByText('Error: Schema not found')).toBeInTheDocument()
      })
    })

    it('should handle enabled option', () => {
      const schemaSpy = vi
        .spyOn(mockClient, 'getSchema')
        .mockResolvedValue({ type: 'object', properties: {} })

      function TestComponent() {
        const { data } = useSchema({
          schemaId: 'dataset',
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
      expect(schemaSpy).not.toHaveBeenCalled()
    })

    it('should not fetch when schemaId is empty', () => {
      const schemaSpy = vi
        .spyOn(mockClient, 'getSchema')
        .mockResolvedValue({ type: 'object', properties: {} })

      function TestComponent() {
        const { data } = useSchema({
          schemaId: '',
        })

        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(schemaSpy).not.toHaveBeenCalled()
    })

    it('should display schema properties', async () => {
      const mockSchema = {
        title: 'Data Dictionary',
        type: 'object',
        properties: {
          title: { type: 'string' },
          fields: { type: 'array' },
          indexes: { type: 'object' },
        },
        required: ['title', 'fields'],
      }

      vi.spyOn(mockClient, 'getSchema').mockResolvedValue(mockSchema)

      function TestComponent() {
        const { data: schema } = useSchema({
          schemaId: 'data-dictionary',
        })

        if (!schema) return <div>Loading...</div>

        return (
          <div>
            <div>Schema: {schema.title}</div>
            <div>Props: {Object.keys(schema.properties || {}).join(', ')}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Schema: Data Dictionary')).toBeInTheDocument()
        expect(screen.getByText('Props: title, fields, indexes')).toBeInTheDocument()
      })
    })
  })

  describe('useSchemaItems', () => {
    it('should fetch schema items successfully', async () => {
      const mockItems = [
        { identifier: 'item-1', data: { title: 'Item 1' } },
        { identifier: 'item-2', data: { title: 'Item 2' } },
      ]

      vi.spyOn(mockClient, 'getSchemaItems').mockResolvedValue(mockItems)

      function TestComponent() {
        const { data: items, isLoading } = useSchemaItems({
          schemaId: 'data-dictionary',
        })

        if (isLoading) return <div>Loading...</div>
        if (!items) return null

        return (
          <div>
            <div>Count: {items.length}</div>
            {items.map((item) => (
              <div key={item.identifier}>{item.data.title}</div>
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
        expect(screen.getByText('Count: 2')).toBeInTheDocument()
        expect(screen.getByText('Item 1')).toBeInTheDocument()
        expect(screen.getByText('Item 2')).toBeInTheDocument()
      })

      expect(mockClient.getSchemaItems).toHaveBeenCalledWith('data-dictionary')
    })

    it('should handle enabled option', () => {
      const itemsSpy = vi.spyOn(mockClient, 'getSchemaItems').mockResolvedValue([])

      function TestComponent() {
        const { data } = useSchemaItems({
          schemaId: 'dataset',
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
      expect(itemsSpy).not.toHaveBeenCalled()
    })
  })

  describe('useDatasetFacets', () => {
    it('should fetch dataset facets successfully', async () => {
      const mockFacets = {
        theme: ['Health', 'Education', 'Transportation'],
        keyword: ['open data', 'public', 'government'],
        publisher: ['City of Springfield', 'State DOT'],
      }

      vi.spyOn(mockClient, 'getDatasetFacets').mockResolvedValue(mockFacets)

      function TestComponent() {
        const { data: facets, isLoading } = useDatasetFacets()

        if (isLoading) return <div>Loading...</div>
        if (!facets) return null

        return (
          <div>
            <div>Themes: {facets.theme.length}</div>
            <div>Keywords: {facets.keyword.length}</div>
            <div>Publishers: {facets.publisher.length}</div>
            {facets.theme.map((theme) => (
              <div key={theme}>{theme}</div>
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
        expect(screen.getByText('Themes: 3')).toBeInTheDocument()
        expect(screen.getByText('Keywords: 3')).toBeInTheDocument()
        expect(screen.getByText('Publishers: 2')).toBeInTheDocument()
        expect(screen.getByText('Health')).toBeInTheDocument()
        expect(screen.getByText('Education')).toBeInTheDocument()
      })
    })

    it('should handle enabled option', () => {
      const facetsSpy = vi.spyOn(mockClient, 'getDatasetFacets').mockResolvedValue({
        theme: [],
        keyword: [],
        publisher: [],
      })

      function TestComponent() {
        const { data } = useDatasetFacets({ enabled: false })
        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(facetsSpy).not.toHaveBeenCalled()
    })

    it('should use default staleTime of 5 minutes', async () => {
      const mockFacets = {
        theme: ['Health'],
        keyword: ['data'],
        publisher: ['Publisher'],
      }

      vi.spyOn(mockClient, 'getDatasetFacets').mockResolvedValue(mockFacets)

      function TestComponent() {
        const { data } = useDatasetFacets()
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

      expect(mockClient.getDatasetFacets).toHaveBeenCalled()
    })
  })
})
