# DKAN 2 Features and Capabilities

Technical documentation for DKAN 2 open data platform features and architecture.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [DKAN API](./DKAN_API.md)
- [Data Standards](./DATA_STANDARDS.md)
- [Architecture](../docs/ARCHITECTURE.md)

## Quick Reference

**Current Version**: DKAN 2.21.2 (October 2025)

**Drupal Support**: 10.2+ and 11.x

**Core Modules**:
- `metastore` - Dataset metadata (DCAT-US)
- `datastore` - Data query and SQL
- `harvest` - External source harvesting
- `search` - Faceted search with Search API

**Standards**:
- Metadata: DCAT-US v1.1
- Data Dictionaries: Frictionless Table Schema v1
- Format: JSON-LD

**API-First Architecture**:
- REST APIs at `/api/1/`
- CKAN-compatible layer at `/api/3/action/`
- Decoupled frontend support

**Moderation States**:
- Draft → Published → Archived
- Revision tracking for all changes

---

## Overview

DKAN is an open-source, API-first open data platform built as a Drupal module. It provides tools for organizations to publish, manage, and share open data catalogs following federal standards and modern data practices.

**Current Version:** 2.21.2 (October 2025)
**Status:** Verified Digital Public Good (DPG)
**Drupal Support:** 10.2+ and 11.x
**Sponsor:** CivicActions (since 2017)
**License:** GNU General Public License v2.0

### Platform Purpose

DKAN helps organizations make data genuinely open by ensuring it is:
- Accessible and discoverable through search and APIs
- Machine-readable with standardized formats
- Linked to contextual resources through metadata
- Published in open formats (CSV, JSON)
- Released under open licenses

### Target Users

- Federal, state, and local government agencies
- Nonprofit organizations
- Data transparency initiatives
- Open data programs and portals
- Research institutions

### Evolution from v1 to v2

DKAN launched in 2014 as a Drupal 7 module inspired by CKAN. Version 2.0 (May 2020) was a complete ground-up rebuild for Drupal 8/9/10+ with modern architecture:

**v1.x (2014-2020):**
- Drupal 7 foundation
- Page-based architecture
- Limited API capabilities

**v2.x (2020-present):**
- Drupal 10/11 foundation
- API-first design
- Decoupled frontend support
- Enhanced standards compliance
- Modern PHP patterns and practices

No backward compatibility exists between versions - migration tools are required for upgrades.

### Real-World Usage

**Data.gov** uses DKAN's harvest functionality to aggregate datasets from hundreds of U.S. federal, state, and local data portals. DKAN enables federated catalog architecture where multiple agencies maintain their own DKAN instances that feed into a centralized catalog.

---

## Core Features

### Metastore: Dataset Metadata Management

