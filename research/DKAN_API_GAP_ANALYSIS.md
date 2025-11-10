# DKAN API Gap Analysis - Implementation Status Report

## Executive Summary

This report analyzes DKAN's available REST API endpoints against the currently implemented functionality in the dkanClientTools React client library. The analysis identifies gaps and opportunities for future implementation.

---

## 1. Currently Implemented APIs

Based on examination of `/packages/dkan-client-tools-core/src/client/dkanClient.ts` and `/packages/dkan-client-tools-core/src/api/client.ts`:

### 1.1 Dataset Operations
- [x] **Get Single Dataset** - `GET /api/1/metastore/schemas/dataset/items/{identifier}`
- [x] **List All Datasets** - `GET /api/1/metastore/schemas/dataset/items`
- [x] **Search Datasets** - `GET /api/1/search`
  - Supports: keyword, theme, fulltext, page, page-size, sort, sort-order
  - Returns facets with search results
- [x] **Get Dataset Facets** - Synthesized from dataset list (themes, keywords, publishers)
- [x] **CKAN-compatible List** - `GET /api/3/action/package_list`
- [x] **CKAN-compatible Get** - `GET /api/3/action/package_show?id={identifier}`

### 1.2 Metastore Operations
- [x] **List Schemas** - `GET /api/1/metastore/schemas`
- [x] **Get Schema Items** - `GET /api/1/metastore/schemas/{schema_id}/items`
- [x] **OpenAPI Documentation** - `GET /api/1/metastore` and `GET /api/1`

### 1.3 Datastore/Data Operations
- [x] **Query Datastore** - `POST /api/1/datastore/query/{datasetId}/{index}`
  - Supports: conditions, properties, sorts, limit, offset, joins
- [x] **Get Datastore Schema** - `GET /api/1/datastore/query/{datasetId}/{index}?schema=true`

### 1.4 Data Dictionary Operations
- [x] **List Data Dictionaries** - `GET /api/1/metastore/schemas/data-dictionary/items`
- [x] **Get Data Dictionary** - `GET /api/1/metastore/schemas/data-dictionary/items/{identifier}`
- [x] **Get Data Dictionary from URL** - Fetch from distribution's describedBy field

---

## 2. Missing/Not Implemented APIs

### 2.1 Harvest API (CRITICAL MISSING)

**Status:** Not implemented at all

**Endpoints Available:**
```
GET    /api/1/harvest                      # Get Harvest module info
GET    /api/1/harvest/plans                # List all harvest plans
POST   /api/1/harvest/plans                # Create/register harvest plan
GET    /api/1/harvest/plans/{identifier}   # Get specific harvest plan
DELETE /api/1/harvest/plans/{identifier}   # Deregister harvest plan
GET    /api/1/harvest/runs                 # List all harvest runs
POST   /api/1/harvest/runs                 # Execute harvest run
DELETE /api/1/harvest/runs                 # Revert harvest run
GET    /api/1/harvest/runs/{identifier}    # Get specific harvest run status
```

**Use Cases:**
- Harvesting data from external data portals (Data.gov, other DKAN instances, CKAN sites)
- Managing harvest source configurations
- Tracking harvest job status and history
- Reverting and archiving harvests

**Example Request:**
```bash
# Register a harvest
POST /api/1/harvest/plans
{
  "identifier": "my-harvest-id",
  "extract_uri": "http://example.com/data.json"
}

# Run a harvest
POST /api/1/harvest/runs
{
  "identifier": "my-harvest-id"
}

# Check harvest status
GET /api/1/harvest/runs/my-harvest-id
```

---

### 2.2 Datastore Import API (PARTIALLY MISSING)

**Status:** Endpoints exist but not implemented in client

**Endpoints Available:**
```
GET    /api/1/datastore/imports            # List all imports
POST   /api/1/datastore/imports            # Create new import
GET    /api/1/datastore/imports/{id}       # Get import status
DELETE /api/1/datastore/imports/{id}       # Delete specific import
DELETE /api/1/datastore/imports            # Delete multiple imports
```

**Use Cases:**
- Importing CSV/data files into datastore
- Checking import progress and status
- Managing imported datasets
- Removing failed or unwanted imports

**Example Request:**
```bash
# Create new import
POST /api/1/datastore/imports
{
  "resource_id": "my-resource-uuid",
  "url": "http://example.com/data.csv"
}

# Get import status
GET /api/1/datastore/imports/import-job-id

# Delete import
DELETE /api/1/datastore/imports/import-job-id
```

---

### 2.3 Dataset CRUD Operations (PARTIALLY MISSING)

**Status:** Read operations implemented, write operations missing

