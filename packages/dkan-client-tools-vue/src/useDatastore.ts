/**
 * useDatastore - Composable for querying DKAN datastore
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue, computed } from 'vue'
import type { DatastoreQueryOptions } from '@dkan-client-tools/core'
import { useDkanClient } from './plugin'

export interface UseDatastoreOptions {
  datasetId: MaybeRefOrGetter<string>
  index?: MaybeRefOrGetter<number>
  queryOptions?: MaybeRefOrGetter<DatastoreQueryOptions | undefined>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  gcTime?: number
}

export interface UseQueryDatastoreMultiOptions {
  queryOptions: MaybeRefOrGetter<DatastoreQueryOptions>
  method?: MaybeRefOrGetter<'GET' | 'POST'>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  gcTime?: number
}

/**
 * Queries tabular data from a distribution's datastore with filtering, sorting, and pagination.
 *
 * This composable provides access to the actual data that has been imported from CSV, JSON, or other
 * data files into DKAN's internal datastore. The datastore makes data queryable with SQL-like
 * operations including filtering, sorting, pagination, and field selection. The query is fully
 * reactive and will automatically re-execute when reactive parameters change.
 *
 * **Data Import Requirement**: Before you can query data, the distribution's file must be imported
 * into DKAN's datastore using the harvest process or manual import. The import process downloads
 * the file and loads it into a queryable database table.
 *
 * **Query Capabilities**:
 * - Filter rows with conditions (WHERE-like operations)
 * - Sort by any column (ascending or descending)
 * - Paginate results (limit/offset)
 * - Select specific fields/columns
 * - Get total row count
 * - Access schema information (column types, descriptions)
 *
 * **Reactive Parameters**: All options accept Vue refs or computed values. When these change, the
 * query automatically re-executes, making it perfect for building interactive data tables with
 * filters and pagination.
 *
 * Use this composable when you need to:
 * - Build data tables and grids from imported CSV/JSON files
 * - Create filterable and sortable data views
 * - Display paginated data from distributions
 * - Build data exploration and analysis interfaces
 * - Show preview tables for distribution files
 *
 * @param options - Configuration options for the datastore query
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing query results with rows, schema, and total count
 *   - `isLoading`: Ref that's true during the initial data load
 *   - `isFetching`: Ref that's true whenever data is being fetched
 *   - `isError`: Ref that's true if the query failed
 *   - `error`: Ref containing the error object if the request failed
 *   - `refetch`: Function to manually re-execute the query
 *   - `suspense`: Promise for use with Vue Suspense
 *
 * @example
 * Basic paginated data table:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatastore } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string }>()
 * const page = ref(1)
 * const pageSize = ref(20)
 *
 * const { data, isLoading, error } = useDatastore({
 *   datasetId: props.datasetId,
 *   index: 0, // First distribution
 *   queryOptions: computed(() => ({
 *     limit: pageSize.value,
 *     offset: (page.value - 1) * pageSize.value,
 *   })),
 * })
 *
 * const totalPages = computed(() =>
 *   data.value ? Math.ceil(data.value.count / pageSize.value) : 0
 * )
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading data...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else-if="data">
 *     <table>
 *       <thead>
 *         <tr>
 *           <th v-for="column in data.schema?.fields" :key="column.name">
 *             {{ column.name }}
 *           </th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="(row, i) in data.results" :key="i">
 *           <td v-for="column in data.schema?.fields" :key="column.name">
 *             {{ row[column.name] }}
 *           </td>
 *         </tr>
 *       </tbody>
 *     </table>
 *
 *     <div class="pagination">
 *       <button @click="page--" :disabled="page === 1">Previous</button>
 *       <span>Page {{ page }} of {{ totalPages }}</span>
 *       <button @click="page++" :disabled="page >= totalPages">Next</button>
 *       <p>Showing {{ data.results.length }} of {{ data.count }} total rows</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Filterable and sortable data table:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatastore } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string }>()
 *
 * const searchTerm = ref('')
 * const sortColumn = ref<string>()
 * const sortDirection = ref<'asc' | 'desc'>('asc')
 * const selectedState = ref<string>()
 *
 * const { data, isLoading, isFetching } = useDatastore({
 *   datasetId: props.datasetId,
 *   queryOptions: computed(() => ({
 *     limit: 50,
 *     offset: 0,
 *     // Filter conditions (SQL-like WHERE clauses)
 *     conditions: [
 *       searchTerm.value && {
 *         property: 'name',
 *         value: `%${searchTerm.value}%`,
 *         operator: 'like',
 *       },
 *       selectedState.value && {
 *         property: 'state',
 *         value: selectedState.value,
 *       },
 *     ].filter(Boolean),
 *     // Sorting
 *     sort: sortColumn.value
 *       ? {
 *           property: sortColumn.value,
 *           order: sortDirection.value,
 *         }
 *       : undefined,
 *   })),
 * })
 *
 * function handleSort(column: string) {
 *   if (sortColumn.value === column) {
 *     sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
 *   } else {
 *     sortColumn.value = column
 *     sortDirection.value = 'asc'
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="data-table">
 *     <div class="filters">
 *       <input
 *         v-model="searchTerm"
 *         type="search"
 *         placeholder="Search by name..."
 *       />
 *       <select v-model="selectedState">
 *         <option :value="undefined">All States</option>
 *         <option value="CA">California</option>
 *         <option value="NY">New York</option>
 *         <option value="TX">Texas</option>
 *       </select>
 *     </div>
 *
 *     <div v-if="isFetching" class="loading-overlay">
 *       Updating results...
 *     </div>
 *
 *     <table v-if="data">
 *       <thead>
 *         <tr>
 *           <th
 *             v-for="column in data.schema?.fields"
 *             :key="column.name"
 *             @click="handleSort(column.name)"
 *             class="sortable"
 *           >
 *             {{ column.name }}
 *             <span v-if="sortColumn === column.name">
 *               {{ sortDirection === 'asc' ? '↑' : '↓' }}
 *             </span>
 *           </th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="(row, i) in data.results" :key="i">
 *           <td v-for="column in data.schema?.fields" :key="column.name">
 *             {{ row[column.name] }}
 *           </td>
 *         </tr>
 *       </tbody>
 *     </table>
 *
 *     <p v-if="data">Found {{ data.count }} matching records</p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Data table with field selection and export:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatastore } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string }>()
 *
 * const { data, isLoading } = useDatastore({
 *   datasetId: props.datasetId,
 *   queryOptions: {
 *     limit: 100,
 *   },
 * })
 *
 * const selectedColumns = ref<string[]>([])
 * const availableColumns = computed(() =>
 *   data.value?.schema?.fields.map(f => f.name) || []
 * )
 *
 * // Query with selected columns
 * const { data: filteredData } = useDatastore({
 *   datasetId: props.datasetId,
 *   queryOptions: computed(() => ({
 *     limit: 100,
 *     properties: selectedColumns.value.length > 0
 *       ? selectedColumns.value
 *       : undefined,
 *   })),
 *   enabled: computed(() => selectedColumns.value.length > 0),
 * })
 *
 * function exportToCSV() {
 *   if (!filteredData.value) return
 *
 *   const schema = filteredData.value.schema?.fields || []
 *   const headers = schema.map(f => f.name).join(',')
 *   const rows = filteredData.value.results.map(row =>
 *     schema.map(f => JSON.stringify(row[f.name] ?? '')).join(',')
 *   )
 *   const csv = [headers, ...rows].join('\n')
 *
 *   const blob = new Blob([csv], { type: 'text/csv' })
 *   const url = URL.createObjectURL(blob)
 *   const a = document.createElement('a')
 *   a.href = url
 *   a.download = `export-${Date.now()}.csv`
 *   a.click()
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <div class="column-selector">
 *       <h3>Select Columns</h3>
 *       <label v-for="column in availableColumns" :key="column">
 *         <input
 *           type="checkbox"
 *           :value="column"
 *           v-model="selectedColumns"
 *         />
 *         {{ column }}
 *       </label>
 *     </div>
 *
 *     <button
 *       @click="exportToCSV"
 *       :disabled="!filteredData || selectedColumns.length === 0"
 *     >
 *       Export to CSV
 *     </button>
 *
 *     <table v-if="filteredData">
 *       <thead>
 *         <tr>
 *           <th v-for="col in selectedColumns" :key="col">{{ col }}</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="(row, i) in filteredData.results" :key="i">
 *           <td v-for="col in selectedColumns" :key="col">
 *             {{ row[col] }}
 *           </td>
 *         </tr>
 *       </tbody>
 *     </table>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Multiple distributions with tab interface:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDatastore, useDataset } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string }>()
 *
 * const { data: dataset } = useDataset({ identifier: props.datasetId })
 * const activeDistributionIndex = ref(0)
 *
 * const { data, isLoading } = useDatastore({
 *   datasetId: props.datasetId,
 *   index: activeDistributionIndex,
 *   queryOptions: { limit: 20 },
 * })
 * </script>
 *
 * <template>
 *   <div>
 *     <div class="tabs">
 *       <button
 *         v-for="(dist, index) in dataset?.distribution"
 *         :key="index"
 *         @click="activeDistributionIndex = index"
 *         :class="{ active: activeDistributionIndex === index }"
 *       >
 *         {{ dist.title }} ({{ dist.format }})
 *       </button>
 *     </div>
 *
 *     <div class="tab-content">
 *       <div v-if="isLoading">Loading distribution data...</div>
 *       <table v-else-if="data">
 *         <thead>
 *           <tr>
 *             <th v-for="col in data.schema?.fields" :key="col.name">
 *               {{ col.name }}
 *             </th>
 *           </tr>
 *         </thead>
 *         <tbody>
 *           <tr v-for="(row, i) in data.results" :key="i">
 *             <td v-for="col in data.schema?.fields" :key="col.name">
 *               {{ row[col.name] }}
 *             </td>
 *           </tr>
 *         </tbody>
 *       </table>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useSqlQuery} for advanced SQL queries with joins and aggregations
 * @see {@link useDownloadQuery} to download query results as CSV/JSON
 * @see {@link useDataDictionary} to fetch schema and field descriptions
 * @see {@link useTriggerDatastoreImport} to import data files into the datastore
 */
