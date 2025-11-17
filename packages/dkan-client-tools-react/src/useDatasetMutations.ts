/**
 * React mutation hooks for DKAN Dataset CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type {
  DkanDataset,
  MetastoreWriteResponse,
} from '@dkan-client-tools/core'

/**
 * Creates a new dataset following DCAT-US schema.
 *
 * Invalidates datasets, search results, facets, and metastore queries on success.
 *
 * @example
 * ```tsx
 * const createDataset = useCreateDataset()
 * const result = await createDataset.mutateAsync(dataset)
 * ```
 */
export function useCreateDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, DkanDataset>({
    mutationFn: (dataset) => client.createDataset(dataset),
    onSuccess: (data) => {
      // Invalidate datasets list
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      // Invalidate search results
      queryClient.invalidateQueries({ queryKey: ['datasets', 'search'] })
      // Invalidate facets
      queryClient.invalidateQueries({ queryKey: ['datasets', 'facets'] })
      // Invalidate metastore items
      queryClient.invalidateQueries({ queryKey: ['metastore'] })
    },
  })
}

export interface UpdateDatasetOptions {
  /** Dataset UUID */
  identifier: string
  /** Complete dataset (PUT operation - replaces all fields) */
  dataset: DkanDataset
}

/**
 * Replaces a dataset completely (PUT operation).
 *
 * For partial updates use `usePatchDataset`. Invalidates dataset, search, and facets on success.
 *
 * @example
 * ```tsx
 * const updateDataset = useUpdateDataset()
 * updateDataset.mutate({ identifier, dataset: updatedDataset })
 * ```
 */
export function useUpdateDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, UpdateDatasetOptions>({
    mutationFn: ({ identifier, dataset }) =>
      client.updateDataset(identifier, dataset),
    onSuccess: (data, variables) => {
      // Invalidate specific dataset
      queryClient.invalidateQueries({
        queryKey: ['datasets', 'single', variables.identifier],
      })
      // Invalidate datasets list
      queryClient.invalidateQueries({ queryKey: ['datasets', 'all'] })
      // Invalidate search results
      queryClient.invalidateQueries({ queryKey: ['datasets', 'search'] })
      // Invalidate facets (tags/themes may have changed)
      queryClient.invalidateQueries({ queryKey: ['datasets', 'facets'] })
    },
  })
}

export interface PatchDatasetOptions {
  /** Dataset UUID */
  identifier: string
  /** Partial dataset (PATCH - updates only specified fields) */
  partialDataset: Partial<DkanDataset>
}

/**
 * Updates specific dataset fields (PATCH operation).
 *
 * Preserves unspecified fields. Invalidates dataset and search queries on success.
 *
 * @example
 * ```tsx
 * const patchDataset = usePatchDataset()
 * patchDataset.mutate({ identifier, partialDataset: { title: 'New Title' } })
 * ```
 */
export function usePatchDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, PatchDatasetOptions>({
    mutationFn: ({ identifier, partialDataset }) =>
      client.patchDataset(identifier, partialDataset),
    onSuccess: (data, variables) => {
      // Invalidate specific dataset
      queryClient.invalidateQueries({
        queryKey: ['datasets', 'single', variables.identifier],
      })
      // Invalidate datasets list
      queryClient.invalidateQueries({ queryKey: ['datasets', 'all'] })
      // Invalidate search results
      queryClient.invalidateQueries({ queryKey: ['datasets', 'search'] })
    },
  })
}

/**
 * Permanently deletes a dataset.
 *
 * Destructive operation - always confirm before deleting. Removes from cache and invalidates related queries.
 *
 * @example
 * ```tsx
 * const deleteDataset = useDeleteDataset()
 * deleteDataset.mutate(identifier)
 * ```
 */
export function useDeleteDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (identifier) => client.deleteDataset(identifier),
    onSuccess: (data, identifier) => {
      // Remove specific dataset from cache
      queryClient.removeQueries({
        queryKey: ['datasets', 'single', identifier],
      })
      // Invalidate datasets list
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      // Invalidate search results
      queryClient.invalidateQueries({ queryKey: ['datasets', 'search'] })
      // Invalidate facets
      queryClient.invalidateQueries({ queryKey: ['datasets', 'facets'] })
      // Invalidate metastore items
      queryClient.invalidateQueries({ queryKey: ['metastore'] })
    },
  })
}
