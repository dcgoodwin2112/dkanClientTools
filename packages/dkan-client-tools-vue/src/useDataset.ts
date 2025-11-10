/**
 * useDataset - Composable for fetching a single DKAN dataset
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'

export interface UseDatasetOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  gcTime?: number
}

/**
 * Fetch a single dataset by identifier
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDataset } from '@dkan-client-tools/vue'
 *
 * const datasetId = ref('my-dataset-id')
 * const { data, isLoading, isError, error } = useDataset({
 *   identifier: datasetId,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="isError">Error: {{ error.message }}</div>
 *   <div v-else-if="data">
 *     <h1>{{ data.title }}</h1>
 *     <p>{{ data.description }}</p>
 *   </div>
 * </template>
 * ```
 */
export function useDataset(options: UseDatasetOptions) {
  const client = useDkanClient()
  const { identifier, enabled, staleTime, gcTime } = options

  return useQuery({
    queryKey: ['dataset', identifier],
    queryFn: () => client.fetchDataset(toValue(identifier)),
    enabled: () => {
      const isEnabled = toValue(enabled) ?? true
      const hasIdentifier = !!toValue(identifier)
      return isEnabled && hasIdentifier
    },
    staleTime,
    gcTime,
  })
}
