# API Reference

Complete reference for all DKAN API methods in the core package.

## Overview

The `DkanApiClient` provides direct access to all DKAN REST API endpoints. For most applications, use the framework-specific hooks/composables from `@dkan-client-tools/react` or `@dkan-client-tools/vue` instead, as they provide automatic caching and better integration.

**When to use DkanApiClient directly:**
- Server-side operations (Node.js scripts, serverless functions)
- Custom integrations without TanStack Query
- One-off data fetches outside component lifecycle
- Building custom framework adapters

---

## Client Initialization

### Basic Setup

```typescript
import { DkanApiClient } from '@dkan-client-tools/core'

const client = new DkanApiClient({
  baseUrl: 'https://demo.getdkan.org'
})
```

### With Authentication

```typescript
// HTTP Basic Auth (recommended for DKAN 2.x)
const client = new DkanApiClient({
  baseUrl: 'https://demo.getdkan.org',
  auth: {
    username: 'admin',
    password: 'password'
  }
})

// Bearer Token (requires additional Drupal modules)
const client = new DkanApiClient({
  baseUrl: 'https://demo.getdkan.org',
  auth: {
    token: 'your-token-here'
  }
})
```

### With Custom Options

```typescript
const client = new DkanApiClient({
  baseUrl: 'https://demo.getdkan.org',
  defaultOptions: {
    retry: 3,              // Number of retry attempts
    retryDelay: 1000,      // Delay between retries (ms)
    staleTime: 0,          // Cache stale time
    cacheTime: 300000      // Cache time (5 minutes)
  }
})
```

---

## Dataset Operations

### getDataset()

Fetch a single dataset by identifier.

```typescript
async getDataset(
  identifier: string,
  options?: { showReferenceIds?: boolean }
): Promise<DkanDataset>
```

**Parameters:**
- `identifier` - Dataset UUID
- `options.showReferenceIds` - Include distribution identifiers

**Example:**

```typescript
const dataset = await client.getDataset('abc-123')
console.log(dataset.title)
console.log(dataset.description)

// With distribution identifiers
const datasetWithIds = await client.getDataset('abc-123', {
  showReferenceIds: true
})
console.log(datasetWithIds.distribution[0].identifier)
```

**Returns:** Dataset metadata with DCAT-US schema

---

### searchDatasets()

Search datasets with filters and pagination.

```typescript
async searchDatasets(options?: DatasetQueryOptions): Promise<DkanSearchResponse>
```

**Parameters:**
- `keyword` - Filter by keyword/tag
- `theme` - Filter by theme category
- `fulltext` - Full-text search across all fields
- `sort` - Sort field(s) - string or array
- `sort-order` - Sort order - 'asc' or 'desc'
- `page` - Page number (0-based)
- `page-size` - Results per page

**Example:**

```typescript
const results = await client.searchDatasets({
  keyword: 'environment',
  fulltext: 'water quality',
  'page-size': 20,
  page: 0,
  sort: 'modified',
  'sort-order': 'desc'
})

console.log(`Total: ${results.total}`)
results.results.forEach(dataset => {
  console.log(dataset.title)
})
```

**Returns:** Search results with total count, datasets array, and facets

---

### listAllDatasets()

Get all datasets with full metadata.

```typescript
async listAllDatasets(): Promise<DkanDataset[]>
```

**Example:**

```typescript
const allDatasets = await client.listAllDatasets()
console.log(`Total datasets: ${allDatasets.length}`)
```

**Returns:** Array of complete dataset objects

---

### createDataset()

Create a new dataset. Requires authentication.

```typescript
async createDataset(dataset: DkanDataset): Promise<MetastoreWriteResponse>
```

**Example:**

```typescript
const newDataset = {
  title: 'Water Quality Measurements',
  description: 'Monthly water quality data',
  identifier: 'water-quality-2025',
  accessLevel: 'public',
  modified: '2025-01-15',
  keyword: ['water', 'environment'],
  publisher: {
    name: 'Environmental Protection Agency'
  },
  contactPoint: {
    '@type': 'vcard:Contact',
    fn: 'Data Team',
    hasEmail: 'mailto:data@epa.gov'
  }
}

const response = await client.createDataset(newDataset)
console.log(`Created: ${response.identifier}`)
```

**Returns:** Write response with identifier and endpoint

---

### updateDataset()

Replace entire dataset. Requires authentication.

```typescript
async updateDataset(
  identifier: string,
  dataset: DkanDataset
): Promise<MetastoreWriteResponse>
```

**Example:**

