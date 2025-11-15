# TanStack Query Technology Reference

Reference documentation for TanStack Query patterns and capabilities.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [React Hooks](../frameworks/REACT_HOOKS.md)
- [Vue Composition API](../frameworks/VUE_COMPOSITION_API.md)
- [Architecture](../../ARCHITECTURE.md)

## Quick Reference

**Default Configuration**:
- `staleTime`: 0 (data immediately stale)
- `gcTime`: 5 minutes (cache lifetime when inactive)
- `retry`: 3 attempts
- `refetchOnWindowFocus`: true

**Query States**:
- `isPending` - No data yet (initial load)
- `isFetching` - Currently fetching (initial or background)
- `isSuccess` - Query successful with data
- `isError` - Query failed
- `isStale` - Data exists but needs refresh

**Common Patterns**:
- Queries: Read operations, automatic caching
- Mutations: Write operations, manual invalidation
- Query keys: Arrays for cache identification
- Invalidation: Force refetch on related data changes

**Framework Adapters**:
- React: `@tanstack/react-query` → `useQuery`, `useMutation`
- Vue: `@tanstack/vue-query` → `useQuery`, `useMutation`
- Core: `@tanstack/query-core` → `QueryClient`

**Version Compatibility**:
- This project uses: TanStack Query v5
- Breaking changes from v4 → v5: `cacheTime` → `gcTime`, `isLoading` → `isPending`
- v5 removed deprecated options and improved TypeScript types
- See "Version Migration" section below for details

---

## Overview

TanStack Query is an industry-standard data fetching and caching library that provides automatic caching, background refetching, request deduplication, and sophisticated state management without the complexity of traditional state management libraries.

**Why TanStack Query?**
- Used by thousands of production applications
- Automatic caching with intelligent invalidation
- Built-in request deduplication and cancellation
- Background refetching keeps data fresh
- Framework-agnostic core with adapters for React, Vue, and others
- Handles loading states, errors, and retries automatically
- Reduces boilerplate compared to manual data fetching

**Architecture:**
- Framework-agnostic core (`@tanstack/query-core`)
- Framework-specific adapters (`@tanstack/react-query`, `@tanstack/vue-query`, etc.)
  - See [React Hooks](../frameworks/REACT_HOOKS.md) for React implementation patterns
  - See [Vue Composition API](../frameworks/VUE_COMPOSITION_API.md) for Vue implementation patterns
- QueryClient manages all queries and cache
- Declarative hooks/composables for data fetching

---

## Core Concepts

### Query States

A query can be in one of several states at any given time:

**Loading States:**
- `isPending` - Query has no data yet (initial load)
- `isLoading` - Same as isPending for backward compatibility
- `isFetching` - Query is currently fetching (initial or background)

**Success/Error States:**
- `isSuccess` - Query completed successfully and has data
- `isError` - Query failed with an error
- `isStale` - Data exists but is considered stale (needs refetch)

**Example - Understanding state transitions:**

```typescript
// Initial mount
{ isPending: true, isFetching: true, data: undefined }

// First successful fetch
{ isPending: false, isFetching: false, isSuccess: true, data: [...] }

// Data becomes stale after staleTime
{ isSuccess: true, isStale: true, data: [...] }

// Background refetch triggered
{ isSuccess: true, isStale: true, isFetching: true, data: [...] }

// Background refetch completes
{ isSuccess: true, isStale: false, isFetching: false, data: [...] }
```

### Query Lifecycle

```
Query Created
    ↓
Fetch Data (if enabled)
    ↓
Store in Cache
    ↓
Serve Fresh Data (during staleTime)
    ↓
Mark as Stale (after staleTime)
    ↓
Background Refetch (on refetch triggers)
    ↓
Update Cache
    ↓
Inactive Query (no active observers)
    ↓
Garbage Collection (after gcTime)
```

---

## Caching Strategy

### Default Configuration

TanStack Query defaults:

```typescript
{
  staleTime: 0,                 // Data immediately stale
  gcTime: 5 * 60 * 1000,        // 5 minutes inactive cache lifetime
  retry: 3,                      // 3 retry attempts on failure
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
}
```

### staleTime - Fresh Data Period

**Definition:** Time in milliseconds that data is considered fresh. While fresh, queries won't refetch on mount or window focus.

**Default:** `0` - data is immediately stale

**When to adjust:**

```typescript
// Frequently changing data - keep fresh
const { data } = useQuery({
  queryKey: ['live-stats'],
  queryFn: fetchLiveStats,
  staleTime: 0, // Always refetch
})

// Moderate update frequency
const { data } = useQuery({
  queryKey: ['user-profile'],
  queryFn: fetchUserProfile,
  staleTime: 5 * 60 * 1000, // 5 minutes
})

// Static reference data - cache indefinitely
const { data } = useQuery({
  queryKey: ['country-list'],
  queryFn: fetchCountries,
  staleTime: Infinity, // Never goes stale
})
```

### gcTime - Garbage Collection Time

