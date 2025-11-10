# DKAN Client Tools

A monorepo of packages containing tools to help developers build frontend applications that work with DKAN data catalogs. Built on [TanStack Query](https://tanstack.com/query) for robust caching and state management.

## Features

- 🎯 **Framework Agnostic Core** - Use with any JavaScript framework
- ⚛️ **React Hooks** - 40+ React hooks for all DKAN APIs
- 💚 **Vue Composables** - 40+ Vue 3 composables with full reactivity support
- 🔄 **Smart Caching** - Automatic caching, deduplication, and background refetching
- 🔍 **Type Safe** - Full TypeScript support with DCAT-US schema types
- 📦 **Tree-shakeable** - Only bundle what you use
- ✏️ **Mutations** - First-class support for create, update, delete operations
- 🎨 **Extensible** - Easy to create adapters for other frameworks

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@dkan-client-tools/core](./packages/dkan-client-tools-core) | 0.1.0 | Framework-agnostic core with API client and types |
| [@dkan-client-tools/react](./packages/dkan-client-tools-react) | 0.1.0 | React hooks built on TanStack React Query |
| [@dkan-client-tools/vue](./packages/dkan-client-tools-vue) | 0.1.0 | Vue 3 composables built on TanStack Vue Query |

## Quick Start

### Installation

```bash
npm install @dkan-client-tools/react @dkan-client-tools/core @tanstack/react-query
```

### React Example

```tsx
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider, useDataset, useDatasetSearch } from '@dkan-client-tools/react'

// 1. Create a client
const dkanClient = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
})

// 2. Wrap your app
function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <DatasetList />
    </DkanClientProvider>
  )
}

// 3. Use hooks
function DatasetList() {
  const { data, isLoading } = useDatasetSearch({
    searchOptions: {
      keyword: 'health',
      'page-size': 10,
    },
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {data?.results.map((dataset) => (
        <li key={dataset.identifier}>
          <DatasetItem id={dataset.identifier} />
        </li>
      ))}
    </ul>
  )
}

function DatasetItem({ id }: { id: string }) {
  const { data } = useDataset({ identifier: id })

  return (
    <div>
      <h3>{data?.title}</h3>
      <p>{data?.description}</p>
    </div>
  )
}
```

### Vue Example

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDatasetSearch, useDataset } from '@dkan-client-tools/vue'

const searchQuery = ref('')
const { data: searchResults, isLoading } = useDatasetSearch({
  searchOptions: computed(() => ({
    fulltext: searchQuery.value,
    'page-size': 10,
  })),
})
</script>

<template>
  <div>
    <input v-model="searchQuery" placeholder="Search datasets..." />

    <div v-if="isLoading">Loading...</div>

    <ul v-else-if="searchResults">
      <li v-for="dataset in searchResults.results" :key="dataset.identifier">
        <h3>{{ dataset.title }}</h3>
        <p>{{ dataset.description }}</p>
      </li>
    </ul>
  </div>
</template>
```

### Core Usage (Framework Agnostic)

```typescript
import { DkanClient } from '@dkan-client-tools/core'

const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
})

// Access the API client
const apiClient = client.getApiClient()

// Fetch a dataset
const dataset = await apiClient.getDataset('dataset-id')

// Search datasets
const results = await apiClient.searchDatasets({
  keyword: 'health',
  'page-size': 10,
})

