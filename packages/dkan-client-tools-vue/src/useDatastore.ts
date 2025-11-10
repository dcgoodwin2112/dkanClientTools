/**
 * useDatastore - Composable for querying DKAN datastore
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
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

/**
 * Query datastore data for a dataset
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatastore } from '@dkan-client-tools/vue'
 *
 * const datasetId = ref('my-dataset-id')
 * const page = ref(1)
 * const pageSize = ref(20)
 *
 * const { data, isLoading, error } = useDatastore({
 *   datasetId,
 *   queryOptions: computed(() => ({
 *     limit: pageSize.value,
 *     offset: (page.value - 1) * pageSize.value,
 *   })),
 * })
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
 *     <div>
 *       <button @click="page--" :disabled="page === 1">Previous</button>
 *       <span>Page {{ page }}</span>
 *       <button @click="page++">Next</button>
 *     </div>
 *   </div>
 * </template>
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
