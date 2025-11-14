# Testing Guide - @dkan-client-tools/core

## Test Suite Overview

The `@dkan-client-tools/core` package has comprehensive test coverage including both unit tests and integration tests.

### Test Statistics

- **Total Tests:** 225
- **Test Files:** 18
- **Test Coverage:** Comprehensive coverage of all public APIs, integration scenarios, and edge cases
- **Testing Framework:** Vitest with happy-dom

### Test Structure

```
src/__tests__/
├── types.test.ts                                    # Type utilities (6 tests)
├── api/                                             # API client unit tests (187 tests)
│   ├── client.test.ts                               # HTTP client core (18 tests)
│   ├── dataset.test.ts                              # Dataset operations (16 tests)
│   ├── edge-cases.test.ts                           # Edge cases & boundaries (35 tests)
│   ├── datastore-query.test.ts                      # Query operations (14 tests)
│   ├── data-dictionary.test.ts                      # Dictionary ops (12 tests)
│   ├── metastore.test.ts                            # Metastore ops (12 tests)
│   ├── harvest.test.ts                              # Harvest ops (6 tests)
│   ├── datastore-download.test.ts                   # Downloads (4 tests)
│   ├── revisions.test.ts                            # Revisions (4 tests)
│   ├── datastore-imports.test.ts                    # Imports (4 tests)
│   └── sql-query.test.ts                            # SQL queries (3 tests)
├── client/
│   └── dkanClient.test.ts                           # DkanClient coordinator (21 tests)
├── integration/                                     # Integration tests (38 tests)
│   ├── dataset.integration.test.ts                  # Dataset integration (17 tests)
│   ├── data-dictionary.integration.test.ts          # Dictionary integration (12 tests)
│   ├── metastore.integration.test.ts                # Metastore integration (10 tests)
│   └── fixture-stability.test.ts                    # Fixture validation (11 tests)
└── scripts/
    └── csv-parsing.test.ts                          # CSV parsing utilities (20 tests)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage (requires @vitest/coverage-v8)
npm test -- --coverage

# Run specific test file
npm test -- src/__tests__/api/client.test.ts

# Run integration tests only
npm test -- src/__tests__/integration
```

## Test Coverage

### 1. Unit Tests (187 tests)

#### DkanApiClient (`api/client.test.ts` - 18 tests)

Tests for HTTP API client core functionality:

**Constructor & Configuration:**
- Basic client creation
- Trailing slash handling in baseUrl
- Custom default options
- Token authentication
- Basic authentication (username/password)

**Dataset Operations:**
- Fetch single dataset by identifier
- Bearer token authorization header
- Basic auth authorization header
- HTTP error handling (404, etc.)

**Search Operations:**
- Search with no filters
- Search with keyword filter
- Search with multiple filters (pagination, sorting)
- Results object → array transformation
- Total count parsing (string to number)

**Datastore Queries:**
- POST request with query options
- Complex query conditions, filters, sorts

**Retry Logic:**
- Retry on network failures with backoff
- Max retries handling
- No retry on HTTP errors (404, etc.)

#### Dataset Operations (`api/dataset.test.ts` - 16 tests)

- Get single dataset
- Search datasets with filters
- List all datasets
- Create dataset (POST)
- Update dataset (PUT)
- Patch dataset (PATCH)
- Delete dataset (DELETE)
- Error handling for all operations

#### Datastore Query (`api/datastore-query.test.ts` - 14 tests)

- Query datastore with filters
- Complex conditions and operators
- Sorting and pagination
- Multi-resource queries
- GET/POST method switching
- Schema retrieval

#### Data Dictionary (`api/data-dictionary.test.ts` - 12 tests)

- Get dictionary by dataset/index
- Get dictionary from URL
- List all dictionaries
- Get datastore schema
- Create dictionary
- Update dictionary
- Delete dictionary

#### Metastore (`api/metastore.test.ts` - 12 tests)

- List schemas
- Get schema items
- Get dataset facets
- Get schema definition
- OpenAPI documentation

#### Edge Cases (`api/edge-cases.test.ts` - 35 tests)

Tests for edge cases and boundary conditions:

**Large Pagination:**
- Very large offset values (page 1000+)
- Offset beyond available results
- Maximum page size (1000+)
- Datastore queries with large limits (10,000+)
- Offset exceeding available rows

