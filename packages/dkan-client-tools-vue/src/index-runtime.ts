/**
 * @dkan-client-tools/vue - Runtime-Only Build
 * Vue composables and plugin for DKAN client tools
 * Built on TanStack Vue Query
 *
 * This build uses the runtime-only version of Vue (WITHOUT template compiler)
 * Templates must be pre-compiled using .vue SFC files or render functions
 * Bundle size: ~180KB minified (28% smaller than full build)
 */

// Re-export Vue runtime-only build (WITHOUT compiler)
import * as VueNamespace from 'vue'
export { VueNamespace as Vue }

// Re-export QueryClient and VueQueryPlugin for IIFE builds
export { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
export { DkanClient } from '@dkan-client-tools/core'

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

export { useAllDatasets } from './useMetastore'

export { useSchemas, useSchemaItems, useDatasetFacets } from './useMetastore'
export type { UseSchemasOptions, UseSchemaItemsOptions, UseFacetsOptions } from './useMetastore'

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

export {
  useCreateDataset,
  useUpdateDataset,
  usePatchDataset,
  useDeleteDataset,
} from './useDatasetMutations'

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

export {
  useDownloadQuery,
  useDownloadQueryByDistribution,
} from './useQueryDownload'
export type {
  DownloadQueryOptions,
  DownloadQueryByDistributionOptions,
} from './useQueryDownload'

export {
  useSqlQuery,
  useExecuteSqlQuery,
} from './useSqlQuery'
export type {
  UseSqlQueryOptions,
} from './useSqlQuery'

export {
  useCreateDataDictionary,
  useUpdateDataDictionary,
  useDeleteDataDictionary,
} from './useDataDictionaryMutations'

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

// Re-export commonly used Vue Query hooks
export { useQuery, useMutation, useQueryClient, useIsFetching, useIsMutating } from '@tanstack/vue-query'
