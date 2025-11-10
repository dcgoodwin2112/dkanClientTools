# @dkan-client-tools/react

React hooks for DKAN client tools. Built on top of `@dkan-client-tools/core` and [TanStack React Query](https://tanstack.com/query) to provide a seamless React integration for querying DKAN data catalogs.

## Features

- ⚛️ **React Hooks** - Idiomatic React integration with 40+ hooks
- 🔄 **Automatic Refetching** - Smart background updates
- 💾 **Caching** - Efficient data caching and deduplication
- 🎯 **TypeScript** - Full type safety with DCAT-US schema
- 📦 **Tree-shakeable** - Only bundle what you use
- 🔥 **React 18+** - Optimized for concurrent rendering
- ✏️ **Mutations** - First-class support for create, update, delete operations

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

### Dataset Query Hooks

**`useDataset`** - Fetch a single dataset by identifier

```tsx
const { data, isLoading, error } = useDataset({
  identifier: 'my-dataset-id',
  staleTime: 60000,
  enabled: true,
})
```

**`useDatasetSearch`** - Search for datasets with filters

```tsx
const { data, isLoading } = useDatasetSearch({
  searchOptions: {
    keyword: 'health',
    theme: 'healthcare',
    page: 1,
    'page-size': 20,
  },
})
```

**`useAllDatasets`** - Get all datasets with full metadata

```tsx
const { data: datasets } = useAllDatasets()
```

### Datastore Query Hooks

**`useDatastore`** - Query datastore data for a specific resource

```tsx
const { data, isLoading } = useDatastore({
  datasetId: 'dataset-id',
  index: 0,
  queryOptions: {
    limit: 100,
    properties: ['name', 'value', 'date'],
    sorts: [{ property: 'date', order: 'desc' }],
    conditions: [{ property: 'status', value: 'active' }],
  },
})
```

**`useSqlQuery`** - Execute SQL queries against datastore

```tsx
const { data } = useSqlQuery({
  query: 'SELECT * FROM datastore_12345 WHERE status = "active" LIMIT 100',
  show_db_columns: false,
})
```

**`useExecuteSqlQuery`** - Execute SQL queries on demand (mutation)

```tsx
const executeSql = useExecuteSqlQuery()

executeSql.mutate({
  query: 'SELECT COUNT(*) FROM datastore_12345',
})
```

### Data Dictionary Hooks

**`useDataDictionary`** - Get a data dictionary by identifier

```tsx
const { data: dictionary } = useDataDictionary({
  identifier: 'dict-123',
})
```

**`useDataDictionaryList`** - List all data dictionaries

```tsx
const { data: dictionaries } = useDataDictionaryList()
```

**`useDataDictionaryFromUrl`** - Fetch dictionary from URL

```tsx
const { data } = useDataDictionaryFromUrl({
  url: 'https://example.com/schema.json',
})
```

**`useDatastoreSchema`** - Get schema for a datastore

```tsx
const { data: schema } = useDatastoreSchema({
  identifier: 'dataset-id',
  index: 0,
})
```

### Data Dictionary Mutations

**`useCreateDataDictionary`** - Create a new data dictionary

```tsx
const createDict = useCreateDataDictionary()

createDict.mutate({
  identifier: 'my-dict',
  data: {
    title: 'My Dictionary',
    fields: [
      { name: 'id', type: 'integer', title: 'ID' },
      { name: 'name', type: 'string', title: 'Name' },
    ],
  },
})
```

**`useUpdateDataDictionary`** - Update a data dictionary

**`useDeleteDataDictionary`** - Delete a data dictionary

### Dataset Mutations

**`useCreateDataset`** - Create a new dataset

```tsx
const createDataset = useCreateDataset()

createDataset.mutate({
  title: 'My Dataset',
  description: 'Dataset description',
  accessLevel: 'public',
  // ... other required fields
})
```

**`useUpdateDataset`** - Update an entire dataset

**`usePatchDataset`** - Partially update a dataset

```tsx
const patchDataset = usePatchDataset()

patchDataset.mutate({
  identifier: 'dataset-123',
  partialDataset: { title: 'New Title' },
})
```

**`useDeleteDataset`** - Delete a dataset

### Harvest Hooks

**`useHarvestPlans`** - List all harvest plans

**`useHarvestPlan`** - Get a specific harvest plan

**`useHarvestRuns`** - List harvest runs for a plan

**`useHarvestRun`** - Get harvest run status

**`useRegisterHarvestPlan`** - Register a new harvest plan (mutation)

**`useRunHarvest`** - Run a harvest (mutation)

```tsx
const runHarvest = useRunHarvest()

runHarvest.mutate({ plan_id: 'my-plan' })
```

### Datastore Import Hooks

**`useDatastoreImports`** - List all datastore imports

**`useDatastoreImport`** - Get a specific import

**`useDatastoreStatistics`** - Get datastore statistics

**`useTriggerDatastoreImport`** - Trigger a datastore import (mutation)

**`useDeleteDatastore`** - Delete a datastore (mutation)

### Metastore Hooks

**`useSchemas`** - List available metastore schemas

**`useSchemaItems`** - Get items for a specific schema

**`useDatasetFacets`** - Get dataset facets (themes, keywords, publishers)

```tsx
const { data: facets } = useDatasetFacets()

// facets.theme: ['Health', 'Education', ...]
// facets.keyword: ['open data', 'public', ...]
// facets.publisher: ['City of...', ...]
```

### Dataset Properties Hooks

**`useDatasetProperties`** - Get all available dataset properties

**`usePropertyValues`** - Get all values for a specific property

**`useAllPropertiesWithValues`** - Get all properties with their values

### Revision/Moderation Hooks

**`useRevisions`** - Get all revisions for an item

**`useRevision`** - Get a specific revision

**`useCreateRevision`** - Create a new revision (mutation)

**`useChangeDatasetState`** - Change dataset workflow state (mutation)

```tsx
const changeState = useChangeDatasetState()

changeState.mutate({
  identifier: 'dataset-123',
  state: 'published',
  message: 'Publishing to production',
})
```

### Query Download Hooks

**`useDownloadQuery`** - Download query results (mutation)

```tsx
const downloadQuery = useDownloadQuery()

downloadQuery.mutate(
  {
    datasetId: 'dataset-123',
    index: 0,
    queryOptions: { format: 'csv' },
  },
  {
    onSuccess: (blob) => {
      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'data.csv'
      a.click()
      URL.revokeObjectURL(url)
    },
  }
)
```

**`useDownloadQueryByDistribution`** - Download by distribution ID (mutation)

### CKAN Compatibility Hooks

**`useCkanPackageSearch`** - Search packages (CKAN-compatible)

**`useCkanDatastoreSearch`** - Search datastore (CKAN-compatible)

**`useCkanDatastoreSearchSql`** - SQL search (CKAN-compatible)

**`useCkanResourceShow`** - Get resource info (CKAN-compatible)

**`useCkanCurrentPackageListWithResources`** - List packages (CKAN-compatible)

## Hook Options

All query hooks support these common options:

- `enabled` - Enable/disable the query (default: `true`)
- `staleTime` - Time in ms before data is considered stale (default: `0`)
- `refetchInterval` - Auto-refetch interval in ms (optional)

## Hook Return Values

### Query Hooks

All query hooks return:

- `data` - The fetched data (undefined while loading)
- `error` - Error object if the query failed
- `status` - Query status: `'pending' | 'error' | 'success'`
- `isLoading` - `true` if first load
- `isPending` - `true` if no data yet
- `isSuccess` - `true` if query succeeded
- `isError` - `true` if query failed
- `isFetching` - `true` if currently fetching (including background refetch)
- `refetch` - Function to manually refetch

### Mutation Hooks

All mutation hooks return:

- `mutate` - Function to trigger the mutation
- `mutateAsync` - Async version of mutate
- `data` - The mutation result
- `error` - Error object if mutation failed
- `status` - Mutation status
- `isPending` - `true` if mutation is in progress
- `isSuccess` - `true` if mutation succeeded
- `isError` - `true` if mutation failed
- `reset` - Reset mutation state

## Advanced Usage

### Access the DkanClient

```tsx
import { useDkanClient } from '@dkan-client-tools/react'

function MyComponent() {
  const dkanClient = useDkanClient()

  // Access the API client
  const apiClient = dkanClient.getApiClient()

  // Access the QueryClient
  const queryClient = dkanClient.getQueryClient()
}
```

### Use TanStack Query Hooks Directly

```tsx
import { useQueryClient, useIsFetching } from '@dkan-client-tools/react'

function MyComponent() {
  const queryClient = useQueryClient()
  const isFetching = useIsFetching()

  // Manually invalidate queries
  queryClient.invalidateQueries({ queryKey: ['datasets'] })

  return <div>Loading: {isFetching > 0 ? 'yes' : 'no'}</div>
}
```

## Testing

All hooks are fully tested with 218 comprehensive tests covering:

- Loading states
- Error handling
- Data fetching
- Mutations
- Callbacks
- Edge cases

## License

MIT
