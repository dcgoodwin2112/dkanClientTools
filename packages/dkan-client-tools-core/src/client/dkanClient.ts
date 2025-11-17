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
  /** QueryClient from framework adapter (@tanstack/react-query or @tanstack/vue-query). Must not be from @tanstack/query-core. */
  queryClient: QueryClient
}

/**
 * DkanClient - TanStack Query wrapper for DKAN API.
 *
 * Wraps DkanApiClient with QueryClient for caching, background refetching, and state management.
 * Use for server-side code or custom framework adapters.
 *
 * **For React/Vue apps**: Use framework-specific hooks/composables from @dkan-client-tools/react
 * or @dkan-client-tools/vue instead of calling DkanClient methods directly.
 *
 * **Important**: All wrapper methods bypass caching and call the API directly. For automatic caching,
 * deduplication, and background refetching, use framework hooks/composables.
 *
 * Architecture:
 * - DkanApiClient handles HTTP requests and authentication
 * - QueryClient manages caching, deduplication, and stale-time policies
 * - Wrapper methods delegate to DkanApiClient (no caching)
 * - Framework hooks use QueryClient for automatic caching
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

  /** @inheritdoc DkanApiClient.getDataset */
  async fetchDataset(identifier: string) {
    return this.apiClient.getDataset(identifier)
  }

  /** @inheritdoc DkanApiClient.searchDatasets */
  async searchDatasets(options: Parameters<DkanApiClient['searchDatasets']>[0]) {
    return this.apiClient.searchDatasets(options)
  }

  /** @inheritdoc DkanApiClient.queryDatastore */
  async queryDatastore(
    datasetId: string,
    index?: number,
    options?: Parameters<DkanApiClient['queryDatastore']>[2]
  ) {
    return this.apiClient.queryDatastore(datasetId, index, options)
  }

  /** @inheritdoc DkanApiClient.getDatastoreSchema */
  async getDatastoreSchema(datasetId: string, index?: number) {
    return this.apiClient.getDatastoreSchema(datasetId, index)
  }

  /** @inheritdoc DkanApiClient.listDataDictionaries */
  async listDataDictionaries() {
    return this.apiClient.listDataDictionaries()
  }

  /** @inheritdoc DkanApiClient.getDataDictionary */
  async getDataDictionary(identifier: string) {
    return this.apiClient.getDataDictionary(identifier)
  }

  /** @inheritdoc DkanApiClient.getDataDictionaryFromUrl */
  async getDataDictionaryFromUrl(url: string) {
    return this.apiClient.getDataDictionaryFromUrl(url)
  }

  /** @inheritdoc DkanApiClient.listAllDatasets */
  async listAllDatasets() {
    return this.apiClient.listAllDatasets()
  }

  /** @inheritdoc DkanApiClient.listSchemas */
  async listSchemas() {
    return this.apiClient.listSchemas()
  }

  /** @inheritdoc DkanApiClient.getSchemaItems */
  async getSchemaItems(schemaId: string) {
    return this.apiClient.getSchemaItems(schemaId)
  }

  /** @inheritdoc DkanApiClient.getDatasetFacets */
  async getDatasetFacets() {
    return this.apiClient.getDatasetFacets()
  }

  /** @inheritdoc DkanApiClient.getSchema */
  async getSchema(schemaId: string) {
    return this.apiClient.getSchema(schemaId)
  }

  /** @inheritdoc DkanApiClient.getDatastoreStatistics */
  async getDatastoreStatistics(identifier: string) {
    return this.apiClient.getDatastoreStatistics(identifier)
  }

  /** @inheritdoc DkanApiClient.queryDatastoreMulti */
  async queryDatastoreMulti(
    options: DatastoreQueryOptions,
    method: 'GET' | 'POST' = 'POST'
  ) {
    return this.apiClient.queryDatastoreMulti(options, method)
  }

  /**
   * Prefetch and cache a query for improved perceived performance.
   * @param queryKey - Unique identifier for the query
   * @param queryFn - Function returning Promise with data
   * @param options - Optional staleTime configuration
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
   * Retrieve cached query data without triggering a fetch.
   * @param queryKey - Unique identifier for the query
   * @returns Cached data or undefined if not in cache
   */
  getQueryData<TData = any>(queryKey: DatasetKey): TData | undefined {
    return this.queryClient.getQueryData<TData>(queryKey)
  }

  /**
   * Manually set query data in cache. Useful for optimistic updates.
   * @param queryKey - Unique identifier for the query
   * @param data - Data to store in cache
   */
  setQueryData<TData = any>(queryKey: DatasetKey, data: TData): void {
    this.queryClient.setQueryData<TData>(queryKey, data)
  }

  /**
   * Invalidate queries, marking them stale and triggering refetches. Call after mutations.
   * @param queryKey - Optional query key to invalidate (prefix matching). Omit to invalidate all.
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
   * Remove queries from cache completely (vs. invalidateQueries which marks stale).
   * @param queryKey - Optional query key to remove (prefix matching)
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

  /** @inheritdoc DkanApiClient.listHarvestPlans */
  async listHarvestPlans() {
    return this.apiClient.listHarvestPlans()
  }

  /** @inheritdoc DkanApiClient.registerHarvestPlan */
  async registerHarvestPlan(plan: Parameters<typeof DkanApiClient.prototype.registerHarvestPlan>[0]) {
    return this.apiClient.registerHarvestPlan(plan)
  }

  /** @inheritdoc DkanApiClient.getHarvestPlan */
  async getHarvestPlan(planId: string) {
    return this.apiClient.getHarvestPlan(planId)
  }

  /** @inheritdoc DkanApiClient.listHarvestRuns */
  async listHarvestRuns(planId: string) {
    return this.apiClient.listHarvestRuns(planId)
  }

  /** @inheritdoc DkanApiClient.getHarvestRun */
  async getHarvestRun(runId: string, planId: string) {
    return this.apiClient.getHarvestRun(runId, planId)
  }

  /** @inheritdoc DkanApiClient.runHarvest */
  async runHarvest(options: Parameters<typeof DkanApiClient.prototype.runHarvest>[0]) {
    return this.apiClient.runHarvest(options)
  }

  // ==================== DATASET CRUD ====================

  /** @inheritdoc DkanApiClient.createDataset */
  async createDataset(dataset: Parameters<typeof DkanApiClient.prototype.createDataset>[0]) {
    return this.apiClient.createDataset(dataset)
  }

  /** @inheritdoc DkanApiClient.updateDataset */
  async updateDataset(identifier: string, dataset: Parameters<typeof DkanApiClient.prototype.updateDataset>[1]) {
    return this.apiClient.updateDataset(identifier, dataset)
  }

  /** @inheritdoc DkanApiClient.patchDataset */
  async patchDataset(identifier: string, partialDataset: Parameters<typeof DkanApiClient.prototype.patchDataset>[1]) {
    return this.apiClient.patchDataset(identifier, partialDataset)
  }

  /** @inheritdoc DkanApiClient.deleteDataset */
  async deleteDataset(identifier: string) {
    return this.apiClient.deleteDataset(identifier)
  }

  // ==================== DATASTORE IMPORTS ====================

  /** @inheritdoc DkanApiClient.listDatastoreImports */
  async listDatastoreImports() {
    return this.apiClient.listDatastoreImports()
  }

  /** @inheritdoc DkanApiClient.triggerDatastoreImport */
  async triggerDatastoreImport(options: Parameters<typeof DkanApiClient.prototype.triggerDatastoreImport>[0]) {
    return this.apiClient.triggerDatastoreImport(options)
  }

  /** @inheritdoc DkanApiClient.deleteDatastore */
  async deleteDatastore(identifier: string) {
    return this.apiClient.deleteDatastore(identifier)
  }

  // ==================== REVISIONS / MODERATION ====================

  /** @inheritdoc DkanApiClient.getRevisions */
  async getRevisions(schemaId: string, identifier: string) {
    return this.apiClient.getRevisions(schemaId, identifier)
  }

  /** @inheritdoc DkanApiClient.getRevision */
  async getRevision(schemaId: string, identifier: string, revisionId: string) {
    return this.apiClient.getRevision(schemaId, identifier, revisionId)
  }

  /** @inheritdoc DkanApiClient.createRevision */
  async createRevision(
    schemaId: string,
    identifier: string,
    revision: Parameters<typeof DkanApiClient.prototype.createRevision>[2]
  ) {
    return this.apiClient.createRevision(schemaId, identifier, revision)
  }

  /** @inheritdoc DkanApiClient.changeDatasetState */
  async changeDatasetState(identifier: string, state: Parameters<typeof DkanApiClient.prototype.changeDatasetState>[1], message?: string) {
    return this.apiClient.changeDatasetState(identifier, state, message)
  }

  // ==================== QUERY DOWNLOAD ====================

  /** @inheritdoc DkanApiClient.downloadQuery */
  async downloadQuery(
    datasetId: string,
    index: number,
    options?: Parameters<typeof DkanApiClient.prototype.downloadQuery>[2]
  ) {
    return this.apiClient.downloadQuery(datasetId, index, options)
  }

  /** @inheritdoc DkanApiClient.downloadQueryByDistribution */
  async downloadQueryByDistribution(
    distributionId: string,
    options?: Parameters<typeof DkanApiClient.prototype.downloadQueryByDistribution>[1]
  ) {
    return this.apiClient.downloadQueryByDistribution(distributionId, options)
  }

  // ==================== SQL QUERY ====================

  /** @inheritdoc DkanApiClient.querySql */
  async querySql(options: Parameters<typeof DkanApiClient.prototype.querySql>[0]) {
    return this.apiClient.querySql(options)
  }

  // ==================== DATA DICTIONARY CRUD ====================

  /** @inheritdoc DkanApiClient.createDataDictionary */
  async createDataDictionary(dictionary: Parameters<typeof DkanApiClient.prototype.createDataDictionary>[0]) {
    return this.apiClient.createDataDictionary(dictionary)
  }

  /** @inheritdoc DkanApiClient.updateDataDictionary */
  async updateDataDictionary(identifier: string, dictionary: Parameters<typeof DkanApiClient.prototype.updateDataDictionary>[1]) {
    return this.apiClient.updateDataDictionary(identifier, dictionary)
  }

  /** @inheritdoc DkanApiClient.deleteDataDictionary */
  async deleteDataDictionary(identifier: string) {
    return this.apiClient.deleteDataDictionary(identifier)
  }

  // ==================== OPENAPI DOCUMENTATION ====================

  /** @inheritdoc DkanApiClient.getOpenApiDocsUrl */
  getOpenApiDocsUrl() {
    return this.apiClient.getOpenApiDocsUrl()
  }

}
