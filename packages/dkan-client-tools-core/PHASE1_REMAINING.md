# Phase 1 Remaining Work: @param and @throws Cleanup

## Progress Summary

**Completed:**
- ✅ Class header consolidation: -150 lines
- ✅ Trivial getter simplification: -120 lines
- **Total so far: -270 lines**

**Remaining:**
- Remove redundant @param descriptions
- Remove generic @throws documentation
- **Estimated: -180 lines additional**

---

## Pattern Guide

### 1. Remove Redundant @param Descriptions

**Remove when:** Parameter name already describes what it is.

**Pattern to REMOVE:**
```typescript
@param identifier - Dataset identifier
@param identifier - Data dictionary identifier
@param schemaId - Schema identifier
@param planId - Harvest plan identifier
@param runId - Harvest run identifier
```

**Keep when:** Adds non-obvious information:
```typescript
@param options.showReferenceIds - Include internal reference IDs (distribution identifiers)
@param options.show_db_columns - Return DB column names instead of descriptions
@param method - HTTP method: POST (default) or GET
```

### 2. Remove Generic @throws Documentation

**Remove these patterns:**
```typescript
@throws {DkanApiError} If request fails
@throws {DkanApiError} If dataset not found or request fails
@throws {DkanApiError} If resource not found or request fails
@throws {DkanApiError} If harvest plan not found or request fails
```

**Keep specific @throws:**
```typescript
@throws {DkanApiError} Requires authentication with create_content permission
@throws {DkanApiError} Invalid SQL syntax in bracket notation
@throws {DkanApiError} Validation fails if required fields missing
```

---

## Methods Requiring Updates

### DkanApiClient (`src/api/client.ts`)

#### Dataset Operations
- [ ] `getDataset` (line ~173) - Remove `@param identifier`, remove generic @throws
- [ ] `searchDatasets` (line ~229) - Remove redundant @param for options.*, remove @throws
- [ ] `listAllDatasets` (line ~461) - Remove @throws
- [ ] `createDataset` (line ~748) - Keep specific @throws (auth required)
- [ ] `updateDataset` (line ~796) - Keep specific @throws (auth + validation)
- [ ] `patchDataset` (line ~840) - Keep specific @throws (auth required)
- [ ] `deleteDataset` (line ~883) - Keep specific @throws (auth required)

#### Datastore Operations
- [ ] `queryDatastore` (line ~284) - Remove `@param datasetId`, simplify options.*, remove generic @throws
- [ ] `queryDatastoreMulti` (line ~329) - Similar to queryDatastore
- [ ] `getDatastoreSchema` (line ~379) - Remove generic @throws
- [ ] `querySql` (line ~1224) - Keep detailed params (complex), remove generic @throws

#### Data Dictionary Operations
- [ ] `getDataDictionary` (line ~424) - Remove `@param identifier`, remove @throws
- [ ] `listDataDictionaries` (line ~398) - Remove @throws
- [ ] `getDataDictionaryFromUrl` (line ~440) - Remove @throws
- [ ] `createDataDictionary` (line ~1354) - Keep specific @throws (auth)
- [ ] `updateDataDictionary` (line ~1411) - Keep specific @throws (auth)
- [ ] `deleteDataDictionary` (line ~1527) - Keep specific @throws (auth)

#### Harvest Operations
- [ ] `listHarvestPlans` (line ~633) - Remove @throws
- [ ] `getHarvestPlan` (line ~650) - Remove `@param planId`, remove @throws
- [ ] `registerHarvestPlan` (line ~658) - Keep specific @throws (auth)
- [ ] `listHarvestRuns` (line ~687) - Remove `@param planId`, remove @throws
- [ ] `getHarvestRun` (line ~705) - Remove both @param, remove @throws
- [ ] `runHarvest` (line ~725) - Remove `@param planId`, keep specific @throws

#### Datastore Import Operations
- [ ] `listDatastoreImports` (line ~915) - Remove @throws
- [ ] `getDatastoreStatistics` (line ~929) - Remove `@param identifier`, remove @throws
- [ ] `triggerDatastoreImport` (line ~948) - Keep specific @throws (auth)
- [ ] `deleteDatastore` (line ~966) - Keep specific @throws (auth)

#### Metastore Operations
- [ ] `listSchemas` (line ~496) - Remove @throws
- [ ] `getSchema` (line ~518) - Remove `@param schemaId`, remove @throws
- [ ] `getSchemaItems` (line ~537) - Remove `@param schemaId`, remove @throws
- [ ] `getDatasetFacets` (line ~570) - Remove @throws

