/**
 * DKAN API Client - Handles HTTP requests to DKAN REST API
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
  DatasetProperty,
  DatasetPropertyValue,
  CkanPackageSearchResponse,
  CkanPackageSearchOptions,
  CkanDatastoreSearchResponse,
  CkanDatastoreSearchOptions,
  CkanDatastoreSearchSqlOptions,
  CkanResource,
  CkanPackageWithResources,
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
   */
  async getDataset(identifier: string): Promise<DkanDataset> {
    const response = await this.request<DkanDataset>(
      `/api/1/metastore/schemas/dataset/items/${identifier}`
    )
    return response.data
  }

  /**
   * Search datasets with filters
   */
  async searchDatasets(options: DatasetQueryOptions = {}): Promise<DkanSearchResponse> {
    const params = new URLSearchParams()

    if (options.keyword) params.append('keyword', options.keyword)
    if (options.theme) params.append('theme', options.theme)
    if (options.fulltext) params.append('fulltext', options.fulltext)
    if (options.sort) params.append('sort', options.sort)
    if (options['sort-order']) params.append('sort-order', options['sort-order'])
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
   */
  async getSchemaItems(schemaId: string): Promise<any[]> {
    const response = await this.request<any>(
      `/api/1/metastore/schemas/${schemaId}/items`
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
   * Get datastore statistics for a resource
   */
  async getDatastoreStatistics(identifier: string): Promise<DatastoreStatistics> {
    const response = await this.request<DatastoreStatistics>(
      `/api/1/datastore/imports/${identifier}`
    )
    return response.data
  }

  /**
   * Delete a datastore (resource or all resources for a dataset)
   */
  async deleteDatastore(identifier: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>(
      `/api/1/datastore/imports/${identifier}`,
      {
        method: 'DELETE',
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

    const url = `${this.baseUrl}/api/1/datastore/query/${datasetId}/${index}/download?format=${format}`
    const authHeader = this.getAuthHeader()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(queryOptions),
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

    const url = `${this.baseUrl}/api/1/datastore/query/${distributionId}/download?format=${format}`
    const authHeader = this.getAuthHeader()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(queryOptions),
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
   * Execute a SQL query against the datastore
   * Returns query results as array of objects
   */
  async querySql(options: SqlQueryOptions): Promise<SqlQueryResult> {
    const response = await this.request<SqlQueryResult>(
      '/api/1/datastore/sql',
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    )
    return response.data
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

  // ==================== DATASET PROPERTIES ====================

  /**
   * Get all dataset properties (fields available for filtering)
   */
  async getDatasetProperties(): Promise<string[]> {
    const response = await this.request<string[]>(
      '/api/1/properties'
    )
    return response.data
  }

  /**
   * Get all values for a specific property across datasets
   */
  async getPropertyValues(property: string): Promise<string[]> {
    const response = await this.request<string[]>(
      `/api/1/properties/${property}`
    )
    return response.data
  }

  /**
   * Get all properties with their values
   * Useful for building faceted search UIs
   */
  async getAllPropertiesWithValues(): Promise<Record<string, string[]>> {
    const response = await this.request<Record<string, string[]>>(
      '/api/1/properties?show_values=true'
    )
    return response.data
  }

  // ==================== OPENAPI DOCUMENTATION ====================

  /**
   * Get OpenAPI specification as JSON
   */
  async getOpenApiSpec(): Promise<Record<string, any>> {
    const response = await this.request<Record<string, any>>(
      '/api/1/spec'
    )
    return response.data
  }

  /**
   * Get OpenAPI documentation UI URL
   * Returns the URL to the interactive API documentation
   */
  getOpenApiDocsUrl(): string {
    return `${this.baseUrl}/api/1/docs`
  }

  // ==================== CKAN API COMPATIBILITY ====================

  /**
   * CKAN-compatible package (dataset) search
   * Provides compatibility with CKAN-based tools
   */
  async ckanPackageSearch(options: CkanPackageSearchOptions = {}): Promise<CkanPackageSearchResponse> {
    const params = new URLSearchParams()

    if (options.q) params.append('q', options.q)
    if (options.fq) params.append('fq', options.fq)
    if (options.rows !== undefined) params.append('rows', options.rows.toString())
    if (options.start !== undefined) params.append('start', options.start.toString())
    if (options.sort) params.append('sort', options.sort)
    if (options.facet !== undefined) params.append('facet', String(options.facet))
    if (options['facet.field']) {
      options['facet.field'].forEach(field => params.append('facet.field', field))
    }
    if (options['facet.limit'] !== undefined) {
      params.append('facet.limit', options['facet.limit'].toString())
    }

    const queryString = params.toString()
    const path = `/api/3/action/package_search${queryString ? `?${queryString}` : ''}`

    const response = await this.request<{ result: CkanPackageSearchResponse }>(path)
    return response.data.result
  }

  /**
   * CKAN-compatible datastore search
   * Query a specific resource's datastore
   */
  async ckanDatastoreSearch(options: CkanDatastoreSearchOptions): Promise<CkanDatastoreSearchResponse> {
    const params = new URLSearchParams()
    params.append('resource_id', options.resource_id)

    if (options.filters) {
      params.append('filters', JSON.stringify(options.filters))
    }
    if (options.q) params.append('q', options.q)
    if (options.distinct !== undefined) params.append('distinct', String(options.distinct))
    if (options.plain !== undefined) params.append('plain', String(options.plain))
    if (options.language) params.append('language', options.language)
    if (options.limit !== undefined) params.append('limit', options.limit.toString())
    if (options.offset !== undefined) params.append('offset', options.offset.toString())
    if (options.fields) params.append('fields', options.fields.join(','))
    if (options.sort) params.append('sort', options.sort)

    const queryString = params.toString()
    const path = `/api/3/action/datastore_search?${queryString}`

    const response = await this.request<{ result: CkanDatastoreSearchResponse }>(path)
    return response.data.result
  }

  /**
   * CKAN-compatible SQL query endpoint
   * Execute SQL queries against the datastore
   */
  async ckanDatastoreSearchSql(options: CkanDatastoreSearchSqlOptions): Promise<SqlQueryResult> {
    const params = new URLSearchParams()
    params.append('sql', options.sql)

    const path = `/api/3/action/datastore_search_sql?${params.toString()}`

    const response = await this.request<{ result: { records: SqlQueryResult } }>(path)
    return response.data.result.records
  }

  /**
   * CKAN-compatible resource show
   * Get metadata about a specific resource
   */
  async ckanResourceShow(resourceId: string): Promise<CkanResource> {
    const response = await this.request<{ result: CkanResource }>(
      `/api/3/action/resource_show?id=${resourceId}`
    )
    return response.data.result
  }

  /**
   * CKAN-compatible current package list with resources
   * Get all datasets with their resources included
   */
  async ckanCurrentPackageListWithResources(): Promise<CkanPackageWithResources[]> {
    const response = await this.request<{ result: CkanPackageWithResources[] }>(
      '/api/3/action/current_package_list_with_resources'
    )
    return response.data.result
  }
}
