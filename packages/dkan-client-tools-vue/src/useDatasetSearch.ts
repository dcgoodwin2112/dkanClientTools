/**
 * useDatasetSearch - Composable for searching DKAN datasets
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import type { DatasetQueryOptions } from '@dkan-client-tools/core'
import { useDkanClient } from './plugin'

/**
 * Configuration options for the useDatasetSearch composable.
 */
export interface UseDatasetSearchOptions {
  /**
   * Query parameters for filtering and searching datasets.
   *
   * Can be a ref, computed, or plain object for reactive search updates.
   *
   * Supports:
   * - `fulltext`: Free-text search across all fields
   * - `keyword`: Filter by exact keyword matches
   * - `theme`: Filter by theme taxonomy terms
   * - `page`: Page number for pagination (1-based)
   * - `page-size`: Number of results per page
   * - `sort`: Sort field and direction
   */
  searchOptions?: MaybeRefOrGetter<DatasetQueryOptions | undefined>

  /**
   * Whether the query should automatically execute.
   *
   * Can be a ref or computed for reactive enabling/disabling.
   *
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time in milliseconds before cached search results are considered stale.
   *
   * @default 300000 (5 minutes)
   */
  staleTime?: number

  /**
   * Time in milliseconds before unused cached results are garbage collected.
   *
   * @default 300000 (5 minutes)
   */
  gcTime?: number
}

