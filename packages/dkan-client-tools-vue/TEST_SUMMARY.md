# Vue Test Suite Summary

Comprehensive unit tests for all Vue composables using Vue 3 Composition API, Vue Test Utils, and Vitest.

**Stats**: 15 test files, 100 tests, ~2,864 lines

## Test Files

| File | Tests | Coverage |
|------|-------|----------|
| useDataset.test.ts | 9 | Data fetch, errors, enabled option, caching, reactive params |
| useDatasetSearch.test.ts | 9 | Search, filtering, errors, enabled, dynamic options, caching |
| useDatasetMutations.test.ts | 11 | Create/update/patch/delete datasets with callbacks |
| useDatastore.test.ts | 10 | Queries, index-specific, options, errors, caching |
| useSqlQuery.test.ts | 12 | SQL execution, aggregates, enabled, errors, show_db_columns |
| useDataDictionary.test.ts | 6 | Fetch dictionary, list, from URL, schema |
| useDataDictionaryMutations.test.ts | 4 | Create/update/delete dictionaries |
| useHarvest.test.ts | 4 | Plans, runs, register, trigger |
| useDatastoreImports.test.ts | 5 | List/get imports, statistics, trigger, delete |
| useMetastore.test.ts | 4 | All datasets, schemas, schema items, facets |
| useDatasetProperties.test.ts | 3 | Properties, values, all with values |
| useRevisions.test.ts | 4 | List/get revisions, create, change state |
| useQueryDownload.test.ts | 3 | Download query results, by distribution |
| useQueryDatastoreMulti.test.ts | 8 | Multi-resource queries, JOINs, methods |
| plugin.test.ts | 2 | Plugin setup and configuration |

## Testing Patterns

- **Actual DkanClient instances** with `vi.spyOn()` for method mocking
- **Vue Test Utils** with `defineComponent()` and `mount()`
- **Reactive parameters** using `ref()` and `computed()`
- **Mutation testing** with TanStack Query mutation objects
- **Async assertions** with `vi.waitFor()`

## Coverage

All tests cover loading/success/error states, query options, mutations, callbacks, reactive parameters, caching, and edge cases.

## Comparison with React Tests

Vue tests are more concise (100 tests vs ~218, ~2,864 lines vs ~8,258) while maintaining equivalent comprehensive coverage. Key differences: Vue's `h()` render function vs JSX, `ref()`/`computed()` vs useState/hooks, Vue Test Utils vs React Testing Library.

## Running Tests

```bash
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm test useDataset.test.ts   # Run specific file
npm run typecheck             # Type checking
```
