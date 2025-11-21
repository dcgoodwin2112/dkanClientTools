import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { DatastoreField } from '@dkan-client-tools/core'
import type { DataTableFilter } from '../types/filters'
import { FilterRow } from './FilterRow'

interface DataTableFiltersProps {
  filters: DataTableFilter[]
  fields: DatastoreField[]
  onChange: (filters: DataTableFilter[]) => void
  onClose: () => void
}

/**
 * Fully controlled filters component - no local state
 */
export const DataTableFilters = memo(function DataTableFilters({
  filters,
  fields,
  onChange,
  onClose,
}: DataTableFiltersProps) {
  const handleAddFilter = () => {
    const newFilter: DataTableFilter = {
      id: crypto.randomUUID(),
      column: '',
      operator: '=',
      value: '',
    }
    onChange([...filters, newFilter])
  }

  const handleUpdateFilter = (index: number, updatedFilter: DataTableFilter) => {
    const newFilters = [...filters]
    newFilters[index] = updatedFilter
    onChange(newFilters)
  }

  const handleRemoveFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className="data-table-filters">
      <div className="filters-header">
        <h3 className="filters-title">
          <FontAwesomeIcon icon="filter" />
          Filters
        </h3>
        <button type="button" className="filters-close-btn" onClick={onClose} title="Hide filters">
          <FontAwesomeIcon icon="times" />
        </button>
      </div>

      <div className="filters-body">
        {filters.length === 0 ? (
          <div className="filters-empty">
            <FontAwesomeIcon icon="filter" />
            <p>No filters applied</p>
            <p className="filters-empty-hint">Click "Add Filter" to start filtering data</p>
          </div>
        ) : (
          <div className="filters-list">
            {filters.map((filter, index) => (
              <FilterRow
                key={filter.id}
                filter={filter}
                fields={fields}
                onChange={(updated) => handleUpdateFilter(index, updated)}
                onRemove={() => handleRemoveFilter(index)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="filters-footer">
        <button type="button" className="filter-action-btn filter-add-btn" onClick={handleAddFilter}>
          <FontAwesomeIcon icon="plus" />
          Add Filter
        </button>

        {filters.length > 0 && (
          <button
            type="button"
            className="filter-action-btn filter-clear-btn"
            onClick={handleClearAll}
          >
            <FontAwesomeIcon icon="times-circle" />
            Clear All
          </button>
        )}
      </div>
    </div>
  )
})
