/**
 * Table composables for TanStack Table integration (Vue)
 * Provides composables that combine TanStack Query data fetching with TanStack Table
 */

import { useVueTable, getCoreRowModel } from '@tanstack/vue-table'
import type {
  ColumnDef,
  TableOptions,
  PaginationState,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/vue-table'
import type { UseQueryReturnType } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue, computed } from 'vue'
import { useDatasetSearch } from './useDatasetSearch'
import type { UseDatasetSearchOptions } from './useDatasetSearch'
import { useDatastore } from './useDatastore'
import type { UseDatastoreOptions } from './useDatastore'
import type {
  DkanDataset,
} from '@dkan-client-tools/core'

/**
 * Generic composable to create a table from any query result
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const query = useDatasetSearch({ keyword: 'health' })
 * const table = useTableFromQuery({
 *   query,
 *   data: () => query.data.value?.results ?? [],
 *   columns: createDatasetColumns(),
 * })
 * </script>
 * ```
 */
export function useTableFromQuery<TData>(options: {
  /** The query result to integrate with */
  query: UseQueryReturnType<any, Error>
  /** Table data - can be reactive */
  data: MaybeRefOrGetter<TData[]>
  /** Column definitions */
  columns: MaybeRefOrGetter<ColumnDef<TData, any>[]>
  /** Additional table options */
  tableOptions?: MaybeRefOrGetter<
    Partial<Omit<TableOptions<TData>, 'data' | 'columns' | 'getCoreRowModel'>>
  >
}) {
  const table = useVueTable({
    get data() {
      return toValue(options.data)
    },
    get columns() {
      return toValue(options.columns)
    },
    getCoreRowModel: getCoreRowModel(),
    ...toValue(options.tableOptions ?? {}),
  })

  return table
}

/**
 * Composable that combines dataset search query with table
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const keyword = ref('health')
 * const { table, query } = useDatasetSearchTable({
 *   searchOptions: { keyword },
 *   columns: createDatasetColumns(),
 * })
 * </script>
 *
 * <template>
 *   <div v-if="query.isLoading.value">Loading...</div>
 *   <table v-else>
 *     <!-- Use table instance to render -->
 *   </table>
 * </template>
 * ```
 */
export function useDatasetSearchTable(options: {
  /** Dataset search options */
  searchOptions: UseDatasetSearchOptions
  /** Column definitions */
  columns: MaybeRefOrGetter<ColumnDef<DkanDataset, any>[]>
  /** Initial pagination state */
  initialPagination?: PaginationState
  /** Initial sorting state */
  initialSorting?: SortingState
  /** Initial filter state */
  initialFilters?: ColumnFiltersState
  /** Additional table options */
  tableOptions?: MaybeRefOrGetter<
    Partial<Omit<TableOptions<DkanDataset>, 'data' | 'columns' | 'getCoreRowModel'>>
  >
}) {
  const { searchOptions, columns, tableOptions } = options

  const query = useDatasetSearch(searchOptions)

  const table = useVueTable({
    get data() {
      return query.data.value?.results ?? []
    },
    get columns() {
      return toValue(columns)
    },
    getCoreRowModel: getCoreRowModel(),
    ...toValue(tableOptions ?? {}),
  })

  return { table, query }
}

/**
 * Composable that combines datastore query with table
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const datasetId = ref('abc-123')
 * const { table, query } = useDatastoreTable({
 *   datastoreOptions: {
 *     identifier: datasetId,
 *     index: 0,
 *   },
 *   columns: () => createDatastoreColumns({
 *     fields: query.data.value?.schema?.fields,
 *   }),
 * })
 * </script>
 * ```
 */
export function useDatastoreTable(options: {
  /** Datastore query options */
  datastoreOptions: UseDatastoreOptions
  /** Column definitions - can be reactive */
  columns: MaybeRefOrGetter<ColumnDef<Record<string, any>, any>[]>
  /** Initial pagination state */
  initialPagination?: PaginationState
  /** Initial sorting state */
  initialSorting?: SortingState
  /** Initial filter state */
  initialFilters?: ColumnFiltersState
  /** Additional table options */
  tableOptions?: MaybeRefOrGetter<
    Partial<Omit<TableOptions<Record<string, any>>, 'data' | 'columns' | 'getCoreRowModel'>>
  >
}) {
  const { datastoreOptions, columns, tableOptions } = options

  const query = useDatastore(datastoreOptions)

  const table = useVueTable({
    get data() {
      return query.data.value?.results ?? []
    },
    get columns() {
      return toValue(columns)
    },
    getCoreRowModel: getCoreRowModel(),
    ...toValue(tableOptions ?? {}),
  })

  return { table, query }
}

/**
 * Re-export common TanStack Table utilities for convenience
 */
export { FlexRender } from '@tanstack/vue-table'
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
} from '@tanstack/vue-table'
