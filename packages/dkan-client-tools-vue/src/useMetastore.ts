/**
 * Vue composables for DKAN Metastore operations
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'

export interface UseAllDatasetsOptions {
  /**
   * Enable/disable the query
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseSchemasOptions {
  /**
   * Enable/disable the query
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseSchemaItemsOptions {
  /**
   * The schema ID to fetch items for
   */
  schemaId: MaybeRefOrGetter<string>

  /**
   * Enable/disable the query
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseFacetsOptions {
  /**
   * Enable/disable the query
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

/**
 * Fetches all datasets with complete DCAT-US metadata from the metastore.
 *
 * This composable retrieves the entire catalog of datasets with their full metadata following
 * the DCAT-US schema. Unlike search endpoints that return summarized results, this provides
 * complete dataset metadata including distributions, publishers, keywords, themes, and all
 * other DCAT-US fields. Results are automatically cached and can be configured to stay fresh
 * for extended periods since catalog-wide data changes less frequently.
 *
 * **Key Features**:
 * - Returns complete DCAT-US metadata for all datasets
 * - Includes all distributions, contact points, and temporal coverage
 * - Automatic background refetching to keep catalog current
 * - Efficient caching with configurable stale time
 * - Perfect for catalog-wide operations and bulk processing
 *
 * **Performance Note**: This endpoint returns ALL datasets in the catalog. For large catalogs
 * (100+ datasets), consider using {@link useDatasetSearch} with pagination or implementing
 * virtual scrolling for better performance.
 *
 * Use this composable when you need to:
 * - Display the complete catalog of available datasets
 * - Build catalog overview pages with all datasets
 * - Generate catalog-wide reports and statistics
 * - Export the entire catalog for external processing
 * - Populate dataset selection interfaces
 * - Perform bulk operations across all datasets
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Vue Query result object with array of complete datasets
 *
 * @example
 * Basic catalog listing with metadata:
 * ```vue
 * <script setup lang="ts">
 * import { useAllDatasets } from '@dkan-client-tools/vue'
 *
 * const { data: datasets, isLoading, error } = useAllDatasets()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading catalog...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else class="catalog-grid">
 *     <article
 *       v-for="dataset in datasets"
 *       :key="dataset.identifier"
 *       class="dataset-card"
 *     >
 *       <h3>{{ dataset.title }}</h3>
 *       <p>{{ dataset.description }}</p>
 *       <div class="metadata">
 *         <span class="publisher">{{ dataset.publisher?.name }}</span>
 *         <span class="modified">
 *           Updated: {{ new Date(dataset.modified).toLocaleDateString() }}
 *         </span>
 *       </div>
 *       <div class="tags">
 *         <span v-for="keyword in dataset.keyword" :key="keyword" class="tag">
 *           {{ keyword }}
 *         </span>
 *       </div>
 *       <div class="distributions">
 *         {{ dataset.distribution?.length || 0 }} distribution(s)
 *       </div>
 *     </article>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Catalog statistics dashboard:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useAllDatasets } from '@dkan-client-tools/vue'
 *
 * const { data: datasets, isLoading } = useAllDatasets({
 *   staleTime: 10 * 60 * 1000, // Cache for 10 minutes
 * })
 *
 * const stats = computed(() => {
 *   if (!datasets.value) return null
 *
 *   const totalDatasets = datasets.value.length
 *   const totalDistributions = datasets.value.reduce(
 *     (sum, d) => sum + (d.distribution?.length || 0),
 *     0
 *   )
 *   const uniquePublishers = new Set(
 *     datasets.value.map((d) => d.publisher?.name).filter(Boolean)
 *   ).size
 *   const allKeywords = datasets.value.flatMap((d) => d.keyword || [])
 *   const uniqueKeywords = new Set(allKeywords).size
 *   const mostCommonKeywords = Object.entries(
 *     allKeywords.reduce((acc, k) => {
 *       acc[k] = (acc[k] || 0) + 1
 *       return acc
 *     }, {} as Record<string, number>)
 *   )
 *     .sort(([, a], [, b]) => b - a)
 *     .slice(0, 10)
 *
 *   return {
 *     totalDatasets,
 *     totalDistributions,
 *     uniquePublishers,
 *     uniqueKeywords,
 *     mostCommonKeywords,
 *   }
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Calculating statistics...</div>
 *   <div v-else-if="stats" class="stats-dashboard">
 *     <div class="stat-card">
 *       <h3>Total Datasets</h3>
 *       <p class="stat-value">{{ stats.totalDatasets }}</p>
 *     </div>
 *     <div class="stat-card">
 *       <h3>Total Distributions</h3>
 *       <p class="stat-value">{{ stats.totalDistributions }}</p>
 *     </div>
 *     <div class="stat-card">
 *       <h3>Publishers</h3>
 *       <p class="stat-value">{{ stats.uniquePublishers }}</p>
 *     </div>
 *     <div class="stat-card">
 *       <h3>Keywords</h3>
 *       <p class="stat-value">{{ stats.uniqueKeywords }}</p>
 *     </div>
 *     <div class="top-keywords">
 *       <h3>Most Common Keywords</h3>
 *       <ul>
 *         <li v-for="[keyword, count] in stats.mostCommonKeywords" :key="keyword">
 *           <span class="keyword">{{ keyword }}</span>
 *           <span class="count">{{ count }} datasets</span>
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Dataset export functionality:
 * ```vue
 * <script setup lang="ts">
 * import { useAllDatasets } from '@dkan-client-tools/vue'
 *
 * const { data: datasets, isLoading } = useAllDatasets()
 *
 * function exportCatalog(format: 'json' | 'csv') {
 *   if (!datasets.value) return
 *
 *   if (format === 'json') {
 *     // Export as data.json (federal standard)
 *     const dataJson = {
 *       conformsTo: 'https://project-open-data.cio.gov/v1.1/schema',
 *       dataset: datasets.value,
 *     }
 *     const blob = new Blob([JSON.stringify(dataJson, null, 2)], {
 *       type: 'application/json',
 *     })
 *     const url = URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = 'catalog-data.json'
 *     a.click()
 *     URL.revokeObjectURL(url)
 *   } else if (format === 'csv') {
 *     // Export simplified CSV
 *     const headers = ['Identifier', 'Title', 'Publisher', 'Modified', 'Keywords']
 *     const rows = datasets.value.map((d) => [
 *       d.identifier,
 *       d.title,
 *       d.publisher?.name || '',
 *       d.modified,
 *       (d.keyword || []).join('; '),
 *     ])
 *     const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
 *     const blob = new Blob([csv], { type: 'text/csv' })
 *     const url = URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = 'catalog.csv'
 *     a.click()
 *     URL.revokeObjectURL(url)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="export-panel">
 *     <h2>Export Catalog ({{ datasets?.length || 0 }} datasets)</h2>
 *     <div class="export-buttons">
 *       <button @click="exportCatalog('json')" :disabled="isLoading">
 *         Export as data.json
 *       </button>
 *       <button @click="exportCatalog('csv')" :disabled="isLoading">
 *         Export as CSV
 *       </button>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDatasetSearch} for paginated search with filtering
 * @see {@link useDataset} to fetch a single dataset by identifier
 * @see {@link useDatasetFacets} to get available filters for the catalog
 */
