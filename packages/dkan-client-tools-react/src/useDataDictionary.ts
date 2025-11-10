/**
 * React hook for fetching DKAN data dictionaries
 */

import { useQuery } from '@tanstack/react-query'
import type { DataDictionary } from '@dkan-client-tools/core'
import { useDkanClient } from './DkanClientProvider'

export interface UseDataDictionaryOptions {
  /**
   * The data dictionary identifier
   */
  identifier: string

  /**
   * Enable/disable the query
   */
  enabled?: boolean

  /**
   * Time before data is considered stale (ms)
   */
  staleTime?: number
}

export interface UseDataDictionaryListOptions {
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
 * Hook to fetch a specific data dictionary
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDataDictionary({
 *   identifier: 'my-dictionary-uuid'
 * })
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
 * Hook to fetch all data dictionaries
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDataDictionaryList()
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
 * Hook to fetch data dictionary from a URL
 * Useful for fetching dictionaries referenced in distribution.describedBy
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDataDictionaryFromUrl({
 *   url: distribution.describedBy
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
 * Hook to fetch datastore schema with data dictionary
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDatastoreSchema({
 *   datasetId: 'my-dataset-uuid',
 *   index: 0
 * })
 *
 * // Access schema
 * if (data?.schema) {
 *   data.schema.fields.forEach(field => {
 *     console.log(field.name, field.type, field.format)
 *   })
 * }
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