**Unicode and Special Characters:**
- Unicode in dataset identifiers (Chinese, emojis)
- Unicode in search queries (French, Japanese, Arabic, Greek, Russian)
- Special characters in datastore queries (apostrophes, ampersands)
- Unicode in dataset titles and descriptions
- Emoji support in metadata

**Malformed Responses:**
- Malformed JSON in error responses
- Empty response bodies
- Missing required fields
- Unexpected JSON structure
- JSON parsing errors
- Partial JSON responses

**Empty and Null Values:**
- Empty string identifiers
- Null values in dataset fields
- Empty search results
- Empty condition arrays
- Undefined optional parameters

**Network and Timeout:**
- Network timeout scenarios
- Connection refused errors
- DNS resolution failures
- Abort signals

**Boundary Values:**
- Zero as page size
- Negative offsets (API rejection)
- Very long identifiers (500+ chars)
- Very long search queries
- Maximum safe integer values

**Special Query Conditions:**
- Wildcard characters with LIKE operator
- Regex patterns with match operator
- Multiple conditions with different operators
- Multi-field sorting edge cases

#### Other API Tests

- Harvest operations (6 tests)
- Datastore downloads (4 tests)
- Revisions/moderation (4 tests)
- Datastore imports (4 tests)
- SQL queries (3 tests)

#### DkanClient (`client/dkanClient.test.ts` - 21 tests)

Tests for main client coordinator:

**Constructor & Setup:**
- Basic client creation
- Custom QueryClient injection
- QueryClient with default options
- Sensible defaults when no options provided

**Mount/Unmount:**
- Mount count tracking
- Single QueryClient mount on first component
- Unmount only when count reaches zero
- isMounted() status checking

**API Delegation:**
- fetchDataset delegation to API client
- searchDatasets delegation with options
- queryDatastore delegation with parameters

**Query Cache Operations:**
- Prefetch queries
- Get cached query data
- Set query data manually
- Invalidate queries
- Clear all caches
- Remove specific queries
- Access query cache

**Integration:**
- End-to-end with real QueryClient
- Multiple concurrent operations
- Error propagation from API client

#### Type Utilities (`types.test.ts` - 6 tests)

Tests for the custom error class:
- Error creation with message only
- Error with status code
- Error with status code and response data
- Prototype chain verification
- Error catching and instanceof checks
- Stack trace preservation

### 2. Integration Tests (38 tests)

Integration tests use real API responses recorded from a live DKAN 2.21.2 instance as fixtures.

#### Dataset Integration (`dataset.integration.test.ts` - 17 tests)

- Validates fixture structure against DCAT-US schema
- Tests all dataset operations with real responses
- Verifies pagination and search filters
- Validates error responses

#### Data Dictionary Integration (`data-dictionary.integration.test.ts` - 12 tests)

- Validates Frictionless table schema compliance
- Tests dictionary operations with real data
- Verifies field definitions and constraints

#### Metastore Integration (`metastore.integration.test.ts` - 10 tests)

- Validates schema definitions
- Tests facet responses
- Verifies OpenAPI documentation structure

#### Fixture Stability (`fixture-stability.test.ts` - 11 tests)

- Monitors fixture age (warns if > 30 days old)
- Validates fixture structure consistency
- Ensures DCAT-US schema compliance
- Tracks API coverage (35/38 methods have fixtures = 92%)

**Fixture Coverage:**
- 35 out of 38 API methods have recorded fixtures
- Fixtures include success and error scenarios
- Real data from DKAN 2.21.2 instance
- Located in `src/__tests__/fixtures/`

## Mock Strategy

### Fetch Mocking

All unit tests use mocked `fetch` to avoid real network requests:

```typescript
const mockFetch = vi.fn()
global.fetch = mockFetch as any

// In tests
mockFetch.mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: async () => ({ data: 'test' }),
})
```

### API Client Mocking

DkanClient tests mock the API client to test coordination logic:

```typescript
vi.mock('../../api/client')
vi.mocked(DkanApiClient.prototype.getDataset).mockResolvedValue(mockData)
```

### Integration Test Fixtures

Integration tests use real API responses stored as JSON fixtures:

```typescript
import datasetFixtures from './fixtures/dataset-operations.json'

const getDatasetResponse = datasetFixtures.find(f => f.method === 'getDataset')
expect(actualResponse).toMatchObject(getDatasetResponse.response)
```

