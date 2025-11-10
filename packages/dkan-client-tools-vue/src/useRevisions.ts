/**
 * Vue composables for DKAN Revision and Moderation operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'
import type {
  MetastoreRevision,
  MetastoreNewRevision,
  MetastoreWriteResponse,
  WorkflowState,
} from '@dkan-client-tools/core'

export interface UseRevisionsOptions {
  schemaId: MaybeRefOrGetter<string>
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseRevisionOptions {
  schemaId: MaybeRefOrGetter<string>
  identifier: MaybeRefOrGetter<string>
  revisionId: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface CreateRevisionOptions {
  schemaId: string
  identifier: string
  revision: MetastoreNewRevision
}

export interface ChangeDatasetStateOptions {
  identifier: string
  state: WorkflowState
  message?: string
}

/**
 * Fetches all revisions for a metastore item, providing a complete history of state changes.
 *
 * DKAN uses a revision system to track changes to metadata over time, similar to version control
 * for content. Each time a dataset or other metastore item changes workflow state (draft → published,
 * published → archived, etc.), a new revision is created with a timestamp, state, and optional message.
 *
 * This composable returns all revisions for a specific item, sorted chronologically. Each revision includes:
 * - **identifier**: Unique ID for the revision
 * - **state**: Workflow state (draft, published, hidden, archived, orphaned)
 * - **modified**: Timestamp when the revision was created
 * - **published**: Boolean indicating if this is the currently published version
 * - **message**: Optional message explaining the state change
 *
 * Revisions are useful for content auditing, displaying change history to users, implementing
 * rollback functionality, and understanding how content has evolved over time.
 *
 * **Reactive Parameters**: Both schemaId and identifier accept refs or computed values. When these
 * change, the query automatically re-executes to fetch the new revisions.
 *
 * Use this composable when you need to:
 * - Display revision history and audit trails
 * - Build content moderation interfaces
 * - Show who changed what and when
 * - Implement rollback or revert functionality
 * - Track content workflow progression
 *
 * @param options - Configuration options including schema ID and item identifier
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing array of revision objects for the item
 *   - `isLoading`: Ref<boolean> - true during initial fetch
 *   - `isError`: Ref<boolean> - true if fetch failed
 *   - `error`: Ref containing error object if request failed
 *   - `refetch`: Function to manually re-fetch revisions
 *
 * @example
 * Basic usage - revision history list:
 * ```vue
 * <script setup lang="ts">
 * import { useRevisions } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 * }>()
 *
 * const { data: revisions, isLoading, error } = useRevisions({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading revision history...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else-if="!revisions || revisions.length === 0">No revisions found</div>
 *   <div v-else class="revision-history">
 *     <h3>Revision History ({{ revisions.length }})</h3>
 *     <ul>
 *       <li
 *         v-for="rev in revisions"
 *         :key="rev.identifier"
 *         :class="{ current: rev.published }"
 *       >
 *         <div class="revision-header">
 *           <strong :class="`state-${rev.state}`">{{ rev.state }}</strong>
 *           <span class="timestamp">
 *             {{ new Date(rev.modified).toLocaleString() }}
 *           </span>
 *           <span v-if="rev.published" class="badge">Current</span>
 *         </div>
 *         <p v-if="rev.message" class="message">{{ rev.message }}</p>
 *       </li>
 *     </ul>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Timeline visualization of state changes:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useRevisions } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 * }>()
 *
 * const { data: revisions } = useRevisions({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 * })
 *
 * // Group by state
 * const stateHistory = computed(() => {
 *   if (!revisions.value) return {}
 *   return revisions.value.reduce((acc, rev) => {
 *     if (!acc[rev.state]) {
 *       acc[rev.state] = []
 *     }
 *     acc[rev.state].push(rev)
 *     return acc
 *   }, {} as Record<string, typeof revisions.value>)
 * })
 * </script>
 *
 * <template>
 *   <div v-if="revisions" class="revision-timeline">
 *     <h3>State Transition Timeline</h3>
 *     <div class="timeline">
 *       <div
 *         v-for="(rev, index) in revisions"
 *         :key="rev.identifier"
 *         class="timeline-item"
 *       >
 *         <div class="timeline-marker" />
 *         <div class="timeline-content">
 *           <div :class="`state-badge state-${rev.state}`">
 *             {{ rev.state }}
 *           </div>
 *           <time>{{ new Date(rev.modified).toLocaleDateString() }}</time>
 *           <p v-if="rev.message">{{ rev.message }}</p>
 *         </div>
 *         <div v-if="index < revisions.length - 1" class="timeline-connector" />
 *       </div>
 *     </div>
 *
 *     <div class="summary">
 *       <h4>State Summary</h4>
 *       <div v-for="(revs, state) in stateHistory" :key="state">
 *         {{ state }}: {{ revs.length }} time{{ revs.length > 1 ? 's' : '' }}
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Diff viewer showing changes between revisions:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useRevisions } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 * }>()
 *
 * const { data: revisions } = useRevisions({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 * })
 *
 * const selectedIndex = ref(0)
 *
 * const currentRev = computed(() => revisions.value?.[selectedIndex.value])
 * const previousRev = computed(() => revisions.value?.[selectedIndex.value + 1])
 * const canCompare = computed(() => revisions.value && revisions.value.length >= 2)
 * </script>
 *
 * <template>
 *   <div v-if="!canCompare">Need at least 2 revisions to compare</div>
 *   <div v-else class="revision-diff">
 *     <div class="revision-selector">
 *       <label>Compare revisions:</label>
 *       <select v-model="selectedIndex">
 *         <option
 *           v-for="(rev, index) in revisions?.slice(0, -1)"
 *           :key="rev.identifier"
 *           :value="index"
 *         >
 *           {{ rev.state }} ({{ new Date(rev.modified).toLocaleDateString() }})
 *         </option>
 *       </select>
 *     </div>
 *
 *     <div v-if="previousRev" class="diff-view">
 *       <div class="before">
 *         <h4>Previous ({{ previousRev.state }})</h4>
 *         <pre>{{ JSON.stringify(previousRev, null, 2) }}</pre>
 *       </div>
 *       <div class="after">
 *         <h4>Current ({{ currentRev?.state }})</h4>
 *         <pre>{{ JSON.stringify(currentRev, null, 2) }}</pre>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useRevision} for fetching a specific revision
 * @see {@link useCreateRevision} for creating new revisions
 * @see {@link useChangeDatasetState} for changing dataset workflow state
 * @see https://dkan.readthedocs.io/en/latest/components/workflow.html
 */
