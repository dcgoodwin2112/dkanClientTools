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

### Dataset Operations

- `getDataset(identifier)` - Get a single dataset
- `searchDatasets(options)` - Search for datasets
- `listAllDatasets()` - Get all datasets
- `createDataset(dataset)` - Create a new dataset
- `updateDataset(identifier, dataset)` - Update a dataset
- `patchDataset(identifier, partialDataset)` - Partially update a dataset
- `deleteDataset(identifier)` - Delete a dataset

### Datastore Operations

- `queryDatastore(datasetId, index, options)` - Query datastore data
- `downloadQuery(datasetId, index, options)` - Download query results
- `downloadQueryByDistribution(distributionId, options)` - Download by distribution
- `querySql(options)` - Execute SQL query

### Data Dictionary Operations

- `getDataDictionary(options)` - Get a data dictionary
- `listDataDictionaries()` - List all data dictionaries
- `getDatastoreSchema(identifier, index)` - Get datastore schema
- `createDataDictionary(dictionary)` - Create data dictionary
- `updateDataDictionary(identifier, dictionary)` - Update data dictionary
- `deleteDataDictionary(identifier)` - Delete data dictionary

### Harvest Operations

- `listHarvestPlans()` - List harvest plans
- `getHarvestPlan(planId)` - Get a harvest plan
- `registerHarvestPlan(plan)` - Register a new harvest plan
- `runHarvest(options)` - Run a harvest
- `listHarvestRuns(planId)` - List harvest runs
- `getHarvestRun(runId)` - Get harvest run status

### Metastore Operations

- `listSchemas()` - List available schemas
- `getSchemaItems(schemaId)` - Get items for a schema
- `getDatasetFacets()` - Get dataset facets
- `getSchema(schemaId)` - Get schema definition

**Note**: Dataset Properties API methods (getDatasetProperties, getPropertyValues, getAllPropertiesWithValues) are not available in DKAN 2.x as the endpoints return 404.

### Datastore Import Operations

- `listDatastoreImports()` - List datastore imports
- `triggerDatastoreImport(options)` - Trigger a datastore import
- `deleteDatastore(identifier)` - Delete a datastore

### Revision/Moderation Operations

- `getRevisions(schemaId, identifier)` - Get all revisions
- `getRevision(schemaId, identifier, revisionId)` - Get a specific revision
- `createRevision(schemaId, identifier, revision)` - Create a new revision
- `changeDatasetState(identifier, state, message)` - Change dataset workflow state

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
