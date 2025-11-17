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
 * Executes SQL SELECT queries against DKAN's datastore with automatic caching. Only SELECT queries are permitted.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data, isLoading } = useSqlQuery({
 *   query: 'SELECT * FROM datastore_abc123 LIMIT 10'
 * })
 * </script>
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
 * Executes SQL queries on-demand via mutation. Ideal for interactive SQL editors where queries execute only on user action.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const executeSql = useExecuteSqlQuery()
 * const query = ref('SELECT * FROM datastore_example LIMIT 10')
 *
 * function handleExecute() {
 *   executeSql.mutate({ query: query.value })
 * }
 * </script>
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
