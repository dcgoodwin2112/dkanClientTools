# Creating a Standalone React App with DKAN Client Tools

This guide walks through creating a standalone React application that uses the `@dkan-client-tools/react` package to interact with a DKAN data catalog.

## Overview

The `@dkan-client-tools/react` package provides 40+ React hooks for working with DKAN APIs, built on top of TanStack React Query for robust data fetching, caching, and state management.

## Prerequisites

- Node.js 20.19+ or 22.12+ (for Vite 7)
- npm 9.0+
- A DKAN instance to connect to (local or remote)

## Quick Start

### 1. Create a New Vite + React Project

```bash
npm create vite@latest my-dkan-app -- --template react-ts
cd my-dkan-app
```

### 2. Install Dependencies

```bash
npm install
npm install @dkan-client-tools/core @dkan-client-tools/react @tanstack/react-query
```

### 3. Create the DKAN Client and Provider

Edit `src/App.tsx` to set up the DkanClient and wrap your app with DkanClientProvider:

```tsx
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '@dkan-client-tools/react'
import DatasetList from './components/DatasetList'

// Create DKAN client instance
const dkanClient = new DkanClient({
  baseUrl: 'https://demo.getdkan.org',
  // Optional: Configure default query options
  defaultOptions: {
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes (garbage collection time)
  },
  // Optional: Add authentication
  // auth: {
  //   username: 'your-username',
  //   password: 'your-password'
  // }
})

function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <div className="app">
        <header>
          <h1>DKAN Client Tools Demo</h1>
        </header>
        <main>
          <DatasetList />
        </main>
      </div>
    </DkanClientProvider>
  )
}

export default App
```

### 4. Create a Component Using DKAN Hooks

Create `src/components/DatasetList.tsx`:

```tsx
import { useDatasetSearch } from '@dkan-client-tools/react'
import { useState } from 'react'

export default function DatasetList() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Use the dataset search hook
  const { data, isLoading, error, isFetching } = useDatasetSearch({
    searchOptions: {
      keyword: searchKeyword || undefined,
      page: page, // DKAN uses 1-based pagination
      'page-size': pageSize,
    },
    staleTime: 30000, // Cache for 30 seconds
  })

  const datasets = data?.results || []
  const totalResults = data?.total || 0
  const totalPages = Math.ceil(totalResults / pageSize)

  if (isLoading) {
    return <div className="loading">Loading datasets...</div>
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>
  }

  return (
    <div className="dataset-list">
      <h2>DKAN Dataset Search</h2>

      {/* Search input */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search datasets by keyword..."
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value)
            setPage(1) // Reset to first page on new search
          }}
          className="search-input"
        />
        {isFetching && <span className="fetching">Updating...</span>}
      </div>

      {/* Results info */}
      <div className="results-info">
        Found {totalResults} datasets (Page {page} of {totalPages})
      </div>

      {/* Dataset cards */}
      {datasets.length === 0 ? (
        <div className="no-results">No datasets found.</div>
      ) : (
        <div className="dataset-items">
          {datasets.map((dataset) => (
            <div key={dataset.identifier} className="dataset-card">
              <h3>{dataset.title}</h3>
              {dataset.description && (
                <p className="description">
                  {dataset.description.substring(0, 200)}
                  {dataset.description.length > 200 ? '...' : ''}
                </p>
              )}
              <div className="metadata">
                <span className="tag">{dataset.accessLevel}</span>
                {dataset.modified && (
                  <span className="modified">
                    Modified: {new Date(dataset.modified).toLocaleDateString()}
                  </span>
                )}
              </div>
              {dataset.keyword && dataset.keyword.length > 0 && (
                <div className="keywords">
                  {dataset.keyword.map((keyword) => (
                    <span key={keyword} className="keyword">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
```

### 5. Add Some Basic Styles

Create `src/components/DatasetList.css`:

```css
.dataset-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.search-box {
  margin-bottom: 2rem;
  position: relative;
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
  border-color: #61dafb;
}

.fetching {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 0.9rem;
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
  transition: box-shadow 0.2s;
}

.dataset-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.metadata {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin: 0.5rem 0;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #61dafb;
  color: white;
  border-radius: 4px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.keyword {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #f0f0f0;
  color: #666;
  border-radius: 4px;
  font-size: 0.85rem;
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
  background: #61dafb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.pagination button:hover:not(:disabled) {
  background: #4fa8c5;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

Import the CSS in your component:

```tsx
import './DatasetList.css'
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
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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

Then update your DkanClient configuration to use an empty baseUrl:

```tsx
const dkanClient = new DkanClient({
  baseUrl: '',  // Proxy will forward /api requests
})
```

## Available Hooks

The `@dkan-client-tools/react` package provides 40+ hooks for working with DKAN:

### Query Hooks (Read Operations)

- **Dataset Operations**
  - `useDataset(identifier, options?)` - Fetch a single dataset by ID
  - `useDatasetSearch(options)` - Search datasets with filters
  - `useAllDatasets(options?)` - Fetch all datasets

