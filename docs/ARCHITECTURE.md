# DKAN Client Tools Architecture

Technical documentation about the design and implementation of DKAN Client Tools.

## Overview

DKAN Client Tools is a monorepo of packages for building frontend applications that interact with DKAN data catalogs. The project is built on TanStack Query for robust data fetching, caching, and state management.

**Core Principle:** Provide framework-agnostic core with framework-specific adapters.

---

## Package Structure

```
@dkan-client-tools/
├── core/          # Framework-agnostic foundation
├── react/         # React hooks adapter
└── vue/           # Vue composables adapter
```

### Dependency Flow

```
React App
    ↓
@dkan-client-tools/react
    ↓
@dkan-client-tools/core
    ↓
TanStack Query Core
    ↓
DKAN REST APIs
```

```
Vue App
    ↓
@dkan-client-tools/vue
    ↓
@dkan-client-tools/core
    ↓
TanStack Query Core
    ↓
DKAN REST APIs
```

---

## Core Package Architecture

### Purpose

Provide framework-agnostic foundation for DKAN client libraries.

### Key Components

**1. DkanClient**
- Wraps TanStack Query's `QueryClient`
- Provides DKAN-specific default configuration
- Entry point for framework adapters

**2. DkanApiClient**
- HTTP client for all DKAN REST API endpoints
- Handles authentication (Basic Auth, Bearer tokens)
- Implements retry logic with exponential backoff
- Throws typed errors (`DkanApiError`)

**3. TypeScript Types**
- DCAT-US schema types for datasets
- Frictionless Table Schema types for data dictionaries
- API request/response types
- Datastore query types
- Harvest plan types
- Metastore revision types

### Design Decisions

**Why TanStack Query?**
- Industry-standard data fetching library
- Automatic caching and deduplication
- Background refetching and stale-while-revalidate
- Request cancellation and garbage collection
- Proven reliability with extensive testing
- Framework adapters already exist for React/Vue/etc.

**Why Separate API Client?**
- Direct API access for server-side use cases
- Testing without Query Client overhead
- Custom integrations outside TanStack Query
- Clear separation of concerns

**HTTP Client Choice:**
- Uses native `fetch()` API
- No external HTTP library dependencies
- Works in browsers and Node.js 18+
- Standard Promise-based interface

---

## React Package Architecture

### Purpose

Provide idiomatic React hooks for all DKAN APIs with automatic caching.

### Foundation

Built on **TanStack React Query** (`@tanstack/react-query`).

### Components

**1. DkanClientProvider**
- React Context Provider
- Wraps application with `QueryClientProvider`
- Provides `DkanClient` instance to all hooks

**2. useDkanClient**
- Context hook to access `DkanClient` instance
- Used internally by all other hooks

**3. Query Hooks**
- Wrap TanStack Query's `useQuery`
- Provide DKAN-specific query keys
- Handle parameter transformation
- Examples: `useDataset`, `useDatasetSearch`, `useDatastore`

**4. Mutation Hooks**
- Wrap TanStack Query's `useMutation`
- Handle create/update/delete operations
- Automatic cache invalidation
- Examples: `useCreateDataset`, `useDeleteDataset`

### Hook Pattern

All query hooks follow this pattern:

```typescript
export function useDataset(options: UseDatasetOptions) {
  const dkanClient = useDkanClient()

  return useQuery({
    queryKey: ['dataset', options.identifier],
    queryFn: () => dkanClient.getDataset(options.identifier),
    enabled: options.enabled !== false && !!options.identifier,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
  })
}
```

**Key Elements:**
1. Access client via `useDkanClient()`
2. Define stable query key (array)
3. Call API method in `queryFn`
4. Handle `enabled` for conditional fetching
5. Provide sensible `staleTime` default

### Mutation Pattern

All mutation hooks follow this pattern:

```typescript
export function useCreateDataset() {
  const dkanClient = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dataset: DkanDataset) =>
      dkanClient.createDataset(dataset),
    onSuccess: () => {
      // Invalidate dataset list queries
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    }
  })
}
```

**Key Elements:**
1. Access client and query client
2. Define mutation function
3. Invalidate related queries on success
4. Optional callbacks (onSuccess, onError)

---

## Vue Package Architecture

### Purpose

Provide idiomatic Vue 3 composables for all DKAN APIs with reactive parameters.

### Foundation

Built on **TanStack Vue Query** (`@tanstack/vue-query`).

### Components

