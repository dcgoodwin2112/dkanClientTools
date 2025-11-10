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
 * This mutation-based composable triggers downloads of datastore data to the user's device.
 * Unlike query-based composables that fetch and display data, this returns a Blob that can
 * be converted into a downloadable file. You can apply filters, sorting, and field selection
 * to customize the exported data before download.
 *
 * **Key Features**:
 * - Executes only on explicit user action (button click, menu selection)
 * - Supports CSV and JSON formats
 * - Apply filters and sorting to downloaded data
 * - Select specific fields/columns to export
 * - Returns Blob for flexible file handling
 * - Works with dataset ID and distribution index
 *
 * **How it Works**:
 * 1. User triggers download (clicks export button)
 * 2. Query is sent to DKAN with filters/format
 * 3. DKAN generates file with requested data
 * 4. Blob is returned and converted to download link
 * 5. Browser initiates file download
 *
 * **Format Support**:
 * - CSV - Comma-separated values, ideal for spreadsheets
 * - JSON - JavaScript Object Notation, ideal for APIs
 *
 * Use this composable when you need to:
 * - Export filtered data tables to CSV or JSON
 * - Provide data download functionality in your UI
 * - Generate custom exports with specific fields
 * - Create report downloads with sorted/filtered data
 * - Build data export tools and dashboards
 *
 * @returns TanStack Vue Query mutation object for downloading query results
 *
 * @example
 * Basic CSV download with filters:
 * ```vue
 * <script setup lang="ts">
 * import { useDownloadQuery } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string; index: number }>()
 *
 * const downloadQuery = useDownloadQuery()
 *
 * function handleDownload() {
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
 * Export with format selection and field customization:
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
 * function handleExport() {
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
 *
 * @example
 * Advanced export with progress tracking and error handling:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDownloadQuery } from '@dkan-client-tools/vue'
 * import { useDatastore } from '@dkan-client-tools/vue'
 * import type { DatastoreCondition } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{ datasetId: string; index: number }>()
 *
 * const downloadQuery = useDownloadQuery()
 * const filters = ref<DatastoreCondition[]>([])
 * const sortBy = ref<string>()
 * const sortOrder = ref<'asc' | 'desc'>('asc')
 * const selectedColumns = ref<string[]>([])
 * const downloadError = ref<string>()
 *
 * // Get total count for progress indication
 * const { data: preview } = useDatastore({
 *   datasetId: props.datasetId,
 *   index: props.index,
 *   queryOptions: computed(() => ({
 *     limit: 1,
 *     conditions: filters.value,
 *   })),
 * })
 *
 * const totalRecords = computed(() => preview.value?.count || 0)
 *
 * async function handleDownload(format: 'csv' | 'json') {
 *   downloadError.value = undefined
 *
 *   downloadQuery.mutate(
 *     {
 *       datasetId: props.datasetId,
 *       index: props.index,
 *       queryOptions: {
 *         format,
 *         conditions: filters.value,
 *         properties: selectedColumns.value.length > 0 ? selectedColumns.value : undefined,
 *         sorts: sortBy.value
 *           ? [{ property: sortBy.value, order: sortOrder.value }]
 *           : undefined,
 *       },
 *     },
 *     {
 *       onSuccess: (blob) => {
 *         const timestamp = new Date().toISOString().slice(0, 10)
 *         const filename = `export-${timestamp}.${format}`
 *
 *         const url = URL.createObjectURL(blob)
 *         const a = document.createElement('a')
 *         a.href = url
 *         a.download = filename
 *         document.body.appendChild(a)
 *         a.click()
 *         document.body.removeChild(a)
 *         URL.revokeObjectURL(url)
 *
 *         console.log(`Successfully downloaded ${totalRecords.value} records`)
 *       },
 *       onError: (error) => {
 *         downloadError.value = error.message
 *         console.error('Download failed:', error)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div class="export-panel">
 *     <div class="export-config">
 *       <h3>Export Configuration</h3>
 *
 *       <!-- Column selection -->
 *       <div class="column-selector">
 *         <label v-for="col in availableColumns" :key="col">
 *           <input type="checkbox" :value="col" v-model="selectedColumns" />
 *           {{ col }}
 *         </label>
 *       </div>
 *
 *       <!-- Sort options -->
 *       <select v-model="sortBy">
 *         <option :value="undefined">No sorting</option>
 *         <option v-for="col in availableColumns" :key="col" :value="col">
 *           Sort by {{ col }}
 *         </option>
 *       </select>
 *
 *       <select v-model="sortOrder" v-if="sortBy">
 *         <option value="asc">Ascending</option>
 *         <option value="desc">Descending</option>
 *       </select>
 *     </div>
 *
 *     <div class="export-actions">
 *       <p v-if="totalRecords">
 *         Ready to export {{ totalRecords.toLocaleString() }} records
 *       </p>
 *
 *       <div class="button-group">
 *         <button
 *           @click="handleDownload('csv')"
 *           :disabled="downloadQuery.isPending"
 *         >
 *           {{ downloadQuery.isPending ? 'Downloading...' : 'Download CSV' }}
 *         </button>
 *         <button
 *           @click="handleDownload('json')"
 *           :disabled="downloadQuery.isPending"
 *         >
 *           {{ downloadQuery.isPending ? 'Downloading...' : 'Download JSON' }}
 *         </button>
 *       </div>
 *
 *       <div v-if="downloadError" class="error-message">
 *         <strong>Download failed:</strong> {{ downloadError }}
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Bulk export with multiple datasets and progress:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDownloadQuery } from '@dkan-client-tools/vue'
 *
 * interface ExportJob {
 *   datasetId: string
 *   name: string
 *   status: 'pending' | 'downloading' | 'success' | 'error'
 *   error?: string
 * }
 *
 * const downloadQuery = useDownloadQuery()
 * const exportJobs = ref<ExportJob[]>([
 *   { datasetId: 'dataset-1', name: 'Population Data', status: 'pending' },
 *   { datasetId: 'dataset-2', name: 'Economic Indicators', status: 'pending' },
 *   { datasetId: 'dataset-3', name: 'Health Statistics', status: 'pending' },
 * ])
 *
 * async function exportAll() {
 *   for (const job of exportJobs.value) {
 *     job.status = 'downloading'
 *
 *     try {
 *       const blob = await downloadQuery.mutateAsync({
 *         datasetId: job.datasetId,
 *         index: 0,
 *         queryOptions: { format: 'csv' },
 *       })
 *
 *       const url = URL.createObjectURL(blob)
 *       const a = document.createElement('a')
 *       a.href = url
 *       a.download = `${job.name}.csv`
 *       a.click()
 *       URL.revokeObjectURL(url)
 *
 *       job.status = 'success'
 *
 *       // Small delay between downloads
 *       await new Promise((resolve) => setTimeout(resolve, 1000))
 *     } catch (error) {
 *       job.status = 'error'
 *       job.error = error instanceof Error ? error.message : 'Unknown error'
 *     }
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="bulk-export">
 *     <h3>Bulk Export</h3>
 *     <button @click="exportAll" :disabled="downloadQuery.isPending">
 *       Export All Datasets
 *     </button>
 *
 *     <ul class="export-status">
 *       <li v-for="job in exportJobs" :key="job.datasetId" :class="job.status">
 *         <span class="job-name">{{ job.name }}</span>
 *         <span class="job-status">
 *           <template v-if="job.status === 'pending'">Pending</template>
 *           <template v-else-if="job.status === 'downloading'">
 *             Downloading...
 *           </template>
 *           <template v-else-if="job.status === 'success'">✓ Complete</template>
 *           <template v-else-if="job.status === 'error'">
 *             ✗ Error: {{ job.error }}
 *           </template>
 *         </span>
 *       </li>
 *     </ul>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDownloadQueryByDistribution} for simpler distribution-based downloads
 * @see {@link useDatastore} to preview data before downloading
 * @see {@link useSqlQuery} for complex SQL-based exports
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
 * This is a simplified version of {@link useDownloadQuery} that works directly with
 * distribution IDs rather than requiring both dataset ID and distribution index. Use this
 * when you have the distribution identifier (from the dataset's `distribution` array) and
 * want a more convenient download interface.
 *
 * **Key Differences from useDownloadQuery**:
 * - Takes distribution ID directly (not dataset ID + index)
 * - Simpler API for single distribution downloads
 * - Same filtering and formatting capabilities
 * - Ideal when working with distribution detail pages
 *
 * **Distribution IDs**: Each dataset has one or more distributions (data files). The
 * distribution ID is found in `dataset.distribution[].identifier` and represents a specific
 * CSV, JSON, or other data file associated with the dataset.
 *
 * Use this composable when you need to:
 * - Download data from a specific distribution detail page
 * - Export data when you already have the distribution ID
 * - Build download buttons on distribution listings
 * - Create quick export functionality for single files
 * - Simplify downloads without looking up distribution index
 *
 * @returns TanStack Vue Query mutation object for downloading by distribution ID
 *
 * @example
 * Basic distribution download with format selection:
 * ```vue
 * <script setup lang="ts">
 * import { useDownloadQueryByDistribution } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ distributionId: string }>()
 *
 * const downloadQuery = useDownloadQueryByDistribution()
 *
 * function handleDownload(format: 'csv' | 'json') {
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
 * Filtered download with error handling:
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
 * function handleDownload() {
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
 *         const url = URL.createObjectURL(blob)
 *         const a = document.createElement('a')
 *         a.href = url
 *         a.download = 'filtered-data.csv'
 *         a.click()
 *         URL.revokeObjectURL(url)
 *       },
 *       onError: (error) => {
 *         console.error('Download failed:', error)
 *         alert(`Download failed: ${error.message}`)
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
 *
 * @example
 * Distribution detail page with multiple export options:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDownloadQueryByDistribution } from '@dkan-client-tools/vue'
 * import { useDataset } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string; distributionId: string }>()
 *
 * const { data: dataset } = useDataset({ identifier: props.datasetId })
 * const downloadQuery = useDownloadQueryByDistribution()
 *
 * const distribution = computed(() =>
 *   dataset.value?.distribution?.find((d) => d.identifier === props.distributionId)
 * )
 *
 * const downloadOptions = ref({
 *   format: 'csv' as 'csv' | 'json',
 *   includeHeaders: true,
 *   limit: undefined as number | undefined,
 * })
 *
 * async function handleDownload() {
 *   try {
 *     const blob = await downloadQuery.mutateAsync({
 *       distributionId: props.distributionId,
 *       queryOptions: {
 *         format: downloadOptions.value.format,
 *         limit: downloadOptions.value.limit,
 *       },
 *     })
 *
 *     const filename = distribution.value?.title
 *       ? `${distribution.value.title}.${downloadOptions.value.format}`
 *       : `download.${downloadOptions.value.format}`
 *
 *     const url = URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = filename
 *     document.body.appendChild(a)
 *     a.click()
 *     document.body.removeChild(a)
 *     URL.revokeObjectURL(url)
 *   } catch (error) {
 *     console.error('Download failed:', error)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="distribution-detail" v-if="distribution">
 *     <h2>{{ distribution.title }}</h2>
 *     <p>{{ distribution.description }}</p>
 *
 *     <div class="download-section">
 *       <h3>Download Options</h3>
 *
 *       <div class="option-group">
 *         <label>Format:</label>
 *         <select v-model="downloadOptions.format">
 *           <option value="csv">CSV (Spreadsheet)</option>
 *           <option value="json">JSON (API)</option>
 *         </select>
 *       </div>
 *
 *       <div class="option-group">
 *         <label>Limit rows (optional):</label>
 *         <input
 *           v-model.number="downloadOptions.limit"
 *           type="number"
 *           placeholder="All rows"
 *         />
 *       </div>
 *
 *       <button
 *         @click="handleDownload"
 *         :disabled="downloadQuery.isPending"
 *         class="download-button"
 *       >
 *         {{ downloadQuery.isPending ? 'Preparing download...' : 'Download' }}
 *       </button>
 *     </div>
 *
 *     <div v-if="downloadQuery.isError" class="error">
 *       Failed to download: {{ downloadQuery.error?.message }}
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Smart download component with automatic format detection:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDownloadQueryByDistribution } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{
 *   distributionId: string
 *   distributionFormat?: string
 *   title?: string
 * }>()
 *
 * const downloadQuery = useDownloadQueryByDistribution()
 *
 * // Detect appropriate download format based on distribution's original format
 * const recommendedFormat = computed(() => {
 *   const format = props.distributionFormat?.toLowerCase()
 *   if (format === 'csv' || format === 'tsv') return 'csv'
 *   if (format === 'json' || format === 'geojson') return 'json'
 *   return 'csv' // Default to CSV
 * })
 *
 * async function handleQuickDownload() {
 *   try {
 *     const blob = await downloadQuery.mutateAsync({
 *       distributionId: props.distributionId,
 *       queryOptions: {
 *         format: recommendedFormat.value,
 *       },
 *     })
 *
 *     const filename = props.title
 *       ? `${props.title}.${recommendedFormat.value}`
 *       : `data.${recommendedFormat.value}`
 *
 *     const url = URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = filename
 *     a.click()
 *     URL.revokeObjectURL(url)
 *   } catch (error) {
 *     console.error('Download failed:', error)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <button
 *     @click="handleQuickDownload"
 *     :disabled="downloadQuery.isPending"
 *     class="quick-download-btn"
 *   >
 *     <span v-if="downloadQuery.isPending">Downloading...</span>
 *     <span v-else>
 *       <svg class="icon"><!-- download icon --></svg>
 *       Download {{ recommendedFormat.toUpperCase() }}
 *     </span>
 *   </button>
 * </template>
 * ```
 *
 * @example
 * Distribution list with individual download buttons:
 * ```vue
 * <script setup lang="ts">
 * import { useDataset } from '@dkan-client-tools/vue'
 * import { useDownloadQueryByDistribution } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string }>()
 *
 * const { data: dataset } = useDataset({ identifier: props.datasetId })
 * const downloadQuery = useDownloadQueryByDistribution()
 *
 * function downloadDistribution(distributionId: string, title: string) {
 *   downloadQuery.mutate(
 *     {
 *       distributionId,
 *       queryOptions: { format: 'csv' },
 *     },
 *     {
 *       onSuccess: (blob) => {
 *         const url = URL.createObjectURL(blob)
 *         const a = document.createElement('a')
 *         a.href = url
 *         a.download = `${title}.csv`
 *         a.click()
 *         URL.revokeObjectURL(url)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div class="dataset-distributions">
 *     <h3>Available Data Files</h3>
 *     <ul class="distribution-list">
 *       <li
 *         v-for="dist in dataset?.distribution"
 *         :key="dist.identifier"
 *         class="distribution-item"
 *       >
 *         <div class="dist-info">
 *           <strong>{{ dist.title }}</strong>
 *           <span class="format-badge">{{ dist.format }}</span>
 *         </div>
 *         <button
 *           @click="downloadDistribution(dist.identifier, dist.title)"
 *           :disabled="downloadQuery.isPending"
 *         >
 *           Download
 *         </button>
 *       </li>
 *     </ul>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDownloadQuery} for downloads using dataset ID and index
 * @see {@link useDatastore} to preview data before downloading
 * @see {@link useDataset} to get distribution information
 */
export function useDownloadQueryByDistribution() {
  const client = useDkanClient()

  return useMutation<Blob, Error, DownloadQueryByDistributionOptions>({
    mutationFn: ({ distributionId, queryOptions }) =>
      client.downloadQueryByDistribution(distributionId, queryOptions),
  })
}
