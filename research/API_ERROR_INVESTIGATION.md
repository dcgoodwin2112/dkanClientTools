# API Error Investigation

**Date**: 2025-11-12
**DKAN Version**: 2.21.2
**Drupal Version**: 10.3.14

## Objective

Investigate the 4 API errors encountered during API response recording to determine:
1. Whether the APIs exist in DKAN 2.21.2
2. What the actual issues are (permissions, implementation bugs, or missing features)
3. Whether we should remove non-functional APIs or fix implementation issues

---

## Errors Investigated

### 1. `querySql` - HTTP 403 Forbidden → HTTP 400 Invalid Query

**Endpoint**: `/api/1/datastore/sql`
**Method**: POST
**Initial Error**: HTTP 403 Forbidden
**Actual Error**: HTTP 400 Bad Request (Invalid query string)

#### Investigation Results

**✅ Endpoint EXISTS** in `datastore.routing.yml`:
```yaml
datastore.sql_endpoint.post.api:
  path: '/api/1/datastore/sql'
  methods: [POST]
  defaults:
    _controller: '\Drupal\datastore\SqlEndpoint\WebServiceApi::runQueryPost'
  requirements:
    _access: 'TRUE'  # Always accessible, no auth required
```

**Root Cause**: DKAN uses a custom SQL syntax with brackets, not standard SQL:

