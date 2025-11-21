import type { DatastoreCondition, DatastoreField } from '@dkan-client-tools/core'

/**
 * Client-side filter representation for UI
 */
export interface DataTableFilter {
  id: string // Unique ID for React keys
  column: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like'
  value: string
}

/**
 * Field type information from schema
 */
export type FieldType = 'string' | 'integer' | 'number' | 'date' | 'datetime' | 'boolean'

/**
 * Available operators for each field type
 */
export const OPERATORS_BY_TYPE: Record<FieldType, Array<{ value: string; label: string }>> = {
  string: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: 'like', label: 'contains' },
  ],
  integer: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: '>', label: 'greater than' },
    { value: '<', label: 'less than' },
    { value: '>=', label: 'greater or equal' },
    { value: '<=', label: 'less or equal' },
  ],
  number: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: '>', label: 'greater than' },
    { value: '<', label: 'less than' },
    { value: '>=', label: 'greater or equal' },
    { value: '<=', label: 'less or equal' },
  ],
  date: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: '>', label: 'after' },
    { value: '<', label: 'before' },
  ],
  datetime: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: '>', label: 'after' },
    { value: '<', label: 'before' },
  ],
  boolean: [{ value: '=', label: 'equals' }],
}

/**
 * Get field type from schema
 */
export function getFieldType(fieldName: string, fields: DatastoreField[]): FieldType {
  const field = fields.find((f) => f.name === fieldName)
  if (!field?.type) return 'string'

  // Map Frictionless types to our simplified types
  const type = field.type.toLowerCase()
  if (type === 'integer') return 'integer'
  if (type === 'number') return 'number'
  if (type === 'date') return 'date'
  if (type === 'datetime') return 'datetime'
  if (type === 'boolean') return 'boolean'
  return 'string'
}

/**
 * Converts client-side filters to DKAN datastore conditions
 */
export function convertFiltersToConditions(filters: DataTableFilter[]): DatastoreCondition[] {
  return filters
    .filter((f) => f.column && f.value) // Only include filters with column and value
    .map((f) => ({
      property: f.column,
      value: f.value,
      operator: f.operator,
    }))
}
