# TypeScript Patterns Used in This Project

Project-specific TypeScript patterns and conventions for dkanClientTools.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [General TypeScript Reference](../external/frameworks/TYPESCRIPT.md)
- [Architecture](./ARCHITECTURE.md)
- [API Reference](./API.md)

---

## Quick Reference

**DCAT-US Types**:
- `DkanDataset` - Federal data catalog schema
- `Publisher` - Organization/agency information
- `Distribution` - Data file references

**Frictionless Types**:
- `DatastoreSchema` - Table schema definition
- `SchemaField` - Column metadata
- `FieldType` - Data type literals

**Query Patterns**:
- Query keys: `['dataset', id]` as const
- MaybeRefOrGetter (Vue): Flexible reactive parameters
- Generic hooks: `UseDatasetOptions` interfaces

---

## Table of Contents

- [DCAT-US Schema Type Definitions](#dcat-us-schema-type-definitions)
- [Frictionless Table Schema Types](#frictionless-table-schema-types)
- [API Response Typing](#api-response-typing)
- [Generic Hook/Composable Signatures](#generic-hookcomposable-signatures)
- [Type-Safe Query Keys](#type-safe-query-keys)
- [MaybeRefOrGetter Pattern (Vue)](#maybereforgetter-pattern-vue)

---

## DCAT-US Schema Type Definitions

**From @dkan-client-tools/core/src/types.ts:**
```typescript
export interface DkanDataset {
  identifier: string
  title: string
  description: string
  accessLevel: 'public' | 'restricted public' | 'non-public'
  modified: string
  keyword: string[]
  publisher: Publisher
  contactPoint: ContactPoint
  distribution?: Distribution[]
  theme?: string[]
  spatial?: string
  temporal?: string
  license?: string
  landingPage?: string
  [key: string]: any  // Allow custom fields
}

export interface Publisher {
  name: string
  '@type'?: string
  subOrganizationOf?: Publisher  // Recursive type
}

export interface ContactPoint {
  '@type': string
  fn: string
  hasEmail: string
}

export interface Distribution {
  '@type': string
  identifier?: string
  title?: string
  format?: string
  mediaType?: string
  downloadURL?: string
  accessURL?: string
  data?: DistributionData
}
```

**Key Patterns:**
- Union literal types for enums (`accessLevel`)
- Optional properties (`distribution?`, `theme?`)
- Index signature for extensibility (`[key: string]: any`)
- Recursive types (`Publisher.subOrganizationOf`)
- Required nested objects (`publisher`, `contactPoint`)

---

## Frictionless Table Schema Types

**Schema Types:**
```typescript
export interface DatastoreSchema {
  fields: SchemaField[]
  primaryKey?: string | string[]
  foreignKeys?: ForeignKey[]
}

export interface SchemaField {
  name: string
  title?: string
  type: FieldType
  format?: string
  constraints?: FieldConstraints
}

export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'
  | 'time'
  | 'datetime'
  | 'year'
  | 'yearmonth'
  | 'duration'
  | 'geopoint'
  | 'geojson'
  | 'any'

export interface FieldConstraints {
  required?: boolean
  unique?: boolean
  minimum?: number | string
  maximum?: number | string
  pattern?: string
  enum?: any[]
}
```

---

## API Response Typing

**Generic Response Wrapper:**
```typescript
export interface DkanApiResponse<T> {
  data: T
  status?: number
  statusText?: string
}

// Usage
async function getDataset(id: string): Promise<DkanApiResponse<Dataset>> {
  const response = await fetch(`/api/datasets/${id}`)
  return {
    data: await response.json(),
    status: response.status,
    statusText: response.statusText
  }
}
```

**Search Response:**
```typescript
export interface DkanSearchResponse {
  total: number
  results: DkanDataset[]
  facets?: Record<string, any>
}

// Typed search function
async function searchDatasets(keyword: string): Promise<DkanSearchResponse> {
  // ...
}
```

---

## Generic Hook/Composable Signatures

**React Hook Pattern:**
```typescript
export interface UseDatasetOptions {
  identifier: string
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

export function useDataset(options: UseDatasetOptions) {
  const dkanClient = useDkanClient()

  return useQuery({
    queryKey: ['dataset', options.identifier],
    queryFn: () => dkanClient.getDataset(options.identifier),
    enabled: options.enabled !== false && !!options.identifier,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    gcTime: options.gcTime ?? 5 * 60 * 1000
  })
}
```

**Vue Composable Pattern:**
```typescript
import { type MaybeRefOrGetter, toValue, computed } from 'vue'

export interface UseDatasetOptions {
  identifier: MaybeRefOrGetter<string>  // Flexible reactive parameter
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export function useDataset(options: UseDatasetOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => ['dataset', toValue(options.identifier)]),
    queryFn: () => client.getDataset(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) ?? true
  })
}
```

---

## Type-Safe Query Keys

**Query Key Pattern:**
```typescript
// Hierarchical query keys for TanStack Query
type QueryKey =
  | ['dataset', string]
  | ['datasets']
  | ['datastore', string, number]
  | ['search', SearchParams]

// Type-safe query key factory
const queryKeys = {
  dataset: (id: string) => ['dataset', id] as const,
  datasets: () => ['datasets'] as const,
  datastore: (datasetId: string, index: number) => ['datastore', datasetId, index] as const,
  search: (params: SearchParams) => ['search', params] as const
}

// Usage
useQuery({
  queryKey: queryKeys.dataset('abc-123'),
  queryFn: () => fetchDataset('abc-123')
})
```

**Const Assertion for Readonly Tuples:**
```typescript
const key = ['dataset', 'abc'] as const
// Type: readonly ['dataset', 'abc']
// Not: (string | 'dataset')[]
```

---

## MaybeRefOrGetter Pattern (Vue)

**Flexible Reactive Parameters:**
```typescript
import { type MaybeRefOrGetter, toValue } from 'vue'

type MaybeRefOrGetter<T> = T | Ref<T> | ComputedRef<T> | (() => T)

// Composable accepts any reactive form
export function useDataset(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ['dataset', toValue(id)]),
    queryFn: () => client.getDataset(toValue(id))
  })
}

// All of these work:
useDataset('abc-123')                    // Plain string
useDataset(ref('abc-123'))               // Ref
useDataset(computed(() => route.params.id))  // Computed
useDataset(() => route.params.id)        // Getter function
```
