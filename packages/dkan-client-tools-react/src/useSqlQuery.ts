/**
 * React hooks for DKAN SQL Query operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type { SqlQueryOptions, SqlQueryResult } from '@dkan-client-tools/core'

export interface UseSqlQueryOptions extends SqlQueryOptions {
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

/**
 * Hook to execute a SQL query against the datastore
 * Caches results based on the query string
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

  return useQuery({
    queryKey: ['datastore', 'sql', options.query, options.show_db_columns] as const,
    queryFn: () =>
      client.querySql({
        query: options.query,
        show_db_columns: options.show_db_columns,
      }),
    enabled: (options.enabled ?? true) && !!options.query,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  })
}

/**
 * Mutation hook to execute a SQL query
 * Useful for queries that should only run on user action
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
