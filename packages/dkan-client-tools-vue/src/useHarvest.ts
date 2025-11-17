/**
 * Vue composables for DKAN Harvest API operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'
import type {
  HarvestPlan,
  HarvestRun,
  HarvestRunOptions,
  MetastoreWriteResponse,
} from '@dkan-client-tools/core'

export interface UseHarvestPlansOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseHarvestPlanOptions {
  planId: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseHarvestRunsOptions {
  planId: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  refetchInterval?: number | false
}

export interface UseHarvestRunOptions {
  runId: MaybeRefOrGetter<string>
  planId: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  refetchInterval?: number | false
}

/**
 * Fetches all harvest plan identifiers.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: plans } = useHarvestPlans()
 * </script>
 * ```
 */
export function useHarvestPlans(options: UseHarvestPlansOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'plans'] as const,
    queryFn: () => client.listHarvestPlans(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches a specific harvest plan by ID.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: plan } = useHarvestPlan({ planId: 'my-plan' })
 * </script>
 * ```
 */
export function useHarvestPlan(options: UseHarvestPlanOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'plan', options.planId] as const,
    queryFn: () => client.getHarvestPlan(toValue(options.planId)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.planId),
    staleTime: options.staleTime,
  })
}

/**
 * Fetches all harvest runs for a plan.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: runs } = useHarvestRuns({
 *   planId: 'my-plan',
 *   refetchInterval: 5000, // Poll every 5 seconds
 * })
 * </script>
 * ```
 */
export function useHarvestRuns(options: UseHarvestRunsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'runs', options.planId] as const,
    queryFn: () => client.listHarvestRuns(toValue(options.planId)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.planId),
    staleTime: options.staleTime,
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Fetches a specific harvest run by ID.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data: run } = useHarvestRun({
 *   planId: 'my-plan',
 *   runId: 'run-123',
 *   refetchInterval: 3000, // Poll every 3 seconds
 * })
 * </script>
 * ```
 */
export function useHarvestRun(options: UseHarvestRunOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'run', options.planId, options.runId] as const,
    queryFn: () => client.getHarvestRun(toValue(options.planId), toValue(options.runId)),
    enabled: () =>
      (toValue(options.enabled) ?? true) &&
      !!toValue(options.planId) &&
      !!toValue(options.runId),
    staleTime: options.staleTime,
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Registers a new harvest plan.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const registerPlan = useRegisterHarvestPlan()
 *
 * const createPlan = () => {
 *   registerPlan.mutate({
 *     identifier: 'my-plan',
 *     extract: { type: 'DataJson', uri: 'https://example.gov/data.json' },
 *     load: { type: 'simple' },
 *   })
 * }
 * </script>
 * ```
 */
export function useRegisterHarvestPlan() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<MetastoreWriteResponse, Error, HarvestPlan>({
    mutationFn: (plan) => client.registerHarvestPlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvest', 'plans'] })
    },
  })
}

/**
 * Executes a harvest run for a plan.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const runHarvest = useRunHarvest()
 *
 * const startHarvest = () => {
 *   runHarvest.mutate({ planId: 'my-plan' })
 * }
 * </script>
 * ```
 */
export function useRunHarvest() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<HarvestRun, Error, HarvestRunOptions>({
    mutationFn: (options) => client.runHarvest(options),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['harvest', 'runs', variables.plan_id],
      })
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
  })
}
