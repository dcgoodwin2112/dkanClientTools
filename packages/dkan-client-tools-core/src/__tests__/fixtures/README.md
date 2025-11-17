# API Response Fixtures

Recorded API responses from live DKAN instance for integration testing. Generated via `scripts/record-api-responses.ts` against local DKAN 2.x.

## Files

- `summary.json` - Recording summary with metadata
- `dataset-operations.json`, `datastore-operations.json`, `data-dictionary.json`, `harvest.json`, `datastore-imports.json`, `metastore.json`, `revisions.json`, `utility.json`, `openapi.json` - API operation fixtures

## Coverage

**Recorded (12/45)**: Dataset operations (3), data dictionaries (1), harvest (3), metastore (3), revisions (1), OpenAPI (1)

**Skipped (21)**: Mutations in read-only mode (12), missing test data (6), datastore operations requiring imports (3)

**Errors (12)**: Datastore operations (4 - not imported), datastore imports endpoint (1 - 404), dataset properties API (3 - not in DKAN 2.21.2)

## Recording Details

Source: DKAN 2.x (http://dkan.ddev.site), Date: 2025-11-12, Mode: Read-only, Success: 12/45 (26.7%)

## Regenerating Fixtures

```bash
# Read-only (public endpoints)
DKAN_URL=http://dkan.ddev.site npm run record:api:readonly

# Read-only with auth (includes harvest, revisions)
DKAN_URL=http://dkan.ddev.site DKAN_USER=admin DKAN_PASS=admin npm run record:api:readonly

# Full mode with mutations (creates/deletes test resources)
DKAN_URL=http://dkan.ddev.site DKAN_USER=admin DKAN_PASS=admin npm run record:api

# Manual cleanup only
CLEANUP_ONLY=true DKAN_USER=admin DKAN_PASS=admin npm run record:api
```

Automatic cleanup: Pre/post-cleanup removes orphaned resources, uses UUID prefixes (`test-recorder-{uuid}`, `test-dict-{uuid}`).

## Using Fixtures

```typescript
import fixtures from './__tests__/fixtures/dataset-operations.json'
const response = fixtures.find(f => f.method === 'getDataset')
expect(actualResponse).toEqual(response.response)
```

## Capturing Remaining APIs

1. Import CSV data to test datastore operations
2. Execute harvest runs for harvest run APIs
3. Enable dataset properties endpoint if available
4. Run full mode for mutation operations
