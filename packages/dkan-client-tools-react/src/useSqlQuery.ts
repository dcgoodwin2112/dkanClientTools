import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type { SqlQueryOptions, SqlQueryResult } from '@dkan-client-tools/core'

export interface UseSqlQueryOptions extends SqlQueryOptions {
  enabled?: boolean
  /** @default 300000 (5 minutes) */
  staleTime?: number
  /** @default 300000 (5 minutes) */
  gcTime?: number
}

/**
 * Executes SQL queries against DKAN datastore tables.
 *
 * Supports JOINs, aggregations, and complex WHERE clauses.
 * Table pattern: `datastore_{dataset_id}_{index}`
 *
 * @example
 * ```tsx
 * const { data } = useSqlQuery({
 *   query: 'SELECT * FROM datastore_12345 LIMIT 10',
 *   show_db_columns: false,
 * })
 * ```
 */
export function useSqlQuery(options: UseSqlQueryOptions) {
  const client = useDkanClient()
  const { enabled, staleTime, gcTime, ...sqlOptions } = options

  return useQuery({
    queryKey: ['datastore', 'sql', (sqlOptions as SqlQueryOptions).query, (sqlOptions as SqlQueryOptions).show_db_columns] as const,
    queryFn: () => client.querySql(sqlOptions as SqlQueryOptions),
    enabled: (enabled ?? true) && !!(sqlOptions as SqlQueryOptions).query,
    staleTime,
    gcTime,
  })
}

/**
 * Executes SQL queries on demand (user-triggered, no automatic execution).
 *
 * Caches results for subsequent `useSqlQuery` calls.
 *
 * @example
 * ```tsx
 * const executeSql = useExecuteSqlQuery()
 * executeSql.mutate({ query: 'SELECT * FROM datastore_12345' })
 * ```
 */
export function useExecuteSqlQuery() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<SqlQueryResult, Error, SqlQueryOptions>({
    mutationFn: (options) => client.querySql(options),
    onSuccess: (data, variables) => {
      // Optionally cache the result using the same key as useSqlQuery
      queryClient.setQueryData(
        ['datastore', 'sql', variables.query, variables.show_db_columns],
        data
      )
    },
  })
}
