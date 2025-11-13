# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the dkanClientTools repository - a monorepo of packages containing tools to help developers build frontend applications that work with DKAN data catalogs. Built on [TanStack Query](https://tanstack.com/query) for robust caching and state management.

The repository also includes a local DKAN development environment for testing and development.

**Current Status**: Active Development - Comprehensive DKAN API coverage with 40+ React hooks, 40+ Vue composables, and 300+ tests

## Project Structure

```
/
├── packages/                           # Monorepo packages
│   ├── dkan-client-tools-core/        # Framework-agnostic core
│   ├── dkan-client-tools-react/       # React adapter with hooks
│   └── dkan-client-tools-vue/         # Vue adapter with composables
├── examples/                          # Demo applications
│   ├── react-demo-app/                # React demo application
│   └── vue-demo-app/                  # Vue demo application
├── dkan/                              # DKAN development site (DDEV)
├── research/                          # Research and analysis documentation
├── docs/                              # User documentation
│   ├── BUILD_PROCESS.md               # Automated build system guide
│   ├── BUILD_DOCUMENTATION_INDEX.md   # Index of all build documentation
│   ├── LIVE_TYPES.md                  # Live types setup guide
│   ├── REACT_STANDALONE_APP.md        # Guide for creating React apps
│   ├── VUE_STANDALONE_APP.md          # Guide for creating Vue apps
│   └── DRUPAL_USAGE.md                # Guide for Drupal integration
├── scripts/                           # Build automation scripts
│   ├── build-orchestrator.js          # Automated build orchestrator
│   └── build-config.js                # Build configuration
├── package.json                       # Root workspace configuration
└── CLAUDE.md                          # This file
```

## Packages

### @dkan-client-tools/core

**Location**: `/packages/dkan-client-tools-core`

Framework-agnostic core library for DKAN client tools. Provides the DkanClient wrapper around TanStack Query Core and the DkanApiClient HTTP client.

**Key Features**:
- Framework agnostic - works with any JavaScript framework
- Built on TanStack Query Core for proven caching and state management
- Type safe with full DCAT-US schema types
- Lightweight - only depends on @tanstack/query-core
- Extensible architecture for building framework adapters

**Architecture** (TanStack Query-based):
- `DkanClient` - Wraps TanStack Query's QueryClient with DKAN configuration
- `DkanApiClient` - HTTP client for all DKAN REST APIs (43 methods)
- TypeScript types for DCAT-US schema and API responses
- Support for token-based and basic authentication

**Key Files**:
- `src/client/DkanClient.ts` - Main client class wrapping QueryClient
- `src/api/DkanApiClient.ts` - HTTP client with all DKAN API methods
- `src/types/` - TypeScript type definitions
  - `dataset.ts` - DCAT-US schema types
  - `datastore.ts` - Datastore query types
  - `dataDictionary.ts` - Data dictionary types (Frictionless)
  - `harvest.ts` - Harvest plan/run types
  - `metastore.ts` - Metastore revision types
- `src/index.ts` - Main exports

**API Coverage** (43 methods across 8 categories):
- Dataset operations (7 methods): CRUD, search, list
- Datastore operations (5 methods): query, download, SQL
- Data dictionary operations (6 methods): CRUD, schema
- Harvest operations (6 methods): plans, runs
- Metastore operations (6 methods): schemas, facets, properties
- Datastore import operations (4 methods): import, delete, statistics
- Revision/moderation operations (4 methods): revisions, workflow states
- CKAN compatibility (5 methods): package_search, datastore_search, etc.

**Build Configuration**:
- TypeScript with strict mode
- Dual ESM/CJS builds via tsup
- Source maps enabled
- Tree-shakeable exports

### @dkan-client-tools/react

**Location**: `/packages/dkan-client-tools-react`

React hooks for DKAN client tools. Built on top of `@dkan-client-tools/core` and TanStack React Query.

**Key Features**:
- 40+ idiomatic React hooks covering all DKAN APIs
- Automatic refetching and background updates
- Efficient caching and deduplication via TanStack Query
- First-class mutation support for create/update/delete operations
- React 18+ support
- Full TypeScript support

