/**
 * @dkan-client-tools/react
 * React hooks and components for DKAN client tools
 * Built on TanStack React Query
 */

// Re-export React and ReactDOM for IIFE builds
import * as ReactNamespace from 'react'
import * as ReactDOMNamespace from 'react-dom'
export { ReactNamespace as React, ReactDOMNamespace as ReactDOM }

// Re-export QueryClient and DkanClient for IIFE builds
export { QueryClient } from '@tanstack/react-query'
export { DkanClient } from '@dkan-client-tools/core'

// Provider and context
export { DkanClientProvider, useDkanClient } from './DkanClientProvider'
export type { DkanClientProviderProps } from './DkanClientProvider'

// DKAN-specific hooks
export { useDataset } from './useDataset'
export type { UseDatasetOptions } from './useDataset'

export { useDatasetSearch } from './useDatasetSearch'
export type { UseDatasetSearchOptions } from './useDatasetSearch'

export { useDatastore, useQueryDatastoreMulti } from './useDatastore'
export type { UseDatastoreOptions, UseQueryDatastoreMultiOptions } from './useDatastore'

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
  useSchema,
  useSchemaItems,
  useDatasetFacets,
} from './useMetastore'
export type {
  UseAllDatasetsOptions,
  UseSchemasOptions,
  UseSchemaOptions,
  UseSchemaItemsOptions,
  UseFacetsOptions,
} from './useMetastore'

// Harvest API hooks
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

// Dataset CRUD hooks
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

// Datastore Import hooks
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
} from './useDatastoreImports'

// Revision/Moderation hooks
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

// Query Download hooks
export {
  useDownloadQuery,
  useDownloadQueryByDistribution,
} from './useQueryDownload'
export type {
  DownloadQueryOptions,
  DownloadQueryByDistributionOptions,
} from './useQueryDownload'

// SQL Query hooks
export {
  useSqlQuery,
  useExecuteSqlQuery,
} from './useSqlQuery'
export type {
  UseSqlQueryOptions,
} from './useSqlQuery'

// Data Dictionary CRUD hooks
export {
  useCreateDataDictionary,
  useUpdateDataDictionary,
  useDeleteDataDictionary,
} from './useDataDictionaryMutations'


// Re-export core types for convenience
export type {
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

// Re-export TanStack React Query for advanced usage
export {
  useQuery,
  useMutation,
  useQueryClient,
  useIsFetching,
  useIsMutating,
} from '@tanstack/react-query'
