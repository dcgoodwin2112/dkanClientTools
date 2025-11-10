/**
 * DkanClient - Central coordinator for all DKAN data operations
 * Built on TanStack Query's QueryClient
 */

import { QueryClient } from '@tanstack/query-core'
import type { DkanClientConfig, DatasetKey } from '../types'
import { DkanApiClient } from '../api/client'

export interface DkanClientOptions extends DkanClientConfig {
  /**
   * QueryClient instance from the framework adapter (e.g., @tanstack/vue-query, @tanstack/react-query)
   * IMPORTANT: Must be from the framework-specific package, not @tanstack/query-core
   */
  queryClient: QueryClient
}

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
   * Get the API client
   */
  getApiClient(): DkanApiClient {
    return this.apiClient
  }

  /**
   * Get the underlying TanStack QueryClient
   */
  getQueryClient(): QueryClient {
    return this.queryClient
  }

  /**
   * Mount the client (called when first component mounts)
   */
  mount(): void {
    this.mountCount++
    if (this.mountCount === 1) {
      this.queryClient.mount()
    }
  }

  /**
   * Unmount the client (called when last component unmounts)
   */
  unmount(): void {
    this.mountCount--
    if (this.mountCount === 0) {
      this.queryClient.unmount()
    }
  }

  /**
   * Check if client is mounted
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
   * Prefetch a query
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
   * Get query data from cache
   */
  getQueryData<TData = any>(queryKey: DatasetKey): TData | undefined {
    return this.queryClient.getQueryData<TData>(queryKey)
  }

  /**
   * Set query data manually
   */
  setQueryData<TData = any>(queryKey: DatasetKey, data: TData): void {
    this.queryClient.setQueryData<TData>(queryKey, data)
  }

  /**
   * Invalidate queries
   */
  async invalidateQueries(queryKey?: DatasetKey): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey,
    })
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.queryClient.clear()
  }

  /**
   * Remove specific queries from cache
   */
  removeQueries(queryKey?: DatasetKey): void {
    this.queryClient.removeQueries({
      queryKey,
    })
  }

  /**
   * Get query cache
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
  async registerHarvestPlan(plan: Parameters<typeof this.apiClient.registerHarvestPlan>[0]) {
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
  async runHarvest(options: Parameters<typeof this.apiClient.runHarvest>[0]) {
    return this.apiClient.runHarvest(options)
  }

  // ==================== DATASET CRUD ====================

  /**
   * Create a new dataset
   */
  async createDataset(dataset: Parameters<typeof this.apiClient.createDataset>[0]) {
    return this.apiClient.createDataset(dataset)
  }

  /**
   * Update an existing dataset (full replacement)
   */
  async updateDataset(identifier: string, dataset: Parameters<typeof this.apiClient.updateDataset>[1]) {
    return this.apiClient.updateDataset(identifier, dataset)
  }

  /**
   * Partially update a dataset
   */
  async patchDataset(identifier: string, partialDataset: Parameters<typeof this.apiClient.patchDataset>[1]) {
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
  async triggerDatastoreImport(options: Parameters<typeof this.apiClient.triggerDatastoreImport>[0]) {
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
    revision: Parameters<typeof this.apiClient.createRevision>[2]
  ) {
    return this.apiClient.createRevision(schemaId, identifier, revision)
  }

  /**
   * Convenience method to change dataset workflow state
   */
  async changeDatasetState(identifier: string, state: Parameters<typeof this.apiClient.changeDatasetState>[1], message?: string) {
    return this.apiClient.changeDatasetState(identifier, state, message)
  }

  // ==================== QUERY DOWNLOAD ====================

  /**
   * Download datastore query results as CSV or JSON
   */
  async downloadQuery(
    datasetId: string,
    index: number,
    options?: Parameters<typeof this.apiClient.downloadQuery>[2]
  ) {
    return this.apiClient.downloadQuery(datasetId, index, options)
  }

  /**
   * Download datastore query results by distribution ID
   */
  async downloadQueryByDistribution(
    distributionId: string,
    options?: Parameters<typeof this.apiClient.downloadQueryByDistribution>[1]
  ) {
    return this.apiClient.downloadQueryByDistribution(distributionId, options)
  }

  // ==================== SQL QUERY ====================

  /**
   * Execute a SQL query against the datastore
   */
  async querySql(options: Parameters<typeof this.apiClient.querySql>[0]) {
    return this.apiClient.querySql(options)
  }

  // ==================== DATA DICTIONARY CRUD ====================

  /**
   * Create a new data dictionary
   */
  async createDataDictionary(dictionary: Parameters<typeof this.apiClient.createDataDictionary>[0]) {
    return this.apiClient.createDataDictionary(dictionary)
  }

  /**
   * Update an existing data dictionary
   */
  async updateDataDictionary(identifier: string, dictionary: Parameters<typeof this.apiClient.updateDataDictionary>[1]) {
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
  async ckanPackageSearch(options?: Parameters<typeof this.apiClient.ckanPackageSearch>[0]) {
    return this.apiClient.ckanPackageSearch(options)
  }

  /**
   * CKAN-compatible datastore search
   */
  async ckanDatastoreSearch(options: Parameters<typeof this.apiClient.ckanDatastoreSearch>[0]) {
    return this.apiClient.ckanDatastoreSearch(options)
  }

  /**
   * CKAN-compatible SQL query
   */
  async ckanDatastoreSearchSql(options: Parameters<typeof this.apiClient.ckanDatastoreSearchSql>[0]) {
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
