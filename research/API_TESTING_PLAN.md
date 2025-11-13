# DKAN API Testing & Validation Plan

## Overview

This document outlines a comprehensive plan for testing and validating all 43 API methods in the `@dkan-client-tools/core` package against live DKAN instances.

## Architecture

A **hybrid approach** with three components:

1. **API Response Recorder** - Script to call all APIs and save real responses as fixtures
2. **Integration Test Suite** - Tests that run in LIVE or RECORDED mode
3. **API Health Check Script** - Standalone validation tool for all endpoints

### Project Structure

```
packages/dkan-client-tools-core/
├── src/
│   └── __tests__/
│       ├── integration/              # New: Integration tests
│       │   ├── api-integration.test.ts
│       │   ├── dataset-integration.test.ts
│       │   ├── datastore-integration.test.ts
│       │   └── harvest-integration.test.ts
│       └── fixtures/                 # New: Recorded API responses
│           ├── datasets.json
│           ├── datastore.json
│           ├── harvest.json
│           └── ...
├── scripts/
│   ├── record-api-responses.ts      # Record real API responses
│   ├── validate-api-health.ts       # Validate all endpoints
│   └── integration-test-setup.ts    # Test environment setup
└── vitest.integration.config.ts     # Integration test config
```

## Component 1: API Response Recorder

### Purpose
Call all 43 API methods against live DKAN and save responses as fixtures

### Features
- Connects to local DKAN (dkan.ddev.site) or remote instance
- Calls every DkanApiClient method systematically
- Saves responses as JSON fixtures with metadata
- Handles auth, errors, and edge cases
- Generates summary report

### Implementation

```typescript
// scripts/record-api-responses.ts
interface RecordingConfig {
  baseUrl: string
  auth?: { username: string; password: string }
  outputDir: string
  skipMutations?: boolean  // Don't record create/update/delete
}

interface RecordedResponse {
  method: string
  endpoint: string
  timestamp: string
  request: any
  response: any
  status: number
  error?: string
}
```

### Usage

```bash
# Record from local DKAN
npm run record:api

# Record from specific site
DKAN_URL=https://demo.getdkan.org npm run record:api

# Record with auth
DKAN_URL=https://dkan.ddev.site \
DKAN_USER=admin \
DKAN_PASS=admin \
npm run record:api

# Record only safe read operations (no mutations)
npm run record:api:readonly
```

## Component 2: Integration Test Suite

### Purpose
Comprehensive tests that can run against live API or recorded fixtures

### Test Modes

1. **RECORDED mode** (default) - Uses fixtures, fast, no external deps
2. **LIVE mode** - Tests against real DKAN, slow, validates current API
3. **MOCK mode** (existing) - Unit tests with mocked fetch

### Implementation Strategy

```typescript
// Test helper to switch between modes
class IntegrationTestHelper {
  private mode: 'live' | 'recorded'
  private fixtures: Map<string, any>
  private client: DkanApiClient

  async getDataset(id: string) {
    if (this.mode === 'live') {
      return this.client.getDataset(id)
    }
    return this.fixtures.get(`dataset-${id}`)
  }
}
```

### Test Coverage (All 43 Methods)

#### Dataset Operations (7 methods)
- `getDataset` - retrieves dataset by ID
- `searchDatasets` - searches with filters
- `listAllDatasets` - lists all datasets
- `createDataset` - creates new dataset (skip in read-only)
- `updateDataset` - updates existing dataset (skip in read-only)
- `patchDataset` - partially updates dataset (skip in read-only)
- `deleteDataset` - deletes dataset (skip in read-only)

#### Datastore Operations (5 methods)
- `queryDatastore` - queries with conditions
- `getDatastoreSchema` - retrieves schema
- `querySql` - executes SQL query
- `downloadQuery` - downloads CSV/JSON
- `downloadQueryByDistribution` - downloads by distribution ID

#### Data Dictionary (6 methods)
- `listDataDictionaries` - lists all dictionaries
- `getDataDictionary` - retrieves by ID
- `getDataDictionaryFromUrl` - fetches from URL
- `createDataDictionary` - creates dictionary (skip in read-only)
- `updateDataDictionary` - updates dictionary (skip in read-only)
- `deleteDataDictionary` - deletes dictionary (skip in read-only)

#### Harvest Operations (6 methods)
- `listHarvestPlans` - lists all plans
- `getHarvestPlan` - retrieves plan by ID
- `registerHarvestPlan` - creates harvest plan (skip in read-only)
- `listHarvestRuns` - lists runs for plan
- `getHarvestRun` - retrieves run by ID
- `runHarvest` - executes harvest (skip in read-only)

