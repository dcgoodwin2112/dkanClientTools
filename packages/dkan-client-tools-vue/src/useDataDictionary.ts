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
 * Fetches a data dictionary by identifier.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: dictionary } = useDataDictionary({
 *   identifier: 'my-dictionary-uuid',
 * })
 * </script>
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
 * Fetches all data dictionaries.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: dictionaries } = useDataDictionaryList()
 * </script>
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
 * Fetches a data dictionary from an external URL.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: dictionary } = useDataDictionaryFromUrl({
 *   url: 'https://example.com/schema.json',
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
 * Fetches the datastore schema for a specific distribution.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: schema } = useDatastoreSchema({
 *   datasetId: 'my-dataset-uuid',
 *   index: 0,
 * })
 * </script>
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
