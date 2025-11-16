# Phase 2: Method Documentation Optimization - Implementation Plan

**Status**: Ready to Execute
**Branch**: Will create `docs/phase-2-method-optimization`
**Prerequisites**: Phase 1 complete on `docs/phase-1-consolidate-jsdoc`

**Total Estimated Reduction**: ~739 lines (~18,500 tokens)
**Completion Time**: 2-3 hours of focused work

---

## Overview

Phase 2 consists of two GitHub issues:
- **Issue #71**: Extract complex examples to external docs (~159 line reduction)
- **Issue #70**: Simplify method JSDoc patterns (~580 line reduction)

**Critical**: Execute Issue #71 BEFORE Issue #70 to prevent loss of tutorial content.

---

## Issue #71: Extract Complex Examples to External Docs

**Goal**: Move tutorial-level content from JSDoc to external documentation files.
**Target Reduction**: ~159 lines
**Files Modified**:
- `packages/dkan-client-tools-core/src/api/client.ts`
- `docs/external/platforms/DKAN_API.md`
- `docs/external/standards/DATA_STANDARDS.md`

### Task 1: Extract querySql Tutorial

**Method**: `querySql()` in `src/api/client.ts` (lines 1184-1287)
**Current JSDoc**: 103 lines with extensive tutorial content

**Extract to**: `docs/external/platforms/DKAN_API.md`
- Location: After line 1269 (current SQL section)
- New section title: "### SQL Query Syntax (Bracket Notation) - Complete Guide"

**Content to Move**:
- Bracket syntax requirements and rules
- Getting distribution identifiers
- Pagination patterns (`page` and `page-size`)
- `show_db_columns` parameter explanation
- All 4 current examples

**Keep in JSDoc**:
```typescript
/**
 * Execute SQL query using DKAN bracket syntax.
 *
 * Format: `[SELECT cols FROM dist-id][WHERE cond][ORDER BY field ASC][LIMIT n];`
 *
 * @param options.query - SQL in bracket syntax
 * @param options.show_db_columns - Return DB column names instead of descriptions
 * @returns Query results
 *
 * @example
 * ```typescript
 * const results = await client.querySql({
 *   query: '[SELECT * FROM dist-123][LIMIT 10];'
 * })
 * ```
 *
 * @see docs/external/platforms/DKAN_API.md#sql-query-syntax-bracket-notation
 */
```

**Estimated Reduction**: ~78 lines

---

### Task 2: Extract Data Dictionary Examples

**Methods**:
- `createDataDictionary()` (lines 1323-1381) - 58 lines
- `updateDataDictionary()` (lines 1395-1440) - 45 lines

**Extract to**: `docs/external/standards/DATA_STANDARDS.md`
- Location: After line 522 (current Foreign Keys section)
- New section title: "### Creating and Updating Data Dictionaries"

**Content to Move**:
- Complete Frictionless table schema structure
- Field type examples (string, number, date, etc.)
- Constraint examples (required, unique, enum, etc.)
- Full water quality monitoring example (3 fields)
- Update patterns and best practices

**Keep in JSDoc** (createDataDictionary):
```typescript
/**
 * Create a new data dictionary.
 *
 * @param dictionary.identifier - Unique identifier for the dictionary
 * @param dictionary.data - Frictionless table schema
 * @returns Metastore write response with identifier
 * @throws {DkanApiError} Requires authentication with create permissions
 *
 * @example
 * ```typescript
 * await client.createDataDictionary({
 *   identifier: 'dict-id',
 *   data: {
 *     fields: [{ name: 'temperature', type: 'number', title: 'Water Temperature' }]
 *   }
 * })
 * ```
 *
 * @see docs/external/standards/DATA_STANDARDS.md#creating-and-updating-data-dictionaries
 */
```

**Estimated Reduction**: ~63 lines (38 + 25)

---

### Task 3: Consolidate Duplicate Examples

**Method 1**: `getOpenApiDocsUrl()` (lines 1466-1492)
- Currently has 2 examples (Swagger UI, Fetch spec)
- Keep only Swagger UI example
- **Reduction**: ~10 lines

**Method 2**: `patchDataset()` (lines 800-831)
- Currently has 2 examples (Update description, Add keywords)
- Consolidate into single example showing both operations
- **Reduction**: ~8 lines

---

## Issue #70: Simplify Method JSDoc Patterns

**Goal**: Use `@inheritdoc` for DkanClient wrapper methods to eliminate documentation duplication.
**Target Reduction**: ~580 lines
**File Modified**: `packages/dkan-client-tools-core/src/client/dkanClient.ts`

