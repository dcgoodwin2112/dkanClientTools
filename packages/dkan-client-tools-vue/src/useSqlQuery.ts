/**
 * Vue composables for DKAN SQL Query operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue, computed } from 'vue'
import { useDkanClient } from './plugin'
import type { SqlQueryOptions, SqlQueryResult } from '@dkan-client-tools/core'

export interface UseSqlQueryOptions extends SqlQueryOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  gcTime?: number
}

/**
 * Executes SQL SELECT queries against DKAN's datastore with automatic caching and reactivity.
 *
 * This composable enables complex data analysis by allowing you to run SQL queries directly against
 * the datastore. It supports joins across multiple tables, aggregations, subqueries, and other
 * advanced SQL operations. Results are automatically cached based on the query string, and the
 * query re-executes when reactive parameters change.
 *
 * **Supported SQL Operations**:
 * - SELECT with complex WHERE clauses
 * - JOIN operations across multiple datastore tables
 * - Aggregations (COUNT, SUM, AVG, MIN, MAX, GROUP BY)
 * - Subqueries and CTEs (Common Table Expressions)
 * - ORDER BY, LIMIT, OFFSET for result control
 * - Window functions for advanced analytics
 *
 * **Security**: Only SELECT queries are permitted. CREATE, UPDATE, DELETE, and other write
 * operations are blocked to protect the datastore integrity.
 *
 * **Table Names**: Datastore tables are named `datastore_{distribution_id}`. Use the
 * distribution's identifier to construct the table name in your queries.
 *
 * Use this composable when you need to:
 * - Perform complex data analysis with joins and aggregations
 * - Generate statistics and summary reports from datastore data
 * - Query across multiple distributions simultaneously
 * - Build dashboard widgets with computed metrics
 * - Create data visualizations from aggregated results
 *
 * @param options - SQL query configuration including the query string and options
 *
 * @returns TanStack Vue Query result object with cached SQL results
 *
 * @example
 * Basic SQL query with reactive parameters:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useSqlQuery } from '@dkan-client-tools/vue'
 *
 * const distributionId = ref('abc-123')
 * const limit = ref(10)
 *
 * const { data, isLoading } = useSqlQuery({
 *   query: computed(() =>
 *     `SELECT * FROM datastore_${distributionId.value} LIMIT ${limit.value}`
 *   ),
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <table v-else-if="data && data.length > 0">
 *     <thead>
 *       <tr>
 *         <th v-for="(_, key) in data[0]" :key="key">{{ key }}</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr v-for="(row, i) in data" :key="i">
 *         <td v-for="(value, key) in row" :key="key">{{ value }}</td>
 *       </tr>
 *     </tbody>
 *   </table>
 * </template>
 * ```
 *
 * @example
 * SQL aggregation query for dashboard statistics:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useSqlQuery } from '@dkan-client-tools/vue'
 *
 * const distributionId = ref('population-data')
 *
 * const { data: stats } = useSqlQuery({
 *   query: computed(() => `
 *     SELECT
 *       COUNT(*) as total_records,
 *       AVG(population) as avg_population,
 *       MAX(population) as max_population,
 *       MIN(population) as min_population,
 *       SUM(population) as total_population
 *     FROM datastore_${distributionId.value}
 *   `),
 *   staleTime: 5 * 60 * 1000, // Cache for 5 minutes
 * })
 *
 * const summary = computed(() => stats.value?.[0])
 * </script>
 *
 * <template>
 *   <div v-if="summary" class="stats-dashboard">
 *     <div class="stat-card">
 *       <h3>Total Records</h3>
 *       <p>{{ summary.total_records?.toLocaleString() }}</p>
 *     </div>
 *     <div class="stat-card">
 *       <h3>Average Population</h3>
 *       <p>{{ Number(summary.avg_population).toLocaleString() }}</p>
 *     </div>
 *     <div class="stat-card">
 *       <h3>Total Population</h3>
 *       <p>{{ Number(summary.total_population).toLocaleString() }}</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * JOIN query across multiple distributions:
 * ```vue
 * <script setup lang="ts">
 * import { useSqlQuery } from '@dkan-client-tools/vue'
 *
 * const { data: joinedData } = useSqlQuery({
 *   query: `
 *     SELECT
 *       c.city_name,
 *       c.state,
 *       p.population,
 *       p.year
 *     FROM datastore_cities c
 *     JOIN datastore_population p ON c.city_id = p.city_id
 *     WHERE p.year = 2023
 *     ORDER BY p.population DESC
 *     LIMIT 20
 *   `,
 * })
 * </script>
 *
 * <template>
 *   <table v-if="joinedData">
 *     <thead>
 *       <tr>
 *         <th>City</th>
 *         <th>State</th>
 *         <th>Population (2023)</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr v-for="row in joinedData" :key="row.city_name">
 *         <td>{{ row.city_name }}</td>
 *         <td>{{ row.state }}</td>
 *         <td>{{ Number(row.population).toLocaleString() }}</td>
 *       </tr>
 *     </tbody>
 *   </table>
 * </template>
 * ```
 *
 * @see {@link useExecuteSqlQuery} for mutation-based SQL execution
 * @see {@link useDatastore} for simpler query-builder style querying
 * @see {@link useDownloadQuery} to download SQL results as CSV/JSON
 */
