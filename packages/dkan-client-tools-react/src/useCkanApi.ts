/**
 * React hooks for CKAN API Compatibility
 * Provides hooks for CKAN-compatible endpoints for legacy tool support
 */

import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type {
  CkanPackageSearchOptions,
  CkanDatastoreSearchOptions,
  CkanDatastoreSearchSqlOptions,
} from '@dkan-client-tools/core'

export interface UseCkanPackageSearchOptions extends CkanPackageSearchOptions {
  enabled?: boolean
  staleTime?: number
}

export interface UseCkanDatastoreSearchOptions extends CkanDatastoreSearchOptions {
  enabled?: boolean
  staleTime?: number
}

export interface UseCkanDatastoreSearchSqlOptions extends CkanDatastoreSearchSqlOptions {
  enabled?: boolean
  staleTime?: number
}

export interface UseCkanResourceShowOptions {
  resourceId: string
  enabled?: boolean
  staleTime?: number
}

export interface UseCkanPackageListOptions {
  enabled?: boolean
  staleTime?: number
}

/**
 * Searches for datasets using CKAN's package_search API format for backward compatibility.
 *
 * DKAN provides a CKAN-compatible API layer to enable existing CKAN-based tools, scripts,
 * and applications to work with DKAN without modification. This hook provides the same
 * search functionality as {@link useDatasetSearch} but uses CKAN's API format and parameter
 * names instead of DKAN's native format.
 *
 * **CKAN Compatibility Features**:
 * - Uses CKAN parameter names (`q`, `rows`, `start` vs DKAN's `fulltext`, `page-size`, `page`)
 * - Returns results in CKAN's response format (with `count` and `results` fields)
 * - Supports CKAN's faceted search syntax (`facet.field`, `facet.limit`)
 * - Compatible with CKAN client libraries and tools
 * - Provides migration path from CKAN to DKAN
 *
 * **When to Use This Hook**:
 * - You're migrating an existing CKAN application to DKAN
 * - You need to maintain compatibility with CKAN-based tools
 * - You're building integrations that work with both CKAN and DKAN
 * - Your team is familiar with CKAN's API format
 *
 * **When to Use {@link useDatasetSearch} Instead**:
 * - You're building a new application from scratch
 * - You want to use DKAN's native API features
 * - You prefer DKAN's more intuitive parameter names
 *
 * Use this hook when you need to:
 * - Migrate existing CKAN applications to DKAN
 * - Build tools that work with both CKAN and DKAN catalogs
 * - Use existing CKAN client libraries with DKAN
 * - Maintain CKAN API compatibility for legacy integrations
 * - Build multi-catalog applications that connect to various open data platforms
 *
 * @param options - Configuration options for the CKAN package search query
 *
 * @returns TanStack React Query result object containing:
 *   - `data`: Search results in CKAN format with `count` and `results` array
 *   - `isLoading`: True during the initial search
 *   - `isFetching`: True whenever a search is executing
 *   - `isError`: True if the search failed
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually re-execute the search
 *
 * @example
 * Basic CKAN-style search:
 * ```tsx
 * function CkanSearchResults() {
 *   const { data, isLoading } = useCkanPackageSearch({
 *     q: 'water quality',
 *     rows: 20,
 *   })
 *
 *   if (isLoading) return <div>Searching...</div>
 *   if (!data) return null
 *
 *   return (
 *     <div>
 *       <h2>Found {data.count} datasets</h2>
 *       {data.results.map(dataset => (
 *         <div key={dataset.identifier}>
 *           <h3>{dataset.title}</h3>
 *           <p>{dataset.description}</p>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * CKAN faceted search with filters:
 * ```tsx
 * function CkanFacetedSearch() {
 *   const [query, setQuery] = useState('climate')
 *   const [selectedOrg, setSelectedOrg] = useState<string>()
 *
 *   const { data, isLoading } = useCkanPackageSearch({
 *     q: query,
 *     rows: 50,
 *     start: 0,
 *     facet: true,
 *     'facet.field': ['organization', 'tags', 'res_format'],
 *     fq: selectedOrg ? `organization:${selectedOrg}` : undefined,
 *   })
 *
 *   return (
 *     <div className="ckan-search">
 *       <input
 *         type="search"
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="Search datasets (CKAN format)..."
 *       />
 *
 *       <div className="results">
 *         <aside className="facets">
 *           <h3>Filter by Organization</h3>
 *           {data?.search_facets?.organization?.items.map((facet) => (
 *             <button
 *               key={facet.name}
 *               onClick={() => setSelectedOrg(facet.name)}
 *               className={selectedOrg === facet.name ? 'active' : ''}
 *             >
 *               {facet.display_name} ({facet.count})
 *             </button>
 *           ))}
 *         </aside>
 *
 *         <main>
 *           <p>{data?.count || 0} datasets found</p>
 *           {data?.results.map((dataset) => (
 *             <article key={dataset.identifier}>
 *               <h2>{dataset.title}</h2>
 *               <p>{dataset.description}</p>
 *               <div className="tags">
 *                 {dataset.keyword?.map((tag) => (
 *                   <span key={tag} className="tag">{tag}</span>
 *                 ))}
 *               </div>
 *             </article>
 *           ))}
 *         </main>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Paginated CKAN search (compatible with CKAN pagination):
 * ```tsx
 * function CkanPaginatedSearch() {
 *   const [page, setPage] = useState(1)
 *   const rowsPerPage = 25
 *
 *   const { data, isLoading, isFetching } = useCkanPackageSearch({
 *     q: '*:*', // CKAN syntax for "all datasets"
 *     rows: rowsPerPage,
 *     start: (page - 1) * rowsPerPage,
 *     sort: 'metadata_modified desc', // CKAN sort syntax
 *   })
 *
 *   const totalPages = data ? Math.ceil(data.count / rowsPerPage) : 0
 *
 *   return (
 *     <div>
 *       <div className="datasets">
 *         {isFetching && <div className="spinner">Loading...</div>}
 *         {data?.results.map((dataset) => (
 *           <div key={dataset.identifier} className="dataset-card">
 *             <h3>{dataset.title}</h3>
 *             <p className="description">{dataset.description}</p>
 *             <p className="metadata">
 *               Last updated: {new Date(dataset.modified).toLocaleDateString()}
 *             </p>
 *           </div>
 *         ))}
 *       </div>
 *
 *       <div className="pagination">
 *         <button
 *           onClick={() => setPage(p => Math.max(1, p - 1))}
 *           disabled={page === 1 || isFetching}
 *         >
 *           Previous
 *         </button>
 *         <span>Page {page} of {totalPages}</span>
 *         <button
 *           onClick={() => setPage(p => p + 1)}
 *           disabled={page >= totalPages || isFetching}
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
 * Migrating a CKAN application to DKAN:
 * ```tsx
 * // Original CKAN client code (before migration):
 * // fetch(`${ckanUrl}/api/3/action/package_search?q=${query}&rows=20`)
 *
 * // After migration to DKAN with React hooks (drop-in replacement):
 * function MigratedCkanApp() {
 *   const [searchTerm, setSearchTerm] = useState('')
 *
 *   // Same parameters as CKAN API - no changes needed!
 *   const { data, isLoading, error } = useCkanPackageSearch({
 *     q: searchTerm || '*:*',
 *     rows: 20,
 *     facet: true,
 *     'facet.field': ['organization', 'groups', 'tags'],
 *   })
 *
 *   if (error) {
 *     return <div className="error">Error: {error.message}</div>
 *   }
 *
 *   return (
 *     <div className="migrated-app">
 *       <h1>Data Catalog (Now Powered by DKAN!)</h1>
 *
 *       <input
 *         type="search"
 *         value={searchTerm}
 *         onChange={(e) => setSearchTerm(e.target.value)}
 *         placeholder="Search datasets..."
 *       />
 *
 *       {isLoading ? (
 *         <div>Loading results...</div>
 *       ) : (
 *         <>
 *           <p className="results-count">
 *             Found {data?.count || 0} datasets
 *           </p>
 *
 *           <div className="results-grid">
 *             {data?.results.map((pkg) => (
 *               <div key={pkg.identifier} className="dataset-card">
 *                 <h2>{pkg.title}</h2>
 *                 <p>{pkg.notes || pkg.description}</p>
 *
 *                 {/* CKAN response includes both 'notes' and 'description' *\/}
 *                 {pkg.organization && (
 *                   <p className="org">
 *                     Organization: {pkg.organization.title}
 *                   </p>
 *                 )}
 *
 *                 <div className="tags">
 *                   {pkg.keyword?.map((tag) => (
 *                     <span key={tag} className="tag">{tag}</span>
 *                   ))}
 *                 </div>
 *               </div>
 *             ))}
 *           </div>
 *         </>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatasetSearch} for DKAN's native dataset search API
 * @see {@link useCkanDatastoreSearch} for CKAN-compatible datastore querying
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.package_search
 */
