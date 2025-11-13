/**
 * @dkan-client-tools/core - Framework-agnostic DKAN Client Tools
 *
 * Core library for building data catalog applications with DKAN.
 * Built on TanStack Query for robust caching and state management.
 *
 * **Features**:
 * - Framework-agnostic - works with any JavaScript framework
 * - Full DKAN REST API support (33 methods across 6 categories)
 * - Type-safe with complete DCAT-US schema types
 * - Built on TanStack Query for proven caching patterns
 * - Lightweight - only depends on @tanstack/query-core
 *
 * **API Coverage**:
 * - Dataset operations: CRUD, search, list
 * - Datastore operations: query, SQL, download, imports
 * - Data dictionary: CRUD with Frictionless schema support
 * - Harvest operations: plans, runs, registration
 * - Metastore: schemas, facets, revisions
 * - Moderation: workflow states, revision history
 *
 * **Architecture**:
 * - {@link DkanClient} - Main client wrapping QueryClient
 * - {@link DkanApiClient} - HTTP client for REST API calls
 * - Framework adapters provide React hooks and Vue composables
 *
 * @packageDocumentation
 *
 * @example
 * Basic setup:
 * ```typescript
 * import { DkanClient, QueryClient } from '@dkan-client-tools/core'
 *
 * const dkanClient = new DkanClient({
 *   baseUrl: 'https://demo.getdkan.org',
 *   queryClient: new QueryClient()
 * })
 *
 * // Fetch a dataset
 * const dataset = await dkanClient.fetchDataset('abc-123')
 * ```
 *
 * @see {@link DkanClient} for the main client API
 * @see https://github.com/anthropics/dkan-client-tools
 */

// Main client
export { DkanClient } from './client/dkanClient'
export type { DkanClientOptions } from './client/dkanClient'

// API client
export { DkanApiClient } from './api/client'

// Re-export TanStack Query core
export { QueryClient } from '@tanstack/query-core'
export type {
  QueryKey,
  QueryFunction,
  QueryOptions,
} from '@tanstack/query-core'

// Types
export type {
  DkanDataset,
  Publisher,
  ContactPoint,
  Distribution,
  DistributionData,
  DkanApiResponse,
  DkanSearchResponse,
  DkanDatastoreQueryResponse,
  DatastoreSchema,
  DatastoreField,
  DatasetQueryOptions,
  DatastoreQueryOptions,
  DatastoreCondition,
  DatastoreSort,
  DatastoreJoin,
  DatastoreExpression,
  DkanClientConfig,
  DkanAuth,
  DkanDefaultOptions,
  DatasetKey,
  DataDictionary,
  DataDictionaryData,
  DataDictionaryField,
  DataDictionaryFieldType,
  DataDictionaryConstraints,
  DataDictionaryIndex,
  DataDictionaryListResponse,
  HarvestPlan,
  HarvestRun,
  HarvestRunOptions,
  DatastoreImport,
  DatastoreImportOptions,
  MetastoreWriteResponse,
  MetastoreRevision,
  MetastoreNewRevision,
  WorkflowState,
  QueryDownloadOptions,
  SqlQueryOptions,
  SqlQueryResult,
} from './types'

export { DkanApiError } from './types'
