import { useQuery } from '@tanstack/react-query'
import type { DataDictionary } from '@dkan-client-tools/core'
import { useDkanClient } from './DkanClientProvider'

/**
 * Configuration options for the useDataDictionary hook.
 */
export interface UseDataDictionaryOptions {
  /**
   * The unique identifier (UUID) of the data dictionary to fetch.
   *
   * Data dictionaries define the schema and metadata for dataset distributions,
   * following the Frictionless Data Table Schema specification.
   */
  identifier: string

  /**
   * Whether the query should automatically execute.
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Time in milliseconds before cached data dictionary is considered stale.
   *
   * Data dictionaries change infrequently, so longer stale times are appropriate.
   *
   * @default 300000 (5 minutes)
   */
  staleTime?: number
}

/**
 * Configuration options for the useDataDictionaryList hook.
 */
export interface UseDataDictionaryListOptions {
  /**
   * Whether the query should automatically execute.
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Time in milliseconds before the cached list is considered stale.
   *
   * @default 300000 (5 minutes)
   */
  staleTime?: number
}

/**
 * Fetches a data dictionary that describes the schema and metadata for a dataset distribution.
 *
 * Data dictionaries follow the Frictionless Data Table Schema specification and provide
 * detailed information about each field/column in a dataset including:
 * - Field names and types (string, integer, date, etc.)
 * - Descriptions and titles for each field
 * - Constraints (required, unique, min/max values, etc.)
 * - Format specifications
 * - Missing value codes
 *
 * Data dictionaries are essential for understanding and validating data, building
 * forms, generating documentation, and creating data visualizations.
 *
 * @param options - Configuration options for fetching the data dictionary
 *
 * @returns TanStack Query result object containing:
 *   - `data`: The data dictionary with schema fields and metadata
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *
 * @example
 * Basic usage - display field information:
 * ```tsx
 * function DataDictionaryViewer({ dictionaryId }: { dictionaryId: string }) {
 *   const { data, isLoading, error } = useDataDictionary({
 *     identifier: dictionaryId
 *   })
 *
 *   if (isLoading) return <div>Loading dictionary...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!data) return null
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>Field Name</th>
 *           <th>Type</th>
 *           <th>Description</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {data.fields.map(field => (
 *           <tr key={field.name}>
 *             <td>{field.name}</td>
 *             <td>{field.type}</td>
 *             <td>{field.description}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   )
 * }
 * ```
 *
 * @example
 * Building a dynamic form from dictionary:
 * ```tsx
 * function DataEntryForm({ dictionaryId }: { dictionaryId: string }) {
 *   const { data: dictionary } = useDataDictionary({ identifier: dictionaryId })
 *   const [formData, setFormData] = useState<Record<string, any>>({})
 *
 *   if (!dictionary) return null
 *
 *   return (
 *     <form>
 *       {dictionary.fields.map(field => (
 *         <div key={field.name}>
 *           <label>{field.title || field.name}</label>
 *           {field.type === 'string' && (
 *             <input
 *               type="text"
 *               value={formData[field.name] || ''}
 *               onChange={(e) => setFormData({
 *                 ...formData,
 *                 [field.name]: e.target.value
 *               })}
 *               required={field.constraints?.required}
 *             />
 *           )}
 *           {field.type === 'integer' && (
 *             <input
 *               type="number"
 *               value={formData[field.name] || ''}
 *               onChange={(e) => setFormData({
 *                 ...formData,
 *                 [field.name]: parseInt(e.target.value)
 *               })}
 *               min={field.constraints?.minimum}
 *               max={field.constraints?.maximum}
 *             />
 *           )}
 *           <small>{field.description}</small>
 *         </div>
 *       ))}
 *       <button type="submit">Submit</button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @see {@link useDataDictionaryList} for fetching all available data dictionaries
 * @see {@link useDataDictionaryFromUrl} for fetching dictionaries by URL
 * @see {@link useDatastoreSchema} for getting schema with dictionary combined
 * @see https://specs.frictionlessdata.io/table-schema/
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
 * Fetches a list of all available data dictionaries in the DKAN instance.
 *
 * This hook retrieves the complete catalog of data dictionaries that have been
 * registered in the system. Data dictionaries can be associated with specific
 * dataset distributions to provide schema information, or they can exist as
 * standalone schema definitions for reuse across multiple datasets.
 *
 * Use this hook when you need to:
 * - Display a catalog of available schemas
 * - Allow users to select a dictionary for a new dataset
 * - Browse schema definitions in an admin interface
 * - Discover what data structures are available in your DKAN instance
 *
 * @param options - Configuration options for fetching the dictionary list
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of data dictionary objects with identifiers and metadata
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch the list
 *
 * @example
 * Basic usage - list all dictionaries:
 * ```tsx
 * function DataDictionaryBrowser() {
 *   const { data: dictionaries, isLoading, error } = useDataDictionaryList()
 *
 *   if (isLoading) return <div>Loading dictionaries...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!dictionaries) return null
 *
 *   return (
 *     <div>
 *       <h2>Available Data Dictionaries</h2>
 *       <ul>
 *         {dictionaries.map(dict => (
 *           <li key={dict.identifier}>
 *             <h3>{dict.title}</h3>
 *             <p>{dict.description}</p>
 *             <small>ID: {dict.identifier}</small>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Dictionary selector for admin forms:
 * ```tsx
 * function DictionarySelector({ onSelect }: { onSelect: (id: string) => void }) {
 *   const { data: dictionaries, isLoading } = useDataDictionaryList({
 *     staleTime: 600000, // Cache for 10 minutes - dictionaries rarely change
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!dictionaries) return null
 *
 *   return (
 *     <select onChange={(e) => onSelect(e.target.value)}>
 *       <option value="">Select a data dictionary...</option>
 *       {dictionaries.map(dict => (
 *         <option key={dict.identifier} value={dict.identifier}>
 *           {dict.title} ({dict.fields?.length || 0} fields)
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 *
 * @example
 * Dictionary catalog with search:
 * ```tsx
 * function DictionaryCatalog() {
 *   const { data: dictionaries } = useDataDictionaryList()
 *   const [search, setSearch] = useState('')
 *
 *   const filtered = dictionaries?.filter(dict =>
 *     dict.title?.toLowerCase().includes(search.toLowerCase()) ||
 *     dict.description?.toLowerCase().includes(search.toLowerCase())
 *   )
 *
 *   return (
 *     <div>
 *       <input
 *         type="search"
 *         placeholder="Search dictionaries..."
 *         value={search}
 *         onChange={(e) => setSearch(e.target.value)}
 *       />
 *       <div className="catalog">
 *         {filtered?.map(dict => (
 *           <div key={dict.identifier} className="dictionary-card">
 *             <h3>{dict.title}</h3>
 *             <p>{dict.description}</p>
 *             <div className="metadata">
 *               <span>{dict.fields?.length || 0} fields</span>
 *               <Link to={`/dictionaries/${dict.identifier}`}>
 *                 View Details
 *               </Link>
 *             </div>
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDataDictionary} for fetching a specific dictionary by ID
 * @see {@link useDataDictionaryFromUrl} for fetching dictionaries by URL
 * @see {@link useCreateDataDictionary} for creating new dictionaries
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
 * Fetches a data dictionary from a URL, typically referenced in dataset distribution metadata.
 *
 * In DCAT-US metadata, dataset distributions often include a `describedBy` property that
 * points to a data dictionary URL. This hook fetches the dictionary from that URL, allowing
 * you to dynamically load schema information for any distribution.
 *
 * This is particularly useful when:
 * - Working with external data dictionaries hosted elsewhere
 * - Following `distribution.describedBy` references from dataset metadata
 * - Building dynamic schema viewers that adapt to distribution metadata
 * - Integrating with third-party schema repositories
 *
 * The URL can point to any valid data dictionary JSON resource following the
 * Frictionless Data Table Schema specification.
 *
 * @param options - Configuration options including the dictionary URL
 *
 * @returns TanStack Query result object containing:
 *   - `data`: The data dictionary object with schema fields and metadata
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch from the URL
 *
 * @example
 * Basic usage - load dictionary from distribution metadata:
 * ```tsx
 * function DistributionSchema({ distribution }: { distribution: Distribution }) {
 *   const { data: dictionary, isLoading, error } = useDataDictionaryFromUrl({
 *     url: distribution.describedBy,
 *     enabled: !!distribution.describedBy, // Only fetch if URL exists
 *   })
 *
 *   if (!distribution.describedBy) {
 *     return <div>No data dictionary available</div>
 *   }
 *
 *   if (isLoading) return <div>Loading schema...</div>
 *   if (error) return <div>Error loading schema: {error.message}</div>
 *   if (!dictionary) return null
 *
 *   return (
 *     <div>
 *       <h3>Data Schema</h3>
 *       <table>
 *         <thead>
 *           <tr>
 *             <th>Field</th>
 *             <th>Type</th>
 *             <th>Description</th>
 *           </tr>
 *         </thead>
 *         <tbody>
 *           {dictionary.fields.map(field => (
 *             <tr key={field.name}>
 *               <td>{field.name}</td>
 *               <td>{field.type}</td>
 *               <td>{field.description}</td>
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
 * Using with dataset to show schema for each distribution:
 * ```tsx
 * function DatasetWithSchemas({ datasetId }: { datasetId: string }) {
 *   const { data: dataset } = useDataset({ identifier: datasetId })
 *
 *   if (!dataset) return null
 *
 *   return (
 *     <div>
 *       <h2>{dataset.title}</h2>
 *       {dataset.distribution.map((dist, index) => (
 *         <DistributionWithSchema
 *           key={dist.identifier || index}
 *           distribution={dist}
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 *
 * function DistributionWithSchema({ distribution }: { distribution: Distribution }) {
 *   const { data: schema } = useDataDictionaryFromUrl({
 *     url: distribution.describedBy,
 *     enabled: !!distribution.describedBy,
 *     staleTime: 600000, // Cache for 10 minutes
 *   })
 *
 *   return (
 *     <div className="distribution">
 *       <h3>{distribution.title}</h3>
 *       <p>Format: {distribution.format}</p>
 *       {schema && (
 *         <div className="schema-info">
 *           <strong>Schema:</strong> {schema.fields.length} fields
 *           <ul>
 *             {schema.fields.map(f => (
 *               <li key={f.name}>{f.name} ({f.type})</li>
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
 * Conditional loading with fallback to ID-based lookup:
 * ```tsx
 * function SmartDictionaryLoader({
 *   dictionaryUrl,
 *   dictionaryId,
 * }: {
 *   dictionaryUrl?: string
 *   dictionaryId?: string
 * }) {
 *   // Try URL first if available
 *   const { data: urlDict, isLoading: urlLoading } = useDataDictionaryFromUrl({
 *     url: dictionaryUrl || '',
 *     enabled: !!dictionaryUrl,
 *   })
 *
 *   // Fall back to ID lookup if no URL
 *   const { data: idDict, isLoading: idLoading } = useDataDictionary({
 *     identifier: dictionaryId || '',
 *     enabled: !dictionaryUrl && !!dictionaryId,
 *   })
 *
 *   const dictionary = urlDict || idDict
 *   const isLoading = urlLoading || idLoading
 *
 *   if (isLoading) return <div>Loading dictionary...</div>
 *   if (!dictionary) return <div>No dictionary available</div>
 *
 *   return <DictionaryViewer dictionary={dictionary} />
 * }
 * ```
 *
 * @see {@link useDataDictionary} for fetching dictionaries by identifier
 * @see {@link useDatastoreSchema} for getting datastore schema with dictionary
 * @see https://specs.frictionlessdata.io/table-schema/
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
 * Fetches the complete datastore schema including data dictionary information.
 *
 * This hook combines the datastore's internal schema with any associated data dictionary,
 * providing a unified view of the data structure. It's particularly useful when you need
 * both the technical database schema (column names, SQL types) and the human-readable
 * metadata from the data dictionary (field descriptions, constraints, formats).
 *
 * The returned schema follows the Frictionless Data Table Schema specification and includes:
 * - Field names and types from the datastore
 * - Enhanced metadata from the data dictionary (if available)
 * - Constraints and validation rules
 * - Format specifications
 * - Human-readable titles and descriptions
 *
 * Use this hook when you need to:
 * - Build data validation forms with proper constraints
 * - Generate documentation for datasets
 * - Create data entry interfaces with field metadata
 * - Validate data against the schema before importing
 * - Display rich field information in data tables
 *
 * @param options - Configuration options for fetching the datastore schema
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Schema object with fields array and metadata
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch the schema
 *
 * @example
 * Basic usage - display schema information:
 * ```tsx
 * function SchemaViewer({ datasetId }: { datasetId: string }) {
 *   const { data: schema, isLoading, error } = useDatastoreSchema({
 *     datasetId,
 *     index: 0,
 *   })
 *
 *   if (isLoading) return <div>Loading schema...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!schema) return null
 *
 *   return (
 *     <div>
 *       <h2>Dataset Schema</h2>
 *       <table>
 *         <thead>
 *           <tr>
 *             <th>Field Name</th>
 *             <th>Type</th>
 *             <th>Format</th>
 *             <th>Required</th>
 *             <th>Description</th>
 *           </tr>
 *         </thead>
 *         <tbody>
 *           {schema.fields.map(field => (
 *             <tr key={field.name}>
 *               <td><code>{field.name}</code></td>
 *               <td>{field.type}</td>
 *               <td>{field.format || '-'}</td>
 *               <td>{field.constraints?.required ? 'Yes' : 'No'}</td>
 *               <td>{field.description || '-'}</td>
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
 * Building a validated data entry form:
 * ```tsx
 * function DataEntryForm({ datasetId }: { datasetId: string }) {
 *   const { data: schema } = useDatastoreSchema({ datasetId })
 *   const [formData, setFormData] = useState<Record<string, any>>({})
 *   const [errors, setErrors] = useState<Record<string, string>>({})
 *
 *   const validateField = (field: Field, value: any) => {
 *     const constraints = field.constraints
 *     if (!constraints) return null
 *
 *     if (constraints.required && !value) {
 *       return `${field.title || field.name} is required`
 *     }
 *     if (field.type === 'integer' && isNaN(parseInt(value))) {
 *       return 'Must be a valid integer'
 *     }
 *     if (constraints.minimum && value < constraints.minimum) {
 *       return `Must be at least ${constraints.minimum}`
 *     }
 *     if (constraints.maximum && value > constraints.maximum) {
 *       return `Must be at most ${constraints.maximum}`
 *     }
 *     return null
 *   }
 *
 *   const handleSubmit = (e: React.FormEvent) => {
 *     e.preventDefault()
 *     const newErrors: Record<string, string> = {}
 *
 *     schema?.fields.forEach(field => {
 *       const error = validateField(field, formData[field.name])
 *       if (error) newErrors[field.name] = error
 *     })
 *
 *     if (Object.keys(newErrors).length > 0) {
 *       setErrors(newErrors)
 *       return
 *     }
 *
 *     // Submit data
 *     console.log('Valid data:', formData)
 *   }
 *
 *   if (!schema) return null
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {schema.fields.map(field => (
 *         <div key={field.name}>
 *           <label>
 *             {field.title || field.name}
 *             {field.constraints?.required && <span>*</span>}
 *           </label>
 *           <input
 *             type={field.type === 'integer' ? 'number' : 'text'}
 *             value={formData[field.name] || ''}
 *             onChange={(e) => setFormData({
 *               ...formData,
 *               [field.name]: e.target.value
 *             })}
 *             min={field.constraints?.minimum}
 *             max={field.constraints?.maximum}
 *           />
 *           {errors[field.name] && (
 *             <span className="error">{errors[field.name]}</span>
 *           )}
 *           {field.description && (
 *             <small>{field.description}</small>
 *           )}
 *         </div>
 *       ))}
 *       <button type="submit">Submit</button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example
 * Generate schema documentation:
 * ```tsx
 * function SchemaDocumentation({ datasetId }: { datasetId: string }) {
 *   const { data: dataset } = useDataset({ identifier: datasetId })
 *   const { data: schema } = useDatastoreSchema({
 *     datasetId,
 *     index: 0,
 *     staleTime: 600000, // Cache for 10 minutes
 *   })
 *
 *   if (!dataset || !schema) return null
 *
 *   return (
 *     <div className="documentation">
 *       <h1>{dataset.title}</h1>
 *       <p>{dataset.description}</p>
 *
 *       <h2>Data Structure</h2>
 *       <p>This dataset contains {schema.fields.length} fields:</p>
 *
 *       {schema.fields.map(field => (
 *         <div key={field.name} className="field-doc">
 *           <h3>
 *             <code>{field.name}</code>
 *             <span className="type-badge">{field.type}</span>
 *           </h3>
 *           {field.title && <h4>{field.title}</h4>}
 *           {field.description && <p>{field.description}</p>}
 *
 *           {field.format && (
 *             <div className="metadata">
 *               <strong>Format:</strong> <code>{field.format}</code>
 *             </div>
 *           )}
 *
 *           {field.constraints && (
 *             <div className="constraints">
 *               <strong>Constraints:</strong>
 *               <ul>
 *                 {field.constraints.required && <li>Required field</li>}
 *                 {field.constraints.unique && <li>Must be unique</li>}
 *                 {field.constraints.minimum !== undefined && (
 *                   <li>Minimum: {field.constraints.minimum}</li>
 *                 )}
 *                 {field.constraints.maximum !== undefined && (
 *                   <li>Maximum: {field.constraints.maximum}</li>
 *                 )}
 *                 {field.constraints.pattern && (
 *                   <li>Pattern: <code>{field.constraints.pattern}</code></li>
 *                 )}
 *               </ul>
 *             </div>
 *           )}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDataDictionary} for fetching just the data dictionary
 * @see {@link useDatastore} for querying the actual data
 * @see https://specs.frictionlessdata.io/table-schema/
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
