/**
 * @dkan-client-tools/vue
 * Vue composables and plugin for DKAN client tools
 * Built on TanStack Vue Query
 */

// Re-export Vue for IIFE builds (with compiler for template compilation)
// @ts-ignore - Using full build with compiler for template string support
import * as VueNamespace from 'vue/dist/vue.esm-bundler.js'
export { VueNamespace as Vue }

// Re-export QueryClient and VueQueryPlugin for IIFE builds
export { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
export { DkanClient as DkanClientClass } from '@dkan-client-tools/core'

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
  useTriggerDatastoreImport,
  useDeleteDatastore,
} from './useDatastoreImports'
export type {
  UseDatastoreImportsOptions,
  UseDatastoreImportOptions,
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
  MetastoreWriteResponse,
  MetastoreRevision,
  MetastoreNewRevision,
  WorkflowState,
} from '@dkan-client-tools/core'

// Re-export TanStack Vue Query for advanced usage
export {
  useQuery,
  useMutation,
  useQueryClient,
  useIsFetching,
  useIsMutating,
} from '@tanstack/vue-query'
