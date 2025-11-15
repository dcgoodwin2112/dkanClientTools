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

**Location**: `@dkan-client-tools/core/src/types.ts`

**Main Types**: `DkanDataset`, `Publisher`, `ContactPoint`, `Distribution`

**Patterns Used**:
- Union literal types for enums (`accessLevel: 'public' | 'restricted public' | 'non-public'`)
- Optional properties (`distribution?`, `theme?`)
- Index signature for extensibility (`[key: string]: any`)
- Recursive types (`Publisher.subOrganizationOf`)
- Required nested objects (`publisher`, `contactPoint`)

---

## Frictionless Table Schema Types

**Location**: `@dkan-client-tools/core/src/types.ts`

**Main Types**: `DatastoreSchema`, `SchemaField`, `FieldType`, `FieldConstraints`

**Patterns**: Union type for field types (`string | number | integer | ...`), optional array types for composite keys

---

## API Response Typing

**Generic wrapper**: `DkanApiResponse<T>` with `data`, `status`, `statusText`

**Search response**: `DkanSearchResponse` with `total`, `results[]`, `facets`

---

## Generic Hook/Composable Signatures

**React Pattern**: Options interface with TanStack Query config (`enabled`, `staleTime`, `gcTime`), returns `useQuery` result

**Vue Pattern**: Same options with `MaybeRefOrGetter<T>` for reactive params, `computed()` query keys, `toValue()` in query functions

---

## Type-Safe Query Keys

**Pattern**: Hierarchical tuple keys with `as const` for readonly tuples

**Examples**: `['dataset', id]`, `['datastore', datasetId, index]`, `['search', params]`

**Factory Pattern**: Create typed query key functions returning `as const` tuples for type safety

---

## MaybeRefOrGetter Pattern (Vue)

**Type**: `T | Ref<T> | ComputedRef<T> | (() => T)` - accepts plain values, refs, computed, or getter functions

**Usage**: Call `toValue()` to unwrap in query functions, use `computed()` for query keys

**Benefit**: Single composable works with any reactive form - plain values, refs, computed, or getters