**Definition:** Time in milliseconds that inactive query data remains in memory before garbage collection.

**Default:** `5 * 60 * 1000` (5 minutes)
**Previously:** Called `cacheTime` in TanStack Query v4

**How it works:**

```typescript
// Query becomes inactive when no components use it
const { data } = useQuery({ queryKey: ['item'], queryFn: fetchItem })
// Component unmounts → query becomes inactive

// After gcTime, data is removed from memory
// Next mount will trigger fresh fetch
```

**Best Practice:** Keep `gcTime >= staleTime` to ensure stale data remains available for instant display while refetching in the background.

```typescript
// Good - cached stale data available
staleTime: 5 * 60 * 1000,
gcTime: 10 * 60 * 1000,

// Bad - data removed before it goes stale
staleTime: 10 * 60 * 1000,
gcTime: 5 * 60 * 1000, // Removed too early!
```

### Stale-While-Revalidate Pattern

TanStack Query implements stale-while-revalidate automatically:

```typescript
// First visit: isPending = true, data = undefined
// Fetches data, stores in cache

// User navigates away, then returns within staleTime
// Second visit: isPending = false, data = cached data (instant!)
// No network request because data is still fresh

// User returns after staleTime expires
// Third visit: data = cached stale data (instant display!)
//              isFetching = true (background refetch)
// Serves stale data immediately, updates when refetch completes
```

This pattern provides instant UI rendering while keeping data fresh.

---

## Query Keys

### Purpose

Query keys serve three critical functions:

1. **Unique Identification** - Each unique key represents a distinct cache entry
2. **Automatic Refetching** - When keys change, new data is fetched
3. **Targeted Invalidation** - Invalidate specific queries or groups of queries

### Query Key Structure

Query keys are arrays that can contain strings, numbers, objects, and nested arrays:

```typescript
// Simple key
['items']

// Key with identifier
['item', 'abc-123']

// Key with parameters
['items', { type: 'active', limit: 100, offset: 0 }]

// Hierarchical keys for organization
['user', 'posts']
['user', 'posts', 123]
['user', 'posts', 123, 'comments']
```

### Query Key Best Practices

**1. Hierarchical Organization**

Structure keys from general to specific for easier invalidation:

```typescript
// Good - hierarchical
['items']                    // All items
['item', id]                 // Specific item
['item', id, 'details']      // Item's details

// Invalidate all item queries
queryClient.invalidateQueries({ queryKey: ['items'] })

// Invalidate only specific item
queryClient.invalidateQueries({ queryKey: ['item', id] })
```

**2. Include All Variables**

Include all variables that affect the query result:

```typescript
// Good - includes all parameters
const { data } = useQuery({
  queryKey: ['items', { type, page, limit }],
  queryFn: () => fetchItems({ type, page, limit }),
})

// Bad - missing parameters
const { data } = useQuery({
  queryKey: ['items'],
  queryFn: () => fetchItems({ type, page, limit }),
})
// Different type/page/limit would use same cache entry!
```

**3. Stable Object References**

Objects in query keys are compared by deep equality:

```typescript
// Good - stable options object
const filters = useMemo(() => ({
  type: 'active',
  limit: 100
}), [])

const { data } = useQuery({
  queryKey: ['items', filters],
  queryFn: () => fetchItems(filters),
})

// Bad - new object every render
const { data } = useQuery({
  queryKey: ['items', { type: 'active', limit: 100 }],
  queryFn: () => fetchItems({ type: 'active', limit: 100 }),
})
// New object → unnecessary refetch!
```

**4. Type-Safe Keys with `as const`**

Use `as const` for literal types:

```typescript
function useItem(id: string) {
  return useQuery({
    queryKey: ['item', id] as const,
    queryFn: () => fetchItem(id),
  })
}
```

---

## Request Deduplication

### How It Works

TanStack Query automatically deduplicates identical requests:

```typescript
// Component A
const { data } = useQuery({ queryKey: ['item', 'abc-123'], queryFn: fetchItem })

// Component B (mounted simultaneously)
const { data } = useQuery({ queryKey: ['item', 'abc-123'], queryFn: fetchItem })

// Only ONE network request is made
// Both components receive the same data
// Both loading states are synchronized
```

**Implementation:**
- TanStack Query uses promise-based deduplication
- Identical query keys share the same promise
- All observers receive the same result
- Network requests are never duplicated within the same render cycle

### Deduplication with Different Options

When multiple components request the same data with different options, TanStack Query takes the most pessimistic values:

```typescript
// Component A
const { data } = useQuery({
  queryKey: ['item', '123'],
  queryFn: fetchItem,
  staleTime: 10 * 60 * 1000, // 10 minutes
})

// Component B
const { data } = useQuery({
  queryKey: ['item', '123'],
  queryFn: fetchItem,
  staleTime: 5 * 60 * 1000, // 5 minutes
})

// Effective staleTime: 5 minutes (most pessimistic)
// Both components refetch when data is stale after 5 minutes
```

