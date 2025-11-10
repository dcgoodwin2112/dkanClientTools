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
 * Composable to execute a SQL query against the datastore
 * Caches results based on the query string
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useSqlQuery } from '@dkan-client-tools/vue'
 *
 * const tableName = ref('datastore_12345')
 * const { data, isLoading, error } = useSqlQuery({
 *   query: computed(() => `SELECT * FROM ${tableName.value} LIMIT 10`),
 *   show_db_columns: false,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <table v-else-if="data">
 *     <thead>
 *       <tr>
 *         <th v-for="(value, key) in data[0]" :key="key">{{ key }}</th>
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
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useSqlQuery } from '@dkan-client-tools/vue'
 *
 * const tableName = ref('datastore_12345')
 * const { data: stats, isLoading } = useSqlQuery({
 *   query: computed(() => `
 *     SELECT
 *       COUNT(*) as total_records,
 *       AVG(value) as avg_value,
 *       MAX(value) as max_value,
 *       MIN(value) as min_value
 *     FROM ${tableName.value}
 *   `),
 *   enabled: computed(() => !!tableName.value),
 *   staleTime: 60000,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading statistics...</div>
 *   <div v-else-if="stats?.[0]">
 *     <h3>Dataset Statistics</h3>
 *     <dl>
 *       <dt>Total Records:</dt>
 *       <dd>{{ stats[0].total_records }}</dd>
 *       <dt>Average Value:</dt>
 *       <dd>{{ Number(stats[0].avg_value).toFixed(2) }}</dd>
 *     </dl>
 *   </div>
 * </template>
 * ```
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
 * Mutation composable to execute a SQL query
 * Useful for queries that should only run on user action
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useExecuteSqlQuery } from '@dkan-client-tools/vue'
 *
 * const executeSql = useExecuteSqlQuery()
 * const query = ref('')
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
 *   <div>
 *     <textarea
 *       v-model="query"
 *       placeholder="SELECT * FROM ..."
 *       rows="5"
 *     />
 *     <button @click="handleExecute" :disabled="executeSql.isPending">
 *       {{ executeSql.isPending ? 'Executing...' : 'Execute' }}
 *     </button>
 *
 *     <div v-if="executeSql.data">
 *       <h4>Results ({{ executeSql.data.length }} rows)</h4>
 *       <pre>{{ JSON.stringify(executeSql.data, null, 2) }}</pre>
 *     </div>
 *   </div>
 * </template>
 * ```
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
