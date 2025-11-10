/**
 * Vue composables for CKAN API Compatibility
 * Provides composables for CKAN-compatible endpoints for legacy tool support
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'
import type {
  CkanPackageSearchOptions,
  CkanDatastoreSearchOptions,
  CkanDatastoreSearchSqlOptions,
} from '@dkan-client-tools/core'

export interface UseCkanPackageSearchOptions extends CkanPackageSearchOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseCkanDatastoreSearchOptions extends CkanDatastoreSearchOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseCkanDatastoreSearchSqlOptions extends CkanDatastoreSearchSqlOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseCkanResourceShowOptions {
  resourceId: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseCkanPackageListOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

/**
 * Searches for datasets using CKAN's package_search API format for backward compatibility.
 *
 * DKAN provides a CKAN-compatible API layer to enable existing CKAN-based tools, scripts,
 * and applications to work with DKAN without modification. This composable provides the same
 * search functionality as {@link useDatasetSearch} but uses CKAN's API format and parameter
 * names instead of DKAN's native format.
 *
 * **CKAN Compatibility Features**:
 * - Uses CKAN parameter names (`q`, `rows`, `start` vs DKAN's `fulltext`, `page-size`, `page`)
 * - Returns results in CKAN's response format (with `count` and `results` fields)
 * - Supports CKAN's faceted search syntax (`facet.field`, `facet.limit`)
 * - Compatible with CKAN client libraries and tools
 * - Provides migration path from CKAN to DKAN
 *
 * **When to Use This Composable**:
 * - You're migrating an existing CKAN application to DKAN
 * - You need to maintain compatibility with CKAN-based tools
 * - You're building integrations that work with both CKAN and DKAN
 * - Your team is familiar with CKAN's API format
 *
 * **When to Use {@link useDatasetSearch} Instead**:
 * - You're building a new application from scratch
 * - You want to use DKAN's native API features
 * - You prefer DKAN's more intuitive parameter names
 *
 * **Reactive Parameters**: All search parameters accept refs or computed values. When these
 * change, the query automatically re-executes to fetch new results.
 *
 * Use this composable when you need to:
 * - Migrate existing CKAN applications to DKAN
 * - Build tools that work with both CKAN and DKAN catalogs
 * - Use existing CKAN client libraries with DKAN
 * - Maintain CKAN API compatibility for legacy integrations
 * - Build multi-catalog applications that connect to various open data platforms
 *
 * @param options - Configuration options for the CKAN package search query
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing search results in CKAN format with `count` and `results` array
 *   - `isLoading`: Ref<boolean> - true during the initial search
 *   - `isFetching`: Ref<boolean> - true whenever a search is executing
 *   - `isError`: Ref<boolean> - true if the search failed
 *   - `error`: Ref containing error object if the request failed
 *   - `refetch`: Function to manually re-execute the search
 *
 * @example
 * Basic CKAN-style search:
 * ```vue
 * <script setup lang="ts">
 * import { useCkanPackageSearch } from '@dkan-client-tools/vue'
 *
 * const { data, isLoading } = useCkanPackageSearch({
 *   q: 'water quality',
 *   rows: 20,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Searching...</div>
 *   <div v-else-if="data">
 *     <h2>Found {{ data.count }} datasets</h2>
 *     <div v-for="dataset in data.results" :key="dataset.identifier">
 *       <h3>{{ dataset.title }}</h3>
 *       <p>{{ dataset.description }}</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * CKAN faceted search with filters:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCkanPackageSearch } from '@dkan-client-tools/vue'
 *
 * const query = ref('climate')
 * const selectedOrg = ref<string>()
 *
 * const { data, isLoading } = useCkanPackageSearch({
 *   q: query,
 *   rows: 50,
 *   start: 0,
 *   facet: true,
 *   'facet.field': ['organization', 'tags', 'res_format'],
 *   fq: () => selectedOrg.value ? `organization:${selectedOrg.value}` : undefined,
 * })
 * </script>
 *
 * <template>
 *   <div class="ckan-search">
 *     <input
 *       v-model="query"
 *       type="search"
 *       placeholder="Search datasets (CKAN format)..."
 *     />
 *
 *     <div class="results">
 *       <aside class="facets">
 *         <h3>Filter by Organization</h3>
 *         <button
 *           v-for="facet in data?.search_facets?.organization?.items"
 *           :key="facet.name"
 *           @click="selectedOrg = facet.name"
 *           :class="{ active: selectedOrg === facet.name }"
 *         >
 *           {{ facet.display_name }} ({{ facet.count }})
 *         </button>
 *       </aside>
 *
 *       <main>
 *         <p>{{ data?.count || 0 }} datasets found</p>
 *         <article v-for="dataset in data?.results" :key="dataset.identifier">
 *           <h2>{{ dataset.title }}</h2>
 *           <p>{{ dataset.description }}</p>
 *           <div class="tags">
 *             <span v-for="tag in dataset.keyword" :key="tag" class="tag">
 *               {{ tag }}
 *             </span>
 *           </div>
 *         </article>
 *       </main>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Paginated CKAN search (compatible with CKAN pagination):
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useCkanPackageSearch } from '@dkan-client-tools/vue'
 *
 * const page = ref(1)
 * const rowsPerPage = 25
 *
 * const { data, isLoading, isFetching } = useCkanPackageSearch({
 *   q: '*:*', // CKAN syntax for "all datasets"
 *   rows: rowsPerPage,
 *   start: () => (page.value - 1) * rowsPerPage,
 *   sort: 'metadata_modified desc', // CKAN sort syntax
 * })
 *
 * const totalPages = computed(() =>
 *   data.value ? Math.ceil(data.value.count / rowsPerPage) : 0
 * )
 * </script>
 *
 * <template>
 *   <div>
 *     <div class="datasets">
 *       <div v-if="isFetching" class="spinner">Loading...</div>
 *       <div
 *         v-for="dataset in data?.results"
 *         :key="dataset.identifier"
 *         class="dataset-card"
 *       >
 *         <h3>{{ dataset.title }}</h3>
 *         <p class="description">{{ dataset.description }}</p>
 *         <p class="metadata">
 *           Last updated: {{ new Date(dataset.modified).toLocaleDateString() }}
 *         </p>
 *       </div>
 *     </div>
 *
 *     <div class="pagination">
 *       <button
 *         @click="page = Math.max(1, page - 1)"
 *         :disabled="page === 1 || isFetching"
 *       >
 *         Previous
 *       </button>
 *       <span>Page {{ page }} of {{ totalPages }}</span>
 *       <button
 *         @click="page++"
 *         :disabled="page >= totalPages || isFetching"
 *       >
 *         Next
 *       </button>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDatasetSearch} for DKAN's native dataset search API
 * @see {@link useCkanDatastoreSearch} for CKAN-compatible datastore querying
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.package_search
 */
