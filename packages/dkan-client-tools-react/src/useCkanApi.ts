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
 * Hook for CKAN-compatible package (dataset) search
 * Provides compatibility with CKAN-based tools and scripts
 *
 * @example
 * ```tsx
 * function CkanSearchResults() {
 *   const { data, isLoading } = useCkanPackageSearch({
 *     q: 'water quality',
 *     rows: 20,
 *     facet: true,
 *     'facet.field': ['theme', 'publisher'],
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
 * Hook for CKAN-compatible datastore search
 * Query a specific resource's datastore using CKAN API format
 *
 * @example
 * ```tsx
 * function CkanDatastoreTable({ resourceId }: { resourceId: string }) {
 *   const { data, isLoading } = useCkanDatastoreSearch({
 *     resource_id: resourceId,
 *     limit: 100,
 *     filters: { state: 'CA' },
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
 * Hook for CKAN-compatible SQL query
 * Execute SQL queries using CKAN API format
 *
 * @example
 * ```tsx
 * function CkanSqlQueryResults({ sql }: { sql: string }) {
 *   const { data, isLoading } = useCkanDatastoreSearchSql({
 *     sql,
 *     enabled: !!sql,
 *   })
 *
 *   if (!sql) return <div>Enter a SQL query</div>
 *   if (isLoading) return <div>Executing query...</div>
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
 * Hook for CKAN-compatible resource show
 * Get metadata about a specific resource
 *
 * @example
 * ```tsx
 * function ResourceMetadata({ resourceId }: { resourceId: string }) {
 *   const { data: resource, isLoading } = useCkanResourceShow({ resourceId })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!resource) return null
 *
 *   return (
 *     <div>
 *       <h3>{resource.name}</h3>
 *       <p>Format: {resource.format}</p>
 *       <p>Size: {resource.size} bytes</p>
 *       {resource.url && (
 *         <a href={resource.url} target="_blank" rel="noopener noreferrer">
 *           Download
 *         </a>
 *       )}
 *     </div>
 *   )
 * }
 * ```
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
 * Hook for CKAN-compatible current package list with resources
 * Get all datasets with their resources included
 * Useful for building catalog-wide tools
 *
 * @example
 * ```tsx
 * function DatasetCatalog() {
 *   const { data: packages, isLoading } = useCkanCurrentPackageListWithResources()
 *
 *   if (isLoading) return <div>Loading catalog...</div>
 *   if (!packages) return null
 *
 *   return (
 *     <div>
 *       <h2>Dataset Catalog ({packages.length} datasets)</h2>
 *       {packages.map(pkg => (
 *         <div key={pkg.identifier}>
 *           <h3>{pkg.title}</h3>
 *           <p>Resources: {pkg.resources?.length || 0}</p>
 *           {pkg.resources && (
 *             <ul>
 *               {pkg.resources.map(resource => (
 *                 <li key={resource.id}>
 *                   {resource.name} ({resource.format})
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
