/**
 * Vue composables for DKAN Metastore operations
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'

export interface UseAllDatasetsOptions {
  /**
   * Enable/disable the query
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseSchemasOptions {
  /**
   * Enable/disable the query
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseSchemaItemsOptions {
  /**
   * The schema ID to fetch items for
   */
  schemaId: MaybeRefOrGetter<string>

  /**
   * Enable/disable the query
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseFacetsOptions {
  /**
   * Enable/disable the query
   */
  enabled?: MaybeRefOrGetter<boolean>

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

/**
 * Composable to fetch all datasets with full metadata
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useAllDatasets } from '@dkan-client-tools/vue'
 *
 * const { data, isLoading, error } = useAllDatasets()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading all datasets...</div>
 *   <ul v-else>
 *     <li v-for="dataset in data" :key="dataset.identifier">
 *       {{ dataset.title }}
 *     </li>
 *   </ul>
 * </template>
 * ```
 */
export function useAllDatasets(options: UseAllDatasetsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'all'],
    queryFn: () => client.listAllDatasets(),
    staleTime: options.staleTime,
  })
}

/**
 * Composable to fetch all available metastore schemas
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSchemas } from '@dkan-client-tools/vue'
 *
 * const { data: schemas } = useSchemas()
 * </script>
 *
 * <template>
 *   <select>
 *     <option v-for="schema in schemas" :key="schema" :value="schema">
 *       {{ schema }}
 *     </option>
 *   </select>
 * </template>
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
 * Composable to fetch items for a specific schema
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSchemaItems } from '@dkan-client-tools/vue'
 *
 * const { data: items } = useSchemaItems({
 *   schemaId: 'data-dictionary'
 * })
 * </script>
 *
 * <template>
 *   <div>
 *     <!-- Display schema items -->
 *   </div>
 * </template>
 * ```
 */
export function useSchemaItems(options: UseSchemaItemsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['metastore', 'schema-items', options.schemaId] as const,
    queryFn: () => client.getSchemaItems(toValue(options.schemaId)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Composable to fetch all dataset facets (themes, keywords, publishers)
 * Useful for building filter UIs
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDatasetFacets } from '@dkan-client-tools/vue'
 *
 * const { data: facets, isLoading } = useDatasetFacets()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading filters...</div>
 *   <div v-else>
 *     <h3>Themes</h3>
 *     <ul>
 *       <li v-for="theme in facets?.theme" :key="theme">
 *         <label>
 *           <input type="checkbox" :value="theme" />
 *           {{ theme }}
 *         </label>
 *       </li>
 *     </ul>
 *
 *     <h3>Keywords</h3>
 *     <ul>
 *       <li v-for="keyword in facets?.keyword" :key="keyword">
 *         {{ keyword }}
 *       </li>
 *     </ul>
 *
 *     <h3>Publishers</h3>
 *     <ul>
 *       <li v-for="publisher in facets?.publisher" :key="publisher">
 *         {{ publisher }}
 *       </li>
 *     </ul>
 *   </div>
 * </template>
 * ```
 */
export function useDatasetFacets(options: UseFacetsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'facets'] as const,
    queryFn: () => client.getDatasetFacets(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes since facets don't change often
  })
}
