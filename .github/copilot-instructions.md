# DKAN Client Tools - GitHub Copilot Review Instructions

## Project Overview

This is a monorepo of TypeScript packages providing DKAN data catalog integration for JavaScript applications. Built on TanStack Query for robust caching and state management.

**Architecture**: Core + Adapters Pattern
- `@dkan-client-tools/core` - Framework-agnostic foundation (TanStack Query Core)
- `@dkan-client-tools/react` - React hooks (TanStack React Query)
- `@dkan-client-tools/vue` - Vue composables (TanStack Vue Query)

**Current Status**: 40+ hooks/composables, 43 API methods, 300+ tests

## Build & Test Commands

```bash
# Build workflow (automated orchestrator)
npm run build:all              # Complete build: packages → deploy → examples → drupal
npm run build:packages         # Build only packages (core, react, vue)
npm run build:examples         # Build standalone demo apps
npm run build:drupal           # Build Drupal demo modules

# Testing
npm test                       # Run all tests (300+ tests)
npm run test:watch             # Watch mode
npm run typecheck              # Type checking

# Development
npm run dev                    # Watch mode for all packages
```

**Required Versions**: Node.js 20.19+ or 22.12+ (for Vite 7 in demo apps), npm >= 9.0.0

## Code Review Focus Areas

### 1. Architecture & Consistency

**React/Vue Parity**: When adding features, ensure both React and Vue packages implement equivalent functionality:
- React hooks should have corresponding Vue composables
- API method coverage must match across frameworks
- Test coverage should be equivalent (similar test count and patterns)
- Documentation should be consistent

**TanStack Query Foundation**: All data fetching must use TanStack Query, never custom fetch logic:
- Use `useQuery` for data fetching (React) or `useQuery` (Vue)
- Use `useMutation` for create/update/delete operations
- Query keys should follow consistent patterns: `['hookName', ...dependencies]`
- Always set appropriate `staleTime` (default 5 minutes: `5 * 60 * 1000`)

**Core Package**: Should remain framework-agnostic:
- No React or Vue imports in `packages/dkan-client-tools-core`
- Only depends on `@tanstack/query-core`
- All API methods in `DkanApiClient` should be pure HTTP operations

### 2. TypeScript Standards

**Strict Mode**: All packages use strict TypeScript configuration
- No `any` types without explicit justification
- All API responses must be typed (see `src/types/` in core package)
- Exported functions must have explicit return types
- Use type inference for internal implementation details

**Type Organization**:
- DCAT-US schema types → `core/src/types/dataset.ts`
- Datastore types → `core/src/types/datastore.ts`
- Frictionless schema → `core/src/types/dataDictionary.ts`
- Harvest types → `core/src/types/harvest.ts`

**Vue-Specific**: Use `MaybeRefOrGetter<T>` for parameters that accept reactive values:
```typescript
export interface UseDatasetOptions {
  datasetId: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
}
```

### 3. Testing Patterns

**Critical Pattern**: Use actual `DkanClient` instances, NOT mock objects:
```typescript
// ✅ CORRECT
let mockClient: DkanClient
beforeEach(() => {
  mockClient = new DkanClient({
    baseUrl: 'https://test.example.com',
    defaultOptions: { retry: 0 },
  })
})
vi.spyOn(mockClient, 'getDataset').mockResolvedValue(mockDataset)

// ❌ WRONG
const mockClient = { getDataset: vi.fn() } as any
```

**Test Coverage Requirements**:
- Loading states (`isLoading` for React, `isPending` for mutations)
- Error handling (`isError`, error messages)
- Successful data fetching (`isSuccess`, data validation)
- Mutations (create, update, delete operations)
- Callbacks (onSuccess, onError)
- Edge cases (empty values, disabled queries)

**Important**: Don't test `isPending` state for disabled queries (it's always true)

**Test File Naming**:
- React: `__tests__/useHookName.test.tsx`
- Vue: `__tests__/useComposableName.test.ts`

### 4. API Coverage & Completeness

**43 API Methods** across 8 categories (see CLAUDE.md for full list):
- Dataset operations (7 methods)
- Datastore operations (5 methods)
- Data dictionary operations (6 methods)
- Harvest operations (6 methods)
- Metastore operations (6 methods)
- Datastore import operations (4 methods)
- Revision/moderation operations (4 methods)
- CKAN compatibility (5 methods)

When adding new API methods:
1. Add to `DkanApiClient` in core package
2. Create corresponding React hook
3. Create corresponding Vue composable
4. Add comprehensive tests for both
5. Update documentation in CLAUDE.md