#### Datastore Imports (4 methods)
- `listDatastoreImports` - lists all imports
- `getDatastoreStatistics` - retrieves stats
- `triggerDatastoreImport` - triggers import (skip in read-only)
- `deleteDatastore` - deletes datastore (skip in read-only)

#### Metastore Operations (6 methods)
- `listSchemas` - lists all schemas
- `getSchemaItems` - retrieves items for schema
- `getDatasetFacets` - retrieves facets
- `getDatasetProperties` - lists properties
- `getPropertyValues` - gets values for property
- `getAllPropertiesWithValues` - gets all with values

#### Revision/Moderation Operations (4 methods)
- `getRevisions` - lists revisions for item
- `getRevision` - retrieves specific revision
- `createRevision` - creates new revision (skip in read-only)
- `changeDatasetState` - changes workflow state (skip in read-only)

#### CKAN Compatibility (5 methods)
- `ckanPackageSearch` - searches packages
- `ckanDatastoreSearch` - searches datastore
- `ckanDatastoreSearchSql` - SQL query
- `ckanResourceShow` - shows resource
- `ckanCurrentPackageListWithResources` - lists all with resources

### Configuration

```typescript
// vitest.integration.config.ts
export default defineConfig({
  test: {
    include: ['src/__tests__/integration/**/*.test.ts'],
    testTimeout: 30000, // Longer timeout for API calls
    env: {
      TEST_MODE: process.env.TEST_MODE || 'recorded',
      DKAN_URL: process.env.DKAN_URL || 'https://dkan.ddev.site',
      DKAN_USER: process.env.DKAN_USER,
      DKAN_PASS: process.env.DKAN_PASS,
    }
  }
})
```

### Usage

```bash
# Run with recorded fixtures (fast, default)
npm run test:integration

# Run against live DKAN (requires running instance)
TEST_MODE=live npm run test:integration

# Run against specific DKAN instance
TEST_MODE=live \
DKAN_URL=https://demo.getdkan.org \
npm run test:integration

# Run with auth
TEST_MODE=live \
DKAN_URL=https://dkan.ddev.site \
DKAN_USER=admin \
DKAN_PASS=admin \
npm run test:integration

# Run only read operations
npm run test:integration:readonly
```

## Component 3: API Health Check Script

### Purpose
Standalone validation tool to verify all API endpoints are working

### Features
- Tests all 43 methods systematically
- Generates detailed HTML/JSON report
- Shows response times, status codes, errors
- Can run in CI/CD pipeline
- Validates response schemas

### Output Example

```
DKAN API Health Check Report
=============================
DKAN Instance: https://dkan.ddev.site
Test Time: 2024-01-15 10:30:00

Dataset Operations (7/7 passing)
✓ getDataset (120ms)
✓ searchDatasets (245ms)
✓ listAllDatasets (890ms)
✓ createDataset (SKIPPED - read-only mode)
✓ updateDataset (SKIPPED - read-only mode)
✓ patchDataset (SKIPPED - read-only mode)
✓ deleteDataset (SKIPPED - read-only mode)

Datastore Operations (5/5 passing)
✓ queryDatastore (156ms)
✓ getDatastoreSchema (98ms)
✓ querySql (201ms)
✓ downloadQuery (445ms)
✓ downloadQueryByDistribution (432ms)

[... continues for all categories ...]

Summary:
- Total Tests: 43
- Passed: 31
- Failed: 0
- Skipped: 12 (mutations in read-only mode)
- Average Response Time: 287ms
- Total Duration: 8.5s
```

### Implementation

```typescript
// scripts/validate-api-health.ts
interface HealthCheckResult {
  method: string
  category: string
  status: 'pass' | 'fail' | 'skip'
  responseTime?: number
  error?: string
  statusCode?: number
}

class ApiHealthChecker {
  async checkAll(): Promise<HealthCheckResult[]>
  async generateReport(format: 'json' | 'html' | 'markdown'): Promise<void>
}
```

### Usage

```bash
# Check local DKAN
npm run validate:api

# Check specific instance
DKAN_URL=https://demo.getdkan.org npm run validate:api

# Generate HTML report
npm run validate:api -- --format=html --output=api-report.html

# CI/CD mode (exits with error if any tests fail)
npm run validate:api -- --ci
```

## Benefits of This Approach

### Multiple Testing Strategies
- Fast unit tests (mocked)
- Fast integration tests (recorded fixtures)
- Slow but thorough live API tests
- Standalone validation script

### Development Workflow
- Developers run fast recorded tests locally
- CI/CD runs recorded tests on every commit
- Nightly builds run live tests against demo site
- Health check script monitors production APIs

### Fixture Management
- Real API responses as test data
- Can be regenerated anytime
- Version controlled
- Documents actual API behavior

