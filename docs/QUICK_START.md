# Quick Start

Get up and running with DKAN Client Tools in 5 minutes.

## React Quick Start

### 1. Install

```bash
npm install @dkan-client-tools/core @dkan-client-tools/react @tanstack/react-query
```

### 2. Create Client & Provider

```tsx
// src/App.tsx
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider, useDatasetSearch } from '@dkan-client-tools/react'

const dkanClient = new DkanClient({
  baseUrl: 'https://demo.getdkan.org'
})

function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <DatasetList />
    </DkanClientProvider>
  )
}

export default App
```

### 3. Use Hooks

```tsx
// src/components/DatasetList.tsx
import { useDatasetSearch } from '@dkan-client-tools/react'

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

### Next Steps

- [Complete React Guide](./REACT_GUIDE.md)
- [React Package README](../packages/dkan-client-tools-react/README.md)
- [React Demo App](../examples/react-demo-app/)

---

## Vue Quick Start

### 1. Install

```bash
npm install @dkan-client-tools/core @dkan-client-tools/vue @tanstack/vue-query
```

### 2. Install Plugin

```typescript
// src/main.ts
import { createApp } from 'vue'
import { DkanClientPlugin } from '@dkan-client-tools/vue'
import App from './App.vue'

const app = createApp(App)

app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://demo.getdkan.org'
  }
})

app.mount('#app')
```

### 3. Use Composables

```vue
<!-- src/components/DatasetList.vue -->
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

### Next Steps

- [Complete Vue Guide](./VUE_GUIDE.md)
- [Vue Package README](../packages/dkan-client-tools-vue/README.md)
- [Vue Demo App](../examples/vue-demo-app/)

---

## Core Only (Vanilla JavaScript)

### 1. Install

```bash
npm install @dkan-client-tools/core
```

### 2. Create Client

```typescript
import { DkanClient } from '@dkan-client-tools/core'

const client = new DkanClient({
  baseUrl: 'https://demo.getdkan.org'
})

const apiClient = client.getApiClient()
```

### 3. Fetch Data

```typescript
// Search datasets
const searchResults = await apiClient.searchDatasets({
  'page-size': 10
})

console.log(searchResults.results)

// Get single dataset
const dataset = await apiClient.getDataset('dataset-id')
console.log(dataset.title)

// Query datastore
const data = await apiClient.queryDatastore('dataset-id', 0, {
  limit: 100
})

console.log(data.results)
```

### Next Steps

- [Core Package README](../packages/dkan-client-tools-core/README.md)
- [API Reference](./API_REFERENCE.md)
- [Vanilla Demo App](../examples/vanilla-demo-app/)

---

## With Authentication

Add authentication when creating the client:

```typescript
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    username: 'your-username',
    password: 'your-password'
  }
})
```

Or with token authentication:

```typescript
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    token: 'your-api-token'
  }
})
```

---

## Common Next Steps

**Search with filters:**
```typescript
const { data } = useDatasetSearch({
  searchOptions: { keyword: 'health', fulltext: 'covid', 'page-size': 20 }
})
```

**Query datastore:**
```typescript
const { data } = useDatastore({
  datasetId: 'dataset-id',
  index: 0,
  queryOptions: { limit: 50 }
})
```

**State values:** `data`, `isLoading`, `error`, `isSuccess`, `isFetching`

---

## Working with Local DKAN

```typescript
const client = new DkanClient({ baseUrl: 'https://dkan.ddev.site' })
```

**CORS issues?** Configure Vite proxy - see [React Guide](./REACT_GUIDE.md) or [Vue Guide](./VUE_GUIDE.md)

---

## Full Documentation

- **[Installation Guide](./INSTALLATION.md)** - Detailed installation instructions
- **[React Guide](./REACT_GUIDE.md)** - Complete React documentation
- **[Vue Guide](./VUE_GUIDE.md)** - Complete Vue documentation
- **[Drupal Integration](./DRUPAL_INTEGRATION.md)** - Using in Drupal
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
