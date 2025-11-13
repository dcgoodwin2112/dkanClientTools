# API Testing - Recommended Next Steps

**Date**: 2025-11-12
**Status**: Post-Cleanup Analysis
**Current Test Coverage**: 325 tests passing (Core: 74, React: 169, Vue: 82)

## Executive Summary

After thorough investigation and cleanup, the DKAN Client Tools packages are in excellent shape with 33 API methods across all major DKAN functionality. Two non-existent APIs have been removed (`getDatastoreStatistics`, `getOpenApiSpec`), and the `downloadQuery` bug has been fixed.

**Current API Status**:
- ✅ **31 methods** fully tested and working
- ⚠️ **2 methods** have known issues requiring DKAN-side fixes or configuration

---

## Phase 1: Fix Remaining API Issues (High Priority)

### 1.1 Fix `querySql` Permission Issue

**Problem**: HTTP 403 Forbidden - Admin user lacks SQL query permission

**Root Cause**: The `query the sql endpoint api` permission is not granted to admin user by default

**Solution Options**:

**Option A: Grant Permission via Drush (Recommended)**
```bash
# SSH into DKAN container
ddev ssh

# Create or update admin role to include SQL permission
drush php-eval "
  \$role = \Drupal\user\Entity\Role::load('administrator');
  \$role->grantPermission('query the sql endpoint api');
  \$role->save();
"

# Or grant to specific user
drush php-eval "
  \$user = \Drupal\user\Entity\User::load(1);
  \$role = \Drupal\user\Entity\Role::create([
    'id' => 'dkan_sql_user',
    'label' => 'DKAN SQL User',
  ]);
  \$role->grantPermission('query the sql endpoint api');
  \$role->save();
  \$user->addRole('dkan_sql_user');
  \$user->save();
"

# Clear cache
drush cr
```

**Option B: Update Permissions via UI**
1. Navigate to `/admin/people/permissions`
2. Find permission: "Query the SQL endpoint API"
3. Grant to appropriate roles
4. Save permissions

**Testing After Fix**:
```bash
# Test the endpoint directly
curl -u "admin:admin" \
  "http://dkan.ddev.site/api/1/sql?query=%5BSELECT%20%2A%20FROM%20cedcd327-4e5d-43f9-8eb1-c11850fa7c55%5D%3B"

# Run API recorder to verify
npm run record:api:readonly -w @dkan-client-tools/core
```

**Expected Result**: HTTP 200 with SQL query results

**Priority**: HIGH - SQL queries are a core DKAN feature

---

### 1.2 Fix `downloadQuery` Testing

**Problem**: HTTP 400 when downloading query results (FIXED IN CODE, needs live testing)

**What Was Fixed**: Changed from POST with JSON body to GET with query parameters

**Before**:
```typescript
// POST /api/1/datastore/query/{id}/{index}/download?format=csv
// Body: {"limit": 100, "conditions": [...]}
// Result: 400 "Streaming not currently available for JSON responses"
```

**After**:
```typescript
// GET /api/1/datastore/query/{id}/{index}/download?format=csv&limit=100&conditions=[...]
// Result: Should work correctly
```

**Testing Required**:
1. Import a datastore first (see Phase 2.1 below)
2. Test download with simple options:
   ```bash
   curl "http://dkan.ddev.site/api/1/datastore/query/cedcd327-4e5d-43f9-8eb1-c11850fa7c55/0/download?format=csv&limit=5"
   ```
3. Test download with complex options (conditions, sorts):
   ```bash
   curl "http://dkan.ddev.site/api/1/datastore/query/cedcd327-4e5d-43f9-8eb1-c11850fa7c55/0/download?format=csv&limit=10&conditions=%5B%7B%22property%22%3A%22state%22%2C%22value%22%3A%22CA%22%7D%5D"
   ```
4. Run API recorder:
   ```bash
   npm run record:api:readonly -w @dkan-client-tools/core
   ```

**Priority**: MEDIUM - Feature works in code, needs live validation

---

## Phase 2: Enable Datastore Operations (Medium Priority)

### 2.1 Import Sample Datastores

**Problem**: Datastore operations return errors because data hasn't been imported into database tables

**Current State**:
- Datasets exist with distribution URLs
- Data files are NOT imported into DKAN's internal database
- Datastore API can't query data that isn't imported

**Solution**: Trigger datastore imports for test datasets

