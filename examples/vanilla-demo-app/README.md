# DKAN Client Tools - Vanilla JS Demo App

This is a simple vanilla JavaScript demo application that demonstrates the functionality of the `@dkan-client-tools/core` package.

## Features Demonstrated

- **DKAN Client Setup**: Shows how to set up DkanClient with QueryClient
- **Dataset Search**: Uses core client methods to search and display datasets from a DKAN catalog
- **Real-time Search**: Live search filtering with vanilla JavaScript
- **Pagination**: Client-side pagination of search results
- **Expandable Cards**: Click to expand cards and view additional dataset metadata
- **Loading States**: Proper handling of loading, error, and success states
- **No Framework Required**: Pure vanilla JavaScript implementation

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

The app will be available at `http://localhost:5175` (or the next available port).

### CORS Configuration

The app uses a Vite proxy in development to avoid CORS issues. The proxy is configured in `vite.config.js`:

```javascript
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
cd ../../dkan
ddev start
```

## Code Structure

### `index.html`

Static HTML structure with semantic markup for the dataset search interface.

### `src/main.js`

Shows how to use the core DKAN client:

```javascript
import { DkanClient, QueryClient } from '@dkan-client-tools/core'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
})

const dkanClient = new DkanClient({
  queryClient,
  baseUrl: '',  // Proxy handles this
})

// Search datasets
const data = await dkanClient.searchDatasets({
  fulltext: searchTerm || undefined,
  page: page,
  'page-size': pageSize,
})
```

### `src/style.css`

Styling that matches the React and Vue demo apps with a red color theme.

## Available Core Methods

The `@dkan-client-tools/core` package provides 43 methods across 8 categories:

### Dataset Operations
- `getDataset(id)` - Fetch a single dataset
- `searchDatasets(options)` - Search datasets
- `getAllDatasets()` - Fetch all datasets
- `createDataset(data)` - Create new dataset
- `updateDataset(id, data)` - Update existing dataset
- `patchDataset(id, data)` - Partially update dataset
- `deleteDataset(id)` - Delete dataset

### Datastore Operations
- `queryDatastore(datasetId, index, query)` - Query datastore data
- `executeSqlQuery(datasetId, index, query)` - Execute SQL queries
- `downloadQuery(datasetId, query)` - Download query results
- `downloadQueryByDistribution(datasetId, distributionId, query)` - Download by distribution

### Data Dictionary Operations
- `getDataDictionary(datasetId, index)` - Fetch data dictionary
- `getDataDictionaryList(datasetId)` - List all dictionaries
- `getDataDictionaryFromUrl(url)` - Fetch dictionary from URL
- `getDatastoreSchema(datasetId, index)` - Get datastore schema

### And many more...

## Changing the DKAN Instance

To connect to a different DKAN instance, update `src/main.js`:

```javascript
const dkanClient = new DkanClient({
  queryClient,
  baseUrl: 'https://your-dkan-site.com',
  // Optional authentication
  auth: {
    username: 'your-username',
    password: 'your-password'
  }
})
```

## Learn More

- [DKAN Client Tools Documentation](https://github.com/GetDKAN/dkan-client-tools)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [DKAN Documentation](https://dkan.readthedocs.io/)