### Request Cancellation

TanStack Query automatically cancels in-flight requests when:

1. **Component unmounts** - No longer needed
2. **Query key changes** - New request supersedes old one
3. **Query is invalidated** - Fresh data requested

```typescript
// User types in search box
const [keyword, setKeyword] = useState('')

const { data } = useQuery({
  queryKey: ['search', keyword],
  queryFn: () => searchItems(keyword),
})

// User types: "test" → request starts
// User types: "testing" → previous request cancelled, new request starts
// User types: "testing data" → previous request cancelled, new one starts
```

**Implementation:** Cancellation uses `AbortController` in the fetch API, automatically handled by TanStack Query.

---

## Background Refetching

### Automatic Refetch Triggers

TanStack Query automatically refetches stale queries when:

**1. Window Focus (default: enabled)**

```typescript
// User switches browser tabs and returns
// All stale queries refetch to show fresh data

// Disable for specific query
const { data } = useQuery({
  queryKey: ['item', id],
  queryFn: fetchItem,
  refetchOnWindowFocus: false,
})
```

**2. Component Mount (default: enabled)**

```typescript
// Component mounts
// Stale queries refetch, fresh queries use cache

// Disable for specific query
const { data } = useQuery({
  queryKey: ['item', id],
  queryFn: fetchItem,
  refetchOnMount: false,
})
```

**3. Network Reconnect (default: enabled)**

```typescript
// User loses internet connection, then reconnects
// All stale queries refetch

// Disable for specific query
const { data } = useQuery({
  queryKey: ['item', id],
  queryFn: fetchItem,
  refetchOnReconnect: false,
})
```

**4. Interval Polling**

```typescript
// Refetch every 30 seconds
const { data } = useQuery({
  queryKey: ['live-data'],
  queryFn: fetchLiveData,
  refetchInterval: 30 * 1000,
})

// Conditional interval
const { data } = useQuery({
  queryKey: ['process', id],
  queryFn: () => fetchProcess(id),
  refetchInterval: (data) =>
    data?.status === 'running' ? 5000 : false,
})
```

### Manual Refetching

```typescript
const { data, refetch, isRefetching } = useQuery({
  queryKey: ['item', id],
  queryFn: () => fetchItem(id),
})

// Manual refresh button
<button onClick={() => refetch()} disabled={isRefetching}>
  {isRefetching ? 'Refreshing...' : 'Refresh'}
</button>
```

### Background Refetch States

```typescript
const { data, isFetching, isRefetching } = useQuery({
  queryKey: ['item', id],
  queryFn: () => fetchItem(id),
})

// isFetching: true during any fetch (initial or background)
// isRefetching: true only during background refetches (when data exists)

if (isFetching && !data) {
  // Initial loading
  return <Spinner />
}

if (data) {
  return (
    <div>
      {isFetching && <div className="refetch-indicator">Updating...</div>}
      <DataDisplay data={data} />
    </div>
  )
}
```

---

## Query Invalidation

### Invalidation vs Removal

**Invalidation:**
- Marks queries as stale
- Triggers refetch for active queries
- Keeps data in cache
- Better user experience (instant old data while refetching)

**Removal:**
- Deletes queries from cache
- Frees memory
- Next access requires fresh fetch
- Use for sensitive data or memory management

### Invalidation Patterns

**1. Prefix Matching**

Invalidate all queries with matching prefix:

```typescript
// Invalidate all item queries
await queryClient.invalidateQueries({ queryKey: ['items'] })
// Invalidates: ['items'], ['item', '123'], etc.

// Invalidate specific item
await queryClient.invalidateQueries({ queryKey: ['item', '123'] })
// Invalidates: ['item', '123'] and any nested keys
```

**2. Exact Matching**

Use `exact: true` for precise invalidation:

```typescript
// Only invalidate the item list, not individual items
await queryClient.invalidateQueries({
  queryKey: ['items'],
  exact: true,
})
// Invalidates: ['items']
// Does NOT invalidate: ['item', '123']
```

**3. Predicate Functions**

Custom logic for complex invalidation:

```typescript
// Invalidate all queries for a specific resource
await queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'item' &&
    query.queryKey[1] === resourceId,
})
```

**4. Refetch Type Options**

Control which queries actually refetch:

```typescript
// Default: refetch only active queries
await queryClient.invalidateQueries({ queryKey: ['items'] })

// Refetch all matching queries (including inactive)
await queryClient.invalidateQueries({
  queryKey: ['items'],
  refetchType: 'all',
})

// Only mark as stale, don't refetch
await queryClient.invalidateQueries({
  queryKey: ['items'],
  refetchType: 'none',
})
```

### Invalidation After Mutations

Standard pattern for keeping data fresh:

