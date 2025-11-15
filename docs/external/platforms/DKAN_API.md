# DKAN REST APIs

Technical documentation about DKAN's REST API endpoints and capabilities.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [DKAN Features](./DKAN.md)
- [Data Standards](../standards/DATA_STANDARDS.md)
- [API Reference](../../API_REFERENCE.md)

## Quick Reference

**Base URL**: `/api/1/`

**Authentication**:
- HTTP Basic Auth (standard): `Authorization: Basic base64(user:pass)`
- Bearer tokens: Requires additional Drupal modules (NOT default)

**Common Endpoints**:
- Get dataset: `GET /metastore/schemas/dataset/items/{id}`
- Search datasets: `GET /search?keyword=term`
- Query datastore: `POST /datastore/query/{datasetId}/{index}`

**HTTP Methods**:
- GET - Read operations (no auth required for public data)
- POST - Create new items (auth required)
- PUT - Replace entire item (auth required)
- PATCH - Update specific fields (auth required)
- DELETE - Remove item (auth required)

**Common Query Parameters**:
- `show-reference-ids` - Include internal UUIDs
- `page` - Pagination (default: 1)
- `pageSize` - Results per page (default: 10, max: 500)

---

## Overview

DKAN provides RESTful APIs for managing open data catalogs. The APIs follow [DCAT-US and Frictionless standards](../standards/DATA_STANDARDS.md) for metadata and data dictionaries. For more on DKAN platform features, see [DKAN Features](./DKAN.md).

**Base API Path:** `/api/1/`

**Data Format:** JSON

**Authentication:** HTTP Basic Auth (standard) or Bearer tokens (requires additional modules)

---

## API Categories

DKAN's REST APIs are organized into functional categories:

1. **Metastore API** - Dataset metadata (DCAT-US schema)
2. **Search API** - Dataset search with faceting
3. **Datastore API** - Query and download data
4. **Data Dictionary API** - Frictionless Table Schemas
5. **Harvest API** - External data source harvesting
6. **Revision API** - Content moderation and versioning

---

## Choosing the Right API

### Dataset Metadata vs Data Rows

**Metastore API** - Manages metadata (title, description, publisher, distributions):
- **Use when**: Creating/updating catalog entries, managing dataset descriptions
- **Returns**: DCAT-US formatted JSON with dataset metadata
- **Example**: "What datasets are available about housing?" → metadata
- **Not for**: Accessing actual data rows in CSV/Excel files

**Datastore API** - Accesses actual tabular data:
- **Use when**: Querying data rows, generating reports, data analysis
- **Returns**: Tabular data in CSV or JSON format
- **Example**: "Show me all housing records for 2023" → data rows
- **Not for**: Dataset descriptions or catalog search

**Decision Guide**:
```
Need dataset title/description/publisher? → Metastore API
Need actual data rows from CSV/Excel?     → Datastore API
Need both?                                 → Use both (fetch metadata, then query data)
```

### Search vs Direct Access

**Search API** (`/api/1/search`):
- **Use when**:
  - Building catalog search interfaces
  - Filtering by keyword, theme, publisher
  - Faceted search with aggregations
  - User doesn't know exact dataset ID
- **Returns**: Array of datasets matching search criteria
- **Performance**: Optimized for keyword/facet searches
- **Example**: "Find all datasets tagged 'transportation'"

**Metastore GET** (`/metastore/schemas/dataset/items/{id}`):
- **Use when**:
  - Fetching single dataset by known ID
  - Need complete metadata with all fields
  - Programmatic access with dataset UUID
- **Returns**: Single dataset with full DCAT-US metadata
- **Performance**: Faster for single dataset lookups
- **Example**: "Get dataset abc-123"

**Decision Guide**:
```
User entering keywords to search?     → Search API
Know exact dataset ID?                 → Metastore GET
Building discovery interface?          → Search API
Loading specific dataset details?      → Metastore GET
```

### Datastore Query API vs SQL API

**Query API** (`POST /datastore/query/{datasetId}/{index}`):
- **Use when**:
  - Simple filtering and sorting
  - Programmatic access with JSON configuration
  - Need structured query format
  - Building UI with filter controls
- **Syntax**: JSON-based filters, sorts, pagination
- **Example**: Filter rows where `year > 2020`, sort by `population`

**SQL API** (`GET /datastore/sql?query=...`):
- **Use when**:
  - Complex queries (joins, aggregations, subqueries)
  - Familiar SQL syntax preferred
  - Need advanced analytics (GROUP BY, SUM, AVG)
  - Bulk data extraction
- **Syntax**: SQL SELECT statements with bracket notation for table names
- **Example**: `SELECT year, SUM(population) FROM [abc-123][0] GROUP BY year`

**Decision Guide**:
```
Simple filter/sort?                    → Query API
Need joins or aggregations?            → SQL API
Building filter UI?                    → Query API
Familiar with SQL?                     → SQL API
One-off data analysis?                 → SQL API
Programmatic filtering?                → Query API
```

**Comparison**:

| Feature | Query API | SQL API |
|---------|-----------|---------|
| Syntax | JSON | SQL SELECT |
| Joins | No | Yes |
| Aggregations | No | Yes (GROUP BY, SUM, etc.) |
| Filtering | Yes | Yes (WHERE clause) |
| Sorting | Yes | Yes (ORDER BY) |
| Pagination | Yes | Manual (LIMIT/OFFSET) |
| Best for | UI filters | Analytics |

### Authentication Methods

**HTTP Basic Authentication**:
- **Use when**:
  - Standard DKAN 2.x installation
  - Simple username/password auth
  - Testing and development
  - Default authentication needed
- **Works**: Out-of-the-box with DKAN 2.x
- **Header**: `Authorization: Basic base64(username:password)`

**Bearer Token Authentication**:
- **Use when**:
  - Third-party integrations (OAuth clients)
  - Need fine-grained permissions
  - Token expiration required
  - Building external applications
- **Requires**: Additional Drupal modules (Simple OAuth or similar)
- **NOT default**: Must be configured separately
- **Header**: `Authorization: Bearer {token}`

**Decision Guide**:
```
Default DKAN installation?             → HTTP Basic Auth
Need OAuth integration?                → Bearer tokens (requires setup)
Testing/development?                   → HTTP Basic Auth
Production API for external apps?      → Bearer tokens (if configured)
```

