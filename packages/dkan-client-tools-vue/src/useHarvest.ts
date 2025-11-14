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
 * Fetches all harvest plan identifiers with automatic caching.
 *
 * Harvest plans define automated ETL (Extract, Transform, Load) processes for importing
 * datasets from external data sources into DKAN. This composable retrieves a list of all
 * registered harvest plan IDs, which you can then use to fetch individual plan details or
 * trigger harvest runs.
 *
 * **What is a Harvest Plan?**
 * A harvest plan automates the process of importing datasets from external catalogs:
 * - **Extract**: Fetch data from an external source (data.json, Socrata, etc.)
 * - **Transform**: Convert the external format to DCAT-US schema
 * - **Load**: Import datasets into DKAN's metastore
 *
 * Common harvest sources include data.json files from other open data portals, Socrata
 * platforms, and custom data feeds.
 *
 * **Returns**: An array of harvest plan identifier strings that can be used with other
 * harvest composables to fetch plan details or manage harvest runs.
 *
 * Use this composable when you need to:
 * - Display a list of all harvest plans
 * - Build harvest plan selection interfaces
 * - Create harvest management dashboards
 * - Show available data sources
 * - Build harvest monitoring tools
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Vue Query result object containing array of harvest plan IDs
 *
 * @example
 * Basic harvest plan list:
 * ```vue
 * <script setup lang="ts">
 * import { useHarvestPlans } from '@dkan-client-tools/vue'
 *
 * const { data: plans, isLoading } = useHarvestPlans()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading harvest plans...</div>
 *   <ul v-else-if="plans">
 *     <li v-for="planId in plans" :key="planId">
 *       {{ planId }}
 *     </li>
 *   </ul>
 * </template>
 * ```
 *
 * @example
 * Harvest dashboard with plan cards:
 * ```vue
 * <script setup lang="ts">
 * import { useHarvestPlans, useHarvestPlan } from '@dkan-client-tools/vue'
 * import { useRouter } from 'vue-router'
 *
 * const { data: planIds, isLoading } = useHarvestPlans()
 * const router = useRouter()
 *
 * function viewPlan(planId: string) {
 *   router.push(`/harvest/${planId}`)
 * }
 * </script>
 *
 * <template>
 *   <div class="harvest-dashboard">
 *     <h1>Harvest Plans</h1>
 *     <p v-if="planIds">{{ planIds.length }} harvest plans configured</p>
 *
 *     <div v-if="isLoading" class="loading">Loading...</div>
 *
 *     <div v-else-if="planIds && planIds.length > 0" class="plan-grid">
 *       <div
 *         v-for="planId in planIds"
 *         :key="planId"
 *         class="plan-card"
 *         @click="viewPlan(planId)"
 *       >
 *         <h3>{{ planId }}</h3>
 *         <p>Click to view details and run history</p>
 *       </div>
 *     </div>
 *
 *     <p v-else>No harvest plans found. Create one to start importing data.</p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Plan selector with quick actions:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useHarvestPlans, useRunHarvest } from '@dkan-client-tools/vue'
 *
 * const { data: planIds } = useHarvestPlans()
 * const runHarvest = useRunHarvest()
 * const selectedPlan = ref<string>()
 *
 * function handleRunHarvest() {
 *   if (selectedPlan.value) {
 *     runHarvest.mutate(
 *       { plan_id: selectedPlan.value },
 *       {
 *         onSuccess: () => {
 *           alert('Harvest started successfully!')
 *         },
 *       }
 *     )
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="harvest-controls">
 *     <label for="plan-select">Select Harvest Plan:</label>
 *     <select id="plan-select" v-model="selectedPlan">
 *       <option :value="undefined">-- Select a plan --</option>
 *       <option v-for="planId in planIds" :key="planId" :value="planId">
 *         {{ planId }}
 *       </option>
 *     </select>
 *
 *     <button
 *       @click="handleRunHarvest"
 *       :disabled="!selectedPlan || runHarvest.isPending"
 *     >
 *       {{ runHarvest.isPending ? 'Starting...' : 'Run Harvest' }}
 *     </button>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useHarvestPlan} to fetch details for a specific harvest plan
 * @see {@link useHarvestRuns} to view harvest run history
 * @see {@link useRegisterHarvestPlan} to create new harvest plans
 * @see {@link useRunHarvest} to execute a harvest
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
 * Fetches detailed configuration for a specific harvest plan with automatic caching and reactivity.
 *
 * Retrieves the complete harvest plan configuration including extract source settings, transform
 * rules, and load options. This information defines how data is imported from external sources
 * into DKAN's catalog.
 *
 * **Harvest Plan Structure**:
 * - `identifier`: Unique plan ID
 * - `extract`: Source configuration (URI, type, headers, auth)
 * - `transforms`: Optional data transformation rules
 * - `load`: Destination configuration (usually Dataset loader)
 *
 * **Common Extract Types**:
 * - `\\Drupal\\harvest\\ETL\\Extract\\DataJson` - Federal data.json standard
 * - Custom extractors for Socrata, ArcGIS, etc.
 *
 * **Reactive Plan ID**: The planId parameter accepts refs or computed values. When it changes,
 * the query automatically re-executes to fetch the new plan details.
 *
 * Use this composable when you need to:
 * - Display harvest plan configuration details
 * - Show source URL and connection settings
 * - Build harvest plan editors
 * - Validate plan configuration before running
 * - Monitor harvest source availability
 *
 * @param options - Configuration options including the plan ID
 *
 * @returns TanStack Vue Query result object containing the harvest plan
 *
 * @example
 * Basic harvest plan details:
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
 *     <p><strong>Source:</strong> {{ plan.extract.uri }}</p>
 *     <p><strong>Type:</strong> {{ plan.extract.type }}</p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Comprehensive plan viewer with all configuration:
 * ```vue
 * <script setup lang="ts">
 * import { useHarvestPlan, useHarvestRuns } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const { data: plan, isLoading } = useHarvestPlan({ planId: props.planId })
 * const { data: runs } = useHarvestRuns({ planId: props.planId })
 *
 * const lastRun = computed(() => runs.value?.[0])
 * </script>
 *
 * <template>
 *   <div v-if="isLoading" class="loading">Loading plan...</div>
 *   <div v-else-if="plan" class="plan-details">
 *     <header>
 *       <h2>{{ plan.identifier }}</h2>
 *       <span v-if="lastRun" class="status-badge" :class="lastRun.status">
 *         Last run: {{ lastRun.status }}
 *       </span>
 *     </header>
 *
 *     <section class="extract-config">
 *       <h3>Extract Configuration</h3>
 *       <dl>
 *         <dt>Source URI:</dt>
 *         <dd><a :href="plan.extract.uri" target="_blank">{{ plan.extract.uri }}</a></dd>
 *
 *         <dt>Extractor Type:</dt>
 *         <dd><code>{{ plan.extract.type }}</code></dd>
 *
 *         <template v-if="plan.extract.headers">
 *           <dt>Custom Headers:</dt>
 *           <dd>
 *             <pre>{{ JSON.stringify(plan.extract.headers, null, 2) }}</pre>
 *           </dd>
 *         </template>
 *       </dl>
 *     </section>
 *
 *     <section v-if="plan.transforms && plan.transforms.length > 0" class="transforms">
 *       <h3>Transforms</h3>
 *       <ul>
 *         <li v-for="(transform, i) in plan.transforms" :key="i">
 *           {{ transform }}
 *         </li>
 *       </ul>
 *     </section>
 *
 *     <section class="load-config">
 *       <h3>Load Configuration</h3>
 *       <p><code>{{ plan.load.type }}</code></p>
 *     </section>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Reactive plan switching with dropdown:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useHarvestPlans, useHarvestPlan } from '@dkan-client-tools/vue'
 *
 * const { data: planIds } = useHarvestPlans()
 * const selectedPlanId = ref<string>()
 *
 * // Automatically refetches when selectedPlanId changes
 * const { data: plan, isFetching } = useHarvestPlan({
 *   planId: selectedPlanId,
 *   enabled: () => !!selectedPlanId.value,
 * })
 * </script>
 *
 * <template>
 *   <div class="plan-switcher">
 *     <select v-model="selectedPlanId">
 *       <option :value="undefined">-- Select a plan --</option>
 *       <option v-for="id in planIds" :key="id" :value="id">
 *         {{ id }}
 *       </option>
 *     </select>
 *
 *     <div v-if="isFetching" class="loading">Loading...</div>
 *     <div v-else-if="plan" class="plan-summary">
 *       <h3>{{ plan.identifier }}</h3>
 *       <p>Harvests from: {{ plan.extract.uri }}</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useHarvestPlans} to list all available harvest plans
 * @see {@link useHarvestRuns} to view run history for this plan
 * @see {@link useRunHarvest} to execute this harvest plan
 * @see {@link useRegisterHarvestPlan} to create or update harvest plans
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
 * Fetches harvest run history for a specific plan with automatic polling support.
 *
 * Retrieves the list of all harvest executions for a given plan, including their status, timestamps,
 * and results. This composable is essential for monitoring harvest progress and viewing historical
 * runs. It supports automatic polling to provide real-time updates while harvests are running.
 *
 * **Harvest Run Information**:
 * - `identifier`: Unique run ID
 * - `status`: Current status (e.g., "SUCCESS", "FAILURE", "RUNNING")
 * - `extract_status`: Details about the extraction phase
 * - `load_status`: Details about the load phase (datasets created/updated, errors)
 *
 * **Real-Time Monitoring**: Use the `refetchInterval` option to automatically poll for updates
 * while harvests are running. Set to `false` to disable polling, or provide milliseconds for
 * polling frequency (e.g., 5000 for every 5 seconds).
 *
 * **Reactive Plan ID**: The planId parameter accepts refs or computed values. When it changes,
 * the query automatically switches to show runs for the new plan.
 *
 * Use this composable when you need to:
 * - Display harvest execution history
 * - Monitor active harvest runs in real-time
 * - Show harvest success/failure rates
 * - Build harvest monitoring dashboards
 * - Track datasets imported by harvest runs
 * - Display error logs for failed harvests
 *
 * @param options - Configuration options including plan ID and polling settings
 *
 * @returns TanStack Vue Query result object containing array of harvest runs
 *
 * @example
 * Basic run history with polling:
 * ```vue
 * <script setup lang="ts">
 * import { useHarvestRuns } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const { data: runs, isLoading } = useHarvestRuns({
 *   planId: props.planId,
 *   refetchInterval: 5000, // Poll every 5 seconds
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading runs...</div>
 *   <ul v-else-if="runs">
 *     <li v-for="run in runs" :key="run.identifier">
 *       Run {{ run.identifier }}: {{ run.status }}
 *     </li>
 *   </ul>
 * </template>
 * ```
 *
 * @example
 * Comprehensive run history with status indicators:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useHarvestRuns } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const { data: runs, isLoading, isFetching } = useHarvestRuns({
 *   planId: props.planId,
 *   refetchInterval: 3000,
 * })
 *
 * const activeRun = computed(() =>
 *   runs.value?.find((r) => r.status === 'RUNNING')
 * )
 *
 * function getStatusClass(status: string): string {
 *   switch (status) {
 *     case 'SUCCESS':
 *       return 'status-success'
 *     case 'FAILURE':
 *       return 'status-error'
 *     case 'RUNNING':
 *       return 'status-running'
 *     default:
 *       return 'status-unknown'
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="harvest-runs">
 *     <h3>Harvest History</h3>
 *
 *     <div v-if="activeRun" class="active-run-banner">
 *       <span class="spinner"></span>
 *       Harvest is currently running...
 *     </div>
 *
 *     <div v-if="isFetching && !isLoading" class="refresh-indicator">
 *       Updating...
 *     </div>
 *
 *     <div v-if="isLoading">Loading history...</div>
 *     <table v-else-if="runs && runs.length > 0" class="runs-table">
 *       <thead>
 *         <tr>
 *           <th>Run ID</th>
 *           <th>Status</th>
 *           <th>Created</th>
 *           <th>Updated</th>
 *           <th>Results</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="run in runs" :key="run.identifier">
 *           <td>{{ run.identifier }}</td>
 *           <td>
 *             <span class="status-badge" :class="getStatusClass(run.status)">
 *               {{ run.status }}
 *             </span>
 *           </td>
 *           <td>{{ run.load_status?.created || '-' }}</td>
 *           <td>{{ run.load_status?.updated || '-' }}</td>
 *           <td>
 *             <template v-if="run.load_status">
 *               {{ run.load_status.created }} created,
 *               {{ run.load_status.updated }} updated
 *               <span v-if="run.load_status.errors?.length" class="error-count">
 *                 ({{ run.load_status.errors.length }} errors)
 *               </span>
 *             </template>
 *           </td>
 *         </tr>
 *       </tbody>
 *     </table>
 *     <p v-else>No runs found for this harvest plan.</p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Smart polling - only poll when harvests are running:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useHarvestRuns } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const { data: runs } = useHarvestRuns({
 *   planId: props.planId,
 *   // Only poll if there's an active run
 *   refetchInterval: computed(() => {
 *     const hasActiveRun = runs.value?.some((r) => r.status === 'RUNNING')
 *     return hasActiveRun ? 3000 : false
 *   }),
 * })
 *
 * const latestRun = computed(() => runs.value?.[0])
 * const successRate = computed(() => {
 *   if (!runs.value || runs.value.length === 0) return 0
 *   const successful = runs.value.filter((r) => r.status === 'SUCCESS').length
 *   return (successful / runs.value.length) * 100
 * })
 * </script>
 *
 * <template>
 *   <div class="harvest-stats">
 *     <div class="stat-card">
 *       <h4>Latest Run</h4>
 *       <p v-if="latestRun" :class="latestRun.status.toLowerCase()">
 *         {{ latestRun.status }}
 *       </p>
 *       <p v-else>No runs yet</p>
 *     </div>
 *
 *     <div class="stat-card">
 *       <h4>Success Rate</h4>
 *       <p>{{ successRate.toFixed(1) }}%</p>
 *     </div>
 *
 *     <div class="stat-card">
 *       <h4>Total Runs</h4>
 *       <p>{{ runs?.length || 0 }}</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useHarvestRun} to get detailed information about a specific run
 * @see {@link useHarvestPlan} to view the plan configuration
 * @see {@link useRunHarvest} to trigger a new harvest run
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
 * Fetches detailed information about a specific harvest run with automatic polling support.
 *
 * Retrieves comprehensive information about a single harvest execution, including status,
 * extract/load details, error messages, and dataset creation/update counts. This composable
 * supports automatic polling to provide real-time updates while the harvest is running.
 *
 * **Harvest Run Details**:
 * - `identifier`: Unique run ID
 * - `status`: Overall status (SUCCESS, FAILURE, RUNNING)
 * - `extract_status`: Extraction phase details (records fetched, time taken)
 * - `load_status`: Load phase details with:
 *   - `created`: Number of new datasets created
 *   - `updated`: Number of existing datasets updated
 *   - `errors`: Array of error objects for failed items
 *
 * **Real-Time Monitoring**: Use `refetchInterval` to poll for updates while the harvest is
 * running. Once complete, you can disable polling or use a computed interval that only polls
 * when status is "RUNNING".
 *
 * **Reactive Run ID**: The runId parameter accepts refs or computed values. When it changes,
 * the query automatically switches to show details for the new run.
 *
 * Use this composable when you need to:
 * - Monitor a running harvest in real-time
 * - Display detailed harvest execution results
 * - Show error messages for failed harvests
 * - Track dataset creation/update statistics
 * - Build harvest run detail pages
 * - Provide troubleshooting information
 *
 * @param options - Configuration options including run ID and polling settings
 *
 * @returns TanStack Vue Query result object containing the harvest run details
 *
 * @example
 * Basic harvest run monitoring with polling:
 * ```vue
 * <script setup lang="ts">
 * import { useHarvestRun } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ runId: string }>()
 *
 * const { data: run, isLoading } = useHarvestRun({
 *   runId: props.runId,
 *   refetchInterval: 3000, // Poll every 3 seconds
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
 *
 * @example
 * Comprehensive run details with progress indicator:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useHarvestRun } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ runId: string; planId: string }>()
 *
 * // Smart polling - only poll while running
 * const { data: run, isFetching } = useHarvestRun({
 *   runId: props.runId,
 *   planId: props.planId,
 *   refetchInterval: computed(() => {
 *     return run.value?.status === 'RUNNING' ? 2000 : false
 *   }),
 * })
 *
 * const totalProcessed = computed(() => {
 *   if (!run.value?.load_status) return 0
 *   return (run.value.load_status.created || 0) + (run.value.load_status.updated || 0)
 * })
 *
 * const hasErrors = computed(() => {
 *   return run.value?.load_status?.errors && run.value.load_status.errors.length > 0
 * })
 * </script>
 *
 * <template>
 *   <div v-if="run" class="harvest-run-details">
 *     <header class="run-header">
 *       <h2>Harvest Run: {{ run.identifier }}</h2>
 *       <span class="status-badge" :class="run.status.toLowerCase()">
 *         {{ run.status }}
 *       </span>
 *       <span v-if="isFetching" class="updating-indicator">Updating...</span>
 *     </header>
 *
 *     <div v-if="run.status === 'RUNNING'" class="progress-section">
 *       <div class="spinner"></div>
 *       <p>Harvest in progress... {{ totalProcessed }} datasets processed so far</p>
 *     </div>
 *
 *     <section v-if="run.extract_status" class="extract-results">
 *       <h3>Extract Phase</h3>
 *       <dl>
 *         <dt>Records Fetched:</dt>
 *         <dd>{{ run.extract_status.total || 0 }}</dd>
 *       </dl>
 *     </section>
 *
 *     <section v-if="run.load_status" class="load-results">
 *       <h3>Load Phase</h3>
 *       <div class="stats-grid">
 *         <div class="stat-card">
 *           <span class="stat-label">Created</span>
 *           <span class="stat-value">{{ run.load_status.created || 0 }}</span>
 *         </div>
 *         <div class="stat-card">
 *           <span class="stat-label">Updated</span>
 *           <span class="stat-value">{{ run.load_status.updated || 0 }}</span>
 *         </div>
 *         <div v-if="hasErrors" class="stat-card error">
 *           <span class="stat-label">Errors</span>
 *           <span class="stat-value">{{ run.load_status.errors.length }}</span>
 *         </div>
 *       </div>
 *
 *       <details v-if="hasErrors" class="error-details">
 *         <summary>View Error Log ({{ run.load_status.errors.length }} errors)</summary>
 *         <div class="error-list">
 *           <div
 *             v-for="err in run.load_status.errors"
 *             :key="err.id"
 *             class="error-item"
 *           >
 *             <strong>{{ err.id }}</strong>
 *             <pre>{{ err.error }}</pre>
 *           </div>
 *         </div>
 *       </details>
 *     </section>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Live harvest monitor with auto-stop polling:
 * ```vue
 * <script setup lang="ts">
 * import { ref, watch } from 'vue'
 * import { useHarvestRun } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ runId: string }>()
 *
 * const isComplete = ref(false)
 *
 * const { data: run } = useHarvestRun({
 *   runId: props.runId,
 *   // Stop polling when complete
 *   refetchInterval: () => (isComplete.value ? false : 2000),
 * })
 *
 * // Watch for completion
 * watch(
 *   () => run.value?.status,
 *   (status) => {
 *     if (status && ['SUCCESS', 'FAILURE'].includes(status)) {
 *       isComplete.value = true
 *       // Could show notification here
 *       if (status === 'SUCCESS') {
 *         console.log('Harvest completed successfully!')
 *       } else {
 *         console.error('Harvest failed')
 *       }
 *     }
 *   }
 * )
 * </script>
 *
 * <template>
 *   <div v-if="run" class="harvest-monitor">
 *     <div v-if="!isComplete" class="live-indicator">
 *       <span class="pulse"></span>
 *       Live monitoring...
 *     </div>
 *
 *     <div class="status-display">
 *       <h3>{{ run.status }}</h3>
 *       <p v-if="run.load_status">
 *         {{ run.load_status.created }} created, {{ run.load_status.updated }} updated
 *       </p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useHarvestRuns} to view all runs for a plan
 * @see {@link useHarvestPlan} to view the plan configuration
 * @see {@link useRunHarvest} to trigger a new harvest run
 */
