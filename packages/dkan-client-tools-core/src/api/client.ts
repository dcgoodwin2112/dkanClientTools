/**
 * DkanApiClient - Low-level HTTP client for DKAN REST API
 *
 * Provides direct access to all DKAN REST API endpoints without caching.
 * This class handles HTTP requests, authentication, retries, and error handling.
 *
 * **Important**: For most applications, use the framework-specific hooks/composables
 * from `@dkan-client-tools/react` or `@dkan-client-tools/vue` instead of calling
 * these methods directly. The hooks provide automatic caching, background refetching,
 * and better integration with React/Vue.
 *
 * **When to Use DkanApiClient Directly**:
 * - Server-side operations (Node.js scripts, serverless functions)
 * - Custom integrations that don't use TanStack Query
 * - One-off data fetches outside component lifecycle
 * - Building custom framework adapters
 *
 * **API Coverage** (42 methods across 9 categories):
 *
 * 1. **Dataset Operations** (7 methods)
 *    - getDataset, searchDatasets, listAllDatasets
 *    - createDataset, updateDataset, patchDataset, deleteDataset
 *
 * 2. **Datastore Query** (4 methods)
 *    - queryDatastore, queryDatastoreMulti, getDatastoreSchema, querySql
 *
 * 3. **Datastore Download** (2 methods)
 *    - downloadQuery, downloadQueryByDistribution
 *
 * 4. **Data Dictionary** (6 methods)
 *    - getDataDictionary, listDataDictionaries, getDataDictionaryFromUrl
 *    - createDataDictionary, updateDataDictionary, deleteDataDictionary
 *
 * 5. **Harvest Operations** (6 methods)
 *    - listHarvestPlans, getHarvestPlan, registerHarvestPlan
 *    - listHarvestRuns, getHarvestRun, runHarvest
 *
 * 6. **Datastore Imports** (4 methods)
 *    - listDatastoreImports, getDatastoreStatistics
 *    - triggerDatastoreImport, deleteDatastore
 *
 * 7. **Metastore** (4 methods)
 *    - listSchemas, getSchema, getSchemaItems, getDatasetFacets
 *
 * 8. **Revisions & Moderation** (4 methods)
 *    - getRevisions, getRevision, createRevision, changeDatasetState
 *
 * 9. **Utility** (3 methods)
 *     - getBaseUrl, getDefaultOptions, getOpenApiDocsUrl
 *
 * **Authentication**:
 * - HTTP Basic Authentication (username + password)
 * - Bearer token authentication
 * - Anonymous access for public endpoints
 *
 * **Error Handling**:
 * - Automatic retry with configurable attempts and delays
 * - DkanApiError with status codes and error messages
 * - Network error handling
 *
 * @example
 * Basic usage with authentication:
 * ```typescript
 * import { DkanApiClient } from '@dkan-client-tools/core'
 *
 * const client = new DkanApiClient({
 *   baseUrl: 'https://data.example.com',
 *   auth: {
 *     username: 'admin',
 *     password: 'password'
 *   },
 *   defaultOptions: {
 *     retry: 3,
 *     retryDelay: 1000
 *   }
 * })
 *
 * // Fetch a dataset
 * const response = await client.getDataset('abc-123')
 * console.log(response.data)
 * ```
 *
 * @example
 * Server-side data fetch:
 * ```typescript
 * // In a Node.js script or serverless function
 * const client = new DkanApiClient({
 *   baseUrl: process.env.DKAN_URL!
 * })
 *
 * // Search for datasets
 * const results = await client.searchDatasets({
 *   searchOptions: { keyword: 'environment' }
 * })
 *
 * // Process results
 * for (const dataset of results.data.results) {
 *   console.log(`Processing: ${dataset.title}`)
 * }
 * ```
 *
 * @see {@link DkanClient} for the higher-level client with caching
 */

import type {
  DkanClientConfig,
  DkanDataset,
  DkanSearchResponse,
  DkanDatastoreQueryResponse,
  DatasetQueryOptions,
  DatastoreQueryOptions,
  DkanApiResponse,
  DataDictionary,
  DataDictionaryListResponse,
  HarvestPlan,
  HarvestRun,
  HarvestRunOptions,
  DatastoreImport,
  DatastoreImportOptions,
  DatastoreStatistics,
  JsonSchema,
  FacetsApiResponse,
  FacetItem,
  MetastoreWriteResponse,
  MetastoreRevision,
  MetastoreNewRevision,
  WorkflowState,
  QueryDownloadOptions,
  SqlQueryOptions,
  SqlQueryResult,
} from '../types'
import { DkanApiError } from '../types'

export class DkanApiClient {
  private baseUrl: string
  private auth?: { username: string; password: string } | { token: string }
  private defaultOptions: Required<NonNullable<DkanClientConfig['defaultOptions']>>

  constructor(config: DkanClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')

    // Type guard for auth
    if (config.auth) {
      if ('token' in config.auth && config.auth.token) {
        this.auth = { token: config.auth.token }
      } else if ('username' in config.auth && 'password' in config.auth && config.auth.username && config.auth.password) {
        this.auth = { username: config.auth.username, password: config.auth.password }
      }
    }

    this.defaultOptions = {
      retry: config.defaultOptions?.retry ?? 3,
      retryDelay: config.defaultOptions?.retryDelay ?? 1000,
      staleTime: config.defaultOptions?.staleTime ?? 0,
      cacheTime: config.defaultOptions?.cacheTime ?? 5 * 60 * 1000, // 5 minutes
    }
  }

  /**
   * Get the authorization header
   */
  private getAuthHeader(): string | undefined {
    if (!this.auth) return undefined

    if ('token' in this.auth) {
      return `Bearer ${this.auth.token}`
    }

    if ('username' in this.auth && 'password' in this.auth) {
      const credentials = btoa(`${this.auth.username}:${this.auth.password}`)
      return `Basic ${credentials}`
    }

    return undefined
  }