**1. DkanClientPlugin**
- Vue 3 plugin for global installation
- Provides `DkanClient` instance via `provide/inject`
- Sets up `VueQueryPlugin`

**2. useDkanClient**
- Injection composable to access `DkanClient` instance
- Uses Vue's `inject()` API
- Used internally by all other composables

**3. Query Composables**
- Wrap TanStack Query's `useQuery`
- Support reactive parameters with `MaybeRefOrGetter`
- Automatic reactivity with computed query keys
- Examples: `useDataset`, `useDatasetSearch`, `useDatastore`

**4. Mutation Composables**
- Wrap TanStack Query's `useMutation`
- Handle create/update/delete operations
- Automatic cache invalidation
- Examples: `useCreateDataset`, `useDeleteDataset`

### Composable Pattern

All query composables follow this pattern:

```typescript
export function useDataset(options: UseDatasetOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => ['dataset', toValue(options.identifier)]),
    queryFn: () => client.getDataset(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
  })
}
```

**Key Elements:**
1. Access client via `useDkanClient()`
2. Use `computed()` for reactive query key
3. Use `toValue()` to unwrap refs/getters
4. Handle reactive `enabled` option
5. Provide sensible `staleTime` default

**Reactive Parameters:**
- Accept `MaybeRefOrGetter<T>` types
- Support refs, computed, and getter functions
- Automatically trigger refetch on parameter changes

### Vue vs React Differences

| Aspect | React | Vue |
|--------|-------|-----|
| Return values | Direct values | Reactive refs |
| Parameters | Static or callbacks | `MaybeRefOrGetter` |
| Query keys | Static arrays | `computed()` arrays |
| Template usage | Direct access | No `.value` needed |

---

## Build System

### Build Tools

- **tsup** - TypeScript to JavaScript compiler
- **TypeScript** - Type checking and .d.ts generation
- **Vite** - Development server for examples

### Build Outputs

Each package generates multiple formats:

**1. ESM (ES Modules)**
- File: `dist/index.js`
- For: Modern bundlers (Vite, webpack, etc.)
- Tree-shakeable

**2. CommonJS**
- File: `dist/index.cjs`
- For: Node.js require()
- Server-side usage

**3. TypeScript Declarations**
- File: `dist/index.d.ts`
- Type definitions for all packages
- Auto-generated from source

**4. IIFE (Immediately Invoked Function Expression)**
- Files: `dist/index.global.js`, `dist/index.global.min.js`
- For: Direct browser usage, Drupal integration
- Bundles all dependencies
- Exposes global variables

### IIFE Global Variables

**Core:**
```javascript
window.DkanClientTools = {
  DkanClient,
  DkanApiClient,
  QueryClient,
  // ... types
}
```

**React:**
```javascript
window.DkanClientToolsReact = {
  DkanClientProvider,
  useDkanClient,
  useDataset,
  // ... all hooks
  React,
  ReactDOM,
  QueryClient,
  DkanClient
}
```

**Vue:**
```javascript
window.DkanClientToolsVue = {
  DkanClientPlugin,
  useDkanClient,
  useDataset,
  // ... all composables
  QueryClient,
  DkanClient
}
```

### Build Orchestrator

Automated build workflow:

1. **Build Packages** - Core → React → Vue (dependency order)
2. **Deploy to Drupal** - Copy IIFE builds to base modules
3. **Build Examples** - Standalone demo applications
4. **Build Drupal Modules** - Demo modules using IIFE builds

---

## Caching Strategy

### Default Configuration

```typescript
{
  staleTime: 5 * 60 * 1000,     // 5 minutes
  cacheTime: 5 * 60 * 1000,     // 5 minutes
  retry: 3,                      // 3 attempts
  retryDelay: 1000               // 1 second
}
```

### Query Key Structure

Hierarchical query keys for granular cache control. For TanStack Query fundamentals, see `/docs/external/libraries/TANSTACK_QUERY.md`.

**Complete DKAN Query Key Patterns:**

```typescript
// Dataset queries
['dataset', identifier]
['datasets']
['dataset-search', { keyword, theme, 'page-size' }]

// Datastore queries
['datastore', datasetId, index, queryOptions]
['datastore', 'multi', queryOptions, method]
['datastore-schema', datasetId, index]
['sql-query', { query, showDbColumns }]

// Data dictionary queries
['data-dictionary', identifier]
['data-dictionaries']
['data-dictionary-url', url]
['datastore-schema', datasetId, index]

// Harvest queries
['harvest-plans']
['harvest-plan', planId]
['harvest-runs', planId]
['harvest-run', runId, planId]

// Metastore queries
['schemas']
['schema', schemaId]
['schema-items', schemaId]
['dataset-facets']

// Datastore import queries
['datastore-imports']
['datastore-import', identifier]
['datastore-statistics', identifier]

// Revision queries
['revisions', schemaId, identifier]
['revision', schemaId, identifier, revisionId]
```

