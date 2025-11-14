/**
 * Vue composables for DKAN Datastore Import operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'
import type {
  DatastoreImport,
  DatastoreImportOptions,
  DatastoreStatistics,
} from '@dkan-client-tools/core'

export interface UseDatastoreImportsOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  refetchInterval?: number | false
}

export interface UseDatastoreImportOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  refetchInterval?: number | false
}

export interface UseDatastoreStatisticsOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}


/**
 * Fetches all datastore import statuses with automatic polling support for real-time monitoring.
 *
 * The datastore import process converts CSV/TSV distribution files into queryable database tables.
 * This composable retrieves the status of all active and completed imports across the entire catalog,
 * providing visibility into ongoing ETL operations. Each import includes detailed progress information
 * including file fetcher state, record counts, and error messages if failures occur.
 *
 * **Import Process Lifecycle**:
 * 1. **QUEUED** - Import job created, waiting to start
 * 2. **IN_PROGRESS** - Actively downloading file and importing records
 * 3. **DONE** - Successfully completed import
 * 4. **ERROR** - Failed with error details in response
 *
 * **Response Structure**:
 * Returns a dictionary keyed by resource identifier with import details:
 * ```typescript
 * {
 *   "[resource-id]": {
 *     status: "DONE" | "IN_PROGRESS" | "QUEUED" | "ERROR",
 *     file_fetcher?: { state: { file_path, bytes_copied } },
 *     importer?: { state: { num_records, pointer, error } }
 *   }
 * }
 * ```
 *
 * **Real-Time Polling**:
 * Use `refetchInterval` to automatically poll for updates while imports are running. Results
 * have a 0ms default stale time to ensure fresh data on each poll.
 *
 * Use this composable when you need to:
 * - Monitor all datastore import operations catalog-wide
 * - Build admin dashboards showing import progress
 * - Display import queues and active operations
 * - Track historical import status
 * - Debug import failures across resources
 *
 * @param options - Configuration including polling interval
 *
 * @returns TanStack Vue Query result object with import status dictionary
 *
 * @example
 * Real-time import monitor dashboard:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDatastoreImports } from '@dkan-client-tools/vue'
 *
 * const { data: imports, isLoading } = useDatastoreImports({
 *   refetchInterval: 5000, // Poll every 5 seconds
 * })
 *
 * const activeImports = computed(() =>
 *   Object.entries(imports.value || {}).filter(
 *     ([, imp]) => imp.status === 'IN_PROGRESS' || imp.status === 'QUEUED'
 *   )
 * )
 *
 * const completedImports = computed(() =>
 *   Object.entries(imports.value || {}).filter(([, imp]) => imp.status === 'DONE')
 * )
 *
 * const failedImports = computed(() =>
 *   Object.entries(imports.value || {}).filter(([, imp]) => imp.status === 'ERROR')
 * )
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading import status...</div>
 *   <div v-else class="import-dashboard">
 *     <div class="summary">
 *       <div class="stat active">
 *         <h3>Active Imports</h3>
 *         <p class="count">{{ activeImports.length }}</p>
 *       </div>
 *       <div class="stat completed">
 *         <h3>Completed</h3>
 *         <p class="count">{{ completedImports.length }}</p>
 *       </div>
 *       <div class="stat failed">
 *         <h3>Failed</h3>
 *         <p class="count">{{ failedImports.length }}</p>
 *       </div>
 *     </div>
 *
 *     <section v-if="activeImports.length > 0" class="active-section">
 *       <h2>Active Imports</h2>
 *       <ul>
 *         <li v-for="[id, imp] in activeImports" :key="id" class="import-item">
 *           <h4>{{ id }}</h4>
 *           <div class="status-badge">{{ imp.status }}</div>
 *           <div v-if="imp.importer?.state" class="progress">
 *             <p>Records imported: {{ imp.importer.state.num_records }}</p>
 *             <div v-if="imp.file_fetcher?.state" class="file-info">
 *               File: {{ imp.file_fetcher.state.file_path }}
 *             </div>
 *           </div>
 *         </li>
 *       </ul>
 *     </section>
 *
 *     <section v-if="failedImports.length > 0" class="failed-section">
 *       <h2>Failed Imports</h2>
 *       <ul>
 *         <li v-for="[id, imp] in failedImports" :key="id" class="error-item">
 *           <h4>{{ id }}</h4>
 *           <p v-if="imp.importer?.state?.error" class="error-message">
 *             {{ imp.importer.state.error }}
 *           </p>
 *         </li>
 *       </ul>
 *     </section>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Conditional polling - only poll while imports are active:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDatastoreImports } from '@dkan-client-tools/vue'
 *
 * const { data: imports } = useDatastoreImports()
 *
 * // Check if any imports are active
 * const hasActiveImports = computed(() =>
 *   Object.values(imports.value || {}).some(
 *     (imp) => imp.status === 'IN_PROGRESS' || imp.status === 'QUEUED'
 *   )
 * )
 *
 * // Smart polling composable that only polls when needed
 * const { data: liveImports } = useDatastoreImports({
 *   refetchInterval: computed(() => (hasActiveImports.value ? 3000 : false)),
 * })
 * </script>
 *
 * <template>
 *   <div class="smart-import-monitor">
 *     <div v-if="hasActiveImports" class="polling-indicator">
 *       <span class="pulse"></span>
 *       Monitoring active imports...
 *     </div>
 *
 *     <ul v-if="liveImports">
 *       <li v-for="(imp, id) in liveImports" :key="id">
 *         <router-link :to="`/imports/${id}`">
 *           {{ id }}
 *         </router-link>
 *         <span :class="`status-${imp.status.toLowerCase()}`">
 *           {{ imp.status }}
 *         </span>
 *       </li>
 *     </ul>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Import history table with sorting and filtering:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatastoreImports } from '@dkan-client-tools/vue'
 *
 * const { data: imports } = useDatastoreImports({
 *   staleTime: 30000, // Cache for 30 seconds for historical view
 * })
 *
 * const statusFilter = ref<string>('all')
 * const searchQuery = ref('')
 *
 * const filteredImports = computed(() => {
 *   if (!imports.value) return []
 *
 *   let entries = Object.entries(imports.value)
 *
 *   // Filter by status
 *   if (statusFilter.value !== 'all') {
 *     entries = entries.filter(([, imp]) => imp.status === statusFilter.value)
 *   }
 *
 *   // Search by ID
 *   if (searchQuery.value) {
 *     entries = entries.filter(([id]) =>
 *       id.toLowerCase().includes(searchQuery.value.toLowerCase())
 *     )
 *   }
 *
 *   return entries
 * })
 * </script>
 *
 * <template>
 *   <div class="import-history">
 *     <div class="filters">
 *       <input
 *         v-model="searchQuery"
 *         type="search"
 *         placeholder="Search by resource ID..."
 *       />
 *       <select v-model="statusFilter">
 *         <option value="all">All Statuses</option>
 *         <option value="DONE">Completed</option>
 *         <option value="IN_PROGRESS">In Progress</option>
 *         <option value="ERROR">Failed</option>
 *       </select>
 *     </div>
 *
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>Resource ID</th>
 *           <th>Status</th>
 *           <th>Records</th>
 *           <th>Actions</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="[id, imp] in filteredImports" :key="id">
 *           <td><code>{{ id }}</code></td>
 *           <td><span :class="`badge-${imp.status}`">{{ imp.status }}</span></td>
 *           <td>{{ imp.importer?.state?.num_records || 'N/A' }}</td>
 *           <td>
 *             <button @click="$router.push(`/datastore/${id}`)">
 *               View Data
 *             </button>
 *           </td>
 *         </tr>
 *       </tbody>
 *     </table>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDatastoreImport} to monitor a specific import by identifier
 * @see {@link useTriggerDatastoreImport} to start a new datastore import
 * @see {@link useDeleteDatastore} to delete an imported datastore
 */
