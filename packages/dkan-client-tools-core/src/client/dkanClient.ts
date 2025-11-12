/**
 * DkanClient - Central coordinator for all DKAN data operations
 * Built on TanStack Query's QueryClient
 */

import { QueryClient } from '@tanstack/query-core'
import type { DkanClientConfig, DatasetKey } from '../types'
import { DkanApiClient } from '../api/client'

/**
 * Configuration options for creating a DkanClient instance.
 *
 * Extends DkanClientConfig with a required QueryClient from your framework adapter.
 */
export interface DkanClientOptions extends DkanClientConfig {
  /**
   * QueryClient instance from the framework adapter (e.g., @tanstack/vue-query, @tanstack/react-query)
   *
   * **IMPORTANT**: Must be from the framework-specific package, not @tanstack/query-core
   *
   * @example
   * ```typescript
   * // React
   * import { QueryClient } from '@tanstack/react-query'
   * const queryClient = new QueryClient()
   *
   * // Vue
   * import { QueryClient } from '@tanstack/vue-query'
   * const queryClient = new QueryClient()
   * ```
   */
  queryClient: QueryClient
}

/**
 * DkanClient - Framework-agnostic core client for DKAN data operations
 *
 * Central coordinator for all DKAN API operations, built on TanStack Query's QueryClient.
 * This class provides direct access to all DKAN REST API methods and manages query caching,
 * invalidation, and lifecycle.
 *
 * **Architecture**:
 * - Wraps TanStack Query's QueryClient for caching and state management
 * - Delegates API calls to DkanApiClient which handles HTTP requests
 * - Provides convenience methods for common operations
 * - Manages component mount/unmount lifecycle
 *
 * **Usage Pattern**:
 * 1. Create a QueryClient from your framework adapter (@tanstack/react-query or @tanstack/vue-query)
 * 2. Pass it to DkanClient along with your DKAN base URL and optional auth
 * 3. Use framework-specific hooks/composables that consume this client
 * 4. Or call methods directly for imperative data fetching
 *
 * **Direct vs Hook Usage**:
 * - For React/Vue applications, prefer using the framework-specific hooks/composables
 * - Use direct methods for server-side operations, scripts, or custom integrations
 * - Direct methods bypass caching - use hooks/composables for automatic caching
 *
 * @example
 * Basic setup with React:
 * ```typescript
 * import { QueryClient } from '@tanstack/react-query'
 * import { DkanClient } from '@dkan-client-tools/core'
 *
 * const queryClient = new QueryClient({
 *   defaultOptions: {
 *     queries: {
 *       staleTime: 5 * 60 * 1000, // 5 minutes
 *     },
 *   },
 * })
 *
 * const dkanClient = new DkanClient({
 *   baseUrl: 'https://demo.getdkan.org',
 *   queryClient,
 * })
 * ```
 *
 * @example
 * With authentication:
 * ```typescript
 * import { QueryClient } from '@tanstack/vue-query'
 * import { DkanClient } from '@dkan-client-tools/core'
 *
 * const dkanClient = new DkanClient({
 *   baseUrl: 'https://data.example.com',
 *   queryClient: new QueryClient(),
 *   auth: {
 *     username: 'admin',
 *     password: 'password'
 *   }
 * })
 * ```
 *
 * @example
 * Direct API usage (without hooks):
 * ```typescript
 * // Fetch a dataset
 * const dataset = await dkanClient.fetchDataset('abc-123')
 *
 * // Search datasets
 * const results = await dkanClient.searchDatasets({
 *   searchOptions: { keyword: 'health' }
 * })
 *
 * // Query datastore
 * const data = await dkanClient.queryDatastore('dataset-id', 0, {
 *   limit: 100,
 *   offset: 0
 * })
 * ```
 *
 * @example
 * Cache management:
 * ```typescript
 * // Prefetch a query
 * await dkanClient.prefetchQuery(
 *   ['datasets', 'single', 'abc-123'],
 *   () => dkanClient.fetchDataset('abc-123')
 * )
 *
 * // Invalidate queries after mutation
 * await dkanClient.invalidateQueries(['datasets'])
 *
 * // Clear all caches
 * dkanClient.clear()
 * ```
 *
 * @see {@link DkanApiClient} for the underlying HTTP client
 * @see https://tanstack.com/query/latest for TanStack Query documentation
 */
