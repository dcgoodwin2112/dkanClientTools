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

### useDataDictionary

Fetch a specific data dictionary by identifier.

```tsx
import { useDataDictionary } from '@dkan-client-tools/react'

function DataDictionaryViewer({ dictionaryId }: { dictionaryId: string }) {
  const { data, isLoading, error } = useDataDictionary({
    identifier: dictionaryId
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return null

  return (
    <div>
      <h2>{data.data.title}</h2>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Format</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {data.data.fields.map(field => (
            <tr key={field.name}>
              <td>{field.title || field.name}</td>
              <td>{field.type}</td>
              <td>{field.format || 'N/A'}</td>
              <td>{field.description || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### useDataDictionaryList

Fetch all data dictionaries available in the DKAN instance.

```tsx
import { useDataDictionaryList } from '@dkan-client-tools/react'

function DataDictionaryList() {
  const { data, isLoading, error } = useDataDictionaryList()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return null

  return (
    <ul>
      {data.map(dict => (
        <li key={dict.identifier}>
          <a href={`/dictionary/${dict.identifier}`}>
            {dict.data.title || dict.identifier}
          </a>
        </li>
      ))}
    </ul>
  )
}
```

### useDataDictionaryFromUrl

Fetch a data dictionary from a URL (useful for distributions with `describedBy` field).

```tsx
import { useDataset, useDataDictionaryFromUrl } from '@dkan-client-tools/react'

function DatasetWithDictionary({ datasetId }: { datasetId: string }) {
  const { data: dataset } = useDataset({ identifier: datasetId })
  const distribution = dataset?.distribution?.[0]

  const { data: dictionary, isLoading } = useDataDictionaryFromUrl({
    url: distribution?.describedBy || '',
    enabled: !!distribution?.describedBy &&
             distribution.describedByType === 'application/vnd.tableschema+json'
  })

  if (isLoading) return <div>Loading dictionary...</div>

  if (dictionary) {
    return (
      <div>
        <h3>Data Dictionary: {dictionary.data.title}</h3>
        <ul>
          {dictionary.data.fields.map(field => (
            <li key={field.name}>
              <strong>{field.title || field.name}</strong> ({field.type})
              {field.description && <p>{field.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return <div>No data dictionary available</div>
}
```

### useDatastoreSchema

Fetch the datastore schema with data dictionary information for a specific dataset resource.

```tsx
import { useDatastoreSchema } from '@dkan-client-tools/react'

function DatastoreSchemaViewer({ datasetId }: { datasetId: string }) {
  const { data, isLoading, error } = useDatastoreSchema({
    datasetId,
    index: 0
  })

  if (isLoading) return <div>Loading schema...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data?.schema) return <div>No schema available</div>

  return (
    <div>
      <h3>Datastore Schema</h3>
      <ul>
        {data.schema.fields.map(field => (
          <li key={field.name}>
            {field.name}: {field.type}
            {field.format && ` (${field.format})`}
          </li>
        ))}
      </ul>
      {data.results && (
        <p>Sample data available: {data.count} rows</p>
      )}
    </div>
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

### 1. Display Schema Information

Use data dictionaries to show users what fields are available and their types:

```tsx
function SchemaDocumentation({ dictionaryId }: { dictionaryId: string }) {
  const { data } = useDataDictionary({ identifier: dictionaryId })

  return (
    <div>
      {data?.data.fields.map(field => (
        <div key={field.name}>
          <h4>{field.title || field.name}</h4>
          <p><strong>Type:</strong> {field.type}</p>
          {field.format && <p><strong>Format:</strong> {field.format}</p>}
          {field.description && <p>{field.description}</p>}
          {field.constraints && (
            <ul>
              {field.constraints.required && <li>Required</li>}
              {field.constraints.unique && <li>Unique</li>}
              {field.constraints.minimum !== undefined &&
                <li>Min: {field.constraints.minimum}</li>}
              {field.constraints.maximum !== undefined &&
                <li>Max: {field.constraints.maximum}</li>}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
```

### 2. Generate Dynamic Forms

Create forms based on data dictionary schema:

```tsx
function DynamicForm({ dictionaryId }: { dictionaryId: string }) {
  const { data } = useDataDictionary({ identifier: dictionaryId })

  if (!data) return null

  return (
    <form>
      {data.data.fields.map(field => {
        switch (field.type) {
          case 'string':
            return (
              <input
                key={field.name}
                name={field.name}
                type="text"
                placeholder={field.title || field.name}
                required={field.constraints?.required}
              />
            )
          case 'number':
          case 'integer':
            return (
              <input
                key={field.name}
                name={field.name}
                type="number"
                placeholder={field.title || field.name}
                min={field.constraints?.minimum}
                max={field.constraints?.maximum}
                required={field.constraints?.required}
              />
            )
          case 'date':
            return (
              <input
                key={field.name}
                name={field.name}
                type="date"
                placeholder={field.title || field.name}
                required={field.constraints?.required}
              />
            )
          default:
            return null
        }
      })}
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 3. Format Data Display

Use format information to properly display data:

```tsx
function formatValue(value: any, field: DataDictionaryField) {
  if (field.type === 'date' || field.type === 'datetime') {
    const date = new Date(value)
    if (field.format === '%m/%d/%Y') {
      return date.toLocaleDateString('en-US')
    }
    return date.toLocaleDateString()
  }

  if (field.type === 'number' && field.format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return value
}
```

### 4. Validate Data

Use constraints to validate user input:

```tsx
function validateField(value: any, field: DataDictionaryField): string | null {
  if (field.constraints) {
    if (field.constraints.required && !value) {
      return `${field.title || field.name} is required`
    }

    if (field.type === 'number' || field.type === 'integer') {
      if (field.constraints.minimum !== undefined && value < field.constraints.minimum) {
        return `Minimum value is ${field.constraints.minimum}`
      }
      if (field.constraints.maximum !== undefined && value > field.constraints.maximum) {
        return `Maximum value is ${field.constraints.maximum}`
      }
    }

    if (field.type === 'string') {
      if (field.constraints.minLength && value.length < field.constraints.minLength) {
        return `Minimum length is ${field.constraints.minLength}`
      }
      if (field.constraints.maxLength && value.length > field.constraints.maxLength) {
        return `Maximum length is ${field.constraints.maxLength}`
      }
      if (field.constraints.pattern && !new RegExp(field.constraints.pattern).test(value)) {
        return `Invalid format`
      }
    }
  }

  return null
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
