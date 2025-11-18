# TanStack Table

External technology documentation for TanStack Table integration in dkanClientTools.

**Last Updated**: 2025-11-18
**Version**: v8.x
**Official Docs**: https://tanstack.com/table/latest

---

## Overview

TanStack Table (formerly React Table) is a headless UI library for building powerful tables and datagrids. It provides the logic for sorting, filtering, pagination, and more while leaving the UI rendering entirely up to you.

**Key Characteristics**:
- Headless - no markup, styles, or UI components included
- Framework-agnostic core with adapters for React, Vue, Solid, Svelte
- TypeScript-first with excellent type inference
- Extensible via plugin system
- Lightweight - ~14kb min+gzip

---

## Architecture

### Core + Adapters Pattern

Similar to TanStack Query, TanStack Table follows a core + adapters architecture:

```
@tanstack/table-core          # Framework-agnostic table logic
├── @tanstack/react-table     # React adapter
├── @tanstack/vue-table       # Vue adapter
├── @tanstack/solid-table     # Solid adapter
└── @tanstack/svelte-table    # Svelte adapter
```

**In dkanClientTools**:
- Core package uses no table dependencies (framework-agnostic)
- React package uses `@tanstack/react-table`
- Vue package uses `@tanstack/vue-table`

---

## Core Concepts

### 1. Table Instance

The table instance is the main object that holds all table state and logic:

```typescript
const table = useReactTable({
  data,           // Your data array
  columns,        // Column definitions
  getCoreRowModel: getCoreRowModel(),
})
```

### 2. Column Definitions

Columns define how data is accessed and displayed:

```typescript
const columnHelper = createColumnHelper<Person>()

const columns = [
  columnHelper.accessor('firstName', {
    header: 'First Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    cell: (info) => info.getValue(),
  }),
]
```

**Column Types**:
- **Accessor columns** - tied to data properties
- **Display columns** - for computed/custom values
- **Grouping columns** - for column groups

### 3. Row Models

Row models determine how data is processed:

- `getCoreRowModel()` - base model (required)
- `getSortedRowModel()` - adds sorting
- `getFilteredRowModel()` - adds filtering
- `getPaginationRowModel()` - adds pagination
- `getGroupedRowModel()` - adds grouping
- `getExpandedRowModel()` - adds row expansion

### 4. Table State

Table state can be controlled or uncontrolled:

```typescript
// Uncontrolled (managed internally)
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  enableSorting: true,
})

// Controlled (managed externally)
const [sorting, setSorting] = useState([])
const table = useReactTable({
  data,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})
```

---

## React Integration

### Basic Setup

```tsx
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'

function DataTable({ data, columns }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### With Sorting

```tsx
const [sorting, setSorting] = useState<SortingState>([])

const table = useReactTable({
  data,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

// In header
<th onClick={header.column.getToggleSortingHandler()}>
  {flexRender(header.column.columnDef.header, header.getContext())}
  {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
</th>
```

### With Pagination

```tsx
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
})

const table = useReactTable({
  data,
  columns,
  state: { pagination },
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})

// Pagination controls
<button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
  Previous
</button>
<button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
  Next
</button>
```

---

## Vue Integration

### Basic Setup

```vue
<script setup lang="ts">
import { useVueTable, getCoreRowModel, FlexRender } from '@tanstack/vue-table'

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <table>
    <thead>
      <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
        <th v-for="header in headerGroup.headers" :key="header.id">
          <FlexRender
            :render="header.column.columnDef.header"
            :props="header.getContext()"
          />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in table.getRowModel().rows" :key="row.id">
        <td v-for="cell in row.getVisibleCells()" :key="cell.id">
          <FlexRender
            :render="cell.column.columnDef.cell"
            :props="cell.getContext()"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

### With Reactive Data

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useVueTable, getCoreRowModel } from '@tanstack/vue-table'

const data = ref([...])
const columns = ref([...])

// Table automatically reacts to data/column changes
const table = useVueTable({
  get data() {
    return data.value
  },
  get columns() {
    return columns.value
  },
  getCoreRowModel: getCoreRowModel(),
})
</script>
```

### With Sorting

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useVueTable, getCoreRowModel, getSortedRowModel } from '@tanstack/vue-table'
import type { SortingState } from '@tanstack/vue-table'

const sorting = ref<SortingState>([])

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    get sorting() {
      return sorting.value
    },
  },
  onSortingChange: (updaterOrValue) => {
    sorting.value = typeof updaterOrValue === 'function'
      ? updaterOrValue(sorting.value)
      : updaterOrValue
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})
</script>

<template>
  <th @click="header.column.getToggleSortingHandler()($event)">
    <!-- header content -->
    <span v-if="header.column.getIsSorted() === 'asc'">🔼</span>
    <span v-else-if="header.column.getIsSorted() === 'desc'">🔽</span>
  </th>
</template>
```

