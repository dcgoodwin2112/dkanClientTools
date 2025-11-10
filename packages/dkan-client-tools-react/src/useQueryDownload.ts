/**
 * React hooks for DKAN Query Download operations
 */

import { useMutation } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type { QueryDownloadOptions } from '@dkan-client-tools/core'

export interface DownloadQueryOptions {
  datasetId: string
  index: number
  queryOptions?: QueryDownloadOptions
}

export interface DownloadQueryByDistributionOptions {
  distributionId: string
  queryOptions?: QueryDownloadOptions
}

/**
 * Mutation hook to download datastore query results
 * Returns a Blob that can be used to create a download link
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
 * Mutation hook to download query results by distribution ID
 * Simplified download for a specific distribution/resource
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
