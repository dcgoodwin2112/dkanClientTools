# Fresh DKAN Installation Results

**Date**: 2025-11-12
**Drupal Version**: 10.3.14
**DKAN Version**: 2.21.2
**Installation Type**: Fresh install with sample content

## Objective

Perform a fresh Drupal installation with DKAN to ensure all modules are properly configured and all available APIs are working.

## Process

### 1. Backup
- ✅ Created snapshot: `ddev snapshot --name before-fresh-install`

### 2. Database Reset
```bash
DROP DATABASE IF EXISTS db;
CREATE DATABASE db;
```

### 3. Fresh Drupal Installation
```bash
ddev drush site:install standard \
  --account-name=admin \
  --account-pass=admin \
  --site-name="DKAN Demo" -y
```

### 4. Enable DKAN Modules
```bash
ddev drush pm:enable dkan metastore metastore_admin metastore_search \
  harvest datastore datastore_mysql_import dkan_alt_api sample_content -y
```

**Modules Installed**:
- dkan (core)
- metastore, metastore_admin, metastore_search
- harvest
- datastore, datastore_mysql_import
- dkan_alt_api
- sample_content
- Plus 14 dependencies (basic_auth, content_moderation, workflows, etc.)

### 5. Import Sample Content
```bash
ddev drush dkan:sample-content:create
ddev drush cron (run 3 times)
```

**Results**:
- 10 datasets imported successfully
- All resources localized
- All datastore imports completed
- Harvest run status: SUCCESS

## API Recording Results

### Summary Statistics

**Previous Best (Drupal 11 upgrade)**:
- Successfully Recorded: 13/45 (28.9%)
- Errors: 11
- Skipped: 21

**Fresh Install (Drupal 10)**:
- Successfully Recorded: **15/45 (33.3%)** ⬆️
- Errors: **9** ⬇️
- Skipped: 21

**Improvement**: +2 successful API recordings, -2 errors

### New Working Endpoints (2)

✅ **queryDatastore** - `/api/1/datastore/query/{datasetId}/{index}`
- Status: 200 OK
- Response time: 158ms
- Now returns actual datastore results

✅ **getDatastoreSchema** - `/api/1/datastore/query/{datasetId}/{index}?schema=true`
- Status: 200 OK
- Response time: 202ms
- Returns datastore schema with field information

### All Working APIs (15 total)

#### Dataset Operations (3/7)
- ✅ getDataset (93ms)
- ✅ searchDatasets (101ms)
- ✅ listAllDatasets (78ms)

#### Datastore Operations (2/5) ✨ NEW
- ✅ queryDatastore (158ms) ✨
- ✅ getDatastoreSchema (202ms) ✨
- ❌ querySql (403 Forbidden)
- ❌ downloadQuery (400 Bad Request)

#### Data Dictionary (1/6)
- ✅ listDataDictionaries (72ms)

#### Harvest Operations (3/6)
- ✅ listHarvestPlans (76ms)
- ✅ getHarvestPlan (77ms)
- ✅ listHarvestRuns (72ms)

#### Datastore Import Operations (1/4)
- ✅ listDatastoreImports (181ms)

#### Metastore Operations (3/6)
- ✅ listSchemas (85ms)
- ✅ getSchemaItems (75ms)
- ✅ getDatasetFacets (75ms)

#### Revision Operations (1/4)
- ✅ getRevisions (104ms)

#### OpenAPI (1/2)
- ✅ getOpenApiDocsUrl (instant)

### Remaining Errors (9)

#### SQL Query (1) - 403 Forbidden
- ❌ `querySql` - HTTP 403: Forbidden
- **Reason**: Admin user needs specific permission
- **Fix**: Grant `query the sql endpoint api` permission

#### Download Query (1) - 400 Bad Request
- ❌ `downloadQuery` - HTTP 400: Bad Request
- **Reason**: May require specific query parameters or different datastore state

#### Datastore Statistics (1) - 404 Not Found
- ❌ `getDatastoreStatistics` - HTTP 404: Not Found
- **Reason**: Statistics endpoint not available

