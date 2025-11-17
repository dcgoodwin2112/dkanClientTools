# @dkan-client-tools/vue

Vue composables for DKAN client tools. Built on [TanStack Vue Query](https://tanstack.com/query/vue) for robust caching and state management.

## Features

- 39 idiomatic Vue composables covering all DKAN APIs
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

| Category | Composables |
|----------|-------------|
| **Dataset Query** (3) | `useDataset`, `useDatasetSearch`, `useAllDatasets` |
| **Dataset Mutations** (4) | `useCreateDataset`, `useUpdateDataset`, `usePatchDataset`, `useDeleteDataset` |
| **Datastore** (6) | `useDatastore`, `useQueryDatastoreMulti`, `useSqlQuery`, `useExecuteSqlQuery`, `useDownloadQuery`, `useDownloadQueryByDistribution` |
| **Data Dictionary** (7) | `useDataDictionary`, `useDataDictionaryList`, `useDataDictionaryFromUrl`, `useDatastoreSchema`, `useCreateDataDictionary`, `useUpdateDataDictionary`, `useDeleteDataDictionary` |
| **Harvest** (6) | `useHarvestPlans`, `useHarvestPlan`, `useHarvestRuns`, `useHarvestRun`, `useRegisterHarvestPlan`, `useRunHarvest` |
| **Datastore Import** (4) | `useDatastoreImports`, `useDatastoreImport`, `useTriggerDatastoreImport`, `useDeleteDatastore` |
| **Metastore** (4) | `useSchemas`, `useSchema`, `useSchemaItems`, `useDatasetFacets` |
| **Revisions** (4) | `useRevisions`, `useRevision`, `useCreateRevision`, `useChangeDatasetState` |

## Vue-Specific Features

All composables accept reactive parameters (`MaybeRefOrGetter`) and return TanStack Query objects:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataset, useCreateDataset } from '@dkan-client-tools/vue'

const datasetId = ref('my-dataset-id')
const { data, isLoading } = useDataset({
  identifier: datasetId, // ref, computed, or plain value
  enabled: computed(() => !!datasetId.value),
})

const createDataset = useCreateDataset()
async function handleCreate() {
  const result = await createDataset.mutateAsync({ title: 'My Dataset' })
}
</script>
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

## Advanced Usage

```typescript
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { useDkanClient } from '@dkan-client-tools/vue'

// Custom query client options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10 * 60 * 1000, retry: 2 },
  },
})

const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  queryClient,
})

// Access client in components
const dkanClient = useDkanClient()
const baseUrl = dkanClient.getBaseUrl()
```

## License

MIT

## Links

- [TanStack Query Docs](https://tanstack.com/query/vue)
- [DKAN Project](https://getdkan.org/)
- [@dkan-client-tools/core](../dkan-client-tools-core)
