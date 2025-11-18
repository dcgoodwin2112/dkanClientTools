/**
 * Core types for TanStack Table integration
 * Framework-agnostic table configuration and column definition types
 */

import type {
  DkanDataset,
  DatastoreField,
  HarvestPlan,
  HarvestRun,
  DatastoreImport,
  DataDictionaryField,
} from './types'

/**
 * Column definition helper types for common DKAN data structures
 */

/** Column configuration for dataset tables */
export interface DatasetColumnConfig {
  /** Include dataset identifier column */
  showIdentifier?: boolean
  /** Include title column */
  showTitle?: boolean
  /** Include description column */
  showDescription?: boolean
  /** Include publisher column */
  showPublisher?: boolean
  /** Include modified date column */
  showModified?: boolean
  /** Include keywords column */
  showKeywords?: boolean
  /** Include theme column */
  showTheme?: boolean
  /** Include access level column */
  showAccessLevel?: boolean
  /** Include distribution count column */
  showDistributionCount?: boolean
  /** Custom columns to append */
  customColumns?: any[]
}

/** Column configuration for datastore query result tables */
export interface DatastoreColumnConfig {
  /** Datastore schema fields to generate columns from */
  fields?: DatastoreField[]
  /** Field names to include (if not specified, includes all) */
  includeFields?: string[]
  /** Field names to exclude */
  excludeFields?: string[]
  /** Custom column formatters by field name */
  formatters?: Record<string, (value: any) => any>
  /** Custom columns to append */
  customColumns?: any[]
}

/** Column configuration for harvest plan tables */
export interface HarvestPlanColumnConfig {
  /** Include plan ID column */
  showId?: boolean
  /** Include plan label column */
  showLabel?: boolean
  /** Include extract type column */
  showExtract?: boolean
  /** Include transforms column */
  showTransforms?: boolean
  /** Include load type column */
  showLoad?: boolean
  /** Custom columns to append */
  customColumns?: any[]
}

/** Column configuration for harvest run tables */
export interface HarvestRunColumnConfig {
  /** Include run ID column */
  showId?: boolean
  /** Include plan ID column */
  showPlanId?: boolean
  /** Include status column */
  showStatus?: boolean
  /** Include extract status column */
  showExtractStatus?: boolean
  /** Include load status column */
  showLoadStatus?: boolean
  /** Include timestamp columns */
  showTimestamps?: boolean
  /** Custom columns to append */
  customColumns?: any[]
}

/** Column configuration for datastore import tables */
export interface DatastoreImportColumnConfig {
  /** Include dataset identifier column */
  showIdentifier?: boolean
  /** Include file path column */
  showFilePath?: boolean
  /** Include status column */
  showStatus?: boolean
  /** Include message column */
  showMessage?: boolean
  /** Include timestamp column */
  showTimestamp?: boolean
  /** Custom columns to append */
  customColumns?: any[]
}

/** Column configuration for data dictionary field tables */
export interface DataDictionaryFieldColumnConfig {
  /** Include field name column */
  showName?: boolean
  /** Include title column */
  showTitle?: boolean
  /** Include type column */
  showType?: boolean
  /** Include format column */
  showFormat?: boolean
  /** Include description column */
  showDescription?: boolean
  /** Include constraints column */
  showConstraints?: boolean
  /** Custom columns to append */
  customColumns?: any[]
}

/**
 * Table state configuration
 */

/** Pagination configuration */
export interface TablePaginationConfig {
  /** Page index (0-based) */
  pageIndex?: number
  /** Page size */
  pageSize?: number
}

/** Sorting configuration */
export interface TableSortingConfig {
  /** Column ID to sort by */
  id: string
  /** Sort direction */
  desc: boolean
}

/** Filtering configuration */
export interface TableFilterConfig {
  /** Column ID to filter */
  id: string
  /** Filter value */
  value: any
}

/**
 * Common table data types
 */

/** Dataset table row type */
export type DatasetTableRow = DkanDataset

/** Datastore table row type */
export type DatastoreTableRow = Record<string, any>

/** Harvest plan table row type */
export type HarvestPlanTableRow = HarvestPlan

/** Harvest run table row type */
export type HarvestRunTableRow = HarvestRun

/** Datastore import table row type */
export type DatastoreImportTableRow = DatastoreImport

/** Data dictionary field table row type */
export type DataDictionaryFieldTableRow = DataDictionaryField