### Task 4: Apply @inheritdoc Pattern to 37 Wrapper Methods

**Current Pattern** (average 18 lines per method):
```typescript
/**
 * Fetch a single dataset by identifier.
 *
 * Retrieves complete dataset metadata from the metastore. Returns a DCAT-US
 * compliant dataset object with title, description, distributions, and more.
 *
 * **Note**: This method bypasses caching. For automatic caching in React/Vue,
 * use the `useDataset` hook/composable instead.
 *
 * @param identifier - Dataset identifier (UUID or custom ID)
 * @returns Complete dataset metadata
 * @throws {DkanApiError} If dataset not found or request fails
 *
 * @example
 * ```typescript
 * const dataset = await dkanClient.fetchDataset('abc-123')
 * console.log(dataset.title)
 * console.log(dataset.distribution)
 * ```
 */
async fetchDataset(identifier: string) {
  return this.apiClient.getDataset(identifier)
}
```

**New Pattern** (3 lines per method):
```typescript
/**
 * @inheritdoc DkanApiClient.getDataset
 *
 * **Note**: Bypasses caching. Use framework hooks for automatic caching.
 */
async fetchDataset(identifier: string) {
  return this.apiClient.getDataset(identifier)
}
```

### All 37 Methods to Update

**Dataset Operations** (7 methods):
1. `fetchDataset` → `@inheritdoc DkanApiClient.getDataset`
2. `searchDatasets` → `@inheritdoc DkanApiClient.searchDatasets`
3. `listAllDatasets` → `@inheritdoc DkanApiClient.listAllDatasets`
4. `createDataset` → `@inheritdoc DkanApiClient.createDataset`
5. `updateDataset` → `@inheritdoc DkanApiClient.updateDataset`
6. `patchDataset` → `@inheritdoc DkanApiClient.patchDataset`
7. `deleteDataset` → `@inheritdoc DkanApiClient.deleteDataset`

**Datastore Operations** (6 methods):
8. `queryDatastore` → `@inheritdoc DkanApiClient.queryDatastore`
9. `queryDatastoreMulti` → `@inheritdoc DkanApiClient.queryDatastoreMulti`
10. `getDatastoreSchema` → `@inheritdoc DkanApiClient.getDatastoreSchema`
11. `querySql` → `@inheritdoc DkanApiClient.querySql`
12. `downloadQuery` → `@inheritdoc DkanApiClient.downloadQuery`
13. `downloadQueryByDistribution` → `@inheritdoc DkanApiClient.downloadQueryByDistribution`

**Data Dictionary Operations** (3 methods):
14. `listDataDictionaries` → `@inheritdoc DkanApiClient.listDataDictionaries`
15. `getDataDictionary` → `@inheritdoc DkanApiClient.getDataDictionary`
16. `getDataDictionaryFromUrl` → `@inheritdoc DkanApiClient.getDataDictionaryFromUrl`

**Metastore Operations** (4 methods):
17. `listSchemas` → `@inheritdoc DkanApiClient.listSchemas`
18. `getSchema` → `@inheritdoc DkanApiClient.getSchema`
19. `getSchemaItems` → `@inheritdoc DkanApiClient.getSchemaItems`
20. `getDatasetFacets` → `@inheritdoc DkanApiClient.getDatasetFacets`

**Harvest Operations** (6 methods):
21. `listHarvestPlans` → `@inheritdoc DkanApiClient.listHarvestPlans`
22. `getHarvestPlan` → `@inheritdoc DkanApiClient.getHarvestPlan`
23. `registerHarvestPlan` → `@inheritdoc DkanApiClient.registerHarvestPlan`
24. `listHarvestRuns` → `@inheritdoc DkanApiClient.listHarvestRuns`
25. `getHarvestRun` → `@inheritdoc DkanApiClient.getHarvestRun`
26. `runHarvest` → `@inheritdoc DkanApiClient.runHarvest`

**Datastore Import Operations** (2 methods):
27. `listDatastoreImports` → `@inheritdoc DkanApiClient.listDatastoreImports`
28. `getDatastoreStatistics` → `@inheritdoc DkanApiClient.getDatastoreStatistics`

**Revision/Moderation Operations** (4 methods):
29. `getRevisions` → `@inheritdoc DkanApiClient.getRevisions`
30. `getRevision` → `@inheritdoc DkanApiClient.getRevision`
31. `publishDataset` → `@inheritdoc DkanApiClient.changeDatasetState` (with note about state='published')
32. `unpublishDataset` → `@inheritdoc DkanApiClient.changeDatasetState` (with note about state='draft')