### Validation Coverage
- All 43 methods tested
- Response schema validation
- Error handling validation
- Authentication validation
- Performance benchmarking

## Implementation Timeline

### Phase 1: API Response Recorder (Week 1)
- Build recording script
- Record from local DKAN
- Save fixtures
- Generate report

### Phase 2: Integration Test Suite (Week 2)
- Set up test infrastructure
- Implement fixture loading
- Write tests for all 43 methods
- Add live/recorded mode switching

### Phase 3: Health Check Script (Week 3)
- Build standalone validator
- Implement report generation
- Add CI/CD integration
- Create documentation

### Phase 4: Documentation & CI/CD (Week 4)
- Document testing workflow
- Add npm scripts
- Configure GitHub Actions
- Create developer guide

## Additional Considerations

### Schema Validation
- Use Zod or JSON Schema to validate response shapes
- Ensures API responses match TypeScript types
- Catches breaking API changes

### Performance Tracking
- Track response times over time
- Alert on regressions
- Benchmark different DKAN versions

### Error Scenarios
- Test 404s, 401s, 500s
- Network failures
- Malformed requests
- Rate limiting

### Test Data Management
- Setup/teardown for mutation tests
- Test dataset creation
- Cleanup after tests
- Isolated test environments

## Current Status

- **Phase 1**: ✅ **COMPLETED** (2025-11-12)
- **Phase 2**: Not Started
- **Phase 3**: Not Started
- **Phase 4**: Not Started

---

## Phase 1 Results: API Response Recorder

### Implementation Complete ✅

**Files Created**:
- `packages/dkan-client-tools-core/scripts/record-api-responses.ts` (808 lines)
- `packages/dkan-client-tools-core/tsconfig.scripts.json`
- `packages/dkan-client-tools-core/src/__tests__/fixtures/` (10 JSON files, ~160KB)
- `packages/dkan-client-tools-core/src/__tests__/fixtures/README.md`

**NPM Scripts Added**:
```json
{
  "record:api": "tsx scripts/record-api-responses.ts",
  "record:api:readonly": "READ_ONLY=true tsx scripts/record-api-responses.ts"
}
```

### Recording Results

**Test Environment**:
- DKAN Instance: http://dkan.ddev.site
- DKAN Version: 2.21.2
- Authentication: Admin user
- Mode: Read-only (mutations skipped)
- Date: 2025-11-12

**Summary Statistics**:
- **Total API Methods**: 45 (43 DkanApiClient + 2 utility methods)
- **Successfully Recorded**: 12 (26.7%)
- **Skipped**: 21 (46.7%) - mutations + missing test data
- **Errors**: 12 (26.7%) - 404s, endpoints not enabled
- **Duration**: 14.83 seconds

### Successfully Recorded APIs (12/45)

#### Dataset Operations (3/7)
- ✅ `getDataset` - Fetch dataset by ID (34ms)
- ✅ `searchDatasets` - Search with filters (100ms)
- ✅ `listAllDatasets` - List all datasets (81ms)

#### Data Dictionary (1/6)
- ✅ `listDataDictionaries` - List all dictionaries (74ms)

#### Harvest Operations (3/6)
- ✅ `listHarvestPlans` - List all plans (73ms)
- ✅ `getHarvestPlan` - Get specific plan (79ms)
- ✅ `listHarvestRuns` - List runs for plan (80ms)

#### Metastore Operations (3/6)
- ✅ `listSchemas` - List all schemas (78ms)
- ✅ `getSchemaItems` - Get items for schema (75ms)
- ✅ `getDatasetFacets` - Get facets (73ms)

#### Revision Operations (1/4)
- ✅ `getRevisions` - Get revision history (100ms)

#### OpenAPI (1/2)
- ✅ `getOpenApiDocsUrl` - Get docs URL (instant)

### Skipped APIs (21/45)

**Mutations in Read-only Mode (12)**:
- createDataset, updateDataset, patchDataset, deleteDataset
- createDataDictionary, updateDataDictionary, deleteDataDictionary
- registerHarvestPlan, runHarvest
- triggerDatastoreImport, deleteDatastore
- createRevision, changeDatasetState

**Missing Test Data (9)**:
- getDataDictionary (no data dictionary found)
- getDataDictionaryFromUrl (requires URL)
- getHarvestRun (no completed run found)
- getRevision (requires specific revision ID)
- downloadQueryByDistribution (distribution ID not found)
- ckanDatastoreSearch, ckanDatastoreSearchSql, ckanResourceShow (no distribution)

### Failed APIs (12/45)

