import { useQuery } from '@tanstack/react-query'
import type { DataDictionary } from '@dkan-client-tools/core'
import { useDkanClient } from './DkanClientProvider'

export interface UseDataDictionaryOptions {
  /** Data dictionary identifier (UUID) */
  identifier: string
  enabled?: boolean
  /** @default 300000 (5 minutes) */
  staleTime?: number
}

export interface UseDataDictionaryListOptions {
  enabled?: boolean
  /** @default 300000 (5 minutes) */
  staleTime?: number
}

/**
 * Fetches a data dictionary following Frictionless Table Schema specification.
 *
 * Returns field definitions with types, constraints, and descriptions.
 *
 * @example
 * ```tsx
 * const { data: dictionary } = useDataDictionary({ identifier: 'dict-id' })
 * ```
 */
export function useDataDictionary(options: UseDataDictionaryOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['data-dictionary', options.identifier] as const,
    queryFn: () => client.getDataDictionary(options.identifier),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches all available data dictionaries.
 *
 * Returns complete list of schema definitions registered in the system.
 *
 * @example
 * ```tsx
 * const { data: dictionaries } = useDataDictionaryList()
 * ```
 */
export function useDataDictionaryList(options: UseDataDictionaryListOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['data-dictionaries'] as const,
    queryFn: () => client.listDataDictionaries(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches a data dictionary from a URL referenced in distribution metadata.
 *
 * Typically used with `distribution.describedBy` property from DCAT-US metadata.
 *
 * @example
 * ```tsx
 * const { data } = useDataDictionaryFromUrl({
 *   url: distribution.describedBy,
 *   enabled: !!distribution.describedBy,
 * })
 * ```
 */
export function useDataDictionaryFromUrl(options: {
  url: string
  enabled?: boolean
  staleTime?: number
}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['data-dictionary-url', options.url] as const,
    queryFn: () => client.getDataDictionaryFromUrl(options.url),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches complete datastore schema including data dictionary information.
 *
 * Combines datastore internal schema with associated data dictionary metadata.
 *
 * @example
 * ```tsx
 * const { data: schema } = useDatastoreSchema({
 *   datasetId,
 *   index: 0,
 * })
 * ```
 */
export function useDatastoreSchema(options: {
  datasetId: string
  index?: number
  enabled?: boolean
  staleTime?: number
}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'datastore-schema',
      options.datasetId,
      options.index ?? 0,
    ] as const,
    queryFn: () => client.getDatastoreSchema(options.datasetId, options.index),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  })
}
