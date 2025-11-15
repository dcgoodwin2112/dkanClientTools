# Advanced Patterns

Advanced usage patterns for DKAN Client Tools with TanStack Query.

These patterns are optional - the basic setup in the framework guides is sufficient for most use cases. Use these patterns when you need optimistic updates, prefetching, dependent queries, or pagination.

See **[TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)** for detailed information on advanced TanStack Query features.

---

## Advanced Usage Patterns

### Optimistic Updates

Update UI immediately before server confirms, with rollback on failure.

**When to Use:**
- Instant feedback improves UX
- Mutation has high success rate (> 95%)
- Multiple UI components show the same data
- Rollback on failure is acceptable

**Implementation:**

```typescript
export function useUpdateDataset() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ identifier, dataset }) =>
      client.updateDataset(identifier, dataset),

    // Before mutation executes
    onMutate: async ({ identifier, dataset }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['dataset', identifier] })

      // Snapshot current value for rollback
      const previousDataset = queryClient.getQueryData(['dataset', identifier])

      // Optimistically update cache
      queryClient.setQueryData(['dataset', identifier], (old) => ({
        ...old,
        ...dataset,
      }))

      // Return context with snapshot
      return { previousDataset }
    },

    // On error, rollback
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ['dataset', variables.identifier],
        context.previousDataset
      )
    },

    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['dataset', variables.identifier],
      })
    },
  })
}
```

### Prefetching

Load data before it's needed to improve perceived performance.

**Use Cases:**
- Hover over links
- Pagination next page
- Predictable user flows

**Example - Prefetch on Hover:**

```typescript
function DatasetLink({ id, title }) {
  const queryClient = useQueryClient()
  const dkanClient = useDkanClient()

  const prefetchDataset = () => {
    queryClient.prefetchQuery({
      queryKey: ['dataset', id],
      queryFn: () => dkanClient.fetchDataset(id),
      staleTime: 5 * 60 * 1000,
    })
  }

  return (
    <a
      href={`/datasets/${id}`}
      onMouseEnter={prefetchDataset}
      onTouchStart={prefetchDataset}
    >
      {title}
    </a>
  )
}
```

**Example - Prefetch Next Page:**

```typescript
function PaginatedDatasets({ page }) {
  const queryClient = useQueryClient()
  const dkanClient = useDkanClient()

  const { data } = useDatasetSearch({
    searchOptions: { 'page-size': 20, page }
  })

  // Prefetch next page
  React.useEffect(() => {
    if (data?.total > (page + 1) * 20) {
      queryClient.prefetchQuery({
        queryKey: ['dataset-search', { 'page-size': 20, page: page + 1 }],
        queryFn: () =>
          dkanClient.searchDatasets({
            searchOptions: { 'page-size': 20, page: page + 1 }
          }),
      })
    }
  }, [page, data])

  return <DatasetList datasets={data?.results || []} />
}
```

### Dependent Queries

Query that depends on data from another query.

**Pattern:**
- Use `enabled` to control query execution
- Load data based on previous query results

**Example:**

```typescript
function DatasetWithData({ datasetId }) {
  // First, fetch dataset metadata
  const { data: dataset } = useDataset({
    identifier: datasetId,
  })

  // Then, fetch datastore data (only if dataset loaded)
  const { data: datastoreData } = useDatastore({
    datasetId,
    index: 0,
    // Disable until dataset loaded
    enabled: !!dataset,
  })

  if (!dataset) return <div>Loading dataset...</div>

  return (
    <div>
      <h1>{dataset.title}</h1>
      {datastoreData ? (
        <DataTable data={datastoreData} />
      ) : (
        <div>Loading data...</div>
      )}
    </div>
  )
}
```

### Parallel Queries

Multiple independent queries execute simultaneously.

**Pattern:**
- Declare multiple queries in same component
- Wait for all to complete or handle individually

**Example:**

```typescript
function DatasetDashboard({ datasetId }) {
  // All queries execute in parallel
  const dataset = useDataset({ identifier: datasetId })
  const datastore = useDatastore({ datasetId, index: 0 })
  const dictionary = useDataDictionary({ identifier: datasetId })
  const statistics = useDatastoreStatistics({ identifier: datasetId })

  // Wait for all to complete
  if (dataset.isLoading || datastore.isLoading ||
      dictionary.isLoading || statistics.isLoading) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <DatasetHeader dataset={dataset.data} />
      <StatisticsPanel stats={statistics.data} />
      <DataDictionaryPanel dictionary={dictionary.data} />
      <DataPreview data={datastore.data} />
    </div>
  )
}
```