```typescript
const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: () => {
    // Invalidate and refetch item list
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
})

const updateMutation = useMutation({
  mutationFn: ({ id, data }) => updateItem(id, data),
  onSuccess: (data, variables) => {
    // Invalidate specific item
    queryClient.invalidateQueries({
      queryKey: ['item', variables.id],
    })
    // Also invalidate list views
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
})

const deleteMutation = useMutation({
  mutationFn: deleteItem,
  onSuccess: (data, id) => {
    // Remove deleted item from cache
    queryClient.removeQueries({ queryKey: ['item', id] })
    // Invalidate list to remove deleted item
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
})
```

---

## Garbage Collection and Memory Management

### How Garbage Collection Works

```
Active Query (component using it)
    ↓
Component Unmounts
    ↓
Query becomes Inactive
    ↓
Start gcTime countdown (default: 5 minutes)
    ↓
gcTime expires
    ↓
Query removed from memory
```

### Managing Memory

**1. Adjust gcTime for Different Use Cases**

```typescript
// Keep frequently accessed data longer
const { data } = useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  gcTime: 30 * 60 * 1000, // 30 minutes
})

// Release memory quickly for large datasets
const { data } = useQuery({
  queryKey: ['large-dataset', id],
  queryFn: () => fetchLargeDataset(id),
  gcTime: 60 * 1000, // 1 minute
})

// Never garbage collect critical data
const { data } = useQuery({
  queryKey: ['app-settings'],
  queryFn: fetchAppSettings,
  gcTime: Infinity,
})
```

**2. Manual Cache Management**

```typescript
// Clear all cached data (e.g., on logout)
queryClient.clear()

// Remove specific queries
queryClient.removeQueries({ queryKey: ['items'] })

// Check cache size
const cache = queryClient.getQueryCache()
const allQueries = cache.getAll()
console.log(`Cached queries: ${allQueries.length}`)
```

**3. Monitor Cache**

```typescript
// Get cache statistics
const cache = queryClient.getQueryCache()
const queries = cache.findAll({ queryKey: ['items'] })

queries.forEach(query => {
  console.log('Query key:', query.queryKey)
  console.log('State:', query.state.status)
  console.log('Data age:', Date.now() - query.state.dataUpdatedAt)
  console.log('Observers:', query.getObserversCount())
})
```

### Memory Leaks Prevention

TanStack Query prevents common memory leaks:

1. **Automatic cleanup** - Unused queries are garbage collected
2. **Query cancellation** - In-flight requests cancelled on unmount
3. **Observer tracking** - Queries know when they're not needed
4. **Weak references** - Queries don't prevent garbage collection of components

---

## Performance Considerations

Understanding the performance implications of different TanStack Query configurations.

### Cache Size Management

#### Monitoring Cache Size

The in-memory query cache grows as users navigate your application. Monitor cache size to prevent excessive memory usage.

**Checking Current Cache Size:**

```typescript
import { useQueryClient } from '@tanstack/react-query'

function CacheMonitor() {
  const queryClient = useQueryClient()

  const cacheSize = queryClient.getQueryCache().getAll().length
  const mutationCacheSize = queryClient.getMutationCache().getAll().length

  console.log(`Queries in cache: ${cacheSize}`)
  console.log(`Mutations in cache: ${mutationCacheSize}`)

  return <div>Cache entries: {cacheSize}</div>
}
```

**Memory Usage Patterns:**

| Cache Entries | Est. Memory | Use Case |
|---------------|-------------|----------|
| 0-50 | <5 MB | Small app, few queries |
| 50-200 | 5-20 MB | Medium app, normal usage |
| 200-500 | 20-50 MB | Large app, heavy navigation |
| 500+ | 50+ MB | May need optimization |

**When to Be Concerned:**
- Cache growing beyond 500 entries
- Users report slow performance on lower-end devices
- Memory profiling shows TanStack Query using >100 MB
- App crashes on mobile devices

---

#### Cache Size Strategies

Different `gcTime` strategies for memory management:

**Aggressive Garbage Collection (Memory-Constrained Apps):**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1 * 60 * 1000, // 1 minute
      staleTime: 30 * 1000,  // 30 seconds
    },
  },
})
```

**Trade-offs:**
- ✅ Lower memory usage
- ✅ Better for mobile devices
- ❌ More network requests
- ❌ Users see loading states more often

**Conservative Garbage Collection (Fast Navigation Apps):**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 30 * 60 * 1000, // 30 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})
```

**Trade-offs:**
- ✅ Instant back navigation
- ✅ Fewer network requests
- ✅ Better UX for power users
- ❌ Higher memory usage
- ❌ May accumulate stale data

**Per-Query Configuration:**

```typescript
// Long-lived reference data
useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: Infinity,    // Never refetch
  gcTime: Infinity,       // Never garbage collect
})

// Frequently changing data
useQuery({
  queryKey: ['liveStock', symbol],
  queryFn: () => fetchStock(symbol),
  staleTime: 0,           // Always stale
  gcTime: 2 * 60 * 1000,  // Clean up after 2 minutes
})
```

---

### staleTime Trade-offs

The `staleTime` setting balances data freshness vs network efficiency.

