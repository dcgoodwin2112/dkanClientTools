# DKAN API Research - Complete Documentation Index

## Overview

This directory contains comprehensive research on DKAN's REST API capabilities and analysis of what has been implemented in the dkanClientTools React client library.

## Files in This Research

### 1. DKAN_API_RESEARCH.md (Primary Reference - 34KB)
**Complete DKAN API documentation**

- Full API endpoints for DKAN 2.x and 7.x-1.x
- Modern vs. Legacy API patterns
- CKAN-compatible endpoints for harvesting
- Dataset object structure (DCAT-US schema)
- Query parameters and filtering options
- Authentication methods
- Response formats and error handling
- Common API patterns with code examples
- Best practices and limitations
- Excellent for understanding DKAN's capabilities

**Use this file when:**
- You need to understand DKAN API capabilities
- You want implementation examples
- You need to understand DCAT-US schema
- You're implementing new features

### 2. DKAN_API_GAP_ANALYSIS.md (Implementation Guide - 17KB)
**Gap analysis between available APIs and current implementation**

- Current implementation status (18/42 endpoints implemented)
- Detailed breakdown of missing APIs
- Implementation priority roadmap
- Type definitions needed
- React hooks that should be added
- Code examples for missing APIs
- Summary table of all endpoints

**Use this file when:**
- You're deciding what to implement next
- You want to understand implementation priorities
- You need type definitions for new features
- You want code examples for new APIs

### 3. This File (API_RESEARCH_INDEX.md)
Navigation and summary of research findings

## Quick Reference: What We Have vs. What We're Missing

### Implemented (18 endpoints)
```
COMPLETE:
✓ Dataset search and retrieval
✓ Datastore querying with filters
✓ Data dictionary lookups
✓ Metastore schema operations
✓ CKAN compatibility endpoints
✓ Basic authentication

PARTIAL:
✓ Dataset read operations (but no create/update/delete)
✓ Data dictionary read only (no write operations)
```

### Missing (24 endpoints)
```
CRITICAL (Phase 1):
✗ Harvest API (9 endpoints) - Data ingestion
✗ Dataset CRUD (4 endpoints) - Write operations
✗ Datastore Imports (5 endpoints) - File uploads
✗ Revisions/Moderation (4 endpoints) - Workflow

IMPORTANT (Phase 2):
✗ Query Download (3 endpoints) - Export data
✗ SQL Endpoint (2 endpoints) - Advanced queries
✗ Dictionary CRUD (3 endpoints) - Schema management

NICE-TO-HAVE (Phase 3):
✗ data.json endpoint - Federal compliance
✗ Alternate APIs - Custom permissions
✗ Documentation endpoint - Auto-generated docs
```

## Implementation Statistics

| Metric | Value |
|--------|-------|
| Total Endpoints Found | 42+ |
| Currently Implemented | 18 (43%) |
| Missing/Not Implemented | 24 (57%) |
| Critical Missing | 9 (Harvest API alone) |
| Authentication Methods Supported | 4 (Basic, Token, Cookie, Anonymous) |
| Response Formats | 1 (JSON) |
| API Versions Supported | 2 (2.x, 7.x-1.x) |

## Implementation Priority

### Phase 1: High Priority (Weeks 1-3)
**Core Data Management - Enables full dataset lifecycle**

1. **Harvest API** (9 endpoints)
   - Data ingestion from external sources
   - Most critical missing feature
   - Foundation for enterprise usage

2. **Dataset CRUD** (4 endpoints)
   - Create, update, delete datasets
   - Complements existing read operations
   - Medium effort, high value

3. **Datastore Imports** (5 endpoints)
   - CSV/file uploads
   - Import job management
   - Progress tracking

4. **Revisions/Moderation** (4 endpoints)
   - Dataset workflow management
   - Publishing state control
   - Change history

### Phase 2: Medium Priority (Weeks 4-5)
**Advanced Features - Analysis and Export**

