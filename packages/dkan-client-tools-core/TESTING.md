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

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `api/client.test.ts` | 18 | HTTP client core: config, auth, retry logic, request handling |
| `api/dataset.test.ts` | 16 | Dataset operations: get, search, list, create, update, patch, delete |
| `api/datastore-query.test.ts` | 14 | Datastore queries: filters, conditions, sorting, pagination, multi-resource |
| `api/data-dictionary.test.ts` | 12 | Data dictionary CRUD operations and schema retrieval |
| `api/metastore.test.ts` | 12 | Metastore schemas, facets, and OpenAPI documentation |
| `api/edge-cases.test.ts` | 35 | Large pagination, Unicode/special chars, malformed responses, network errors, boundary values |
| `api/harvest.test.ts` | 6 | Harvest plan and run operations |
| `api/datastore-downloads.test.ts` | 4 | CSV download operations |
| `api/revisions.test.ts` | 4 | Revision and moderation workflows |
| `api/datastore-imports.test.ts` | 4 | Datastore import operations |
| `api/sql-queries.test.ts` | 3 | SQL bracket syntax queries |
| `client/dkanClient.test.ts` | 21 | DkanClient coordinator: setup, mount/unmount, API delegation, cache operations |
| `types.test.ts` | 6 | DkanApiError class functionality |

**Key Coverage Areas**: Configuration and authentication, all DKAN API operations, error handling, retry logic with exponential backoff, edge cases (Unicode, pagination, malformed data, network failures), TanStack Query integration.

### 2. Integration Tests (38 tests)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `dataset.integration.test.ts` | 17 | DCAT-US schema validation with real API responses |
| `data-dictionary.integration.test.ts` | 12 | Frictionless table schema compliance |
| `metastore.integration.test.ts` | 10 | Schema definitions and OpenAPI docs |
| `fixture-stability.test.ts` | 11 | Fixture age monitoring and API coverage tracking |

**Fixture Coverage**: 35/38 API methods (92%) with real responses from DKAN 2.21.2 instance. See [Fixtures Documentation](src/__tests__/fixtures/README.md) for details.

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

### Async Operations

```typescript
it('should fetch dataset', async () => {
  mockFetch.mockResolvedValueOnce({ /* response */ })
  const result = await client.getDataset('test-id')
  expect(result).toEqual(expectedData)
})
```

### Error Handling

```typescript
it('should throw DkanApiError', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 404, text: async () => 'Not found' })
  await expect(client.getDataset('invalid')).rejects.toThrow(DkanApiError)
})
```

### Retry Logic with Fake Timers

```typescript
it('should retry on failure', async () => {
  vi.useFakeTimers()
  mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({ ok: true })

  const promise = client.getDataset('test')
  await vi.advanceTimersByTimeAsync(1000)

  expect(await promise).toBeDefined()
  expect(mockFetch).toHaveBeenCalledTimes(2)
  vi.useRealTimers()
})
```

### Fixture Validation

```typescript
import fixtures from './fixtures/dataset-operations.json'

it('should match real API structure', () => {
  const fixture = fixtures.find(f => f.method === 'getDataset')
  expect(fixture.response).toMatchObject({
    identifier: expect.any(String),
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

See [Fixtures Documentation](src/__tests__/fixtures/README.md) for complete recording instructions, cleanup procedures, and fixture usage.

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