#### Network Impact vs Freshness

**Comparison Table:**

| staleTime | Network Requests | Data Freshness | Use Case |
|-----------|------------------|----------------|----------|
| `0` (default) | High - refetch on every mount | Maximum | Live data, stock prices |
| `30s - 1m` | Moderate | Good | Frequently updated content |
| `5m - 15m` | Low | Acceptable | Most application data |
| `30m - 1h` | Very Low | Delayed | Infrequently changed data |
| `Infinity` | Minimal - only on invalidation | Potentially stale | Static reference data |

**Example Scenarios:**

```typescript
// Dashboard with live metrics - always fresh
useQuery({
  queryKey: ['dashboard', 'metrics'],
  queryFn: fetchMetrics,
  staleTime: 0,
  refetchInterval: 30 * 1000, // Refetch every 30s
})
// Network: ~120 requests/hour

// E-commerce product catalog - balanced
useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000, // 5 minutes
})
// Network: ~12 requests/hour (if viewed frequently)

// User profile - rarely changes
useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 30 * 60 * 1000, // 30 minutes
})
// Network: ~2 requests/hour

// Country list - never changes
useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: Infinity,
})
// Network: 1 request per session
```

---

#### Real-World staleTime Recommendations

Recommended `staleTime` values by data type:

| Data Type | staleTime | Reasoning |
|-----------|-----------|-----------|
| User authentication state | 5-10 minutes | Balance security vs UX |
| Search results | 2-5 minutes | Results may change frequently |
| Dataset catalog | 5-15 minutes | Datasets updated periodically |
| Dataset metadata | 10-30 minutes | Metadata rarely changes |
| Datastore query results | 5-10 minutes | Data may be updated |
| Reference data (themes, etc.) | Infinity | Truly static data |
| User preferences | 15-30 minutes | Changed infrequently |
| Activity feeds | 1-2 minutes | Frequent updates expected |

**Implementation Example:**

```typescript
// src/config/queryDefaults.ts
export const STALE_TIMES = {
  LIVE_DATA: 0,
  REALTIME: 30 * 1000,           // 30 seconds
  FREQUENTLY_UPDATED: 2 * 60 * 1000,  // 2 minutes
  NORMAL: 5 * 60 * 1000,         // 5 minutes
  INFREQUENT: 15 * 60 * 1000,    // 15 minutes
  RARE: 30 * 60 * 1000,          // 30 minutes
  STATIC: Infinity,
}

// Usage
useQuery({
  queryKey: ['datasets'],
  queryFn: fetchDatasets,
  staleTime: STALE_TIMES.NORMAL,
})
```

---

### Query Key Granularity

Query key structure affects cache efficiency and performance.

#### Performance Impact

**Too Broad - Unnecessary Refetches:**

```typescript
// ❌ Single key for all products
useQuery({
  queryKey: ['products'],
  queryFn: () => fetchProducts(filters),
})
// Problem: Changing filters requires manual refetch
// or cache invalidation affecting all product queries
```

**Too Specific - Cache Fragmentation:**

```typescript
// ❌ Includes timestamp in key
useQuery({
  queryKey: ['products', filters, Date.now()],
  queryFn: () => fetchProducts(filters),
})
// Problem: Every render creates new cache entry
// Memory grows unbounded, no cache hits
```

**Optimal Granularity:**

```typescript
// ✅ Include relevant filter parameters
useQuery({
  queryKey: ['products', { category, search, page }],
  queryFn: () => fetchProducts({ category, search, page }),
  staleTime: 5 * 60 * 1000,
})
// Benefit: Separate cache per filter combination
// Navigate back = instant load from cache
```

---

### Optimization Guidance

#### Best Practices Checklist

**Query Configuration:**
- ✅ Set appropriate `staleTime` for each query type
- ✅ Use `gcTime` to control memory footprint
- ✅ Enable background refetching for important data
- ✅ Disable refetching for static reference data
- ✅ Use `select` to prevent re-renders from unchanged data

**Query Keys:**
- ✅ Include all parameters that affect the result
- ✅ Use stable objects/primitives (not Date.now(), Math.random())
- ✅ Order keys consistently: `['resource', id, { filters }]`
- ✅ Don't include UI state in query keys

**Memory Management:**
- ✅ Monitor cache size in production
- ✅ Set conservative `gcTime` for mobile apps
- ✅ Invalidate queries when data changes server-side
- ✅ Remove unused queries with `queryClient.removeQueries()`

**Network Optimization:**
- ✅ Batch related queries together
- ✅ Prefetch data for likely navigation paths
- ✅ Use `keepPreviousData` for pagination
- ✅ Implement proper loading states to avoid UX issues

---

#### Anti-Patterns to Avoid

**Over-Fetching:**

```typescript
// ❌ Fetching too much data
useQuery({
  queryKey: ['allDatasets'],
  queryFn: () => fetchAllDatasets(), // Could be 10,000+ datasets
})

// ✅ Fetch only what's needed
useQuery({
  queryKey: ['datasets', { page, pageSize }],
  queryFn: () => fetchDatasets({ page, pageSize }),
})
```

