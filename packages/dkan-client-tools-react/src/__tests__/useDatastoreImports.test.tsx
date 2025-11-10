/**
 * Tests for useDatastoreImports hooks
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useDatastoreImports,
  useDatastoreImport,
  useDatastoreStatistics,
  useTriggerDatastoreImport,
  useDeleteDatastore,
} from '../useDatastoreImports'

describe('useDatastoreImports', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }),
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useDatastoreImports', () => {
    it('should list all datastore imports successfully', async () => {
      const mockImports = {
        'resource-1': {
          status: 'done',
          importer: {
            state: {
              num_records: 1000,
            },
          },
        },
        'resource-2': {
          status: 'in_progress',
          file_fetcher: {
            state: {
              file_path: '/tmp/data.csv',
            },
          },
        },
      }

      vi.spyOn(mockClient, 'listDatastoreImports').mockResolvedValue(mockImports)

      function TestComponent() {
        const { data: imports, isLoading } = useDatastoreImports()

        if (isLoading) return <div>Loading...</div>
        if (!imports) return null

        return (
          <div>
            <div>Count: {Object.keys(imports).length}</div>
            {Object.entries(imports).map(([id, importData]) => (
              <div key={id}>
                {id}: {importData.status}
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
        expect(screen.getByText('Count: 2')).toBeInTheDocument()
        expect(screen.getByText('resource-1: done')).toBeInTheDocument()
        expect(screen.getByText('resource-2: in_progress')).toBeInTheDocument()
      })

      expect(mockClient.listDatastoreImports).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state', () => {
      vi.spyOn(mockClient, 'listDatastoreImports').mockImplementation(
        () => new Promise(() => {})
      )

      function TestComponent() {
        const { data, isLoading } = useDatastoreImports()

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
      const mockError = new Error('Failed to list imports')
      vi.spyOn(mockClient, 'listDatastoreImports').mockRejectedValue(mockError)

      function TestComponent() {
        const { error, isLoading } = useDatastoreImports()

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
        expect(screen.getByText('Error: Failed to list imports')).toBeInTheDocument()
      })
    })

    it('should handle enabled option', () => {
      const importsSpy = vi.spyOn(mockClient, 'listDatastoreImports').mockResolvedValue({})

      function TestComponent() {
        const { data } = useDatastoreImports({ enabled: false })

        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(importsSpy).not.toHaveBeenCalled()
    })

    it('should handle empty imports object', async () => {
      vi.spyOn(mockClient, 'listDatastoreImports').mockResolvedValue({})

      function TestComponent() {
        const { data, isLoading } = useDatastoreImports()

        if (isLoading) return <div>Loading...</div>
        if (!data || Object.keys(data).length === 0) return <div>No imports</div>

        return <div>Has imports</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('No imports')).toBeInTheDocument()
      })
    })
  })

  describe('useDatastoreImport', () => {
    it('should get specific import from imports list', async () => {
      const mockImports = {
        'resource-1': {
          status: 'done',
          importer: {
            state: {
              num_records: 500,
            },
          },
        },
        'resource-2': {
          status: 'in_progress',
        },
      }

      vi.spyOn(mockClient, 'listDatastoreImports').mockResolvedValue(mockImports)

      function TestComponent() {
        const { data: importData, isLoading } = useDatastoreImport({
          identifier: 'resource-1',
        })

        if (isLoading) return <div>Loading...</div>
        if (!importData) return <div>No import found</div>

        return (
          <div>
            <div>Status: {importData.status}</div>
            <div>Records: {importData.importer?.state?.num_records}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Status: done')).toBeInTheDocument()
        expect(screen.getByText('Records: 500')).toBeInTheDocument()
      })
    })

    it('should return undefined when import not found', async () => {
      const mockImports = {
        'resource-1': {
          status: 'done',
        },
      }

      vi.spyOn(mockClient, 'listDatastoreImports').mockResolvedValue(mockImports)

      function TestComponent() {
        const { data: importData, isLoading } = useDatastoreImport({
          identifier: 'nonexistent',
        })

        if (isLoading) return <div>Loading...</div>
        if (!importData) return <div>Not found</div>

        return <div>Found</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Not found')).toBeInTheDocument()
      })
    })

    it('should handle enabled option', () => {
      const importsSpy = vi.spyOn(mockClient, 'listDatastoreImports').mockResolvedValue({})

      function TestComponent() {
        const { data } = useDatastoreImport({
          identifier: 'resource-1',
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
      expect(importsSpy).not.toHaveBeenCalled()
    })

    it('should show import with file fetcher state', async () => {
      const mockImports = {
        'resource-1': {
          status: 'fetching',
          file_fetcher: {
            state: {
              file_path: '/tmp/dataset.csv',
              total_bytes: 1024000,
            },
          },
        },
      }

      vi.spyOn(mockClient, 'listDatastoreImports').mockResolvedValue(mockImports)

      function TestComponent() {
        const { data: importData } = useDatastoreImport({
          identifier: 'resource-1',
        })

        if (!importData) return <div>Loading...</div>

        return (
          <div>
            <div>Status: {importData.status}</div>
            <div>File: {importData.file_fetcher?.state?.file_path}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Status: fetching')).toBeInTheDocument()
        expect(screen.getByText('File: /tmp/dataset.csv')).toBeInTheDocument()
      })
    })
  })

  describe('useDatastoreStatistics', () => {
    it('should fetch datastore statistics successfully', async () => {
      const mockStats = {
        numOfRows: 1000,
        numOfColumns: 5,
        columns: ['id', 'name', 'email', 'city', 'state'],
      }

      vi.spyOn(mockClient, 'getDatastoreStatistics').mockResolvedValue(mockStats)

      function TestComponent() {
        const { data: stats, isLoading } = useDatastoreStatistics({
          identifier: 'resource-123',
        })

        if (isLoading) return <div>Loading...</div>
        if (!stats) return null

        return (
          <div>
            <div>Rows: {stats.numOfRows}</div>
            <div>Columns: {stats.numOfColumns}</div>
            <div>Column names: {stats.columns.join(', ')}</div>
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
        expect(screen.getByText('Rows: 1000')).toBeInTheDocument()
        expect(screen.getByText('Columns: 5')).toBeInTheDocument()
        expect(screen.getByText('Column names: id, name, email, city, state')).toBeInTheDocument()
      })

      expect(mockClient.getDatastoreStatistics).toHaveBeenCalledWith('resource-123')
    })

    it('should handle loading state', () => {
      vi.spyOn(mockClient, 'getDatastoreStatistics').mockImplementation(
        () => new Promise(() => {})
      )

      function TestComponent() {
        const { data, isLoading } = useDatastoreStatistics({
          identifier: 'resource-123',
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
      const mockError = new Error('Failed to fetch statistics')
      vi.spyOn(mockClient, 'getDatastoreStatistics').mockRejectedValue(mockError)

      function TestComponent() {
        const { error, isLoading } = useDatastoreStatistics({
          identifier: 'resource-123',
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
        expect(screen.getByText('Error: Failed to fetch statistics')).toBeInTheDocument()
      })
    })

    it('should handle enabled option', () => {
      const statsSpy = vi.spyOn(mockClient, 'getDatastoreStatistics').mockResolvedValue({
        numOfRows: 0,
        numOfColumns: 0,
        columns: [],
      })

      function TestComponent() {
        const { data } = useDatastoreStatistics({
          identifier: 'resource-123',
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
      expect(statsSpy).not.toHaveBeenCalled()
    })

    it('should not fetch when identifier is empty', () => {
      const statsSpy = vi.spyOn(mockClient, 'getDatastoreStatistics').mockResolvedValue({
        numOfRows: 0,
        numOfColumns: 0,
        columns: [],
      })

      function TestComponent() {
        const { data } = useDatastoreStatistics({
          identifier: '',
        })

        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(statsSpy).not.toHaveBeenCalled()
    })

    it('should handle large dataset statistics', async () => {
      const mockStats = {
        numOfRows: 1000000,
        numOfColumns: 50,
        columns: Array.from({ length: 50 }, (_, i) => `column_${i + 1}`),
      }

      vi.spyOn(mockClient, 'getDatastoreStatistics').mockResolvedValue(mockStats)

      function TestComponent() {
        const { data: stats } = useDatastoreStatistics({
          identifier: 'large-dataset',
        })

        if (!stats) return <div>Loading...</div>

        return (
          <div>
            <div>Rows: {stats.numOfRows.toLocaleString()}</div>
            <div>Columns: {stats.numOfColumns}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Rows: 1,000,000')).toBeInTheDocument()
        expect(screen.getByText('Columns: 50')).toBeInTheDocument()
      })
    })
  })

  describe('useTriggerDatastoreImport', () => {
    it('should trigger import successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        status: 'queued',
        file_fetcher: {
          state: null,
        },
      }

      const triggerSpy = vi
        .spyOn(mockClient, 'triggerDatastoreImport')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const triggerImport = useTriggerDatastoreImport()

        return (
          <div>
            <button
              onClick={() => triggerImport.mutate({ resource_id: 'resource-123' })}
              disabled={triggerImport.isPending}
            >
              {triggerImport.isPending ? 'Starting...' : 'Import'}
            </button>
            {triggerImport.isSuccess && <div>Import started: {triggerImport.data.status}</div>}
            {triggerImport.isError && <div>Error: {triggerImport.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Import')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Import started: queued')).toBeInTheDocument()
      })

      expect(triggerSpy).toHaveBeenCalledWith({ resource_id: 'resource-123' })
    })

    it('should handle error during import trigger', async () => {
      const user = userEvent.setup()
      const mockError = new Error('Import failed to start')

      vi.spyOn(mockClient, 'triggerDatastoreImport').mockRejectedValue(mockError)

      function TestComponent() {
        const triggerImport = useTriggerDatastoreImport()

        return (
          <div>
            <button onClick={() => triggerImport.mutate({ resource_id: 'resource-123' })}>
              Import
            </button>
            {triggerImport.isError && <div>Error: {triggerImport.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Import')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Error: Import failed to start')).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = {
        status: 'queued',
      }

      vi.spyOn(mockClient, 'triggerDatastoreImport').mockResolvedValue(mockResponse)

      function TestComponent() {
        const triggerImport = useTriggerDatastoreImport()

        return (
          <button
            onClick={() =>
              triggerImport.mutate({ resource_id: 'resource-123' }, { onSuccess })
            }
          >
            Import
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Import')
      await user.click(button)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResponse)
      })
    })

    it('should trigger import with options', async () => {
      const user = userEvent.setup()
      const mockResponse = { status: 'queued' }

      const triggerSpy = vi
        .spyOn(mockClient, 'triggerDatastoreImport')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const triggerImport = useTriggerDatastoreImport()

        return (
          <button
            onClick={() =>
              triggerImport.mutate({
                resource_id: 'resource-123',
                deferred: false,
              })
            }
          >
            Import Now
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Import Now')
      await user.click(button)

      await waitFor(() => {
        expect(triggerSpy).toHaveBeenCalledWith({
          resource_id: 'resource-123',
          deferred: false,
        })
      })
    })

    it('should use mutateAsync for async workflow', async () => {
      const user = userEvent.setup()
      const mockResponse = { status: 'queued' }

      vi.spyOn(mockClient, 'triggerDatastoreImport').mockResolvedValue(mockResponse)

      function TestComponent() {
        const triggerImport = useTriggerDatastoreImport()
        const [message, setMessage] = React.useState('')

        const handleImport = async () => {
          try {
            const result = await triggerImport.mutateAsync({ resource_id: 'resource-123' })
            setMessage(`Import ${result.status}`)
          } catch (error) {
            setMessage('Failed')
          }
        }

        return (
          <div>
            <button onClick={handleImport}>Import</button>
            {message && <div>{message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Import')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Import queued')).toBeInTheDocument()
      })
    })
  })

  describe('useDeleteDatastore', () => {
    it('should delete datastore successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = { message: 'Datastore deleted' }

      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDatastore')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDatastore = useDeleteDatastore()

        return (
          <div>
            <button
              onClick={() => deleteDatastore.mutate('resource-123')}
              disabled={deleteDatastore.isPending}
            >
              {deleteDatastore.isPending ? 'Deleting...' : 'Delete'}
            </button>
            {deleteDatastore.isSuccess && <div>{deleteDatastore.data.message}</div>}
            {deleteDatastore.isError && <div>Error: {deleteDatastore.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Delete')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Datastore deleted')).toBeInTheDocument()
      })

      expect(deleteSpy).toHaveBeenCalledWith('resource-123')
    })

    it('should handle error during delete', async () => {
      const user = userEvent.setup()
      const mockError = new Error('Delete failed')

      vi.spyOn(mockClient, 'deleteDatastore').mockRejectedValue(mockError)

      function TestComponent() {
        const deleteDatastore = useDeleteDatastore()

        return (
          <div>
            <button onClick={() => deleteDatastore.mutate('resource-123')}>Delete</button>
            {deleteDatastore.isError && <div>Error: {deleteDatastore.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Delete')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Error: Delete failed')).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = { message: 'Deleted' }

      vi.spyOn(mockClient, 'deleteDatastore').mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDatastore = useDeleteDatastore()

        return (
          <button onClick={() => deleteDatastore.mutate('resource-123', { onSuccess })}>
            Delete
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Delete')
      await user.click(button)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResponse)
        expect(call[1]).toBe('resource-123')
      })
    })

    it('should handle confirmation dialog pattern', async () => {
      const user = userEvent.setup()
      const mockResponse = { message: 'Deleted' }

      vi.spyOn(mockClient, 'deleteDatastore').mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDatastore = useDeleteDatastore()
        const [confirmed, setConfirmed] = React.useState(false)

        const handleDelete = () => {
          setConfirmed(true)
          deleteDatastore.mutate('resource-123')
        }

        return (
          <div>
            <button onClick={handleDelete}>Delete</button>
            {confirmed && <div>Confirmed</div>}
            {deleteDatastore.isSuccess && <div>Deleted</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Delete')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Confirmed')).toBeInTheDocument()
        expect(screen.getByText('Deleted')).toBeInTheDocument()
      })
    })

    it('should use mutateAsync for async workflow', async () => {
      const user = userEvent.setup()
      const mockResponse = { message: 'Deleted' }

      vi.spyOn(mockClient, 'deleteDatastore').mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDatastore = useDeleteDatastore()
        const [status, setStatus] = React.useState('')

        const handleDelete = async () => {
          try {
            await deleteDatastore.mutateAsync('resource-123')
            setStatus('Success')
          } catch (error) {
            setStatus('Failed')
          }
        }

        return (
          <div>
            <button onClick={handleDelete}>Delete</button>
            {status && <div>Status: {status}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Delete')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Status: Success')).toBeInTheDocument()
      })
    })
  })
})
