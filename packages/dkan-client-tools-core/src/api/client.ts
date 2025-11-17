/**
 * HTTP client for DKAN REST API.
 *
 * Direct API access without caching. For React/Vue apps, use framework-specific hooks/composables.
 * Use this for server-side operations, scripts, or custom integrations.
 *
 * Provides 40 methods across datasets, datastore, data dictionaries, harvests, imports,
 * metastore, revisions, downloads, and utilities. Supports Basic auth (default in DKAN 2.x)
 * and Bearer tokens (requires extra modules).
 *
 * @example
 * ```typescript
 * const client = new DkanApiClient({
 *   baseUrl: 'https://data.example.com',
 *   auth: { username: 'admin', password: 'password' }
 * })
 * const dataset = await client.getDataset('abc-123')
 * ```
 *
 * @see DkanClient for caching wrapper with TanStack Query
 * @see ../../README.md#authentication for authentication setup
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

  /** Get the authorization header */
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

  /** Make a request with retry logic */
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
   * Fetch a single dataset by identifier.
   * @param identifier - Dataset identifier
   * @param options.showReferenceIds - Include internal reference IDs (distribution identifiers)
   * @returns Dataset metadata
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

  /** Append string or array values to URLSearchParams */
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

  /** Serialize datastore query options as URL query parameters for GET requests */
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
   * Search datasets with filters and pagination.
   * @param options - Search options (keyword, theme, fulltext, sort, page, page-size)
   * @returns Search results with total count, dataset array, and facets
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
   * Query datastore for a specific dataset resource.
   * @param datasetId - Dataset identifier
   * @param index - Resource index in dataset.distribution array (default: 0)
   * @param options - Query options (conditions, limit, offset, sort, keys, joins)
   * @param method - HTTP method: POST (default) or GET
   * @returns Query results including schema and result rows
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
   * Query multiple datastore resources with joins.
   * @param options - Query options (resources, joins, conditions, limit, offset, sort, keys)
   * @param method - HTTP method: POST (default) or GET
   * @returns Query results including schema and result rows
   * @throws {DkanApiError} If resource not found or request fails
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
   * Get datastore schema with data dictionary (if available).
   * @param datasetId - Dataset identifier
   * @param index - Resource index in dataset.distribution array (default: 0)
   * @returns Query response containing schema information
   * @throws {DkanApiError} If resource not found
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
   * Get all data dictionaries (Frictionless Table Schema).
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
   * Get a specific data dictionary by identifier.
   * @param identifier - Data dictionary identifier
   * @returns Data dictionary object with schema and field definitions
   */
  async getDataDictionary(identifier: string): Promise<DataDictionary> {
    const response = await this.request<DataDictionary>(
      `/api/1/metastore/schemas/data-dictionary/items/${identifier}`
    )
    return response.data
  }

  /**
   * Get data dictionary from a distribution's describedBy URL.
   * @param url - Full URL to the data dictionary JSON file
   * @returns Data dictionary object from the remote URL
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
   * Get all datasets from metastore (full metadata objects).
   * @returns Array of complete dataset metadata objects
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
   * List all available metastore schemas (e.g., 'dataset', 'data-dictionary', 'distribution').
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
   * Get a specific schema definition (JSON Schema with validation rules).
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @returns JSON Schema definition with properties and validation rules
   */
  async getSchema(schemaId: string): Promise<JsonSchema> {
    const response = await this.request<JsonSchema>(
      `/api/1/metastore/schemas/${schemaId}`
    )
    return response.data
  }

  /**
   * Get all items for a specific schema type (e.g., all datasets, all data dictionaries).
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param options.showReferenceIds - Include internal reference IDs for nested items
   * @returns Array of items matching the schema type
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
   * Get facet values for datasets (themes, keywords, publishers). Useful for building filter UIs.
   * @returns Object containing arrays of unique theme, keyword, and publisher values
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

  /** Base URL without trailing slash */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /** Configured default options */
  getDefaultOptions() {
    return { ...this.defaultOptions }
  }

  // ==================== HARVEST API ====================

  /**
   * List all harvest plan identifiers.
   * @returns Array of harvest plan identifiers
   * @throws {DkanApiError} If request fails
   */
  async listHarvestPlans(): Promise<string[]> {
    const response = await this.request<string[]>('/api/1/harvest/plans')
    return response.data
  }

  /**
   * Register a new harvest plan. Requires authentication with create permissions.
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
   * Get a specific harvest plan.
   * @param planId - Harvest plan identifier
   * @returns Harvest plan configuration with source and extract settings
   */
  async getHarvestPlan(planId: string): Promise<HarvestPlan> {
    const response = await this.request<HarvestPlan>(
      `/api/1/harvest/plans/${planId}`
    )
    return response.data
  }

  /**
   * List harvest runs for a specific plan.
   * @param planId - Harvest plan identifier
   * @returns Array of harvest run identifiers
   */
  async listHarvestRuns(planId: string): Promise<string[]> {
    const response = await this.request<string[]>(
      `/api/1/harvest/runs?plan=${planId}`
    )
    return response.data
  }

  /**
   * Get information about a specific harvest run (status, counts, errors, timestamps).
   * @param runId - Harvest run identifier
   * @param planId - Harvest plan identifier (required by DKAN API)
   * @returns Harvest run details with execution status and statistics
   */
  async getHarvestRun(runId: string, planId: string): Promise<HarvestRun> {
    const response = await this.request<HarvestRun>(
      `/api/1/harvest/runs/${runId}?plan=${planId}`
    )
    return response.data
  }

  /**
   * Execute a harvest run. Requires authentication with harvest run permissions.
   * @param options - Harvest run options with plan_id and optional filters
   * @returns Harvest run record with initial status
   * @throws {DkanApiError} If authentication fails, plan not found, or request fails
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
   * Create a new dataset. Requires authentication with create permissions.
   * @param dataset - Complete dataset metadata following DCAT-US schema
   * @returns Write response containing the dataset identifier and endpoint
   * @throws {DkanApiError} If authentication fails or validation fails
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
   * Update existing dataset (full replacement). All properties required. Requires authentication.
   * @param identifier - Dataset identifier
   * @param dataset - Complete replacement dataset metadata
   * @returns Write response containing the updated identifier
   * @throws {DkanApiError} If dataset not found, authentication fails, or validation fails
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
   * Partially update a dataset. Updates only specified properties. Requires authentication.
   * @param identifier - Dataset identifier
   * @param partialDataset - Partial dataset with only fields to update
   * @returns Write response with updated identifier
   * @throws {DkanApiError} If authentication fails or dataset not found
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
   * Delete a dataset. Permanently removes dataset and metadata. Requires authentication.
   * @param identifier - Dataset identifier
   * @returns Confirmation message
   * @throws {DkanApiError} If dataset not found or authentication fails
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
   * List all datastore imports (status, timestamps, statistics).
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
   * Trigger a datastore import. Requires authentication with import permissions.
   * @param options - Import options with resource identifier (distribution or dataset ID)
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
   * Delete datastore data (does not delete metadata). Requires authentication with delete permissions.
   * @param identifier - Distribution or dataset identifier
   * @returns Confirmation message
   * @throws {DkanApiError} If resource not found or authentication fails
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
   * Get datastore statistics (row/column counts).
   * @param identifier - Distribution or dataset identifier
   * @returns Statistics including numOfRows, numOfColumns, and columns metadata
   */
  async getDatastoreStatistics(identifier: string): Promise<DatastoreStatistics> {
    const response = await this.request<DatastoreStatistics>(
      `/api/1/datastore/imports/${identifier}`
    )
    return response.data
  }

  // ==================== REVISIONS / MODERATION ====================

  /**
   * Get all revisions for an item (workflow state changes and modifications).
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param identifier - Item identifier
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
   * Get a specific revision (full item data as it existed at that point in time).
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param identifier - Item identifier
   * @param revisionId - Revision identifier or number
   * @returns Revision record with complete item data and metadata
   * @throws {DkanApiError} If item or revision not found
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
   * Create a new revision (change workflow state). Common states: 'draft', 'published', 'archived'. Requires authentication.
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param identifier - Item identifier
   * @param revision - Revision data with new state and optional message
   * @returns Write response containing the revision identifier
   * @throws {DkanApiError} If authentication fails or item not found
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
   * Convenience method to change dataset workflow state. Requires authentication.
   * @param identifier - Dataset identifier
   * @param state - New workflow state ('draft', 'published', 'archived')
   * @param message - Optional message describing the state change
   * @returns Write response containing the revision identifier
   * @throws {DkanApiError} If authentication fails or dataset not found
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
   * Download datastore query results as CSV or JSON.
   * @param datasetId - Dataset identifier
   * @param index - Resource index in dataset.distribution array
   * @param options - Query and download options (format, conditions, limit, offset, sort)
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
   * Download datastore query results by distribution ID (instead of dataset ID and index).
   * @param distributionId - Distribution identifier
   * @param options - Query and download options (format, conditions, limit, offset, sort)
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
   * Execute SQL query using DKAN bracket syntax: `[SELECT cols FROM dist-id][WHERE cond][ORDER BY field ASC][LIMIT n];`
   * @param options - Query options (query, show_db_columns, method: GET or POST)
   * @returns Query results
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
   * Create a new data dictionary. Requires authentication with create permissions.
   * @param dictionary - Data dictionary with identifier and Frictionless table schema
   * @returns Metastore write response with identifier
   * @throws {DkanApiError} If authentication fails or validation fails
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
   * Update existing data dictionary (full replacement). All fields required. Requires authentication.
   * @param identifier - Data dictionary identifier
   * @param dictionary - Complete replacement data dictionary object
   * @returns Metastore write response with identifier
   * @throws {DkanApiError} If authentication fails or dictionary not found
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
   * Delete a data dictionary. Permanently removes schema definition. Requires authentication.
   * @param identifier - Data dictionary identifier
   * @returns Confirmation message
   * @throws {DkanApiError} If dictionary not found or authentication fails
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
   * Get OpenAPI specification URL (for use with Swagger UI, Redoc, or Postman).
   * @returns URL to OpenAPI specification
   */
  getOpenApiDocsUrl(): string {
    return `${this.baseUrl}/api/1`
  }

}
