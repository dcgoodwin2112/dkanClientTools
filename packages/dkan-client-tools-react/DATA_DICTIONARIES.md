# Data Dictionary Support

This document explains how to use DKAN data dictionaries with the client tools.

## Overview

Data dictionaries in DKAN describe the structure and content of data elements following the [Frictionless Standards table schema](https://specs.frictionlessdata.io/table-schema/). They define:

- **Field names** and **types** (string, number, date, datetime, etc.)
- **Formats** (date format patterns, etc.)
- **Descriptions** and human-readable titles
- **Constraints** (required, unique, min/max, etc.)

Data dictionaries ensure proper data typing when CSV data imports into the datastore, enabling correct sorting and filtering of dates and numbers.

## React Hooks

```tsx
import {
  useDataDictionary,
  useDataDictionaryList,
  useDataDictionaryFromUrl,
  useDatastoreSchema
} from '@dkan-client-tools/react'

// Get specific dictionary
const { data } = useDataDictionary({ identifier: 'dict-id' })

// List all dictionaries
const { data: dictionaries } = useDataDictionaryList()

// Fetch from URL (e.g., distribution.describedBy)
const { data: dict } = useDataDictionaryFromUrl({ url: 'https://...' })

// Get datastore schema
const { data: schema } = useDatastoreSchema({ datasetId: 'id', index: 0 })
```

**Example: Display fields**
```tsx
function FieldList({ dictionaryId }: { dictionaryId: string }) {
  const { data } = useDataDictionary({ identifier: dictionaryId })

  return (
    <ul>
      {data?.data.fields.map(field => (
        <li key={field.name}>
          {field.title || field.name} ({field.type})
          {field.description && <p>{field.description}</p>}
        </li>
      ))}
    </ul>
  )
}
```

## Core API Methods

If you're not using React, you can access data dictionary methods directly from the core client:

```typescript
import { DkanClient } from '@dkan-client-tools/core'

const client = new DkanClient({
  baseUrl: 'https://your-dkan-site.com'
})

// List all data dictionaries
const dictionaries = await client.listDataDictionaries()

// Get specific data dictionary
const dictionary = await client.getDataDictionary('dictionary-uuid')

// Get data dictionary from URL
const dict = await client.getDataDictionaryFromUrl(
  'https://your-dkan-site.com/api/1/metastore/schemas/data-dictionary/items/uuid'
)

// Get datastore schema
const schema = await client.getDatastoreSchema('dataset-uuid', 0)
```

## Data Dictionary Types

### DataDictionary

```typescript
interface DataDictionary {
  identifier: string
  version?: string
  data: DataDictionaryData
}
```

### DataDictionaryData

```typescript
interface DataDictionaryData {
  title?: string
  fields: DataDictionaryField[]
  indexes?: DataDictionaryIndex[]
}
```

### DataDictionaryField

```typescript
interface DataDictionaryField {
  name: string                      // Machine name (required)
  title?: string                    // Human-readable label
  type: DataDictionaryFieldType     // Field type (required)
  format?: string                   // Format specification (e.g., "%m/%d/%Y")
  description?: string              // Field description
  constraints?: DataDictionaryConstraints
}
```

### DataDictionaryFieldType

Available field types:

- `string` - Text data
- `number` - Numeric data (floats)
- `integer` - Integer data
- `boolean` - True/false values
- `object` - JSON objects
- `array` - Arrays
- `any` - Any type
- `date` - Date (without time)
- `time` - Time (without date)
- `datetime` - Date and time
- `year` - Year only
- `yearmonth` - Year and month
- `duration` - Time duration

### DataDictionaryConstraints

```typescript
interface DataDictionaryConstraints {
  required?: boolean
  unique?: boolean
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  enum?: any[]
  pattern?: string
}
```

## Use Cases

**1. Display Schema Information** - Show field types, formats, constraints to users

**2. Generate Dynamic Forms** - Create form inputs based on field types and constraints

**3. Format Data Display** - Use format information to properly display dates, currency, etc.

**4. Validate Data** - Validate user input against constraints (required, min/max, pattern)

```tsx
// Example: Dynamic form generation
function DynamicForm({ dictionaryId }: { dictionaryId: string }) {
  const { data } = useDataDictionary({ identifier: dictionaryId })

  return (
    <form>
      {data?.data.fields.map(field => {
        if (field.type === 'string') {
          return <input type="text" name={field.name} required={field.constraints?.required} />
        }
        if (field.type === 'number' || field.type === 'integer') {
          return <input type="number" name={field.name} min={field.constraints?.minimum} />
        }
        if (field.type === 'date') {
          return <input type="date" name={field.name} />
        }
      })}
    </form>
  )
}
```

## API Endpoints

The following DKAN API endpoints are used:

- `GET /api/1/metastore/schemas/data-dictionary/items` - List all data dictionaries
- `GET /api/1/metastore/schemas/data-dictionary/items/{uuid}` - Get specific dictionary
- `GET /api/1/datastore/query/{dataset-uuid}/{index}?schema=true` - Get datastore schema

## Related Documentation

- [DKAN Data Dictionaries Guide](https://dkan.readthedocs.io/en/latest/user-guide/guide_data_dictionaries.html)
- [Frictionless Table Schema](https://specs.frictionlessdata.io/table-schema/)
- [DCAT-US Schema](https://resources.data.gov/resources/dcat-us/)