export function useDatastoreImports(options: UseDatastoreImportsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datastore', 'imports'] as const,
    queryFn: () => client.listDatastoreImports(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 0, // Default to always refetch
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Fetches import status for a specific resource with automatic polling for live progress updates.
 *
 * This composable monitors the datastore import process for a single distribution/resource,
 * providing detailed progress information during active imports. It's built on top of
 * {@link useDatastoreImports} and automatically extracts the specific resource's import data
 * from the complete import dictionary. Supports real-time polling to track import progress
 * until completion.
 *
 * **When to Use This vs useDatastoreImports**:
 * - Use this when monitoring a specific resource's import (e.g., on a dataset detail page)
 * - Use {@link useDatastoreImports} when displaying catalog-wide import status
 *
 * **Smart Polling Pattern**:
 * Set up conditional polling that automatically stops when the import completes:
 * ```typescript
 * refetchInterval: computed(() =>
 *   importData.value?.status === 'IN_PROGRESS' ? 3000 : false
 * )
 * ```
 *
 * Use this composable when you need to:
 * - Monitor a specific resource's import progress
 * - Display import status on dataset/distribution detail pages
 * - Build resource-specific import progress indicators
 * - Track individual import completion
 * - Debug specific import failures
 *
 * @param options - Configuration including resource identifier and polling interval
 *
 * @returns TanStack Vue Query result object with single import status
 *
 * @example
 * Resource-specific import progress monitor:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDatastoreImport } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ resourceId: string }>()
 *
 * const { data: importData, isLoading } = useDatastoreImport({
 *   identifier: () => props.resourceId,
 *   refetchInterval: computed(() =>
 *     importData.value?.status === 'IN_PROGRESS' ? 3000 : false
 *   ),
 * })
 *
 * const progress = computed(() => {
 *   if (!importData.value?.importer?.state) return null
 *   return {
 *     records: importData.value.importer.state.num_records,
 *     pointer: importData.value.importer.state.pointer,
 *   }
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading import status...</div>
 *   <div v-else-if="!importData">No import found for this resource</div>
 *   <div v-else class="import-status">
 *     <div :class="`status-badge ${importData.status.toLowerCase()}`">
 *       {{ importData.status }}
 *     </div>
 *
 *     <div v-if="importData.status === 'IN_PROGRESS' && progress" class="progress">
 *       <h4>Import in Progress</h4>
 *       <p>{{ progress.records.toLocaleString() }} records imported</p>
 *       <div class="progress-bar">
 *         <div class="progress-fill" :style="{ width: '50%' }"></div>
 *       </div>
 *     </div>
 *
 *     <div v-else-if="importData.status === 'DONE'" class="success">
 *       <h4>Import Complete!</h4>
 *       <p>
 *         {{ importData.importer?.state?.num_records || 0 }} records successfully
 *         imported
 *       </p>
 *     </div>
 *
 *     <div v-else-if="importData.status === 'ERROR'" class="error">
 *       <h4>Import Failed</h4>
 *       <p class="error-message">
 *         {{ importData.importer?.state?.error || 'Unknown error occurred' }}
 *       </p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Import status with file download progress:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDatastoreImport } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ distributionId: string }>()
 *
 * const { data: imp } = useDatastoreImport({
 *   identifier: () => props.distributionId,
 *   refetchInterval: 3000,
 * })
 *
 * const downloadProgress = computed(() => {
 *   const fetcher = imp.value?.file_fetcher?.state
 *   if (!fetcher) return null
 *   return {
 *     path: fetcher.file_path,
 *     bytes: fetcher.bytes_copied,
 *   }
 * })
 * </script>
 *
 * <template>
 *   <div v-if="imp" class="detailed-import-status">
 *     <h3>Datastore Import Status</h3>
 *
 *     <div v-if="downloadProgress" class="download-phase">
 *       <h4>Phase 1: Downloading File</h4>
 *       <p>{{ downloadProgress.path }}</p>
 *       <p>{{ (downloadProgress.bytes / 1024 / 1024).toFixed(2) }} MB downloaded</p>
 *     </div>
 *
 *     <div v-if="imp.importer" class="import-phase">
 *       <h4>Phase 2: Importing Records</h4>
 *       <p>{{ imp.importer.state.num_records }} records</p>
 *       <p v-if="imp.importer.state.pointer">
 *         Position: {{ imp.importer.state.pointer }}
 *       </p>
 *     </div>
 *
 *     <div class="overall-status" :class="imp.status">
 *       {{ imp.status }}
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Retry failed import with error display:
 * ```vue
 * <script setup lang="ts">
 * import { useDatastoreImport, useTriggerDatastoreImport } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ resourceId: string }>()
 *
 * const { data: imp } = useDatastoreImport({
 *   identifier: () => props.resourceId,
 * })
 *
 * const triggerImport = useTriggerDatastoreImport()
 *
 * function retryImport() {
 *   triggerImport.mutate({ resource_id: props.resourceId })
 * }
 * </script>
 *
 * <template>
 *   <div v-if="imp?.status === 'ERROR'" class="failed-import">
 *     <div class="error-banner">
 *       <h4>Import Failed</h4>
 *       <p class="error-details">
 *         {{ imp.importer?.state?.error || 'Unknown error' }}
 *       </p>
 *     </div>
 *
 *     <button @click="retryImport" :disabled="triggerImport.isPending">
 *       {{ triggerImport.isPending ? 'Retrying...' : 'Retry Import' }}
 *     </button>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDatastoreImports} to list all imports across the catalog
 * @see {@link useTriggerDatastoreImport} to start a new import
 */
export function useDatastoreImport(options: UseDatastoreImportOptions) {
  const client = useDkanClient()
  const imports = useDatastoreImports({
    enabled: options.enabled,
    staleTime: options.staleTime,
    refetchInterval: options.refetchInterval,
  })

  return {
    ...imports,
    data: computed(() => imports.data.value?.[toValue(options.identifier)]),
  }
}

/**
 * Mutation composable to trigger a datastore import
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTriggerDatastoreImport } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ resourceId: string }>()
 *
 * const triggerImport = useTriggerDatastoreImport()
 *
 * const handleImport = () => {
 *   triggerImport.mutate(
 *     { resource_id: props.resourceId },
 *     {
 *       onSuccess: (result) => {
 *         console.log('Import started:', result.status)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <button @click="handleImport" :disabled="triggerImport.isPending">
 *     {{ triggerImport.isPending ? 'Starting...' : 'Import to Datastore' }}
 *   </button>
 * </template>
 * ```
 */