export function useCkanPackageSearch(options: UseCkanPackageSearchOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['ckan', 'package-search', () => {
      const { enabled, staleTime, ...rest } = options
      const unwrapped: any = {}
      for (const [key, value] of Object.entries(rest)) {
        unwrapped[key] = toValue(value)
      }
      return unwrapped
    }] as const,
    queryFn: () => {
      const { enabled, staleTime, ...searchOptions } = options
      const unwrappedOptions: any = {}
      for (const [key, value] of Object.entries(searchOptions)) {
        unwrappedOptions[key] = toValue(value)
      }
      return client.ckanPackageSearch(unwrappedOptions)
    },
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Queries tabular data from a distribution's datastore using CKAN's datastore_search API format.
 *
 * This composable provides CKAN-compatible access to DKAN's datastore, allowing you to query the actual
 * tabular data that has been imported from CSV, JSON, or other data files. It uses CKAN's parameter
 * names and response format instead of DKAN's native datastore API.
 *
 * **CKAN Compatibility Features**:
 * - Uses CKAN parameter names (`resource_id`, `limit`, `offset` vs DKAN's native format)
 * - Returns results in CKAN's response format (with `fields` and `records` arrays)
 * - Supports CKAN's `filters` object for field-value matching
 * - Compatible with existing CKAN datastore client code
 * - Provides migration path from CKAN datastore queries
 *
 * **Data Import Requirement**: Before you can query data with this composable, the distribution's file
 * must be imported into DKAN's datastore using {@link useTriggerDatastoreImport}. The import
 * process downloads the file and loads it into a queryable database.
 *
 * **When to Use This Composable**:
 * - You're migrating CKAN datastore queries to DKAN
 * - You have existing code that uses CKAN's datastore_search API
 * - You need to maintain compatibility with CKAN-based analytics tools
 * - Your team is familiar with CKAN's datastore API format
 *
 * **When to Use {@link useDatastore} Instead**:
 * - You're building new applications from scratch
 * - You need advanced querying (SQL, joins, aggregations)
 * - You prefer DKAN's native API with more intuitive parameters
 * - You want to use DKAN-specific features
 *
 * **Reactive Parameters**: All query parameters accept refs or computed values for automatic reactivity.
 *
 * Use this composable when you need to:
 * - Query imported tabular data using CKAN's API format
 * - Build data tables and grids from distribution files
 * - Filter and paginate through dataset records with CKAN syntax
 * - Migrate existing CKAN datastore queries to DKAN
 * - Build cross-platform tools that work with both CKAN and DKAN
 *
 * @param options - Configuration options for the CKAN datastore search query
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing query results in CKAN format with `fields` array and `records` array
 *   - `isLoading`: Ref<boolean> - true during the initial query
 *   - `isFetching`: Ref<boolean> - true whenever a query is executing
 *   - `isError`: Ref<boolean> - true if the query failed
 *   - `error`: Ref containing error object if the request failed
 *   - `refetch`: Function to manually re-execute the query
 *
 * @example
 * Basic CKAN datastore query:
 * ```vue
 * <script setup lang="ts">
 * import { useCkanDatastoreSearch } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ resourceId: string }>()
 *
 * const { data, isLoading } = useCkanDatastoreSearch({
 *   resource_id: props.resourceId,
 *   limit: 100,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading data...</div>
 *   <table v-else-if="data">
 *     <thead>
 *       <tr>
 *         <th v-for="field in data.fields" :key="field.id">{{ field.id }}</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr v-for="(record, i) in data.records" :key="i">
 *         <td v-for="field in data.fields" :key="field.id">
 *           {{ String(record[field.id]) }}
 *         </td>
 *       </tr>
 *     </tbody>
 *   </table>
 * </template>
 * ```
 *
 * @example
 * CKAN datastore query with filtering:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCkanDatastoreSearch } from '@dkan-client-tools/vue'
 *
 * const state = ref('CA')
 * const year = ref('2023')
 *
 * const { data, isLoading, isFetching } = useCkanDatastoreSearch({
 *   resource_id: 'census-data-resource-id',
 *   limit: 50,
 *   offset: 0,
 *   // CKAN filters: exact match on field values
 *   filters: () => ({
 *     state: state.value,
 *     year: year.value,
 *   }),
 * })
 * </script>
 *
 * <template>
 *   <div>
 *     <div class="filters">
 *       <label>
 *         State:
 *         <select v-model="state">
 *           <option value="CA">California</option>
 *           <option value="NY">New York</option>
 *           <option value="TX">Texas</option>
 *         </select>
 *       </label>
 *
 *       <label>
 *         Year:
 *         <input v-model="year" type="number" />
 *       </label>
 *     </div>
 *
 *     <div v-if="isFetching" class="loading-overlay">Updating...</div>
 *
 *     <div v-if="data">
 *       <p>Found {{ data.total }} matching records</p>
 *       <table>
 *         <thead>
 *           <tr>
 *             <th v-for="field in data.fields" :key="field.id">
 *               {{ field.id }}
 *               <span v-if="field.type" class="type"> ({{ field.type }})</span>
 *             </th>
 *           </tr>
 *         </thead>
 *         <tbody>
 *           <tr v-for="(record, idx) in data.records" :key="idx">
 *             <td v-for="field in data.fields" :key="field.id">
 *               {{ String(record[field.id] ?? '') }}
 *             </td>
 *           </tr>
 *         </tbody>
 *       </table>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDatastore} for DKAN's native datastore querying with advanced features
 * @see {@link useSqlQuery} for SQL-based datastore queries
 * @see {@link useTriggerDatastoreImport} for importing data files into the datastore
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.datastore_search
 */