---

## Integration with TanStack Query

TanStack Table works seamlessly with TanStack Query for data fetching:

### React Example

```tsx
import { useQuery } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

function DataTable() {
  // Fetch data with TanStack Query
  const { data, isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: fetchDatasets,
  })

  // Create table with query data
  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <div>Loading...</div>

  return <table>...</table>
}
```

### Vue Example

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { useVueTable, getCoreRowModel } from '@tanstack/vue-table'

const { data, isLoading } = useQuery({
  queryKey: ['datasets'],
  queryFn: fetchDatasets,
})

const table = useVueTable({
  get data() {
    return data.value?.results ?? []
  },
  get columns() {
    return columns.value
  },
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <table v-else>...</table>
</template>
```

---

## Common Patterns

### Dynamic Columns from Schema

Generate columns from data schema (useful for datastore queries):

```typescript
function createColumnsFromSchema(fields: DatastoreField[]) {
  const columnHelper = createColumnHelper<Record<string, any>>()

  return fields.map((field) =>
    columnHelper.accessor(field.name, {
      header: field.name,
      cell: (info) => {
        const value = info.getValue()
        // Format by field type
        if (field.type === 'date') {
          return new Date(value).toLocaleDateString()
        }
        return value
      },
    })
  )
}
```

### Server-Side Operations

For large datasets, handle sorting/filtering/pagination server-side:

```typescript
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
const [sorting, setSorting] = useState([])

const { data } = useQuery({
  queryKey: ['data', pagination, sorting],
  queryFn: () => fetchData(pagination, sorting),
})

const table = useReactTable({
  data: data?.results ?? [],
  pageCount: data?.totalPages ?? -1,
  state: { pagination, sorting },
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,  // Server handles pagination
  manualSorting: true,     // Server handles sorting
})
```

### Column Visibility

Toggle column visibility:

```typescript
const [columnVisibility, setColumnVisibility] = useState({})

const table = useReactTable({
  data,
  columns,
  state: { columnVisibility },
  onColumnVisibilityChange: setColumnVisibility,
  getCoreRowModel: getCoreRowModel(),
})

// Toggle button
<button onClick={() => column.toggleVisibility()}>
  {column.getIsVisible() ? 'Hide' : 'Show'} {column.id}
</button>
```

---

## Performance Considerations

### Memoization

Memoize columns and data to prevent unnecessary re-renders:

```tsx
// React
const columns = useMemo(() => [...], [])
const data = useMemo(() => [...], [rawData])

// Vue
const columns = computed(() => [...])
```

### Virtual Scrolling

For large datasets, use virtual scrolling with libraries like `@tanstack/react-virtual`:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 35,
})
```

### Row Selection

Optimize row selection for large tables:

```typescript
const [rowSelection, setRowSelection] = useState({})

const table = useReactTable({
  data,
  columns,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
  enableRowSelection: true,
  getCoreRowModel: getCoreRowModel(),
})
```

---

## Usage in dkanClientTools

### React Hooks

dkanClientTools provides pre-configured hooks combining Query + Table:

```tsx
import { useDatasetSearchTable, createDatasetColumns } from '@dkan-client-tools/react'

const { table, query } = useDatasetSearchTable({
  searchOptions: { keyword: 'health' },
  columns: createDatasetColumns(),
})

if (query.isLoading) return <div>Loading...</div>

// Render table using table instance
```

### Vue Composables

```vue
<script setup lang="ts">
import { useDatasetSearchTable, createDatasetColumns } from '@dkan-client-tools/vue'

const { table, query } = useDatasetSearchTable({
  searchOptions: { keyword: ref('health') },
  columns: createDatasetColumns(),
})
</script>

<template>
  <div v-if="query.isLoading.value">Loading...</div>
  <table v-else>
    <!-- Render using table instance -->
  </table>
</template>
```

---

## References

- **Official Documentation**: https://tanstack.com/table/latest
- **React Table Guide**: https://tanstack.com/table/latest/docs/framework/react/guide/introduction
- **Vue Table Guide**: https://tanstack.com/table/latest/docs/framework/vue/guide/introduction
- **GitHub Repository**: https://github.com/TanStack/table
- **API Reference**: https://tanstack.com/table/latest/docs/api/core/table
- **Examples**: https://tanstack.com/table/latest/docs/framework/react/examples/basic