export function useRevisions(options: UseRevisionsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'metastore',
      'revisions',
      options.schemaId,
      options.identifier,
    ] as const,
    queryFn: () => client.getRevisions(toValue(options.schemaId), toValue(options.identifier)),
    enabled: () =>
      (toValue(options.enabled) ?? true) && !!toValue(options.schemaId) && !!toValue(options.identifier),
    staleTime: options.staleTime,
  })
}

/**
 * Fetches a specific revision by ID for detailed inspection or comparison.
 *
 * While {@link useRevisions} returns all revisions for an item, this composable fetches a single
 * specific revision. This is useful when you need to examine the details of a particular
 * revision, display its full content, or compare it with other revisions.
 *
 * Each revision represents a snapshot of the item at a specific point in time, including
 * its workflow state and any metadata that was present when the revision was created. This
 * allows you to see exactly how the item looked at any point in its history.
 *
 * Common use cases include:
 * - Displaying detailed information about a specific revision
 * - Building revision comparison tools
 * - Implementing rollback/restore functionality
 * - Showing audit trail details for compliance
 * - Previewing how content looked in a previous state
 *
 * **Reactive Parameters**: All ID parameters accept refs or computed values. When these
 * change, the query automatically re-executes to fetch the new revision.
 *
 * Use this composable when you need to:
 * - Display detailed information about a specific revision
 * - Compare two specific revisions side-by-side
 * - Preview content from a previous revision
 * - Build rollback or restore functionality
 * - Audit specific state changes
 *
 * @param options - Configuration options including schema ID, item identifier, and revision ID
 *
 * @returns TanStack Vue Query result object containing:
 *   - `data`: Ref containing the revision object with full metadata
 *   - `isLoading`: Ref<boolean> - true during initial fetch
 *   - `isError`: Ref<boolean> - true if fetch failed
 *   - `error`: Ref containing error object if request failed
 *   - `refetch`: Function to manually re-fetch the revision
 *
 * @example
 * Basic usage - revision details viewer:
 * ```vue
 * <script setup lang="ts">
 * import { useRevision } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 *   revisionId: string
 * }>()
 *
 * const { data: revision, isLoading, error } = useRevision({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 *   revisionId: props.revisionId,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading revision...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else-if="!revision">Revision not found</div>
 *   <div v-else class="revision-details">
 *     <h3>Revision {{ revision.identifier }}</h3>
 *     <div class="metadata">
 *       <div class="field">
 *         <label>State:</label>
 *         <span :class="`state-badge state-${revision.state}`">
 *           {{ revision.state }}
 *         </span>
 *       </div>
 *       <div class="field">
 *         <label>Modified:</label>
 *         <time>{{ new Date(revision.modified).toLocaleString() }}</time>
 *       </div>
 *       <div class="field">
 *         <label>Status:</label>
 *         <span>{{ revision.published ? 'Published' : 'Not Published' }}</span>
 *       </div>
 *     </div>
 *     <div v-if="revision.message" class="message">
 *       <h4>Change Message</h4>
 *       <blockquote>{{ revision.message }}</blockquote>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Revision selector with detailed preview:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useRevisions, useRevision } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 * }>()
 *
 * const { data: revisions } = useRevisions({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 * })
 *
 * const selectedRevisionId = ref<string>()
 *
 * const { data: selectedRevision } = useRevision({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 *   revisionId: selectedRevisionId,
 *   enabled: () => !!selectedRevisionId.value,
 * })
 * </script>
 *
 * <template>
 *   <div class="revision-selector">
 *     <div class="selector-panel">
 *       <h3>Select a Revision</h3>
 *       <select v-model="selectedRevisionId">
 *         <option :value="undefined">Choose a revision...</option>
 *         <option
 *           v-for="rev in revisions"
 *           :key="rev.identifier"
 *           :value="rev.identifier"
 *         >
 *           {{ rev.state }} - {{ new Date(rev.modified).toLocaleDateString() }}
 *           {{ rev.published ? ' (Current)' : '' }}
 *         </option>
 *       </select>
 *     </div>
 *
 *     <div v-if="selectedRevision" class="preview-panel">
 *       <h3>Revision Preview</h3>
 *       <div class="revision-content">
 *         <pre>{{ JSON.stringify(selectedRevision, null, 2) }}</pre>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Side-by-side revision comparison:
 * ```vue
 * <script setup lang="ts">
 * import { useRevision } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 *   leftRevisionId: string
 *   rightRevisionId: string
 * }>()
 *
 * const { data: leftRevision } = useRevision({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 *   revisionId: props.leftRevisionId,
 * })
 *
 * const { data: rightRevision } = useRevision({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 *   revisionId: props.rightRevisionId,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="!leftRevision || !rightRevision">Loading...</div>
 *   <div v-else class="comparison-view">
 *     <div class="comparison-header">
 *       <h3>Comparing Revisions</h3>
 *     </div>
 *
 *     <div class="comparison-panels">
 *       <div class="left-panel">
 *         <h4>
 *           {{ leftRevision.state }}
 *           <small>{{ new Date(leftRevision.modified).toLocaleDateString() }}</small>
 *         </h4>
 *         <p v-if="leftRevision.message">{{ leftRevision.message }}</p>
 *         <pre>{{ JSON.stringify(leftRevision, null, 2) }}</pre>
 *       </div>
 *
 *       <div class="divider">→</div>
 *
 *       <div class="right-panel">
 *         <h4>
 *           {{ rightRevision.state }}
 *           <small>{{ new Date(rightRevision.modified).toLocaleDateString() }}</small>
 *         </h4>
 *         <p v-if="rightRevision.message">{{ rightRevision.message }}</p>
 *         <pre>{{ JSON.stringify(rightRevision, null, 2) }}</pre>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Revision restore with confirmation:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useRevision, useCreateRevision } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 *   revisionId: string
 * }>()
 *
 * const { data: revision } = useRevision({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 *   revisionId: props.revisionId,
 * })
 *
 * const createRevision = useCreateRevision()
 * const showConfirm = ref(false)
 *
 * const handleRestore = () => {
 *   if (!revision.value) return
 *
 *   createRevision.mutate(
 *     {
 *       schemaId: props.schemaId,
 *       identifier: props.identifier,
 *       revision: {
 *         state: revision.value.state,
 *         message: `Restored from revision ${props.revisionId}`,
 *       },
 *     },
 *     {
 *       onSuccess: () => {
 *         showConfirm.value = false
 *         alert('Revision restored successfully')
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div v-if="!revision">Loading...</div>
 *   <div v-else>
 *     <div class="revision-restore">
 *       <h4>Restore This Revision?</h4>
 *       <p>State: {{ revision.state }}</p>
 *       <p>Date: {{ new Date(revision.modified).toLocaleString() }}</p>
 *       <p v-if="revision.message">Message: {{ revision.message }}</p>
 *
 *       <button @click="showConfirm = true">Restore This Version</button>
 *     </div>
 *
 *     <div v-if="showConfirm" class="modal">
 *       <div class="modal-content">
 *         <h3>Confirm Restore</h3>
 *         <p>Are you sure you want to restore this revision?</p>
 *         <p>This will create a new revision with the state: {{ revision.state }}</p>
 *         <div class="actions">
 *           <button @click="showConfirm = false">Cancel</button>
 *           <button
 *             @click="handleRestore"
 *             :disabled="createRevision.isPending"
 *           >
 *             {{ createRevision.isPending ? 'Restoring...' : 'Confirm Restore' }}
 *           </button>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useRevisions} for fetching all revisions
 * @see {@link useCreateRevision} for creating new revisions
 * @see {@link useChangeDatasetState} for changing workflow states
 * @see https://dkan.readthedocs.io/en/latest/components/workflow.html
 */