**Missing Endpoints:**
```
POST   /api/1/metastore/schemas/dataset/items              # Create dataset
PUT    /api/1/metastore/schemas/dataset/items/{id}         # Update dataset
PATCH  /api/1/metastore/schemas/dataset/items/{id}         # Partial update
DELETE /api/1/metastore/schemas/dataset/items/{id}         # Delete dataset
```

**Use Cases:**
- Creating new datasets programmatically
- Updating dataset metadata
- Publishing/unpublishing datasets
- Deleting datasets

**Example Request:**
```bash
# Create dataset
POST /api/1/metastore/schemas/dataset/items
Authorization: Basic {credentials}
{
  "title": "My Dataset",
  "description": "Description here",
  "identifier": "my-dataset-id",
  "accessLevel": "public",
  "modified": "2025-11-07",
  "keyword": ["tag1", "tag2"],
  "publisher": {"name": "My Organization"},
  "contactPoint": {"fn": "Contact Name", "hasEmail": "email@example.com"},
  "distribution": []
}

# Update dataset
PUT /api/1/metastore/schemas/dataset/items/my-dataset-id
Authorization: Basic {credentials}
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

---

### 2.4 Dataset Revision/Moderation API (NOT IMPLEMENTED)

**Status:** Endpoints exist but not implemented

**Endpoints Available:**
```
GET    /api/1/metastore/schemas/{schema_id}/items/{id}/revisions              # List revisions
GET    /api/1/metastore/schemas/{schema_id}/items/{id}/revisions/{revision_id} # Get specific revision
POST   /api/1/metastore/schemas/{schema_id}/items/{id}/revisions              # Create revision/change state
PUT    /api/1/metastore/schemas/{schema_id}/items/{id}/publish                # Publish dataset
```

**Use Cases:**
- Viewing dataset change history
- Rolling back to previous versions
- Managing dataset moderation states (draft, published, archived)
- Publishing datasets through workflow

**Example Request:**
```bash
# Get revision history
GET /api/1/metastore/schemas/dataset/items/my-dataset-id/revisions

# Change moderation state
POST /api/1/metastore/schemas/dataset/items/my-dataset-id/revisions
Authorization: Basic {credentials}
{
  "state": "published",
  "message": "Publishing to production"
}

# Available states: draft, published, hidden, orphaned, archived
```

---

### 2.5 SQL Query Endpoint (NOT IMPLEMENTED)

**Status:** Endpoint exists in routing, not implemented in client

**Endpoints Available:**
```
GET    /api/1/datastore/sql    # Run SQL query (read-only)
POST   /api/1/datastore/sql    # Run SQL query
```

**Use Cases:**
- Direct SQL queries on datastore tables
- Complex joins and aggregations
- Advanced data analysis
- Performance optimization for complex queries

**Example Request:**
```bash
# GET method
GET /api/1/datastore/sql?sql=SELECT+*+FROM+dataset_uuid+WHERE+status='active'

