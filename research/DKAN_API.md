# DKAN REST APIs

Technical documentation about DKAN's REST API endpoints and capabilities.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [DKAN Features](./DKAN_FEATURES.md)
- [Data Standards](./DATA_STANDARDS.md)
- [API Reference](../docs/API_REFERENCE.md)

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

DKAN provides RESTful APIs for managing open data catalogs. The APIs follow [DCAT-US and Frictionless standards](./DATA_STANDARDS.md) for metadata and data dictionaries. For more on DKAN platform features, see [DKAN Features](./DKAN_FEATURES.md).

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

Standard error format:

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