**Additional Operations** (5 methods):
33. `archiveDataset` → `@inheritdoc DkanApiClient.changeDatasetState` (with note about state='archived')
34. `unarchiveDataset` → `@inheritdoc DkanApiClient.changeDatasetState` (with note about state='published')
35. `queryDatastoreByUrl` → `@inheritdoc DkanApiClient.queryDatastore` (with note about URL conversion)
36. `downloadDistribution` → `@inheritdoc DkanApiClient.downloadQueryByDistribution`
37. `getDatastoreImport` → `@inheritdoc DkanApiClient.getDatastoreStatistics`

**Estimated Reduction**: ~580 lines (37 methods × ~15 lines saved per method)

---

## External Documentation Structure

### DKAN_API.md Additions

**Current size**: 2,463 lines
**New section location**: After line 1269

```markdown
### SQL Query Syntax (Bracket Notation) - Complete Guide

The DKAN datastore SQL endpoint uses a bracket notation syntax for queries.

#### Syntax Format

```
[SELECT column1, column2 FROM {distribution-id}][WHERE condition][ORDER BY field ASC|DESC][LIMIT n];
```

#### Rules

1. **No spaces** within bracket sections
2. Use **double quotes** for string values
3. **Semicolon required** at end
4. Distribution ID must be in curly braces `{uuid}`

#### Getting Distribution Identifiers

```typescript
// Method 1: From dataset metadata with showReferenceIds
const dataset = await client.getDataset('dataset-id', { showReferenceIds: true })
const distId = dataset.distribution[0].identifier

// Method 2: From datastore query response
const result = await client.queryDatastore('dataset-id', 0)
const distId = result.schema.identifier
```

#### Pagination

Use `page` and `page-size` in query options:

```typescript
const results = await client.querySql({
  query: '[SELECT * FROM {dist-id}];',
  page: 2,
  pageSize: 50
})
```

#### show_db_columns Parameter

- `true`: Returns database column names (e.g., `field_1`, `field_2`)
- `false` (default): Returns field titles from data dictionary

#### Examples

**Basic Query**:
```typescript
const results = await client.querySql({
  query: '[SELECT * FROM {abc-123}][LIMIT 10];'
})
```

**Filtered Query**:
```typescript
const results = await client.querySql({
  query: '[SELECT site_name, temperature FROM {abc-123}][WHERE temperature > 20][ORDER BY temperature DESC];'
})
```

**With DB Columns**:
```typescript
const results = await client.querySql({
  query: '[SELECT * FROM {abc-123}];',
  show_db_columns: true
})
```

**Paginated Query**:
```typescript
const results = await client.querySql({
  query: '[SELECT * FROM {abc-123}];',
  page: 1,
  pageSize: 100
})
```

#### Error Handling

Common errors:
- Invalid syntax: Missing semicolon, spaces in brackets
- Distribution not found: Check distribution ID
- Invalid column names: Verify field names in schema
```

**Projected size**: 2,543 lines (+80)

---

### DATA_STANDARDS.md Additions

**Current size**: 898 lines
**New section location**: After line 522