export function useRevision(options: UseRevisionOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'metastore',
      'revision',
      options.schemaId,
      options.identifier,
      options.revisionId,
    ] as const,
    queryFn: () =>
      client.getRevision(
        toValue(options.schemaId),
        toValue(options.identifier),
        toValue(options.revisionId)
      ),
    enabled: () =>
      (toValue(options.enabled) ?? true) &&
      !!toValue(options.schemaId) &&
      !!toValue(options.identifier) &&
      !!toValue(options.revisionId),
    staleTime: options.staleTime,
  })
}

/**
 * Creates a new revision by changing an item's workflow state.
 *
 * This mutation-based composable transitions a metastore item (like a dataset) from one workflow state
 * to another, creating a new revision in the process. DKAN's workflow system supports several
 * states that control content visibility and editability:
 *
 * **Available Workflow States**:
 * - **draft**: Content is being edited and not publicly visible
 * - **published**: Content is publicly visible and searchable
 * - **hidden**: Content exists but is hidden from public view
 * - **archived**: Content is preserved but not actively used
 * - **orphaned**: Content is marked for potential deletion
 *
 * Each state change creates a permanent revision with a timestamp and optional message,
 * providing a complete audit trail of content workflow progression. This is essential for
 * content moderation, publishing workflows, and compliance requirements.
 *
 * **Cache Management**: Automatically invalidates related queries after successful state change
 * so revision lists and item details reflect the new state immediately.
 *
 * Use this composable when you need to:
 * - Change the workflow state of metastore items
 * - Implement content moderation workflows
 * - Build publishing/unpublishing functionality
 * - Create audit trails with revision messages
 * - Manage content lifecycle across different states
 *
 * @returns TanStack Vue Query mutation object containing:
 *   - `mutate`: Function to create the revision (takes CreateRevisionOptions)
 *   - `mutateAsync`: Async version that returns a Promise
 *   - `isPending`: Ref<boolean> - true while the revision is being created
 *   - `isSuccess`: Ref<boolean> - true if the revision was successfully created
 *   - `isError`: Ref<boolean> - true if creation failed
 *   - `error`: Ref containing error object if the mutation failed
 *   - `data`: Ref containing response object from the server
 *
 * @example
 * Basic usage - workflow state change form:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCreateRevision } from '@dkan-client-tools/vue'
 * import type { WorkflowState } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 * }>()
 *
 * const createRevision = useCreateRevision()
 * const state = ref<WorkflowState>('draft')
 * const message = ref('')
 *
 * const handleSubmit = () => {
 *   createRevision.mutate(
 *     {
 *       schemaId: props.schemaId,
 *       identifier: props.identifier,
 *       revision: { state: state.value, message: message.value },
 *     },
 *     {
 *       onSuccess: () => {
 *         alert('State changed successfully!')
 *         message.value = ''
 *       },
 *       onError: (error) => {
 *         alert(`Failed to change state: ${error.message}`)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="handleSubmit" class="state-changer">
 *     <div class="field">
 *       <label>New State:</label>
 *       <select v-model="state">
 *         <option value="draft">Draft</option>
 *         <option value="published">Published</option>
 *         <option value="hidden">Hidden</option>
 *         <option value="archived">Archived</option>
 *         <option value="orphaned">Orphaned</option>
 *       </select>
 *     </div>
 *
 *     <div class="field">
 *       <label>Change Message (optional):</label>
 *       <textarea
 *         v-model="message"
 *         placeholder="Describe why you're making this change..."
 *       />
 *     </div>
 *
 *     <button type="submit" :disabled="createRevision.isPending">
 *       {{ createRevision.isPending ? 'Changing State...' : 'Change State' }}
 *     </button>
 *   </form>
 * </template>
 * ```
 *
 * @example
 * Quick action buttons for common state transitions:
 * ```vue
 * <script setup lang="ts">
 * import { useCreateRevision } from '@dkan-client-tools/vue'
 * import type { WorkflowState } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 *   currentState: WorkflowState
 * }>()
 *
 * const createRevision = useCreateRevision()
 *
 * const changeState = (newState: WorkflowState, message: string) => {
 *   createRevision.mutate({
 *     schemaId: props.schemaId,
 *     identifier: props.identifier,
 *     revision: { state: newState, message },
 *   })
 * }
 * </script>
 *
 * <template>
 *   <div class="quick-actions">
 *     <h4>Quick Actions</h4>
 *     <div class="action-buttons">
 *       <button
 *         v-if="currentState !== 'published'"
 *         @click="changeState('published', 'Publishing to production')"
 *         :disabled="createRevision.isPending"
 *         class="btn-success"
 *       >
 *         Publish
 *       </button>
 *
 *       <button
 *         v-if="currentState !== 'draft'"
 *         @click="changeState('draft', 'Moving back to draft')"
 *         :disabled="createRevision.isPending"
 *         class="btn-secondary"
 *       >
 *         Unpublish (Draft)
 *       </button>
 *
 *       <button
 *         v-if="currentState !== 'hidden'"
 *         @click="changeState('hidden', 'Hiding from public view')"
 *         :disabled="createRevision.isPending"
 *         class="btn-warning"
 *       >
 *         Hide
 *       </button>
 *
 *       <button
 *         v-if="currentState !== 'archived'"
 *         @click="changeState('archived', 'Archiving old content')"
 *         :disabled="createRevision.isPending"
 *         class="btn-info"
 *       >
 *         Archive
 *       </button>
 *     </div>
 *
 *     <div v-if="createRevision.isPending" class="status">Changing state...</div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Workflow with approval process:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCreateRevision } from '@dkan-client-tools/vue'
 * import type { WorkflowState } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 *   currentState: WorkflowState
 *   userRole: 'editor' | 'approver' | 'admin'
 * }>()
 *
 * const createRevision = useCreateRevision()
 * const approvalMessage = ref('')
 *
 * const canPublish = props.userRole === 'approver' || props.userRole === 'admin'
 *
 * const requestApproval = () => {
 *   createRevision.mutate({
 *     schemaId: props.schemaId,
 *     identifier: props.identifier,
 *     revision: {
 *       state: 'draft',
 *       message: 'Requesting approval for publication',
 *     },
 *   })
 * }
 *
 * const approve = () => {
 *   if (!approvalMessage.value) {
 *     alert('Please provide an approval message')
 *     return
 *   }
 *
 *   createRevision.mutate({
 *     schemaId: props.schemaId,
 *     identifier: props.identifier,
 *     revision: {
 *       state: 'published',
 *       message: `Approved: ${approvalMessage.value}`,
 *     },
 *   })
 * }
 *
 * const reject = () => {
 *   if (!approvalMessage.value) {
 *     alert('Please provide a rejection reason')
 *     return
 *   }
 *
 *   createRevision.mutate({
 *     schemaId: props.schemaId,
 *     identifier: props.identifier,
 *     revision: {
 *       state: 'draft',
 *       message: `Rejected: ${approvalMessage.value}`,
 *     },
 *   })
 * }
 * </script>
 *
 * <template>
 *   <div class="approval-workflow">
 *     <h3>Content Approval</h3>
 *     <p>Current State: <strong>{{ currentState }}</strong></p>
 *
 *     <button
 *       v-if="userRole === 'editor' && currentState === 'draft'"
 *       @click="requestApproval"
 *       :disabled="createRevision.isPending"
 *     >
 *       Request Approval
 *     </button>
 *
 *     <div v-if="canPublish && currentState === 'draft'" class="approver-actions">
 *       <textarea
 *         v-model="approvalMessage"
 *         placeholder="Approval/rejection message..."
 *       />
 *       <div class="actions">
 *         <button
 *           @click="approve"
 *           :disabled="createRevision.isPending"
 *           class="btn-success"
 *         >
 *           Approve & Publish
 *         </button>
 *         <button
 *           @click="reject"
 *           :disabled="createRevision.isPending"
 *           class="btn-danger"
 *         >
 *           Reject
 *         </button>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Batch state change with progress tracking:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCreateRevision } from '@dkan-client-tools/vue'
 * import type { WorkflowState } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifiers: string[]
 *   targetState: WorkflowState
 * }>()
 *
 * const createRevision = useCreateRevision()
 * const progress = ref(0)
 * const isProcessing = ref(false)
 *
 * const handleBulkChange = async () => {
 *   isProcessing.value = true
 *   progress.value = 0
 *
 *   for (let i = 0; i < props.identifiers.length; i++) {
 *     try {
 *       await createRevision.mutateAsync({
 *         schemaId: props.schemaId,
 *         identifier: props.identifiers[i],
 *         revision: {
 *           state: props.targetState,
 *           message: `Bulk state change to ${props.targetState}`,
 *         },
 *       })
 *       progress.value = ((i + 1) / props.identifiers.length) * 100
 *     } catch (error) {
 *       console.error(`Failed to change state for ${props.identifiers[i]}:`, error)
 *     }
 *   }
 *
 *   isProcessing.value = false
 * }
 * </script>
 *
 * <template>
 *   <div class="bulk-state-changer">
 *     <h3>Bulk State Change</h3>
 *     <p>Change {{ identifiers.length }} items to: <strong>{{ targetState }}</strong></p>
 *
 *     <button @click="handleBulkChange" :disabled="isProcessing">
 *       {{ isProcessing ? 'Processing...' : 'Start Bulk Change' }}
 *     </button>
 *
 *     <div v-if="isProcessing" class="progress-bar">
 *       <div class="progress-fill" :style="{ width: `${progress}%` }" />
 *       <span>{{ Math.round(progress) }}%</span>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useRevisions} for viewing revision history
 * @see {@link useChangeDatasetState} for a dataset-specific convenience wrapper
 * @see https://dkan.readthedocs.io/en/latest/components/workflow.html
 */
