/**
 * DkanClient - Central coordinator for all DKAN data operations
 * Built on TanStack Query's QueryClient
 */

import { QueryClient } from '@tanstack/query-core'
import type { DkanClientConfig, DatasetKey, DatastoreQueryOptions } from '../types'
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
 * DkanClient - TanStack Query wrapper for DKAN API.
 *
 * Wraps DkanApiClient with QueryClient for automatic caching, background refetching,
 * and state management. Use this in server-side code or when building custom framework adapters.
 *
 * For React/Vue applications, use framework-specific hooks/composables from
 * @dkan-client-tools/react or @dkan-client-tools/vue instead of calling these methods directly.
 *
 * Architecture:
 * - DkanApiClient handles HTTP requests and authentication
 * - QueryClient manages caching, deduplication, and stale-time policies
 * - Methods return Query/Mutation results for direct consumption
 *
 * @example
 * ```typescript
 * const dkanClient = new DkanClient({
 *   baseUrl: 'https://data.example.com',
 *   queryClient: new QueryClient(),
 *   auth: { username: 'admin', password: 'password' }
 * })
 *
 * // Direct usage (bypasses caching)
 * const dataset = await dkanClient.fetchDataset('abc-123')
 * ```
 *
 * @see DkanApiClient for low-level HTTP client
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

  /** Underlying DkanApiClient for direct HTTP operations */
  getApiClient(): DkanApiClient {
    return this.apiClient
  }

  /** TanStack QueryClient for advanced cache operations */
  getQueryClient(): QueryClient {
    return this.queryClient
  }

  /**
   * Mount client (tracks lifecycle). Called automatically by framework providers.
   */
  mount(): void {
    this.mountCount++
    if (this.mountCount === 1) {
      this.queryClient.mount()
    }
  }

  /**
   * Unmount client (tracks lifecycle). Called automatically by framework providers.
   */
  unmount(): void {
    this.mountCount--
    if (this.mountCount === 0) {
      this.queryClient.unmount()
    }
  }

  /** Check if client is currently mounted */
  isMounted(): boolean {
    return this.mountCount > 0
  }

  /**
   * @inheritdoc DkanApiClient.getDataset
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async fetchDataset(identifier: string) {
    return this.apiClient.getDataset(identifier)
  }

  /**
   * @inheritdoc DkanApiClient.searchDatasets
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async searchDatasets(options: Parameters<DkanApiClient['searchDatasets']>[0]) {
    return this.apiClient.searchDatasets(options)
  }

  /**
   * @inheritdoc DkanApiClient.queryDatastore
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async queryDatastore(
    datasetId: string,
    index?: number,
    options?: Parameters<DkanApiClient['queryDatastore']>[2]
  ) {
    return this.apiClient.queryDatastore(datasetId, index, options)
  }

  /**
   * @inheritdoc DkanApiClient.getDatastoreSchema
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getDatastoreSchema(datasetId: string, index?: number) {
    return this.apiClient.getDatastoreSchema(datasetId, index)
  }

  /**
   * @inheritdoc DkanApiClient.listDataDictionaries
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async listDataDictionaries() {
    return this.apiClient.listDataDictionaries()
  }

  /**
   * @inheritdoc DkanApiClient.getDataDictionary
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getDataDictionary(identifier: string) {
    return this.apiClient.getDataDictionary(identifier)
  }

  /**
   * @inheritdoc DkanApiClient.getDataDictionaryFromUrl
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getDataDictionaryFromUrl(url: string) {
    return this.apiClient.getDataDictionaryFromUrl(url)
  }

  /**
   * @inheritdoc DkanApiClient.listAllDatasets
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async listAllDatasets() {
    return this.apiClient.listAllDatasets()
  }

  /**
   * @inheritdoc DkanApiClient.listSchemas
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async listSchemas() {
    return this.apiClient.listSchemas()
  }

  /**
   * @inheritdoc DkanApiClient.getSchemaItems
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getSchemaItems(schemaId: string) {
    return this.apiClient.getSchemaItems(schemaId)
  }

  /**
   * @inheritdoc DkanApiClient.getDatasetFacets
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getDatasetFacets() {
    return this.apiClient.getDatasetFacets()
  }

  /**
   * @inheritdoc DkanApiClient.getSchema
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getSchema(schemaId: string) {
    return this.apiClient.getSchema(schemaId)
  }

  /**
   * @inheritdoc DkanApiClient.getDatastoreStatistics
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getDatastoreStatistics(identifier: string) {
    return this.apiClient.getDatastoreStatistics(identifier)
  }

  /**
   * @inheritdoc DkanApiClient.queryDatastoreMulti
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async queryDatastoreMulti(
    options: DatastoreQueryOptions,
    method: 'GET' | 'POST' = 'POST'
  ) {
    return this.apiClient.queryDatastoreMulti(options, method)
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
   * Clear all cached data. Use invalidateQueries() to mark stale instead.
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

  /** QueryCache instance for cache inspection */
  getQueryCache() {
    return this.queryClient.getQueryCache()
  }

  // ==================== HARVEST API ====================

  /**
   * @inheritdoc DkanApiClient.listHarvestPlans
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async listHarvestPlans() {
    return this.apiClient.listHarvestPlans()
  }

  /**
   * @inheritdoc DkanApiClient.registerHarvestPlan
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async registerHarvestPlan(plan: Parameters<typeof DkanApiClient.prototype.registerHarvestPlan>[0]) {
    return this.apiClient.registerHarvestPlan(plan)
  }

  /**
   * @inheritdoc DkanApiClient.getHarvestPlan
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getHarvestPlan(planId: string) {
    return this.apiClient.getHarvestPlan(planId)
  }

  /**
   * @inheritdoc DkanApiClient.listHarvestRuns
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async listHarvestRuns(planId: string) {
    return this.apiClient.listHarvestRuns(planId)
  }

  /**
   * @inheritdoc DkanApiClient.getHarvestRun
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getHarvestRun(runId: string, planId: string) {
    return this.apiClient.getHarvestRun(runId, planId)
  }

  /**
   * @inheritdoc DkanApiClient.runHarvest
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async runHarvest(options: Parameters<typeof DkanApiClient.prototype.runHarvest>[0]) {
    return this.apiClient.runHarvest(options)
  }

  // ==================== DATASET CRUD ====================

  /**
   * @inheritdoc DkanApiClient.createDataset
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async createDataset(dataset: Parameters<typeof DkanApiClient.prototype.createDataset>[0]) {
    return this.apiClient.createDataset(dataset)
  }

  /**
   * @inheritdoc DkanApiClient.updateDataset
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async updateDataset(identifier: string, dataset: Parameters<typeof DkanApiClient.prototype.updateDataset>[1]) {
    return this.apiClient.updateDataset(identifier, dataset)
  }

  /**
   * @inheritdoc DkanApiClient.patchDataset
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async patchDataset(identifier: string, partialDataset: Parameters<typeof DkanApiClient.prototype.patchDataset>[1]) {
    return this.apiClient.patchDataset(identifier, partialDataset)
  }

  /**
   * @inheritdoc DkanApiClient.deleteDataset
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async deleteDataset(identifier: string) {
    return this.apiClient.deleteDataset(identifier)
  }

  // ==================== DATASTORE IMPORTS ====================

  /**
   * @inheritdoc DkanApiClient.listDatastoreImports
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async listDatastoreImports() {
    return this.apiClient.listDatastoreImports()
  }

  /**
   * @inheritdoc DkanApiClient.triggerDatastoreImport
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async triggerDatastoreImport(options: Parameters<typeof DkanApiClient.prototype.triggerDatastoreImport>[0]) {
    return this.apiClient.triggerDatastoreImport(options)
  }

  /**
   * @inheritdoc DkanApiClient.deleteDatastore
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async deleteDatastore(identifier: string) {
    return this.apiClient.deleteDatastore(identifier)
  }

  // ==================== REVISIONS / MODERATION ====================

  /**
   * @inheritdoc DkanApiClient.getRevisions
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getRevisions(schemaId: string, identifier: string) {
    return this.apiClient.getRevisions(schemaId, identifier)
  }

  /**
   * @inheritdoc DkanApiClient.getRevision
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async getRevision(schemaId: string, identifier: string, revisionId: string) {
    return this.apiClient.getRevision(schemaId, identifier, revisionId)
  }

  /**
   * @inheritdoc DkanApiClient.createRevision
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async createRevision(
    schemaId: string,
    identifier: string,
    revision: Parameters<typeof DkanApiClient.prototype.createRevision>[2]
  ) {
    return this.apiClient.createRevision(schemaId, identifier, revision)
  }

  /**
   * @inheritdoc DkanApiClient.changeDatasetState
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async changeDatasetState(identifier: string, state: Parameters<typeof DkanApiClient.prototype.changeDatasetState>[1], message?: string) {
    return this.apiClient.changeDatasetState(identifier, state, message)
  }

  // ==================== QUERY DOWNLOAD ====================

  /**
   * @inheritdoc DkanApiClient.downloadQuery
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async downloadQuery(
    datasetId: string,
    index: number,
    options?: Parameters<typeof DkanApiClient.prototype.downloadQuery>[2]
  ) {
    return this.apiClient.downloadQuery(datasetId, index, options)
  }

  /**
   * @inheritdoc DkanApiClient.downloadQueryByDistribution
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async downloadQueryByDistribution(
    distributionId: string,
    options?: Parameters<typeof DkanApiClient.prototype.downloadQueryByDistribution>[1]
  ) {
    return this.apiClient.downloadQueryByDistribution(distributionId, options)
  }

  // ==================== SQL QUERY ====================

  /**
   * @inheritdoc DkanApiClient.querySql
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async querySql(options: Parameters<typeof DkanApiClient.prototype.querySql>[0]) {
    return this.apiClient.querySql(options)
  }

  // ==================== DATA DICTIONARY CRUD ====================

  /**
   * @inheritdoc DkanApiClient.createDataDictionary
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async createDataDictionary(dictionary: Parameters<typeof DkanApiClient.prototype.createDataDictionary>[0]) {
    return this.apiClient.createDataDictionary(dictionary)
  }

  /**
   * @inheritdoc DkanApiClient.updateDataDictionary
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async updateDataDictionary(identifier: string, dictionary: Parameters<typeof DkanApiClient.prototype.updateDataDictionary>[1]) {
    return this.apiClient.updateDataDictionary(identifier, dictionary)
  }

  /**
   * @inheritdoc DkanApiClient.deleteDataDictionary
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  async deleteDataDictionary(identifier: string) {
    return this.apiClient.deleteDataDictionary(identifier)
  }

  // ==================== OPENAPI DOCUMENTATION ====================

  /**
   * @inheritdoc DkanApiClient.getOpenApiDocsUrl
   *
   * **Note**: Bypasses caching. Use framework hooks for automatic caching.
   */
  getOpenApiDocsUrl() {
    return this.apiClient.getOpenApiDocsUrl()
  }

}
