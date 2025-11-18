/**
 * Column definition utilities for TanStack Table
 * Provides default column configurations for common DKAN data structures
 */

import { createColumnHelper } from '@tanstack/react-table'
import type {
  DkanDataset,
  DatastoreField,
  HarvestPlan,
  HarvestRun,
  DatastoreImport,
  DataDictionaryField,
  DatasetColumnConfig,
  DatastoreColumnConfig,
  HarvestPlanColumnConfig,
  HarvestRunColumnConfig,
  DatastoreImportColumnConfig,
  DataDictionaryFieldColumnConfig,
} from '@dkan-client-tools/core'

/**
 * Creates column definitions for dataset tables
 *
 * @example
 * ```tsx
 * const columns = createDatasetColumns({
 *   showIdentifier: false,
 *   showDescription: true,
 * })
 * ```
 */
export function createDatasetColumns(config: DatasetColumnConfig = {}) {
  const columnHelper = createColumnHelper<DkanDataset>()

  const columns = []

  if (config.showIdentifier !== false) {
    columns.push(
      columnHelper.accessor('identifier', {
        header: 'ID',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showTitle !== false) {
    columns.push(
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showDescription) {
    columns.push(
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => {
          const desc = info.getValue()
          return desc?.length > 100 ? `${desc.substring(0, 100)}...` : desc
        },
      })
    )
  }

  if (config.showPublisher !== false) {
    columns.push(
      columnHelper.accessor('publisher.name', {
        header: 'Publisher',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showModified !== false) {
    columns.push(
      columnHelper.accessor('modified', {
        header: 'Modified',
        cell: (info) => {
          const date = info.getValue()
          return date ? new Date(date).toLocaleDateString() : ''
        },
      })
    )
  }

  if (config.showKeywords) {
    columns.push(
      columnHelper.accessor('keyword', {
        header: 'Keywords',
        cell: (info) => info.getValue()?.join(', ') || '',
      })
    )
  }

  if (config.showTheme) {
    columns.push(
      columnHelper.accessor('theme', {
        header: 'Theme',
        cell: (info) => info.getValue()?.join(', ') || '',
      })
    )
  }

  if (config.showAccessLevel) {
    columns.push(
      columnHelper.accessor('accessLevel', {
        header: 'Access',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showDistributionCount) {
    columns.push(
      columnHelper.accessor('distribution', {
        header: 'Distributions',
        cell: (info) => info.getValue()?.length || 0,
      })
    )
  }

  if (config.customColumns) {
    columns.push(...config.customColumns)
  }

  return columns
}

/**
 * Creates column definitions for datastore query result tables
 * Generates columns dynamically from datastore schema fields
 *
 * @example
 * ```tsx
 * const columns = createDatastoreColumns({
 *   fields: datastoreSchema.fields,
 *   excludeFields: ['record_number'],
 * })
 * ```
 */
export function createDatastoreColumns(config: DatastoreColumnConfig = {}) {
  const columnHelper = createColumnHelper<Record<string, any>>()

  const { fields = [], includeFields, excludeFields, formatters = {}, customColumns } = config

  const columns = []

  for (const field of fields) {
    const { name, type } = field

    // Check include/exclude filters
    if (includeFields && !includeFields.includes(name)) continue
    if (excludeFields?.includes(name)) continue

    const formatter = formatters[name]

    columns.push(
      columnHelper.accessor(name, {
        header: field.name,
        cell: (info) => {
          const value = info.getValue()
          if (formatter) return formatter(value)

          // Default formatting by type
          if (type === 'date' && value) {
            return new Date(value).toLocaleDateString()
          }
          if (type === 'number' || type === 'integer') {
            return value?.toLocaleString()
          }
          return value
        },
      })
    )
  }

  if (customColumns) {
    columns.push(...customColumns)
  }

  return columns
}

/**
 * Creates column definitions for harvest plan tables
 *
 * @example
 * ```tsx
 * const columns = createHarvestPlanColumns()
 * ```
 */
export function createHarvestPlanColumns(config: HarvestPlanColumnConfig = {}) {
  const columnHelper = createColumnHelper<HarvestPlan>()

  const columns = []

  if (config.showId !== false) {
    columns.push(
      columnHelper.accessor('identifier', {
        header: 'ID',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showLabel !== false) {
    columns.push(
      columnHelper.accessor('label', {
        header: 'Label',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showExtract !== false) {
    columns.push(
      columnHelper.accessor('extract', {
        header: 'Extract',
        cell: (info) => info.getValue()?.type || '',
      })
    )
  }

  if (config.showTransforms) {
    columns.push(
      columnHelper.accessor('transforms', {
        header: 'Transforms',
        cell: (info) => info.getValue()?.length || 0,
      })
    )
  }

  if (config.showLoad) {
    columns.push(
      columnHelper.accessor('load', {
        header: 'Load',
        cell: (info) => info.getValue()?.type || '',
      })
    )
  }

  if (config.customColumns) {
    columns.push(...config.customColumns)
  }

  return columns
}

/**
 * Creates column definitions for harvest run tables
 *
 * @example
 * ```tsx
 * const columns = createHarvestRunColumns({
 *   showTimestamps: true,
 * })
 * ```
 */
export function createHarvestRunColumns(config: HarvestRunColumnConfig = {}) {
  const columnHelper = createColumnHelper<HarvestRun>()

  const columns = []

  if (config.showId !== false) {
    columns.push(
      columnHelper.accessor('identifier', {
        header: 'Run ID',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showPlanId) {
    columns.push(
      columnHelper.accessor('plan_id', {
        header: 'Plan ID',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showStatus !== false) {
    columns.push(
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => info.getValue() || '',
      })
    )
  }

  if (config.showExtractStatus) {
    columns.push(
      columnHelper.accessor('extract_status', {
        header: 'Extract Status',
        cell: (info) => {
          const status = info.getValue()
          return status?.extracted_items_ids?.length || 0
        },
      })
    )
  }

  if (config.showLoadStatus) {
    columns.push(
      columnHelper.accessor('load_status', {
        header: 'Load Status',
        cell: (info) => {
          const status = info.getValue()
          if (!status) return ''
          const parts = []
          if (status.created) parts.push(`Created: ${status.created}`)
          if (status.updated) parts.push(`Updated: ${status.updated}`)
          if (status.errors?.length) parts.push(`Errors: ${status.errors.length}`)
          return parts.join(', ')
        },
      })
    )
  }

  if (config.showTimestamps) {
    columns.push(
      columnHelper.display({
        header: 'Timestamp',
        cell: (info) => {
          const row = info.row.original
          // Try to extract timestamp from status or other fields
          const timestamp = (row as any).timestamp || (row as any).extract_timestamp
          return timestamp ? new Date(timestamp).toLocaleString() : ''
        },
      })
    )
  }

  if (config.customColumns) {
    columns.push(...config.customColumns)
  }

  return columns
}

/**
 * Creates column definitions for datastore import tables
 *
 * @example
 * ```tsx
 * const columns = createDatastoreImportColumns()
 * ```
 */
export function createDatastoreImportColumns(config: DatastoreImportColumnConfig = {}) {
  const columnHelper = createColumnHelper<DatastoreImport>()

  const columns = []

  if (config.showIdentifier !== false) {
    columns.push(
      columnHelper.accessor('identifier', {
        header: 'Dataset ID',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showFilePath) {
    columns.push(
      columnHelper.accessor('file_path', {
        header: 'File Path',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showStatus !== false) {
    columns.push(
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showMessage) {
    columns.push(
      columnHelper.accessor('message', {
        header: 'Message',
        cell: (info) => {
          const msg = info.getValue()
          return msg?.length > 50 ? `${msg.substring(0, 50)}...` : msg
        },
      })
    )
  }

  if (config.showTimestamp) {
    columns.push(
      columnHelper.display({
        header: 'Timestamp',
        cell: (info) => {
          const row = info.row.original
          const timestamp = (row as any).timestamp || (row as any).created
          return timestamp ? new Date(timestamp).toLocaleString() : ''
        },
      })
    )
  }

  if (config.customColumns) {
    columns.push(...config.customColumns)
  }

  return columns
}

/**
 * Creates column definitions for data dictionary field tables
 *
 * @example
 * ```tsx
 * const columns = createDataDictionaryFieldColumns({
 *   showConstraints: true,
 * })
 * ```
 */
export function createDataDictionaryFieldColumns(config: DataDictionaryFieldColumnConfig = {}) {
  const columnHelper = createColumnHelper<DataDictionaryField>()

  const columns = []

  if (config.showName !== false) {
    columns.push(
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showTitle !== false) {
    columns.push(
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => info.getValue() || '',
      })
    )
  }

  if (config.showType !== false) {
    columns.push(
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => info.getValue(),
      })
    )
  }

  if (config.showFormat) {
    columns.push(
      columnHelper.accessor('format', {
        header: 'Format',
        cell: (info) => info.getValue() || '',
      })
    )
  }

  if (config.showDescription !== false) {
    columns.push(
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => {
          const desc = info.getValue()
          if (!desc) return ''
          return desc.length > 80 ? `${desc.substring(0, 80)}...` : desc
        },
      })
    )
  }

  if (config.showConstraints) {
    columns.push(
      columnHelper.accessor('constraints', {
        header: 'Constraints',
        cell: (info) => {
          const constraints = info.getValue()
          if (!constraints) return ''
          const parts = []
          if (constraints.required) parts.push('Required')
          if (constraints.unique) parts.push('Unique')
          if (constraints.minimum !== undefined) parts.push(`Min: ${constraints.minimum}`)
          if (constraints.maximum !== undefined) parts.push(`Max: ${constraints.maximum}`)
          return parts.join(', ')
        },
      })
    )
  }

  if (config.customColumns) {
    columns.push(...config.customColumns)
  }

  return columns
}