export function useAllDatasets(options: UseAllDatasetsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'all'],
    queryFn: () => client.listAllDatasets(),
    staleTime: options.staleTime,
  })
}

/**
 * Fetches all available metastore schema identifiers with automatic caching.
 *
 * The metastore is DKAN's flexible schema-based storage system that can store different types
 * of metadata beyond just datasets. This composable retrieves the list of all registered schema
 * IDs in the metastore, which typically includes 'dataset' (DCAT-US metadata), 'data-dictionary'
 * (Frictionless table schemas), and potentially custom schemas defined by site administrators.
 *
 * **Common Schema IDs**:
 * - `dataset` - DCAT-US dataset metadata (title, description, distributions, etc.)
 * - `data-dictionary` - Frictionless Data table schemas (field definitions)
 * - Custom schemas can be added via Drupal configuration
 *
 * **Metastore Architecture**:
 * The metastore provides a JSON Schema-based storage system that allows DKAN to store
 * structured metadata with validation. Each schema defines the structure and validation
 * rules for a type of metadata. This composable lists all available schema types.
 *
 * Use this composable when you need to:
 * - Discover what types of metadata are available in the metastore
 * - Build dynamic schema selection interfaces
 * - Validate that a specific schema exists before querying items
 * - Create admin interfaces for managing different metadata types
 * - Generate schema-aware navigation or filtering
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Vue Query result object with array of schema IDs
 *
 * @example
 * Schema selector for metadata browser:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useSchemas, useSchemaItems } from '@dkan-client-tools/vue'
 *
 * const { data: schemas, isLoading } = useSchemas()
 * const selectedSchema = ref<string>()
 *
 * const { data: items } = useSchemaItems({
 *   schemaId: selectedSchema,
 *   enabled: () => !!selectedSchema.value,
 * })
 * </script>
 *
 * <template>
 *   <div class="schema-browser">
 *     <div v-if="isLoading">Loading schemas...</div>
 *     <select v-else v-model="selectedSchema">
 *       <option value="">-- Select a schema --</option>
 *       <option v-for="schema in schemas" :key="schema" :value="schema">
 *         {{ schema }}
 *       </option>
 *     </select>
 *
 *     <div v-if="selectedSchema && items" class="schema-items">
 *       <h3>{{ selectedSchema }} Items ({{ items.length }})</h3>
 *       <ul>
 *         <li v-for="item in items" :key="item.identifier">
 *           {{ item.title || item.identifier }}
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Schema availability checker:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useSchemas } from '@dkan-client-tools/vue'
 *
 * const { data: schemas, isLoading } = useSchemas()
 *
 * const hasDataDictionaries = computed(() =>
 *   schemas.value?.includes('data-dictionary') ?? false
 * )
 * const hasDatasets = computed(() => schemas.value?.includes('dataset') ?? false)
 * const customSchemas = computed(() =>
 *   schemas.value?.filter(
 *     (s) => s !== 'dataset' && s !== 'data-dictionary'
 *   ) || []
 * )
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Checking available schemas...</div>
 *   <div v-else class="schema-status">
 *     <div class="feature-status">
 *       <span class="label">Datasets:</span>
 *       <span :class="hasDatasets ? 'available' : 'unavailable'">
 *         {{ hasDatasets ? 'Available' : 'Not Available' }}
 *       </span>
 *     </div>
 *     <div class="feature-status">
 *       <span class="label">Data Dictionaries:</span>
 *       <span :class="hasDataDictionaries ? 'available' : 'unavailable'">
 *         {{ hasDataDictionaries ? 'Available' : 'Not Available' }}
 *       </span>
 *     </div>
 *     <div v-if="customSchemas.length > 0" class="custom-schemas">
 *       <h4>Custom Schemas:</h4>
 *       <ul>
 *         <li v-for="schema in customSchemas" :key="schema">
 *           {{ schema }}
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Admin dashboard with schema statistics:
 * ```vue
 * <script setup lang="ts">
 * import { useSchemas, useSchemaItems } from '@dkan-client-tools/vue'
 * import { useQueries } from '@tanstack/vue-query'
 * import { computed } from 'vue'
 *
 * const { data: schemas } = useSchemas()
 *
 * // Fetch item counts for all schemas in parallel
 * const schemaQueries = useQueries({
 *   queries: computed(() =>
 *     (schemas.value || []).map((schemaId) => ({
 *       queryKey: ['metastore', 'schema-items', schemaId],
 *       queryFn: () => useSchemaItems({ schemaId }).data.value || [],
 *     }))
 *   ),
 * })
 *
 * const schemaStats = computed(() =>
 *   (schemas.value || []).map((schemaId, index) => ({
 *     schemaId,
 *     count: schemaQueries.value[index]?.data?.length || 0,
 *     isLoading: schemaQueries.value[index]?.isLoading ?? true,
 *   }))
 * )
 * </script>
 *
 * <template>
 *   <div class="metastore-dashboard">
 *     <h2>Metastore Overview</h2>
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>Schema</th>
 *           <th>Items</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="stat in schemaStats" :key="stat.schemaId">
 *           <td>{{ stat.schemaId }}</td>
 *           <td>
 *             <span v-if="stat.isLoading">Loading...</span>
 *             <span v-else>{{ stat.count }}</span>
 *           </td>
 *         </tr>
 *       </tbody>
 *     </table>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useSchemaItems} to fetch all items for a specific schema
 * @see {@link useAllDatasets} to fetch all dataset items specifically
 */
