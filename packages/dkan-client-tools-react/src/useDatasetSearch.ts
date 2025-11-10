/**
 * useDatasetSearch - Hook for searching DKAN datasets
 */

import { useQuery } from '@tanstack/react-query'
import type { DatasetQueryOptions } from '@dkan-client-tools/core'
import { useDkanClient } from './DkanClientProvider'

export interface UseDatasetSearchOptions {
  searchOptions?: DatasetQueryOptions
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

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