```typescript
const existing = await client.getDataset('water-quality-2025')
existing.description = 'Updated description'
existing.modified = new Date().toISOString()

await client.updateDataset('water-quality-2025', existing)
```

**Returns:** Write response with identifier

---

### patchDataset()

Partially update dataset. Requires authentication.

```typescript
async patchDataset(
  identifier: string,
  partialDataset: Partial<DkanDataset>
): Promise<MetastoreWriteResponse>
```

**Example:**

```typescript
// Update only description
await client.patchDataset('water-quality-2025', {
  description: 'Updated description',
  modified: new Date().toISOString()
})

// Add keywords
await client.patchDataset('water-quality-2025', {
  keyword: ['water', 'environment', 'quality', 'monitoring']
})
```

**Returns:** Write response with identifier

---

### deleteDataset()

Delete a dataset. Requires authentication.

```typescript
async deleteDataset(identifier: string): Promise<{ message: string }>
```

**Example:**

```typescript
await client.deleteDataset('water-quality-2025')
console.log('Dataset deleted')
```

**Returns:** Confirmation message

---

## Datastore Query

### queryDatastore()

Query datastore data with SQL-like operations.

```typescript
async queryDatastore(
  datasetId: string,
  index?: number,
  options?: DatastoreQueryOptions,
  method?: 'GET' | 'POST'
): Promise<DkanDatastoreQueryResponse>
```

**Parameters:**
- `datasetId` - Dataset identifier
- `index` - Distribution index (default: 0)
- `options.conditions` - Filter conditions
- `options.limit` - Max records
- `options.offset` - Skip records
- `options.sorts` - Sort configuration
- `options.keys` - Specific columns
- `options.joins` - Join configuration
- `method` - HTTP method (default: POST)

**Example:**

```typescript
const data = await client.queryDatastore('dataset-id', 0, {
  limit: 100,
  offset: 0,
  conditions: [
    { property: 'status', value: 'active', operator: '=' }
  ],
  sorts: [
    { property: 'date', order: 'desc' }
  ],
  keys: ['name', 'date', 'value']
})

console.log(data.results)
console.log(data.schema.fields)
```

**Returns:** Query results with schema and rows

---

### queryDatastoreMulti()

Query multiple datastore resources with JOINs.

```typescript
async queryDatastoreMulti(
  options: DatastoreQueryOptions,
  method?: 'GET' | 'POST'
): Promise<DkanDatastoreQueryResponse>
```

**Example:**

```typescript
const results = await client.queryDatastoreMulti({
  resources: [
    { id: 'resource-1', alias: 'sales' },
    { id: 'resource-2', alias: 'products' }
  ],
  joins: [{
    resource: 'products',
    condition: { sales: 'product_id', products: 'id' }
  }],
  conditions: [
    { property: 'sales.amount', value: 100, operator: '>' }
  ],
  limit: 100
})
```

**Returns:** Query results with joined data

---

### getDatastoreSchema()

Get datastore schema with data dictionary.

```typescript
async getDatastoreSchema(
  datasetId: string,
  index?: number
): Promise<DkanDatastoreQueryResponse>
```

**Example:**

```typescript
const schema = await client.getDatastoreSchema('dataset-id', 0)
schema.schema.fields.forEach(field => {
  console.log(`${field.name}: ${field.type}`)
})
```

**Returns:** Schema information with empty results

---

### querySql()

Execute SQL queries using DKAN's bracket syntax.

```typescript
async querySql(options: SqlQueryOptions): Promise<SqlQueryResult>
```

**IMPORTANT:** DKAN uses bracket syntax, not standard SQL!

**Syntax Rules:**
1. Wrap each clause in brackets: `[SELECT * FROM dist-id]`
2. No spaces after commas: `[SELECT a,b,c FROM id]`
3. Double quotes for strings: `[WHERE status = "active"]`
4. ORDER BY requires ASC/DESC: `[ORDER BY name ASC]`
5. AND is only boolean operator
6. End with semicolon

**Example:**

```typescript
// Simple query
const results = await client.querySql({
  query: '[SELECT * FROM dist-id][LIMIT 10];'
})

// With WHERE and ORDER BY
const filtered = await client.querySql({
  query: '[SELECT name,status FROM dist-id][WHERE status = "active"][ORDER BY name ASC][LIMIT 100];'
})

// COUNT query
const count = await client.querySql({
  query: '[SELECT COUNT(*) FROM dist-id];'
})
console.log(count[0].expression)

// With database column names
const results = await client.querySql({
  query: '[SELECT * FROM dist-id][LIMIT 10];',
  show_db_columns: true
})
```

**Returns:** Array of row objects