### Common Use Cases

**Building a Dataset Catalog**:
1. Search API - Browse and filter datasets
2. Metastore API - Show dataset details
3. Datastore API - Preview data samples

**Data Analysis Dashboard**:
1. Metastore API - Get dataset metadata
2. SQL API - Run analytics queries (aggregations, joins)
3. Download API - Export results as CSV

**Dataset Management Tool**:
1. Metastore API - CRUD operations on datasets
2. Data Dictionary API - Manage table schemas
3. Harvest API - Import from external sources
4. Revision API - Track changes and approvals

**Public Data Portal**:
1. Search API - Homepage search
2. Metastore API - Dataset detail pages
3. Datastore API - Data previews and queries
4. Download API - Export data files

### Anti-Patterns (What to Avoid)

**❌ Using Search API for single dataset lookups**:
```typescript
// Bad - Slow and returns array
const results = await searchDatasets({ fulltext: datasetId })
const dataset = results[0]

// Good - Fast direct access
const dataset = await getDataset(datasetId)
```

**❌ Using Metastore API to query data rows**:
```typescript
// Wrong - Metastore is for metadata only
const metadata = await getDataset(datasetId)
// metadata doesn't contain actual data rows!

// Correct - Use Datastore API for data
const data = await queryDatastore(datasetId, 0, { conditions: [...] })
```

**❌ Making separate requests for each dataset in search results**:
```typescript
// Bad - N+1 query problem
const results = await searchDatasets({ keyword: 'housing' })
for (const result of results) {
  const fullDataset = await getDataset(result.identifier) // Slow!
}

// Good - Search results already include key metadata
const results = await searchDatasets({ keyword: 'housing' })
// Use results directly
```

**❌ Using SQL API for simple single-field filters**:
```typescript
// Overcomplicated - SQL not needed
const query = `SELECT * FROM [abc-123][0] WHERE year = '2023'`

// Simpler - Use Query API
const data = await queryDatastore('abc-123', 0, {
  conditions: [{ property: 'year', value: '2023' }]
})
```

---

## Real-World Usage Examples

Complete, production-ready examples demonstrating common DKAN workflows.

### Building a Dataset Catalog

#### Search with Pagination and Filtering

Complete example showing search, pagination, and theme filtering:

```typescript
interface CatalogParams {
  page: number
  pageSize: number
  keyword?: string
  theme?: string
}

async function fetchCatalog(params: CatalogParams) {
  try {
    const url = new URL('https://dkan.example.com/api/1/search')

    // Add pagination
    url.searchParams.append('page', params.page.toString())
    url.searchParams.append('page-size', params.pageSize.toString())

    // Add filters
    if (params.keyword) {
      url.searchParams.append('fulltext', params.keyword)
    }
    if (params.theme) {
      url.searchParams.append('theme', params.theme)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      datasets: data.results || [],
      total: data.total || 0,
      currentPage: params.page,
      totalPages: Math.ceil((data.total || 0) / params.pageSize)
    }
  } catch (error) {
    console.error('Catalog fetch failed:', error)
    throw error
  }
}

// Usage
const catalog = await fetchCatalog({
  page: 1,
  pageSize: 20,
  keyword: 'climate',
  theme: 'environment'
})

console.log(`Found ${catalog.total} datasets`)
console.log(`Showing page ${catalog.currentPage} of ${catalog.totalPages}`)
```

#### Dataset Details Page with Distributions

Fetch complete dataset metadata and list available distributions:

```typescript
interface Distribution {
  identifier: string
  title: string
  downloadURL: string
  mediaType: string
  format?: string
  description?: string
}

interface DatasetDetails {
  identifier: string
  title: string
  description: string
  modified: string
  publisher: {
    name: string
  }
  contactPoint: {
    fn: string
    hasEmail?: string
  }
  theme: string[]
  keyword: string[]
  distribution: Distribution[]
}

async function fetchDatasetDetails(datasetId: string): Promise<DatasetDetails> {
  try {
    const response = await fetch(
      `https://dkan.example.com/api/1/metastore/schemas/dataset/items/${datasetId}`
    )

    if (response.status === 404) {
      throw new Error(`Dataset ${datasetId} not found`)
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`)
    }

    const dataset = await response.json()

    // Ensure distributions is an array
    if (!dataset.distribution) {
      dataset.distribution = []
    }

    return dataset as DatasetDetails
  } catch (error) {
    console.error('Failed to load dataset details:', error)
    throw error
  }
}

// Usage
const dataset = await fetchDatasetDetails('abc-123')

console.log(`Title: ${dataset.title}`)
console.log(`Description: ${dataset.description}`)
console.log(`Distributions: ${dataset.distribution.length}`)

dataset.distribution.forEach((dist, index) => {
  console.log(`  ${index + 1}. ${dist.title} (${dist.format})`)
  console.log(`     Download: ${dist.downloadURL}`)
})
```

---

### Data Analysis Dashboard

#### Querying Datastore with Filters and Sorting

Complete example with multiple conditions, sorting, and pagination:

```typescript
interface DatastoreQueryParams {
  datasetId: string
  distributionIndex: number
  filters?: Array<{
    property: string
    value: string | number
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE'
  }>
  sort?: {
    property: string
    order: 'asc' | 'desc'
  }
  limit?: number
  offset?: number
}

async function queryDatastore(params: DatastoreQueryParams) {
  try {
    const query: any = {
      limit: params.limit || 100,
      offset: params.offset || 0
    }

    // Add conditions
    if (params.filters && params.filters.length > 0) {
      query.conditions = params.filters.map(f => ({
        property: f.property,
        value: f.value,
        operator: f.operator || '='
      }))
    }

    // Add sorting
    if (params.sort) {
      query.sorts = [{
        property: params.sort.property,
        order: params.sort.order
      }]
    }

    const response = await fetch(
      `https://dkan.example.com/api/1/datastore/query/${params.datasetId}/${params.distributionIndex}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      }
    )

    if (!response.ok) {
      throw new Error(`Datastore query failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      results: data.results || [],
      count: data.count || 0,
      schema: data.schema || {}
    }
  } catch (error) {
    console.error('Datastore query failed:', error)
    throw error
  }
}

// Usage: Find all records from 2023 where temperature > 75, sorted by date
const results = await queryDatastore({
  datasetId: 'abc-123',
  distributionIndex: 0,
  filters: [
    { property: 'year', value: '2023' },
    { property: 'temperature', value: 75, operator: '>' }
  ],
  sort: {
    property: 'date',
    order: 'desc'
  },
  limit: 50,
  offset: 0
})

console.log(`Found ${results.count} matching records`)
console.log('Results:', results.results)
```

#### Exporting Filtered Data as CSV

Download query results as CSV file:

```typescript
async function downloadDatastoreQuery(
  datasetId: string,
  distributionIndex: number,
  filters?: any[],
  format: 'csv' | 'json' = 'csv'
) {
  try {
    const query: any = {
      format: format
    }

    if (filters && filters.length > 0) {
      query.conditions = filters
    }

    const response = await fetch(
      `https://dkan.example.com/api/1/datastore/query/${datasetId}/${distributionIndex}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      }
    )

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    // Get filename from Content-Disposition header or create one
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = `datastore-export.${format}`

    if (contentDisposition) {
      const matches = /filename="(.+)"/.exec(contentDisposition)
      if (matches && matches[1]) {
        filename = matches[1]
      }
    }

    // Download file
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    return { success: true, filename }
  } catch (error) {
    console.error('Download failed:', error)
    throw error
  }
}

