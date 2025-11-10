# DKAN API Research Documentation

## Executive Summary

DKAN is an open-source data catalog platform built on Drupal that provides RESTful APIs for managing and querying open data. It follows the DCAT-US (Data Catalog Vocabulary - US Schema) metadata standard based on Project Open Data requirements. This document provides comprehensive information about DKAN APIs to support the development of a query client library.

**Key Findings:**
- DKAN provides REST APIs but does NOT support GraphQL
- Two main API versions: Legacy (7.x-1.x) and Modern (2.x)
- CKAN-compatible read-only API for harvesting
- Full CRUD operations for datasets and resources
- Powerful datastore query capabilities with filtering, sorting, and pagination
- DCAT-US compliant metadata structure

---

## 1. REST API Endpoints

### 1.1 Modern DKAN 2.x API (Recommended)

#### Metastore Endpoints (Dataset Metadata)

**Get Single Dataset**
```
GET /api/1/metastore/schemas/dataset/items/{datasetID}?show-reference-ids
```
- Returns complete dataset metadata including distributions
- `show-reference-ids`: Optional parameter to include reference identifiers

**List All Datasets**
```
GET /api/1/metastore/schemas/dataset/items
```
- Returns array of all dataset metadata objects

**Create Dataset**
```
POST /api/1/metastore/schemas/dataset/items
Content-Type: application/json
Authorization: Basic {base64_credentials}

{
  "title": "My new dataset",
  "description": "Detailed description for my new dataset.",
  "accessLevel": "public",
  "identifier": "unique-dataset-id",
  "modified": "2022-06-01",
  "keyword": ["tag1", "tag2"],
  "publisher": {
    "name": "Publisher Name"
  },
  "contactPoint": {
    "fn": "Contact Name",
    "hasEmail": "contact@example.com"
  },
  "distribution": [
    {
      "downloadURL": "http://example.com/data.csv",
      "mediaType": "text/csv",
      "format": "csv",
      "title": "Resource Title"
    }
  ]
}
```

**Update Dataset**
```
PUT /api/1/metastore/schemas/dataset/items/{datasetID}
Content-Type: application/json
Authorization: Basic {base64_credentials}
```

**Delete Dataset**
```
DELETE /api/1/metastore/schemas/dataset/items/{datasetID}
Authorization: Basic {base64_credentials}
```

**Dataset Revisions**
```
GET /api/1/metastore/schemas/dataset/items/{datasetID}/revisions
```
- Returns revision history for a dataset

**Update Moderation State**
```
POST /api/1/metastore/schemas/dataset/items/{datasetID}/revisions
Content-Type: application/json
Authorization: Basic {base64_credentials}

{
  "state": "published",
  "message": "Publishing dataset"
}
```
Available states: `draft`, `published`, `hidden`, `orphaned`, `archived`

#### Datastore Query Endpoints (Actual Data)

**Query Dataset Data (POST)**
```
POST /api/1/datastore/query/{datasetID}/{index}
Content-Type: application/json

{
  "conditions": [
    {
      "property": "column_name",
      "value": "search_value",
      "operator": "="
    }
  ],
  "properties": ["column1", "column2"],
  "sorts": [
    {
      "property": "column_name",
      "order": "asc"
    }
  ],
  "limit": 100,
  "offset": 0
}
```

**Query Dataset Data (GET)**
```
GET /api/1/datastore/query/{datasetID}/{index}?conditions[0][property]=column_name&conditions[0][value]=search_value&conditions[0][operator]==&limit=100&offset=0
```

**Parameters:**
- `{datasetID}`: The unique identifier (UUID) of the dataset
- `{index}`: The distribution index (usually 0 for the first/only distribution)
- `conditions`: Array of filter conditions
- `properties`: Array of column names to return (omit for all columns)
- `sorts`: Array of sorting instructions
- `limit`: Maximum rows to return (default ~500)
- `offset`: Number of rows to skip (for pagination)
- `rowIds`: Specific row IDs to retrieve

**Supported Operators:**
- `=`: Equals
- `!=`: Not equals
- `>`: Greater than
- `<`: Less than
- `>=`: Greater than or equal
- `<=`: Less than or equal
- `like`: Pattern matching
- `match`: Fulltext search (searches across multiple columns)