The Metastore manages dataset metadata following [DCAT-US v1.1 specification](./DATA_STANDARDS.md#dcat-us-specification). It provides structured metadata storage with validation and versioning.

**Key Capabilities:**
- JSON-based metadata storage
- JSON Schema validation for data quality
- CRUD operations via REST API
- Multiple schema support (dataset, distribution, data-dictionary, publisher)
- Revision tracking and content moderation
- Identifier management (UUIDs)

**Three-Level Hierarchy:**
```
Catalog (site-wide)
    ↓
Dataset (individual data asset)
    ↓
Distribution (specific files/access points)
```

**Metastore Operations:**
```http
GET    /api/1/metastore/schemas/dataset/items
POST   /api/1/metastore/schemas/dataset/items
GET    /api/1/metastore/schemas/dataset/items/{id}
PUT    /api/1/metastore/schemas/dataset/items/{id}
PATCH  /api/1/metastore/schemas/dataset/items/{id}
DELETE /api/1/metastore/schemas/dataset/items/{id}
```

### Datastore: Data Access and Query

The Datastore imports CSV files into database tables for fast querying and provides SQL-like query capabilities.

**Key Capabilities:**
- CSV parsing and import to MySQL/MariaDB tables
- SQL query interface with custom bracket syntax
- Multiple download formats (CSV, JSON, TSV)
- Column type detection via data dictionaries
- Query optimization and indexing
- Direct file access without API routing

**Import Process:**
1. CSV file uploaded as distribution
2. File fetcher downloads and validates
3. Importer parses CSV and creates database table
4. Data dictionary applied for column typing
5. Indexes created for query performance

**MySQL Import Optimization:**

DKAN includes `datastore_mysql_import` module providing 50x+ faster imports using MySQL's `LOAD DATA LOCAL INFILE`. This requires database configuration:

```sql
-- MySQL configuration required
SET GLOBAL local_infile = 1;
```

**Query Example:**
```http
POST /api/1/datastore/query/{dataset_id}/0
Content-Type: application/json

{
  "limit": 100,
  "offset": 0,
  "conditions": [
    {
      "property": "status",
      "value": "active",
      "operator": "="
    }
  ],
  "sorts": [
    {
      "property": "date",
      "order": "desc"
    }
  ]
}
```

### Harvest: External Data Integration

Harvest enables automatic import of datasets from external catalogs supporting data.json format (Project Open Data schema v1.1).

**Key Capabilities:**
- data.json harvesting from remote catalogs
- ETL (Extract, Transform, Load) pipeline
- Harvest plan management and scheduling
- Run tracking with status monitoring
- Error logging and reporting
- Automated updates on schedule

**Harvest Plan Structure:**
```json
{
  "identifier": "example-harvest",
  "extract": {
    "type": "json",
    "uri": "https://source.example.gov/data.json"
  },
  "transforms": [],
  "load": {
    "type": "dataset"
  }
}
```

**Use Case:** Data.gov harvests from 100+ federal, state, and local DKAN instances. Each agency maintains their catalog; data.gov aggregates via harvest.

### Search: Discovery and Faceting

Search provides full-text search across datasets with faceting for refined discovery.

**Key Capabilities:**
- Full-text indexing of metadata fields
- Faceted search (theme, keyword, publisher, format)
- Search API integration with Drupal Search API
- Query parameter filtering
- Pagination and result ranking
- Autocomplete support

**Search Request:**
```http
GET /api/1/search?fulltext=water&theme=Environment&page-size=20&page=0&sort=modified&sort-order=desc
```

**Search Response:**
```json
{
  "total": 150,
  "results": [
    {
      "identifier": "abc-123",
      "title": "Water Quality Measurements",
      "theme": ["Environment"],
      "modified": "2025-01-15"
    }
  ],
  "facets": {
    "theme": ["Environment", "Health"],
    "keyword": ["water", "quality", "monitoring"]
  }
}
```

### Data Dictionaries: Column-Level Metadata

Data dictionaries provide column-level metadata following Frictionless Table Schema v1, enabling data validation and documentation.

**Key Capabilities:**
- Frictionless Table Schema 100% compatibility
- Column type definitions (string, number, integer, date, datetime, boolean)
- Validation constraints (required, unique, min/max, patterns, enum)
- Missing value specifications
- Field descriptions and examples
- Three relationship levels: catalog-wide, domain-specific, dataset-specific

**Dictionary Structure:**
```json
{
  "identifier": "water-quality-dict",
  "version": "1.0",
  "data": {
    "title": "Water Quality Data Dictionary",
    "fields": [
      {
        "name": "station_id",
        "title": "Station ID",
        "type": "string",
        "constraints": {
          "required": true,
          "unique": true,
          "maxLength": 20
        }
      },
      {
        "name": "measurement_date",
        "title": "Measurement Date",
        "type": "date",
        "format": "default",
        "constraints": {
          "required": true
        }
      },
      {
        "name": "ph_level",
        "title": "pH Level",
        "type": "number",
        "constraints": {
          "minimum": 0,
          "maximum": 14
        }
      }
    ]
  }
}
```

**Integration with Datasets:**

Data dictionaries link to distributions via DCAT-US `describedBy` field:

```json
{
  "distribution": [
    {
      "@type": "dcat:Distribution",
      "downloadURL": "https://data.gov/water.csv",
      "describedBy": "https://data.gov/api/1/metastore/schemas/data-dictionary/items/water-quality-dict",
      "describedByType": "application/vnd.tableschema+json"
    }
  ]
}
```

### REST API: Complete CRUD Coverage

All DKAN functionality is accessible via REST APIs under `/api/1/` base path. For complete API documentation, see [DKAN API](./DKAN_API.md).

**API Design Principles:**
- Consistent JSON request/response format
- HTTP status codes follow standards (200, 201, 400, 401, 403, 404, 500)
- Authentication via HTTP Basic (default) or Bearer tokens (requires modules)
- OpenAPI 3.0 specification available at `/api/1`

**API Categories:**
- Metastore API - Dataset metadata CRUD
- Search API - Dataset search and faceting
- Datastore API - Data querying and download
- Harvest API - Harvest plan and run management
- Revision API - Content moderation and versioning
- Data Dictionary API - Schema CRUD

### Admin Interface: Management UI

DKAN provides Drupal-based administrative interfaces for managing all platform features.

**Key Capabilities:**
- Metastore admin for dataset creation and editing
- Datastore import monitoring with status tracking
- Harvest plan creation and run scheduling
- Content moderation workflows (draft → published → archived)
- Bulk operations for datasets
- User and permission management

**Moderation Workflow:**
```
Draft → Published → Archived
  ↓         ↓
Hidden   Orphaned
```

**Workflow States:**
- **draft** - Work in progress, not publicly visible
- **published** - Live and publicly accessible
- **archived** - No longer active but preserved
- **hidden** - Temporarily removed from public view
- **orphaned** - Referenced resources deleted

### Frontend Support: Decoupled Architecture

DKAN supports multiple frontend approaches from fully decoupled to traditional Drupal theming.

**Deployment Options:**
- **Decoupled React/Vue** - Use dkanClientTools packages with custom frontend
- **DKAN JS Frontend** - Official React-based frontend module
- **Drupal Theming** - Traditional Drupal theme layer
- **Headless API-only** - No frontend, API consumption only
- **Static Site Generation** - Pre-render with Gatsby, Next.js, etc.

**Why Decoupled:**
- Modern JavaScript frameworks (React, Vue, Svelte)
- Better performance with CDN deployment
- Independent frontend/backend scaling
- Framework flexibility

---

## Data Standards and Compliance

### DCAT-US v1.1

DCAT-US (Data Catalog Vocabulary - United States) v1.1 is the federal standard for dataset metadata, based on W3C DCAT vocabulary.

**Purpose:**
- Federal agency compliance with Project Open Data requirements
- Interoperability across government data portals
- Consistent metadata structure for data.json feeds
- International compatibility via W3C DCAT base

**Required Fields:**
- `title` - Dataset name
- `description` - Abstract explaining dataset purpose
- `keyword` - Array of tags for discovery
- `modified` - Most recent change date (ISO 8601)
- `contactPoint` - Contact person with name and email
- `identifier` - Unique, persistent identifier (preferably URL)
- `accessLevel` - "public", "restricted public", or "non-public"

**Federal-Specific Fields:**
- `bureauCode` - OMB Circular A-11 bureau identifier
- `programCode` - Federal Program Inventory reference
- `dataQuality` - Information Quality Guidelines compliance
- `systemOfRecords` - Privacy Act System of Records Notice URL

**DCAN Implementation:**

DKAN uses DCAT-US as the default metastore schema. Custom schemas are supported by providing alternate JSON Schema definitions.

### Frictionless Table Schema v1

Frictionless Table Schema provides a standard way to describe tabular data structure and validation rules.

**Purpose:**
- Column-level metadata documentation
- Data type definitions and validation
- Constraint enforcement (required, unique, ranges, patterns)
- Missing value handling
- International data quality standard

**Field Types:**
- `string`, `number`, `integer`, `boolean`
- `date`, `time`, `datetime`, `year`, `yearmonth`, `duration`
- `object`, `array`

**Constraint Types:**
- `required` - No null values allowed
- `unique` - Values must be unique across column
- `minimum` / `maximum` - Numeric or date range constraints
- `minLength` / `maxLength` - String or collection length
- `enum` - Restricted to specific values
- `pattern` - Regex validation for strings

**DKAN Implementation:**

Data dictionaries in DKAN are 100% Frictionless-compatible. The metastore schema for `data-dictionary` wraps Frictionless schemas in DKAN metadata (identifier, version).

### Supporting Standards

**JSON-LD:**
- Linked data format for semantic web compatibility
- `@type` and `@context` fields in DCAT-US metadata
- Enables knowledge graph integration

**ISO 8601:**
- Date and time formatting standard
- Used for `modified`, `issued`, `temporal` fields
- Example: `2025-01-15T14:30:00Z`

**vCard:**
- Contact information standard
- `contactPoint` uses vCard structure
- Example: `{"@type": "vcard:Contact", "fn": "Jane Doe", "hasEmail": "mailto:jane@example.gov"}`

**Dublin Core:**
- Optional metadata terms for enrichment
- Familiar to library and archive professionals
- Complements DCAT-US fields

**W3C DCAT:**
- International data catalog vocabulary
- DCAT-US builds on DCAT base
- Enables global catalog federation

---

## Technical Architecture

### Core Components

**Metastore:**
- JSON data ingestion and validation
- Schema management (dataset, distribution, data-dictionary, publisher)
- CRUD services and API endpoints
- Revision tracking
- Drush commands for CLI management

**Datastore:**
- CSV parsing service
- Database table creation and management
- SQL query parser (bracket syntax)
- Import queue processing (localize_import, datastore_import)
- Download endpoint handlers
- Data dictionary integration

**Harvest:**
- ETL pipeline orchestration
- Extract: JSON data fetching from remote URLs
- Transform: Data mapping and filtering
- Load: Dataset creation in metastore
- Plan and run storage
- Error tracking and logging

**Common:**
- Shared utilities and services
- Event system for extensibility
- Storage abstraction layer
- Configuration management
- Helper functions

**Search:**
- Search API integration layer
- Index management
- Query builder
- Facet generation
- Result formatting

### Submodules

**metastore_admin:**
- Drupal admin UI for datasets
- Form integration with JSON Form Widget
- List views with filters
- Bulk operations support

**metastore_search:**
- Search functionality implementation
- Faceted search configuration
- Search index definitions

**metastore_facets:**
- Facet configuration and display
- Theme, keyword, publisher aggregations

**datastore_mysql_import:**
- High-performance MySQL import using `LOAD DATA LOCAL INFILE`
- 50x+ faster than standard CSV parsing
- Requires MySQL configuration

**sample_content:**
- Demo dataset generator
- Sample harvest plan for testing
- Drush commands: `dkan:sample-content:create`, `dkan:sample-content:remove`

### Drupal Integration

DKAN leverages Drupal's robust features while maintaining API-first independence.

**Drupal Core Dependencies:**
- `config` - Configuration management
- `field` - Field API for extensibility
- `file` - File management and storage
- `link` - URL field handling
- `options` - List field types
- `path` - URL aliasing

**Contributed Module Dependencies:**
- `search_api` ^1.15 - Search infrastructure
- `search_api_db` - Database search backend
- `facets` ^3.0.1 - Faceted search UI
- `views_bulk_operations` ^4.0 - Bulk operations
- `moderated_content_bulk_publish` ~2.0.20 - Bulk moderation
- `select2` ^2.0 - Enhanced select widgets
- `select_or_other` ^4.2.0 - Flexible form inputs
- `json_form_widget` - JSON schema-driven forms
- `data_dictionary_widget` - Data dictionary UI

**Benefits from Drupal:**
- User authentication and roles
- Permission system
- Content moderation workflows
- Caching layers (database, file, Redis/Memcache)
- Hook system for extensibility
- Admin UI framework
- File management
- Multilingual support

**DKAN Independence:**

While built on Drupal, DKAN's API-first design means frontends don't require Drupal knowledge. The REST APIs abstract Drupal implementation details.

### Database Requirements

**Supported Databases:**
- MySQL 5.7+
- MariaDB 10.3+

**Required Configuration:**
```sql
SET GLOBAL local_infile = 1;  -- Required for fast CSV import
```

**Storage Engine:** InnoDB (default in modern MySQL/MariaDB)

**Encoding:** UTF-8 (all CSV imports must be UTF-8)

**Performance Considerations:**
- Index creation for datastore tables
- Query optimization for large datasets
- Connection pooling for high traffic
- Read replica support for scaling

### PHP Dependencies

**GetDKAN Libraries:**
- `getdkan/contracts` ^1.2.0 - Interface contracts
- `getdkan/csv-parser` ^1.3.3 - CSV parsing
- `getdkan/file-fetcher` ^5.1.0 - Remote file fetching
- `getdkan/pdlt` ^0.1.7 - Data load tools
- `getdkan/procrastinator` ^5.0.3 - Job queue processing
- `getdkan/rooted-json-data` ^0.2.2 - JSON data handling

**Third-Party Libraries:**
- `guzzlehttp/guzzle` - HTTP client for harvest
- `ramsey/uuid` - UUID generation
- `justinrainbow/json-schema` - JSON Schema validation
- `ezyang/htmlpurifier` - HTML sanitization

**PHP Version:**
- PHP 8.0+ (tested with 8.3.16)
- Composer 2.x for dependency management

---

## API Organization and Endpoints

### Metastore API

Base path: `/api/1/metastore/`

**Schema Management:**
```http
GET /api/1/metastore/schemas
GET /api/1/metastore/schemas/{schema_id}
```

**Schema Items (Datasets, Data Dictionaries, etc.):**
```http
GET    /api/1/metastore/schemas/{schema_id}/items
POST   /api/1/metastore/schemas/{schema_id}/items
GET    /api/1/metastore/schemas/{schema_id}/items/{id}
PUT    /api/1/metastore/schemas/{schema_id}/items/{id}
PATCH  /api/1/metastore/schemas/{schema_id}/items/{id}
DELETE /api/1/metastore/schemas/{schema_id}/items/{id}
```

**Common Schemas:**
- `dataset` - Dataset metadata (DCAT-US)
- `data-dictionary` - Table schemas (Frictionless)
- `distribution` - File/resource metadata
- `publisher` - Organization information

### Search API

Base path: `/api/1/search/`

**Search Datasets:**
```http
GET /api/1/search
```

**Query Parameters:**
- `keyword` - Filter by keyword/tag
- `theme` - Filter by theme category
- `fulltext` - Full-text search across all fields
- `publisher` - Filter by publisher name
- `sort` - Sort field(s) (supports multiple: `sort=modified&sort=title`)
- `sort-order` - Sort direction: `asc` or `desc` (supports multiple)
- `page` - Page number (0-based)
- `page-size` - Results per page

**Get Available Facets:**
```http
GET /api/1/search/facets
```

Returns aggregated facet values with counts for filtering.

### Datastore API

Base path: `/api/1/datastore/`

**Query Single Resource:**
```http
POST /api/1/datastore/query/{dataset_id}/{index}
Content-Type: application/json

{
  "limit": 100,
  "offset": 0,
  "conditions": [...],
  "sorts": [...],
  "properties": ["field1", "field2"]
}
```

**Query Multiple Resources (JOINs):**
```http
POST /api/1/datastore/query
Content-Type: application/json

{
  "resources": [
    {"id": "resource-1", "alias": "r1"},
    {"id": "resource-2", "alias": "r2"}
  ],
  "joins": [...],
  "limit": 100
}
```

**SQL Queries (Bracket Syntax):**
```http
GET /api/1/datastore/sql?query=[SELECT * FROM {dist-id}][LIMIT 10];
POST /api/1/datastore/sql
Content-Type: application/json

{
  "query": "[SELECT field1,field2 FROM {dist-id}][WHERE status = \"active\"][LIMIT 100];",
  "show_db_columns": false
}
```

**Download Data:**
```http
GET /api/1/datastore/query/{dataset_id}/{index}/download?format=csv&limit=1000
```

**Get Schema Only:**
```http
GET /api/1/datastore/query/{dataset_id}/{index}?schema=true
```

### Harvest API

Base path: `/api/1/harvest/`

**Manage Harvest Plans:**
```http
GET  /api/1/harvest/plans
POST /api/1/harvest/plans
GET  /api/1/harvest/plans/{plan_id}
```

**Execute and Monitor Harvests:**
```http
POST /api/1/harvest/runs
GET  /api/1/harvest/runs?plan={plan_id}
GET  /api/1/harvest/runs/{run_id}?plan={plan_id}
```

### Datastore Import API

Base path: `/api/1/datastore/imports/`

**Manage Imports:**
```http
GET    /api/1/datastore/imports
GET    /api/1/datastore/imports/{identifier}
POST   /api/1/datastore/imports
DELETE /api/1/datastore/imports/{identifier}
```

**Import Status Response:**
```json
{
  "status": "done",
  "file_fetcher": {
    "state": {
      "total_bytes": 1048576,
      "file_path": "/tmp/resource.csv"
    }
  },
  "importer": {
    "state": {
      "num_records": 1500
    }
  }
}
```

### Revision API

Base path: `/api/1/metastore/schemas/{schema_id}/items/{id}/revisions/`

**Revision Management:**
```http
GET  /api/1/metastore/schemas/dataset/items/{id}/revisions
GET  /api/1/metastore/schemas/dataset/items/{id}/revisions/{revision_id}
POST /api/1/metastore/schemas/dataset/items/{id}/revisions
```

**Create Revision (Change State):**
```json
{
  "state": "published",
  "message": "Publishing dataset for public access"
}
```

**Workflow States:**
- `draft` - Work in progress
- `published` - Publicly visible
- `archived` - Preserved but inactive
- `hidden` - Temporarily removed
- `orphaned` - Referenced resources deleted

### Authentication

**HTTP Basic Authentication (Default):**
```http
Authorization: Basic {base64(username:password)}
```

Works out-of-the-box with DKAN 2.x using Drupal user accounts.

**Bearer Token Authentication:**
```http
Authorization: Bearer {token}
```

Requires additional Drupal modules like Simple OAuth. Not supported by default in DKAN 2.x.

**Anonymous Access:**

All GET endpoints for public datasets are accessible without authentication. Authentication required for:
- POST, PUT, PATCH, DELETE operations
- Draft/unpublished content access
- Administrative operations

---

## Use Cases and Implementations

### Government Data Portals

**Federal Agencies:**
- Publish datasets for data.gov compliance
- Meet Project Open Data requirements
- Automate metadata updates
- Track data.gov harvest success

**State and Local Government:**
- Transparent government initiatives
- Open budget and spending data
- Geographic information systems (GIS) data
- Performance metrics and dashboards

**Example Architecture:**
```
State Agency DKAN → data.json feed → Data.gov Harvest
```

### Enterprise Data Catalogs

**Internal Data Discovery:**
- Central catalog of enterprise data assets
- Metadata management for data governance
- Data lineage and ownership tracking
- Self-service data access for analysts

**Collaboration:**
- Multi-department data sharing
- Cross-functional data projects
- Standardized metadata across organization
- Role-based access control

### Research Data Repositories

**Academic Institutions:**
- Research dataset publication
- Data preservation and archiving
- DOI integration for citations
- Compliance with funder requirements (NIH, NSF)

**Data Quality:**
- Data dictionary documentation
- Column-level metadata
- Validation rules enforcement
- Versioning and provenance

### Non-Profit and NGO Data

**Humanitarian Data:**
- Crisis response data platforms
- Multi-organization data sharing
- Field data collection integration
- Geographic data visualization

**Impact Measurement:**
- Program outcome data
- Longitudinal studies
- Beneficiary data (privacy-respecting)
- Funder reporting automation

---

## Key Advantages and Design Decisions

### Open Source

**No Licensing Costs:**
- Free to download, use, modify, distribute
- No per-user or per-dataset fees
- No vendor lock-in

**Community-Driven:**
- Active development community
- GitHub-based collaboration
- Public roadmap and feature requests
- Transparent development process

**Full Ownership:**
- Control over data and infrastructure
- Ability to fork and customize
- No proprietary formats or protocols

### Standards-Based Design

**DCAT-US Compliance:**
- Required for U.S. federal data portals
- Ensures data.gov compatibility
- Consistent metadata across agencies
- Future-proof through standards adoption

**Frictionless Compatibility:**
- International data quality standard
- Reusable data dictionaries
- Portable validation rules
- Growing ecosystem of tools

**Interoperability:**
- JSON-LD for linked data
- W3C DCAT compatibility for global catalogs
- ISO standards for dates and internationalization

### API-First Architecture

**Programmatic Access:**
- All features available via REST APIs
- No manual UI operations required
- Automation and workflow integration
- Machine-to-machine communication

**Decoupled Frontend:**
- Choice of frontend technology
- Independent scaling of frontend/backend
- Multiple frontend deployments (public portal, internal admin)
- Static site generation for performance

**Integration:**
- ETL tool connectivity
- Analytics platform integration
- Custom application development
- Third-party service connections

### Flexibility

**Drupal Ecosystem:**
- 50,000+ contributed modules available
- Mature admin UI framework
- Enterprise-grade security updates
- Hosting provider support

**Extensibility:**
- Hook system for custom logic
- Event-driven architecture
- Custom schema support
- Plugin-based features

**Deployment Options:**
- Traditional LAMP stack
- Docker containers
- Kubernetes orchestration
- Platform-as-a-Service (Pantheon, Acquia, Platform.sh)

### Data Quality

**Metadata Validation:**
- JSON Schema enforcement
- Required field checks
- Format validation (dates, URLs, emails)
- Custom validation rules

**Data Dictionary Enforcement:**
- Column type validation
- Constraint checking (required, unique, ranges)
- Missing value handling
- Data cleaning guidance

**Workflow Control:**
- Content moderation states
- Review and approval processes
- Bulk quality operations
- Audit logging

---

## Important Implementation Notes

### DKAN 2.x Specifics

**Complete Rewrite:**

DKAN 2.x is a from-scratch rebuild, not an incremental update. Key differences from 1.x:

- Modern PHP 8.0+ (vs PHP 5.x)
- API-first design (vs page-centric)
- JSON storage (vs Drupal entities)
- Decoupled frontend support (vs monolithic)
- Enhanced standards compliance (DCAT-US v1.1, Frictionless)

**No Backward Compatibility:**

Data and configuration from DKAN 1.x cannot be directly migrated. Migration tools are available but require planning and testing.

**Active Development:**

DKAN 2.x receives regular updates and security patches. The community is active on GitHub Discussions.

### Known Limitations

**Dataset Properties API:**

The Dataset Properties API endpoints return 404 in DKAN 2.x. These endpoints are not available:
- `GET /api/1/properties/dataset`
- `GET /api/1/properties/dataset/{property}`
- `GET /api/1/properties/dataset/values`

These were documented in earlier DKAN versions but removed in 2.x.

**Bearer Token Authentication:**

Bearer token authentication requires additional Drupal modules (e.g., Simple OAuth) that are not included by default. For standard DKAN 2.x, use HTTP Basic Authentication.

**CSV Import Requirements:**

- All CSV files must be UTF-8 encoded
- Column headers limited to 64 characters (MySQL constraint)
- `LOAD DATA LOCAL INFILE` must be enabled for fast import
- Large files (>100MB) may require PHP memory limit increases

**Harvest Frequency:**

Harvest operations are resource-intensive. Scheduling frequent harvests (every few minutes) may impact performance. Recommended minimum: hourly for small catalogs, daily for large catalogs.

### Deployment Considerations

**Server Requirements:**
- PHP 8.0+ with required extensions (mbstring, xml, gd, curl, pdo_mysql)
- MySQL 5.7+ or MariaDB 10.3+ with `local_infile` enabled
- Apache 2.4+ or Nginx 1.18+ with mod_rewrite/URL rewriting
- 2GB+ RAM recommended (4GB+ for production)
- Composer for dependency management

**MySQL Configuration:**
```ini
[mysqld]
local_infile = 1
max_allowed_packet = 64M
```

**PHP Configuration:**
```ini
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
```

**Drupal Settings:**

```php
// settings.php
$databases['default']['default'] = [
  'database' => 'dkan',
  'username' => 'dkan_user',
  'password' => 'secure_password',
  'host' => 'localhost',
  'port' => '3306',
  'driver' => 'mysql',
  'pdo' => [
    PDO::MYSQL_ATTR_LOCAL_INFILE => TRUE,  // Required for fast import
  ],
];
```

**Performance Optimization:**

- Enable Drupal caching (database, dynamic page, CSS/JS aggregation)
- Use Redis or Memcache for object caching
- Configure CDN for static assets
- Enable DKAN datastore indexes
- Schedule search reindexing during off-peak hours
- Monitor PHP-FPM and database connection pools

**Security Considerations:**

- Keep Drupal core and modules updated
- Use HTTPS for all API communications
- Implement rate limiting (via web server or CDN)
- Configure CORS appropriately for API access
- Use strong passwords and two-factor authentication
- Regular security audits and penetration testing
- Disable unused modules
- Restrict file upload types

---

## Integration with dkanClientTools

dkanClientTools provides TypeScript/JavaScript packages for working with DKAN REST APIs in React, Vue, and vanilla JavaScript applications.

### API Coverage

**42+ API Methods:**

- Dataset operations (CRUD, search, list)
- Datastore queries (query, SQL, download)
- Data dictionary operations (CRUD, schema)
- Harvest operations (plans, runs)
- Datastore import operations
- Metastore schemas and facets
- Revision and moderation

**Full Coverage:**

Every DKAN REST API endpoint (except the non-functional Dataset Properties endpoints) has corresponding TypeScript methods in dkanClientTools.

### Framework Support

**React Package (@dkan-client-tools/react):**
- React hooks for all operations
- `DkanClientProvider` for configuration
- TanStack React Query integration
- TypeScript support with full type inference
- React 18+ and 19.x compatibility

**Vue Package (@dkan-client-tools/vue):**
- Vue 3 composables for all operations
- `DkanClientPlugin` for setup
- TanStack Vue Query integration
- Composition API with `<script setup>` support
- Full TypeScript and reactive refs support

**Core Package (@dkan-client-tools/core):**
- Framework-agnostic DkanClient and DkanApiClient
- TypeScript type definitions for DCAT-US and Frictionless
- TanStack Query Core integration
- Works in Node.js and browser environments

### TanStack Query Integration

**Automatic Caching:**
- Query results cached by default (5-minute stale time)
- Deduplicated requests (multiple components fetching same data)
- Background refetching for data freshness
- Cache invalidation after mutations

**Optimistic Updates:**
```typescript
const { mutate } = useUpdateDataset()

mutate(
  { id: 'abc-123', data: updatedDataset },
  {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset', 'abc-123'] })
    }
  }
)
```

**Smart Query Keys:**
```typescript
// React
useDataset({ id: 'abc-123' })  // Query key: ['dataset', 'abc-123']
useDatasetSearch({ keyword: 'water' })  // Query key: ['datasetSearch', { keyword: 'water' }]

// Vue (reactive)
useDataset({ id: ref('abc-123') })  // Automatically tracks ref changes
```

**Benefits:**
- Reduced API calls and server load
- Instant UI updates with cached data
- Automatic loading and error states
- Built-in retry logic
- Background synchronization

### Type Safety

**DCAT-US Types:**
```typescript
interface DkanDataset {
  identifier: string
  title: string
  description: string
  accessLevel: 'public' | 'restricted public' | 'non-public'
  modified: string
  keyword: string[]
  publisher: Publisher
  contactPoint: ContactPoint
  distribution?: Distribution[]
  // ... all DCAT-US fields
}
```

**Frictionless Types:**
```typescript
interface DataDictionary {
  identifier: string
  version?: string
  data: {
    title?: string
    fields: DataDictionaryField[]
  }
}

type DataDictionaryFieldType =
  | 'string' | 'number' | 'integer' | 'boolean'
  | 'date' | 'time' | 'datetime' | 'year' | 'yearmonth' | 'duration'
  | 'object' | 'array'
```

**Type Inference:**
```typescript
const { data } = useDataset({ id: 'abc-123' })
// TypeScript knows `data` is DkanDataset | undefined
// Full autocomplete for all DCAT-US fields
```

---

## References

- [DKAN Official Documentation](https://dkan.readthedocs.io/)
- [DKAN GitHub Repository](https://github.com/GetDKAN/dkan)
- [DKAN Official Website](https://getdkan.org/)
- [DKAN Community Discussions](https://github.com/GetDKAN/dkan/discussions)
- [DCAT-US Specification](https://resources.data.gov/resources/dcat-us/)
- [Frictionless Table Schema](https://specs.frictionlessdata.io/table-schema/)
- [Project Open Data Metadata Schema](https://project-open-data.cio.gov/v1.1/schema/)
- [W3C DCAT Vocabulary](https://www.w3.org/TR/vocab-dcat/)
- [Data.gov](https://data.gov/)
- [Drupal Documentation](https://www.drupal.org/docs)
- [TanStack Query Documentation](https://tanstack.com/query)

### Internal Documentation

- [DKAN API Documentation](./DKAN_API.md)
- [Data Standards Documentation](./DATA_STANDARDS.md)
- [Architecture Documentation](../docs/ARCHITECTURE.md)