# POST method
POST /api/1/datastore/sql
{
  "sql": "SELECT * FROM {dataset_uuid} WHERE status='active' LIMIT 100"
}
```

**Note:** Raw SQL access has security concerns and DKAN limits its use. The datastore query API (with conditions, properties, sorts) is the recommended approach.

---

### 2.6 Query Download Endpoint (NOT IMPLEMENTED)

**Status:** Endpoint exists in routing, not implemented in client

**Endpoints Available:**
```
GET    /api/1/datastore/query/download                     # Download all data
POST   /api/1/datastore/query/download
GET    /api/1/datastore/query/{identifier}/download        # Download resource by ID
POST   /api/1/datastore/query/{identifier}/download
GET    /api/1/datastore/query/{dataset}/{index}/download   # Download by dataset+index
POST   /api/1/datastore/query/{dataset}/{index}/download
```

**Use Cases:**
- Exporting query results as CSV/JSON
- Bulk data downloads
- Integration with data analysis tools
- Creating static data exports

**Example Request:**
```bash
# Download query results
POST /api/1/datastore/query/{dataset}/0/download
{
  "conditions": [
    {"property": "status", "value": "active", "operator": "="}
  ],
  "limit": 10000
}
# Returns CSV or JSON based on Accept header
```

---

### 2.7 Data Dictionary CRUD (PARTIALLY MISSING)

**Status:** Read operations implemented, write operations missing

**Missing Endpoints:**
```
POST   /api/1/metastore/schemas/data-dictionary/items      # Create data dictionary
PUT    /api/1/metastore/schemas/data-dictionary/items/{id} # Update data dictionary
PATCH  /api/1/metastore/schemas/data-dictionary/items/{id} # Partial update
DELETE /api/1/metastore/schemas/data-dictionary/items/{id} # Delete data dictionary
```

**Use Cases:**
- Creating data dictionaries for datasets
- Updating field definitions
- Managing data quality standards
- Versioning schemas

---

### 2.8 Dataset Documentation Endpoint (MINIMAL)

**Status:** Limited implementation

**Endpoint Available:**
```
GET /api/1/metastore/schemas/dataset/items/{identifier}/docs
```

**Current Status:** Not implemented in client
**Use Case:** Retrieve generated documentation for a dataset

---

### 2.9 data.json Endpoint (NOT IMPLEMENTED)

**Status:** Endpoint exists in routing, not implemented in client

**Endpoint Available:**
```
GET /data.json    # Get full catalog in Project Open Data format
GET /data.json?keyword=health    # Filter by keyword
```

**Use Cases:**
- Federal data.gov harvesting compliance
- Bulk catalog export
- Catalog-level operations
- Standards compliance verification

**Example Response:**
```json
{
  "@context": "https://project-open-data.cio.gov/v1.1/schema/catalog.jsonld",
  "@type": "dcat:Catalog",
  "conformsTo": "https://project-open-data.cio.gov/v1.1/schema",
  "describedBy": "https://project-open-data.cio.gov/v1.1/schema/catalog.json",
  "dataset": [
    // Array of datasets in Project Open Data format
  ]
}
```

---

### 2.10 Alternate API Endpoints (NOT IMPLEMENTED)

**Status:** Alternative API paths exist for custom permissions

**Endpoints Available:**
```
GET    /alt/api/1/metastore/schemas/{schema_id}/items       # Alternate metastore access
GET    /alt/api/1/metastore/schemas/{schema_id}/items/{id}  # Alternate single item access
GET    /alt/api/1/datastore/sql                             # Alternate SQL endpoint
POST   /alt/api/1/datastore/sql                             # Alternate SQL endpoint
```

**Use Case:** Custom permission handling for specific API consumers

---

### 2.11 General Meta Endpoints (BASIC)

**Status:** Partially implemented

**Endpoint Available:**
```
GET /api         # Get API versions available
GET /api/1       # Get complete OpenAPI/Swagger spec
GET /api/1.yml   # Get OpenAPI spec in YAML format
```

**Current Status:** These return OpenAPI specs but client doesn't parse/use them

---

## 3. Implementation Priority Roadmap

### Phase 1: High Priority (Data Management)
1. **Dataset CRUD Operations** - Create, update, delete datasets
2. **Harvest API** - Enable data harvesting from external sources
3. **Dataset Revisions/Moderation** - Manage workflow and publishing states
4. **Datastore Imports** - File upload and import management

### Phase 2: Medium Priority (Advanced Querying)
1. **Query Download** - Export results to CSV/JSON
2. **SQL Endpoint** - Advanced query interface
3. **Data Dictionary CRUD** - Manage schemas and metadata

### Phase 3: Lower Priority (Integration & Standards)
1. **data.json Endpoint** - Federal compliance and bulk exports
2. **Alternate APIs** - Custom permission handling
3. **Documentation Endpoint** - Retrieve generated docs

---

## 4. API Authentication & Permissions

### Currently Supported:
- [x] HTTP Basic Authentication (username:password)
- [x] Bearer Token (token-based auth)
- [x] Anonymous access (read-only)
- [x] Cookie-based sessions

### Per Endpoint Permissions Required:
```
GET operations:        'access content' (mostly anonymous)
POST (create):         'harvest_api_register', 'harvest_api_run', etc.
PUT/PATCH (update):    Custom access managers per endpoint
DELETE:                Specific permissions per resource type
```

---

## 5. Response Format & Error Handling

### Supported Response Formats:
- [x] JSON (primary)
- [x] Swagger/OpenAPI specs
- [ ] XML (legacy API)
- [ ] CSV (download endpoints)

### Error Responses:
```json
{
  "message": "Error description",
  "code": 404
}
```

### HTTP Status Codes:
- 200 - Success
- 201 - Created
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 500 - Server Error

---

## 6. Type Definitions Needed

For full implementation, TypeScript interfaces need to be added for:

### Already Defined:
- ✓ DkanDataset (with DCAT-US fields)
- ✓ DkanSearchResponse
- ✓ DkanDatastoreQueryResponse
- ✓ DataDictionary & related types
- ✓ Distribution, Publisher, ContactPoint

### Need to Be Added:
- HarvestPlan (plan configuration)
- HarvestRun (execution status)
- HarvestError (error details)
- DatastoreImport (import job)
- ImportStatus (import progress)
- DatasetRevision (revision history)
- ModerationState (workflow state)
- QueryDownloadOptions
- SqlQueryRequest

---

## 7. Hook/Utility Improvements Needed

### For React Integration:
```typescript
// Currently have:
- useDataset()
- useDatasetSearch()
- useDatastore()
- useDataDictionary()
- useMetastore()

