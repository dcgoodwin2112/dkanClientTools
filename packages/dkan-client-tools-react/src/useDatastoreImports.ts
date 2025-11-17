/**
 * React hooks for DKAN Datastore Import operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type {
  DatastoreImport,
  DatastoreImportOptions,
  DatastoreStatistics,
} from '@dkan-client-tools/core'

export interface UseDatastoreImportsOptions {
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number
}

export interface UseDatastoreImportOptions {
  identifier: string
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number
}

export interface UseDatastoreStatisticsOptions {
  identifier: string
  enabled?: boolean
  staleTime?: number
}

/**
 * Fetches status of all datastore import operations.
 *
 * Returns map of import operations by resource ID with status, file fetcher state, and importer state.
 * Supports polling via `refetchInterval` for real-time progress monitoring.
 *
 * @example
 * ```tsx
 * const { data: imports } = useDatastoreImports({
 *   refetchInterval: 5000, // Poll every 5 seconds
 * })
 * ```
 */
export function useDatastoreImports(options: UseDatastoreImportsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datastore', 'imports'] as const,
    queryFn: () => client.listDatastoreImports(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 0, // Default to always refetch
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Fetches import status for a specific datastore resource.
 *
 * Convenience wrapper around `useDatastoreImports` filtered to a specific import.
 *
 * @example
 * ```tsx
 * const { data: importData } = useDatastoreImport({
 *   identifier,
 *   refetchInterval: 3000,
 * })
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
    data: imports.data?.[options.identifier],
  }
}

/**
 * Fetches statistics about a datastore's imported data.
 *
 * Returns row count, column count, and column definitions.
 *
 * @example
 * ```tsx
 * const { data: stats } = useDatastoreStatistics({ identifier })
 * // stats: { numOfRows, numOfColumns, columns: { ... } }
 * ```
 */
export function useDatastoreStatistics(options: UseDatastoreStatisticsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datastore', 'statistics', options.identifier] as const,
    queryFn: () => client.getDatastoreStatistics(options.identifier),
    enabled: options.enabled !== false && !!options.identifier,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes
  })
}

/**
 * Triggers a new datastore import operation.
 *
 * Downloads data file from distribution URL and imports into DKAN's datastore.
 * Runs asynchronously - use `useDatastoreImport` with polling to monitor progress.
 * Invalidates imports and datastore queries on success.
 *
 * @example
 * ```tsx
 * const triggerImport = useTriggerDatastoreImport()
 * triggerImport.mutate(
 *   { resource_id: resourceId },
 *   {
 *     onSuccess: () => console.log('Import started'),
 *   }
 * )
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
 * Deletes a datastore and all its imported data.
 *
 * Permanently removes datastore database table. Cannot be undone - data can only be recovered by re-importing.
 * Removes from cache and invalidates related queries on success.
 *
 * @example
 * ```tsx
 * const deleteDatastore = useDeleteDatastore()
 * deleteDatastore.mutate(identifier, {
 *   onSuccess: () => console.log('Datastore deleted'),
 * })
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
