# Creating a Standalone Vue 3 App with DKAN Client Tools

This guide walks through creating a standalone Vue 3 application that uses the `@dkan-client-tools/vue` package to interact with a DKAN data catalog.

## Overview

The `@dkan-client-tools/vue` package provides comprehensive Vue composables for working with DKAN APIs, built on top of TanStack Vue Query for robust data fetching, caching, and state management.

## Prerequisites

- Node.js 20.19+ or 22.12+ (for Vite 7)
- npm 9.0+
- A DKAN instance to connect to (local or remote)

## Quick Start

### 1. Create a New Vite + Vue Project

```bash
npm create vite@latest my-dkan-app -- --template vue-ts
cd my-dkan-app
```

### 2. Install Dependencies

```bash
npm install
npm install @dkan-client-tools/vue @tanstack/vue-query
```

### 3. Configure the DKAN Client Plugin

Edit `src/main.ts` to install the DkanClientPlugin:

```typescript
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { DkanClientPlugin } from '@dkan-client-tools/vue'

const app = createApp(App)

// Install DKAN Client Plugin
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://demo.getdkan.org',
    // Optional authentication
    // auth: {
    //   username: 'your-username',
    //   password: 'your-password'
    // }
  }
})

app.mount('#app')
```

### 4. Create a Component Using DKAN Composables

Create `src/components/DatasetList.vue`:

```vue
<script setup lang="ts">
import { useDatasetSearch } from '@dkan-client-tools/vue'
import { ref, computed } from 'vue'

// Search state
const searchTerm = ref('')
const page = ref(1)
const pageSize = 10

// Build search options reactively
const searchOptions = computed(() => ({
  fulltext: searchTerm.value || undefined,
  page: page.value, // DKAN uses 1-based pagination
  'page-size': pageSize,
}))

// Execute search query
const { data: searchResults, isLoading, error } = useDatasetSearch({ searchOptions })

// Computed properties for display
const datasets = computed(() => searchResults.value?.results || [])
const totalResults = computed(() => searchResults.value?.total || 0)
const totalPages = computed(() => Math.ceil(totalResults.value / pageSize))

// Pagination functions
function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
  }
}
</script>

<template>
  <div class="dataset-list">
    <h2>DKAN Dataset Search</h2>

    <!-- Search input -->
    <div class="search-box">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search datasets..."
        class="search-input"
      />
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      Loading datasets...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      Error: {{ error.message }}
    </div>

    <!-- Results -->
    <div v-else>
      <div class="results-info">
        Found {{ totalResults }} datasets (Page {{ page }} of {{ totalPages }})
      </div>

      <div v-if="datasets.length === 0" class="no-results">
        No datasets found.
      </div>

      <div v-else class="dataset-items">
        <div
          v-for="dataset in datasets"
          :key="dataset.identifier"
          class="dataset-card"
        >
          <h3>{{ dataset.title }}</h3>
          <p v-if="dataset.description" class="description">
            {{ dataset.description.substring(0, 200) }}{{ dataset.description.length > 200 ? '...' : '' }}
          </p>
          <div class="metadata">
            <span class="tag">{{ dataset.accessLevel }}</span>
            <span v-if="dataset.modified" class="modified">
              Modified: {{ new Date(dataset.modified).toLocaleDateString() }}
            </span>
          </div>
          <div v-if="dataset.keyword && dataset.keyword.length > 0" class="keywords">
            <span v-for="keyword in dataset.keyword" :key="keyword" class="keyword">
              {{ keyword }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button @click="prevPage" :disabled="page === 1">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button @click="nextPage" :disabled="page === totalPages">Next</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dataset-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
}

.search-input:focus {
  outline: none;
  border-color: #42b983;
}

.loading, .error, .no-results {
  text-align: center;
  padding: 2rem;
}

.error {
  background: #fee;
  color: #c33;
  border-radius: 4px;
}

.dataset-card {
  padding: 1.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dataset-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```

### 5. Use the Component in Your App

Update `src/App.vue`:

```vue
<script setup lang="ts">
import DatasetList from './components/DatasetList.vue'
</script>

<template>
  <div id="app">
    <header>
      <h1>DKAN Client Tools - Vue Demo</h1>
      <p>Demonstrating @dkan-client-tools/vue package</p>
    </header>
    <main>
      <DatasetList />
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  background: #f5f5f5;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

main {
  padding: 2rem 0;
}
</style>
```

### 6. Run the Development Server

```bash
npm run dev
```

Visit http://localhost:5173 to see your app in action!

## Connecting to a Local DKAN Instance

If you have a local DKAN instance (e.g., via DDEV), you may need to configure a proxy to avoid CORS issues.

### Configure Vite Proxy

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://dkan.ddev.site',  // Your local DKAN URL
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

Then update `src/main.ts` to use an empty baseUrl:

```typescript
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: '',  // Proxy will forward /api requests
  }
})
```

## Available Composables

The package provides comprehensive composables for all DKAN APIs, including datasets, datastore, data dictionaries, harvest operations, metastore, revisions, and more. Each composable returns reactive refs and follows TanStack Query patterns.

