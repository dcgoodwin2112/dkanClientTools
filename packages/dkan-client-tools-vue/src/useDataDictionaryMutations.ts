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
 * Mutation composable to create a new data dictionary
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCreateDataDictionary } from '@dkan-client-tools/vue'
 *
 * const createDict = useCreateDataDictionary()
 * const fields = ref([
 *   { name: 'id', type: 'integer', title: 'ID' },
 *   { name: 'name', type: 'string', title: 'Name' },
 * ])
 *
 * function handleSubmit() {
 *   createDict.mutate(
 *     {
 *       identifier: 'my-data-dict',
 *       data: {
 *         title: 'My Data Dictionary',
 *         fields: fields.value,
 *       },
 *     },
 *     {
 *       onSuccess: (result) => {
 *         console.log('Created:', result.identifier)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="handleSubmit">
 *     <!-- Field editor UI -->
 *     <button type="submit" :disabled="createDict.isPending">
 *       {{ createDict.isPending ? 'Creating...' : 'Create Dictionary' }}
 *     </button>
 *   </form>
 * </template>
 * ```
 */
export function useCreateDataDictionary() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, DataDictionary>({
    mutationFn: (dictionary: DataDictionary) => client.createDataDictionary(dictionary),
    onSuccess: () => {
      // Invalidate data dictionary lists
      queryClient.invalidateQueries({
        queryKey: ['data-dictionary', 'list'],
      })
    },
  })
}

/**
 * Mutation composable to update an existing data dictionary (full replacement)
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref, watch } from 'vue'
 * import { useDataDictionary, useUpdateDataDictionary } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 * const { data: existingDict } = useDataDictionary({ identifier: props.identifier })
 * const updateDict = useUpdateDataDictionary()
 * const dictionary = ref<DataDictionary | null>(null)
 *
 * watch(existingDict, (newDict) => {
 *   if (newDict) {
 *     dictionary.value = newDict
 *   }
 * })
 *
 * function handleSave() {
 *   if (dictionary.value) {
 *     updateDict.mutate(
 *       { identifier: props.identifier, dictionary: dictionary.value },
 *       {
 *         onSuccess: () => {
 *           alert('Dictionary updated successfully!')
 *         },
 *       }
 *     )
 *   }
 * }
 * </script>
 *
 * <template>
 *   <form v-if="dictionary" @submit.prevent="handleSave">
 *     <!-- Editor UI -->
 *     <button type="submit" :disabled="updateDict.isPending">
 *       {{ updateDict.isPending ? 'Saving...' : 'Save Changes' }}
 *     </button>
 *   </form>
 * </template>
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
 * Mutation composable to delete a data dictionary
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDeleteDataDictionary } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 * const deleteDict = useDeleteDataDictionary()
 *
 * function handleDelete() {
 *   if (confirm('Delete this data dictionary? This cannot be undone.')) {
 *     deleteDict.mutate(props.identifier, {
 *       onSuccess: (result) => {
 *         console.log(result.message)
 *       },
 *       onError: (error) => {
 *         alert('Delete failed: ' + error.message)
 *       },
 *     })
 *   }
 * }
 * </script>
 *
 * <template>
 *   <button
 *     @click="handleDelete"
 *     :disabled="deleteDict.isPending"
 *     class="btn-danger"
 *   >
 *     {{ deleteDict.isPending ? 'Deleting...' : 'Delete Dictionary' }}
 *   </button>
 * </template>
 * ```
 */
export function useDeleteDataDictionary() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (identifier: string) => client.deleteDataDictionary(identifier),
    onSuccess: (_data, identifier) => {
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
