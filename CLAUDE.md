# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working with the dkanClientTools repository.

## Quick Reference

**Project Type**: TypeScript monorepo with React/Vue adapters for DKAN data catalog integration
**Foundation**: Built on TanStack Query for caching and state management
**Status**: Active Development - Comprehensive DKAN API coverage

**Documentation Locations**:
- `/docs/` - User guides, framework integration, API reference
- `/docs/external/` - External dependencies (DKAN APIs, data standards, third-party libraries)
- Package READMEs - Package-specific installation and usage

**Key Commands**:
```bash
npm run build:all        # Build packages, deploy to Drupal, build examples
npm run dev              # Watch mode for development
npm test                 # Run all tests
npm run typecheck        # Verify TypeScript types
```

---

## Project Overview

**dkanClientTools** provides framework-agnostic and framework-specific tools for building applications that integrate with DKAN data catalogs. The project uses a core + adapters pattern:

- **Core** (`@dkan-client-tools/core`) - Framework-agnostic DkanClient wrapping TanStack Query Core
- **React** (`@dkan-client-tools/react`) - React hooks using TanStack React Query
- **Vue** (`@dkan-client-tools/vue`) - Vue composables using TanStack Vue Query

### Repository Structure

```
/
├── packages/
│   ├── dkan-client-tools-core/        # Framework-agnostic core
│   ├── dkan-client-tools-react/       # React hooks
│   └── dkan-client-tools-vue/         # Vue composables
├── examples/
│   ├── react-demo-app/                # React demo
│   └── vue-demo-app/                  # Vue demo
├── dkan/                              # DKAN development site (DDEV)
├── docs/                              # User documentation
│   └── external/                      # External dependency docs
└── scripts/                           # Build automation
```

**See [BUILD_PROCESS.md](docs/BUILD_PROCESS.md) for detailed build documentation.**

---

## Packages

### @dkan-client-tools/core

**Location**: `/packages/dkan-client-tools-core`

Framework-agnostic core wrapping TanStack Query Core with DKAN-specific configuration.

**Architecture**:
- `DkanClient` - Wraps QueryClient with DKAN defaults
- `DkanApiClient` - HTTP client for all DKAN REST APIs
- TypeScript types for DCAT-US schema and API responses
- Authentication: HTTP Basic (default), Bearer tokens (requires extra Drupal modules)

**API Coverage**:
Dataset, Datastore, Data Dictionary, Harvest, Metastore, Datastore Import, Revisions/Moderation, Utilities

**Build**: TypeScript strict mode, dual ESM/CJS via tsup, source maps, tree-shakeable

### @dkan-client-tools/react

**Location**: `/packages/dkan-client-tools-react`

React hooks built on `@dkan-client-tools/core` and TanStack React Query.

**Features**:
- Comprehensive hooks covering all DKAN APIs
- Mutation support (create/update/delete operations)
- React 18+ support
- Full TypeScript support

**Hook Categories**: Dataset (query + mutations), Datastore, Data Dictionary (query + mutations), Harvest, Datastore Import, Metastore, Revisions/Moderation, Download

**Test Coverage**: Comprehensive tests for all hooks (loading, errors, success, mutations, callbacks) using Vitest + React Testing Library

**Dependencies**: `@dkan-client-tools/core` (workspace), `@tanstack/react-query` (peer), `react` ^18.0.0 || ^19.0.0 (peer)

### @dkan-client-tools/vue

**Location**: `/packages/dkan-client-tools-vue`

Vue composables built on `@dkan-client-tools/core` and TanStack Vue Query.

**Features**:
- Comprehensive composables covering all DKAN APIs
- Mutation support (create/update/delete operations)
- Vue 3 Composition API with `<script setup>` support
- MaybeRefOrGetter types for reactive parameters

**Composable Categories**: Dataset (query + mutations), Datastore, Data Dictionary (query + mutations), Harvest, Datastore Import, Metastore, Revisions/Moderation, Download

**Test Coverage**: Comprehensive tests for all composables using Vitest + Vue Test Utils

**Dependencies**: `@dkan-client-tools/core` (workspace), `@tanstack/vue-query` (peer), `vue` ^3.3.0 (peer)

---

## Development Setup

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm >= 9.0.0

### Building

```bash
# Complete build workflow
npm run build:all                # Packages → deploy → examples → Drupal
npm run build:all:drupal         # Build all + clear Drupal cache

# Individual build phases
npm run build:packages           # Build core, react, vue
npm run build:examples           # Build standalone examples
npm run build:drupal             # Build Drupal demo modules
npm run build:deploy             # Deploy built packages to Drupal

# Development
npm run dev                      # Watch mode
```

