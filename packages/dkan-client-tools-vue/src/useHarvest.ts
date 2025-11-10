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
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  refetchInterval?: number | false
}

/**
 * Composable to list all harvest plan identifiers
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useHarvestPlans } from '@dkan-client-tools/vue'
 *
 * const { data: plans, isLoading } = useHarvestPlans()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading harvest plans...</div>
 *   <ul v-else>
 *     <li v-for="planId in plans" :key="planId">
 *       {{ planId }}
 *     </li>
 *   </ul>
 * </template>
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
 * Composable to get a specific harvest plan
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useHarvestPlan } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const { data: plan, isLoading } = useHarvestPlan({ planId: props.planId })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="plan">
 *     <h3>{{ plan.identifier }}</h3>
 *     <p>Source: {{ plan.extract.uri }}</p>
 *     <p>Type: {{ plan.extract.type }}</p>
 *   </div>
 * </template>
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
 * Composable to list harvest runs for a specific plan
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useHarvestRuns } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const { data: runs, isLoading } = useHarvestRuns({
 *   planId: props.planId,
 *   refetchInterval: 5000 // Poll every 5 seconds
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading runs...</div>
 *   <ul v-else>
 *     <li v-for="run in runs" :key="run.identifier">
 *       Run {{ run.identifier }}: {{ run.status }}
 *     </li>
 *   </ul>
 * </template>
 * ```
 */
export function useHarvestRuns(options: UseHarvestRunsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'runs', options.planId] as const,
    queryFn: () => client.listHarvestRuns(toValue(options.planId)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.planId),
    staleTime: options.staleTime ?? 0, // Default to always refetch
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Composable to get information about a specific harvest run
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useHarvestRun } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ runId: string }>()
 *
 * const { data: run, isLoading } = useHarvestRun({
 *   runId: props.runId,
 *   refetchInterval: 3000 // Poll while running
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="run">
 *     <h4>Run Status: {{ run.status }}</h4>
 *     <template v-if="run.load_status">
 *       <p>Created: {{ run.load_status.created }}</p>
 *       <p>Updated: {{ run.load_status.updated }}</p>
 *       <details v-if="run.load_status.errors">
 *         <summary>Errors ({{ run.load_status.errors.length }})</summary>
 *         <ul>
 *           <li v-for="err in run.load_status.errors" :key="err.id">
 *             {{ err.error }}
 *           </li>
 *         </ul>
 *       </details>
 *     </template>
 *   </div>
 * </template>
 * ```
 */
export function useHarvestRun(options: UseHarvestRunOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'run', options.runId] as const,
    queryFn: () => client.getHarvestRun(toValue(options.runId)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.runId),
    staleTime: options.staleTime ?? 0,
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Mutation composable to register a new harvest plan
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useRegisterHarvestPlan } from '@dkan-client-tools/vue'
 *
 * const registerPlan = useRegisterHarvestPlan()
 *
 * const handleSubmit = (formData: FormData) => {
 *   registerPlan.mutate({
 *     identifier: formData.get('id') as string,
 *     extract: {
 *       type: '\\Drupal\\harvest\\ETL\\Extract\\DataJson',
 *       uri: formData.get('uri') as string,
 *     },
 *     load: {
 *       type: '\\Drupal\\harvest\\Load\\Dataset',
 *     },
 *   })
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="(e) => handleSubmit(new FormData(e.target as HTMLFormElement))">
 *     <input name="id" placeholder="Plan ID" required />
 *     <input name="uri" placeholder="data.json URL" required />
 *     <button type="submit" :disabled="registerPlan.isPending">
 *       {{ registerPlan.isPending ? 'Creating...' : 'Create Plan' }}
 *     </button>
 *     <p v-if="registerPlan.isError">Error: {{ registerPlan.error.message }}</p>
 *     <p v-if="registerPlan.isSuccess">Plan created successfully!</p>
 *   </form>
 * </template>
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
 * Mutation composable to execute a harvest run
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useRunHarvest } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const runHarvest = useRunHarvest()
 *
 * const handleRun = () => {
 *   runHarvest.mutate(
 *     { plan_id: props.planId },
 *     {
 *       onSuccess: (result) => {
 *         console.log('Harvest started:', result.identifier)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <button @click="handleRun" :disabled="runHarvest.isPending">
 *     {{ runHarvest.isPending ? 'Starting...' : 'Run Harvest' }}
 *   </button>
 * </template>
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
