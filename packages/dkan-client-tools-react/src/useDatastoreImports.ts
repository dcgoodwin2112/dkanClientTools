/**
 * React hooks for DKAN Datastore Import operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type {
  DatastoreImport,
  DatastoreImportOptions,
  DatastoreStatistics,
} from '@dkan-client-tools/core'

export interface UseDatastoreImportsOptions {
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number
}

export interface UseDatastoreImportOptions {
  identifier: string
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number
}

export interface UseDatastoreStatisticsOptions {
  identifier: string
  enabled?: boolean
  staleTime?: number
}


/**
 * Fetches the status of all datastore import operations.
 *
 * In DKAN, datasets often reference external data files (CSV, JSON, etc.) via distribution
 * URLs. The datastore import process downloads these files and loads them into DKAN's internal
 * database tables, making the data queryable via the Datastore API.
 *
 * This hook returns a map of all import operations, indexed by resource identifier (distribution ID).
 * Each import entry contains detailed status information including:
 * - Overall import status (e.g., "done", "in_progress", "error")
 * - File fetcher state (download progress, file path)
 * - Importer state (number of records processed, errors)
 *
 * Import operations can take time to complete, especially for large files. This hook supports
 * polling via the `refetchInterval` option, allowing you to build real-time progress displays
 * that automatically update as imports proceed.
 *
 * Use this hook when you need to:
 * - Monitor the status of all active import operations
 * - Build admin dashboards showing datastore import activity
 * - Display import progress indicators to users
 * - Track which resources have been successfully imported
 * - Identify and troubleshoot failed imports
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Object mapping resource IDs to import status objects
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch import statuses
 *
 * @example
 * Basic usage - import status list:
 * ```tsx
 * function ImportsListView() {
 *   const { data: imports, isLoading, error } = useDatastoreImports({
 *     refetchInterval: 5000, // Poll every 5 seconds for updates
 *   })
 *
 *   if (isLoading) return <div>Loading import statuses...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!imports || Object.keys(imports).length === 0) {
 *     return <div>No active imports</div>
 *   }
 *
 *   return (
 *     <div className="imports-list">
 *       <h3>Datastore Imports</h3>
 *       <ul>
 *         {Object.entries(imports).map(([id, importData]) => (
 *           <li key={id} className={`import-${importData.status}`}>
 *             <strong>{id}</strong>
 *             <span className="status">{importData.status}</span>
 *             {importData.importer?.state?.num_records && (
 *               <span className="records">
 *                 {importData.importer.state.num_records} records
 *               </span>
 *             )}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Real-time import progress monitor with conditional polling:
 * ```tsx
 * function ImportProgressMonitor() {
 *   const [isAnyInProgress, setIsAnyInProgress] = useState(false)
 *
 *   const { data: imports, isLoading } = useDatastoreImports({
 *     // Only poll when there are active imports
 *     refetchInterval: isAnyInProgress ? 2000 : false,
 *     staleTime: 0, // Always fetch fresh data
 *   })
 *
 *   // Check if any imports are in progress
 *   useEffect(() => {
 *     if (imports) {
 *       const hasActiveImports = Object.values(imports).some(
 *         imp => imp.status === 'in_progress' || imp.status === 'pending'
 *       )
 *       setIsAnyInProgress(hasActiveImports)
 *     }
 *   }, [imports])
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   const activeImports = Object.entries(imports || {}).filter(
 *     ([_, imp]) => imp.status === 'in_progress' || imp.status === 'pending'
 *   )
 *   const completedImports = Object.entries(imports || {}).filter(
 *     ([_, imp]) => imp.status === 'done'
 *   )
 *   const failedImports = Object.entries(imports || {}).filter(
 *     ([_, imp]) => imp.status === 'error'
 *   )
 *
 *   return (
 *     <div className="import-monitor">
 *       <h2>Import Operations</h2>
 *
 *       {activeImports.length > 0 && (
 *         <section className="active-imports">
 *           <h3>In Progress ({activeImports.length})</h3>
 *           {activeImports.map(([id, imp]) => (
 *             <div key={id} className="import-card">
 *               <h4>{id}</h4>
 *               <div className="progress-bar">
 *                 <div className="progress-fill" style={{ width: '50%' }} />
 *               </div>
 *               {imp.importer?.state?.num_records && (
 *                 <p>{imp.importer.state.num_records} records imported</p>
 *               )}
 *             </div>
 *           ))}
 *         </section>
 *       )}
 *
 *       {completedImports.length > 0 && (
 *         <section className="completed-imports">
 *           <h3>Completed ({completedImports.length})</h3>
 *           <ul>
 *             {completedImports.map(([id, imp]) => (
 *               <li key={id}>
 *                 {id} - {imp.importer?.state?.num_records} records
 *               </li>
 *             ))}
 *           </ul>
 *         </section>
 *       )}
 *
 *       {failedImports.length > 0 && (
 *         <section className="failed-imports">
 *           <h3>Failed ({failedImports.length})</h3>
 *           <ul>
 *             {failedImports.map(([id, imp]) => (
 *               <li key={id} className="error">
 *                 {id} - {imp.error || 'Import failed'}
 *               </li>
 *             ))}
 *           </ul>
 *         </section>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Import summary statistics:
 * ```tsx
 * function ImportStats() {
 *   const { data: imports } = useDatastoreImports()
 *
 *   if (!imports) return null
 *
 *   const stats = {
 *     total: Object.keys(imports).length,
 *     inProgress: Object.values(imports).filter(i => i.status === 'in_progress').length,
 *     completed: Object.values(imports).filter(i => i.status === 'done').length,
 *     failed: Object.values(imports).filter(i => i.status === 'error').length,
 *     totalRecords: Object.values(imports).reduce(
 *       (sum, i) => sum + (i.importer?.state?.num_records || 0),
 *       0
 *     ),
 *   }
 *
 *   return (
 *     <div className="import-stats">
 *       <h3>Import Statistics</h3>
 *       <div className="stat-grid">
 *         <div className="stat">
 *           <span className="stat-value">{stats.total}</span>
 *           <span className="stat-label">Total Imports</span>
 *         </div>
 *         <div className="stat">
 *           <span className="stat-value">{stats.inProgress}</span>
 *           <span className="stat-label">In Progress</span>
 *         </div>
 *         <div className="stat">
 *           <span className="stat-value">{stats.completed}</span>
 *           <span className="stat-label">Completed</span>
 *         </div>
 *         <div className="stat">
 *           <span className="stat-value">{stats.failed}</span>
 *           <span className="stat-label">Failed</span>
 *         </div>
 *         <div className="stat highlight">
 *           <span className="stat-value">{stats.totalRecords.toLocaleString()}</span>
 *           <span className="stat-label">Total Records</span>
 *         </div>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatastoreImport} for monitoring a specific import
 * @see {@link useTriggerDatastoreImport} for triggering new imports
 * @see https://dkan.readthedocs.io/en/latest/apis/datastore-import.html
 */