// Usage
await downloadDatastoreQuery(
  'abc-123',
  0,
  [{ property: 'year', value: '2023' }],
  'csv'
)
```

---

### Dataset Management (CRUD Operations)

#### Creating a New Dataset

Complete example with validation and error handling:

```typescript
interface CreateDatasetParams {
  title: string
  description: string
  contactName: string
  contactEmail: string
  publisherName: string
  accessLevel: 'public' | 'restricted public' | 'non-public'
  keywords?: string[]
  theme?: string[]
  landingPage?: string
}

async function createDataset(
  params: CreateDatasetParams,
  credentials: string
) {
  try {
    // Validate required fields
    if (!params.title || params.title.length < 3) {
      throw new Error('Title must be at least 3 characters')
    }
    if (!params.description) {
      throw new Error('Description is required')
    }

    // Build DCAT-US compliant dataset
    const dataset = {
      title: params.title,
      description: params.description,
      contactPoint: {
        fn: params.contactName,
        hasEmail: params.contactEmail
      },
      publisher: {
        name: params.publisherName
      },
      accessLevel: params.accessLevel,
      modified: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      keyword: params.keywords || [],
      theme: params.theme || []
    }

    if (params.landingPage) {
      dataset.landingPage = params.landingPage
    }

    const response = await fetch(
      'https://dkan.example.com/api/1/metastore/schemas/dataset/items',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataset)
      }
    )

    if (response.status === 401) {
      throw new Error('Authentication failed - check credentials')
    }

    if (response.status === 400) {
      const errorData = await response.json()
      throw new Error(`Validation error: ${JSON.stringify(errorData.errors || errorData.message)}`)
    }

    if (!response.ok) {
      throw new Error(`Failed to create dataset: ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: true,
      identifier: result.identifier,
      message: 'Dataset created successfully'
    }
  } catch (error) {
    console.error('Dataset creation failed:', error)
    throw error
  }
}

// Usage
const newDataset = await createDataset(
  {
    title: 'Annual Climate Data 2023',
    description: 'Temperature and precipitation data collected throughout 2023',
    contactName: 'Jane Doe',
    contactEmail: 'jane@example.com',
    publisherName: 'Environmental Research Institute',
    accessLevel: 'public',
    keywords: ['climate', 'temperature', 'precipitation', '2023'],
    theme: ['environment', 'climate']
  },
  btoa('admin:password')
)

console.log(`Created dataset: ${newDataset.identifier}`)
```

#### Updating an Existing Dataset

Example showing PUT (full replacement) vs PATCH (partial update):

```typescript
// PUT - Full replacement (all fields required)
async function replaceDataset(
  datasetId: string,
  dataset: any,
  credentials: string
) {
  try {
    const response = await fetch(
      `https://dkan.example.com/api/1/metastore/schemas/dataset/items/${datasetId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataset)
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Update failed: ${errorData.message}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Dataset replacement failed:', error)
    throw error
  }
}

// PATCH - Partial update (only changed fields)
async function updateDataset(
  datasetId: string,
  updates: Partial<any>,
  credentials: string
) {
  try {
    const response = await fetch(
      `https://dkan.example.com/api/1/metastore/schemas/dataset/items/${datasetId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Update failed: ${errorData.message}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Dataset update failed:', error)
    throw error
  }
}

// Usage - Update only description and keywords
await updateDataset(
  'abc-123',
  {
    description: 'Updated description with more detail',
    keyword: ['climate', 'temperature', 'precipitation', '2023', 'annual']
  },
  btoa('admin:password')
)
```

#### Deleting a Dataset

```typescript
async function deleteDataset(datasetId: string, credentials: string) {
  try {
    const response = await fetch(
      `https://dkan.example.com/api/1/metastore/schemas/dataset/items/${datasetId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      }
    )

    if (response.status === 404) {
      throw new Error(`Dataset ${datasetId} not found`)
    }

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`)
    }

    return {
      success: true,
      message: `Dataset ${datasetId} deleted successfully`
    }
  } catch (error) {
    console.error('Dataset deletion failed:', error)
    throw error
  }
}

// Usage with confirmation
const confirmDelete = confirm('Are you sure you want to delete this dataset?')
if (confirmDelete) {
  await deleteDataset('abc-123', btoa('admin:password'))
}
```

---

### Workflow State Management

#### Publishing a Draft Dataset

Complete workflow: draft → published state transition:

```typescript
async function publishDataset(datasetId: string, credentials: string) {
  try {
    // 1. Get current dataset to verify it exists
    const getResponse = await fetch(
      `https://dkan.example.com/api/1/metastore/schemas/dataset/items/${datasetId}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      }
    )

    if (!getResponse.ok) {
      throw new Error('Dataset not found or access denied')
    }

    const dataset = await getResponse.json()

    // 2. Change moderation state to 'published'
    const publishResponse = await fetch(
      `https://dkan.example.com/api/1/metastore/schemas/dataset/items/${datasetId}/state`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          state: 'published'
        })
      }
    )

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json()
      throw new Error(`Failed to publish: ${errorData.message}`)
    }

    return {
      success: true,
      datasetId: datasetId,
      title: dataset.title,
      message: 'Dataset published successfully'
    }
  } catch (error) {
    console.error('Publishing failed:', error)
    throw error
  }
}

