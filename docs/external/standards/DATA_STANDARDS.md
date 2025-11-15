# Data Standards and Schema Specifications

Technical documentation for DCAT-US and Frictionless Table Schema standards as implemented in dkanClientTools.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [DKAN API](../platforms/DKAN_API.md)
- [DKAN Features](../platforms/DKAN.md)
- [Architecture](../../ARCHITECTURE.md)

## Quick Reference

**DCAT-US Required Fields**:
- `title` - Dataset name
- `description` - Human-readable summary
- `keyword` - Array of tags
- `modified` - ISO 8601 date
- `contactPoint` - vcard:Contact object

**Access Levels**:
- `public` - No restrictions
- `restricted public` - Registration or approval required
- `non-public` - Government use only

**Frictionless Data Dictionary**:
- Schema version: Table Schema v1
- Field types: string, integer, number, boolean, date, datetime, etc.
- Constraints: required, unique, min/max, pattern, enum
- Primary keys and foreign keys supported

**Date Format**: ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`)

---

## Overview

dkanClientTools standardizes all dataset metadata using **DCAT-US v1.1** (Project Open Data Metadata Schema) and data dictionaries following **Frictionless Table Schema v1**. These standards enable interoperability with federal data.gov requirements and modern data validation patterns.

**Standards Implemented:**
- DCAT-US v1.1 for dataset metadata
- Frictionless Table Schema v1 for data dictionaries
- JSON-LD format for linked data support
- ISO 8601 for dates and temporal coverage

---

## DCAT-US Specification

DCAT-US v1.1 is the federal standard for documenting datasets and APIs, based on W3C's DCAT vocabulary. Published November 6, 2014, it is maintained by OMB, GSA, and NARA.

### Schema Architecture

Three-level hierarchy:

1. **Catalog** - Container for all datasets
2. **Dataset** - Individual data asset with metadata
3. **Distribution** - Specific files or access points within a dataset

### Required Fields

Five fields required for all datasets:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Plain English name facilitating discovery |
| `description` | string | Human-readable abstract for quick assessment |
| `keyword` | string[] | Array of tags supporting discoverability |
| `modified` | string (ISO 8601) | Most recent change date |
| `contactPoint` | ContactPoint | Contact person details |

**Example:**
```json
{
  "title": "Water Quality Measurements",
  "description": "Monthly water quality data from monitoring stations",
  "keyword": ["water", "quality", "environment"],
  "modified": "2025-01-15",
  "contactPoint": {
    "@type": "vcard:Contact",
    "fn": "Jane Doe",
    "hasEmail": "mailto:jane.doe@agency.gov"
  }
}
```

### Conditionally Required Fields

| Field | Required When | Values |
|-------|--------------|--------|
| `accessLevel` | Always (de facto required) | "public", "restricted public", "non-public" |
| `distribution` | Dataset has downloadURL or accessURL | Distribution[] |
| `rights` | accessLevel is restricted/non-public | string |
| `spatial` | Geographic coverage applies | string (place name or coordinates) |
| `temporal` | Time period applies | string (ISO 8601 interval) |

### Federal-Only Fields

Four fields specific to federal government agencies:

- `bureauCode` - OMB Circular A-11 bureau identifier
- `programCode` - Federal Program Inventory reference
- `dataQuality` - Boolean confirming Information Quality Guidelines compliance
- `systemOfRecords` - Privacy Act System of Records Notice URL

### Publisher Structure

Nested object supporting organizational hierarchies:

```typescript
interface Publisher {
  name: string
  '@type'?: string
  subOrganizationOf?: Publisher  // Recursive nesting
}
```

**Example:**
```json
{
  "publisher": {
    "name": "Department of Environmental Protection",
    "@type": "org:Organization",
    "subOrganizationOf": {
      "name": "State Environmental Agency"
    }
  }
}
```

### Distribution Requirements

Each distribution requires either `accessURL` or `downloadURL`:

- **accessURL** - Indirect access (APIs, landing pages)
- **downloadURL** - Direct file download

When `downloadURL` is present, `mediaType` becomes mandatory.

```json
{
  "distribution": [
    {
      "@type": "dcat:Distribution",
      "downloadURL": "https://data.example.gov/water.csv",
      "mediaType": "text/csv",
      "format": "CSV",
      "title": "Water Quality CSV"
    },
    {
      "@type": "dcat:Distribution",
      "accessURL": "https://api.example.gov/water",
      "format": "API"
    }
  ]
}
```

### Identifier Requirements

`identifier` field must be:
- Globally unique across all datasets
- Persistent (never reused for different datasets)
- Preferably an HTTP URL for third-party tracking

**Recommended format:**
```
https://data.agency.gov/datasets/{uuid}
```

### Date Formatting

ISO 8601 format required for all dates:

```json
{
  "issued": "2025-01-15",
  "modified": "2025-01-20T14:30:00Z",
  "temporal": "2024-01-01/2024-12-31"
}
```

**Temporal intervals:**
```json
{
  "temporal": "2024-01-01/2024-12-31",  // Single period
  "temporal": "R/P1D"  // Recurring daily
}
```

### Optional Enhanced Fields

| Field | Purpose | Format |
|-------|---------|--------|
| `theme` | Categorization | string[] |
| `license` | Usage rights | URL or string |
| `landingPage` | Human-readable page | URL |
| `accrualPeriodicity` | Update frequency | ISO 8601 duration |
| `language` | Languages used | string[] (ISO 639-1) |
| `conformsTo` | Standards compliance | URL |
| `describedBy` | Data dictionary URL | URL |
| `describedByType` | Dictionary MIME type | string |
| `isPartOf` | Parent dataset | string |
| `references` | Related resources | string[] |

### Case Sensitivity

DCAT-US uses strict camelCase convention. Field names are case-sensitive:

- **Correct:** `contactPoint`, `accessLevel`, `downloadURL`
- **Incorrect:** `ContactPoint`, `accesslevel`, `downloadUrl`

### Validation

**JSON Schema available at:**
```
https://project-open-data.cio.gov/v1.1/schema/catalog.json
```

**Online validator:**
```
https://catalog.data.gov
```

---

## DCAT-US to TypeScript Mapping

dkanClientTools implements DCAT-US as TypeScript interfaces in `packages/dkan-client-tools-core/src/types.ts`.

### DkanDataset Interface

Core dataset type matching DCAT-US specification:

```typescript
interface DkanDataset {
  // Required fields
  identifier: string
  title: string
  description: string
  accessLevel: 'public' | 'restricted public' | 'non-public'
  modified: string
  keyword: string[]
  publisher: Publisher
  contactPoint: ContactPoint

