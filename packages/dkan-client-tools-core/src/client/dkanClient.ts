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
   * Fetch a single dataset by identifier.
   *
   * Retrieves complete dataset metadata from the metastore. Returns a DCAT-US
   * compliant dataset object with title, description, distributions, and more.
   *
   * **Note**: This method bypasses caching. For automatic caching in React/Vue,
   * use the `useDataset` hook/composable instead.
   *
   * @param identifier - Dataset identifier (UUID or custom ID)
   * @returns Complete dataset metadata
   * @throws {DkanApiError} If dataset not found or request fails
   *
   * @example
   * ```typescript
   * const dataset = await dkanClient.fetchDataset('abc-123')
   * console.log(dataset.title)
   * console.log(dataset.distribution) // Array of distributions
   * ```
   */
  async fetchDataset(identifier: string) {
    return this.apiClient.getDataset(identifier)
  }

  /**
   * Search datasets with filters and pagination.
   *
   * Searches the dataset catalog with optional filters for keyword, theme, fulltext,
   * sorting, and pagination. Returns matching datasets with total count and facets.
   *
   * **Note**: This method bypasses caching. For automatic caching in React/Vue,
   * use the `useDatasetSearch` hook/composable instead.
   *
   * @param options - Search options for filtering and pagination
   * @returns Search results with total count, dataset array, and facets
   * @throws {DkanApiError} If request fails
   *
   * @example
   * ```typescript
   * const results = await dkanClient.searchDatasets({
   *   keyword: 'health',
   *   theme: 'Healthcare',
   *   'page-size': 20
   * })
   * console.log(`Found ${results.total} datasets`)
   * ```
   */
  async searchDatasets(options: Parameters<DkanApiClient['searchDatasets']>[0]) {
    return this.apiClient.searchDatasets(options)
  }

  /**
   * Query datastore records with filtering, sorting, and pagination.
   *
   * Executes a query against a distribution's imported data. Supports SQL-like
   * filtering conditions, sorting, pagination, and column selection.
   *
   * **Note**: This method bypasses caching. For automatic caching in React/Vue,
   * use the `useDatastore` hook/composable instead.
   *
   * @param datasetId - Dataset identifier (UUID or custom ID)
   * @param index - Resource index in dataset.distribution array (default: 0)
   * @param options - Query options for filtering, sorting, pagination
   * @returns Query results including schema and result rows
   * @throws {DkanApiError} If resource not found or request fails
   *
   * @example
   * ```typescript
   * const data = await dkanClient.queryDatastore('abc-123', 0, {
   *   limit: 100,
   *   offset: 0,
   *   conditions: [{ property: 'age', value: 25, operator: '>' }],
   *   sort: { property: 'name', order: 'asc' }
   * })
   * ```
   */
  async queryDatastore(
    datasetId: string,
    index?: number,
    options?: Parameters<DkanApiClient['queryDatastore']>[2]
  ) {
    return this.apiClient.queryDatastore(datasetId, index, options)
  }

  /**
   * Get datastore schema with data dictionary.
   *
   * Returns the table schema for a distribution, including column definitions
   * and data dictionary metadata if available.
   *
   * @param datasetId - Dataset identifier (UUID or custom ID)
   * @param index - Resource index in dataset.distribution array (default: 0)
   * @returns Query response containing schema information
   * @throws {DkanApiError} If resource not found or request fails
   */
  async getDatastoreSchema(datasetId: string, index?: number) {
    return this.apiClient.getDatastoreSchema(datasetId, index)
  }

  /**
   * List all data dictionaries.
   *
   * Retrieves all data dictionary definitions from the metastore.
   * Data dictionaries follow the Frictionless Table Schema specification.
   *
   * @returns Array of data dictionary objects
   * @throws {DkanApiError} If request fails
   */
  async listDataDictionaries() {
    return this.apiClient.listDataDictionaries()
  }

  /**
   * Get a specific data dictionary by identifier.
   *
   * Retrieves a single data dictionary with its field definitions.
   *
   * @param identifier - Data dictionary identifier (UUID or custom ID)
   * @returns Data dictionary object with schema and field definitions
   * @throws {DkanApiError} If data dictionary not found or request fails
   */
  async getDataDictionary(identifier: string) {
    return this.apiClient.getDataDictionary(identifier)
  }

  /**
   * Get data dictionary from a remote URL.
   *
   * Fetches a data dictionary from a distribution's describedBy URL.
   *
   * @param url - Full URL to the data dictionary JSON file
   * @returns Data dictionary object from the remote URL
   * @throws {DkanApiError} If URL cannot be fetched or request fails
   */
  async getDataDictionaryFromUrl(url: string) {
    return this.apiClient.getDataDictionaryFromUrl(url)
  }

  /**
   * List all datasets (full metadata objects).
   *
   * Returns complete metadata for all datasets in the catalog.
   * For just identifiers, use the CKAN-compatible listDatasets() method.
   *
   * @returns Array of complete dataset metadata objects
   * @throws {DkanApiError} If request fails
   */
  async listAllDatasets() {
    return this.apiClient.listAllDatasets()
  }

  /**
   * List available metastore schemas.
   *
   * Returns schema types available in the metastore.
   * Common schemas: 'dataset', 'data-dictionary', 'distribution'.
   *
   * @returns Array of schema type identifiers
   * @throws {DkanApiError} If request fails
   */
  async listSchemas() {
    return this.apiClient.listSchemas()
  }

  /**
   * Get items for a specific schema type.
   *
   * Retrieves all items of a given schema type from the metastore.
   *
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @returns Array of items matching the schema type
   * @throws {DkanApiError} If schema not found or request fails
   */
  async getSchemaItems(schemaId: string) {
    return this.apiClient.getSchemaItems(schemaId)
  }

  /**
   * Get dataset facets (themes, keywords, publishers).
   *
   * Retrieves all unique values for faceted search across all datasets.
   * Useful for building filter UIs.
   *
   * @returns Object containing arrays of unique theme, keyword, and publisher values
   * @throws {DkanApiError} If request fails
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
   * List all harvest plan identifiers.
   *
   * Returns an array of identifiers for all registered harvest plans.
   * Harvest plans define how to fetch datasets from external sources.
   *
   * @returns Array of harvest plan identifiers
   * @throws {DkanApiError} If request fails
   */
  async listHarvestPlans() {
    return this.apiClient.listHarvestPlans()
  }

  /**
   * Register a new harvest plan.
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
  async registerHarvestPlan(plan: Parameters<typeof DkanApiClient.prototype.registerHarvestPlan>[0]) {
    return this.apiClient.registerHarvestPlan(plan)
  }

  /**
   * Get a specific harvest plan.
   *
   * Retrieves the configuration for a registered harvest plan.
   *
   * @param planId - Harvest plan identifier
   * @returns Harvest plan configuration with source and extract settings
   * @throws {DkanApiError} If harvest plan not found or request fails
   */
  async getHarvestPlan(planId: string) {
    return this.apiClient.getHarvestPlan(planId)
  }

  /**
   * List harvest runs for a specific plan.
   *
   * Returns all harvest run records for a given plan, including status,
   * counts of created/updated/orphaned datasets, and timestamps.
   *
   * @param planId - Harvest plan identifier
   * @returns Array of harvest run records with status and statistics
   * @throws {DkanApiError} If harvest plan not found or request fails
   */
  async listHarvestRuns(planId: string) {
    return this.apiClient.listHarvestRuns(planId)
  }

  /**
   * Get information about a specific harvest run.
   *
   * Retrieves detailed information about a single harvest run execution,
   * including status, counts, error messages, and timestamps.
   *
   * @param runId - Harvest run identifier
   * @returns Harvest run details with execution status and statistics
   * @throws {DkanApiError} If harvest run not found or request fails
   */
  async getHarvestRun(runId: string) {
    return this.apiClient.getHarvestRun(runId)
  }

  /**
   * Execute a harvest run.
   *
   * Triggers a harvest operation for a specific plan. The harvest fetches
   * datasets from the configured source and imports them into DKAN.
   *
   * Requires authentication with harvest run permissions.
   *
   * @param options - Harvest run options with plan ID and optional filters
   * @returns Harvest run record with initial status
   * @throws {DkanApiError} If authentication fails, harvest plan not found, or request fails
   */
  async runHarvest(options: Parameters<typeof DkanApiClient.prototype.runHarvest>[0]) {
    return this.apiClient.runHarvest(options)
  }

  // ==================== DATASET CRUD ====================

  /**
   * Create a new dataset.
   *
   * Creates a new dataset in the metastore with DCAT-US metadata.
   * The dataset must include at least a title and identifier.
   *
   * Requires authentication with dataset create permissions.
   *
   * @param dataset - Complete dataset metadata (DCAT-US format)
   * @returns Write response containing the dataset identifier and endpoint
   * @throws {DkanApiError} If authentication fails, validation fails, or request fails
   */
  async createDataset(dataset: Parameters<typeof DkanApiClient.prototype.createDataset>[0]) {
    return this.apiClient.createDataset(dataset)
  }

  /**
   * Update an existing dataset (full replacement).
   *
   * Replaces an entire dataset with new metadata. All fields must be provided.
   * Use patchDataset() for partial updates.
   *
   * Requires authentication with dataset update permissions.
   *
   * @param identifier - Dataset identifier (UUID or custom ID)
   * @param dataset - Complete replacement dataset metadata
   * @returns Write response containing the updated identifier
   * @throws {DkanApiError} If dataset not found, authentication fails, or validation fails
   */
  async updateDataset(identifier: string, dataset: Parameters<typeof DkanApiClient.prototype.updateDataset>[1]) {
    return this.apiClient.updateDataset(identifier, dataset)
  }

  /**
   * Partially update a dataset.
   *
   * Updates only specified fields of a dataset, leaving other fields unchanged.
   * Use this for targeted updates instead of full replacement.
   *
   * Requires authentication with dataset update permissions.
   *
   * @param identifier - Dataset identifier (UUID or custom ID)
   * @param partialDataset - Partial dataset metadata with only fields to update
   * @returns Write response containing the updated identifier
   * @throws {DkanApiError} If dataset not found, authentication fails, or validation fails
   */
  async patchDataset(identifier: string, partialDataset: Parameters<typeof DkanApiClient.prototype.patchDataset>[1]) {
    return this.apiClient.patchDataset(identifier, partialDataset)
  }

  /**
   * Delete a dataset.
   *
   * Permanently removes a dataset and its associated data from the system.
   *
   * Requires authentication with dataset delete permissions.
   *
   * @param identifier - Dataset identifier (UUID or custom ID)
   * @returns Confirmation message
   * @throws {DkanApiError} If dataset not found, authentication fails, or request fails
   */
  async deleteDataset(identifier: string) {
    return this.apiClient.deleteDataset(identifier)
  }

  // ==================== DATASTORE IMPORTS ====================

  /**
   * List all datastore imports.
   *
   * Returns import status for all distributions that have been imported
   * into the datastore. Includes import state, timestamps, and statistics.
   *
   * @returns Object mapping distribution identifiers to import records
   * @throws {DkanApiError} If request fails
   */
  async listDatastoreImports() {
    return this.apiClient.listDatastoreImports()
  }

  /**
   * Trigger a datastore import.
   *
   * Initiates import of a distribution's data into the datastore.
   * The data is downloaded from the distribution's downloadURL and
   * loaded into a queryable database table.
   *
   * Requires authentication with datastore import permissions.
   *
   * @param options - Import options with resource identifier
   * @returns Import record with initial status
   * @throws {DkanApiError} If authentication fails, resource not found, or request fails
   */
  async triggerDatastoreImport(options: Parameters<typeof DkanApiClient.prototype.triggerDatastoreImport>[0]) {
    return this.apiClient.triggerDatastoreImport(options)
  }

  /**
   * Delete a datastore (resource or all resources for a dataset).
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
  async deleteDatastore(identifier: string) {
    return this.apiClient.deleteDatastore(identifier)
  }

  // ==================== REVISIONS / MODERATION ====================

  /**
   * Get all revisions for an item in a schema.
   *
   * Returns the revision history for a specific item, showing all
   * workflow state changes and modifications over time.
   *
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param identifier - Item identifier (UUID or custom ID)
   * @returns Array of revision records with timestamps and state information
   * @throws {DkanApiError} If item not found or request fails
   */
  async getRevisions(schemaId: string, identifier: string) {
    return this.apiClient.getRevisions(schemaId, identifier)
  }

  /**
   * Get a specific revision.
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
  async getRevision(schemaId: string, identifier: string, revisionId: string) {
    return this.apiClient.getRevision(schemaId, identifier, revisionId)
  }

  /**
   * Create a new revision (change workflow state).
   *
   * Creates a new revision by changing the workflow state of an item.
   * Common states: 'draft', 'published', 'archived'.
   *
   * Requires authentication with moderation permissions.
   *
   * @param schemaId - Schema identifier (e.g., 'dataset', 'data-dictionary')
   * @param identifier - Item identifier (UUID or custom ID)
   * @param revision - Revision data with new state and optional message
   * @returns Write response containing the revision identifier
   * @throws {DkanApiError} If authentication fails, item not found, or request fails
   */
  async createRevision(
    schemaId: string,
    identifier: string,
    revision: Parameters<typeof DkanApiClient.prototype.createRevision>[2]
  ) {
    return this.apiClient.createRevision(schemaId, identifier, revision)
  }

  /**
   * Convenience method to change dataset workflow state.
   *
   * Shortcut for creating a revision to change a dataset's workflow state.
   *
   * Requires authentication with moderation permissions.
   *
   * @param identifier - Dataset identifier (UUID or custom ID)
   * @param state - New workflow state ('draft', 'published', 'archived')
   * @param message - Optional message describing the state change
   * @returns Write response containing the revision identifier
   * @throws {DkanApiError} If authentication fails, dataset not found, or request fails
   */
  async changeDatasetState(identifier: string, state: Parameters<typeof DkanApiClient.prototype.changeDatasetState>[1], message?: string) {
    return this.apiClient.changeDatasetState(identifier, state, message)
  }

  // ==================== QUERY DOWNLOAD ====================

  /**
   * Download datastore query results as CSV or JSON.
   *
   * Executes a datastore query and returns the results as a downloadable file.
   * Supports filtering, sorting, and pagination like queryDatastore().
   *
   * @param datasetId - Dataset identifier (UUID or custom ID)
   * @param index - Resource index in dataset.distribution array
   * @param options - Query and download options
   * @returns Blob containing the file data for download
   * @throws {DkanApiError} If resource not found or request fails
   */
  async downloadQuery(
    datasetId: string,
    index: number,
    options?: Parameters<typeof DkanApiClient.prototype.downloadQuery>[2]
  ) {
    return this.apiClient.downloadQuery(datasetId, index, options)
  }

  /**
   * Download datastore query results by distribution ID.
   *
   * Similar to downloadQuery() but uses distribution identifier directly
   * instead of dataset ID and index.
   *
   * @param distributionId - Distribution identifier (UUID)
   * @param options - Query and download options
   * @returns Blob containing the file data for download
   * @throws {DkanApiError} If distribution not found or request fails
   */
  async downloadQueryByDistribution(
    distributionId: string,
    options?: Parameters<typeof DkanApiClient.prototype.downloadQueryByDistribution>[1]
  ) {
    return this.apiClient.downloadQueryByDistribution(distributionId, options)
  }

  // ==================== SQL QUERY ====================

  /**
   * Execute a SQL query against the datastore.
   *
   * Runs a SQL SELECT statement against datastore tables. Supports JOINs,
   * WHERE clauses, ORDER BY, and LIMIT. Table names use distribution identifiers.
   *
   * **Note**: This is an advanced feature requiring knowledge of the datastore schema.
   *
   * @param options - SQL query options
   * @returns Query results including schema and result rows
   * @throws {DkanApiError} If SQL is invalid or request fails
   */
  async querySql(options: Parameters<typeof DkanApiClient.prototype.querySql>[0]) {
    return this.apiClient.querySql(options)
  }

  // ==================== DATA DICTIONARY CRUD ====================

  /**
   * Create a new data dictionary.
   *
   * Creates a new data dictionary in the metastore following the
   * Frictionless Table Schema specification.
   *
   * Requires authentication with data dictionary create permissions.
   *
   * @param dictionary - Data dictionary object with fields and schema
   * @returns Write response containing the dictionary identifier and endpoint
   * @throws {DkanApiError} If authentication fails, validation fails, or request fails
   */
  async createDataDictionary(dictionary: Parameters<typeof DkanApiClient.prototype.createDataDictionary>[0]) {
    return this.apiClient.createDataDictionary(dictionary)
  }

  /**
   * Update an existing data dictionary.
   *
   * Replaces an entire data dictionary with new field definitions.
   *
   * Requires authentication with data dictionary update permissions.
   *
   * @param identifier - Data dictionary identifier (UUID or custom ID)
   * @param dictionary - Complete replacement data dictionary object
   * @returns Write response containing the updated identifier
   * @throws {DkanApiError} If data dictionary not found, authentication fails, or validation fails
   */
  async updateDataDictionary(identifier: string, dictionary: Parameters<typeof DkanApiClient.prototype.updateDataDictionary>[1]) {
    return this.apiClient.updateDataDictionary(identifier, dictionary)
  }

  /**
   * Delete a data dictionary.
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
  async deleteDataDictionary(identifier: string) {
    return this.apiClient.deleteDataDictionary(identifier)
  }

  // ==================== OPENAPI DOCUMENTATION ====================

  /**
   * Get OpenAPI documentation UI URL.
   *
   * Returns the URL to the interactive Swagger UI documentation for the DKAN API.
   *
   * @returns URL to the OpenAPI documentation interface
   */
  getOpenApiDocsUrl() {
    return this.apiClient.getOpenApiDocsUrl()
  }

}