// Need to add:
- useDatasetCreate()     // POST
- useDatasetUpdate()     // PUT/PATCH
- useDatasetDelete()     // DELETE
- useHarvestPlan()       // GET/POST/DELETE
- useHarvestRun()        // GET/POST/DELETE
- useDatastoreImport()   // GET/POST/DELETE
- useDatasetRevisions()  // GET revision history
- usePublishDataset()    // Change moderation state
- useQueryDownload()     // Export data
```

---

## 8. Code Examples for Missing APIs

### Example: Harvest API Implementation
```typescript
// DkanApiClient method to add
async registerHarvest(options: {
  identifier: string
  extract_uri: string
  [key: string]: any
}): Promise<HarvestPlan> {
  const response = await this.request<HarvestPlan>(
    '/api/1/harvest/plans',
    {
      method: 'POST',
      body: JSON.stringify(options),
    }
  )
  return response.data
}

async runHarvest(identifier: string): Promise<HarvestRun> {
  const response = await this.request<HarvestRun>(
    '/api/1/harvest/runs',
    {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }
  )
  return response.data
}

async getHarvestStatus(identifier: string): Promise<HarvestRun> {
  const response = await this.request<HarvestRun>(
    `/api/1/harvest/runs/${identifier}`
  )
  return response.data
}
```

### Example: Dataset Creation
```typescript
async createDataset(dataset: DkanDataset): Promise<DkanDataset> {
  const response = await this.request<DkanDataset>(
    '/api/1/metastore/schemas/dataset/items',
    {
      method: 'POST',
      body: JSON.stringify(dataset),
    }
  )
  return response.data
}

async updateDataset(
  identifier: string,
  dataset: Partial<DkanDataset>
): Promise<DkanDataset> {
  const response = await this.request<DkanDataset>(
    `/api/1/metastore/schemas/dataset/items/${identifier}`,
    {
      method: 'PUT',
      body: JSON.stringify(dataset),
    }
  )
  return response.data
}

async deleteDataset(identifier: string): Promise<void> {
  await this.request(
    `/api/1/metastore/schemas/dataset/items/${identifier}`,
    { method: 'DELETE' }
  )
}
```

---

## 9. Summary Table

| Category | API | Status | Priority | Effort |
|----------|-----|--------|----------|--------|
| Search | /api/1/search | ✓ Implemented | - | - |
| Datasets | GET single | ✓ Implemented | - | - |
| Datasets | GET all | ✓ Implemented | - | - |
| Datasets | POST (create) | ✗ Missing | P1 | Medium |
| Datasets | PUT (update) | ✗ Missing | P1 | Medium |
| Datasets | DELETE | ✗ Missing | P1 | Low |
| Datastore | Query | ✓ Implemented | - | - |
| Datastore | Schema | ✓ Implemented | - | - |
| Datastore | SQL | ✗ Missing | P2 | High |
| Datastore | Download | ✗ Missing | P2 | Medium |
| Datastore | Imports | ✗ Missing | P1 | High |
| Harvest | Plans | ✗ Missing | P1 | High |
| Harvest | Runs | ✗ Missing | P1 | High |
| Revisions | List | ✗ Missing | P1 | Medium |
| Revisions | Publish | ✗ Missing | P1 | Medium |
| Dictionaries | GET | ✓ Implemented | - | - |
| Dictionaries | POST/PUT | ✗ Missing | P2 | Medium |
| Metastore | Schemas | ✓ Implemented | - | - |
| Meta | OpenAPI | Partial | P3 | Low |
| Export | data.json | ✗ Missing | P3 | Low |
| CKAN Compat | package_list | ✓ Implemented | - | - |
| CKAN Compat | package_show | ✓ Implemented | - | - |

---

## 10. Recommendations

1. **Prioritize Harvest API** - Critical for data ingestion workflows
2. **Add Dataset CRUD** - Essential for full data management
3. **Implement Imports API** - Required for bulk data loading
4. **Add Query Download** - Important for data export workflows
5. **Document SQL Endpoint** - Advanced users need direct SQL access
6. **Consider data.json** - Federal compliance requirement

---

## Document Version

**Version:** 2.0
**Date:** 2025-11-07
**Based on:** DKAN 2.x (2.19.2) source code routing analysis
**Reviewed Against:** Existing dkanClientTools implementations