**JOIN Query (Multiple Resources)**
```
POST /api/1/datastore/query
Content-Type: application/json

{
  "resources": [
    {"id": "{datasetID1}", "alias": "t1"},
    {"id": "{datasetID2}", "alias": "t2"}
  ],
  "properties": [
    {"resource": "t1", "property": "column1"},
    {"resource": "t2", "property": "column2"}
  ],
  "joins": [
    {
      "resource": "t2",
      "condition": {
        "property": "t1.id",
        "value": "t2.foreign_id"
      }
    }
  ]
}
```

#### Search Endpoint

**Search Datasets**
```
GET /api/1/search?keyword=health&theme=Healthcare&fulltext=hospital&page-size=20&page=1
```

**Query Parameters:**
- `keyword`: Filter by keyword/tag (exact match)
- `theme`: Filter by theme/category (exact match)
- `fulltext`: Search in title and description (text search)
- `page-size`: Results per page (default: 10, max: 100)
- `page`: Page number (1-indexed)

**Response Format:**
```json
{
  "total": 45,
  "results": [
    {
      "identifier": "uuid-here",
      "title": "Dataset Title",
      "description": "Dataset description",
      "modified": "2022-06-01",
      "theme": ["Healthcare"],
      "keyword": ["health", "hospital"],
      "distribution": [...]
    }
  ]
}
```

#### Data Dictionary Endpoints

**Create Data Dictionary**
```
POST /api/1/metastore/schemas/data-dictionary/items
Content-Type: application/json
Authorization: Basic {base64_credentials}
```

**Get Data Dictionary**
```
GET /api/1/metastore/schemas/data-dictionary/items/{dictionaryID}
```

### 1.2 Legacy DKAN 7.x-1.x API

#### Dataset REST API

**Base Endpoint:** `/api/dataset/node`

**Create Dataset/Resource**
```
POST /api/dataset/node
Content-Type: application/json
Authorization: Basic {base64_credentials}
X-CSRF-Token: {csrf_token}

{
  "type": "dataset",
  "title": "Test Dataset",
  "body": {
    "und": [{"value": "Description"}]
  }
}
```

**Response:**
```json
{
  "nid": "75",
  "uri": "http://example.com/api/dataset/node/75"
}
```

**Get Node**
```
GET /api/dataset/node/{id}
```

**Update Node**
```
PUT /api/dataset/node/{id}
Content-Type: application/json
Authorization: Basic {base64_credentials}
X-CSRF-Token: {csrf_token}
```

**Delete Node**
```
DELETE /api/dataset/node/{id}
Authorization: Basic {base64_credentials}
X-CSRF-Token: {csrf_token}
```

**Attach File to Resource**
```
POST /api/dataset/node/{id}/attach_file
Content-Type: multipart/form-data
Authorization: Basic {base64_credentials}
X-CSRF-Token: {csrf_token}
```

**Query Parameters:**
- `page`: Zero-based page index
- `pagesize`: Records per page (max 20)
- `fields`: Comma-separated field names
- `parameters[type]`: Filter by node type
- `parameters[status]`: Filter by publication status

**Known Limitations:**
- Datasets can only be queried by node ID or other entity (UUID support pending)
- Greater-than (>) and less-than (<) operations not supported in queries

#### Datastore API

**Base Endpoint:** `/api/action/datastore/search.json` or `/api/dataset/search`

**Query Datastore**
```
GET /api/action/datastore/search.json?resource_id={resourceID}&filters[field]=value&limit=50&offset=0&sort=field_name%20asc
```

**Query Parameters:**
- `resource_id`: Resource ID (required) - can be string or array for multiple resources
- `filters`: Field-value pairs for filtering
- `q`: Fulltext search query
- `offset`: Row offset for pagination
- `limit`: Max rows (default: 10, max: 100 for standard users)
- `fields`: Specific fields to return
- `sort`: Comma-separated field names with ordering
- `join`: Fields to join from multiple tables
- `group_by`: Fields to group results by

**Aggregation Functions:**
- `sum`, `avg`, `min`, `max`, `std`, `variance`, `count`

**Multiple Filters:**
```
GET /api/dataset/search?filters[field1]=value1&filters[field2]=value2
```

**Limitations:**
- Filters don't work with float (decimal) values
- `q` parameter cannot combine with `join` operations
- Field names with spaces/capitals converted to lowercase with underscores