export function useDatastoreImports(options: UseDatastoreImportsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datastore', 'imports'] as const,
    queryFn: () => client.listDatastoreImports(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 0, // Default to always refetch
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Fetches the import status for a specific datastore resource.
 *
 * This hook provides detailed status information for a single datastore import operation,
 * identified by the resource ID (distribution identifier). It's a convenience wrapper around
 * {@link useDatastoreImports} that filters the results to a specific import.
 *
 * The import process consists of two main phases:
 * 1. **File Fetching**: Download the external data file from the distribution URL
 * 2. **Importing**: Parse and load the data into the DKAN database tables
 *
 * Each phase has its own state information including progress, errors, and completion status.
 * By polling this hook with `refetchInterval`, you can build real-time progress indicators
 * that show users exactly where the import process is and how much work remains.
 *
 * Use this hook when you need to:
 * - Monitor the progress of a specific import operation
 * - Display detailed import status to users
 * - Build progress indicators for file downloads and data loading
 * - Troubleshoot failed imports with detailed error information
 * - Determine when an import has completed successfully
 *
 * @param options - Configuration options including the resource identifier
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Import status object for the specified resource (or undefined if not found)
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch import status
 *
 * @example
 * Basic usage - simple import status display:
 * ```tsx
 * function ImportStatus({ identifier }: { identifier: string }) {
 *   const { data: importData, isLoading, error } = useDatastoreImport({
 *     identifier,
 *     refetchInterval: 3000, // Poll every 3 seconds
 *   })
 *
 *   if (isLoading) return <div>Loading import status...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!importData) return <div>No import found for {identifier}</div>
 *
 *   return (
 *     <div className="import-status">
 *       <h4>Import Status: {importData.status}</h4>
 *
 *       {importData.file_fetcher?.state && (
 *         <div className="file-fetcher">
 *           <p>File: {importData.file_fetcher.state.file_path}</p>
 *         </div>
 *       )}
 *
 *       {importData.importer?.state && (
 *         <div className="importer">
 *           <p>Records imported: {importData.importer.state.num_records}</p>
 *         </div>
 *       )}
 *
 *       {importData.status === 'error' && importData.error && (
 *         <div className="error-message">Error: {importData.error}</div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Detailed progress indicator with conditional polling:
 * ```tsx
 * function DetailedImportProgress({ resourceId }: { resourceId: string }) {
 *   const { data: importData, isLoading } = useDatastoreImport({
 *     identifier: resourceId,
 *     // Only poll while import is active
 *     refetchInterval: importData?.status === 'in_progress' ? 2000 : false,
 *     staleTime: 0,
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!importData) return <div>Import not started</div>
 *
 *   const status = importData.status
 *   const records = importData.importer?.state?.num_records || 0
 *   const filePath = importData.file_fetcher?.state?.file_path
 *
 *   return (
 *     <div className="detailed-import-progress">
 *       <div className="status-header">
 *         <h3>Import Progress</h3>
 *         <span className={`status-badge status-${status}`}>{status}</span>
 *       </div>
 *
 *       <div className="progress-sections">
 *         {/* File Fetching Phase *\/}
 *         <div className="progress-section">
 *           <h4>1. File Download</h4>
 *           {filePath ? (
 *             <div className="complete">
 *               <span className="icon">✓</span>
 *               <span>{filePath}</span>
 *             </div>
 *           ) : status === 'in_progress' ? (
 *             <div className="in-progress">Downloading...</div>
 *           ) : (
 *             <div className="pending">Pending</div>
 *           )}
 *         </div>
 *
 *         {/* Import Phase *\/}
 *         <div className="progress-section">
 *           <h4>2. Data Import</h4>
 *           {status === 'done' ? (
 *             <div className="complete">
 *               <span className="icon">✓</span>
 *               <span>{records.toLocaleString()} records imported</span>
 *             </div>
 *           ) : status === 'in_progress' && records > 0 ? (
 *             <div className="in-progress">
 *               {records.toLocaleString()} records imported...
 *             </div>
 *           ) : status === 'error' ? (
 *             <div className="error">
 *               Import failed: {importData.error || 'Unknown error'}
 *             </div>
 *           ) : (
 *             <div className="pending">Pending</div>
 *           )}
 *         </div>
 *       </div>
 *
 *       {status === 'done' && (
 *         <div className="success-message">
 *           Import completed successfully! The data is now available for querying.
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Import with automatic navigation on completion:
 * ```tsx
 * function ImportWithNavigation({ resourceId }: { resourceId: string }) {
 *   const navigate = useNavigate()
 *   const [startTime] = useState(Date.now())
 *
 *   const { data: importData } = useDatastoreImport({
 *     identifier: resourceId,
 *     refetchInterval: importData?.status === 'in_progress' ? 2000 : false,
 *   })
 *
 *   const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
 *
 *   // Navigate when import completes
 *   useEffect(() => {
 *     if (importData?.status === 'done') {
 *       // Wait 2 seconds to show success message, then navigate
 *       const timer = setTimeout(() => {
 *         navigate(`/datastore/${resourceId}`)
 *       }, 2000)
 *       return () => clearTimeout(timer)
 *     }
 *   }, [importData?.status, resourceId, navigate])
 *
 *   if (!importData) return <div>Starting import...</div>
 *
 *   return (
 *     <div className="import-with-nav">
 *       <h3>Importing Data</h3>
 *
 *       {importData.status === 'in_progress' && (
 *         <>
 *           <div className="spinner" />
 *           <p>
 *             {importData.importer?.state?.num_records || 0} records imported
 *           </p>
 *           <p className="elapsed-time">
 *             Elapsed time: {elapsedTime}s
 *           </p>
 *         </>
 *       )}
 *
 *       {importData.status === 'done' && (
 *         <div className="success">
 *           <span className="icon">✓</span>
 *           <p>Import complete! Redirecting to datastore viewer...</p>
 *         </div>
 *       )}
 *
 *       {importData.status === 'error' && (
 *         <div className="error">
 *           <p>Import failed: {importData.error}</p>
 *           <button onClick={() => navigate(-1)}>Go Back</button>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatastoreImports} for monitoring all imports
 * @see {@link useTriggerDatastoreImport} for starting new imports
 * @see https://dkan.readthedocs.io/en/latest/apis/datastore-import.html
 */
export function useDatastoreImport(options: UseDatastoreImportOptions) {
  const client = useDkanClient()
  const imports = useDatastoreImports({
    enabled: options.enabled,
    staleTime: options.staleTime,
    refetchInterval: options.refetchInterval,
  })

  return {
    ...imports,
    data: imports.data?.[options.identifier],
  }
}

/**
 * Fetches statistics about a datastore's imported data.
 *
 * This hook retrieves metadata about the structure and size of a datastore table, including
 * the number of rows, number of columns, and column definitions. This information is useful
 * for understanding the shape and volume of imported data without querying the data itself.
 *
 * The statistics are generated after a successful datastore import and remain available as
 * long as the datastore exists. They provide a quick way to check if data was imported
 * successfully and to understand its structure before building queries.
 *
 * Use this hook when you need to:
 * - Display datastore size and structure information
 * - Verify that a datastore import completed successfully
 * - Build dynamic UI elements based on available columns
 * - Show data volume metrics to users
 * - Check if a datastore has data before querying
 *
 * @param options - Configuration options including the datastore identifier
 *
 * @returns TanStack Query result object containing:
 *   - `data`: DatastoreStatistics object with numOfRows, numOfColumns, and columns
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch statistics
 *
 * @example
 * Basic usage - display datastore size:
 * ```tsx
 * function DatastoreInfo({ identifier }: { identifier: string }) {
 *   const { data: stats, isLoading, error } = useDatastoreStatistics({
 *     identifier,
 *   })
 *
 *   if (isLoading) return <div>Loading statistics...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!stats) return <div>No statistics available</div>
 *
 *   return (
 *     <div className="datastore-info">
 *       <h4>Datastore Statistics</h4>
 *       <p>Rows: {stats.numOfRows.toLocaleString()}</p>
 *       <p>Columns: {stats.numOfColumns}</p>
 *       <p>Available columns: {Object.keys(stats.columns).join(', ')}</p>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Building a column selector from statistics:
 * ```tsx
 * function ColumnSelector({ identifier }: { identifier: string }) {
 *   const [selectedColumns, setSelectedColumns] = useState<string[]>([])
 *   const { data: stats } = useDatastoreStatistics({ identifier })
 *
 *   if (!stats) return null
 *
 *   const availableColumns = Object.keys(stats.columns)
 *
 *   return (
 *     <div className="column-selector">
 *       <h4>Select Columns to Display</h4>
 *       {availableColumns.map(column => (
 *         <label key={column}>
 *           <input
 *             type="checkbox"
 *             checked={selectedColumns.includes(column)}
 *             onChange={(e) => {
 *               if (e.target.checked) {
 *                 setSelectedColumns([...selectedColumns, column])
 *               } else {
 *                 setSelectedColumns(selectedColumns.filter(c => c !== column))
 *               }
 *             }}
 *           />
 *           {column}
 *         </label>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Conditional rendering based on data availability:
 * ```tsx
 * function DatastoreViewer({ identifier }: { identifier: string }) {
 *   const { data: stats, isLoading } = useDatastoreStatistics({ identifier })
 *
 *   if (isLoading) return <div>Checking datastore...</div>
 *
 *   const hasData = stats && stats.numOfRows > 0
 *
 *   return (
 *     <div className="datastore-viewer">
 *       {hasData ? (
 *         <DataQueryInterface
 *           identifier={identifier}
 *           columns={Object.keys(stats.columns)}
 *           totalRows={stats.numOfRows}
 *         />
 *       ) : (
 *         <div className="no-data">
 *           <p>No data imported yet</p>
 *           <ImportDataButton identifier={identifier} />
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatastoreImport} for monitoring import progress
 * @see {@link useDatastore} for querying datastore data
 * @see https://dkan.readthedocs.io/en/latest/apis/datastore-import.html
 */
export function useDatastoreStatistics(options: UseDatastoreStatisticsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datastore', 'statistics', options.identifier] as const,
    queryFn: () => client.getDatastoreStatistics(options.identifier),
    enabled: options.enabled !== false && !!options.identifier,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes
  })
}

/**
 * Triggers a new datastore import operation for a distribution resource.
 *
 * This mutation hook initiates the process of downloading a data file from a distribution URL
 * and importing it into DKAN's internal datastore database. Once triggered, the import runs
 * asynchronously on the server - you can monitor its progress using {@link useDatastoreImport}
 * or {@link useDatastoreImports}.
 *
 * The import process:
 * 1. Downloads the file from the distribution's downloadURL
 * 2. Parses the file (supports CSV, JSON, and other formats)
 * 3. Creates database tables to store the data
 * 4. Loads the data into the datastore for querying
 *
 * After a successful import, the data becomes available through the Datastore API and can
 * be queried using {@link useDatastore} or {@link useSqlQuery}.
 *
 * **Important**: This operation can take significant time for large files. The mutation
 * completes immediately after triggering the import, but the actual import continues on
 * the server. Use polling with `useDatastoreImport` to track progress.
 *
 * Use this hook when you need to:
 * - Import external data files into the DKAN datastore
 * - Re-import data after distribution URLs change
 * - Build admin interfaces for triggering data updates
 * - Automate data refresh workflows
 * - Enable users to load data for analysis
 *
 * @returns TanStack Mutation object containing:
 *   - `mutate`: Function to trigger the import (takes DatastoreImportOptions)
 *   - `mutateAsync`: Async version that returns a Promise
 *   - `isPending`: True while the trigger request is being sent
 *   - `isSuccess`: True if the import was successfully triggered
 *   - `isError`: True if triggering failed
 *   - `error`: Error object if the mutation failed
 *   - `data`: Import status object returned from the server
 *
 * @example
 * Basic usage - simple import button:
 * ```tsx
 * function ImportButton({ resourceId }: { resourceId: string }) {
 *   const triggerImport = useTriggerDatastoreImport()
 *
 *   const handleImport = () => {
 *     triggerImport.mutate(
 *       { resource_id: resourceId },
 *       {
 *         onSuccess: (result) => {
 *           console.log('Import started:', result.status)
 *           alert('Import started successfully!')
 *         },
 *         onError: (error) => {
 *           console.error('Failed to start import:', error)
 *           alert(`Error: ${error.message}`)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <button
 *       onClick={handleImport}
 *       disabled={triggerImport.isPending}
 *       className="btn-primary"
 *     >
 *       {triggerImport.isPending ? 'Starting Import...' : 'Import to Datastore'}
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * Import with progress monitoring:
 * ```tsx
 * function ImportWithProgress({ resourceId }: { resourceId: string }) {
 *   const [isImporting, setIsImporting] = useState(false)
 *   const triggerImport = useTriggerDatastoreImport()
 *
 *   // Monitor import progress (only when import is active)
 *   const { data: importStatus } = useDatastoreImport({
 *     identifier: resourceId,
 *     enabled: isImporting,
 *     refetchInterval: isImporting ? 2000 : false,
 *   })
 *
 *   // Stop monitoring when import completes or fails
 *   useEffect(() => {
 *     if (importStatus?.status === 'done' || importStatus?.status === 'error') {
 *       setIsImporting(false)
 *     }
 *   }, [importStatus?.status])
 *
 *   const handleStartImport = () => {
 *     triggerImport.mutate(
 *       { resource_id: resourceId },
 *       {
 *         onSuccess: () => {
 *           setIsImporting(true)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <div className="import-with-progress">
 *       {!isImporting ? (
 *         <button
 *           onClick={handleStartImport}
 *           disabled={triggerImport.isPending}
 *         >
 *           {triggerImport.isPending ? 'Starting...' : 'Start Import'}
 *         </button>
 *       ) : (
 *         <div className="progress-display">
 *           <h4>Import in Progress</h4>
 *           <p>Status: {importStatus?.status}</p>
 *           {importStatus?.importer?.state?.num_records && (
 *             <p>Records: {importStatus.importer.state.num_records}</p>
 *           )}
 *         </div>
 *       )}
 *
 *       {importStatus?.status === 'done' && (
 *         <div className="success">Import completed successfully!</div>
 *       )}
 *
 *       {importStatus?.status === 'error' && (
 *         <div className="error">Import failed: {importStatus.error}</div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Bulk import for multiple resources:
 * ```tsx
 * function BulkImporter({ resourceIds }: { resourceIds: string[] }) {
 *   const [currentIndex, setCurrentIndex] = useState(0)
 *   const [results, setResults] = useState<Array<{ id: string; success: boolean }>>([])
 *   const triggerImport = useTriggerDatastoreImport()
 *
 *   const handleBulkImport = async () => {
 *     for (let i = 0; i < resourceIds.length; i++) {
 *       setCurrentIndex(i)
 *       try {
 *         await triggerImport.mutateAsync({
 *           resource_id: resourceIds[i],
 *         })
 *         setResults(prev => [...prev, { id: resourceIds[i], success: true }])
 *       } catch (error) {
 *         setResults(prev => [...prev, { id: resourceIds[i], success: false }])
 *       }
 *     }
 *     setCurrentIndex(-1) // Done
 *   }
 *
 *   return (
 *     <div className="bulk-importer">
 *       <h3>Bulk Import ({resourceIds.length} resources)</h3>
 *
 *       <button
 *         onClick={handleBulkImport}
 *         disabled={currentIndex >= 0 || triggerImport.isPending}
 *       >
 *         {currentIndex >= 0 ? `Importing ${currentIndex + 1}/${resourceIds.length}...` : 'Start Bulk Import'}
 *       </button>
 *
 *       {results.length > 0 && (
 *         <div className="results">
 *           <h4>Results</h4>
 *           <ul>
 *             {results.map(({ id, success }) => (
 *               <li key={id} className={success ? 'success' : 'error'}>
 *                 {id}: {success ? 'Started' : 'Failed'}
 *               </li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Import with confirmation dialog:
 * ```tsx
 * function ImportWithConfirmation({
 *   resourceId,
 *   fileName,
 * }: {
 *   resourceId: string
 *   fileName: string
 * }) {
 *   const [showConfirm, setShowConfirm] = useState(false)
 *   const triggerImport = useTriggerDatastoreImport()
 *
 *   const handleConfirmImport = () => {
 *     triggerImport.mutate(
 *       { resource_id: resourceId },
 *       {
 *         onSuccess: () => {
 *           setShowConfirm(false)
 *           toast.success('Import started successfully')
 *         },
 *         onError: (error) => {
 *           toast.error(`Failed to start import: ${error.message}`)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <>
 *       <button onClick={() => setShowConfirm(true)}>
 *         Import Data
 *       </button>
 *
 *       {showConfirm && (
 *         <div className="modal">
 *           <div className="modal-content">
 *             <h3>Confirm Import</h3>
 *             <p>
 *               Are you sure you want to import <strong>{fileName}</strong>?
 *             </p>
 *             <p className="warning">
 *               This will download and process the file, which may take some time
 *               depending on file size.
 *             </p>
 *
 *             <div className="modal-actions">
 *               <button onClick={() => setShowConfirm(false)}>
 *                 Cancel
 *               </button>
 *               <button
 *                 onClick={handleConfirmImport}
 *                 disabled={triggerImport.isPending}
 *                 className="btn-primary"
 *               >
 *                 {triggerImport.isPending ? 'Starting...' : 'Confirm Import'}
 *               </button>
 *             </div>
 *           </div>
 *         </div>
 *       )}
 *     </>
 *   )
 * }
 * ```
 *
 * @see {@link useDatastoreImport} for monitoring import progress
 * @see {@link useDatastoreImports} for viewing all active imports
 * @see {@link useDeleteDatastore} for removing imported data
 * @see https://dkan.readthedocs.io/en/latest/apis/datastore-import.html
 */
export function useTriggerDatastoreImport() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<DatastoreImport, Error, DatastoreImportOptions>({
    mutationFn: (options) => client.triggerDatastoreImport(options),
    onSuccess: () => {
      // Invalidate imports list
      queryClient.invalidateQueries({ queryKey: ['datastore', 'imports'] })
      // Invalidate datastore queries since new data may be available
      queryClient.invalidateQueries({ queryKey: ['datastore', 'query'] })
    },
  })
}

/**
 * Deletes a datastore and all its imported data.
 *
 * This mutation hook permanently removes a datastore database table and all the data it contains.
 * When you delete a datastore, the imported data is removed from DKAN's internal database, but
 * the original dataset metadata and distribution references remain intact.
 *
 * **Important**: This operation is destructive and cannot be undone. The data can only be recovered
 * by re-importing from the distribution URL using {@link useTriggerDatastoreImport}.
 *
 * You can delete datastores in two ways:
 * 1. **Single resource**: Pass a specific resource ID to delete just that distribution's data
 * 2. **All resources**: Pass a dataset ID to delete all datastores for that dataset
 *
 * Common use cases for deleting datastores:
 * - Clean up old or incorrect imports before re-importing
 * - Free up database storage space
 * - Remove test data from development environments
 * - Respond to data removal requests (GDPR, etc.)
 * - Reset datastore state when troubleshooting import issues
 *
 * Use this hook when you need to:
 * - Remove imported datastore data
 * - Clean up before re-importing updated data
 * - Build admin interfaces for datastore management
 * - Free up database resources
 * - Reset or troubleshoot import problems
 *
 * @returns TanStack Mutation object containing:
 *   - `mutate`: Function to delete the datastore (takes identifier string)
 *   - `mutateAsync`: Async version that returns a Promise
 *   - `isPending`: True while the deletion is in progress
 *   - `isSuccess`: True if the datastore was successfully deleted
 *   - `isError`: True if deletion failed
 *   - `error`: Error object if the mutation failed
 *   - `data`: Success message object from the server
 *
 * @example
 * Basic usage - delete button with confirmation:
 * ```tsx
 * function DeleteDatastoreButton({ identifier }: { identifier: string }) {
 *   const deleteDatastore = useDeleteDatastore()
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete this datastore? This action cannot be undone.')) {
 *       deleteDatastore.mutate(identifier, {
 *         onSuccess: (result) => {
 *           console.log(result.message)
 *           alert('Datastore deleted successfully')
 *         },
 *         onError: (error) => {
 *           console.error('Deletion failed:', error)
 *           alert(`Error: ${error.message}`)
 *         },
 *       })
 *     }
 *   }
 *
 *   return (
 *     <button
 *       onClick={handleDelete}
 *       disabled={deleteDatastore.isPending}
 *       className="btn-danger"
 *     >
 *       {deleteDatastore.isPending ? 'Deleting...' : 'Delete Datastore'}
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * Delete and re-import workflow:
 * ```tsx
 * function ReimportDatastore({ resourceId }: { resourceId: string }) {
 *   const deleteDatastore = useDeleteDatastore()
 *   const triggerImport = useTriggerDatastoreImport()
 *   const [step, setStep] = useState<'idle' | 'deleting' | 'importing' | 'done'>('idle')
 *
 *   const handleReimport = async () => {
 *     try {
 *       // Step 1: Delete existing data
 *       setStep('deleting')
 *       await deleteDatastore.mutateAsync(resourceId)
 *
 *       // Step 2: Trigger new import
 *       setStep('importing')
 *       await triggerImport.mutateAsync({ resource_id: resourceId })
 *
 *       setStep('done')
 *     } catch (error) {
 *       console.error('Reimport failed:', error)
 *       setStep('idle')
 *       alert('Reimport failed. Please try again.')
 *     }
 *   }
 *
 *   return (
 *     <div className="reimport-controls">
 *       <button
 *         onClick={handleReimport}
 *         disabled={step !== 'idle'}
 *       >
 *         {step === 'idle' && 'Reimport Data'}
 *         {step === 'deleting' && 'Deleting old data...'}
 *         {step === 'importing' && 'Starting new import...'}
 *         {step === 'done' && 'Reimport started!'}
 *       </button>
 *
 *       {step !== 'idle' && (
 *         <div className="progress-message">
 *           {step === 'deleting' && 'Removing old datastore...'}
 *           {step === 'importing' && 'Importing fresh data...'}
 *           {step === 'done' && 'New import is now running. Monitor progress above.'}
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Confirmation modal with impact warning:
 * ```tsx
 * function DeleteWithImpactWarning({
 *   identifier,
 *   datasetTitle,
 * }: {
 *   identifier: string
 *   datasetTitle: string
 * }) {
 *   const [showModal, setShowModal] = useState(false)
 *   const [confirmText, setConfirmText] = useState('')
 *   const deleteDatastore = useDeleteDatastore()
 *   const { data: stats } = useDatastoreStatistics({ identifier })
 *
 *   const handleDelete = () => {
 *     deleteDatastore.mutate(identifier, {
 *       onSuccess: () => {
 *         setShowModal(false)
 *         toast.success('Datastore deleted successfully')
 *       },
 *       onError: (error) => {
 *         toast.error(`Failed to delete: ${error.message}`)
 *       },
 *     })
 *   }
 *
 *   const canDelete = confirmText === 'DELETE'
 *
 *   return (
 *     <>
 *       <button
 *         onClick={() => setShowModal(true)}
 *         className="btn-danger-outline"
 *       >
 *         Delete Datastore
 *       </button>
 *
 *       {showModal && (
 *         <div className="modal">
 *           <div className="modal-content">
 *             <h3>Delete Datastore</h3>
 *
 *             <div className="warning-section">
 *               <p className="warning-icon">⚠️</p>
 *               <div>
 *                 <p><strong>This action cannot be undone.</strong></p>
 *                 <p>You are about to delete the datastore for:</p>
 *                 <p className="dataset-name">{datasetTitle}</p>
 *               </div>
 *             </div>
 *
 *             {stats && (
 *               <div className="impact-info">
 *                 <h4>This will delete:</h4>
 *                 <ul>
 *                   <li>{stats.numOfRows.toLocaleString()} rows of data</li>
 *                   <li>{stats.numOfColumns} columns</li>
 *                   <li>All query history and cache</li>
 *                 </ul>
 *               </div>
 *             )}
 *
 *             <div className="confirm-input">
 *               <p>Type <strong>DELETE</strong> to confirm:</p>
 *               <input
 *                 type="text"
 *                 value={confirmText}
 *                 onChange={(e) => setConfirmText(e.target.value)}
 *                 placeholder="DELETE"
 *               />
 *             </div>
 *
 *             <div className="modal-actions">
 *               <button onClick={() => setShowModal(false)}>
 *                 Cancel
 *               </button>
 *               <button
 *                 onClick={handleDelete}
 *                 disabled={!canDelete || deleteDatastore.isPending}
 *                 className="btn-danger"
 *               >
 *                 {deleteDatastore.isPending ? 'Deleting...' : 'Delete Datastore'}
 *               </button>
 *             </div>
 *           </div>
 *         </div>
 *       )}
 *     </>
 *   )
 * }
 * ```
 *
 * @example
 * Bulk delete for cleanup:
 * ```tsx
 * function BulkDatastoreCleanup({ resourceIds }: { resourceIds: string[] }) {
 *   const [deletedCount, setDeletedCount] = useState(0)
 *   const [failedIds, setFailedIds] = useState<string[]>([])
 *   const deleteDatastore = useDeleteDatastore()
 *
 *   const handleBulkDelete = async () => {
 *     if (!confirm(`Delete ${resourceIds.length} datastores? This cannot be undone.`)) {
 *       return
 *     }
 *
 *     setDeletedCount(0)
 *     setFailedIds([])
 *
 *     for (const id of resourceIds) {
 *       try {
 *         await deleteDatastore.mutateAsync(id)
 *         setDeletedCount(prev => prev + 1)
 *       } catch (error) {
 *         setFailedIds(prev => [...prev, id])
 *       }
 *     }
 *   }
 *
 *   return (
 *     <div className="bulk-delete">
 *       <h3>Datastore Cleanup</h3>
 *       <p>Delete {resourceIds.length} datastores</p>
 *
 *       <button
 *         onClick={handleBulkDelete}
 *         disabled={deleteDatastore.isPending}
 *         className="btn-danger"
 *       >
 *         {deleteDatastore.isPending
 *           ? `Deleting... (${deletedCount}/${resourceIds.length})`
 *           : 'Delete All'}
 *       </button>
 *
 *       {deletedCount > 0 && (
 *         <div className="results">
 *           <p className="success">Successfully deleted: {deletedCount}</p>
 *           {failedIds.length > 0 && (
 *             <div className="errors">
 *               <p className="error">Failed to delete: {failedIds.length}</p>
 *               <ul>
 *                 {failedIds.map(id => (
 *                   <li key={id}>{id}</li>
 *                 ))}
 *               </ul>
 *             </div>
 *           )}
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useTriggerDatastoreImport} for importing data after deletion
 * @see {@link useDatastoreImports} for viewing active imports
 * @see https://dkan.readthedocs.io/en/latest/apis/datastore-import.html
 */
export function useDeleteDatastore() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (identifier) => client.deleteDatastore(identifier),
    onSuccess: (data, identifier) => {
      // Invalidate imports list
      queryClient.invalidateQueries({ queryKey: ['datastore', 'imports'] })
      // Remove statistics for this identifier
      queryClient.removeQueries({
        queryKey: ['datastore', 'statistics', identifier],
      })
      // Invalidate datastore queries
      queryClient.invalidateQueries({ queryKey: ['datastore', 'query'] })
    },
  })
}
