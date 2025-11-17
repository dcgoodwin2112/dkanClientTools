/**
 * Vue composables for DKAN Query Download operations
 */

import { useMutation } from '@tanstack/vue-query'
import { useDkanClient } from './plugin'
import type { QueryDownloadOptions } from '@dkan-client-tools/core'

export interface DownloadQueryOptions {
  datasetId: string
  index: number
  queryOptions?: QueryDownloadOptions
}

export interface DownloadQueryByDistributionOptions {
  distributionId: string
  queryOptions?: QueryDownloadOptions
}

/**
 * Downloads datastore query results as CSV or JSON on user action.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const downloadQuery = useDownloadQuery()
 *
 * function handleDownload() {
 *   downloadQuery.mutate(
 *     { datasetId: 'my-dataset', index: 0, queryOptions: { format: 'csv' } },
 *     {
 *       onSuccess: (blob) => {
 *         const url = URL.createObjectURL(blob)
 *         const a = document.createElement('a')
 *         a.href = url
 *         a.download = 'data.csv'
 *         a.click()
 *         URL.revokeObjectURL(url)
 *       }
 *     }
 *   )
 * }
 * </script>
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
 * Downloads datastore data by distribution ID as CSV or JSON.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const downloadQuery = useDownloadQueryByDistribution()
 *
 * function handleDownload() {
 *   downloadQuery.mutate(
 *     { distributionId: 'dist-uuid', queryOptions: { format: 'csv' } },
 *     {
 *       onSuccess: (blob) => {
 *         const url = URL.createObjectURL(blob)
 *         const a = document.createElement('a')
 *         a.href = url
 *         a.download = 'data.csv'
 *         a.click()
 *         URL.revokeObjectURL(url)
 *       }
 *     }
 *   )
 * }
 * </script>
 * ```
 */
export function useDownloadQueryByDistribution() {
  const client = useDkanClient()

  return useMutation<Blob, Error, DownloadQueryByDistributionOptions>({
    mutationFn: ({ distributionId, queryOptions }) =>
      client.downloadQueryByDistribution(distributionId, queryOptions),
  })
}
