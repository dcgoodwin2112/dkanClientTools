/**
 * Tests for useSqlQuery hooks
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import { useSqlQuery, useExecuteSqlQuery } from '../useSqlQuery'

describe('useSqlQuery', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }),
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useSqlQuery', () => {
    it('should execute SQL query successfully', async () => {
      const mockResult = [
        { id: 1, name: 'Record 1', value: 100 },
        { id: 2, name: 'Record 2', value: 200 },
      ]

      vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      function TestComponent() {
        const { data, isLoading } = useSqlQuery({
          query: 'SELECT * FROM datastore_12345 LIMIT 10',
        })

        if (isLoading) return <div>Loading...</div>
        if (!data) return null

        return (
          <div>
            <div>Rows: {data.length}</div>
            {data.map((row) => (
              <div key={row.id}>{row.name}</div>
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
        expect(screen.getByText('Rows: 2')).toBeInTheDocument()
        expect(screen.getByText('Record 1')).toBeInTheDocument()
        expect(screen.getByText('Record 2')).toBeInTheDocument()
      })

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

      function TestComponent() {
        const { data: stats, isLoading } = useSqlQuery({
          query: `
            SELECT
              COUNT(*) as total_records,
              AVG(value) as avg_value,
              MAX(value) as max_value,
              MIN(value) as min_value
            FROM datastore_12345
          `,
        })

        if (isLoading) return <div>Loading...</div>
        if (!stats?.[0]) return null

        const row = stats[0]
        return (
          <div>
            <div>Total: {row.total_records}</div>
            <div>Average: {row.avg_value}</div>
            <div>Max: {row.max_value}</div>
            <div>Min: {row.min_value}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Total: 1000')).toBeInTheDocument()
        expect(screen.getByText('Average: 150.5')).toBeInTheDocument()
        expect(screen.getByText('Max: 500')).toBeInTheDocument()
        expect(screen.getByText('Min: 10')).toBeInTheDocument()
      })
    })

    it('should handle enabled option', () => {
      const querySpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue([])

      function TestComponent() {
        const { data } = useSqlQuery({
          query: 'SELECT * FROM test',
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
      expect(querySpy).not.toHaveBeenCalled()
    })

    it('should not fetch when query is empty', () => {
      const querySpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue([])

      function TestComponent() {
        const { data } = useSqlQuery({
          query: '',
        })
        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(querySpy).not.toHaveBeenCalled()
    })

    it('should handle error state', async () => {
      const mockError = new Error('SQL syntax error')
      vi.spyOn(mockClient, 'querySql').mockRejectedValue(mockError)

      function TestComponent() {
        const { error, isLoading } = useSqlQuery({
          query: 'SELECT * FROM invalid_table',
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
        expect(screen.getByText('Error: SQL syntax error')).toBeInTheDocument()
      })
    })

    it('should query with show_db_columns option', async () => {
      const mockResult = [{ col1: 'value1' }]

      const querySpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      function TestComponent() {
        const { data } = useSqlQuery({
          query: 'SELECT * FROM datastore_12345',
          show_db_columns: true,
        })

        if (!data) return <div>Loading...</div>

        return <div>Success</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument()
      })

      expect(querySpy).toHaveBeenCalledWith({
        query: 'SELECT * FROM datastore_12345',
        show_db_columns: true,
      })
    })
  })

  describe('useExecuteSqlQuery', () => {
    it('should execute SQL query on demand', async () => {
      const user = userEvent.setup()
      const mockResult = [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' },
      ]

      const executeSpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      function TestComponent() {
        const executeSql = useExecuteSqlQuery()

        return (
          <div>
            <button
              onClick={() =>
                executeSql.mutate({
                  query: 'SELECT * FROM datastore_12345 WHERE active = true',
                })
              }
              disabled={executeSql.isPending}
            >
              {executeSql.isPending ? 'Executing...' : 'Execute'}
            </button>
            {executeSql.data && (
              <div>Results: {executeSql.data.length} rows</div>
            )}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Execute')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Results: 2 rows')).toBeInTheDocument()
      })

      expect(executeSpy).toHaveBeenCalledWith({
        query: 'SELECT * FROM datastore_12345 WHERE active = true',
      })
    })

    it('should handle dynamic query execution', async () => {
      const user = userEvent.setup()
      const mockResult = [{ count: 42 }]

      const executeSpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      function TestComponent() {
        const executeSql = useExecuteSqlQuery()
        const [query, setQuery] = React.useState('')

        return (
          <div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SQL query"
            />
            <button
              onClick={() => executeSql.mutate({ query })}
              disabled={!query || executeSql.isPending}
            >
              Run
            </button>
            {executeSql.data && <div>Data loaded</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const input = screen.getByPlaceholderText('SQL query')
      await user.type(input, 'SELECT COUNT(*) as count FROM test')

      const button = screen.getByText('Run')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Data loaded')).toBeInTheDocument()
      })

      expect(executeSpy).toHaveBeenCalledWith({
        query: 'SELECT COUNT(*) as count FROM test',
      })
    })

    it('should handle error during execution', async () => {
      const user = userEvent.setup()
      const mockError = new Error('Query timeout')

      vi.spyOn(mockClient, 'querySql').mockRejectedValue(mockError)

      function TestComponent() {
        const executeSql = useExecuteSqlQuery()

        return (
          <div>
            <button onClick={() => executeSql.mutate({ query: 'SELECT * FROM test' })}>
              Execute
            </button>
            {executeSql.isError && <div>Error: {executeSql.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Execute')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Error: Query timeout')).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResult = [{ id: 1 }]

      vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      function TestComponent() {
        const executeSql = useExecuteSqlQuery()

        return (
          <button
            onClick={() =>
              executeSql.mutate({ query: 'SELECT * FROM test' }, { onSuccess })
            }
          >
            Execute
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Execute')
      await user.click(button)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResult)
      })
    })

    it('should execute query with show_db_columns option', async () => {
      const user = userEvent.setup()
      const mockResult = [{ db_col: 'value' }]

      const executeSpy = vi.spyOn(mockClient, 'querySql').mockResolvedValue(mockResult)

      function TestComponent() {
        const executeSql = useExecuteSqlQuery()

        return (
          <button
            onClick={() =>
              executeSql.mutate({
                query: 'SELECT * FROM test',
                show_db_columns: true,
              })
            }
          >
            Execute
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Execute')
      await user.click(button)

      await waitFor(() => {
        expect(executeSpy).toHaveBeenCalledWith({
          query: 'SELECT * FROM test',
          show_db_columns: true,
        })
      })
    })

    it('should use mutateAsync for sequential operations', async () => {
      const user = userEvent.setup()
      const mockResult1 = [{ id: 1 }]
      const mockResult2 = [{ id: 2 }]

      vi.spyOn(mockClient, 'querySql')
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2)

      function TestComponent() {
        const executeSql = useExecuteSqlQuery()
        const [status, setStatus] = React.useState('')

        const handleExecute = async () => {
          try {
            const result1 = await executeSql.mutateAsync({ query: 'SELECT 1' })
            const result2 = await executeSql.mutateAsync({ query: 'SELECT 2' })
            setStatus(`Executed ${result1.length} and ${result2.length} queries`)
          } catch (error) {
            setStatus('Failed')
          }
        }

        return (
          <div>
            <button onClick={handleExecute}>Execute Multiple</button>
            {status && <div>Status: {status}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Execute Multiple')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Status: Executed 1 and 1 queries')).toBeInTheDocument()
      })
    })
  })
})
