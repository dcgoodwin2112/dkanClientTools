# DKAN Client Tools - GitHub Copilot Review Instructions

## Project Overview

This is a monorepo of TypeScript packages providing DKAN data catalog integration for JavaScript applications. Built on TanStack Query for robust caching and state management.

**Architecture**: Core + Adapters Pattern
- `@dkan-client-tools/core` - Framework-agnostic foundation (TanStack Query Core)
- `@dkan-client-tools/react` - React hooks (TanStack React Query)
- `@dkan-client-tools/vue` - Vue composables (TanStack Vue Query)

**Current Status**: 50+ hooks/composables, 42 API methods across 9 categories, 506 tests (Core: 225, React: 181, Vue: 100)

## Build & Test Commands

```bash
# Build workflow (automated orchestrator)
npm run build:all              # Complete build: packages → deploy → examples → drupal
npm run build:all:drupal       # Complete build + clear Drupal cache
npm run build:packages         # Build only packages (core, react, vue)
npm run build:examples         # Build standalone demo apps
npm run build:drupal           # Build Drupal demo modules
npm run build:deploy           # Deploy already-built packages to Drupal modules
npm run build                  # Legacy: Build all packages (no deployment)

# Testing
npm test                       # Run all tests (500+ tests)
npm run test:watch             # Watch mode
npm run typecheck              # Type checking

# Development
npm run dev                    # Watch mode for all packages
```

**Required Versions**:
- Node.js 20.19+ or 22.12+ (for Vite 7 in demo apps)
- npm >= 9.0.0
- React ^18.0.0 || ^19.0.0 (for React package)
- Vue ^3.3.0 (for Vue package)

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
- Loading states (`isLoading` for queries, `isPending` for mutations in both React and Vue)
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

**42+ API Methods** across 9 categories covering datasets, datastore operations, data dictionaries, harvests, imports, metastore, and revisions. See [ARCHITECTURE.md](../docs/ARCHITECTURE.md) and [API_REFERENCE.md](../docs/API_REFERENCE.md) for complete API coverage.

**Important**: Dataset Properties API methods (getDatasetProperties, getPropertyValues, getAllPropertiesWithValues) are not available in DKAN 2.x as the API endpoints return 404. These hooks/composables exist but are non-functional.

When adding new API methods:
1. Add to `DkanApiClient` in core package
2. Create corresponding React hook
3. Create corresponding Vue composable
4. Add comprehensive tests for both
5. Update documentation in CLAUDE.md

### 5. Documentation Standards

**JSDoc Patterns**: Follow concise documentation style per CLAUDE.md:
- One line for simple functions, brief descriptions for complex ones
- Single practical example (not multiple variations)
- See `packages/dkan-client-tools-react/src/useDataset.ts` and `packages/dkan-client-tools-vue/src/useDataset.ts` for reference patterns

**Documentation Updates**: When adding features, update:
- Package READMEs with usage examples
- CLAUDE.md with architectural notes (if significant)
- Follow "reference instead of embed" pattern - link to detailed docs rather than duplicating content

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
- **HTTP Basic Auth** (username/password in config) - **Recommended for DKAN 2.x** (works out-of-the-box)
- **Bearer tokens** - Requires additional Drupal modules (NOT supported by default in DKAN 2.x)
- **Anonymous read access** - No auth required for GET requests to public endpoints
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

### Monorepo Structure

This project uses **npm workspaces** for monorepo management:
- **Workspace protocol**: Internal dependencies use `workspace:*` in package.json
- **Hoisted dependencies**: Common dependencies installed at root level
- **Independent versioning**: Each package maintains its own version number
- **Build orchestration**: Automated build system handles dependencies between packages

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

### Example Applications

The repository includes complete demo applications:
- **React Demo App** (`/examples/react-demo-app`) - Full-featured React app with Tailwind CSS
- **Vue Demo App** (`/examples/vue-demo-app`) - Vue 3 Composition API demo
- **Vanilla Demo App** (`/examples/vanilla-demo-app`) - Framework-agnostic JavaScript demo
- **Drupal Demo Modules** (`/examples/drupal-demo-module-{react|vanilla|vue}`) - Drupal integration examples

### DKAN Local Development Environment

The `/dkan` directory contains a fully configured Drupal 10 + DKAN 2.x development environment:

**Setup**: DDEV-based with Drupal 10, DKAN 2.x, PHP 8.3, MariaDB, nginx-fpm

**Access**:
- Site URL: https://dkan.ddev.site
- Admin login: `ddev drush uli` (generates one-time login link)

**Common Commands**:
```bash
ddev start                              # Start environment
ddev drush cr                           # Clear cache
ddev drush dkan:sample-content:create   # Create sample datasets
ddev drush dkan:harvest:list            # List harvest plans
```

**Important**:
- All Drupal/DKAN commands must be prefixed with `ddev`
- Never commit changes while on main branch
- Drupal web root is `docroot/` (not `web/`)

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

- **Project instructions**: `CLAUDE.md`
- **Quick reference for AI agents**: `PROJECT_INFO.md`
- **AI tool compatibility**: `llms.txt`
- **Development guide**: `docs/DEVELOPMENT.md`
- **DKAN API documentation**: `docs/external/platforms/DKAN_API.md`
- **Data standards documentation**: `docs/external/standards/DATA_STANDARDS.md`
- **Architecture documentation**: `docs/ARCHITECTURE.md`
- **Build system guide**: `docs/BUILD_PROCESS.md`
- **React integration guide**: `docs/REACT_GUIDE.md`
- **Vue integration guide**: `docs/VUE_GUIDE.md`
- **Drupal integration guide**: `docs/DRUPAL_INTEGRATION.md`
- **API reference**: `docs/API_REFERENCE.md`
- **Testing patterns**: Check existing `__tests__/` directories in each package
