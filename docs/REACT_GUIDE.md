# React Guide

Complete guide for using DKAN Client Tools with React.

## Overview

The `@dkan-client-tools/react` package provides React hooks built on TanStack React Query for all DKAN APIs. Features include automatic caching, background refetching, loading states, and error handling.

## Installation

```bash
npm install @dkan-client-tools/core @dkan-client-tools/react @tanstack/react-query
```

**Peer Dependencies**:
- React 18+ or 19+
- TanStack React Query

---

## Setup

### 1. Create Client

```tsx
import { DkanClient } from '@dkan-client-tools/core'

const dkanClient = new DkanClient({
  baseUrl: 'https://demo.getdkan.org',
  // Optional: Add authentication
  auth: {
    username: 'your-username',
    password: 'your-password'
  }
})
```

### 2. Add Provider

Wrap your app with `DkanClientProvider`:

```tsx
import { DkanClientProvider } from '@dkan-client-tools/react'

function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <YourComponents />
    </DkanClientProvider>
  )
}
```

### 3. Use Hooks

```tsx
import { useDatasetSearch, useDataset } from '@dkan-client-tools/react'

function DatasetList() {
  const { data, isLoading, error } = useDatasetSearch({
    searchOptions: { 'page-size': 10 }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.results.map(dataset => (
        <li key={dataset.identifier}>{dataset.title}</li>
      ))}
    </ul>
  )
}
```

---

## Dataset Hooks

### Query Hooks

#### useDataset

Fetch a single dataset by identifier.

```tsx
import { useDataset } from '@dkan-client-tools/react'

function DatasetDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useDataset({
    identifier: id
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{data?.title}</h1>
      <p>{data?.description}</p>
      <p>Publisher: {data?.publisher?.name}</p>
    </div>
  )
}
```

**Options**:
- `identifier` - Dataset UUID (required)
- `enabled` - Conditionally enable query
- `staleTime` - Cache duration

#### useDatasetSearch

Search datasets with filters and pagination.

```tsx
import { useDatasetSearch } from '@dkan-client-tools/react'

function SearchResults() {
  const [keyword, setKeyword] = useState('')

  const { data, isLoading } = useDatasetSearch({
    searchOptions: {
      keyword,
      fulltext: keyword,
      'page-size': 20,
      page: 1
    }
  })

  return (
    <div>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search datasets..."
      />

      {data?.results.map(dataset => (
        <div key={dataset.identifier}>
          <h3>{dataset.title}</h3>
        </div>
      ))}
    </div>
  )
}
```

**Search Options**:
- `keyword` - Theme/keyword filter
- `fulltext` - Full-text search
- `page` - Page number
- `page-size` - Results per page
- `sort` - Sort field
- `sort-order` - Sort direction

#### useAllDatasets

Get all datasets with full metadata.

```tsx
const { data } = useAllDatasets()
```

### Mutation Hooks

#### useCreateDataset

Create a new dataset.

```tsx
import { useCreateDataset } from '@dkan-client-tools/react'

function CreateDatasetForm() {
  const createDataset = useCreateDataset()

  const handleSubmit = async (formData) => {
    try {
      const result = await createDataset.mutateAsync({
        title: formData.title,
        description: formData.description,
        // ... other DCAT-US fields
      })
      console.log('Created:', result.identifier)
    } catch (error) {
      console.error('Failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  )
}
```

#### useUpdateDataset

Update entire dataset (replaces all fields).

```tsx
const updateDataset = useUpdateDataset()

await updateDataset.mutateAsync({
  identifier: 'uuid',
  data: { /* complete dataset object */ }
})
```

#### usePatchDataset

Partially update dataset (updates specific fields).

```tsx
const patchDataset = usePatchDataset()

await patchDataset.mutateAsync({
  identifier: 'uuid',
  data: { title: 'New Title' }
})
```

#### useDeleteDataset

Delete a dataset.

