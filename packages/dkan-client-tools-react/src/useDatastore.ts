import { useQuery } from '@tanstack/react-query'
import type { DatastoreQueryOptions } from '@dkan-client-tools/core'
import { useDkanClient } from './DkanClientProvider'

/**
 * Configuration options for the useDatastore hook.
 */
export interface UseDatastoreOptions {
  /**
   * The unique identifier (UUID) of the dataset whose data to query.
   *
   * This is the dataset's identifier from the metastore, not the distribution ID.
   */
  datasetId: string

  /**
   * The index of the distribution within the dataset to query.
   *
   * Most datasets have a single distribution (index 0). If a dataset has multiple
   * distributions (e.g., different file formats or time periods), specify which
   * one to query.
   *
   * @default 0
   */
  index?: number

  /**
   * Query options for filtering, sorting, and limiting the datastore results.
   *
   * Supports SQL-like operations:
   * - `conditions`: Filter rows with WHERE-like conditions
   * - `sorts`: Sort results by column(s)
   * - `limit`: Maximum number of rows to return
   * - `offset`: Number of rows to skip (for pagination)
   * - `joins`: Join with other datastores
   *
   * @example { limit: 100, sorts: [{ property: 'date', order: 'desc' }] }
   */
  queryOptions?: DatastoreQueryOptions

  /**
   * Whether the query should automatically execute.
   *
   * Set to `false` to disable the query until manually triggered.
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Time in milliseconds before cached datastore results are considered stale.
   *
   * Datastore data can be large, so longer stale times can improve performance.
   *
   * @default 300000 (5 minutes)
   */
  staleTime?: number

  /**
   * Time in milliseconds before unused cached datastore results are garbage collected.
   *
   * @default 300000 (5 minutes)
   */
  gcTime?: number
}

/**
 * Queries actual data from a DKAN datastore (not just metadata).
 *
 * The datastore contains the actual tabular data referenced by dataset distributions.
 * This hook provides SQL-like querying capabilities including filtering, sorting,
 * pagination, and joins. It's ideal for building data tables, charts, and reports.
 *
 * The datastore API is separate from the metastore API:
 * - **Metastore** contains dataset metadata (title, description, etc.)
 * - **Datastore** contains the actual data rows and columns
 *
 * Results are cached and automatically refetched when data becomes stale.
 *
 * @param options - Configuration options for the datastore query
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Query results with schema and rows
 *   - `isLoading`: True during initial data fetch
 *   - `isFetching`: True whenever data is being fetched
 *   - `isError`: True if the query failed
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually re-query the datastore
 *
 * @example
 * Basic usage - fetch all data from a dataset:
 * ```tsx
 * function DataTable({ datasetId }: { datasetId: string }) {
 *   const { data, isLoading, error } = useDatastore({
 *     datasetId,
 *     queryOptions: { limit: 100 }
 *   })
 *
 *   if (isLoading) return <div>Loading data...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!data) return null
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           {data.schema.fields.map(field => (
 *             <th key={field.name}>{field.name}</th>
 *           ))}
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {data.results.map((row, i) => (
 *           <tr key={i}>
 *             {data.schema.fields.map(field => (
 *               <td key={field.name}>{row[field.name]}</td>
 *             ))}
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   )
 * }
 * ```
 *
 * @example
 * With filtering and sorting:
 * ```tsx
 * function FilteredDataView({ datasetId }: { datasetId: string }) {
 *   const { data } = useDatastore({
 *     datasetId,
 *     queryOptions: {
 *       conditions: [
 *         { property: 'status', value: 'active', operator: '=' },
 *         { property: 'amount', value: 1000, operator: '>' }
 *       ],
 *       sorts: [
 *         { property: 'date', order: 'desc' },
 *         { property: 'amount', order: 'desc' }
 *       ],
 *       limit: 50
 *     }
 *   })
 *
 *   return <DataGrid data={data?.results || []} />
 * }
 * ```
 *
 * @example
 * With pagination:
 * ```tsx
 * function PaginatedDataTable({ datasetId }: { datasetId: string }) {
 *   const [page, setPage] = useState(0)
 *   const pageSize = 20
 *
 *   const { data, isLoading } = useDatastore({
 *     datasetId,
 *     queryOptions: {
 *       limit: pageSize,
 *       offset: page * pageSize,
 *       sorts: [{ property: 'id', order: 'asc' }]
 *     }
 *   })
 *
 *   return (
 *     <div>
 *       <table>
 *         {/* Table rows *\/}
 *       </table>
 *       <div className="pagination">
 *         <button
 *           onClick={() => setPage(p => Math.max(0, p - 1))}
 *           disabled={page === 0 || isLoading}
 *         >
 *           Previous
 *         </button>
 *         <span>Page {page + 1}</span>
 *         <button
 *           onClick={() => setPage(p => p + 1)}
 *           disabled={!data || data.results.length < pageSize || isLoading}
 *         >
 *           Next
 *         </button>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Multiple distributions from the same dataset:
 * ```tsx
 * function MultiDistributionView({ datasetId }: { datasetId: string }) {
 *   // Query first distribution (e.g., CSV data)
 *   const { data: csvData } = useDatastore({
 *     datasetId,
 *     index: 0,
 *     queryOptions: { limit: 100 }
 *   })
 *
 *   // Query second distribution (e.g., historical data)
 *   const { data: histData } = useDatastore({
 *     datasetId,
 *     index: 1,
 *     queryOptions: { limit: 100 }
 *   })
 *
 *   return (
 *     <div>
 *       <section>
 *         <h2>Current Data</h2>
 *         <DataTable data={csvData} />
 *       </section>
 *       <section>
 *         <h2>Historical Data</h2>
 *         <DataTable data={histData} />
 *       </section>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useSqlQuery} for executing custom SQL queries on the datastore
 * @see {@link useDataset} for fetching dataset metadata
 * @see {@link useDownloadQuery} for downloading query results as files
 * @see https://dkan.readthedocs.io/en/latest/apis/datastore.html
 */
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