**Over-Invalidating:**

```typescript
// ❌ Invalidating all queries
queryClient.invalidateQueries() // Refetches EVERYTHING

// ✅ Invalidate only affected queries
queryClient.invalidateQueries({
  queryKey: ['datasets', datasetId]
})
```

**Ignoring staleTime:**

```typescript
// ❌ Using default staleTime for everything
useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  // staleTime: 0 (default) - refetches static data unnecessarily
})

// ✅ Match staleTime to data characteristics
useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: Infinity, // Static data
})
```

**Not Monitoring in Production:**

```typescript
// ❌ No visibility into cache behavior

// ✅ Add monitoring
const queryCache = queryClient.getQueryCache()
queryCache.subscribe((event) => {
  if (event.type === 'added') {
    console.log('Cache size:', queryCache.getAll().length)
  }
})

// Or use DevTools in development
```

---

#### Production Monitoring

Track these metrics to optimize performance:

**Key Metrics:**

| Metric | How to Track | Healthy Range |
|--------|--------------|---------------|
| Cache size | `queryCache.getAll().length` | <200 entries |
| Cache hit rate | Track refetch vs cache use | >60% hits |
| Average query time | DevTools or custom logging | <500ms |
| Memory usage | Browser DevTools Memory tab | <50 MB for TanStack Query |
| Failed requests | Error boundary / logging | <1% failure rate |

**Implementation Example:**

```typescript
// Log query cache stats periodically
useEffect(() => {
  const interval = setInterval(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()

    const stats = {
      total: queries.length,
      active: queries.filter(q => q.getObserversCount() > 0).length,
      stale: queries.filter(q => q.isStale()).length,
      fetching: queries.filter(q => q.isFetching()).length,
    }

    console.log('Query Cache Stats:', stats)

    // Send to analytics service
    analytics.track('query_cache_stats', stats)
  }, 60 * 1000) // Every minute

  return () => clearInterval(interval)
}, [])
```

**When to Adjust Configuration:**

- **Cache growing >500 entries**: Reduce `gcTime`
- **High network usage**: Increase `staleTime`
- **Stale data complaints**: Reduce `staleTime` or add refetch triggers
- **Slow navigation**: Increase `gcTime` and use prefetching
- **Memory issues**: Reduce `gcTime` and implement query removal

---

## Debugging

### TanStack Query DevTools

**React:**
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**Vue:**
```typescript
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

app.use(VueQueryPlugin, { queryClient })
app.component('VueQueryDevtools', VueQueryDevtools)
```

**DevTools Features:**
- View all queries and their states
- Inspect query data and metadata
- Manually trigger refetches
- Monitor cache size and memory usage
- Track query timelines

### Cache Inspection

```typescript
// Get all cached queries
const cache = queryClient.getQueryCache()
const queries = cache.getAll()

queries.forEach(query => {
  console.log({
    key: query.queryKey,
    status: query.state.status,
    dataUpdatedAt: new Date(query.state.dataUpdatedAt),
    observers: query.getObserversCount(),
    isStale: query.isStale(),
  })
})

// Find specific queries
const itemQueries = cache.findAll({ queryKey: ['items'] })
console.log(`Item queries: ${itemQueries.length}`)
```

### Logging Query Activity

```typescript
// Add global query event listeners
queryClient.getQueryCache().subscribe((event) => {
  console.log('Query event:', event.type, event.query.queryKey)
})

// Track mutations
queryClient.getMutationCache().subscribe((event) => {
  console.log('Mutation event:', event.type, event.mutation)
})
```

---

## Version Migration

### TanStack Query v4 → v5

This project uses **TanStack Query v5**. Key breaking changes from v4:

**Property Renames**:

```typescript
// v4
useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  cacheTime: 5 * 60 * 1000,  // ❌ v4 property
})

// v5
useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  gcTime: 5 * 60 * 1000,     // ✅ v5 property (garbage collection time)
})
```

**State Property Changes**:

```typescript
// v4
const { isLoading, isFetching } = useQuery(...)

// isLoading: true when no data AND fetching
// isFetching: true when fetching (any time)

// v5
const { isPending, isFetching, isLoading } = useQuery(...)

// isPending: true when no data AND fetching (new primary property)
// isFetching: true when fetching (any time) - unchanged
// isLoading: deprecated alias for isPending (kept for compatibility)
```

**Behavior Changes**:

1. **Query keys must be arrays** (was already best practice):
```typescript
// v4 - string keys worked
useQuery('items', fetchItems) // Deprecated

// v5 - array keys required
useQuery({ queryKey: ['items'], queryFn: fetchItems }) // Required
```

2. **Object syntax preferred** (v4 had multiple overloads):
```typescript
// v4 - multiple syntax options
useQuery('items', fetchItems, { staleTime: 1000 })
useQuery(['items'], fetchItems, { staleTime: 1000 })

// v5 - single object syntax
useQuery({ queryKey: ['items'], queryFn: fetchItems, staleTime: 1000 })
```

