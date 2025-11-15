# DKAN REST APIs

Technical documentation about DKAN's REST API endpoints and capabilities.

## Overview

DKAN provides RESTful APIs for managing open data catalogs. The APIs follow DCAT-US (Data Catalog Vocabulary) and Frictionless Table Schema standards for metadata and data dictionaries.

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