**Key Design Principles:**

1. **General to Specific** - Prefix matching allows invalidating groups
2. **Include Variables** - All parameters that affect results are in the key
3. **Consistent Naming** - Plural for lists, singular for individual items

### Cache Invalidation Patterns

Mutations automatically invalidate related queries. Standard patterns:

**Create Operations:**
```typescript
export function useCreateDataset() {
  return useMutation({
    mutationFn: (dataset) => dkanClient.createDataset(dataset),
    onSuccess: () => {
      // Invalidate dataset list to show new dataset
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
  })
}
```

**Update Operations:**
```typescript
export function useUpdateDataset() {
  return useMutation({
    mutationFn: ({ identifier, dataset }) =>
      dkanClient.updateDataset(identifier, dataset),
    onSuccess: (data, variables) => {
      // Invalidate specific dataset
      queryClient.invalidateQueries({
        queryKey: ['dataset', variables.identifier],
      })
      // Also invalidate list views
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
  })
}
```

**Delete Operations:**
```typescript
export function useDeleteDataset() {
  return useMutation({
    mutationFn: (identifier) => dkanClient.deleteDataset(identifier),
    onSuccess: (data, identifier) => {
      // Remove deleted dataset from cache
      queryClient.removeQueries({ queryKey: ['dataset', identifier] })
      // Invalidate list to remove deleted item
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
  })
}
```

**Related Cache Invalidation:**

Some mutations affect multiple cache entries:

```typescript
// Datastore import affects both import status and datastore data
useTriggerDatastoreImport() → invalidates:
  - ['datastore-imports']
  - ['datastore-import', identifier]
  - ['datastore', datasetId, index]

// Harvest run creates/updates datasets
useRunHarvest() → invalidates:
  - ['harvest-runs', planId]
  - ['datasets'] // New datasets may be created

// Changing dataset state affects dataset and search
useChangeDatasetState() → invalidates:
  - ['dataset', identifier]
  - ['datasets']
  - ['dataset-search']
```

---

## Error Handling

### DkanApiError

Custom error class with rich context:

```typescript
class DkanApiError extends Error {
  status?: number           // HTTP status code
  response?: string         // Raw error response
  timestamp?: string        // Server timestamp
  data?: Record<string, any> // Additional error data
}
```

### Error Propagation

```
DkanApiClient.request()
  ↓ throws DkanApiError
TanStack Query
  ↓ catches error
Hook/Composable
  ↓ returns error state
Component
  ↓ renders error UI
```

---

## Type System

### Type Safety Layers

1. **API Types** - Request/response shapes
2. **Domain Types** - Business objects (Dataset, Distribution)
3. **Hook/Composable Types** - Framework-specific return types
4. **Generic Types** - Reusable type utilities

### Key Type Patterns

**DCAT-US Dataset:**
```typescript
interface DkanDataset {
  identifier: string
  title: string
  description: string
  accessLevel: 'public' | 'restricted' | 'non-public'
  publisher: Publisher
  contactPoint: ContactPoint
  distribution?: Distribution[]
  keyword?: string[]
  theme?: string[]
  modified: string
  // ... additional properties
}
```

**Frictionless Table Schema:**
```typescript
interface DataDictionary {
  identifier: string
  version: string
  data: {
    title: string
    fields: DataDictionaryField[]
    indexes?: DataDictionaryIndex[]
  }
}

interface DataDictionaryField {
  name: string
  title?: string
  type: DataDictionaryFieldType
  format?: string
  description?: string
  constraints?: DataDictionaryConstraints
}
```

---

## Testing Strategy

### Test Organization

Each package has comprehensive test coverage:

**Core Package:**
- API client method tests
- Type definition tests
- Integration tests with fixtures

**React Package:**
- Hook tests for all scenarios:
  - Loading states
  - Success states
  - Error states
  - Mutations
  - Callbacks

**Vue Package:**
- Composable tests for all scenarios:
  - Reactive parameters
  - Loading states
  - Success states
  - Error states
  - Mutations

