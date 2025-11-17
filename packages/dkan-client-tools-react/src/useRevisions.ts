/**
 * React hooks for DKAN Revision and Moderation operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type {
  MetastoreRevision,
  MetastoreNewRevision,
  MetastoreWriteResponse,
  WorkflowState,
} from '@dkan-client-tools/core'

export interface UseRevisionsOptions {
  schemaId: string
  identifier: string
  enabled?: boolean
  staleTime?: number
}

export interface UseRevisionOptions {
  schemaId: string
  identifier: string
  revisionId: string
  enabled?: boolean
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
 * Fetches all revisions for a metastore item with state change history.
 *
 * Each revision includes state, timestamp, and optional message for audit trails.
 *
 * @example
 * ```tsx
 * const { data: revisions } = useRevisions({ schemaId: 'dataset', identifier })
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
    queryFn: () => client.getRevisions(options.schemaId, options.identifier),
    enabled:
      (options.enabled ?? true) && !!options.schemaId && !!options.identifier,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches a specific revision by ID for detailed inspection.
 *
 * @example
 * ```tsx
 * const { data: revision } = useRevision({ schemaId, identifier, revisionId })
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
        options.schemaId,
        options.identifier,
        options.revisionId
      ),
    enabled:
      (options.enabled ?? true) &&
      !!options.schemaId &&
      !!options.identifier &&
      !!options.revisionId,
    staleTime: options.staleTime,
  })
}

/**
 * Creates a new revision by changing an item's workflow state.
 *
 * Available states: draft, published, hidden, archived, orphaned.
 * Invalidates revisions and related queries on success.
 *
 * @example
 * ```tsx
 * const createRevision = useCreateRevision()
 * createRevision.mutate({
 *   schemaId: 'dataset',
 *   identifier,
 *   revision: { state: 'published', message: 'Publishing dataset' },
 * })
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
 * Changes a dataset's workflow state.
 *
 * Convenience wrapper around `useCreateRevision` for datasets.
 * Invalidates dataset and revision queries on success.
 *
 * @example
 * ```tsx
 * const changeState = useChangeDatasetState()
 * changeState.mutate({
 *   identifier,
 *   state: 'published',
 *   message: 'Publishing to production',
 * })
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
