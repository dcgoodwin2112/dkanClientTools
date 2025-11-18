/**
 * Tests for table composables
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import {
  useTableFromQuery,
  useDatasetSearchTable,
  useDatastoreTable,
} from '../useTables'
import { createDatasetColumns, createDatastoreColumns } from '../tableColumns'
import { useDatasetSearch } from '../useDatasetSearch'
import { useDatastore } from '../useDatastore'
import { waitForOptions } from './setup'

describe('Table Composables', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 0 },
      },
    })

    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
      queryClient,
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

      const TestComponent = defineComponent({
        setup() {
          const query = useDatasetSearch({ keyword: ref('test') })
          const table = useTableFromQuery({
            query,
            data: () => query.data.value?.results ?? [],
            columns: createDatasetColumns(),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')
            if (query.error.value)
              return h('div', `Error: ${query.error.value.message}`)

            return h('div', [
              h('div', `Row count: ${table.getRowModel().rows.length}`),
              h('div', `Column count: ${table.getAllColumns().length}`),
            ])
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      expect(wrapper.text()).toContain('Loading...')

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Row count: 2')
      }, waitForOptions)

      expect(wrapper.text()).toContain('Column count:')
    })

    it('should handle empty data', async () => {
      vi.spyOn(mockClient, 'searchDatasets').mockResolvedValue({
        total: 0,
        results: [],
      })

      const TestComponent = defineComponent({
        setup() {
          const query = useDatasetSearch({ keyword: ref('nonexistent') })
          const table = useTableFromQuery({
            query,
            data: () => query.data.value?.results ?? [],
            columns: createDatasetColumns(),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')

            return h('div', `Row count: ${table.getRowModel().rows.length}`)
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Row count: 0')
      }, waitForOptions)
    })

    it('should support reactive data', async () => {
      vi.spyOn(mockClient, 'searchDatasets')
        .mockResolvedValueOnce({
          total: 1,
          results: [
            {
              identifier: 'test-1',
              title: 'Dataset 1',
              description: 'Desc',
              accessLevel: 'public' as const,
              modified: '2024-01-01',
              keyword: ['test'],
              publisher: { name: 'Pub' },
              contactPoint: {
                '@type': 'vcard:Contact',
                fn: 'Contact',
                hasEmail: 'test@example.com',
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          total: 2,
          results: [
            {
              identifier: 'test-1',
              title: 'Dataset 1',
              description: 'Desc',
              accessLevel: 'public' as const,
              modified: '2024-01-01',
              keyword: ['test'],
              publisher: { name: 'Pub' },
              contactPoint: {
                '@type': 'vcard:Contact',
                fn: 'Contact',
                hasEmail: 'test@example.com',
              },
            },
            {
              identifier: 'test-2',
              title: 'Dataset 2',
              description: 'Desc',
              accessLevel: 'public' as const,
              modified: '2024-01-02',
              keyword: ['test'],
              publisher: { name: 'Pub' },
              contactPoint: {
                '@type': 'vcard:Contact',
                fn: 'Contact',
                hasEmail: 'test@example.com',
              },
            },
          ],
        })

      const TestComponent = defineComponent({
        setup() {
          const keyword = ref('test')
          const query = useDatasetSearch({ keyword })
          const table = useTableFromQuery({
            query,
            data: () => query.data.value?.results ?? [],
            columns: createDatasetColumns(),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')

            return h('div', `Rows: ${table.getRowModel().rows.length}`)
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Rows: 1')
      }, waitForOptions)
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

      const TestComponent = defineComponent({
        setup() {
          const { table, query } = useDatasetSearchTable({
            searchOptions: { keyword: 'health' },
            columns: createDatasetColumns(),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')
            if (query.error.value)
              return h('div', `Error: ${query.error.value.message}`)

            const rows = table.getRowModel().rows

            return h('div', [
              h('div', `Total datasets: ${rows.length}`),
              ...rows.map((row) => h('div', `Dataset: ${row.original.title}`)),
            ])
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      expect(wrapper.text()).toContain('Loading...')

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Total datasets: 1')
        expect(wrapper.text()).toContain('Dataset: Health Dataset')
      }, waitForOptions)

      expect(mockClient.searchDatasets).toHaveBeenCalledWith({
        keyword: 'health',
      })
    })

    it('should handle search errors', async () => {
      vi.spyOn(mockClient, 'searchDatasets').mockRejectedValue(
        new Error('Search failed')
      )

      const TestComponent = defineComponent({
        setup() {
          const { table, query } = useDatasetSearchTable({
            searchOptions: { keyword: 'test' },
            columns: createDatasetColumns(),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')
            if (query.error.value)
              return h('div', `Error: ${query.error.value.message}`)

            return h('div', 'Success')
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Error: Search failed')
      }, waitForOptions)
    })

    it('should support reactive search options', async () => {
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

      const TestComponent = defineComponent({
        setup() {
          const keyword = ref('health')
          const { table, query } = useDatasetSearchTable({
            searchOptions: { keyword },
            columns: createDatasetColumns(),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')

            return h('div', `Rows: ${table.getRowModel().rows.length}`)
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Rows: 1')
      }, waitForOptions)
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

      const TestComponent = defineComponent({
        setup() {
          const { table, query } = useDatastoreTable({
            datastoreOptions: {
              datasetId: ref('test-dataset'),
              index: 0,
            },
            columns: createDatastoreColumns({
              fields: mockDatastoreResponse.schema.fields,
            }),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')
            if (query.error.value)
              return h('div', `Error: ${query.error.value.message}`)

            const rows = table.getRowModel().rows

            return h('div', [
              h('div', `Total rows: ${rows.length}`),
              ...rows.map((row, idx) => h('div', { key: idx }, `Name: ${row.original.name}`)),
            ])
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      expect(wrapper.text()).toContain('Loading...')

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Total rows: 2')
        expect(wrapper.text()).toContain('Name: John')
        expect(wrapper.text()).toContain('Name: Jane')
      }, waitForOptions)

      expect(mockClient.queryDatastore).toHaveBeenCalledWith('test-dataset', 0, undefined)
    })

    it('should handle datastore query errors', async () => {
      vi.spyOn(mockClient, 'queryDatastore').mockRejectedValue(
        new Error('Query failed')
      )

      const TestComponent = defineComponent({
        setup() {
          const { table, query } = useDatastoreTable({
            datastoreOptions: {
              datasetId: ref('test-dataset'),
              index: 0,
            },
            columns: createDatastoreColumns(),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')
            if (query.error.value)
              return h('div', `Error: ${query.error.value.message}`)

            return h('div', 'Success')
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Error: Query failed')
      }, waitForOptions)
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

      const TestComponent = defineComponent({
        setup() {
          const { table, query } = useDatastoreTable({
            datastoreOptions: {
              datasetId: ref('test-dataset'),
              index: 0,
            },
            columns: createDatastoreColumns(),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')

            return h('div', `Rows: ${table.getRowModel().rows.length}`)
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Rows: 0')
      }, waitForOptions)
    })

    it('should support reactive columns', async () => {
      const mockDatastoreResponse = {
        results: [{ name: 'John', age: 30 }],
        count: 1,
        schema: {
          fields: [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'integer' },
          ],
        },
      }

      vi.spyOn(mockClient, 'queryDatastore').mockResolvedValue(mockDatastoreResponse)

      const TestComponent = defineComponent({
        setup() {
          const query = useDatastore({
            datasetId: ref('test-dataset'),
            index: 0,
          })

          const table = useTableFromQuery({
            query,
            data: () => query.data.value?.results ?? [],
            columns: () =>
              createDatastoreColumns({
                fields: query.data.value?.schema?.fields ?? [],
              }),
          })

          return () => {
            if (query.isLoading.value) return h('div', 'Loading...')

            return h('div', `Columns: ${table.getAllColumns().length}`)
          }
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Columns: 2')
      }, waitForOptions)
    })
  })
})
