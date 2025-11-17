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
 * Fetches all revisions for a metastore item.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: revisions } = useRevisions({
 *   schemaId: 'dataset',
 *   identifier: datasetId,
 * })
 * </script>
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
 * Fetches a specific revision by ID.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: revision } = useRevision({
 *   schemaId: 'dataset',
 *   identifier: datasetId,
 *   revisionId: revId,
 * })
 * </script>
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
 * Creates a new revision by changing an item's workflow state.
 *
 * States: draft, published, hidden, archived, orphaned
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const createRevision = useCreateRevision()
 *
 * const changeState = () => {
 *   createRevision.mutate({
 *     schemaId: 'dataset',
 *     identifier: datasetId,
 *     revision: { state: 'published', message: 'Publishing dataset' },
 *   })
 * }
 * </script>
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
 * Changes a dataset's workflow state (convenience wrapper for useCreateRevision).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const changeState = useChangeDatasetState()
 *
 * const publish = () => {
 *   changeState.mutate({
 *     identifier: datasetId,
 *     state: 'published',
 *     message: 'Publishing to production',
 *   })
 * }
 * </script>
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