- **Datastore Operations**
  - `useDatastore(params, options?)` - Query datastore data
  - `useSqlQuery(params, options?)` - Execute SQL queries
  - `useExecuteSqlQuery(params, options?)` - Execute SQL with different format
  - `useDownloadQuery(params, options?)` - Download query results
  - `useDownloadQueryByDistribution(params, options?)` - Download by distribution ID

- **Data Dictionary Operations**
  - `useDataDictionary(params, options?)` - Fetch data dictionary
  - `useDataDictionaryList(datasetId, options?)` - List data dictionaries
  - `useDataDictionaryFromUrl(url, options?)` - Fetch from external URL
  - `useDatastoreSchema(params, options?)` - Get datastore schema

- **Harvest Operations**
  - `useHarvestPlans(options?)` - List harvest plans
  - `useHarvestPlan(planId, options?)` - Get harvest plan details
  - `useHarvestRuns(planId, options?)` - List harvest runs for a plan
  - `useHarvestRun(runId, options?)` - Get harvest run details

- **Datastore Import Operations**
  - `useDatastoreImports(options?)` - List datastore imports
  - `useDatastoreImport(datasetId, index, options?)` - Get import details
  - `useDatastoreStatistics(datasetId, index, options?)` - Get import statistics

- **Metastore Operations**
  - `useSchemas(options?)` - List metastore schemas
  - `useSchemaItems(schemaId, options?)` - Get items for a schema
  - `useDatasetFacets(options?)` - Get dataset facets for filtering

- **Dataset Properties**
  - `useDatasetProperties(options?)` - List all properties
  - `usePropertyValues(propertyId, options?)` - Get values for a property
  - `useAllPropertiesWithValues(options?)` - Get all properties with their values

- **Revision/Moderation**
  - `useRevisions(datasetId, options?)` - List dataset revisions
  - `useRevision(datasetId, revisionId, options?)` - Get revision details

### Mutation Hooks (Write Operations)

- **Dataset Mutations**
  - `useCreateDataset(options?)` - Create a new dataset
  - `useUpdateDataset(options?)` - Update an existing dataset
  - `usePatchDataset(options?)` - Partially update a dataset
  - `useDeleteDataset(options?)` - Delete a dataset

- **Data Dictionary Mutations**
  - `useCreateDataDictionary(options?)` - Create a data dictionary
  - `useUpdateDataDictionary(options?)` - Update a data dictionary
  - `useDeleteDataDictionary(options?)` - Delete a data dictionary

- **Harvest Mutations**
  - `useRegisterHarvestPlan(options?)` - Register a new harvest plan
  - `useRunHarvest(options?)` - Trigger a harvest run

- **Datastore Import Mutations**
  - `useTriggerDatastoreImport(options?)` - Trigger datastore import
  - `useDeleteDatastore(options?)` - Delete datastore data

- **Revision/Moderation Mutations**
  - `useCreateRevision(options?)` - Create a new revision
  - `useChangeDatasetState(options?)` - Change dataset workflow state

## TypeScript Support

All hooks include full TypeScript support with DCAT-US schema types:

```tsx
import { useDataset } from '@dkan-client-tools/react'
import type { Dataset } from '@dkan-client-tools/core'

function DatasetDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useDataset(id)
  // data is typed as Dataset | undefined
  // TypeScript will provide autocomplete for all Dataset properties

  if (!data) return null

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
      {/* Full type safety for all properties */}
    </div>
  )
}
```

## Advanced Configuration

### Custom Query Options

All hooks accept TanStack Query options:

```tsx
const { data, isLoading } = useDatasetSearch({
  searchOptions: { keyword: searchTerm },
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: 3,
  enabled: !!searchTerm, // Only run when searchTerm is truthy
  refetchOnWindowFocus: false,
})
```

### Authentication

For authenticated requests:

```tsx
const dkanClient = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    username: 'your-username',
    password: 'your-password'
  }
})
```

Or use bearer tokens:

```tsx
const dkanClient = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  headers: {
    'Authorization': 'Bearer your-token-here'
  }
})
```

### Multiple DKAN Instances

To connect to multiple DKAN instances, create separate providers:

```tsx
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '@dkan-client-tools/react'

const primaryClient = new DkanClient({ baseUrl: 'https://primary-dkan.com' })
const secondaryClient = new DkanClient({ baseUrl: 'https://secondary-dkan.com' })

function App() {
  return (
    <DkanClientProvider client={primaryClient}>
      <PrimaryContent />
      <DkanClientProvider client={secondaryClient}>
        <SecondaryContent />
      </DkanClientProvider>
    </DkanClientProvider>
  )
}
```

## Using Mutations

Mutations allow you to create, update, and delete data:

