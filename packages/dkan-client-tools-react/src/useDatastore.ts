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

/**
 * Configuration options for the useQueryDatastoreMulti hook.
 */
export interface UseQueryDatastoreMultiOptions {
  /**
   * Query options for multi-resource datastore queries.
   *
   * The queryOptions object supports:
   * - `resources`: Array of resource IDs with optional aliases for multi-table queries
   * - `conditions`: Filter rows across resources
   * - `sorts`: Sort combined results
   * - `limit`: Maximum rows to return
   * - `offset`: Skip rows (pagination)
   * - `joins`: Join multiple resources together
   * - `properties`: Select specific columns
   * - `groupings`: Group by columns across resources
   *
   * @example
   * {
   *   resources: [
   *     { id: 'resource-1', alias: 't1' },
   *     { id: 'resource-2', alias: 't2' }
   *   ],
   *   joins: [{
   *     resource: 't2',
   *     condition: { property: 't1.id', value: 't2.ref_id', operator: '=' }
   *   }],
   *   properties: ['t1.name', 't2.value'],
   *   limit: 100
   * }
   */
  queryOptions: DatastoreQueryOptions

  /**
   * HTTP method to use for the query.
   *
   * - `POST`: Better for complex queries, no URL length limits (recommended)
   * - `GET`: Cacheable by CDN/proxy, but may hit URL length limits
   *
   * @default 'POST'
   */
  method?: 'GET' | 'POST'

  /**
   * Whether the query should automatically execute.
   *
   * Set to `false` to disable the query until manually triggered.
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Time in milliseconds before cached results are considered stale.
   *
   * @default 300000 (5 minutes)
   */
  staleTime?: number

  /**
   * Time in milliseconds before unused cached results are garbage collected.
   *
   * @default 300000 (5 minutes)
   */
  gcTime?: number
}