/**
 * Searches and filters DKAN datasets with powerful query capabilities.
 *
 * This composable provides access to DKAN's search API, enabling full-text search,
 * faceted filtering, and pagination. The query is fully reactive and will automatically
 * re-run when search options change.
 *
 * Search capabilities include:
 * - Full-text search across all dataset metadata
 * - Keyword and theme filtering
 * - Pagination with customizable page sizes
 * - Sorting by various fields
 * - Faceted search for building filter UIs
 *
 * Use this composable when you need to:
 * - Build dataset catalogs or browse pages
 * - Implement search interfaces with filters
 * - Create paginated dataset lists
 * - Display datasets filtered by theme or keyword
 * - Build faceted search experiences
 *
 * @param options - Configuration options for the search query
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing search results with datasets array and facets
 *   - `isLoading`: Ref that is true during the initial search
 *   - `isFetching`: Ref that is true whenever a search is executing
 *   - `isError`: Ref that is true if the search failed
 *   - `error`: Ref containing the error object if the request failed
 *   - `refetch`: Function to manually re-execute the search
 *   - `suspense`: Promise for use with Vue Suspense
 *
 * @example
 * Basic usage - reactive search with computed options:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatasetSearch } from '@dkan-client-tools/vue'
 *
 * const searchQuery = ref('')
 *
 * const { data, isLoading } = useDatasetSearch({
 *   searchOptions: computed(() => ({
 *     fulltext: searchQuery.value || undefined,
 *     'page-size': 10,
 *   })),
 * })
 * </script>
 *
 * <template>
 *   <div>
 *     <input v-model="searchQuery" placeholder="Search datasets..." />
 *     <div v-if="isLoading">Searching...</div>
 *     <ul v-else-if="data">
 *       <li v-for="dataset in data.results" :key="dataset.identifier">
 *         <h3>{{ dataset.title }}</h3>
 *         <p>{{ dataset.description }}</p>
 *       </li>
 *     </ul>
 *     <p v-if="data">Found {{ data.total }} datasets</p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Advanced filtering with theme and keyword:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatasetSearch } from '@dkan-client-tools/vue'
 *
 * const selectedTheme = ref<string>()
 * const selectedKeyword = ref<string>()
 * const page = ref(1)
 * const pageSize = 20
 *
 * const searchOptions = computed(() => ({
 *   theme: selectedTheme.value,
 *   keyword: selectedKeyword.value,
 *   page: page.value,
 *   'page-size': pageSize,
 *   sort: 'modified' as const,
 * }))
 *
 * const { data, isLoading, isFetching } = useDatasetSearch({
 *   searchOptions,
 *   staleTime: 60000, // Cache for 1 minute
 * })
 *
 * const totalPages = computed(() =>
 *   data.value ? Math.ceil(data.value.total / pageSize) : 0
 * )
 * </script>
 *
 * <template>
 *   <div class="dataset-browser">
 *     <div class="filters">
 *       <select v-model="selectedTheme">
 *         <option :value="undefined">All Themes</option>
 *         <option value="health">Health</option>
 *         <option value="education">Education</option>
 *       </select>
 *
 *       <select v-model="selectedKeyword">
 *         <option :value="undefined">All Keywords</option>
 *         <option value="covid-19">COVID-19</option>
 *         <option value="census">Census</option>
 *       </select>
 *     </div>
 *
 *     <div v-if="isFetching" class="loading-indicator">
 *       Updating results...
 *     </div>
 *
 *     <div v-if="data" class="results">
 *       <div v-for="dataset in data.results" :key="dataset.identifier" class="dataset-card">
 *         <h3>{{ dataset.title }}</h3>
 *         <p>{{ dataset.description }}</p>
 *         <div class="tags">
 *           <span v-for="keyword in dataset.keyword" :key="keyword" class="tag">
 *             {{ keyword }}
 *           </span>
 *         </div>
 *       </div>
 *
 *       <div class="pagination">
 *         <button @click="page--" :disabled="page === 1">Previous</button>
 *         <span>Page {{ page }} of {{ totalPages }}</span>
 *         <button @click="page++" :disabled="page >= totalPages">Next</button>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Faceted search with dynamic filters:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatasetSearch } from '@dkan-client-tools/vue'
 *
 * const searchText = ref('')
 * const selectedThemes = ref<string[]>([])
 *
 * const { data, isLoading } = useDatasetSearch({
 *   searchOptions: computed(() => ({
 *     fulltext: searchText.value || undefined,
 *     theme: selectedThemes.value.length > 0 ? selectedThemes.value : undefined,
 *     'page-size': 50,
 *   })),
 * })
 *
 * // Extract available themes from facets
 * const availableThemes = computed(() => {
 *   if (!data.value?.facets?.theme) return []
 *   return Object.entries(data.value.facets.theme).map(([theme, count]) => ({
 *     theme,
 *     count,
 *   }))
 * })
 *
 * function toggleTheme(theme: string) {
 *   const index = selectedThemes.value.indexOf(theme)
 *   if (index > -1) {
 *     selectedThemes.value.splice(index, 1)
 *   } else {
 *     selectedThemes.value.push(theme)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="faceted-search">
 *     <aside class="filters">
 *       <input v-model="searchText" type="search" placeholder="Search datasets..." />
 *
 *       <h3>Filter by Theme</h3>
 *       <div v-for="{ theme, count } in availableThemes" :key="theme">
 *         <label>
 *           <input
 *             type="checkbox"
 *             :checked="selectedThemes.includes(theme)"
 *             @change="toggleTheme(theme)"
 *           />
 *           {{ theme }} ({{ count }})
 *         </label>
 *       </div>
 *     </aside>
 *
 *     <main class="results">
 *       <div v-if="isLoading">Loading...</div>
 *       <div v-else-if="data">
 *         <p>{{ data.total }} datasets found</p>
 *         <div v-for="dataset in data.results" :key="dataset.identifier">
 *           <h2>{{ dataset.title }}</h2>
 *           <p>{{ dataset.description }}</p>
 *         </div>
 *       </div>
 *     </main>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDataset} for fetching a single dataset by ID
 * @see https://dkan.readthedocs.io/en/latest/apis/search.html
 */
export function useDatasetSearch(options: UseDatasetSearchOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'search', () => toValue(options.searchOptions) || {}] as const,
    queryFn: () => client.searchDatasets(toValue(options.searchOptions)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  })
}