## Test Patterns

### Testing Async Operations

```typescript
it('should fetch dataset', async () => {
  mockFetch.mockResolvedValueOnce({ /* response */ })

  const result = await client.getDataset('test-id')

  expect(result).toEqual(expectedData)
})
```

### Testing Error Handling

```typescript
it('should throw DkanApiError', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    text: async () => 'Not found',
  })

  await expect(client.getDataset('invalid')).rejects.toThrow(DkanApiError)
})
```

### Testing Retry Logic with Fake Timers

```typescript
it('should retry on failure', async () => {
  vi.useFakeTimers()

  mockFetch
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({ ok: true, /* ... */ })

  const promise = client.getDataset('test')
  await vi.advanceTimersByTimeAsync(1000)

  const result = await promise
  expect(mockFetch).toHaveBeenCalledTimes(2)

  vi.useRealTimers()
})
```

### Testing with Fixtures

```typescript
import fixtures from './fixtures/dataset-operations.json'

it('should match real API response structure', () => {
  const fixture = fixtures.find(f => f.method === 'getDataset')

  expect(fixture.response).toMatchObject({
    identifier: expect.any(String),
    title: expect.any(String),
    '@type': 'dcat:Dataset'
  })
})
```

## Known Limitations

### Async Timer Warnings

The retry logic tests may produce "Unhandled Rejection" warnings due to pending timers. This is a known testing limitation and does not affect actual functionality:

```
⎯⎯⎯⎯ Unhandled Rejection ⎯⎯⎯⎯⎯
DkanApiError: Network error
```

This warning appears because vitest's fake timers create pending promises during retry delays. The actual retry logic works correctly in production.

## Adding New Tests

When adding new functionality, follow these guidelines:

1. **Create tests first** (TDD approach recommended)
2. **Use descriptive test names** that explain what is being tested
3. **Group related tests** using `describe` blocks
4. **Mock external dependencies** (fetch, other clients)
5. **Test both success and error cases**
6. **Clean up mocks** in `beforeEach`/`afterEach`
7. **Consider adding integration tests** with real API fixtures

### Example Test Template

```typescript
describe('NewFeature', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should handle success case', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({ /* mock data */ })
    const client = new DkanClient({ baseUrl: 'https://example.com' })

    // Act
    const result = await client.newFeature()

    // Assert
    expect(result).toEqual(expectedValue)
    expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expectedOptions)
  })

  it('should handle error case', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed'))
    const client = new DkanClient({ baseUrl: 'https://example.com' })

    await expect(client.newFeature()).rejects.toThrow('Failed')
  })
})
```

## Recording API Fixtures

To update or add new fixtures from a live DKAN instance:

```bash
# Record from local DKAN instance (read-only mode)
npm run record:api:readonly

# Record with authentication for protected endpoints
DKAN_URL=http://dkan.ddev.site \
DKAN_USER=admin \
DKAN_PASS=admin \
npm run record:api:readonly
```

See the main README.md for complete fixture recording documentation.

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm test -- --coverage --reporter=json
```

## Dependencies

- `vitest`: Test runner
- `happy-dom`: DOM environment for testing
- `@vitest/ui`: Optional UI for test visualization
- `@vitest/coverage-v8`: Code coverage reporting

Install test dependencies:

```bash
npm install -D vitest happy-dom @vitest/ui @vitest/coverage-v8
```

## Troubleshooting

### Tests Timeout

If tests timeout, increase the timeout in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  },
})
```

### Mock Not Resetting

Always call `mockFetch.mockReset()` in `beforeEach`:

```typescript
beforeEach(() => {
  mockFetch.mockReset()
})
```

### Type Errors in Tests

Ensure TypeScript includes test files:

```json
// tsconfig.json
{
  "include": ["src/**/*", "src/**/*.test.ts"]
}
```

### Integration Test Fixtures Out of Date

If fixture stability tests warn about old fixtures, re-record them:

```bash
npm run record:api:readonly
```

## Test Coverage Goals

Current coverage thresholds (enforced in CI):

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Future Improvements

Potential test enhancements:

- Add performance benchmarks for large dataset queries
- Add mutation testing with Stryker
- Expand edge case coverage (very large pagination, Unicode, etc.)
- Add E2E tests with Playwright against live DKAN instance
- Improve fixture auto-refresh workflow

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [TanStack Query Testing Guide](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
