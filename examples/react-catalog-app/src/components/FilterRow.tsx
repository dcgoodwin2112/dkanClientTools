import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { DatastoreField } from '@dkan-client-tools/core'
import type { DataTableFilter } from '../types/filters'
import { OPERATORS_BY_TYPE, getFieldType } from '../types/filters'

interface FilterRowProps {
  filter: DataTableFilter
  fields: DatastoreField[]
  onChange: (filter: DataTableFilter) => void
  onRemove: () => void
}

/**
 * Fully controlled filter row component
 */
export const FilterRow = memo(function FilterRow({
  filter,
  fields,
  onChange,
  onRemove,
}: FilterRowProps) {
  const fieldType = getFieldType(filter.column, fields)
  const operators = OPERATORS_BY_TYPE[fieldType]

  return (
    <div className="filter-row">
      <select
        className="filter-select filter-column"
        value={filter.column}
        onChange={(e) => onChange({ ...filter, column: e.target.value })}
      >
        <option value="">Select column...</option>
        {fields.map((field) => (
          <option key={field.name} value={field.name}>
            {field.name}
          </option>
        ))}
      </select>

      <select
        className="filter-select filter-operator"
        value={filter.operator}
        onChange={(e) =>
          onChange({ ...filter, operator: e.target.value as DataTableFilter['operator'] })
        }
        disabled={!filter.column}
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        className="filter-input filter-value"
        placeholder="Enter value..."
        value={filter.value}
        onChange={(e) => onChange({ ...filter, value: e.target.value })}
        disabled={!filter.column}
      />

      <button type="button" className="filter-remove-btn" onClick={onRemove} title="Remove filter">
        <FontAwesomeIcon icon="times" />
      </button>
    </div>
  )
})
