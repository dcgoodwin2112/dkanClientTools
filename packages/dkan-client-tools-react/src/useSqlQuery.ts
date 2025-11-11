import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type { SqlQueryOptions, SqlQueryResult } from '@dkan-client-tools/core'

/**
 * Configuration options for the useSqlQuery hook.
 */
export interface UseSqlQueryOptions extends SqlQueryOptions {
  /**
   * Whether the query should automatically execute.
   *
   * Set to `false` to disable the query until manually triggered.
   * The query is automatically disabled if the query string is empty.
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Time in milliseconds before cached SQL query results are considered stale.
   *
   * SQL queries can be expensive, so longer stale times improve performance.
   *
   * @default 300000 (5 minutes)
   */
  staleTime?: number

  /**
   * Time in milliseconds before unused cached query results are garbage collected.
   *
   * @default 300000 (5 minutes)
   */
  gcTime?: number
}

/**
 * Executes a SQL query against the DKAN datastore with automatic caching.
 *
 * This hook provides direct SQL access to datastore tables, enabling complex
 * queries including JOINs, aggregations, and custom WHERE clauses that aren't
 * possible with the standard datastore query API.
 *
 * The query results are automatically cached based on the SQL string, so
 * identical queries won't hit the server again until the cache becomes stale.
 * This is ideal for reports, dashboards, and complex data analysis.
 *
 * **Note**: The datastore table name follows the pattern `datastore_{dataset_id}_{index}`.
 *
 * @param options - SQL query configuration with caching options
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of row objects from the query results
 *   - `isLoading`: True during initial query execution
 *   - `isFetching`: True whenever the query is executing
 *   - `isError`: True if the query failed
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually re-execute the query
 *
 * @example
 * ```tsx
 * function SqlQueryResults() {
 *   const { data, isLoading, error } = useSqlQuery({
 *     query: 'SELECT * FROM datastore_12345 LIMIT 10',
 *     show_db_columns: false,
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!data) return null
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           {Object.keys(data[0] || {}).map(key => (
 *             <th key={key}>{key}</th>
 *           ))}
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {data.map((row, i) => (
 *           <tr key={i}>
 *             {Object.values(row).map((val, j) => (
 *               <td key={j}>{String(val)}</td>
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
 * ```tsx
 * function AggregateReport({ tableName }: { tableName: string }) {
 *   const { data: stats, isLoading } = useSqlQuery({
 *     query: `
 *       SELECT
 *         COUNT(*) as total_records,
 *         AVG(value) as avg_value,
 *         MAX(value) as max_value,
 *         MIN(value) as min_value
 *       FROM ${tableName}
 *     `,
 *     enabled: !!tableName,
 *     staleTime: 60000, // Cache for 1 minute
 *   })
 *
 *   if (isLoading) return <div>Loading statistics...</div>
 *   if (!stats?.[0]) return null
 *
 *   const row = stats[0]
 *   return (
 *     <div>
 *       <h3>Dataset Statistics</h3>
 *       <dl>
 *         <dt>Total Records:</dt>
 *         <dd>{row.total_records}</dd>
 *         <dt>Average Value:</dt>
 *         <dd>{Number(row.avg_value).toFixed(2)}</dd>
 *         <dt>Max Value:</dt>
 *         <dd>{row.max_value}</dd>
 *         <dt>Min Value:</dt>
 *         <dd>{row.min_value}</dd>
 *       </dl>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * function DynamicSqlQuery() {
 *   const [query, setQuery] = useState('')
 *   const [executedQuery, setExecutedQuery] = useState('')
 *
 *   const { data, isLoading, error } = useSqlQuery({
 *     query: executedQuery,
 *     enabled: !!executedQuery,
 *   })
 *
 *   return (
 *     <div>
 *       <textarea
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="Enter SQL query..."
 *         rows={5}
 *       />
 *       <button onClick={() => setExecutedQuery(query)}>
 *         Execute Query
 *       </button>
 *
 *       {isLoading && <div>Executing...</div>}
 *       {error && <div>Error: {error.message}</div>}
 *       {data && (
 *         <pre>{JSON.stringify(data, null, 2)}</pre>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useSqlQuery(options: UseSqlQueryOptions) {
  const client = useDkanClient()
  const { enabled, staleTime, gcTime, ...sqlOptions } = options

  return useQuery({
    queryKey: ['datastore', 'sql', (sqlOptions as SqlQueryOptions).query, (sqlOptions as SqlQueryOptions).show_db_columns] as const,
    queryFn: () => client.querySql(sqlOptions as SqlQueryOptions),
    enabled: (enabled ?? true) && !!(sqlOptions as SqlQueryOptions).query,
    staleTime,
    gcTime,
  })
}

/**
 * Executes a SQL query on demand as a mutation (no automatic execution or caching).
 *
 * Unlike `useSqlQuery` which executes automatically and caches results, this
 * mutation hook only executes when you explicitly call `mutate()` or `mutateAsync()`.
 * This is ideal for:
 * - User-triggered queries (button clicks)
 * - Dynamic query builders
 * - One-time data exports
 * - Queries that shouldn't be cached
 *
 * The mutation automatically caches the result using the same cache key as
 * `useSqlQuery`, so subsequent calls to `useSqlQuery` with the same query will
 * use the cached data.
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to execute the query
 *   - `mutateAsync`: Async version that returns a promise with the results
 *   - `isPending`: True while the query is executing
 *   - `isError`: True if the query failed
 *   - `isSuccess`: True if the query succeeded
 *   - `error`: Error object if the request failed
 *   - `data`: Query results (array of row objects)
 *
 * @example
 * ```tsx
 * function SqlQueryExecutor() {
 *   const executeSql = useExecuteSqlQuery()
 *   const [query, setQuery] = useState('')
 *
 *   const handleExecute = () => {
 *     executeSql.mutate(
 *       { query },
 *       {
 *         onSuccess: (data) => {
 *           console.log('Query returned', data.length, 'rows')
 *         },
 *         onError: (error) => {
 *           alert('Query failed: ' + error.message)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <div>
 *       <textarea
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="SELECT * FROM ..."
 *       />
 *       <button onClick={handleExecute} disabled={executeSql.isPending}>
 *         {executeSql.isPending ? 'Executing...' : 'Execute'}
 *       </button>
 *
 *       {executeSql.data && (
 *         <div>
 *           <h4>Results ({executeSql.data.length} rows)</h4>
 *           <pre>{JSON.stringify(executeSql.data, null, 2)}</pre>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * function DataExplorer({ tableName }: { tableName: string }) {
 *   const executeSql = useExecuteSqlQuery()
 *   const [whereClause, setWhereClause] = useState('')
 *   const [limit, setLimit] = useState(100)
 *
 *   const handleQuery = () => {
 *     const query = `
 *       SELECT * FROM ${tableName}
 *       ${whereClause ? `WHERE ${whereClause}` : ''}
 *       LIMIT ${limit}
 *     `
 *     executeSql.mutate({ query, show_db_columns: false })
 *   }
 *
 *   return (
 *     <div>
 *       <input
 *         type="text"
 *         value={whereClause}
 *         onChange={(e) => setWhereClause(e.target.value)}
 *         placeholder="WHERE clause (optional)"
 *       />
 *       <input
 *         type="number"
 *         value={limit}
 *         onChange={(e) => setLimit(Number(e.target.value))}
 *         min={1}
 *         max={10000}
 *       />
 *       <button onClick={handleQuery} disabled={executeSql.isPending}>
 *         Query Data
 *       </button>
 *
 *       {executeSql.data && (
 *         <DataTable data={executeSql.data} />
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useExecuteSqlQuery() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<SqlQueryResult, Error, SqlQueryOptions>({
    mutationFn: (options) => client.querySql(options),
    onSuccess: (data, variables) => {
      // Optionally cache the result using the same key as useSqlQuery
      queryClient.setQueryData(
        ['datastore', 'sql', variables.query, variables.show_db_columns],
        data
      )
    },
  })
}