---

## Datastore Download

### downloadQuery()

Download query results as CSV or JSON.

```typescript
async downloadQuery(
  datasetId: string,
  index: number,
  options?: QueryDownloadOptions
): Promise<Blob>
```

**Example:**

```typescript
// Download as CSV
const csvBlob = await client.downloadQuery('dataset-id', 0, {
  format: 'csv',
  limit: 1000,
  conditions: [
    { property: 'status', value: 'active', operator: '=' }
  ]
})

// Save file
const url = URL.createObjectURL(csvBlob)
const a = document.createElement('a')
a.href = url
a.download = 'data.csv'
a.click()

// Download as JSON
const jsonBlob = await client.downloadQuery('dataset-id', 0, {
  format: 'json',
  limit: 1000
})
```

**Returns:** Blob for file download

---

### downloadQueryByDistribution()

Download by distribution ID.

```typescript
async downloadQueryByDistribution(
  distributionId: string,
  options?: QueryDownloadOptions
): Promise<Blob>
```

**Example:**

```typescript
// Get distribution ID
const dataset = await client.getDataset('dataset-id', {
  showReferenceIds: true
})
const distId = dataset.distribution[0].identifier

// Download
const blob = await client.downloadQueryByDistribution(distId, {
  format: 'csv',
  limit: 500
})
```

**Returns:** Blob for file download

---

## Data Dictionary

### listDataDictionaries()

Get all data dictionaries.

```typescript
async listDataDictionaries(): Promise<DataDictionary[]>
```

**Example:**

```typescript
const dictionaries = await client.listDataDictionaries()
dictionaries.forEach(dict => {
  console.log(`${dict.identifier}: ${dict.data.title}`)
})
```

**Returns:** Array of data dictionaries

---

### getDataDictionary()

Get specific data dictionary.

```typescript
async getDataDictionary(identifier: string): Promise<DataDictionary>
```

**Example:**

```typescript
const dict = await client.getDataDictionary('dict-id')
dict.data.fields.forEach(field => {
  console.log(`${field.name}: ${field.type}`)
})
```

**Returns:** Data dictionary with field definitions

---

### getDataDictionaryFromUrl()

Fetch dictionary from external URL.

```typescript
async getDataDictionaryFromUrl(url: string): Promise<DataDictionary>
```

**Example:**

```typescript
const dict = await client.getDataDictionaryFromUrl(
  'https://example.com/dictionary.json'
)
```

**Returns:** Data dictionary from URL

---

### createDataDictionary()

Create new data dictionary. Requires authentication.

```typescript
async createDataDictionary(
  dictionary: DataDictionary
): Promise<MetastoreWriteResponse>
```

**Example:**

```typescript
const dictionary = {
  identifier: 'dict-water-quality',
  version: '1.0',
  data: {
    title: 'Water Quality Data Dictionary',
    fields: [
      {
        name: 'station_id',
        title: 'Station Identifier',
        type: 'string',
        description: 'Unique identifier for monitoring station',
        constraints: {
          required: true,
          unique: true
        }
      },
      {
        name: 'temperature',
        title: 'Water Temperature',
        type: 'number',
        description: 'Temperature in Celsius',
        constraints: {
          minimum: 0,
          maximum: 40
        }
      }
    ]
  }
}

const response = await client.createDataDictionary(dictionary)
console.log(`Created: ${response.identifier}`)
```

**Returns:** Write response with identifier

---

### updateDataDictionary()

Update data dictionary. Requires authentication.

```typescript
async updateDataDictionary(
  identifier: string,
  dictionary: DataDictionary
): Promise<MetastoreWriteResponse>
```

**Example:**

```typescript
const existing = await client.getDataDictionary('dict-id')
existing.data.fields.push({
  name: 'dissolved_oxygen',
  title: 'Dissolved Oxygen',
  type: 'number',
  description: 'Dissolved oxygen in mg/L',
  constraints: {
    minimum: 0,
    maximum: 20
  }
})

await client.updateDataDictionary('dict-id', existing)
```

**Returns:** Write response with identifier

---

### deleteDataDictionary()

Delete data dictionary. Requires authentication.

```typescript
async deleteDataDictionary(identifier: string): Promise<{ message: string }>
```

**Example:**

```typescript
await client.deleteDataDictionary('dict-id')
```

**Returns:** Confirmation message

---

## Harvest Operations

### listHarvestPlans()

List all harvest plan identifiers.

```typescript
async listHarvestPlans(): Promise<string[]>
```

**Example:**

```typescript
const plans = await client.listHarvestPlans()
console.log(`Plans: ${plans.join(', ')}`)
```

