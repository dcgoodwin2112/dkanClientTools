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
 * Creates a new data dictionary with automatic cache invalidation.
 *
 * This mutation-based composable creates new data dictionaries (Frictionless Table Schemas)
 * in DKAN's metastore. Use it to programmatically define field structures, data types,
 * constraints, and documentation for your datasets. After successful creation, the data
 * dictionary list cache is automatically invalidated to reflect the new dictionary.
 *
 * **Data Dictionary Structure** (Frictionless Table Schema):
 * - `identifier`: Unique ID for the dictionary (string, required)
 * - `data.title`: Human-readable title
 * - `data.description`: Detailed description of the schema
 * - `data.fields`: Array of field definitions with:
 *   - `name`: Field/column name (required)
 *   - `type`: Data type (string, integer, number, date, boolean, etc.)
 *   - `title`: Human-readable field name
 *   - `description`: Field documentation
 *   - `format`: Format specification (e.g., "date-time", "email")
 *   - `constraints`: Validation rules (required, unique, min/max, enum values)
 *
 * **Cache Management**: Automatically invalidates the data dictionary list cache after
 * successful creation so `useDataDictionaryList()` queries will refetch and show the new
 * dictionary.
 *
 * Use this composable when you need to:
 * - Create schema documentation programmatically
 * - Define field structures for new datasets
 * - Build data dictionary management interfaces
 * - Generate schemas from file analysis
 * - Create reusable schema templates
 *
 * @returns TanStack Vue Query mutation object for creating data dictionaries
 *
 * @example
 * Basic dictionary creation:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCreateDataDictionary } from '@dkan-client-tools/vue'
 * import { useRouter } from 'vue-router'
 *
 * const createDict = useCreateDataDictionary()
 * const router = useRouter()
 *
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
 *         router.push(`/dictionaries/${result.identifier}`)
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
 *
 * @example
 * Advanced schema with constraints and enums:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCreateDataDictionary } from '@dkan-client-tools/vue'
 * import type { DataDictionary } from '@dkan-client-tools/core'
 *
 * const createDict = useCreateDataDictionary()
 *
 * const dictionaryData = ref<DataDictionary>({
 *   identifier: 'employee-schema',
 *   data: {
 *     title: 'Employee Data Schema',
 *     description: 'Schema for employee records',
 *     fields: [
 *       {
 *         name: 'employee_id',
 *         type: 'integer',
 *         title: 'Employee ID',
 *         description: 'Unique employee identifier',
 *         constraints: {
 *           required: true,
 *           unique: true,
 *           minimum: 1,
 *         },
 *       },
 *       {
 *         name: 'full_name',
 *         type: 'string',
 *         title: 'Full Name',
 *         constraints: {
 *           required: true,
 *           minLength: 2,
 *           maxLength: 100,
 *         },
 *       },
 *       {
 *         name: 'email',
 *         type: 'string',
 *         format: 'email',
 *         title: 'Email Address',
 *         constraints: {
 *           required: true,
 *           unique: true,
 *         },
 *       },
 *       {
 *         name: 'department',
 *         type: 'string',
 *         title: 'Department',
 *         constraints: {
 *           enum: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'],
 *         },
 *       },
 *       {
 *         name: 'hire_date',
 *         type: 'date',
 *         format: 'default',
 *         title: 'Hire Date',
 *         constraints: {
 *           required: true,
 *         },
 *       },
 *       {
 *         name: 'salary',
 *         type: 'number',
 *         title: 'Annual Salary',
 *         constraints: {
 *           minimum: 0,
 *           maximum: 1000000,
 *         },
 *       },
 *       {
 *         name: 'is_active',
 *         type: 'boolean',
 *         title: 'Active Employee',
 *         description: 'Whether the employee is currently employed',
 *       },
 *     ],
 *   },
 * })
 *
 * async function handleCreate() {
 *   try {
 *     const result = await createDict.mutateAsync(dictionaryData.value)
 *     alert(`Dictionary created with ID: ${result.identifier}`)
 *   } catch (error) {
 *     console.error('Failed to create dictionary:', error)
 *     alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="dictionary-form">
 *     <h2>Create Data Dictionary</h2>
 *     <button @click="handleCreate" :disabled="createDict.isPending">
 *       {{ createDict.isPending ? 'Creating...' : 'Create Schema' }}
 *     </button>
 *
 *     <div v-if="createDict.isError" class="error">
 *       Failed to create: {{ createDict.error?.message }}
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDataDictionary} to fetch created dictionaries
 * @see {@link useUpdateDataDictionary} to modify existing dictionaries
 * @see {@link useDataDictionaryList} to view all dictionaries
 * @see https://specs.frictionlessdata.io/table-schema/ Frictionless Table Schema specification
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
 * Updates an existing data dictionary with full replacement and automatic cache invalidation.
 *
 * This mutation-based composable performs a complete replacement of an existing data dictionary
 * in DKAN's metastore. The entire dictionary object is replaced with the new version, making it
 * ideal for significant schema updates. After successful update, both the specific dictionary
 * and the list cache are automatically invalidated.
 *
 * **Full Replacement**: Unlike patch operations, this completely replaces the dictionary. Any
 * fields not included in the update will be removed. Always fetch the current dictionary first,
 * modify it, then update to preserve existing data.
 *
 * **Cache Management**: Automatically invalidates:
 * - The specific dictionary query cache (identified by ID)
 * - The data dictionary list cache
 *
 * This ensures all queries refetch the latest data after the update.
 *
 * Use this composable when you need to:
 * - Update field definitions and constraints
 * - Modify dictionary title or description
 * - Add or remove fields from the schema
 * - Change field types or formats
 * - Update enum values or validation rules
 * - Build schema editing interfaces
 *
 * @returns TanStack Vue Query mutation object for updating data dictionaries
 *
 * @example
 * Basic dictionary update:
 * ```vue
 * <script setup lang="ts">
 * import { ref, watch } from 'vue'
 * import { useDataDictionary, useUpdateDataDictionary } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const { data: existingDict } = useDataDictionary({ identifier: props.identifier })
 * const updateDict = useUpdateDataDictionary()
 * const dictionary = ref<DataDictionary | null>(null)
 *
 * watch(existingDict, (newDict) => {
 *   if (newDict) {
 *     dictionary.value = JSON.parse(JSON.stringify(newDict)) // Deep clone
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
 *
 * @example
 * Field editor with add/remove capabilities:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDataDictionary, useUpdateDataDictionary } from '@dkan-client-tools/vue'
 * import type { TableSchemaField } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const { data: dictionary, isLoading } = useDataDictionary({
 *   identifier: props.identifier,
 * })
 * const updateDict = useUpdateDataDictionary()
 *
 * const fields = ref<TableSchemaField[]>([])
 *
 * watch(dictionary, (dict) => {
 *   if (dict?.data.fields) {
 *     fields.value = JSON.parse(JSON.stringify(dict.data.fields))
 *   }
 * })
 *
 * function addField() {
 *   fields.value.push({
 *     name: `field_${fields.value.length + 1}`,
 *     type: 'string',
 *     title: '',
 *     description: '',
 *   })
 * }
 *
 * function removeField(index: number) {
 *   fields.value.splice(index, 1)
 * }
 *
 * async function handleSave() {
 *   if (!dictionary.value) return
 *
 *   const updated = {
 *     ...dictionary.value,
 *     data: {
 *       ...dictionary.value.data,
 *       fields: fields.value,
 *     },
 *   }
 *
 *   try {
 *     await updateDict.mutateAsync({
 *       identifier: props.identifier,
 *       dictionary: updated,
 *     })
 *     alert('Schema updated successfully!')
 *   } catch (error) {
 *     alert(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div v-if="!isLoading" class="field-editor">
 *     <h2>Edit Schema Fields</h2>
 *
 *     <div v-for="(field, index) in fields" :key="index" class="field-row">
 *       <input v-model="field.name" placeholder="Field name" />
 *       <select v-model="field.type">
 *         <option value="string">String</option>
 *         <option value="integer">Integer</option>
 *         <option value="number">Number</option>
 *         <option value="date">Date</option>
 *         <option value="boolean">Boolean</option>
 *       </select>
 *       <input v-model="field.title" placeholder="Display title" />
 *       <button @click="removeField(index)" type="button">Remove</button>
 *     </div>
 *
 *     <button @click="addField" type="button">Add Field</button>
 *
 *     <div class="actions">
 *       <button @click="handleSave" :disabled="updateDict.isPending">
 *         {{ updateDict.isPending ? 'Saving...' : 'Save Schema' }}
 *       </button>
 *     </div>
 *
 *     <div v-if="updateDict.isError" class="error">
 *       Error: {{ updateDict.error?.message }}
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDataDictionary} to fetch the current dictionary before updating
 * @see {@link useCreateDataDictionary} to create new dictionaries
 * @see {@link useDeleteDataDictionary} to delete dictionaries
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
 * Deletes a data dictionary with automatic cache cleanup.
 *
 * This mutation-based composable permanently removes a data dictionary from DKAN's metastore.
 * Use with caution as this operation cannot be undone. After successful deletion, the dictionary
 * is removed from the query cache and the list cache is invalidated to reflect the change.
 *
 * **Permanent Deletion**: This operation cannot be undone. The data dictionary and all its
 * field definitions will be permanently removed from DKAN.
 *
 * **Impact on Datasets**: Deleting a data dictionary does not affect datasets or distributions
 * that reference it. However, those datasets will no longer have schema documentation until a
 * new dictionary is associated.
 *
 * **Cache Management**: Automatically:
 * - Removes the specific dictionary from the query cache
 * - Invalidates the data dictionary list cache
 *
 * This ensures all queries reflect the deletion immediately.
 *
 * Use this composable when you need to:
 * - Remove obsolete schema documentation
 * - Clean up unused data dictionaries
 * - Build dictionary management interfaces
 * - Implement dictionary lifecycle management
 * - Handle dictionary deprecation workflows
 *
 * @returns TanStack Vue Query mutation object for deleting data dictionaries
 *
 * @example
 * Basic dictionary deletion with confirmation:
 * ```vue
 * <script setup lang="ts">
 * import { useDeleteDataDictionary } from '@dkan-client-tools/vue'
 * import { useRouter } from 'vue-router'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const deleteDict = useDeleteDataDictionary()
 * const router = useRouter()
 *
 * function handleDelete() {
 *   if (confirm('Delete this data dictionary? This cannot be undone.')) {
 *     deleteDict.mutate(props.identifier, {
 *       onSuccess: (result) => {
 *         console.log(result.message)
 *         router.push('/dictionaries')
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
 *
 * @example
 * Confirmation modal with usage warnings:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDataDictionary, useDeleteDataDictionary } from '@dkan-client-tools/vue'
 * import { useRouter } from 'vue-router'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const { data: dictionary } = useDataDictionary({ identifier: props.identifier })
 * const deleteDict = useDeleteDataDictionary()
 * const router = useRouter()
 *
 * const showDeleteModal = ref(false)
 * const confirmText = ref('')
 *
 * async function handleConfirmDelete() {
 *   if (confirmText.value !== dictionary.value?.data.title) {
 *     alert('Please type the dictionary title to confirm deletion')
 *     return
 *   }
 *
 *   try {
 *     await deleteDict.mutateAsync(props.identifier)
 *     showDeleteModal.value = false
 *     router.push('/dictionaries')
 *   } catch (error) {
 *     console.error('Delete failed:', error)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button @click="showDeleteModal = true" class="btn-danger">
 *       Delete Dictionary
 *     </button>
 *
 *     <div v-if="showDeleteModal" class="modal-overlay">
 *       <div class="modal">
 *         <h3>Delete Data Dictionary</h3>
 *         <div class="warning-box">
 *           <p><strong>⚠️ Warning:</strong> This action cannot be undone.</p>
 *           <p>
 *             Deleting "<strong>{{ dictionary?.data.title }}</strong>" will permanently
 *             remove this schema documentation. Datasets referencing this dictionary
 *             will lose their field documentation.
 *           </p>
 *         </div>
 *
 *         <div class="form-field">
 *           <label>
 *             Type <code>{{ dictionary?.data.title }}</code> to confirm:
 *           </label>
 *           <input
 *             v-model="confirmText"
 *             type="text"
 *             placeholder="Type dictionary title"
 *           />
 *         </div>
 *
 *         <div class="modal-actions">
 *           <button @click="showDeleteModal = false">Cancel</button>
 *           <button
 *             @click="handleConfirmDelete"
 *             :disabled="deleteDict.isPending || confirmText !== dictionary?.data.title"
 *             class="btn-danger"
 *           >
 *             {{ deleteDict.isPending ? 'Deleting...' : 'Delete Permanently' }}
 *           </button>
 *         </div>
 *
 *         <div v-if="deleteDict.isError" class="error">
 *           Error: {{ deleteDict.error?.message }}
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Bulk dictionary deletion with progress tracking:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDeleteDataDictionary } from '@dkan-client-tools/vue'
 *
 * interface DeletionJob {
 *   identifier: string
 *   title: string
 *   status: 'pending' | 'deleting' | 'success' | 'error'
 *   error?: string
 * }
 *
 * const props = defineProps<{
 *   selectedDictionaries: Array<{ identifier: string; title: string }>
 * }>()
 *
 * const deleteDict = useDeleteDataDictionary()
 * const deletionJobs = ref<DeletionJob[]>([])
 * const isDeleting = ref(false)
 *
 * function initiateBulkDelete() {
 *   if (!confirm(`Delete ${props.selectedDictionaries.length} dictionaries? This cannot be undone.`)) {
 *     return
 *   }
 *
 *   deletionJobs.value = props.selectedDictionaries.map((dict) => ({
 *     identifier: dict.identifier,
 *     title: dict.title,
 *     status: 'pending' as const,
 *   }))
 *
 *   executeBulkDelete()
 * }
 *
 * async function executeBulkDelete() {
 *   isDeleting.value = true
 *
 *   for (const job of deletionJobs.value) {
 *     job.status = 'deleting'
 *
 *     try {
 *       await deleteDict.mutateAsync(job.identifier)
 *       job.status = 'success'
 *       await new Promise((resolve) => setTimeout(resolve, 500))
 *     } catch (error) {
 *       job.status = 'error'
 *       job.error = error instanceof Error ? error.message : 'Unknown error'
 *     }
 *   }
 *
 *   isDeleting.value = false
 * }
 * </script>
 *
 * <template>
 *   <div class="bulk-delete">
 *     <button
 *       @click="initiateBulkDelete"
 *       :disabled="isDeleting || selectedDictionaries.length === 0"
 *       class="btn-danger"
 *     >
 *       Delete {{ selectedDictionaries.length }} Dictionaries
 *     </button>
 *
 *     <div v-if="deletionJobs.length > 0" class="deletion-progress">
 *       <h4>Deletion Progress</h4>
 *       <ul>
 *         <li v-for="job in deletionJobs" :key="job.identifier" :class="job.status">
 *           <span class="job-title">{{ job.title }}</span>
 *           <span class="job-status">
 *             <template v-if="job.status === 'pending'">Pending</template>
 *             <template v-else-if="job.status === 'deleting'">Deleting...</template>
 *             <template v-else-if="job.status === 'success'">✓ Deleted</template>
 *             <template v-else-if="job.status === 'error'">
 *               ✗ Error: {{ job.error }}
 *             </template>
 *           </span>
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDataDictionary} to fetch dictionary details before deletion
 * @see {@link useDataDictionaryList} to see the updated list after deletion
 * @see {@link useCreateDataDictionary} to create replacement dictionaries
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