  /**
   * Make a request with retry logic
   */
  private async request<T>(
    path: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<DkanApiResponse<T>> {
    const url = `${this.baseUrl}${path}`
    const authHeader = this.getAuthHeader()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any
        let timestamp: string | undefined
        let data: Record<string, any> | undefined

        // Try to parse error response as JSON
        try {
          errorData = JSON.parse(errorText)
          timestamp = errorData.timestamp
          data = errorData.data
        } catch {
          // Not JSON, keep as text
        }

        throw new DkanApiError(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorText,
          timestamp,
          data
        )
      }

      const data = await response.json() as T

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      }
    } catch (error) {
      // Retry logic
      if (retryCount < this.defaultOptions.retry) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.defaultOptions.retryDelay * (retryCount + 1))
        )
        return this.request<T>(path, options, retryCount + 1)
      }

      if (error instanceof DkanApiError) {
        throw error
      }

      throw new DkanApiError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
    }
  }

  /**
   * Fetch a single dataset by identifier
   *
   * @param identifier - Dataset identifier
   * @param options - Optional parameters
   * @param options.showReferenceIds - Include internal reference IDs (distribution identifiers)
   * @returns Dataset metadata
   *
   * @example
   * ```typescript
   * // Get dataset with distribution identifiers
   * const dataset = await client.getDataset('abc-123', { showReferenceIds: true })
   * console.log(dataset.distribution[0].identifier) // Distribution UUID
   * ```
   */
  async getDataset(
    identifier: string,
    options?: { showReferenceIds?: boolean }
  ): Promise<DkanDataset> {
    const queryParams = options?.showReferenceIds ? '?show-reference-ids' : ''
    const response = await this.request<DkanDataset>(
      `/api/1/metastore/schemas/dataset/items/${identifier}${queryParams}`
    )
    return response.data
  }

  /**
   * Helper function to append string or array values to URLSearchParams
   * Reduces code duplication for handling both single and array parameter values
   */
  private appendArrayOrString(
    params: URLSearchParams,
    key: string,
    value: string | string[]
  ): void {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v))
    } else {
      params.append(key, value)
    }
  }

  /**
   * Serialize datastore query options as URL query parameters
   * Used for GET requests to datastore query endpoints
   */
  private serializeQueryOptions(options: DatastoreQueryOptions): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        params.append(key, typeof value === 'string' ? value : JSON.stringify(value))
      }
    }
    return params.toString()
  }

  /**
   * Search datasets with filters
   *
   *
   * @param options - Search options for filtering and pagination
   * @param options.keyword - Filter by keyword/tag
   * @param options.theme - Filter by theme category
   * @param options.fulltext - Full-text search across all fields
   * @param options.sort - Sort field(s) - single string or array
   * @param options.sort-order - Sort order(s) - 'asc' or 'desc', single or array
   * @param options.page - Page number for pagination (0-based)
   * @param options.page-size - Number of results per page
   * @returns Search results with total count, dataset array, and facets
   * @throws {DkanApiError} If request fails
   */
  async searchDatasets(options: DatasetQueryOptions = {}): Promise<DkanSearchResponse> {
    const params = new URLSearchParams()

    if (options.keyword) params.append('keyword', options.keyword)
    if (options.theme) params.append('theme', options.theme)
    if (options.fulltext) params.append('fulltext', options.fulltext)

    // Handle array or string for sort parameters
    if (options.sort) {
      this.appendArrayOrString(params, 'sort', options.sort)
    }
    if (options['sort-order']) {
      this.appendArrayOrString(params, 'sort-order', options['sort-order'])
    }

    if (options.page !== undefined) params.append('page', options.page.toString())
    if (options['page-size'] !== undefined)
      params.append('page-size', options['page-size'].toString())

    const queryString = params.toString()
    const path = `/api/1/search${queryString ? `?${queryString}` : ''}`

    const response = await this.request<any>(path)

    // Transform response: DKAN returns results as object, we need array
    const data = response.data
    let results: any[] = []

    if (data.results && typeof data.results === 'object') {
      // Convert results object to array
      results = Object.values(data.results)
    }

    return {
      total: typeof data.total === 'string' ? parseInt(data.total, 10) : data.total,
      results,
      facets: data.facets,
    }
  }

  /**
   * Query datastore for a specific dataset resource
   *
   *
   * @param datasetId - Dataset identifier (UUID or custom ID)
   * @param index - Resource index in dataset.distribution array (default: 0)
   * @param options - Query options for filtering, sorting, pagination
   * @param options.conditions - Filter conditions (property, value, operator)
   * @param options.limit - Maximum number of records to return
   * @param options.offset - Number of records to skip for pagination
   * @param options.sort - Sort configuration (property, order)
   * @param options.keys - Specific columns to return
   * @param options.joins - Join configuration for multi-resource queries
   * @param method - HTTP method: POST (default) or GET
   * @returns Query results including schema and result rows
   * @throws {DkanApiError} If resource not found or request fails
   */
  async queryDatastore(
    datasetId: string,
    index = 0,
    options: DatastoreQueryOptions = {},
    method: 'GET' | 'POST' = 'POST'
  ): Promise<DkanDatastoreQueryResponse> {
    if (method === 'GET') {
      const queryString = this.serializeQueryOptions(options)
      const url = queryString
        ? `/api/1/datastore/query/${datasetId}/${index}?${queryString}`
        : `/api/1/datastore/query/${datasetId}/${index}`

      const response = await this.request<DkanDatastoreQueryResponse>(url)
      return response.data
    }

    // Default POST behavior
    const response = await this.request<DkanDatastoreQueryResponse>(
      `/api/1/datastore/query/${datasetId}/${index}`,
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    )
    return response.data
  }

  /**
   * Query multiple datastore resources with joins
   *
   * @param options - Query options with resources array for multi-resource queries
   * @param options.resources - Array of resources to query (id, alias)
   * @param options.joins - Join conditions between resources
   * @param options.conditions - Filter conditions across resources
   * @param options.limit - Maximum number of records to return
   * @param options.offset - Number of records to skip for pagination
   * @param options.sort - Sort configuration
   * @param options.keys - Specific columns to return
   * @param method - HTTP method: POST (default) or GET
   * @returns Query results including schema and result rows
   * @throws {DkanApiError} If resource not found or request fails
   *
   * @example
   * // Join two resources
   * const results = await client.queryDatastoreMulti({
   *   resources: [
   *     { id: 'resource-1', alias: 'r1' },
   *     { id: 'resource-2', alias: 'r2' }
   *   ],
   *   joins: [{ resource: 'r2', condition: 'r1.id = r2.ref_id' }],
   *   conditions: [{ property: 'r1.name', value: 'Test' }],
   *   limit: 100
   * });
   */
  async queryDatastoreMulti(
    options: DatastoreQueryOptions,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<DkanDatastoreQueryResponse> {
    if (method === 'GET') {
      const queryString = this.serializeQueryOptions(options)
      const url = queryString
        ? `/api/1/datastore/query?${queryString}`
        : '/api/1/datastore/query'

      const response = await this.request<DkanDatastoreQueryResponse>(url)
      return response.data
    }

    // Default POST behavior
    const response = await this.request<DkanDatastoreQueryResponse>(
      '/api/1/datastore/query',
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    )
    return response.data
  }

  /**
   * Get datastore schema with data dictionary (if available)
   *
   * Returns the table schema including column definitions and data dictionary
   * metadata if a data dictionary is associated with the distribution.
   *
   * @param datasetId - Dataset identifier (UUID or custom ID)
   * @param index - Resource index in dataset.distribution array (default: 0)
   * @returns Query response containing schema information and empty results
   * @throws {DkanApiError} If resource not found or request fails
   */
  async getDatastoreSchema(
    datasetId: string,
    index = 0
  ): Promise<DkanDatastoreQueryResponse> {
    const response = await this.request<DkanDatastoreQueryResponse>(
      `/api/1/datastore/query/${datasetId}/${index}?schema=true`
    )
    return response.data
  }

  /**
   * Get all data dictionaries
   *
   * Retrieves all data dictionary definitions from the metastore.
   * Data dictionaries follow the Frictionless Table Schema specification.
   *
   * @returns Array of data dictionary objects
   * @throws {DkanApiError} If request fails
   */
  async listDataDictionaries(): Promise<DataDictionary[]> {
    const response = await this.request<any>(
      '/api/1/metastore/schemas/data-dictionary/items'
    )

    // The response might be an object with data array or just an array
    if (response.data && Array.isArray(response.data)) {
      return response.data
    } else if (response.data && typeof response.data === 'object') {
      // If it's an object, convert to array
      return Object.values(response.data)
    }

    return []
  }

  /**
   * Get a specific data dictionary by identifier
   *
   * Retrieves a single data dictionary by its unique identifier.
   * Data dictionaries define column schemas and constraints for distributions.
   *
   * @param identifier - Data dictionary identifier (UUID or custom ID)
   * @returns Data dictionary object with schema and field definitions
   * @throws {DkanApiError} If data dictionary not found or request fails
   */
  async getDataDictionary(identifier: string): Promise<DataDictionary> {
    const response = await this.request<DataDictionary>(
      `/api/1/metastore/schemas/data-dictionary/items/${identifier}`
    )
    return response.data
  }

  /**
   * Get data dictionary from a distribution's describedBy URL
   *
   * Fetches a data dictionary from a remote URL. This is useful when
   * a distribution has a describedBy property pointing to an external
   * data dictionary definition.
   *
   * @param url - Full URL to the data dictionary JSON file
   * @returns Data dictionary object from the remote URL
   * @throws {DkanApiError} If URL cannot be fetched or request fails
   */
  async getDataDictionaryFromUrl(url: string): Promise<DataDictionary> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new DkanApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }
      return await response.json()
    } catch (error) {
      if (error instanceof DkanApiError) {
        throw error
      }
      throw new DkanApiError(
        error instanceof Error ? error.message : 'Failed to fetch data dictionary'
      )
    }
  }

  /**
   * Get all datasets from metastore
   *
   * Returns full metadata objects for all datasets in the catalog.
   * Use listDatasets() for just the identifiers, or searchDatasets() for filtered results.
   *
   * @returns Array of complete dataset metadata objects
   * @throws {DkanApiError} If request fails
   */
  async listAllDatasets(): Promise<DkanDataset[]> {
    const response = await this.request<any>(
      '/api/1/metastore/schemas/dataset/items'
    )

    // Response might be an object with data array or just an array
    if (response.data && Array.isArray(response.data)) {
      return response.data
    } else if (response.data && typeof response.data === 'object') {
      // If it's an object, convert to array
      return Object.values(response.data)
    }

    return []
  }

  /**
   * List all available metastore schemas
   *
   * Returns the schema types available in the metastore.
   * Common schemas: 'dataset', 'data-dictionary', 'distribution'.
   *
   * @returns Array of schema type identifiers
   * @throws {DkanApiError} If request fails
   */
  async listSchemas(): Promise<string[]> {
    const response = await this.request<any>('/api/1/metastore/schemas')

    if (Array.isArray(response.data)) {
      return response.data
    } else if (typeof response.data === 'object') {
      return Object.keys(response.data)
    }

    return []
  }

  /**
   * Get a specific schema definition
   *
   *
   * Retrieves the JSON Schema definition for a specific metastore schema type.
   * The schema defines the structure, validation rules, and allowed properties
   * for items of that type.
   *
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @returns JSON Schema definition with properties and validation rules
   * @throws {DkanApiError} If schema not found or request fails
   */
  async getSchema(schemaId: string): Promise<JsonSchema> {
    const response = await this.request<JsonSchema>(
      `/api/1/metastore/schemas/${schemaId}`
    )
    return response.data
  }

  /**
   * Get items for a specific schema type
   *
   * Retrieves all items of a specific schema type from the metastore.
   * For example, all datasets, all data dictionaries, or all distributions.
   *
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param options - Optional parameters
   * @param options.showReferenceIds - Include internal reference IDs for nested items
   * @returns Array of items matching the schema type
   * @throws {DkanApiError} If schema not found or request fails
   *
   * @example
   * ```typescript
   * // Get all datasets with distribution identifiers
   * const datasets = await client.getSchemaItems('dataset', { showReferenceIds: true })
   * ```
   */
  async getSchemaItems(
    schemaId: string,
    options?: { showReferenceIds?: boolean }
  ): Promise<any[]> {
    const queryParams = options?.showReferenceIds ? '?show-reference-ids' : ''
    const response = await this.request<any>(
      `/api/1/metastore/schemas/${schemaId}/items${queryParams}`
    )

    if (response.data && Array.isArray(response.data)) {
      return response.data
    } else if (response.data && typeof response.data === 'object') {
      return Object.values(response.data)
    }

    return []
  }

  /**
   * Get facet values for datasets (themes, keywords, publishers)
   *
   * Retrieves all unique values for theme, keyword, and publisher facets
   * across all datasets. Useful for building filter UIs.
   *
   * @returns Object containing arrays of unique theme, keyword, and publisher values
   * @throws {DkanApiError} If request fails
   */
  async getDatasetFacets(): Promise<{
    theme: string[]
    keyword: string[]
    publisher: string[]
  }> {
    const response = await this.request<FacetsApiResponse>('/api/1/search/facets')

    // Transform API response to expected format
    const facets = {
      theme: [] as string[],
      keyword: [] as string[],
      publisher: [] as string[],
    }

    if (Array.isArray(response.data)) {
      response.data.forEach((facet: FacetItem) => {
        if (facet.type === 'theme' && Array.isArray(facet.values)) {
          facets.theme = facet.values.map(v => typeof v === 'string' ? v : v.value || '')
        } else if (facet.type === 'keyword' && Array.isArray(facet.values)) {
          facets.keyword = facet.values.map(v => typeof v === 'string' ? v : v.value || '')
        } else if (facet.type === 'publisher' && Array.isArray(facet.values)) {
          facets.publisher = facet.values.map(v => typeof v === 'string' ? v : v.value || '')
        }
      })
    }

    return facets
  }

  /**
   * Get the base URL
   *
   * Returns the configured DKAN base URL without trailing slash.
   *
   * @returns Base URL (e.g., 'https://data.example.com')
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Get default options
   *
   * Returns a copy of the configured default options for retries,
   * delays, stale time, and cache time.
   *
   * @returns Default options object with retry, retryDelay, staleTime, and cacheTime
   */
  getDefaultOptions() {
    return { ...this.defaultOptions }
  }

  // ==================== HARVEST API ====================

  /**
   * List all harvest plan identifiers
   *
   * Returns an array of identifiers for all registered harvest plans.
   * Harvest plans define how to fetch datasets from external sources.
   *
   * @returns Array of harvest plan identifiers
   * @throws {DkanApiError} If request fails
   */
  async listHarvestPlans(): Promise<string[]> {
    const response = await this.request<string[]>('/api/1/harvest/plans')
    return response.data
  }

  /**
   * Register a new harvest plan
   *
   * Creates a new harvest plan in the system. Harvest plans define source URLs,
   * extraction methods, and filters for importing datasets from external catalogs.
   *
   * Requires authentication with harvest plan create permissions.
   *
   * @param plan - Harvest plan configuration with identifier, source, and extract options
   * @returns Write response containing the plan identifier and endpoint
   * @throws {DkanApiError} If authentication fails, validation fails, or request fails
   */
  async registerHarvestPlan(plan: HarvestPlan): Promise<MetastoreWriteResponse> {
    const response = await this.request<MetastoreWriteResponse>(
      '/api/1/harvest/plans',
      {
        method: 'POST',
        body: JSON.stringify(plan),
      }
    )
    return response.data
  }

  /**
   * Get a specific harvest plan
   *
   * Retrieves the configuration for a registered harvest plan.
   *
   * @param planId - Harvest plan identifier
   * @returns Harvest plan configuration with source and extract settings
   * @throws {DkanApiError} If harvest plan not found or request fails
   */
  async getHarvestPlan(planId: string): Promise<HarvestPlan> {
    const response = await this.request<HarvestPlan>(
      `/api/1/harvest/plans/${planId}`
    )
    return response.data
  }

  /**
   * List harvest runs for a specific plan
   *
   * Returns an array of harvest run identifiers for the given plan.
   * Use getHarvestRun() with a specific run ID to get full run details.
   *
   * @param planId - Harvest plan identifier
   * @returns Array of harvest run identifiers (strings)
   * @throws {DkanApiError} If harvest plan not found or request fails
   */
  async listHarvestRuns(planId: string): Promise<string[]> {
    const response = await this.request<string[]>(
      `/api/1/harvest/runs?plan=${planId}`
    )
    return response.data
  }

  /**
   * Get information about a specific harvest run
   *
   * Retrieves detailed information about a single harvest run execution,
   * including status, counts, error messages, and timestamps.
   *
   * @param runId - Harvest run identifier
   * @param planId - Harvest plan identifier (required by DKAN API)
   * @returns Harvest run details with execution status and statistics
   * @throws {DkanApiError} If harvest run not found or request fails
   */
  async getHarvestRun(runId: string, planId: string): Promise<HarvestRun> {
    const response = await this.request<HarvestRun>(
      `/api/1/harvest/runs/${runId}?plan=${planId}`
    )
    return response.data
  }

  /**
   * Execute a harvest run
   *
   * Triggers a harvest operation for a specific plan. The harvest fetches
   * datasets from the configured source and imports them into DKAN.
   *
   * Requires authentication with harvest run permissions.
   *
   * @param options - Harvest run options with plan ID and optional filters
   * @param options.plan_id - Identifier of the harvest plan to execute
   * @returns Harvest run record with initial status
   * @throws {DkanApiError} If authentication fails, harvest plan not found, or request fails
   */
  async runHarvest(options: HarvestRunOptions): Promise<HarvestRun> {
    const response = await this.request<HarvestRun>(
      '/api/1/harvest/runs',
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    )
    return response.data
  }

  // ==================== DATASET CRUD ====================

  /**
   * Create a new dataset in the DKAN metastore
   *
   * Requires authentication with dataset create permissions.
   * The dataset must include all required DCAT-US properties.
   *
   * @param dataset - Complete dataset metadata following DCAT-US schema
   * @returns Write response containing the dataset identifier and endpoint
   * @throws {DkanApiError} If authentication fails or dataset validation fails
   *
   * @example
   * ```typescript
   * const newDataset = {
   *   title: 'Water Quality Measurements',
   *   description: 'Monthly water quality data from monitoring stations',
   *   identifier: 'water-quality-2025',
   *   accessLevel: 'public',
   *   modified: '2025-01-15',
   *   keyword: ['water', 'environment', 'quality'],
   *   publisher: {
   *     name: 'Environmental Protection Agency'
   *   },
   *   contactPoint: {
   *     '@type': 'vcard:Contact',
   *     fn: 'Data Team',
   *     hasEmail: 'mailto:data@epa.gov'
   *   }
   * };
   *
   * const response = await client.createDataset(newDataset);
   * console.log(`Created: ${response.identifier}`);
   * ```
   *
   * @see updateDataset for replacing existing datasets
   * @see patchDataset for partial updates
   */
  async createDataset(dataset: DkanDataset): Promise<MetastoreWriteResponse> {
    const response = await this.request<MetastoreWriteResponse>(
      '/api/1/metastore/schemas/dataset/items',
      {
        method: 'POST',
        body: JSON.stringify(dataset),
      }
    )
    return response.data
  }

  /**
   * Update an existing dataset with full replacement
   *
   * Replaces the entire dataset with new metadata. All properties must be provided.
   * For partial updates, use patchDataset() instead.
   *
   * Requires authentication with dataset update permissions.
   *
   * @param identifier - Dataset identifier (UUID or custom ID)
   * @param dataset - Complete replacement dataset metadata
   * @returns Write response containing the updated identifier
   * @throws {DkanApiError} If dataset not found, authentication fails, or validation fails
   *
   * @example
   * ```typescript
   * // Get existing dataset
   * const existing = await client.getDataset('water-quality-2025');
   *
   * // Modify and update
   * existing.description = 'Updated description with more details';
   * existing.modified = new Date().toISOString();
   *
   * const response = await client.updateDataset('water-quality-2025', existing);
   * ```
   *
   * @see patchDataset for partial updates
   * @see createDataset for creating new datasets
   */
  async updateDataset(
    identifier: string,
    dataset: DkanDataset
  ): Promise<MetastoreWriteResponse> {
    const response = await this.request<MetastoreWriteResponse>(
      `/api/1/metastore/schemas/dataset/items/${identifier}`,
      {
        method: 'PUT',
        body: JSON.stringify(dataset),
      }
    )
    return response.data
  }

  /**
   * Partially update a dataset (PATCH)
   *
   * Updates only the specified properties, leaving others unchanged.
   * More efficient than updateDataset() when modifying a few fields.
   *
   * Requires authentication with dataset update permissions.
   *
   * @param identifier - Dataset identifier
   * @param partialDataset - Partial dataset with only fields to update
   * @returns Write response containing the updated identifier
   * @throws {DkanApiError} If dataset not found or authentication fails
   *
   * @example
   * ```typescript
   * // Update only the description and modified date
   * await client.patchDataset('water-quality-2025', {
   *   description: 'Updated description',
   *   modified: new Date().toISOString()
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Add keywords to existing dataset
   * await client.patchDataset('water-quality-2025', {
   *   keyword: ['water', 'environment', 'quality', 'monitoring']
   * });
   * ```
   *
   * @see updateDataset for full replacement
   */
  async patchDataset(
    identifier: string,
    partialDataset: Partial<DkanDataset>
  ): Promise<MetastoreWriteResponse> {
    const response = await this.request<MetastoreWriteResponse>(
      `/api/1/metastore/schemas/dataset/items/${identifier}`,
      {
        method: 'PATCH',
        body: JSON.stringify(partialDataset),
      }
    )
    return response.data
  }

  /**
   * Delete a dataset from the metastore
   *
   * Permanently removes the dataset and all associated metadata.
   * This operation cannot be undone.
   *
   * Requires authentication with dataset delete permissions.
   *
   * @param identifier - Dataset identifier
   * @returns Confirmation message
   * @throws {DkanApiError} If dataset not found or authentication fails
   *
   * @example
   * ```typescript
   * await client.deleteDataset('water-quality-2025');
   * console.log('Dataset deleted successfully');
   * ```
   */
  async deleteDataset(identifier: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>(
      `/api/1/metastore/schemas/dataset/items/${identifier}`,
      {
        method: 'DELETE',
      }
    )
    return response.data
  }

  // ==================== DATASTORE IMPORTS ====================

  /**
   * List all datastore imports
   *
   * Returns import status for all distributions that have been imported
   * into the datastore. Includes import state, timestamps, and statistics.
   *
   * @returns Object mapping distribution identifiers to import records
   * @throws {DkanApiError} If request fails
   */
  async listDatastoreImports(): Promise<Record<string, DatastoreImport>> {
    const response = await this.request<Record<string, DatastoreImport>>(
      '/api/1/datastore/imports'
    )
    return response.data
  }

  /**
   * Trigger a datastore import
   *
   * Initiates import of a distribution's data into the datastore.
   * The data is downloaded from the distribution's downloadURL and
   * loaded into a queryable database table.
   *
   * Requires authentication with datastore import permissions.
   *
   * @param options - Import options with resource identifier
   * @param options.resource - Distribution identifier or dataset identifier
   * @returns Import record with initial status
   * @throws {DkanApiError} If authentication fails, resource not found, or request fails
   */
  async triggerDatastoreImport(
    options: DatastoreImportOptions
  ): Promise<DatastoreImport> {
    const response = await this.request<DatastoreImport>(
      '/api/1/datastore/imports',
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    )
    return response.data
  }

  /**
   * Delete a datastore (resource or all resources for a dataset)
   *
   * Removes imported data from the datastore for a specific distribution
   * or all distributions in a dataset. Does not delete the metadata.
   *
   * Requires authentication with datastore delete permissions.
   *
   * @param identifier - Distribution identifier or dataset identifier
   * @returns Confirmation message
   * @throws {DkanApiError} If resource not found, authentication fails, or request fails
   */
  async deleteDatastore(identifier: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string}>(
      `/api/1/datastore/imports/${identifier}`,
      {
        method: 'DELETE',
      }
    )
    return response.data
  }

  /**
   * Get datastore statistics (row/column counts)
   *
   * @param identifier - Distribution or dataset identifier
   * @returns Statistics including numOfRows, numOfColumns, and columns metadata
   *
   * @example
   * ```typescript
   * const stats = await client.getDatastoreStatistics('distribution-uuid')
   * console.log(`Rows: ${stats.numOfRows}, Columns: ${stats.numOfColumns}`)
   * ```
   */
  async getDatastoreStatistics(identifier: string): Promise<DatastoreStatistics> {
    const response = await this.request<DatastoreStatistics>(
      `/api/1/datastore/imports/${identifier}`
    )
    return response.data
  }

  // ==================== REVISIONS / MODERATION ====================

  /**
   * Get all revisions for an item in a schema
   *
   * Returns the revision history for a specific item, showing all
   * workflow state changes and modifications over time.
   *
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param identifier - Item identifier (UUID or custom ID)
   * @returns Array of revision records with timestamps and state information
   * @throws {DkanApiError} If item not found or request fails
   */
  async getRevisions(
    schemaId: string,
    identifier: string
  ): Promise<MetastoreRevision[]> {
    const response = await this.request<MetastoreRevision[]>(
      `/api/1/metastore/schemas/${schemaId}/items/${identifier}/revisions`
    )
    return response.data
  }

  /**
   * Get a specific revision
   *
   * Retrieves details for a single revision, including the full item
   * data as it existed at that point in time.
   *
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param identifier - Item identifier (UUID or custom ID)
   * @param revisionId - Revision identifier or number
   * @returns Revision record with complete item data and metadata
   * @throws {DkanApiError} If item or revision not found, or request fails
   */
  async getRevision(
    schemaId: string,
    identifier: string,
    revisionId: string
  ): Promise<MetastoreRevision> {
    const response = await this.request<MetastoreRevision>(
      `/api/1/metastore/schemas/${schemaId}/items/${identifier}/revisions/${revisionId}`
    )
    return response.data
  }

  /**
   * Create a new revision (change workflow state)
   *
   * Creates a new revision by changing the workflow state of an item.
   * Common states: 'draft', 'published', 'archived'.
   *
   * Requires authentication with moderation permissions.
   *
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param identifier - Item identifier (UUID or custom ID)
   * @param revision - Revision data with new state and optional message
   * @param revision.state - New workflow state ('draft', 'published', 'archived')
   * @param revision.message - Optional message describing the state change
   * @returns Write response containing the revision identifier
   * @throws {DkanApiError} If authentication fails, item not found, or request fails
   */
  async createRevision(
    schemaId: string,
    identifier: string,
    revision: MetastoreNewRevision
  ): Promise<MetastoreWriteResponse> {
    const response = await this.request<MetastoreWriteResponse>(
      `/api/1/metastore/schemas/${schemaId}/items/${identifier}/revisions`,
      {
        method: 'POST',
        body: JSON.stringify(revision),
      }
    )
    return response.data
  }

  /**
   * Convenience method to change dataset workflow state
   *
   * Shortcut for creating a revision to change a dataset's workflow state.
   * Equivalent to calling createRevision('dataset', identifier, { state, message }).
   *
   * Requires authentication with moderation permissions.
   *
   * @param identifier - Dataset identifier (UUID or custom ID)
   * @param state - New workflow state ('draft', 'published', 'archived')
   * @param message - Optional message describing the state change
   * @returns Write response containing the revision identifier
   * @throws {DkanApiError} If authentication fails, dataset not found, or request fails
   */
  async changeDatasetState(
    identifier: string,
    state: WorkflowState,
    message?: string
  ): Promise<MetastoreWriteResponse> {
    return this.createRevision('dataset', identifier, { state, message })
  }

  // ==================== QUERY DOWNLOAD ====================

  /**
   * Download datastore query results as CSV or JSON
   *
   * Executes a datastore query and returns the results as a downloadable file.
   * Supports filtering, sorting, and pagination like queryDatastore().
   *
   * @param datasetId - Dataset identifier (UUID or custom ID)
   * @param index - Resource index in dataset.distribution array
   * @param options - Query and download options
   * @param options.format - Download format: 'csv' (default) or 'json'
   * @param options.conditions - Filter conditions
   * @param options.limit - Maximum number of records
   * @param options.offset - Pagination offset
   * @param options.sort - Sort configuration
   * @returns Blob containing the file data for download
   * @throws {DkanApiError} If resource not found or request fails
   */
  async downloadQuery(
    datasetId: string,
    index: number,
    options: QueryDownloadOptions = {}
  ): Promise<Blob> {
    const format = options.format || 'csv'
    const queryOptions = { ...options }
    delete queryOptions.format

    // Build query string with properly serialized parameters
    const params = new URLSearchParams({ format })

    // Add query options as JSON-encoded parameters
    if (Object.keys(queryOptions).length > 0) {
      for (const [key, value] of Object.entries(queryOptions)) {
        if (value !== undefined) {
          params.append(key, typeof value === 'string' ? value : JSON.stringify(value))
        }
      }
    }

    const url = `${this.baseUrl}/api/1/datastore/query/${datasetId}/${index}/download?${params.toString()}`
    const authHeader = this.getAuthHeader()

    const headers: Record<string, string> = {}

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new DkanApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      )
    }

    return await response.blob()
  }

  /**
   * Download datastore query results by distribution ID
   *
   * Similar to downloadQuery() but uses distribution identifier directly
   * instead of dataset ID and index. Useful when you have the distribution
   * ID from getDataset({ showReferenceIds: true }).
   *
   * @param distributionId - Distribution identifier (UUID)
   * @param options - Query and download options
   * @param options.format - Download format: 'csv' (default) or 'json'
   * @param options.conditions - Filter conditions
   * @param options.limit - Maximum number of records
   * @param options.offset - Pagination offset
   * @param options.sort - Sort configuration
   * @returns Blob containing the file data for download
   * @throws {DkanApiError} If distribution not found or request fails
   */
  async downloadQueryByDistribution(
    distributionId: string,
    options: QueryDownloadOptions = {}
  ): Promise<Blob> {
    const format = options.format || 'csv'
    const queryOptions = { ...options }
    delete queryOptions.format

    // Build query string with properly serialized parameters
    const params = new URLSearchParams({ format })

    // Add query options as JSON-encoded parameters
    if (Object.keys(queryOptions).length > 0) {
      for (const [key, value] of Object.entries(queryOptions)) {
        if (value !== undefined) {
          params.append(key, typeof value === 'string' ? value : JSON.stringify(value))
        }
      }
    }

    const url = `${this.baseUrl}/api/1/datastore/query/${distributionId}/download?${params.toString()}`
    const authHeader = this.getAuthHeader()

    const headers: Record<string, string> = {}

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new DkanApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      )
    }

    return await response.blob()
  }

  // ==================== SQL QUERY ====================

  /**
   * Execute a SQL query against the datastore using DKAN's bracket syntax.
   *
   * **IMPORTANT**: DKAN uses a custom SQL syntax with brackets, NOT standard SQL!
   *
   * ## Bracket Syntax Requirements
   *
   * Each SQL clause must be wrapped in brackets:
   * - `[SELECT columns FROM distribution-id]`
   * - `[WHERE conditions]`
   * - `[ORDER BY fields ASC|DESC]`
   * - `[LIMIT n OFFSET m]`
   * - Query must end with `;`
   *
   * ## Getting the Distribution Identifier
   *
   * Use the `showReferenceIds` option to get distribution identifiers:
   *
   * ```typescript
   * const dataset = await client.getDataset('dataset-id', { showReferenceIds: true });
   * const distributionId = dataset.distribution[0].identifier;
   * ```
   *
   * ## Syntax Rules
   *
   * 1. **No spaces after commas** in SELECT: `[SELECT a,b,c FROM id]` ✓ not `[SELECT a, b, c FROM id]` ✗
   * 2. **Double quotes for strings**: `[WHERE status = "active"]` ✓
   * 3. **ORDER BY requires ASC or DESC**: `[ORDER BY name ASC]` ✓
   * 4. **AND is the only boolean operator**: `[WHERE a = "1" AND b = "2"]` ✓
   * 5. **End with semicolon**: `[SELECT * FROM id];` ✓
   *
   * ## Pagination
   *
   * DKAN has a default 500 record limit. Use LIMIT and OFFSET for pagination:
   *
   * ```typescript
   * // First page
   * await client.querySql({
   *   query: '[SELECT * FROM dist-id][LIMIT 500 OFFSET 0];'
   * });
   *
   * // Second page
   * await client.querySql({
   *   query: '[SELECT * FROM dist-id][LIMIT 500 OFFSET 500];'
   * });
   * ```
   *
   * ## Using show_db_columns
   *
   * Returns database column names instead of human-readable headers.
   * Useful when column descriptions are very long:
   *
   * ```typescript
   * const result = await client.querySql({
   *   query: '[SELECT * FROM dist-id][LIMIT 10];',
   *   show_db_columns: true
   * });
   * ```
   *
   * @param options - Query options
   * @param options.query - SQL query in bracket syntax
   * @param options.show_db_columns - Return DB column names instead of descriptions
   * @param options.method - HTTP method (GET or POST). Defaults to GET.
   * @returns Array of row objects
   *
   * @example
   * Simple query:
   * ```typescript
   * const results = await client.querySql({
   *   query: '[SELECT * FROM 6ca7e14e-8f28-5337-84f9-1086c4a0b820][LIMIT 10];'
   * });
   * ```
   *
   * @example
   * Query with WHERE and ORDER BY:
   * ```typescript
   * const results = await client.querySql({
   *   query: '[SELECT name,status FROM dist-id][WHERE status = "active"][ORDER BY name ASC][LIMIT 100];'
   * });
   * ```
   *
   * @example
   * COUNT query:
   * ```typescript
   * const results = await client.querySql({
   *   query: '[SELECT COUNT(*) FROM dist-id];'
   * });
   * console.log(results[0].expression); // Total count
   * ```
   *
   * @example
   * Using POST method for complex queries:
   * ```typescript
   * const results = await client.querySql({
   *   query: '[SELECT * FROM dist-id][WHERE field = "value with spaces"][LIMIT 100];',
   *   method: 'POST'
   * });
   * ```
   *
   * @throws {DkanApiError} If query syntax is invalid or distribution not found
   *
   * @see https://dkan.readthedocs.io/en/latest/user-guide/guide_api.html - DKAN API documentation
   * @see https://github.com/GetDKAN/dkan - DKAN project on GitHub
   */
  async querySql(options: SqlQueryOptions): Promise<SqlQueryResult> {
    const method = options.method || 'GET'

    if (method === 'GET') {
      // GET method: Use query parameters
      const params = new URLSearchParams({ query: options.query })
      if (options.show_db_columns) {
        params.append('show_db_columns', 'true')
      }

      const response = await this.request<SqlQueryResult>(
        `/api/1/datastore/sql?${params.toString()}`,
        {
          method: 'GET',
        }
      )
      return response.data
    } else {
      // POST method: Use JSON body
      const response = await this.request<SqlQueryResult>(
        '/api/1/datastore/sql',
        {
          method: 'POST',
          body: JSON.stringify({
            query: options.query,
            show_db_columns: options.show_db_columns,
          }),
        }
      )
      return response.data
    }
  }

  // ==================== DATA DICTIONARY CRUD ====================

  /**
   * Create a new data dictionary
   *
   * Creates a new data dictionary in the metastore. Data dictionaries follow
   * the Frictionless Table Schema specification and define column schemas,
   * types, constraints, and descriptions for distributions.
   *
   * Requires authentication with data dictionary create permissions.
   *
   * @param dictionary - Data dictionary object with fields and schema
   * @returns Write response containing the dictionary identifier and endpoint
   * @throws {DkanApiError} If authentication fails, validation fails, or request fails
   *
   * @example
   * ```typescript
   * const dictionary = {
   *   identifier: 'dict-water-quality',
   *   version: '1.0',
   *   data: {
   *     title: 'Water Quality Data Dictionary',
   *     fields: [
   *       {
   *         name: 'station_id',
   *         title: 'Station Identifier',
   *         type: 'string',
   *         description: 'Unique identifier for the monitoring station',
   *         constraints: {
   *           required: true,
   *           unique: true
   *         }
   *       },
   *       {
   *         name: 'temperature',
   *         title: 'Water Temperature',
   *         type: 'number',
   *         description: 'Water temperature in degrees Celsius',
   *         constraints: {
   *           minimum: 0,
   *           maximum: 40
   *         }
   *       },
   *       {
   *         name: 'ph_level',
   *         title: 'pH Level',
   *         type: 'number',
   *         description: 'pH measurement',
   *         constraints: {
   *           minimum: 0,
   *           maximum: 14
   *         }
   *       }
   *     ]
   *   }
   * };
   *
   * const response = await client.createDataDictionary(dictionary);
   * console.log(`Created dictionary: ${response.identifier}`);
   * ```
   */
  async createDataDictionary(
    dictionary: DataDictionary
  ): Promise<MetastoreWriteResponse> {
    const response = await this.request<MetastoreWriteResponse>(
      '/api/1/metastore/schemas/data-dictionary/items',
      {
        method: 'POST',
        body: JSON.stringify(dictionary),
      }
    )
    return response.data
  }

  /**
   * Update an existing data dictionary (full replacement)
   *
   * Replaces an entire data dictionary with new field definitions.
   * All fields must be provided - use PATCH for partial updates.
   *
   * Requires authentication with data dictionary update permissions.
   *
   * @param identifier - Data dictionary identifier (UUID or custom ID)
   * @param dictionary - Complete replacement data dictionary object
   * @returns Write response containing the updated identifier
   * @throws {DkanApiError} If data dictionary not found, authentication fails, or validation fails
   *
   * @example
   * ```typescript
   * // Get existing dictionary
   * const existing = await client.getDataDictionary('dict-water-quality');
   *
   * // Add a new field
   * existing.data.fields.push({
   *   name: 'dissolved_oxygen',
   *   title: 'Dissolved Oxygen',
   *   type: 'number',
   *   description: 'Dissolved oxygen in mg/L',
   *   constraints: {
   *     minimum: 0,
   *     maximum: 20
   *   }
   * });
   *
   * // Update the dictionary
   * await client.updateDataDictionary('dict-water-quality', existing);
   * ```
   */
  async updateDataDictionary(
    identifier: string,
    dictionary: DataDictionary
  ): Promise<MetastoreWriteResponse> {
    const response = await this.request<MetastoreWriteResponse>(
      `/api/1/metastore/schemas/data-dictionary/items/${identifier}`,
      {
        method: 'PUT',
        body: JSON.stringify(dictionary),
      }
    )
    return response.data
  }

  /**
   * Delete a data dictionary
   *
   * Permanently removes a data dictionary from the metastore.
   * This does not affect the data in the datastore, only the schema definition.
   *
   * Requires authentication with data dictionary delete permissions.
   *
   * @param identifier - Data dictionary identifier (UUID or custom ID)
   * @returns Confirmation message
   * @throws {DkanApiError} If data dictionary not found, authentication fails, or request fails
   */
  async deleteDataDictionary(identifier: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>(
      `/api/1/metastore/schemas/data-dictionary/items/${identifier}`,
      {
        method: 'DELETE',
      }
    )
    return response.data
  }

  // ==================== OPENAPI DOCUMENTATION ====================

  /**
   * Get OpenAPI specification URL
   *
   * Returns the URL to the machine-readable OpenAPI 3.0 specification in JSON format.
   * This document can be consumed by API documentation tools like Swagger UI, Redoc,
   * or Postman to provide interactive API documentation.
   *
   * @returns URL to the OpenAPI specification (e.g., 'https://dkan.example.com/api/1')
   *
   * @example
   * View in Swagger UI:
   * ```typescript
   * const specUrl = client.getOpenApiDocsUrl()
   * // Open in Swagger UI hosted online
   * window.open(`https://petstore.swagger.io/?url=${encodeURIComponent(specUrl)}`)
   * ```
   *
   * @example
   * Fetch and inspect the spec:
   * ```typescript
   * const specUrl = client.getOpenApiDocsUrl()
   * const response = await fetch(specUrl)
   * const openApiSpec = await response.json()
   * console.log(`API Version: ${openApiSpec.info.version}`)
   * console.log(`Available paths: ${Object.keys(openApiSpec.paths).length}`)
   * ```
   */
  getOpenApiDocsUrl(): string {
    return `${this.baseUrl}/api/1`
  }

}
