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

```typescript
// Token-based authentication
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    token: 'your-api-token',
  },
})

// Basic authentication
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: {
    username: 'admin',
    password: 'password',
  },
})
```

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

This package includes a script to record real API responses from a DKAN instance for testing and documentation purposes.

### Recording API Responses

#### Setup (Recommended)

Create a `.env` file in the core package directory:

```bash
cd packages/dkan-client-tools-core
cp .env.example .env
```

Edit `.env` with your DKAN instance details:

```env
DKAN_URL=http://dkan.ddev.site
DKAN_USER=admin
DKAN_PASS=admin
READ_ONLY=true
```

Then run:

```bash
# From project root
npm run record:api:readonly

# Or from core package directory
cd packages/dkan-client-tools-core
npm run record:api:readonly
```

#### Without .env File

You can also pass credentials as environment variables:

From the project root:

```bash
# Read-only mode (recommended for production sites)
npm run record:api:readonly

# With authentication (for harvest plans, revisions, etc.)
DKAN_URL=http://dkan.ddev.site \
DKAN_USER=admin \
DKAN_PASS=admin \
npm run record:api:readonly

# From a different DKAN site
DKAN_URL=https://demo.getdkan.org \
DKAN_USER=your-username \
DKAN_PASS=your-password \
npm run record:api:readonly
```

From the core package directory:

```bash
cd packages/dkan-client-tools-core

# Read-only mode without authentication
npm run record:api:readonly

# With authentication to access protected endpoints
DKAN_URL=http://dkan.ddev.site \
DKAN_USER=admin \
DKAN_PASS=admin \
npm run record:api:readonly

# Full mode (includes mutations - use with caution!)
DKAN_URL=http://dkan.ddev.site \
DKAN_USER=admin \
DKAN_PASS=admin \
npm run record:api
```

### What Gets Recorded

The script systematically calls all DKAN API methods and saves responses to JSON files in `src/__tests__/fixtures/`:

- **Read operations** - Always recorded
  - Dataset operations: get, search, list
  - Datastore queries and downloads
  - Data dictionaries
  - Harvest plans and runs
  - Metastore schemas and facets
  - Revisions

- **Write operations** - Skipped in read-only mode
  - Dataset create/update/delete (with automatic cleanup)
  - Data dictionary create/update/delete (with automatic cleanup)
  - Revision operations: createRevision, changeDatasetState
  - Harvest/datastore mutations (skipped - complex side effects)

### Cleanup & Safety

The script includes robust cleanup to prevent test data accumulation:

- **Pre-cleanup** - Removes orphaned test resources from previous failed runs
- **Post-cleanup** - Verifies all created resources were deleted
- **Unique IDs** - Uses UUIDs (not timestamps) to avoid collisions
- **Error recovery** - Cleanup runs even if the script crashes
- **Cleanup report** - Shows created/deleted/failed counts

Test resources use predictable prefixes:
- Datasets: `test-recorder-{uuid}`
- Data dictionaries: `test-dict-{uuid}`

#### Manual Cleanup

If test resources are orphaned, clean them up manually:

```bash
# Clean up orphaned test resources only (no recording)
CLEANUP_ONLY=true DKAN_USER=admin DKAN_PASS=admin npm run record:api
```

This mode finds all test resources (matching prefixes above), attempts to delete each one, and reports success/failure.

### Output Files

- `summary.json` - Complete recording summary with metadata
- `dataset-operations.json` - Dataset CRUD responses
- `datastore-operations.json` - Datastore query responses
- `data-dictionary.json` - Data dictionary responses
- `harvest.json` - Harvest plan/run responses
- `metastore.json` - Metastore schema responses
- `revisions.json` - Revision/moderation responses
- `openapi.json` - OpenAPI documentation responses

### Using Fixtures in Tests

```typescript
import datasetFixtures from '@dkan-client-tools/core/src/__tests__/fixtures/dataset-operations.json'

// Find specific response
const getDatasetResponse = datasetFixtures.find(f => f.method === 'getDataset')
expect(actualResponse).toEqual(getDatasetResponse.response)
```

## License

MIT
