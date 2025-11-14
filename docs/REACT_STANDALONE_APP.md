# Creating a Standalone React App with DKAN Client Tools

This guide walks through creating a standalone React application that uses the `@dkan-client-tools/react` package to interact with a DKAN data catalog.

## Overview

The `@dkan-client-tools/react` package provides comprehensive React hooks for working with DKAN APIs, built on top of TanStack React Query for robust data fetching, caching, and state management.

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

### 5. Add Styles

Add CSS styling to your component as needed (CSS Modules, Tailwind, styled-components, etc.).

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

The package provides comprehensive hooks for all DKAN APIs, including datasets, datastore, data dictionaries, harvest operations, metastore, revisions, and more. Each hook follows TanStack Query patterns for loading states, error handling, and caching.

For the complete hook reference, see the [package README](../packages/dkan-client-tools-react/README.md).

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

Use Vitest with React Testing Library. Wrap components in `DkanClientProvider` with a test client:

```tsx
import { render } from '@testing-library/react'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '@dkan-client-tools/react'

const testClient = new DkanClient({
  baseUrl: 'https://test.example.com',
  defaultOptions: { retry: 0 }
})

render(
  <DkanClientProvider client={testClient}>
    <YourComponent />
  </DkanClientProvider>
)
```

## Performance Optimization

- **Lazy Loading**: Use `React.lazy()` and `Suspense` for code splitting
- **Virtual Scrolling**: Use `react-virtual` or `react-window` for large dataset lists
- **Query Prefetching**: Prefetch data on hover using TanStack Query's `prefetchQuery`
- **Optimistic Updates**: Update UI immediately using `onMutate` callback for better UX
- **Stale Time**: Configure appropriate `staleTime` to reduce unnecessary network requests

## Styling

Use any CSS solution compatible with Vite/React: Tailwind CSS, CSS Modules (built-in), styled-components, or plain CSS. The DKAN Client Tools package is styling-agnostic.

## Troubleshooting

- **CORS Errors**: Use Vite proxy configuration or configure CORS on your DKAN server
- **TypeScript Errors**: Ensure `tsconfig.json` has `moduleResolution: "bundler"` and `types: ["vite/client"]`
- **React 18/19**: Package supports both React 18 and 19

## Next Steps

- See [examples/react-demo-app](../examples/react-demo-app/) for a complete working example
- Explore the [React package README](../packages/dkan-client-tools-react/README.md) for full API reference
- Review [DKAN API documentation](../research/DKAN_API_RESEARCH.md) for backend details
- Learn about [Drupal integration](./DRUPAL_USAGE.md) for DKAN themes/modules