#### CKAN API (2) - 404 Not Found
- ❌ `ckanPackageSearch` - HTTP 404: Not Found
- ❌ `ckanCurrentPackageListWithResources` - HTTP 404: Not Found
- **Reason**: CKAN compatibility API not present in DKAN 2.21.2

#### Properties API (3) - 404 Not Found
- ❌ `getDatasetProperties` - HTTP 404: Not Found
- ❌ `getPropertyValues` - HTTP 404: Not Found
- ❌ `getAllPropertiesWithValues` - HTTP 404: Not Found
- **Reason**: Properties API not present in DKAN 2.21.2

#### OpenAPI Spec (1) - 404 Not Found
- ❌ `getOpenApiSpec` - HTTP 404: Not Found
- **Reason**: OpenAPI spec generation not available

### Skipped Operations (21)

**Mutations in Read-Only Mode (12)**:
- createDataset, updateDataset, patchDataset, deleteDataset
- createDataDictionary, updateDataDictionary, deleteDataDictionary
- registerHarvestPlan, runHarvest
- triggerDatastoreImport, deleteDatastore
- createRevision, changeDatasetState

**Missing Test Data (9)**:
- getDataDictionary (no data dictionary created)
- getDataDictionaryFromUrl (requires specific URL)
- getHarvestRun (requires harvest run ID - need to check harvest status)
- getRevision (requires specific revision ID)
- downloadQueryByDistribution (distribution identifier not found)
- ckanDatastoreSearch, ckanDatastoreSearchSql, ckanResourceShow (no distribution)

## Key Findings

### What Worked

1. **Fresh Install Success**: Clean installation resolved previous issues
2. **Datastore Import**: Automatic datastore creation during sample content import
3. **Module Compatibility**: All target modules (datastore, dkan_alt_api) working on Drupal 10
4. **Performance**: Response times are good (70-200ms average)

### What Improved

1. **Datastore Queries Now Work**:
   - `queryDatastore` now returns actual data (was 400 error)
   - `getDatastoreSchema` now returns schema (was 400 error)
   - This confirms datastores are properly imported

2. **Better Error Classification**:
   - Fewer "not found" errors
   - Clearer understanding of which APIs truly don't exist

### What Still Doesn't Work

1. **SQL Queries** (403 Forbidden):
   - Permission-based restriction
   - Admin needs specific role/permission
   - Not a missing feature

2. **CKAN API** (404 Not Found):
   - Confirmed not present in DKAN 2.21.2
   - May have been removed in favor of native API
   - **Recommend**: Deprecate in dkan-client-tools

3. **Properties API** (404 Not Found):
   - Confirmed not present in DKAN 2.21.2
   - Functionality may be in search facets instead
   - **Recommend**: Deprecate or redirect to getDatasetFacets

4. **OpenAPI Spec** (404):
   - Not generated by default
   - May require additional module

## Sample Data Created

**Datasets**: 10 datasets with full metadata
- cedcd327-4e5d-43f9-8eb1-c11850fa7c55 (Florida Bike Lanes)
- fb3525f2-d32a-451e-8869-906ed41f7695
- d460252e-d42c-474a-9ea9-5287b1d595f6
- 95f8eac4-fd1f-4b35-8472-5c87e9425dfa
- 1f2042ad-c513-4fcf-a933-cae6c6fd35e6
- e1f2ebcd-ee23-454f-87b5-df0306658418
- 934400f2-a5dc-4abf-bf16-3f17335888d3
- 74c06c81-9fe0-439c-aba9-cd5c980a6df4
- 5dc1cfcf-8028-476c-a020-f58ec6dd621c
- c9e2d352-e24c-4051-9158-f48127aa5692

**Harvest Plan**: sample_content
- Run ID: 1
- Status: SUCCESS
- Processed: 10
- Created: 10
- Updated: 0
- Errors: 0

**Datastores**: 10 datastores imported and queryable

