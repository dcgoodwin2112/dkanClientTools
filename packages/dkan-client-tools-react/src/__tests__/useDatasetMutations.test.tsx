/**
 * Tests for Dataset Mutation hooks
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useCreateDataset,
  useUpdateDataset,
  usePatchDataset,
  useDeleteDataset,
} from '../useDatasetMutations'

describe('useDatasetMutations', () => {
  let mockClient: DkanClient

  const mockDataset = {
    identifier: 'test-123',
    title: 'Test Dataset',
    description: 'Test description',
    accessLevel: 'public' as const,
    modified: '2024-01-01',
    keyword: ['test', 'data'],
    publisher: { name: 'Test Publisher' },
    contactPoint: {
      '@type': 'vcard:Contact',
      fn: 'Test Contact',
      hasEmail: 'test@example.com',
    },
  }

  beforeEach(() => {
    mockClient = new DkanClient({
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }),
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useCreateDataset', () => {
    it('should create dataset successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      const createSpy = vi
        .spyOn(mockClient, 'createDataset')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const createDataset = useCreateDataset()

        return (
          <div>
            <button
              onClick={() => createDataset.mutate(mockDataset)}
              disabled={createDataset.isPending}
            >
              {createDataset.isPending ? 'Creating...' : 'Create Dataset'}
            </button>
            {createDataset.isSuccess && <div>Success: {createDataset.data.identifier}</div>}
            {createDataset.isError && <div>Error: {createDataset.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Create Dataset')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Success: test-123')).toBeInTheDocument()
      })

      expect(createSpy).toHaveBeenCalledWith(mockDataset)
    })

    it('should handle create errors', async () => {
      const user = userEvent.setup()
      vi.spyOn(mockClient, 'createDataset').mockRejectedValue(
        new Error('Validation failed: title is required')
      )

      function TestComponent() {
        const createDataset = useCreateDataset()

        return (
          <div>
            <button onClick={() => createDataset.mutate({} as any)}>Create</button>
            {createDataset.isError && <div>Error: {createDataset.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Create')
      await user.click(button)

      await waitFor(() => {
        expect(
          screen.getByText('Error: Validation failed: title is required')
        ).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      vi.spyOn(mockClient, 'createDataset').mockResolvedValue(mockResponse)

      function TestComponent() {
        const createDataset = useCreateDataset()

        return (
          <button onClick={() => createDataset.mutate(mockDataset, { onSuccess })}>
            Create
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Create')
      await user.click(button)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResponse)
        expect(call[1]).toEqual(mockDataset)
      })
    })

    it('should support mutateAsync for async/await', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      vi.spyOn(mockClient, 'createDataset').mockResolvedValue(mockResponse)

      function TestComponent() {
        const createDataset = useCreateDataset()
        const [result, setResult] = React.useState<string>('')

        const handleCreate = async () => {
          try {
            const response = await createDataset.mutateAsync(mockDataset)
            setResult(`Created: ${response.identifier}`)
          } catch (error) {
            setResult('Failed')
          }
        }

        return (
          <div>
            <button onClick={handleCreate}>Create</button>
            {result && <div>Result: {result}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Create')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Result: Created: test-123')).toBeInTheDocument()
      })
    })

    it('should create dataset with distributions', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'dataset-with-distributions',
      }

      const createSpy = vi
        .spyOn(mockClient, 'createDataset')
        .mockResolvedValue(mockResponse)

      const datasetWithDistributions = {
        ...mockDataset,
        identifier: 'dataset-with-distributions',
        distribution: [
          {
            identifier: 'dist-1',
            title: 'CSV Download',
            downloadURL: 'https://example.com/data.csv',
            mediaType: 'text/csv',
          },
          {
            identifier: 'dist-2',
            title: 'JSON API',
            accessURL: 'https://example.com/api/data',
            mediaType: 'application/json',
          },
        ],
      }

      function TestComponent() {
        const createDataset = useCreateDataset()

        return (
          <div>
            <button onClick={() => createDataset.mutate(datasetWithDistributions)}>
              Create with Distributions
            </button>
            {createDataset.isSuccess && <div>Created</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Create with Distributions')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Created')).toBeInTheDocument()
      })

      expect(createSpy).toHaveBeenCalledWith(datasetWithDistributions)
    })
  })

  describe('useUpdateDataset', () => {
    it('should update dataset successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      const updateSpy = vi
        .spyOn(mockClient, 'updateDataset')
        .mockResolvedValue(mockResponse)

      const updatedDataset = {
        ...mockDataset,
        title: 'Updated Title',
        description: 'Updated description',
      }

      function TestComponent() {
        const updateDataset = useUpdateDataset()

        return (
          <div>
            <button
              onClick={() =>
                updateDataset.mutate({
                  identifier: 'test-123',
                  dataset: updatedDataset,
                })
              }
              disabled={updateDataset.isPending}
            >
              {updateDataset.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            {updateDataset.isSuccess && <div>Updated successfully</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Save Changes')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Updated successfully')).toBeInTheDocument()
      })

      expect(updateSpy).toHaveBeenCalledWith('test-123', updatedDataset)
    })

    it('should handle update errors', async () => {
      const user = userEvent.setup()
      vi.spyOn(mockClient, 'updateDataset').mockRejectedValue(
        new Error('Dataset not found')
      )

      function TestComponent() {
        const updateDataset = useUpdateDataset()

        return (
          <div>
            <button
              onClick={() =>
                updateDataset.mutate({
                  identifier: 'test-123',
                  dataset: mockDataset,
                })
              }
            >
              Update
            </button>
            {updateDataset.isError && <div>Error: {updateDataset.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Update')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Error: Dataset not found')).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback with variables', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      vi.spyOn(mockClient, 'updateDataset').mockResolvedValue(mockResponse)

      function TestComponent() {
        const updateDataset = useUpdateDataset()

        return (
          <button
            onClick={() =>
              updateDataset.mutate(
                {
                  identifier: 'test-123',
                  dataset: mockDataset,
                },
                { onSuccess }
              )
            }
          >
            Update
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Update')
      await user.click(button)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResponse)
        expect(call[1]).toEqual(expect.objectContaining({ identifier: 'test-123' }))
      })
    })

    it('should update dataset with new distributions', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      const updateSpy = vi
        .spyOn(mockClient, 'updateDataset')
        .mockResolvedValue(mockResponse)

      const updatedDataset = {
        ...mockDataset,
        distribution: [
          {
            identifier: 'new-dist',
            title: 'New Distribution',
            downloadURL: 'https://example.com/new-data.csv',
          },
        ],
      }

      function TestComponent() {
        const updateDataset = useUpdateDataset()

        return (
          <div>
            <button
              onClick={() =>
                updateDataset.mutate({
                  identifier: 'test-123',
                  dataset: updatedDataset,
                })
              }
            >
              Update
            </button>
            {updateDataset.isSuccess && <div>Distributions updated</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Update')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Distributions updated')).toBeInTheDocument()
      })

      expect(updateSpy).toHaveBeenCalledWith('test-123', updatedDataset)
    })
  })

  describe('usePatchDataset', () => {
    it('should patch dataset title successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      const patchSpy = vi
        .spyOn(mockClient, 'patchDataset')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const patchDataset = usePatchDataset()
        const [title, setTitle] = React.useState('New Title')

        return (
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
            <button
              onClick={() =>
                patchDataset.mutate({
                  identifier: 'test-123',
                  partialDataset: { title },
                })
              }
              disabled={patchDataset.isPending}
            >
              {patchDataset.isPending ? 'Updating...' : 'Update Title'}
            </button>
            {patchDataset.isSuccess && <div>Title updated</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Update Title')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Title updated')).toBeInTheDocument()
      })

      expect(patchSpy).toHaveBeenCalledWith('test-123', { title: 'New Title' })
    })

    it('should patch multiple fields', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      const patchSpy = vi
        .spyOn(mockClient, 'patchDataset')
        .mockResolvedValue(mockResponse)

      const partialUpdate = {
        title: 'Updated Title',
        description: 'Updated description',
        keyword: ['updated', 'keywords'],
      }

      function TestComponent() {
        const patchDataset = usePatchDataset()

        return (
          <div>
            <button
              onClick={() =>
                patchDataset.mutate({
                  identifier: 'test-123',
                  partialDataset: partialUpdate,
                })
              }
            >
              Update Multiple Fields
            </button>
            {patchDataset.isSuccess && <div>Fields updated</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Update Multiple Fields')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Fields updated')).toBeInTheDocument()
      })

      expect(patchSpy).toHaveBeenCalledWith('test-123', partialUpdate)
    })

    it('should handle patch errors', async () => {
      const user = userEvent.setup()
      vi.spyOn(mockClient, 'patchDataset').mockRejectedValue(
        new Error('Invalid field value')
      )

      function TestComponent() {
        const patchDataset = usePatchDataset()

        return (
          <div>
            <button
              onClick={() =>
                patchDataset.mutate({
                  identifier: 'test-123',
                  partialDataset: { title: '' },
                })
              }
            >
              Patch
            </button>
            {patchDataset.isError && <div>Error: {patchDataset.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Patch')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Error: Invalid field value')).toBeInTheDocument()
      })
    })

    it('should patch accessLevel field', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      const patchSpy = vi
        .spyOn(mockClient, 'patchDataset')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const patchDataset = usePatchDataset()

        return (
          <div>
            <button
              onClick={() =>
                patchDataset.mutate({
                  identifier: 'test-123',
                  partialDataset: { accessLevel: 'restricted public' },
                })
              }
            >
              Change Access Level
            </button>
            {patchDataset.isSuccess && <div>Access level changed</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Change Access Level')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Access level changed')).toBeInTheDocument()
      })

      expect(patchSpy).toHaveBeenCalledWith('test-123', {
        accessLevel: 'restricted public',
      })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      vi.spyOn(mockClient, 'patchDataset').mockResolvedValue(mockResponse)

      function TestComponent() {
        const patchDataset = usePatchDataset()

        return (
          <button
            onClick={() =>
              patchDataset.mutate(
                {
                  identifier: 'test-123',
                  partialDataset: { title: 'New Title' },
                },
                { onSuccess }
              )
            }
          >
            Patch
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Patch')
      await user.click(button)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResponse)
        expect(call[1]).toEqual(expect.objectContaining({ identifier: 'test-123' }))
      })
    })
  })

  describe('useDeleteDataset', () => {
    it('should delete dataset successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = { message: 'Dataset deleted successfully' }

      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDataset')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDataset = useDeleteDataset()

        return (
          <div>
            <button
              onClick={() => deleteDataset.mutate('test-123')}
              disabled={deleteDataset.isPending}
            >
              {deleteDataset.isPending ? 'Deleting...' : 'Delete Dataset'}
            </button>
            {deleteDataset.isSuccess && <div>Message: {deleteDataset.data.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Delete Dataset')
      await user.click(button)

      await waitFor(() => {
        expect(
          screen.getByText('Message: Dataset deleted successfully')
        ).toBeInTheDocument()
      })

      expect(deleteSpy).toHaveBeenCalledWith('test-123')
    })

    it('should handle delete errors', async () => {
      const user = userEvent.setup()
      vi.spyOn(mockClient, 'deleteDataset').mockRejectedValue(
        new Error('Dataset has dependencies')
      )

      function TestComponent() {
        const deleteDataset = useDeleteDataset()

        return (
          <div>
            <button onClick={() => deleteDataset.mutate('test-123')}>Delete</button>
            {deleteDataset.isError && <div>Error: {deleteDataset.error.message}</div>}
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
        expect(screen.getByText('Error: Dataset has dependencies')).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = { message: 'Deleted' }

      vi.spyOn(mockClient, 'deleteDataset').mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDataset = useDeleteDataset()

        return (
          <button onClick={() => deleteDataset.mutate('test-123', { onSuccess })}>
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
        expect(call[1]).toEqual('test-123')
      })
    })

    it('should support confirmation dialog pattern', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn().mockReturnValue(true)

      const mockResponse = { message: 'Deleted' }
      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDataset')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDataset = useDeleteDataset()

        const handleDelete = () => {
          if (confirm('Are you sure you want to delete this dataset?')) {
            deleteDataset.mutate('test-123')
          }
        }

        return (
          <div>
            <button onClick={handleDelete}>Delete</button>
            {deleteDataset.isSuccess && <div>Deleted</div>}
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
        expect(screen.getByText('Deleted')).toBeInTheDocument()
      })

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this dataset?'
      )
      expect(deleteSpy).toHaveBeenCalledWith('test-123')
    })

    it('should support bulk delete with mutateAsync', async () => {
      const user = userEvent.setup()
      const mockResponse = { message: 'Deleted' }

      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDataset')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDataset = useDeleteDataset()
        const [deletedCount, setDeletedCount] = React.useState(0)

        const handleBulkDelete = async () => {
          const ids = ['dataset-1', 'dataset-2', 'dataset-3']
          for (const id of ids) {
            try {
              await deleteDataset.mutateAsync(id)
              setDeletedCount((prev) => prev + 1)
            } catch (error) {
              console.error('Failed to delete', id)
            }
          }
        }

        return (
          <div>
            <button onClick={handleBulkDelete}>Delete All</button>
            <div>Deleted: {deletedCount}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Delete All')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Deleted: 3')).toBeInTheDocument()
      })

      expect(deleteSpy).toHaveBeenCalledTimes(3)
      expect(deleteSpy).toHaveBeenCalledWith('dataset-1')
      expect(deleteSpy).toHaveBeenCalledWith('dataset-2')
      expect(deleteSpy).toHaveBeenCalledWith('dataset-3')
    })

    it('should handle bulk delete with partial failures', async () => {
      const user = userEvent.setup()
      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDataset')
        .mockImplementation(async (id) => {
          if (id === 'dataset-2') {
            throw new Error('Delete failed')
          }
          return { message: 'Deleted' }
        })

      function TestComponent() {
        const deleteDataset = useDeleteDataset()
        const [results, setResults] = React.useState<string[]>([])

        const handleBulkDelete = async () => {
          const ids = ['dataset-1', 'dataset-2', 'dataset-3']
          for (const id of ids) {
            try {
              await deleteDataset.mutateAsync(id)
              setResults((prev) => [...prev, `${id}: success`])
            } catch (error) {
              setResults((prev) => [...prev, `${id}: failed`])
            }
          }
        }

        return (
          <div>
            <button onClick={handleBulkDelete}>Delete All</button>
            {results.map((result, i) => (
              <div key={i}>{result}</div>
            ))}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Delete All')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('dataset-1: success')).toBeInTheDocument()
        expect(screen.getByText('dataset-2: failed')).toBeInTheDocument()
        expect(screen.getByText('dataset-3: success')).toBeInTheDocument()
      })

      expect(deleteSpy).toHaveBeenCalledTimes(3)
    })
  })
})
