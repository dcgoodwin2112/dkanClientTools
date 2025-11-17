import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'

export interface UseDatasetOptions {
  /** Dataset identifier (UUID) */
  identifier: string
  enabled?: boolean
  /** @default 300000 (5 minutes) */
  staleTime?: number
  /** @default 300000 (5 minutes) */
  gcTime?: number
}

/**
 * Fetches a single dataset by identifier with DCAT-US metadata.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDataset({ identifier: datasetId })
 * ```
 */
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
