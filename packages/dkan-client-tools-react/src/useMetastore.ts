/**
 * React hooks for DKAN Metastore operations
 */

import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'
import type { JsonSchema } from '@dkan-client-tools/core'

export interface UseAllDatasetsOptions {
  enabled?: boolean
  staleTime?: number
}

export interface UseSchemasOptions {
  enabled?: boolean
  staleTime?: number
}

export interface UseSchemaOptions {
  schemaId: string
  enabled?: boolean
  staleTime?: number
}

export interface UseSchemaItemsOptions {
  schemaId: string
  enabled?: boolean
  staleTime?: number
}

export interface UseFacetsOptions {
  enabled?: boolean
  staleTime?: number
}

/**
 * Fetches all datasets from the DKAN catalog with complete DCAT-US metadata.
 *
 * Returns entire catalog without filtering or pagination. For better performance with large catalogs,
 * consider using `useDatasetSearch` with pagination.
 *
 * @example
 * ```tsx
 * const { data: datasets } = useAllDatasets()
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
 * Fetches all available metastore schemas.
 *
 * Returns schema IDs like 'dataset', 'data-dictionary', 'theme', etc.
 *
 * @example
 * ```tsx
 * const { data: schemas } = useSchemas()
 * // ['dataset', 'data-dictionary', ...]
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
 * Fetches a specific metastore schema definition.
 *
 * Returns JSON Schema with properties, validation rules, and field constraints.
 *
 * @example
 * ```tsx
 * const { data: schema } = useSchema({ schemaId: 'dataset' })
 * ```
 */
export function useSchema(options: UseSchemaOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['metastore', 'schema', options.schemaId] as const,
    queryFn: () => client.getSchema(options.schemaId),
    enabled: options.enabled !== false && !!options.schemaId,
    staleTime: options.staleTime ?? 10 * 60 * 1000, // Default 10 minutes - schemas rarely change
  })
}

/**
 * Fetches all items for a specific metastore schema.
 *
 * Generic way to fetch items from any schema (dataset, data-dictionary, custom schemas).
 *
 * @example
 * ```tsx
 * const { data: dictionaries } = useSchemaItems({
 *   schemaId: 'data-dictionary',
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
 * Fetches aggregated dataset facets (themes, keywords, publishers).
 *
 * Returns complete list of all unique values for key dataset properties across entire catalog.
 *
 * @example
 * ```tsx
 * const { data: facets } = useDatasetFacets()
 * // facets: { theme: [...], keyword: [...], publisher: [...] }
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
