# @dkan-client-tools/vue

Vue composables for DKAN client tools. Built on [TanStack Vue Query](https://tanstack.com/query/vue) for robust caching and state management.

## Features

- 40+ idiomatic Vue composables covering all DKAN APIs
- Automatic refetching and background updates
- Efficient caching and deduplication via TanStack Query
- First-class mutation support for create/update/delete operations
- Vue 3 Composition API with `<script setup>` support
- Full TypeScript support with reactive refs

## Installation

```bash
npm install @dkan-client-tools/vue @dkan-client-tools/core @tanstack/vue-query
```

## Peer Dependencies

- `vue` ^3.3.0
- `@tanstack/vue-query` ^5.0.0
- `@dkan-client-tools/core` *

## Quick Start

### 1. Install the Plugin

```typescript
import { createApp } from 'vue'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '@dkan-client-tools/vue'
import App from './App.vue'

const dkanClient = new DkanClient({
  baseUrl: 'https://demo.getdkan.org',
})

const app = createApp(App)
app.use(DkanClientPlugin, { client: dkanClient })
app.mount('#app')
```

### 2. Use Composables in Components

```vue
<script setup lang="ts">
import { ref } from 'vue'
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

## Available Composables

### Dataset Query Composables (3)
- `useDataset()` - Fetch a single dataset
- `useDatasetSearch()` - Search datasets with filters
- `useAllDatasets()` - Fetch all datasets

### Dataset Mutations (4)
- `useCreateDataset()` - Create a new dataset
- `useUpdateDataset()` - Update an existing dataset (full replacement)
- `usePatchDataset()` - Partially update a dataset
- `useDeleteDataset()` - Delete a dataset

### Datastore Composables (5)
- `useDatastore()` - Query datastore data
- `useSqlQuery()` - Execute SQL queries
- `useExecuteSqlQuery()` - Execute SQL as a mutation
- `useDownloadQuery()` - Download query results
- `useDownloadQueryByDistribution()` - Download by distribution ID

### Data Dictionary Composables (7)
- `useDataDictionary()` - Fetch a data dictionary
- `useDataDictionaryList()` - List all data dictionaries
- `useDataDictionaryFromUrl()` - Fetch from URL
- `useDatastoreSchema()` - Get datastore schema
- `useCreateDataDictionary()` - Create a data dictionary
- `useUpdateDataDictionary()` - Update a data dictionary
- `useDeleteDataDictionary()` - Delete a data dictionary

### Harvest Composables (6)
- `useHarvestPlans()` - List harvest plans
- `useHarvestPlan()` - Get a specific plan
- `useHarvestRuns()` - List harvest runs
- `useHarvestRun()` - Get a specific run
- `useRegisterHarvestPlan()` - Register a new plan
- `useRunHarvest()` - Execute a harvest

### Datastore Import Composables (4)
- `useDatastoreImports()` - List all imports
- `useDatastoreImport()` - Get import status
- `useTriggerDatastoreImport()` - Trigger an import
- `useDeleteDatastore()` - Delete a datastore

### Metastore Composables (3)
- `useSchemas()` - List available schemas
- `useSchemaItems()` - Get items for a schema
- `useDatasetFacets()` - Get dataset facets

### Dataset Properties Composables (3)
- `useDatasetProperties()` - Get all properties
- `usePropertyValues()` - Get values for a property
- `useAllPropertiesWithValues()` - Get properties with values

### Revision/Moderation Composables (4)
- `useRevisions()` - Get all revisions
- `useRevision()` - Get a specific revision
- `useCreateRevision()` - Create a revision
- `useChangeDatasetState()` - Change workflow state

### CKAN Compatibility Composables (5)
- `useCkanPackageSearch()` - CKAN package search
- `useCkanDatastoreSearch()` - CKAN datastore search
- `useCkanDatastoreSearchSql()` - CKAN SQL query
- `useCkanResourceShow()` - CKAN resource metadata
- `useCkanCurrentPackageListWithResources()` - CKAN package list

## Vue-Specific Features

### Reactive Parameters

All composables accept reactive parameters using Vue's `MaybeRefOrGetter` type:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataset } from '@dkan-client-tools/vue'

const datasetId = ref('my-dataset-id')

// identifier can be a ref, computed, or plain value
const { data, isLoading } = useDataset({
  identifier: datasetId, // ref
  enabled: computed(() => !!datasetId.value), // computed
  staleTime: 5 * 60 * 1000, // plain value
})
</script>
```

### Query Mutations

Mutations return TanStack Query mutation objects with full TypeScript support:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCreateDataset } from '@dkan-client-tools/vue'

const createDataset = useCreateDataset()
const dataset = ref({
  title: 'My Dataset',
  description: 'Dataset description',
  // ... other fields
})

async function handleCreate() {
  try {
    const result = await createDataset.mutateAsync(dataset.value)
    console.log('Created:', result.identifier)
  } catch (error) {
    console.error('Failed:', error)
  }
}
</script>

<template>
  <button @click="handleCreate" :disabled="createDataset.isPending">
    {{ createDataset.isPending ? 'Creating...' : 'Create Dataset' }}
  </button>
</template>
```

## Authentication

```typescript
import { DkanClient } from '@dkan-client-tools/core'

// HTTP Basic Auth
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    username: 'your-username',
    password: 'your-password',
  },
})

// Bearer Token
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    token: 'your-bearer-token',
  },
})
```

## TypeScript Support

All composables are fully typed with TypeScript:

```typescript
import type { DkanDataset, DatasetQueryOptions } from '@dkan-client-tools/vue'

const options: DatasetQueryOptions = {
  fulltext: 'health',
  'page-size': 20,
}

const dataset: DkanDataset = {
  title: 'My Dataset',
  description: 'A comprehensive dataset',
  // ... TypeScript will enforce the schema
}
```

## Advanced Usage

### Custom Query Client Options

```typescript
import { QueryClient } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    },
  },
})

const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  queryClient,
})
```

### Accessing the Client

```vue
<script setup lang="ts">
import { useDkanClient } from '@dkan-client-tools/vue'

const client = useDkanClient()

// Access the QueryClient
const queryClient = client.getQueryClient()

// Get the base URL
const baseUrl = client.getBaseUrl()
</script>
```

## License

MIT

## Links

- [TanStack Query Docs](https://tanstack.com/query/vue)
- [DKAN Project](https://getdkan.org/)
- [@dkan-client-tools/core](../dkan-client-tools-core)
