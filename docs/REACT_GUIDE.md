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

## Available Hooks

All DKAN API methods are available as React hooks. See **[API Reference](./API_REFERENCE.md)** for complete documentation of all hooks including:

- **Dataset Hooks**: `useDataset`, `useDatasetSearch`, `useCreateDataset`, `useUpdateDataset`, `usePatchDataset`, `useDeleteDataset`
- **Datastore Hooks**: `useDatastore`, `useQueryDatastoreMulti`, `useSqlQuery`, `useDownloadQuery`
- **Data Dictionary Hooks**: `useDataDictionary`, `useDataDictionaryList`, `useCreateDataDictionary`, `useUpdateDataDictionary`, `useDeleteDataDictionary`
- **Harvest Hooks**: `useHarvestPlans`, `useHarvestPlan`, `useRegisterHarvestPlan`, `useRunHarvest`
- **Datastore Import Hooks**: `useDatastoreImports`, `useDatastoreImport`, `useTriggerDatastoreImport`, `useDeleteDatastore`
- **Metastore Hooks**: `useSchemas`, `useSchema`, `useSchemaItems`, `useDatasetFacets`
- **Revision/Moderation Hooks**: `useRevisions`, `useRevision`, `useCreateRevision`, `useChangeDatasetState`

---

## React-Specific Patterns

### Component Composition

```tsx
function DatasetCard({ id }: { id: string }) {
  const { data, isLoading } = useDataset({ identifier: id })

  if (isLoading) return <Skeleton />

  return (
    <Card>
      <h3>{data?.title}</h3>
      <p>{data?.description}</p>
    </Card>
  )
}

function DatasetList() {
  const { data } = useDatasetSearch({ searchOptions: { 'page-size': 10 } })

  return (
    <div>
      {data?.results.map(dataset => (
        <DatasetCard key={dataset.identifier} id={dataset.identifier} />
      ))}
    </div>
  )
}
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary'

function DatasetWidget() {
  return (
    <ErrorBoundary fallback={<div>Failed to load datasets</div>}>
      <DatasetList />
    </ErrorBoundary>
  )
}
```

### Suspense Integration

```tsx
import { Suspense } from 'react'

function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <Suspense fallback={<Loading />}>
        <DatasetList />
      </Suspense>
    </DkanClientProvider>
  )
}
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

**Authentication and CORS**: See [Quick Start Guide](./QUICK_START.md) for authentication setup and CORS configuration.

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
