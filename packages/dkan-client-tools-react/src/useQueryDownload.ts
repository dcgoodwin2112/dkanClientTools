import { useMutation } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type { QueryDownloadOptions } from '@dkan-client-tools/core'

/**
 * Options for downloading datastore query results.
 */
export interface DownloadQueryOptions {
  /**
   * The unique identifier (UUID) of the dataset.
   */
  datasetId: string

  /**
   * The distribution index within the dataset.
   *
   * @default 0
   */
  index: number

  /**
   * Query options for filtering and formatting the download.
   *
   * Supports:
   * - `format`: Output format ('csv' or 'json')
   * - `conditions`: Filter rows before download
   * - `properties`: Select specific columns
   * - `sorts`: Sort data before download
   * - `limit`: Limit number of rows
   * - `offset`: Skip rows (for batched downloads)
   */
  queryOptions?: QueryDownloadOptions
}

/**
 * Options for downloading by distribution ID.
 */
export interface DownloadQueryByDistributionOptions {
  /**
   * The unique identifier of the distribution/resource to download.
   *
   * This is simpler than using dataset ID + index when you have
   * the distribution ID directly.
   */
  distributionId: string

  /**
   * Query options for filtering and formatting the download.
   *
   * Same options as DownloadQueryOptions.
   */
  queryOptions?: QueryDownloadOptions
}

