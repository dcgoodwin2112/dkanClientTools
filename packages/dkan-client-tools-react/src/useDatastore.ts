import { useQuery } from '@tanstack/react-query'
import type { DatastoreQueryOptions } from '@dkan-client-tools/core'
import { useDkanClient } from './DkanClientProvider'

export interface UseDatastoreOptions {
  /** Dataset identifier (UUID) */
  datasetId: string
  /** Distribution index within dataset (default: 0) */
  index?: number
  /** Query options for filtering, sorting, limiting results */
  queryOptions?: DatastoreQueryOptions
  enabled?: boolean
  /** @default 300000 (5 minutes) */
  staleTime?: number
  /** @default 300000 (5 minutes) */
  gcTime?: number
}

/**
 * Queries actual data from a DKAN datastore.
 *
 * Provides SQL-like querying with filtering, sorting, pagination, and joins.
 *
 * @example
 * ```tsx
 * const { data } = useDatastore({
 *   datasetId,
 *   queryOptions: { limit: 100, sorts: [{ property: 'date', order: 'desc' }] }
 * })
 * ```
 */
export function useDatastore(options: UseDatastoreOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'datastore',
      options.datasetId,
      options.index || 0,
      options.queryOptions || {},
    ] as const,
    queryFn: () => client.queryDatastore(options.datasetId, options.index, options.queryOptions),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  })
}

export interface UseQueryDatastoreMultiOptions {
  /** Multi-resource query options with resources, joins, conditions, etc. */
  queryOptions: DatastoreQueryOptions
  /** HTTP method (POST recommended for complex queries, GET for caching) */
  method?: 'GET' | 'POST'
  enabled?: boolean
  /** @default 300000 (5 minutes) */
  staleTime?: number
  /** @default 300000 (5 minutes) */
  gcTime?: number
}

/**
 * Queries multiple datastore resources with JOIN support.
 *
 * Provides cross-resource querying, joins, and aggregations.
 *
 * @example
 * ```tsx
 * const { data } = useQueryDatastoreMulti({
 *   queryOptions: {
 *     resources: [
 *       { id: 'employees-id', alias: 'emp' },
 *       { id: 'departments-id', alias: 'dept' }
 *     ],
 *     joins: [{
 *       resource: 'dept',
 *       condition: { property: 'emp.department_id', value: 'dept.id', operator: '=' }
 *     }],
 *     properties: ['emp.name', 'dept.department_name'],
 *     limit: 50
 *   }
 * })
 * ```
 */
export function useQueryDatastoreMulti(options: UseQueryDatastoreMultiOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'datastore',
      'multi',
      options.queryOptions,
      options.method || 'POST',
    ] as const,
    queryFn: () => client.queryDatastoreMulti(options.queryOptions, options.method),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes
    gcTime: options.gcTime ?? 5 * 60 * 1000,
  })
}