1. **Query Download** (3 endpoints)
   - Export filtered results
   - CSV/JSON export
   - Good UX for data users

2. **SQL Endpoint** (2 endpoints)
   - Advanced SQL queries
   - Complex joins and aggregations

3. **Dictionary CRUD** (3 endpoints)
   - Schema management
   - Field definition updates

### Phase 3: Lower Priority (Weeks 6+)
**Integration & Compliance**

1. **data.json** (1 endpoint)
   - Federal data.gov compliance
   - Bulk catalog export

2. **Alternate APIs** (4 endpoints)
   - Custom permission paths
   - Special use cases

3. **Documentation** (1 endpoint)
   - Auto-generated docs

## Key Findings

### Strengths
- DKAN has comprehensive REST API coverage
- Well-structured DCAT-US compliant schema
- Modern (2.x) API is cleaner than legacy
- Good authentication and permission system
- Solid error handling infrastructure

### Gaps
- No data ingestion (Harvest) in client
- Read-only on most write operations
- Limited export/download capabilities
- No direct SQL interface
- Missing workflow management

### Recommendations
1. **Start with Harvest** - Most impactful missing feature
2. **Add Dataset CRUD** - Essential for full data management
3. **Implement Imports** - Critical for bulk data operations
4. **Add Downloads** - Users expect export functionality
5. **Consider SQL** - Advanced users need it but has security concerns

## Related Documentation

### DKAN Official Documentation
- Main: https://dkan.readthedocs.io/en/latest/
- API Examples: https://dkan.readthedocs.io/en/latest/user-guide/guide_api.html
- Harvest Guide: https://dkan.readthedocs.io/en/latest/user-guide/guide_harvest.html

### Standards & Schemas
- DCAT-US: https://resources.data.gov/resources/dcat-us/
- Project Open Data: https://resources.data.gov/resources/podm-field-mapping/
- Frictionless Data: https://frictionlessdata.io/

## Code Structure

Current implementation location:
```
/packages/dkan-client-tools-core/src/
  ├── api/
  │   └── client.ts           # DkanApiClient - HTTP layer
  ├── client/
  │   └── dkanClient.ts       # DkanClient - Orchestrator
  ├── types.ts                # TypeScript interfaces
  └── index.ts                # Exports

/packages/dkan-client-tools-react/src/
  ├── useDataset.ts           # React hook
  ├── useDatasetSearch.ts
  ├── useDatastore.ts
  ├── useDataDictionary.ts
  ├── useMetastore.ts
  └── DkanClientProvider.tsx  # Provider component
```

## How to Use This Research

### For Backend Developers
1. Read `DKAN_API_RESEARCH.md` sections 1-2 for API structure
2. Check `DKAN_API_GAP_ANALYSIS.md` section 8 for code examples
3. Review type definitions needed in section 6

### For Frontend Developers
1. Review `DKAN_API_GAP_ANALYSIS.md` section 7 for React hooks
2. Check current implementation in `packages/dkan-client-tools-react`
3. Use code examples from research files

### For Project Managers
1. Check the summary statistics above
2. Review the Priority Roadmap section
3. Reference the 3-phase implementation plan

### For Integration Work
1. Check authentication methods in `DKAN_API_RESEARCH.md` section 4
2. Review response formats in section 6
3. Check error handling in `DKAN_API_GAP_ANALYSIS.md` section 5

## Version Info

| Item | Value |
|------|-------|
| Research Date | 2025-11-07 |
| DKAN Version Analyzed | 2.x (2.19.2) |
| Client Version | Latest |
| React Version | 18+ |
| TypeScript | 5.0+ |

## Questions or Clarifications?

Refer to:
- DKAN Official Docs for API details: https://dkan.readthedocs.io/
- DKAN GitHub Issues: https://github.com/GetDKAN/dkan/issues
- Project's CLAUDE.md file for development conventions