// Usage
await publishDataset('abc-123', btoa('admin:password'))
```

#### Complete Workflow: Create, Review, Publish

```typescript
async function completeDatasetWorkflow(
  datasetParams: CreateDatasetParams,
  credentials: string
) {
  try {
    console.log('Step 1: Creating draft dataset...')
    const created = await createDataset(datasetParams, credentials)
    const datasetId = created.identifier

    console.log(`Step 2: Dataset created with ID: ${datasetId}`)
    console.log('Step 3: Reviewing dataset...')

    // Simulate review process
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Step 4: Publishing dataset...')
    await publishDataset(datasetId, credentials)

    console.log('✓ Workflow complete - dataset is now published')

    return {
      success: true,
      datasetId: datasetId,
      publicUrl: `https://dkan.example.com/dataset/${datasetId}`
    }
  } catch (error) {
    console.error('Workflow failed:', error)
    throw error
  }
}

// Usage
const result = await completeDatasetWorkflow(
  {
    title: 'Q1 2023 Sales Report',
    description: 'Quarterly sales data by region',
    contactName: 'Sales Team',
    contactEmail: 'sales@example.com',
    publisherName: 'Marketing Department',
    accessLevel: 'public',
    keywords: ['sales', 'quarterly', '2023']
  },
  btoa('admin:password')
)

console.log(`Published at: ${result.publicUrl}`)
```

---

### Authentication Flow Example

#### Login and Persist Credentials

Complete authentication flow with credential storage:

```typescript
interface AuthCredentials {
  username: string
  password: string
  baseUrl: string
}

class DkanAuth {
  private credentials: string | null = null
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Try to load saved credentials (in real app, use more secure storage)
    this.credentials = sessionStorage.getItem('dkan_credentials')
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      // Encode credentials
      const credentials = btoa(`${username}:${password}`)

      // Test credentials by fetching dataset list
      const response = await fetch(
        `${this.baseUrl}/api/1/metastore/schemas/dataset/items`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        }
      )

      if (response.ok) {
        this.credentials = credentials
        sessionStorage.setItem('dkan_credentials', credentials)
        return true
      } else if (response.status === 401) {
        throw new Error('Invalid username or password')
      } else {
        throw new Error('Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  logout(): void {
    this.credentials = null
    sessionStorage.removeItem('dkan_credentials')
  }

  isAuthenticated(): boolean {
    return this.credentials !== null
  }

  getAuthHeader(): string {
    if (!this.credentials) {
      throw new Error('Not authenticated')
    }
    return `Basic ${this.credentials}`
  }

  async authenticatedFetch(path: string, options: RequestInit = {}): Promise<Response> {
    if (!this.credentials) {
      throw new Error('Not authenticated - please login first')
    }

    return fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/json'
      }
    })
  }
}

// Usage
const auth = new DkanAuth('https://dkan.example.com')

// Login
await auth.login('admin', 'password')

// Make authenticated requests
const response = await auth.authenticatedFetch(
  '/api/1/metastore/schemas/dataset/items',
  { method: 'GET' }
)

const datasets = await response.json()

// Logout when done
auth.logout()
```

---

## Metastore API

Manages dataset metadata following DCAT-US specification.

### Schema Endpoints

```
GET    /api/1/metastore/schemas
GET    /api/1/metastore/schemas/{schema_id}
GET    /api/1/metastore/schemas/{schema_id}/items
GET    /api/1/metastore/schemas/{schema_id}/items/{identifier}
POST   /api/1/metastore/schemas/{schema_id}/items
PUT    /api/1/metastore/schemas/{schema_id}/items/{identifier}
PATCH  /api/1/metastore/schemas/{schema_id}/items/{identifier}
DELETE /api/1/metastore/schemas/{schema_id}/items/{identifier}
```

**Common Schemas:**
- `dataset` - Dataset metadata (DCAT-US)
- `data-dictionary` - Table schemas (Frictionless)
- `distribution` - File/resource metadata
- `publisher` - Publisher/organization info

### Dataset Operations

**Get Single Dataset:**
```http
GET /api/1/metastore/schemas/dataset/items/{identifier}
```

Query Parameters:
- `show-reference-ids` - Include internal distribution UUIDs

**Create Dataset:**
```http
POST /api/1/metastore/schemas/dataset/items
Content-Type: application/json

{
  "title": "Dataset Title",
  "description": "Dataset description",
  "accessLevel": "public",
  "publisher": {
    "name": "Organization Name"
  },
  "contactPoint": {
    "@type": "vcard:Contact",
    "fn": "Contact Name",
    "hasEmail": "mailto:contact@example.com"
  },
  "keyword": ["tag1", "tag2"],
  "modified": "2025-01-15"
}
```

**Update Dataset (PUT):**
```http
PUT /api/1/metastore/schemas/dataset/items/{identifier}
Content-Type: application/json

{
  ... complete dataset object ...
}
```

**Partial Update (PATCH):**
```http
PATCH /api/1/metastore/schemas/dataset/items/{identifier}
Content-Type: application/json