export function useTriggerDatastoreImport() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<DatastoreImport, Error, DatastoreImportOptions>({
    mutationFn: (options) => client.triggerDatastoreImport(options),
    onSuccess: () => {
      // Invalidate imports list
      queryClient.invalidateQueries({ queryKey: ['datastore', 'imports'] })
      // Invalidate datastore queries since new data may be available
      queryClient.invalidateQueries({ queryKey: ['datastore', 'query'] })
    },
  })
}

/**
 * Mutation composable to delete a datastore
 * Deletes a specific resource datastore or all datastores for a dataset
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDeleteDatastore } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const deleteDatastore = useDeleteDatastore()
 *
 * const handleDelete = () => {
 *   if (confirm('Delete this datastore? This cannot be undone.')) {
 *     deleteDatastore.mutate(props.identifier, {
 *       onSuccess: (result) => {
 *         console.log(result.message)
 *       },
 *     })
 *   }
 * }
 * </script>
 *
 * <template>
 *   <button
 *     @click="handleDelete"
 *     :disabled="deleteDatastore.isPending"
 *     class="btn-danger"
 *   >
 *     {{ deleteDatastore.isPending ? 'Deleting...' : 'Delete Datastore' }}
 *   </button>
 * </template>
 * ```
 */
export function useDeleteDatastore() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (identifier) => client.deleteDatastore(identifier),
    onSuccess: (data, identifier) => {
      // Invalidate imports list
      queryClient.invalidateQueries({ queryKey: ['datastore', 'imports'] })
      // Remove statistics for this identifier
      queryClient.removeQueries({
        queryKey: ['datastore', 'statistics', identifier],
      })
      // Invalidate datastore queries
      queryClient.invalidateQueries({ queryKey: ['datastore', 'query'] })
    },
  })
}