  // Conditionally required
  distribution?: Distribution[]

  // Optional fields
  theme?: string[]
  spatial?: string
  temporal?: string
  license?: string
  landingPage?: string
  accrualPeriodicity?: string
  language?: string[]
  issued?: string
  conformsTo?: string
  describedBy?: string
  describedByType?: string
  isPartOf?: string
  references?: string[]

  // Extensibility
  [key: string]: any
}
```

**Key Mapping Decisions:**

1. **Strict accessLevel enum** - Prevents invalid values
2. **Optional arrays** - Uses `?:` for conditional fields
3. **Index signature** - `[key: string]: any` allows DCAT-US extensions
4. **Nested interfaces** - Publisher, ContactPoint, Distribution as separate types

### Publisher Mapping

```typescript
interface Publisher {
  name: string
  '@type'?: string
  subOrganizationOf?: Publisher  // Recursive type for hierarchy
}
```

Supports unlimited organizational nesting through recursive `subOrganizationOf`.

### ContactPoint Mapping

```typescript
interface ContactPoint {
  '@type': string
  fn: string       // Full name
  hasEmail: string // mailto: format
}
```

**Note:** `@type` is required (unlike DCAT-US where it's optional) to ensure consistent vcard usage.

### Distribution Mapping

```typescript
interface Distribution {
  '@type': string
  identifier?: string
  title?: string
  description?: string
  format?: string
  mediaType?: string
  downloadURL?: string
  accessURL?: string
  data?: DistributionData  // DKAN-specific extension
  describedBy?: string
  describedByType?: string
}
```

**DKAN Extension:**
```typescript
interface DistributionData {
  identifier: string  // Internal DKAN resource ID
  version?: string
  perspective?: string
}
```

The `data` object is a DKAN-specific extension linking distributions to datastore resources.

### Type Safety Benefits

TypeScript mapping provides:

1. **Compile-time validation** - Invalid field names caught at build time
2. **IDE autocomplete** - IntelliSense for all DCAT-US fields
3. **Type inference** - Automatic type checking in hooks/composables
4. **Documentation** - Self-documenting code through types

---

## Frictionless Table Schema

Frictionless Table Schema v1 provides a language-agnostic way to declare schemas for tabular data. Created November 12, 2012, last updated October 5, 2021.

### Schema Purpose

Designed for:
- Validating CSV and other text-based tabular formats
- Documenting data structure and constraints
- Enabling automated data validation
- Supporting data package specifications

### Descriptor Structure

Table Schema descriptor is a JSON object:

```typescript
interface DataDictionary {
  identifier: string  // DKAN-specific
  version?: string    // DKAN-specific
  data: DataDictionaryData
}