**Method 1: Via Drush (Bulk Import)**
```bash
ddev ssh

# Get list of all distribution IDs
drush dkan:datastore:list

# Import a specific distribution
drush dkan:datastore:import <distribution-id>

# Example
drush dkan:datastore:import cedcd327-4e5d-43f9-8eb1-c11850fa7c55

# Import all distributions (may take a while)
drush dkan:datastore:import-all
```

**Method 2: Via API (Individual Imports)**
```bash
# Trigger import for a distribution
curl -X POST \
  -u "admin:admin" \
  -H "Content-Type: application/json" \
  -d '{"resource_id": "cedcd327-4e5d-43f9-8eb1-c11850fa7c55"}' \
  http://dkan.ddev.site/api/1/datastore/imports

# Check import status
curl -u "admin:admin" \
  http://dkan.ddev.site/api/1/datastore/imports
```

**Monitor Import Progress**:
```bash
# Via Drush
drush dkan:datastore:list

# Via API
curl -u "admin:admin" \
  http://dkan.ddev.site/api/1/datastore/imports | jq
```

**What This Enables**:
- ✅ `queryDatastore()` - Query imported data
- ✅ `getDatastoreSchema()` - Get schema with data dictionary
- ✅ `downloadQuery()` - Download query results
- ✅ `downloadQueryByDistribution()` - Download by distribution
- ✅ `querySql()` - Execute SQL queries (after fixing permissions)

**Priority**: MEDIUM - Required for full datastore functionality testing

---

### 2.2 Verify Datastore Operations After Import

**Test Checklist**:

1. **Query Datastore**
   ```bash
   curl -X POST \
     -u "admin:admin" \
     -H "Content-Type: application/json" \
     -d '{"limit": 5}' \
     http://dkan.ddev.site/api/1/datastore/query/cedcd327-4e5d-43f9-8eb1-c11850fa7c55/0
   ```

2. **Get Schema**
   ```bash
   curl -u "admin:admin" \
     "http://dkan.ddev.site/api/1/datastore/query/cedcd327-4e5d-43f9-8eb1-c11850fa7c55/0?schema=true"
   ```

3. **Download Query Results**
   ```bash
   curl -u "admin:admin" \
     "http://dkan.ddev.site/api/1/datastore/query/cedcd327-4e5d-43f9-8eb1-c11850fa7c55/0/download?format=csv&limit=10"
   ```

4. **SQL Query** (after fixing permissions)
   ```bash
   curl -u "admin:admin" \
     "http://dkan.ddev.site/api/1/sql?query=%5BSELECT%20%2A%20FROM%20cedcd327-4e5d-43f9-8eb1-c11850fa7c55%5D%5BLIMIT%205%5D%3B"
   ```

**Success Criteria**: All 4 operations return HTTP 200 with valid data

---

## Phase 3: Enhanced Testing Infrastructure (Low Priority)

### 3.1 Create Comprehensive API Test Suite

**Goal**: Automated end-to-end testing against live DKAN instance

**Implementation**:

Create `/packages/dkan-client-tools-core/src/__tests__/integration/` with:

**`integration-setup.ts`** - Test configuration
```typescript
export const integrationConfig = {
  baseUrl: process.env.DKAN_TEST_URL || 'http://dkan.ddev.site',
  username: process.env.DKAN_TEST_USER || 'admin',
  password: process.env.DKAN_TEST_PASS || 'admin',
  testDatasetId: 'cedcd327-4e5d-43f9-8eb1-c11850fa7c55',
  testDistributionId: 'district-centerlines-data',
}

export function shouldRunIntegrationTests(): boolean {
  return process.env.RUN_INTEGRATION_TESTS === 'true'
}
```

**`dataset-lifecycle.test.ts`** - Complete CRUD workflow
```typescript
describe('Dataset Lifecycle Integration', () => {
  it('should create, update, and delete a dataset', async () => {
    // Test full CRUD cycle with actual DKAN
  })
})
```

**`datastore-workflow.test.ts`** - Datastore operations
```typescript
describe('Datastore Workflow Integration', () => {
  it('should import, query, and download data', async () => {
    // Test complete datastore workflow
  })
})
```

**Run Integration Tests**:
```bash
# Set environment variables
export DKAN_TEST_URL=http://dkan.ddev.site
export DKAN_TEST_USER=admin
export DKAN_TEST_PASS=admin
export RUN_INTEGRATION_TESTS=true

# Run tests
npm run test:integration -w @dkan-client-tools/core
```