export function useCreateRevision() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, CreateRevisionOptions>({
    mutationFn: ({ schemaId, identifier, revision }) =>
      client.createRevision(schemaId, identifier, revision),
    onSuccess: (data, variables) => {
      // Invalidate revisions list
      queryClient.invalidateQueries({
        queryKey: [
          'metastore',
          'revisions',
          variables.schemaId,
          variables.identifier,
        ],
      })
      // Invalidate the item itself (it may have changed state)
      queryClient.invalidateQueries({
        queryKey: [variables.schemaId, 'single', variables.identifier],
      })
      // If schema is dataset, invalidate dataset lists
      if (variables.schemaId === 'dataset') {
        queryClient.invalidateQueries({ queryKey: ['datasets'] })
      }
    },
  })
}

/**
 * Changes a dataset's workflow state - a convenience wrapper around {@link useCreateRevision}.
 *
 * This composable provides a streamlined API specifically for changing dataset workflow states without
 * needing to specify the schemaId (which is always 'dataset'). It's the most common way to
 * implement dataset publishing workflows, moderation systems, and content lifecycle management.
 *
 * This composable handles everything {@link useCreateRevision} does, but with a simpler API tailored
 * for the most common use case: managing dataset publication status.
 *
 * **Cache Management**: Automatically invalidates:
 * - The specific dataset query cache
 * - The dataset revisions cache
 * - All dataset list caches (since published state affects visibility)
 *
 * Use this composable when you need to:
 * - Publish or unpublish datasets
 * - Implement dataset moderation workflows
 * - Hide datasets from public view temporarily
 * - Archive old or obsolete datasets
 * - Build dataset lifecycle management interfaces
 *
 * @returns TanStack Vue Query mutation object containing:
 *   - `mutate`: Function to change state (takes ChangeDatasetStateOptions)
 *   - `mutateAsync`: Async version that returns a Promise
 *   - `isPending`: Ref<boolean> - true while the state change is in progress
 *   - `isSuccess`: Ref<boolean> - true if the state was successfully changed
 *   - `isError`: Ref<boolean> - true if the change failed
 *   - `error`: Ref containing error object if the mutation failed
 *   - `data`: Ref containing response object from the server
 *
 * @example
 * Basic usage - simple publish button:
 * ```vue
 * <script setup lang="ts">
 * import { useChangeDatasetState } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const changeState = useChangeDatasetState()
 *
 * const handlePublish = () => {
 *   changeState.mutate(
 *     {
 *       identifier: props.identifier,
 *       state: 'published',
 *       message: 'Publishing dataset to production',
 *     },
 *     {
 *       onSuccess: () => {
 *         alert('Dataset published successfully!')
 *       },
 *       onError: (error) => {
 *         alert(`Failed to publish: ${error.message}`)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <button
 *     @click="handlePublish"
 *     :disabled="changeState.isPending"
 *     class="btn-primary"
 *   >
 *     {{ changeState.isPending ? 'Publishing...' : 'Publish Dataset' }}
 *   </button>
 * </template>
 * ```
 *
 * @example
 * Complete workflow action bar:
 * ```vue
 * <script setup lang="ts">
 * import { useChangeDatasetState } from '@dkan-client-tools/vue'
 * import type { WorkflowState } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{
 *   identifier: string
 *   currentState: WorkflowState
 * }>()
 *
 * const changeState = useChangeDatasetState()
 *
 * const handleStateChange = (newState: WorkflowState, message: string) => {
 *   if (confirm(`Change dataset state to ${newState}?`)) {
 *     changeState.mutate({ identifier: props.identifier, state: newState, message })
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="workflow-actions">
 *     <div class="current-state">
 *       Current State:
 *       <span :class="`badge state-${currentState}`">{{ currentState }}</span>
 *     </div>
 *
 *     <div class="action-buttons">
 *       <button
 *         v-if="currentState !== 'draft'"
 *         @click="handleStateChange('draft', 'Moving back to draft for editing')"
 *         :disabled="changeState.isPending"
 *         class="btn-secondary"
 *       >
 *         Unpublish
 *       </button>
 *
 *       <button
 *         v-if="currentState !== 'published'"
 *         @click="handleStateChange('published', 'Publishing to production')"
 *         :disabled="changeState.isPending"
 *         class="btn-success"
 *       >
 *         Publish
 *       </button>
 *
 *       <button
 *         v-if="currentState !== 'hidden'"
 *         @click="handleStateChange('hidden', 'Temporarily hiding from public view')"
 *         :disabled="changeState.isPending"
 *         class="btn-warning"
 *       >
 *         Hide
 *       </button>
 *
 *       <button
 *         v-if="currentState !== 'archived'"
 *         @click="handleStateChange('archived', 'Archiving obsolete dataset')"
 *         :disabled="changeState.isPending"
 *         class="btn-info"
 *       >
 *         Archive
 *       </button>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Publishing workflow with validation:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDataset, useChangeDatasetState } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const { data: dataset } = useDataset({ identifier: props.identifier })
 * const changeState = useChangeDatasetState()
 *
 * const validationErrors = computed(() => {
 *   const errors: string[] = []
 *   if (!dataset.value) return errors
 *
 *   if (!dataset.value.title) errors.push('Title is required')
 *   if (!dataset.value.description) errors.push('Description is required')
 *   if (!dataset.value.distribution || dataset.value.distribution.length === 0) {
 *     errors.push('At least one distribution is required')
 *   }
 *   if (!dataset.value.publisher) errors.push('Publisher is required')
 *
 *   return errors
 * })
 *
 * const canPublish = computed(() => validationErrors.value.length === 0)
 *
 * const handlePublish = () => {
 *   if (!canPublish.value) {
 *     alert('Cannot publish dataset:\n' + validationErrors.value.join('\n'))
 *     return
 *   }
 *
 *   changeState.mutate({
 *     identifier: props.identifier,
 *     state: 'published',
 *     message: 'Dataset validated and published',
 *   })
 * }
 * </script>
 *
 * <template>
 *   <div class="publish-validation">
 *     <div v-if="validationErrors.length > 0" class="validation-errors">
 *       <h4>Fix these issues before publishing:</h4>
 *       <ul>
 *         <li v-for="error in validationErrors" :key="error">{{ error }}</li>
 *       </ul>
 *     </div>
 *
 *     <button
 *       @click="handlePublish"
 *       :disabled="!canPublish || changeState.isPending"
 *       class="btn-primary"
 *     >
 *       {{ changeState.isPending ? 'Publishing...' : 'Publish Dataset' }}
 *     </button>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Batch dataset publication:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useChangeDatasetState } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifiers: string[] }>()
 *
 * const changeState = useChangeDatasetState()
 * const results = ref<Array<{ id: string; success: boolean }>>([])
 * const isProcessing = ref(false)
 *
 * const publishAll = async () => {
 *   isProcessing.value = true
 *   results.value = []
 *
 *   for (const identifier of props.identifiers) {
 *     try {
 *       await changeState.mutateAsync({
 *         identifier,
 *         state: 'published',
 *         message: 'Bulk publication',
 *       })
 *       results.value.push({ id: identifier, success: true })
 *     } catch (error) {
 *       results.value.push({ id: identifier, success: false })
 *     }
 *   }
 *
 *   isProcessing.value = false
 * }
 *
 * const successCount = computed(() => results.value.filter((r) => r.success).length)
 * const failureCount = computed(() => results.value.filter((r) => !r.success).length)
 * </script>
 *
 * <template>
 *   <div class="bulk-publisher">
 *     <h3>Bulk Dataset Publisher</h3>
 *     <p>Publish {{ identifiers.length }} datasets</p>
 *
 *     <button @click="publishAll" :disabled="isProcessing">
 *       {{
 *         isProcessing
 *           ? `Publishing... (${results.length}/${identifiers.length})`
 *           : 'Publish All'
 *       }}
 *     </button>
 *
 *     <div v-if="results.length > 0" class="results">
 *       <p class="success">Successfully published: {{ successCount }}</p>
 *       <p v-if="failureCount > 0" class="error">Failed: {{ failureCount }}</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useCreateRevision} for the generic version that works with any schema
 * @see {@link useRevisions} for viewing revision history
 * @see {@link useDataset} for fetching dataset details
 * @see https://dkan.readthedocs.io/en/latest/components/workflow.html
 */
export function useChangeDatasetState() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, ChangeDatasetStateOptions>({
    mutationFn: ({ identifier, state, message }) =>
      client.changeDatasetState(identifier, state, message),
    onSuccess: (data, variables) => {
      // Invalidate revisions for this dataset
      queryClient.invalidateQueries({
        queryKey: ['metastore', 'revisions', 'dataset', variables.identifier],
      })
      // Invalidate the dataset itself
      queryClient.invalidateQueries({
        queryKey: ['datasets', 'single', variables.identifier],
      })
      // Invalidate dataset lists (published state may have changed visibility)
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
  })
}
