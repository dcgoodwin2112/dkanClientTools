/**
 * useDataset - Composable for fetching a single DKAN dataset
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'

export interface UseDatasetOptions {
  /** Dataset identifier (UUID). Supports ref, computed, or plain string. */
  identifier: MaybeRefOrGetter<string>
  /** Auto-execute query. Supports reactive values. @default true */
  enabled?: MaybeRefOrGetter<boolean>
  /** Cache staleness duration. @default 300000 (5 minutes) */
  staleTime?: number
  /** Garbage collection time. @default 300000 (5 minutes) */
  gcTime?: number
}

/**
 * Fetches a single dataset by identifier with DCAT-US metadata.
 *
 * Query automatically re-runs when identifier changes. Returns TanStack Vue Query result.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { data, isLoading } = useDataset({
 *   identifier: () => props.datasetId,
 * })
 * </script>
 * ```
 */
export function useDataset(options: UseDatasetOptions) {
  const client = useDkanClient()
  const { identifier, enabled, staleTime, gcTime } = options

  return useQuery({
    queryKey: ['dataset', identifier],
    queryFn: () => client.fetchDataset(toValue(identifier)),
    enabled: () => {
      const isEnabled = toValue(enabled) ?? true
      const hasIdentifier = !!toValue(identifier)
      return isEnabled && hasIdentifier
    },
    staleTime,
    gcTime,
  })
}