#### Revision/Moderation Operations
- [ ] `getRevisions` (line ~983) - Remove `@param identifier`, remove @throws
- [ ] `getRevision` (line ~1001) - Remove both @param, remove @throws
- [ ] `createRevision` (line ~1020) - Keep specific @throws (auth)
- [ ] `changeDatasetState` (line ~1072) - Remove `@param identifier`, keep specific @throws

### DkanClient (`src/client/dkanClient.ts`)

#### Dataset Operations
- [ ] `fetchDataset` (line ~115) - Remove `@param identifier`, remove @throws
- [ ] `searchDatasets` (line ~138) - Remove @throws
- [ ] `listAllDatasets` (line ~152) - Remove @throws

#### Datastore Operations
- [ ] `queryDatastore` (line ~166) - Remove `@param datasetId`, remove @throws
- [ ] `queryDatastoreMulti` (line ~180) - Similar pattern
- [ ] `getDatastoreSchema` (line ~194) - Remove @throws
- [ ] `querySql` (line ~208) - Remove @throws

#### Data Dictionary Operations
- [ ] `fetchDataDictionary` (line ~222) - Remove `@param identifier`, remove @throws
- [ ] `listDataDictionaries` (line ~236) - Remove @throws

#### Cache Management
- [ ] `prefetchQuery` (line ~388) - Keep params (non-obvious)
- [ ] `invalidateQueries` (line ~412) - Keep as-is
- [ ] `removeQueries` (line ~457) - Keep as-is

#### Harvest Operations (if present in DkanClient)
- Apply same pattern as DkanApiClient

---

## Example Edits

### Before:
```typescript
/**
 * Fetch a single dataset by identifier
 *
 * @param identifier - Dataset identifier
 * @param options - Optional parameters
 * @param options.showReferenceIds - Include internal reference IDs (distribution identifiers)
 * @returns Dataset metadata
 * @throws {DkanApiError} If dataset not found or request fails
 *
 * @example
 * ```typescript
 * const dataset = await client.getDataset('abc-123', { showReferenceIds: true })
 * ```
 */
```

### After:
```typescript
/**
 * Fetch a single dataset by identifier
 *
 * @param options.showReferenceIds - Include internal reference IDs (distribution identifiers)
 * @returns Dataset metadata
 *
 * @example
 * ```typescript
 * const dataset = await client.getDataset('abc-123', { showReferenceIds: true })
 * ```
 */
```

**Changes:**
- ✅ Removed `@param identifier - Dataset identifier` (redundant)
- ✅ Removed `@param options - Optional parameters` (obvious from signature)
- ✅ Kept `@param options.showReferenceIds` (adds value)
- ✅ Removed generic @throws

---

## Automation Approach

For remaining work, use search-and-replace patterns:

### Pattern 1: Simple identifier params
```bash
# Find
@param identifier - Dataset identifier\n

# Replace with empty line
```

### Pattern 2: Generic throws
```bash
# Find
@throws {DkanApiError} If .* (not found or )?request fails\n

# Replace with empty line
```

### Pattern 3: Options param
```bash
# Find
@param options - Optional parameters\n

# Replace with empty line
```

---

## Estimated Impact

**By method category:**
- Dataset operations (7 methods): ~35 lines
- Datastore operations (6 methods): ~30 lines
- Data Dictionary (6 methods): ~30 lines
- Harvest (6 methods): ~30 lines
- Datastore imports (4 methods): ~20 lines
- Metastore (4 methods): ~20 lines
- Revisions (4 methods): ~20 lines

**Total estimated reduction: ~185 lines**

**Combined Phase 1 total: ~455 lines (11,400 tokens saved)**

---

## Next Steps

1. Review this pattern guide
2. Either:
   - Manual edits using pattern guide as reference
   - Automated script using search-replace patterns
   - Continue with Claude Code doing individual edits
3. Run tests after completion
4. Commit final Phase 1 changes
5. Create PR for Phase 1

---

## Quality Checklist

After completion, verify:
- [ ] No redundant @param that just restate parameter names
- [ ] No generic @throws patterns
- [ ] Specific @throws kept (auth, validation, syntax errors)
- [ ] Complex @param with value-add information kept
- [ ] All tests still pass
- [ ] TypeScript compiles without errors
- [ ] JSDoc renders correctly in IDE hover