### 1.3 CKAN-Compatible API (Read-Only)

DKAN provides CKAN-compatible endpoints for harvesting. These are read-only APIs.

**Base Pattern:** `/api/3/action/{endpoint}`

**Available Endpoints:**

| Endpoint | Description |
|----------|-------------|
| `site_read` | General site information |
| `revision_list` | List dataset revisions |
| `package_list` | All dataset packages |
| `current_package_list_with_resources` | Packages with resources |
| `package_show` | Specific dataset details |
| `resource_show` | Individual resource details |
| `group_package_show` | Packages in a group |
| `package_revision_list` | Revision history for package |
| `group_list` | All groups/categories |

**Examples:**
```
GET /api/3/action/package_list
GET /api/3/action/package_show?id={package-id}
GET /api/3/action/group_list?order_by=name&all_fields=TRUE
```

### 1.4 Open Data Standard Endpoints

#### data.json Endpoint (Project Open Data)

```
GET /data.json
```
- Returns full catalog in Project Open Data format
- DCAT-US compliant JSON structure
- Used for federal and non-federal data.gov harvesting

**Harvest Filters:**
```
GET /data.json?keyword=health
```
- Filter datasets in data.json response

#### DCAT-AP/RDF Endpoint

DKAN supports DCAT-AP (European data portal standard) with configurable field mappings through the Open Data Schema Map module.

---

## 2. DKAN Dataset Object Structure (DCAT-US Schema)

### 2.1 Dataset Object

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `title` | string | Human-readable dataset name | "Hospital Locations" |
| `description` | string | Plain language overview | "List of all hospitals..." |
| `identifier` | string | Unique ID (must remain fixed) | "hospital-locations-2023" |
| `accessLevel` | enum | Access level | "public", "restricted public", "non-public" |
| `modified` | ISO 8601 date | Last modification date | "2023-05-15" |
| `keyword` | array[string] | Tags for discovery | ["health", "facilities"] |

#### Required for US Government

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `bureauCode` | array[string] | Bureau codes | ["015:11"] |
| `programCode` | array[string] | Program codes | ["015:001"] |

#### Required If Applicable

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `publisher` | object | Publishing organization | See Publisher Object |
| `contactPoint` | object | Contact information | See ContactPoint Object |
| `distribution` | array[object] | Data files/resources | See Distribution Object |
| `license` | string (URL) | License URL | "http://opendefinition.org/licenses/odc-pddl/" |
| `rights` | string | Access restrictions explanation | "Requires registration" |
| `spatial` | string/GeoJSON | Geographic coverage | "London, England" or GeoJSON |
| `temporal` | ISO 8601 range | Time period covered | "2020-01-01/2023-12-31" |

#### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `@type` | string | Type identifier | "dcat:Dataset" (default) |
| `accrualPeriodicity` | ISO 8601 duration | Update frequency | "R/P1Y" (yearly) |
| `conformsTo` | string (URI) | Standard specification | "http://example.com/schema" |
| `dataQuality` | boolean | Meets agency quality standards | true |
| `describedBy` | string (URL) | Data dictionary URL | "http://example.com/dict.json" |
| `describedByType` | string (MIME) | Dictionary format | "application/json" |
| `isPartOf` | string | Parent dataset identifier | "parent-dataset-id" |
| `issued` | ISO 8601 date | Formal release date | "2023-01-01" |
| `language` | array[string] | Language codes (RFC 5646) | ["en-US", "es"] |
| `landingPage` | string (URL) | Dataset hub page | "http://example.com/dataset" |
| `primaryITInvestmentUII` | string | IT investment identifier | "023-000000001" |
| `references` | array[string] | Related documentation URLs | ["http://example.com/doc"] |
| `systemOfRecords` | string (URL) | Privacy Act SORN URL | "http://example.com/sorn" |
| `theme` | array[string] | Subject categories | ["Health", "Transportation"] |

### 2.2 Publisher Object