// Query datastore
const data = await apiClient.queryDatastore('dataset-id', 0, {
  limit: 100,
  sorts: [{ property: 'date', order: 'desc' }],
})
```

## Available Hooks & Composables

Both the React and Vue packages provide 40+ hooks/composables covering all DKAN APIs. The API is identical between frameworks, with Vue using reactive refs and React using standard hooks.

### Dataset Hooks (Query)

- `useDataset` - Fetch a single dataset by identifier
- `useDatasetSearch` - Search for datasets with filters
- `useAllDatasets` - Get all datasets with full metadata

### Dataset Hooks (Mutations)

- `useCreateDataset` - Create a new dataset
- `useUpdateDataset` - Update an entire dataset
- `usePatchDataset` - Partially update a dataset
- `useDeleteDataset` - Delete a dataset

### Datastore Hooks

- `useDatastore` - Query datastore data
- `useSqlQuery` - Execute SQL queries
- `useExecuteSqlQuery` - Execute SQL queries on demand (mutation)
- `useDownloadQuery` - Download query results (mutation)
- `useDownloadQueryByDistribution` - Download by distribution (mutation)

### Data Dictionary Hooks (Query)

- `useDataDictionary` - Get a data dictionary
- `useDataDictionaryList` - List all data dictionaries
- `useDataDictionaryFromUrl` - Fetch dictionary from URL
- `useDatastoreSchema` - Get schema for a datastore

### Data Dictionary Hooks (Mutations)

- `useCreateDataDictionary` - Create a data dictionary
- `useUpdateDataDictionary` - Update a data dictionary
- `useDeleteDataDictionary` - Delete a data dictionary

### Harvest Hooks

- `useHarvestPlans` - List all harvest plans
- `useHarvestPlan` - Get a specific harvest plan
- `useHarvestRuns` - List harvest runs for a plan
- `useHarvestRun` - Get harvest run status
- `useRegisterHarvestPlan` - Register a new harvest plan (mutation)
- `useRunHarvest` - Run a harvest (mutation)

### Datastore Import Hooks

- `useDatastoreImports` - List all datastore imports
- `useDatastoreImport` - Get a specific import
- `useDatastoreStatistics` - Get datastore statistics
- `useTriggerDatastoreImport` - Trigger a datastore import (mutation)
- `useDeleteDatastore` - Delete a datastore (mutation)

### Metastore Hooks

- `useSchemas` - List available metastore schemas
- `useSchemaItems` - Get items for a specific schema
- `useDatasetFacets` - Get dataset facets (themes, keywords, publishers)

### Dataset Properties Hooks

- `useDatasetProperties` - Get all available dataset properties
- `usePropertyValues` - Get all values for a specific property
- `useAllPropertiesWithValues` - Get all properties with their values

### Revision/Moderation Hooks

- `useRevisions` - Get all revisions for an item
- `useRevision` - Get a specific revision
- `useCreateRevision` - Create a new revision (mutation)
- `useChangeDatasetState` - Change dataset workflow state (mutation)

### CKAN Compatibility Hooks

- `useCkanPackageSearch` - Search packages (CKAN-compatible)
- `useCkanDatastoreSearch` - Search datastore (CKAN-compatible)
- `useCkanDatastoreSearchSql` - SQL search (CKAN-compatible)
- `useCkanResourceShow` - Get resource info (CKAN-compatible)
- `useCkanCurrentPackageListWithResources` - List packages (CKAN-compatible)

See package READMEs for detailed documentation:
- [React package README](./packages/dkan-client-tools-react/README.md)
- [Vue package README](./packages/dkan-client-tools-vue/README.md)

## DKAN API Coverage

The packages support all major DKAN REST APIs:

- **Metastore API** - Dataset metadata (DCAT-US schema), CRUD operations, revisions
- **Datastore API** - Query data with SQL-like filters, statistics, imports
- **Search API** - Search datasets with faceting and full-text search
- **Harvest API** - Manage harvest plans and runs
- **Properties API** - Dataset property values for faceted search
- **CKAN-Compatible API** - Read-only CKAN compatibility layer

See [DKAN_API_RESEARCH.md](./research/DKAN_API_RESEARCH.md) for comprehensive API documentation.

## Architecture

Built on the proven [TanStack Query](https://tanstack.com/query) architecture:

```
┌──────────────────────┐  ┌──────────────────────┐
│  React Components    │  │  Vue Components      │
│  (40+ hooks)         │  │  (40+ composables)   │
└──────────┬───────────┘  └──────────┬───────────┘
           │                         │
           ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐
│ @dkan-client-tools/  │  │ @dkan-client-tools/  │
│ react                │  │ vue                  │
│ - TanStack React     │  │ - TanStack Vue Query │
│   Query              │  │ - Vue Plugin         │
│ - Context Provider   │  │ - Reactive Params    │
└──────────┬───────────┘  └──────────┬───────────┘
           │                         │
           └────────────┬────────────┘
                        ▼
           ┌─────────────────────────┐
           │ @dkan-client-tools/core │
           │ - DkanClient            │
           │ - DkanApiClient         │
           │ - TanStack Query Core   │
           │ - TypeScript Types      │
           └────────────┬────────────┘
                        ▼
           ┌─────────────────────────┐
           │   DKAN REST APIs        │
           │   - Metastore           │
           │   - Datastore           │
           │   - Search              │
           │   - Harvest             │
           │   - Properties          │
           │   - CKAN Compatibility  │
           └─────────────────────────┘
```

## Development

This is a monorepo managed with npm workspaces.

### Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in watch mode
npm run dev

# Run tests (218 comprehensive tests)
npm test

# Type checking
npm run typecheck
```

### Project Structure

