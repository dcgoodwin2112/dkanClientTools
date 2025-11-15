# Vue Guide

Complete guide for using DKAN Client Tools with Vue 3.

## Overview

The `@dkan-client-tools/vue` package provides Vue 3 composables built on TanStack Vue Query for all DKAN APIs. Features include automatic caching, background refetching, reactive parameters, and full TypeScript support.

## Installation

```bash
npm install @dkan-client-tools/core @dkan-client-tools/vue @tanstack/vue-query
```

**Peer Dependencies**:
- Vue 3.3+
- TanStack Vue Query

---

## Setup

### 1. Install Plugin

```typescript
// main.ts
import { createApp } from 'vue'
import { DkanClientPlugin } from '@dkan-client-tools/vue'
import App from './App.vue'

const app = createApp(App)

app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://demo.getdkan.org',
    // Optional: Add authentication
    auth: {
      username: 'your-username',
      password: 'your-password'
    }
  }
})

app.mount('#app')
```

### 2. Use Composables

```vue
<script setup lang="ts">
import { useDatasetSearch } from '@dkan-client-tools/vue'

const { data, isLoading, error } = useDatasetSearch({
  searchOptions: { 'page-size': 10 }
})
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="dataset in data?.results" :key="dataset.identifier">
      {{ dataset.title }}
    </li>
  </ul>
</template>
```

---

## Reactive Parameters

All composables accept reactive parameters using `MaybeRefOrGetter`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataset } from '@dkan-client-tools/vue'

// Reactive ref
const datasetId = ref('uuid-1')

// Composable automatically reacts to changes
const { data } = useDataset({
  identifier: datasetId
})

// Computed values also work
const searchQuery = ref('')
const { data: searchResults } = useDatasetSearch({
  searchOptions: computed(() => ({
    fulltext: searchQuery.value,
    'page-size': 20
  }))
})

// Change triggers automatic refetch
datasetId.value = 'uuid-2'
</script>
```

---

## Dataset Composables

### Query Composables

#### useDataset

Fetch a single dataset by identifier.

```vue
<script setup lang="ts">
import { useDataset } from '@dkan-client-tools/vue'

const props = defineProps<{ id: string }>()

const { data, isLoading, error } = useDataset({
  identifier: () => props.id // Getter function (reactive)
})
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>
    <h1>{{ data?.title }}</h1>
    <p>{{ data?.description }}</p>
    <p>Publisher: {{ data?.publisher?.name }}</p>
  </div>
</template>
```

**Options**:
- `identifier` - Dataset UUID (required, reactive)
- `enabled` - Conditionally enable query (reactive)
- `staleTime` - Cache duration

#### useDatasetSearch

Search datasets with filters and pagination.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDatasetSearch } from '@dkan-client-tools/vue'

const keyword = ref('')
const page = ref(1)

const { data, isLoading } = useDatasetSearch({
  searchOptions: computed(() => ({
    keyword: keyword.value,
    fulltext: keyword.value,
    'page-size': 20,
    page: page.value
  }))
})
</script>

<template>
  <div>
    <input
      v-model="keyword"
      placeholder="Search datasets..."
    />

    <div v-for="dataset in data?.results" :key="dataset.identifier">
      <h3>{{ dataset.title }}</h3>
    </div>

    <button @click="page--" :disabled="page === 1">Previous</button>
    <button @click="page++">Next</button>
  </div>
</template>
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

```vue
<script setup lang="ts">
import { useAllDatasets } from '@dkan-client-tools/vue'

const { data } = useAllDatasets()
</script>
```

### Mutation Composables

#### useCreateDataset

Create a new dataset.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCreateDataset } from '@dkan-client-tools/vue'

const createDataset = useCreateDataset()
const formData = ref({
  title: '',
  description: ''
})

const handleSubmit = async () => {
  try {
    const result = await createDataset.mutateAsync({
      title: formData.value.title,
      description: formData.value.description,
      // ... other DCAT-US fields
    })
    console.log('Created:', result.identifier)
  } catch (error) {
    console.error('Failed:', error)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="formData.title" placeholder="Title" />
    <textarea v-model="formData.description" placeholder="Description" />
    <button type="submit" :disabled="createDataset.isPending">
      {{ createDataset.isPending ? 'Creating...' : 'Create' }}
    </button>
  </form>
</template>
```

#### useUpdateDataset

