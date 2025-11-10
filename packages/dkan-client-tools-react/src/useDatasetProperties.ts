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
 * Fetches all available dataset properties (fields) that can be used for filtering and querying.
 *
 * The DKAN Dataset Properties API provides a list of all metadata fields that appear in your
 * dataset catalog. These correspond to properties in the DCAT-US schema like "theme", "keyword",
 * "publisher", "contactPoint", "temporal", and more. Each property represents a field that can
 * be used for filtering, searching, or building dynamic query interfaces.
 *
 * This hook is particularly useful for building generic, data-driven UIs that automatically
 * adapt to the available metadata fields without hard-coding property names. For example,
 * you can build filter panels that dynamically list all available properties, or query
 * builders that let users select from any field in the dataset metadata.
 *
 * Use this hook when you need to:
 * - Build dynamic filter UIs that adapt to available metadata fields
 * - Create property selectors for advanced search interfaces
 * - Discover what fields are available in your dataset catalog
 * - Build query builders or data exploration tools
 * - Generate documentation about available metadata fields
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of property names (e.g., ['theme', 'keyword', 'publisher'])
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch properties
 *
 * @example
 * Basic usage - property selector dropdown:
 * ```tsx
 * function PropertySelector({ onSelect }: { onSelect: (prop: string) => void }) {
 *   const { data: properties, isLoading, error } = useDatasetProperties()
 *
 *   if (isLoading) return <div>Loading properties...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!properties) return null
 *
 *   return (
 *     <select onChange={(e) => onSelect(e.target.value)}>
 *       <option value="">Select a property to filter by...</option>
 *       {properties.map(prop => (
 *         <option key={prop} value={prop}>
 *           {prop}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 *
 * @example
 * Dynamic filter builder:
 * ```tsx
 * function DynamicFilterBuilder() {
 *   const { data: properties } = useDatasetProperties()
 *   const [selectedProperty, setSelectedProperty] = useState<string>()
 *
 *   // Fetch values for selected property
 *   const { data: values } = usePropertyValues({
 *     property: selectedProperty!,
 *     enabled: !!selectedProperty,
 *   })
 *
 *   return (
 *     <div className="filter-builder">
 *       <div className="property-selector">
 *         <label>Filter by:</label>
 *         <select
 *           value={selectedProperty || ''}
 *           onChange={(e) => setSelectedProperty(e.target.value)}
 *         >
 *           <option value="">Choose a field...</option>
 *           {properties?.map(prop => (
 *             <option key={prop} value={prop}>
 *               {prop}
 *             </option>
 *           ))}
 *         </select>
 *       </div>
 *
 *       {selectedProperty && values && (
 *         <div className="value-selector">
 *           <label>Value:</label>
 *           <select>
 *             <option value="">All</option>
 *             {values.map(value => (
 *               <option key={value} value={value}>
 *                 {value}
 *               </option>
 *             ))}
 *           </select>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Metadata field documentation generator:
 * ```tsx
 * function MetadataFieldDocs() {
 *   const { data: properties, isLoading } = useDatasetProperties({
 *     staleTime: Infinity, // Properties rarely change
 *   })
 *
 *   if (isLoading) return <div>Loading field information...</div>
 *
 *   const fieldDescriptions: Record<string, string> = {
 *     theme: 'Categories or subjects covered by the dataset',
 *     keyword: 'Keywords or tags describing the dataset',
 *     publisher: 'Organization that published the dataset',
 *     contactPoint: 'Contact information for dataset inquiries',
 *     temporal: 'Time period covered by the dataset',
 *     spatial: 'Geographic area covered by the dataset',
 *     // Add more as needed
 *   }
 *
 *   return (
 *     <div className="field-documentation">
 *       <h2>Available Dataset Fields</h2>
 *       <p>The following metadata fields are available in this catalog:</p>
 *
 *       <dl>
 *         {properties?.map(prop => (
 *           <div key={prop} className="field-item">
 *             <dt><code>{prop}</code></dt>
 *             <dd>{fieldDescriptions[prop] || 'Dataset metadata field'}</dd>
 *           </div>
 *         ))}
 *       </dl>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link usePropertyValues} for fetching all values for a specific property
 * @see {@link useAllPropertiesWithValues} for fetching all properties with their values
 * @see https://dkan.readthedocs.io/en/latest/apis/dataset-properties.html
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
 * Fetches all unique values for a specific dataset property across the entire catalog.
 *
 * For a given metadata field (like "theme", "keyword", or "publisher"), this hook returns
 * the complete list of all unique values that appear across all datasets in your catalog.
 * This is essential for building filter dropdowns, checkbox groups, and other UI components
 * that let users filter datasets by specific property values.
 *
 * For example, if you request values for the "theme" property, you'll get back an array
 * like ["Health", "Education", "Transportation", "Environment"]. If you request values
 * for "publisher", you'll get all organization names that have published datasets.
 *
 * The query is automatically disabled when no property is specified, making it safe to use
 * in scenarios where the property selection is user-driven and may be empty initially.
 *
 * Use this hook when you need to:
 * - Build filter dropdowns for specific dataset properties
 * - Create checkbox/radio button groups for faceted search
 * - Display available values for a specific metadata field
 * - Build tag selectors or multi-select filters
 * - Generate autocomplete suggestions for property values
 *
 * @param options - Configuration options including the property name
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of unique values for the property (e.g., ['Health', 'Education'])
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch values
 *
 * @example
 * Basic usage - theme filter dropdown:
 * ```tsx
 * function ThemeFilter({ onThemeChange }: { onThemeChange: (theme: string) => void }) {
 *   const { data: themes, isLoading, error } = usePropertyValues({
 *     property: 'theme',
 *   })
 *
 *   if (isLoading) return <div>Loading themes...</div>
 *   if (error) return <div>Error loading themes</div>
 *   if (!themes) return null
 *
 *   return (
 *     <select onChange={(e) => onThemeChange(e.target.value)}>
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
 * Multi-select keyword filter with counts:
 * ```tsx
 * function KeywordFilter() {
 *   const { data: keywords } = usePropertyValues({
 *     property: 'keyword',
 *   })
 *   const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
 *
 *   const toggleKeyword = (keyword: string) => {
 *     setSelectedKeywords(prev =>
 *       prev.includes(keyword)
 *         ? prev.filter(k => k !== keyword)
 *         : [...prev, keyword]
 *     )
 *   }
 *
 *   return (
 *     <div className="keyword-filter">
 *       <h3>Filter by Keywords</h3>
 *       {keywords?.slice(0, 20).map(keyword => (
 *         <label key={keyword} className="keyword-checkbox">
 *           <input
 *             type="checkbox"
 *             checked={selectedKeywords.includes(keyword)}
 *             onChange={() => toggleKeyword(keyword)}
 *           />
 *           {keyword}
 *         </label>
 *       ))}
 *       {selectedKeywords.length > 0 && (
 *         <button onClick={() => setSelectedKeywords([])}>
 *           Clear ({selectedKeywords.length} selected)
 *         </button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Dynamic property filter (user selects property first):
 * ```tsx
 * function DynamicPropertyFilter() {
 *   const { data: properties } = useDatasetProperties()
 *   const [selectedProperty, setSelectedProperty] = useState<string>('')
 *   const [selectedValue, setSelectedValue] = useState<string>('')
 *
 *   // Only fetch values when a property is selected
 *   const { data: values, isLoading, isFetching } = usePropertyValues({
 *     property: selectedProperty,
 *     enabled: !!selectedProperty, // Don't fetch until property is selected
 *   })
 *
 *   return (
 *     <div className="dynamic-filter">
 *       <div className="property-selector">
 *         <label>Filter by field:</label>
 *         <select
 *           value={selectedProperty}
 *           onChange={(e) => {
 *             setSelectedProperty(e.target.value)
 *             setSelectedValue('') // Reset value when property changes
 *           }}
 *         >
 *           <option value="">Choose a field...</option>
 *           {properties?.map(prop => (
 *             <option key={prop} value={prop}>{prop}</option>
 *           ))}
 *         </select>
 *       </div>
 *
 *       {selectedProperty && (
 *         <div className="value-selector">
 *           <label>Filter value:</label>
 *           {isFetching ? (
 *             <div>Loading values...</div>
 *           ) : values && values.length > 0 ? (
 *             <select
 *               value={selectedValue}
 *               onChange={(e) => setSelectedValue(e.target.value)}
 *             >
 *               <option value="">All</option>
 *               {values.map(value => (
 *                 <option key={value} value={value}>{value}</option>
 *               ))}
 *             </select>
 *           ) : (
 *             <div>No values available for {selectedProperty}</div>
 *           )}
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Autocomplete search for publisher names:
 * ```tsx
 * function PublisherSearch({ onSelect }: { onSelect: (publisher: string) => void }) {
 *   const { data: publishers } = usePropertyValues({
 *     property: 'publisher',
 *     staleTime: 600000, // Cache for 10 minutes
 *   })
 *   const [searchTerm, setSearchTerm] = useState('')
 *
 *   const filteredPublishers = publishers?.filter(pub =>
 *     pub.toLowerCase().includes(searchTerm.toLowerCase())
 *   ) || []
 *
 *   return (
 *     <div className="publisher-search">
 *       <input
 *         type="text"
 *         value={searchTerm}
 *         onChange={(e) => setSearchTerm(e.target.value)}
 *         placeholder="Search publishers..."
 *       />
 *
 *       {searchTerm && filteredPublishers.length > 0 && (
 *         <ul className="autocomplete-results">
 *           {filteredPublishers.slice(0, 10).map(publisher => (
 *             <li
 *               key={publisher}
 *               onClick={() => {
 *                 onSelect(publisher)
 *                 setSearchTerm('')
 *               }}
 *             >
 *               {publisher}
 *             </li>
 *           ))}
 *         </ul>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatasetProperties} for listing all available properties
 * @see {@link useAllPropertiesWithValues} for fetching all properties with values at once
 * @see {@link useDatasetFacets} for getting facets with counts
 * @see https://dkan.readthedocs.io/en/latest/apis/dataset-properties.html
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
 * Fetches all dataset properties along with their complete sets of unique values in a single request.
 *
 * This hook provides the most comprehensive view of your dataset catalog's metadata structure
 * by returning a complete map where each property name is paired with an array of all unique
 * values for that property. This is more efficient than making separate requests for each
 * property when you need to build comprehensive faceted search interfaces or property explorers.
 *
 * The returned structure looks like:
 * ```typescript
 * {
 *   theme: ['Health', 'Education', 'Transportation'],
 *   keyword: ['covid-19', 'census', 'climate'],
 *   publisher: ['CDC', 'Department of Education', 'NOAA'],
 *   // ... all other properties
 * }
 * ```
 *
 * This is particularly valuable for building faceted search UIs where you need to display
 * multiple filter options at once, as it loads all the data in a single request rather than
 * requiring multiple calls to {@link usePropertyValues}.
 *
 * Use this hook when you need to:
 * - Build comprehensive faceted search interfaces with multiple filters
 * - Create property/value exploration tools or metadata browsers
 * - Display all available metadata fields and their values at once
 * - Generate data dictionaries or catalog documentation
 * - Build admin dashboards showing metadata coverage
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Object mapping property names to arrays of values
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch all properties and values
 *
 * @example
 * Basic usage - comprehensive faceted search:
 * ```tsx
 * function ComprehensiveFacetedSearch() {
 *   const { data: facets, isLoading } = useAllPropertiesWithValues()
 *   const [filters, setFilters] = useState<Record<string, string[]>>({})
 *
 *   const { data: searchResults } = useDatasetSearch({
 *     searchOptions: filters,
 *   })
 *
 *   if (isLoading) return <div>Loading filters...</div>
 *   if (!facets) return null
 *
 *   const toggleFilter = (property: string, value: string) => {
 *     setFilters(prev => {
 *       const current = prev[property] || []
 *       const updated = current.includes(value)
 *         ? current.filter(v => v !== value)
 *         : [...current, value]
 *
 *       return updated.length > 0
 *         ? { ...prev, [property]: updated }
 *         : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== property))
 *     })
 *   }
 *
 *   return (
 *     <div className="faceted-search">
 *       <aside className="filters">
 *         <h3>Filter Datasets</h3>
 *         {Object.entries(facets).map(([property, values]) => (
 *           <div key={property} className="filter-group">
 *             <h4>{property}</h4>
 *             <div className="filter-values">
 *               {values.slice(0, 10).map(value => (
 *                 <label key={value}>
 *                   <input
 *                     type="checkbox"
 *                     checked={filters[property]?.includes(value)}
 *                     onChange={() => toggleFilter(property, value)}
 *                   />
 *                   {value}
 *                 </label>
 *               ))}
 *               {values.length > 10 && (
 *                 <button className="show-more">
 *                   Show {values.length - 10} more...
 *                 </button>
 *               )}
 *             </div>
 *           </div>
 *         ))}
 *       </aside>
 *
 *       <main className="results">
 *         {searchResults && (
 *           <>
 *             <h2>{searchResults.total} datasets found</h2>
 *             {searchResults.results.map(dataset => (
 *               <div key={dataset.identifier}>{dataset.title}</div>
 *             ))}
 *           </>
 *         )}
 *       </main>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Metadata property explorer with search:
 * ```tsx
 * function PropertyExplorer() {
 *   const { data: properties, isLoading } = useAllPropertiesWithValues({
 *     staleTime: 600000, // Cache for 10 minutes
 *   })
 *   const [searchTerm, setSearchTerm] = useState('')
 *
 *   if (isLoading) return <div>Loading property information...</div>
 *   if (!properties) return null
 *
 *   const filteredProperties = Object.entries(properties).filter(([prop, values]) =>
 *     prop.toLowerCase().includes(searchTerm.toLowerCase()) ||
 *     values.some(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
 *   )
 *
 *   return (
 *     <div className="property-explorer">
 *       <h2>Dataset Metadata Explorer</h2>
 *
 *       <input
 *         type="search"
 *         placeholder="Search properties or values..."
 *         value={searchTerm}
 *         onChange={(e) => setSearchTerm(e.target.value)}
 *       />
 *
 *       <div className="properties-list">
 *         {filteredProperties.map(([prop, values]) => (
 *           <details key={prop} className="property-details">
 *             <summary>
 *               <strong>{prop}</strong>
 *               <span className="value-count">({values.length} unique values)</span>
 *             </summary>
 *             <ul className="values-list">
 *               {values.map(value => (
 *                 <li key={value}>
 *                   <code>{value}</code>
 *                 </li>
 *               ))}
 *             </ul>
 *           </details>
 *         ))}
 *       </div>
 *
 *       <div className="summary">
 *         <p>Total properties: {Object.keys(properties).length}</p>
 *         <p>
 *           Total unique values: {Object.values(properties).reduce((sum, vals) => sum + vals.length, 0)}
 *         </p>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Metadata coverage report:
 * ```tsx
 * function MetadataCoverageReport() {
 *   const { data: properties } = useAllPropertiesWithValues()
 *   const { data: datasets } = useAllDatasets()
 *
 *   if (!properties || !datasets) return <div>Loading...</div>
 *
 *   // Calculate how many datasets have each property populated
 *   const coverage = Object.entries(properties).map(([prop, values]) => {
 *     // This is a simplified example - actual implementation would need
 *     // to count datasets with non-empty values for each property
 *     const valueCount = values.length
 *     const totalDatasets = datasets.length
 *
 *     return {
 *       property: prop,
 *       uniqueValues: valueCount,
 *       coveragePercent: Math.round((valueCount / totalDatasets) * 100),
 *     }
 *   }).sort((a, b) => b.coveragePercent - a.coveragePercent)
 *
 *   return (
 *     <div className="coverage-report">
 *       <h2>Metadata Coverage Report</h2>
 *       <p>Analysis of {datasets.length} datasets</p>
 *
 *       <table>
 *         <thead>
 *           <tr>
 *             <th>Property</th>
 *             <th>Unique Values</th>
 *             <th>Coverage</th>
 *           </tr>
 *         </thead>
 *         <tbody>
 *           {coverage.map(({ property, uniqueValues, coveragePercent }) => (
 *             <tr key={property}>
 *               <td><code>{property}</code></td>
 *               <td>{uniqueValues}</td>
 *               <td>
 *                 <div className="coverage-bar">
 *                   <div
 *                     className="coverage-fill"
 *                     style={{ width: `${coveragePercent}%` }}
 *                   />
 *                   <span>{coveragePercent}%</span>
 *                 </div>
 *               </td>
 *             </tr>
 *           ))}
 *         </tbody>
 *       </table>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Advanced query builder interface:
 * ```tsx
 * function QueryBuilder() {
 *   const { data: properties } = useAllPropertiesWithValues()
 *   const [rules, setRules] = useState<Array<{ property: string; value: string }>>([
 *     { property: '', value: '' },
 *   ])
 *
 *   const addRule = () => {
 *     setRules([...rules, { property: '', value: '' }])
 *   }
 *
 *   const removeRule = (index: number) => {
 *     setRules(rules.filter((_, i) => i !== index))
 *   }
 *
 *   const updateRule = (index: number, field: 'property' | 'value', value: string) => {
 *     const updated = [...rules]
 *     updated[index] = { ...updated[index], [field]: value }
 *     if (field === 'property') {
 *       updated[index].value = '' // Reset value when property changes
 *     }
 *     setRules(updated)
 *   }
 *
 *   if (!properties) return <div>Loading query builder...</div>
 *
 *   return (
 *     <div className="query-builder">
 *       <h3>Advanced Query Builder</h3>
 *
 *       {rules.map((rule, index) => (
 *         <div key={index} className="query-rule">
 *           <select
 *             value={rule.property}
 *             onChange={(e) => updateRule(index, 'property', e.target.value)}
 *           >
 *             <option value="">Select property...</option>
 *             {Object.keys(properties).map(prop => (
 *               <option key={prop} value={prop}>{prop}</option>
 *             ))}
 *           </select>
 *
 *           {rule.property && (
 *             <select
 *               value={rule.value}
 *               onChange={(e) => updateRule(index, 'value', e.target.value)}
 *             >
 *               <option value="">Select value...</option>
 *               {properties[rule.property]?.map(value => (
 *                 <option key={value} value={value}>{value}</option>
 *               ))}
 *             </select>
 *           )}
 *
 *           <button onClick={() => removeRule(index)} disabled={rules.length === 1}>
 *             Remove
 *           </button>
 *         </div>
 *       ))}
 *
 *       <button onClick={addRule}>Add Rule</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatasetProperties} for fetching just the property names
 * @see {@link usePropertyValues} for fetching values for a single property
 * @see {@link useDatasetFacets} for facets with result counts
 * @see https://dkan.readthedocs.io/en/latest/apis/dataset-properties.html
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
