/**
 * useDataset - Composable for fetching a single DKAN dataset
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'

/**
 * Configuration options for the useDataset composable.
 */
export interface UseDatasetOptions {
  /**
   * The unique identifier (UUID) of the dataset to fetch.
   *
   * Can be a ref, computed, or plain string for maximum flexibility.
   * The query will automatically re-run when this value changes.
   */
  identifier: MaybeRefOrGetter<string>

  /**
   * Whether the query should automatically execute.
   *
   * Can be a ref or computed for reactive enabling/disabling.
   * Set to `false` to disable the query until a condition is met.
   *
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time in milliseconds before cached dataset is considered stale.
   *
   * Dataset metadata changes infrequently, so longer stale times improve performance.
   *
   * @default 300000 (5 minutes)
   */
  staleTime?: number

  /**
   * Time in milliseconds before unused cached dataset is garbage collected.
   *
   * @default 300000 (5 minutes)
   */
  gcTime?: number
}

/**
 * Fetches a single dataset from DKAN by its unique identifier.
 *
 * This composable uses TanStack Vue Query to automatically cache the dataset and refetch
 * it in the background when the data becomes stale. The query is fully reactive - it will
 * automatically re-run when the identifier changes.
 *
 * Datasets in DKAN follow the DCAT-US metadata schema and include information about:
 * - Basic metadata (title, description, keywords, themes)
 * - Publisher and contact information
 * - Temporal and spatial coverage
 * - Distributions (downloadable files and APIs)
 * - Access rights and licensing
 *
 * Use this composable when you need to:
 * - Display detailed dataset information on a dataset detail page
 * - Show dataset metadata in cards or lists
 * - Build dataset editing forms (fetch current data first)
 * - Access distribution information for downloads or API access
 *
 * @param options - Configuration options for the dataset query
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing the dataset object with DCAT-US metadata
 *   - `isLoading`: Ref that is true during the initial fetch
 *   - `isFetching`: Ref that is true whenever data is being fetched
 *   - `isError`: Ref that is true if the query failed
 *   - `error`: Ref containing the error object if the request failed
 *   - `refetch`: Function to manually re-query the dataset
 *   - `suspense`: Promise for use with Vue Suspense
 *
 * @example
 * Basic usage - display dataset details:
 * ```vue
 * <script setup lang="ts">
 * import { useDataset } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string }>()
 *
 * const { data: dataset, isLoading, error } = useDataset({
 *   identifier: () => props.datasetId,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading dataset...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else-if="dataset">
 *     <h1>{{ dataset.title }}</h1>
 *     <p>{{ dataset.description }}</p>
 *     <div class="metadata">
 *       <p><strong>Publisher:</strong> {{ dataset.publisher.name }}</p>
 *       <p><strong>Modified:</strong> {{ dataset.modified }}</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * With reactive identifier and custom stale time:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDataset } from '@dkan-client-tools/vue'
 *
 * const selectedId = ref('dataset-123')
 *
 * // Query automatically updates when selectedId changes
 * const { data, isLoading } = useDataset({
 *   identifier: selectedId,
 *   staleTime: 600000, // Cache for 10 minutes
 * })
 *
 * function selectDataset(id: string) {
 *   selectedId.value = id // Triggers new fetch
 * }
 * </script>
 *
 * <template>
 *   <select @change="selectDataset($event.target.value)">
 *     <option value="dataset-123">Dataset A</option>
 *     <option value="dataset-456">Dataset B</option>
 *   </select>
 *
 *   <div v-if="!isLoading && data">
 *     <h2>{{ data.title }}</h2>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Conditional fetching with computed enabled:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDataset } from '@dkan-client-tools/vue'
 *
 * const route = useRoute()
 * const userHasAccess = ref(false)
 *
 * // Only fetch if user has access
 * const shouldFetch = computed(() => userHasAccess.value)
 *
 * const { data, isLoading } = useDataset({
 *   identifier: () => route.params.id as string,
 *   enabled: shouldFetch,
 * })
 *
 * onMounted(async () => {
 *   // Check user permissions first
 *   userHasAccess.value = await checkUserAccess()
 * })
 * </script>
 *
 * <template>
 *   <div v-if="!userHasAccess">Access denied</div>
 *   <div v-else-if="isLoading">Loading...</div>
 *   <div v-else-if="data">{{ data.title }}</div>
 * </template>
 * ```
 *
 * @example
 * Manual refetch for refresh functionality:
 * ```vue
 * <script setup lang="ts">
 * import { useDataset } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ id: string }>()
 *
 * const { data, isLoading, isFetching, refetch } = useDataset({
 *   identifier: () => props.id,
 * })
 *
 * async function refreshDataset() {
 *   await refetch()
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button @click="refreshDataset" :disabled="isFetching">
 *       {{ isFetching ? 'Refreshing...' : 'Refresh Dataset' }}
 *     </button>
 *
 *     <div v-if="!isLoading && data">
 *       <h1>{{ data.title }}</h1>
 *       <p>Last updated: {{ data.modified }}</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useAllDatasets} for fetching all datasets
 * @see {@link useDatasetSearch} for searching datasets
 * @see {@link useUpdateDataset} for updating dataset metadata
 * @see https://resources.data.gov/resources/dcat-us/
 */
export function useDataset(options: UseDatasetOptions) {
  const client = useDkanClient()
  const { identifier, enabled, staleTime, gcTime } = options

  return useQuery({
    queryKey: ['dataset', identifier],
    queryFn: () => client.fetchDataset(toValue(identifier)),
    enabled: () => {
      const isEnabled = toValue(enabled) ?? true
      const hasIdentifier = !!toValue(identifier)
      return isEnabled && hasIdentifier
    },
    staleTime,
    gcTime,
  })
}
