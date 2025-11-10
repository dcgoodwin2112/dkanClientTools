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
 * Composable to get all revisions for an item
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useRevisions } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{
 *   schemaId: string
 *   identifier: string
 * }>()
 *
 * const { data: revisions, isLoading } = useRevisions({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading revisions...</div>
 *   <ul v-else>
 *     <li v-for="rev in revisions" :key="rev.identifier">
 *       <strong>{{ rev.state }}</strong> - {{ rev.modified }}
 *       <span v-if="rev.published"> (Current)</span>
 *       <p v-if="rev.message">{{ rev.message }}</p>
 *     </li>
 *   </ul>
 * </template>
 * ```
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
 * Composable to get a specific revision
 *
 * @example
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
 * const { data: revision, isLoading } = useRevision({
 *   schemaId: props.schemaId,
 *   identifier: props.identifier,
 *   revisionId: props.revisionId,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="revision">
 *     <h3>Revision {{ revision.identifier }}</h3>
 *     <p>State: {{ revision.state }}</p>
 *     <p>Modified: {{ new Date(revision.modified).toLocaleString() }}</p>
 *     <p>Published: {{ revision.published ? 'Yes' : 'No' }}</p>
 *     <blockquote v-if="revision.message">{{ revision.message }}</blockquote>
 *   </div>
 * </template>
 * ```
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
 * Mutation composable to create a new revision (change workflow state)
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useCreateRevision } from '@dkan-client-tools/vue'
 * import type { WorkflowState } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const createRevision = useCreateRevision()
 * const state = ref<WorkflowState>('draft')
 * const message = ref('')
 *
 * const handleSubmit = () => {
 *   createRevision.mutate({
 *     schemaId: 'dataset',
 *     identifier: props.identifier,
 *     revision: { state: state.value, message: message.value },
 *   })
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="handleSubmit">
 *     <select v-model="state">
 *       <option value="draft">Draft</option>
 *       <option value="published">Published</option>
 *       <option value="hidden">Hidden</option>
 *       <option value="archived">Archived</option>
 *       <option value="orphaned">Orphaned</option>
 *     </select>
 *     <textarea
 *       v-model="message"
 *       placeholder="Revision message"
 *     />
 *     <button type="submit" :disabled="createRevision.isPending">
 *       {{ createRevision.isPending ? 'Changing State...' : 'Change State' }}
 *     </button>
 *   </form>
 * </template>
 * ```
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
 * Convenience mutation composable to change dataset workflow state
 * Specialized version of useCreateRevision for datasets
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useChangeDatasetState } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const changeState = useChangeDatasetState()
 *
 * const handlePublish = () => {
 *   changeState.mutate({
 *     identifier: props.identifier,
 *     state: 'published',
 *     message: 'Publishing to production',
 *   })
 * }
 * </script>
 *
 * <template>
 *   <button @click="handlePublish" :disabled="changeState.isPending">
 *     {{ changeState.isPending ? 'Publishing...' : 'Publish Dataset' }}
 *   </button>
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useChangeDatasetState } from '@dkan-client-tools/vue'
 * import type { WorkflowState } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{ identifier: string }>()
 *
 * const changeState = useChangeDatasetState()
 *
 * const handleStateChange = (state: WorkflowState, message: string) => {
 *   changeState.mutate({ identifier: props.identifier, state, message })
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button
 *       @click="handleStateChange('draft', 'Moving to draft')"
 *       :disabled="changeState.isPending"
 *     >
 *       Save as Draft
 *     </button>
 *     <button
 *       @click="handleStateChange('published', 'Publishing')"
 *       :disabled="changeState.isPending"
 *     >
 *       Publish
 *     </button>
 *     <button
 *       @click="handleStateChange('hidden', 'Hiding from public')"
 *       :disabled="changeState.isPending"
 *     >
 *       Hide
 *     </button>
 *     <button
 *       @click="handleStateChange('archived', 'Archiving')"
 *       :disabled="changeState.isPending"
 *     >
 *       Archive
 *     </button>
 *   </div>
 * </template>
 * ```
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
