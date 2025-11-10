/**
 * useDatastore - Hook for querying DKAN datastore
 */

import { useQuery } from '@tanstack/react-query'
import type { DatastoreQueryOptions } from '@dkan-client-tools/core'
import { useDkanClient } from './DkanClientProvider'

export interface UseDatastoreOptions {
  datasetId: string
  index?: number
  queryOptions?: DatastoreQueryOptions
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

export function useDatastore(options: UseDatastoreOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'datastore',
      options.datasetId,
      options.index || 0,
      options.queryOptions || {},
    ] as const,
    queryFn: () => client.queryDatastore(options.datasetId, options.index, options.queryOptions),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  })
}
