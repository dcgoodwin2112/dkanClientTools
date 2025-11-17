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
 * Fetches all datastore import statuses with optional polling.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: imports } = useDatastoreImports({
 *   refetchInterval: 5000, // Poll every 5 seconds
 * })
 * </script>
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
 * Fetches import status for a specific resource with optional polling.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: importData } = useDatastoreImport({
 *   identifier: 'resource-uuid',
 *   refetchInterval: 3000,
 * })
 * </script>
 * ```
 */
export function useDatastoreImport(options: UseDatastoreImportOptions) {
  const client = useDkanClient()
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

/**
 * Fetches statistics about a datastore's imported data.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: stats } = useDatastoreStatistics({
 *   identifier: 'resource-uuid',
 * })
 * </script>
 * ```
 */
export function useDatastoreStatistics(options: UseDatastoreStatisticsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => ['datastore', 'statistics', toValue(options.identifier)] as const),
    queryFn: () => client.getDatastoreStatistics(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) !== false && !!toValue(options.identifier),
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes
  })
}