export class DkanClient {
  private apiClient: DkanApiClient
  private queryClient: QueryClient
  private mountCount = 0

  constructor(options: DkanClientOptions) {
    if (!options.queryClient) {
      throw new Error(
        'DkanClient requires a QueryClient. Create one using your framework adapter (e.g., @tanstack/vue-query) and pass it to DkanClient.'
      )
    }

    this.apiClient = new DkanApiClient(options)
    this.queryClient = options.queryClient
  }

  /**
   * Gets the underlying DkanApiClient for direct HTTP operations.
   *
   * The ApiClient provides low-level access to DKAN REST APIs without caching.
   * Use this when you need direct control over HTTP requests or when implementing
   * custom integrations that don't use TanStack Query.
   *
   * @returns The DkanApiClient instance
   *
   * @example
   * ```typescript
   * const apiClient = dkanClient.getApiClient()
   * const dataset = await apiClient.getDataset('abc-123')
   * ```
   */
  getApiClient(): DkanApiClient {
    return this.apiClient
  }

  /**
   * Gets the underlying TanStack QueryClient for advanced cache operations.
   *
   * Provides direct access to the QueryClient for advanced use cases like:
   * - Custom query invalidation strategies
   * - Direct cache manipulation
   * - Subscribing to cache changes
   * - Advanced query filters
   *
   * @returns The TanStack QueryClient instance
   *
   * @example
   * ```typescript
   * const queryClient = dkanClient.getQueryClient()
   * // Get query cache stats
   * const cache = queryClient.getQueryCache()
   * console.log(`Cached queries: ${cache.getAll().length}`)
   * ```
   */
  getQueryClient(): QueryClient {
    return this.queryClient
  }

  /**
   * Mounts the client (tracks component lifecycle).
   *
   * Called automatically by framework providers when the first component mounts.
   * Increments the mount counter and mounts the QueryClient on first mount.
   *
   * **Note**: You typically don't need to call this manually - the framework
   * providers handle it automatically.
   */
  mount(): void {
    this.mountCount++
    if (this.mountCount === 1) {
      this.queryClient.mount()
    }
  }

  /**
   * Unmounts the client (tracks component lifecycle).
   *
   * Called automatically by framework providers when components unmount.
   * Decrements the mount counter and unmounts the QueryClient when no
   * components are using it.
   *
   * **Note**: You typically don't need to call this manually - the framework
   * providers handle it automatically.
   */
  unmount(): void {
    this.mountCount--
    if (this.mountCount === 0) {
      this.queryClient.unmount()
    }
  }

  /**
   * Checks if the client is currently mounted.
   *
   * @returns True if at least one component is using the client
   */
  isMounted(): boolean {
    return this.mountCount > 0
  }

  /**
   * Fetch a single dataset
   */
  async fetchDataset(identifier: string) {
    return this.apiClient.getDataset(identifier)
  }

  /**
   * Search datasets
   */
  async searchDatasets(options: Parameters<DkanApiClient['searchDatasets']>[0]) {
    return this.apiClient.searchDatasets(options)
  }

  /**
   * Query datastore
   */
  async queryDatastore(
    datasetId: string,
    index?: number,
    options?: Parameters<DkanApiClient['queryDatastore']>[2]
  ) {
    return this.apiClient.queryDatastore(datasetId, index, options)
  }

  /**
   * Get datastore schema with data dictionary
   */
  async getDatastoreSchema(datasetId: string, index?: number) {
    return this.apiClient.getDatastoreSchema(datasetId, index)
  }

  /**
   * List all data dictionaries
   */
  async listDataDictionaries() {
    return this.apiClient.listDataDictionaries()
  }

  /**
   * Get a specific data dictionary
   */
  async getDataDictionary(identifier: string) {
    return this.apiClient.getDataDictionary(identifier)
  }

  /**
   * Get data dictionary from URL
   */
  async getDataDictionaryFromUrl(url: string) {
    return this.apiClient.getDataDictionaryFromUrl(url)
  }

  /**
   * List all datasets (full metadata objects)
   */
  async listAllDatasets() {
    return this.apiClient.listAllDatasets()
  }

  /**
   * List available metastore schemas
   */
  async listSchemas() {
    return this.apiClient.listSchemas()
  }

