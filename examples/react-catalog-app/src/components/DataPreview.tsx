import { useState, useMemo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDatastore, createDatastoreColumns, flexRender } from '@dkan-client-tools/react'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import type { DatastoreSort } from '@dkan-client-tools/core'
import { FullScreenDataPreview } from './FullScreenDataPreview'
import '../styles/DataPreview.css'

function convertSortingToDkan(sorting: SortingState): DatastoreSort[] {
  return sorting.map((sort) => ({
    property: sort.id,
    order: sort.desc ? 'desc' : 'asc',
  }))
}

interface DataPreviewProps {
  datasetId: string
  distributionIndex: number
  distributionTitle: string
  defaultOpen?: boolean
}

export function DataPreview({ datasetId, distributionIndex, distributionTitle, defaultOpen }: DataPreviewProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false)
  const [showFullScreen, setShowFullScreen] = useState(false)
  const [page, setPage] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const pageSize = 10

  const dkanSorts = useMemo(() => convertSortingToDkan(sorting), [sorting])

  const query = useDatastore({
    datasetId,
    index: distributionIndex,
    queryOptions: {
      limit: pageSize,
      offset: page * pageSize,
      sorts: dkanSorts.length > 0 ? dkanSorts : undefined,
    },
    enabled: isOpen, // Only query when preview is open
  })

  const columns = useMemo(
    () =>
      createDatastoreColumns({
        fields: query.data?.schema?.fields || [],
      }),
    [query.data?.schema?.fields]
  )

  const table = useReactTable({
    data: query.data?.results ?? [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setPage(0) // Reset to first page when opening
      setSorting([]) // Reset sorting when opening
    }
  }

  const handleCloseFullScreen = useCallback(() => {
    setShowFullScreen(false)
  }, [])

  const totalRows = query.data?.count || 0
  const totalPages = Math.ceil(totalRows / pageSize)

  if (!isOpen) {
    return (
      <button onClick={handleToggle} className="preview-toggle-button">
        <FontAwesomeIcon icon="eye" />
        Preview Data
      </button>
    )
  }

  return (
    <div className="data-preview">
      <div className="data-preview-header">
        <h4 className="data-preview-title">
          <FontAwesomeIcon icon="table" />
          Data Preview: {distributionTitle}
        </h4>
        <div className="preview-header-buttons">
          <button onClick={() => setShowFullScreen(true)} className="preview-fullscreen-button">
            <FontAwesomeIcon icon="expand" />
            Full Screen
          </button>
          <button onClick={handleToggle} className="preview-close-button">
            <FontAwesomeIcon icon="times" />
            Close
          </button>
        </div>
      </div>

      {query.isLoading && (
        <div className="data-preview-loading">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {query.error && (
        <div className="data-preview-error">
          <p>Error loading data: {query.error.message}</p>
          <p className="data-preview-error-hint">
            This resource may not have been imported into the datastore yet.
          </p>
        </div>
      )}

      {query.data && query.data.results.length > 0 && (
        <>
          <div className="data-preview-info">
            <p>
              Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalRows)} of{' '}
              <strong>{totalRows}</strong> rows
            </p>
          </div>

          <div className="data-preview-table-container">
            <table className="data-preview-table">
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
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="data-preview-pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="pagination-button"
              >
                <FontAwesomeIcon icon="chevron-left" />
                Previous
              </button>

              <span className="pagination-info">
                Page {page + 1} of {totalPages}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="pagination-button"
              >
                Next
                <FontAwesomeIcon icon="chevron-right" />
              </button>
            </div>
          )}
        </>
      )}

      {query.data && query.data.results.length === 0 && !query.isLoading && (
        <div className="data-preview-empty">
          <p>No data available for this resource.</p>
        </div>
      )}

      {showFullScreen && (
        <FullScreenDataPreview
          datasetId={datasetId}
          distributionIndex={distributionIndex}
          distributionTitle={distributionTitle}
          onClose={handleCloseFullScreen}
        />
      )}
    </div>
  )
}
