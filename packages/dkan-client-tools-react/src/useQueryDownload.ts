import { useMutation } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type { QueryDownloadOptions } from '@dkan-client-tools/core'

export interface DownloadQueryOptions {
  /** Dataset identifier (UUID) */
  datasetId: string
  /** Distribution index (default: 0) */
  index: number
  /** Query options: format, conditions, properties, sorts, limit, offset */
  queryOptions?: QueryDownloadOptions
}

export interface DownloadQueryByDistributionOptions {
  /** Distribution/resource identifier */
  distributionId: string
  /** Query options: format, conditions, properties, sorts, limit, offset */
  queryOptions?: QueryDownloadOptions
}

/**
 * Downloads datastore query results as CSV or JSON files.
 *
 * Returns Blob for use with `URL.createObjectURL()` or file-saver.
 *
 * @example
 * ```tsx
 * const download = useDownloadQuery()
 * download.mutate(
 *   { datasetId, index: 0, queryOptions: { format: 'csv', limit: 1000 } },
 *   {
 *     onSuccess: (blob) => {
 *       const url = URL.createObjectURL(blob)
 *       const a = document.createElement('a')
 *       a.href = url
 *       a.download = 'data.csv'
 *       a.click()
 *       URL.revokeObjectURL(url)
 *     },
 *   }
 * )
 * ```
 */
export function useDownloadQuery() {
  const client = useDkanClient()

  return useMutation<Blob, Error, DownloadQueryOptions>({
    mutationFn: ({ datasetId, index, queryOptions }) =>
      client.downloadQuery(datasetId, index, queryOptions),
  })
}

/**
 * Downloads datastore data by distribution ID (alternative to useDownloadQuery).
 *
 * Simpler interface when you have distribution ID directly.
 *
 * @example
 * ```tsx
 * const download = useDownloadQueryByDistribution()
 * download.mutate({ distributionId, queryOptions: { format: 'csv' } })
 * ```
 */
export function useDownloadQueryByDistribution() {
  const client = useDkanClient()

  return useMutation<Blob, Error, DownloadQueryByDistributionOptions>({
    mutationFn: ({ distributionId, queryOptions }) =>
      client.downloadQueryByDistribution(distributionId, queryOptions),
  })
}