Update entire dataset (replaces all fields).

```vue
<script setup lang="ts">
const updateDataset = useUpdateDataset()

await updateDataset.mutateAsync({
  identifier: 'uuid',
  data: { /* complete dataset object */ }
})
</script>
```

#### usePatchDataset

Partially update dataset (updates specific fields).

```vue
<script setup lang="ts">
const patchDataset = usePatchDataset()

await patchDataset.mutateAsync({
  identifier: 'uuid',
  data: { title: 'New Title' }
})
</script>
```

#### useDeleteDataset

Delete a dataset.

```vue
<script setup lang="ts">
const deleteDataset = useDeleteDataset()

await deleteDataset.mutateAsync('dataset-uuid')
</script>
```

---

## Datastore Composables

### useDatastore

Query datastore data with SQL-like operations.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDatastore } from '@dkan-client-tools/vue'

const props = defineProps<{ datasetId: string }>()
const limit = ref(50)
const offset = ref(0)

const { data, isLoading } = useDatastore({
  datasetId: () => props.datasetId,
  index: 0,
  queryOptions: computed(() => ({
    limit: limit.value,
    offset: offset.value,
    sorts: [
      { property: 'date', order: 'desc' }
    ],
    conditions: [
      { property: 'status', value: 'active', operator: '=' }
    ]
  }))
})
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <table v-else>
    <thead>
      <tr>
        <th v-for="field in data?.schema.fields" :key="field.name">
          {{ field.name }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in data?.results" :key="i">
        <td v-for="(value, key) in row" :key="key">
          {{ value }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
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

```vue
<script setup lang="ts">
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
</script>
```

### useSqlQuery

Execute SQL queries against datastore.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useSqlQuery } from '@dkan-client-tools/vue'

const query = ref('SELECT * FROM datastore_12345 WHERE status = "active" LIMIT 100')

const { data } = useSqlQuery({
  sqlQuery: query
})
</script>

<template>
  <textarea v-model="query" />
  <pre>{{ JSON.stringify(data, null, 2) }}</pre>
</template>
```

### useExecuteSqlQuery

Execute SQL queries on-demand (mutation).

```vue
<script setup lang="ts">
import { ref } from 'vue'

const executeSql = useExecuteSqlQuery()
const query = ref('')

const handleExecute = async () => {
  const result = await executeSql.mutateAsync({
    sqlQuery: query.value
  })
}
</script>
```

### Download Composables

#### useDownloadQuery

Download query results as CSV or JSON.

```vue
<script setup lang="ts">
const downloadQuery = useDownloadQuery()

const handleDownload = async () => {
  await downloadQuery.mutateAsync({
    datasetId: 'uuid',
    index: 0,
    format: 'csv',
    queryOptions: { limit: 1000 }
  })
}
</script>
```

#### useDownloadQueryByDistribution

Download by distribution identifier.

```vue
<script setup lang="ts">
const download = useDownloadQueryByDistribution()

await download.mutateAsync({
  distributionId: 'dist-uuid',
  format: 'json'
})
</script>
```

---

## Data Dictionary Composables

### Query Composables

#### useDataDictionary

Get data dictionary for a dataset.

```vue
<script setup lang="ts">
const { data } = useDataDictionary({
  identifier: 'dataset-uuid',
  index: 0
})

// Access field definitions
const fields = computed(() => data.value?.data.fields)
</script>
```

#### useDataDictionaryList

List all data dictionaries.

```vue
<script setup lang="ts">
const { data } = useDataDictionaryList()
</script>
```

#### useDataDictionaryFromUrl

Fetch dictionary from URL.

```vue
<script setup lang="ts">
const { data } = useDataDictionaryFromUrl({
  url: 'https://example.com/dictionary.json'
})
</script>
```

#### useDatastoreSchema

Get schema for a datastore.

```vue
<script setup lang="ts">
const { data } = useDatastoreSchema({
  identifier: 'dataset-uuid',
  index: 0
})
</script>
```

### Mutation Composables

#### useCreateDataDictionary

Create a data dictionary.

```vue
<script setup lang="ts">
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
</script>
```

#### useUpdateDataDictionary

Update existing dictionary.

```vue
<script setup lang="ts">
const update = useUpdateDataDictionary()

await update.mutateAsync({
  identifier: 'dataset-uuid',
  index: 0,
  data: { /* updated dictionary */ }
})
</script>
```

#### useDeleteDataDictionary

Delete a data dictionary.

```vue
<script setup lang="ts">
const deleteDictionary = useDeleteDataDictionary()

await deleteDictionary.mutateAsync({
  identifier: 'dataset-uuid',
  index: 0
})
</script>
```

---

## Harvest Composables

### useHarvestPlans

List all harvest plans.

```vue
<script setup lang="ts">
const { data } = useHarvestPlans()
</script>

<template>
  <ul>
    <li v-for="plan in data" :key="plan.identifier">
      {{ plan.label }}
    </li>
  </ul>
</template>
```

### useHarvestPlan

Get specific harvest plan.

```vue
<script setup lang="ts">
const { data } = useHarvestPlan({ planId: 'plan-id' })
</script>
```

### useHarvestRuns

List runs for a harvest plan.

```vue
<script setup lang="ts">
const { data } = useHarvestRuns({ planId: 'plan-id' })
</script>
```

### useHarvestRun

Get specific harvest run status.

```vue
<script setup lang="ts">
const { data } = useHarvestRun({
  planId: 'plan-id',
  runId: 'run-id'
})
</script>
```

### useRegisterHarvestPlan

Register new harvest plan (mutation).

```vue
<script setup lang="ts">
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
</script>
```

### useRunHarvest

Execute harvest (mutation).

```vue
<script setup lang="ts">
const runHarvest = useRunHarvest()

await runHarvest.mutateAsync('plan-id')
</script>
```

---

## Datastore Import Composables

### useDatastoreImports

List all datastore imports.

```vue
<script setup lang="ts">
const { data } = useDatastoreImports()
</script>
```

### useDatastoreImport

Get specific import.

```vue
<script setup lang="ts">
const { data } = useDatastoreImport({
  identifier: 'dataset-uuid',
  index: 0
})
</script>
```

### useDatastoreStatistics

Get datastore statistics.

```vue
<script setup lang="ts">
const { data } = useDatastoreStatistics()
</script>
```

### useTriggerDatastoreImport

Trigger datastore import (mutation).

```vue
<script setup lang="ts">
const trigger = useTriggerDatastoreImport()

await trigger.mutateAsync({
  identifier: 'dataset-uuid',
  index: 0
})
</script>
```

### useDeleteDatastore

Delete a datastore (mutation).

```vue
<script setup lang="ts">
const deleteDs = useDeleteDatastore()

await deleteDs.mutateAsync({
  identifier: 'dataset-uuid',
  index: 0
})
</script>
```

---

## Metastore Composables

### useSchemas

List available metastore schemas.

```vue
<script setup lang="ts">
const { data } = useSchemas()
// Returns: ['dataset', 'distribution', 'publisher', ...]
</script>
```

### useSchema

Get specific schema definition.

```vue
<script setup lang="ts">
const { data } = useSchema({ schemaId: 'dataset' })
</script>
```

### useSchemaItems

Get all items for a schema.

```vue
<script setup lang="ts">
const { data } = useSchemaItems({ schemaId: 'publisher' })
</script>
```

### useDatasetFacets

Get dataset facets (themes, keywords, publishers).

```vue
<script setup lang="ts">
const { data } = useDatasetFacets()

// Access facets
const themes = computed(() => data.value?.theme)
const keywords = computed(() => data.value?.keyword)
</script>
```

---

## Revision/Moderation Composables

### useRevisions

Get all revisions for a dataset.

```vue
<script setup lang="ts">
const { data } = useRevisions({
  schemaId: 'dataset',
  identifier: 'dataset-uuid'
})
</script>
```

### useRevision

Get specific revision.

```vue
<script setup lang="ts">
const { data } = useRevision({
  schemaId: 'dataset',
  identifier: 'dataset-uuid',
  revision: '1'
})
</script>
```

### useCreateRevision

Create new revision (mutation).

```vue
<script setup lang="ts">
const createRevision = useCreateRevision()

await createRevision.mutateAsync({
  schemaId: 'dataset',
  identifier: 'dataset-uuid',
  data: { /* updated dataset */ }
})
</script>
```

### useChangeDatasetState

Change workflow state (mutation).

```vue
<script setup lang="ts">
const changeState = useChangeDatasetState()

await changeState.mutateAsync({
  identifier: 'dataset-uuid',
  state: 'published' // or 'draft', 'archived'
})
</script>
```

---

## Advanced Usage

### Custom Query Configuration

All composables accept standard TanStack Query options:

```vue
<script setup lang="ts">
const { data } = useDataset({
  identifier: 'uuid',
  staleTime: 10 * 60 * 1000, // 10 minutes
  enabled: () => !!userId.value, // Conditional fetching
  refetchInterval: 30000, // Auto-refetch every 30s
  retry: 3
})
</script>
```

### Mutation Callbacks

```vue
<script setup lang="ts">
const createDataset = useCreateDataset()

createDataset.mutate(newDataset, {
  onSuccess: (data) => {
    console.log('Created:', data.identifier)
  },
  onError: (error) => {
    console.error('Failed:', error)
  }
})
</script>
```

### Using Query Client

Access TanStack Query Client for advanced operations:

```vue
<script setup lang="ts">
import { useQueryClient } from '@dkan-client-tools/vue'

const queryClient = useQueryClient()

const handleRefresh = () => {
  // Invalidate all dataset queries
  queryClient.invalidateQueries({ queryKey: ['dataset'] })
}
</script>

<template>
  <button @click="handleRefresh">Refresh</button>
</template>
```

### Optimistic Updates

```vue
<script setup lang="ts">
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
</script>
```

---

## TypeScript Support

All composables are fully typed with TypeScript:

```vue
<script setup lang="ts">
import type { DkanDataset, DatastoreQueryOptions } from '@dkan-client-tools/vue'

const { data } = useDataset({ identifier: 'uuid' })
// data is typed as Ref<DkanDataset | undefined>

const queryOptions: Ref<DatastoreQueryOptions> = ref({
  limit: 100,
  conditions: [
    { property: 'status', value: 'active', operator: '=' }
  ]
})
</script>
```

---

## Error Handling

All composables provide error states:

```vue
<script setup lang="ts">
const { data, error, isError } = useDataset({ identifier: 'uuid' })
</script>

<template>
  <div v-if="isError">Error: {{ error?.message }}</div>
</template>
```

For global error handling:

```typescript
// main.ts
import { QueryCache, QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Global error:', error)
    }
  })
})

