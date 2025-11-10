/**
 * Vue mutation composables for DKAN Dataset CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useDkanClient } from './plugin'
import type {
  DkanDataset,
  MetastoreWriteResponse,
} from '@dkan-client-tools/core'

/**
 * Mutation composable to create a new dataset
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCreateDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 *
 * const createDataset = useCreateDataset()
 * const newDataset = ref<DkanDataset>({
 *   title: 'My Dataset',
 *   description: 'A sample dataset',
 *   // ... other required fields
 * })
 *
 * async function handleCreate() {
 *   try {
 *     const result = await createDataset.mutateAsync(newDataset.value)
 *     console.log('Dataset created:', result.identifier)
 *   } catch (error) {
 *     console.error('Failed to create dataset:', error)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button @click="handleCreate" :disabled="createDataset.isPending">
 *       {{ createDataset.isPending ? 'Creating...' : 'Create Dataset' }}
 *     </button>
 *     <p v-if="createDataset.isError">Error: {{ createDataset.error.message }}</p>
 *     <p v-if="createDataset.isSuccess">Dataset created successfully!</p>
 *   </div>
 * </template>
 * ```
 */
export function useCreateDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, DkanDataset>({
    mutationFn: (dataset: DkanDataset) => client.createDataset(dataset),
    onSuccess: () => {
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
  identifier: string
  dataset: DkanDataset
}

/**
 * Mutation composable to update an existing dataset (full replacement)
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useUpdateDataset, useDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 *
 * const props = defineProps<{ identifier: string }>()
 * const updateDataset = useUpdateDataset()
 * const { data: currentDataset } = useDataset({ identifier: props.identifier })
 *
 * function handleSave(updatedDataset: DkanDataset) {
 *   updateDataset.mutate({
 *     identifier: props.identifier,
 *     dataset: updatedDataset,
 *   })
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="handleSave(currentDataset!)">
 *     <!-- form fields -->
 *     <button type="submit" :disabled="updateDataset.isPending">
 *       {{ updateDataset.isPending ? 'Saving...' : 'Save Changes' }}
 *     </button>
 *   </form>
 * </template>
 * ```
 */
export function useUpdateDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, UpdateDatasetOptions>({
    mutationFn: ({ identifier, dataset }: UpdateDatasetOptions) =>
      client.updateDataset(identifier, dataset),
    onSuccess: (_data, variables) => {
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
  identifier: string
  partialDataset: Partial<DkanDataset>
}

/**
 * Mutation composable to partially update a dataset
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { usePatchDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 *
 * const props = defineProps<{ identifier: string }>()
 * const patchDataset = usePatchDataset()
 * const title = ref('')
 *
 * function handleUpdate() {
 *   patchDataset.mutate({
 *     identifier: props.identifier,
 *     partialDataset: { title: title.value },
 *   })
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <input v-model="title" placeholder="New title" />
 *     <button @click="handleUpdate" :disabled="patchDataset.isPending">
 *       Update Title
 *     </button>
 *   </div>
 * </template>
 * ```
 */
export function usePatchDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, PatchDatasetOptions>({
    mutationFn: ({ identifier, partialDataset }: PatchDatasetOptions) =>
      client.patchDataset(identifier, partialDataset),
    onSuccess: (_data, variables) => {
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
 * Mutation composable to delete a dataset
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDeleteDataset } from '@dkan-client-tools/vue'
 * import { useRouter } from 'vue-router'
 *
 * const props = defineProps<{ identifier: string }>()
 * const deleteDataset = useDeleteDataset()
 * const router = useRouter()
 *
 * function handleDelete() {
 *   if (confirm('Are you sure you want to delete this dataset?')) {
 *     deleteDataset.mutate(props.identifier, {
 *       onSuccess: () => {
 *         router.push('/datasets')
 *       },
 *     })
 *   }
 * }
 * </script>
 *
 * <template>
 *   <button
 *     @click="handleDelete"
 *     :disabled="deleteDataset.isPending"
 *     class="btn-danger"
 *   >
 *     {{ deleteDataset.isPending ? 'Deleting...' : 'Delete Dataset' }}
 *   </button>
 * </template>
 * ```
 */
export function useDeleteDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (identifier: string) => client.deleteDataset(identifier),
    onSuccess: (_data, identifier) => {
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