**Returns:** Array of plan identifiers

---

### getHarvestPlan()

Get specific harvest plan.

```typescript
async getHarvestPlan(planId: string): Promise<HarvestPlan>
```

**Example:**

```typescript
const plan = await client.getHarvestPlan('my-harvest')
console.log(plan.extract.uri)
```

**Returns:** Harvest plan configuration

---

### registerHarvestPlan()

Register new harvest plan. Requires authentication.

```typescript
async registerHarvestPlan(plan: HarvestPlan): Promise<MetastoreWriteResponse>
```

**Example:**

```typescript
const plan = {
  identifier: 'my-harvest',
  extract: {
    type: 'json',
    uri: 'https://source.org/data.json'
  },
  transforms: [],
  load: {
    destination: 'dataset'
  }
}

const response = await client.registerHarvestPlan(plan)
console.log(`Registered: ${response.identifier}`)
```

**Returns:** Write response with identifier

---

### listHarvestRuns()

List harvest runs for a plan.

```typescript
async listHarvestRuns(planId: string): Promise<string[]>
```

**Example:**

```typescript
const runs = await client.listHarvestRuns('my-harvest')
runs.forEach(runId => console.log(runId))
```

**Returns:** Array of run identifiers

---

### getHarvestRun()

Get harvest run details.

```typescript
async getHarvestRun(runId: string, planId: string): Promise<HarvestRun>
```

**Example:**

```typescript
const run = await client.getHarvestRun('run-id', 'my-harvest')
console.log(`Status: ${run.status}`)
console.log(`Created: ${run.created}`)
```

**Returns:** Harvest run with status and statistics

---

### runHarvest()

Execute harvest. Requires authentication.

```typescript
async runHarvest(options: HarvestRunOptions): Promise<HarvestRun>
```

**Example:**

```typescript
const run = await client.runHarvest({
  plan_id: 'my-harvest'
})
console.log(`Run ID: ${run.identifier}`)
```

**Returns:** Harvest run record

---

## Datastore Imports

### listDatastoreImports()

List all datastore imports.

```typescript
async listDatastoreImports(): Promise<Record<string, DatastoreImport>>
```

**Example:**

```typescript
const imports = await client.listDatastoreImports()
Object.entries(imports).forEach(([id, importRecord]) => {
  console.log(`${id}: ${importRecord.state}`)
})
```

**Returns:** Object mapping identifiers to import records

---

### getDatastoreStatistics()

Get datastore statistics.

```typescript
async getDatastoreStatistics(identifier: string): Promise<DatastoreStatistics>
```

**Example:**

```typescript
const stats = await client.getDatastoreStatistics('dist-id')
console.log(`Rows: ${stats.numOfRows}`)
console.log(`Columns: ${stats.numOfColumns}`)
```

**Returns:** Statistics with row/column counts

---

### triggerDatastoreImport()

Trigger datastore import. Requires authentication.

```typescript
async triggerDatastoreImport(
  options: DatastoreImportOptions
): Promise<DatastoreImport>
```

**Example:**

```typescript
const importRecord = await client.triggerDatastoreImport({
  resource: 'dist-id'
})
console.log(`Import state: ${importRecord.state}`)
```

**Returns:** Import record with initial status

---

### deleteDatastore()

Delete datastore. Requires authentication.

```typescript
async deleteDatastore(identifier: string): Promise<{ message: string }>
```

**Example:**

```typescript
await client.deleteDatastore('dist-id')
console.log('Datastore deleted')
```

**Returns:** Confirmation message

---

## Metastore

### listSchemas()

List available metastore schemas.

```typescript
async listSchemas(): Promise<string[]>
```

**Example:**

```typescript
const schemas = await client.listSchemas()
console.log(schemas) // ['dataset', 'data-dictionary', ...]
```

**Returns:** Array of schema identifiers

---

### getSchema()

Get specific schema definition.

```typescript
async getSchema(schemaId: string): Promise<JsonSchema>
```

**Example:**

```typescript
const schema = await client.getSchema('dataset')
console.log(schema.properties)
```

**Returns:** JSON Schema definition

---

### getSchemaItems()

Get all items for a schema type.

```typescript
async getSchemaItems(
  schemaId: string,
  options?: { showReferenceIds?: boolean }
): Promise<any[]>
```

**Example:**

```typescript
// Get all datasets
const datasets = await client.getSchemaItems('dataset')

// With reference IDs
const datasetsWithIds = await client.getSchemaItems('dataset', {
  showReferenceIds: true
})
```

**Returns:** Array of items

---