```json
{
  "@type": "org:Organization",
  "name": "Department of Transportation",
  "subOrganizationOf": "Federal Government"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `@type` | string | No | "org:Organization" (default) |
| `name` | string | Yes | Organization name |
| `subOrganizationOf` | string | No | Parent organization |

### 2.3 ContactPoint Object

```json
{
  "@type": "vcard:Contact",
  "fn": "Jane Doe",
  "hasEmail": "mailto:jane.doe@agency.gov"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `@type` | string | No | "vcard:Contact" |
| `fn` | string | Yes | Full name |
| `hasEmail` | string | Yes | Email (mailto: format) |

### 2.4 Distribution Object

A distribution represents an actual data file or API endpoint.

```json
{
  "@type": "dcat:Distribution",
  "title": "CSV Download",
  "description": "Hospital locations in CSV format",
  "downloadURL": "http://example.com/hospitals.csv",
  "mediaType": "text/csv",
  "format": "CSV",
  "conformsTo": "http://example.com/schema",
  "describedBy": "http://example.com/data-dictionary.json",
  "describedByType": "application/json"
}
```

#### Required

At least one of `downloadURL` or `accessURL` is required.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `downloadURL` | string (URL) | If-Applicable | Direct file download URL |
| `accessURL` | string (URL) | If-Applicable | Indirect access (API, web interface) |
| `mediaType` | string (MIME) | If-Applicable | File format (required with downloadURL) |

#### Optional

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `@type` | string | Type identifier | "dcat:Distribution" |
| `title` | string | Distribution name | "CSV Download" |
| `description` | string | Distribution overview | "Full dataset in CSV" |
| `format` | string | Human-readable format | "CSV", "JSON", "PDF" |
| `conformsTo` | string (URI) | Data standard | "http://spec.example.com" |
| `describedBy` | string (URL) | Schema/dictionary URL | "http://example.com/dict" |
| `describedByType` | string (MIME) | Dictionary format | "application/json" |

### 2.5 Complete Dataset Example

```json
{
  "@type": "dcat:Dataset",
  "title": "Hospital Locations 2023",
  "description": "Complete list of hospital locations including address, capacity, and services offered.",
  "identifier": "hospital-locations-2023",
  "accessLevel": "public",
  "modified": "2023-05-15",
  "issued": "2023-01-01",
  "keyword": ["health", "hospitals", "facilities", "healthcare"],
  "theme": ["Health"],
  "publisher": {
    "@type": "org:Organization",
    "name": "Department of Health"
  },
  "contactPoint": {
    "@type": "vcard:Contact",
    "fn": "Jane Smith",
    "hasEmail": "mailto:jane.smith@health.gov"
  },
  "license": "http://opendefinition.org/licenses/odc-pddl/",
  "spatial": "United States",
  "temporal": "2023-01-01/2023-12-31",
  "accrualPeriodicity": "R/P1M",
  "landingPage": "http://health.gov/datasets/hospitals",
  "describedBy": "http://health.gov/hospitals/data-dictionary.json",
  "describedByType": "application/json",
  "distribution": [
    {
      "@type": "dcat:Distribution",
      "title": "Hospital Data CSV",
      "description": "Full dataset in CSV format",
      "downloadURL": "http://health.gov/files/hospitals.csv",
      "mediaType": "text/csv",
      "format": "CSV"
    },
    {
      "@type": "dcat:Distribution",
      "title": "Hospital API",
      "description": "Query API for hospital data",
      "accessURL": "http://health.gov/api/hospitals",
      "format": "API"
    }
  ]
}
```

### 2.6 Accrual Periodicity Values

| Value | Meaning |
|-------|---------|
| `R/P10Y` | Decennial |
| `R/P4Y` | Quadrennial |
| `R/P1Y` | Annual |
| `R/P2M` | Bimonthly |
| `R/P0.5M` | Semimonthly |
| `R/P1M` | Monthly |
| `R/P0.33W` | Biweekly |
| `R/P1W` | Weekly |
| `R/P0.33M` | Three times a week |
| `R/P0.5W` | Semiweekly |
| `R/P1D` | Daily |
| `R/PT1H` | Hourly |
| `R/PT1S` | Continuously updated |
| `irregular` | Irregular |

---

## 3. Query Parameters and Filtering

### 3.1 Datastore Query (DKAN 2.x)

#### Conditions (Filters)

```json
{
  "conditions": [
    {
      "property": "status",
      "value": "active",
      "operator": "="
    },
    {
      "property": "capacity",
      "value": "100",
      "operator": ">="
    }
  ]
}
```

**Supported Operators:**
- `=` - Equals
- `!=` - Not equals
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `like` - Pattern matching (use `%` for wildcards)
- `match` - Fulltext search across multiple columns

#### Properties (Column Selection)

```json
{
  "properties": ["name", "address", "capacity"]
}
```
Omit to return all columns.

#### Sorts (Ordering)

```json
{
  "sorts": [
    {
      "property": "name",
      "order": "asc"
    },
    {
      "property": "capacity",
      "order": "desc"
    }
  ]
}
```

#### Pagination

```json
{
  "limit": 100,
  "offset": 0
}
```
- `limit`: Maximum rows to return (default ~500)
- `offset`: Number of rows to skip

For subsequent pages:
- Page 2: `offset=100`
- Page 3: `offset=200`
- etc.

#### Row IDs

```json
{
  "rowIds": [5, 10, 15, 20]
}
```
Retrieve specific rows by ID.

### 3.2 Search Query (DKAN 2.x)

**URL Parameters:**
```
/api/1/search?keyword=health&theme=Healthcare&fulltext=hospital&page-size=20&page=1
```

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `keyword` | string | Exact keyword match | "health" |
| `theme` | string | Exact theme match | "Healthcare" |
| `fulltext` | string | Text search in title/description | "hospital" |
| `page-size` | integer | Results per page (max 100) | 20 |
| `page` | integer | Page number (1-indexed) | 1 |

### 3.3 Datastore Query (Legacy 7.x-1.x)

**URL Parameters:**
```
/api/action/datastore/search.json?resource_id=123&filters[status]=active&filters[capacity]=100&limit=50&offset=0&sort=name asc
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `resource_id` | string/array | Resource ID(s) |
| `filters[field]` | string | Filter by field value |
| `q` | string | Fulltext search |
| `limit` | integer | Max rows (default 10, max 100) |
| `offset` | integer | Row offset |
| `fields` | array/string | Columns to return |
| `sort` | string | Sorting (field name + asc/desc) |
| `join` | array | Join fields from multiple tables |
| `group_by` | array | Group by fields |

**Notes:**
- Multiple filters: `filters[field1]=value1&filters[field2]=value2`
- Field names are lowercase with underscores (e.g., "School Name" → `school_name`)
- Filters don't work with float values
- `q` cannot be combined with `join`

---

## 4. Authentication Methods

### 4.1 Basic Authentication (Primary Method)

DKAN uses HTTP Basic Authentication for API requests that require authorization.

#### Step 1: Encode Credentials

```bash
echo -n 'username:password' | base64
# Result: dXNlcm5hbWU6cGFzc3dvcmQ=
```

#### Step 2: Include in Request Headers

```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
Content-Type: application/json
```

#### Example with curl

```bash
curl -X POST https://example.com/api/1/metastore/schemas/dataset/items \
  -H "Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Dataset", ...}'