  /**
   * Get items for a specific schema
   */
  async getSchemaItems(schemaId: string) {
    return this.apiClient.getSchemaItems(schemaId)
  }

  /**
   * Get dataset facets (themes, keywords, publishers)
   */
  async getDatasetFacets() {
    return this.apiClient.getDatasetFacets()
  }

  /**
   * Prefetches a query and stores it in cache.
   *
   * Useful for preloading data before it's needed, improving perceived performance.
   * The data will be cached according to the staleTime setting.
   *
   * @param queryKey - Unique identifier for the query (e.g., ['datasets', 'single', id])
   * @param queryFn - Function that returns a Promise with the data
   * @param options - Optional configuration including staleTime
   *
   * @example
   * ```typescript
   * // Prefetch a dataset on page load
   * await dkanClient.prefetchQuery(
   *   ['datasets', 'single', 'abc-123'],
   *   () => dkanClient.fetchDataset('abc-123'),
   *   { staleTime: 10 * 60 * 1000 } // Cache for 10 minutes
   * )
   * ```
   */
  async prefetchQuery<TData = any>(
    queryKey: DatasetKey,
    queryFn: () => Promise<TData>,
    options?: { staleTime?: number }
  ): Promise<void> {
    await this.queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options?.staleTime,
    })
  }

  /**
   * Retrieves cached query data without triggering a fetch.
   *
   * Returns undefined if the data is not in cache. Useful for optimistic updates
   * or checking cache state.
   *
   * @param queryKey - Unique identifier for the query
   * @returns The cached data or undefined
   *
   * @example
   * ```typescript
   * const cachedDataset = dkanClient.getQueryData(['datasets', 'single', 'abc-123'])
   * if (cachedDataset) {
   *   console.log('Dataset is cached:', cachedDataset)
   * }
   * ```
   */
  getQueryData<TData = any>(queryKey: DatasetKey): TData | undefined {
    return this.queryClient.getQueryData<TData>(queryKey)
  }

  /**
   * Manually sets query data in the cache.
   *
   * Useful for optimistic updates where you update the cache immediately
   * before the server responds, improving perceived performance.
   *
   * @param queryKey - Unique identifier for the query
   * @param data - The data to store in cache
   *
   * @example
   * ```typescript
   * // Optimistic update after mutation
   * dkanClient.setQueryData(['datasets', 'single', 'abc-123'], {
   *   ...existingDataset,
   *   title: 'Updated Title'
   * })
   * ```
   */
  setQueryData<TData = any>(queryKey: DatasetKey, data: TData): void {
    this.queryClient.setQueryData<TData>(queryKey, data)
  }

  /**
   * Invalidates queries, marking them as stale and triggering refetches.
   *
   * Call this after mutations to ensure all related queries fetch fresh data.
   * If no queryKey is provided, invalidates all queries.
   *
   * @param queryKey - Optional query key to invalidate (prefix matching)
   *
   * @example
   * ```typescript
   * // Invalidate all dataset queries after creating a new dataset
   * await dkanClient.invalidateQueries(['datasets'])
   *
   * // Invalidate specific dataset
   * await dkanClient.invalidateQueries(['datasets', 'single', 'abc-123'])
   *
   * // Invalidate everything
   * await dkanClient.invalidateQueries()
   * ```
   */
  async invalidateQueries(queryKey?: DatasetKey): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey,
    })
  }

  /**
   * Clears all cached data and removes all queries from memory.
   *
   * **Warning**: This is a destructive operation that removes all cached data.
   * Queries will need to refetch from scratch. Use {@link invalidateQueries}
   * instead if you want to keep the cache structure but mark data as stale.
   *
   * @example
   * ```typescript
   * // Clear everything (e.g., on logout)
   * dkanClient.clear()
   * ```
   */
  clear(): void {
    this.queryClient.clear()
  }

  /**
   * Removes specific queries from the cache.
   *
   * Unlike {@link invalidateQueries}, this completely removes queries from memory
   * rather than just marking them as stale. Use this to free up memory or remove
   * queries that are no longer needed.
   *
   * @param queryKey - Optional query key to remove (prefix matching)
   *
   * @example
   * ```typescript
   * // Remove all dataset queries
   * dkanClient.removeQueries(['datasets'])
   *
   * // Remove specific dataset from cache
   * dkanClient.removeQueries(['datasets', 'single', 'abc-123'])
   * ```
   */
  removeQueries(queryKey?: DatasetKey): void {
    this.queryClient.removeQueries({
      queryKey,
    })
  }

  /**
   * Gets the QueryCache instance for advanced cache inspection.
   *
   * Provides access to all cached queries and their metadata. Useful for
   * debugging, monitoring, or building custom cache visualizations.
   *
   * @returns The QueryCache instance
   *
   * @example
   * ```typescript
   * const cache = dkanClient.getQueryCache()
   * const allQueries = cache.getAll()
   * console.log(`Total cached queries: ${allQueries.length}`)
   *
   * // Find queries by key
   * const datasetQueries = cache.findAll({ queryKey: ['datasets'] })
   * console.log(`Cached datasets: ${datasetQueries.length}`)
   * ```
   */
  getQueryCache() {
    return this.queryClient.getQueryCache()
  }

  // ==================== HARVEST API ====================

  /**
   * List all harvest plan identifiers
   */
  async listHarvestPlans() {
    return this.apiClient.listHarvestPlans()
  }

  /**
   * Register a new harvest plan
   */
  async registerHarvestPlan(plan: Parameters<typeof DkanApiClient.prototype.registerHarvestPlan>[0]) {
    return this.apiClient.registerHarvestPlan(plan)
  }

  /**
   * Get a specific harvest plan
   */
  async getHarvestPlan(planId: string) {
    return this.apiClient.getHarvestPlan(planId)
  }

  /**
   * List harvest runs for a specific plan
   */
  async listHarvestRuns(planId: string) {
    return this.apiClient.listHarvestRuns(planId)
  }

  /**
   * Get information about a specific harvest run
   */
  async getHarvestRun(runId: string) {
    return this.apiClient.getHarvestRun(runId)
  }

  /**
   * Execute a harvest run
   */
  async runHarvest(options: Parameters<typeof DkanApiClient.prototype.runHarvest>[0]) {
    return this.apiClient.runHarvest(options)
  }

  // ==================== DATASET CRUD ====================

  /**
   * Create a new dataset
   */
  async createDataset(dataset: Parameters<typeof DkanApiClient.prototype.createDataset>[0]) {
    return this.apiClient.createDataset(dataset)
  }

  /**
   * Update an existing dataset (full replacement)
   */
  async updateDataset(identifier: string, dataset: Parameters<typeof DkanApiClient.prototype.updateDataset>[1]) {
    return this.apiClient.updateDataset(identifier, dataset)
  }

  /**
   * Partially update a dataset
   */
  async patchDataset(identifier: string, partialDataset: Parameters<typeof DkanApiClient.prototype.patchDataset>[1]) {
    return this.apiClient.patchDataset(identifier, partialDataset)
  }

  /**
   * Delete a dataset
   */
  async deleteDataset(identifier: string) {
    return this.apiClient.deleteDataset(identifier)
  }

  // ==================== DATASTORE IMPORTS ====================

  /**
   * List all datastore imports
   */
  async listDatastoreImports() {
    return this.apiClient.listDatastoreImports()
  }

  /**
   * Trigger a datastore import
   */
  async triggerDatastoreImport(options: Parameters<typeof DkanApiClient.prototype.triggerDatastoreImport>[0]) {
    return this.apiClient.triggerDatastoreImport(options)
  }

  /**
   * Get datastore statistics for a resource
   */
  async getDatastoreStatistics(identifier: string) {
    return this.apiClient.getDatastoreStatistics(identifier)
  }

  /**
   * Delete a datastore (resource or all resources for a dataset)
   */
  async deleteDatastore(identifier: string) {
    return this.apiClient.deleteDatastore(identifier)
  }

  // ==================== REVISIONS / MODERATION ====================

  /**
   * Get all revisions for an item in a schema
   */
  async getRevisions(schemaId: string, identifier: string) {
    return this.apiClient.getRevisions(schemaId, identifier)
  }

  /**
   * Get a specific revision
   */
  async getRevision(schemaId: string, identifier: string, revisionId: string) {
    return this.apiClient.getRevision(schemaId, identifier, revisionId)
  }

  /**
   * Create a new revision (change workflow state)
   */
  async createRevision(
    schemaId: string,
    identifier: string,
    revision: Parameters<typeof DkanApiClient.prototype.createRevision>[2]
  ) {
    return this.apiClient.createRevision(schemaId, identifier, revision)
  }

  /**
   * Convenience method to change dataset workflow state
   */
  async changeDatasetState(identifier: string, state: Parameters<typeof DkanApiClient.prototype.changeDatasetState>[1], message?: string) {
    return this.apiClient.changeDatasetState(identifier, state, message)
  }

  // ==================== QUERY DOWNLOAD ====================

  /**
   * Download datastore query results as CSV or JSON
   */
  async downloadQuery(
    datasetId: string,
    index: number,
    options?: Parameters<typeof DkanApiClient.prototype.downloadQuery>[2]
  ) {
    return this.apiClient.downloadQuery(datasetId, index, options)
  }

  /**
   * Download datastore query results by distribution ID
   */
  async downloadQueryByDistribution(
    distributionId: string,
    options?: Parameters<typeof DkanApiClient.prototype.downloadQueryByDistribution>[1]
  ) {
    return this.apiClient.downloadQueryByDistribution(distributionId, options)
  }

  // ==================== SQL QUERY ====================

  /**
   * Execute a SQL query against the datastore
   */
  async querySql(options: Parameters<typeof DkanApiClient.prototype.querySql>[0]) {
    return this.apiClient.querySql(options)
  }

  // ==================== DATA DICTIONARY CRUD ====================

  /**
   * Create a new data dictionary
   */
  async createDataDictionary(dictionary: Parameters<typeof DkanApiClient.prototype.createDataDictionary>[0]) {
    return this.apiClient.createDataDictionary(dictionary)
  }

  /**
   * Update an existing data dictionary
   */
  async updateDataDictionary(identifier: string, dictionary: Parameters<typeof DkanApiClient.prototype.updateDataDictionary>[1]) {
    return this.apiClient.updateDataDictionary(identifier, dictionary)
  }

  /**
   * Delete a data dictionary
   */
  async deleteDataDictionary(identifier: string) {
    return this.apiClient.deleteDataDictionary(identifier)
  }

  // ==================== DATASET PROPERTIES ====================

  /**
   * Get all dataset properties
   */
  async getDatasetProperties() {
    return this.apiClient.getDatasetProperties()
  }

  /**
   * Get all values for a specific property
   */
  async getPropertyValues(property: string) {
    return this.apiClient.getPropertyValues(property)
  }

  /**
   * Get all properties with their values
   */
  async getAllPropertiesWithValues() {
    return this.apiClient.getAllPropertiesWithValues()
  }

  // ==================== OPENAPI DOCUMENTATION ====================

  /**
   * Get OpenAPI specification
   */
  async getOpenApiSpec() {
    return this.apiClient.getOpenApiSpec()
  }

  /**
   * Get OpenAPI documentation UI URL
   */
  getOpenApiDocsUrl() {
    return this.apiClient.getOpenApiDocsUrl()
  }

  // ==================== CKAN API COMPATIBILITY ====================

  /**
   * CKAN-compatible package search
   */
  async ckanPackageSearch(options?: Parameters<typeof DkanApiClient.prototype.ckanPackageSearch>[0]) {
    return this.apiClient.ckanPackageSearch(options)
  }

  /**
   * CKAN-compatible datastore search
   */
  async ckanDatastoreSearch(options: Parameters<typeof DkanApiClient.prototype.ckanDatastoreSearch>[0]) {
    return this.apiClient.ckanDatastoreSearch(options)
  }

  /**
   * CKAN-compatible SQL query
   */
  async ckanDatastoreSearchSql(options: Parameters<typeof DkanApiClient.prototype.ckanDatastoreSearchSql>[0]) {
    return this.apiClient.ckanDatastoreSearchSql(options)
  }

  /**
   * CKAN-compatible resource show
   */
  async ckanResourceShow(resourceId: string) {
    return this.apiClient.ckanResourceShow(resourceId)
  }

  /**
   * CKAN-compatible current package list with resources
   */
  async ckanCurrentPackageListWithResources() {
    return this.apiClient.ckanCurrentPackageListWithResources()
  }
}
