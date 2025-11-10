/**
 * React hooks for DKAN Harvest API operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type {
  HarvestPlan,
  HarvestRun,
  HarvestRunOptions,
  MetastoreWriteResponse,
} from '@dkan-client-tools/core'

export interface UseHarvestPlansOptions {
  enabled?: boolean
  staleTime?: number
}

export interface UseHarvestPlanOptions {
  planId: string
  enabled?: boolean
  staleTime?: number
}

export interface UseHarvestRunsOptions {
  planId: string
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number
}

export interface UseHarvestRunOptions {
  runId: string
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number
}

/**
 * Fetches a list of all harvest plan identifiers configured in the DKAN instance.
 *
 * Harvest plans define how data should be imported from external sources (like
 * data.json catalogs, CKAN instances, or custom API endpoints). Each plan specifies
 * the extraction method, transformation rules, and loading configuration.
 *
 * This hook returns an array of plan identifiers that can be used with other harvest
 * hooks to fetch plan details or execute harvests.
 *
 * Use this hook when you need to:
 * - Display a list of available harvest sources
 * - Build harvest management dashboards
 * - Allow users to select a harvest plan to run
 * - Monitor all configured data ingestion pipelines
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of harvest plan identifier strings
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch the list
 *
 * @example
 * Basic usage - list all harvest plans:
 * ```tsx
 * function HarvestList() {
 *   const { data: plans, isLoading } = useHarvestPlans()
 *
 *   if (isLoading) return <div>Loading harvest plans...</div>
 *
 *   return (
 *     <ul>
 *       {plans?.map(planId => (
 *         <li key={planId}>{planId}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 *
 * @example
 * Harvest plan selector with details:
 * ```tsx
 * function HarvestPlanSelector({ onSelect }: { onSelect: (id: string) => void }) {
 *   const { data: planIds, isLoading } = useHarvestPlans({
 *     staleTime: 300000, // Cache for 5 minutes
 *   })
 *
 *   if (isLoading) return <div>Loading plans...</div>
 *   if (!planIds || planIds.length === 0) {
 *     return <div>No harvest plans configured</div>
 *   }
 *
 *   return (
 *     <div>
 *       <h3>Select Harvest Plan</h3>
 *       <select onChange={(e) => onSelect(e.target.value)}>
 *         <option value="">Choose a plan...</option>
 *         {planIds.map(id => (
 *           <option key={id} value={id}>{id}</option>
 *         ))}
 *       </select>
 *       <p>{planIds.length} harvest plan(s) available</p>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Dashboard with plan cards:
 * ```tsx
 * function HarvestDashboard() {
 *   const { data: planIds } = useHarvestPlans()
 *
 *   return (
 *     <div className="harvest-dashboard">
 *       <h2>Harvest Plans</h2>
 *       <div className="plan-grid">
 *         {planIds?.map(planId => (
 *           <HarvestPlanCard key={planId} planId={planId} />
 *         ))}
 *       </div>
 *     </div>
 *   )
 * }
 *
 * function HarvestPlanCard({ planId }: { planId: string }) {
 *   const { data: plan } = useHarvestPlan({ planId })
 *   const { data: runs } = useHarvestRuns({ planId })
 *
 *   if (!plan) return null
 *
 *   const lastRun = runs?.[0]
 *
 *   return (
 *     <div className="plan-card">
 *       <h3>{planId}</h3>
 *       <p>Source: {plan.extract.uri}</p>
 *       {lastRun && (
 *         <p className="last-run">
 *           Last run: {lastRun.status}
 *         </p>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useHarvestPlan} for fetching details of a specific plan
 * @see {@link useHarvestRuns} for viewing run history
 * @see {@link useRegisterHarvestPlan} for creating new harvest plans
 * @see https://dkan.readthedocs.io/en/latest/components/harvest.html
 */
