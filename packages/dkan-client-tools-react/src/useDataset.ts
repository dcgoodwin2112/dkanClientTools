import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'

/**
 * Configuration options for the useDataset hook.
 */
export interface UseDatasetOptions {
  /**
   * The unique identifier (UUID) of the dataset to fetch from the DKAN metastore.
   *
   * @example "12345678-1234-1234-1234-123456789abc"
   */
  identifier: string

  /**
   * Whether the query should automatically execute.
   *
   * Set to `false` to disable the query until manually triggered with `refetch()`.
   * The query is automatically disabled when the identifier is empty.
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Time in milliseconds before cached data is considered stale.
   *
   * When data becomes stale, TanStack Query will refetch it in the background
   * to keep the cache fresh. Set to `Infinity` to prevent automatic refetching.
   *
   * @default 300000 (5 minutes)
   */
  staleTime?: number

  /**
   * Time in milliseconds before unused cached data is garbage collected.
   *
   * After this time, if the data is not being used by any component,
   * it will be removed from the cache to free up memory.
   *
   * @default 300000 (5 minutes)
   */
  gcTime?: number
}

/**
 * Fetches a single dataset from DKAN by its unique identifier.
 *
 * This hook uses TanStack Query to automatically cache the dataset and refetch
 * it in the background when the data becomes stale. The query is automatically
 * disabled if no identifier is provided, preventing unnecessary API calls.
 *
 * The returned dataset follows the DCAT-US metadata schema and includes all
 * dataset properties such as title, description, publisher, themes, keywords,
 * and distribution information.
 *
 * @param options - Configuration options for the dataset query
 *
 * @returns TanStack Query result object containing:
 *   - `data`: The dataset object with DCAT-US metadata (undefined while loading)
 *   - `isLoading`: True during the initial fetch (false for cached/refetch)
 *   - `isFetching`: True whenever data is being fetched (initial or background)
 *   - `isError`: True if the query failed
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually refetch the dataset
 *   - `isSuccess`: True when data has been successfully fetched
 *
 * @example
 * Basic usage - fetch and display a dataset:
 * ```tsx
 * function DatasetView({ id }: { id: string }) {
 *   const { data, isLoading, error } = useDataset({ identifier: id })
 *
 *   if (isLoading) return <div>Loading dataset...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!data) return null
 *
 *   return (
 *     <article>
 *       <h1>{data.title}</h1>
 *       <p>{data.description}</p>
 *       <div>Publisher: {data.publisher?.name}</div>
 *       <div>Modified: {new Date(data.modified).toLocaleDateString()}</div>
 *     </article>
 *   )
 * }
 * ```
 *
 * @example
 * With custom stale time to cache data longer:
 * ```tsx
 * const { data } = useDataset({
 *   identifier: datasetId,
 *   staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
 * })
 * ```
 *
 * @example
 * Conditionally enabled query (only fetch when ID is available):
 * ```tsx
 * function DatasetViewer({ id }: { id?: string }) {
 *   const { data, isLoading } = useDataset({
 *     identifier: id || '',
 *     enabled: !!id, // Only fetch when id is truthy
 *   })
 *
 *   if (!id) return <div>No dataset selected</div>
 *   // ... rest of component
 * }
 * ```
 *
 * @example
 * Manual refetch with button:
 * ```tsx
 * function DatasetWithRefresh({ id }: { id: string }) {
 *   const { data, refetch, isFetching } = useDataset({ identifier: id })
 *
 *   return (
 *     <div>
 *       <h1>{data?.title}</h1>
 *       <button onClick={() => refetch()} disabled={isFetching}>
 *         {isFetching ? 'Refreshing...' : 'Refresh Data'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatasetSearch} for searching multiple datasets with filters
 * @see {@link useAllDatasets} for fetching all datasets with pagination
 * @see {@link useUpdateDataset} for updating dataset metadata
 * @see https://dkan.readthedocs.io/en/latest/apis/metastore.html
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
