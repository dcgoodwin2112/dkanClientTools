# Drupal 10 Downgrade Results

**Date**: 2025-11-12
**Previous Version**: Drupal 11.2.7
**New Version**: Drupal 10.3.14
**DKAN Version**: 2.21.2 (unchanged)

## Objective

Downgrade the local DKAN development site from Drupal 11 to Drupal 10 to resolve module compatibility issues with `datastore` and `dkan_alt_api` modules.

## Process

### 1. Backup
- ✅ Exported configuration: `ddev drush config:export`
- ✅ Created database snapshot: `ddev snapshot --name drupal11-backup`

### 2. Update composer.json
Changed Drupal core requirements from `^11.2` to `~10.3.0`:
```json
"require": {
    "drupal/core-composer-scaffold": "~10.3.0",
    "drupal/core-project-message": "~10.3.0",
    "drupal/core-recommended": "~10.3.0"
}
```

Removed: `drupal/core-recipe-unpack` (Drupal 11 only)

### 3. Composer Update
```bash
ddev composer update --with-all-dependencies
```

**Results**:
- Downgraded 44 packages
- Removed 4 packages (Drupal 11 specific)
- Installed 1 package (Symfony polyfill for PHP 7.2)
- Downgraded from Symfony 7 to Symfony 6
- Duration: ~2 minutes

### 4. Database Updates
```bash
ddev drush updatedb -y
```

**Warnings** (non-critical):
- Missing schema info for `datastore`, `datastore_mysql_import`, `dkan_client_demo_vanilla`
- Incompatible module warnings (resolved by uninstalling demo modules)

### 5. Cleanup
Uninstalled problematic demo modules:
```bash
ddev drush pm:uninstall dkan_client_demo_react dkan_client_demo_vue \
  dkan_client_demo_vanilla dkan_client_tools_react_base \
  dkan_client_tools_vue_base dkan_client_tools_core_base -y
```

## Results

### Enabled Modules (Now Working)

✅ **datastore** - Now enabled (was incompatible with Drupal 11)
✅ **datastore_mysql_import** - Now enabled
✅ **dkan_alt_api** - Now enabled (was incompatible with Drupal 11)

### API Recording Improvements

**Before (Drupal 11)**:
- Successfully Recorded: 12/45 (26.7%)
- Errors: 12
- Skipped: 21

**After (Drupal 10)**:
- Successfully Recorded: 13/45 (28.9%)
- Errors: 11
- Skipped: 21

**New Working Endpoint**:
- ✅ `listDatastoreImports` - `/api/1/datastore/imports` (was 404, now 200)

### Remaining Issues

#### Datastore Operations (4 endpoints) - 400 Bad Request
- `queryDatastore` - 400 Bad Request
- `getDatastoreSchema` - 400 Bad Request
- `downloadQuery` - 400 Bad Request
- **Reason**: Datastores not imported for test datasets

#### SQL Query (1 endpoint) - 403 Forbidden
- `querySql` - 403 Forbidden
- **Reason**: Admin user needs specific permission to query SQL endpoint

#### Datastore Statistics (1 endpoint) - 404 Not Found
- `getDatastoreStatistics` - 404 Not Found
- **Reason**: No datastore statistics available (no imports have been run)

#### CKAN API (2 endpoints) - 404 Not Found
- `ckanPackageSearch` - Still 404
- `ckanCurrentPackageListWithResources` - Still 404
- **Reason**: CKAN compatibility API still not found

#### Properties API (3 endpoints) - 404 Not Found
- `getDatasetProperties` - Still 404
- `getPropertyValues` - Still 404
- `getAllPropertiesWithValues` - Still 404
- **Reason**: Properties API still not found

#### OpenAPI (1 endpoint) - 404 Not Found
- `getOpenApiSpec` - Still 404
- **Reason**: Spec endpoint still not found

## Next Steps

### High Priority

1. **Import Datastores** to enable datastore query operations:
   ```bash
   # Import all datasets
   ddev drush dkan:datastore:import --all

   # Or import specific dataset
   ddev drush dkan:datastore:import cedcd327-4e5d-43f9-8eb1-c11850fa7c55
   ```

2. **Grant SQL Query Permission** to admin user:
   - Check available permissions
   - Grant `query the sql endpoint api` permission
   - Re-test `querySql` endpoint

### Medium Priority

3. **Investigate CKAN API** - Appears to not exist in DKAN 2.21.2
   - Check DKAN documentation for CKAN compatibility status
   - May need to deprecate these methods in dkan-client-tools
   - Alternative: Test against older DKAN version

4. **Investigate Properties API** - Appears to not exist in DKAN 2.21.2
   - Check if functionality moved to search facets
   - `getDatasetFacets()` provides similar functionality
   - May need to deprecate these methods

### Low Priority

5. **Test Alternate API Routes** (`/alt/api/1/*`)
   - Now that `dkan_alt_api` is enabled
   - Compare permissions and behavior

6. **Run Harvest** to generate harvest run data
   ```bash
   ddev drush dkan:harvest:run sample_content
   ```

## Rollback Instructions

If needed to restore Drupal 11:

```bash
# Restore database snapshot
ddev snapshot restore drupal11-backup

# Restore composer.json
git checkout composer.json composer.lock

# Run composer install
ddev composer install

# Clear cache
ddev drush cr
```

## Lessons Learned

1. **Module Compatibility**: DKAN 2.21.2 modules are designed for Drupal 10, not Drupal 11
2. **Composer Downgrade**: Downgrading Drupal is straightforward with proper dependency management
3. **Demo Modules**: Demo modules can cause dependency conflicts and should be disabled in testing environments
4. **API Availability**: Not all documented DKAN APIs may be available in all versions

## Impact on dkan-client-tools

### Positive
- One more API endpoint working (`listDatastoreImports`)
- Datastore and alt_api modules now available for testing
- Can now test datastore operations once data is imported

### Neutral
- CKAN API and Properties API still unavailable
- May need to document version requirements
- May need to deprecate unsupported methods

### Recommendations
1. Document Drupal 10 requirement in dkan-client-tools
2. Add version compatibility checks
3. Mark CKAN and Properties methods as "requires specific DKAN configuration"
4. Provide fallback methods using available APIs

## Configuration Summary

**System Information**:
- Drupal Version: 10.3.14
- DKAN Version: 2.21.2
- PHP Version: 8.3.16
- Drush Version: 13.6.2.0
- Database: MySQL (MariaDB 10.11)
- DDEV Version: Latest

**Enabled DKAN Modules**:
```
✓ dkan - Core
✓ common - Common utilities
✓ data_dictionary_widget - Data dictionary UI
✓ datastore - Datastore operations (NEW)
✓ datastore_mysql_import - MySQL import (NEW)
✓ dkan_alt_api - Alternate API (NEW)
✓ harvest - Harvest operations
✓ json_form_widget - JSON forms
✓ metastore - Metadata storage
✓ metastore_admin - Admin interface
✓ metastore_search - Search functionality
✓ sample_content - Sample data generator
```

## References

- [API Testing Plan](./API_TESTING_PLAN.md)
- [DKAN Module Investigation](./DKAN_MODULE_INVESTIGATION.md)
- [API Recording Results](../packages/dkan-client-tools-core/src/__tests__/fixtures/summary.json)