3. **Removed deprecated options**:
- `cacheTime` → `gcTime`
- `useErrorBoundary` → `throwOnError`
- `onSuccess`, `onError`, `onSettled` callbacks removed from useQuery (use mutations or separate effects)
- `structuralSharing` option simplified

**TypeScript Improvements**:

v5 has better type inference and stricter types:

```typescript
// v5 infers data types better
const { data } = useQuery({
  queryKey: ['item', id],
  queryFn: () => fetchItem(id),
  // data is automatically typed based on fetchItem return type
})

// Better discriminated unions for states
if (isPending) {
  // TypeScript knows data is undefined here
} else if (isError) {
  // TypeScript knows error is defined here
} else {
  // TypeScript knows data is defined here
}
```

**Migration Checklist**:

- [ ] Replace `cacheTime` with `gcTime`
- [ ] Replace `isLoading` with `isPending` (or keep using `isLoading` as alias)
- [ ] Use object syntax for all queries
- [ ] Remove `onSuccess`, `onError`, `onSettled` from queries (keep in mutations)
- [ ] Replace `useErrorBoundary` with `throwOnError`
- [ ] Ensure all query keys are arrays
- [ ] Update TypeScript types if using custom types

**Official Migration Guide**: https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5

---

## Troubleshooting

### Infinite Refetch Loops

**Problem**: Query refetches continuously without stopping.

**Common Causes**:

1. **Unstable query key** - Query key changes on every render:
```typescript
// ❌ Bad - Creates new array on every render
useQuery({
  queryKey: ['items', { filter: value }], // New object reference each time
  queryFn: fetchItems,
})

// ✅ Good - Stable query key
useQuery({
  queryKey: ['items', value], // Primitive value
  queryFn: () => fetchItems({ filter: value }),
})
```

2. **Query key depends on query data**:
```typescript
// ❌ Bad - Query key changes when data changes
const { data } = useQuery({
  queryKey: ['item', data?.id], // data changes → key changes → refetch
  queryFn: fetchItem,
})

// ✅ Good - Use separate queries
const { data: listData } = useQuery({ queryKey: ['list'], queryFn: fetchList })
const { data: itemData } = useQuery({
  queryKey: ['item', listData?.id],
  queryFn: () => fetchItem(listData.id),
  enabled: !!listData?.id,
})
```

3. **State updates in onSuccess callback**:
```typescript
// ❌ Bad - State change triggers re-render and new query
useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  onSuccess: (data) => {
    setFilteredItems(data.filter(...)) // Re-render → new query key if unstable
  },
})

// ✅ Good - Use derived state or useMemo
const { data } = useQuery({ queryKey: ['items'], queryFn: fetchItems })
const filteredItems = useMemo(() => data?.filter(...), [data])
```

**Debugging**:
- Enable React Query DevTools to watch query activity
- Check if query key is stable using `console.log(queryKey)`
- Look for component re-renders that trigger new queries

### Query Not Refetching

**Problem**: Query shows stale data and doesn't refetch when expected.

**Common Causes**:

1. **staleTime too high**:
```typescript
// Data considered fresh for 10 minutes
useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  staleTime: 10 * 60 * 1000, // Won't refetch for 10 minutes
})

// Solution: Reduce staleTime or force refetch
refetch() // Manual refetch
queryClient.invalidateQueries({ queryKey: ['items'] }) // Mark as stale
```

2. **Query is disabled**:
```typescript
// Query won't run if enabled is false
useQuery({
  queryKey: ['item', id],
  queryFn: () => fetchItem(id),
  enabled: !!id, // Query disabled when id is falsy
})
```

3. **refetchOnWindowFocus disabled**:
```typescript
// Query won't refetch on window focus
useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  refetchOnWindowFocus: false, // Default is true
})
```

**Solutions**:
- Check `staleTime` configuration (default: 0)
- Verify `enabled` condition evaluates to true
- Use `refetch()` for manual refetching
- Invalidate queries after mutations

### Cache Not Updating After Mutations

**Problem**: UI doesn't reflect changes after create/update/delete operations.

**Common Causes**:

1. **Missing invalidation**:
```typescript
// ❌ Bad - No cache invalidation
const mutation = useMutation({
  mutationFn: createItem,
  // Cache still shows old data
})

// ✅ Good - Invalidate related queries
const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
})
```

2. **Invalidation timing issues**:
```typescript
// ❌ Bad - Invalidate before mutation completes
const mutation = useMutation({
  mutationFn: async (data) => {
    queryClient.invalidateQueries({ queryKey: ['items'] }) // Too early!
    return createItem(data)
  },
})

// ✅ Good - Invalidate in onSuccess
const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
})
```

