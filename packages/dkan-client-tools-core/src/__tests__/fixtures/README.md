# API Response Fixtures

This directory contains recorded API responses from a live DKAN instance for use in integration testing.

## Overview

These fixtures were generated using the API Response Recorder script (`scripts/record-api-responses.ts`) running against a local DKAN 2.x instance. They provide real-world API responses for testing and validation.

## Files

- **summary.json** - Complete recording summary with metadata and all results
- **dataset-operations.json** - Dataset CRUD operations (7 methods)
- **datastore-operations.json** - Datastore query operations (5 methods)
- **data-dictionary.json** - Data dictionary operations (6 methods)
- **harvest.json** - Harvest plan and run operations (6 methods)
- **datastore-imports.json** - Datastore import operations (4 methods)
- **metastore.json** - Metastore schema operations (6 methods)
- **revisions.json** - Revision/moderation operations (4 methods)
- **ckan.json** - CKAN compatibility operations (5 methods)
- **openapi.json** - OpenAPI documentation operations (2 methods)

## Successfully Recorded APIs (12/45)

### Dataset Operations (3/7)
- ✓ `getDataset` - Get single dataset by ID
- ✓ `searchDatasets` - Search datasets with filters
- ✓ `listAllDatasets` - List all datasets

### Data Dictionary (1/6)
- ✓ `listDataDictionaries` - List all data dictionaries

### Harvest Operations (3/6)
- ✓ `listHarvestPlans` - List all harvest plans
- ✓ `getHarvestPlan` - Get specific harvest plan
- ✓ `listHarvestRuns` - List harvest runs for a plan

### Metastore Operations (3/6)
- ✓ `listSchemas` - List all metastore schemas
- ✓ `getSchemaItems` - Get items for a schema
- ✓ `getDatasetFacets` - Get dataset facets (themes, keywords, publishers)

### Revision Operations (1/4)
- ✓ `getRevisions` - Get revision history for an item

### OpenAPI (1/2)
- ✓ `getOpenApiDocsUrl` - Get URL to API documentation

## Skipped APIs (21/45)

### Read-only Mode (12)
Mutation operations skipped in read-only mode:
- createDataset, updateDataset, patchDataset, deleteDataset
- createDataDictionary, updateDataDictionary, deleteDataDictionary
- registerHarvestPlan, runHarvest
- triggerDatastoreImport, deleteDatastore
- createRevision, changeDatasetState

### Missing Test Data (9)
Operations skipped due to missing test data:
- getDataDictionary (no data dictionary found)
- getDataDictionaryFromUrl (requires URL)
- getHarvestRun (no completed run found)
- getRevision (requires specific revision ID)
- downloadQueryByDistribution (distribution not found)
- ckanDatastoreSearch, ckanDatastoreSearchSql, ckanResourceShow (no distribution)

## API Errors (12/45)

### Datastore Operations (4)
- queryDatastore, getDatastoreSchema, querySql, downloadQuery
- **Reason**: Datastores not imported for test datasets

### Datastore Imports (1)
- listDatastoreImports
- **Reason**: Endpoint returns 404 (might not be enabled in this DKAN version)

### Dataset Properties (3)
- getDatasetProperties, getPropertyValues, getAllPropertiesWithValues
- **Reason**: Properties API endpoint returns 404 (API not present in DKAN 2.21.2)

### CKAN API (2)
- ckanPackageSearch, ckanCurrentPackageListWithResources
- **Reason**: CKAN compatibility API returns 404 (API not present in DKAN 2.21.2)

## Recording Details

**Source**: Local DKAN 2.x instance (http://dkan.ddev.site)
**Date**: 2025-11-12
**Authentication**: Admin user (required for harvest plans and revisions)
**Mode**: Read-only (mutations skipped)
**Total Methods**: 45
**Success Rate**: 26.7% (12 recorded)

## Regenerating Fixtures

To update these fixtures with fresh data:

```bash
# From packages/dkan-client-tools-core directory

# Without authentication (public endpoints only)
DKAN_URL=http://dkan.ddev.site npm run record:api:readonly

# With authentication (includes harvest plans, revisions)
DKAN_URL=http://dkan.ddev.site \
DKAN_USER=admin \
DKAN_PASS=admin \
npm run record:api:readonly
```

## Using Fixtures in Tests

These fixtures can be used in integration tests to validate API responses without requiring a live DKAN instance:

```typescript
import datasetFixtures from './__tests__/fixtures/dataset-operations.json'
import metastoreFixtures from './__tests__/fixtures/metastore.json'

// Use recorded responses in tests
const getDatasetResponse = datasetFixtures.find(f => f.method === 'getDataset')
expect(actualResponse).toEqual(getDatasetResponse.response)
```

## Next Steps

To capture the remaining APIs:

1. **Enable Datastore**: Import CSV data into datastores to test datastore operations
2. **Run Harvests**: Execute harvest runs to test harvest run APIs
3. **Check DKAN Version**: Verify which APIs are available in this version
4. **Configure Properties API**: Enable dataset properties endpoint if available
5. **Full Recording**: Run with mutations enabled to test create/update/delete operations

## Related Files

- `scripts/record-api-responses.ts` - API recording script
- `research/API_TESTING_PLAN.md` - Complete testing strategy
