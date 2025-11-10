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
 * Creates a new dataset in the DKAN catalog with complete DCAT-US metadata.
 *
 * This composable provides a mutation function to create new datasets in your DKAN catalog. When you
 * create a dataset, it's stored in DKAN's metastore with a unique identifier and becomes searchable
 * through the catalog. The composable automatically invalidates related queries (search results,
 * dataset lists, facets) to keep the UI in sync.
 *
 * **What happens when you create a dataset:**
 * 1. DKAN validates the dataset against the DCAT-US schema
 * 2. A unique identifier is generated (or you can provide one)
 * 3. The dataset is stored in the metastore
 * 4. Related query caches are invalidated for UI consistency
 * 5. The dataset becomes immediately searchable
 *
 * **Required Fields**: At minimum, a dataset must have a `title` and `description`. Other DCAT-US
 * fields like `publisher`, `contactPoint`, `keyword`, and `theme` are recommended for discoverability.
 *
 * Use this composable when you need to:
 * - Build dataset creation forms and wizards
 * - Implement data publishing workflows
 * - Create datasets programmatically from external sources
 * - Build admin interfaces for catalog management
 * - Implement bulk dataset import tools
 *
 * @returns TanStack Vue Query mutation object with:
 *   - `mutate(dataset)`: Execute the mutation with callbacks
 *   - `mutateAsync(dataset)`: Execute and return a promise
 *   - `isPending`: Ref that's true while creation is in progress
 *   - `isError`: Ref that's true if creation failed
 *   - `isSuccess`: Ref that's true if creation succeeded
 *   - `error`: Ref containing the error object if failed
 *   - `data`: Ref containing the response with the new dataset's identifier
 *   - `reset()`: Reset the mutation state
 *
 * @example
 * Basic dataset creation form:
 * ```vue
 * <script setup lang="ts">
 * import { useCreateDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 * import type { DkanDataset } from '@dkan-client-tools/core'
 *
 * const createDataset = useCreateDataset()
 * const title = ref('')
 * const description = ref('')
 *
 * async function handleCreate() {
 *   const newDataset: DkanDataset = {
 *     title: title.value,
 *     description: description.value,
 *     contactPoint: {
 *       fn: 'Data Team',
 *       hasEmail: 'mailto:data@example.gov',
 *     },
 *     accessLevel: 'public',
 *   }
 *
 *   try {
 *     const result = await createDataset.mutateAsync(newDataset)
 *     console.log('Dataset created with ID:', result.identifier)
 *   } catch (error) {
 *     console.error('Failed to create dataset:', error)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="handleCreate">
 *     <div>
 *       <label>Title</label>
 *       <input v-model="title" required />
 *     </div>
 *     <div>
 *       <label>Description</label>
 *       <textarea v-model="description" required />
 *     </div>
 *     <button type="submit" :disabled="createDataset.isPending">
 *       {{ createDataset.isPending ? 'Creating...' : 'Create Dataset' }}
 *     </button>
 *     <p v-if="createDataset.isError" class="error">
 *       Error: {{ createDataset.error?.message }}
 *     </p>
 *     <p v-if="createDataset.isSuccess" class="success">
 *       Dataset created successfully!
 *     </p>
 *   </form>
 * </template>
 * ```
 *
 * @example
 * Multi-step dataset creation wizard:
 * ```vue
 * <script setup lang="ts">
 * import { useCreateDataset } from '@dkan-client-tools/vue'
 * import { ref, computed } from 'vue'
 * import { useRouter } from 'vue-router'
 * import type { DkanDataset } from '@dkan-client-tools/core'
 *
 * const createDataset = useCreateDataset()
 * const router = useRouter()
 *
 * const currentStep = ref(1)
 * const formData = ref<Partial<DkanDataset>>({
 *   accessLevel: 'public',
 *   keyword: [],
 *   theme: [],
 * })
 *
 * const canProceed = computed(() => {
 *   if (currentStep.value === 1) {
 *     return formData.value.title && formData.value.description
 *   }
 *   if (currentStep.value === 2) {
 *     return formData.value.publisher && formData.value.contactPoint
 *   }
 *   return true
 * })
 *
 * function nextStep() {
 *   if (canProceed.value) currentStep.value++
 * }
 *
 * function prevStep() {
 *   currentStep.value--
 * }
 *
 * async function handleSubmit() {
 *   try {
 *     const result = await createDataset.mutateAsync(formData.value as DkanDataset)
 *     // Navigate to the new dataset's page
 *     router.push(`/datasets/${result.identifier}`)
 *   } catch (error) {
 *     console.error('Failed to create dataset:', error)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="wizard">
 *     <div class="wizard-header">
 *       <h2>Create New Dataset - Step {{ currentStep }} of 3</h2>
 *     </div>
 *
 *     <!-- Step 1: Basic Information -->
 *     <div v-if="currentStep === 1" class="wizard-step">
 *       <h3>Basic Information</h3>
 *       <div class="form-field">
 *         <label>Title *</label>
 *         <input v-model="formData.title" required />
 *       </div>
 *       <div class="form-field">
 *         <label>Description *</label>
 *         <textarea v-model="formData.description" rows="4" required />
 *       </div>
 *       <div class="form-field">
 *         <label>Keywords</label>
 *         <input
 *           v-model="formData.keyword"
 *           placeholder="Comma-separated keywords"
 *         />
 *       </div>
 *     </div>
 *
 *     <!-- Step 2: Publisher & Contact -->
 *     <div v-if="currentStep === 2" class="wizard-step">
 *       <h3>Publisher & Contact Information</h3>
 *       <div class="form-field">
 *         <label>Publisher Name *</label>
 *         <input v-model="formData.publisher.name" required />
 *       </div>
 *       <div class="form-field">
 *         <label>Contact Name *</label>
 *         <input v-model="formData.contactPoint.fn" required />
 *       </div>
 *       <div class="form-field">
 *         <label>Contact Email *</label>
 *         <input
 *           v-model="formData.contactPoint.hasEmail"
 *           type="email"
 *           required
 *         />
 *       </div>
 *     </div>
 *
 *     <!-- Step 3: Review & Submit -->
 *     <div v-if="currentStep === 3" class="wizard-step">
 *       <h3>Review & Submit</h3>
 *       <dl class="review-data">
 *         <dt>Title:</dt>
 *         <dd>{{ formData.title }}</dd>
 *         <dt>Description:</dt>
 *         <dd>{{ formData.description }}</dd>
 *         <dt>Publisher:</dt>
 *         <dd>{{ formData.publisher?.name }}</dd>
 *         <dt>Contact:</dt>
 *         <dd>{{ formData.contactPoint?.fn }}</dd>
 *       </dl>
 *     </div>
 *
 *     <!-- Navigation -->
 *     <div class="wizard-actions">
 *       <button
 *         v-if="currentStep > 1"
 *         @click="prevStep"
 *         :disabled="createDataset.isPending"
 *       >
 *         Previous
 *       </button>
 *       <button
 *         v-if="currentStep < 3"
 *         @click="nextStep"
 *         :disabled="!canProceed"
 *       >
 *         Next
 *       </button>
 *       <button
 *         v-if="currentStep === 3"
 *         @click="handleSubmit"
 *         :disabled="createDataset.isPending"
 *         class="btn-primary"
 *       >
 *         {{ createDataset.isPending ? 'Creating...' : 'Create Dataset' }}
 *       </button>
 *     </div>
 *
 *     <p v-if="createDataset.isError" class="error">
 *       {{ createDataset.error?.message }}
 *     </p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Creating dataset with success notification and redirect:
 * ```vue
 * <script setup lang="ts">
 * import { useCreateDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 * import { useRouter } from 'vue-router'
 *
 * const createDataset = useCreateDataset()
 * const router = useRouter()
 * const showSuccess = ref(false)
 *
 * const newDataset = ref<DkanDataset>({
 *   title: '',
 *   description: '',
 *   accessLevel: 'public',
 *   contactPoint: {
 *     fn: 'Data Curator',
 *     hasEmail: 'mailto:curator@example.gov',
 *   },
 * })
 *
 * function handleCreate() {
 *   createDataset.mutate(newDataset.value, {
 *     onSuccess: (data) => {
 *       showSuccess.value = true
 *       // Redirect after 2 seconds
 *       setTimeout(() => {
 *         router.push(`/datasets/${data.identifier}`)
 *       }, 2000)
 *     },
 *     onError: (error) => {
 *       console.error('Failed to create dataset:', error)
 *     },
 *   })
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <transition name="fade">
 *       <div v-if="showSuccess" class="success-notification">
 *         Dataset created successfully! Redirecting...
 *       </div>
 *     </transition>
 *
 *     <form @submit.prevent="handleCreate">
 *       <input v-model="newDataset.title" placeholder="Dataset title" />
 *       <textarea
 *         v-model="newDataset.description"
 *         placeholder="Dataset description"
 *       />
 *       <button type="submit" :disabled="createDataset.isPending">
 *         {{ createDataset.isPending ? 'Creating...' : 'Create Dataset' }}
 *       </button>
 *     </form>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useUpdateDataset} to update an existing dataset
 * @see {@link usePatchDataset} to partially update a dataset
 * @see {@link useDataset} to fetch dataset details
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
 * Updates an existing dataset with complete replacement of all metadata fields.
 *
 * This composable performs a full PUT operation, completely replacing the dataset's metadata with
 * the provided data. Unlike {@link usePatchDataset} which only updates specified fields, this
 * mutation replaces the entire dataset, so you must provide all required fields even if they
 * haven't changed.
 *
 * **Important**: This is a full replacement operation. Any fields not included in the update will
 * be removed from the dataset. If you only want to update specific fields while preserving others,
 * use {@link usePatchDataset} instead.
 *
 * **What happens when you update a dataset:**
 * 1. DKAN validates the new data against the DCAT-US schema
 * 2. The entire dataset metadata is replaced
 * 3. The `modified` timestamp is automatically updated
 * 4. Related query caches are invalidated
 * 5. The updated dataset appears in search results immediately
 *
 * Use this composable when you need to:
 * - Build dataset editing forms that modify all fields
 * - Implement complete dataset replacements
 * - Update datasets with a full metadata refresh
 * - Rebuild dataset metadata from external sources
 * - Ensure all fields are explicitly set
 *
 * @returns TanStack Vue Query mutation object with:
 *   - `mutate({ identifier, dataset })`: Execute with callbacks
 *   - `mutateAsync({ identifier, dataset })`: Execute and return promise
 *   - `isPending`: Ref that's true while update is in progress
 *   - `isError`: Ref that's true if update failed
 *   - `isSuccess`: Ref that's true if update succeeded
 *   - `error`: Ref containing error object if failed
 *   - `data`: Ref containing the response with update confirmation
 *   - `reset()`: Reset the mutation state
 *
 * @example
 * Basic dataset update form:
 * ```vue
 * <script setup lang="ts">
 * import { useUpdateDataset, useDataset } from '@dkan-client-tools/vue'
 * import { ref, watch } from 'vue'
 * import type { DkanDataset } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{ identifier: string }>()
 * const { data: currentDataset, isLoading } = useDataset({
 *   identifier: props.identifier,
 * })
 * const updateDataset = useUpdateDataset()
 *
 * const formData = ref<DkanDataset | null>(null)
 *
 * // Initialize form with current dataset data
 * watch(currentDataset, (dataset) => {
 *   if (dataset) {
 *     formData.value = { ...dataset }
 *   }
 * }, { immediate: true })
 *
 * async function handleSave() {
 *   if (!formData.value) return
 *
 *   try {
 *     await updateDataset.mutateAsync({
 *       identifier: props.identifier,
 *       dataset: formData.value,
 *     })
 *     alert('Dataset updated successfully!')
 *   } catch (error) {
 *     console.error('Failed to update dataset:', error)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading dataset...</div>
 *   <form v-else-if="formData" @submit.prevent="handleSave">
 *     <div>
 *       <label>Title</label>
 *       <input v-model="formData.title" required />
 *     </div>
 *     <div>
 *       <label>Description</label>
 *       <textarea v-model="formData.description" required />
 *     </div>
 *     <button type="submit" :disabled="updateDataset.isPending">
 *       {{ updateDataset.isPending ? 'Saving...' : 'Save Changes' }}
 *     </button>
 *     <p v-if="updateDataset.isError" class="error">
 *       Error: {{ updateDataset.error?.message }}
 *     </p>
 *   </form>
 * </template>
 * ```
 *
 * @example
 * Update with optimistic UI and rollback on error:
 * ```vue
 * <script setup lang="ts">
 * import { useUpdateDataset, useDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 * import { useQueryClient } from '@tanstack/vue-query'
 *
 * const props = defineProps<{ identifier: string }>()
 * const queryClient = useQueryClient()
 * const { data: dataset } = useDataset({ identifier: props.identifier })
 * const updateDataset = useUpdateDataset()
 *
 * function handleUpdate(updatedDataset: DkanDataset) {
 *   // Store previous data for rollback
 *   const previousDataset = dataset.value
 *
 *   updateDataset.mutate(
 *     {
 *       identifier: props.identifier,
 *       dataset: updatedDataset,
 *     },
 *     {
 *       // Optimistically update the UI
 *       onMutate: async () => {
 *         // Cancel outgoing refetches
 *         await queryClient.cancelQueries({
 *           queryKey: ['datasets', 'single', props.identifier],
 *         })
 *
 *         // Optimistically update cache
 *         queryClient.setQueryData(
 *           ['datasets', 'single', props.identifier],
 *           updatedDataset
 *         )
 *
 *         return { previousDataset }
 *       },
 *       // Rollback on error
 *       onError: (_err, _variables, context) => {
 *         queryClient.setQueryData(
 *           ['datasets', 'single', props.identifier],
 *           context?.previousDataset
 *         )
 *       },
 *       // Always refetch after error or success
 *       onSettled: () => {
 *         queryClient.invalidateQueries({
 *           queryKey: ['datasets', 'single', props.identifier],
 *         })
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div v-if="dataset">
 *     <h2>{{ dataset.title }}</h2>
 *     <p>{{ dataset.description }}</p>
 *     <!-- Edit form here -->
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Update dataset with validation and confirmation:
 * ```vue
 * <script setup lang="ts">
 * import { useUpdateDataset, useDataset } from '@dkan-client-tools/vue'
 * import { ref, computed } from 'vue'
 *
 * const props = defineProps<{ identifier: string }>()
 * const { data: currentDataset } = useDataset({ identifier: props.identifier })
 * const updateDataset = useUpdateDataset()
 *
 * const editedDataset = ref<DkanDataset | null>(null)
 * const hasChanges = computed(() => {
 *   if (!editedDataset.value || !currentDataset.value) return false
 *   return JSON.stringify(editedDataset.value) !== JSON.stringify(currentDataset.value)
 * })
 *
 * function validateDataset(dataset: DkanDataset): string[] {
 *   const errors: string[] = []
 *   if (!dataset.title?.trim()) errors.push('Title is required')
 *   if (!dataset.description?.trim()) errors.push('Description is required')
 *   if (!dataset.contactPoint?.hasEmail) errors.push('Contact email is required')
 *   return errors
 * }
 *
 * async function handleSave() {
 *   if (!editedDataset.value) return
 *
 *   const errors = validateDataset(editedDataset.value)
 *   if (errors.length > 0) {
 *     alert('Please fix the following errors:\\n' + errors.join('\\n'))
 *     return
 *   }
 *
 *   if (!confirm('Are you sure you want to save these changes?')) {
 *     return
 *   }
 *
 *   try {
 *     await updateDataset.mutateAsync({
 *       identifier: props.identifier,
 *       dataset: editedDataset.value,
 *     })
 *     alert('Dataset updated successfully!')
 *   } catch (error) {
 *     alert('Failed to update dataset. Please try again.')
 *   }
 * }
 * </script>
 *
 * <template>
 *   <form v-if="editedDataset" @submit.prevent="handleSave">
 *     <input v-model="editedDataset.title" />
 *     <textarea v-model="editedDataset.description" />
 *
 *     <div class="actions">
 *       <button
 *         type="submit"
 *         :disabled="!hasChanges || updateDataset.isPending"
 *       >
 *         {{ updateDataset.isPending ? 'Saving...' : 'Save Changes' }}
 *       </button>
 *       <button
 *         type="button"
 *         @click="editedDataset = { ...currentDataset! }"
 *         :disabled="!hasChanges"
 *       >
 *         Reset
 *       </button>
 *     </div>
 *   </form>
 * </template>
 * ```
 *
 * @see {@link usePatchDataset} to partially update specific fields only
 * @see {@link useCreateDataset} to create a new dataset
 * @see {@link useDataset} to fetch current dataset data
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
 * Partially updates a dataset by modifying only the specified fields while preserving all others.
 *
 * This composable performs a PATCH operation, updating only the fields you provide while leaving
 * all other fields unchanged. This is more efficient and safer than {@link useUpdateDataset} when
 * you only need to modify specific fields (like title, description, or keywords) without touching
 * the rest of the dataset metadata.
 *
 * **Advantages over full updates:**
 * - Only send the fields you're changing
 * - No risk of accidentally removing fields
 * - More efficient for single-field updates
 * - Preserves fields you haven't loaded or don't know about
 * - Better for collaborative editing scenarios
 *
 * **Common use cases:**
 * - Quick edits to title or description
 * - Adding/removing keywords or themes
 * - Updating contact information
 * - Modifying access level or publication status
 * - Bulk updates to specific fields across multiple datasets
 *
 * Use this composable when you need to:
 * - Update specific fields without loading the entire dataset
 * - Build quick-edit interfaces for individual properties
 * - Implement inline editing functionality
 * - Update single fields in bulk operations
 * - Make targeted changes without full form validation
 *
 * @returns TanStack Vue Query mutation object with:
 *   - `mutate({ identifier, partialDataset })`: Execute with callbacks
 *   - `mutateAsync({ identifier, partialDataset })`: Execute and return promise
 *   - `isPending`: Ref that's true while update is in progress
 *   - `isError`: Ref that's true if update failed
 *   - `isSuccess`: Ref that's true if update succeeded
 *   - `error`: Ref containing error object if failed
 *   - `data`: Ref containing the response with update confirmation
 *   - `reset()`: Reset the mutation state
 *
 * @example
 * Quick title/description editor:
 * ```vue
 * <script setup lang="ts">
 * import { usePatchDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 *
 * const props = defineProps<{ identifier: string }>()
 * const patchDataset = usePatchDataset()
 * const newTitle = ref('')
 *
 * function handleUpdateTitle() {
 *   if (!newTitle.value.trim()) return
 *
 *   patchDataset.mutate(
 *     {
 *       identifier: props.identifier,
 *       partialDataset: { title: newTitle.value },
 *     },
 *     {
 *       onSuccess: () => {
 *         newTitle.value = ''
 *         alert('Title updated!')
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div class="quick-edit">
 *     <input
 *       v-model="newTitle"
 *       placeholder="New title"
 *       @keyup.enter="handleUpdateTitle"
 *     />
 *     <button
 *       @click="handleUpdateTitle"
 *       :disabled="!newTitle.trim() || patchDataset.isPending"
 *     >
 *       {{ patchDataset.isPending ? 'Updating...' : 'Update Title' }}
 *     </button>
 *     <p v-if="patchDataset.isError" class="error">
 *       {{ patchDataset.error?.message }}
 *     </p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Inline editing for multiple fields:
 * ```vue
 * <script setup lang="ts">
 * import { usePatchDataset, useDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 *
 * const props = defineProps<{ identifier: string }>()
 * const { data: dataset } = useDataset({ identifier: props.identifier })
 * const patchDataset = usePatchDataset()
 *
 * const editingField = ref<string | null>(null)
 * const editValue = ref('')
 *
 * function startEdit(field: string, currentValue: string) {
 *   editingField.value = field
 *   editValue.value = currentValue
 * }
 *
 * function saveEdit() {
 *   if (!editingField.value) return
 *
 *   patchDataset.mutate(
 *     {
 *       identifier: props.identifier,
 *       partialDataset: { [editingField.value]: editValue.value },
 *     },
 *     {
 *       onSuccess: () => {
 *         editingField.value = null
 *         editValue.value = ''
 *       },
 *     }
 *   )
 * }
 *
 * function cancelEdit() {
 *   editingField.value = null
 *   editValue.value = ''
 * }
 * </script>
 *
 * <template>
 *   <div v-if="dataset" class="inline-edit-table">
 *     <div class="field-row">
 *       <label>Title:</label>
 *       <span v-if="editingField !== 'title'" @click="startEdit('title', dataset.title)">
 *         {{ dataset.title }}
 *         <button class="edit-btn">Edit</button>
 *       </span>
 *       <div v-else class="editing">
 *         <input v-model="editValue" @keyup.enter="saveEdit" />
 *         <button @click="saveEdit" :disabled="patchDataset.isPending">Save</button>
 *         <button @click="cancelEdit">Cancel</button>
 *       </div>
 *     </div>
 *
 *     <div class="field-row">
 *       <label>Description:</label>
 *       <span
 *         v-if="editingField !== 'description'"
 *         @click="startEdit('description', dataset.description)"
 *       >
 *         {{ dataset.description }}
 *         <button class="edit-btn">Edit</button>
 *       </span>
 *       <div v-else class="editing">
 *         <textarea v-model="editValue" @keyup.ctrl.enter="saveEdit" />
 *         <button @click="saveEdit" :disabled="patchDataset.isPending">Save</button>
 *         <button @click="cancelEdit">Cancel</button>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Keyword/tag management:
 * ```vue
 * <script setup lang="ts">
 * import { usePatchDataset, useDataset } from '@dkan-client-tools/vue'
 * import { ref, computed } from 'vue'
 *
 * const props = defineProps<{ identifier: string }>()
 * const { data: dataset } = useDataset({ identifier: props.identifier })
 * const patchDataset = usePatchDataset()
 *
 * const newKeyword = ref('')
 * const keywords = computed(() => dataset.value?.keyword || [])
 *
 * function addKeyword() {
 *   if (!newKeyword.value.trim()) return
 *
 *   const updatedKeywords = [...keywords.value, newKeyword.value.trim()]
 *
 *   patchDataset.mutate(
 *     {
 *       identifier: props.identifier,
 *       partialDataset: { keyword: updatedKeywords },
 *     },
 *     {
 *       onSuccess: () => {
 *         newKeyword.value = ''
 *       },
 *     }
 *   )
 * }
 *
 * function removeKeyword(keyword: string) {
 *   const updatedKeywords = keywords.value.filter(k => k !== keyword)
 *
 *   patchDataset.mutate({
 *     identifier: props.identifier,
 *     partialDataset: { keyword: updatedKeywords },
 *   })
 * }
 * </script>
 *
 * <template>
 *   <div class="keyword-manager">
 *     <h3>Keywords</h3>
 *     <div class="keyword-list">
 *       <span
 *         v-for="keyword in keywords"
 *         :key="keyword"
 *         class="keyword-tag"
 *       >
 *         {{ keyword }}
 *         <button
 *           @click="removeKeyword(keyword)"
 *           :disabled="patchDataset.isPending"
 *           class="remove-btn"
 *         >
 *           ×
 *         </button>
 *       </span>
 *     </div>
 *
 *     <div class="add-keyword">
 *       <input
 *         v-model="newKeyword"
 *         placeholder="Add keyword..."
 *         @keyup.enter="addKeyword"
 *       />
 *       <button
 *         @click="addKeyword"
 *         :disabled="!newKeyword.trim() || patchDataset.isPending"
 *       >
 *         Add
 *       </button>
 *     </div>
 *
 *     <p v-if="patchDataset.isError" class="error">
 *       Error updating keywords: {{ patchDataset.error?.message }}
 *     </p>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useUpdateDataset} for full dataset replacement
 * @see {@link useCreateDataset} to create a new dataset
 * @see {@link useDataset} to fetch current dataset data
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
 * Deletes a dataset permanently from the DKAN catalog.
 *
 * This composable permanently removes a dataset from DKAN's metastore. Once deleted, the dataset
 * and all its metadata are removed from the catalog and cannot be recovered. The dataset will
 * immediately disappear from search results and all related queries will be invalidated.
 *
 * **Important**: This is a destructive operation that cannot be undone. Always confirm with the
 * user before deleting datasets. Consider using {@link useChangeDatasetState} to archive datasets
 * instead of permanent deletion if you need to preserve the data.
 *
 * **What happens when you delete a dataset:**
 * 1. The dataset is permanently removed from the metastore
 * 2. All associated revisions are deleted
 * 3. Related distribution files may become orphaned (not automatically deleted)
 * 4. The dataset immediately disappears from search results
 * 5. All query caches are invalidated
 * 6. The operation cannot be reversed
 *
 * **Security**: Deletion typically requires appropriate permissions. Ensure users have the
 * necessary access rights before attempting deletion operations.
 *
 * Use this composable when you need to:
 * - Build dataset management interfaces with delete functionality
 * - Implement bulk deletion tools
 * - Remove test or duplicate datasets
 * - Clean up invalid or corrupted datasets
 * - Build admin interfaces for catalog curation
 *
 * @returns TanStack Vue Query mutation object with:
 *   - `mutate(identifier)`: Execute deletion with callbacks
 *   - `mutateAsync(identifier)`: Execute and return a promise
 *   - `isPending`: Ref that's true while deletion is in progress
 *   - `isError`: Ref that's true if deletion failed
 *   - `isSuccess`: Ref that's true if deletion succeeded
 *   - `error`: Ref containing error object if failed
 *   - `data`: Ref containing confirmation message
 *   - `reset()`: Reset the mutation state
 *
 * @example
 * Basic delete button with confirmation:
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
 *   if (confirm('Are you sure you want to permanently delete this dataset? This action cannot be undone.')) {
 *     deleteDataset.mutate(props.identifier, {
 *       onSuccess: () => {
 *         router.push('/datasets')
 *       },
 *       onError: (error) => {
 *         alert(`Failed to delete dataset: ${error.message}`)
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
 *
 * @example
 * Delete with custom confirmation modal:
 * ```vue
 * <script setup lang="ts">
 * import { useDeleteDataset, useDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 * import { useRouter } from 'vue-router'
 *
 * const props = defineProps<{ identifier: string }>()
 * const { data: dataset } = useDataset({ identifier: props.identifier })
 * const deleteDataset = useDeleteDataset()
 * const router = useRouter()
 *
 * const showConfirmModal = ref(false)
 * const confirmationText = ref('')
 *
 * function openDeleteModal() {
 *   showConfirmModal.value = true
 *   confirmationText.value = ''
 * }
 *
 * function confirmDelete() {
 *   if (confirmationText.value !== dataset.value?.title) {
 *     alert('The dataset title does not match. Please try again.')
 *     return
 *   }
 *
 *   deleteDataset.mutate(props.identifier, {
 *     onSuccess: () => {
 *       showConfirmModal.value = false
 *       router.push({
 *         path: '/datasets',
 *         query: { message: 'Dataset deleted successfully' },
 *       })
 *     },
 *   })
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button @click="openDeleteModal" class="btn-danger">
 *       Delete Dataset
 *     </button>
 *
 *     <!-- Confirmation Modal -->
 *     <div v-if="showConfirmModal" class="modal-overlay">
 *       <div class="modal">
 *         <h2>Delete Dataset</h2>
 *         <p class="warning">
 *           This action cannot be undone. This will permanently delete the dataset
 *           <strong>{{ dataset?.title }}</strong>.
 *         </p>
 *
 *         <div class="confirmation-input">
 *           <label>
 *             Please type the dataset title to confirm:
 *             <strong>{{ dataset?.title }}</strong>
 *           </label>
 *           <input
 *             v-model="confirmationText"
 *             type="text"
 *             placeholder="Enter dataset title"
 *           />
 *         </div>
 *
 *         <div class="modal-actions">
 *           <button
 *             @click="confirmDelete"
 *             :disabled="confirmationText !== dataset?.title || deleteDataset.isPending"
 *             class="btn-danger"
 *           >
 *             {{ deleteDataset.isPending ? 'Deleting...' : 'Delete Permanently' }}
 *           </button>
 *           <button
 *             @click="showConfirmModal = false"
 *             :disabled="deleteDataset.isPending"
 *           >
 *             Cancel
 *           </button>
 *         </div>
 *
 *         <p v-if="deleteDataset.isError" class="error">
 *           Error: {{ deleteDataset.error?.message }}
 *         </p>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Bulk delete with progress tracking:
 * ```vue
 * <script setup lang="ts">
 * import { useDeleteDataset } from '@dkan-client-tools/vue'
 * import { ref, computed } from 'vue'
 *
 * const deleteDataset = useDeleteDataset()
 * const selectedDatasets = ref<string[]>([])
 * const deletingDatasets = ref<Set<string>>(new Set())
 * const deletedCount = ref(0)
 * const failedDeletes = ref<Array<{ id: string; error: string }>>([])
 *
 * const isDeleting = computed(() => deletingDatasets.value.size > 0)
 *
 * async function handleBulkDelete() {
 *   if (!confirm(`Are you sure you want to delete ${selectedDatasets.value.length} datasets?`)) {
 *     return
 *   }
 *
 *   deletedCount.value = 0
 *   failedDeletes.value = []
 *
 *   for (const identifier of selectedDatasets.value) {
 *     deletingDatasets.value.add(identifier)
 *
 *     try {
 *       await deleteDataset.mutateAsync(identifier)
 *       deletedCount.value++
 *     } catch (error) {
 *       failedDeletes.value.push({
 *         id: identifier,
 *         error: error instanceof Error ? error.message : 'Unknown error',
 *       })
 *     } finally {
 *       deletingDatasets.value.delete(identifier)
 *     }
 *   }
 *
 *   selectedDatasets.value = []
 * }
 * </script>
 *
 * <template>
 *   <div class="bulk-delete">
 *     <button
 *       @click="handleBulkDelete"
 *       :disabled="selectedDatasets.length === 0 || isDeleting"
 *       class="btn-danger"
 *     >
 *       Delete Selected ({{ selectedDatasets.length }})
 *     </button>
 *
 *     <div v-if="isDeleting" class="progress">
 *       <p>
 *         Deleting datasets: {{ deletedCount }} of {{ selectedDatasets.length }} completed
 *       </p>
 *       <div class="progress-bar">
 *         <div
 *           class="progress-fill"
 *           :style="{
 *             width: `${(deletedCount / selectedDatasets.length) * 100}%`
 *           }"
 *         />
 *       </div>
 *     </div>
 *
 *     <div v-if="failedDeletes.length > 0" class="error-list">
 *       <h4>Failed to delete {{ failedDeletes.length }} datasets:</h4>
 *       <ul>
 *         <li v-for="failed in failedDeletes" :key="failed.id">
 *           {{ failed.id }}: {{ failed.error }}
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Delete with undo grace period:
 * ```vue
 * <script setup lang="ts">
 * import { useDeleteDataset } from '@dkan-client-tools/vue'
 * import { ref } from 'vue'
 *
 * const props = defineProps<{ identifier: string }>()
 * const deleteDataset = useDeleteDataset()
 *
 * const pendingDelete = ref(false)
 * const undoTimeout = ref<number | null>(null)
 *
 * function scheduleDelete() {
 *   pendingDelete.value = true
 *
 *   // 5 second grace period to undo
 *   undoTimeout.value = window.setTimeout(() => {
 *     executeDelete()
 *   }, 5000)
 * }
 *
 * function cancelDelete() {
 *   if (undoTimeout.value) {
 *     clearTimeout(undoTimeout.value)
 *     undoTimeout.value = null
 *   }
 *   pendingDelete.value = false
 * }
 *
 * function executeDelete() {
 *   deleteDataset.mutate(props.identifier, {
 *     onSettled: () => {
 *       pendingDelete.value = false
 *       undoTimeout.value = null
 *     },
 *   })
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button
 *       v-if="!pendingDelete"
 *       @click="scheduleDelete"
 *       class="btn-danger"
 *     >
 *       Delete Dataset
 *     </button>
 *
 *     <div v-else class="undo-notice">
 *       <p>Dataset will be deleted in 5 seconds...</p>
 *       <button @click="cancelDelete" class="btn-primary">
 *         Undo
 *       </button>
 *     </div>
 *
 *     <p v-if="deleteDataset.isPending">Deleting dataset...</p>
 *     <p v-if="deleteDataset.isError" class="error">
 *       Failed to delete: {{ deleteDataset.error?.message }}
 *     </p>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useChangeDatasetState} to archive datasets instead of deleting
 * @see {@link useCreateDataset} to create a new dataset
 * @see {@link useDataset} to fetch dataset details
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
