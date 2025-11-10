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
 * Creates a new dataset in the DKAN metastore.
 *
 * This mutation hook handles the creation of new datasets following the DCAT-US
 * metadata schema. Upon successful creation, it automatically invalidates related
 * queries (dataset lists, search results, facets) to keep the cache fresh.
 *
 * The dataset object must include required DCAT-US fields like title, description,
 * and publisher. The server will generate a unique identifier (UUID) for the new dataset.
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to trigger the mutation with a dataset object
 *   - `mutateAsync`: Async version that returns a promise with the result
 *   - `isPending`: True while the creation is in progress
 *   - `isError`: True if the creation failed
 *   - `isSuccess`: True if the dataset was created successfully
 *   - `error`: Error object if the request failed
 *   - `data`: Response containing the new dataset's identifier and endpoint
 *
 * @example
 * Basic usage with loading states:
 * ```tsx
 * function CreateDatasetForm() {
 *   const createDataset = useCreateDataset()
 *
 *   const handleSubmit = async (dataset: DkanDataset) => {
 *     try {
 *       const result = await createDataset.mutateAsync(dataset)
 *       console.log('Dataset created:', result.identifier)
 *       // Navigate to new dataset or show success message
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
 *
 * @example
 * With form validation and error handling:
 * ```tsx
 * function DatasetCreator() {
 *   const createDataset = useCreateDataset()
 *   const navigate = useNavigate()
 *   const [formData, setFormData] = useState<Partial<DkanDataset>>({})
 *
 *   const handleCreate = () => {
 *     const newDataset: DkanDataset = {
 *       title: formData.title!,
 *       description: formData.description!,
 *       publisher: formData.publisher!,
 *       contactPoint: formData.contactPoint!,
 *       keyword: formData.keyword || [],
 *       theme: formData.theme || [],
 *       distribution: []
 *     }
 *
 *     createDataset.mutate(newDataset, {
 *       onSuccess: (data) => {
 *         navigate(`/datasets/${data.identifier}`)
 *       },
 *       onError: (error) => {
 *         alert(`Failed to create dataset: ${error.message}`)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
 *       {/* Form fields *\/}
 *       <button type="submit" disabled={createDataset.isPending}>
 *         {createDataset.isPending ? 'Creating...' : 'Create Dataset'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example
 * With optimistic UI updates (advanced):
 * ```tsx
 * function QuickDatasetCreator() {
 *   const createDataset = useCreateDataset()
 *   const queryClient = useQueryClient()
 *
 *   const createWithOptimisticUpdate = (dataset: DkanDataset) => {
 *     createDataset.mutate(dataset, {
 *       onMutate: async (newDataset) => {
 *         // Cancel outgoing refetches
 *         await queryClient.cancelQueries({ queryKey: ['datasets'] })
 *
 *         // Optimistically update the UI
 *         const previousDatasets = queryClient.getQueryData(['datasets', 'all'])
 *
 *         queryClient.setQueryData(['datasets', 'all'], (old: any) => {
 *           return old ? [...old, { ...newDataset, identifier: 'temp-id' }] : [newDataset]
 *         })
 *
 *         return { previousDatasets }
 *       },
 *       onError: (err, newDataset, context) => {
 *         // Rollback on error
 *         if (context?.previousDatasets) {
 *           queryClient.setQueryData(['datasets', 'all'], context.previousDatasets)
 *         }
 *       }
 *     })
 *   }
 *
 *   return <button onClick={() => createWithOptimisticUpdate(myDataset)}>Quick Create</button>
 * }
 * ```
 *
 * @see {@link useUpdateDataset} for updating existing datasets
 * @see {@link useDeleteDataset} for deleting datasets
 * @see {@link useDataset} for fetching datasets after creation
 * @see https://dkan.readthedocs.io/en/latest/apis/metastore.html
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

/**
 * Options for updating a dataset.
 */
export interface UpdateDatasetOptions {
  /**
   * The unique identifier (UUID) of the dataset to update.
   */
  identifier: string

  /**
   * The complete dataset object that will replace the existing dataset.
   *
   * This performs a full replacement (PUT operation), so all fields
   * should be included even if they haven't changed. For partial updates,
   * use `usePatchDataset` instead.
   */
  dataset: DkanDataset
}

/**
 * Updates an existing dataset with a complete replacement (PUT operation).
 *
 * This mutation performs a full update of the dataset, replacing all fields
 * with the provided data. Any fields not included in the new dataset object
 * will be removed. For partial updates that preserve existing fields, use
 * `usePatchDataset` instead.
 *
 * Upon successful update, this hook automatically invalidates related queries
 * including the specific dataset, dataset lists, search results, and facets.
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to trigger the update with identifier and dataset
 *   - `mutateAsync`: Async version that returns a promise
 *   - `isPending`: True while the update is in progress
 *   - `isError`: True if the update failed
 *   - `isSuccess`: True if the dataset was updated successfully
 *   - `error`: Error object if the request failed
 *   - `data`: Response containing update confirmation
 *
 * @example
 * Basic usage - full dataset update:
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
 *   if (!currentDataset) return <div>Loading...</div>
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       // ... collect form data and call handleSave
 *     }}>
 *       <button type="submit" disabled={updateDataset.isPending}>
 *         {updateDataset.isPending ? 'Saving...' : 'Save Changes'}
 *       </button>
 *       {updateDataset.isError && (
 *         <p className="error">Error: {updateDataset.error.message}</p>
 *       )}
 *     </form>
 *   )
 * }
 * ```
 *
 * @example
 * With success callback and navigation:
 * ```tsx
 * function DatasetEditor({ id }: { id: string }) {
 *   const updateDataset = useUpdateDataset()
 *   const navigate = useNavigate()
 *   const queryClient = useQueryClient()
 *
 *   const saveDataset = (dataset: DkanDataset) => {
 *     updateDataset.mutate(
 *       { identifier: id, dataset },
 *       {
 *         onSuccess: (data) => {
 *           // Show success message
 *           toast.success('Dataset updated successfully!')
 *           // Navigate back to dataset view
 *           navigate(`/datasets/${id}`)
 *         },
 *         onError: (error) => {
 *           toast.error(`Failed to update: ${error.message}`)
 *         }
 *       }
 *     )
 *   }
 *
 *   return <DatasetForm onSave={saveDataset} />
 * }
 * ```
 *
 * @example
 * Preserving all fields from current dataset:
 * ```tsx
 * function TitleEditor({ identifier }: { identifier: string }) {
 *   const updateDataset = useUpdateDataset()
 *   const { data: dataset } = useDataset({ identifier })
 *   const [newTitle, setNewTitle] = useState('')
 *
 *   const handleUpdate = () => {
 *     if (!dataset) return
 *
 *     // Create updated dataset with all existing fields
 *     const updatedDataset: DkanDataset = {
 *       ...dataset,
 *       title: newTitle,
 *       modified: new Date().toISOString()
 *     }
 *
 *     updateDataset.mutate({ identifier, dataset: updatedDataset })
 *   }
 *
 *   return (
 *     <div>
 *       <input
 *         value={newTitle}
 *         onChange={(e) => setNewTitle(e.target.value)}
 *         placeholder="New title"
 *       />
 *       <button onClick={handleUpdate} disabled={!dataset || updateDataset.isPending}>
 *         Update Dataset
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link usePatchDataset} for partial updates that preserve existing fields
 * @see {@link useCreateDataset} for creating new datasets
 * @see {@link useDataset} for fetching the current dataset state
 * @see https://dkan.readthedocs.io/en/latest/apis/metastore.html
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

/**
 * Options for partially updating a dataset.
 */
export interface PatchDatasetOptions {
  /**
   * The unique identifier (UUID) of the dataset to patch.
   */
  identifier: string

  /**
   * Partial dataset object containing only the fields to update.
   *
   * This performs a PATCH operation - only the specified fields will be updated,
   * and all other existing fields will be preserved. This is more convenient than
   * `useUpdateDataset` when you only want to modify specific fields.
   */
  partialDataset: Partial<DkanDataset>
}

/**
 * Partially updates a dataset, modifying only the specified fields (PATCH operation).
 *
 * This mutation is more convenient than `useUpdateDataset` when you only want to
 * modify specific fields without providing the entire dataset object. All fields
 * not included in the partial dataset will retain their existing values.
 *
 * Common use cases include:
 * - Updating just the title or description
 * - Adding new keywords or themes
 * - Modifying the publisher information
 * - Updating the modified timestamp
 *
 * Upon successful patch, this hook automatically invalidates related queries
 * to keep the cache fresh.
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to trigger the patch with identifier and partial dataset
 *   - `mutateAsync`: Async version that returns a promise
 *   - `isPending`: True while the patch is in progress
 *   - `isError`: True if the patch failed
 *   - `isSuccess`: True if the dataset was patched successfully
 *   - `error`: Error object if the request failed
 *   - `data`: Response containing patch confirmation
 *
 * @example
 * Quick field update - just change the title:
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
 *         {patchDataset.isPending ? 'Updating...' : 'Update Title'}
 *       </button>
 *       {patchDataset.isSuccess && <p>Title updated!</p>}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Update multiple fields at once:
 * ```tsx
 * function DatasetQuickEdit({ id }: { id: string }) {
 *   const patchDataset = usePatchDataset()
 *   const { data: dataset } = useDataset({ identifier: id })
 *
 *   const addKeywords = (newKeywords: string[]) => {
 *     patchDataset.mutate({
 *       identifier: id,
 *       partialDataset: {
 *         keyword: [...(dataset?.keyword || []), ...newKeywords],
 *         modified: new Date().toISOString()
 *       }
 *     }, {
 *       onSuccess: () => {
 *         alert('Keywords added successfully!')
 *       }
 *     })
 *   }
 *
 *   return <KeywordEditor onAdd={addKeywords} />
 * }
 * ```
 *
 * @example
 * Toggle published state:
 * ```tsx
 * function PublishToggle({ identifier, currentState }: Props) {
 *   const patchDataset = usePatchDataset()
 *
 *   const togglePublish = () => {
 *     patchDataset.mutate({
 *       identifier,
 *       partialDataset: {
 *         moderation_state: currentState === 'published' ? 'draft' : 'published',
 *         modified: new Date().toISOString()
 *       }
 *     })
 *   }
 *
 *   return (
 *     <button
 *       onClick={togglePublish}
 *       disabled={patchDataset.isPending}
 *       className={currentState === 'published' ? 'btn-warning' : 'btn-success'}
 *     >
 *       {patchDataset.isPending
 *         ? 'Updating...'
 *         : currentState === 'published'
 *         ? 'Unpublish'
 *         : 'Publish'}
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * Batch update with error handling:
 * ```tsx
 * function BulkMetadataUpdate({ identifiers }: { identifiers: string[] }) {
 *   const patchDataset = usePatchDataset()
 *   const [progress, setProgress] = useState(0)
 *
 *   const updateAll = async () => {
 *     for (let i = 0; i < identifiers.length; i++) {
 *       try {
 *         await patchDataset.mutateAsync({
 *           identifier: identifiers[i],
 *           partialDataset: {
 *             publisher: { name: 'Updated Publisher' },
 *             modified: new Date().toISOString()
 *           }
 *         })
 *         setProgress((i + 1) / identifiers.length * 100)
 *       } catch (error) {
 *         console.error(`Failed to update ${identifiers[i]}:`, error)
 *       }
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={updateAll} disabled={patchDataset.isPending}>
 *         Update All
 *       </button>
 *       <progress value={progress} max={100} />
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useUpdateDataset} for full dataset replacement (PUT operation)
 *  @see {@link useDataset} for fetching the current dataset state
 * @see https://dkan.readthedocs.io/en/latest/apis/metastore.html
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
 * Deletes a dataset from the DKAN metastore.
 *
 * This mutation permanently removes a dataset and all its metadata from the system.
 * This operation cannot be undone, so it's important to confirm the user's intent
 * before executing the deletion.
 *
 * Upon successful deletion, this hook automatically:
 * - Removes the dataset from the React Query cache
 * - Invalidates dataset lists and search results
 * - Invalidates facets (as the deletion may affect available themes/publishers)
 * - Invalidates metastore items
 *
 * **Warning**: This is a destructive operation and should be used with caution.
 * Always implement confirmation dialogs before deleting datasets.
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to trigger deletion with a dataset identifier
 *   - `mutateAsync`: Async version that returns a promise
 *   - `isPending`: True while the deletion is in progress
 *   - `isError`: True if the deletion failed
 *   - `isSuccess`: True if the dataset was deleted successfully
 *   - `error`: Error object if the request failed
 *   - `data`: Response containing deletion confirmation message
 *
 * @example
 * Basic usage with confirmation:
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
 *
 * @example
 * With custom confirmation modal and error handling:
 * ```tsx
 * function DatasetDeleteDialog({ dataset }: { dataset: DkanDataset }) {
 *   const deleteDataset = useDeleteDataset()
 *   const [showModal, setShowModal] = useState(false)
 *   const navigate = useNavigate()
 *
 *   const confirmDelete = () => {
 *     deleteDataset.mutate(dataset.identifier, {
 *       onSuccess: () => {
 *         toast.success('Dataset deleted successfully')
 *         setShowModal(false)
 *         navigate('/datasets')
 *       },
 *       onError: (error) => {
 *         toast.error(`Failed to delete: ${error.message}`)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <>
 *       <button
 *         onClick={() => setShowModal(true)}
 *         className="btn-danger"
 *       >
 *         Delete
 *       </button>
 *
 *       {showModal && (
 *         <Modal onClose={() => setShowModal(false)}>
 *           <h2>Confirm Deletion</h2>
 *           <p>
 *             Are you sure you want to delete "{dataset.title}"?
 *             This action cannot be undone.
 *           </p>
 *           <button
 *             onClick={confirmDelete}
 *             disabled={deleteDataset.isPending}
 *             className="btn-danger"
 *           >
 *             {deleteDataset.isPending ? 'Deleting...' : 'Yes, Delete'}
 *           </button>
 *           <button onClick={() => setShowModal(false)}>
 *             Cancel
 *           </button>
 *         </Modal>
 *       )}
 *     </>
 *   )
 * }
 * ```
 *
 * @example
 * Batch deletion with progress tracking:
 * ```tsx
 * function BulkDeleteDatasets({ identifiers }: { identifiers: string[] }) {
 *   const deleteDataset = useDeleteDataset()
 *   const [progress, setProgress] = useState<{
 *     completed: number
 *     failed: string[]
 *   }>({ completed: 0, failed: [] })
 *
 *   const deleteAll = async () => {
 *     if (!confirm(`Delete ${identifiers.length} datasets? This cannot be undone.`)) {
 *       return
 *     }
 *
 *     for (let i = 0; i < identifiers.length; i++) {
 *       try {
 *         await deleteDataset.mutateAsync(identifiers[i])
 *         setProgress(prev => ({
 *           ...prev,
 *           completed: prev.completed + 1
 *         }))
 *       } catch (error) {
 *         setProgress(prev => ({
 *           ...prev,
 *           failed: [...prev.failed, identifiers[i]]
 *         }))
 *       }
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={deleteAll}
 *         disabled={deleteDataset.isPending}
 *         className="btn-danger"
 *       >
 *         Delete {identifiers.length} Datasets
 *       </button>
 *       {progress.completed > 0 && (
 *         <div>
 *           <p>Deleted: {progress.completed}/{identifiers.length}</p>
 *           {progress.failed.length > 0 && (
 *             <p className="error">Failed: {progress.failed.join(', ')}</p>
 *           )}
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * With undo functionality (soft delete pattern):
 * ```tsx
 * function DatasetWithUndo({ identifier }: { identifier: string }) {
 *   const deleteDataset = useDeleteDataset()
 *   const patchDataset = usePatchDataset()
 *   const [showUndo, setShowUndo] = useState(false)
 *
 *   const softDelete = () => {
 *     // Mark as deleted instead of actual deletion
 *     patchDataset.mutate({
 *       identifier,
 *       partialDataset: { moderation_state: 'orphaned' }
 *     }, {
 *       onSuccess: () => {
 *         setShowUndo(true)
 *         // Auto-hide undo after 10 seconds
 *         setTimeout(() => setShowUndo(false), 10000)
 *       }
 *     })
 *   }
 *
 *   const permanentDelete = () => {
 *     deleteDataset.mutate(identifier)
 *   }
 *
 *   const undo = () => {
 *     patchDataset.mutate({
 *       identifier,
 *       partialDataset: { moderation_state: 'draft' }
 *     })
 *     setShowUndo(false)
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={softDelete}>Delete</button>
 *       {showUndo && (
 *         <div className="toast">
 *           <span>Dataset moved to trash</span>
 *           <button onClick={undo}>Undo</button>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useUpdateDataset} for updating datasets
 * @see {@link usePatchDataset} for changing dataset state (e.g., marking as orphaned)
 * @see {@link useDataset} for fetching datasets
 * @see https://dkan.readthedocs.io/en/latest/apis/metastore.html
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