```markdown
### Creating and Updating Data Dictionaries

Data dictionaries in DKAN use the Frictionless Data Table Schema format to define column schemas and constraints for dataset distributions.

#### Schema Structure

```typescript
interface DataDictionary {
  identifier: string          // Unique ID for the dictionary
  data: {
    fields: SchemaField[]    // Array of field definitions
    missingValues?: string[] // Values to treat as null
    primaryKey?: string[]    // Primary key field(s)
    foreignKeys?: ForeignKey[] // Foreign key relationships
  }
}
```

#### Field Types

Supported types from Frictionless spec:
- `string` - Text data
- `number` - Numeric (integer or decimal)
- `integer` - Whole numbers only
- `boolean` - true/false
- `date` - ISO 8601 date (YYYY-MM-DD)
- `datetime` - ISO 8601 datetime
- `time` - ISO 8601 time
- `year` - Four-digit year
- `yearmonth` - YYYY-MM format
- `duration` - ISO 8601 duration
- `geopoint` - Lat/long coordinates
- `geojson` - GeoJSON geometry
- `object` - JSON object
- `array` - JSON array
- `any` - No type constraint

#### Field Constraints

```typescript
interface SchemaField {
  name: string              // Database column name (required)
  title?: string           // Human-readable label
  type?: string            // Field type (default: 'string')
  format?: string          // Format specification
  description?: string     // Field description
  constraints?: {
    required?: boolean     // Cannot be null/missing
    unique?: boolean       // Values must be unique
    enum?: string[]        // Allowed values only
    minimum?: number       // Min value (numbers)
    maximum?: number       // Max value (numbers)
    minLength?: number     // Min length (strings)
    maxLength?: number     // Max length (strings)
    pattern?: string       // Regex pattern (strings)
  }
}
```

#### Complete Example: Water Quality Monitoring

```typescript
await client.createDataDictionary({
  identifier: 'water-quality-dict',
  data: {
    fields: [
      {
        name: 'site_name',
        title: 'Monitoring Site',
        type: 'string',
        description: 'Name of the water quality monitoring location',
        constraints: {
          required: true,
          maxLength: 100
        }
      },
      {
        name: 'sample_date',
        title: 'Sample Date',
        type: 'date',
        format: 'default',
        description: 'Date when water sample was collected',
        constraints: {
          required: true
        }
      },
      {
        name: 'temperature',
        title: 'Water Temperature',
        type: 'number',
        description: 'Temperature in degrees Celsius',
        constraints: {
          minimum: 0,
          maximum: 50
        }
      },
      {
        name: 'ph_level',
        title: 'pH Level',
        type: 'number',
        description: 'pH measurement (0-14 scale)',
        constraints: {
          minimum: 0,
          maximum: 14
        }
      },
      {
        name: 'quality_rating',
        title: 'Water Quality Rating',
        type: 'string',
        constraints: {
          enum: ['Excellent', 'Good', 'Fair', 'Poor']
        }
      }
    ],
    primaryKey: ['site_name', 'sample_date']
  }
})
```

#### Updating Data Dictionaries

```typescript
// Update entire dictionary
await client.updateDataDictionary('water-quality-dict', {
  identifier: 'water-quality-dict',
  data: {
    fields: [
      // Updated field definitions...
    ]
  }
})

// Common update patterns:
// - Add new fields to fields array
// - Modify constraints on existing fields
// - Update field titles/descriptions
// - Change field types (with caution - may affect existing data)
```

#### Best Practices

1. **Field Names**: Use lowercase with underscores (snake_case)
2. **Required Fields**: Mark essential fields as required
3. **Constraints**: Add appropriate constraints for data validation
4. **Descriptions**: Provide clear descriptions for all fields
5. **Types**: Choose specific types over generic 'string' when possible
6. **Updates**: Test dictionary changes on sample data first
7. **Primary Keys**: Define primary keys for unique record identification

#### Integration with Distributions

Data dictionaries are linked to distributions via the `describedBy` property:

```typescript
{
  distribution: [{
    "@type": "dcat:Distribution",
    "identifier": "dist-123",
    "describedBy": "https://data.example.com/api/1/metastore/schemas/data-dictionary/items/water-quality-dict"
  }]
}
```

When a distribution has a `describedBy`, DKAN uses that dictionary for:
- Column headers in datastore queries
- Data validation during imports
- API response formatting
```

**Projected size**: 963 lines (+65)

---

## Execution Workflow

### Step 1: Create Branch
```bash
git checkout docs/phase-1-consolidate-jsdoc
git checkout -b docs/phase-2-method-optimization
```

### Step 2: Execute Issue #71 (Extract Examples)

**2.1. Update DKAN_API.md**
- Add SQL query syntax guide after line 1269
- Include all bracket syntax rules and examples

**2.2. Update DATA_STANDARDS.md**
- Add data dictionary guide after line 522
- Include complete field types and constraint examples

**2.3. Simplify querySql() JSDoc**
- Reduce to brief description + minimal example + @see tag
- Test: Verify JSDoc renders correctly in IDE

**2.4. Simplify createDataDictionary() and updateDataDictionary() JSDoc**
- Reduce to minimal examples + @see tags
- Test: Verify JSDoc renders correctly

**2.5. Remove duplicate examples**
- `getOpenApiDocsUrl()`: Keep 1 example
- `patchDataset()`: Consolidate to 1 example

**2.6. Commit Issue #71**
```bash
git add -A
git commit -m "docs(core): extract complex examples to external docs

Extract tutorial content from JSDoc to external documentation.

Changes:
- Move querySql bracket syntax guide to DKAN_API.md
- Move data dictionary examples to DATA_STANDARDS.md
- Simplify verbose method JSDoc
- Add @see references to external docs

Reduction: ~159 lines

Related: Issue #71"
```

**2.7. Run tests**
```bash
npm test
npm run typecheck
```

### Step 3: Execute Issue #70 (Apply @inheritdoc)

