# @dkan-client-tools/core

Framework-agnostic core library for DKAN client tools. Provides API client and type definitions for querying DKAN data catalogs.

## Features

- Framework agnostic - works with any JavaScript framework
- Type safe - full TypeScript support with DCAT-US schema types
- Lightweight - minimal dependencies (TanStack Query Core)
- Extensible - easy to build framework adapters
- Built on TanStack Query for caching and state management

## Installation

```bash
npm install @dkan-client-tools/core
```

Requires Node.js 18+ for native `btoa()` support (Basic Authentication). For older versions, use polyfill or token-based auth.

## Usage

### DkanClient (Recommended)

Wraps TanStack Query's QueryClient with DKAN-specific configuration:

```typescript
import { DkanClient } from '@dkan-client-tools/core'

const dkanClient = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: { token: 'your-api-token' },
  defaultOptions: { retry: 3, staleTime: 60000 },
})

const queryClient = dkanClient.getQueryClient()
const apiClient = dkanClient.getApiClient()
```

### DkanApiClient (Low-level API)

Direct API access without caching:

```typescript
import { DkanApiClient } from '@dkan-client-tools/core'

const apiClient = new DkanApiClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: { username: 'admin', password: 'password' },
})

const dataset = await apiClient.getDataset('dataset-id')
const results = await apiClient.searchDatasets({ keyword: 'health' })
const data = await apiClient.queryDatastore('dataset-id', 0, { limit: 100 })
```

## API Methods

DkanApiClient provides comprehensive DKAN REST API coverage:

- Dataset Operations (7) - DCAT-US CRUD
- Datastore Operations (4) - Query and download
- Data Dictionary Operations (6) - Frictionless schemas
- Harvest Operations (6) - External harvesting
- Metastore Operations (4) - Schema and facets
- Datastore Import Operations (3) - Import management
- Revision/Moderation Operations (4) - Workflow states

See [API Reference](../../docs/API_REFERENCE.md) for complete details. Dataset Properties API not available in DKAN 2.x.

## Architecture

Built on [TanStack Query Core](https://tanstack.com/query):

- **DkanClient** - QueryClient wrapper with DKAN configuration
- **DkanApiClient** - HTTP client for DKAN REST APIs
- **Type Definitions** - DCAT-US and API response types

## Authentication

### HTTP Basic (Recommended)

Standard for DKAN 2.x, works out-of-the-box:

```typescript
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: { username: 'admin', password: 'password' },
})
```

### Bearer Token

Requires additional Drupal modules (e.g., Simple OAuth). Not supported by default DKAN 2.x:

```typescript
const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com',
  auth: { token: 'your-api-token' },
})
```

## TypeScript Types

DCAT-US schema types exported:

```typescript
import type { DkanDataset, Distribution, Publisher, ContactPoint, DataDictionary,
  DataDictionaryField, DatastoreQueryOptions, HarvestPlan } from '@dkan-client-tools/core'
```

## Error Handling

```typescript
import { DkanApiError } from '@dkan-client-tools/core'

try {
  await apiClient.getDataset('invalid-id')
} catch (error) {
  if (error instanceof DkanApiError) console.error(error.message, error.status)
}
```

## API Response Recording

Record real API responses for testing (saved to `src/__tests__/fixtures/`):

```bash
npm run record:api:readonly
```

See [Fixtures Documentation](src/__tests__/fixtures/README.md) for setup and usage details.

## License

MIT