/**
 * Fetches statistics about a datastore's imported data with reactive parameters.
 *
 * This composable retrieves metadata about the structure and size of a datastore table, including
 * the number of rows, number of columns, and column definitions. This information is useful for
 * understanding the shape and volume of imported data without querying the data itself. Fully
 * reactive with Vue's MaybeRefOrGetter pattern for dynamic identifier tracking.
 *
 * The statistics are generated after a successful datastore import and remain available as long
 * as the datastore exists. They provide a quick way to check if data was imported successfully
 * and to understand its structure before building queries.
 *
 * **What Statistics Are Returned**:
 * - `numOfRows`: Total number of records in the datastore table
 * - `numOfColumns`: Total number of columns/fields
 * - `columns`: Dictionary of column names with their type definitions and constraints
 *
 * Use this composable when you need to:
 * - Display datastore size and structure information
 * - Verify that a datastore import completed successfully
 * - Build dynamic UI elements based on available columns
 * - Show data volume metrics to users
 * - Check if a datastore has data before querying
 * - Create column selectors for query builders
 *
 * @param options - Configuration options including the datastore identifier
 *
 * @returns TanStack Vue Query result object containing reactive statistics
 *
 * @example
 * Basic usage - display datastore size with reactive identifier:
 * ```vue
 * <script setup lang="ts">
 * import { useDatastoreStatistics } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const { data: stats, isLoading, error } = useDatastoreStatistics({
 *   identifier: () => props.identifier,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading statistics...</div>
 *   <div v-else-if="error" class="error">
 *     Error: {{ error.message }}
 *   </div>
 *   <div v-else-if="stats" class="datastore-info">
 *     <h4>Datastore Statistics</h4>
 *     <p>Rows: {{ stats.numOfRows.toLocaleString() }}</p>
 *     <p>Columns: {{ stats.numOfColumns }}</p>
 *     <p>Available columns: {{ Object.keys(stats.columns).join(', ') }}</p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Building a column selector from statistics:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatastoreStatistics } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const selectedColumns = ref<string[]>([])
 * const { data: stats } = useDatastoreStatistics({
 *   identifier: () => props.identifier,
 * })
 *
 * const availableColumns = computed(() =>
 *   stats.value ? Object.keys(stats.value.columns) : []
 * )
 *
 * function toggleColumn(column: string) {
 *   if (selectedColumns.value.includes(column)) {
 *     selectedColumns.value = selectedColumns.value.filter((c) => c !== column)
 *   } else {
 *     selectedColumns.value = [...selectedColumns.value, column]
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="column-selector">
 *     <h4>Select Columns to Display</h4>
 *     <div v-for="column in availableColumns" :key="column" class="column-option">
 *       <label>
 *         <input
 *           type="checkbox"
 *           :checked="selectedColumns.includes(column)"
 *           @change="toggleColumn(column)"
 *         />
 *         {{ column }}
 *       </label>
 *     </div>
 *     <p v-if="selectedColumns.length > 0">
 *       Selected: {{ selectedColumns.join(', ') }}
 *     </p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Conditional rendering based on data availability:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDatastoreStatistics } from '@dkan-client-tools/vue'
 * import DataQueryInterface from './DataQueryInterface.vue'
 * import ImportDataButton from './ImportDataButton.vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const { data: stats, isLoading } = useDatastoreStatistics({
 *   identifier: () => props.identifier,
 * })
 *
 * const hasData = computed(() => stats.value && stats.value.numOfRows > 0)
 * </script>
 *
 * <template>
 *   <div class="datastore-viewer">
 *     <div v-if="isLoading">Checking datastore...</div>
 *     <div v-else-if="hasData">
 *       <DataQueryInterface
 *         :identifier="identifier"
 *         :columns="Object.keys(stats.columns)"
 *         :total-rows="stats.numOfRows"
 *       />
 *     </div>
 *     <div v-else class="no-data">
 *       <p>No data imported yet</p>
 *       <ImportDataButton :identifier="identifier" />
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Display column types and constraints with reactive ref:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDatastoreStatistics } from '@dkan-client-tools/vue'
 *
 * const resourceId = ref('resource-123')
 * const { data: stats } = useDatastoreStatistics({
 *   identifier: resourceId, // Reactive ref automatically tracked
 * })
 *
 * // Change resource ID - composable automatically refetches
 * function switchResource(newId: string) {
 *   resourceId.value = newId
 * }
 * </script>
 *
 * <template>
 *   <div v-if="stats" class="schema-viewer">
 *     <h3>Column Schema ({{ stats.numOfColumns }} columns)</h3>
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>Column Name</th>
 *           <th>Type</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="(def, name) in stats.columns" :key="name">
 *           <td><code>{{ name }}</code></td>
 *           <td>{{ def.type }}</td>
 *         </tr>
 *       </tbody>
 *     </table>
 *     <p class="row-count">
 *       Total Records: {{ stats.numOfRows.toLocaleString() }}
 *     </p>
 *   </div>
 *
 *   <div class="resource-switcher">
 *     <button @click="switchResource('resource-456')">
 *       Switch to Resource 456
 *     </button>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDatastoreImport} for monitoring import progress
 * @see {@link useDatastore} for querying datastore data
 * @see https://dkan.readthedocs.io/en/latest/apis/datastore-import.html
 */
export function useDatastoreStatistics(options: UseDatastoreStatisticsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => ['datastore', 'statistics', toValue(options.identifier)] as const),
    queryFn: () => client.getDatastoreStatistics(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) !== false && !!toValue(options.identifier),
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes
  })
}