```tsx
import { useCreateDataset } from '@dkan-client-tools/react'
import { useState } from 'react'

function CreateDatasetForm() {
  const [title, setTitle] = useState('')
  const { mutate, isPending, isSuccess, error } = useCreateDataset()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    mutate({
      title,
      description: 'A new dataset',
      accessLevel: 'public',
      modified: new Date().toISOString(),
      // ... other required fields
    }, {
      onSuccess: (dataset) => {
        console.log('Created dataset:', dataset.identifier)
        setTitle('') // Reset form
      },
      onError: (error) => {
        console.error('Failed to create dataset:', error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Dataset title"
        required
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Dataset'}
      </button>
      {isSuccess && <div className="success">Dataset created!</div>}
      {error && <div className="error">{error.message}</div>}
    </form>
  )
}
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
│   │   ├── DatasetList.tsx        # Dataset listing component
│   │   ├── DatasetList.css        # Component styles
│   │   ├── DatasetDetail.tsx      # Dataset details component
│   │   └── DatastoreQuery.tsx     # Datastore query component
│   ├── hooks/                      # Custom hooks
│   │   └── useDebounce.ts         # Debounce helper
│   ├── types/                      # TypeScript types
│   │   └── index.ts
│   ├── App.tsx                     # Root component with provider
│   ├── main.tsx                    # App entry point
│   └── index.css                   # Global styles
├── public/                         # Static assets
├── index.html                      # HTML entry point
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json
```

## Testing

### Unit Testing with Vitest

Install Vitest and testing libraries:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Example test:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '@dkan-client-tools/react'
import DatasetList from './DatasetList'

describe('DatasetList', () => {
  it('renders dataset titles', async () => {
    const mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 }
    })

    render(
      <DkanClientProvider client={mockClient}>
        <DatasetList />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/DKAN Dataset Search/i)).toBeInTheDocument()
    })
  })
})
```

Add Vitest config to `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

## Performance Optimization

### 1. Lazy Loading Components

```tsx
import { lazy, Suspense } from 'react'

const DatasetDetail = lazy(() => import('./components/DatasetDetail'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DatasetDetail />
    </Suspense>
  )
}
```

### 2. Virtual Scrolling for Large Lists

Use libraries like `react-virtual` or `react-window` for large dataset lists.

### 3. Query Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from '@dkan-client-tools/react'

function DatasetListItem({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const dkanClient = useDkanClient()

  const handleMouseEnter = () => {
    // Prefetch dataset details on hover
    queryClient.prefetchQuery({
      queryKey: ['dataset', id],
      queryFn: () => dkanClient.getDataset(id),
    })
  }

  return (
    <div onMouseEnter={handleMouseEnter}>
      {/* ... */}
    </div>
  )
}
```

### 4. Optimistic Updates

```tsx
import { useUpdateDataset } from '@dkan-client-tools/react'
import { useQueryClient } from '@tanstack/react-query'

function EditDataset({ dataset }) {
  const queryClient = useQueryClient()
  const { mutate } = useUpdateDataset()

  const handleUpdate = (updates) => {
    mutate({ identifier: dataset.identifier, ...updates }, {
      onMutate: async (newData) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(['dataset', dataset.identifier])

        // Snapshot previous value
        const previousDataset = queryClient.getQueryData(['dataset', dataset.identifier])

        // Optimistically update to new value
        queryClient.setQueryData(['dataset', dataset.identifier], newData)

        return { previousDataset }
      },
      onError: (err, newData, context) => {
        // Rollback on error
        queryClient.setQueryData(['dataset', dataset.identifier], context.previousDataset)
      },
      onSettled: () => {
        // Refetch after error or success
        queryClient.invalidateQueries(['dataset', dataset.identifier])
      },
    })
  }
}
```

## Styling Options

### Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure `tailwind.config.js`:

```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### CSS Modules

Vite supports CSS Modules out of the box:

```tsx
import styles from './DatasetList.module.css'

export default function DatasetList() {
  return <div className={styles.container}>...</div>
}
```

### Styled Components

```bash
npm install styled-components
```

```tsx
import styled from 'styled-components'

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`
```

## Troubleshooting

### CORS Errors

If you see CORS errors, use the Vite proxy configuration shown above or configure CORS on your DKAN server.

### TypeScript Errors

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "moduleResolution": "bundler",
    "types": ["vite/client"]
  }
}
```

### React 19 Support

The package supports both React 18 and React 19. If you encounter issues with React 19:

```bash
npm install react@^19.1.1 react-dom@^19.1.1 @types/react@^19.1.16 @types/react-dom@^19.1.9
```

## Next Steps

- Explore the [React package README](../packages/dkan-client-tools-react/README.md)
- Review [DKAN API documentation](../research/DKAN_API_RESEARCH.md)
- Check out [TanStack Query React documentation](https://tanstack.com/query/latest/docs/react/overview)
- See the [examples/react-demo-app](../examples/react-demo-app/) directory for a complete working example
- Learn about [Drupal integration](./DRUPAL_USAGE.md)

## Example Repository

See the included `examples/react-demo-app` directory for a complete, working example that demonstrates:
- DkanClient setup with provider
- Dataset search with live filtering
- Dataset details view
- Loading and error states
- TypeScript integration
- Vite proxy configuration for local DKAN
- Tailwind CSS styling