## Next Steps

### High Priority

1. **Grant SQL Permission** to enable querySql:
   ```bash
   ddev drush role:perm:add administrator "query the sql endpoint api"
   ```

2. **Test Download Query** with proper parameters:
   - Need to investigate required query structure
   - May need specific datastore state

3. **Get Harvest Run ID** and test getHarvestRun:
   ```bash
   ddev drush dkan:harvest:info sample_content
   ```

### Medium Priority

4. **Create Data Dictionaries** for testing CRUD operations:
   - Manual creation via API or UI
   - Test data dictionary endpoints

5. **Document Missing APIs**:
   - Update CLAUDE.md with findings
   - Mark CKAN and Properties APIs as deprecated/unavailable
   - Document Drupal 10 requirement

### Low Priority

6. **Test Mutations** (if needed):
   - Run recorder without read-only mode
   - Test create/update/delete operations
   - Requires careful cleanup

## Comparison: Before vs After Fresh Install

| Metric | Drupal 11 Upgrade | Fresh Install | Change |
|--------|------------------|---------------|--------|
| Successful | 13/45 (28.9%) | 15/45 (33.3%) | +2 ⬆️ |
| Errors | 11 | 9 | -2 ⬇️ |
| Skipped | 21 | 21 | 0 |
| Duration | 15.15s | 12.59s | -2.56s ⬆️ |

## Configuration Summary

**Drupal**: 10.3.14
**PHP**: 8.3.16
**Database**: MariaDB 10.11
**DDEV**: Latest

**Enabled DKAN Modules**:
```
✓ dkan - DKAN Core
✓ common - Common utilities
✓ datastore - Datastore operations (working!)
✓ datastore_mysql_import - MySQL import (working!)
✓ dkan_alt_api - Alternate API (enabled)
✓ metastore - Metadata storage
✓ metastore_admin - Admin interface
✓ metastore_search - Search functionality
✓ harvest - Harvest operations
✓ sample_content - Sample data generator
✓ data_dictionary_widget - Data dictionary UI
✓ basic_auth - HTTP Basic Auth
✓ content_moderation - Workflow moderation
✓ workflows - Workflow system
✓ views_bulk_operations - Bulk operations
✓ moderated_content_bulk_publish - Bulk publishing
✓ pathauto - URL patterns
✓ token - Token replacement
✓ search_api - Search API
✓ search_api_db - Database search backend
✓ json_form_widget - JSON forms
✓ select_or_other - Form widget
✓ select2 - Select2 integration
```

## Impact on dkan-client-tools

### Positive Changes

1. **More Working APIs**: 15 successful (33.3% coverage)
2. **Datastore Operations Work**: Critical functionality now validated
3. **Clean Test Environment**: Fresh install removes configuration cruft
4. **Better Understanding**: Clear picture of what APIs exist vs. don't exist

### Required Actions

1. **Update Documentation**:
   - Document Drupal 10 requirement
   - List working vs. non-working APIs
   - Provide fresh install instructions

2. **Deprecate Unavailable APIs**:
   - Mark CKAN methods as deprecated (5 methods)
   - Mark Properties methods as deprecated (3 methods)
   - Suggest alternatives (search facets for properties)

3. **Fix Permission Issues**:
   - Document SQL permission requirement
   - Provide setup instructions for full API access

4. **Update Tests**:
   - Use 15 successful API fixtures
   - Skip tests for deprecated methods
   - Document expected 404s for unavailable APIs

## Rollback Instructions

If needed to restore previous state:

```bash
# Restore snapshot
ddev snapshot restore before-fresh-install

# Verify
ddev drush status
```

## References

- [API Testing Plan](./API_TESTING_PLAN.md)
- [Drupal 10 Downgrade Results](./DRUPAL_10_DOWNGRADE_RESULTS.md)
- [DKAN Module Investigation](./DKAN_MODULE_INVESTIGATION.md)
- Fixtures: `packages/dkan-client-tools-core/src/__tests__/fixtures/`
