/**
 * Tests for useQueryDownload hooks
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useDownloadQuery,
  useDownloadQueryByDistribution,
} from '../useQueryDownload'

describe('useQueryDownload', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }),
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useDownloadQuery', () => {
    it('should download query results successfully', async () => {
      const user = userEvent.setup()
      const mockBlob = new Blob(['test,data\n1,2\n'], { type: 'text/csv' })

      const downloadSpy = vi
        .spyOn(mockClient, 'downloadQuery')
        .mockResolvedValue(mockBlob)

      function TestComponent() {
        const downloadQuery = useDownloadQuery()

        return (
          <div>
            <button
              onClick={() =>
                downloadQuery.mutate({
                  datasetId: 'dataset-123',
                  index: 0,
                  queryOptions: { format: 'csv' },
                })
              }
              disabled={downloadQuery.isPending}
            >
              {downloadQuery.isPending ? 'Downloading...' : 'Download'}
            </button>
            {downloadQuery.isSuccess && <div>Download complete</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Download')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Download complete')).toBeInTheDocument()
      })

      expect(downloadSpy).toHaveBeenCalledWith('dataset-123', 0, { format: 'csv' })
    })

    it('should handle download with conditions and limit', async () => {
      const user = userEvent.setup()
      const mockBlob = new Blob(['filtered,data\n'], { type: 'text/csv' })

      const downloadSpy = vi
        .spyOn(mockClient, 'downloadQuery')
        .mockResolvedValue(mockBlob)

      function TestComponent() {
        const downloadQuery = useDownloadQuery()

        const handleDownload = () => {
          downloadQuery.mutate({
            datasetId: 'dataset-123',
            index: 0,
            queryOptions: {
              format: 'csv',
              conditions: [{ property: 'state', value: 'CA' }],
              limit: 1000,
            },
          })
        }

        return <button onClick={handleDownload}>Download Filtered</button>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Download Filtered')
      await user.click(button)

      await waitFor(() => {
        expect(downloadSpy).toHaveBeenCalledWith('dataset-123', 0, {
          format: 'csv',
          conditions: [{ property: 'state', value: 'CA' }],
          limit: 1000,
        })
      })
    })

    it('should handle error during download', async () => {
      const user = userEvent.setup()
      const mockError = new Error('Download failed')

      vi.spyOn(mockClient, 'downloadQuery').mockRejectedValue(mockError)

      function TestComponent() {
        const downloadQuery = useDownloadQuery()

        return (
          <div>
            <button
              onClick={() =>
                downloadQuery.mutate({
                  datasetId: 'dataset-123',
                  index: 0,
                })
              }
            >
              Download
            </button>
            {downloadQuery.isError && <div>Error: {downloadQuery.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Download')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Error: Download failed')).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback with blob', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockBlob = new Blob(['data'], { type: 'text/csv' })

      vi.spyOn(mockClient, 'downloadQuery').mockResolvedValue(mockBlob)

      function TestComponent() {
        const downloadQuery = useDownloadQuery()

        return (
          <button
            onClick={() =>
              downloadQuery.mutate(
                {
                  datasetId: 'dataset-123',
                  index: 0,
                  queryOptions: { format: 'csv' },
                },
                { onSuccess }
              )
            }
          >
            Download
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Download')
      await user.click(button)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toBe(mockBlob)
      })
    })

    it('should download JSON format', async () => {
      const user = userEvent.setup()
      const mockBlob = new Blob(['{"data": []}'], { type: 'application/json' })

      const downloadSpy = vi
        .spyOn(mockClient, 'downloadQuery')
        .mockResolvedValue(mockBlob)

      function TestComponent() {
        const downloadQuery = useDownloadQuery()

        return (
          <button
            onClick={() =>
              downloadQuery.mutate({
                datasetId: 'dataset-123',
                index: 0,
                queryOptions: { format: 'json' },
              })
            }
          >
            Download JSON
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Download JSON')
      await user.click(button)

      await waitFor(() => {
        expect(downloadSpy).toHaveBeenCalledWith('dataset-123', 0, { format: 'json' })
      })
    })
  })

  describe('useDownloadQueryByDistribution', () => {
    it('should download by distribution ID successfully', async () => {
      const user = userEvent.setup()
      const mockBlob = new Blob(['dist,data\n'], { type: 'text/csv' })

      const downloadSpy = vi
        .spyOn(mockClient, 'downloadQueryByDistribution')
        .mockResolvedValue(mockBlob)

      function TestComponent() {
        const downloadQuery = useDownloadQueryByDistribution()

        return (
          <div>
            <button
              onClick={() =>
                downloadQuery.mutate({
                  distributionId: 'dist-123',
                  queryOptions: { format: 'csv' },
                })
              }
              disabled={downloadQuery.isPending}
            >
              {downloadQuery.isPending ? 'Downloading...' : 'Download'}
            </button>
            {downloadQuery.isSuccess && <div>Success</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Download')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument()
      })

      expect(downloadSpy).toHaveBeenCalledWith('dist-123', { format: 'csv' })
    })

    it('should handle filtered download by distribution', async () => {
      const user = userEvent.setup()
      const mockBlob = new Blob(['filtered\n'], { type: 'text/csv' })

      const downloadSpy = vi
        .spyOn(mockClient, 'downloadQueryByDistribution')
        .mockResolvedValue(mockBlob)

      function TestComponent() {
        const downloadQuery = useDownloadQueryByDistribution()

        return (
          <button
            onClick={() =>
              downloadQuery.mutate({
                distributionId: 'dist-123',
                queryOptions: {
                  format: 'csv',
                  conditions: [{ property: 'active', value: 'true' }],
                  limit: 5000,
                },
              })
            }
          >
            Download
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Download')
      await user.click(button)

      await waitFor(() => {
        expect(downloadSpy).toHaveBeenCalledWith('dist-123', {
          format: 'csv',
          conditions: [{ property: 'active', value: 'true' }],
          limit: 5000,
        })
      })
    })

    it('should handle error during download', async () => {
      const user = userEvent.setup()
      const mockError = new Error('Distribution not found')

      vi.spyOn(mockClient, 'downloadQueryByDistribution').mockRejectedValue(mockError)

      function TestComponent() {
        const downloadQuery = useDownloadQueryByDistribution()

        return (
          <div>
            <button
              onClick={() =>
                downloadQuery.mutate({
                  distributionId: 'invalid',
                })
              }
            >
              Download
            </button>
            {downloadQuery.isError && <div>Error: {downloadQuery.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Download')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Error: Distribution not found')).toBeInTheDocument()
      })
    })
  })
})
