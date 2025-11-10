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
 * Mutation composable to download datastore query results
 * Returns a Blob that can be used to create a download link
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDownloadQuery } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string; index: number }>()
 *
 * const downloadQuery = useDownloadQuery()
 *
 * const handleDownload = () => {
 *   downloadQuery.mutate(
 *     {
 *       datasetId: props.datasetId,
 *       index: props.index,
 *       queryOptions: {
 *         format: 'csv',
 *         conditions: [{ property: 'state', value: 'CA' }],
 *         limit: 1000,
 *       },
 *     },
 *     {
 *       onSuccess: (blob) => {
 *         // Create download link
 *         const url = URL.createObjectURL(blob)
 *         const a = document.createElement('a')
 *         a.href = url
 *         a.download = `dataset-${props.datasetId}.csv`
 *         document.body.appendChild(a)
 *         a.click()
 *         document.body.removeChild(a)
 *         URL.revokeObjectURL(url)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <button @click="handleDownload" :disabled="downloadQuery.isPending">
 *     {{ downloadQuery.isPending ? 'Downloading...' : 'Download CSV' }}
 *   </button>
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDownloadQuery } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string }>()
 *
 * const downloadQuery = useDownloadQuery()
 * const format = ref<'csv' | 'json'>('csv')
 *
 * const handleExport = () => {
 *   downloadQuery.mutate(
 *     {
 *       datasetId: props.datasetId,
 *       index: 0,
 *       queryOptions: {
 *         format: format.value,
 *         properties: ['name', 'date', 'value'],
 *         sorts: [{ property: 'date', order: 'desc' }],
 *       },
 *     },
 *     {
 *       onSuccess: (blob) => {
 *         const url = URL.createObjectURL(blob)
 *         const a = document.createElement('a')
 *         a.href = url
 *         a.download = `export.${format.value}`
 *         a.click()
 *         URL.revokeObjectURL(url)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <select v-model="format">
 *       <option value="csv">CSV</option>
 *       <option value="json">JSON</option>
 *     </select>
 *     <button @click="handleExport" :disabled="downloadQuery.isPending">
 *       {{ downloadQuery.isPending ? 'Exporting...' : 'Export Data' }}
 *     </button>
 *   </div>
 * </template>
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
 * Mutation composable to download query results by distribution ID
 * Simplified download for a specific distribution/resource
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDownloadQueryByDistribution } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ distributionId: string }>()
 *
 * const downloadQuery = useDownloadQueryByDistribution()
 *
 * const handleDownload = (format: 'csv' | 'json') => {
 *   downloadQuery.mutate(
 *     {
 *       distributionId: props.distributionId,
 *       queryOptions: { format },
 *     },
 *     {
 *       onSuccess: (blob) => {
 *         const url = URL.createObjectURL(blob)
 *         const a = document.createElement('a')
 *         a.href = url
 *         a.download = `distribution-${props.distributionId}.${format}`
 *         a.click()
 *         URL.revokeObjectURL(url)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button
 *       @click="handleDownload('csv')"
 *       :disabled="downloadQuery.isPending"
 *     >
 *       Download CSV
 *     </button>
 *     <button
 *       @click="handleDownload('json')"
 *       :disabled="downloadQuery.isPending"
 *     >
 *       Download JSON
 *     </button>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDownloadQueryByDistribution } from '@dkan-client-tools/vue'
 * import type { DatastoreCondition } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{ distributionId: string }>()
 *
 * const downloadQuery = useDownloadQueryByDistribution()
 * const filters = ref<DatastoreCondition[]>([])
 *
 * const handleDownload = () => {
 *   downloadQuery.mutate(
 *     {
 *       distributionId: props.distributionId,
 *       queryOptions: {
 *         format: 'csv',
 *         conditions: filters.value,
 *         limit: 5000,
 *       },
 *     },
 *     {
 *       onSuccess: (blob) => {
 *         // Using file-saver library or similar
 *         const url = URL.createObjectURL(blob)
 *         const a = document.createElement('a')
 *         a.href = url
 *         a.download = 'filtered-data.csv'
 *         a.click()
 *         URL.revokeObjectURL(url)
 *       },
 *       onError: (error) => {
 *         console.error('Download failed:', error)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <!-- Filter UI -->
 *     <button @click="handleDownload" :disabled="downloadQuery.isPending">
 *       Download Filtered Data
 *     </button>
 *   </div>
 * </template>
 * ```
 */
export function useDownloadQueryByDistribution() {
  const client = useDkanClient()

  return useMutation<Blob, Error, DownloadQueryByDistributionOptions>({
    mutationFn: ({ distributionId, queryOptions }) =>
      client.downloadQueryByDistribution(distributionId, queryOptions),
  })
}