```
/
├── packages/
│   ├── dkan-client-tools-core/    # Core package
│   │   ├── src/
│   │   │   ├── api/               # DkanApiClient
│   │   │   ├── client/            # DkanClient
│   │   │   └── types/             # TypeScript types
│   │   └── __tests__/             # Core tests
│   ├── dkan-client-tools-react/   # React package
│   │   ├── src/
│   │   │   ├── use*.ts            # 40+ React hooks
│   │   │   └── DkanClientProvider.tsx
│   │   └── __tests__/             # Hook tests (218 tests)
│   └── dkan-client-tools-vue/     # Vue package
│       ├── src/
│       │   ├── use*.ts            # 40+ Vue composables
│       │   └── plugin.ts          # Vue plugin
│       └── __tests__/             # Composable tests (91 tests)
├── examples/                      # Demo applications
│   ├── react-demo-app/            # React example app
│   └── vue-demo-app/              # Vue example app
├── dkan/                          # Local DKAN instance (for testing)
├── docs/                          # User documentation
├── research/                      # API research docs
├── package.json                   # Root workspace config
└── README.md                      # This file
```

### Testing

Comprehensive test suite with 300+ tests across React and Vue packages:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests for a specific package
cd packages/dkan-client-tools-react
npm test

cd packages/dkan-client-tools-vue
npm test
```

All hooks and composables are tested for:
- Loading states
- Error handling
- Data fetching
- Mutations
- Callbacks
- Edge cases
- Reactive parameters (Vue)

### Local DKAN Development Environment

A local DKAN site is included for testing and development:

```bash
cd dkan
ddev start
ddev drush status
```

The local DKAN instance runs at: `https://dkan.ddev.site`

**Note:** The `/dkan` directory is excluded from git as it's a separate Drupal/DKAN project. Set up your own DKAN instance for testing.

See [DRUPAL_USAGE.md](./docs/DRUPAL_USAGE.md) for DKAN/Drupal integration details.

## Example Applications

Complete example applications are available in the `examples/` directory:

**React Demo App:**
```bash
cd examples/react-demo-app
npm install
npm run dev
```

**Vue Demo App:**
```bash
cd examples/vue-demo-app
npm install
npm run dev
```

The example apps demonstrate:
- Dataset search and filtering with pagination
- Dataset details view with full metadata
- Datastore querying with SQL support
- Data dictionary management
- Harvest operations (plans and runs)
- Download functionality (CSV/JSON)
- Loading states and error handling
- Authentication setup
- TypeScript integration

## Authentication

Supports two authentication methods:

```typescript
// Token-based authentication
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    token: 'your-api-token',
  },
})

// Basic authentication
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    username: 'admin',
    password: 'password',
  },
})
```

## Framework Support

Currently supported frameworks:

- ✅ **React** - 40+ hooks via `@tanstack/react-query`
- ✅ **Vue** - 40+ composables via `@tanstack/vue-query`

Future framework support (contributions welcome):

- **Svelte** (via Svelte stores and `@tanstack/svelte-query`)
- **Solid** (via Solid signals and `@tanstack/solid-query`)
- **Angular** (via RxJS and `@tanstack/angular-query-experimental`)

Each framework adapter:
1. Depends on `@dkan-client-tools/core`
2. Uses the corresponding TanStack Query framework adapter
3. Provides framework-specific hooks/composables/components

## Contributing

Contributions are welcome! This project is actively developed.

### Adding Features

1. **New API methods** - Add to `DkanApiClient` in core package
2. **New hooks** - Create new hook file in React package following existing patterns
3. **Tests** - Add comprehensive tests for all new functionality
4. **Documentation** - Update READMEs with new features

### Code Style

- TypeScript for all code
- Comprehensive JSDoc comments on all hooks
- Test coverage for all functionality
- Follow existing patterns and conventions

See [CLAUDE.md](./CLAUDE.md) for detailed contribution guidelines.

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[React Standalone App Guide](./docs/REACT_STANDALONE_APP.md)** - Complete guide for building React applications
- **[Vue Standalone App Guide](./docs/VUE_STANDALONE_APP.md)** - Complete guide for building Vue 3 applications
- **[Drupal Integration Guide](./docs/DRUPAL_USAGE.md)** - Guide for integrating with Drupal themes and modules

## License

MIT

## Resources

- [DKAN Documentation](https://dkan.readthedocs.io/)
- [DCAT-US Schema](https://resources.data.gov/resources/dcat-us/)
- [TanStack Query](https://tanstack.com/query) - Foundation for this project
- [Project Open Data](https://project-open-data.cio.gov/) - Federal open data standards
- [Frictionless Standards](https://specs.frictionlessdata.io/) - Data dictionary specifications

## Project Status

**Status**: Active Development

This project provides comprehensive coverage of DKAN APIs with:
- ✅ 40+ React hooks
- ✅ 40+ Vue composables
- ✅ 300+ comprehensive tests
- ✅ Full TypeScript support
- ✅ Complete DCAT-US type definitions
- ✅ All major DKAN APIs supported
- ✅ CKAN compatibility layer
- ✅ Example application

Future development:
- Additional framework adapters (Svelte, Solid, Angular)
- Advanced caching strategies
- Optimistic updates
- Real-time subscriptions (if DKAN adds WebSocket support)
