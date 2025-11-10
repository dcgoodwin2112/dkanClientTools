/**
 * Vue composables for fetching DKAN data dictionaries
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'

export interface UseDataDictionaryOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseDataDictionaryListOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

/**
 * Composable to fetch a specific data dictionary
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDataDictionary } from '@dkan-client-tools/vue'
 *
 * const dictId = ref('my-dictionary-uuid')
 * const { data, isLoading, error } = useDataDictionary({
 *   identifier: dictId
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else-if="data">
 *     <h3>{{ data.data.title }}</h3>
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>Field</th>
 *           <th>Type</th>
 *           <th>Description</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="field in data.data.fields" :key="field.name">
 *           <td>{{ field.name }}</td>
 *           <td>{{ field.type }}</td>
 *           <td>{{ field.description }}</td>
 *         </tr>
 *       </tbody>
 *     </table>
 *   </div>
 * </template>
 * ```
 */
export function useDataDictionary(options: UseDataDictionaryOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['data-dictionary', options.identifier] as const,
    queryFn: () => client.getDataDictionary(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Composable to fetch all data dictionaries
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDataDictionaryList } from '@dkan-client-tools/vue'
 *
 * const { data, isLoading, error } = useDataDictionaryList()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading dictionaries...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <ul v-else-if="data">
 *     <li v-for="dict in data" :key="dict.identifier">
 *       {{ dict.data.title || dict.identifier }}
 *     </li>
 *   </ul>
 * </template>
 * ```
 */
export function useDataDictionaryList(options: UseDataDictionaryListOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['data-dictionaries'] as const,
    queryFn: () => client.listDataDictionaries(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Composable to fetch data dictionary from a URL
 * Useful for fetching dictionaries referenced in distribution.describedBy
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDataDictionaryFromUrl } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ distribution: any }>()
 * const { data, isLoading } = useDataDictionaryFromUrl({
 *   url: props.distribution.describedBy
 * })
 * </script>
 * ```
 */
export function useDataDictionaryFromUrl(options: {
  url: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['data-dictionary-url', options.url] as const,
    queryFn: () => client.getDataDictionaryFromUrl(toValue(options.url)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Composable to fetch datastore schema with data dictionary
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDatastoreSchema } from '@dkan-client-tools/vue'
 *
 * const datasetId = ref('my-dataset-uuid')
 * const { data, isLoading } = useDatastoreSchema({
 *   datasetId,
 *   index: 0
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading schema...</div>
 *   <div v-else-if="data?.schema">
 *     <h4>Schema Fields:</h4>
 *     <ul>
 *       <li v-for="field in data.schema.fields" :key="field.name">
 *         {{ field.name }}: {{ field.type }} {{ field.format ? `(${field.format})` : '' }}
 *       </li>
 *     </ul>
 *   </div>
 * </template>
 * ```
 */
export function useDatastoreSchema(options: {
  datasetId: MaybeRefOrGetter<string>
  index?: MaybeRefOrGetter<number>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'datastore-schema',
      options.datasetId,
      () => toValue(options.index) ?? 0,
    ] as const,
    queryFn: () =>
      client.getDatastoreSchema(
        toValue(options.datasetId),
        toValue(options.index) ?? 0
      ),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}
