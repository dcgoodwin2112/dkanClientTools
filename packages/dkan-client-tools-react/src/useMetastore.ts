/**
 * React hooks for DKAN Metastore operations
 */

import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'

export interface UseAllDatasetsOptions {
  /**
   * Enable/disable the query
   */
  enabled?: boolean

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseSchemasOptions {
  /**
   * Enable/disable the query
   */
  enabled?: boolean

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseSchemaItemsOptions {
  /**
   * The schema ID to fetch items for
   */
  schemaId: string

  /**
   * Enable/disable the query
   */
  enabled?: boolean

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseFacetsOptions {
  /**
   * Enable/disable the query
   */
  enabled?: boolean

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

/**
 * Hook to fetch all datasets with full metadata
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAllDatasets()
 *
 * if (isLoading) return <div>Loading all datasets...</div>
 *
 * return (
 *   <ul>
 *     {data?.map(dataset => (
 *       <li key={dataset.identifier}>{dataset.title}</li>
 *     ))}
 *   </ul>
 * )
 * ```
 */
export function useAllDatasets(options: UseAllDatasetsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'all'] as const,
    queryFn: () => client.listAllDatasets(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Hook to fetch all available metastore schemas
 *
 * @example
 * ```tsx
 * const { data: schemas } = useSchemas()
 *
 * return (
 *   <select>
 *     {schemas?.map(schema => (
 *       <option key={schema} value={schema}>{schema}</option>
 *     ))}
 *   </select>
 * )
 * ```
 */
export function useSchemas(options: UseSchemasOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['metastore', 'schemas'] as const,
    queryFn: () => client.listSchemas(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Hook to fetch items for a specific schema
 *
 * @example
 * ```tsx
 * const { data: items } = useSchemaItems({
 *   schemaId: 'data-dictionary'
 * })
 * ```
 */
export function useSchemaItems(options: UseSchemaItemsOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['metastore', 'schema-items', options.schemaId] as const,
    queryFn: () => client.getSchemaItems(options.schemaId),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Hook to fetch all dataset facets (themes, keywords, publishers)
 * Useful for building filter UIs
 *
 * @example
 * ```tsx
 * function FilterPanel() {
 *   const { data: facets, isLoading } = useDatasetFacets()
 *
 *   if (isLoading) return <div>Loading filters...</div>
 *
 *   return (
 *     <div>
 *       <h3>Themes</h3>
 *       <ul>
 *         {facets?.theme.map(theme => (
 *           <li key={theme}>
 *             <label>
 *               <input type="checkbox" value={theme} />
 *               {theme}
 *             </label>
 *           </li>
 *         ))}
 *       </ul>
 *
 *       <h3>Keywords</h3>
 *       <ul>
 *         {facets?.keyword.map(keyword => (
 *           <li key={keyword}>{keyword}</li>
 *         ))}
 *       </ul>
 *
 *       <h3>Publishers</h3>
 *       <ul>
 *         {facets?.publisher.map(publisher => (
 *           <li key={publisher}>{publisher}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDatasetFacets(options: UseFacetsOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'facets'] as const,
    queryFn: () => client.getDatasetFacets(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes since facets don't change often
  })
}
