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
 * Fetches all datasets from the DKAN catalog with complete DCAT-US metadata.
 *
 * This hook retrieves the entire dataset catalog, making it ideal for building
 * browse pages, generating sitemaps, performing bulk operations, or creating
 * comprehensive dataset lists. Unlike `useDatasetSearch`, this returns all datasets
 * without filtering or pagination.
 *
 * **Performance Note**: This endpoint may return a large number of datasets. For
 * better performance in user-facing interfaces, consider using `useDatasetSearch`
 * with pagination instead.
 *
 * Use this hook when you need to:
 * - Build complete dataset catalogs or directory pages
 * - Generate sitemaps or dataset indices
 * - Perform bulk analysis or exports
 * - Display dataset counts and statistics
 * - Build admin dashboards showing all content
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of all datasets with full DCAT-US metadata
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch all datasets
 *
 * @example
 * Basic usage - list all datasets:
 * ```tsx
 * function DatasetCatalog() {
 *   const { data: datasets, isLoading, error } = useAllDatasets()
 *
 *   if (isLoading) return <div>Loading all datasets...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <div>
 *       <h2>All Datasets ({datasets?.length || 0})</h2>
 *       <ul>
 *         {datasets?.map(dataset => (
 *           <li key={dataset.identifier}>
 *             <h3>{dataset.title}</h3>
 *             <p>{dataset.description}</p>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Dataset statistics dashboard:
 * ```tsx
 * function DatasetStatistics() {
 *   const { data: datasets } = useAllDatasets({
 *     staleTime: 300000, // Cache for 5 minutes
 *   })
 *
 *   if (!datasets) return null
 *
 *   const stats = {
 *     total: datasets.length,
 *     byTheme: datasets.reduce((acc, ds) => {
 *       ds.theme?.forEach(theme => {
 *         acc[theme] = (acc[theme] || 0) + 1
 *       })
 *       return acc
 *     }, {} as Record<string, number>),
 *     byPublisher: datasets.reduce((acc, ds) => {
 *       const pub = ds.publisher?.name || 'Unknown'
 *       acc[pub] = (acc[pub] || 0) + 1
 *       return acc
 *     }, {} as Record<string, number>),
 *   }
 *
 *   return (
 *     <div className="stats-dashboard">
 *       <h2>Dataset Statistics</h2>
 *       <p>Total Datasets: {stats.total}</p>
 *
 *       <h3>By Theme</h3>
 *       <ul>
 *         {Object.entries(stats.byTheme).map(([theme, count]) => (
 *           <li key={theme}>{theme}: {count}</li>
 *         ))}
 *       </ul>
 *
 *       <h3>By Publisher</h3>
 *       <ul>
 *         {Object.entries(stats.byPublisher).map(([pub, count]) => (
 *           <li key={pub}>{pub}: {count}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Export all datasets to CSV:
 * ```tsx
 * function DatasetExporter() {
 *   const { data: datasets, isLoading } = useAllDatasets()
 *
 *   const exportToCSV = () => {
 *     if (!datasets) return
 *
 *     const headers = ['Title', 'Publisher', 'Modified', 'Theme']
 *     const rows = datasets.map(ds => [
 *       ds.title,
 *       ds.publisher?.name || '',
 *       ds.modified || '',
 *       ds.theme?.join('; ') || '',
 *     ])
 *
 *     const csvContent = [
 *       headers.join(','),
 *       ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
 *     ].join('\n')
 *
 *     const blob = new Blob([csvContent], { type: 'text/csv' })
 *     const url = URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = 'datasets.csv'
 *     a.click()
 *     URL.revokeObjectURL(url)
 *   }
 *
 *   return (
 *     <button onClick={exportToCSV} disabled={isLoading || !datasets}>
 *       {isLoading ? 'Loading...' : `Export ${datasets?.length || 0} Datasets to CSV`}
 *     </button>
 *   )
 * }
 * ```
 *
 * @see {@link useDataset} for fetching a single dataset
 * @see {@link useDatasetSearch} for paginated/filtered dataset listing
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
 * Fetches all available metastore schemas from DKAN.
 *
 * The DKAN metastore organizes data into different schemas, each representing a different
 * type of metadata object. The most common schema is "dataset" (DCAT-US), but DKAN can be
 * extended with additional schemas for custom metadata types like data-dictionary,
 * theme-taxonomy, publisher-list, and more.
 *
 * This hook provides access to the complete list of schemas available in your DKAN instance,
 * which is useful for building admin interfaces, metadata browsers, or discovery tools that
 * need to work across different metadata types.
 *
 * Use this hook when you need to:
 * - Build schema selectors in admin interfaces
 * - Discover available metadata types in a DKAN instance
 * - Create generic metastore browsers that work with any schema
 * - Build tools for content migration or bulk operations
 * - Display schema listings in documentation or help interfaces
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of schema IDs (e.g., ['dataset', 'data-dictionary', 'theme'])
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch schemas
 *
 * @example
 * Basic usage - schema selector dropdown:
 * ```tsx
 * function SchemaSelector({ onSelect }: { onSelect: (schema: string) => void }) {
 *   const { data: schemas, isLoading, error } = useSchemas()
 *
 *   if (isLoading) return <div>Loading schemas...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <select onChange={(e) => onSelect(e.target.value)}>
 *       <option value="">Select a schema...</option>
 *       {schemas?.map(schema => (
 *         <option key={schema} value={schema}>{schema}</option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 *
 * @example
 * Schema browser with item counts:
 * ```tsx
 * function SchemaBrowser() {
 *   const { data: schemas, isLoading } = useSchemas()
 *   const [selectedSchema, setSelectedSchema] = useState<string>()
 *
 *   const { data: items } = useSchemaItems({
 *     schemaId: selectedSchema!,
 *     enabled: !!selectedSchema,
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div className="schema-browser">
 *       <h2>Available Schemas</h2>
 *       <ul>
 *         {schemas?.map(schema => (
 *           <li
 *             key={schema}
 *             onClick={() => setSelectedSchema(schema)}
 *             className={selectedSchema === schema ? 'active' : ''}
 *           >
 *             {schema}
 *             {selectedSchema === schema && items && (
 *               <span className="count"> ({items.length} items)</span>
 *             )}
 *           </li>
 *         ))}
 *       </ul>
 *
 *       {selectedSchema && items && (
 *         <div className="items-panel">
 *           <h3>Items in {selectedSchema}</h3>
 *           <ul>
 *             {items.map((item: any) => (
 *               <li key={item.identifier}>{item.title || item.name || item.identifier}</li>
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
 * Custom schema information dashboard:
 * ```tsx
 * function SchemaDashboard() {
 *   const { data: schemas, isLoading } = useSchemas({
 *     staleTime: 600000, // Cache for 10 minutes - schemas rarely change
 *   })
 *
 *   // Fetch items for all schemas
 *   const schemaData = schemas?.map(schemaId => {
 *     const { data: items } = useSchemaItems({ schemaId })
 *     return { schemaId, items }
 *   }) || []
 *
 *   if (isLoading) return <div>Loading schema information...</div>
 *
 *   return (
 *     <div className="schema-dashboard">
 *       <h1>Metastore Overview</h1>
 *       <p>Total Schemas: {schemas?.length || 0}</p>
 *
 *       <div className="schema-cards">
 *         {schemaData.map(({ schemaId, items }) => (
 *           <div key={schemaId} className="schema-card">
 *             <h3>{schemaId}</h3>
 *             <p className="count">
 *               {items ? `${items.length} items` : 'Loading...'}
 *             </p>
 *             <Link to={`/schemas/${schemaId}`}>View Items →</Link>
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useSchemaItems} for fetching items within a specific schema
 * @see https://dkan.readthedocs.io/en/latest/apis/metastore.html
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
 * Fetches all items (records) for a specific metastore schema.
 *
 * While {@link useAllDatasets} is a specialized hook for fetching dataset items,
 * this hook provides a generic way to fetch items from any metastore schema. This is
 * particularly useful for working with custom schemas like data-dictionary, theme-taxonomy,
 * publisher-list, or any other metadata type your DKAN instance supports.
 *
 * Each schema contains a collection of JSON documents that conform to that schema's
 * structure. For example:
 * - The "dataset" schema contains DCAT-US dataset metadata
 * - The "data-dictionary" schema contains Frictionless Data Table Schema definitions
 * - Custom schemas might contain organization info, taxonomy terms, or other metadata
 *
 * Use this hook when you need to:
 * - Fetch items from custom metastore schemas
 * - Build generic metadata browsers that work with any schema
 * - Access data dictionaries, taxonomies, or other non-dataset metadata
 * - Create admin tools for managing metastore content
 * - Build reports or exports across different metadata types
 *
 * @param options - Configuration options including the schema ID
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Array of schema items (structure depends on schema)
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch items
 *
 * @example
 * Basic usage - list all data dictionaries:
 * ```tsx
 * function DataDictionaryList() {
 *   const { data: dictionaries, isLoading, error } = useSchemaItems({
 *     schemaId: 'data-dictionary',
 *   })
 *
 *   if (isLoading) return <div>Loading data dictionaries...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <div>
 *       <h2>Data Dictionaries ({dictionaries?.length || 0})</h2>
 *       <ul>
 *         {dictionaries?.map((dict: any) => (
 *           <li key={dict.identifier}>
 *             {dict.title || dict.identifier}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Conditional fetching with enabled option:
 * ```tsx
 * function SchemaItemViewer() {
 *   const [selectedSchema, setSelectedSchema] = useState<string>('')
 *
 *   const { data: schemas } = useSchemas()
 *
 *   const { data: items, isLoading, isFetching } = useSchemaItems({
 *     schemaId: selectedSchema,
 *     enabled: selectedSchema !== '', // Only fetch when schema is selected
 *   })
 *
 *   return (
 *     <div>
 *       <select
 *         value={selectedSchema}
 *         onChange={(e) => setSelectedSchema(e.target.value)}
 *       >
 *         <option value="">Select a schema...</option>
 *         {schemas?.map(schema => (
 *           <option key={schema} value={schema}>{schema}</option>
 *         ))}
 *       </select>
 *
 *       {isFetching && <div>Loading items...</div>}
 *
 *       {items && (
 *         <div className="items-list">
 *           <h3>{selectedSchema} Items ({items.length})</h3>
 *           <pre>{JSON.stringify(items, null, 2)}</pre>
 *         </div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Custom schema with specific data structure:
 * ```tsx
 * interface ThemeTaxonomy {
 *   identifier: string
 *   data: {
 *     name: string
 *     description: string
 *     parent?: string
 *   }
 * }
 *
 * function ThemeManager() {
 *   const { data: themes, isLoading } = useSchemaItems({
 *     schemaId: 'theme-taxonomy',
 *     staleTime: 600000, // Cache for 10 minutes - themes rarely change
 *   })
 *
 *   const themeList = (themes as ThemeTaxonomy[]) || []
 *
 *   // Build hierarchical structure
 *   const rootThemes = themeList.filter(t => !t.data.parent)
 *   const childThemes = (parentId: string) =>
 *     themeList.filter(t => t.data.parent === parentId)
 *
 *   const ThemeTree = ({ theme }: { theme: ThemeTaxonomy }) => (
 *     <li>
 *       <strong>{theme.data.name}</strong>
 *       {theme.data.description && <p>{theme.data.description}</p>}
 *       {childThemes(theme.identifier).length > 0 && (
 *         <ul>
 *           {childThemes(theme.identifier).map(child => (
 *             <ThemeTree key={child.identifier} theme={child} />
 *           ))}
 *         </ul>
 *       )}
 *     </li>
 *   )
 *
 *   if (isLoading) return <div>Loading theme taxonomy...</div>
 *
 *   return (
 *     <div className="theme-manager">
 *       <h2>Theme Taxonomy</h2>
 *       <ul>
 *         {rootThemes.map(theme => (
 *           <ThemeTree key={theme.identifier} theme={theme} />
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useSchemas} for listing all available schemas
 * @see {@link useAllDatasets} for fetching dataset items specifically
 * @see https://dkan.readthedocs.io/en/latest/apis/metastore.html
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
 * Fetches aggregated dataset facets including themes, keywords, and publishers.
 *
 * Dataset facets provide a complete list of all unique values for key dataset properties
 * across your entire catalog. This is extremely useful for building faceted search interfaces,
 * filter panels, and dataset discovery tools that help users navigate large catalogs.
 *
 * The facets include:
 * - **Themes**: All taxonomy terms used to categorize datasets (e.g., "Health", "Education")
 * - **Keywords**: All tags/keywords used across datasets (e.g., "covid-19", "census")
 * - **Publishers**: All organizations that have published datasets
 *
 * Unlike {@link useDatasetSearch} which returns facet counts for a filtered result set,
 * this hook returns the complete list of all facet values across your entire catalog,
 * making it ideal for building initial filter UIs before any search is performed.
 *
 * Use this hook when you need to:
 * - Build faceted search filter panels
 * - Create dropdown/checkbox filters for themes, keywords, or publishers
 * - Display available filtering options to users
 * - Build tag clouds or category browsers
 * - Generate navigation menus based on dataset categorization
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Object with arrays of theme, keyword, and publisher facets
 *   - `isLoading`: True during initial fetch
 *   - `isError`: True if fetch failed
 *   - `error`: Error object if request failed
 *   - `refetch`: Function to manually re-fetch facets
 *
 * @example
 * Basic usage - simple filter panel:
 * ```tsx
 * function FilterPanel({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
 *   const { data: facets, isLoading } = useDatasetFacets()
 *   const [selectedTheme, setSelectedTheme] = useState<string>()
 *   const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
 *
 *   if (isLoading) return <div>Loading filters...</div>
 *
 *   const handleThemeChange = (theme: string) => {
 *     setSelectedTheme(theme)
 *     onFilterChange({ theme, keyword: selectedKeywords })
 *   }
 *
 *   const handleKeywordToggle = (keyword: string) => {
 *     const newKeywords = selectedKeywords.includes(keyword)
 *       ? selectedKeywords.filter(k => k !== keyword)
 *       : [...selectedKeywords, keyword]
 *     setSelectedKeywords(newKeywords)
 *     onFilterChange({ theme: selectedTheme, keyword: newKeywords })
 *   }
 *
 *   return (
 *     <aside className="filter-panel">
 *       <div className="filter-group">
 *         <h3>Theme</h3>
 *         <select value={selectedTheme || ''} onChange={(e) => handleThemeChange(e.target.value)}>
 *           <option value="">All Themes</option>
 *           {facets?.theme.map(theme => (
 *             <option key={theme} value={theme}>{theme}</option>
 *           ))}
 *         </select>
 *       </div>
 *
 *       <div className="filter-group">
 *         <h3>Keywords</h3>
 *         {facets?.keyword.slice(0, 10).map(keyword => (
 *           <label key={keyword}>
 *             <input
 *               type="checkbox"
 *               checked={selectedKeywords.includes(keyword)}
 *               onChange={() => handleKeywordToggle(keyword)}
 *             />
 *             {keyword}
 *           </label>
 *         ))}
 *       </div>
 *
 *       <div className="filter-group">
 *         <h3>Publisher</h3>
 *         <ul>
 *           {facets?.publisher.map(publisher => (
 *             <li key={publisher}>{publisher}</li>
 *           ))}
 *         </ul>
 *       </div>
 *     </aside>
 *   )
 * }
 * ```
 *
 * @example
 * Tag cloud visualization:
 * ```tsx
 * function KeywordCloud() {
 *   const { data: facets, isLoading } = useDatasetFacets({
 *     staleTime: 600000, // Cache for 10 minutes - facets don't change often
 *   })
 *
 *   if (isLoading) return <div>Loading tag cloud...</div>
 *
 *   // Get top 30 keywords
 *   const topKeywords = facets?.keyword.slice(0, 30) || []
 *
 *   return (
 *     <div className="tag-cloud">
 *       {topKeywords.map((keyword, index) => {
 *         // Vary size based on position (earlier = more common)
 *         const fontSize = Math.max(12, 24 - index / 2)
 *
 *         return (
 *           <a
 *             key={keyword}
 *             href={`/search?keyword=${encodeURIComponent(keyword)}`}
 *             style={{ fontSize: `${fontSize}px` }}
 *             className="tag"
 *           >
 *             {keyword}
 *           </a>
 *         )
 *       })}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Browse datasets by theme with counts:
 * ```tsx
 * function ThemeBrowser() {
 *   const { data: facets } = useDatasetFacets()
 *   const [selectedTheme, setSelectedTheme] = useState<string>()
 *
 *   // Search for datasets with selected theme
 *   const { data: searchResults } = useDatasetSearch({
 *     searchOptions: {
 *       theme: selectedTheme,
 *       'page-size': 100,
 *     },
 *     enabled: !!selectedTheme,
 *   })
 *
 *   // Get counts from search results
 *   const themeCounts = searchResults?.facets?.theme || {}
 *
 *   return (
 *     <div className="theme-browser">
 *       <aside className="theme-list">
 *         <h2>Browse by Theme</h2>
 *         <ul>
 *           {facets?.theme.map(theme => (
 *             <li
 *               key={theme}
 *               onClick={() => setSelectedTheme(theme)}
 *               className={selectedTheme === theme ? 'active' : ''}
 *             >
 *               {theme}
 *               {selectedTheme === theme && themeCounts[theme] && (
 *                 <span className="count"> ({themeCounts[theme]})</span>
 *               )}
 *             </li>
 *           ))}
 *         </ul>
 *       </aside>
 *
 *       <main className="dataset-results">
 *         {selectedTheme && searchResults && (
 *           <>
 *             <h2>{selectedTheme} Datasets</h2>
 *             <p>{searchResults.total} datasets found</p>
 *             <ul>
 *               {searchResults.results.map(dataset => (
 *                 <li key={dataset.identifier}>
 *                   <h3>{dataset.title}</h3>
 *                   <p>{dataset.description}</p>
 *                 </li>
 *               ))}
 *             </ul>
 *           </>
 *         )}
 *       </main>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Multi-select faceted search with active filter display:
 * ```tsx
 * function AdvancedFacetedSearch() {
 *   const { data: facets } = useDatasetFacets()
 *   const [filters, setFilters] = useState<{
 *     themes: string[]
 *     keywords: string[]
 *   }>({ themes: [], keywords: [] })
 *
 *   const { data: results } = useDatasetSearch({
 *     searchOptions: {
 *       theme: filters.themes.length > 0 ? filters.themes : undefined,
 *       keyword: filters.keywords.length > 0 ? filters.keywords : undefined,
 *     },
 *   })
 *
 *   const toggleFilter = (type: 'themes' | 'keywords', value: string) => {
 *     setFilters(prev => ({
 *       ...prev,
 *       [type]: prev[type].includes(value)
 *         ? prev[type].filter(v => v !== value)
 *         : [...prev[type], value],
 *     }))
 *   }
 *
 *   const clearFilters = () => setFilters({ themes: [], keywords: [] })
 *
 *   return (
 *     <div className="faceted-search">
 *       <aside className="facets">
 *         <div className="facet-group">
 *           <h3>Themes</h3>
 *           {facets?.theme.map(theme => (
 *             <label key={theme}>
 *               <input
 *                 type="checkbox"
 *                 checked={filters.themes.includes(theme)}
 *                 onChange={() => toggleFilter('themes', theme)}
 *               />
 *               {theme}
 *             </label>
 *           ))}
 *         </div>
 *
 *         <div className="facet-group">
 *           <h3>Keywords</h3>
 *           {facets?.keyword.slice(0, 20).map(keyword => (
 *             <label key={keyword}>
 *               <input
 *                 type="checkbox"
 *                 checked={filters.keywords.includes(keyword)}
 *                 onChange={() => toggleFilter('keywords', keyword)}
 *               />
 *               {keyword}
 *             </label>
 *           ))}
 *         </div>
 *       </aside>
 *
 *       <main className="results">
 *         {/* Active filters display *\/}
 *         {(filters.themes.length > 0 || filters.keywords.length > 0) && (
 *           <div className="active-filters">
 *             <h4>Active Filters:</h4>
 *             {filters.themes.map(theme => (
 *               <span key={theme} className="filter-badge">
 *                 {theme}
 *                 <button onClick={() => toggleFilter('themes', theme)}>×</button>
 *               </span>
 *             ))}
 *             {filters.keywords.map(keyword => (
 *               <span key={keyword} className="filter-badge">
 *                 {keyword}
 *                 <button onClick={() => toggleFilter('keywords', keyword)}>×</button>
 *               </span>
 *             ))}
 *             <button onClick={clearFilters}>Clear All</button>
 *           </div>
 *         )}
 *
 *         {/* Results *\/}
 *         {results && (
 *           <div>
 *             <p>{results.total} datasets found</p>
 *             {results.results.map(dataset => (
 *               <div key={dataset.identifier}>
 *                 <h3>{dataset.title}</h3>
 *                 <p>{dataset.description}</p>
 *               </div>
 *             ))}
 *           </div>
 *         )}
 *       </main>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDatasetSearch} for searching datasets with faceted results
 * @see {@link useAllDatasets} for fetching all datasets without filtering
 * @see https://dkan.readthedocs.io/en/latest/apis/search.html
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
