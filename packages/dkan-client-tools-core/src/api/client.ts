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
 * **API Coverage** (34 methods across 6 categories):
 *
 * 1. **Dataset Operations** (7 methods)
 *    - getDataset, searchDatasets, listAllDatasets
 *    - createDataset, updateDataset, patchDataset, deleteDataset
 *
 * 2. **Datastore Operations** (5 methods)
 *    - queryDatastore, getDatastoreSchema
 *    - querySql, downloadQuery, downloadQueryByDistribution
 *
 * 3. **Data Dictionary** (6 methods)
 *    - getDataDictionary, listDataDictionaries, getDataDictionaryFromUrl
 *    - createDataDictionary, updateDataDictionary, deleteDataDictionary
 *
 * 4. **Harvest Operations** (6 methods)
 *    - listHarvestPlans, getHarvestPlan, registerHarvestPlan
 *    - listHarvestRuns, getHarvestRun, runHarvest
 *
 * 5. **Datastore Imports** (4 methods) - Phase 1 enhanced
 *    - listDatastoreImports, getDatastoreStatistics
 *    - triggerDatastoreImport, deleteDatastore
 *
 * 6. **Metastore & Revisions** (6 methods)
 *    - listSchemas, getSchemaItems, getDatasetFacets
 *    - getRevisions, getRevision, createRevision, changeDatasetState
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
        throw new DkanApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorText
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
   * Phase 1 - OpenAPI alignment: Added show-reference-ids support
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
   * Search datasets with filters
   *
   * Phase 1 - OpenAPI alignment: Added support for array sort parameters
   */
  async searchDatasets(options: DatasetQueryOptions = {}): Promise<DkanSearchResponse> {
    const params = new URLSearchParams()

    if (options.keyword) params.append('keyword', options.keyword)
    if (options.theme) params.append('theme', options.theme)
    if (options.fulltext) params.append('fulltext', options.fulltext)

    // Handle array or string for sort
    if (options.sort) {
      if (Array.isArray(options.sort)) {
        options.sort.forEach(s => params.append('sort', s))
      } else {
        params.append('sort', options.sort)
      }
    }

    // Handle array or string for sort-order
    if (options['sort-order']) {
      if (Array.isArray(options['sort-order'])) {
        options['sort-order'].forEach(so => params.append('sort-order', so))
      } else {
        params.append('sort-order', options['sort-order'])
      }
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
   */
  async queryDatastore(
    datasetId: string,
    index = 0,
    options: DatastoreQueryOptions = {}
  ): Promise<DkanDatastoreQueryResponse> {
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
   * Get datastore schema with data dictionary (if available)
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
   */
  async getDataDictionary(identifier: string): Promise<DataDictionary> {
    const response = await this.request<DataDictionary>(
      `/api/1/metastore/schemas/data-dictionary/items/${identifier}`
    )
    return response.data
  }

  /**
   * Get data dictionary from a distribution's describedBy URL
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
   * Returns full metadata objects for all datasets
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
   * Returns the schema types available (dataset, data-dictionary, etc.)
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
   * Get items for a specific schema type
   *
   * Phase 1 - OpenAPI alignment: Added show-reference-ids support
   *
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param options - Optional parameters
   * @param options.showReferenceIds - Include internal reference IDs for nested items
   * @returns Array of items for the schema
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
   * Useful for building filter UIs
   */
  async getDatasetFacets(): Promise<{
    theme: string[]
    keyword: string[]
    publisher: string[]
  }> {
    const datasets = await this.listAllDatasets()

    const themes = new Set<string>()
    const keywords = new Set<string>()
    const publishers = new Set<string>()

    datasets.forEach(dataset => {
      // Collect themes
      if (dataset.theme) {
        dataset.theme.forEach(t => themes.add(t))
      }

      // Collect keywords
      if (dataset.keyword) {
        dataset.keyword.forEach(k => keywords.add(k))
      }

      // Collect publishers
      if (dataset.publisher?.name) {
        publishers.add(dataset.publisher.name)
      }
    })

    return {
      theme: Array.from(themes).sort(),
      keyword: Array.from(keywords).sort(),
      publisher: Array.from(publishers).sort(),
    }
  }

  /**
   * Get all datasets (using CKAN-compatible API)
   * Returns array of dataset identifiers only
   */
  async listDatasets(): Promise<string[]> {
    const response = await this.request<string[]>('/api/3/action/package_list')
    return response.data
  }

  /**
   * Get dataset details (using CKAN-compatible API)
   */
  async getDatasetCkan(identifier: string): Promise<DkanDataset> {
    const response = await this.request<{ result: DkanDataset }>(
      `/api/3/action/package_show?id=${identifier}`
    )
    return response.data.result
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Get default options
   */
  getDefaultOptions() {
    return { ...this.defaultOptions }
  }

  // ==================== HARVEST API ====================

  /**
   * List all harvest plan identifiers
   */
  async listHarvestPlans(): Promise<string[]> {
    const response = await this.request<string[]>('/api/1/harvest/plans')
    return response.data
  }

  /**
   * Register a new harvest plan
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
   */
  async getHarvestPlan(planId: string): Promise<HarvestPlan> {
    const response = await this.request<HarvestPlan>(
      `/api/1/harvest/plans/${planId}`
    )
    return response.data
  }

  /**
   * List harvest runs for a specific plan
   */
  async listHarvestRuns(planId: string): Promise<HarvestRun[]> {
    const response = await this.request<HarvestRun[]>(
      `/api/1/harvest/runs?plan=${planId}`
    )
    return response.data
  }

  /**
   * Get information about a specific harvest run
   */
  async getHarvestRun(runId: string): Promise<HarvestRun> {
    const response = await this.request<HarvestRun>(
      `/api/1/harvest/runs/${runId}`
    )
    return response.data
  }

  /**
   * Execute a harvest run
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
   * Create a new dataset
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
   * Update an existing dataset (full replacement)
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
   * Partially update a dataset
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
   * Delete a dataset
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
   */
  async listDatastoreImports(): Promise<Record<string, DatastoreImport>> {
    const response = await this.request<Record<string, DatastoreImport>>(
      '/api/1/datastore/imports'
    )
    return response.data
  }

  /**
   * Trigger a datastore import
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
   * Phase 1 - OpenAPI alignment: Implements GET /api/1/datastore/imports/{identifier}
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
      `/api/1/datastore/imports/${identifier}`,
      {
        method: 'GET',
      }
    )
    return response.data
  }

  // ==================== REVISIONS / MODERATION ====================

  /**
   * Get all revisions for an item in a schema
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
   * Executes a query and returns downloadable file
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
   * Use the `?show-reference-ids` parameter to get distribution identifiers:
   *
   * ```typescript
   * const dataset = await client.getDataset('dataset-id', { 'show-reference-ids': true });
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
   * @see https://data.medicaid.gov/about/api - Official DKAN SQL endpoint documentation
   * @see https://data.healthcare.gov/api - Additional DKAN API examples
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
   * Get OpenAPI documentation UI URL
   * Returns the URL to the interactive API documentation
   */
  getOpenApiDocsUrl(): string {
    return `${this.baseUrl}/api/1/docs`
  }

}
