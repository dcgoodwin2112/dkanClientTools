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
 * Mutation hook to create a new dataset
 *
 * @example
 * ```tsx
 * function CreateDatasetForm() {
 *   const createDataset = useCreateDataset()
 *
 *   const handleSubmit = async (dataset: DkanDataset) => {
 *     try {
 *       const result = await createDataset.mutateAsync(dataset)
 *       console.log('Dataset created:', result.identifier)
 *     } catch (error) {
 *       console.error('Failed to create dataset:', error)
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       {createDataset.isPending && <p>Creating dataset...</p>}
 *       {createDataset.isError && <p>Error: {createDataset.error.message}</p>}
 *       {createDataset.isSuccess && <p>Dataset created successfully!</p>}
 *     </div>
 *   )
 * }
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
  identifier: string
  dataset: DkanDataset
}

/**
 * Mutation hook to update an existing dataset (full replacement)
 *
 * @example
 * ```tsx
 * function EditDatasetForm({ identifier }: { identifier: string }) {
 *   const updateDataset = useUpdateDataset()
 *   const { data: currentDataset } = useDataset({ identifier })
 *
 *   const handleSave = (updatedDataset: DkanDataset) => {
 *     updateDataset.mutate({
 *       identifier,
 *       dataset: updatedDataset,
 *     })
 *   }
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       // ... collect form data and call handleSave
 *     }}>
 *       <button type="submit" disabled={updateDataset.isPending}>
 *         {updateDataset.isPending ? 'Saving...' : 'Save Changes'}
 *       </button>
 *     </form>
 *   )
 * }
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
  identifier: string
  partialDataset: Partial<DkanDataset>
}

/**
 * Mutation hook to partially update a dataset
 *
 * @example
 * ```tsx
 * function QuickEditTitle({ identifier }: { identifier: string }) {
 *   const patchDataset = usePatchDataset()
 *   const [title, setTitle] = useState('')
 *
 *   const handleUpdate = () => {
 *     patchDataset.mutate({
 *       identifier,
 *       partialDataset: { title },
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <input
 *         value={title}
 *         onChange={(e) => setTitle(e.target.value)}
 *         placeholder="New title"
 *       />
 *       <button onClick={handleUpdate} disabled={patchDataset.isPending}>
 *         Update Title
 *       </button>
 *     </div>
 *   )
 * }
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
 * Mutation hook to delete a dataset
 *
 * @example
 * ```tsx
 * function DeleteDatasetButton({ identifier }: { identifier: string }) {
 *   const deleteDataset = useDeleteDataset()
 *   const navigate = useNavigate()
 *
 *   const handleDelete = () => {
 *     if (confirm('Are you sure you want to delete this dataset?')) {
 *       deleteDataset.mutate(identifier, {
 *         onSuccess: () => {
 *           navigate('/datasets')
 *         },
 *       })
 *     }
 *   }
 *
 *   return (
 *     <button
 *       onClick={handleDelete}
 *       disabled={deleteDataset.isPending}
 *       className="btn-danger"
 *     >
 *       {deleteDataset.isPending ? 'Deleting...' : 'Delete Dataset'}
 *     </button>
 *   )
 * }
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