**Standard SQL** (doesn't work):
```sql
SELECT * FROM cedcd327_4e5d_43f9_8eb1_c11850fa7c55__0 LIMIT 5
```

**DKAN SQL** (correct syntax):
```sql
[SELECT * FROM {distribution_id}][WHERE condition][ORDER BY field][LIMIT n];
```

**Example from DKAN tests**:
```sql
[SELECT * FROM 123__456][WHERE abc = "blah"][ORDER BY abc DESC][LIMIT 1 OFFSET 3];
```

**Additional Issue**: DKAN sample datasets don't have distribution identifiers assigned, so even with correct SQL syntax, queries fail with:
```json
{
  "message": "Error retrieving metadata: distribution {id} not found.",
  "status": 400
}
```

#### Resolution

**Status**: ⚠️ **Partially Working** - API exists but has limitations

**Problems**:
1. **Custom SQL Syntax**: Requires bracket notation `[SELECT...]` not documented in our client tools
2. **Missing Distribution IDs**: Sample content datasets lack distribution identifiers required for SQL queries
3. **Client Implementation**: Our `querySql()` method sends standard SQL syntax, not DKAN's bracket syntax

**Recommendation**:
- Update `DkanApiClient.querySql()` to document the custom bracket syntax requirement
- Update TypeScript types to reflect the bracket syntax
- Note in documentation that distribution identifiers must be assigned to datasets for SQL queries to work

---

### 2. `downloadQuery` - HTTP 400 Bad Request

**Endpoint**: `/api/1/datastore/query/{identifier}/{index}/download`
**Method**: POST (in our implementation)
**Error**: HTTP 400 Bad Request

#### Investigation Results

**✅ Endpoint EXISTS** and **✅ Works via GET**:

```bash
# GET request works perfectly
curl "http://dkan.ddev.site/api/1/datastore/query/cedcd327-4e5d-43f9-8eb1-c11850fa7c55/0/download?limit=5&format=csv"
# Returns CSV data successfully
```

**Routing configuration**:
```yaml
datastore.1.query.id.download:
  path: '/api/1/datastore/query/{identifier}/download'
  methods: [GET, POST]  # Supports both methods
  defaults:
    _controller: '\Drupal\datastore\Controller\QueryDownloadController::queryResource'
  requirements:
    _permission: 'access content'
```

**Root Cause**: When using POST with query options in the body, DKAN appears to default to JSON response format, which triggers an error:

```json
{
  "message": "Streaming not currently available for JSON responses",
  "status": 400
}
```

#### Resolution

**Status**: 🐛 **Client Implementation Bug**

**Problem**: Our `downloadQuery()` method uses POST with JSON body, but DKAN's download controller doesn't properly handle format parameter when POST body is present.

**Fix Required**: Change `downloadQuery()` implementation in `src/api/client.ts` from POST to GET:

```typescript
// Current (broken):
const response = await fetch(url, {
  method: 'POST',
  headers,
  body: JSON.stringify(queryOptions),
})

// Should be:
const queryString = new URLSearchParams({
  format,
  ...Object.fromEntries(
    Object.entries(queryOptions).map(([k, v]) => [k, String(v)])
  )
}).toString()

const response = await fetch(`${url}?${queryString}`, {
  method: 'GET',
  headers,
})
```

**Recommendation**: Fix the implementation to use GET method instead of POST

---

### 3. `getDatastoreStatistics` - HTTP 404 Not Found

**Endpoint**: `/api/1/datastore/imports/{identifier}/statistics` (expected)
**Error**: HTTP 404 Not Found

#### Investigation Results

**❌ Endpoint DOES NOT EXIST** in DKAN 2.21.2

Searched all routing files in DKAN:
```bash
grep -r "statistics" dkan/docroot/modules/contrib/dkan/*/datastore.routing.yml
# No results
```

No controller or API endpoint for datastore statistics exists in the codebase.

#### Resolution

**Status**: ❌ **API Does Not Exist**

**Recommendation**: Remove `getDatastoreStatistics()` method from DkanApiClient along with:
- React hook: `useDatastoreStatistics`
- Vue composable: `useDatastoreStatistics`
- Type: `DatastoreStatistics`
- Tests for this functionality

---

### 4. `getOpenApiSpec` - HTTP 404 Not Found

**Endpoint**: `/api/1/spec` (expected)
**Error**: HTTP 404 Not Found

#### Investigation Results

**❌ Endpoint DOES NOT EXIST** in DKAN 2.21.2

Searched all routing files in DKAN:
```bash
find dkan/docroot/modules/contrib/dkan -name "*.routing.yml" -exec grep -l "spec\|openapi" {} \;
# No results
```

No OpenAPI specification generation endpoint exists in DKAN 2.21.2. The only OpenAPI-related functionality is:
- `getOpenApiDocsUrl()` - Returns the URL `/api/1/docs` (just a URL, not an API call)

#### Resolution

**Status**: ❌ **API Does Not Exist**

**Recommendation**: Remove `getOpenApiSpec()` method from DkanApiClient along with:
- React hook for OpenAPI spec
- Vue composable for OpenAPI spec
- Tests for this functionality

**Note**: Keep `getOpenApiDocsUrl()` as it just returns a documentation URL string.

---

## Summary of Findings

| API Method | Status | Issue | Action Required |
|------------|--------|-------|----------------|
| `querySql` | ⚠️ Partially Working | Custom bracket SQL syntax + missing distribution IDs | Document syntax, update types |
| `downloadQuery` | 🐛 Implementation Bug | Using POST instead of GET | Fix to use GET method |
| `getDatastoreStatistics` | ❌ Does Not Exist | API never existed in DKAN 2.21.2 | Remove from all packages |
| `getOpenApiSpec` | ❌ Does Not Exist | API never existed in DKAN 2.21.2 | Remove from all packages |

---

## Recommended Actions

### High Priority (Bugs to Fix)

1. **Fix `downloadQuery()` method** (`src/api/client.ts`):
   - Change from POST to GET
   - Build query string from options
   - Test with CSV and JSON formats

### Medium Priority (Missing Features to Remove)

2. **Remove `getDatastoreStatistics()`** from:
   - `@dkan-client-tools/core`: method + type
   - `@dkan-client-tools/react`: hook + test
   - `@dkan-client-tools/vue`: composable + test

3. **Remove `getOpenApiSpec()`** from:
   - `@dkan-client-tools/core`: method
   - `@dkan-client-tools/react`: hook + test
   - `@dkan-client-tools/vue`: composable + test

### Low Priority (Documentation)

4. **Document `querySql()` limitations**:
   - Add JSDoc noting custom bracket SQL syntax
   - Document that distribution identifiers are required
   - Provide example queries in documentation
   - Consider adding a helper method to build bracket-syntax queries

---

## Technical Details

### DKAN SQL Syntax Parser

DKAN uses a custom SQL parser (`SqlParser.php`) that expects:
- Bracket-delimited clauses: `[SELECT...]`, `[WHERE...]`, etc.
- Identifier extraction from table names without `__` separators
- Distribution UUIDs as table names (not dataset IDs)

### Distribution Identifier Issue

Sample datasets created via `dkan:sample-content:create` have distributions without identifiers:
```json
{
  "@type": "dcat:Distribution",
  "downloadURL": "https://...",
  "mediaType": "text/csv",
  "format": "csv",
  "title": "Florida Bike Lanes"
  // ❌ No "identifier" field
}
```

This means SQL queries cannot reference these distributions even with correct syntax.

---

## Test Coverage Impact

**Current Test Stats** (after CKAN/Properties removal):
- Core: 77 tests
- React: 175 tests
- Vue: 83 tests
- **Total**: 335 tests

**After removing getDatastoreStatistics and getOpenApiSpec**:
- Core: ~73 tests (remove ~4 tests)
- React: ~173 tests (remove ~2 tests)
- Vue: ~82 tests (remove ~1 test)
- **New Total**: ~328 tests

**API Method Count**:
- Current: 35 methods
- After removal: **33 methods**

---

## References

- [FRESH_INSTALL_RESULTS.md](./FRESH_INSTALL_RESULTS.md) - Initial API testing results
- DKAN Source: `/dkan/docroot/modules/contrib/dkan/modules/datastore/`
  - `datastore.routing.yml` - All datastore API routes
  - `src/SqlEndpoint/WebServiceApi.php` - SQL endpoint implementation
  - `src/SqlEndpoint/DatastoreSqlEndpointService.php` - SQL query parsing
  - `tests/src/Unit/SqlParser/SqlParserTest.php` - SQL syntax examples