export function useCkanPackageSearch(options: UseCkanPackageSearchOptions = {}) {
  const client = useDkanClient()
  const { enabled, staleTime, ...searchOptions } = options

  return useQuery({
    queryKey: ['ckan', 'package-search', searchOptions] as const,
    queryFn: () => client.ckanPackageSearch(searchOptions),
    enabled: enabled ?? true,
    staleTime,
  })
}

/**
 * Queries tabular data from a distribution's datastore using CKAN's datastore_search API format.
 *
 * This hook provides CKAN-compatible access to DKAN's datastore, allowing you to query the actual
 * tabular data that has been imported from CSV, JSON, or other data files. It uses CKAN's parameter
 * names and response format instead of DKAN's native datastore API.
 *
 * **CKAN Compatibility Features**:
 * - Uses CKAN parameter names (`resource_id`, `limit`, `offset` vs DKAN's native format)
 * - Returns results in CKAN's response format (with `fields` and `records` arrays)
 * - Supports CKAN's `filters` object for field-value matching
 * - Compatible with existing CKAN datastore client code
 * - Provides migration path from CKAN datastore queries
 *
 * **Data Import Requirement**: Before you can query data with this hook, the distribution's file
 * must be imported into DKAN's datastore using {@link useTriggerDatastoreImport}. The import
 * process downloads the file and loads it into a queryable database.
 *
 * **When to Use This Hook**:
 * - You're migrating CKAN datastore queries to DKAN
 * - You have existing code that uses CKAN's datastore_search API
 * - You need to maintain compatibility with CKAN-based analytics tools
 * - Your team is familiar with CKAN's datastore API format
 *
 * **When to Use {@link useDatastore} Instead**:
 * - You're building new applications from scratch
 * - You need advanced querying (SQL, joins, aggregations)
 * - You prefer DKAN's native API with more intuitive parameters
 * - You want to use DKAN-specific features
 *
 * Use this hook when you need to:
 * - Query imported tabular data using CKAN's API format
 * - Build data tables and grids from distribution files
 * - Filter and paginate through dataset records with CKAN syntax
 * - Migrate existing CKAN datastore queries to DKAN
 * - Build cross-platform tools that work with both CKAN and DKAN
 *
 * @param options - Configuration options for the CKAN datastore search query
 *
 * @returns TanStack React Query result object containing:
 *   - `data`: Query results in CKAN format with `fields` array and `records` array
 *   - `isLoading`: True during the initial query
 *   - `isFetching`: True whenever a query is executing
 *   - `isError`: True if the query failed
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually re-execute the query
 *
 * @example
 * Basic CKAN datastore query:
 * ```tsx
 * function CkanDatastoreTable({ resourceId }: { resourceId: string }) {
 *   const { data, isLoading } = useCkanDatastoreSearch({
 *     resource_id: resourceId,
 *     limit: 100,
 *   })
 *
 *   if (isLoading) return <div>Loading data...</div>
 *   if (!data) return null
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           {data.fields.map(field => (
 *             <th key={field.id}>{field.id}</th>
 *           ))}
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {data.records.map((record, i) => (
 *           <tr key={i}>
 *             {data.fields.map(field => (
 *               <td key={field.id}>{String(record[field.id])}</td>
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
 * CKAN datastore query with filtering:
 * ```tsx
 * function FilteredCkanDatastore() {
 *   const [state, setState] = useState('CA')
 *   const [year, setYear] = useState('2023')
 *
 *   const { data, isLoading, isFetching } = useCkanDatastoreSearch({
 *     resource_id: 'census-data-resource-id',
 *     limit: 50,
 *     offset: 0,
 *     // CKAN filters: exact match on field values
 *     filters: {
 *       state: state,
 *       year: year,
 *     },
 *     // CKAN q parameter: full-text search across all fields
 *     q: undefined,
 *   })
 *
 *   return (
 *     <div>
 *       <div className="filters">
 *         <label>
 *           State:
 *           <select value={state} onChange={(e) => setState(e.target.value)}>
 *             <option value="CA">California</option>
 *             <option value="NY">New York</option>
 *             <option value="TX">Texas</option>
 *           </select>
 *         </label>
 *
 *         <label>
 *           Year:
 *           <input
 *             type="number"
 *             value={year}
 *             onChange={(e) => setYear(e.target.value)}
 *           />
 *         </label>
 *       </div>
 *
 *       {isFetching && <div className="loading-overlay">Updating...</div>}
 *
 *       {data && (
 *         <div>
 *           <p>Found {data.total} matching records</p>
 *           <table>
 *             <thead>
 *               <tr>
 *                 {data.fields.map((field) => (
 *                   <th key={field.id}>
 *                     {field.id}
 *                     {field.type && <span className="type"> ({field.type})</span>}
 *                   </th>
 *                 ))}
 *               </tr>
 *             </thead>
 *             <tbody>
 *               {data.records.map((record, idx) => (
 *                 <tr key={idx}>
 *                   {data.fields.map((field) => (
 *                     <td key={field.id}>{String(record[field.id] ?? '')}</td>
 *                   ))}
 *                 </tr>
 *               ))}
 *             </tbody>
 *           </table>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Paginated CKAN datastore query:
 * ```tsx
 * function PaginatedCkanDatastore({ resourceId }: { resourceId: string }) {
 *   const [page, setPage] = useState(0)
 *   const limit = 25
 *
 *   const { data, isLoading } = useCkanDatastoreSearch({
 *     resource_id: resourceId,
 *     limit,
 *     offset: page * limit,
 *   })
 *
 *   const totalPages = data ? Math.ceil(data.total / limit) : 0
 *
 *   return (
 *     <div className="paginated-datastore">
 *       <div className="data-grid">
 *         {isLoading ? (
 *           <div>Loading page {page + 1}...</div>
 *         ) : data ? (
 *           <>
 *             <div className="grid-header">
 *               {data.fields.map((field) => (
 *                 <div key={field.id} className="grid-cell header">
 *                   {field.id}
 *                 </div>
 *               ))}
 *             </div>
 *             {data.records.map((record, idx) => (
 *               <div key={idx} className="grid-row">
 *                 {data.fields.map((field) => (
 *                   <div key={field.id} className="grid-cell">
 *                     {String(record[field.id] ?? '')}
 *                   </div>
 *                 ))}
 *               </div>
 *             ))}
 *           </>
 *         ) : null}
 *       </div>
 *
 *       <div className="pagination-controls">
 *         <button
 *           onClick={() => setPage(p => Math.max(0, p - 1))}
 *           disabled={page === 0 || isLoading}
 *         >
 *           Previous
 *         </button>
 *         <span>
 *           Page {page + 1} of {totalPages} ({data?.total || 0} total records)
 *         </span>
 *         <button
 *           onClick={() => setPage(p => p + 1)}
 *           disabled={!data || page >= totalPages - 1 || isLoading}
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
 * Full-featured CKAN datastore browser with search and export:
 * ```tsx
 * function CkanDatastoreBrowser({ resourceId }: { resourceId: string }) {
 *   const [searchTerm, setSearchTerm] = useState('')
 *   const [filters, setFilters] = useState<Record<string, string>>({})
 *   const [page, setPage] = useState(0)
 *   const [selectedFields, setSelectedFields] = useState<string[]>([])
 *   const rowsPerPage = 50
 *
 *   const { data, isLoading, error } = useCkanDatastoreSearch({
 *     resource_id: resourceId,
 *     limit: rowsPerPage,
 *     offset: page * rowsPerPage,
 *     q: searchTerm || undefined, // Full-text search
 *     filters: Object.keys(filters).length > 0 ? filters : undefined,
 *     fields: selectedFields.length > 0 ? selectedFields : undefined,
 *   })
 *
 *   const exportToCSV = () => {
 *     if (!data) return
 *
 *     const headers = data.fields.map(f => f.id).join(',')
 *     const rows = data.records.map(record =>
 *       data.fields.map(f => JSON.stringify(record[f.id] ?? '')).join(',')
 *     )
 *     const csv = [headers, ...rows].join('\n')
 *
 *     const blob = new Blob([csv], { type: 'text/csv' })
 *     const url = URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = `datastore-export-page-${page + 1}.csv`
 *     a.click()
 *   }
 *
 *   if (error) {
 *     return (
 *       <div className="error">
 *         <h3>Error loading datastore</h3>
 *         <p>{error.message}</p>
 *         <p className="hint">
 *           Make sure the data has been imported into the datastore.
 *         </p>
 *       </div>
 *     )
 *   }
 *
 *   return (
 *     <div className="datastore-browser">
 *       <div className="controls">
 *         <input
 *           type="search"
 *           placeholder="Search all fields..."
 *           value={searchTerm}
 *           onChange={(e) => {
 *             setSearchTerm(e.target.value)
 *             setPage(0) // Reset to first page
 *           }}
 *         />
 *
 *         <button onClick={exportToCSV} disabled={!data}>
 *           Export Current Page to CSV
 *         </button>
 *       </div>
 *
 *       {data && (
 *         <>
 *           <div className="field-selector">
 *             <label>Show columns:</label>
 *             {data.fields.map((field) => (
 *               <label key={field.id}>
 *                 <input
 *                   type="checkbox"
 *                   checked={
 *                     selectedFields.length === 0 ||
 *                     selectedFields.includes(field.id)
 *                   }
 *                   onChange={(e) => {
 *                     if (e.target.checked) {
 *                       setSelectedFields([])
 *                     } else {
 *                       setSelectedFields(
 *                         data.fields
 *                           .map(f => f.id)
 *                           .filter(id => id !== field.id)
 *                       )
 *                     }
 *                   }}
 *                 />
 *                 {field.id}
 *               </label>
 *             ))}
 *           </div>
 *
 *           <p className="record-count">
 *             Showing {page * rowsPerPage + 1}-
 *             {Math.min((page + 1) * rowsPerPage, data.total)} of {data.total} records
 *           </p>
 *
 *           <div className="data-table-wrapper">
 *             <table className="data-table">
 *               <thead>
 *                 <tr>
 *                   {data.fields.map((field) => (
 *                     <th key={field.id}>
 *                       {field.id}
 *                       {field.type && <small> ({field.type})</small>}
 *                     </th>
 *                   ))}
 *                 </tr>
 *               </thead>
 *               <tbody>
 *                 {data.records.map((record, idx) => (
 *                   <tr key={idx}>
 *                     {data.fields.map((field) => (
 *                       <td key={field.id}>{String(record[field.id] ?? '')}</td>
 *                     ))}
 *                   </tr>
 *                 ))}
 *               </tbody>
 *             </table>
 *           </div>
 *
 *           <div className="pagination">
 *             <button onClick={() => setPage(0)} disabled={page === 0}>
 *               First
 *             </button>
 *             <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>
 *               Previous
 *             </button>
 *             <span>Page {page + 1} of {Math.ceil(data.total / rowsPerPage)}</span>
 *             <button
 *               onClick={() => setPage(p => p + 1)}
 *               disabled={(page + 1) * rowsPerPage >= data.total}
 *             >
 *               Next
 *             </button>
 *             <button
 *               onClick={() => setPage(Math.ceil(data.total / rowsPerPage) - 1)}
 *               disabled={(page + 1) * rowsPerPage >= data.total}
 *             >
 *               Last
 *             </button>
 *           </div>
 *         </>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatastore} for DKAN's native datastore querying API
 * @see {@link useTriggerDatastoreImport} to import data files into the datastore
 * @see {@link useCkanDatastoreSearchSql} for CKAN-compatible SQL queries
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.datastore_search
 */
