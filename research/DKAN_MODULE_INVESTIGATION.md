# DKAN Module Investigation: Missing APIs

**Date**: 2025-11-12
**DKAN Version**: 2.21.2
**Drupal Version**: 11.2.7

## Issue

During Phase 1 of API testing, we discovered that 12 out of 45 API methods returned 404 errors. This investigation explores which DKAN modules might provide these missing APIs.

## Missing APIs

### 1. CKAN Compatibility API (2 endpoints) - 404 Errors
- `/api/3/action/package_search`
- `/api/3/action/current_package_list_with_resources`

### 2. Properties API (3 endpoints) - 404 Errors
- `/api/1/properties`
- `/api/1/properties/{property}`
- `/api/1/properties?show_values=true`

### 3. OpenAPI Documentation (1 endpoint) - 404 Error
- `/api/1/spec`

### 4. Datastore Import API (2 endpoints) - 404 Errors
- `/api/1/datastore/imports`
- `/api/1/datastore/imports/{identifier}`

## Investigation: dkan_alt_api Module

### Module Status
- **Machine Name**: `dkan_alt_api`
- **Status**: Disabled
- **Location**: `/docroot/modules/contrib/dkan/modules/common/modules/dkan_alt_api`
- **Core Compatibility**: `^10.2` (NOT compatible with Drupal 11)
- **Dependencies**: `metastore`, `datastore`

### What dkan_alt_api Provides

The `dkan_alt_api` module provides **alternate routes** with different permissions, NOT the CKAN or Properties APIs.

**Routes Provided**:
```yaml
# Alternate metastore routes
/alt/api/1/metastore/schemas/{schema_id}/items
/alt/api/1/metastore/schemas/{schema_id}/items/{identifier}

# Alternate SQL endpoint
/alt/api/1/datastore/sql (GET and POST)
```

**Purpose**: Allows varying permissions on APIs when logged in vs anonymous. Uses different permission checks than standard APIs.

**Permissions Required**:
- `get data through the alternate metastore api`
- `query the alternate sql endpoint api`

### Why It Can't Be Enabled

Attempted to enable:
```bash
ddev drush pm:enable dkan_alt_api -y
```

**Result**:
```
Unable to install modules: module 'dkan_alt_api' is incompatible
with this version of Drupal core.
```

**Reason**: Module requires Drupal 10.2, but we're running Drupal 11.2.7.

## Investigation: datastore Module

### Module Status
- **Machine Name**: `datastore`
- **Status**: Disabled
- **Dependencies Issue**: Requires `dkan_client_demo` which doesn't exist

Attempted to enable:
```bash
ddev drush pm:enable datastore -y
```

**Result**:
```
The module dkan_client_demo does not exist.
```

### Why Datastore Operations Fail (4 endpoints)

The **datastore module is disabled**, which explains why these endpoints return 404:
- `/api/1/datastore/query/{datasetId}/{index}`
- `/api/1/datastore/query/{datasetId}/{index}?schema=true`
- `/api/1/datastore/sql`
- `/api/1/datastore/query/{datasetId}/{index}/download`

Even if enabled, these would still fail because **datastores are not imported**. Sample datasets have distributions (CSV files) but the data hasn't been imported into queryable datastores.

## Currently Enabled DKAN Modules

```
✓ dkan - Core DKAN functionality
✓ common - Common utilities
✓ data_dictionary_widget - Data dictionary UI widget
✓ harvest - Harvest data from external sources
✓ json_form_widget - JSON form widget
✓ metastore - Metadata storage (enables /api/1/metastore/*)
✓ metastore_admin - Admin interface for metastore
✓ metastore_search - Search functionality (enables /api/1/search)
✓ sample_content - Sample dataset generator
✓ dkan_client_demo_react - React demo
✓ dkan_client_demo_vanilla - Vanilla JS demo
✓ dkan_client_demo_vue - Vue demo
✓ dkan_client_tools_core_base - Core client tools base
✓ dkan_client_tools_react_base - React client tools base
✓ dkan_client_tools_vue_base - Vue client tools base
```

## Currently Disabled DKAN Modules

```
✗ dkan_alt_api - Alternate API (incompatible with Drupal 11)
✗ datastore - Datastore functionality (dependency issue)
✗ datastore_mysql_import - MySQL datastore import
✗ dkan_js_frontend - JavaScript frontend
✗ frontend - Legacy frontend
✗ dkan_metastore_facets - Additional facets
```

## Findings: Where Are These APIs?

### CKAN Compatibility API
**Status**: ❓ **Unknown - Not Found**

The CKAN API endpoints (`/api/3/action/*`) are **not found in any routing files**.

**Possible explanations**:
1. **Removed in DKAN 2.x**: CKAN compatibility may have been dropped in favor of native DKAN API
2. **Separate Module**: May require a separate CKAN compatibility module not present in this installation
3. **Optional Feature**: May be opt-in and not enabled by default

