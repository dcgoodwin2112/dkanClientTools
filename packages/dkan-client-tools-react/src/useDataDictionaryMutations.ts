/**
 * React hooks for Data Dictionary CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type {
  DataDictionary,
  MetastoreWriteResponse,
} from '@dkan-client-tools/core'

/**
 * Creates a new data dictionary following Frictionless Table Schema specification.
 *
 * Invalidates dictionary lists on success.
 *
 * @example
 * ```tsx
 * const create = useCreateDataDictionary()
 * create.mutate({ identifier: 'dict-id', data: { title: 'Schema', fields } })
 * ```
 */
export function useCreateDataDictionary() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, DataDictionary>({
    mutationFn: (dictionary) => client.createDataDictionary(dictionary),
    onSuccess: () => {
      // Invalidate data dictionary lists
      queryClient.invalidateQueries({
        queryKey: ['data-dictionary', 'list'],
      })
    },
  })
}

/**
 * Updates an existing data dictionary with complete replacement (PUT operation).
 *
 * Invalidates dictionary and list queries on success.
 *
 * @example
 * ```tsx
 * const update = useUpdateDataDictionary()
 * update.mutate({ identifier, dictionary: updatedDict })
 * ```
 */
export function useUpdateDataDictionary() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<
    MetastoreWriteResponse,
    Error,
    { identifier: string; dictionary: DataDictionary }
  >({
    mutationFn: ({ identifier, dictionary }) =>
      client.updateDataDictionary(identifier, dictionary),
    onSuccess: (data, variables) => {
      // Invalidate the specific dictionary
      queryClient.invalidateQueries({
        queryKey: ['data-dictionary', 'single', variables.identifier],
      })
      // Invalidate the list
      queryClient.invalidateQueries({
        queryKey: ['data-dictionary', 'list'],
      })
    },
  })
}

/**
 * Permanently deletes a data dictionary.
 *
 * Removes from cache and invalidates dictionary list on success.
 *
 * @example
 * ```tsx
 * const deleteDict = useDeleteDataDictionary()
 * deleteDict.mutate(identifier, {
 *   onSuccess: () => console.log('Dictionary deleted'),
 * })
 * ```
 */
export function useDeleteDataDictionary() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (identifier) => client.deleteDataDictionary(identifier),
    onSuccess: (data, identifier) => {
      // Remove the specific dictionary from cache
      queryClient.removeQueries({
        queryKey: ['data-dictionary', 'single', identifier],
      })
      // Invalidate the list
      queryClient.invalidateQueries({
        queryKey: ['data-dictionary', 'list'],
      })
    },
  })
}