export function useCkanDatastoreSearch(options: UseCkanDatastoreSearchOptions) {
  const client = useDkanClient()
  const { enabled, staleTime, ...searchOptions } = options

  return useQuery({
    queryKey: ['ckan', 'datastore-search', searchOptions] as const,
    queryFn: () => client.ckanDatastoreSearch(searchOptions),
    enabled: (enabled ?? true) && !!searchOptions.resource_id,
    staleTime,
  })
}

/**
 * Executes SQL queries against DKAN's datastore using CKAN's datastore_search_sql API format.
 *
 * This hook provides CKAN-compatible SQL query execution for DKAN's datastore, allowing you to
 * run SELECT queries with joins, aggregations, and complex filtering. It uses CKAN's API format
 * instead of DKAN's native SQL query endpoint, making it ideal for migrating existing CKAN
 * applications or maintaining compatibility with CKAN-based tools.
 *
 * **CKAN Compatibility Features**:
 * - Uses CKAN parameter name (`sql` instead of DKAN's native format)
 * - Returns results in CKAN's response format (array of record objects)
 * - Compatible with existing CKAN SQL query scripts
 * - Provides migration path from CKAN datastore_search_sql
 * - Supports standard SQL SELECT syntax
 *
 * **SQL Query Support**:
 * - SELECT queries with column selection and WHERE clauses
 * - JOIN operations across multiple datastore tables
 * - Aggregation functions (COUNT, SUM, AVG, MIN, MAX)
 * - GROUP BY and ORDER BY clauses
 * - LIMIT and OFFSET for pagination
 *
 * **Security**: SQL queries are read-only - only SELECT statements are allowed. CREATE, UPDATE,
 * DELETE, and other write operations are blocked to protect the datastore.
 *
 * **When to Use This Hook**:
 * - You're migrating CKAN SQL queries to DKAN
 * - You need complex queries with joins or aggregations in CKAN format
 * - You're maintaining compatibility with CKAN-based analytics tools
 * - Your team is familiar with CKAN's datastore_search_sql API
 *
 * **When to Use {@link useSqlQuery} Instead**:
 * - You're building new applications from scratch
 * - You prefer DKAN's native SQL query API
 * - You want to use DKAN-specific SQL features
 * - You don't need CKAN compatibility
 *
 * Use this hook when you need to:
 * - Execute SQL queries using CKAN's API format
 * - Perform complex data analysis with joins and aggregations
 * - Generate reports from multiple datastore tables
 * - Migrate existing CKAN SQL analytics to DKAN
 * - Build cross-platform tools that work with both CKAN and DKAN
 *
 * @param options - Configuration options for the CKAN SQL query
 *
 * @returns TanStack React Query result object containing:
 *   - `data`: Query results as an array of record objects in CKAN format
 *   - `isLoading`: True during the initial query execution
 *   - `isFetching`: True whenever a query is executing
 *   - `isError`: True if the query failed (syntax errors, invalid tables, etc.)
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually re-execute the query
 *
 * @example
 * Basic CKAN SQL query:
 * ```tsx
 * function CkanSqlQueryResults({ sql }: { sql: string }) {
 *   const { data, isLoading, error } = useCkanDatastoreSearchSql({
 *     sql,
 *     enabled: !!sql,
 *   })
 *
 *   if (!sql) return <div>Enter a SQL query</div>
 *   if (isLoading) return <div>Executing query...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!data) return null
 *
 *   return (
 *     <div>
 *       <p>Returned {data.length} rows</p>
 *       <pre>{JSON.stringify(data, null, 2)}</pre>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Interactive CKAN SQL query editor:
 * ```tsx
 * function CkanSqlEditor() {
 *   const [sqlQuery, setSqlQuery] = useState(
 *     'SELECT * FROM "resource-id-here" LIMIT 10'
 *   )
 *   const [executeQuery, setExecuteQuery] = useState('')
 *
 *   const { data, isLoading, error, isFetching } = useCkanDatastoreSearchSql({
 *     sql: executeQuery,
 *     enabled: !!executeQuery,
 *   })
 *
 *   const handleExecute = () => {
 *     setExecuteQuery(sqlQuery)
 *   }
 *
 *   return (
 *     <div className="sql-editor">
 *       <div className="editor-panel">
 *         <textarea
 *           value={sqlQuery}
 *           onChange={(e) => setSqlQuery(e.target.value)}
 *           rows={10}
 *           placeholder="Enter SQL query (SELECT only)..."
 *           className="sql-textarea"
 *         />
 *         <button
 *           onClick={handleExecute}
 *           disabled={!sqlQuery || isFetching}
 *         >
 *           {isFetching ? 'Executing...' : 'Execute Query'}
 *         </button>
 *       </div>
 *
 *       {error && (
 *         <div className="error-panel">
 *           <h4>Query Error:</h4>
 *           <pre>{error.message}</pre>
 *         </div>
 *       )}
 *
 *       {data && (
 *         <div className="results-panel">
 *           <h4>Results ({data.length} rows)</h4>
 *           {data.length > 0 ? (
 *             <table>
 *               <thead>
 *                 <tr>
 *                   {Object.keys(data[0]).map((key) => (
 *                     <th key={key}>{key}</th>
 *                   ))}
 *                 </tr>
 *               </thead>
 *               <tbody>
 *                 {data.map((row, idx) => (
 *                   <tr key={idx}>
 *                     {Object.values(row).map((value, i) => (
 *                       <td key={i}>{String(value)}</td>
 *                     ))}
 *                   </tr>
 *                 ))}
 *               </tbody>
 *             </table>
 *           ) : (
 *             <p>No results</p>
 *           )}
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * CKAN SQL aggregation query with summary statistics:
 * ```tsx
 * function DatasetStatistics({ resourceId }: { resourceId: string }) {
 *   const sql = `
 *     SELECT
 *       COUNT(*) as total_records,
 *       COUNT(DISTINCT state) as unique_states,
 *       AVG(population) as avg_population,
 *       MAX(population) as max_population,
 *       MIN(population) as min_population
 *     FROM "${resourceId}"
 *   `
 *
 *   const { data, isLoading } = useCkanDatastoreSearchSql({
 *     sql,
 *     enabled: !!resourceId,
 *   })
 *
 *   if (isLoading) return <div>Calculating statistics...</div>
 *   if (!data || data.length === 0) return null
 *
 *   const stats = data[0]
 *
 *   return (
 *     <div className="statistics-dashboard">
 *       <h3>Dataset Statistics</h3>
 *       <div className="stats-grid">
 *         <div className="stat-card">
 *           <h4>Total Records</h4>
 *           <p className="stat-value">{stats.total_records}</p>
 *         </div>
 *         <div className="stat-card">
 *           <h4>Unique States</h4>
 *           <p className="stat-value">{stats.unique_states}</p>
 *         </div>
 *         <div className="stat-card">
 *           <h4>Average Population</h4>
 *           <p className="stat-value">
 *             {Number(stats.avg_population).toLocaleString()}
 *           </p>
 *         </div>
 *         <div className="stat-card">
 *           <h4>Population Range</h4>
 *           <p className="stat-value">
 *             {Number(stats.min_population).toLocaleString()} -{' '}
 *             {Number(stats.max_population).toLocaleString()}
 *           </p>
 *         </div>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * CKAN SQL query with JOIN across multiple resources:
 * ```tsx
 * function JoinedDataAnalysis() {
 *   const [category, setCategory] = useState('all')
 *
 *   // Join sales data with product catalog
 *   const sql = `
 *     SELECT
 *       s.product_id,
 *       p.product_name,
 *       p.category,
 *       COUNT(*) as sale_count,
 *       SUM(s.amount) as total_revenue
 *     FROM "sales-resource-id" s
 *     JOIN "products-resource-id" p ON s.product_id = p.id
 *     ${category !== 'all' ? `WHERE p.category = '${category}'` : ''}
 *     GROUP BY s.product_id, p.product_name, p.category
 *     ORDER BY total_revenue DESC
 *     LIMIT 20
 *   `
 *
 *   const { data, isLoading, isFetching } = useCkanDatastoreSearchSql({
 *     sql,
 *   })
 *
 *   return (
 *     <div className="sales-analysis">
 *       <div className="filters">
 *         <label>
 *           Category:
 *           <select value={category} onChange={(e) => setCategory(e.target.value)}>
 *             <option value="all">All Categories</option>
 *             <option value="electronics">Electronics</option>
 *             <option value="clothing">Clothing</option>
 *             <option value="food">Food</option>
 *           </select>
 *         </label>
 *       </div>
 *
 *       {isFetching && <div className="loading-overlay">Updating...</div>}
 *
 *       {data && (
 *         <table className="sales-table">
 *           <thead>
 *             <tr>
 *               <th>Product</th>
 *               <th>Category</th>
 *               <th>Sales Count</th>
 *               <th>Total Revenue</th>
 *             </tr>
 *           </thead>
 *           <tbody>
 *             {data.map((row, idx) => (
 *               <tr key={idx}>
 *                 <td>{row.product_name}</td>
 *                 <td>{row.category}</td>
 *                 <td>{row.sale_count}</td>
 *                 <td>${Number(row.total_revenue).toLocaleString()}</td>
 *               </tr>
 *             ))}
 *           </tbody>
 *         </table>
 *       )}
 *
 *       {data && data.length === 0 && (
 *         <p className="no-results">No sales found for this category</p>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Paginated CKAN SQL query with dynamic sorting:
 * ```tsx
 * function PaginatedSqlResults({ resourceId }: { resourceId: string }) {
 *   const [page, setPage] = useState(0)
 *   const [sortBy, setSortBy] = useState('name')
 *   const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC')
 *   const pageSize = 25
 *
 *   const sql = `
 *     SELECT *
 *     FROM "${resourceId}"
 *     ORDER BY ${sortBy} ${sortDir}
 *     LIMIT ${pageSize}
 *     OFFSET ${page * pageSize}
 *   `
 *
 *   const { data, isLoading } = useCkanDatastoreSearchSql({ sql })
 *
 *   // Get total count for pagination
 *   const countSql = `SELECT COUNT(*) as total FROM "${resourceId}"`
 *   const { data: countData } = useCkanDatastoreSearchSql({
 *     sql: countSql,
 *     staleTime: 60000, // Cache count for 1 minute
 *   })
 *
 *   const totalRecords = countData?.[0]?.total || 0
 *   const totalPages = Math.ceil(totalRecords / pageSize)
 *
 *   const handleSort = (column: string) => {
 *     if (sortBy === column) {
 *       setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC')
 *     } else {
 *       setSortBy(column)
 *       setSortDir('ASC')
 *     }
 *     setPage(0)
 *   }
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!data) return null
 *
 *   return (
 *     <div className="paginated-sql-results">
 *       <p>Showing records {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalRecords)} of {totalRecords}</p>
 *
 *       <table>
 *         <thead>
 *           <tr>
 *             {data.length > 0 && Object.keys(data[0]).map((key) => (
 *               <th key={key} onClick={() => handleSort(key)} className="sortable">
 *                 {key}
 *                 {sortBy === key && (sortDir === 'ASC' ? ' ↑' : ' ↓')}
 *               </th>
 *             ))}
 *           </tr>
 *         </thead>
 *         <tbody>
 *           {data.map((row, idx) => (
 *             <tr key={idx}>
 *               {Object.values(row).map((value, i) => (
 *                 <td key={i}>{String(value)}</td>
 *               ))}
 *             </tr>
 *           ))}
 *         </tbody>
 *       </table>
 *
 *       <div className="pagination">
 *         <button onClick={() => setPage(0)} disabled={page === 0}>First</button>
 *         <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>Previous</button>
 *         <span>Page {page + 1} of {totalPages}</span>
 *         <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next</button>
 *         <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>Last</button>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useSqlQuery} for DKAN's native SQL query API
 * @see {@link useCkanDatastoreSearch} for CKAN-compatible simple datastore queries
 * @see {@link useDatastore} for DKAN's native datastore querying
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.datastore_search_sql
 */
