import { useQuery } from '@tanstack/react-query'
import type { DatasetQueryOptions } from '@dkan-client-tools/core'
import { useDkanClient } from './DkanClientProvider'

export interface UseDatasetSearchOptions {
  /** Search/filter: keyword, fulltext, theme, publisher__name, page, page-size, sort, sort-order */
  searchOptions?: DatasetQueryOptions
  enabled?: boolean
  /** @default 60000 (1 minute) */
  staleTime?: number
  /** @default 300000 (5 minutes) */
  gcTime?: number
}

/**
 * Searches datasets with keyword, theme, publisher filters and pagination.
 *
 * @example
 * ```tsx
 * const { data } = useDatasetSearch({
 *   searchOptions: { keyword: 'health', theme: 'Healthcare', 'page-size': 20 }
 * })
 * // data.total, data.results
 * ```
 */
export function useDatasetSearch(options: UseDatasetSearchOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'search', options.searchOptions || {}] as const,
    queryFn: () => client.searchDatasets(options.searchOptions),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  })
}
