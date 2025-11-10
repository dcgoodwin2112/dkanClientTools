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
 * Creates a new data dictionary in the DKAN metastore.
 *
 * Data dictionaries define the schema and metadata for dataset distributions, following
 * the Frictionless Data Table Schema specification. They provide human-readable field
 * descriptions, data types, constraints, and validation rules that help users understand
 * and work with datasets.
 *
 * This mutation hook automatically invalidates related queries after successful creation,
 * ensuring that dictionary lists are refreshed with the new entry.
 *
 * Use this hook when you need to:
 * - Create schema definitions for new datasets
 * - Document the structure of uploaded data
 * - Define reusable schemas for multiple datasets
 * - Build schema management interfaces
 * - Programmatically generate dictionaries from data samples
 *
 * **Important**: The identifier should match the distribution/resource ID if you want
 * the dictionary to be automatically associated with a specific distribution.
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to trigger the creation
 *   - `mutateAsync`: Async version that returns a promise
 *   - `isPending`: True while the creation is in progress
 *   - `isSuccess`: True if the dictionary was created successfully
 *   - `isError`: True if creation failed
 *   - `error`: Error object if the request failed
 *   - `data`: MetastoreWriteResponse with the created dictionary's identifier
 *
 * @example
 * Basic usage - create a simple data dictionary:
 * ```tsx
 * function CreateDataDictionaryForm() {
 *   const createDict = useCreateDataDictionary()
 *   const [fields, setFields] = useState<DataDictionaryField[]>([
 *     { name: 'id', type: 'integer', title: 'ID' },
 *     { name: 'name', type: 'string', title: 'Name' },
 *   ])
 *
 *   const handleSubmit = () => {
 *     createDict.mutate(
 *       {
 *         identifier: 'my-data-dict',
 *         data: {
 *           title: 'My Data Dictionary',
 *           fields,
 *         },
 *       },
 *       {
 *         onSuccess: (result) => {
 *           console.log('Created:', result.identifier)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       handleSubmit()
 *     }}>
 *       {/* Field editor UI *\/}
 *       <button type="submit" disabled={createDict.isPending}>
 *         {createDict.isPending ? 'Creating...' : 'Create Dictionary'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example
 * Multi-step wizard with validation:
 * ```tsx
 * function DataDictionaryWizard({ resourceId }: { resourceId: string }) {
 *   const createDict = useCreateDataDictionary()
 *   const [step, setStep] = useState(1)
 *   const [dictionary, setDictionary] = useState<DataDictionary>({
 *     identifier: resourceId,
 *     data: {
 *       title: '',
 *       fields: [],
 *     },
 *   })
 *
 *   const handleFinish = () => {
 *     createDict.mutate(dictionary, {
 *       onSuccess: () => {
 *         alert('Data dictionary created successfully!')
 *       },
 *       onError: (error) => {
 *         alert('Failed to create: ' + error.message)
 *       },
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <h3>Step {step} of 3</h3>
 *       {step === 1 && <BasicInfoStep data={dictionary} onChange={setDictionary} />}
 *       {step === 2 && <FieldsStep data={dictionary} onChange={setDictionary} />}
 *       {step === 3 && <ReviewStep data={dictionary} />}
 *
 *       <button onClick={() => setStep(step - 1)} disabled={step === 1}>
 *         Previous
 *       </button>
 *       {step < 3 ? (
 *         <button onClick={() => setStep(step + 1)}>Next</button>
 *       ) : (
 *         <button onClick={handleFinish} disabled={createDict.isPending}>
 *           {createDict.isPending ? 'Creating...' : 'Create'}
 *         </button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Auto-generate dictionary from CSV upload:
 * ```tsx
 * function CSVUploadWithDictionary() {
 *   const createDict = useCreateDataDictionary()
 *   const [csvFile, setCsvFile] = useState<File | null>(null)
 *
 *   const handleFileChange = async (file: File) => {
 *     setCsvFile(file)
 *
 *     // Parse CSV headers to generate field definitions
 *     const text = await file.text()
 *     const lines = text.split('\n')
 *     const headers = lines[0].split(',')
 *
 *     const fields = headers.map(header => ({
 *       name: header.trim().toLowerCase().replace(/\s+/g, '_'),
 *       title: header.trim(),
 *       type: 'string', // Could be enhanced with type detection
 *       description: '',
 *     }))
 *
 *     // Auto-create dictionary
 *     createDict.mutate(
 *       {
 *         identifier: `dict-${Date.now()}`,
 *         data: {
 *           title: `Dictionary for ${file.name}`,
 *           fields,
 *         },
 *       },
 *       {
 *         onSuccess: (result) => {
 *           console.log('Auto-generated dictionary:', result.identifier)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <input
 *       type="file"
 *       accept=".csv"
 *       onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
 *     />
 *   )
 * }
 * ```
 *
 * @see {@link useDataDictionary} for fetching existing dictionaries
 * @see {@link useUpdateDataDictionary} for updating dictionaries
 * @see {@link useDeleteDataDictionary} for deleting dictionaries
 * @see https://specs.frictionlessdata.io/table-schema/
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
 * Updates an existing data dictionary with complete replacement.
 *
 * This hook performs a full update (HTTP PUT) of a data dictionary, replacing all
 * existing data with the new dictionary object. Any fields not included in the update
 * will be removed from the dictionary.
 *
 * The mutation automatically invalidates the dictionary cache after a successful update,
 * ensuring that any components displaying the dictionary will refetch the latest version.
 *
 * Use this hook when you need to:
 * - Edit existing data dictionary schemas
 * - Add new fields to a dictionary
 * - Update field metadata (types, constraints, descriptions)
 * - Rename or reorganize fields
 * - Apply bulk updates to dictionary schemas
 *
 * **Important**: This is a full replacement operation. If you want to preserve existing
 * data, make sure to fetch the current dictionary first, modify it, then submit the
 * complete updated object.
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to trigger the update with {identifier, dictionary} params
 *   - `mutateAsync`: Async version that returns a promise
 *   - `isPending`: True while the update is in progress
 *   - `isSuccess`: True if the dictionary was updated successfully
 *   - `isError`: True if update failed
 *   - `error`: Error object if the request failed
 *   - `data`: MetastoreWriteResponse with update confirmation
 *
 * @example
 * Basic usage - edit dictionary form:
 * ```tsx
 * function EditDataDictionaryForm({ identifier }: { identifier: string }) {
 *   const { data: existingDict } = useDataDictionary({ identifier })
 *   const updateDict = useUpdateDataDictionary()
 *   const [dictionary, setDictionary] = useState<DataDictionary | null>(null)
 *
 *   useEffect(() => {
 *     if (existingDict) {
 *       setDictionary(existingDict)
 *     }
 *   }, [existingDict])
 *
 *   const handleSave = () => {
 *     if (dictionary) {
 *       updateDict.mutate(
 *         { identifier, dictionary },
 *         {
 *           onSuccess: () => {
 *             alert('Dictionary updated successfully!')
 *           },
 *         }
 *       )
 *     }
 *   }
 *
 *   if (!dictionary) return <div>Loading...</div>
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       handleSave()
 *     }}>
 *       {/* Editor UI *\/}
 *       <button type="submit" disabled={updateDict.isPending}>
 *         {updateDict.isPending ? 'Saving...' : 'Save Changes'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example
 * Bulk field updates - add missing descriptions:
 * ```tsx
 * function BulkFieldUpdate({ identifier }: { identifier: string }) {
 *   const { data: dict } = useDataDictionary({ identifier })
 *   const updateDict = useUpdateDataDictionary()
 *
 *   const addDescriptions = () => {
 *     if (!dict) return
 *
 *     const updated: DataDictionary = {
 *       ...dict,
 *       data: {
 *         ...dict.data,
 *         fields: dict.data.fields.map(field => ({
 *           ...field,
 *           description: field.description || `Description for ${field.title || field.name}`,
 *         })),
 *       },
 *     }
 *
 *     updateDict.mutate({ identifier, dictionary: updated })
 *   }
 *
 *   return (
 *     <button onClick={addDescriptions} disabled={!dict || updateDict.isPending}>
 *       Add Missing Descriptions
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * Add field constraints with optimistic update:
 * ```tsx
 * function AddFieldConstraints({ identifier }: { identifier: string }) {
 *   const queryClient = useQueryClient()
 *   const { data: dict } = useDataDictionary({ identifier })
 *   const updateDict = useUpdateDataDictionary()
 *
 *   const makeFieldsRequired = (fieldNames: string[]) => {
 *     if (!dict) return
 *
 *     const updated: DataDictionary = {
 *       ...dict,
 *       data: {
 *         ...dict.data,
 *         fields: dict.data.fields.map(field => ({
 *           ...field,
 *           constraints: fieldNames.includes(field.name)
 *             ? { ...field.constraints, required: true }
 *             : field.constraints,
 *         })),
 *       },
 *     }
 *
 *     // Optimistically update the UI before the server responds
 *     queryClient.setQueryData(['data-dictionary', identifier], updated)
 *
 *     updateDict.mutate(
 *       { identifier, dictionary: updated },
 *       {
 *         onError: () => {
 *           // Revert on error
 *           queryClient.invalidateQueries({ queryKey: ['data-dictionary', identifier] })
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={() => makeFieldsRequired(['id', 'name'])}>
 *         Make ID and Name Required
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDataDictionary} for fetching the current dictionary before updating
 * @see {@link useCreateDataDictionary} for creating new dictionaries
 * @see {@link useDeleteDataDictionary} for deleting dictionaries
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
 * Deletes a data dictionary from the DKAN metastore.
 *
 * This mutation permanently removes a data dictionary. The operation cannot be undone,
 * so it's important to confirm with users before deletion.
 *
 * After successful deletion, the hook automatically:
 * - Removes the dictionary from the query cache
 * - Invalidates dictionary list queries to refresh the UI
 *
 * Use this hook when you need to:
 * - Remove obsolete schema definitions
 * - Clean up unused dictionaries
 * - Implement dictionary management interfaces
 * - Support bulk deletion operations
 *
 * **Warning**: Deleting a data dictionary that is referenced by active datasets may
 * cause issues with data validation and schema information. Consider checking for
 * references before deletion.
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to trigger deletion with dictionary identifier
 *   - `mutateAsync`: Async version that returns a promise
 *   - `isPending`: True while the deletion is in progress
 *   - `isSuccess`: True if the dictionary was deleted successfully
 *   - `isError`: True if deletion failed
 *   - `error`: Error object if the request failed
 *   - `data`: Object with confirmation message
 *
 * @example
 * Basic usage - delete button with confirmation:
 * ```tsx
 * function DeleteDataDictionaryButton({ identifier }: { identifier: string }) {
 *   const deleteDict = useDeleteDataDictionary()
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete this data dictionary? This cannot be undone.')) {
 *       deleteDict.mutate(identifier, {
 *         onSuccess: (result) => {
 *           console.log(result.message)
 *         },
 *         onError: (error) => {
 *           alert('Delete failed: ' + error.message)
 *         },
 *       })
 *     }
 *   }
 *
 *   return (
 *     <button
 *       onClick={handleDelete}
 *       disabled={deleteDict.isPending}
 *       className="btn-danger"
 *     >
 *       {deleteDict.isPending ? 'Deleting...' : 'Delete Dictionary'}
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * Bulk delete with progress tracking:
 * ```tsx
 * function DataDictionaryManager({ dictionaries }: { dictionaries: DataDictionary[] }) {
 *   const deleteDict = useDeleteDataDictionary()
 *   const [selectedIds, setSelectedIds] = useState<string[]>([])
 *
 *   const handleBulkDelete = async () => {
 *     if (!confirm(`Delete ${selectedIds.length} data dictionaries?`)) return
 *
 *     for (const id of selectedIds) {
 *       try {
 *         await deleteDict.mutateAsync(id)
 *       } catch (error) {
 *         console.error('Failed to delete', id, error)
 *       }
 *     }
 *
 *     setSelectedIds([])
 *   }
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={handleBulkDelete}
 *         disabled={selectedIds.length === 0 || deleteDict.isPending}
 *       >
 *         Delete Selected ({selectedIds.length})
 *       </button>
 *
 *       <ul>
 *         {dictionaries.map(dict => (
 *           <li key={dict.identifier}>
 *             <input
 *               type="checkbox"
 *               checked={selectedIds.includes(dict.identifier)}
 *               onChange={(e) => {
 *                 if (e.target.checked) {
 *                   setSelectedIds([...selectedIds, dict.identifier])
 *                 } else {
 *                   setSelectedIds(selectedIds.filter(id => id !== dict.identifier))
 *                 }
 *               }}
 *             />
 *             {dict.data.title || dict.identifier}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Delete with confirmation modal and usage check:
 * ```tsx
 * function SafeDeleteDictionary({ identifier }: { identifier: string }) {
 *   const deleteDict = useDeleteDataDictionary()
 *   const { data: datasets } = useAllDatasets()
 *   const [showModal, setShowModal] = useState(false)
 *
 *   // Check if dictionary is being used by any datasets
 *   const referencingDatasets = datasets?.filter(dataset =>
 *     dataset.distribution.some(dist => dist.describedBy?.includes(identifier))
 *   )
 *
 *   const handleDelete = () => {
 *     deleteDict.mutate(identifier, {
 *       onSuccess: () => {
 *         setShowModal(false)
 *         toast.success('Dictionary deleted successfully')
 *       },
 *       onError: (error) => {
 *         toast.error(`Failed to delete: ${error.message}`)
 *       },
 *     })
 *   }
 *
 *   return (
 *     <>
 *       <button onClick={() => setShowModal(true)} className="btn-danger">
 *         Delete Dictionary
 *       </button>
 *
 *       {showModal && (
 *         <Modal onClose={() => setShowModal(false)}>
 *           <h3>Confirm Deletion</h3>
 *           {referencingDatasets && referencingDatasets.length > 0 ? (
 *             <div>
 *               <p className="warning">
 *                 This dictionary is used by {referencingDatasets.length} dataset(s):
 *               </p>
 *               <ul>
 *                 {referencingDatasets.map(ds => (
 *                   <li key={ds.identifier}>{ds.title}</li>
 *                 ))}
 *               </ul>
 *               <p>Are you sure you want to delete it?</p>
 *             </div>
 *           ) : (
 *             <p>This dictionary is not referenced by any datasets.</p>
 *           )}
 *
 *           <div className="modal-actions">
 *             <button onClick={() => setShowModal(false)}>Cancel</button>
 *             <button
 *               onClick={handleDelete}
 *               disabled={deleteDict.isPending}
 *               className="btn-danger"
 *             >
 *               {deleteDict.isPending ? 'Deleting...' : 'Delete'}
 *             </button>
 *           </div>
 *         </Modal>
 *       )}
 *     </>
 *   )
 * }
 * ```
 *
 * @see {@link useDataDictionary} for fetching dictionary information before deletion
 * @see {@link useCreateDataDictionary} for creating new dictionaries
 * @see {@link useUpdateDataDictionary} for updating dictionaries
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
