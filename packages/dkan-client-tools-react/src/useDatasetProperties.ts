/**
 * React hooks for DKAN Dataset Properties
 */

import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'

export interface UseDatasetPropertiesOptions {
  enabled?: boolean
  staleTime?: number
}

export interface UsePropertyValuesOptions {
  property: string
  enabled?: boolean
  staleTime?: number
}

export interface UseAllPropertiesWithValuesOptions {
  enabled?: boolean
  staleTime?: number
}

/**
 * Hook to get all available dataset properties
 * Returns the list of fields that can be used for filtering
 *
 * @example
 * ```tsx
 * function PropertySelector() {
 *   const { data: properties, isLoading } = useDatasetProperties()
 *
 *   if (isLoading) return <div>Loading properties...</div>
 *   if (!properties) return null
 *
 *   return (
 *     <select>
 *       <option value="">Select a property</option>
 *       {properties.map(prop => (
 *         <option key={prop} value={prop}>
 *           {prop}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 */
export function useDatasetProperties(options: UseDatasetPropertiesOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['dataset-properties'] as const,
    queryFn: () => client.getDatasetProperties(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  })
}

/**
 * Hook to get all values for a specific property
 * Useful for building filter dropdowns
 *
 * @example
 * ```tsx
 * function ThemeFilter() {
 *   const { data: themes, isLoading } = usePropertyValues({
 *     property: 'theme',
 *   })
 *
 *   if (isLoading) return <div>Loading themes...</div>
 *   if (!themes) return null
 *
 *   return (
 *     <select>
 *       <option value="">All themes</option>
 *       {themes.map(theme => (
 *         <option key={theme} value={theme}>
 *           {theme}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * function DynamicFilter({ property }: { property: string }) {
 *   const { data: values, isLoading } = usePropertyValues({
 *     property,
 *     enabled: !!property,
 *   })
 *
 *   if (!property) return null
 *   if (isLoading) return <div>Loading values...</div>
 *   if (!values || values.length === 0) return <div>No values available</div>
 *
 *   return (
 *     <div>
 *       <h4>Filter by {property}:</h4>
 *       <ul>
 *         {values.map(value => (
 *           <li key={value}>
 *             <label>
 *               <input type="checkbox" value={value} />
 *               {value}
 *             </label>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function usePropertyValues(options: UsePropertyValuesOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['dataset-properties', options.property] as const,
    queryFn: () => client.getPropertyValues(options.property),
    enabled: (options.enabled ?? true) && !!options.property,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  })
}

/**
 * Hook to get all properties with their values
 * Returns a complete map of all properties and their possible values
 * Useful for building comprehensive faceted search UIs
 *
 * @example
 * ```tsx
 * function FacetedSearch() {
 *   const { data: facets, isLoading } = useAllPropertiesWithValues()
 *   const [filters, setFilters] = useState<Record<string, string[]>>({})
 *
 *   if (isLoading) return <div>Loading filters...</div>
 *   if (!facets) return null
 *
 *   return (
 *     <div>
 *       <h3>Filter Datasets</h3>
 *       {Object.entries(facets).map(([property, values]) => (
 *         <div key={property}>
 *           <h4>{property}</h4>
 *           {values.map(value => (
 *             <label key={value}>
 *               <input
 *                 type="checkbox"
 *                 checked={filters[property]?.includes(value)}
 *                 onChange={(e) => {
 *                   const newFilters = { ...filters }
 *                   if (e.target.checked) {
 *                     newFilters[property] = [...(newFilters[property] || []), value]
 *                   } else {
 *                     newFilters[property] = newFilters[property]?.filter(v => v !== value)
 *                   }
 *                   setFilters(newFilters)
 *                 }}
 *               />
 *               {value}
 *             </label>
 *           ))}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * function PropertyExplorer() {
 *   const { data: properties, isLoading } = useAllPropertiesWithValues()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!properties) return null
 *
 *   return (
 *     <div>
 *       <h2>Dataset Properties</h2>
 *       {Object.entries(properties).map(([prop, values]) => (
 *         <details key={prop}>
 *           <summary>
 *             {prop} ({values.length} values)
 *           </summary>
 *           <ul>
 *             {values.map(value => (
 *               <li key={value}>{value}</li>
 *             ))}
 *           </ul>
 *         </details>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAllPropertiesWithValues(options: UseAllPropertiesWithValuesOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['dataset-properties', 'with-values'] as const,
    queryFn: () => client.getAllPropertiesWithValues(),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  })
}