### Testing

```bash
npm test                         # All tests
npm run test:watch               # Watch mode
npm run typecheck                # Type checking

# Package-specific tests
cd packages/dkan-client-tools-react && npm test
cd packages/dkan-client-tools-vue && npm test
```

### Monorepo Management

```bash
# Add dependency to specific package
npm install <package> -w @dkan-client-tools/core

# Run script in specific package
npm run build -w @dkan-client-tools/react

# Run script in all packages
npm run build --workspaces
```

**Workspace Notes**:
- Internal dependencies use `workspace:*` protocol
- Peer dependencies declared in each package
- Common deps hoisted to root
- Independent versioning per package

---

## Architecture & Testing

### TanStack Query Foundation

1. **Core + Adapters Pattern**
   - Core wraps TanStack Query Core with DKAN configuration
   - React/Vue packages provide framework-specific hooks/composables
   - All caching, deduplication, refetching handled by TanStack Query

2. **Type Safety**
   - Full TypeScript strict mode
   - DCAT-US schema types (DkanDataset, Publisher, Distribution)
   - Frictionless table schema types (DatastoreSchema, SchemaField)
   - Type inference throughout

3. **Testing Strategy**
   - Use actual `DkanClient` instances in tests (not mock objects)
   - Spy on client methods with `vi.spyOn()`
   - Set `retry: 0` in test clients for faster failures
   - Test loading states, errors, success, mutations, callbacks
   - React: Vitest + React Testing Library
   - Vue: Vitest + Vue Test Utils

**Example Test Pattern**:
```typescript
let mockClient: DkanClient

beforeEach(() => {
  mockClient = new DkanClient({
    baseUrl: 'https://test.example.com',
    defaultOptions: { retry: 0 },
  })
})

it('fetches dataset successfully', async () => {
  vi.spyOn(mockClient, 'getDataset').mockResolvedValue(mockDataset)
  // Test implementation
})
```

### Adding New Features

**React Query Hook**:
```typescript
import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './useDkanClient'

export function useMyHook(options: MyOptions & { enabled?: boolean }) {
  const dkanClient = useDkanClient()

  return useQuery({
    queryKey: ['myHook', options.param],
    queryFn: () => dkanClient.myApiMethod(options.param),
    enabled: options.enabled !== false && !!options.param,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

**Vue Composable**:
```typescript
import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue, computed } from 'vue'

export function useMyComposable(options: { param: MaybeRefOrGetter<string> }) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => ['myComposable', toValue(options.param)]),
    queryFn: () => client.myApiMethod(toValue(options.param)),
  })
}
```

**Mutation Hook/Composable**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/[react|vue]-query'

export function useMyMutation() {
  const client = useDkanClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MyData) => client.myMutationMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related'] })
    },
  })
}
```

---

## DKAN Development Environment

The `/dkan` directory contains a Drupal 10 + DKAN 2.x site with automated setup.

**Access**: https://dkan.ddev.site (admin/admin)

**Demo Pages**:
- Vanilla JS: https://dkan.ddev.site/vanilla-demo
- React: https://dkan.ddev.site/react-demo
- Vue: https://dkan.ddev.site/vue-demo

**Automated Setup**:
```bash
# Fresh install
cd dkan
ddev drush si --account-pass=admin -y
ddev start  # Automated setup runs on post-start hook

# Manual setup script (idempotent)
ddev exec bash scripts/setup-site.sh

# Clean refresh (removes demo content and sample datasets, then recreates)
ddev exec bash scripts/setup-site.sh -c

# Complete rebuild (destroys database)
ddev exec bash scripts/rebuild-site.sh
```

**Automation Drush Commands**:
```bash
ddev drush dkan-client:create-demo-pages     # Create demo pages
ddev drush dkan-client:place-blocks          # Place demo blocks
ddev drush dkan-client:create-data-dictionaries  # Create data dictionaries
ddev drush dkan-client:setup                 # Complete setup (idempotent)
ddev drush dkan-client:setup --clean         # Clean refresh (removes all, then recreates)
```

**Common Commands**:
```bash
# DDEV
ddev start                                # Start environment
ddev stop                                 # Stop environment
ddev restart                              # Restart environment
ddev ssh                                  # SSH into container

# Drush
ddev drush cr                             # Clear cache
ddev drush status                         # Check Drupal status
ddev drush dkan:sample-content:create     # Create 49 sample datasets
ddev drush dkan:harvest:list              # List harvest plans
ddev drush dkan:dataset-info [uuid]       # Show dataset info

# Composer
ddev composer require [package]           # Add package
ddev composer install                     # Install dependencies
```

