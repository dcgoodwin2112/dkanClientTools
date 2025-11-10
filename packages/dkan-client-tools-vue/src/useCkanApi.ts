/**
 * Vue composables for CKAN API Compatibility
 * Provides composables for CKAN-compatible endpoints for legacy tool support
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'
import type {
  CkanPackageSearchOptions,
  CkanDatastoreSearchOptions,
  CkanDatastoreSearchSqlOptions,
} from '@dkan-client-tools/core'

export interface UseCkanPackageSearchOptions extends CkanPackageSearchOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseCkanDatastoreSearchOptions extends CkanDatastoreSearchOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseCkanDatastoreSearchSqlOptions extends CkanDatastoreSearchSqlOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseCkanResourceShowOptions {
  resourceId: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseCkanPackageListOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

/**
 * Composable for CKAN-compatible package (dataset) search
 * Provides compatibility with CKAN-based tools and scripts
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCkanPackageSearch } from '@dkan-client-tools/vue'
 *
 * const { data, isLoading } = useCkanPackageSearch({
 *   q: 'water quality',
 *   rows: 20,
 *   facet: true,
 *   'facet.field': ['theme', 'publisher'],
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Searching...</div>
 *   <div v-else-if="data">
 *     <h2>Found {{ data.count }} datasets</h2>
 *     <div v-for="dataset in data.results" :key="dataset.identifier">
 *       <h3>{{ dataset.title }}</h3>
 *       <p>{{ dataset.description }}</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export function useCkanPackageSearch(options: UseCkanPackageSearchOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['ckan', 'package-search', () => {
      const { enabled, staleTime, ...rest } = options
      const unwrapped: any = {}
      for (const [key, value] of Object.entries(rest)) {
        unwrapped[key] = toValue(value)
      }
      return unwrapped
    }] as const,
    queryFn: () => {
      const { enabled, staleTime, ...searchOptions } = options
      const unwrappedOptions: any = {}
      for (const [key, value] of Object.entries(searchOptions)) {
        unwrappedOptions[key] = toValue(value)
      }
      return client.ckanPackageSearch(unwrappedOptions)
    },
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Composable for CKAN-compatible datastore search
 * Query a specific resource's datastore using CKAN API format
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCkanDatastoreSearch } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ resourceId: string }>()
 *
 * const { data, isLoading } = useCkanDatastoreSearch({
 *   resource_id: props.resourceId,
 *   limit: 100,
 *   filters: { state: 'CA' },
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading data...</div>
 *   <table v-else-if="data">
 *     <thead>
 *       <tr>
 *         <th v-for="field in data.fields" :key="field.id">
 *           {{ field.id }}
 *         </th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr v-for="(record, i) in data.records" :key="i">
 *         <td v-for="field in data.fields" :key="field.id">
 *           {{ String(record[field.id]) }}
 *         </td>
 *       </tr>
 *     </tbody>
 *   </table>
 * </template>
 * ```
 */
export function useCkanDatastoreSearch(options: UseCkanDatastoreSearchOptions) {
  const client = useDkanClient()
  const { enabled, staleTime, ...searchOptions } = options

  return useQuery({
    queryKey: ['ckan', 'datastore-search', () => searchOptions] as const,
    queryFn: () => {
      const unwrappedOptions: any = {}
      for (const [key, value] of Object.entries(searchOptions)) {
        unwrappedOptions[key] = toValue(value)
      }
      return client.ckanDatastoreSearch(unwrappedOptions)
    },
    enabled: () => (toValue(enabled) ?? true) && !!toValue(searchOptions.resource_id),
    staleTime,
  })
}

/**
 * Composable for CKAN-compatible SQL query
 * Execute SQL queries using CKAN API format
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCkanDatastoreSearchSql } from '@dkan-client-tools/vue'
 *
 * const sql = ref('')
 * const { data, isLoading } = useCkanDatastoreSearchSql({
 *   sql,
 *   enabled: computed(() => !!sql.value),
 * })
 * </script>
 *
 * <template>
 *   <div v-if="!sql">Enter a SQL query</div>
 *   <div v-else-if="isLoading">Executing query...</div>
 *   <div v-else-if="data">
 *     <p>Returned {{ data.length }} rows</p>
 *     <pre>{{ JSON.stringify(data, null, 2) }}</pre>
 *   </div>
 * </template>
 * ```
 */
export function useCkanDatastoreSearchSql(options: UseCkanDatastoreSearchSqlOptions) {
  const client = useDkanClient()
  const { enabled, staleTime, ...sqlOptions } = options

  return useQuery({
    queryKey: ['ckan', 'datastore-search-sql', () => toValue(sqlOptions.sql)] as const,
    queryFn: () => {
      const unwrappedOptions: any = {}
      for (const [key, value] of Object.entries(sqlOptions)) {
        unwrappedOptions[key] = toValue(value)
      }
      return client.ckanDatastoreSearchSql(unwrappedOptions)
    },
    enabled: () => (toValue(enabled) ?? true) && !!toValue(sqlOptions.sql),
    staleTime,
  })
}

/**
 * Composable for CKAN-compatible resource show
 * Get metadata about a specific resource
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCkanResourceShow } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ resourceId: string }>()
 *
 * const { data: resource, isLoading } = useCkanResourceShow({
 *   resourceId: props.resourceId
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="resource">
 *     <h3>{{ resource.name }}</h3>
 *     <p>Format: {{ resource.format }}</p>
 *     <p>Size: {{ resource.size }} bytes</p>
 *     <a
 *       v-if="resource.url"
 *       :href="resource.url"
 *       target="_blank"
 *       rel="noopener noreferrer"
 *     >
 *       Download
 *     </a>
 *   </div>
 * </template>
 * ```
 */
export function useCkanResourceShow(options: UseCkanResourceShowOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['ckan', 'resource-show', options.resourceId] as const,
    queryFn: () => client.ckanResourceShow(toValue(options.resourceId)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.resourceId),
    staleTime: options.staleTime,
  })
}

/**
 * Composable for CKAN-compatible current package list with resources
 * Get all datasets with their resources included
 * Useful for building catalog-wide tools
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCkanCurrentPackageListWithResources } from '@dkan-client-tools/vue'
 *
 * const { data: packages, isLoading } = useCkanCurrentPackageListWithResources()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading catalog...</div>
 *   <div v-else-if="packages">
 *     <h2>Dataset Catalog ({{ packages.length }} datasets)</h2>
 *     <div v-for="pkg in packages" :key="pkg.identifier">
 *       <h3>{{ pkg.title }}</h3>
 *       <p>Resources: {{ pkg.resources?.length || 0 }}</p>
 *       <ul v-if="pkg.resources">
 *         <li v-for="resource in pkg.resources" :key="resource.id">
 *           {{ resource.name }} ({{ resource.format }})
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export function useCkanCurrentPackageListWithResources(options: UseCkanPackageListOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['ckan', 'current-package-list-with-resources'] as const,
    queryFn: () => client.ckanCurrentPackageListWithResources(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  })
}