For the complete composable reference, see the [package README](../packages/dkan-client-tools-vue/README.md).

## TypeScript Support

All composables include full TypeScript support with DCAT-US schema types:

```typescript
import { useDataset } from '@dkan-client-tools/vue'
import type { Dataset } from '@dkan-client-tools/core'

const { data, isLoading, error } = useDataset('dataset-id')
// data is typed as Ref<Dataset | undefined>
// TypeScript will provide autocomplete for all Dataset properties
```

## Advanced Configuration

### Custom Query Options

All composables accept TanStack Query options:

```typescript
const { data, isLoading } = useDatasetSearch(
  computed(() => ({ fulltext: searchTerm.value })),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    enabled: computed(() => !!searchTerm.value), // Only run when searchTerm has a value
  }
)
```

### Authentication

For authenticated requests:

```typescript
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://your-dkan-site.com',
    auth: {
      username: 'your-username',
      password: 'your-password'
    }
  }
})
```

Or use bearer tokens:

```typescript
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://your-dkan-site.com',
    headers: {
      'Authorization': 'Bearer your-token-here'
    }
  }
})
```

### Multiple DKAN Instances

To connect to multiple DKAN instances, create separate client instances:

```typescript
import { DkanClient } from '@dkan-client-tools/core'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

const app = createApp(App)

// Primary DKAN instance
app.use(DkanClientPlugin, {
  clientOptions: { baseUrl: 'https://primary-dkan.com' }
})

// For additional instances, create and provide clients manually
const secondaryDkanClient = new DkanClient({
  baseUrl: 'https://secondary-dkan.com',
  queryClient: new QueryClient()
})

app.provide('secondaryDkanClient', secondaryDkanClient)
```

## Using Mutations

Mutations allow you to create, update, and delete data:

```vue
<script setup lang="ts">
import { useCreateDataset } from '@dkan-client-tools/vue'
import { ref } from 'vue'

const newDatasetTitle = ref('')
const { mutate: createDataset, isPending, isSuccess, error } = useCreateDataset()

function handleSubmit() {
  createDataset({
    title: newDatasetTitle.value,
    description: 'A new dataset',
    accessLevel: 'public',
    modified: new Date().toISOString(),
    // ... other required fields
  }, {
    onSuccess: (dataset) => {
      console.log('Created dataset:', dataset.identifier)
      newDatasetTitle.value = ''
    },
    onError: (error) => {
      console.error('Failed to create dataset:', error)
    }
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="newDatasetTitle" placeholder="Dataset title" required />
    <button type="submit" :disabled="isPending">
      {{ isPending ? 'Creating...' : 'Create Dataset' }}
    </button>
    <div v-if="isSuccess" class="success">Dataset created!</div>
    <div v-if="error" class="error">{{ error.message }}</div>
  </form>
</template>
```

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Deploy Options

- **Static hosting**: Deploy the `dist/` folder to any static host (Netlify, Vercel, AWS S3, etc.)
- **Docker**: Create a Dockerfile with nginx to serve the static files
- **CDN**: Upload to a CDN for global distribution

## Project Structure Example

```
my-dkan-app/
├── src/
│   ├── components/
│   │   ├── DatasetList.vue      # Dataset listing component
│   │   ├── DatasetDetail.vue    # Dataset details component
│   │   └── DatastoreQuery.vue   # Datastore query component
│   ├── composables/              # Custom composables
│   │   └── useDebounce.ts       # Debounce helper
│   ├── types/                    # TypeScript types
│   │   └── index.ts
│   ├── App.vue                   # Root component
│   ├── main.ts                   # App entry point
│   └── style.css                 # Global styles
├── public/                       # Static assets
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

## Testing

Use Vitest with Vue Test Utils. Install the DkanClientPlugin in test setup:

```typescript
import { mount } from '@vue/test-utils'
import { DkanClientPlugin } from '@dkan-client-tools/vue'

mount(Component, {
  global: {
    plugins: [[DkanClientPlugin, {
      clientOptions: { baseUrl: 'https://test.example.com' }
    }]]
  }
})
```

## Performance Optimization

- **Lazy Loading**: Use `defineAsyncComponent()` for code splitting
- **Virtual Scrolling**: Use `vue-virtual-scroller` for large dataset lists
- **Query Prefetching**: Prefetch data using TanStack Query's `prefetchQuery`
- **Stale Time**: Configure appropriate `staleTime` to reduce network requests

## Troubleshooting

- **CORS Errors**: Use Vite proxy configuration or configure CORS on your DKAN server
- **TypeScript Errors**: Ensure `tsconfig.json` has `moduleResolution: "bundler"` and `types: ["vite/client"]`
- **SSR Hydration**: Prefetch queries server-side when using SSR (Nuxt)

## Next Steps

- See [examples/vue-demo-app](../examples/vue-demo-app/) for a complete working example
- Explore the [Vue package README](../packages/dkan-client-tools-vue/README.md) for full API reference
- Review [DKAN API documentation](../research/DKAN_API_RESEARCH.md) for backend details
- Learn about [Drupal integration](./DRUPAL_USAGE.md) for DKAN themes/modules