**Development Workflow**:
1. `ddev start` (automated setup runs if Drupal is installed)
2. Make changes in `dkan/docroot/modules/custom/`
3. `ddev drush cr` to clear cache
4. Test changes at demo pages

**Important**: Drupal web root is `docroot/` (not `web/`). All commands must be prefixed with `ddev`.

---

## Documentation Guidelines

### What Goes Where

| Directory | Content | Examples |
|-----------|---------|----------|
| `/docs` | Internal project documentation | INSTALLATION.md, REACT_GUIDE.md, BUILD_PROCESS.md, API_REFERENCE.md |
| `/docs/external` | External dependencies and technologies | platforms/DKAN_API.md, standards/DATA_STANDARDS.md, libraries/TANSTACK_QUERY.md |
| Package READMEs | Package-specific installation and API | Each package's README.md |

**Simple Rule**: If it's about how dkanClientTools works internally or how to use it, put it in `/docs`. If it's about an external API, library, or standard, put it in `/docs/external`.

### Documentation Types

**In /docs**:
- Getting Started (INSTALLATION.md, QUICK_START.md)
- Framework Guides (REACT_GUIDE.md, VUE_GUIDE.md)
- Integration (DRUPAL_INTEGRATION.md, BUILD_PROCESS.md)
- Reference (API_REFERENCE.md, ARCHITECTURE.md, reference/PATTERNS.md)

**In /docs/external**:
- External API documentation (platforms/DKAN_API.md)
- Technology overviews (platforms/DKAN.md)
- Standards/specs (standards/DATA_STANDARDS.md)
- Framework references (frameworks/TYPESCRIPT.md, frameworks/REACT_HOOKS.md, frameworks/VUE_COMPOSITION_API.md)
- Library references (libraries/TANSTACK_QUERY.md)

### Formatting Standards

**Heading Hierarchy** (consistent across all docs):
- **H1 (`#`)** - Document title only
- **H2 (`##`)** - Major sections
- **H3 (`###`)** - Subtopics within sections
- **H4 (`####`)** - Use sparingly for deep nesting

**Section Separators**: Use `---` between major sections

**Code Examples**: Always include language tags
```markdown
\```typescript
// TypeScript example
\```

\```json
{ "example": "JSON" }
\```
```

Common tags: `typescript`, `javascript`, `jsx`, `tsx`, `json`, `http`, `sql`, `bash`

**API Documentation Pattern**:
```markdown
### methodName(params)

Brief description of what this does.

**Parameters**:
- `param1` (type, required) - Description
- `param2` (type, optional) - Description

**Returns**: Return type and description

**Example**:
\```typescript
const result = methodName({ param1: 'value' })
\```
```

**Callouts**:
```markdown
**IMPORTANT**: Critical information

**NOTE**: Helpful context

**WARNING**: Caution needed
```

**Typography**:
- **Bold** (`**text**`) - Key terms, important concepts
- `Code font` (`` `text` ``) - Identifiers, filenames, technical terms
- *Italic* (`*text*`) - Subtle emphasis only (use sparingly)

### Communication Style

**Direct and concise**:
- Focus on practical information developers need
- Avoid unnecessary explanations
- Use examples instead of lengthy descriptions
- Get to the point quickly

**Developer-focused**:
- Technical accuracy over marketing
- Assume knowledge of JavaScript/TypeScript, React, Vue, npm
- Include implementation details and specifics
- Explain "why" not just "what"

**No hype**:
- Don't oversell features or improvements
- Present facts and tradeoffs objectively
- Avoid superlatives and marketing language
- Keep commit messages and docs concise and factual

**Examples**:
```markdown
<!-- Good -->
The DkanClient wraps QueryClient with default options for DKAN use cases.

<!-- Avoid -->
The amazing DkanClient dramatically improves your development experience by wrapping QueryClient with powerful default options!
```

### File Naming

**Uppercase with underscores**:
- `INSTALLATION.md`, `QUICK_START.md`
- `REACT_GUIDE.md`, `VUE_GUIDE.md`
- `DKAN_API.md`, `DATA_STANDARDS.md`
- `CLAUDE.md` (this file)

---

## For AI Agents (Claude Code)

### When Working on Code

**Testing Requirements**:
1. Use actual `DkanClient` instances, not mock objects
2. Spy on specific methods: `vi.spyOn(mockClient, 'getDataset').mockResolvedValue(data)`
3. Set `retry: 0` in test clients: `new DkanClient({ baseUrl: '...', defaultOptions: { retry: 0 } })`
4. Don't test `isPending` state for disabled queries (it's always true)
5. Test all states: loading, error, success, mutations, callbacks
6. Use `waitFor` for async assertions

