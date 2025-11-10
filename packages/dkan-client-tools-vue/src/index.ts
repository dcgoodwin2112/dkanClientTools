/**
 * @dkan-client-tools/vue
 * Vue composables and plugin for DKAN client tools
 * Built on TanStack Vue Query
 */

// Plugin and context
export { DkanClientPlugin, useDkanClient } from './plugin'
export type { DkanClientPluginOptions } from './plugin'

// DKAN-specific composables
export { useDataset } from './useDataset'
export type { UseDatasetOptions } from './useDataset'

export { useDatasetSearch } from './useDatasetSearch'
export type { UseDatasetSearchOptions } from './useDatasetSearch'

export { useDatastore } from './useDatastore'
export type { UseDatastoreOptions } from './useDatastore'

export {
  useDataDictionary,
  useDataDictionaryList,
  useDataDictionaryFromUrl,
  useDatastoreSchema,
} from './useDataDictionary'
export type {
  UseDataDictionaryOptions,
  UseDataDictionaryListOptions,
} from './useDataDictionary'

export {
  useAllDatasets,
  useSchemas,
  useSchemaItems,
  useDatasetFacets,
} from './useMetastore'
export type {
  UseAllDatasetsOptions,
  UseSchemasOptions,
  UseSchemaItemsOptions,
  UseFacetsOptions,
} from './useMetastore'

// Harvest API composables
export {
  useHarvestPlans,
  useHarvestPlan,
  useHarvestRuns,
  useHarvestRun,
  useRegisterHarvestPlan,
  useRunHarvest,
} from './useHarvest'
export type {
  UseHarvestPlansOptions,
  UseHarvestPlanOptions,
  UseHarvestRunsOptions,
  UseHarvestRunOptions,
} from './useHarvest'

// Dataset CRUD composables
export {
  useCreateDataset,
  useUpdateDataset,
  usePatchDataset,
  useDeleteDataset,
} from './useDatasetMutations'
export type {
  UpdateDatasetOptions,
  PatchDatasetOptions,
} from './useDatasetMutations'

// Datastore Import composables
export {
  useDatastoreImports,
  useDatastoreImport,
  useDatastoreStatistics,
  useTriggerDatastoreImport,
  useDeleteDatastore,
} from './useDatastoreImports'
export type {
  UseDatastoreImportsOptions,
  UseDatastoreImportOptions,
  UseDatastoreStatisticsOptions,
} from './useDatastoreImports'

// Revision/Moderation composables
export {
  useRevisions,
  useRevision,
  useCreateRevision,
  useChangeDatasetState,
} from './useRevisions'
export type {
  UseRevisionsOptions,
  UseRevisionOptions,
  CreateRevisionOptions,
  ChangeDatasetStateOptions,
} from './useRevisions'

// Query Download composables
export {
  useDownloadQuery,
  useDownloadQueryByDistribution,
} from './useQueryDownload'
export type {
  DownloadQueryOptions,
  DownloadQueryByDistributionOptions,
} from './useQueryDownload'

// SQL Query composables
export {
  useSqlQuery,
  useExecuteSqlQuery,
} from './useSqlQuery'
export type {
  UseSqlQueryOptions,
} from './useSqlQuery'

// Data Dictionary CRUD composables
export {
  useCreateDataDictionary,
  useUpdateDataDictionary,
  useDeleteDataDictionary,
} from './useDataDictionaryMutations'

// Dataset Properties composables
export {
  useDatasetProperties,
  usePropertyValues,
  useAllPropertiesWithValues,
} from './useDatasetProperties'
export type {
  UseDatasetPropertiesOptions,
  UsePropertyValuesOptions,
  UseAllPropertiesWithValuesOptions,
} from './useDatasetProperties'

// CKAN API Compatibility composables
export {
  useCkanPackageSearch,
  useCkanDatastoreSearch,
  useCkanDatastoreSearchSql,
  useCkanResourceShow,
  useCkanCurrentPackageListWithResources,
} from './useCkanApi'
export type {
  UseCkanPackageSearchOptions,
  UseCkanDatastoreSearchOptions,
  UseCkanDatastoreSearchSqlOptions,
  UseCkanResourceShowOptions,
  UseCkanPackageListOptions,
} from './useCkanApi'

// Re-export core types and client for convenience
export type {
  DkanClient,
  DkanClientOptions,
  DkanDataset,
  DkanSearchResponse,
  DkanDatastoreQueryResponse,
  DatasetQueryOptions,
  DatastoreQueryOptions,
  DataDictionary,
  DataDictionaryData,
  DataDictionaryField,
  DataDictionaryFieldType,
  DataDictionaryConstraints,
  DataDictionaryIndex,
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
  DatasetProperty,
  DatasetPropertyValue,
  CkanPackageSearchResponse,
  CkanPackageSearchOptions,
  CkanDatastoreSearchResponse,
  CkanDatastoreSearchOptions,
  CkanDatastoreSearchSqlOptions,
  CkanResource,
  CkanPackageWithResources,
} from '@dkan-client-tools/core'

// Re-export TanStack Vue Query for advanced usage
export {
  useQuery,
  useMutation,
  useQueryClient,
  useIsFetching,
  useIsMutating,
} from '@tanstack/vue-query'
