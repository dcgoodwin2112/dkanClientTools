/**
 * useDataset - Hook for fetching a single DKAN dataset
 */

import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'

export interface UseDatasetOptions {
  identifier: string
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

export function useDataset(options: UseDatasetOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['dataset', options.identifier] as const,
    queryFn: () => client.fetchDataset(options.identifier),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  })
}