**Evidence**:
- No routing files contain `api/3/action` patterns
- Documentation mentions CKAN as "inspiration" but not compatibility layer
- Our DkanApiClient has CKAN methods, but they may be based on older DKAN versions

### Properties API
**Status**: ❓ **Unknown - Not Found**

The Properties API endpoints (`/api/1/properties`) are **not found in any routing files**.

**Possible explanations**:
1. **Removed Feature**: May have been removed in recent DKAN versions
2. **Replaced by Search Facets**: Functionality may have moved to `/api/1/search` with facets
3. **Optional Module**: May require enabling `dkan_metastore_facets` module

**Evidence**:
- Only found admin route: `/admin/dkan/properties` (configuration UI, not API)
- No public API routes for properties found
- `getDatasetFacets()` method works and provides similar functionality

### OpenAPI Spec
**Status**: ❓ **Unknown - Not Found**

The OpenAPI specification endpoint (`/api/1/spec`) returns 404.

**Possible explanations**:
1. **Not Implemented**: OpenAPI spec generation may not be included
2. **Requires Module**: May need a separate Drupal module like `openapi` or `jsonapi_schema`
3. **Different Endpoint**: Spec may be at a different location

### Datastore Import API
**Status**: ⚠️ **Requires Datastore Module**

These endpoints likely require the `datastore` module to be enabled, but we cannot enable it due to dependency issues.

## Recommended Actions

### 1. Enable Datastore Module (High Priority)
**Issue**: Dependency error on `dkan_client_demo`

**Solutions**:
- Check if `dkan_client_demo` should exist or if it's a config error
- Try enabling with `--skip-missing-dependencies` if available
- Check DKAN issue queue for known problems
- May need to fix or remove demo module dependencies

### 2. Import Sample Datastores (High Priority)
Once datastore module is enabled, import CSV data:
```bash
# Import datastore for a specific dataset
ddev drush dkan:datastore:import cedcd327-4e5d-43f9-8eb1-c11850fa7c55

# Or import all
ddev drush dkan:datastore:import --all
```

### 3. Research CKAN Compatibility (Medium Priority)
- Check DKAN changelog to see when CKAN API was deprecated/removed
- Search DKAN issue queue for CKAN compatibility status
- Check if there's a separate CKAN compatibility module
- Consider if these methods should be deprecated in our client

### 4. Research Properties API (Medium Priority)
- Check if `dkan_metastore_facets` module provides this functionality
- Investigate if Properties API was replaced by search facets
- Consider if `getDatasetFacets()` provides equivalent functionality
- May need to deprecate properties methods if API no longer exists

### 5. Enable Additional Modules (Low Priority)
Try enabling these once datastore issue is resolved:
- `datastore_mysql_import` - May provide better import performance
- `dkan_metastore_facets` - May provide properties-like functionality

### 6. Alternative: Test Against DKAN 2.19.x (Low Priority)
- Try testing against an older DKAN version that may have these APIs
- Use a public DKAN demo site if available
- This would help determine if APIs were removed or just misconfigured

## Impact on dkan-client-tools

### Methods That May Need Deprecation
If these APIs were removed from DKAN 2.x, these client methods should be marked as deprecated:

**CKAN API (5 methods)**:
- `ckanPackageSearch()`
- `ckanDatastoreSearch()`
- `ckanDatastoreSearchSql()`
- `ckanResourceShow()`
- `ckanCurrentPackageListWithResources()`

**Properties API (3 methods)**:
- `getDatasetProperties()`
- `getPropertyValues()`
- `getAllPropertiesWithValues()`

**Alternative**: Could keep methods but document that they require specific DKAN versions or modules.

### Methods That Need Datastore Module

These will work once datastore module is enabled and data is imported:

**Datastore Query (5 methods)**:
- `queryDatastore()`
- `getDatastoreSchema()`
- `querySql()`
- `downloadQuery()`
- `downloadQueryByDistribution()`

**Datastore Imports (2 methods)**:
- `listDatastoreImports()`
- `getDatastoreStatistics()`

## Next Steps

1. ✅ **Document findings** (this file)
2. ⏭️ **Update API_TESTING_PLAN.md** with module investigation results
3. ⏭️ **Create GitHub issue** to track DKAN module compatibility
4. ⏭️ **Research workarounds** for enabling datastore module
5. ⏭️ **Test against public DKAN instance** to see if APIs exist elsewhere
6. ⏭️ **Document in CLAUDE.md** which APIs require specific modules

## References

- DKAN Version: 2.21.2
- GitHub: https://github.com/GetDKAN/dkan/tree/2.21.2
- Documentation: https://dkan.readthedocs.io/en/latest/
- Module Location: `/docroot/modules/contrib/dkan`
- Phase 1 Results: [API_TESTING_PLAN.md](./API_TESTING_PLAN.md#phase-1-results-api-response-recorder)