export function useCkanDatastoreSearchSql(options: UseCkanDatastoreSearchSqlOptions) {
  const client = useDkanClient()
  const { enabled, staleTime, ...sqlOptions } = options

  return useQuery({
    queryKey: ['ckan', 'datastore-search-sql', sqlOptions.sql] as const,
    queryFn: () => client.ckanDatastoreSearchSql(sqlOptions),
    enabled: (enabled ?? true) && !!sqlOptions.sql,
    staleTime,
  })
}

/**
 * Fetches metadata about a specific distribution/resource using CKAN's resource_show API format.
 *
 * In CKAN terminology, a "resource" is equivalent to a DKAN "distribution" - a downloadable file
 * associated with a dataset. This hook provides CKAN-compatible access to distribution metadata
 * including title, format, size, download URL, and other descriptive information.
 *
 * **CKAN Compatibility Features**:
 * - Uses CKAN terminology ("resource" instead of "distribution")
 * - Returns metadata in CKAN's resource format
 * - Compatible with existing CKAN resource management tools
 * - Provides migration path for CKAN resource_show calls
 * - Includes CKAN-specific fields (package_id, position, etc.)
 *
 * **Resource/Distribution Metadata Includes**:
 * - Resource identifier and name
 * - File format (CSV, JSON, XML, PDF, etc.)
 * - File size and download URL
 * - Creation and modification timestamps
 * - Description and additional metadata
 * - Parent dataset information
 *
 * **When to Use This Hook**:
 * - You're migrating CKAN resource_show calls to DKAN
 * - You need distribution metadata in CKAN's format
 * - You're building tools that display resource information
 * - Your team is familiar with CKAN's resource API
 * - You need to maintain compatibility with CKAN-based UIs
 *
 * Use this hook when you need to:
 * - Display metadata about a specific distribution/resource
 * - Show download links and file information
 * - Build resource cards or detail pages with CKAN format
 * - Migrate existing CKAN resource display components
 * - Provide file format and size information to users
 *
 * @param options - Configuration options including the resource ID to fetch
 *
 * @returns TanStack React Query result object containing:
 *   - `data`: Resource metadata in CKAN format
 *   - `isLoading`: True during the initial metadata fetch
 *   - `isFetching`: True whenever metadata is being fetched
 *   - `isError`: True if the fetch failed (resource not found, etc.)
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually re-fetch the metadata
 *
 * @example
 * Basic resource metadata display:
 * ```tsx
 * function ResourceMetadata({ resourceId }: { resourceId: string }) {
 *   const { data: resource, isLoading } = useCkanResourceShow({ resourceId })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!resource) return null
 *
 *   return (
 *     <div className="resource-card">
 *       <h3>{resource.name}</h3>
 *       <p>Format: {resource.format}</p>
 *       <p>Size: {resource.size ? `${(resource.size / 1024).toFixed(2)} KB` : 'Unknown'}</p>
 *       {resource.url && (
 *         <a href={resource.url} target="_blank" rel="noopener noreferrer">
 *           Download
 *         </a>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Detailed resource information panel:
 * ```tsx
 * function ResourceDetailPanel({ resourceId }: { resourceId: string }) {
 *   const { data: resource, isLoading, error } = useCkanResourceShow({
 *     resourceId,
 *   })
 *
 *   if (isLoading) {
 *     return (
 *       <div className="loading-panel">
 *         <div className="spinner" />
 *         <p>Loading resource details...</p>
 *       </div>
 *     )
 *   }
 *
 *   if (error) {
 *     return (
 *       <div className="error-panel">
 *         <h3>Resource Not Found</h3>
 *         <p>{error.message}</p>
 *       </div>
 *     )
 *   }
 *
 *   if (!resource) return null
 *
 *   return (
 *     <div className="resource-detail">
 *       <div className="resource-header">
 *         <h2>{resource.name || 'Untitled Resource'}</h2>
 *         <span className="format-badge">{resource.format}</span>
 *       </div>
 *
 *       {resource.description && (
 *         <div className="resource-description">
 *           <h4>Description</h4>
 *           <p>{resource.description}</p>
 *         </div>
 *       )}
 *
 *       <div className="resource-metadata">
 *         <h4>File Information</h4>
 *         <dl>
 *           <dt>Format:</dt>
 *           <dd>{resource.format || 'Unknown'}</dd>
 *
 *           {resource.size && (
 *             <>
 *               <dt>Size:</dt>
 *               <dd>{(resource.size / (1024 * 1024)).toFixed(2)} MB</dd>
 *             </>
 *           )}
 *
 *           {resource.created && (
 *             <>
 *               <dt>Created:</dt>
 *               <dd>{new Date(resource.created).toLocaleDateString()}</dd>
 *             </>
 *           )}
 *
 *           {resource.last_modified && (
 *             <>
 *               <dt>Last Modified:</dt>
 *               <dd>{new Date(resource.last_modified).toLocaleDateString()}</dd>
 *             </>
 *           )}
 *
 *           {resource.mimetype && (
 *             <>
 *               <dt>MIME Type:</dt>
 *               <dd>{resource.mimetype}</dd>
 *             </>
 *           )}
 *         </dl>
 *       </div>
 *
 *       <div className="resource-actions">
 *         {resource.url && (
 *           <a
 *             href={resource.url}
 *             className="btn btn-primary"
 *             target="_blank"
 *             rel="noopener noreferrer"
 *           >
 *             Download File
 *           </a>
 *         )}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Resource list with format icons and download buttons:
 * ```tsx
 * function ResourceList({ datasetId }: { datasetId: string }) {
 *   // First, get the dataset to access its resources
 *   const { data: dataset } = useCkanPackageSearch({
 *     q: `id:${datasetId}`,
 *     rows: 1,
 *   })
 *
 *   const resources = dataset?.results[0]?.distribution || []
 *
 *   return (
 *     <div className="resource-list">
 *       <h3>Available Resources</h3>
 *       {resources.map((resource) => (
 *         <ResourceCard key={resource.identifier} resourceId={resource.identifier} />
 *       ))}
 *     </div>
 *   )
 * }
 *
 * function ResourceCard({ resourceId }: { resourceId: string }) {
 *   const { data: resource, isLoading } = useCkanResourceShow({ resourceId })
 *
 *   if (isLoading) return <div className="resource-card loading">Loading...</div>
 *   if (!resource) return null
 *
 *   const formatIcons: Record<string, string> = {
 *     csv: '📊',
 *     json: '📋',
 *     xml: '📄',
 *     pdf: '📕',
 *     xlsx: '📗',
 *     geojson: '🗺️',
 *   }
 *
 *   const icon = formatIcons[resource.format?.toLowerCase()] || '📁'
 *
 *   return (
 *     <div className="resource-card">
 *       <div className="resource-icon">{icon}</div>
 *       <div className="resource-info">
 *         <h4>{resource.name}</h4>
 *         <div className="resource-meta">
 *           <span className="format">{resource.format}</span>
 *           {resource.size && (
 *             <span className="size">
 *               {(resource.size / 1024).toFixed(0)} KB
 *             </span>
 *           )}
 *         </div>
 *         {resource.description && (
 *           <p className="description">{resource.description}</p>
 *         )}
 *       </div>
 *       {resource.url && (
 *         <a
 *           href={resource.url}
 *           className="download-btn"
 *           download
 *           aria-label={`Download ${resource.name}`}
 *         >
 *           ⬇ Download
 *         </a>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Resource preview with format-specific handling:
 * ```tsx
 * function ResourcePreview({ resourceId }: { resourceId: string }) {
 *   const { data: resource, isLoading } = useCkanResourceShow({ resourceId })
 *
 *   if (isLoading) return <div>Loading preview...</div>
 *   if (!resource) return null
 *
 *   const renderPreview = () => {
 *     const format = resource.format?.toLowerCase()
 *
 *     switch (format) {
 *       case 'csv':
 *       case 'json':
 *         return (
 *           <div className="data-preview">
 *             <p>This resource contains tabular data.</p>
 *             <button onClick={() => window.open(resource.url, '_blank')}>
 *               View Data
 *             </button>
 *           </div>
 *         )
 *
 *       case 'pdf':
 *         return (
 *           <div className="pdf-preview">
 *             <iframe
 *               src={`${resource.url}#view=FitH`}
 *               width="100%"
 *               height="600px"
 *               title={resource.name}
 *             />
 *           </div>
 *         )
 *
 *       case 'geojson':
 *         return (
 *           <div className="map-preview">
 *             <p>This resource contains geographic data.</p>
 *             <button onClick={() => window.open(resource.url, '_blank')}>
 *               View on Map
 *             </button>
 *           </div>
 *         )
 *
 *       default:
 *         return (
 *           <div className="generic-preview">
 *             <p>Preview not available for {format} files.</p>
 *             <a href={resource.url} download>
 *               Download to view
 *             </a>
 *           </div>
 *         )
 *     }
 *   }
 *
 *   return (
 *     <div className="resource-preview">
 *       <div className="resource-header">
 *         <h3>{resource.name}</h3>
 *         <span className="format-badge">{resource.format}</span>
 *       </div>
 *
 *       {renderPreview()}
 *
 *       <div className="resource-metadata-footer">
 *         <p>
 *           <strong>Size:</strong>{' '}
 *           {resource.size
 *             ? `${(resource.size / (1024 * 1024)).toFixed(2)} MB`
 *             : 'Unknown'}
 *         </p>
 *         {resource.last_modified && (
 *           <p>
 *             <strong>Last Updated:</strong>{' '}
 *             {new Date(resource.last_modified).toLocaleDateString()}
 *           </p>
 *         )}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useCkanPackageSearch} to find datasets and their associated resources
 * @see {@link useCkanDatastoreSearch} to query data from a resource's datastore
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.resource_show
 */
