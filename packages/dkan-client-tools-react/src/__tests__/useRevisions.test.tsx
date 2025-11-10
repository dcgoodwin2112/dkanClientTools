/**
 * Tests for useRevisions hooks
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useRevisions,
  useRevision,
  useCreateRevision,
  useChangeDatasetState,
} from '../useRevisions'

describe('useRevisions', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useRevisions', () => {
    it('should fetch revisions successfully', async () => {
      const mockRevisions = [
        {
          identifier: 'rev-1',
          state: 'published' as const,
          modified: '2024-01-01',
          published: true,
          message: 'Initial version',
        },
        {
          identifier: 'rev-2',
          state: 'draft' as const,
          modified: '2024-01-02',
          published: false,
          message: 'Updated version',
        },
      ]

      vi.spyOn(mockClient, 'getRevisions').mockResolvedValue(mockRevisions)

      function TestComponent() {
        const { data: revisions, isLoading } = useRevisions({
          schemaId: 'dataset',
          identifier: 'dataset-123',
        })

        if (isLoading) return <div>Loading...</div>
        if (!revisions) return null

        return (
          <div>
            <div>Count: {revisions.length}</div>
            {revisions.map((rev) => (
              <div key={rev.identifier}>
                {rev.identifier}: {rev.state}
                {rev.published && ' (Current)'}
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
        expect(screen.getByText('Count: 2')).toBeInTheDocument()
        expect(screen.getByText('rev-1: published (Current)')).toBeInTheDocument()
        expect(screen.getByText('rev-2: draft')).toBeInTheDocument()
      })

      expect(mockClient.getRevisions).toHaveBeenCalledWith('dataset', 'dataset-123')
    })

    it('should not fetch when schemaId or identifier is empty', () => {
      const revisionsSpy = vi.spyOn(mockClient, 'getRevisions').mockResolvedValue([])

      function TestComponent() {
        const { data } = useRevisions({
          schemaId: '',
          identifier: 'dataset-123',
        })
        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(revisionsSpy).not.toHaveBeenCalled()
    })
  })

  describe('useRevision', () => {
    it('should fetch specific revision successfully', async () => {
      const mockRevision = {
        identifier: 'rev-1',
        state: 'published' as const,
        modified: '2024-01-01T10:00:00Z',
        published: true,
        message: 'Initial publication',
      }

      vi.spyOn(mockClient, 'getRevision').mockResolvedValue(mockRevision)

      function TestComponent() {
        const { data: revision, isLoading } = useRevision({
          schemaId: 'dataset',
          identifier: 'dataset-123',
          revisionId: 'rev-1',
        })

        if (isLoading) return <div>Loading...</div>
        if (!revision) return null

        return (
          <div>
            <div>ID: {revision.identifier}</div>
            <div>State: {revision.state}</div>
            <div>Published: {revision.published ? 'Yes' : 'No'}</div>
            <div>Message: {revision.message}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('ID: rev-1')).toBeInTheDocument()
        expect(screen.getByText('State: published')).toBeInTheDocument()
        expect(screen.getByText('Published: Yes')).toBeInTheDocument()
        expect(screen.getByText('Message: Initial publication')).toBeInTheDocument()
      })

      expect(mockClient.getRevision).toHaveBeenCalledWith(
        'dataset',
        'dataset-123',
        'rev-1'
      )
    })

    it('should not fetch when revisionId is empty', () => {
      const revisionSpy = vi.spyOn(mockClient, 'getRevision').mockResolvedValue({
        identifier: '',
        state: 'draft',
        modified: '',
        published: false,
      })

      function TestComponent() {
        const { data } = useRevision({
          schemaId: 'dataset',
          identifier: 'dataset-123',
          revisionId: '',
        })
        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(revisionSpy).not.toHaveBeenCalled()
    })
  })

  describe('useCreateRevision', () => {
    it('should create revision successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'metastore',
        identifier: 'rev-2',
      }

      const createSpy = vi
        .spyOn(mockClient, 'createRevision')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const createRevision = useCreateRevision()

        return (
          <div>
            <button
              onClick={() =>
                createRevision.mutate({
                  schemaId: 'dataset',
                  identifier: 'dataset-123',
                  revision: {
                    state: 'published',
                    message: 'Publishing dataset',
                  },
                })
              }
              disabled={createRevision.isPending}
            >
              {createRevision.isPending ? 'Creating...' : 'Create Revision'}
            </button>
            {createRevision.isSuccess && <div>Success: {createRevision.data.identifier}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Create Revision')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Success: rev-2')).toBeInTheDocument()
      })

      expect(createSpy).toHaveBeenCalledWith('dataset', 'dataset-123', {
        state: 'published',
        message: 'Publishing dataset',
      })
    })

    it('should handle error during creation', async () => {
      const user = userEvent.setup()
      const mockError = new Error('Invalid state transition')

      vi.spyOn(mockClient, 'createRevision').mockRejectedValue(mockError)

      function TestComponent() {
        const createRevision = useCreateRevision()

        return (
          <div>
            <button
              onClick={() =>
                createRevision.mutate({
                  schemaId: 'dataset',
                  identifier: 'dataset-123',
                  revision: { state: 'published' },
                })
              }
            >
              Create
            </button>
            {createRevision.isError && <div>Error: {createRevision.error.message}</div>}
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
        expect(screen.getByText('Error: Invalid state transition')).toBeInTheDocument()
      })
    })

    it('should create revision with different workflow states', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'metastore',
        identifier: 'rev-3',
      }

      const createSpy = vi
        .spyOn(mockClient, 'createRevision')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const createRevision = useCreateRevision()

        return (
          <div>
            <button
              onClick={() =>
                createRevision.mutate({
                  schemaId: 'dataset',
                  identifier: 'dataset-123',
                  revision: {
                    state: 'archived',
                    message: 'Archiving old dataset',
                  },
                })
              }
            >
              Archive
            </button>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Archive')
      await user.click(button)

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith('dataset', 'dataset-123', {
          state: 'archived',
          message: 'Archiving old dataset',
        })
      })
    })
  })

  describe('useChangeDatasetState', () => {
    it('should change dataset state successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'metastore',
        identifier: 'rev-4',
      }

      const changeSpy = vi
        .spyOn(mockClient, 'changeDatasetState')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const changeState = useChangeDatasetState()

        return (
          <div>
            <button
              onClick={() =>
                changeState.mutate({
                  identifier: 'dataset-123',
                  state: 'published',
                  message: 'Publishing to production',
                })
              }
              disabled={changeState.isPending}
            >
              {changeState.isPending ? 'Publishing...' : 'Publish'}
            </button>
            {changeState.isSuccess && <div>Published</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Publish')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Published')).toBeInTheDocument()
      })

      expect(changeSpy).toHaveBeenCalledWith(
        'dataset-123',
        'published',
        'Publishing to production'
      )
    })

    it('should handle multiple workflow actions', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'metastore',
        identifier: 'rev-5',
      }

      const changeSpy = vi
        .spyOn(mockClient, 'changeDatasetState')
        .mockResolvedValue(mockResponse)

      function TestComponent() {
        const changeState = useChangeDatasetState()

        return (
          <div>
            <button
              onClick={() =>
                changeState.mutate({
                  identifier: 'dataset-123',
                  state: 'draft',
                  message: 'Moving to draft',
                })
              }
            >
              Draft
            </button>
            <button
              onClick={() =>
                changeState.mutate({
                  identifier: 'dataset-123',
                  state: 'hidden',
                  message: 'Hiding from public',
                })
              }
            >
              Hide
            </button>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const hideButton = screen.getByText('Hide')
      await user.click(hideButton)

      await waitFor(() => {
        expect(changeSpy).toHaveBeenCalledWith(
          'dataset-123',
          'hidden',
          'Hiding from public'
        )
      })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = {
        endpoint: 'metastore',
        identifier: 'rev-6',
      }

      vi.spyOn(mockClient, 'changeDatasetState').mockResolvedValue(mockResponse)

      function TestComponent() {
        const changeState = useChangeDatasetState()

        return (
          <button
            onClick={() =>
              changeState.mutate(
                {
                  identifier: 'dataset-123',
                  state: 'published',
                },
                { onSuccess }
              )
            }
          >
            Publish
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Publish')
      await user.click(button)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResponse)
      })
    })
  })
})
