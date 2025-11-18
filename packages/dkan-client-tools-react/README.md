# @dkan-client-tools/react

React hooks for DKAN client tools. Built on top of `@dkan-client-tools/core` and [TanStack React Query](https://tanstack.com/query) to provide a seamless React integration for querying DKAN data catalogs.

## Features

- React Hooks - 39 hooks for datasets, datastore, dictionaries, harvest, revisions
- Table Integration - TanStack Table hooks with pre-configured column utilities
- Automatic Refetching - Smart background updates via TanStack Query
- Caching - Efficient data caching and deduplication
- TypeScript - Full type safety with DCAT-US schema
- Tree-shakeable - ESM/CJS dual build
- React 18+ - Concurrent rendering support
- Mutations - Create, update, delete operations with cache invalidation

## Installation

```bash
npm install @dkan-client-tools/react @dkan-client-tools/core @tanstack/react-query
```

## Quick Start

```tsx
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider, useDataset, useDatasetSearch } from '@dkan-client-tools/react'

// 1. Create a client
const dkanClient = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
})

// 2. Wrap your app with the provider
function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <DatasetList />
    </DkanClientProvider>
  )
}

// 3. Use hooks in your components
function DatasetList() {
  const { data, isLoading, error } = useDatasetSearch({
    searchOptions: {
      keyword: 'health',
      'page-size': 10,
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.results.map((dataset) => (
        <li key={dataset.identifier}>
          <DatasetDetail id={dataset.identifier} />
        </li>
      ))}
    </ul>
  )
}

function DatasetDetail({ id }: { id: string }) {
  const { data } = useDataset({ identifier: id })

  return (
    <div>
      <h3>{data?.title}</h3>
      <p>{data?.description}</p>
    </div>
  )
}
```

## Available Hooks

### Dataset Hooks

- **`useDataset`** - Fetch dataset by ID
- **`useDatasetSearch`** - Search with filters, pagination
- **`useAllDatasets`** - Get all datasets
- **`useCreateDataset`** - Create dataset (mutation)
- **`useUpdateDataset`** - Update dataset (mutation)
- **`usePatchDataset`** - Partial update (mutation)
- **`useDeleteDataset`** - Delete dataset (mutation)

```tsx
const { data } = useDataset({ identifier: 'id' })
const { data } = useDatasetSearch({ searchOptions: { keyword: 'health' } })
const create = useCreateDataset()
create.mutate({ title: 'Dataset', accessLevel: 'public' })
```

### Datastore Hooks

- **`useDatastore`** - Query datastore with filtering, sorting, pagination
- **`useQueryDatastoreMulti`** - Multi-resource queries with JOINs
- **`useSqlQuery`** - Execute SQL queries
- **`useExecuteSqlQuery`** - SQL on demand (mutation)

```tsx
const { data } = useDatastore({
  datasetId: 'id',
  queryOptions: { limit: 100, sorts: [{ property: 'date', order: 'desc' }] }
})
const { data } = useSqlQuery({ query: 'SELECT * FROM datastore_12345 LIMIT 10' })
```

### Data Dictionary Hooks

- **`useDataDictionary`** - Get dictionary by ID
- **`useDataDictionaryList`** - List all dictionaries
- **`useDataDictionaryFromUrl`** - Fetch from URL
- **`useDatastoreSchema`** - Get datastore schema
- **`useCreateDataDictionary`** - Create dictionary (mutation)
- **`useUpdateDataDictionary`** - Update dictionary (mutation)
- **`useDeleteDataDictionary`** - Delete dictionary (mutation)

```tsx
const { data } = useDataDictionary({ identifier: 'dict-id' })
const create = useCreateDataDictionary()
create.mutate({ identifier: 'id', data: { title: 'Schema', fields: [...] } })
```

### Harvest Hooks

- **`useHarvestPlans`** - List harvest plans
- **`useHarvestPlan`** - Get specific plan
- **`useHarvestRuns`** - List runs for a plan
- **`useHarvestRun`** - Get run status
- **`useRegisterHarvestPlan`** - Register plan (mutation)
- **`useRunHarvest`** - Run harvest (mutation)

### Datastore Import Hooks

- **`useDatastoreImports`** - List all imports
- **`useDatastoreImport`** - Get specific import
- **`useDatastoreStatistics`** - Get datastore statistics
- **`useTriggerDatastoreImport`** - Trigger import (mutation)
- **`useDeleteDatastore`** - Delete datastore (mutation)

### Metastore Hooks

- **`useSchemas`** - List metastore schemas
- **`useSchema`** - Get specific schema
- **`useSchemaItems`** - Get items for schema
- **`useDatasetFacets`** - Get facets (themes, keywords, publishers)

### Revision/Moderation Hooks

- **`useRevisions`** - Get all revisions
- **`useRevision`** - Get specific revision
- **`useCreateRevision`** - Create revision (mutation)
- **`useChangeDatasetState`** - Change workflow state (mutation)

### Download Hooks

- **`useDownloadQuery`** - Download query results (mutation)
- **`useDownloadQueryByDistribution`** - Download by distribution ID (mutation)

```tsx
const download = useDownloadQuery()
download.mutate(
  { datasetId: 'id', index: 0, queryOptions: { format: 'csv' } },
  { onSuccess: (blob) => { /* create download link */ } }
)
```

### Table Hooks (TanStack Table)

- **`useTableFromQuery`** - Create table from any query result
- **`useDatasetSearchTable`** - Dataset search with table
- **`useDatastoreTable`** - Datastore query with table

```tsx
import { useDatasetSearchTable, createDatasetColumns } from '@dkan-client-tools/react'

const { table, query } = useDatasetSearchTable({
  searchOptions: { searchOptions: { keyword: 'health' } },
  columns: createDatasetColumns({ showDescription: true }),
})

// Render table using flexRender and table.getRowModel()
```

**Column Utilities**: `createDatasetColumns`, `createDatastoreColumns`, `createHarvestPlanColumns`, `createHarvestRunColumns`, `createDatastoreImportColumns`, `createDataDictionaryFieldColumns`

See [TANSTACK_TABLE.md](../../docs/external/libraries/TANSTACK_TABLE.md) for complete table documentation.

## Hook Options & Return Values

**Common Query Options**: `enabled`, `staleTime`, `refetchInterval`

**Query Returns**: `data`, `isLoading`, `isFetching`, `isError`, `error`, `refetch`

**Mutation Returns**: `mutate`, `mutateAsync`, `isPending`, `isSuccess`, `isError`, `data`, `error`, `reset`

## Advanced Usage

Access the DkanClient or TanStack Query's QueryClient:

```tsx
import { useDkanClient, useQueryClient } from '@dkan-client-tools/react'

const dkanClient = useDkanClient()
const queryClient = useQueryClient()
```

## Testing

181 comprehensive tests covering loading states, errors, mutations, and edge cases. See [TESTING.md](./TESTING.md).

## License

MIT
