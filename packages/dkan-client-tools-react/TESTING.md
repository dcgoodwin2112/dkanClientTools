# Testing Guide - @dkan-client-tools/react

This document provides information about the testing setup and patterns used in the `@dkan-client-tools/react` package.

## Test Setup

### Framework

- **Vitest**: Test runner built on Vite's transform pipeline
- **Testing Library**: React testing utilities
  - `@testing-library/react`: Component rendering and queries
  - `@testing-library/jest-dom`: DOM matchers
  - `@testing-library/user-event`: User interaction simulation
- **happy-dom**: Lightweight DOM implementation for Node.js testing

### Configuration

The test setup is configured in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### Global Setup

The `setup.ts` file runs before all tests:

```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
```

This ensures:
- Components are cleaned up after each test
- All mocks are cleared between tests
- jest-dom matchers are available in all tests

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npx vitest --ui

# Run tests with coverage
npx vitest --coverage
```

## Test Patterns

### Testing React Components with Context

All hooks require the `DkanClientProvider` context. Tests follow this pattern:

```typescript
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
```

### Mocking DkanClient

Create a mock client in each test suite:

```typescript
describe('useDataset', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 }, // Disable retries for tests
    })
  })

  it('should fetch dataset', async () => {
    vi.spyOn(mockClient, 'fetchDataset').mockResolvedValue(mockData)
    // ... test implementation
  })
})
```

**Important**: Set `retry: 0` in the client options to disable TanStack Query's automatic retry behavior in tests.

### Testing User Interactions

Use `@testing-library/user-event` for simulating user interactions:

```typescript
import userEvent from '@testing-library/user-event'

it('should handle button click', async () => {
  const user = userEvent.setup()

  render(
    <DkanClientProvider client={mockClient}>
      <TestComponent />
    </DkanClientProvider>
  )

  const button = screen.getByText('Load Dataset')
  await user.click(button)

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

### Testing Async State

Use `waitFor` to test loading and success states:

```typescript
it('should show loading then data', async () => {
  render(
    <DkanClientProvider client={mockClient}>
      <TestComponent />
    </DkanClientProvider>
  )

  // Check initial loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('Title: Test Dataset')).toBeInTheDocument()
  })
})
```

### Testing Error Handling

Mock rejected promises and ensure retries are disabled:

```typescript
it('should handle errors', async () => {
  vi.spyOn(mockClient, 'fetchDataset').mockRejectedValue(
    new Error('Network error')
  )

  render(
    <DkanClientProvider client={mockClient}>
      <TestComponent />
    </DkanClientProvider>
  )

  await waitFor(() => {
    expect(screen.getByText('Error: Network error')).toBeInTheDocument()
  })
})
```

## Test Coverage

### DkanClientProvider (10 tests)

- ✅ Renders children
- ✅ Provides client via context
- ✅ Calls mount() on component mount
- ✅ Calls unmount() on component unmount
- ✅ Handles mount/unmount with same client on rerender
- ✅ Handles client replacement
- ✅ Works with nested providers
- ✅ useDkanClient throws error outside provider
- ✅ useDkanClient returns client from context
- ✅ useDkanClient allows access to client methods

### useDataset (9 tests)

- ✅ Fetches dataset successfully
- ✅ Handles fetch errors
- ✅ Respects enabled option
- ✅ Supports conditional fetching
- ✅ Caches results across multiple hook instances
- ✅ Provides all query states (isLoading, isSuccess, etc.)
- ✅ Supports staleTime option
- ✅ Handles multiple datasets simultaneously

### useDatasetSearch (10 tests)

- ✅ Searches with default options
- ✅ Searches with keyword filter
- ✅ Searches with multiple filters
- ✅ Handles search errors
- ✅ Respects enabled option
- ✅ Refetches when search options change
- ✅ Provides all query states
- ✅ Caches search results
- ✅ Handles empty results

### useDatastore (10 tests)

- ✅ Queries datastore successfully
- ✅ Queries with specific index
- ✅ Queries with query options (conditions, limit, offset)
- ✅ Handles query errors
- ✅ Respects enabled option
- ✅ Refetches when dataset ID changes
- ✅ Caches query results
- ✅ Provides all query states
- ✅ Handles complex queries with sorts and conditions
- ✅ Handles empty results

## Common Issues

### Issue: Tests timeout waiting for error states

**Cause**: TanStack Query retries failed requests by default (3 retries with exponential backoff).

**Solution**: Disable retries when creating the mock client:

```typescript
mockClient = new DkanClient({
  baseUrl: 'https://test.example.com',
  defaultOptions: { retry: 0 },
})
```

### Issue: "Cannot read properties of undefined (reading 'click')"

**Cause**: Incorrectly destructuring `user` from `render()` result.

**Solution**: Use `userEvent.setup()` before rendering:

```typescript
// Wrong
const { user } = render(<Component />)

// Correct
const user = userEvent.setup()
render(<Component />)
```

### Issue: Components not unmounting between tests

**Cause**: Missing cleanup in test setup.

**Solution**: Ensure `setup.ts` includes cleanup:

```typescript
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
```

## Best Practices

1. **Always wrap components in DkanClientProvider** when testing hooks
2. **Disable retries** in mock clients to avoid timeouts
3. **Use `waitFor`** for async assertions
4. **Use `userEvent.setup()`** before simulating user interactions
5. **Clear mocks** between tests using `vi.clearAllMocks()`
6. **Test loading, success, and error states** for all async operations
7. **Test cache behavior** to ensure TanStack Query integration works correctly
8. **Test conditional fetching** (enabled option) for hooks that support it

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library User Events](https://testing-library.com/docs/user-event/intro)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
