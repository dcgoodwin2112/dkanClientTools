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
 * Fetches all revisions for a metastore item, providing a complete history of state changes.
 *
 * DKAN uses a revision system to track changes to metadata over time, similar to version control
 * for content. Each time a dataset or other metastore item changes workflow state (draft → published,
 * published → archived, etc.), a new revision is created with a timestamp, state, and optional message.
 *
 * This hook returns all revisions for a specific item, sorted chronologically. Each revision includes:
 * - **identifier**: Unique ID for the revision
 * - **state**: Workflow state (draft, published, hidden, archived, orphaned)
 * - **modified**: Timestamp when the revision was created
 * - **published**: Boolean indicating if this is the currently published version
 * - **message**: Optional message explaining the state change
 *
 * Revisions are useful for content auditing, displaying change history to users, implementing
 * rollback functionality, and understanding how content has evolved over time.
 *
 * Use this hook when you need to:
 * - Display revision history and audit trails
 * - Build content moderation interfaces
 * - Show who changed what and when
 * - Implement rollback or revert functionality
 * - Track content workflow progression
 *
 * @param options - Configuration options including schema ID and item identifier
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of revision objects for the item
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch revisions
 *
 * @example
 * Basic usage - revision history list:
 * ```tsx
 * function RevisionHistory({
 *   schemaId,
 *   identifier,
 * }: {
 *   schemaId: string
 *   identifier: string
 * }) {
 *   const { data: revisions, isLoading, error } = useRevisions({
 *     schemaId,
 *     identifier,
 *   })
 *
 *   if (isLoading) return <div>Loading revision history...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!revisions || revisions.length === 0) {
 *     return <div>No revisions found</div>
 *   }
 *
 *   return (
 *     <div className="revision-history">
 *       <h3>Revision History ({revisions.length})</h3>
 *       <ul>
 *         {revisions.map(rev => (
 *           <li key={rev.identifier} className={rev.published ? 'current' : ''}>
 *             <div className="revision-header">
 *               <strong className={`state-${rev.state}`}>{rev.state}</strong>
 *               <span className="timestamp">
 *                 {new Date(rev.modified).toLocaleString()}
 *               </span>
 *               {rev.published && <span className="badge">Current</span>}
 *             </div>
 *             {rev.message && <p className="message">{rev.message}</p>}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Timeline visualization of state changes:
 * ```tsx
 * function RevisionTimeline({
 *   schemaId,
 *   identifier,
 * }: {
 *   schemaId: string
 *   identifier: string
 * }) {
 *   const { data: revisions } = useRevisions({
 *     schemaId,
 *     identifier,
 *   })
 *
 *   if (!revisions) return null
 *
 *   // Group by state
 *   const stateHistory = revisions.reduce((acc, rev) => {
 *     if (!acc[rev.state]) {
 *       acc[rev.state] = []
 *     }
 *     acc[rev.state].push(rev)
 *     return acc
 *   }, {} as Record<string, typeof revisions>)
 *
 *   return (
 *     <div className="revision-timeline">
 *       <h3>State Transition Timeline</h3>
 *       <div className="timeline">
 *         {revisions.map((rev, index) => (
 *           <div key={rev.identifier} className="timeline-item">
 *             <div className="timeline-marker" />
 *             <div className="timeline-content">
 *               <div className={`state-badge state-${rev.state}`}>
 *                 {rev.state}
 *               </div>
 *               <time>{new Date(rev.modified).toLocaleDateString()}</time>
 *               {rev.message && <p>{rev.message}</p>}
 *             </div>
 *             {index < revisions.length - 1 && (
 *               <div className="timeline-connector" />
 *             )}
 *           </div>
 *         ))}
 *       </div>
 *
 *       <div className="summary">
 *         <h4>State Summary</h4>
 *         {Object.entries(stateHistory).map(([state, revs]) => (
 *           <div key={state}>
 *             {state}: {revs.length} time{revs.length > 1 ? 's' : ''}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Diff viewer showing changes between revisions:
 * ```tsx
 * function RevisionDiff({
 *   schemaId,
 *   identifier,
 * }: {
 *   schemaId: string
 *   identifier: string
 * }) {
 *   const { data: revisions } = useRevisions({ schemaId, identifier })
 *   const [selectedIndex, setSelectedIndex] = useState(0)
 *
 *   if (!revisions || revisions.length < 2) {
 *     return <div>Need at least 2 revisions to compare</div>
 *   }
 *
 *   const currentRev = revisions[selectedIndex]
 *   const previousRev = revisions[selectedIndex + 1]
 *
 *   return (
 *     <div className="revision-diff">
 *       <div className="revision-selector">
 *         <label>Compare revisions:</label>
 *         <select
 *           value={selectedIndex}
 *           onChange={(e) => setSelectedIndex(Number(e.target.value))}
 *         >
 *           {revisions.slice(0, -1).map((rev, index) => (
 *             <option key={rev.identifier} value={index}>
 *               {rev.state} ({new Date(rev.modified).toLocaleDateString()})
 *             </option>
 *           ))}
 *         </select>
 *       </div>
 *
 *       {previousRev && (
 *         <div className="diff-view">
 *           <div className="before">
 *             <h4>Previous ({previousRev.state})</h4>
 *             <pre>{JSON.stringify(previousRev, null, 2)}</pre>
 *           </div>
 *           <div className="after">
 *             <h4>Current ({currentRev.state})</h4>
 *             <pre>{JSON.stringify(currentRev, null, 2)}</pre>
 *           </div>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
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
    queryFn: () => client.getRevisions(options.schemaId, options.identifier),
    enabled:
      (options.enabled ?? true) && !!options.schemaId && !!options.identifier,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches a specific revision by ID for detailed inspection or comparison.
 *
 * While {@link useRevisions} returns all revisions for an item, this hook fetches a single
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
 * Use this hook when you need to:
 * - Display detailed information about a specific revision
 * - Compare two specific revisions side-by-side
 * - Preview content from a previous revision
 * - Build rollback or restore functionality
 * - Audit specific state changes
 *
 * @param options - Configuration options including schema ID, item identifier, and revision ID
 *
 * @returns TanStack Query result object containing:
 *   - `data`: The revision object with full metadata
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch the revision
 *
 * @example
 * Basic usage - revision details viewer:
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
 *   const { data: revision, isLoading, error } = useRevision({
 *     schemaId,
 *     identifier,
 *     revisionId,
 *   })
 *
 *   if (isLoading) return <div>Loading revision...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!revision) return <div>Revision not found</div>
 *
 *   return (
 *     <div className="revision-details">
 *       <h3>Revision {revision.identifier}</h3>
 *       <div className="metadata">
 *         <div className="field">
 *           <label>State:</label>
 *           <span className={`state-badge state-${revision.state}`}>
 *             {revision.state}
 *           </span>
 *         </div>
 *         <div className="field">
 *           <label>Modified:</label>
 *           <time>{new Date(revision.modified).toLocaleString()}</time>
 *         </div>
 *         <div className="field">
 *           <label>Status:</label>
 *           <span>{revision.published ? 'Published' : 'Not Published'}</span>
 *         </div>
 *       </div>
 *       {revision.message && (
 *         <div className="message">
 *           <h4>Change Message</h4>
 *           <blockquote>{revision.message}</blockquote>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Revision selector with detailed preview:
 * ```tsx
 * function RevisionSelector({
 *   schemaId,
 *   identifier,
 * }: {
 *   schemaId: string
 *   identifier: string
 * }) {
 *   const { data: revisions } = useRevisions({ schemaId, identifier })
 *   const [selectedRevisionId, setSelectedRevisionId] = useState<string>()
 *
 *   const { data: selectedRevision } = useRevision({
 *     schemaId,
 *     identifier,
 *     revisionId: selectedRevisionId!,
 *     enabled: !!selectedRevisionId,
 *   })
 *
 *   return (
 *     <div className="revision-selector">
 *       <div className="selector-panel">
 *         <h3>Select a Revision</h3>
 *         <select
 *           value={selectedRevisionId || ''}
 *           onChange={(e) => setSelectedRevisionId(e.target.value)}
 *         >
 *           <option value="">Choose a revision...</option>
 *           {revisions?.map(rev => (
 *             <option key={rev.identifier} value={rev.identifier}>
 *               {rev.state} - {new Date(rev.modified).toLocaleDateString()}
 *               {rev.published && ' (Current)'}
 *             </option>
 *           ))}
 *         </select>
 *       </div>
 *
 *       {selectedRevision && (
 *         <div className="preview-panel">
 *           <h3>Revision Preview</h3>
 *           <div className="revision-content">
 *             <pre>{JSON.stringify(selectedRevision, null, 2)}</pre>
 *           </div>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Side-by-side revision comparison:
 * ```tsx
 * function RevisionComparison({
 *   schemaId,
 *   identifier,
 *   leftRevisionId,
 *   rightRevisionId,
 * }: {
 *   schemaId: string
 *   identifier: string
 *   leftRevisionId: string
 *   rightRevisionId: string
 * }) {
 *   const { data: leftRevision } = useRevision({
 *     schemaId,
 *     identifier,
 *     revisionId: leftRevisionId,
 *   })
 *
 *   const { data: rightRevision } = useRevision({
 *     schemaId,
 *     identifier,
 *     revisionId: rightRevisionId,
 *   })
 *
 *   if (!leftRevision || !rightRevision) return <div>Loading...</div>
 *
 *   return (
 *     <div className="comparison-view">
 *       <div className="comparison-header">
 *         <h3>Comparing Revisions</h3>
 *       </div>
 *
 *       <div className="comparison-panels">
 *         <div className="left-panel">
 *           <h4>
 *             {leftRevision.state}
 *             <small>{new Date(leftRevision.modified).toLocaleDateString()}</small>
 *           </h4>
 *           {leftRevision.message && <p>{leftRevision.message}</p>}
 *           <pre>{JSON.stringify(leftRevision, null, 2)}</pre>
 *         </div>
 *
 *         <div className="divider">→</div>
 *
 *         <div className="right-panel">
 *           <h4>
 *             {rightRevision.state}
 *             <small>{new Date(rightRevision.modified).toLocaleDateString()}</small>
 *           </h4>
 *           {rightRevision.message && <p>{rightRevision.message}</p>}
 *           <pre>{JSON.stringify(rightRevision, null, 2)}</pre>
 *         </div>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Revision restore with confirmation:
 * ```tsx
 * function RevisionRestore({
 *   schemaId,
 *   identifier,
 *   revisionId,
 * }: {
 *   schemaId: string
 *   identifier: string
 *   revisionId: string
 * }) {
 *   const { data: revision } = useRevision({
 *     schemaId,
 *     identifier,
 *     revisionId,
 *   })
 *   const createRevision = useCreateRevision()
 *   const [showConfirm, setShowConfirm] = useState(false)
 *
 *   const handleRestore = () => {
 *     if (!revision) return
 *
 *     createRevision.mutate(
 *       {
 *         schemaId,
 *         identifier,
 *         revision: {
 *           state: revision.state,
 *           message: `Restored from revision ${revisionId}`,
 *         },
 *       },
 *       {
 *         onSuccess: () => {
 *           setShowConfirm(false)
 *           alert('Revision restored successfully')
 *         },
 *       }
 *     )
 *   }
 *
 *   if (!revision) return <div>Loading...</div>
 *
 *   return (
 *     <>
 *       <div className="revision-restore">
 *         <h4>Restore This Revision?</h4>
 *         <p>State: {revision.state}</p>
 *         <p>Date: {new Date(revision.modified).toLocaleString()}</p>
 *         {revision.message && <p>Message: {revision.message}</p>}
 *
 *         <button onClick={() => setShowConfirm(true)}>
 *           Restore This Version
 *         </button>
 *       </div>
 *
 *       {showConfirm && (
 *         <div className="modal">
 *           <div className="modal-content">
 *             <h3>Confirm Restore</h3>
 *             <p>Are you sure you want to restore this revision?</p>
 *             <p>This will create a new revision with the state: {revision.state}</p>
 *             <div className="actions">
 *               <button onClick={() => setShowConfirm(false)}>Cancel</button>
 *               <button
 *                 onClick={handleRestore}
 *                 disabled={createRevision.isPending}
 *               >
 *                 {createRevision.isPending ? 'Restoring...' : 'Confirm Restore'}
 *               </button>
 *             </div>
 *           </div>
 *         </div>
 *       )}
 *     </>
 *   )
 * }
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
 * This mutation hook transitions a metastore item (like a dataset) from one workflow state
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
 * Use this hook when you need to:
 * - Change the workflow state of metastore items
 * - Implement content moderation workflows
 * - Build publishing/unpublishing functionality
 * - Create audit trails with revision messages
 * - Manage content lifecycle across different states
 *
 * @returns TanStack Mutation object containing:
 *   - `mutate`: Function to create the revision (takes CreateRevisionOptions)
 *   - `mutateAsync`: Async version that returns a Promise
 *   - `isPending`: True while the revision is being created
 *   - `isSuccess`: True if the revision was successfully created
 *   - `isError`: True if creation failed
 *   - `error`: Error object if the mutation failed
 *   - `data`: Response object from the server
 *
 * @example
 * Basic usage - workflow state change form:
 * ```tsx
 * function WorkflowStateChanger({
 *   schemaId,
 *   identifier,
 * }: {
 *   schemaId: string
 *   identifier: string
 * }) {
 *   const createRevision = useCreateRevision()
 *   const [state, setState] = useState<WorkflowState>('draft')
 *   const [message, setMessage] = useState('')
 *
 *   const handleSubmit = (e: React.FormEvent) => {
 *     e.preventDefault()
 *     createRevision.mutate(
 *       {
 *         schemaId,
 *         identifier,
 *         revision: { state, message },
 *       },
 *       {
 *         onSuccess: () => {
 *           alert('State changed successfully!')
 *           setMessage('')
 *         },
 *         onError: (error) => {
 *           alert(`Failed to change state: ${error.message}`)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit} className="state-changer">
 *       <div className="field">
 *         <label>New State:</label>
 *         <select
 *           value={state}
 *           onChange={(e) => setState(e.target.value as WorkflowState)}
 *         >
 *           <option value="draft">Draft</option>
 *           <option value="published">Published</option>
 *           <option value="hidden">Hidden</option>
 *           <option value="archived">Archived</option>
 *           <option value="orphaned">Orphaned</option>
 *         </select>
 *       </div>
 *
 *       <div className="field">
 *         <label>Change Message (optional):</label>
 *         <textarea
 *           value={message}
 *           onChange={(e) => setMessage(e.target.value)}
 *           placeholder="Describe why you're making this change..."
 *         />
 *       </div>
 *
 *       <button type="submit" disabled={createRevision.isPending}>
 *         {createRevision.isPending ? 'Changing State...' : 'Change State'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example
 * Quick action buttons for common state transitions:
 * ```tsx
 * function QuickWorkflowActions({
 *   schemaId,
 *   identifier,
 *   currentState,
 * }: {
 *   schemaId: string
 *   identifier: string
 *   currentState: WorkflowState
 * }) {
 *   const createRevision = useCreateRevision()
 *
 *   const changeState = (newState: WorkflowState, message: string) => {
 *     createRevision.mutate({
 *       schemaId,
 *       identifier,
 *       revision: { state: newState, message },
 *     })
 *   }
 *
 *   return (
 *     <div className="quick-actions">
 *       <h4>Quick Actions</h4>
 *       <div className="action-buttons">
 *         {currentState !== 'published' && (
 *           <button
 *             onClick={() => changeState('published', 'Publishing to production')}
 *             disabled={createRevision.isPending}
 *             className="btn-success"
 *           >
 *             Publish
 *           </button>
 *         )}
 *
 *         {currentState !== 'draft' && (
 *           <button
 *             onClick={() => changeState('draft', 'Moving back to draft')}
 *             disabled={createRevision.isPending}
 *             className="btn-secondary"
 *           >
 *             Unpublish (Draft)
 *           </button>
 *         )}
 *
 *         {currentState !== 'hidden' && (
 *           <button
 *             onClick={() => changeState('hidden', 'Hiding from public view')}
 *             disabled={createRevision.isPending}
 *             className="btn-warning"
 *           >
 *             Hide
 *           </button>
 *         )}
 *
 *         {currentState !== 'archived' && (
 *           <button
 *             onClick={() => changeState('archived', 'Archiving old content')}
 *             disabled={createRevision.isPending}
 *             className="btn-info"
 *           >
 *             Archive
 *           </button>
 *         )}
 *       </div>
 *
 *       {createRevision.isPending && (
 *         <div className="status">Changing state...</div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Workflow with approval process:
 * ```tsx
 * function ApprovalWorkflow({
 *   schemaId,
 *   identifier,
 *   currentState,
 *   userRole,
 * }: {
 *   schemaId: string
 *   identifier: string
 *   currentState: WorkflowState
 *   userRole: 'editor' | 'approver' | 'admin'
 * }) {
 *   const createRevision = useCreateRevision()
 *   const [approvalMessage, setApprovalMessage] = useState('')
 *
 *   const canPublish = userRole === 'approver' || userRole === 'admin'
 *   const canEdit = currentState === 'draft'
 *
 *   const requestApproval = () => {
 *     createRevision.mutate({
 *       schemaId,
 *       identifier,
 *       revision: {
 *         state: 'draft', // Keep as draft but add message
 *         message: 'Requesting approval for publication',
 *       },
 *     })
 *   }
 *
 *   const approve = () => {
 *     if (!approvalMessage) {
 *       alert('Please provide an approval message')
 *       return
 *     }
 *
 *     createRevision.mutate({
 *       schemaId,
 *       identifier,
 *       revision: {
 *         state: 'published',
 *         message: `Approved: ${approvalMessage}`,
 *       },
 *     })
 *   }
 *
 *   const reject = () => {
 *     if (!approvalMessage) {
 *       alert('Please provide a rejection reason')
 *       return
 *     }
 *
 *     createRevision.mutate({
 *       schemaId,
 *       identifier,
 *       revision: {
 *         state: 'draft',
 *         message: `Rejected: ${approvalMessage}`,
 *       },
 *     })
 *   }
 *
 *   return (
 *     <div className="approval-workflow">
 *       <h3>Content Approval</h3>
 *       <p>Current State: <strong>{currentState}</strong></p>
 *
 *       {userRole === 'editor' && currentState === 'draft' && (
 *         <button onClick={requestApproval} disabled={createRevision.isPending}>
 *           Request Approval
 *         </button>
 *       )}
 *
 *       {canPublish && currentState === 'draft' && (
 *         <div className="approver-actions">
 *           <textarea
 *             value={approvalMessage}
 *             onChange={(e) => setApprovalMessage(e.target.value)}
 *             placeholder="Approval/rejection message..."
 *           />
 *           <div className="actions">
 *             <button
 *               onClick={approve}
 *               disabled={createRevision.isPending}
 *               className="btn-success"
 *             >
 *               Approve & Publish
 *             </button>
 *             <button
 *               onClick={reject}
 *               disabled={createRevision.isPending}
 *               className="btn-danger"
 *             >
 *               Reject
 *             </button>
 *           </div>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Batch state change with progress tracking:
 * ```tsx
 * function BulkStateChanger({
 *   schemaId,
 *   identifiers,
 *   targetState,
 * }: {
 *   schemaId: string
 *   identifiers: string[]
 *   targetState: WorkflowState
 * }) {
 *   const createRevision = useCreateRevision()
 *   const [progress, setProgress] = useState(0)
 *   const [isProcessing, setIsProcessing] = useState(false)
 *
 *   const handleBulkChange = async () => {
 *     setIsProcessing(true)
 *     setProgress(0)
 *
 *     for (let i = 0; i < identifiers.length; i++) {
 *       try {
 *         await createRevision.mutateAsync({
 *           schemaId,
 *           identifier: identifiers[i],
 *           revision: {
 *             state: targetState,
 *             message: `Bulk state change to ${targetState}`,
 *           },
 *         })
 *         setProgress(((i + 1) / identifiers.length) * 100)
 *       } catch (error) {
 *         console.error(`Failed to change state for ${identifiers[i]}:`, error)
 *       }
 *     }
 *
 *     setIsProcessing(false)
 *   }
 *
 *   return (
 *     <div className="bulk-state-changer">
 *       <h3>Bulk State Change</h3>
 *       <p>Change {identifiers.length} items to: <strong>{targetState}</strong></p>
 *
 *       <button
 *         onClick={handleBulkChange}
 *         disabled={isProcessing}
 *       >
 *         {isProcessing ? 'Processing...' : 'Start Bulk Change'}
 *       </button>
 *
 *       {isProcessing && (
 *         <div className="progress-bar">
 *           <div
 *             className="progress-fill"
 *             style={{ width: `${progress}%` }}
 *           />
 *           <span>{Math.round(progress)}%</span>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
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
 * This hook provides a streamlined API specifically for changing dataset workflow states without
 * needing to specify the schemaId (which is always 'dataset'). It's the most common way to
 * implement dataset publishing workflows, moderation systems, and content lifecycle management.
 *
 * This hook handles everything {@link useCreateRevision} does, but with a simpler API tailored
 * for the most common use case: managing dataset publication status.
 *
 * Use this hook when you need to:
 * - Publish or unpublish datasets
 * - Implement dataset moderation workflows
 * - Hide datasets from public view temporarily
 * - Archive old or obsolete datasets
 * - Build dataset lifecycle management interfaces
 *
 * @returns TanStack Mutation object containing:
 *   - `mutate`: Function to change state (takes ChangeDatasetStateOptions)
 *   - `mutateAsync`: Async version that returns a Promise
 *   - `isPending`: True while the state change is in progress
 *   - `isSuccess`: True if the state was successfully changed
 *   - `isError`: True if the change failed
 *   - `error`: Error object if the mutation failed
 *   - `data`: Response object from the server
 *
 * @example
 * Basic usage - simple publish button:
 * ```tsx
 * function PublishDatasetButton({ identifier }: { identifier: string }) {
 *   const changeState = useChangeDatasetState()
 *
 *   const handlePublish = () => {
 *     changeState.mutate(
 *       {
 *         identifier,
 *         state: 'published',
 *         message: 'Publishing dataset to production',
 *       },
 *       {
 *         onSuccess: () => {
 *           alert('Dataset published successfully!')
 *         },
 *         onError: (error) => {
 *           alert(`Failed to publish: ${error.message}`)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <button
 *       onClick={handlePublish}
 *       disabled={changeState.isPending}
 *       className="btn-primary"
 *     >
 *       {changeState.isPending ? 'Publishing...' : 'Publish Dataset'}
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * Complete workflow action bar:
 * ```tsx
 * function DatasetWorkflowActions({
 *   identifier,
 *   currentState,
 * }: {
 *   identifier: string
 *   currentState: WorkflowState
 * }) {
 *   const changeState = useChangeDatasetState()
 *
 *   const handleStateChange = (newState: WorkflowState, message: string) => {
 *     if (confirm(`Change dataset state to ${newState}?`)) {
 *       changeState.mutate({ identifier, state: newState, message })
 *     }
 *   }
 *
 *   return (
 *     <div className="workflow-actions">
 *       <div className="current-state">
 *         Current State: <span className={`badge state-${currentState}`}>
 *           {currentState}
 *         </span>
 *       </div>
 *
 *       <div className="action-buttons">
 *         {currentState !== 'draft' && (
 *           <button
 *             onClick={() => handleStateChange('draft', 'Moving back to draft for editing')}
 *             disabled={changeState.isPending}
 *             className="btn-secondary"
 *           >
 *             Unpublish
 *           </button>
 *         )}
 *
 *         {currentState !== 'published' && (
 *           <button
 *             onClick={() => handleStateChange('published', 'Publishing to production')}
 *             disabled={changeState.isPending}
 *             className="btn-success"
 *           >
 *             Publish
 *           </button>
 *         )}
 *
 *         {currentState !== 'hidden' && (
 *           <button
 *             onClick={() => handleStateChange('hidden', 'Temporarily hiding from public view')}
 *             disabled={changeState.isPending}
 *             className="btn-warning"
 *           >
 *             Hide
 *           </button>
 *         )}
 *
 *         {currentState !== 'archived' && (
 *           <button
 *             onClick={() => handleStateChange('archived', 'Archiving obsolete dataset')}
 *             disabled={changeState.isPending}
 *             className="btn-info"
 *           >
 *             Archive
 *           </button>
 *         )}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Publishing workflow with validation:
 * ```tsx
 * function PublishWithValidation({ identifier }: { identifier: string }) {
 *   const { data: dataset } = useDataset({ identifier })
 *   const changeState = useChangeDatasetState()
 *
 *   const validateForPublishing = () => {
 *     const errors: string[] = []
 *
 *     if (!dataset?.title) errors.push('Title is required')
 *     if (!dataset?.description) errors.push('Description is required')
 *     if (!dataset?.distribution || dataset.distribution.length === 0) {
 *       errors.push('At least one distribution is required')
 *     }
 *     if (!dataset?.publisher) errors.push('Publisher is required')
 *
 *     return errors
 *   }
 *
 *   const handlePublish = () => {
 *     const errors = validateForPublishing()
 *
 *     if (errors.length > 0) {
 *       alert('Cannot publish dataset:\n' + errors.join('\n'))
 *       return
 *     }
 *
 *     changeState.mutate({
 *       identifier,
 *       state: 'published',
 *       message: 'Dataset validated and published',
 *     })
 *   }
 *
 *   const errors = validateForPublishing()
 *
 *   return (
 *     <div className="publish-validation">
 *       {errors.length > 0 && (
 *         <div className="validation-errors">
 *           <h4>Fix these issues before publishing:</h4>
 *           <ul>
 *             {errors.map(error => (
 *               <li key={error}>{error}</li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *
 *       <button
 *         onClick={handlePublish}
 *         disabled={errors.length > 0 || changeState.isPending}
 *         className="btn-primary"
 *       >
 *         {changeState.isPending ? 'Publishing...' : 'Publish Dataset'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Scheduled publishing with countdown:
 * ```tsx
 * function ScheduledPublish({
 *   identifier,
 *   publishAt,
 * }: {
 *   identifier: string
 *   publishAt: Date
 * }) {
 *   const changeState = useChangeDatasetState()
 *   const [timeRemaining, setTimeRemaining] = useState('')
 *
 *   useEffect(() => {
 *     const timer = setInterval(() => {
 *       const now = new Date()
 *       const diff = publishAt.getTime() - now.getTime()
 *
 *       if (diff <= 0) {
 *         clearInterval(timer)
 *         // Time to publish!
 *         changeState.mutate({
 *           identifier,
 *           state: 'published',
 *           message: `Scheduled publication at ${publishAt.toISOString()}`,
 *         })
 *       } else {
 *         const hours = Math.floor(diff / (1000 * 60 * 60))
 *         const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
 *         const seconds = Math.floor((diff % (1000 * 60)) / 1000)
 *         setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
 *       }
 *     }, 1000)
 *
 *     return () => clearInterval(timer)
 *   }, [publishAt, identifier, changeState])
 *
 *   return (
 *     <div className="scheduled-publish">
 *       <h4>Scheduled for Publication</h4>
 *       <p>Publishing in: <strong>{timeRemaining}</strong></p>
 *       <p>At: {publishAt.toLocaleString()}</p>
 *       {changeState.isSuccess && (
 *         <div className="success">Dataset published!</div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Batch dataset publication:
 * ```tsx
 * function BulkDatasetPublisher({ identifiers }: { identifiers: string[] }) {
 *   const changeState = useChangeDatasetState()
 *   const [results, setResults] = useState<Array<{ id: string; success: boolean }>>([])
 *   const [isProcessing, setIsProcessing] = useState(false)
 *
 *   const publishAll = async () => {
 *     setIsProcessing(true)
 *     setResults([])
 *
 *     for (const identifier of identifiers) {
 *       try {
 *         await changeState.mutateAsync({
 *           identifier,
 *           state: 'published',
 *           message: 'Bulk publication',
 *         })
 *         setResults(prev => [...prev, { id: identifier, success: true }])
 *       } catch (error) {
 *         setResults(prev => [...prev, { id: identifier, success: false }])
 *       }
 *     }
 *
 *     setIsProcessing(false)
 *   }
 *
 *   const successCount = results.filter(r => r.success).length
 *   const failureCount = results.filter(r => !r.success).length
 *
 *   return (
 *     <div className="bulk-publisher">
 *       <h3>Bulk Dataset Publisher</h3>
 *       <p>Publish {identifiers.length} datasets</p>
 *
 *       <button onClick={publishAll} disabled={isProcessing}>
 *         {isProcessing ? `Publishing... (${results.length}/${identifiers.length})` : 'Publish All'}
 *       </button>
 *
 *       {results.length > 0 && (
 *         <div className="results">
 *           <p className="success">Successfully published: {successCount}</p>
 *           {failureCount > 0 && (
 *             <p className="error">Failed: {failureCount}</p>
 *           )}
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
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