**Datastore Operations (4) - 404 Errors**:
- ❌ `queryDatastore` - Datastore not imported for test dataset
- ❌ `getDatastoreSchema` - Datastore not imported
- ❌ `querySql` - No datastores available for SQL queries
- ❌ `downloadQuery` - No datastore data to download

**Datastore Imports (2) - 404 Errors**:
- ❌ `listDatastoreImports` - Endpoint not found
- ❌ `getDatastoreStatistics` - Endpoint not found

**Dataset Properties (3) - 404 Errors**:
- ❌ `getDatasetProperties` - Properties API not enabled
- ❌ `getPropertyValues` - Properties API not enabled
- ❌ `getAllPropertiesWithValues` - Properties API not enabled

**CKAN API (2) - 404 Errors**:
- ❌ `ckanPackageSearch` - CKAN API not enabled
- ❌ `ckanCurrentPackageListWithResources` - CKAN API not enabled

**OpenAPI (1) - 404 Error**:
- ❌ `getOpenApiSpec` - Spec endpoint not found

### Generated Fixtures

All fixtures saved to `packages/dkan-client-tools-core/src/__tests__/fixtures/`:

| File | Size | Contents |
|------|------|----------|
| summary.json | 69KB | Complete recording summary with all results |
| dataset-operations.json | 31KB | 49 sample datasets with full metadata |
| metastore.json | 28KB | Schema listings and facets |
| harvest.json | 1.2KB | Harvest plan and run data |
| data-dictionary.json | 1.2KB | Data dictionary listings |
| revisions.json | 881B | Revision history for dataset |
| datastore-operations.json | 1.5KB | Error responses for datastore ops |
| datastore-imports.json | 950B | Error responses for import ops |
| ckan.json | 1.1KB | Error responses for CKAN API |
| openapi.json | 441B | OpenAPI docs URL |

### Key Findings

1. **Protocol Issue**: HTTPS with DDEV causes fetch failures due to self-signed certificates. Solution: Use HTTP for local development.

2. **Authentication**: Harvest plans and revisions require authentication. Endpoints return 401 without credentials.

3. **Datastore Not Enabled**: Sample datasets have distributions (CSV files) but datastores are not imported. Need to trigger datastore imports to test datastore APIs.

4. **Missing Modules**: Several API endpoints return 404:
   - Properties API (`/api/1/properties`)
   - CKAN Compatibility API (`/api/3/action/*`)
   - Datastore Import API (`/api/1/datastore/imports`)
   - OpenAPI Spec (`/api/1/spec`)

5. **Sample Data**: Local DKAN has 49 sample datasets from `sample_content` harvest plan, providing good test data.

### Usage Examples

```bash
# Record from local DKAN without auth (public endpoints only)
cd packages/dkan-client-tools-core
DKAN_URL=http://dkan.ddev.site npm run record:api:readonly

# Record with authentication (includes harvest plans, revisions)
DKAN_URL=http://dkan.ddev.site \
DKAN_USER=admin \
DKAN_PASS=admin \
npm run record:api:readonly

# Record from remote DKAN instance
DKAN_URL=https://demo.getdkan.org npm run record:api:readonly

# Record with full mutations (create/update/delete)
DKAN_URL=http://dkan.ddev.site \
DKAN_USER=admin \
DKAN_PASS=admin \
npm run record:api
```

### Next Steps to Improve Coverage

1. **Enable Missing Modules**: Check if `dkan_alt_api` or other modules need to be enabled for CKAN and Properties APIs

2. **Import Datastores**: Trigger datastore imports for test datasets to enable datastore query testing
   ```bash
   ddev drush dkan:datastore:import cedcd327-4e5d-43f9-8eb1-c11850fa7c55
   ```

3. **Run Harvest**: Execute a harvest run to get completed run data for testing

4. **Create Test Data Dictionaries**: Add data dictionaries for testing CRUD operations

5. **Test Mutations**: Run recorder with mutations enabled to test create/update/delete operations

### Lessons Learned

- **Real API Responses**: Fixtures capture actual DKAN behavior including quirks (e.g., results as object vs array)
- **Error Handling**: Script gracefully handles 401s, 404s, and missing data
- **Performance**: Average response time ~75ms for successful requests
- **Comprehensive Logging**: Console output shows progress, errors, and summary
- **Flexible Configuration**: Environment variables allow testing against any DKAN instance

---

## References

- [DKAN API Research](./DKAN_API_RESEARCH.md)
- [API Gap Analysis](./DKAN_API_GAP_ANALYSIS.md)
- Core Package: `packages/dkan-client-tools-core`
- Fixtures: `packages/dkan-client-tools-core/src/__tests__/fixtures/`
- Recording Script: `packages/dkan-client-tools-core/scripts/record-api-responses.ts`