### Testing Patterns

**Use Real Client Instances:**
```typescript
let mockClient: DkanClient
beforeEach(() => {
  mockClient = new DkanClient({
    baseUrl: 'https://test.example.com',
    defaultOptions: { retry: 0 }
  })
})
```

**Spy on Methods:**
```typescript
vi.spyOn(mockClient, 'getDataset')
  .mockResolvedValue(mockDataset)
```

**Test Async Behavior:**
```typescript
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true)
})
```

---

## Monorepo Management

### npm Workspaces

```json
{
  "workspaces": [
    "packages/*",
    "examples/*"
  ]
}
```

**Benefits:**
- Shared dependencies hoisted to root
- Workspace protocol for internal deps
- Single install for entire repo
- Coordinated builds

### Internal Dependencies

```json
{
  "dependencies": {
    "@dkan-client-tools/core": "workspace:*"
  }
}
```

**Workspace protocol:**
- Links to local package during development
- Replaced with version on publish
- Ensures latest local changes are used

---

## Distribution Formats

### Package Exports

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "browser": "./dist/index.global.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    },
    "./global": "./dist/index.global.js",
    "./global-min": "./dist/index.global.min.js"
  }
}
```

**Conditional Exports:**
- `development` - Source files for direct debugging
- `types` - TypeScript declarations
- `import` - ESM build
- `require` - CommonJS build
- `default` - Fallback (ESM)

---

## Framework Extension Pattern

To add support for a new framework:

1. **Create Package** - `@dkan-client-tools/{framework}`

2. **Add Dependencies**
   ```json
   {
     "dependencies": {
       "@dkan-client-tools/core": "workspace:*"
     },
     "peerDependencies": {
       "@tanstack/query-{framework}": "^5.0.0",
       "{framework}": "^X.Y.Z"
     }
   }
   ```

3. **Implement Provider/Plugin**
   - Provide `DkanClient` instance to components
   - Wrap framework's TanStack Query provider

4. **Create Hooks/Composables**
   - Follow framework idioms
   - Wrap TanStack Query's framework adapter
   - Use consistent query keys with core

5. **Write Tests**
   - Follow existing test patterns
   - Test all hooks/composables
   - Verify reactivity (if applicable)

---

## Design Principles

1. **Developer Experience First**
   - Simple, intuitive APIs
   - Sensible defaults
   - Clear error messages
   - Comprehensive TypeScript support

2. **Framework Agnostic Core**
   - Core package has zero framework dependencies
   - Adapters are thin wrappers
   - Easy to add new frameworks

3. **Standards-Based**
   - DCAT-US for datasets
   - Frictionless for data dictionaries
   - OpenAPI for API documentation
   - TanStack Query patterns

4. **Production Ready**
   - Comprehensive error handling
   - Automatic retries
   - Request cancellation
   - Memory leak prevention

5. **Maintainable**
   - Consistent patterns
   - Comprehensive tests
   - Clear documentation
   - No unnecessary dependencies

---

## Performance Optimizations

**1. Smart Caching**
- 5-minute default stale time
- Background refetching
- Query deduplication

**2. Tree Shaking**
- ESM builds support tree shaking
- Import only what you need
- Smaller bundle sizes

**3. Request Batching**
- TanStack Query handles batching automatically
- Parallel queries are batched

**4. Lazy Loading**
- Conditional queries with `enabled`
- Load data only when needed

**5. Code Splitting**
- Framework adapters separate from core
- IIFE builds for targeted deployment

---


## Advanced Patterns

For advanced usage patterns including optimistic updates, prefetching, dependent queries, pagination, and performance best practices, see **[Advanced Patterns](./reference/ADVANCED_PATTERNS.md)**.

---


## Future Extensibility

The architecture supports:

- **Additional Frameworks** - Svelte, Solid, Angular, etc.
- **Custom Adapters** - GraphQL, gRPC, etc.
- **Plugin System** - Middleware for requests/responses
- **Cache Strategies** - Custom cache implementations
- **Transport Layers** - WebSocket, SSE, etc.

---

## References

- **TanStack Query Technology:** `/docs/external/libraries/TANSTACK_QUERY.md`
- **DKAN API:** `/docs/external/platforms/DKAN_API.md`
- **TanStack Query Documentation:** https://tanstack.com/query
- **DKAN:** https://getdkan.org
- **TypeScript:** https://www.typescriptlang.org
- **npm Workspaces:** https://docs.npmjs.com/cli/workspaces
