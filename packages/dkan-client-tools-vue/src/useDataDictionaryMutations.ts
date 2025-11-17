/**
 * Vue composables for Data Dictionary CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useDkanClient } from './plugin'
import type {
  DataDictionary,
  MetastoreWriteResponse,
} from '@dkan-client-tools/core'

/**
 * Creates a new data dictionary.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const createDict = useCreateDataDictionary()
 *
 * function handleCreate() {
 *   createDict.mutate({
 *     identifier: 'my-dict',
 *     data: {
 *       title: 'My Dictionary',
 *       fields: [
 *         { name: 'id', type: 'integer' },
 *         { name: 'name', type: 'string' },
 *       ],
 *     },
 *   })
 * }
 * </script>
 * ```
 */
export function useCreateDataDictionary() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, DataDictionary>({
    mutationFn: (dictionary: DataDictionary) => client.createDataDictionary(dictionary),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['data-dictionary', 'list'],
      })
    },
  })
}

/**
 * Updates an existing data dictionary (full replacement).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const updateDict = useUpdateDataDictionary()
 *
 * function handleSave(identifier, dictionary) {
 *   updateDict.mutate({ identifier, dictionary })
 * }
 * </script>
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
    mutationFn: ({ identifier, dictionary }: { identifier: string; dictionary: DataDictionary }) =>
      client.updateDataDictionary(identifier, dictionary),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['data-dictionary', 'single', variables.identifier],
      })
      queryClient.invalidateQueries({
        queryKey: ['data-dictionary', 'list'],
      })
    },
  })
}

/**
 * Deletes a data dictionary.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const deleteDict = useDeleteDataDictionary()
 *
 * function handleDelete(identifier) {
 *   if (confirm('Delete? This cannot be undone.')) {
 *     deleteDict.mutate(identifier)
 *   }
 * }
 * </script>
 * ```
 */
export function useDeleteDataDictionary() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (identifier: string) => client.deleteDataDictionary(identifier),
    onSuccess: (_data, identifier) => {
      queryClient.removeQueries({
        queryKey: ['data-dictionary', 'single', identifier],
      })
      queryClient.invalidateQueries({
        queryKey: ['data-dictionary', 'list'],
      })
    },
  })
}