export function useCkanResourceShow(options: UseCkanResourceShowOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['ckan', 'resource-show', options.resourceId] as const,
    queryFn: () => client.ckanResourceShow(options.resourceId),
    enabled: (options.enabled ?? true) && !!options.resourceId,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches all datasets (packages) in the catalog with their distributions (resources) using CKAN's current_package_list_with_resources API format.
 *
 * This hook retrieves the complete list of datasets in your DKAN catalog, with each dataset's
 * distribution files included. It uses CKAN's API format, making it ideal for migrating catalog
 * browsing tools or building catalog-wide analytics that need to process all datasets at once.
 *
 * **CKAN Compatibility Features**:
 * - Uses CKAN terminology ("packages" and "resources" instead of "datasets" and "distributions")
 * - Returns data in CKAN's list format with embedded resources
 * - Compatible with existing CKAN catalog tools
 * - Provides migration path for CKAN current_package_list_with_resources calls
 * - Includes all CKAN-specific fields
 *
 * **Performance Consideration**: This hook fetches ALL datasets in the catalog in a single request.
 * For catalogs with hundreds or thousands of datasets, this can be a large response. Consider using
 * {@link useCkanPackageSearch} with pagination for large catalogs, or implement client-side pagination
 * of the results.
 *
 * **Typical Use Cases**:
 * - Building catalog overview dashboards
 * - Generating catalog-wide statistics and reports
 * - Creating data inventories
 * - Implementing catalog search with client-side filtering
 * - Building resource format distribution charts
 * - Exporting catalog metadata
 *
 * **When to Use This Hook**:
 * - You're migrating CKAN catalog browsing tools to DKAN
 * - You need to access all datasets at once for analytics
 * - You're building catalog-wide reports or statistics
 * - Your catalog is small enough to load all datasets at once
 * - You need to maintain compatibility with CKAN-based catalog tools
 *
 * **When to Use {@link useCkanPackageSearch} Instead**:
 * - Your catalog has hundreds or thousands of datasets
 * - You need pagination or filtering
 * - You want incremental loading for better performance
 * - You're building user-facing search interfaces
 *
 * Use this hook when you need to:
 * - Display a complete catalog listing
 * - Generate catalog-wide statistics and analytics
 * - Build resource inventory reports
 * - Create catalog export tools
 * - Migrate CKAN catalog browsing pages to DKAN
 *
 * @param options - Configuration options for the catalog fetch
 *
 * @returns TanStack React Query result object containing:
 *   - `data`: Array of all datasets (packages) with their resources in CKAN format
 *   - `isLoading`: True during the initial catalog fetch
 *   - `isFetching`: True whenever the catalog is being fetched
 *   - `isError`: True if the fetch failed
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually re-fetch the entire catalog
 *
 * @example
 * Basic catalog listing:
 * ```tsx
 * function DatasetCatalog() {
 *   const { data: packages, isLoading } = useCkanCurrentPackageListWithResources()
 *
 *   if (isLoading) return <div>Loading catalog...</div>
 *   if (!packages) return null
 *
 *   return (
 *     <div className="catalog">
 *       <h2>Dataset Catalog ({packages.length} datasets)</h2>
 *       {packages.map(pkg => (
 *         <div key={pkg.identifier} className="dataset-card">
 *           <h3>{pkg.title}</h3>
 *           <p>{pkg.description}</p>
 *           <p className="resource-count">
 *             {pkg.distribution?.length || 0} resources
 *           </p>
 *           {pkg.distribution && (
 *             <ul className="resource-list">
 *               {pkg.distribution.map(resource => (
 *                 <li key={resource.identifier}>
 *                   {resource.title} ({resource.format})
 *                 </li>
 *               ))}
 *             </ul>
 *           )}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Catalog statistics dashboard:
 * ```tsx
 * function CatalogStatistics() {
 *   const { data: packages, isLoading } = useCkanCurrentPackageListWithResources()
 *
 *   if (isLoading) return <div>Calculating statistics...</div>
 *   if (!packages) return null
 *
 *   // Calculate statistics
 *   const totalDatasets = packages.length
 *   const totalResources = packages.reduce(
 *     (sum, pkg) => sum + (pkg.distribution?.length || 0),
 *     0
 *   )
 *
 *   // Count resource formats
 *   const formatCounts: Record<string, number> = {}
 *   packages.forEach(pkg => {
 *     pkg.distribution?.forEach(resource => {
 *       const format = resource.format?.toUpperCase() || 'Unknown'
 *       formatCounts[format] = (formatCounts[format] || 0) + 1
 *     })
 *   })
 *
 *   // Find most common formats
 *   const topFormats = Object.entries(formatCounts)
 *     .sort(([, a], [, b]) => b - a)
 *     .slice(0, 5)
 *
 *   // Count datasets by theme
 *   const themeCounts: Record<string, number> = {}
 *   packages.forEach(pkg => {
 *     pkg.theme?.forEach(theme => {
 *       const themeName = typeof theme === 'string' ? theme : theme.title
 *       themeCounts[themeName] = (themeCounts[themeName] || 0) + 1
 *     })
 *   })
 *
 *   return (
 *     <div className="catalog-stats">
 *       <h2>Catalog Statistics</h2>
 *
 *       <div className="stats-grid">
 *         <div className="stat-card">
 *           <h3>Total Datasets</h3>
 *           <p className="stat-value">{totalDatasets}</p>
 *         </div>
 *
 *         <div className="stat-card">
 *           <h3>Total Resources</h3>
 *           <p className="stat-value">{totalResources}</p>
 *         </div>
 *
 *         <div className="stat-card">
 *           <h3>Avg Resources per Dataset</h3>
 *           <p className="stat-value">
 *             {(totalResources / totalDatasets).toFixed(1)}
 *           </p>
 *         </div>
 *       </div>
 *
 *       <div className="format-distribution">
 *         <h3>Top Resource Formats</h3>
 *         <ul>
 *           {topFormats.map(([format, count]) => (
 *             <li key={format}>
 *               <span className="format">{format}</span>
 *               <span className="count">{count} files</span>
 *               <div
 *                 className="bar"
 *                 style={{ width: `${(count / totalResources) * 100}%` }}
 *               />
 *             </li>
 *           ))}
 *         </ul>
 *       </div>
 *
 *       <div className="theme-distribution">
 *         <h3>Datasets by Theme</h3>
 *         <ul>
 *           {Object.entries(themeCounts)
 *             .sort(([, a], [, b]) => b - a)
 *             .map(([theme, count]) => (
 *               <li key={theme}>
 *                 {theme}: <strong>{count}</strong> datasets
 *               </li>
 *             ))}
 *         </ul>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Searchable catalog with client-side filtering:
 * ```tsx
 * function SearchableCatalog() {
 *   const [searchTerm, setSearchTerm] = useState('')
 *   const [formatFilter, setFormatFilter] = useState<string>()
 *   const [themeFilter, setThemeFilter] = useState<string>()
 *
 *   const { data: allPackages, isLoading } = useCkanCurrentPackageListWithResources({
 *     staleTime: 5 * 60 * 1000, // Cache for 5 minutes
 *   })
 *
 *   // Client-side filtering
 *   const filteredPackages = useMemo(() => {
 *     if (!allPackages) return []
 *
 *     return allPackages.filter(pkg => {
 *       // Text search
 *       if (searchTerm) {
 *         const searchLower = searchTerm.toLowerCase()
 *         const matchesTitle = pkg.title?.toLowerCase().includes(searchLower)
 *         const matchesDesc = pkg.description?.toLowerCase().includes(searchLower)
 *         if (!matchesTitle && !matchesDesc) return false
 *       }
 *
 *       // Format filter
 *       if (formatFilter) {
 *         const hasFormat = pkg.distribution?.some(
 *           r => r.format?.toLowerCase() === formatFilter.toLowerCase()
 *         )
 *         if (!hasFormat) return false
 *       }
 *
 *       // Theme filter
 *       if (themeFilter) {
 *         const hasTheme = pkg.theme?.some(t => {
 *           const themeName = typeof t === 'string' ? t : t.title
 *           return themeName === themeFilter
 *         })
 *         if (!hasTheme) return false
 *       }
 *
 *       return true
 *     })
 *   }, [allPackages, searchTerm, formatFilter, themeFilter])
 *
 *   // Get available formats and themes for filter dropdowns
 *   const availableFormats = useMemo(() => {
 *     if (!allPackages) return []
 *     const formats = new Set<string>()
 *     allPackages.forEach(pkg => {
 *       pkg.distribution?.forEach(r => {
 *         if (r.format) formats.add(r.format)
 *       })
 *     })
 *     return Array.from(formats).sort()
 *   }, [allPackages])
 *
 *   if (isLoading) return <div>Loading catalog...</div>
 *
 *   return (
 *     <div className="searchable-catalog">
 *       <div className="filters">
 *         <input
 *           type="search"
 *           placeholder="Search datasets..."
 *           value={searchTerm}
 *           onChange={(e) => setSearchTerm(e.target.value)}
 *         />
 *
 *         <select
 *           value={formatFilter || ''}
 *           onChange={(e) => setFormatFilter(e.target.value || undefined)}
 *         >
 *           <option value="">All Formats</option>
 *           {availableFormats.map(format => (
 *             <option key={format} value={format}>{format}</option>
 *           ))}
 *         </select>
 *       </div>
 *
 *       <p className="results-count">
 *         Showing {filteredPackages.length} of {allPackages?.length || 0} datasets
 *       </p>
 *
 *       <div className="catalog-grid">
 *         {filteredPackages.map(pkg => (
 *           <div key={pkg.identifier} className="dataset-card">
 *             <h3>{pkg.title}</h3>
 *             <p>{pkg.description}</p>
 *             <div className="resources">
 *               {pkg.distribution?.map(resource => (
 *                 <span key={resource.identifier} className="format-badge">
 *                   {resource.format}
 *                 </span>
 *               ))}
 *             </div>
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Catalog export tool (CSV/JSON):
 * ```tsx
 * function CatalogExporter() {
 *   const { data: packages, isLoading } = useCkanCurrentPackageListWithResources()
 *
 *   const exportToCSV = () => {
 *     if (!packages) return
 *
 *     const rows = packages.map(pkg => ({
 *       identifier: pkg.identifier,
 *       title: pkg.title,
 *       description: pkg.description || '',
 *       publisher: pkg.publisher?.name || '',
 *       modified: pkg.modified,
 *       resourceCount: pkg.distribution?.length || 0,
 *       formats: pkg.distribution?.map(r => r.format).join('; ') || '',
 *       themes: pkg.theme?.map(t => typeof t === 'string' ? t : t.title).join('; ') || '',
 *     }))
 *
 *     const headers = Object.keys(rows[0]).join(',')
 *     const csv = [
 *       headers,
 *       ...rows.map(row => Object.values(row).map(v => `"${v}"`).join(','))
 *     ].join('\n')
 *
 *     const blob = new Blob([csv], { type: 'text/csv' })
 *     const url = URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = `catalog-export-${new Date().toISOString().split('T')[0]}.csv`
 *     a.click()
 *   }
 *
 *   const exportToJSON = () => {
 *     if (!packages) return
 *
 *     const json = JSON.stringify(packages, null, 2)
 *     const blob = new Blob([json], { type: 'application/json' })
 *     const url = URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = `catalog-export-${new Date().toISOString().split('T')[0]}.json`
 *     a.click()
 *   }
 *
 *   if (isLoading) {
 *     return <div>Loading catalog for export...</div>
 *   }
 *
 *   return (
 *     <div className="catalog-exporter">
 *       <h2>Export Catalog</h2>
 *       <p>Export all {packages?.length || 0} datasets with their metadata</p>
 *
 *       <div className="export-buttons">
 *         <button onClick={exportToCSV} disabled={!packages}>
 *           Export as CSV
 *         </button>
 *         <button onClick={exportToJSON} disabled={!packages}>
 *           Export as JSON
 *         </button>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useCkanPackageSearch} for paginated dataset search (better for large catalogs)
 * @see {@link useDatasetSearch} for DKAN's native paginated dataset search
 * @see {@link useCkanResourceShow} to fetch individual resource details
 * @see https://docs.ckan.org/en/latest/api/index.html#ckan.logic.action.get.current_package_list_with_resources
 */
export function useCkanCurrentPackageListWithResources(options: UseCkanPackageListOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['ckan', 'current-package-list-with-resources'] as const,
    queryFn: () => client.ckanCurrentPackageListWithResources(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  })
}
