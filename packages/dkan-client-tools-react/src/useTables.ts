/**
 * Table hooks for TanStack Table integration
 * Provides hooks that combine TanStack Query data fetching with TanStack Table
 */

import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import type {
  ColumnDef,
  TableOptions,
  PaginationState,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import type { UseQueryResult } from '@tanstack/react-query'
import { useDatasetSearch } from './useDatasetSearch'
import type { UseDatasetSearchOptions } from './useDatasetSearch'
import { useDatastore } from './useDatastore'
import type { UseDatastoreOptions } from './useDatastore'
import type {
  DkanDataset,
} from '@dkan-client-tools/core'

/**
 * Generic hook to create a table from any query result
 *
 * @example
 * ```tsx
 * const query = useDatasetSearch({ keyword: 'health' })
 * const table = useTableFromQuery({
 *   query,
 *   data: query.data?.results ?? [],
 *   columns: createDatasetColumns(),
 * })
 * ```
 */
export function useTableFromQuery<TData>(options: {
  /** The query result to integrate with */
  query: UseQueryResult<any, Error>
  /** Table data */
  data: TData[]
  /** Column definitions */
  columns: ColumnDef<TData, any>[]
  /** Additional table options */
  tableOptions?: Partial<Omit<TableOptions<TData>, 'data' | 'columns' | 'getCoreRowModel'>>
}) {
  const { data, columns, tableOptions = {} } = options

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...tableOptions,
  })

  return table
}

/**
 * Hook that combines dataset search query with table
 *
 * @example
 * ```tsx
 * const { table, query } = useDatasetSearchTable({
 *   searchOptions: { searchOptions: { keyword: 'health' } },
 *   columns: createDatasetColumns(),
 * })
 *
 * if (query.isLoading) return <div>Loading...</div>
 * ```
 */
export function useDatasetSearchTable(options: {
  /** Dataset search options */
  searchOptions: UseDatasetSearchOptions
  /** Column definitions */
  columns: ColumnDef<DkanDataset, any>[]
  /** Initial pagination state */
  initialPagination?: PaginationState
  /** Initial sorting state */
  initialSorting?: SortingState
  /** Initial filter state */
  initialFilters?: ColumnFiltersState
  /** Additional table options */
  tableOptions?: Partial<Omit<TableOptions<DkanDataset>, 'data' | 'columns' | 'getCoreRowModel'>>
}) {
  const { searchOptions, columns, tableOptions = {} } = options

  const query = useDatasetSearch(searchOptions)

  const table = useReactTable({
    data: query.data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...tableOptions,
  })

  return { table, query }
}

/**
 * Hook that combines datastore query with table
 *
 * @example
 * ```tsx
 * const datasetId = 'abc-123'
 * const { table, query } = useDatastoreTable({
 *   datastoreOptions: {
 *     datasetId,
 *     index: 0,
 *   },
 *   columns: createDatastoreColumns({
 *     fields: query.data?.schema?.fields,
 *   }),
 * })
 * ```
 */
export function useDatastoreTable(options: {
  /** Datastore query options */
  datastoreOptions: UseDatastoreOptions
  /** Column definitions */
  columns: ColumnDef<Record<string, any>, any>[]
  /** Initial pagination state */
  initialPagination?: PaginationState
  /** Initial sorting state */
  initialSorting?: SortingState
  /** Initial filter state */
  initialFilters?: ColumnFiltersState
  /** Additional table options */
  tableOptions?: Partial<Omit<TableOptions<Record<string, any>>, 'data' | 'columns' | 'getCoreRowModel'>>
}) {
  const { datastoreOptions, columns, tableOptions = {} } = options

  const query = useDatastore(datastoreOptions)

  const table = useReactTable({
    data: query.data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...tableOptions,
  })

  return { table, query }
}

/**
 * Re-export common TanStack Table utilities for convenience
 */
export { flexRender } from '@tanstack/react-table'
export type {
  ColumnDef,
  Table,
  Row,
  Cell,
  Header,
  Column,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  TableOptions,
} from '@tanstack/react-table'