```

### 4.2 CSRF Token (Legacy 7.x-1.x Only)

For the older DKAN 7.x-1.x Dataset REST API, you need both session authentication and a CSRF token.

#### Step 1: Login

```
POST /api/dataset/user/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**Response includes:**
- Session cookie
- User information

#### Step 2: Get CSRF Token

```
POST /services/session/token
```

**Response:**
```
iE8xK3VgHJz5kqUiBj-sVnqHMrCYGSXMHBN9HKaHLqw
```

#### Step 3: Use in Subsequent Requests

```
PUT /api/dataset/node/123
Authorization: Basic {base64_credentials}
X-CSRF-Token: iE8xK3VgHJz5kqUiBj-sVnqHMrCYGSXMHBN9HKaHLqw
Cookie: {session_cookie}
Content-Type: application/json
```

### 4.3 Bearer Token Authentication

**Not supported out-of-the-box.**

Bearer token authentication is not currently available in DKAN by default. However, it can be enabled in DKAN 7.x-1.x by adding the Services Token Access module to your site.

### 4.4 Anonymous Access (Read-Only)

Many API endpoints support anonymous access for read operations:
- Dataset retrieval (GET)
- Dataset search
- Datastore queries (GET/POST)
- CKAN-compatible endpoints
- data.json endpoint

**No authentication required for:**
```
GET /api/1/metastore/schemas/dataset/items/{datasetID}
GET /api/1/search?keyword=health
POST /api/1/datastore/query/{datasetID}/0
GET /data.json
GET /api/3/action/package_list
```

### 4.5 Permissions