```tsx
const deleteDataset = useDeleteDataset()

await deleteDataset.mutateAsync('dataset-uuid')
```

---

## Datastore Hooks

### useDatastore

Query datastore data with SQL-like operations.

```tsx
import { useDatastore } from '@dkan-client-tools/react'

function DataTable({ datasetId }: { datasetId: string }) {
  const { data, isLoading } = useDatastore({
    datasetId,
    index: 0,
    queryOptions: {
      limit: 50,
      offset: 0,
      sorts: [
        { property: 'date', order: 'desc' }
      ],
      conditions: [
        { property: 'status', value: 'active', operator: '=' }
      ]
    }
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <table>
      <thead>
        <tr>
          {data?.schema.fields.map(field => (
            <th key={field.name}>{field.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.results.map((row, i) => (
          <tr key={i}>
            {Object.values(row).map((value, j) => (
              <td key={j}>{String(value)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

**Query Options**:
- `limit` - Max results
- `offset` - Skip results
- `sorts` - Sort conditions
- `conditions` - Filter conditions
- `joins` - Join other resources
- `groupBy` - Group results

### useQueryDatastoreMulti

Query multiple datastore resources with JOINs.

```tsx
const { data } = useQueryDatastoreMulti({
  resources: [
    { id: 'dataset1', alias: 'sales' },
    { id: 'dataset2', alias: 'products' }
  ],
  queryOptions: {
    joins: [{
      resource: 'products',
      condition: { sales: 'product_id', products: 'id' }
    }]
  }
})
```

### useSqlQuery

Execute SQL queries against datastore.

```tsx
import { useSqlQuery } from '@dkan-client-tools/react'