{
  "description": "Updated description only"
}
```

**Delete Dataset:**
```http
DELETE /api/1/metastore/schemas/dataset/items/{identifier}
```

---

## Search API

Full-text search with faceting and filtering.

### Search Datasets

```http
GET /api/1/search
```

**Query Parameters:**
- `keyword` - Filter by keyword/tag
- `theme` - Filter by theme category
- `fulltext` - Full-text search
- `sort` - Sort field(s) (can be multiple)
- `sort-order` - Sort direction: asc or desc (can be multiple)
- `page` - Page number (0-based)
- `page-size` - Results per page

**Example:**
```http
GET /api/1/search?fulltext=water&page-size=20&page=0&sort=modified&sort-order=desc
```

**Response:**
```json
{
  "total": 150,
  "results": [
    {
      "identifier": "abc-123",
      "title": "Water Quality Data",
      "description": "...",
      ...
    }
  ],
  "facets": {
    "theme": ["Environment", "Health"],
    "keyword": ["water", "quality"]
  }
}
```

### Get Facets

```http
GET /api/1/search/facets
```

Returns all available facet values for filtering:
```json
[
  {
    "type": "theme",
    "values": [
      { "value": "Environment", "count": 45 },
      { "value": "Health", "count": 32 }
    ]
  },
  {
    "type": "keyword",
    "values": [...]
  },
  {
    "type": "publisher",
    "values": [...]
  }
]
```

---

## Datastore API

Query and download imported data.

### Query Datastore

**Single Resource:**
```http
POST /api/1/datastore/query/{dataset_id}/{index}
Content-Type: application/json

{
  "limit": 100,
  "offset": 0,
  "conditions": [
    {
      "property": "status",
      "value": "active",
      "operator": "="
    }
  ],
  "sorts": [
    {
      "property": "date",
      "order": "desc"
    }
  ],
  "keys": ["field1", "field2"]
}
```

**Multiple Resources (JOINs):**
```http
POST /api/1/datastore/query
Content-Type: application/json

{
  "resources": [
    { "id": "resource-1", "alias": "r1" },
    { "id": "resource-2", "alias": "r2" }
  ],
  "joins": [
    {
      "resource": "r2",
      "condition": {
        "r1": "id",
        "r2": "ref_id"
      }
    }
  ],
  "limit": 100
}
```

**Response:**
```json
{
  "schema": {
    "fields": [
      {
        "name": "field1",
        "type": "string",
        "format": "default"
      }
    ]
  },
  "results": [
    {
      "field1": "value1",
      "field2": "value2"
    }
  ],
  "count": 100
}
```

### Get Schema Only

```http
GET /api/1/datastore/query/{dataset_id}/{index}?schema=true
```

Returns schema without data rows.

### SQL Queries

**IMPORTANT:** DKAN uses custom bracket syntax, NOT standard SQL!

```http
GET /api/1/datastore/sql?query=[SELECT * FROM dist-id][LIMIT 10];
```

**Bracket Syntax Rules:**
1. Each clause wrapped in brackets: `[SELECT ...]`
2. No spaces after commas: `SELECT a,b,c`
3. Double quotes for strings: `WHERE status = "active"`
4. ORDER BY requires ASC/DESC: `ORDER BY name ASC`
5. AND is only boolean operator
6. End with semicolon

**Examples:**
```sql
-- Simple query
[SELECT * FROM {distribution-id}][LIMIT 10];

-- With filters
[SELECT name,status FROM {dist-id}][WHERE status = "active"][ORDER BY name ASC][LIMIT 100];

-- Count query
[SELECT COUNT(*) FROM {dist-id}];

-- Pagination
[SELECT * FROM {dist-id}][LIMIT 500 OFFSET 1000];
```

**POST Method:**
```http
POST /api/1/datastore/sql
Content-Type: application/json

{
  "query": "[SELECT * FROM {dist-id}][LIMIT 10];",
  "show_db_columns": false
}
```

### Download Data

```http
GET /api/1/datastore/query/{dataset_id}/{index}/download?format=csv&limit=1000
```

**Formats:** `csv`, `json`

**With Filters:**
```http
GET /api/1/datastore/query/{dataset_id}/{index}/download?format=csv&conditions=[{"property":"status","value":"active","operator":"="}]
```

---

## Data Dictionary API

Manage Frictionless Table Schemas for data validation and documentation.

### Get All Dictionaries

```http
GET /api/1/metastore/schemas/data-dictionary/items
```

### Get Single Dictionary

```http
GET /api/1/metastore/schemas/data-dictionary/items/{identifier}
```

### Create Dictionary

```http
POST /api/1/metastore/schemas/data-dictionary/items
Content-Type: application/json

{
  "identifier": "dict-id",
  "version": "1.0",
  "data": {
    "title": "Data Dictionary Title",
    "fields": [
      {
        "name": "field_name",
        "title": "Field Title",
        "type": "string",
        "description": "Field description",
        "constraints": {
          "required": true,
          "unique": false
        }
      },
      {
        "name": "numeric_field",
        "title": "Numeric Field",
        "type": "number",
        "constraints": {
          "minimum": 0,
          "maximum": 100
        }
      }
    ]
  }
}
```

**Field Types:**
- `string`, `number`, `integer`, `boolean`, `date`, `datetime`, `time`, `year`, `duration`, `geopoint`, `geojson`, `object`, `array`

---

## Harvest API

Manage external data source harvesting.

### List Harvest Plans

```http
GET /api/1/harvest/plans
```

Returns array of plan identifiers.

### Get Harvest Plan

```http
GET /api/1/harvest/plans/{plan_id}
```

### Register Harvest Plan

```http
POST /api/1/harvest/plans
Content-Type: application/json

{
  "identifier": "plan-id",
  "extract": {
    "type": "json",
    "uri": "https://source.org/data.json"
  },
  "transforms": [],
  "load": {
    "destination": "dataset"
  }
}
```

### Run Harvest

```http
POST /api/1/harvest/runs
Content-Type: application/json

{
  "plan_id": "plan-id"
}
```

### Get Harvest Runs

```http
GET /api/1/harvest/runs?plan={plan_id}
```

### Get Run Details

```http
GET /api/1/harvest/runs/{run_id}?plan={plan_id}
```

**Run Status Fields:**
- `status` - Current status
- `created` - Timestamp
- `errors` - Error messages
- `extract` - Items extracted
- `load` - Items loaded

---

## Datastore Import API

Manage datastore import operations.

### List Imports

```http
GET /api/1/datastore/imports
```

Returns object mapping distribution IDs to import records.

### Get Import Status

```http
GET /api/1/datastore/imports/{identifier}
```

**Response:**
```json
{
  "numOfRows": 1500,
  "numOfColumns": 8,
  "columns": {
    "field1": {
      "type": "string",
      "length": 255
    }
  }
}
```

### Trigger Import

```http
POST /api/1/datastore/imports
Content-Type: application/json

