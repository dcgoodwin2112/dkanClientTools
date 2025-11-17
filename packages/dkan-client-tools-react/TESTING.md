# Testing Guide - @dkan-client-tools/react

This document provides information about the testing setup and patterns used in the `@dkan-client-tools/react` package.

## Test Setup

**Framework**: Vitest, @testing-library/react, happy-dom

**Configuration** (`vitest.config.ts`):
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
```

**Global Setup** (`setup.ts`):
```typescript
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
```

## Running Tests

```bash
npm test                  # Run once
npm run test:watch        # Watch mode
npx vitest --ui          # With UI
npx vitest --coverage    # With coverage
```

## Test Patterns

### Basic Pattern

```typescript
describe('useDataset', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 }, // Important: disable retries
    })
  })

  it('fetches dataset', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue(mockData)

    function TestComponent() {
      const { data, isLoading } = useDataset({ identifier: 'test-123' })
      if (isLoading) return <div>Loading...</div>
      return <div>Title: {data.title}</div>
    }

    render(
      <DkanClientProvider client={mockClient}>
        <TestComponent />
      </DkanClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Title: Test Dataset')).toBeInTheDocument()
    })
  })
})
```

### User Interactions

```typescript
const user = userEvent.setup()
render(<DkanClientProvider client={mockClient}><TestComponent /></DkanClientProvider>)
await user.click(screen.getByText('Load Dataset'))
await waitFor(() => expect(screen.getByText('Data loaded')).toBeInTheDocument())
```

### Error Handling

```typescript
vi.spyOn(mockClient, 'fetchDataset').mockRejectedValue(new Error('Network error'))
await waitFor(() => expect(screen.getByText('Error: Network error')).toBeInTheDocument())
```

## Test Coverage

**181 tests across 13 test files:**

- DkanClientProvider: 10 tests
- Dataset hooks: 47 tests (useDataset, useDatasetSearch, mutations)
- Datastore hooks: 35 tests (useDatastore, useSqlQuery, imports)
- Data Dictionary hooks: 42 tests (queries, mutations)
- Harvest hooks: 11 tests
- Metastore hooks: 16 tests
- Revisions hooks: 10 tests
- Download hooks: 8 tests

All tests cover loading states, error handling, success cases, mutations, callbacks, and edge cases.

## Common Issues

**Tests timeout on errors**: Set `retry: 0` in DkanClient options
**"Cannot read 'click'"**: Use `userEvent.setup()` before `render()`
**Components persist between tests**: Add cleanup to `setup.ts`

## Best Practices

1. Wrap components in DkanClientProvider
2. Disable retries: `defaultOptions: { retry: 0 }`
3. Use `waitFor` for async assertions
4. Use `userEvent.setup()` before rendering
5. Test loading, success, and error states
6. Test cache behavior and conditional fetching

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library User Events](https://testing-library.com/docs/user-event/intro)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
