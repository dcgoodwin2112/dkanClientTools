/**
 * @dkan-client-tools/core
 * Framework-agnostic core for DKAN client tools
 * Built on TanStack Query
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
} from './types'

export { DkanApiError } from './types'
