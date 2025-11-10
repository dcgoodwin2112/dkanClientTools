import { useQuery } from '@tanstack/react-query'
import type { DatasetQueryOptions } from '@dkan-client-tools/core'
import { useDkanClient } from './DkanClientProvider'

/**
 * Configuration options for the useDatasetSearch hook.
 */
export interface UseDatasetSearchOptions {
  /**
   * Search and filter options for querying datasets.
   *
   * Supports multiple filter types:
   * - `keyword`: Filter by title, description, or keywords
   * - `fulltext`: Full-text search across all fields
   * - `theme`: Filter by data theme/category
   * - `publisher__name`: Filter by publisher name
   * - `page`: Page number for pagination (0-indexed)
   * - `page-size`: Number of results per page
   * - `sort`: Sort field (e.g., 'modified', 'title')
   * - `sort-order`: Sort direction ('asc' or 'desc')
   *
   * @example { keyword: 'health', theme: 'Healthcare', 'page-size': 20 }
   */
  searchOptions?: DatasetQueryOptions

  /**
   * Whether the query should automatically execute.
   *
   * Set to `false` to disable automatic search until manually triggered.
   * Useful for preventing searches until the user has entered criteria.
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Time in milliseconds before cached search results are considered stale.
   *
   * Search results are typically more dynamic than individual datasets,
   * so you may want a shorter stale time for search queries.
   *
   * @default 60000 (1 minute)
   */
  staleTime?: number

  /**
   * Time in milliseconds before unused cached search results are garbage collected.
   *
   * @default 300000 (5 minutes)
   */
  gcTime?: number
}

/**
 * Search for datasets using various filters and criteria.
 *
 * This hook provides powerful search capabilities including keyword search,
 * full-text search, filtering by theme/publisher, sorting, and pagination.
 * Results are automatically cached and refetched in the background when stale.
 *
 * The search uses DKAN's Search API which indexes dataset metadata for fast
 * querying. All search parameters are optional - calling with no options
 * returns all datasets with default pagination.
 *
 * @param options - Configuration options for dataset search
 *
 * @returns TanStack Query result object containing:
 *   - `data`: Search results object with `total` count and `results` array
 *   - `isLoading`: True during the initial search
 *   - `isFetching`: True whenever a search is in progress
 *   - `isError`: True if the search failed
 *   - `error`: Error object if the request failed
 *   - `refetch`: Function to manually re-run the search
 *
 * @example
 * Basic keyword search:
 * ```tsx
 * function DatasetList() {
 *   const { data, isLoading } = useDatasetSearch({
 *     searchOptions: { keyword: 'health' }
 *   })
 *
 *   if (isLoading) return <div>Searching...</div>
 *
 *   return (
 *     <div>
 *       <p>Found {data?.total} datasets</p>
 *       <ul>
 *         {data?.results.map(dataset => (
 *           <li key={dataset.identifier}>{dataset.title}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Advanced search with multiple filters and pagination:
 * ```tsx
 * function AdvancedSearch() {
 *   const [page, setPage] = useState(0)
 *
 *   const { data } = useDatasetSearch({
 *     searchOptions: {
 *       keyword: 'education',
 *       theme: 'Education',
 *       publisher__name: 'Department of Education',
 *       'page-size': 20,
 *       page: page,
 *       sort: 'modified',
 *       'sort-order': 'desc'
 *     }
 *   })
 *
 *   const totalPages = Math.ceil((data?.total || 0) / 20)
 *
 *   return (
 *     <div>
 *       {/* Results display *\/}
 *       <Pagination
 *         currentPage={page}
 *         totalPages={totalPages}
 *         onPageChange={setPage}
 *       />
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Reactive search with debouncing:
 * ```tsx
 * function SearchBox() {
 *   const [searchTerm, setSearchTerm] = useState('')
 *   const debouncedSearch = useDebounce(searchTerm, 300)
 *
 *   const { data, isFetching } = useDatasetSearch({
 *     searchOptions: {
 *       fulltext: debouncedSearch,
 *       'page-size': 10
 *     },
 *     enabled: debouncedSearch.length > 2, // Only search with 3+ chars
 *     staleTime: 60000 // 1 minute
 *   })
 *
 *   return (
 *     <div>
 *       <input
 *         value={searchTerm}
 *         onChange={(e) => setSearchTerm(e.target.value)}
 *         placeholder="Search datasets..."
 *       />
 *       {isFetching && <span>Searching...</span>}
 *       {data?.results.map(dataset => (
 *         <SearchResult key={dataset.identifier} dataset={dataset} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Faceted search interface:
 * ```tsx
 * function FacetedSearch() {
 *   const [filters, setFilters] = useState({
 *     keyword: '',
 *     theme: '',
 *     publisher: ''
 *   })
 *
 *   const { data } = useDatasetSearch({
 *     searchOptions: {
 *       keyword: filters.keyword || undefined,
 *       theme: filters.theme || undefined,
 *       publisher__name: filters.publisher || undefined,
 *       'page-size': 25
 *     }
 *   })
 *
 *   return (
 *     <div className="search-interface">
 *       <SearchFilters filters={filters} onChange={setFilters} />
 *       <SearchResults results={data?.results || []} />
 *     </div>
 *   )
 * }
 * ```
 *
 * @see {@link useDataset} for fetching a single dataset by ID
 * @see {@link useAllDatasets} for fetching all datasets without search filters
 * @see {@link useDatasetFacets} for getting available filter values
 * @see https://dkan.readthedocs.io/en/latest/apis/search.html
 */
export function useDatasetSearch(options: UseDatasetSearchOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['datasets', 'search', options.searchOptions || {}] as const,
    queryFn: () => client.searchDatasets(options.searchOptions),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  })
}
