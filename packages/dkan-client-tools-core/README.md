# @dkan-client-tools/core

Framework-agnostic core library for DKAN client tools. Provides API client and type definitions for querying DKAN data catalogs.

## Features

- 🎯 **Framework Agnostic** - Works with any JavaScript framework
- 🔍 **Type Safe** - Full TypeScript support with DCAT-US schema types
- 📦 **Lightweight** - Minimal dependencies (TanStack Query Core)
- 🎨 **Extensible** - Easy to build framework adapters
- 🔄 **Built on TanStack Query** - Leverages proven caching and state management

## Installation

```bash
npm install @dkan-client-tools/core
```

**Node.js Compatibility**: Requires Node.js 18+ for native `btoa()` support used in Basic Authentication. For Node.js < 18, consider using a polyfill or switch to token-based authentication.

## Usage

### DkanClient (Recommended)

The `DkanClient` wraps TanStack Query's `QueryClient` with DKAN-specific configuration:

```typescript
import { DkanClient } from '@dkan-client-tools/core'

// Create a client
const dkanClient = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    token: 'your-api-token', // Optional
  },
  defaultOptions: {
    retry: 3,
    retryDelay: 1000,
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
  },
})

// Access the underlying QueryClient
const queryClient = dkanClient.getQueryClient()

// Access the API client
const apiClient = dkanClient.getApiClient()
```

### DkanApiClient (Low-level API)

For direct API access without caching:

```typescript
import { DkanApiClient } from '@dkan-client-tools/core'

const apiClient = new DkanApiClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    username: 'admin',
    password: 'password',
  },
})

// Fetch a dataset
const dataset = await apiClient.getDataset('dataset-identifier')

// Search datasets
const results = await apiClient.searchDatasets({
  keyword: 'health',
  'page-size': 10,
})

// Query datastore
const data = await apiClient.queryDatastore('dataset-id', 0, {
  limit: 100,
  sorts: [{ property: 'date', order: 'desc' }],
})
```

## API Methods

The DkanApiClient provides comprehensive coverage of DKAN REST APIs across 7 categories:

- **Dataset Operations** (7 methods) - CRUD operations for DCAT-US datasets
- **Datastore Operations** (4 methods) - Query and download tabular data
- **Data Dictionary Operations** (6 methods) - Manage Frictionless table schemas
- **Harvest Operations** (6 methods) - External data source harvesting
- **Metastore Operations** (4 methods) - Schema definitions and faceted search
- **Datastore Import Operations** (3 methods) - Import management and statistics
- **Revision/Moderation Operations** (4 methods) - Content workflow state management

For complete method signatures, parameters, and examples, see [API Reference](../../docs/API_REFERENCE.md).

**Note**: Dataset Properties API (getDatasetProperties, getPropertyValues, getAllPropertiesWithValues) is not available in DKAN 2.x.

## Architecture

This package leverages [TanStack Query Core](https://tanstack.com/query) for state management and caching:

- **DkanClient** - Wraps QueryClient with DKAN configuration
- **DkanApiClient** - Low-level HTTP client for DKAN REST APIs
- **Type Definitions** - DCAT-US schema types and API response types

## Authentication

Supports two authentication methods:

### HTTP Basic Authentication (Recommended)

**Works with DKAN 2.x out-of-the-box.** This is the standard authentication method for DKAN.

```typescript
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    username: 'admin',
    password: 'password',
  },
})
```

### Bearer Token Authentication

**Requires additional Drupal modules.** Token authentication is NOT supported by DKAN 2.x by default. You must install and configure additional modules (e.g., Simple OAuth) on your DKAN instance to use this method.

```typescript
// Only works if your DKAN instance has token auth modules installed
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    token: 'your-api-token',
  },
})
```

**Note**: If you're using a standard DKAN 2.x installation, use Basic Authentication.

## TypeScript Types

All DCAT-US schema types are exported:

```typescript
import type {
  DkanDataset,
  Distribution,
  Publisher,
  ContactPoint,
  DataDictionary,
  DataDictionaryField,
  DatastoreQueryOptions,
  HarvestPlan,
  MetastoreRevision,
  WorkflowState,
} from '@dkan-client-tools/core'
```

## Error Handling

The package provides a custom error class:

```typescript
import { DkanApiError } from '@dkan-client-tools/core'

try {
  const dataset = await apiClient.getDataset('invalid-id')
} catch (error) {
  if (error instanceof DkanApiError) {
    console.error('API Error:', error.message, error.status)
  }
}
```

## API Response Recording

This package includes a script to record real API responses from a DKAN instance for testing purposes. Responses are saved to `src/__tests__/fixtures/` as JSON files.

**Quick Start**:

```bash
# From project root
npm run record:api:readonly
```

For complete documentation including setup, environment variables, cleanup procedures, output files, and usage examples, see [Fixtures Documentation](src/__tests__/fixtures/README.md).

## License

MIT