export function useSqlQuery(options: UseSqlQueryOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'datastore',
      'sql',
      options.query,
      () => toValue(options.show_db_columns),
    ] as const,
    queryFn: () =>
      client.querySql({
        query: toValue(options.query),
        show_db_columns: toValue(options.show_db_columns),
      }),
    enabled: () => {
      const enabled = toValue(options.enabled) ?? true
      const hasQuery = !!toValue(options.query)
      return enabled && hasQuery
    },
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  })
}

/**
 * Executes SQL queries on-demand via mutation, useful for interactive SQL editors and ad-hoc queries.
 *
 * Unlike {@link useSqlQuery} which executes automatically, this mutation-based composable only runs
 * when you explicitly call `mutate()` or `mutateAsync()`. This is ideal for building SQL query
 * editors, data exploration tools, and scenarios where queries should only execute on user action.
 *
 * **Key Differences from useSqlQuery:**
 * - Executes only on explicit user action (button click, form submit)
 * - Returns mutation state (`isPending`, `isSuccess`, `isError`)
 * - Optionally caches results for later use by `useSqlQuery`
 * - Better for one-off or exploratory queries
 * - Ideal for query builders and SQL editors
 *
 * Use this composable when you need to:
 * - Build interactive SQL query editors
 * - Execute queries only on user action
 * - Provide data exploration tools
 * - Run one-off analytical queries
 * - Build query testing interfaces
 *
 * @returns TanStack Vue Query mutation object for executing SQL queries
 *
 * @example
 * Interactive SQL query editor:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useExecuteSqlQuery } from '@dkan-client-tools/vue'
 *
 * const executeSql = useExecuteSqlQuery()
 * const query = ref('SELECT * FROM datastore_example LIMIT 10')
 *
 * function handleExecute() {
 *   executeSql.mutate(
 *     { query: query.value },
 *     {
 *       onSuccess: (data) => {
 *         console.log('Query returned', data.length, 'rows')
 *       },
 *       onError: (error) => {
 *         alert('Query failed: ' + error.message)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div class="sql-editor">
 *     <textarea
 *       v-model="query"
 *       placeholder="SELECT * FROM datastore_..."
 *       rows="8"
 *       class="query-input"
 *     />
 *     <button
 *       @click="handleExecute"
 *       :disabled="executeSql.isPending || !query"
 *     >
 *       {{ executeSql.isPending ? 'Executing...' : 'Run Query' }}
 *     </button>
 *
 *     <div v-if="executeSql.isError" class="error">
 *       <h4>Query Error:</h4>
 *       <pre>{{ executeSql.error?.message }}</pre>
 *     </div>
 *
 *     <div v-if="executeSql.data" class="results">
 *       <h4>Results ({{ executeSql.data.length }} rows)</h4>
 *       <table v-if="executeSql.data.length > 0">
 *         <thead>
 *           <tr>
 *             <th v-for="(_, key) in executeSql.data[0]" :key="key">
 *               {{ key }}
 *             </th>
 *           </tr>
 *         </thead>
 *         <tbody>
 *           <tr v-for="(row, i) in executeSql.data" :key="i">
 *             <td v-for="(value, key) in row" :key="key">{{ value }}</td>
 *           </tr>
 *         </tbody>
 *       </table>
 *       <p v-else>Query returned no results</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Query execution with validation and history:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useExecuteSqlQuery } from '@dkan-client-tools/vue'
 *
 * const executeSql = useExecuteSqlQuery()
 * const query = ref('')
 * const queryHistory = ref<Array<{ query: string; rows: number; timestamp: Date }>>([])
 *
 * function validateQuery(sql: string): string | null {
 *   if (!sql.trim()) return 'Query cannot be empty'
 *   if (!sql.toLowerCase().startsWith('select')) {
 *     return 'Only SELECT queries are allowed'
 *   }
 *   if (sql.toLowerCase().includes('drop') || sql.toLowerCase().includes('delete')) {
 *     return 'Destructive operations are not allowed'
 *   }
 *   return null
 * }
 *
 * async function handleExecute() {
 *   const error = validateQuery(query.value)
 *   if (error) {
 *     alert(error)
 *     return
 *   }
 *
 *   try {
 *     const result = await executeSql.mutateAsync({ query: query.value })
 *     queryHistory.value.unshift({
 *       query: query.value,
 *       rows: result.length,
 *       timestamp: new Date(),
 *     })
 *   } catch (err) {
 *     console.error('Query failed:', err)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="query-tool">
 *     <div class="query-panel">
 *       <textarea v-model="query" rows="10" />
 *       <button @click="handleExecute" :disabled="executeSql.isPending">
 *         Execute Query
 *       </button>
 *     </div>
 *
 *     <div class="history-panel">
 *       <h3>Query History</h3>
 *       <div v-for="(item, i) in queryHistory" :key="i" class="history-item">
 *         <code>{{ item.query }}</code>
 *         <span class="meta">
 *           {{ item.rows }} rows • {{ item.timestamp.toLocaleTimeString() }}
 *         </span>
 *         <button @click="query = item.query">Re-run</button>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useSqlQuery} for automatic SQL query execution with caching
 * @see {@link useDatastore} for simpler query-builder style querying
 */
export function useExecuteSqlQuery() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<SqlQueryResult, Error, SqlQueryOptions>({
    mutationFn: (options: SqlQueryOptions) => client.querySql(options),
    onSuccess: (data, variables) => {
      // Optionally cache the result using the same key as useSqlQuery
      queryClient.setQueryData(
        ['datastore', 'sql', variables.query, variables.show_db_columns],
        data
      )
    },
  })
}