3. **Query key mismatch**:
```typescript
// Query uses key ['items', 'active']
useQuery({ queryKey: ['items', 'active'], queryFn: fetchActiveItems })

// ❌ Bad - Invalidates different key
queryClient.invalidateQueries({ queryKey: ['items'] }) // Only exact match

// ✅ Good - Invalidate with prefix matching
queryClient.invalidateQueries({
  queryKey: ['items'],
  refetchType: 'active', // Refetch active queries
})
```

**Solutions**:
- Always invalidate in `onSuccess` callback
- Use query key prefixes for related queries
- Consider optimistic updates for immediate feedback
- Use `setQueryData` for direct cache updates

### Query State Confusion

**Problem**: Unclear when to use `isPending`, `isLoading`, `isFetching`, or `isStale`.

**State Explanations**:

```typescript
const { isPending, isLoading, isFetching, isStale } = useQuery({
  queryKey: ['item'],
  queryFn: fetchItem,
})
```

**TanStack Query v5 States**:

- **`isPending`** - No cached data AND currently fetching
  - First load with no data
  - Use for: Initial loading spinners

- **`isFetching`** - Query is fetching (any time)
  - True during background refetches
  - Use for: Loading indicators that show during refetches

- **`isLoading`** - Same as `isPending` (deprecated alias in v5)
  - Use `isPending` in new code

- **`isStale`** - Data is older than `staleTime`
  - True when data needs refetching
  - Doesn't mean query will refetch immediately

**Common Patterns**:

```typescript
// Show spinner only on initial load
{isPending && <Spinner />}

// Show data with loading indicator during refetch
{data && (
  <div>
    {isFetching && <RefreshIcon />}
    <DataView data={data} />
  </div>
)}

// Handle all states
{isPending && <Spinner />}
{isError && <Error error={error} />}
{isSuccess && <DataView data={data} />}
```

### Performance Issues

**Problem**: Too many refetches or slow query performance.

**Solutions**:

1. **Reduce unnecessary refetches**:
```typescript
// Default behavior refetches often
useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  // Refetches on: mount, window focus, network reconnect
})

// Tune refetch behavior
useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
  refetchOnWindowFocus: false, // Don't refetch on focus
  refetchOnMount: false, // Don't refetch on mount if data exists
})
```

2. **Optimize query keys for granularity**:
```typescript
// ❌ Bad - Invalidates all items
queryClient.invalidateQueries({ queryKey: ['items'] })

// ✅ Good - Invalidate only specific item
queryClient.invalidateQueries({ queryKey: ['items', itemId] })
```

3. **Use select to prevent unnecessary re-renders**:
```typescript
// Component re-renders whenever ANY data changes
const { data } = useQuery({ queryKey: ['items'], queryFn: fetchItems })

// Component only re-renders when selected data changes
const { data: itemCount } = useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  select: (data) => data.length, // Only re-render if length changes
})
```

4. **Monitor cache size**:
```typescript
// Check cache size in DevTools or programmatically
const cache = queryClient.getQueryCache()
console.log(`Cached queries: ${cache.getAll().length}`)

// Reduce gcTime (garbage collection time) for less-used queries
useQuery({
  queryKey: ['temporary-data'],
  queryFn: fetchTempData,
  gcTime: 5 * 60 * 1000, // Clean up after 5 minutes of no observers
})
```

**Debugging Tips**:

1. **Enable query logging**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Log query lifecycle
      onSuccess: (data) => console.log('Query success:', data),
      onError: (error) => console.error('Query error:', error),
    },
  },
})
```

2. **Use React Query DevTools**:
- Watch query state transitions
- Track refetch frequency
- Monitor cache memory usage
- Inspect query timelines

3. **Check network tab**:
- Verify request deduplication
- Monitor request timing
- Check for duplicate requests (indicates unstable query key)

### Memory Leaks

**Problem**: Memory usage grows over time.

**Common Causes**:

1. **Long gcTime with many queries**:
```typescript
// Queries stay in cache for 24 hours
useQuery({
  queryKey: ['item', id],
  queryFn: () => fetchItem(id),
  gcTime: 24 * 60 * 60 * 1000, // Very long
})

// Solution: Reduce gcTime for frequently-created queries
gcTime: 5 * 60 * 1000, // 5 minutes
```

2. **Not cleaning up query client**:
```typescript
// In tests or dynamic apps, clear cache when done
queryClient.clear() // Remove all queries
queryClient.removeQueries({ queryKey: ['temporary'] }) // Remove specific queries
```

**Prevention**:
- Use reasonable `gcTime` values (default: 5 minutes)
- Clear cache when unmounting major sections
- Monitor cache size in production

---

## References

- **TanStack Query Documentation**: https://tanstack.com/query/latest
- **TanStack Query v5 Guide**: https://tanstack.com/query/v5/docs/framework/react/overview
- **Query Invalidation Guide**: https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation
- **Caching Examples**: https://tanstack.com/query/v5/docs/framework/react/guides/caching
- **Optimistic Updates**: https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates
- **Important Defaults**: https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults
