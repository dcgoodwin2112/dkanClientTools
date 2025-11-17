/**
 * Vue composables for DKAN Metastore operations
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue, computed } from 'vue'
import { useDkanClient } from './plugin'

export interface UseAllDatasetsOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseSchemasOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseSchemaOptions {
  schemaId: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseSchemaItemsOptions {
  schemaId: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseFacetsOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

/**
 * Fetches all datasets with complete DCAT-US metadata (no pagination).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: datasets } = useAllDatasets()
 * </script>
 * ```
 */
export function useAllDatasets(options: UseAllDatasetsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'list'] as const,
    queryFn: () => client.listAllDatasets(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches available metastore schema IDs.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: schemas } = useSchemas()
 * </script>
 * ```
 */
export function useSchemas(options: UseSchemasOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['metastore', 'schemas'] as const,
    queryFn: () => client.listSchemas(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches a specific metastore schema definition.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: schema } = useSchema({ schemaId: 'dataset' })
 * </script>
 * ```
 */
export function useSchema(options: UseSchemaOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => ['metastore', 'schema', toValue(options.schemaId)] as const),
    queryFn: () => client.getSchema(toValue(options.schemaId)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.schemaId),
    staleTime: options.staleTime,
  })
}

/**
 * Fetches all items for a metastore schema.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: items } = useSchemaItems({ schemaId: 'data-dictionary' })
 * </script>
 * ```
 */
export function useSchemaItems(options: UseSchemaItemsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => ['metastore', 'items', toValue(options.schemaId)] as const),
    queryFn: () => client.getSchemaItems(toValue(options.schemaId)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.schemaId),
    staleTime: options.staleTime,
  })
}

/**
 * Fetches dataset facets (themes, keywords, publishers).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: facets } = useDatasetFacets()
 * // facets.theme, facets.keyword, facets.publisher
 * </script>
 * ```
 */
export function useDatasetFacets(options: UseFacetsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['metastore', 'facets'] as const,
    queryFn: () => client.getDatasetFacets(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}