/**
 * Queries multiple datastore resources simultaneously with advanced features like JOINs.
 *
 * This hook provides advanced datastore querying capabilities for working with multiple
 * resources at once. Unlike {@link useDatastore} which queries a single dataset distribution,
 * this hook allows you to:
 *
 * - Query multiple datastore resources in a single request
 * - JOIN resources together using SQL-like conditions
 * - Use resource aliases (t1, t2, etc.) for clearer queries
 * - Perform cross-resource filtering and aggregation
 * - Group results across multiple resources
 *
 * This is particularly useful for complex analytical queries where data is spread across
 * multiple distributions or when you need to combine data from related datasets.
 *
 * **Technical Notes**:
 * - Uses the generic `/api/1/datastore/query` endpoint (not dataset/index-specific)
 * - Supports both GET and POST methods (POST recommended for complex queries)
 * - All resource IDs must refer to imported datastores (not just metastore datasets)
 *
 * @param options - Configuration options including query parameters and method
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Query results with combined schema and joined rows
 *   - `isLoading`: True during initial data fetch
 *   - `isFetching`: True whenever data is being fetched
 *   - `isError`: True if the query failed
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually re-query
 *
 * @example
 * Basic usage - query multiple resources with JOIN:
 * ```tsx
 * function JoinedDataView() {
 *   const { data, isLoading } = useQueryDatastoreMulti({
 *     queryOptions: {
 *       resources: [
 *         { id: 'employees-dist-id', alias: 'emp' },
 *         { id: 'departments-dist-id', alias: 'dept' }
 *       ],
 *       joins: [{
 *         resource: 'dept',
 *         condition: {
 *           property: 'emp.department_id',
 *           value: 'dept.id',
 *           operator: '='
 *         }
 *       }],
 *       properties: [
 *         'emp.name',
 *         'emp.salary',
 *         'dept.department_name'
 *       ],
 *       sorts: [{ property: 'emp.salary', order: 'desc' }],
 *       limit: 50
 *     }
 *   })
 *
 *   if (isLoading) return <div>Loading joined data...</div>
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>Employee</th>
 *           <th>Department</th>
 *           <th>Salary</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {data?.results.map((row, i) => (
 *           <tr key={i}>
 *             <td>{row['emp.name']}</td>
 *             <td>{row['dept.department_name']}</td>
 *             <td>${row['emp.salary']}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   )
 * }
 * ```
 *
 * @example
 * Complex aggregation across multiple resources:
 * ```tsx
 * function SalesAnalytics() {
 *   const { data } = useQueryDatastoreMulti({
 *     queryOptions: {
 *       resources: [
 *         { id: 'sales-2023-id', alias: 's23' },
 *         { id: 'sales-2024-id', alias: 's24' },
 *         { id: 'products-id', alias: 'prod' }
 *       ],
 *       joins: [
 *         {
 *           resource: 'prod',
 *           condition: { property: 's23.product_id', value: 'prod.id', operator: '=' }
 *         },
 *         {
 *           resource: 'prod',
 *           condition: { property: 's24.product_id', value: 'prod.id', operator: '=' }
 *         }
 *       ],
 *       properties: [
 *         'prod.category',
 *         'SUM(s23.amount) as sales_2023',
 *         'SUM(s24.amount) as sales_2024'
 *       ],
 *       groupings: [{ property: 'category', resource: 'prod' }],
 *       sorts: [{ property: 'sales_2024', order: 'desc' }]
 *     },
 *     method: 'POST' // Use POST for complex queries
 *   })
 *
 *   return (
 *     <div className="sales-analytics">
 *       <h2>Year-over-Year Sales by Category</h2>
 *       {data?.results.map((row) => (
 *         <div key={row.category} className="category-stats">
 *           <h3>{row.category}</h3>
 *           <div className="comparison">
 *             <span>2023: ${row.sales_2023}</span>
 *             <span>2024: ${row.sales_2024}</span>
 *             <span>
 *               Growth: {((row.sales_2024 / row.sales_2023 - 1) * 100).toFixed(1)}%
 *             </span>
 *           </div>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Filtered cross-resource query:
 * ```tsx
 * function FilteredMultiResourceView() {
 *   const [minAmount, setMinAmount] = useState(1000)
 *   const [category, setCategory] = useState('all')
 *
 *   const { data, isLoading } = useQueryDatastoreMulti({
 *     queryOptions: {
 *       resources: [
 *         { id: 'transactions-id', alias: 'txn' },
 *         { id: 'customers-id', alias: 'cust' }
 *       ],
 *       joins: [{
 *         resource: 'cust',
 *         condition: { property: 'txn.customer_id', value: 'cust.id', operator: '=' }
 *       }],
 *       conditions: [
 *         { property: 'txn.amount', value: minAmount, operator: '>=' },
 *         ...(category !== 'all'
 *           ? [{ property: 'cust.category', value: category, operator: '=' }]
 *           : []
 *         )
 *       ],
 *       properties: [
 *         'txn.date',
 *         'txn.amount',
 *         'cust.name',
 *         'cust.category'
 *       ],
 *       sorts: [{ property: 'txn.date', order: 'desc' }],
 *       limit: 100
 *     }
 *   })
 *
 *   return (
 *     <div>
 *       <div className="filters">
 *         <label>
 *           Min Amount:
 *           <input
 *             type="number"
 *             value={minAmount}
 *             onChange={(e) => setMinAmount(Number(e.target.value))}
 *           />
 *         </label>
 *         <label>
 *           Category:
 *           <select value={category} onChange={(e) => setCategory(e.target.value)}>
 *             <option value="all">All</option>
 *             <option value="premium">Premium</option>
 *             <option value="standard">Standard</option>
 *           </select>
 *         </label>
 *       </div>
 *
 *       {isLoading && <div>Loading...</div>}
 *
 *       <div className="results">
 *         <p>Found {data?.count || 0} transactions</p>
 *         {data?.results.map((row, i) => (
 *           <div key={i} className="transaction">
 *             <span>{row['cust.name']}</span>
 *             <span>${row['txn.amount']}</span>
 *             <span>{row['txn.date']}</span>
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatastore} for simpler single-resource queries
 * @see {@link useSqlQuery} for raw SQL queries
 * @see https://dkan.readthedocs.io/en/latest/apis/datastore.html
 */
export function useQueryDatastoreMulti(options: UseQueryDatastoreMultiOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'datastore',
      'multi',
      options.queryOptions,
      options.method || 'POST',
    ] as const,
    queryFn: () => client.queryDatastoreMulti(options.queryOptions, options.method),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes
    gcTime: options.gcTime ?? 5 * 60 * 1000,
  })
}