**3.1. Apply pattern to all 37 DkanClient wrapper methods**
- Use consistent 3-line format
- Keep "Bypasses caching" note on all

**3.2. Verify @inheritdoc references**
- Ensure all referenced methods exist in DkanApiClient
- Test TypeDoc generation

**3.3. Commit Issue #70**
```bash
git add -A
git commit -m "docs(core): simplify wrapper methods with @inheritdoc

Use @inheritdoc for all DkanClient wrapper methods to eliminate duplication.

Changes:
- Apply @inheritdoc pattern to 37 wrapper methods
- Reduce average JSDoc from 18 → 3 lines per method
- Maintain caching bypass note

Reduction: ~580 lines (66% of file)

Related: Issue #70"
```

**3.4. Run tests**
```bash
npm test
npm run typecheck
```

### Step 4: Final Verification

**4.1. Generate TypeDoc**
```bash
npm run docs:generate  # If available
```

**4.2. Manual verification**
- Check IDE hover documentation
- Verify @inheritdoc resolves correctly
- Confirm @see links are accurate

**4.3. Create Phase 2 summary**
```bash
# Create PHASE2_COMPLETE.md with results
git add PHASE2_COMPLETE.md
git commit -m "docs(core): Phase 2 complete - summary"
```

### Step 5: Merge
```bash
# Update issues
# Create PR from docs/phase-2-method-optimization
# After review, merge to main
```

---

## Success Criteria Checklist

- [ ] querySql tutorial moved to DKAN_API.md with complete guide
- [ ] Data dictionary examples moved to DATA_STANDARDS.md with full reference
- [ ] All JSDoc includes @see references where applicable
- [ ] All 37 DkanClient wrapper methods use @inheritdoc
- [ ] All 225 tests still pass
- [ ] TypeScript compiles without errors
- [ ] No functionality changes - documentation only
- [ ] TypeDoc generates complete docs (if tested)
- [ ] Net reduction of ~739 lines achieved
- [ ] External docs are comprehensive and well-organized

---

## Projected Impact

### File Size Changes

**Before Phase 2**:
- `api/client.ts`: 1,497 lines
- `dkanClient.ts`: 884 lines
- `DKAN_API.md`: 2,463 lines
- `DATA_STANDARDS.md`: 898 lines

**After Phase 2**:
- `api/client.ts`: 1,338 lines (-11%)
- `dkanClient.ts`: 304 lines (-66%)
- `DKAN_API.md`: 2,543 lines (+3%)
- `DATA_STANDARDS.md`: 963 lines (+7%)

**Net reduction**: 739 lines (external docs grow by 145, code shrinks by 884)

### Token Savings

**Phase 2**: ~18,500 tokens saved
**Phase 1 + 2 Combined**: ~26,500 tokens saved
**Percentage of total**: ~25% documentation reduction

### Quality Improvements

- Tutorial content in proper location (external docs)
- No duplication between wrapper and wrapped methods
- Better organization for AI consumption
- External docs more comprehensive
- Code files more focused

---

## Risk Assessment

**Low Risk**:
- Documentation-only changes
- No functional code changes
- @inheritdoc is standard TypeScript/JSDoc
- All patterns tested in Phase 1

**Mitigation**:
- Run full test suite after each commit
- Verify TypeScript compilation
- Check IDE documentation rendering
- Can easily revert if issues arise

---

## Dependencies

**Required**:
- Phase 1 complete (branch: `docs/phase-1-consolidate-jsdoc`)
- All Phase 1 tests passing
- TypeScript 4.5+ (for @inheritdoc support)

**Nice to Have**:
- TypeDoc for verification (optional)
- IDE with JSDoc hover support for manual testing

---

## Timeline Estimate

**Issue #71**: 1-1.5 hours
- 30 min: Create external doc sections
- 20 min: Simplify querySql
- 15 min: Simplify data dictionary methods
- 10 min: Remove duplicate examples
- 15 min: Testing and commit

**Issue #70**: 1-1.5 hours
- 45 min: Apply @inheritdoc to 37 methods
- 15 min: Verify all references
- 20 min: Testing and commit

**Total**: 2-3 hours of focused work

---

## Notes for Resume After Compact

1. Start by checking out the Phase 1 branch
2. Create new Phase 2 branch
3. Execute Issue #71 first (extract examples)
4. Then execute Issue #70 (@inheritdoc)
5. Run full test suite between each commit
6. Create completion summary similar to Phase 1

**Current Status**: Plan complete, ready to execute
**Next Action**: Create branch and begin Task 1 (querySql extraction)