{
  "resource": "{distribution_id}"
}
```

### Delete Import

```http
DELETE /api/1/datastore/imports/{identifier}
```

---

## Revision API

Content moderation and workflow management.

### Get Revisions

```http
GET /api/1/metastore/schemas/{schema_id}/items/{identifier}/revisions
```

### Get Single Revision

```http
GET /api/1/metastore/schemas/{schema_id}/items/{identifier}/revisions/{revision_id}
```

### Create Revision (Change State)

```http
POST /api/1/metastore/schemas/{schema_id}/items/{identifier}/revisions
Content-Type: application/json

{
  "state": "published",
  "message": "Publishing dataset"
}
```

**Workflow States:**
- `draft` - Work in progress
- `published` - Public
- `archived` - No longer active

---

## Authentication

### HTTP Basic Authentication

**Recommended for DKAN 2.x** - Works out-of-the-box.

```http
Authorization: Basic {base64(username:password)}
```

**Example:**
```javascript
const credentials = btoa('admin:password')
fetch('https://dkan.example.com/api/1/metastore/schemas/dataset/items', {
  headers: {
    'Authorization': `Basic ${credentials}`
  }
})
```

### Bearer Token Authentication

Requires additional Drupal modules (Simple OAuth, etc.). Not supported by default.

```http
Authorization: Bearer {token}
```

### Anonymous Access

All GET endpoints for public data are accessible without authentication.

---

### Authentication Implementation Examples

Complete implementation examples for different HTTP clients and environments.

#### Fetch API (Browser)

**Basic Authentication:**

```typescript
// Encode credentials
const username = 'admin'
const password = 'your-password'
const credentials = btoa(`${username}:${password}`)

