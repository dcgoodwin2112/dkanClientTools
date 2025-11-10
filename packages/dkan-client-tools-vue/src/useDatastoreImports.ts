/**
 * Vue composables for DKAN Datastore Import operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'
import type {
  DatastoreImport,
  DatastoreImportOptions,
  DatastoreStatistics,
} from '@dkan-client-tools/core'

export interface UseDatastoreImportsOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  refetchInterval?: number | false
}

export interface UseDatastoreImportOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  refetchInterval?: number | false
}

export interface UseDatastoreStatisticsOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

/**
 * Composable to list all datastore imports
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDatastoreImports } from '@dkan-client-tools/vue'
 *
 * const { data: imports, isLoading } = useDatastoreImports({
 *   refetchInterval: 5000 // Poll every 5 seconds
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading imports...</div>
 *   <ul v-else>
 *     <li v-for="(importData, id) in imports" :key="id">
 *       {{ id }}: {{ importData.status }}
 *       <span v-if="importData.importer?.state?.num_records">
 *         ({{ importData.importer.state.num_records }} records)
 *       </span>
 *     </li>
 *   </ul>
 * </template>
 * ```
 */
export function useDatastoreImports(options: UseDatastoreImportsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datastore', 'imports'] as const,
    queryFn: () => client.listDatastoreImports(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 0, // Default to always refetch
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Composable to get a specific datastore import status
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDatastoreImport } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const { data: importData, isLoading } = useDatastoreImport({
 *   identifier: props.identifier,
 *   refetchInterval: 3000 // Poll while in progress
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="importData">
 *     <h4>Import Status: {{ importData.status }}</h4>
 *     <p v-if="importData.file_fetcher?.state">
 *       File: {{ importData.file_fetcher.state.file_path }}
 *     </p>
 *     <p v-if="importData.importer?.state">
 *       Records imported: {{ importData.importer.state.num_records }}
 *     </p>
 *   </div>
 * </template>
 * ```
 */
export function useDatastoreImport(options: UseDatastoreImportOptions) {
  const imports = useDatastoreImports({
    enabled: options.enabled,
    staleTime: options.staleTime,
    refetchInterval: options.refetchInterval,
  })

  return {
    ...imports,
    data: computed(() => imports.data.value?.[toValue(options.identifier)]),
  }
}

/**
 * Composable to get datastore statistics for a resource
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDatastoreStatistics } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const { data: stats, isLoading } = useDatastoreStatistics({
 *   identifier: props.identifier
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading stats...</div>
 *   <div v-else-if="stats">
 *     <p>Rows: {{ stats.numOfRows }}</p>
 *     <p>Columns: {{ stats.numOfColumns }}</p>
 *     <details>
 *       <summary>Column Names</summary>
 *       <ul>
 *         <li v-for="col in stats.columns" :key="col">
 *           {{ col }}
 *         </li>
 *       </ul>
 *     </details>
 *   </div>
 * </template>
 * ```
 */
export function useDatastoreStatistics(options: UseDatastoreStatisticsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datastore', 'statistics', options.identifier] as const,
    queryFn: () => client.getDatastoreStatistics(toValue(options.identifier)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.identifier),
    staleTime: options.staleTime,
  })
}

/**
 * Mutation composable to trigger a datastore import
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTriggerDatastoreImport } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ resourceId: string }>()
 *
 * const triggerImport = useTriggerDatastoreImport()
 *
 * const handleImport = () => {
 *   triggerImport.mutate(
 *     { resource_id: props.resourceId },
 *     {
 *       onSuccess: (result) => {
 *         console.log('Import started:', result.status)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <button @click="handleImport" :disabled="triggerImport.isPending">
 *     {{ triggerImport.isPending ? 'Starting...' : 'Import to Datastore' }}
 *   </button>
 * </template>
 * ```
 */
export function useTriggerDatastoreImport() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<DatastoreImport, Error, DatastoreImportOptions>({
    mutationFn: (options) => client.triggerDatastoreImport(options),
    onSuccess: () => {
      // Invalidate imports list
      queryClient.invalidateQueries({ queryKey: ['datastore', 'imports'] })
      // Invalidate datastore queries since new data may be available
      queryClient.invalidateQueries({ queryKey: ['datastore', 'query'] })
    },
  })
}

/**
 * Mutation composable to delete a datastore
 * Deletes a specific resource datastore or all datastores for a dataset
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDeleteDatastore } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const deleteDatastore = useDeleteDatastore()
 *
 * const handleDelete = () => {
 *   if (confirm('Delete this datastore? This cannot be undone.')) {
 *     deleteDatastore.mutate(props.identifier, {
 *       onSuccess: (result) => {
 *         console.log(result.message)
 *       },
 *     })
 *   }
 * }
 * </script>
 *
 * <template>
 *   <button
 *     @click="handleDelete"
 *     :disabled="deleteDatastore.isPending"
 *     class="btn-danger"
 *   >
 *     {{ deleteDatastore.isPending ? 'Deleting...' : 'Delete Datastore' }}
 *   </button>
 * </template>
 * ```
 */
export function useDeleteDatastore() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (identifier) => client.deleteDatastore(identifier),
    onSuccess: (data, identifier) => {
      // Invalidate imports list
      queryClient.invalidateQueries({ queryKey: ['datastore', 'imports'] })
      // Remove statistics for this identifier
      queryClient.removeQueries({
        queryKey: ['datastore', 'statistics', identifier],
      })
      // Invalidate datastore queries
      queryClient.invalidateQueries({ queryKey: ['datastore', 'query'] })
    },
  })
}