**Hook/Composable Patterns**:
- React hooks use `useQuery` from `@tanstack/react-query`
- Vue composables use `useQuery` from `@tanstack/vue-query` with `computed()` query keys
- Vue uses `MaybeRefOrGetter` types and `toValue()` for reactive parameters
- All query hooks accept `enabled` and `staleTime` options
- Mutations invalidate related queries in `onSuccess`

**TanStack Query Patterns**:
- Query keys: `['dataset', id]` as const
- Default stale time: 5 minutes (5 * 60 * 1000)
- Default GC time: 5 minutes
- Enable queries only when params are valid: `enabled: options.enabled !== false && !!id`

**Type Safety**:
- Strict TypeScript mode enabled
- DCAT-US types: `DkanDataset`, `Publisher`, `Distribution`
- Frictionless types: `DatastoreSchema`, `SchemaField`
- Always maintain type inference

### When Creating Documentation (in /docs)

**Purpose**: Document how dkanClientTools works internally and how to use it

**Focus**:
- User guides (installation, quick start, framework integration)
- Internal architecture and design decisions
- Package APIs and method references
- Build system and development workflow

**Guidelines**:
1. Keep it short and concise
2. Focus on practical usage with real examples
3. Match the technical, direct tone
4. Follow formatting standards (headings, code blocks, callouts)
5. Reference detailed docs instead of duplicating
6. Verify accuracy against actual package code
7. No hype or overselling

**Examples**:
```typescript
// Good - shows actual package usage
import { useDataset } from '@dkan-client-tools/react'

const { data, isLoading } = useDataset({ identifier: 'abc-123' })
```

### When Creating Research Documentation (in /docs/external)

**Purpose**: Document external dependencies, APIs, standards, and technologies

**Focus**:
- Third-party API references (DKAN REST APIs)
- External technology overviews (TanStack Query, DKAN platform)
- Data standards and specifications (DCAT-US, Frictionless)
- Integration patterns for external systems

**Guidelines**:
1. Read existing research files for patterns and style
2. Include context about why external technology exists
3. Show actual external API usage and integration patterns
4. Explain technical details developers need
5. Be accurate - verify from official documentation
6. Use consistent formatting
7. Add References section with official docs links
8. Keep it practical and developer-focused

**API Documentation Example**:
```markdown
### GET /api/1/metastore/schemas/dataset/items/{id}

Fetch a single dataset by identifier.

**Parameters**:
- `{id}` (path, required) - Dataset UUID

**Response**:
\```json
{
  "identifier": "abc-123",
  "title": "Dataset Title",
  ...
}
\```
```

### General Principles

**Documentation Organization**:
- `/docs` = internal (how dkanClientTools works)
- `/docs/external` = external (DKAN APIs, third-party libs, standards)
- Clear boundary - never mix internal and external docs

**Framework Patterns**:
- Core package is framework-agnostic
- React and Vue adapters follow same patterns
- Comprehensive test coverage required for all hooks/composables
- MaybeRefOrGetter (Vue) for flexible reactive parameters

**Build & Deployment**:
- Build orchestrator handles complete workflow
- Packages build to `dist/` with ESM/CJS
- Deployment copies built files to Drupal modules
- Examples build separately from packages

**Git Workflow**:
- Never commit on main branch directly
- Create feature branches for work
- Concise commit messages - no hype
- Follow conventional commit format when applicable
- Include Claude Code attribution in commit messages and PR descriptions:
  - Commit: Add at end of commit body (not subject line)
  - PR: Add at bottom of description with separator line
  - Format: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- PR descriptions should also include `Co-Authored-By: Claude <noreply@anthropic.com>`

**Important Notes**:
- Dataset Properties API endpoints return 404 in DKAN 2.x (not available)
- Default authentication is HTTP Basic (not Bearer tokens)
- Workspace protocol: `workspace:*` for internal deps
- TypeScript definitions auto-generated by tsup
- All hooks/composables have comprehensive tests

---

## References

- **[Documentation Index](docs/README.md)** - Complete docs navigation
- **[Build Process](docs/BUILD_PROCESS.md)** - Build system details
- **[DKAN API](docs/external/platforms/DKAN_API.md)** - DKAN REST API reference
- **[TanStack Query](https://tanstack.com/query)** - Official TanStack Query docs
- **[DKAN Documentation](https://dkan.readthedocs.io)** - Official DKAN docs