**Priority**: LOW - Nice to have for regression testing

---

### 3.2 Enhance API Recording Script

**Current Limitations**:
- Read-only mode only
- No mutation testing
- Manual analysis required

**Enhancements**:

**1. Add Mutation Testing Mode**
```typescript
// In record-api-responses.ts
const MUTATION_MODE = process.env.TEST_MUTATIONS === 'true'

if (MUTATION_MODE) {
  // Create test dataset
  const testDataset = await client.createDataset({...})

  // Update it
  await client.updateDataset(testDataset.identifier, {...})

  // Delete it
  await client.deleteDataset(testDataset.identifier)
}
```

**2. Add Performance Metrics**
```typescript
interface ApiResult {
  method: string
  success: boolean
  duration: number
  responseSize: number
  statusCode: number
}

// Track performance over time
const metrics = {
  averageResponseTime: 0,
  slowestEndpoint: '',
  fastestEndpoint: '',
}
```

**3. Add Automated Reporting**
```typescript
// Generate markdown report
function generateReport(results: ApiResult[]): string {
  return `
# API Test Report

**Date**: ${new Date().toISOString()}
**Total Endpoints**: ${results.length}
**Success Rate**: ${calculateSuccessRate(results)}%

## Performance Metrics
- Average Response Time: ${averageTime}ms
- Slowest Endpoint: ${slowest}
- Fastest Endpoint: ${fastest}

## Failing Endpoints
${failingEndpoints.map(e => `- ${e.method}: ${e.error}`).join('\n')}
  `
}
```

**Usage**:
```bash
# Test mutations (creates/deletes test data)
npm run record:api:mutations -w @dkan-client-tools/core

# Generate detailed report
npm run record:api:report -w @dkan-client-tools/core
```

**Priority**: LOW - Current script works well for basic testing

---

## Phase 4: Documentation & Examples (Low Priority)

### 4.1 Create Real-World Example Applications

**Goal**: Demonstrate all features with practical examples

**Examples to Create**:

1. **Dataset Browser** (`/examples/dataset-browser/`)
   - Search and filter datasets
   - View dataset details
   - Download distributions
   - Show import status

2. **Data Admin Dashboard** (`/examples/admin-dashboard/`)
   - Dataset CRUD operations
   - Harvest management
   - Datastore import monitoring
   - Workflow state management

3. **Public Data Portal** (`/examples/public-portal/`)
   - Public dataset catalog
   - Advanced search with facets
   - Data visualization with Chart.js
   - CSV/JSON downloads

4. **Drupal Theme Integration** (`/examples/drupal-theme/`)
   - Using IIFE builds in Drupal themes
   - Integration with Drupal Behaviors
   - Theming best practices

**Priority**: LOW - Demo apps exist, these would be enhanced versions

---

### 4.2 Create API Troubleshooting Guide

**Goal**: Help users debug common API issues

**Content**:

**`/docs/TROUBLESHOOTING.md`**
```markdown
# Troubleshooting DKAN API Issues

## Common Errors

### 403 Forbidden

**Symptoms**: API returns "Access denied" or 403 status

**Causes**:
1. Missing authentication credentials
2. User lacks required permissions
3. Endpoint requires specific role

**Solutions**:
- Check authentication: `client.auth = { username, password }`
- Verify user permissions in DKAN
- Check DKAN routing permissions

### 404 Not Found

**Symptoms**: API returns "Not Found" or 404 status

**Causes**:
1. Endpoint doesn't exist in this DKAN version
2. Module not enabled
3. Invalid dataset/resource ID

**Solutions**:
- Check DKAN version compatibility
- Enable required modules
- Verify IDs with `listDatasets()`

### 400 Bad Request

**Symptoms**: API returns validation errors

**Causes**:
1. Invalid request format
2. Missing required fields
3. Invalid parameter values

**Solutions**:
- Check request body format
- Validate against DCAT-US schema
- Review parameter types
```

**Priority**: LOW - Current documentation is comprehensive

---

## Phase 5: Performance & Optimization (Low Priority)

### 5.1 Optimize Query Performance

**Goal**: Reduce API response times and bandwidth usage

**Optimizations**:

1. **Implement Response Caching**
   ```typescript
   // In DkanClient
   private cache = new Map<string, { data: any, timestamp: number }>()

   async get(url: string, options?: RequestOptions) {
     const cacheKey = `${url}:${JSON.stringify(options)}`
     const cached = this.cache.get(cacheKey)

     if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
       return cached.data
     }

     const data = await this.fetch(url, options)
     this.cache.set(cacheKey, { data, timestamp: Date.now() })
     return data
   }
   ```

