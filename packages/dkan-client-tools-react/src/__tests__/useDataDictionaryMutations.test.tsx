/**
 * Tests for Data Dictionary Mutation hooks
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useCreateDataDictionary,
  useUpdateDataDictionary,
  useDeleteDataDictionary,
} from '../useDataDictionaryMutations'

describe('useDataDictionaryMutations', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useCreateDataDictionary', () => {
    it('should create data dictionary successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'data-dictionary',
        identifier: 'dict-123',
      }

      const createSpy = vi
        .spyOn(mockClient, 'createDataDictionary')
        .mockResolvedValue(mockResponse)

      const mockDictionary = {
        identifier: 'dict-123',
        data: {
          title: 'Test Dictionary',
          fields: [
            { name: 'id', type: 'integer' as const, title: 'ID' },
            { name: 'name', type: 'string' as const, title: 'Name' },
          ],
        },
      }

      function TestComponent() {
        const createDict = useCreateDataDictionary()

        return (
          <div>
            <button
              onClick={() => createDict.mutate(mockDictionary)}
              disabled={createDict.isPending}
            >
              {createDict.isPending ? 'Creating...' : 'Create Dictionary'}
            </button>
            {createDict.isSuccess && <div>Success: {createDict.data.identifier}</div>}
            {createDict.isError && <div>Error: {createDict.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Create Dictionary')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Success: dict-123')).toBeInTheDocument()
      })

      expect(createSpy).toHaveBeenCalledWith(mockDictionary)
    })

    it('should handle create errors', async () => {
      const user = userEvent.setup()
      vi.spyOn(mockClient, 'createDataDictionary').mockRejectedValue(
        new Error('Creation failed')
      )

      function TestComponent() {
        const createDict = useCreateDataDictionary()

        return (
          <div>
            <button onClick={() => createDict.mutate({} as any)}>Create</button>
            {createDict.isError && <div>Error: {createDict.error.message}</div>}
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
        expect(screen.getByText('Error: Creation failed')).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = {
        endpoint: 'data-dictionary',
        identifier: 'dict-123',
      }

      vi.spyOn(mockClient, 'createDataDictionary').mockResolvedValue(mockResponse)

      function TestComponent() {
        const createDict = useCreateDataDictionary()

        return (
          <button
            onClick={() =>
              createDict.mutate(
                {
                  identifier: 'dict-123',
                  data: { title: 'Test', fields: [] },
                },
                { onSuccess }
              )
            }
          >
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
        expect(call[1]).toEqual(expect.objectContaining({ identifier: 'dict-123' }))
      })
    })

    it('should call onError callback', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      const error = new Error('Validation failed')

      vi.spyOn(mockClient, 'createDataDictionary').mockRejectedValue(error)

      function TestComponent() {
        const createDict = useCreateDataDictionary()

        return (
          <button
            onClick={() =>
              createDict.mutate(
                {
                  identifier: 'dict-123',
                  data: { title: 'Test', fields: [] },
                },
                { onError }
              )
            }
          >
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
        expect(onError).toHaveBeenCalled()
        const call = onError.mock.calls[0]
        expect(call[0]).toEqual(error)
        expect(call[1]).toEqual(expect.objectContaining({ identifier: 'dict-123' }))
      })
    })

    it('should support mutateAsync for async/await usage', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'data-dictionary',
        identifier: 'dict-123',
      }

      vi.spyOn(mockClient, 'createDataDictionary').mockResolvedValue(mockResponse)

      function TestComponent() {
        const createDict = useCreateDataDictionary()
        const [result, setResult] = React.useState<string>('')

        const handleCreate = async () => {
          try {
            const response = await createDict.mutateAsync({
              identifier: 'dict-123',
              data: { title: 'Test', fields: [] },
            })
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
        expect(screen.getByText('Result: Created: dict-123')).toBeInTheDocument()
      })
    })

    it('should create dictionary with complex field definitions', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'data-dictionary',
        identifier: 'complex-dict',
      }

      const createSpy = vi
        .spyOn(mockClient, 'createDataDictionary')
        .mockResolvedValue(mockResponse)

      const complexDictionary = {
        identifier: 'complex-dict',
        data: {
          title: 'Complex Dictionary',
          fields: [
            {
              name: 'email',
              type: 'string' as const,
              format: 'email',
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

      function TestComponent() {
        const createDict = useCreateDataDictionary()

        return (
          <div>
            <button onClick={() => createDict.mutate(complexDictionary)}>
              Create Complex
            </button>
            {createDict.isSuccess && <div>Created</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Create Complex')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Created')).toBeInTheDocument()
      })

      expect(createSpy).toHaveBeenCalledWith(complexDictionary)
    })
  })

  describe('useUpdateDataDictionary', () => {
    it('should update data dictionary successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'data-dictionary',
        identifier: 'dict-123',
      }

      const updateSpy = vi
        .spyOn(mockClient, 'updateDataDictionary')
        .mockResolvedValue(mockResponse)

      const updatedDictionary = {
        identifier: 'dict-123',
        data: {
          title: 'Updated Dictionary',
          fields: [
            { name: 'id', type: 'integer' as const },
            { name: 'name', type: 'string' as const },
            { name: 'email', type: 'string' as const, format: 'email' },
          ],
        },
      }

      function TestComponent() {
        const updateDict = useUpdateDataDictionary()

        return (
          <div>
            <button
              onClick={() =>
                updateDict.mutate({
                  identifier: 'dict-123',
                  dictionary: updatedDictionary,
                })
              }
              disabled={updateDict.isPending}
            >
              {updateDict.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            {updateDict.isSuccess && <div>Updated successfully</div>}
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

      expect(updateSpy).toHaveBeenCalledWith('dict-123', updatedDictionary)
    })

    it('should handle update errors', async () => {
      const user = userEvent.setup()
      vi.spyOn(mockClient, 'updateDataDictionary').mockRejectedValue(
        new Error('Update failed: validation error')
      )

      function TestComponent() {
        const updateDict = useUpdateDataDictionary()

        return (
          <div>
            <button
              onClick={() =>
                updateDict.mutate({
                  identifier: 'dict-123',
                  dictionary: {} as any,
                })
              }
            >
              Update
            </button>
            {updateDict.isError && <div>Error: {updateDict.error.message}</div>}
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
        expect(
          screen.getByText('Error: Update failed: validation error')
        ).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback with variables', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = {
        endpoint: 'data-dictionary',
        identifier: 'dict-123',
      }

      vi.spyOn(mockClient, 'updateDataDictionary').mockResolvedValue(mockResponse)

      function TestComponent() {
        const updateDict = useUpdateDataDictionary()

        return (
          <button
            onClick={() =>
              updateDict.mutate(
                {
                  identifier: 'dict-123',
                  dictionary: {
                    identifier: 'dict-123',
                    data: { title: 'Updated', fields: [] },
                  },
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
        expect(call[1]).toEqual(expect.objectContaining({ identifier: 'dict-123' }))
      })
    })

    it('should support updating field constraints', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'data-dictionary',
        identifier: 'dict-123',
      }

      const updateSpy = vi
        .spyOn(mockClient, 'updateDataDictionary')
        .mockResolvedValue(mockResponse)

      const dictionaryWithConstraints = {
        identifier: 'dict-123',
        data: {
          title: 'Dictionary with Constraints',
          fields: [
            {
              name: 'quantity',
              type: 'integer' as const,
              constraints: {
                minimum: 0,
                maximum: 1000,
                required: true,
              },
            },
          ],
        },
      }

      function TestComponent() {
        const updateDict = useUpdateDataDictionary()

        return (
          <div>
            <button
              onClick={() =>
                updateDict.mutate({
                  identifier: 'dict-123',
                  dictionary: dictionaryWithConstraints,
                })
              }
            >
              Update
            </button>
            {updateDict.isSuccess && <div>Constraints updated</div>}
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
        expect(screen.getByText('Constraints updated')).toBeInTheDocument()
      })

      expect(updateSpy).toHaveBeenCalledWith('dict-123', dictionaryWithConstraints)
    })

    it('should support mutateAsync for sequential updates', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'data-dictionary',
        identifier: 'dict-123',
      }

      vi.spyOn(mockClient, 'updateDataDictionary').mockResolvedValue(mockResponse)

      function TestComponent() {
        const updateDict = useUpdateDataDictionary()
        const [updates, setUpdates] = React.useState<string[]>([])

        const handleBulkUpdate = async () => {
          const steps = ['Step 1', 'Step 2', 'Step 3']
          for (const step of steps) {
            await updateDict.mutateAsync({
              identifier: 'dict-123',
              dictionary: {
                identifier: 'dict-123',
                data: { title: step, fields: [] },
              },
            })
            setUpdates((prev) => [...prev, step])
          }
        }

        return (
          <div>
            <button onClick={handleBulkUpdate}>Bulk Update</button>
            {updates.map((update, i) => (
              <div key={i}>Completed: {update}</div>
            ))}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Bulk Update')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Completed: Step 3')).toBeInTheDocument()
      })
    })
  })

  describe('useDeleteDataDictionary', () => {
    it('should delete data dictionary successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = { message: 'Data dictionary deleted successfully' }

      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDataDictionary')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDict = useDeleteDataDictionary()

        return (
          <div>
            <button
              onClick={() => deleteDict.mutate('dict-123')}
              disabled={deleteDict.isPending}
            >
              {deleteDict.isPending ? 'Deleting...' : 'Delete Dictionary'}
            </button>
            {deleteDict.isSuccess && <div>Message: {deleteDict.data.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Delete Dictionary')
      await user.click(button)

      await waitFor(() => {
        expect(
          screen.getByText('Message: Data dictionary deleted successfully')
        ).toBeInTheDocument()
      })

      expect(deleteSpy).toHaveBeenCalledWith('dict-123')
    })

    it('should handle delete errors', async () => {
      const user = userEvent.setup()
      vi.spyOn(mockClient, 'deleteDataDictionary').mockRejectedValue(
        new Error('Dictionary not found')
      )

      function TestComponent() {
        const deleteDict = useDeleteDataDictionary()

        return (
          <div>
            <button onClick={() => deleteDict.mutate('dict-123')}>Delete</button>
            {deleteDict.isError && <div>Error: {deleteDict.error.message}</div>}
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
        expect(screen.getByText('Error: Dictionary not found')).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = { message: 'Deleted successfully' }

      vi.spyOn(mockClient, 'deleteDataDictionary').mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDict = useDeleteDataDictionary()

        return (
          <button onClick={() => deleteDict.mutate('dict-123', { onSuccess })}>
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
        expect(call[1]).toEqual('dict-123')
      })
    })

    it('should support confirmation dialog pattern', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn().mockReturnValue(true)

      const mockResponse = { message: 'Deleted' }
      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDataDictionary')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDict = useDeleteDataDictionary()

        const handleDelete = () => {
          if (confirm('Delete this data dictionary? This cannot be undone.')) {
            deleteDict.mutate('dict-123')
          }
        }

        return (
          <div>
            <button onClick={handleDelete}>Delete</button>
            {deleteDict.isSuccess && <div>Deleted</div>}
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
        'Delete this data dictionary? This cannot be undone.'
      )
      expect(deleteSpy).toHaveBeenCalledWith('dict-123')
    })

    it('should support bulk delete with mutateAsync', async () => {
      const user = userEvent.setup()
      const mockResponse = { message: 'Deleted' }

      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDataDictionary')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const deleteDict = useDeleteDataDictionary()
        const [deletedIds, setDeletedIds] = React.useState<string[]>([])

        const handleBulkDelete = async () => {
          const ids = ['dict-1', 'dict-2', 'dict-3']
          for (const id of ids) {
            try {
              await deleteDict.mutateAsync(id)
              setDeletedIds((prev) => [...prev, id])
            } catch (error) {
              console.error('Failed to delete', id)
            }
          }
        }

        return (
          <div>
            <button onClick={handleBulkDelete}>Delete All</button>
            <div>Deleted: {deletedIds.length}</div>
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
      expect(deleteSpy).toHaveBeenCalledWith('dict-1')
      expect(deleteSpy).toHaveBeenCalledWith('dict-2')
      expect(deleteSpy).toHaveBeenCalledWith('dict-3')
    })

    it('should handle bulk delete with partial failures', async () => {
      const user = userEvent.setup()
      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDataDictionary')
        .mockImplementation(async (id) => {
          if (id === 'dict-2') {
            throw new Error('Delete failed')
          }
          return { message: 'Deleted' }
        })

      function TestComponent() {
        const deleteDict = useDeleteDataDictionary()
        const [results, setResults] = React.useState<string[]>([])

        const handleBulkDelete = async () => {
          const ids = ['dict-1', 'dict-2', 'dict-3']
          for (const id of ids) {
            try {
              await deleteDict.mutateAsync(id)
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
        expect(screen.getByText('dict-1: success')).toBeInTheDocument()
        expect(screen.getByText('dict-2: failed')).toBeInTheDocument()
        expect(screen.getByText('dict-3: success')).toBeInTheDocument()
      })

      expect(deleteSpy).toHaveBeenCalledTimes(3)
    })
  })
})
