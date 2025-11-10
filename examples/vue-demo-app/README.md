# DKAN Client Tools - Vue Demo App

This is a simple Vue 3 + TypeScript demo application that demonstrates the functionality of the `@dkan-client-tools/vue` package.

## Features Demonstrated

- **DKAN Client Plugin Setup**: Shows how to install and configure the DkanClientPlugin
- **Dataset Search**: Uses `useDatasetSearch` composable to search and display datasets from a DKAN catalog
- **Real-time Search**: Live search filtering with reactive Vue refs
- **Pagination**: Client-side pagination of search results
- **Loading States**: Proper handling of loading, error, and success states
- **TypeScript Integration**: Full TypeScript support

## Setup

The app is pre-configured to connect to the local DDEV DKAN site at `https://dkan.ddev.site` using a Vite proxy to avoid CORS issues.

### Prerequisites

- Node.js 20.19+ or 22.12+ (for Vite 7)
- npm 9.0+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### CORS Configuration

The app uses a Vite proxy in development to avoid CORS issues. The proxy is configured in `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://dkan.ddev.site',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

All requests to `/api/*` are forwarded to `https://dkan.ddev.site/api/*`.

**Note:** Make sure your local DDEV DKAN site is running before starting the app:
```bash
cd ../dkan
ddev start
```

## Code Structure

### `src/main.ts`

Shows how to install the DkanClientPlugin:

```typescript
import { DkanClientPlugin } from '@dkan-client-tools/vue'

app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://demo.getdkan.org',
  }
})
```

### `src/components/DatasetList.vue`

Demonstrates using the `useDatasetSearch` composable:

```typescript
import { useDatasetSearch } from '@dkan-client-tools/vue'
import { ref, computed } from 'vue'

const searchTerm = ref('')
const { data, isLoading, error } = useDatasetSearch({
  fulltext: searchTerm.value || undefined
})
```

## Available Composables

The `@dkan-client-tools/vue` package provides 40+ composables for working with DKAN data:

### Query Hooks
- `useDataset` - Fetch a single dataset
- `useDatasetSearch` - Search datasets
- `useAllDatasets` - Fetch all datasets
- `useDatastore` - Query datastore data
- `useSqlQuery` - Execute SQL queries
- `useDataDictionary` - Fetch data dictionaries
- `useSchemas` - List metastore schemas
- `useDatasetFacets` - Get dataset facets for filtering
- And many more...

### Mutation Hooks
- `useCreateDataset` - Create new datasets
- `useUpdateDataset` - Update existing datasets
- `useDeleteDataset` - Delete datasets
- `useTriggerDatastoreImport` - Trigger datastore imports
- And more...

## Changing the DKAN Instance

To connect to a different DKAN instance, update `src/main.ts`:

```typescript
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://your-dkan-site.com',
    // Optional authentication
    auth: {
      username: 'your-username',
      password: 'your-password'
    }
  }
})
```

## Learn More

- [DKAN Client Tools Documentation](https://github.com/GetDKAN/dkan-client-tools)
- [Vue Query Documentation](https://tanstack.com/query/latest/docs/vue/overview)
- [DKAN Documentation](https://dkan.readthedocs.io/)