interface DataDictionaryData {
  title?: string
  fields: DataDictionaryField[]
  indexes?: DataDictionaryIndex[]
}
```

**Required property:**
- `fields` - Ordered array of field descriptors

**Optional properties:**
- `missingValues` - Null value representations
- `primaryKey` - Unique identifier field(s)
- `foreignKeys` - Inter-table references

### Field Descriptor Properties

```typescript
interface DataDictionaryField {
  name: string         // Required - column name
  title?: string       // Human-readable label
  type: DataDictionaryFieldType
  format?: string      // Type-specific format
  description?: string // Field documentation
  constraints?: DataDictionaryConstraints
}
```

**Required:**
- `name` - Corresponds to column name, should be unique (case-insensitive)

**Optional documentation:**
- `title` - Display name
- `description` - Purpose and usage
- `example` - Sample value (not in dkanClientTools types)

### Field Types

dkanClientTools implements 12 of 15 Frictionless types:

```typescript
type DataDictionaryFieldType =
  | 'string'     // Text sequences
  | 'number'     // Decimals
  | 'integer'    // Whole numbers
  | 'boolean'    // True/false
  | 'object'     // JSON objects
  | 'array'      // JSON arrays
  | 'date'       // Date without time
  | 'time'       // Time only
  | 'datetime'   // Date with time
  | 'year'       // Calendar year
  | 'yearmonth'  // Year-month
  | 'duration'   // Time duration
```

**Not implemented:** `geopoint`, `geojson`, `any`

### Type Specifications

| Type | Format | Example Values |
|------|--------|----------------|
| **string** | default, email, uri, binary, uuid | "text", "user@example.com" |
| **number** | default | 3.14, -10.5, 1e6 |
| **integer** | default | 42, -10, 0 |
| **boolean** | default | true, false |
| **date** | default (ISO8601), custom | "2025-01-15" |
| **time** | default (ISO8601), custom | "14:30:00" |
| **datetime** | default (ISO8601), custom | "2025-01-15T14:30:00Z" |
| **year** | default (YYYY) | "2025" |
| **yearmonth** | default (YYYY-MM) | "2025-01" |
| **duration** | default (ISO8601) | "P1Y2M10D" |
| **object** | default (JSON) | {"key": "value"} |
| **array** | default (JSON) | [1, 2, 3] |

### Constraints

```typescript
interface DataDictionaryConstraints {
  required?: boolean    // No null values
  unique?: boolean      // Field value uniqueness
  minimum?: number      // Min value (numeric/date)
  maximum?: number      // Max value (numeric/date)
  minLength?: number    // Min length (string/array/object)
  maxLength?: number    // Max length (string/array/object)
  enum?: any[]          // Restricted value list
  pattern?: string      // Regex validation (XML Schema syntax)
}
```

**Constraint Application:**

| Constraint | Applies To | Example |
|-----------|-----------|---------|
| `required` | All types | Prevent nulls |
| `unique` | All types | Primary key fields |
| `minimum` | number, integer, date, datetime, year, yearmonth, duration | Age >= 18 |
| `maximum` | number, integer, date, datetime, year, yearmonth, duration | Year <= 2025 |
| `minLength` | string, array, object | Password min 8 chars |
| `maxLength` | string, array, object | Name max 100 chars |
| `enum` | All types | Status in ["active", "inactive"] |
| `pattern` | string | Email regex validation |

**Example:**
```json
{
  "name": "email",
  "type": "string",
  "format": "email",
  "constraints": {
    "required": true,
    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  }
}
```

### Indexes

```typescript
interface DataDictionaryIndex {
  fields: string[]  // Field names in index
  type?: 'primary' | 'unique' | 'index'
}
```

**Primary key** - Can be single field or composite:
```json
{
  "indexes": [
    {
      "fields": ["id"],
      "type": "primary"
    },
    {
      "fields": ["year", "month"],
      "type": "unique"
    }
  ]
}
```

**Primary key rules:**
- Fields cannot be null (implicit `required: true`)
- Should follow field order in `fields` array

### Missing Values

The `missingValues` property specifies null indicators:

```json
{
  "missingValues": ["", "NA", "N/A", "null", "-"]
}
```

**Default:** `[""]` (empty string converts to null)

**Note:** dkanClientTools types don't currently expose `missingValues`, but DKAN backends may use it.

### Foreign Keys

Not currently in dkanClientTools types, but part of Frictionless spec:

```json
{
  "foreignKeys": [
    {
      "fields": ["country_id"],
      "reference": {
        "resource": "countries",
        "fields": ["id"]
      }
    }
  ]
}
```

---

## Implementation Patterns

### Schema Validation

dkanClientTools delegates validation to DKAN backend but provides types for client-side validation:

**Type guards:**
```typescript
function isValidDataset(data: any): data is DkanDataset {
  return (
    typeof data.identifier === 'string' &&
    typeof data.title === 'string' &&
    typeof data.description === 'string' &&
    ['public', 'restricted public', 'non-public'].includes(data.accessLevel) &&
    Array.isArray(data.keyword)
  )
}
```

**Constraint validation example:**
```typescript
function validateField(value: any, field: DataDictionaryField): boolean {
  const { type, constraints } = field

  if (constraints?.required && (value === null || value === undefined)) {
    return false
  }

  if (constraints?.minimum !== undefined && value < constraints.minimum) {
    return false
  }

  if (constraints?.maximum !== undefined && value > constraints.maximum) {
    return false
  }

  if (constraints?.pattern && typeof value === 'string') {
    return new RegExp(constraints.pattern).test(value)
  }

  if (constraints?.enum && !constraints.enum.includes(value)) {
    return false
  }

  return true
}
```

### Data Dictionary Usage

Data dictionaries link to distributions via `describedBy`:

```json
{
  "distribution": [
    {
      "@type": "dcat:Distribution",
      "downloadURL": "https://data.gov/water.csv",
      "describedBy": "https://data.gov/dictionaries/water-dict",
      "describedByType": "application/json"
    }
  ]
}
```

**Fetching with dkanClientTools:**
```typescript
// React
const { data: dictionary } = useDataDictionaryFromUrl({
  url: distribution.describedBy,
  enabled: !!distribution.describedBy
})