### 5. Documentation Standards

**Function Documentation**: All exported hooks/composables must include:
```typescript
/**
 * Fetches a single dataset by ID.
 *
 * @param options - Configuration options
 * @param options.datasetId - The dataset identifier
 * @param options.enabled - Whether the query should run (default: true)
 * @param options.staleTime - Time in ms before data becomes stale (default: 5 minutes)
 * @returns Query result with dataset data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDataset({ datasetId: '123' })
 * ```
 */
```

**README Updates**: When adding features, update relevant READMEs and CLAUDE.md

### 6. Common Pitfalls to Flag

**React Hooks**:
- Missing `useDkanClient()` at top of hook
- Not using `useQuery` or `useMutation` from TanStack
- Forgetting to invalidate queries after mutations
- Missing `enabled` parameter for conditional queries

**Vue Composables**:
- Not using `toValue()` to unwrap reactive parameters
- Missing `computed()` for query keys with reactive deps
- Not using `MaybeRefOrGetter` types for parameters

**Testing**:
- Using mock objects instead of real `DkanClient` instances
- Not setting `retry: 0` in test client (slows down failure tests)
- Missing test cases for callbacks or edge cases

**Build System**:
- Modifying individual package build scripts (use orchestrator)
- Not running `npm run build:all` after changes
- Breaking dual ESM/CJS build output

### 7. Security & Best Practices

**No Secrets in Code**: Flag any hardcoded:
- API keys or tokens
- Credentials or passwords
- Internal URLs or endpoints

**Authentication**: All authentication should use:
- HTTP Basic Auth (username/password in config)
- Bearer tokens (if configured)
- Never store credentials in source code

**Error Handling**: All API calls should handle:
- Network errors
- 401/403 authentication errors
- 404 not found errors
- Malformed response data

### 8. Performance Considerations

**Query Optimization**:
- Use appropriate `staleTime` (don't refetch unnecessarily)
- Implement `enabled` parameter to prevent unwanted requests
- Consider query deduplication for frequently accessed data

**Bundle Size**:
- Tree-shakeable exports (maintained by tsup config)
- No unnecessary dependencies
- Lazy loading where appropriate

## Project-Specific Conventions

### File Structure
```
packages/
├── dkan-client-tools-core/
│   ├── src/
│   │   ├── api/DkanApiClient.ts    # All API methods
│   │   ├── client/DkanClient.ts    # QueryClient wrapper
│   │   └── types/                  # TypeScript types
│   └── __tests__/
├── dkan-client-tools-react/
│   ├── src/
│   │   ├── DkanClientProvider.tsx  # Context provider
│   │   ├── useDkanClient.ts        # Hook to access client
│   │   ├── use*.ts                 # Individual hooks
│   │   └── __tests__/
├── dkan-client-tools-vue/
│   ├── src/
│   │   ├── plugin.ts               # Vue plugin
│   │   ├── use*.ts                 # Individual composables
│   │   └── __tests__/
```

### Naming Conventions
- React hooks: `use[Feature]` (e.g., `useDataset`, `useCreateDataset`)
- Vue composables: `use[Feature]` (same as React for consistency)
- Query keys: `['featureName', param1, param2]` (lowercase, descriptive)
- Types: PascalCase (e.g., `Dataset`, `DatastoreQuery`)
- Files: kebab-case for non-component files, PascalCase for components

### Commit Messages
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `refactor:` - Code refactoring
- `chore:` - Build/tooling changes

## CI/CD Integration

**Pre-commit Checks** (if implemented):
- TypeScript compilation
- Test suite passes
- Linting passes
- Build succeeds

**Build Output Validation**:
- Dual ESM/CJS builds present
- Type definitions (`.d.ts`) generated
- Source maps included
- No build warnings

## Questions to Ask During Review

1. **Does this change maintain React/Vue parity?**
2. **Are there tests covering all code paths?**
3. **Is the TypeScript strictly typed (no `any`)?**
4. **Does this follow the TanStack Query patterns?**
5. **Is documentation updated (JSDoc, README, CLAUDE.md)?**
6. **Will this work in both browser and Node.js environments?**
7. **Are query keys consistent and properly structured?**
8. **For mutations: Are related queries invalidated?**

## References

- Full API documentation: `research/DKAN_API_RESEARCH.md`
- Project instructions: `CLAUDE.md`
- Build system: `docs/BUILD_PROCESS.md`
- Testing patterns: Check existing `__tests__/` directories
