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
 * Hook to list all datastore imports
 *
 * @example
 * ```tsx
 * function ImportsList() {
 *   const { data: imports, isLoading } = useDatastoreImports({
 *     refetchInterval: 5000 // Poll every 5 seconds
 *   })
 *
 *   if (isLoading) return <div>Loading imports...</div>
 *
 *   return (
 *     <ul>
 *       {Object.entries(imports || {}).map(([id, importData]) => (
 *         <li key={id}>
 *           {id}: {importData.status}
 *           {importData.importer?.state?.num_records &&
 *             ` (${importData.importer.state.num_records} records)`
 *           }
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
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
 * Hook to get a specific datastore import status
 *
 * @example
 * ```tsx
 * function ImportStatus({ identifier }: { identifier: string }) {
 *   const { data: importData, isLoading } = useDatastoreImport({
 *     identifier,
 *     refetchInterval: 3000 // Poll while in progress
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!importData) return null
 *
 *   return (
 *     <div>
 *       <h4>Import Status: {importData.status}</h4>
 *       {importData.file_fetcher?.state && (
 *         <p>File: {importData.file_fetcher.state.file_path}</p>
 *       )}
 *       {importData.importer?.state && (
 *         <p>Records imported: {importData.importer.state.num_records}</p>
 *       )}
 *     </div>
 *   )
 * }
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
 * Hook to get datastore statistics for a resource
 *
 * @example
 * ```tsx
 * function DatastoreStats({ identifier }: { identifier: string }) {
 *   const { data: stats, isLoading } = useDatastoreStatistics({ identifier })
 *
 *   if (isLoading) return <div>Loading stats...</div>
 *   if (!stats) return null
 *
 *   return (
 *     <div>
 *       <p>Rows: {stats.numOfRows}</p>
 *       <p>Columns: {stats.numOfColumns}</p>
 *       <details>
 *         <summary>Column Names</summary>
 *         <ul>
 *           {stats.columns.map(col => (
 *             <li key={col}>{col}</li>
 *           ))}
 *         </ul>
 *       </details>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDatastoreStatistics(options: UseDatastoreStatisticsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datastore', 'statistics', options.identifier] as const,
    queryFn: () => client.getDatastoreStatistics(options.identifier),
    enabled: (options.enabled ?? true) && !!options.identifier,
    staleTime: options.staleTime,
  })
}

/**
 * Mutation hook to trigger a datastore import
 *
 * @example
 * ```tsx
 * function TriggerImportButton({ resourceId }: { resourceId: string }) {
 *   const triggerImport = useTriggerDatastoreImport()
 *
 *   const handleImport = () => {
 *     triggerImport.mutate(
 *       { resource_id: resourceId },
 *       {
 *         onSuccess: (result) => {
 *           console.log('Import started:', result.status)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <button onClick={handleImport} disabled={triggerImport.isPending}>
 *       {triggerImport.isPending ? 'Starting...' : 'Import to Datastore'}
 *     </button>
 *   )
 * }
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
 * Mutation hook to delete a datastore
 * Deletes a specific resource datastore or all datastores for a dataset
 *
 * @example
 * ```tsx
 * function DeleteDatastoreButton({ identifier }: { identifier: string }) {
 *   const deleteDatastore = useDeleteDatastore()
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete this datastore? This cannot be undone.')) {
 *       deleteDatastore.mutate(identifier, {
 *         onSuccess: (result) => {
 *           console.log(result.message)
 *         },
 *       })
 *     }
 *   }
 *
 *   return (
 *     <button
 *       onClick={handleDelete}
 *       disabled={deleteDatastore.isPending}
 *       className="btn-danger"
 *     >
 *       {deleteDatastore.isPending ? 'Deleting...' : 'Delete Datastore'}
 *     </button>
 *   )
 * }
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