**Hook Categories** (40+ total):
- **Dataset Query Hooks** (3): useDataset, useDatasetSearch, useAllDatasets
- **Dataset Mutations** (4): useCreateDataset, useUpdateDataset, usePatchDataset, useDeleteDataset
- **Datastore Hooks** (5): useDatastore, useSqlQuery, useExecuteSqlQuery, useDownloadQuery, useDownloadQueryByDistribution
- **Data Dictionary Query Hooks** (4): useDataDictionary, useDataDictionaryList, useDataDictionaryFromUrl, useDatastoreSchema
- **Data Dictionary Mutations** (3): useCreateDataDictionary, useUpdateDataDictionary, useDeleteDataDictionary
- **Harvest Hooks** (6): useHarvestPlans, useHarvestPlan, useHarvestRuns, useHarvestRun, useRegisterHarvestPlan, useRunHarvest
- **Datastore Import Hooks** (5): useDatastoreImports, useDatastoreImport, useDatastoreStatistics, useTriggerDatastoreImport, useDeleteDatastore
- **Metastore Hooks** (3): useSchemas, useSchemaItems, useDatasetFacets
- **Dataset Properties Hooks** (3): useDatasetProperties, usePropertyValues, useAllPropertiesWithValues
- **Revision/Moderation Hooks** (4): useRevisions, useRevision, useCreateRevision, useChangeDatasetState
- **CKAN Compatibility Hooks** (5): useCkanPackageSearch, useCkanDatastoreSearch, useCkanDatastoreSearchSql, useCkanResourceShow, useCkanCurrentPackageListWithResources

**Key Files**:
- `src/DkanClientProvider.tsx` - React Context Provider
- `src/useDkanClient.ts` - Access DkanClient from context
- `src/useDataset.ts` - Dataset query hooks
- `src/useDatasetSearch.ts` - Search hook
- `src/useDatastore.ts` - Datastore query hook
- `src/useSqlQuery.ts` - SQL query hooks
- `src/useDataDictionary.ts` - Data dictionary hooks
- `src/useHarvest.ts` - Harvest operation hooks
- `src/useDatastoreImports.ts` - Datastore import hooks
- `src/useMetastore.ts` - Metastore hooks
- `src/useDatasetProperties.ts` - Dataset properties hooks
- `src/useRevisions.ts` - Revision/moderation hooks
- `src/useQueryDownload.ts` - Download hooks
- `src/useCkan.ts` - CKAN compatibility hooks
- `src/__tests__/` - Comprehensive test suite (218 tests)

**Test Coverage**:
- 218 comprehensive tests across 15 test files
- All hooks tested for loading states, error handling, data fetching, mutations, and callbacks
- Uses Vitest + React Testing Library
- Pattern: Use actual DkanClient instances with mocked methods (not mock objects)

**Dependencies**:
- `@dkan-client-tools/core` (workspace)
- `@tanstack/react-query` (peer dependency)
- `react` ^18.0.0 || ^19.0.0 (peer dependency)

### @dkan-client-tools/vue

**Location**: `/packages/dkan-client-tools-vue`

Vue composables for DKAN client tools. Built on top of `@dkan-client-tools/core` and TanStack Vue Query.

**Key Features**:
- 40+ idiomatic Vue composables covering all DKAN APIs
- Automatic refetching and background updates
- Efficient caching and deduplication via TanStack Query
- First-class mutation support for create/update/delete operations
- Vue 3 Composition API with `<script setup>` support
- Full TypeScript support with reactive refs