export function useHarvestPlans(options: UseHarvestPlansOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'plans'] as const,
    queryFn: () => client.listHarvestPlans(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches detailed configuration for a specific harvest plan.
 *
 * Harvest plans contain the complete ETL (Extract, Transform, Load) configuration
 * for importing data from external sources. This includes the source URL, extraction
 * method (e.g., data.json, CKAN API), transformation rules, and loading configuration.
 *
 * Use this hook when you need to:
 * - Display harvest plan configuration details
 * - Build harvest plan editing forms
 * - Show source information before executing a harvest
 * - Validate plan settings before running
 *
 * @param options - Configuration options including the plan identifier
 *
 * @returns TanStack Query result object containing:
 *   - `data`: The complete harvest plan configuration
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch the plan
 *
 * @example
 * Basic usage - display plan details:
 * ```tsx
 * function HarvestPlanDetails({ planId }: { planId: string }) {
 *   const { data: plan, isLoading } = useHarvestPlan({ planId })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!plan) return null
 *
 *   return (
 *     <div>
 *       <h3>{plan.identifier}</h3>
 *       <p>Source: {plan.extract.uri}</p>
 *       <p>Type: {plan.extract.type}</p>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Plan editor with current configuration:
 * ```tsx
 * function HarvestPlanEditor({ planId }: { planId: string }) {
 *   const { data: plan, isLoading } = useHarvestPlan({
 *     planId,
 *     staleTime: 0, // Always fetch fresh data for editing
 *   })
 *   const [editedPlan, setEditedPlan] = useState<HarvestPlan | null>(null)
 *
 *   useEffect(() => {
 *     if (plan) setEditedPlan(plan)
 *   }, [plan])
 *
 *   if (isLoading) return <div>Loading plan...</div>
 *   if (!editedPlan) return null
 *
 *   return (
 *     <form>
 *       <div>
 *         <label>Source URL</label>
 *         <input
 *           value={editedPlan.extract.uri}
 *           onChange={(e) => setEditedPlan({
 *             ...editedPlan,
 *             extract: { ...editedPlan.extract, uri: e.target.value }
 *           })}
 *         />
 *       </div>
 *       <div>
 *         <label>Extract Type</label>
 *         <select
 *           value={editedPlan.extract.type}
 *           onChange={(e) => setEditedPlan({
 *             ...editedPlan,
 *             extract: { ...editedPlan.extract, type: e.target.value }
 *           })}
 *         >
 *           <option value="\\Drupal\\harvest\\ETL\\Extract\\DataJson">data.json</option>
 *           <option value="\\Drupal\\harvest\\ETL\\Extract\\Ckan">CKAN</option>
 *         </select>
 *       </div>
 *       <button type="submit">Save Changes</button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @see {@link useHarvestPlans} for listing all plans
 * @see {@link useHarvestRuns} for viewing execution history
 * @see {@link useRunHarvest} for executing the plan
 */
export function useHarvestPlan(options: UseHarvestPlanOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'plan', options.planId] as const,
    queryFn: () => client.getHarvestPlan(options.planId),
    enabled: (options.enabled ?? true) && !!options.planId,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches the execution history for a specific harvest plan.
 *
 * Each harvest plan can be run multiple times, and this hook retrieves all runs
 * for a given plan. Harvest runs contain status information, timestamps, and
 * statistics about datasets created, updated, or orphaned during the harvest.
 *
 * This hook supports polling via `refetchInterval`, making it ideal for monitoring
 * active harvest operations in real-time.
 *
 * Use this hook when you need to:
 * - Display harvest execution history
 * - Monitor currently running harvests
 * - Show success/failure statistics
 * - Build harvest monitoring dashboards
 * - Track data synchronization status
 *
 * @param options - Configuration options including the plan ID and polling interval
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of harvest run objects with status and statistics
 *   - `isLoading`: True during initial fetch
 *   - `isFetching`: True whenever data is being fetched
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch runs
 *
 * @example
 * Basic usage - display run history:
 * ```tsx
 * function HarvestRunHistory({ planId }: { planId: string }) {
 *   const { data: runs, isLoading } = useHarvestRuns({
 *     planId,
 *     refetchInterval: 5000, // Poll every 5 seconds
 *   })
 *
 *   if (isLoading) return <div>Loading runs...</div>
 *
 *   return (
 *     <ul>
 *       {runs?.map(run => (
 *         <li key={run.identifier}>
 *           Run {run.identifier}: {run.status}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 *
 * @example
 * Real-time monitoring with detailed statistics:
 * ```tsx
 * function HarvestMonitor({ planId }: { planId: string }) {
 *   const { data: runs, isFetching } = useHarvestRuns({
 *     planId,
 *     refetchInterval: 3000, // Poll every 3 seconds
 *     staleTime: 0, // Always refetch
 *   })
 *
 *   const latestRun = runs?.[0]
 *   const isRunning = latestRun?.status === 'running'
 *
 *   return (
 *     <div>
 *       <div className="status-indicator">
 *         {isRunning && <span className="spinner">⟳</span>}
 *         <span>Status: {latestRun?.status || 'No runs yet'}</span>
 *         {isFetching && <small>(updating...)</small>}
 *       </div>
 *
 *       {latestRun?.load_status && (
 *         <div className="statistics">
 *           <h4>Latest Run Statistics</h4>
 *           <p>Created: {latestRun.load_status.created || 0} datasets</p>
 *           <p>Updated: {latestRun.load_status.updated || 0} datasets</p>
 *           <p>Orphaned: {latestRun.load_status.orphaned || 0} datasets</p>
 *           {latestRun.load_status.errors?.length > 0 && (
 *             <p className="errors">
 *               Errors: {latestRun.load_status.errors.length}
 *             </p>
 *           )}
 *         </div>
 *       )}
 *
 *       <h4>Run History</h4>
 *       <table>
 *         <thead>
 *           <tr>
 *             <th>Run ID</th>
 *             <th>Status</th>
 *             <th>Created</th>
 *             <th>Updated</th>
 *           </tr>
 *         </thead>
 *         <tbody>
 *           {runs?.map(run => (
 *             <tr key={run.identifier}>
 *               <td>{run.identifier}</td>
 *               <td>{run.status}</td>
 *               <td>{run.load_status?.created || 0}</td>
 *               <td>{run.load_status?.updated || 0}</td>
 *             </tr>
 *           ))}
 *         </tbody>
 *       </table>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Conditional polling - only poll while harvest is running:
 * ```tsx
 * function SmartHarvestMonitor({ planId }: { planId: string }) {
 *   const { data: runs } = useHarvestRuns({
 *     planId,
 *     // Only poll if latest run is in progress
 *     refetchInterval: (data) => {
 *       const latestRun = data?.[0]
 *       return latestRun?.status === 'running' ? 2000 : false
 *     },
 *   })
 *
 *   const latestRun = runs?.[0]
 *
 *   return (
 *     <div>
 *       <h3>Latest Harvest</h3>
 *       {latestRun?.status === 'running' && (
 *         <div className="progress">
 *           <span>Harvest in progress...</span>
 *           <div className="spinner" />
 *         </div>
 *       )}
 *       {latestRun?.status === 'complete' && (
 *         <div className="success">Harvest completed successfully</div>
 *       )}
 *       {latestRun?.status === 'failed' && (
 *         <div className="error">Harvest failed</div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useHarvestRun} for detailed information about a specific run
 * @see {@link useRunHarvest} for executing a new harvest
 * @see {@link useHarvestPlan} for plan configuration
 */
export function useHarvestRuns(options: UseHarvestRunsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'runs', options.planId] as const,
    queryFn: () => client.listHarvestRuns(options.planId),
    enabled: (options.enabled ?? true) && !!options.planId,
    staleTime: options.staleTime ?? 0, // Default to always refetch
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Fetches detailed information about a specific harvest run execution.
 *
 * Each harvest run represents a single execution of a harvest plan and contains
 * detailed status information, statistics about imported datasets, error logs,
 * and timestamps. This hook is essential for monitoring individual harvest
 * operations and debugging import issues.
 *
 * Like `useHarvestRuns`, this hook supports polling for real-time monitoring
 * of active harvest operations.
 *
 * Use this hook when you need to:
 * - Monitor a specific harvest run in detail
 * - Display comprehensive error information
 * - Track individual dataset import status
 * - Build detailed harvest execution logs
 * - Debug harvest failures
 *
 * @param options - Configuration options including the run ID and polling interval
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Detailed harvest run object with status, statistics, and errors
 *   - `isLoading`: True during initial fetch
 *   - `isFetching`: True whenever data is being fetched
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch run details
 *
 * @example
 * Basic usage - display run status:
 * ```tsx
 * function HarvestRunStatus({ runId }: { runId: string }) {
 *   const { data: run, isLoading } = useHarvestRun({
 *     runId,
 *     refetchInterval: 3000, // Poll while running
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!run) return null
 *
 *   return (
 *     <div>
 *       <h4>Run Status: {run.status}</h4>
 *       {run.load_status && (
 *         <>
 *           <p>Created: {run.load_status.created}</p>
 *           <p>Updated: {run.load_status.updated}</p>
 *           {run.load_status.errors && (
 *             <details>
 *               <summary>Errors ({run.load_status.errors.length})</summary>
 *               <ul>
 *                 {run.load_status.errors.map(err => (
 *                   <li key={err.id}>{err.error}</li>
 *                 ))}
 *               </ul>
 *             </details>
 *           )}
 *         </>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Detailed error reporting:
 * ```tsx
 * function HarvestRunDetails({ runId }: { runId: string }) {
 *   const { data: run, isLoading } = useHarvestRun({ runId })
 *
 *   if (isLoading) return <div>Loading run details...</div>
 *   if (!run) return null
 *
 *   const hasErrors = run.load_status?.errors && run.load_status.errors.length > 0
 *
 *   return (
 *     <div className="harvest-run-details">
 *       <h2>Harvest Run: {run.identifier}</h2>
 *
 *       <div className={`status-badge status-${run.status}`}>
 *         {run.status}
 *       </div>
 *
 *       {run.load_status && (
 *         <div className="statistics">
 *           <h3>Import Statistics</h3>
 *           <div className="stat-grid">
 *             <div className="stat">
 *               <span className="label">Created</span>
 *               <span className="value">{run.load_status.created || 0}</span>
 *             </div>
 *             <div className="stat">
 *               <span className="label">Updated</span>
 *               <span className="value">{run.load_status.updated || 0}</span>
 *             </div>
 *             <div className="stat">
 *               <span className="label">Orphaned</span>
 *               <span className="value">{run.load_status.orphaned || 0}</span>
 *             </div>
 *           </div>
 *         </div>
 *       )}
 *
 *       {hasErrors && (
 *         <div className="errors">
 *           <h3>Errors ({run.load_status.errors.length})</h3>
 *           <table>
 *             <thead>
 *               <tr>
 *                 <th>Dataset ID</th>
 *                 <th>Error Message</th>
 *               </tr>
 *             </thead>
 *             <tbody>
 *               {run.load_status.errors.map((err, idx) => (
 *                 <tr key={idx}>
 *                   <td><code>{err.id}</code></td>
 *                   <td>{err.error}</td>
 *                 </tr>
 *               ))}
 *             </tbody>
 *           </table>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Progress indicator with auto-stop polling:
 * ```tsx
 * function HarvestProgress({ runId }: { runId: string }) {
 *   const { data: run, isFetching } = useHarvestRun({
 *     runId,
 *     // Stop polling when harvest completes
 *     refetchInterval: (data) => {
 *       if (!data) return false
 *       return data.status === 'running' ? 2000 : false
 *     },
 *   })
 *
 *   if (!run) return null
 *
 *   const isComplete = run.status !== 'running'
 *   const total = (run.load_status?.created || 0) +
 *                 (run.load_status?.updated || 0) +
 *                 (run.load_status?.orphaned || 0)
 *
 *   return (
 *     <div className="harvest-progress">
 *       {!isComplete && (
 *         <div className="progress-bar">
 *           <div className="spinner" />
 *           <span>Harvest in progress...</span>
 *           {isFetching && <small>(updating)</small>}
 *         </div>
 *       )}
 *
 *       {isComplete && (
 *         <div className={run.status === 'complete' ? 'success' : 'failed'}>
 *           <strong>
 *             {run.status === 'complete'
 *               ? `✓ Harvest completed - ${total} datasets processed`
 *               : '✗ Harvest failed'}
 *           </strong>
 *           {run.load_status?.errors && run.load_status.errors.length > 0 && (
 *             <p className="errors">
 *               {run.load_status.errors.length} error(s) occurred
 *             </p>
 *           )}
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useHarvestRuns} for listing all runs of a plan
 * @see {@link useRunHarvest} for executing a new harvest
 */
export function useHarvestRun(options: UseHarvestRunOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'run', options.runId] as const,
    queryFn: () => client.getHarvestRun(options.runId),
    enabled: (options.enabled ?? true) && !!options.runId,
    staleTime: options.staleTime ?? 0,
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Registers a new harvest plan in the DKAN system.
 *
 * Harvest plans define the complete ETL (Extract, Transform, Load) configuration
 * for importing data from external sources. This mutation creates a new plan that
 * can then be executed to synchronize data from sources like data.json catalogs,
 * CKAN instances, or other supported APIs.
 *
 * The plan configuration includes:
 * - **Extract**: Source type and URI (e.g., data.json URL, CKAN API endpoint)
 * - **Transform**: Data transformation rules (optional)
 * - **Load**: How datasets should be loaded into DKAN
 *
 * After successful registration, the plan will automatically invalidate the harvest
 * plans list, ensuring UI components display the new plan.
 *
 * Use this hook when you need to:
 * - Create new data import configurations
 * - Register external data sources
 * - Build harvest plan creation forms
 * - Programmatically configure data synchronization
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to register the plan
 *   - `mutateAsync`: Async version that returns a promise
 *   - `isPending`: True while registration is in progress
 *   - `isSuccess`: True if the plan was registered successfully
 *   - `isError`: True if registration failed
 *   - `error`: Error object if the request failed
 *   - `data`: MetastoreWriteResponse with the created plan identifier
 *
 * @example
 * Basic usage - register a data.json harvest plan:
 * ```tsx
 * function CreateHarvestForm() {
 *   const registerPlan = useRegisterHarvestPlan()
 *
 *   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
 *     e.preventDefault()
 *     const formData = new FormData(e.currentTarget)
 *
 *     registerPlan.mutate({
 *       identifier: formData.get('id') as string,
 *       extract: {
 *         type: '\\Drupal\\harvest\\ETL\\Extract\\DataJson',
 *         uri: formData.get('uri') as string,
 *       },
 *       load: {
 *         type: '\\Drupal\\harvest\\Load\\Dataset',
 *       },
 *     })
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="id" placeholder="Plan ID" required />
 *       <input name="uri" placeholder="data.json URL" required />
 *       <button type="submit" disabled={registerPlan.isPending}>
 *         {registerPlan.isPending ? 'Creating...' : 'Create Plan'}
 *       </button>
 *       {registerPlan.isError && <p>Error: {registerPlan.error.message}</p>}
 *       {registerPlan.isSuccess && <p>Plan created successfully!</p>}
 *     </form>
 *   )
 * }
 * ```
 *
 * @example
 * Advanced plan with validation and success handling:
 * ```tsx
 * function HarvestPlanWizard() {
 *   const registerPlan = useRegisterHarvestPlan()
 *   const navigate = useNavigate()
 *   const [planConfig, setPlanConfig] = useState({
 *     identifier: '',
 *     extractType: 'DataJson',
 *     uri: '',
 *   })
 *
 *   const handleCreate = () => {
 *     const extractTypes = {
 *       DataJson: '\\Drupal\\harvest\\ETL\\Extract\\DataJson',
 *       Ckan: '\\Drupal\\harvest\\ETL\\Extract\\Ckan',
 *     }
 *
 *     registerPlan.mutate(
 *       {
 *         identifier: planConfig.identifier,
 *         extract: {
 *           type: extractTypes[planConfig.extractType],
 *           uri: planConfig.uri,
 *         },
 *         load: {
 *           type: '\\Drupal\\harvest\\Load\\Dataset',
 *         },
 *       },
 *       {
 *         onSuccess: (data) => {
 *           toast.success(`Harvest plan "${data.identifier}" created!`)
 *           navigate(`/harvest/plans/${data.identifier}`)
 *         },
 *         onError: (error) => {
 *           toast.error(`Failed to create plan: ${error.message}`)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <div className="wizard">
 *       <h2>Create Harvest Plan</h2>
 *
 *       <div className="form-group">
 *         <label>Plan Identifier</label>
 *         <input
 *           value={planConfig.identifier}
 *           onChange={(e) => setPlanConfig({ ...planConfig, identifier: e.target.value })}
 *           placeholder="my-data-source"
 *         />
 *       </div>
 *
 *       <div className="form-group">
 *         <label>Source Type</label>
 *         <select
 *           value={planConfig.extractType}
 *           onChange={(e) => setPlanConfig({ ...planConfig, extractType: e.target.value })}
 *         >
 *           <option value="DataJson">data.json Catalog</option>
 *           <option value="Ckan">CKAN API</option>
 *         </select>
 *       </div>
 *
 *       <div className="form-group">
 *         <label>Source URL</label>
 *         <input
 *           value={planConfig.uri}
 *           onChange={(e) => setPlanConfig({ ...planConfig, uri: e.target.value })}
 *           placeholder="https://example.com/data.json"
 *           type="url"
 *         />
 *       </div>
 *
 *       <button
 *         onClick={handleCreate}
 *         disabled={registerPlan.isPending || !planConfig.identifier || !planConfig.uri}
 *       >
 *         {registerPlan.isPending ? 'Creating Plan...' : 'Create Plan'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Register plan with filters and transformations:
 * ```tsx
 * function AdvancedHarvestSetup() {
 *   const registerPlan = useRegisterHarvestPlan()
 *
 *   const createFilteredPlan = () => {
 *     registerPlan.mutate({
 *       identifier: 'filtered-source',
 *       extract: {
 *         type: '\\Drupal\\harvest\\ETL\\Extract\\DataJson',
 *         uri: 'https://data.example.com/data.json',
 *       },
 *       transforms: [
 *         {
 *           type: '\\Drupal\\harvest\\Transform\\ResourceImporter',
 *         },
 *       ],
 *       load: {
 *         type: '\\Drupal\\harvest\\Load\\Dataset',
 *       },
 *       // Optional: Add filters to limit what gets imported
 *       filters: [
 *         {
 *           type: 'keyword',
 *           value: ['health', 'education'],
 *         },
 *       ],
 *     })
 *   }
 *
 *   return (
 *     <button onClick={createFilteredPlan} disabled={registerPlan.isPending}>
 *       Create Filtered Harvest Plan
 *     </button>
 *   )
 * }
 * ```
 *
 * @see {@link useHarvestPlans} for listing all registered plans
 * @see {@link useRunHarvest} for executing the plan after registration
 * @see https://dkan.readthedocs.io/en/latest/components/harvest.html
 */
export function useRegisterHarvestPlan() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, HarvestPlan>({
    mutationFn: (plan) => client.registerHarvestPlan(plan),
    onSuccess: () => {
      // Invalidate harvest plans list
      queryClient.invalidateQueries({ queryKey: ['harvest', 'plans'] })
    },
  })
}

/**
 * Executes a harvest run for a registered harvest plan.
 *
 * This mutation triggers the ETL (Extract, Transform, Load) process to import
 * datasets from the configured external source. The harvest runs asynchronously,
 * and this mutation returns immediately with a run identifier that can be used
 * to monitor progress.
 *
 * After execution starts, the hook automatically:
 * - Invalidates the runs list for the plan (to show the new run)
 * - Invalidates the datasets list (as new/updated datasets may be imported)
 *
 * Use this hook when you need to:
 * - Execute data synchronization from external sources
 * - Trigger manual data imports
 * - Refresh dataset catalogs from upstream sources
 * - Build harvest execution interfaces
 *
 * **Note**: Harvests run asynchronously. Use `useHarvestRun` or `useHarvestRuns`
 * with polling to monitor progress and completion status.
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to start the harvest with plan_id
 *   - `mutateAsync`: Async version that returns a promise with the run object
 *   - `isPending`: True while the mutation is being submitted
 *   - `isSuccess`: True if the harvest was successfully started
 *   - `isError`: True if starting the harvest failed
 *   - `error`: Error object if the request failed
 *   - `data`: HarvestRun object with the new run's identifier and initial status
 *
 * @example
 * Basic usage - run harvest button:
 * ```tsx
 * function RunHarvestButton({ planId }: { planId: string }) {
 *   const runHarvest = useRunHarvest()
 *
 *   const handleRun = () => {
 *     runHarvest.mutate(
 *       { plan_id: planId },
 *       {
 *         onSuccess: (result) => {
 *           console.log('Harvest started:', result.identifier)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <button onClick={handleRun} disabled={runHarvest.isPending}>
 *       {runHarvest.isPending ? 'Starting...' : 'Run Harvest'}
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * Run harvest and navigate to monitoring page:
 * ```tsx
 * function HarvestPlanActions({ planId }: { planId: string }) {
 *   const runHarvest = useRunHarvest()
 *   const navigate = useNavigate()
 *
 *   const handleExecute = () => {
 *     runHarvest.mutate(
 *       { plan_id: planId },
 *       {
 *         onSuccess: (run) => {
 *           toast.success(`Harvest started: ${run.identifier}`)
 *           // Navigate to run monitoring page
 *           navigate(`/harvest/runs/${run.identifier}`)
 *         },
 *         onError: (error) => {
 *           toast.error(`Failed to start harvest: ${error.message}`)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <div className="harvest-actions">
 *       <button
 *         onClick={handleExecute}
 *         disabled={runHarvest.isPending}
 *         className="btn-primary"
 *       >
 *         {runHarvest.isPending ? (
 *           <>
 *             <Spinner size="small" />
 *             <span>Starting Harvest...</span>
 *           </>
 *         ) : (
 *           <>
 *             <PlayIcon />
 *             <span>Run Harvest</span>
 *           </>
 *         )}
 *       </button>
 *
 *       {runHarvest.isError && (
 *         <div className="error-message">
 *           {runHarvest.error.message}
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Scheduled harvest with confirmation:
 * ```tsx
 * function ScheduledHarvestManager({ planId, planName }: {
 *   planId: string
 *   planName: string
 * }) {
 *   const runHarvest = useRunHarvest()
 *   const { data: runs } = useHarvestRuns({ planId })
 *   const [showConfirm, setShowConfirm] = useState(false)
 *
 *   // Check if there's already a harvest running
 *   const isRunning = runs?.some(run => run.status === 'running')
 *
 *   const handleConfirmedRun = () => {
 *     runHarvest.mutate(
 *       { plan_id: planId },
 *       {
 *         onSuccess: () => {
 *           setShowConfirm(false)
 *           toast.success('Harvest started successfully')
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={() => setShowConfirm(true)}
 *         disabled={isRunning || runHarvest.isPending}
 *       >
 *         {isRunning ? 'Harvest in Progress' : 'Run Harvest'}
 *       </button>
 *
 *       {showConfirm && (
 *         <Modal onClose={() => setShowConfirm(false)}>
 *           <h3>Confirm Harvest Execution</h3>
 *           <p>
 *             Run harvest for plan "<strong>{planName}</strong>"?
 *           </p>
 *           <p className="warning">
 *             This will import/update datasets from the external source.
 *           </p>
 *           <div className="modal-actions">
 *             <button onClick={() => setShowConfirm(false)}>Cancel</button>
 *             <button
 *               onClick={handleConfirmedRun}
 *               disabled={runHarvest.isPending}
 *               className="btn-primary"
 *             >
 *               {runHarvest.isPending ? 'Starting...' : 'Run Harvest'}
 *             </button>
 *           </div>
 *         </Modal>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useHarvestRun} for monitoring the executed run
 * @see {@link useHarvestRuns} for viewing run history
 * @see {@link useRegisterHarvestPlan} for creating new harvest plans
 */
export function useRunHarvest() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<HarvestRun, Error, HarvestRunOptions>({
    mutationFn: (options) => client.runHarvest(options),
    onSuccess: (data, variables) => {
      // Invalidate runs list for this plan
      queryClient.invalidateQueries({
        queryKey: ['harvest', 'runs', variables.plan_id],
      })
      // Invalidate datasets since harvest may have created/updated them
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
  })
}
