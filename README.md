# DKAN Client Tools

A monorepo of packages containing tools to help developers build frontend applications that work with DKAN data catalogs. Built on [TanStack Query](https://tanstack.com/query) for robust caching and state management.

## Features

- 🎯 **Framework Agnostic Core** - Use with any JavaScript framework
- ⚛️ **React Hooks** - Comprehensive React hooks for all DKAN APIs
- 💚 **Vue Composables** - Full Vue 3 composables with reactivity support
- 🔄 **Smart Caching** - Automatic caching, deduplication, and background refetching
- 🔍 **Type Safe** - Full TypeScript support with DCAT-US schema types

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@dkan-client-tools/core](./packages/dkan-client-tools-core) | 0.1.0 | Framework-agnostic core with API client and types |
| [@dkan-client-tools/react](./packages/dkan-client-tools-react) | 0.1.0 | React hooks built on TanStack React Query |
| [@dkan-client-tools/vue](./packages/dkan-client-tools-vue) | 0.1.0 | Vue 3 composables built on TanStack Vue Query |

## Quick Start

### Installation

**React:**
```bash
npm install @dkan-client-tools/react @dkan-client-tools/core @tanstack/react-query
```

**Vue:**
```bash
npm install @dkan-client-tools/vue @dkan-client-tools/core @tanstack/vue-query
```

**Core (framework-agnostic):**
```bash
npm install @dkan-client-tools/core @tanstack/query-core
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
          <h3>{dataset.title}</h3>
          <p>{dataset.description}</p>
        </li>
      ))}
    </ul>
  )
}
```

### Vue Example

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDatasetSearch } from '@dkan-client-tools/vue'

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

## API Coverage

The packages provide **39 hooks/composables per package** covering all major DKAN REST APIs:

- **Datasets** - Search, CRUD operations, metadata management
- **Datastore** - Query data with SQL-like filters, statistics, imports
- **Data Dictionary** - Manage Frictionless Table Schema definitions
- **Harvest** - Manage harvest plans and runs
- **Metastore** - Schema management and dataset facets
- **Revisions** - Version control and moderation workflows

See the **[API Reference](./docs/API_REFERENCE.md)** for complete documentation of all hooks and composables.

## Architecture

Built on the proven TanStack Query architecture with a core + adapters pattern:

```
┌──────────────────────┐  ┌──────────────────────┐
│  React Hooks         │  │  Vue Composables     │
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
           └─────────────────────────┘
```

**Key Architectural Concepts:**

- **Framework-agnostic core** - All HTTP logic and types in a single shared package
- **Smart caching** - TanStack Query handles automatic caching, deduplication, and background refetching
- **Type safety** - Full TypeScript support with DCAT-US schema types and Frictionless Table Schema types
- **Reactive** - Vue composables support reactive parameters, React hooks follow standard patterns

See **[Architecture Documentation](./docs/ARCHITECTURE.md)** for detailed design decisions.

## Development

This is a monorepo managed with npm workspaces.

### Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build:all

# Run in watch mode
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck
```

### Building

The project uses an automated build orchestrator:

```bash
npm run build:all              # Complete workflow: packages → deploy → examples
npm run build:all:drupal       # Complete build + clear Drupal cache
npm run build:packages         # Build only packages (core, react, vue)
```

See **[Build Process](./docs/BUILD_PROCESS.md)** for detailed build documentation.

### Testing

Comprehensive test suite with **506 tests** (Core: 225, React: 181, Vue: 100) across all packages:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests for a specific package
npm test -w @dkan-client-tools/react
```

All hooks and composables are tested for loading states, error handling, data fetching, mutations, callbacks, and edge cases.

## Example Applications

Complete example applications demonstrating all features:

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

The example apps demonstrate dataset search, datastore querying, data dictionary management, harvest operations, and more.

## DKAN Development Environment

The `/dkan` directory contains a complete Drupal 10 + DKAN 2.x development environment with automated setup.

### Quick Setup

```bash
cd dkan

# Install Drupal
ddev drush si --account-pass=admin -y

# Start DDEV (automated setup runs automatically)
ddev start
```

The automated setup:
- Enables all required DKAN modules
- Imports 49 sample datasets
- Creates demo pages at `/vanilla-demo`, `/react-demo`, `/vue-demo`
- Places demo blocks
- Generates data dictionaries

Access: https://dkan.ddev.site (admin/admin)

### Manual Setup Scripts

```bash
# Run setup script manually
ddev exec bash scripts/setup-site.sh

# Complete rebuild (destroys database)
ddev exec bash scripts/rebuild-site.sh
```

### Drush Commands

```bash
# Create demo pages
ddev drush dkan-client:create-demo-pages

# Place demo blocks
ddev drush dkan-client:place-blocks

# Complete setup
ddev drush dkan-client:setup
```

See [dkan/README.md](./dkan/README.md) for detailed documentation.

## Documentation

Comprehensive documentation is available in the `/docs` directory:

### Getting Started
- **[Installation Guide](./docs/INSTALLATION.md)** - Install packages for React, Vue, or vanilla JavaScript
- **[Quick Start](./docs/QUICK_START.md)** - Get up and running in 5 minutes

### Framework Integration
- **[React Guide](./docs/REACT_GUIDE.md)** - Complete React integration guide
- **[Vue Guide](./docs/VUE_GUIDE.md)** - Complete Vue integration guide
- **[Drupal Integration](./docs/DRUPAL_INTEGRATION.md)** - Using in Drupal themes and modules

### Reference
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation
- **[Architecture](./docs/ARCHITECTURE.md)** - Design decisions and patterns
- **[Build Process](./docs/BUILD_PROCESS.md)** - Understanding the build system

**See [docs/README.md](./docs/README.md) for the complete documentation index.**

## Resources

- [DKAN Documentation](https://dkan.readthedocs.io/) - Official DKAN documentation
- [DCAT-US Schema](https://resources.data.gov/resources/dcat-us/) - Federal data catalog standard
- [TanStack Query](https://tanstack.com/query) - Foundation for this project
- [Frictionless Standards](https://specs.frictionlessdata.io/) - Data dictionary specifications

## License

MIT

## Project Status

**Status**: Active Development

This project provides comprehensive coverage of DKAN APIs with complete React hooks, Vue composables, TypeScript support, and extensive test coverage.