// Vue
const { data: dictionary } = useDataDictionaryFromUrl({
  url: computed(() => distribution.value?.describedBy),
  enabled: computed(() => !!distribution.value?.describedBy)
})
```

### Schema-Driven UI Generation

Data dictionaries enable automated form/table generation:

```typescript
function generateTableColumns(schema: DataDictionaryData) {
  return schema.fields.map(field => ({
    key: field.name,
    label: field.title || field.name,
    type: field.type,
    required: field.constraints?.required,
    format: getFormatter(field.type, field.format)
  }))
}

function getFormatter(type: DataDictionaryFieldType, format?: string) {
  switch (type) {
    case 'date':
      return (val: string) => new Date(val).toLocaleDateString()
    case 'number':
    case 'integer':
      return (val: number) => val.toLocaleString()
    case 'boolean':
      return (val: boolean) => val ? 'Yes' : 'No'
    default:
      return (val: any) => String(val)
  }
}
```

---

## Custom Extensions

### DKAN Extensions to DCAT-US

DKAN adds custom fields beyond DCAT-US:

**Distribution.data:**
```typescript
interface DistributionData {
  identifier: string  // Internal datastore resource ID
  version?: string    // Resource version
  perspective?: string // Data view perspective
}
```

Used to link distributions to datastore tables for querying.

**DataDictionary wrapper:**
```typescript
interface DataDictionary {
  identifier: string  // UUID for dictionary
  version?: string    // Dictionary version
  data: DataDictionaryData  // Standard Frictionless schema
}
```

DKAN wraps Frictionless schemas in metadata for versioning and identification.

### Project-Specific Extensions

The `[key: string]: any` index signature in `DkanDataset` allows custom fields:

```typescript
const dataset: DkanDataset = {
  // Standard fields
  identifier: "abc-123",
  title: "My Dataset",
  // ... required fields ...

  // Custom extensions
  internalId: "INT-456",
  reviewStatus: "approved",
  customMetadata: {
    department: "Water Quality",
    costCenter: "ENV-001"
  }
}
```

**Best practices:**
- Use namespaced keys to avoid conflicts
- Document custom fields in project docs
- Consider using `@context` for semantic extensions

---

## Schema Versioning

### DCAT-US Versioning

DCAT-US is at version 1.1 (November 2014). No version 2.0 announced.

**Migration from v1.0 to v1.1:**
- `contactPoint` became required
- `accessLevel` effectively required
- New optional fields added (`conformsTo`, `describedBy`, etc.)

dkanClientTools targets v1.1 exclusively.

### Frictionless Versioning

Table Schema is at version 1 (last updated October 2021).

**Version history:**
- v1 finalized 2017
- Iterative updates without breaking changes
- Last update added minor clarifications

### DKAN Version Compatibility

dkanClientTools supports DKAN 2.x:

- DKAN 2.x uses DCAT-US v1.1
- DKAN 2.x uses Frictionless Table Schema v1
- DKAN 1.x used different schemas (not supported)

**Breaking changes between DKAN versions:**
- DKAN 1.x to 2.x changed metastore schema structure
- API endpoints changed from `/api/dataset/` to `/api/1/metastore/schemas/dataset/items/`
- Data dictionary integration added in 2.x

### Type Version Management

dkanClientTools types don't expose version fields for DCAT-US but do for data dictionaries:

```typescript
interface DataDictionary {
  version?: string  // Dictionary version for change tracking
}
```

**Versioning strategy:**
1. Schema types match current DCAT-US/Frictionless specs
2. Breaking changes to standards would require major version bump
3. DKAN API changes handled through client updates
4. Data dictionary versions managed per-dictionary

---

## Validation and Testing

### Type-Level Validation

TypeScript provides compile-time validation:

```typescript
// Valid - passes type check
const dataset: DkanDataset = {
  identifier: "123",
  title: "Title",
  description: "Description",
  accessLevel: "public",
  modified: "2025-01-15",
  keyword: ["tag1"],
  publisher: { name: "Org" },
  contactPoint: {
    "@type": "vcard:Contact",
    fn: "John",
    hasEmail: "mailto:john@example.com"
  }
}