export function useCkanDatastoreSearch(options: UseCkanDatastoreSearchOptions) {
  const client = useDkanClient()
  const { enabled, staleTime, ...searchOptions } = options

  return useQuery({
    queryKey: ['ckan', 'datastore-search', () => searchOptions] as const,
    queryFn: () => {
      const unwrappedOptions: any = {}
      for (const [key, value] of Object.entries(searchOptions)) {
        unwrappedOptions[key] = toValue(value)
      }
      return client.ckanDatastoreSearch(unwrappedOptions)
    },
    enabled: () => (toValue(enabled) ?? true) && !!toValue(searchOptions.resource_id),
    staleTime,
  })
}

/**
 * Executes SQL queries against the datastore using CKAN's datastore_search_sql API format.
 *
 * This composable allows you to run SQL SELECT queries against DKAN's datastore using CKAN's
 * API format. It supports joins, aggregations, subqueries, and other advanced SQL operations
 * while maintaining compatibility with CKAN-based tools and scripts.
 *
 * **CKAN Compatibility Features**:
 * - Uses CKAN's `sql` parameter instead of DKAN's native format
 * - Returns results in CKAN's array format
 * - Compatible with existing CKAN SQL query tools
 * - Supports standard SQL SELECT operations
 *
 * **Security**: Only SELECT queries are permitted. CREATE, UPDATE, DELETE, and other write
 * operations are blocked to protect datastore integrity.
 *
 * **Table Names**: Datastore tables are named `datastore_{distribution_id}`. Use the
 * distribution's identifier to construct table names in your queries.
 *
 * **Reactive Parameters**: The sql parameter accepts refs or computed values for automatic reactivity.
 *
 * Use this composable when you need to:
 * - Run SQL queries using CKAN's API format
 * - Migrate existing CKAN SQL queries to DKAN
 * - Perform complex data analysis with SQL
 * - Join data across multiple distributions
 * - Generate reports with aggregations
 *
 * @param options - Configuration options including the SQL query string
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing query results as an array of objects
 *   - `isLoading`: Ref<boolean> - true during query execution
 *   - `isError`: Ref<boolean> - true if query failed
 *   - `error`: Ref containing error object if request failed
 *
 * @example
 * Basic SQL query:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useCkanDatastoreSearchSql } from '@dkan-client-tools/vue'
 *
 * const sql = ref('SELECT * FROM datastore_abc123 LIMIT 10')
 * const { data, isLoading } = useCkanDatastoreSearchSql({
 *   sql,
 *   enabled: computed(() => !!sql.value),
 * })
 * </script>
 *
 * <template>
 *   <div v-if="!sql">Enter a SQL query</div>
 *   <div v-else-if="isLoading">Executing query...</div>
 *   <div v-else-if="data">
 *     <p>Returned {{ data.length }} rows</p>
 *     <pre>{{ JSON.stringify(data, null, 2) }}</pre>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useSqlQuery} for DKAN's native SQL query API
 * @see {@link useCkanDatastoreSearch} for CKAN-compatible basic datastore queries
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.datastore_search_sql
 */
