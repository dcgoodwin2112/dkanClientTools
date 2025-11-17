/**
 * useDatasetSearch - Composable for searching DKAN datasets
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import type { DatasetQueryOptions } from '@dkan-client-tools/core'
import { useDkanClient } from './plugin'

export interface UseDatasetSearchOptions {
  searchOptions?: MaybeRefOrGetter<DatasetQueryOptions | undefined>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  gcTime?: number
}

/**
 * Searches and filters DKAN datasets with full-text search, faceting, and pagination.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const searchQuery = ref('')
 * const { data, isLoading } = useDatasetSearch({
 *   searchOptions: computed(() => ({
 *     fulltext: searchQuery.value || undefined,
 *     'page-size': 10,
 *   })),
 * })
 * </script>
 * ```
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