// Invalid - compile error
const invalid: DkanDataset = {
  accessLevel: "invalid"  // Error: Type '"invalid"' is not assignable to type
}
```

### Runtime Validation

For runtime validation, integrate validation libraries:

```typescript
import { z } from 'zod'

const datasetSchema = z.object({
  identifier: z.string(),
  title: z.string().min(1),
  description: z.string().min(10),
  accessLevel: z.enum(['public', 'restricted public', 'non-public']),
  modified: z.string().datetime(),
  keyword: z.array(z.string()).min(1),
  // ... rest of schema
})

function validateDataset(data: unknown): DkanDataset {
  return datasetSchema.parse(data)  // Throws if invalid
}
```

### Test Fixtures

Create valid test data:

```typescript
// __tests__/fixtures/datasets.ts
export const mockDataset: DkanDataset = {
  identifier: "test-123",
  title: "Test Dataset",
  description: "Test description for validation",
  accessLevel: "public",
  modified: "2025-01-15",
  keyword: ["test", "fixture"],
  publisher: { name: "Test Org" },
  contactPoint: {
    "@type": "vcard:Contact",
    fn: "Test Contact",
    hasEmail: "mailto:test@example.com"
  },
  distribution: [{
    "@type": "dcat:Distribution",
    downloadURL: "https://test.example.com/data.csv",
    mediaType: "text/csv"
  }]
}

export const mockDataDictionary: DataDictionary = {
  identifier: "dict-123",
  version: "1.0",
  data: {
    title: "Test Dictionary",
    fields: [
      {
        name: "id",
        type: "integer",
        constraints: { required: true, unique: true }
      },
      {
        name: "name",
        type: "string",
        constraints: { required: true, maxLength: 100 }
      }
    ]
  }
}
```

---

## References

### Official Specifications

- [DCAT-US v1.1 Specification](https://resources.data.gov/resources/dcat-us/)
- [Project Open Data Metadata Schema](https://project-open-data.cio.gov/v1.1/schema/)
- [Frictionless Table Schema v1](https://specs.frictionlessdata.io/table-schema/)
- [W3C DCAT Vocabulary](https://www.w3.org/TR/vocab-dcat/)

### JSON Schemas

- [DCAT-US JSON Schema](https://project-open-data.cio.gov/v1.1/schema/catalog.json)
- [Frictionless JSON Schema](https://specs.frictionlessdata.io/schemas/table-schema.json)

### Tools and Validators

- [Data.gov Catalog Validator](https://catalog.data.gov)
- [Frictionless Data Tools](https://frictionlessdata.io/)

### Related Standards

- [ISO 8601 Date and Time](https://www.iso.org/iso-8601-date-and-time-format.html)
- [ISO 639-1 Language Codes](https://www.iso.org/iso-639-language-codes.html)
- [vCard Format](https://www.w3.org/TR/vcard-rdf/)
- [Dublin Core Metadata](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/)

### DKAN Documentation

- [DKAN Official Documentation](https://dkan.readthedocs.io/)
- [DKAN Metastore](https://dkan.readthedocs.io/en/latest/components/metastore.html)
- [DKAN Data Dictionary](https://dkan.readthedocs.io/en/latest/components/data-dictionary.html)

### Internal Documentation

- [DKAN API Documentation](../platforms/DKAN_API.md)
- [Architecture Documentation](../../ARCHITECTURE.md)