export function useDatastore(options: UseDatastoreOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'datastore',
      options.datasetId,
      () => toValue(options.index) || 0,
      () => toValue(options.queryOptions) || {},
    ] as const,
    queryFn: () =>
      client.queryDatastore(
        toValue(options.datasetId),
        toValue(options.index),
        toValue(options.queryOptions)
      ),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  })
}

/**
 * Queries multiple datastore resources simultaneously with advanced features like JOINs.
 *
 * This composable provides advanced datastore querying capabilities for working with multiple resources
 * at once. Unlike {@link useDatastore} which queries a single dataset distribution, this composable
 * allows you to query multiple datastore resources in a single request, JOIN resources together using
 * SQL-like conditions, and perform cross-resource filtering and aggregation. Fully reactive with
 * Vue's MaybeRefOrGetter pattern.
 *
 * **Advanced Features**:
 * - Query multiple datastore resources in a single request
 * - JOIN resources together using SQL-like conditions
 * - Use resource aliases (t1, t2, etc.) for clearer queries
 * - Perform cross-resource filtering and aggregation
 * - Group results across multiple resources
 * - Choose GET or POST method for optimal performance
 *
 * **Technical Notes**:
 * - Uses the generic `/api/1/datastore/query` endpoint (not dataset/index-specific)
 * - Supports both GET and POST methods (POST recommended for complex queries)
 * - All resource IDs must refer to imported datastores
 *
 * Use this composable when you need to:
 * - Combine data from multiple related datasets
 * - Perform complex analytical queries
 * - Build reports that span multiple data sources
 * - Create data visualizations from joined datasets
 *
 * @param options - Configuration including query options and HTTP method
 *
 * @returns TanStack Vue Query result object with combined query results
 *
 * @example
 * Basic multi-resource query with JOIN:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useQueryDatastoreMulti } from '@dkan-client-tools/vue'
 *
 * const queryOptions = ref({
 *   resources: [
 *     { id: 'employees-dist-id', alias: 'emp' },
 *     { id: 'departments-dist-id', alias: 'dept' }
 *   ],
 *   joins: [{
 *     resource: 'dept',
 *     condition: {
 *       property: 'emp.department_id',
 *       value: 'dept.id',
 *       operator: '='
 *     }
 *   }],
 *   properties: ['emp.name', 'emp.salary', 'dept.department_name'],
 *   sorts: [{ property: 'emp.salary', order: 'desc' }],
 *   limit: 50
 * })
 *
 * const { data, isLoading } = useQueryDatastoreMulti({
 *   queryOptions,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading joined data...</div>
 *   <table v-else-if="data">
 *     <thead>
 *       <tr>
 *         <th>Employee</th>
 *         <th>Department</th>
 *         <th>Salary</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr v-for="(row, i) in data.results" :key="i">
 *         <td>{{ row['emp.name'] }}</td>
 *         <td>{{ row['dept.department_name'] }}</td>
 *         <td>${{ row['emp.salary'] }}</td>
 *       </tr>
 *     </tbody>
 *   </table>
 * </template>
 * ```
 *
 * @see {@link useDatastore} for simpler single-resource queries
 * @see {@link useSqlQuery} for raw SQL queries
 * @see https://dkan.readthedocs.io/en/latest/apis/datastore.html
 */
export function useQueryDatastoreMulti(options: UseQueryDatastoreMultiOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => [
      'datastore',
      'multi',
      toValue(options.queryOptions),
      toValue(options.method) || 'POST',
    ] as const),
    queryFn: () => client.queryDatastoreMulti(toValue(options.queryOptions), toValue(options.method)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes
    gcTime: options.gcTime ?? 5 * 60 * 1000,
  })
}