**Authentication required for:**
- Creating datasets (POST)
- Updating datasets (PUT)
- Deleting datasets (DELETE)
- Managing revisions and moderation states
- Unlimited datastore queries (without rate limits)

**Permission:** "Perform unlimited index queries" - Required to exceed standard query limits (100 records for non-authenticated users).

---

## 5. GraphQL API Support

**DKAN does NOT have native GraphQL API support.**

DKAN provides:
- REST APIs (DKAN native)
- CKAN-compatible APIs
- Project Open Data (data.json)
- DCAT-AP/RDF endpoints

Since DKAN is built on Drupal, it's theoretically possible to add GraphQL support through Drupal's GraphQL module ecosystem, but this would require custom integration and is not a native DKAN feature.

---

## 6. Response Formats

### 6.1 Supported Formats (Legacy 7.x-1.x)

The Dataset REST API supports multiple response formats:
- JSON (default)
- XML
- YAML
- PHP serialized
- bencode
- JSONP

Change format by modifying the file extension:
```
/api/dataset/node/123.json
/api/dataset/node/123.xml
/api/dataset/node/123.yaml
```

### 6.2 Modern API (2.x) Response Format

DKAN 2.x APIs return JSON format.

#### Dataset Response Example

```json
{
  "identifier": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Hospital Locations",
  "description": "Complete hospital directory",
  "accessLevel": "public",
  "modified": "2023-05-15",
  "keyword": ["health", "hospitals"],
  "theme": ["Health"],
  "publisher": {
    "@type": "org:Organization",
    "name": "Department of Health"
  },
  "contactPoint": {
    "@type": "vcard:Contact",
    "fn": "Jane Smith",
    "hasEmail": "mailto:jane.smith@health.gov"
  },
  "distribution": [
    {
      "@type": "dcat:Distribution",
      "identifier": "dist-123",
      "title": "Hospital Data CSV",
      "downloadURL": "http://example.com/hospitals.csv",
      "mediaType": "text/csv",
      "format": "CSV"
    }
  ]
}
```

#### Datastore Query Response Example

```json
{
  "results": [
    {
      "record_number": 1,
      "name": "General Hospital",
      "address": "123 Main St",
      "capacity": 250,
      "status": "active"
    },
    {
      "record_number": 2,
      "name": "Memorial Hospital",
      "address": "456 Oak Ave",
      "capacity": 180,
      "status": "active"
    }
  ],
  "count": 2,
  "schema": {
    "fields": [
      {"name": "record_number", "type": "integer"},
      {"name": "name", "type": "string"},
      {"name": "address", "type": "string"},
      {"name": "capacity", "type": "integer"},
      {"name": "status", "type": "string"}
    ]
  }
}
```

#### Search Response Example

```json
{
  "total": 45,
  "results": [
    {
      "identifier": "dataset-id-1",
      "title": "Dataset Title",
      "description": "Description",
      "modified": "2023-05-15",
      "theme": ["Health"],
      "keyword": ["health", "data"],
      "distribution": [...]
    }
  ]
}
```

#### Error Response Example

```json
{
  "message": "Dataset not found",
  "code": 404
}
```

---

## 7. Common API Patterns

### 7.1 Pagination Pattern

For datastore queries:
```javascript
const pageSize = 100;
let offset = 0;
let hasMore = true;

while (hasMore) {
  const response = await fetch(`/api/1/datastore/query/${datasetID}/0`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      limit: pageSize,
      offset: offset
    })
  });

  const data = await response.json();

  if (data.results.length < pageSize) {
    hasMore = false;
  }

  offset += pageSize;
}
```

For search results:
```javascript
const pageSize = 100;
let page = 1;

const response = await fetch(
  `/api/1/search?keyword=health&page-size=${pageSize}&page=${page}`
);
```

### 7.2 Dataset Retrieval Pattern

```javascript
// Get dataset metadata
const metadataResponse = await fetch(
  `/api/1/metastore/schemas/dataset/items/${datasetID}`
);
const metadata = await metadataResponse.json();

// Get first distribution data
const distributionIndex = 0;
const dataResponse = await fetch(
  `/api/1/datastore/query/${datasetID}/${distributionIndex}`,
  {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({limit: 100})
  }
);
const data = await dataResponse.json();
```

### 7.3 Filtered Query Pattern

