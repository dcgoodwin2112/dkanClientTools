import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { flexRender, Table as TableType } from '@tanstack/react-table'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface VirtualizedTableProps<T> {
  table: TableType<T>
  estimatedRowHeight?: number
}

export function VirtualizedTable<T>({ table, estimatedRowHeight = 35 }: VirtualizedTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0

  return (
    <div ref={tableContainerRef} className="virtualized-table-container">
      <table className="virtualized-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={
                    header.column.getCanSort()
                      ? header.column.getToggleSortingHandler()
                      : undefined
                  }
                  className={header.column.getCanSort() ? 'sortable-header' : ''}
                >
                  <div className="header-content">
                    <span>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    {header.column.getCanSort() && (
                      <span className="sort-icon">
                        {header.column.getIsSorted() === 'asc' ? (
                          <FontAwesomeIcon icon="sort-up" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <FontAwesomeIcon icon="sort-down" />
                        ) : (
                          <FontAwesomeIcon icon="sort" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualRows.length > 0 ? (
            virtualRows.map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index]
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={table.getAllColumns().length} className="empty-state">
                No data available
              </td>
            </tr>
          )}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
