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
 * Hook to list all harvest plan identifiers
 *
 * @example
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
 * Hook to get a specific harvest plan
 *
 * @example
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
 * Hook to list harvest runs for a specific plan
 *
 * @example
 * ```tsx
 * function HarvestRunHistory({ planId }: { planId: string }) {
 *   const { data: runs, isLoading } = useHarvestRuns({
 *     planId,
 *     refetchInterval: 5000 // Poll every 5 seconds
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
 * Hook to get information about a specific harvest run
 *
 * @example
 * ```tsx
 * function HarvestRunStatus({ runId }: { runId: string }) {
 *   const { data: run, isLoading } = useHarvestRun({
 *     runId,
 *     refetchInterval: 3000 // Poll while running
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
 * Mutation hook to register a new harvest plan
 *
 * @example
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
 * Mutation hook to execute a harvest run
 *
 * @example
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