// GET request with authentication
async function fetchDataset(datasetId: string) {
  try {
    const response = await fetch(
      `https://dkan.example.com/api/1/metastore/schemas/dataset/items/${datasetId}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies if needed
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - check credentials')
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch dataset:', error)
    throw error
  }
}
```

**POST/PUT with Authentication:**

```typescript
async function createDataset(dataset: any) {
  try {
    const response = await fetch(
      'https://dkan.example.com/api/1/metastore/schemas/dataset/items',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa('admin:password')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataset),
        credentials: 'include'
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to create dataset: ${errorData.message}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Dataset creation failed:', error)
    throw error
  }
}
```

**CORS Considerations:**

```typescript
// For cross-origin requests, server must send proper CORS headers
// If you get CORS errors, use a proxy during development:

// Option 1: Vite proxy (vite.config.ts)
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://dkan.example.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
}

// Then use relative URLs:
fetch('/api/1/metastore/schemas/dataset/items')
```

---

#### Axios (Node.js/Browser)

**Basic Configuration:**

```typescript
import axios, { AxiosInstance } from 'axios'

// Create configured Axios instance
const dkanClient: AxiosInstance = axios.create({
  baseURL: 'https://dkan.example.com',
  headers: {
    'Content-Type': 'application/json'
  },
  auth: {
    username: 'admin',
    password: 'your-password'
  }
})

// Use the client
async function getDataset(id: string) {
  try {
    const response = await dkanClient.get(`/api/1/metastore/schemas/dataset/items/${id}`)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.status, error.response?.data)
    }
    throw error
  }
}
```

**With Interceptors for Error Handling:**

```typescript
// Add response interceptor for centralized error handling
dkanClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed - redirecting to login')
      // Redirect to login or refresh token
    }
    return Promise.reject(error)
  }
)
```

**Bearer Token (if using OAuth module):**

```typescript
const dkanClient = axios.create({
  baseURL: 'https://dkan.example.com',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})

// Token refresh interceptor
dkanClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Refresh token logic (if implemented)
        const newToken = await refreshAccessToken()
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return dkanClient(originalRequest)
      } catch (refreshError) {
        // Redirect to login
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
```

**Environment Variables (Node.js):**

```typescript
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const dkanClient = axios.create({
  baseURL: process.env.DKAN_BASE_URL,
  auth: {
    username: process.env.DKAN_USERNAME || '',
    password: process.env.DKAN_PASSWORD || ''
  }
})

// .env file:
// DKAN_BASE_URL=https://dkan.example.com
// DKAN_USERNAME=admin
// DKAN_PASSWORD=your-password
```

---

#### cURL (Command Line)

**Basic Authentication:**

```bash
# GET request with Basic Auth
curl -X GET \
  'https://dkan.example.com/api/1/metastore/schemas/dataset/items/abc-123' \
  -H 'Authorization: Basic YWRtaW46cGFzc3dvcmQ=' \
  -H 'Content-Type: application/json'

# Or use -u flag (curl handles base64 encoding)
curl -X GET \
  -u admin:password \
  'https://dkan.example.com/api/1/metastore/schemas/dataset/items/abc-123'
```

**POST Request - Create Dataset:**

```bash
curl -X POST \
  'https://dkan.example.com/api/1/metastore/schemas/dataset/items' \
  -u admin:password \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "My New Dataset",
    "description": "Dataset description",
    "contactPoint": {
      "fn": "Jane Doe",
      "hasEmail": "jane@example.com"
    },
    "publisher": {
      "name": "My Organization"
    },
    "accessLevel": "public",
    "modified": "2025-01-15"
  }'
```

**PUT Request - Update Dataset:**

```bash
curl -X PUT \
  'https://dkan.example.com/api/1/metastore/schemas/dataset/items/abc-123' \
  -u admin:password \
  -H 'Content-Type: application/json' \
  -d @dataset.json  # Read JSON from file
```

**DELETE Request:**

```bash
curl -X DELETE \
  'https://dkan.example.com/api/1/metastore/schemas/dataset/items/abc-123' \
  -u admin:password
```

**Bearer Token:**

```bash
curl -X GET \
  'https://dkan.example.com/api/1/metastore/schemas/dataset/items/abc-123' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json'
```

**Save Response to File:**

```bash
curl -X GET \
  -u admin:password \
  'https://dkan.example.com/api/1/datastore/query/abc-123/0' \
  -o dataset-data.json
```

---

#### Node.js Native HTTPS

**Using Built-in HTTPS Module:**

```typescript
import https from 'https'

interface DkanRequestOptions {
  hostname: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  username: string
  password: string
  body?: any
}

function makeDkanRequest(options: DkanRequestOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const credentials = Buffer.from(`${options.username}:${options.password}`).toString('base64')

    const requestOptions: https.RequestOptions = {
      hostname: options.hostname,
      path: options.path,
      method: options.method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    }

    if (options.body) {
      const bodyData = JSON.stringify(options.body)
      requestOptions.headers!['Content-Length'] = Buffer.byteLength(bodyData)
    }

    const req = https.request(requestOptions, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data))
          } catch {
            resolve(data)
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

// Usage
async function example() {
  try {
    const dataset = await makeDkanRequest({
      hostname: 'dkan.example.com',
      path: '/api/1/metastore/schemas/dataset/items/abc-123',
      method: 'GET',
      username: 'admin',
      password: 'your-password'
    })
    console.log('Dataset:', dataset)
  } catch (error) {
    console.error('Request failed:', error)
  }
}
```

**With Environment Variables:**

```typescript
import https from 'https'
import dotenv from 'dotenv'

dotenv.config()

const DKAN_CONFIG = {
  hostname: process.env.DKAN_HOSTNAME || 'dkan.example.com',
  username: process.env.DKAN_USERNAME || '',
  password: process.env.DKAN_PASSWORD || ''
}

// Never log credentials
if (!DKAN_CONFIG.username || !DKAN_CONFIG.password) {
  throw new Error('DKAN credentials not configured in environment variables')
}
```

---

### Security Best Practices

#### Never Commit Credentials

```typescript
// ❌ NEVER do this
const username = 'admin'
const password = 'my-secret-password' // Committed to git!

// ✅ Use environment variables
const username = process.env.DKAN_USERNAME
const password = process.env.DKAN_PASSWORD

// Add to .gitignore:
// .env
// .env.local
// credentials.json
```

#### Environment Variables

**Node.js (.env file):**

```bash
# .env (add to .gitignore!)
DKAN_BASE_URL=https://dkan.example.com
DKAN_USERNAME=admin
DKAN_PASSWORD=your-secure-password
```

**Browser (Build-time):**

```typescript
// Vite: VITE_ prefix
const baseUrl = import.meta.env.VITE_DKAN_BASE_URL

// Create React App: REACT_APP_ prefix
const baseUrl = process.env.REACT_APP_DKAN_BASE_URL
```

**NOTE**: Don't store passwords in browser environment variables - they're visible in bundled code. Use a backend proxy for authenticated requests.

#### Token Storage (Browser)

```typescript
// For OAuth tokens (if using Simple OAuth module)

// ❌ Bad - localStorage is vulnerable to XSS
localStorage.setItem('token', accessToken)

// ✅ Better - httpOnly cookie (set by server)
// Server sets: Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict

// ✅ Alternative - sessionStorage (cleared on tab close)
sessionStorage.setItem('token', accessToken)

// Best: Use a backend-for-frontend (BFF) pattern
// Frontend calls your Node.js backend
// Backend handles DKAN authentication
```

#### HTTPS Requirement

```typescript
// ❌ NEVER use Basic Auth over HTTP
fetch('http://dkan.example.com/api/...', {
  headers: { 'Authorization': `Basic ${credentials}` }
})
// Credentials are sent in plaintext!

// ✅ Always use HTTPS
fetch('https://dkan.example.com/api/...', {
  headers: { 'Authorization': `Basic ${credentials}` }
})

// Development exception: localhost
fetch('http://localhost:8080/api/...')  // OK for local development
```

#### Credential Validation

```typescript
// Validate credentials before use
function validateCredentials(username: string, password: string): boolean {
  if (!username || !password) {
    throw new Error('Username and password are required')
  }
  if (username.includes(':')) {
    throw new Error('Username cannot contain colon character')
  }
  return true
}

// Test credentials before making requests
async function testConnection(baseUrl: string, credentials: string) {
  try {
    const response = await fetch(`${baseUrl}/api/1/metastore/schemas/dataset/items`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    })
    return response.ok
  } catch {
    return false
  }
}
```

---

## Rate Limiting

DKAN does not enforce rate limiting by default, but Drupal sites may have:
- Web server rate limits (nginx, Apache)
- CDN rate limits
- Custom module rate limits

**Best Practices:**
- Implement client-side throttling
- Use pagination for large datasets
- Cache responses when appropriate
- Respect `Retry-After` headers if present

---

## Pagination

Most list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (0-based)
- `page-size` - Results per page

**Datastore Default Limit:** 500 rows

**Example:**
```http
GET /api/1/search?page=2&page-size=50
```

---

## Error Responses

### Standard Error Format

DKAN REST APIs return error responses in a consistent JSON format:

```json
{
  "message": "Error description",
  "data": {
    "additional": "context"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

### Common Error Scenarios

#### 401 Unauthorized

**When This Occurs:**
- Missing `Authorization` header
- Invalid credentials (wrong username/password)
- Expired or malformed token
- Attempting authenticated operations anonymously

**Example Response:**

```json
{
  "message": "Unauthorized: Invalid credentials",
  "status": 401
}
```

**With Basic Auth:**

```json
{
  "message": "Access denied for user anonymous",
  "status": 401
}
```

**How to Fix:**
1. Verify credentials are correct
2. Check `Authorization` header is properly formatted: `Basic ${btoa('username:password')}`
3. Ensure user account is active and has necessary permissions
4. For token auth, verify token hasn't expired

**Example:**

```typescript
// ❌ Missing auth header
fetch('https://dkan.example.com/api/1/metastore/schemas/dataset/items/abc-123', {
  method: 'DELETE'
})
// → 401 Unauthorized

// ✅ With proper auth
fetch('https://dkan.example.com/api/1/metastore/schemas/dataset/items/abc-123', {
  method: 'DELETE',
  headers: {
    'Authorization': `Basic ${btoa('admin:password')}`
  }
})
```

---

#### 404 Not Found

**When This Occurs:**
- Dataset, distribution, or resource doesn't exist
- Invalid UUID/identifier
- Incorrect API endpoint path
- Resource was deleted

**Example Response - Dataset Not Found:**

```json
{
  "message": "Error retrieving dataset: Dataset with id abc-123 not found",
  "status": 404
}
```

**Example Response - Endpoint Not Found:**

```json
{
  "message": "The requested page could not be found",
  "status": 404
}
```

**Distinguishing Different 404 Types:**

| Type | Message Pattern | Common Cause |
|------|----------------|--------------|
| Dataset | "Dataset with id {uuid} not found" | Invalid UUID or dataset deleted |
| Distribution | "Distribution not found" | Distribution removed from dataset |
| Endpoint | "The requested page could not be found" | Typo in URL path |
| Datastore | "No datastore for this resource" | Data not imported yet |

**How to Fix:**
1. Verify the UUID/identifier is correct
2. Check if the resource exists using list/search endpoints first
3. Ensure the API path is correct (check for typos)
4. For datastore errors, verify data has been imported

---

#### 400 Bad Request

**When This Occurs:**
- Invalid JSON syntax
- Missing required fields
- Invalid field values
- Malformed query parameters
- Schema validation failures

**Example Response - Invalid JSON:**

```json
{
  "message": "Syntax error in JSON request",
  "status": 400
}
```

**Example Response - Validation Errors:**

```json
{
  "message": "Validation failed",
  "errors": {
    "title": ["This field is required"],
    "contactPoint": {
      "fn": ["Contact name is required"]
    },
    "publisher": {
      "name": ["Publisher name must be at least 3 characters"]
    }
  },
  "status": 400
}
```

**Example Response - Invalid Datastore Query:**

```json
{
  "message": "Invalid datastore query syntax",
  "details": "Property 'invalid_column' does not exist in resource",
  "status": 400
}
```

**Common Validation Issues:**

| Field | Error | Fix |
|-------|-------|-----|
| `title` | Required field missing | Always include dataset title |
| `identifier` | Must be unique | Use UUID or ensure uniqueness |
| `contactPoint.fn` | Required nested field | Provide contact name |
| `distribution[].downloadURL` | Invalid URL format | Use valid HTTP/HTTPS URL |
| `keyword` | Must be array | Use `["keyword1", "keyword2"]` not `"keyword1"` |

**How to Fix:**
1. Validate JSON syntax before sending (use linter)
2. Check DCAT-US schema requirements for required fields
3. Verify datastore column names match imported data
4. Use proper data types (arrays, objects, strings)
5. Test with smaller requests to isolate the problematic field

**Example:**

```typescript
// ❌ Missing required fields
const invalidDataset = {
  description: "Some description"
  // Missing title, contactPoint, etc.
}

// ✅ Valid dataset with required fields
const validDataset = {
  title: "My Dataset",
  description: "Dataset description",
  contactPoint: {
    fn: "Jane Doe",
    hasEmail: "jane@example.com"
  },
  publisher: {
    name: "My Organization"
  },
  accessLevel: "public",
  modified: "2025-01-15"
}
```

---

#### 500 Internal Server Error

**When This Occurs:**
- Database connection issues
- PHP errors in DKAN/Drupal
- Module configuration problems
- Insufficient server resources
- Unhandled exceptions

**Example Response:**

```json
{
  "message": "Internal server error",
  "status": 500
}
```

**Example Response - Database Error:**

```json
{
  "message": "Error: Database connection failed",
  "status": 500
}
```

**What to Check:**
1. **Server Logs**: Check Drupal watchdog logs (`ddev drush watchdog:show`)
2. **PHP Errors**: Review PHP error logs
3. **Database**: Verify database is accessible and not at capacity
4. **Resources**: Check server memory/CPU usage
5. **Configuration**: Verify DKAN modules are properly configured

**Common Causes:**

| Cause | Symptom | Solution |
|-------|---------|----------|
| Database down | All requests fail | Restart database service |
| Out of memory | Random failures on large datasets | Increase PHP memory_limit |
| Module error | Specific endpoints fail | Check module status, clear cache |
| Datastore import | Failures during import | Check CSV format, file size |

**How to Fix:**
1. This is usually a server-side issue (not client error)
2. Contact site administrator
3. Check DKAN/Drupal status page
4. Review recent configuration changes
5. Try again after a few minutes (may be temporary)

**Example Error Handling:**

```typescript
try {
  const dataset = await fetch('https://dkan.example.com/api/1/metastore/schemas/dataset/items/abc-123')

  if (dataset.status === 500) {
    console.error('Server error - contact administrator')
    // Log to monitoring service
    // Show user-friendly error message
  }
} catch (error) {
  console.error('Request failed:', error)
}
```

---

#### 403 Forbidden

**When This Occurs:**
- Valid authentication but insufficient permissions
- User account exists but lacks required role
- Content access restrictions
- Operation not allowed for user's role

**Example Response:**

```json
{
  "message": "Access denied: Insufficient permissions to modify this resource",
  "status": 403
}
```

**How to Fix:**
1. Verify user has necessary Drupal permissions
2. Check content ownership and moderation state
3. Ensure user role has access to DKAN operations
4. Contact administrator to grant permissions

**401 vs 403:**
- **401**: "Who are you?" (authentication problem)
- **403**: "I know who you are, but you can't do that" (authorization problem)

---

## CORS

DKAN sites may have CORS restrictions. For development:

**Vite Proxy Example:**
```typescript
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://demo.getdkan.org',
        changeOrigin: true
      }
    }
  }
}
```

---

## Content Types

**Request:**
```http
Content-Type: application/json
```

**Response:**
- JSON endpoints: `application/json`
- CSV downloads: `text/csv`
- File downloads: `application/octet-stream`

---

## API Versioning

Current API version: **v1** (`/api/1/`)

DKAN uses URL-based versioning. Future versions would use `/api/2/`, etc.

---

## OpenAPI Specification

Machine-readable API documentation available at:
```
GET /api/1
```

Returns OpenAPI 3.0 specification in JSON format. Can be used with:
- Swagger UI
- Redoc
- Postman
- API testing tools

---

## References

- **DKAN Documentation:** https://dkan.readthedocs.io
- **DCAT-US Specification:** https://resources.data.gov/resources/dcat-us/
- **Frictionless Table Schema:** https://specs.frictionlessdata.io/table-schema/
- **Project Open Data:** https://project-open-data.cio.gov/
