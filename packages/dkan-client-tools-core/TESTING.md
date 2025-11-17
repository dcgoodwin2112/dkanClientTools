# Testing Guide - @dkan-client-tools/core

Comprehensive test coverage with 225 tests across 18 files using Vitest and happy-dom.

## Test Structure

- `types.test.ts` - Type utilities (6)
- `api/` - API client units (187): client, dataset, edge-cases, datastore-query, data-dictionary, metastore, harvest, downloads, revisions, imports, sql-query
- `client/dkanClient.test.ts` - DkanClient coordinator (21)
- `integration/` - Integration tests (38): dataset, data-dictionary, metastore, fixture-stability
- `scripts/csv-parsing.test.ts` - CSV parsing (20)

## Running Tests

```bash
npm test                                        # All tests
npm run test:watch                              # Watch mode
npm test -- --coverage                          # With coverage
npm test -- src/__tests__/api/client.test.ts   # Specific file
npm test -- src/__tests__/integration           # Integration only
```

## Test Coverage

**Unit Tests (187)**: API client core, dataset operations, datastore queries, data dictionaries, metastore, harvests, downloads, revisions, imports, SQL queries, DkanClient coordination, edge cases (Unicode, pagination, malformed data, network errors), retry logic, auth.

**Integration Tests (38)**: DCAT-US schema validation, Frictionless table schemas, OpenAPI docs, fixture stability monitoring. 35/38 API methods (92%) with real DKAN 2.21.2 responses.

## Mock Strategy

**Fetch**: Unit tests mock `fetch` to avoid network requests:
```typescript
global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: 'test' }) })
```

**API Client**: DkanClient tests mock API client for coordination logic:
```typescript
vi.mock('../../api/client')
vi.mocked(DkanApiClient.prototype.getDataset).mockResolvedValue(mockData)
```

**Fixtures**: Integration tests use real API responses from JSON fixtures:
```typescript
import fixtures from './fixtures/dataset-operations.json'
expect(response).toMatchObject(fixtures.find(f => f.method === 'getDataset').response)
```

## Test Patterns

```typescript
// Async operations
it('should fetch dataset', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => mockData })
  expect(await client.getDataset('id')).toEqual(mockData)
})

// Error handling
it('should throw DkanApiError', async () => {
  mockFetch.mockResolvedValue({ ok: false, status: 404 })
  await expect(client.getDataset('invalid')).rejects.toThrow(DkanApiError)
})

// Retry logic
it('should retry on failure', async () => {
  vi.useFakeTimers()
  mockFetch.mockRejectedValueOnce(new Error('Fail')).mockResolvedValue({ ok: true })
  const promise = client.getDataset('test')
  await vi.advanceTimersByTimeAsync(1000)
  expect(await promise).toBeDefined()
  vi.useRealTimers()
})
```

## Known Limitations

Retry logic tests may produce "Unhandled Rejection" warnings from vitest fake timers. This is expected and doesn't affect functionality.

## Adding New Tests

1. Create tests first (TDD)
2. Use descriptive test names
3. Group with `describe` blocks
4. Mock external dependencies
5. Test success and error cases
6. Clean up mocks in `beforeEach`
7. Add integration tests with fixtures

```typescript
describe('NewFeature', () => {
  beforeEach(() => mockFetch.mockReset())

  it('should handle success', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockData })
    expect(await client.newFeature()).toEqual(expectedValue)
  })

  it('should handle error', async () => {
    mockFetch.mockRejectedValue(new Error('Failed'))
    await expect(client.newFeature()).rejects.toThrow('Failed')
  })
})
```

## Dependencies

Test runner: `vitest`, `happy-dom`, `@vitest/ui` (optional), `@vitest/coverage-v8`

```bash
npm install -D vitest happy-dom @vitest/coverage-v8
```

## Troubleshooting

**Timeout**: Increase timeout in `vitest.config.ts`: `testTimeout: 10000`

**Mocks not resetting**: Call `mockFetch.mockReset()` in `beforeEach`

**Type errors**: Ensure tsconfig includes test files: `"include": ["src/**/*"]`

**Old fixtures**: Re-record with `npm run record:api:readonly`

## Coverage Goals

Thresholds: Statements 80%, Branches 75%, Functions 80%, Lines 80%

## Resources

- [Vitest](https://vitest.dev/)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
- [Fixtures Documentation](src/__tests__/fixtures/README.md)