---

## Performance Best Practices

### 1. Configure Appropriate Stale Times

Match stale times to data update frequency:

```typescript
// Frequently changing data
const { data } = useHarvestRun({
  runId, planId,
  staleTime: 30 * 1000 // 30 seconds
})

// Moderate updates (default)
const { data } = useDataset({
  identifier: id,
  staleTime: 5 * 60 * 1000 // 5 minutes
})

// Rarely changing data
const { data } = useDataDictionary({
  identifier: id,
  staleTime: 30 * 60 * 1000 // 30 minutes
})

// Static reference data
const { data } = useSchemas({
  staleTime: Infinity // Never goes stale
})
```

### 2. Disable Unnecessary Refetches

```typescript
// Disable refetch on window focus for background data
const { data } = useDatastore({
  datasetId: id,
  refetchOnWindowFocus: false,
})

// Disable refetch on mount for already fresh data
const { data } = useDataset({
  identifier: id,
  refetchOnMount: false,
  staleTime: 10 * 60 * 1000,
})
```

### 3. Use Conditional Queries

Don't fetch until parameters are ready:

```typescript
const { data } = useDatastore({
  datasetId: id,
  enabled: !!id && userHasAccess,
})
```

### 4. Leverage Query Deduplication

Multiple components can safely use same query - only one network request:

```typescript
function ParentComponent() {
  return (
    <div>
      <DatasetHeader id="abc-123" />
      <DatasetBody id="abc-123" />
      <DatasetFooter id="abc-123" />
    </div>
  )
}
// All three components use useDataset({ identifier: 'abc-123' })
// Only ONE request is made
```

### 5. Implement Prefetching

Prefetch likely next actions:

```typescript
// On hover
onMouseEnter={() => queryClient.prefetchQuery(...)}

// Next page in pagination
useEffect(() => prefetchNextPage(), [page])
```

### 6. Manage Cache Size for Large Datasets

```typescript
// For large datasets, use shorter gcTime
const { data } = useDatastore({
  datasetId: id,
  queryOptions: { limit: 10000 },
  gcTime: 60 * 1000, // 1 minute - free memory quickly
})
```

---

## Common Pitfalls and Solutions

### 1. Unstable Query Keys

**Problem:**
```typescript
// New object every render → constant refetching
const { data } = useDatastore({
  datasetId: id,
  queryOptions: { limit: 100 }, // New object!
})
```

**Solution:**
```typescript
const queryOptions = useMemo(() => ({ limit: 100 }), [])
const { data } = useDatastore({
  datasetId: id,
  queryOptions,
})
```

### 2. Missing Dependencies in Query Keys

**Problem:**
```typescript
// Query key doesn't include 'page' → same cache for all pages
queryKey: ['datasets']
queryFn: () => client.searchDatasets({ page })
```

**Solution:**
```typescript
queryKey: ['datasets', page]
queryFn: () => client.searchDatasets({ page })
```

### 3. Not Handling Disabled Queries

**Problem:**
```typescript
// Fetches with undefined ID → error
const { data } = useDataset({ identifier: id })
```

**Solution:**
```typescript
const { data } = useDataset({
  identifier: id || '',
  enabled: !!id,
})
```

### 4. Forgetting Cache Invalidation After Mutations

**Problem:**
```typescript
// Update succeeds but UI shows stale data
const mutation = useMutation({
  mutationFn: (data) => client.updateDataset(id, data),
  // Missing: onSuccess invalidation
})
```

**Solution:**
```typescript
const mutation = useMutation({
  mutationFn: (data) => client.updateDataset(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['dataset', id] })
  },
})
```

### 5. Incorrect gcTime Configuration

**Problem:**
```typescript
// Data removed before it goes stale → no instant stale data
staleTime: 10 * 60 * 1000,
gcTime: 5 * 60 * 1000, // Removed after 5 min, but stale after 10 min!
```

**Solution:**
```typescript
staleTime: 5 * 60 * 1000,
gcTime: 10 * 60 * 1000, // Keep stale data available
```

---