const dkanClient = new DkanClient({
  baseUrl: 'https://demo.getdkan.org',
  queryClient
})

app.use(DkanClientPlugin, { client: dkanClient })
```

---

## Loading States

Composables provide multiple loading indicators:

```vue
<script setup lang="ts">
const { data, isLoading, isFetching, isPending } = useDataset({ identifier: 'uuid' })

// isLoading: true during initial fetch
// isFetching: true during any fetch (including background)
// isPending: true while waiting for enabled condition
</script>
```

---

## Authentication

### Basic Auth

```typescript
// main.ts
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://your-site.com',
    auth: {
      username: 'user',
      password: 'pass'
    }
  }
})
```

### Token Auth

```typescript
// main.ts
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://your-site.com',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
})
```

---

## CORS & Development

For local development with CORS issues, use a Vite proxy:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
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

```typescript
// main.ts
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'http://localhost:5173' // Vite dev server
  }
})
```

---

## Composables vs Hooks

Key differences from React hooks:

1. **Return Values**: All values are reactive refs
   ```typescript
   const { data } = useDataset({ identifier: 'uuid' })
   // data is Ref<DkanDataset | undefined>
   // Access with data.value
   ```

2. **Reactive Parameters**: Use refs, computed, or getters
   ```typescript
   const id = ref('uuid')
   useDataset({ identifier: id }) // Reactive
   useDataset({ identifier: () => id.value }) // Getter
   ```

3. **Template Usage**: No .value needed in templates
   ```vue
   <template>
     <div>{{ data?.title }}</div> <!-- Not data.value -->
   </template>
   ```

---

## See Also

**Prefer React?** Check out the [React Guide](./REACT_GUIDE.md) for React hooks with the same API.

**Key Differences:**
- React returns direct values, Vue returns reactive refs
- React uses callbacks for reactivity, Vue uses reactive parameters
- React requires explicit refetch, Vue auto-refetches on parameter changes

---

## Next Steps

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Drupal Integration](./DRUPAL_INTEGRATION.md) - Using in Drupal
- [Vue Package README](../packages/dkan-client-tools-vue/README.md) - Package details
- [Vue Demo App](../examples/vue-demo-app/) - Working example
