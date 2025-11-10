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
 * Search for datasets with various filters
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDatasetSearch } from '@dkan-client-tools/vue'
 *
 * const searchQuery = ref('')
 * const { data, isLoading, refetch } = useDatasetSearch({
 *   searchOptions: computed(() => ({
 *     fulltext: searchQuery.value,
 *     'page-size': 10,
 *   })),
 * })
 * </script>
 *
 * <template>
 *   <div>
 *     <input v-model="searchQuery" placeholder="Search datasets..." />
 *     <button @click="refetch">Search</button>
 *     <div v-if="isLoading">Searching...</div>
 *     <ul v-else-if="data">
 *       <li v-for="dataset in data.results" :key="dataset.identifier">
 *         {{ dataset.title }}
 *       </li>
 *     </ul>
 *   </div>
 * </template>
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