function SqlResults() {
  const { data } = useSqlQuery({
    sqlQuery: 'SELECT * FROM datastore_12345 WHERE status = "active" LIMIT 100'
  })

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

### useExecuteSqlQuery

Execute SQL queries on-demand (mutation).

```tsx
const executeSql = useExecuteSqlQuery()

const handleExecute = async () => {
  const result = await executeSql.mutateAsync({
    sqlQuery: 'SELECT COUNT(*) FROM datastore_12345'
  })
}
```

### Download Hooks

#### useDownloadQuery

Download query results as CSV or JSON.

```tsx
const downloadQuery = useDownloadQuery()

const handleDownload = async () => {
  await downloadQuery.mutateAsync({
    datasetId: 'uuid',
    index: 0,
    format: 'csv',
    queryOptions: { limit: 1000 }
  })
}
```

#### useDownloadQueryByDistribution

Download by distribution identifier.

```tsx
const download = useDownloadQueryByDistribution()

await download.mutateAsync({
  distributionId: 'dist-uuid',
  format: 'json'
})
```

---

## Data Dictionary Hooks

### Query Hooks

#### useDataDictionary

Get data dictionary for a dataset.

```tsx
const { data } = useDataDictionary({
  identifier: 'dataset-uuid',
  index: 0
})

// Access field definitions
const fields = data?.data.fields
```

#### useDataDictionaryList

List all data dictionaries.

```tsx
const { data } = useDataDictionaryList()
```

#### useDataDictionaryFromUrl

Fetch dictionary from URL.

```tsx
const { data } = useDataDictionaryFromUrl({
  url: 'https://example.com/dictionary.json'
})
```

#### useDatastoreSchema

Get schema for a datastore.

```tsx
const { data } = useDatastoreSchema({
  identifier: 'dataset-uuid',
  index: 0
})
```

### Mutation Hooks

#### useCreateDataDictionary

Create a data dictionary.

```tsx
const create = useCreateDataDictionary()

await create.mutateAsync({
  identifier: 'dataset-uuid',
  index: 0,
  data: {
    fields: [
      {
        name: 'id',
        type: 'integer',
        title: 'ID'
      }
    ]
  }
})
```

#### useUpdateDataDictionary

Update existing dictionary.

```tsx
const update = useUpdateDataDictionary()

await update.mutateAsync({
  identifier: 'dataset-uuid',
  index: 0,
  data: { /* updated dictionary */ }
})
```

#### useDeleteDataDictionary

Delete a data dictionary.

```tsx
const deleteDictionary = useDeleteDataDictionary()

await deleteDictionary.mutateAsync({
  identifier: 'dataset-uuid',
  index: 0
})
```

---

## Harvest Hooks

### useHarvestPlans

List all harvest plans.

```tsx
const { data } = useHarvestPlans()

data?.forEach(plan => {
  console.log(plan.identifier, plan.label)
})
```

### useHarvestPlan

Get specific harvest plan.

```tsx
const { data } = useHarvestPlan({ planId: 'plan-id' })
```

### useHarvestRuns

List runs for a harvest plan.

```tsx
const { data } = useHarvestRuns({ planId: 'plan-id' })
```

### useHarvestRun

Get specific harvest run status.

```tsx
const { data } = useHarvestRun({
  planId: 'plan-id',
  runId: 'run-id'
})
```

### useRegisterHarvestPlan

Register new harvest plan (mutation).

```tsx
const register = useRegisterHarvestPlan()

await register.mutateAsync({
  identifier: 'my-harvest',
  extract: {
    type: 'json',
    uri: 'https://source.org/data.json'
  },
  transforms: [],
  load: { destination: 'dataset' }
})
```

### useRunHarvest

Execute harvest (mutation).

```tsx
const runHarvest = useRunHarvest()

await runHarvest.mutateAsync('plan-id')
```

---

## Datastore Import Hooks

### useDatastoreImports

List all datastore imports.

```tsx
const { data } = useDatastoreImports()
```

### useDatastoreImport

Get specific import.

```tsx
const { data } = useDatastoreImport({
  identifier: 'dataset-uuid',
  index: 0
})
```

### useDatastoreStatistics

Get datastore statistics.

```tsx
const { data } = useDatastoreStatistics()
```

### useTriggerDatastoreImport

Trigger datastore import (mutation).

```tsx
const trigger = useTriggerDatastoreImport()

await trigger.mutateAsync({
  identifier: 'dataset-uuid',
  index: 0
})
```

### useDeleteDatastore

Delete a datastore (mutation).

```tsx
const deleteDs = useDeleteDatastore()

await deleteDs.mutateAsync({
  identifier: 'dataset-uuid',
  index: 0
})
```

---

## Metastore Hooks

### useSchemas

List available metastore schemas.

```tsx
const { data } = useSchemas()
// Returns: ['dataset', 'distribution', 'publisher', ...]
```

### useSchema

Get specific schema definition.

```tsx
const { data } = useSchema({ schemaId: 'dataset' })
```

### useSchemaItems

Get all items for a schema.

```tsx
const { data } = useSchemaItems({ schemaId: 'publisher' })
```

### useDatasetFacets

Get dataset facets (themes, keywords, publishers).

```tsx
const { data } = useDatasetFacets()

// Access facets
const themes = data?.theme
const keywords = data?.keyword
```

---

## Revision/Moderation Hooks

### useRevisions

Get all revisions for a dataset.

```tsx
const { data } = useRevisions({
  schemaId: 'dataset',
  identifier: 'dataset-uuid'
})
```

### useRevision

Get specific revision.

```tsx
const { data } = useRevision({
  schemaId: 'dataset',
  identifier: 'dataset-uuid',
  revision: '1'
})
```

### useCreateRevision

Create new revision (mutation).

```tsx
const createRevision = useCreateRevision()

await createRevision.mutateAsync({
  schemaId: 'dataset',
  identifier: 'dataset-uuid',
  data: { /* updated dataset */ }
})
```

### useChangeDatasetState

Change workflow state (mutation).

```tsx
const changeState = useChangeDatasetState()

await changeState.mutateAsync({
  identifier: 'dataset-uuid',
  state: 'published' // or 'draft', 'archived'
})
```

---

## Advanced Usage

### Custom Query Configuration

All hooks accept standard TanStack Query options:

```tsx
const { data } = useDataset({
  identifier: 'uuid',
  staleTime: 10 * 60 * 1000, // 10 minutes
  enabled: !!userId, // Conditional fetching
  refetchInterval: 30000, // Auto-refetch every 30s
  retry: 3
})
```

### Mutation Callbacks

```tsx
const createDataset = useCreateDataset()

createDataset.mutate(newDataset, {
  onSuccess: (data) => {
    console.log('Created:', data.identifier)
  },
  onError: (error) => {
    console.error('Failed:', error)
  }
})
```

### Using Query Client

Access TanStack Query Client for advanced operations:

```tsx
import { useQueryClient } from '@dkan-client-tools/react'

function MyComponent() {
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    // Invalidate all dataset queries
    queryClient.invalidateQueries({ queryKey: ['dataset'] })
  }

  return <button onClick={handleRefresh}>Refresh</button>
}
```

### Optimistic Updates

```tsx
const updateDataset = useUpdateDataset()
const queryClient = useQueryClient()

updateDataset.mutate(updatedData, {
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['dataset', id] })

    // Snapshot current value
    const previous = queryClient.getQueryData(['dataset', id])

    // Optimistically update
    queryClient.setQueryData(['dataset', id], newData)

    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['dataset', id], context.previous)
  }
})
```

---

## TypeScript Support

All hooks are fully typed with TypeScript:

```tsx
import type { DkanDataset, DatastoreQueryOptions } from '@dkan-client-tools/react'

const { data } = useDataset({ identifier: 'uuid' })
// data is typed as DkanDataset | undefined

const queryOptions: DatastoreQueryOptions = {
  limit: 100,
  conditions: [
    { property: 'status', value: 'active', operator: '=' }
  ]
}
```

---

## Error Handling

All hooks provide error states:

```tsx
const { data, error, isError } = useDataset({ identifier: 'uuid' })

if (isError) {
  return <div>Error: {error?.message}</div>
}
```

For global error handling:

```tsx
import { QueryCache, QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Global error:', error)
    }
  })
})

// Use custom QueryClient in DkanClient
const dkanClient = new DkanClient({
  baseUrl: 'https://demo.getdkan.org',
  queryClient
})
```

---

## Loading States

Hooks provide multiple loading indicators:

```tsx
const { data, isLoading, isFetching, isPending } = useDataset({ identifier: 'uuid' })

// isLoading: true during initial fetch
// isFetching: true during any fetch (including background)
// isPending: true while waiting for enabled condition
```

---

## Authentication

### Basic Auth

```tsx
const dkanClient = new DkanClient({
  baseUrl: 'https://your-site.com',
  auth: {
    username: 'user',
    password: 'pass'
  }
})
```

### Token Auth

```tsx
const dkanClient = new DkanClient({
  baseUrl: 'https://your-site.com',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
```

---

## CORS & Development

For local development with CORS issues, use a Vite proxy:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://demo.getdkan.org',
        changeOrigin: true
      }
    }
  }
})
```

Then connect to local proxy:

```tsx
const dkanClient = new DkanClient({
  baseUrl: 'http://localhost:5173' // Vite dev server
})
```

---

## See Also

**Prefer Vue?** Check out the [Vue Guide](./VUE_GUIDE.md) for Vue 3 composables with the same API.

**Key Differences:**
- Vue uses reactive refs (`data.value`) instead of direct values
- Parameters can be reactive (refs, computed, or getters)
- Template usage doesn't require `.value`

---

## Next Steps

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Drupal Integration](./DRUPAL_INTEGRATION.md) - Using in Drupal
- [React Package README](../packages/dkan-client-tools-react/README.md) - Package details
- [React Demo App](../examples/react-demo-app/) - Working example
