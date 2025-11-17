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
  planId: string
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number
}

/**
 * Fetches all harvest plan identifiers.
 *
 * Harvest plans define ETL configuration for importing data from external sources.
 *
 * @example
 * ```tsx
 * const { data: plans, isLoading } = useHarvestPlans()
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
 * Fetches configuration for a specific harvest plan.
 *
 * @example
 * ```tsx
 * const { data: plan, isLoading } = useHarvestPlan({ planId })
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
 * Fetches execution history for a harvest plan with optional polling.
 *
 * Supports `refetchInterval` for monitoring active harvests.
 *
 * @example
 * ```tsx
 * const { data: runs } = useHarvestRuns({
 *   planId,
 *   refetchInterval: 5000, // Poll every 5 seconds
 * })
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
 * Fetches detailed status and statistics for a specific harvest run.
 *
 * Supports polling for real-time monitoring of active operations.
 *
 * @example
 * ```tsx
 * const { data: run } = useHarvestRun({
 *   runId,
 *   planId,
 *   refetchInterval: 3000,
 * })
 * ```
 */
export function useHarvestRun(options: UseHarvestRunOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'run', options.runId, options.planId] as const,
    queryFn: () => client.getHarvestRun(options.runId, options.planId),
    enabled: (options.enabled ?? true) && !!options.runId && !!options.planId,
    staleTime: options.staleTime ?? 0,
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Creates a new harvest plan with ETL configuration.
 *
 * Invalidates harvest plans list on success.
 *
 * @example
 * ```tsx
 * const registerPlan = useRegisterHarvestPlan()
 * registerPlan.mutate({
 *   identifier: 'my-plan',
 *   extract: {
 *     type: '\\Drupal\\harvest\\ETL\\Extract\\DataJson',
 *     uri: 'https://example.com/data.json',
 *   },
 *   load: { type: '\\Drupal\\harvest\\Load\\Dataset' },
 * })
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
 * Executes a harvest run for a plan.
 *
 * Runs asynchronously. Use `useHarvestRun` or `useHarvestRuns` with polling to monitor progress.
 * Invalidates runs list and datasets on success.
 *
 * @example
 * ```tsx
 * const runHarvest = useRunHarvest()
 * runHarvest.mutate({ plan_id: planId })
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