**Composable Categories** (40+ total):
- **Dataset Query Composables** (3): useDataset, useDatasetSearch, useAllDatasets
- **Dataset Mutations** (4): useCreateDataset, useUpdateDataset, usePatchDataset, useDeleteDataset
- **Datastore Composables** (5): useDatastore, useSqlQuery, useExecuteSqlQuery, useDownloadQuery, useDownloadQueryByDistribution
- **Data Dictionary Query Composables** (4): useDataDictionary, useDataDictionaryList, useDataDictionaryFromUrl, useDatastoreSchema
- **Data Dictionary Mutations** (3): useCreateDataDictionary, useUpdateDataDictionary, useDeleteDataDictionary
- **Harvest Composables** (6): useHarvestPlans, useHarvestPlan, useHarvestRuns, useHarvestRun, useRegisterHarvestPlan, useRunHarvest
- **Datastore Import Composables** (5): useDatastoreImports, useDatastoreImport, useDatastoreStatistics, useTriggerDatastoreImport, useDeleteDatastore
- **Metastore Composables** (3): useSchemas, useSchemaItems, useDatasetFacets
- **Dataset Properties Composables** (3): useDatasetProperties, usePropertyValues, useAllPropertiesWithValues
- **Revision/Moderation Composables** (4): useRevisions, useRevision, useCreateRevision, useChangeDatasetState
- **CKAN Compatibility Composables** (5): useCkanPackageSearch, useCkanDatastoreSearch, useCkanDatastoreSearchSql, useCkanResourceShow, useCkanCurrentPackageListWithResources

**Key Files**:
- `src/plugin.ts` - Vue plugin and client injection
- `src/useDataset.ts` - Dataset query composables
- `src/useDatasetSearch.ts` - Search composable
- `src/useDatastore.ts` - Datastore query composable
- `src/useSqlQuery.ts` - SQL query composables
- `src/useDataDictionary.ts` - Data dictionary composables
- `src/useHarvest.ts` - Harvest operation composables
- `src/useDatastoreImports.ts` - Datastore import composables
- `src/useMetastore.ts` - Metastore composables
- `src/useDatasetProperties.ts` - Dataset properties composables
- `src/useRevisions.ts` - Revision/moderation composables
- `src/useQueryDownload.ts` - Download composables
- `src/useCkanApi.ts` - CKAN compatibility composables
- `src/__tests__/` - Comprehensive test suite (91 tests)

**Test Coverage**:
- 91 comprehensive tests across 15 test files
- All composables tested for loading states, error handling, data fetching, mutations, and callbacks
- Uses Vitest + Vue Test Utils
- Pattern: Use actual DkanClient instances with mocked methods (not mock objects)

**Vue-Specific Features**:
- MaybeRefOrGetter types for reactive parameters
- Computed query keys for automatic reactivity
- toValue() for unwrapping refs/computed
- Full support for reactive refs and computed properties

**Dependencies**:
- `@dkan-client-tools/core` (workspace)
- `@tanstack/vue-query` (peer dependency)
- `vue` ^3.3.0 (peer dependency)

## Development Setup

### Prerequisites

- Node.js 20.19+ or 22.12+ (for Vite 7 in demo apps)
- npm >= 9.0.0

### Installation

```bash
# Install all dependencies
npm install

# Install dependencies for specific package
cd packages/dkan-client-tools-core
npm install
```

### Building Packages

The project uses an automated build orchestrator for the complete workflow.

```bash
# Complete build workflow (packages → deploy → examples → drupal modules)
npm run build:all

# Complete build + clear Drupal cache
npm run build:all:drupal

# Build only packages (core, react, vue)
npm run build:packages

# Build only standalone examples
npm run build:examples

# Build only Drupal demo modules
npm run build:drupal

# Deploy already-built packages to Drupal modules
npm run build:deploy

# Legacy: Build all packages (no deployment)
npm run build

# Watch mode for development
npm run dev
```

**See [BUILD_PROCESS.md](docs/BUILD_PROCESS.md) for complete build documentation.**

### Testing

```bash
# Run tests for all packages (300+ tests)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for specific package
cd packages/dkan-client-tools-react
npm test

cd packages/dkan-client-tools-vue
npm test

# Type checking
npm run typecheck
```

**Testing Patterns**:

All React hooks and Vue composables have comprehensive tests covering:
- Loading states (`isLoading`, `isPending`)
- Error handling (`isError`, error messages)
- Successful data fetching (`isSuccess`, data validation)
- Mutations (create, update, delete operations)
- Callbacks (onSuccess, onError)
- Edge cases (empty values, disabled queries)