export function useSchemas(options: UseSchemasOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['metastore', 'schemas'] as const,
    queryFn: () => client.listSchemas(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches all metadata items for a specific metastore schema with automatic caching.
 *
 * The metastore organizes metadata into schemas (types), and each schema can have multiple
 * items. This composable retrieves all items for a given schema ID. For example, the 'dataset'
 * schema contains all DCAT-US dataset metadata, while the 'data-dictionary' schema contains
 * all Frictionless table schema definitions.
 *
 * **Common Use Cases by Schema**:
 * - `dataset` schema - Returns all DCAT-US datasets (same as {@link useAllDatasets})
 * - `data-dictionary` schema - Returns all data dictionary/table schema definitions
 * - Custom schemas - Returns items for site-specific metadata types
 *
 * **Performance Note**: Like {@link useAllDatasets}, this returns ALL items for the schema.
 * For schemas with many items, consider implementing pagination or virtual scrolling.
 *
 * **Reactivity**: The schemaId parameter accepts reactive refs/computed values, allowing the
 * query to automatically update when the schema selection changes.
 *
 * Use this composable when you need to:
 * - Fetch all items of a specific metadata type
 * - Build schema-specific browse/search interfaces
 * - Generate reports for a particular schema
 * - Validate or process all items of a given type
 * - Create admin interfaces for schema management
 *
 * @param options - Configuration including the schema ID to fetch items for
 *
 * @returns TanStack Vue Query result object with array of schema items
 *
 * @example
 * Reactive schema browser with item listing:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useSchemas, useSchemaItems } from '@dkan-client-tools/vue'
 *
 * const { data: schemas } = useSchemas()
 * const selectedSchema = ref<string>('dataset')
 *
 * const { data: items, isLoading, error } = useSchemaItems({
 *   schemaId: selectedSchema,
 * })
 *
 * const itemCount = computed(() => items.value?.length || 0)
 * </script>
 *
 * <template>
 *   <div class="schema-browser">
 *     <header>
 *       <h2>Metastore Schema Browser</h2>
 *       <select v-model="selectedSchema">
 *         <option v-for="schema in schemas" :key="schema" :value="schema">
 *           {{ schema }}
 *         </option>
 *       </select>
 *     </header>
 *
 *     <div v-if="isLoading" class="loading">
 *       Loading {{ selectedSchema }} items...
 *     </div>
 *     <div v-else-if="error" class="error">
 *       Error loading items: {{ error.message }}
 *     </div>
 *     <div v-else>
 *       <p class="item-count">{{ itemCount }} items found</p>
 *       <ul class="item-list">
 *         <li v-for="item in items" :key="item.identifier" class="item">
 *           <h4>{{ item.title || item.identifier }}</h4>
 *           <p v-if="item.description" class="description">
 *             {{ item.description }}
 *           </p>
 *           <code class="identifier">{{ item.identifier }}</code>
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Data dictionary listing with conditional loading:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useSchemaItems } from '@dkan-client-tools/vue'
 *
 * const showDictionaries = ref(false)
 *
 * const { data: dictionaries, isLoading } = useSchemaItems({
 *   schemaId: 'data-dictionary',
 *   enabled: showDictionaries, // Only fetch when enabled
 * })
 * </script>
 *
 * <template>
 *   <div class="dictionaries-panel">
 *     <button @click="showDictionaries = !showDictionaries">
 *       {{ showDictionaries ? 'Hide' : 'Show' }} Data Dictionaries
 *     </button>
 *
 *     <div v-if="showDictionaries">
 *       <div v-if="isLoading">Loading dictionaries...</div>
 *       <div v-else-if="dictionaries">
 *         <h3>Data Dictionaries ({{ dictionaries.length }})</h3>
 *         <table>
 *           <thead>
 *             <tr>
 *               <th>Identifier</th>
 *               <th>Title</th>
 *               <th>Fields</th>
 *             </tr>
 *           </thead>
 *           <tbody>
 *             <tr v-for="dict in dictionaries" :key="dict.identifier">
 *               <td><code>{{ dict.identifier }}</code></td>
 *               <td>{{ dict.title || 'Untitled' }}</td>
 *               <td>{{ dict.data?.fields?.length || 0 }} fields</td>
 *             </tr>
 *           </tbody>
 *         </table>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Schema comparison with multiple simultaneous queries:
 * ```vue
 * <script setup lang="ts">
 * import { useSchemaItems } from '@dkan-client-tools/vue'
 *
 * const { data: datasets } = useSchemaItems({ schemaId: 'dataset' })
 * const { data: dictionaries } = useSchemaItems({ schemaId: 'data-dictionary' })
 * </script>
 *
 * <template>
 *   <div class="metastore-overview">
 *     <div class="schema-card">
 *       <h3>Datasets</h3>
 *       <p class="count">{{ datasets?.length || 0 }}</p>
 *       <p class="description">
 *         DCAT-US metadata records describing open data resources
 *       </p>
 *     </div>
 *
 *     <div class="schema-card">
 *       <h3>Data Dictionaries</h3>
 *       <p class="count">{{ dictionaries?.length || 0 }}</p>
 *       <p class="description">
 *         Frictionless table schemas defining data structure and types
 *       </p>
 *     </div>
 *
 *     <div class="schema-card">
 *       <h3>Dictionary Coverage</h3>
 *       <p class="count">
 *         {{
 *           datasets && dictionaries
 *             ? Math.round((dictionaries.length / datasets.length) * 100)
 *             : 0
 *         }}%
 *       </p>
 *       <p class="description">
 *         Percentage of datasets with data dictionaries
 *       </p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useSchemas} to fetch available schema IDs
 * @see {@link useAllDatasets} for specialized dataset schema access
 * @see {@link useDataDictionaryList} for specialized data dictionary access
 */
export function useSchemaItems(options: UseSchemaItemsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['metastore', 'schema-items', options.schemaId] as const,
    queryFn: () => client.getSchemaItems(toValue(options.schemaId)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches aggregated facet values across all datasets for building filter interfaces.
 *
 * Facets provide the complete set of unique values for filterable dataset properties across
 * the entire catalog. This composable returns all unique themes, keywords, publishers, and
 * other categorical values that appear in the catalog, making it ideal for building faceted
 * search and filter interfaces. Results are cached with a longer default stale time (5 minutes)
 * since facet values change infrequently.
 *
 * **Available Facets**:
 * - `theme` - DCAT-US category taxonomies (e.g., "Health", "Education", "Transportation")
 * - `keyword` - Free-text tags applied to datasets
 * - `publisher` - Organization names that published datasets
 * - Additional facets may be available depending on DKAN configuration
 *
 * **Faceted Search Pattern**:
 * Faceted search allows users to progressively refine results by selecting from available
 * filter values. This composable provides the filter options, which you can then use with
 * {@link useDatasetSearch} to filter results.
 *
 * Use this composable when you need to:
 * - Build faceted search filter interfaces
 * - Display available catalog categories and tags
 * - Create dataset filtering sidebars
 * - Generate tag clouds or category navigation
 * - Provide search refinement options
 * - Show catalog organization and structure
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Vue Query result object with facet value arrays
 *
 * @example
 * Faceted search sidebar with multiple filters:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatasetFacets, useDatasetSearch } from '@dkan-client-tools/vue'
 *
 * const { data: facets, isLoading: loadingFacets } = useDatasetFacets()
 *
 * const selectedThemes = ref<string[]>([])
 * const selectedKeywords = ref<string[]>([])
 * const selectedPublishers = ref<string[]>([])
 *
 * const searchParams = computed(() => ({
 *   theme: selectedThemes.value,
 *   keyword: selectedKeywords.value,
 *   publisher: selectedPublishers.value,
 * }))
 *
 * const { data: results } = useDatasetSearch(searchParams)
 *
 * function clearFilters() {
 *   selectedThemes.value = []
 *   selectedKeywords.value = []
 *   selectedPublishers.value = []
 * }
 * </script>
 *
 * <template>
 *   <div class="search-layout">
 *     <aside class="filters-sidebar">
 *       <div class="filter-header">
 *         <h2>Filters</h2>
 *         <button
 *           @click="clearFilters"
 *           :disabled="
 *             !selectedThemes.length &&
 *             !selectedKeywords.length &&
 *             !selectedPublishers.length
 *           "
 *         >
 *           Clear All
 *         </button>
 *       </div>
 *
 *       <div v-if="loadingFacets">Loading filters...</div>
 *       <div v-else-if="facets">
 *         <details open class="facet-group">
 *           <summary>
 *             Themes
 *             <span v-if="selectedThemes.length" class="badge">
 *               {{ selectedThemes.length }}
 *             </span>
 *           </summary>
 *           <ul>
 *             <li v-for="theme in facets.theme" :key="theme">
 *               <label>
 *                 <input
 *                   type="checkbox"
 *                   :value="theme"
 *                   v-model="selectedThemes"
 *                 />
 *                 {{ theme }}
 *               </label>
 *             </li>
 *           </ul>
 *         </details>
 *
 *         <details open class="facet-group">
 *           <summary>
 *             Publishers
 *             <span v-if="selectedPublishers.length" class="badge">
 *               {{ selectedPublishers.length }}
 *             </span>
 *           </summary>
 *           <ul>
 *             <li v-for="publisher in facets.publisher" :key="publisher">
 *               <label>
 *                 <input
 *                   type="checkbox"
 *                   :value="publisher"
 *                   v-model="selectedPublishers"
 *                 />
 *                 {{ publisher }}
 *               </label>
 *             </li>
 *           </ul>
 *         </details>
 *
 *         <details class="facet-group">
 *           <summary>
 *             Keywords
 *             <span v-if="selectedKeywords.length" class="badge">
 *               {{ selectedKeywords.length }}
 *             </span>
 *           </summary>
 *           <ul class="keyword-list">
 *             <li v-for="keyword in facets.keyword" :key="keyword">
 *               <label>
 *                 <input
 *                   type="checkbox"
 *                   :value="keyword"
 *                   v-model="selectedKeywords"
 *                 />
 *                 {{ keyword }}
 *               </label>
 *             </li>
 *           </ul>
 *         </details>
 *       </div>
 *     </aside>
 *
 *     <main class="search-results">
 *       <p v-if="results">{{ results.total }} datasets found</p>
 *       <!-- Display results here -->
 *     </main>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Interactive tag cloud with search integration:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatasetFacets, useDatasetSearch } from '@dkan-client-tools/vue'
 *
 * const { data: facets } = useDatasetFacets()
 * const selectedKeyword = ref<string>()
 *
 * const { data: results } = useDatasetSearch(
 *   computed(() => ({
 *     keyword: selectedKeyword.value ? [selectedKeyword.value] : undefined,
 *   }))
 * )
 *
 * // Calculate tag sizes based on dataset count
 * const keywordSizes = computed(() => {
 *   if (!facets.value?.keyword) return {}
 *   const max = Math.max(...facets.value.keyword.map((k) => k.length))
 *   return Object.fromEntries(
 *     facets.value.keyword.map((k) => [
 *       k,
 *       Math.max(0.8, (k.length / max) * 2),
 *     ])
 *   )
 * })
 * </script>
 *
 * <template>
 *   <div class="tag-cloud-view">
 *     <h2>Explore by Keyword</h2>
 *     <div v-if="facets" class="tag-cloud">
 *       <button
 *         v-for="keyword in facets.keyword"
 *         :key="keyword"
 *         @click="
 *           selectedKeyword = selectedKeyword === keyword ? undefined : keyword
 *         "
 *         :class="{ active: selectedKeyword === keyword }"
 *         :style="{ fontSize: keywordSizes[keyword] + 'rem' }"
 *         class="tag"
 *       >
 *         {{ keyword }}
 *       </button>
 *     </div>
 *
 *     <div v-if="selectedKeyword" class="filtered-results">
 *       <h3>Datasets tagged with "{{ selectedKeyword }}"</h3>
 *       <p v-if="results">{{ results.total }} datasets found</p>
 *       <!-- Display filtered results -->
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Catalog navigation by theme with counts:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatasetFacets, useDatasetSearch } from '@dkan-client-tools/vue'
 *
 * const { data: facets } = useDatasetFacets()
 *
 * // Get dataset count for each theme
 * const themeCounts = ref<Record<string, number>>({})
 *
 * async function loadThemeCounts() {
 *   if (!facets.value?.theme) return
 *
 *   for (const theme of facets.value.theme) {
 *     const { data } = await useDatasetSearch({
 *       theme: [theme],
 *       pageSize: 1, // Only need count, not results
 *     })
 *     if (data.value) {
 *       themeCounts.value[theme] = data.value.total
 *     }
 *   }
 * }
 *
 * // Load counts when facets are ready
 * watch(facets, (newFacets) => {
 *   if (newFacets) loadThemeCounts()
 * })
 * </script>
 *
 * <template>
 *   <nav class="theme-navigation">
 *     <h2>Browse by Theme</h2>
 *     <ul v-if="facets" class="theme-list">
 *       <li v-for="theme in facets.theme" :key="theme">
 *         <router-link :to="`/datasets?theme=${encodeURIComponent(theme)}`">
 *           <span class="theme-name">{{ theme }}</span>
 *           <span v-if="themeCounts[theme]" class="count">
 *             {{ themeCounts[theme] }} datasets
 *           </span>
 *         </router-link>
 *       </li>
 *     </ul>
 *   </nav>
 * </template>
 * ```
 *
 * @see {@link useDatasetSearch} to filter datasets using facet values
 * @see {@link useAllDatasets} for accessing complete dataset metadata
 */
export function useDatasetFacets(options: UseFacetsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'facets'] as const,
    queryFn: () => client.getDatasetFacets(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes since facets don't change often
  })
}
