/**
 * Tests for useSqlQuery composables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useSqlQuery, useExecuteSqlQuery } from '../useSqlQuery'
import { waitForOptions } from './setup'

describe('useSqlQuery', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    // Create QueryClient from Vue Query
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 0 },
      },
    })

    // Create DkanClient with the Vue Query QueryClient
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
      queryClient, // Pass the QueryClient from vue-query!
    })
  })

  describe('useSqlQuery', () => {
    it('should execute SQL query successfully', async () => {
      const mockResult = [
        { id: 1, name: 'Record 1', value: 100 },
        { id: 2, name: 'Record 2', value: 200 },
      ]

      vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      const TestComponent = defineComponent({
        setup() {
          const { data, isLoading } = useSqlQuery({
            query: ref('SELECT * FROM datastore_12345 LIMIT 10'),
          })

          return () => {
            if (isLoading.value) return h('div', 'Loading...')
            if (!data.value) return null

            return h('div', [
              h('div', `Rows: ${data.value.length}`),
              ...data.value.map((row: any) => h('div', { key: row.id }, row.name)),
            ])
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
        expect(wrapper.text()).toContain('Rows: 2')
        expect(wrapper.text()).toContain('Record 1')
        expect(wrapper.text()).toContain('Record 2')
      }, waitForOptions)

      expect(mockClient.querySql).toHaveBeenCalledWith({
        query: 'SELECT * FROM datastore_12345 LIMIT 10',
        show_db_columns: undefined,
      })
    })

    it('should execute aggregate query successfully', async () => {
      const mockStats = [
        {
          total_records: 1000,
          avg_value: 150.5,
          max_value: 500,
          min_value: 10,
        },
      ]

      vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockStats)

      const TestComponent = defineComponent({
        setup() {
          const { data: stats, isLoading } = useSqlQuery({
            query: ref(`
              SELECT
                COUNT(*) as total_records,
                AVG(value) as avg_value,
                MAX(value) as max_value,
                MIN(value) as min_value
              FROM datastore_12345
            `),
          })

          return () => {
            if (isLoading.value) return h('div', 'Loading...')
            if (!stats.value?.[0]) return null

            const row = stats.value[0]
            return h('div', [
              h('div', `Total: ${row.total_records}`),
              h('div', `Average: ${row.avg_value}`),
              h('div', `Max: ${row.max_value}`),
              h('div', `Min: ${row.min_value}`),
            ])
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
        expect(wrapper.text()).toContain('Total: 1000')
        expect(wrapper.text()).toContain('Average: 150.5')
        expect(wrapper.text()).toContain('Max: 500')
        expect(wrapper.text()).toContain('Min: 10')
      }, waitForOptions)
    })

    it('should handle enabled option', () => {
      const querySpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue([])

      const TestComponent = defineComponent({
        setup() {
          const { data } = useSqlQuery({
            query: ref('SELECT * FROM test'),
            enabled: ref(false),
          })
          return () => h('div', `Data: ${data.value ? 'yes' : 'no'}`)
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      expect(wrapper.text()).toBe('Data: no')
      expect(querySpy).not.toHaveBeenCalled()
    })

    it('should not fetch when query is empty', () => {
      const querySpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue([])

      const TestComponent = defineComponent({
        setup() {
          const { data } = useSqlQuery({
            query: ref(''),
          })
          return () => h('div', `Data: ${data.value ? 'yes' : 'no'}`)
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      expect(wrapper.text()).toBe('Data: no')
      expect(querySpy).not.toHaveBeenCalled()
    })

    it('should handle error state', async () => {
      const mockError = new Error('SQL syntax error')
      vi.spyOn(mockClient, 'querySql').mockRejectedValue(mockError)

      const TestComponent = defineComponent({
        setup() {
          const { error, isLoading } = useSqlQuery({
            query: ref('SELECT * FROM invalid_table'),
          })

          return () => {
            if (isLoading.value) return h('div', 'Loading...')
            if (error.value) return h('div', `Error: ${error.value.message}`)

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
        expect(wrapper.text()).toBe('Error: SQL syntax error')
      }, waitForOptions)
    })

    it('should query with show_db_columns option', async () => {
      const mockResult = [{ col1: 'value1' }]

      const querySpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      const TestComponent = defineComponent({
        setup() {
          const { data } = useSqlQuery({
            query: ref('SELECT * FROM datastore_12345'),
            show_db_columns: ref(true),
          })

          return () => (data.value ? h('div', 'Success') : h('div', 'Loading...'))
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
        expect(wrapper.text()).toBe('Success')
      }, waitForOptions)

      expect(querySpy).toHaveBeenCalledWith({
        query: 'SELECT * FROM datastore_12345',
        show_db_columns: true,
      })
    })
  })

  describe('useExecuteSqlQuery', () => {
    it('should execute SQL query on demand', async () => {
      const mockResult = [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' },
      ]

      const executeSpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      const TestComponent = defineComponent({
        setup() {
          const executeSql = useExecuteSqlQuery()

          const handleExecute = () => {
            executeSql.mutate({
              query: 'SELECT * FROM datastore_12345 WHERE active = true',
            })
          }

          return () => h('div', [
            h(
              'button',
              {
                onClick: handleExecute,
                disabled: executeSql.isPending.value,
              },
              executeSql.isPending.value ? 'Executing...' : 'Execute'
            ),
            executeSql.data.value ? h('div', `Results: ${executeSql.data.value.length} rows`) : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Results: 2 rows')
      }, waitForOptions)

      expect(executeSpy).toHaveBeenCalledWith({
        query: 'SELECT * FROM datastore_12345 WHERE active = true',
      })
    })

    it('should handle dynamic query execution', async () => {
      const mockResult = [{ count: 42 }]

      const executeSpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      const testQuery = 'SELECT COUNT(*) as count FROM test'

      const TestComponent = defineComponent({
        setup() {
          const executeSql = useExecuteSqlQuery()

          const handleRun = () => {
            executeSql.mutate({ query: testQuery })
          }

          return () => h('div', [
            h(
              'button',
              {
                onClick: handleRun,
                disabled: executeSql.isPending.value,
              },
              'Run'
            ),
            executeSql.data.value ? h('div', 'Data loaded') : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Data loaded')
      }, waitForOptions)

      expect(executeSpy).toHaveBeenCalledWith({ query: testQuery })
    })

    it('should handle error during execution', async () => {
      const mockError = new Error('Query timeout')

      vi.spyOn(mockClient, 'querySql').mockRejectedValue(mockError)

      const TestComponent = defineComponent({
        setup() {
          const executeSql = useExecuteSqlQuery()

          return () => h('div', [
            h('button', { onClick: () => executeSql.mutate({ query: 'SELECT * FROM test' }) }, 'Execute'),
            executeSql.isError.value ? h('div', `Error: ${executeSql.error.value?.message}`) : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Error: Query timeout')
      }, waitForOptions)
    })

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const mockResult = [{ id: 1 }]

      vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      const TestComponent = defineComponent({
        setup() {
          const executeSql = useExecuteSqlQuery()

          return () =>
            h(
              'button',
              {
                onClick: () => executeSql.mutate({ query: 'SELECT * FROM test' }, { onSuccess }),
              },
              'Execute'
            )
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResult)
      }, waitForOptions)
    })

    it('should execute query with show_db_columns option', async () => {
      const mockResult = [{ db_col: 'value' }]

      const executeSpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      const TestComponent = defineComponent({
        setup() {
          const executeSql = useExecuteSqlQuery()

          return () =>
            h(
              'button',
              {
                onClick: () =>
                  executeSql.mutate({
                    query: 'SELECT * FROM test',
                    show_db_columns: true,
                  }),
              },
              'Execute'
            )
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(executeSpy).toHaveBeenCalledWith({
          query: 'SELECT * FROM test',
          show_db_columns: true,
        })
      }, waitForOptions)
    })

    it('should use mutateAsync for sequential operations', async () => {
      const mockResult1 = [{ id: 1 }]
      const mockResult2 = [{ id: 2 }]

      vi.spyOn(mockClient, 'querySql')
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2)

      const TestComponent = defineComponent({
        setup() {
          const executeSql = useExecuteSqlQuery()
          const status = ref('')

          const handleExecute = async () => {
            try {
              const result1 = await executeSql.mutateAsync({ query: 'SELECT 1' })
              const result2 = await executeSql.mutateAsync({ query: 'SELECT 2' })
              status.value = `Executed ${result1.length} and ${result2.length} queries`
            } catch (error) {
              status.value = 'Failed'
            }
          }

          return () => h('div', [
            h('button', { onClick: handleExecute }, 'Execute Multiple'),
            status.value ? h('div', `Status: ${status.value}`) : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await flushPromises()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Status: Executed 1 and 1 queries')
      }, waitForOptions)
    })
  })
})