export function useCkanDatastoreSearchSql(options: UseCkanDatastoreSearchSqlOptions) {
  const client = useDkanClient()
  const { enabled, staleTime, ...sqlOptions } = options

  return useQuery({
    queryKey: ['ckan', 'datastore-search-sql', () => toValue(sqlOptions.sql)] as const,
    queryFn: () => {
      const unwrappedOptions: any = {}
      for (const [key, value] of Object.entries(sqlOptions)) {
        unwrappedOptions[key] = toValue(value)
      }
      return client.ckanDatastoreSearchSql(unwrappedOptions)
    },
    enabled: () => (toValue(enabled) ?? true) && !!toValue(sqlOptions.sql),
    staleTime,
  })
}

/**
 * Fetches metadata for a distribution/resource using CKAN's resource_show API format.
 *
 * This composable retrieves detailed metadata about a specific distribution (called "resource" in CKAN)
 * using CKAN's API format. In DKAN terminology, distributions are the downloadable files attached
 * to datasets (CSVs, JSONs, PDFs, etc.).
 *
 * **CKAN Compatibility Features**:
 * - Uses `resource_id` parameter name (CKAN's terminology)
 * - Returns metadata in CKAN's format with fields like `url`, `name`, `format`, `size`
 * - Compatible with CKAN resource display tools
 * - Maps DKAN distributions to CKAN resources automatically
 *
 * **What You Can Learn from Resource Metadata**:
 * - File format (CSV, JSON, PDF, etc.)
 * - File size
 * - Download URL
 * - Description and title
 * - Last modification date
 * - Data dictionary/schema if available
 *
 * **Reactive Parameters**: The resourceId parameter accepts refs or computed values.
 *
 * Use this composable when you need to:
 * - Display distribution/resource metadata in CKAN format
 * - Show download links and file information
 * - Build CKAN-compatible resource viewers
 * - Migrate CKAN resource display components to DKAN
 *
 * @param options - Configuration options including the resource ID
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing resource metadata in CKAN format
 *   - `isLoading`: Ref<boolean> - true during fetch
 *   - `isError`: Ref<boolean> - true if fetch failed
 *   - `error`: Ref containing error object if request failed
 *
 * @example
 * Basic resource metadata display:
 * ```vue
 * <script setup lang="ts">
 * import { useCkanResourceShow } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ resourceId: string }>()
 *
 * const { data: resource, isLoading } = useCkanResourceShow({
 *   resourceId: props.resourceId,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="resource">
 *     <h3>{{ resource.name }}</h3>
 *     <p>Format: {{ resource.format }}</p>
 *     <p>Size: {{ resource.size }} bytes</p>
 *     <a
 *       v-if="resource.url"
 *       :href="resource.url"
 *       target="_blank"
 *       rel="noopener noreferrer"
 *     >
 *       Download
 *     </a>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDataset} for fetching complete dataset including all distributions
 * @see {@link useCkanDatastoreSearch} for querying resource data
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.resource_show
 */