```javascript
const response = await fetch(
  `/api/1/datastore/query/${datasetID}/0`,
  {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      conditions: [
        {property: 'status', value: 'active', operator: '='},
        {property: 'capacity', value: '100', operator: '>='}
      ],
      sorts: [{property: 'name', order: 'asc'}],
      properties: ['name', 'address', 'capacity'],
      limit: 50,
      offset: 0
    })
  }
);
```

### 7.4 Search Pattern

```javascript
// Search by multiple criteria
const params = new URLSearchParams({
  'keyword': 'health',
  'theme': 'Healthcare',
  'fulltext': 'hospital',
  'page-size': '20',
  'page': '1'
});

const response = await fetch(`/api/1/search?${params}`);
const results = await response.json();
```

### 7.5 Authenticated Request Pattern

```javascript
const credentials = btoa('username:password'); // Base64 encode

const response = await fetch(
  `/api/1/metastore/schemas/dataset/items`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datasetMetadata)
  }
);
```

---

## 8. API Limitations and Considerations

### 8.1 Known Limitations

1. **Query Limits**
   - Default datastore query limit: ~500 rows
   - Search results: max 100 per page
   - Legacy API: max 100 rows without special permission
   - Requires authentication for unlimited queries

2. **Legacy API (7.x-1.x) Limitations**
   - No UUID support (only node IDs)
   - Greater-than (>) and less-than (<) operators not supported
   - Filters don't work with float/decimal values
   - Cannot combine `q` (fulltext) with `join` operations

3. **Field Naming**
   - Field names with spaces/capitals converted to lowercase with underscores
   - Example: "School Name" becomes `school_name`

4. **Authentication**
   - No bearer token support out-of-the-box (requires additional module)
   - Legacy API requires CSRF tokens for write operations

5. **Data Types**
   - Filter limitations with decimal values in legacy API
   - Date formats must be ISO 8601

### 8.2 Best Practices

1. **Use Modern API (2.x)**
   - More robust and actively maintained
   - Better query capabilities
   - Simpler authentication

2. **Pagination**
   - Always implement pagination for large datasets
   - Use reasonable page sizes (50-100 records)
   - Monitor response times

3. **Caching**
   - Cache dataset metadata (changes infrequently)
   - Respect `modified` timestamps
   - Implement ETags if available

4. **Error Handling**
   - Handle 404 (not found) gracefully
   - Implement retry logic for transient failures
   - Validate response structure before processing

5. **Query Optimization**
   - Request only needed columns using `properties`
   - Use appropriate filters to reduce result size
   - Index frequently queried fields (requires server configuration)

6. **Rate Limiting**
   - Be mindful of server load
   - Implement client-side rate limiting
   - Use bulk operations when available

---

## 9. Example Use Cases for Client Library

### 9.1 List All Datasets

```javascript
async function listAllDatasets() {
  const response = await fetch('/api/1/metastore/schemas/dataset/items');
  return await response.json();
}
```

### 9.2 Search Datasets by Keyword

```javascript
async function searchByKeyword(keyword) {
  const response = await fetch(
    `/api/1/search?keyword=${encodeURIComponent(keyword)}&page-size=100`
  );
  return await response.json();
}
```

### 9.3 Get Dataset with Data

```javascript
async function getDatasetWithData(datasetID, limit = 100) {
  // Get metadata
  const metaResponse = await fetch(
    `/api/1/metastore/schemas/dataset/items/${datasetID}`
  );
  const metadata = await metaResponse.json();

  // Get data from first distribution
  const dataResponse = await fetch(
    `/api/1/datastore/query/${datasetID}/0`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({limit})
    }
  );
  const data = await dataResponse.json();

  return {
    metadata,
    data
  };
}
```

### 9.4 Query with Filters

```javascript
async function queryDatastore(datasetID, filters, options = {}) {
  const {
    properties = [],
    sorts = [],
    limit = 100,
    offset = 0
  } = options;

  const query = {
    conditions: filters.map(f => ({
      property: f.field,
      value: f.value,
      operator: f.operator || '='
    })),
    limit,
    offset
  };

  if (properties.length) query.properties = properties;
  if (sorts.length) query.sorts = sorts;

  const response = await fetch(
    `/api/1/datastore/query/${datasetID}/0`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(query)
    }
  );

  return await response.json();
}
```

### 9.5 Create Dataset (Authenticated)

