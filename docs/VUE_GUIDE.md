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


## Available Composables

All DKAN API methods are available as Vue composables. See **[API Reference](./API_REFERENCE.md)** for complete documentation of all composables including:

- **Dataset Composables**: `useDataset`, `useDatasetSearch`, `useCreateDataset`, `useUpdateDataset`, `usePatchDataset`, `useDeleteDataset`
- **Datastore Composables**: `useDatastore`, `useQueryDatastoreMulti`, `useSqlQuery`, `useDownloadQuery`
- **Data Dictionary Composables**: `useDataDictionary`, `useDataDictionaryList`, `useCreateDataDictionary`, `useUpdateDataDictionary`, `useDeleteDataDictionary`
- **Harvest Composables**: `useHarvestPlans`, `useHarvestPlan`, `useRegisterHarvestPlan`, `useRunHarvest`
- **Datastore Import Composables**: `useDatastoreImports`, `useDatastoreImport`, `useTriggerDatastoreImport`, `useDeleteDatastore`
- **Metastore Composables**: `useSchemas`, `useSchema`, `useSchemaItems`, `useDatasetFacets`
- **Revision/Moderation Composables**: `useRevisions`, `useRevision`, `useCreateRevision`, `useChangeDatasetState`

---

## Vue-Specific Patterns

### Template Integration

```vue
<script setup>
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

### Reactive Parameters with MaybeRefOrGetter

```vue
<script setup>
import { ref } from 'vue'
import { useDataset } from '@dkan-client-tools/vue'

const datasetId = ref('abc-123')

// Parameter automatically reactive - updates when datasetId changes
const { data, isLoading } = useDataset({
  identifier: datasetId
})
</script>

<template>
  <input v-model="datasetId" placeholder="Enter dataset ID" />
  <div v-if="isLoading">Loading...</div>
  <div v-else>{{ data?.title }}</div>
</template>
```

### Computed Parameters

```vue
<script setup>
import { ref, computed } from 'vue'
import { useDatasetSearch } from '@dkan-client-tools/vue'

const keyword = ref('')
const searchOptions = computed(() => ({
  keyword: keyword.value,
  'page-size': 10
}))

const { data } = useDatasetSearch({ searchOptions })
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

**Authentication and CORS**: See [Quick Start Guide](./QUICK_START.md) for authentication setup and CORS configuration.

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