**Key Testing Practices**:
1. Use actual `DkanClient` instances, not mock objects:
   ```typescript
   let mockClient: DkanClient
   beforeEach(() => {
     mockClient = new DkanClient({
       baseUrl: 'https://test.example.com',
       defaultOptions: { retry: 0 }, // Speed up failure tests
     })
   })
   ```

2. Spy on specific client methods:
   ```typescript
   vi.spyOn(mockClient, 'getDataset').mockResolvedValue(mockDataset)
   ```

3. Don't test `isPending` state for disabled queries (it's always true)

4. Use `waitFor` for async assertions:
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Expected text')).toBeInTheDocument()
   })
   ```

**Test File Organization (React)**:
- `__tests__/useDataset.test.tsx` - Dataset query hooks
- `__tests__/useDatasetSearch.test.tsx` - Search hooks
- `__tests__/useDatastore.test.tsx` - Datastore query hooks
- `__tests__/useSqlQuery.test.tsx` - SQL query hooks (12 tests)
- `__tests__/useDataDictionary.test.tsx` - Data dictionary hooks
- `__tests__/useDatasetProperties.test.tsx` - Dataset properties hooks (21 tests)
- `__tests__/useDatastoreImports.test.tsx` - Datastore import hooks (25 tests)
- `__tests__/useHarvest.test.tsx` - Harvest operation hooks (11 tests)
- `__tests__/useMetastore.test.tsx` - Metastore hooks (10 tests)
- `__tests__/useQueryDownload.test.tsx` - Download hooks (8 tests)
- `__tests__/useRevisions.test.tsx` - Revision/moderation hooks (10 tests)
- `__tests__/useCkan.test.tsx` - CKAN compatibility hooks
- Plus tests for mutations and other operations (218 tests total)

**Test File Organization (Vue)**:
- `__tests__/plugin.test.ts` - Plugin injection tests
- `__tests__/useDataset.test.ts` - Dataset query composables (9 tests)
- `__tests__/useDatasetSearch.test.ts` - Search composables (9 tests)
- `__tests__/useDatasetMutations.test.ts` - Dataset mutations (11 tests)
- `__tests__/useDatastore.test.ts` - Datastore query composables (10 tests)
- `__tests__/useSqlQuery.test.ts` - SQL query composables (12 tests)
- `__tests__/useDataDictionary.test.ts` - Data dictionary composables (6 tests)
- `__tests__/useDataDictionaryMutations.test.ts` - Dictionary mutations (4 tests)
- `__tests__/useHarvest.test.ts` - Harvest composables (4 tests)
- `__tests__/useDatastoreImports.test.ts` - Import composables (5 tests)
- `__tests__/useMetastore.test.ts` - Metastore composables (4 tests)
- `__tests__/useDatasetProperties.test.ts` - Properties composables (3 tests)
- `__tests__/useRevisions.test.ts` - Revision composables (4 tests)
- `__tests__/useQueryDownload.test.ts` - Download composables (3 tests)
- `__tests__/useCkanApi.test.ts` - CKAN compatibility composables (5 tests)
- Total: 91 tests

### Monorepo Structure

The project uses npm workspaces for monorepo management:

- **Root package.json** defines workspace packages
- **Workspace protocol** (`workspace:*`) for internal dependencies
- **Hoisted dependencies** - common deps installed at root
- **Independent versioning** - each package has its own version

## DKAN API Integration

The packages integrate with DKAN's REST APIs. See `research/DKAN_API_RESEARCH.md` for comprehensive API documentation.

### Supported DKAN APIs

1. **Metastore API** - `/api/1/metastore/schemas/dataset/items/{id}`
   - CRUD operations for dataset metadata
   - Follows DCAT-US schema

2. **Datastore API** - `/api/1/datastore/query/{datasetId}/{index}`
   - Query actual data with SQL-like filters
   - Supports sorting, pagination, joins, aggregations

3. **Search API** - `/api/1/search`
   - Search datasets by keyword, theme, fulltext
   - Faceted search support

4. **CKAN-Compatible API** - `/api/3/action/*`
   - Read-only CKAN compatibility layer
   - package_list, package_show endpoints

### Authentication

- HTTP Basic Authentication (username/password)
- Bearer tokens (if configured)
- Anonymous read access (no auth required for GET requests)

## Architecture Patterns

### TanStack Query Foundation

The project is built on [TanStack Query](https://tanstack.com/query) for proven data fetching and caching:

1. **Core + Adapters Pattern**
   - Core package wraps TanStack Query Core with DKAN-specific configuration
   - DkanClient wraps QueryClient with default options for DKAN use cases
   - DkanApiClient provides HTTP methods for all DKAN REST APIs
   - React package uses TanStack React Query for hooks
   - Vue package uses TanStack Vue Query for composables

2. **Smart Caching** (provided by TanStack Query)
   - Automatic caching with configurable stale-time
   - Background refetching
   - Query deduplication
   - Garbage collection for unused queries
   - Optimistic updates for mutations

3. **Type Safety**
   - Full TypeScript with strict mode
   - DCAT-US schema types for datasets
   - Frictionless table schema types for data dictionaries
   - Type inference throughout all hooks and methods

4. **Testing Strategy**
   - Use actual DkanClient instances in tests (not mock objects)
   - Spy on specific client methods with vi.spyOn()
   - Set retry: 0 in test clients to speed up failure cases
   - Test loading states, error handling, data fetching, mutations, and callbacks
   - Use React Testing Library + Vitest for React tests
   - Use Vue Test Utils + Vitest for Vue tests

## Adding New Features

### Adding a New Query Hook (React)

1. Create hook file in `packages/dkan-client-tools-react/src/`
2. Use TanStack Query's `useQuery` hook
3. Define appropriate query key
4. Call DkanClient API method in queryFn
5. Export from `index.ts`

Example:
```typescript
import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './useDkanClient'

export function useMyNewHook(options: MyOptions & { enabled?: boolean; staleTime?: number }) {
  const dkanClient = useDkanClient()

  return useQuery({
    queryKey: ['myHook', options.param],
    queryFn: () => dkanClient.myApiMethod(options.param),
    enabled: options.enabled !== false && !!options.param, // Don't fetch if param is empty
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Default 5 minutes
  })
}
```

### Adding a New Mutation Hook (React)

1. Create hook file in `packages/dkan-client-tools-react/src/`
2. Use TanStack Query's `useMutation` hook
3. Call DkanClient API method in mutationFn
4. Optionally invalidate related queries in onSuccess
5. Export from `index.ts`

Example:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDkanClient } from './useDkanClient'

export function useMyMutation() {
  const dkanClient = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MyData) => dkanClient.myMutationMethod(data),
    onSuccess: () => {
      // Invalidate related queries after successful mutation
      queryClient.invalidateQueries({ queryKey: ['myHook'] })
    },
  })
}
```

### Adding a New Framework Adapter

1. Create new package: `packages/dkan-client-tools-{framework}/`
2. Add dependencies:
   - `@dkan-client-tools/core` (workspace)
   - `@tanstack/query-{framework}` (peer dependency)
3. Implement framework-specific provider/context
4. Create hooks/composables that use TanStack Query's framework adapter
5. Follow the same patterns as the React package

### Adding a New Query Composable (Vue)

1. Create composable file in `packages/dkan-client-tools-vue/src/`
2. Use TanStack Query's `useQuery` composable
3. Define appropriate query key with computed()
4. Call DkanClient API method in queryFn
5. Use MaybeRefOrGetter types for reactive parameters
6. Export from `index.ts`

Example:
```typescript
import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue, computed } from 'vue'
import { useDkanClient } from './plugin'

export interface UseMyComposableOptions {
  param: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export function useMyComposable(options: UseMyComposableOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => ['myComposable', toValue(options.param)]),
    queryFn: () => client.myApiMethod(toValue(options.param)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
  })
}
```

### Adding a New Mutation Composable (Vue)

1. Create composable file in `packages/dkan-client-tools-vue/src/`
2. Use TanStack Query's `useMutation` composable
3. Call DkanClient API method in mutationFn
4. Optionally invalidate related queries in onSuccess
5. Export from `index.ts`

Example:
```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useDkanClient } from './plugin'

export function useMyMutation() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MyData) => client.myMutationMethod(data),
    onSuccess: () => {
      // Invalidate related queries after successful mutation
      queryClient.invalidateQueries({ queryKey: ['myComposable'] })
    },
  })
}
```

## Common Commands

### Package Management

```bash
# Add dependency to specific package
npm install <package> -w @dkan-client-tools/core

# Add dev dependency
npm install -D <package> -w @dkan-client-tools/core

# Run script in specific package
npm run build -w @dkan-client-tools/react

# Run script in all packages
npm run build --workspaces
```

### Development Workflow

1. Make changes to source files
2. Run `npm run dev` for watch mode
3. Test changes in example apps
4. Run `npm run typecheck` to verify types
5. Run `npm test` to run tests
6. Build before committing: `npm run build`

## Important Notes

- **Workspace dependencies** use `workspace:*` protocol
- **Peer dependencies** should be declared in each package
- **Type definitions** are generated automatically by tsup
- **Source maps** are included for debugging
- **Tree-shaking** is supported via proper exports configuration
- **All 40+ hooks/composables** have comprehensive test coverage (300+ tests total)
- **TanStack Query** handles all caching, deduplication, and background refetching
- **Vue composables** use MaybeRefOrGetter types for maximum flexibility with reactive parameters

## Example Applications

The repository includes two complete demo applications showcasing DKAN client tools in action.

### React Demo App (`/examples/react-demo-app`)

Complete React application demonstrating all DKAN client tools features with Tailwind CSS styling.

**Features Demonstrated**:
- Dataset search and filtering
- Dataset details view with full metadata
- Datastore querying with SQL support
- Data dictionary management
- Harvest operations (plans and runs)
- Download functionality (CSV/JSON)
- Dataset CRUD operations (create, update, delete)
- Workflow state management (draft, published, archived)
- Real-time loading states and error handling
- DkanClientProvider setup
- React 18+ support

**Running the React Demo**:
```bash
cd examples/react-demo-app
npm install
npm run dev
# Opens at http://localhost:5173
```

### Vue Demo App (`/examples/vue-demo-app`)

Simple Vue 3 application demonstrating core DKAN functionality with Composition API.

**Features Demonstrated**:
- DkanClientPlugin setup
- Dataset search with live filtering
- Reactive search and pagination
- Loading and error states
- TypeScript integration with Vue 3
- Vite proxy configuration for local DKAN
- Full composition API with `<script setup>`

**Running the Vue Demo**:
```bash
cd examples/vue-demo-app
npm install
npm run dev
# Opens at http://localhost:5174 (or next available port)
```

**Development Uses**:
- Testing new hooks/composables during development
- Demonstrating API capabilities to users
- Validating integration with live DKAN instances
- Learning framework-specific patterns
- Reference implementations for best practices

## Documentation

Comprehensive user documentation is available in the `/docs` directory.

### User Guides

- **[React Standalone App Guide](docs/REACT_STANDALONE_APP.md)** - Complete guide for building React apps with DKAN Client Tools
  - Setting up Vite + React + TypeScript project
  - DkanClientProvider configuration
  - Using all 40+ React hooks
  - Authentication, CORS, and proxy setup
  - Testing with Vitest
  - Performance optimization techniques
  - Building and deployment

- **[Vue Standalone App Guide](docs/VUE_STANDALONE_APP.md)** - Complete guide for building Vue 3 apps with DKAN Client Tools
  - Setting up Vite + Vue + TypeScript project
  - DkanClientPlugin configuration
  - Using all 40+ Vue composables
  - Reactive parameters with MaybeRefOrGetter
  - Authentication, CORS, and proxy setup
  - Testing with Vitest
  - Performance optimization techniques
  - Building and deployment

- **[Drupal Integration Guide](docs/DRUPAL_USAGE.md)** - Guide for integrating DKAN Client Tools with Drupal
  - IIFE builds for browser/Drupal usage
  - Drupal library definitions
  - Using with Drupal Behaviors
  - React and Vue integration in themes/modules
  - Global variable reference
  - Build sizes and dependencies

### API Documentation

- **[DKAN API Research](research/DKAN_API_RESEARCH.md)** - Comprehensive documentation of all DKAN REST APIs
- **[API Gap Analysis](research/DKAN_API_GAP_ANALYSIS.md)** - Analysis of DKAN API coverage
- **[Future Features](research/FUTURE_FEATURES.md)** - Planned features and enhancements

## DKAN Directory Setup

The `/dkan` directory contains a fully configured Drupal 11 site with DKAN installed.

### Installed Components

- **Drupal**: 11.2.7
- **DKAN**: 2.21.2
- **Drush**: 13.6.2
- **PHP**: 8.3
- **Database**: MariaDB 10.11
- **Web Server**: nginx-fpm

### DKAN Modules Enabled

Core DKAN modules:
- `dkan` - Core DKAN functionality
- `metastore` - Dataset metadata management
- `metastore_admin` - Admin interface for datasets
- `metastore_search` - Search functionality for datasets
- `harvest` - Data harvesting from external sources
- `sample_content` - Sample dataset generator

Supporting modules:
- `search_api` & `search_api_db` - Search infrastructure
- `pathauto` & `token` - URL aliasing
- `views_bulk_operations` - Bulk operations on content
- `moderated_content_bulk_publish` - Content moderation workflows
- `json_form_widget` - JSON-based form handling
- `select2` & `select_or_other` - Enhanced form widgets
- `data_dictionary_widget` - Data dictionary management

### Sample Data

- **49 datasets** imported via sample content harvest
- Sample harvest plan: `sample_content`

### Directory Structure

```
/dkan
├── .ddev/              # DDEV configuration
├── docroot/            # Drupal web root
│   ├── core/           # Drupal core
│   ├── modules/        # Contributed and custom modules
│   ├── themes/         # Themes
│   ├── sites/          # Site configuration and files
│   └── index.php       # Drupal entry point
├── vendor/             # Composer dependencies
├── composer.json       # Project dependencies
└── composer.lock       # Locked dependency versions
```

### Access Information

- **Site URL**: https://dkan.ddev.site
- **Admin Username**: `admin`
- **Admin Password**: `admin`
- **Database**: mysql://db:db@db:3306/db

### Common Commands

#### DDEV Commands
```bash
ddev start              # Start the environment
ddev stop               # Stop the environment
ddev restart            # Restart the environment
ddev describe           # Show project details
ddev ssh                # SSH into web container
```

#### Drush Commands
```bash
ddev drush status                           # Check Drupal status
ddev drush cr                               # Clear cache
ddev drush dkan:sample-content:create       # Create sample datasets
ddev drush dkan:sample-content:remove       # Remove sample datasets
ddev drush dkan:harvest:list                # List harvest plans
ddev drush dkan:harvest:run [plan-id]       # Run a harvest
ddev drush dkan:dataset-info [uuid]         # Show dataset info
```

#### Composer Commands
```bash
ddev composer require [package]         # Add a package
ddev composer update                    # Update dependencies
ddev composer install                   # Install dependencies
```

### Development Workflow

1. Start DDEV: `ddev start`
2. Access site: https://dkan.ddev.site
3. Log in with admin credentials
4. Make changes to code in `docroot/`
5. Clear cache: `ddev drush cr`
6. Test changes

### Important Notes

- The Drupal web root is `docroot/` (not `web/`)
- DDEV uses Mutagen for file synchronization on macOS
- All Drupal/DKAN commands should be run through DDEV (prefix with `ddev`)
- Sample content can be regenerated at any time using `ddev drush dkan:sample-content:create`
- Please remember to never stage or commit changes when currently on the main branch of the repo
- Try to keep commit messages and documentation concise and develeper focused. Not need to hype or oversell improvements and features.