```javascript
async function createDataset(credentials, dataset) {
  const auth = btoa(`${credentials.username}:${credentials.password}`);

  const response = await fetch(
    '/api/1/metastore/schemas/dataset/items',
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataset)
    }
  );

  return await response.json();
}
```

### 9.6 Get Data Dictionary

```javascript
async function getDataDictionary(datasetID) {
  const metadata = await fetch(
    `/api/1/metastore/schemas/dataset/items/${datasetID}`
  ).then(r => r.json());

  // Get data dictionary URL from describedBy field
  const dictionaryURL = metadata.describedBy ||
                       metadata.distribution?.[0]?.describedBy;

  if (dictionaryURL) {
    return await fetch(dictionaryURL).then(r => r.json());
  }

  return null;
}
```

---

## 10. Reference Links

### Official Documentation
- **DKAN 2.x Documentation:** https://dkan.readthedocs.io/en/latest/
- **DKAN 7.x-1.x Documentation:** https://dkan.readthedocs.io/en/7.x-1.x/
- **API Examples (2.x):** https://dkan.readthedocs.io/en/latest/user-guide/guide_api.html
- **REST API (7.x-1.x):** https://dkan.readthedocs.io/en/7.x-1.x/apis/rest-api.html
- **Datastore API:** https://dkan.readthedocs.io/en/7.x-1.x/apis/datastore-api.html
- **CKAN API Compatibility:** https://dkan.readthedocs.io/en/7.x-1.x/apis/ckan-dataset.html

### GitHub Resources
- **DKAN Repository:** https://github.com/GetDKAN/dkan
- **Dataset Schema:** https://github.com/GetDKAN/dkan/blob/2.x/schema/collections/dataset.json

### Standards and Specifications
- **DCAT-US Schema v1.1:** https://resources.data.gov/resources/dcat-us/
- **Project Open Data Field Mappings:** https://resources.data.gov/resources/podm-field-mapping/
- **DCAT Vocabulary (W3C):** https://www.w3.org/TR/vocab-dcat-3/

### Example DKAN Instances
- **Demo Site:** https://demo.getdkan.org
- **Demo API:** https://demo.getdkan.org/api

---

## 11. Client Library Design Recommendations

Based on this research, here are recommendations for designing a DKAN query client library:

### 11.1 Core Features

1. **Dataset Operations**
   - List all datasets
   - Get single dataset by ID
   - Search datasets (keyword, theme, fulltext)
   - Create/update/delete datasets (authenticated)

2. **Datastore Operations**
   - Query dataset data with filters
   - Pagination support
   - Sorting and column selection
   - Join operations across datasets

3. **Authentication**
   - Basic authentication support
   - Credential management
   - Optional anonymous mode

4. **Response Handling**
   - Type-safe dataset objects
   - Error handling and validation
   - Response pagination helpers

### 11.2 API Architecture

```
Client
├── Configuration
│   ├── Base URL
│   ├── API Version (1.x vs 2.x)
│   ├── Credentials (optional)
│   └── Default options
├── Datasets
│   ├── list()
│   ├── get(id)
│   ├── search(options)
│   ├── create(dataset)
│   ├── update(id, dataset)
│   └── delete(id)
├── Datastore
│   ├── query(datasetID, options)
│   ├── queryAll(datasetID, options) // Auto-pagination
│   └── join(datasets, options)
└── Utilities
    ├── validateDataset(dataset)
    ├── buildQuery(options)
    └── handlePagination(response)
```

### 11.3 Type Definitions

Define TypeScript interfaces for:
- Dataset (all DCAT-US fields)
- Distribution
- Publisher
- ContactPoint
- Query options (conditions, sorts, pagination)
- Search options
- Response structures

### 11.4 Error Handling

Implement specific error types:
- `NotFoundError` (404)
- `AuthenticationError` (401, 403)
- `ValidationError` (400)
- `RateLimitError` (429)
- `ServerError` (500+)

### 11.5 Testing Considerations

- Support for multiple DKAN versions
- Mock data based on real API responses
- Integration tests against demo.getdkan.org
- Rate limiting tests
- Authentication tests

---

## Document Version

**Version:** 1.0
**Date:** 2025-11-06
**Based on:** DKAN 2.x (latest) and 7.x-1.x (legacy)
**Author:** Research conducted via web search and documentation analysis