export function useHarvestRun(options: UseHarvestRunOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['harvest', 'run', options.runId, options.planId] as const,
    queryFn: () => client.getHarvestRun(toValue(options.runId), toValue(options.planId)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.runId) && !!toValue(options.planId),
    staleTime: options.staleTime ?? 0,
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Registers a new harvest plan with automatic cache invalidation.
 *
 * This mutation-based composable creates new ETL (Extract, Transform, Load) harvest plans that
 * automate importing datasets from external data sources. After successful registration, the
 * harvest plans list cache is automatically invalidated to reflect the new plan.
 *
 * **Harvest Plan Configuration**:
 * - `identifier`: Unique plan ID (must be unique across all plans)
 * - `extract`: Source configuration
 *   - `type`: Extractor class (e.g., `\\Drupal\\harvest\\ETL\\Extract\\DataJson`)
 *   - `uri`: Source URL (data.json endpoint, API URL, etc.)
 *   - `headers`: Optional HTTP headers for authentication
 * - `transforms`: Optional array of transformation classes
 * - `load`: Destination configuration (usually `\\Drupal\\harvest\\Load\\Dataset`)
 *
 * **Common Extractor Types**:
 * - `\\Drupal\\harvest\\ETL\\Extract\\DataJson` - Federal data.json standard
 * - Custom extractors for Socrata, ArcGIS, CSV feeds, etc.
 *
 * **Cache Management**: Automatically invalidates the harvest plans list cache so
 * `useHarvestPlans()` queries will refetch and show the new plan.
 *
 * Use this composable when you need to:
 * - Create automated data import workflows
 * - Connect to external data sources
 * - Set up scheduled dataset synchronization
 * - Build harvest plan management interfaces
 * - Automate metadata harvesting from other portals
 *
 * @returns TanStack Vue Query mutation object for registering harvest plans
 *
 * @example
 * Basic data.json harvest plan creation:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useRegisterHarvestPlan } from '@dkan-client-tools/vue'
 * import { useRouter } from 'vue-router'
 *
 * const registerPlan = useRegisterHarvestPlan()
 * const router = useRouter()
 *
 * const planId = ref('')
 * const sourceUrl = ref('')
 *
 * function handleSubmit() {
 *   registerPlan.mutate(
 *     {
 *       identifier: planId.value,
 *       extract: {
 *         type: '\\Drupal\\harvest\\ETL\\Extract\\DataJson',
 *         uri: sourceUrl.value,
 *       },
 *       load: {
 *         type: '\\Drupal\\harvest\\Load\\Dataset',
 *       },
 *     },
 *     {
 *       onSuccess: (result) => {
 *         router.push(`/harvest/${result.identifier}`)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="handleSubmit">
 *     <input v-model="planId" placeholder="Plan ID" required />
 *     <input v-model="sourceUrl" placeholder="data.json URL" required />
 *     <button type="submit" :disabled="registerPlan.isPending">
 *       {{ registerPlan.isPending ? 'Creating...' : 'Create Plan' }}
 *     </button>
 *     <p v-if="registerPlan.isError" class="error">
 *       Error: {{ registerPlan.error?.message }}
 *     </p>
 *     <p v-if="registerPlan.isSuccess" class="success">
 *       Plan created successfully!
 *     </p>
 *   </form>
 * </template>
 * ```
 *
 * @example
 * Advanced harvest plan with custom headers:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useRegisterHarvestPlan } from '@dkan-client-tools/vue'
 * import type { HarvestPlan } from '@dkan-client-tools/core'
 *
 * const registerPlan = useRegisterHarvestPlan()
 *
 * const planData = ref<HarvestPlan>({
 *   identifier: '',
 *   extract: {
 *     type: '\\Drupal\\harvest\\ETL\\Extract\\DataJson',
 *     uri: '',
 *     headers: {
 *       'Authorization': 'Bearer your-api-token',
 *       'User-Agent': 'DKAN-Harvester',
 *     },
 *   },
 *   load: {
 *     type: '\\Drupal\\harvest\\Load\\Dataset',
 *   },
 * })
 *
 * async function handleCreate() {
 *   try {
 *     const result = await registerPlan.mutateAsync(planData.value)
 *     alert(`Harvest plan "${result.identifier}" created successfully!`)
 *   } catch (error) {
 *     console.error('Failed to create harvest plan:', error)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="harvest-plan-form">
 *     <h2>Create Harvest Plan</h2>
 *
 *     <input
 *       v-model="planData.identifier"
 *       placeholder="Plan identifier"
 *       required
 *     />
 *
 *     <input
 *       v-model="planData.extract.uri"
 *       placeholder="Source URL"
 *       type="url"
 *       required
 *     />
 *
 *     <button @click="handleCreate" :disabled="registerPlan.isPending">
 *       {{ registerPlan.isPending ? 'Creating...' : 'Create Harvest Plan' }}
 *     </button>
 *
 *     <div v-if="registerPlan.isError" class="error">
 *       Failed to create plan: {{ registerPlan.error?.message }}
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useHarvestPlans} to view all registered harvest plans
 * @see {@link useHarvestPlan} to fetch plan details after creation
 * @see {@link useRunHarvest} to execute the newly created plan
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
 * Executes a harvest run with automatic cache invalidation.
 *
 * This mutation-based composable triggers a harvest execution for a specific plan, starting
 * the ETL process to import datasets from the external source. After successful initiation,
 * the run history and dataset caches are automatically invalidated to reflect the new run.
 *
 * **Harvest Execution Process**:
 * 1. Extract: Fetches datasets from the configured external source
 * 2. Transform: Converts external format to DCAT-US schema
 * 3. Load: Imports/updates datasets in DKAN's metastore
 *
 * **Harvest Run Options**:
 * - `plan_id`: ID of the harvest plan to execute (required)
 * - `filter`: Optional filter to limit which items are harvested
 *
 * **Cache Management**: Automatically invalidates:
 * - Run history for this plan (so `useHarvestRuns()` shows the new run)
 * - Dataset list cache (since harvest may create/update datasets)
 *
 * **Monitoring**: After triggering a harvest, use `useHarvestRuns()` or `useHarvestRun()`
 * with polling enabled to monitor the execution progress in real-time.
 *
 * Use this composable when you need to:
 * - Trigger manual harvest executions
 * - Build harvest control interfaces
 * - Refresh data from external sources
 * - Schedule automated harvests (via cron/scheduler)
 * - Test harvest configurations
 * - Re-run failed harvests
 *
 * @returns TanStack Vue Query mutation object for executing harvest runs
 *
 * @example
 * Basic harvest execution with monitoring:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useRunHarvest, useHarvestRuns } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const runHarvest = useRunHarvest()
 * const latestRunId = ref<string>()
 *
 * // Monitor runs with polling
 * const { data: runs } = useHarvestRuns({
 *   planId: props.planId,
 *   refetchInterval: 3000,
 * })
 *
 * function handleRun() {
 *   runHarvest.mutate(
 *     { plan_id: props.planId },
 *     {
 *       onSuccess: (result) => {
 *         latestRunId.value = result.identifier
 *         console.log('Harvest started:', result.identifier)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button @click="handleRun" :disabled="runHarvest.isPending">
 *       {{ runHarvest.isPending ? 'Starting...' : 'Run Harvest' }}
 *     </button>
 *
 *     <div v-if="latestRunId" class="run-status">
 *       Latest run: {{ latestRunId }}
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Harvest with progress monitoring and notifications:
 * ```vue
 * <script setup lang="ts">
 * import { ref, watch } from 'vue'
 * import { useRunHarvest, useHarvestRun } from '@dkan-client-tools/vue'
 * import { useRouter } from 'vue-router'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const runHarvest = useRunHarvest()
 * const router = useRouter()
 * const activeRunId = ref<string>()
 *
 * // Monitor the active run
 * const { data: activeRun } = useHarvestRun({
 *   runId: activeRunId,
 *   enabled: () => !!activeRunId.value,
 *   refetchInterval: () => {
 *     return activeRun.value?.status === 'RUNNING' ? 2000 : false
 *   },
 * })
 *
 * // Watch for completion
 * watch(
 *   () => activeRun.value?.status,
 *   (status) => {
 *     if (status === 'SUCCESS') {
 *       alert(`Harvest completed! ${activeRun.value?.load_status?.created} datasets created.`)
 *     } else if (status === 'FAILURE') {
 *       alert('Harvest failed. Check error logs for details.')
 *     }
 *   }
 * )
 *
 * async function handleStartHarvest() {
 *   try {
 *     const result = await runHarvest.mutateAsync({ plan_id: props.planId })
 *     activeRunId.value = result.identifier
 *     router.push(`/harvest/${props.planId}/runs/${result.identifier}`)
 *   } catch (error) {
 *     console.error('Failed to start harvest:', error)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="harvest-controls">
 *     <button
 *       @click="handleStartHarvest"
 *       :disabled="runHarvest.isPending || activeRun?.status === 'RUNNING'"
 *     >
 *       {{ runHarvest.isPending ? 'Starting...' : 'Run Harvest' }}
 *     </button>
 *
 *     <div v-if="activeRun" class="harvest-status">
 *       <div class="status-badge" :class="activeRun.status.toLowerCase()">
 *         {{ activeRun.status }}
 *       </div>
 *       <template v-if="activeRun.status === 'RUNNING'">
 *         <div class="spinner"></div>
 *         <p>Harvesting data...</p>
 *       </template>
 *       <template v-else-if="activeRun.load_status">
 *         <p>
 *           Created: {{ activeRun.load_status.created }},
 *           Updated: {{ activeRun.load_status.updated }}
 *         </p>
 *       </template>
 *     </div>
 *
 *     <div v-if="runHarvest.isError" class="error">
 *       Failed to start harvest: {{ runHarvest.error?.message }}
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Scheduled harvest with confirmation:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useRunHarvest, useHarvestPlan } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ planId: string }>()
 *
 * const { data: plan } = useHarvestPlan({ planId: props.planId })
 * const runHarvest = useRunHarvest()
 * const showConfirm = ref(false)
 *
 * function requestHarvest() {
 *   showConfirm.value = true
 * }
 *
 * function confirmHarvest() {
 *   runHarvest.mutate(
 *     { plan_id: props.planId },
 *     {
 *       onSuccess: (result) => {
 *         showConfirm.value = false
 *         console.log(`Harvest ${result.identifier} started`)
 *       },
 *     }
 *   )
 * }
 * </script>
 *
 * <template>
 *   <div class="harvest-trigger">
 *     <button @click="requestHarvest" class="btn-primary">
 *       Run Harvest
 *     </button>
 *
 *     <div v-if="showConfirm" class="modal-overlay">
 *       <div class="modal">
 *         <h3>Confirm Harvest</h3>
 *         <p>Run harvest for plan: <strong>{{ plan?.identifier }}</strong></p>
 *         <p>Source: {{ plan?.extract.uri }}</p>
 *         <p>This will import/update datasets from the external source.</p>
 *
 *         <div class="modal-actions">
 *           <button @click="showConfirm = false">Cancel</button>
 *           <button
 *             @click="confirmHarvest"
 *             :disabled="runHarvest.isPending"
 *             class="btn-primary"
 *           >
 *             {{ runHarvest.isPending ? 'Starting...' : 'Start Harvest' }}
 *           </button>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useHarvestRuns} to view run history after execution
 * @see {@link useHarvestRun} to monitor the running harvest
 * @see {@link useHarvestPlan} to view plan details before running
 * @see {@link useRegisterHarvestPlan} to create new harvest plans
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
