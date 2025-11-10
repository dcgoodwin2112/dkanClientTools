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
 * Hook to get all revisions for an item
 *
 * @example
 * ```tsx
 * function RevisionHistory({
 *   schemaId,
 *   identifier,
 * }: {
 *   schemaId: string
 *   identifier: string
 * }) {
 *   const { data: revisions, isLoading } = useRevisions({
 *     schemaId,
 *     identifier,
 *   })
 *
 *   if (isLoading) return <div>Loading revisions...</div>
 *
 *   return (
 *     <ul>
 *       {revisions?.map(rev => (
 *         <li key={rev.identifier}>
 *           <strong>{rev.state}</strong> - {rev.modified}
 *           {rev.published && ' (Current)'}
 *           {rev.message && <p>{rev.message}</p>}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
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
 * Hook to get a specific revision
 *
 * @example
 * ```tsx
 * function RevisionDetails({
 *   schemaId,
 *   identifier,
 *   revisionId,
 * }: {
 *   schemaId: string
 *   identifier: string
 *   revisionId: string
 * }) {
 *   const { data: revision, isLoading } = useRevision({
 *     schemaId,
 *     identifier,
 *     revisionId,
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!revision) return null
 *
 *   return (
 *     <div>
 *       <h3>Revision {revision.identifier}</h3>
 *       <p>State: {revision.state}</p>
 *       <p>Modified: {new Date(revision.modified).toLocaleString()}</p>
 *       <p>Published: {revision.published ? 'Yes' : 'No'}</p>
 *       {revision.message && <blockquote>{revision.message}</blockquote>}
 *     </div>
 *   )
 * }
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
 * Mutation hook to create a new revision (change workflow state)
 *
 * @example
 * ```tsx
 * function ChangeStateForm({ identifier }: { identifier: string }) {
 *   const createRevision = useCreateRevision()
 *   const [state, setState] = useState<WorkflowState>('draft')
 *   const [message, setMessage] = useState('')
 *
 *   const handleSubmit = () => {
 *     createRevision.mutate({
 *       schemaId: 'dataset',
 *       identifier,
 *       revision: { state, message },
 *     })
 *   }
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       handleSubmit()
 *     }}>
 *       <select value={state} onChange={(e) => setState(e.target.value as WorkflowState)}>
 *         <option value="draft">Draft</option>
 *         <option value="published">Published</option>
 *         <option value="hidden">Hidden</option>
 *         <option value="archived">Archived</option>
 *         <option value="orphaned">Orphaned</option>
 *       </select>
 *       <textarea
 *         value={message}
 *         onChange={(e) => setMessage(e.target.value)}
 *         placeholder="Revision message"
 *       />
 *       <button type="submit" disabled={createRevision.isPending}>
 *         Change State
 *       </button>
 *     </form>
 *   )
 * }
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
 * Convenience mutation hook to change dataset workflow state
 * Specialized version of useCreateRevision for datasets
 *
 * @example
 * ```tsx
 * function PublishDatasetButton({ identifier }: { identifier: string }) {
 *   const changeState = useChangeDatasetState()
 *
 *   const handlePublish = () => {
 *     changeState.mutate({
 *       identifier,
 *       state: 'published',
 *       message: 'Publishing to production',
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handlePublish} disabled={changeState.isPending}>
 *       {changeState.isPending ? 'Publishing...' : 'Publish Dataset'}
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * function WorkflowActions({ identifier }: { identifier: string }) {
 *   const changeState = useChangeDatasetState()
 *
 *   const handleStateChange = (state: WorkflowState, message: string) => {
 *     changeState.mutate({ identifier, state, message })
 *   }
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={() => handleStateChange('draft', 'Moving to draft')}
 *         disabled={changeState.isPending}
 *       >
 *         Save as Draft
 *       </button>
 *       <button
 *         onClick={() => handleStateChange('published', 'Publishing')}
 *         disabled={changeState.isPending}
 *       >
 *         Publish
 *       </button>
 *       <button
 *         onClick={() => handleStateChange('hidden', 'Hiding from public')}
 *         disabled={changeState.isPending}
 *       >
 *         Hide
 *       </button>
 *       <button
 *         onClick={() => handleStateChange('archived', 'Archiving')}
 *         disabled={changeState.isPending}
 *       >
 *         Archive
 *       </button>
 *     </div>
 *   )
 * }
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
