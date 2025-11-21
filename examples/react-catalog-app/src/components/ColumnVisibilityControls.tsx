import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { Column } from '@tanstack/react-table'

interface ColumnVisibilityControlsProps {
  columns: Column<any, unknown>[]
  onClose: () => void
}

export function ColumnVisibilityControls({
  columns,
  onClose,
}: ColumnVisibilityControlsProps) {
  const visibleCount = columns.filter((col) => col.getIsVisible()).length

  const handleToggleAll = (visible: boolean) => {
    columns.forEach((col) => col.toggleVisibility(visible))
  }

  return (
    <div className="column-visibility-controls">
      {/* Header */}
      <div className="column-visibility-header">
        <h3 className="column-visibility-title">
          <FontAwesomeIcon icon="columns" />
          Manage Columns
        </h3>
        <button
          type="button"
          className="column-visibility-close-btn"
          onClick={onClose}
          title="Hide column controls"
        >
          <FontAwesomeIcon icon="times" />
        </button>
      </div>

      {/* Body */}
      <div className="column-visibility-body">
        <div className="column-visibility-list">
          {columns.map((column) => (
            <label key={column.id} className="column-visibility-item">
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={() => column.toggleVisibility()}
              />
              <span className="column-name">
                {typeof column.columnDef.header === 'string'
                  ? column.columnDef.header
                  : column.id}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="column-visibility-footer">
        <button
          type="button"
          className="column-action-btn column-show-all-btn"
          onClick={() => handleToggleAll(true)}
        >
          <FontAwesomeIcon icon="eye" />
          Show All
        </button>
        <button
          type="button"
          className="column-action-btn column-hide-all-btn"
          onClick={() => handleToggleAll(false)}
        >
          <FontAwesomeIcon icon="eye-slash" />
          Hide All
        </button>
      </div>

      <div className="column-visibility-info">
        <FontAwesomeIcon icon="info-circle" />
        {visibleCount} of {columns.length} columns visible
      </div>
    </div>
  )
}
