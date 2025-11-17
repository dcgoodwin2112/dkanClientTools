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
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data, isLoading } = useDatastore({
 *   datasetId: 'my-dataset-uuid',
 *   index: 0,
 *   queryOptions: { limit: 20, offset: 0 },
 * })
 * </script>
 * ```
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
 * Queries multiple datastore resources with JOINs and cross-resource filtering.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data } = useQueryDatastoreMulti({
 *   queryOptions: {
 *     resources: [
 *       { id: 'resource-1-id', alias: 't1' },
 *       { id: 'resource-2-id', alias: 't2' }
 *     ],
 *     joins: [{ resource: 't2', condition: { property: 't1.id', value: 't2.ref_id' } }],
 *     limit: 50
 *   }
 * })
 * </script>
 * ```
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