/**
 * Downloads datastore query results as a file (CSV or JSON).
 *
 * This mutation hook executes a datastore query and returns the results as a Blob
 * that can be downloaded by the user. It supports filtering, sorting, column selection,
 * and pagination before download - perfect for creating custom data exports.
 *
 * The hook returns a Blob object which can be converted to a download link using
 * `URL.createObjectURL()` or used with libraries like `file-saver`.
 *
 * Common use cases:
 * - Export filtered data to CSV/JSON
 * - Download specific columns only
 * - Create sorted data exports
 * - Batch download large datasets (using limit/offset)
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to trigger the download
 *   - `mutateAsync`: Async version that returns a promise with the Blob
 *   - `isPending`: True while the download is preparing
 *   - `isError`: True if the download failed
 *   - `isSuccess`: True if the Blob was created successfully
 *   - `error`: Error object if the request failed
 *   - `data`: Blob object containing the downloaded file data
 *
 * @example
 * ```tsx
 * function DownloadButton({ datasetId, index }: { datasetId: string; index: number }) {
 *   const downloadQuery = useDownloadQuery()
 *
 *   const handleDownload = () => {
 *     downloadQuery.mutate(
 *       {
 *         datasetId,
 *         index,
 *         queryOptions: {
 *           format: 'csv',
 *           conditions: [{ property: 'state', value: 'CA' }],
 *           limit: 1000,
 *         },
 *       },
 *       {
 *         onSuccess: (blob) => {
 *           // Create download link
 *           const url = URL.createObjectURL(blob)
 *           const a = document.createElement('a')
 *           a.href = url
 *           a.download = `dataset-${datasetId}.csv`
 *           document.body.appendChild(a)
 *           a.click()
 *           document.body.removeChild(a)
 *           URL.revokeObjectURL(url)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <button onClick={handleDownload} disabled={downloadQuery.isPending}>
 *       {downloadQuery.isPending ? 'Downloading...' : 'Download CSV'}
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * function DataExporter({ datasetId }: { datasetId: string }) {
 *   const downloadQuery = useDownloadQuery()
 *   const [format, setFormat] = useState<'csv' | 'json'>('csv')
 *
 *   const handleExport = () => {
 *     downloadQuery.mutate(
 *       {
 *         datasetId,
 *         index: 0,
 *         queryOptions: {
 *           format,
 *           properties: ['name', 'date', 'value'],
 *           sorts: [{ property: 'date', order: 'desc' }],
 *         },
 *       },
 *       {
 *         onSuccess: (blob) => {
 *           const url = URL.createObjectURL(blob)
 *           const a = document.createElement('a')
 *           a.href = url
 *           a.download = `export.${format}`
 *           a.click()
 *           URL.revokeObjectURL(url)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <div>
 *       <select value={format} onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}>
 *         <option value="csv">CSV</option>
 *         <option value="json">JSON</option>
 *       </select>
 *       <button onClick={handleExport} disabled={downloadQuery.isPending}>
 *         {downloadQuery.isPending ? 'Exporting...' : 'Export Data'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDownloadQuery() {
  const client = useDkanClient()

  return useMutation<Blob, Error, DownloadQueryOptions>({
    mutationFn: ({ datasetId, index, queryOptions }) =>
      client.downloadQuery(datasetId, index, queryOptions),
  })
}

/**
 * Downloads datastore data by distribution ID (simplified alternative to useDownloadQuery).
 *
 * This mutation provides a simpler interface when you have the distribution ID directly,
 * rather than needing to specify both dataset ID and distribution index. It's particularly
 * useful when working with dataset metadata that includes distribution identifiers.
 *
 * Like `useDownloadQuery`, this returns a Blob that can be used to create file downloads.
 * It supports the same query options for filtering, sorting, and formatting.
 *
 * Use this hook when:
 * - You have a distribution ID from dataset metadata
 * - You're working with individual distributions directly
 * - You want clearer code without index numbers
 *
 * @returns TanStack Mutation result object containing:
 *   - `mutate`: Function to trigger the download by distribution ID
 *   - `mutateAsync`: Async version that returns a promise with the Blob
 *   - `isPending`: True while the download is preparing
 *   - `isError`: True if the download failed
 *   - `isSuccess`: True if the Blob was created successfully
 *   - `error`: Error object if the request failed
 *   - `data`: Blob object containing the downloaded file data
 *
 * @example
 * ```tsx
 * function DistributionDownload({ distributionId }: { distributionId: string }) {
 *   const downloadQuery = useDownloadQueryByDistribution()
 *
 *   const handleDownload = (format: 'csv' | 'json') => {
 *     downloadQuery.mutate(
 *       {
 *         distributionId,
 *         queryOptions: { format },
 *       },
 *       {
 *         onSuccess: (blob) => {
 *           const url = URL.createObjectURL(blob)
 *           const a = document.createElement('a')
 *           a.href = url
 *           a.download = `distribution-${distributionId}.${format}`
 *           a.click()
 *           URL.revokeObjectURL(url)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={() => handleDownload('csv')}
 *         disabled={downloadQuery.isPending}
 *       >
 *         Download CSV
 *       </button>
 *       <button
 *         onClick={() => handleDownload('json')}
 *         disabled={downloadQuery.isPending}
 *       >
 *         Download JSON
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * function FilteredDownload({ distributionId }: { distributionId: string }) {
 *   const downloadQuery = useDownloadQueryByDistribution()
 *   const [filters, setFilters] = useState<DatastoreCondition[]>([])
 *
 *   const handleDownload = () => {
 *     downloadQuery.mutate(
 *       {
 *         distributionId,
 *         queryOptions: {
 *           format: 'csv',
 *           conditions: filters,
 *           limit: 5000,
 *         },
 *       },
 *       {
 *         onSuccess: (blob) => {
 *           saveAs(blob, 'filtered-data.csv') // Using file-saver library
 *         },
 *         onError: (error) => {
 *           console.error('Download failed:', error)
 *         },
 *       }
 *     )
 *   }
 *
 *   return (
 *     <div>
 *       {/ * Filter UI * /}
 *       <button onClick={handleDownload} disabled={downloadQuery.isPending}>
 *         Download Filtered Data
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDownloadQueryByDistribution() {
  const client = useDkanClient()

  return useMutation<Blob, Error, DownloadQueryByDistributionOptions>({
    mutationFn: ({ distributionId, queryOptions }) =>
      client.downloadQueryByDistribution(distributionId, queryOptions),
  })
}