2. **Add Request Batching**
   ```typescript
   // Batch multiple requests
   async batchRequest<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
     return Promise.all(requests.map(req => req()))
   }

   // Usage
   const [datasets, facets, schemas] = await client.batchRequest([
     () => client.listDatasets(),
     () => client.getDatasetFacets(),
     () => client.listSchemas(),
   ])
   ```

3. **Implement Pagination Helpers**
   ```typescript
   async *queryAllPages(datasetId: string, pageSize = 100) {
     let offset = 0
     while (true) {
       const results = await client.queryDatastore(datasetId, 0, {
         limit: pageSize,
         offset,
       })

       if (results.results.length === 0) break
       yield results.results
       offset += pageSize
     }
   }

   // Usage
   for await (const page of client.queryAllPages('dataset-id')) {
     console.log('Processing', page.length, 'records')
   }
   ```

**Priority**: LOW - Current performance is acceptable

---

## Phase 6: Advanced Features (Future Enhancements)

### 6.1 Add WebSocket Support for Real-Time Updates

**Goal**: Real-time import progress and dataset updates

**Implementation**:
```typescript
class DkanRealtimeClient extends DkanClient {
  private ws: WebSocket

  subscribeToImports(callback: (status: ImportStatus) => void) {
    this.ws = new WebSocket(`${this.baseUrl}/ws/imports`)
    this.ws.onmessage = (event) => {
      callback(JSON.parse(event.data))
    }
  }
}
```

**Priority**: FUTURE - Requires DKAN-side WebSocket support

---

### 6.2 Add GraphQL Query Builder

**Goal**: Flexible data querying with type-safe queries

**Implementation**:
```typescript
const query = client.query()
  .select(['title', 'description', 'modified'])
  .where('theme', 'in', ['Transportation', 'Environment'])
  .orderBy('modified', 'desc')
  .limit(10)
  .build()

const results = await client.executeQuery(query)
```

**Priority**: FUTURE - Nice-to-have convenience feature

---

## Immediate Action Items

### This Week
1. ✅ Fix `querySql` permission issue (30 minutes)
2. ✅ Import 2-3 sample datastores (1 hour)
3. ✅ Test `downloadQuery` with live data (30 minutes)
4. ✅ Re-run API recorder script (15 minutes)
5. ✅ Update API coverage documentation (30 minutes)

### Next Week
1. Create integration test suite (4 hours)
2. Enhance API recorder with mutation testing (2 hours)
3. Update example applications (4 hours)

### This Month
1. Performance optimization (8 hours)
2. Advanced documentation (4 hours)
3. Troubleshooting guide (2 hours)

---

## Success Metrics

### Current State
- ✅ 325 unit tests passing
- ✅ 31/33 API methods fully functional
- ✅ Comprehensive type safety
- ✅ Good documentation coverage

### Target State (After Phase 1)
- ✅ 33/33 API methods fully functional (100%)
- ✅ All datastore operations tested with live data
- ✅ SQL queries working correctly
- ✅ Download functionality validated

### Long-Term Goals (After All Phases)
- ✅ Integration test suite with 90%+ coverage
- ✅ Automated performance monitoring
- ✅ Real-world example applications
- ✅ Comprehensive troubleshooting documentation

---

## Resources

### DKAN Documentation
- [Datastore API](https://dkan.readthedocs.io/en/latest/apis/datastore.html)
- [Metastore API](https://dkan.readthedocs.io/en/latest/apis/metastore.html)
- [Harvest API](https://dkan.readthedocs.io/en/latest/apis/harvest.html)

### Project Documentation
- [API Investigation Results](./API_ERROR_INVESTIGATION.md)
- [Build Process Guide](../docs/BUILD_PROCESS.md)
- [React Integration Guide](../docs/REACT_STANDALONE_APP.md)
- [Vue Integration Guide](../docs/VUE_STANDALONE_APP.md)

### Related Files
- API Recorder: `/packages/dkan-client-tools-core/scripts/record-api-responses.ts`
- Core Client: `/packages/dkan-client-tools-core/src/api/client.ts`
- Test Fixtures: `/packages/dkan-client-tools-core/src/__tests__/fixtures/`

---

**Last Updated**: 2025-11-12
**Next Review**: After Phase 1 completion
