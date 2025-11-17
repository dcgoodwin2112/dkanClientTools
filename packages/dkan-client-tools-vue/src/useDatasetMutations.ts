/**
 * Vue mutation composables for DKAN Dataset CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useDkanClient } from './plugin'
import type {
  DkanDataset,
  MetastoreWriteResponse,
} from '@dkan-client-tools/core'

export interface UpdateDatasetOptions {
  identifier: string
  dataset: DkanDataset
}

export interface PatchDatasetOptions {
  identifier: string
  partialDataset: Partial<DkanDataset>
}

/**
 * Creates a new dataset in the DKAN catalog.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const createDataset = useCreateDataset()
 *
 * const handleCreate = async () => {
 *   const result = await createDataset.mutateAsync({
 *     title: 'My Dataset',
 *     description: 'Dataset description',
 *     accessLevel: 'public',
 *   })
 *   console.log('Created:', result.identifier)
 * }
 * </script>
 * ```
 */
export function useCreateDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, DkanDataset>({
    mutationFn: (dataset) => client.createDataset(dataset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      queryClient.invalidateQueries({ queryKey: ['metastore', 'facets'] })
    },
  })
}

/**
 * Updates an existing dataset (full replacement).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const updateDataset = useUpdateDataset()
 *
 * const handleUpdate = async () => {
 *   await updateDataset.mutateAsync({
 *     identifier: datasetId,
 *     title: 'Updated Title',
 *     description: 'Updated description',
 *     accessLevel: 'public',
 *   })
 * }
 * </script>
 * ```
 */
export function useUpdateDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, { identifier: string; dataset: DkanDataset }>({
    mutationFn: ({ identifier, dataset }) => client.updateDataset(identifier, dataset),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['datasets', 'single', variables.identifier],
      })
      queryClient.invalidateQueries({ queryKey: ['datasets', 'search'] })
      queryClient.invalidateQueries({ queryKey: ['datasets', 'list'] })
    },
  })
}

/**
 * Partially updates a dataset (only specified fields).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const patchDataset = usePatchDataset()
 *
 * const updateTitle = async () => {
 *   await patchDataset.mutateAsync({
 *     identifier: datasetId,
 *     title: 'New Title',
 *   })
 * }
 * </script>
 * ```
 */
export function usePatchDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, { identifier: string; partialDataset: Partial<DkanDataset> }>({
    mutationFn: ({ identifier, partialDataset }) => client.patchDataset(identifier, partialDataset),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['datasets', 'single', variables.identifier],
      })
      queryClient.invalidateQueries({ queryKey: ['datasets', 'search'] })
      queryClient.invalidateQueries({ queryKey: ['datasets', 'list'] })
    },
  })
}

/**
 * Deletes a dataset from the catalog.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const deleteDataset = useDeleteDataset()
 *
 * const handleDelete = async () => {
 *   if (confirm('Delete dataset?')) {
 *     await deleteDataset.mutateAsync(datasetId)
 *   }
 * }
 * </script>
 * ```
 */
export function useDeleteDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (identifier) => client.deleteDataset(identifier),
    onSuccess: (data, identifier) => {
      queryClient.invalidateQueries({
        queryKey: ['datasets', 'single', identifier],
      })
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      queryClient.invalidateQueries({ queryKey: ['metastore', 'facets'] })
    },
  })
}