export function useCkanResourceShow(options: UseCkanResourceShowOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['ckan', 'resource-show', options.resourceId] as const,
    queryFn: () => client.ckanResourceShow(toValue(options.resourceId)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.resourceId),
    staleTime: options.staleTime,
  })
}

/**
 * Fetches all datasets with their distributions using CKAN's current_package_list_with_resources API.
 *
 * This composable retrieves the complete catalog of datasets, each with full distribution (resource)
 * information included. It's useful for building catalog-wide tools, analytics dashboards, and
 * inventory reports using CKAN's API format.
 *
 * **CKAN Compatibility Features**:
 * - Returns all datasets in CKAN's package format
 * - Includes resources (distributions) nested within each package
 * - Compatible with CKAN catalog visualization tools
 * - Uses CKAN terminology ("packages" and "resources")
 *
 * **Performance Note**: This endpoint returns the entire catalog, which can be large for sites
 * with many datasets. The default staleTime is 5 minutes to balance freshness with performance.
 * Consider using {@link useCkanPackageSearch} for filtered or paginated access.
 *
 * **What's Included**: Each dataset includes:
 * - Complete metadata (title, description, publisher, etc.)
 * - All distributions/resources with download URLs and formats
 * - Keywords, themes, and other classification data
 * - Modification timestamps
 *
 * **Reactive Updates**: The query automatically refetches when invalidated, keeping the
 * catalog synchronized across your application.
 *
 * Use this composable when you need to:
 * - Build catalog inventory reports
 * - Display complete dataset lists with resources
 * - Generate site-wide analytics
 * - Create data export tools
 * - Migrate CKAN catalog listing pages to DKAN
 *
 * @param options - Configuration options (all optional)
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing array of all datasets with resources in CKAN format
 *   - `isLoading`: Ref<boolean> - true during initial fetch
 *   - `isError`: Ref<boolean> - true if fetch failed
 *   - `error`: Ref containing error object if request failed
 *
 * @example
 * Complete catalog listing:
 * ```vue
 * <script setup lang="ts">
 * import { useCkanCurrentPackageListWithResources } from '@dkan-client-tools/vue'
 *
 * const { data: packages, isLoading } = useCkanCurrentPackageListWithResources()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading catalog...</div>
 *   <div v-else-if="packages">
 *     <h2>Dataset Catalog ({{ packages.length }} datasets)</h2>
 *     <div v-for="pkg in packages" :key="pkg.identifier">
 *       <h3>{{ pkg.title }}</h3>
 *       <p>Resources: {{ pkg.resources?.length || 0 }}</p>
 *       <ul v-if="pkg.resources">
 *         <li v-for="resource in pkg.resources" :key="resource.id">
 *           {{ resource.name }} ({{ resource.format }})
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useCkanPackageSearch} for filtered/paginated dataset access
 * @see {@link useAllDatasets} for DKAN's native catalog endpoint
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.current_package_list_with_resources
 */
export function useCkanCurrentPackageListWithResources(options: UseCkanPackageListOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['ckan', 'current-package-list-with-resources'] as const,
    queryFn: () => client.ckanCurrentPackageListWithResources(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  })
}
