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
 * Mutation hook to create a new data dictionary
 *
 * @example
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
 *       {/ * Field editor UI * /}
 *       <button type="submit" disabled={createDict.isPending}>
 *         {createDict.isPending ? 'Creating...' : 'Create Dictionary'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example
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
 * Mutation hook to update an existing data dictionary (full replacement)
 *
 * @example
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
 *       {/ * Editor UI * /}
 *       <button type="submit" disabled={updateDict.isPending}>
 *         {updateDict.isPending ? 'Saving...' : 'Save Changes'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example
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
 * Mutation hook to delete a data dictionary
 *
 * @example
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