### getDatasetFacets()

Get facet values for filtering.

```typescript
async getDatasetFacets(): Promise<{
  theme: string[]
  keyword: string[]
  publisher: string[]
}>
```

**Example:**

```typescript
const facets = await client.getDatasetFacets()
console.log('Themes:', facets.theme)
console.log('Keywords:', facets.keyword)
console.log('Publishers:', facets.publisher)
```

**Returns:** Object with theme, keyword, and publisher arrays

---

## Revisions & Moderation

### getRevisions()

Get all revisions for an item.

```typescript
async getRevisions(
  schemaId: string,
  identifier: string
): Promise<MetastoreRevision[]>
```

**Example:**

```typescript
const revisions = await client.getRevisions('dataset', 'dataset-id')
revisions.forEach(rev => {
  console.log(`${rev.timestamp}: ${rev.state}`)
})
```

**Returns:** Array of revision records

---

### getRevision()

Get specific revision.

```typescript
async getRevision(
  schemaId: string,
  identifier: string,
  revisionId: string
): Promise<MetastoreRevision>
```

**Example:**

```typescript
const revision = await client.getRevision('dataset', 'dataset-id', '1')
console.log(revision.data)
```

**Returns:** Revision record with data

---

### createRevision()

Create new revision. Requires authentication.

```typescript
async createRevision(
  schemaId: string,
  identifier: string,
  revision: MetastoreNewRevision
): Promise<MetastoreWriteResponse>
```

**Example:**

```typescript
await client.createRevision('dataset', 'dataset-id', {
  state: 'published',
  message: 'Publishing dataset'
})
```

**Returns:** Write response with identifier

---

### changeDatasetState()

Change dataset workflow state. Requires authentication.

```typescript
async changeDatasetState(
  identifier: string,
  state: WorkflowState,
  message?: string
): Promise<MetastoreWriteResponse>
```

**Example:**

```typescript
// Publish dataset
await client.changeDatasetState('dataset-id', 'published')

// Archive with message
await client.changeDatasetState('dataset-id', 'archived',
  'No longer maintained'
)
```

**Returns:** Write response with identifier

---

## Utility Methods

### getBaseUrl()

Get configured base URL.

```typescript
getBaseUrl(): string
```

**Example:**

```typescript
const url = client.getBaseUrl()
console.log(url) // 'https://demo.getdkan.org'
```

**Returns:** Base URL without trailing slash

---

### getDefaultOptions()

Get default options.

```typescript
getDefaultOptions(): {
  retry: number
  retryDelay: number
  staleTime: number
  cacheTime: number
}
```

**Example:**

```typescript
const options = client.getDefaultOptions()
console.log(`Retry attempts: ${options.retry}`)
```

**Returns:** Copy of default options

---

### getOpenApiDocsUrl()

Get OpenAPI specification URL.

```typescript
getOpenApiDocsUrl(): string
```

**Example:**

```typescript
const specUrl = client.getOpenApiDocsUrl()
// Open in Swagger UI
window.open(`https://petstore.swagger.io/?url=${encodeURIComponent(specUrl)}`)
```

**Returns:** URL to OpenAPI spec

---

## Error Handling

All methods throw `DkanApiError` on failure:

```typescript
import { DkanApiError } from '@dkan-client-tools/core'

try {
  const dataset = await client.getDataset('invalid-id')
} catch (error) {
  if (error instanceof DkanApiError) {
    console.error(`Status: ${error.status}`)
    console.error(`Message: ${error.message}`)
    console.error(`Response: ${error.response}`)
  }
}
```

**DkanApiError Properties:**
- `message` - Error message
- `status` - HTTP status code
- `response` - Raw error response
- `timestamp` - Error timestamp (if provided)
- `data` - Additional error data (if provided)

---

## Type Definitions

All TypeScript types are exported from the core package:

```typescript
import type {
  DkanDataset,
  DkanSearchResponse,
  DkanDatastoreQueryResponse,
  DatasetQueryOptions,
  DatastoreQueryOptions,
  DataDictionary,
  HarvestPlan,
  HarvestRun,
  DatastoreImport,
  MetastoreRevision,
  WorkflowState,
  // ... and more
} from '@dkan-client-tools/core'
```

---

## Next Steps

- [Installation Guide](./INSTALLATION.md) - Install packages
- [Quick Start](./QUICK_START.md) - Get started quickly
- [React Guide](./REACT_GUIDE.md) - Using React hooks
- [Vue Guide](./VUE_GUIDE.md) - Using Vue composables
- [Build Process](./BUILD_PROCESS.md) - Build system documentation
