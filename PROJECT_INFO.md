# dkanClientTools - Quick Reference for AI Agents

Fast-loading context file for AI coding assistants following link-based reference pattern.

## Architecture

**Pattern**: Core + Framework Adapters
- Core: Framework-agnostic DkanClient wrapping TanStack Query Core
- React: Hooks built on TanStack React Query
- Vue: Composables built on TanStack Vue Query

**Foundation**: TanStack Query for caching, deduplication, and background refetching

**Stats**: 3 packages, 506 tests (Core: 225, React: 181, Vue: 100), TypeScript strict mode

## Key Code Patterns

Instead of code examples, see actual source files:

**Test Pattern**: `packages/dkan-client-tools-react/src/__tests__/useDataset.test.tsx`
- Use actual DkanClient instances (not mocks)
- Spy on methods with vi.spyOn()
- Set retry: 0 for faster failures

**React Hook**: `packages/dkan-client-tools-react/src/useDataset.ts`
- useQuery from @tanstack/react-query
- enabled option for conditional execution
- 5-minute default stale time

**Vue Composable**: `packages/dkan-client-tools-vue/src/useDataset.ts`
- useQuery from @tanstack/vue-query
- MaybeRefOrGetter types for reactive parameters
- computed() query keys

**Mutation**: `packages/dkan-client-tools-react/src/useDatasetMutations.ts`
- useMutation with onSuccess callbacks
- Query invalidation after mutations

## Development Commands

```bash
npm run build:all           # Packages → deploy → examples
npm run dev                 # Watch mode
npm test                    # All tests
npm run typecheck           # Type checking
```

See `docs/DEVELOPMENT.md` for complete commands and `docs/BUILD_PROCESS.md` for build details.

## Documentation Structure

**Project Guidance**: `CLAUDE.md` (comprehensive guidance for Claude Code)

**Internal Docs** (`/docs`):
- INSTALLATION.md, ARCHITECTURE.md, BUILD_PROCESS.md
- REACT_GUIDE.md, VUE_GUIDE.md, API_REFERENCE.md
- reference/PATTERNS.md (test and code patterns)

**External Docs** (`/docs/external`):
- platforms/DKAN_API.md (DKAN REST API reference)
- libraries/TANSTACK_QUERY.md (TanStack Query overview)
- standards/DATA_STANDARDS.md (DCAT-US, Frictionless)

**Package Docs**:
- packages/dkan-client-tools-core/README.md + TESTING.md
- packages/dkan-client-tools-react/README.md + TESTING.md
- packages/dkan-client-tools-vue/README.md + TEST_SUMMARY.md

## Common Tasks

**Add New Hook/Composable**: See `docs/reference/PATTERNS.md` for templates

**Run Tests**: `npm test` (all) or `npm test -w @dkan-client-tools/react` (specific)

**Build for Drupal**: `npm run build:all:drupal` (includes cache clear)

**Add Package Dependency**: `npm install <pkg> -w @dkan-client-tools/core`

## Important Notes

- TypeScript strict mode enabled
- Workspace protocol `workspace:*` for internal dependencies
- Query keys pattern: `['dataset', id]` as const
- Default stale time: 5 minutes
- DKAT-US schema types exported from core
- Dataset Properties API not available in DKAN 2.x

## Testing Strategy

Use actual DkanClient instances, spy on specific methods, test all states (loading, error, success, mutations). See individual package TESTING.md files for comprehensive patterns.

## Git Workflow

- Feature branches only (never commit to main)
- Concise commit messages
- Include Claude Code attribution in commit body (not subject)
- See CLAUDE.md for complete git workflow guidance
