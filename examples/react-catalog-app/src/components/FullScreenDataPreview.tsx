import { useState, useMemo, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDatastore, createDatastoreColumns, useDownloadQuery } from '@dkan-client-tools/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { VirtualizedTable } from './VirtualizedTable'
import { DataTableFilters } from './DataTableFilters'
import { ColumnVisibilityControls } from './ColumnVisibilityControls'
import type { DataTableFilter } from '../types/filters'
import { convertFiltersToConditions } from '../types/filters'
import '../styles/FullScreenDataPreview.css'

interface FullScreenDataPreviewProps {
  datasetId: string
  distributionIndex: number
  distributionTitle: string
  onClose: () => void
}

export function FullScreenDataPreview({
  datasetId,
  distributionIndex,
  distributionTitle,
  onClose,
}: FullScreenDataPreviewProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<DataTableFilter[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showColumnControls, setShowColumnControls] = useState(false)

  // Convert filters to DKAN conditions - MEMOIZED
  const conditions = useMemo(() => {
    return convertFiltersToConditions(filters)
  }, [filters])

  // Create query options with conditions - MEMOIZED
  const queryOptions = useMemo(
    () => ({
      limit: 500,
      offset: 0,
      conditions: conditions.length > 0 ? conditions : undefined,
    }),
    [conditions]
  )

  const query = useDatastore({
    datasetId,
    index: distributionIndex,
    queryOptions,
  })

  const downloadMutation = useDownloadQuery()

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
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const totalCount = query.data?.count || 0
  const activeFilterCount = filters.filter((f) => f.column && f.value).length

  // Stable callbacks
  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev)
  }, [])

  const handleCloseFilters = useCallback(() => {
    setShowFilters(false)
  }, [])

  const handleFiltersChange = useCallback((newFilters: DataTableFilter[]) => {
    setFilters(newFilters)
  }, [])

  const handleToggleColumnControls = useCallback(() => {
    setShowColumnControls((prev) => !prev)
  }, [])

  const handleCloseColumnControls = useCallback(() => {
    setShowColumnControls(false)
  }, [])

  const handleDownload = useCallback(() => {
    downloadMutation.mutate(
      {
        datasetId,
        index: distributionIndex,
        queryOptions: {
          format: 'csv',
          conditions: conditions.length > 0 ? conditions : undefined,
        },
      },
      {
        onSuccess: (blob) => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${distributionTitle}-${activeFilterCount > 0 ? 'filtered' : 'full'}.csv`
          a.click()
          URL.revokeObjectURL(url)
        },
      }
    )
  }, [datasetId, distributionIndex, conditions, distributionTitle, activeFilterCount, downloadMutation])

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fullscreen-preview-overlay" onClick={onClose}>
      <div className="fullscreen-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fullscreen-preview-header">
          <h2 className="fullscreen-preview-title">
            <FontAwesomeIcon icon="table" />
            {distributionTitle}
          </h2>
          <div className="header-actions">
            <button
              onClick={handleToggleFilters}
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              title={showFilters ? 'Hide filters' : 'Show filters'}
            >
              <FontAwesomeIcon icon="filter" />
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
            </button>
            <button
              onClick={handleToggleColumnControls}
              className={`column-toggle-btn ${showColumnControls ? 'active' : ''}`}
              title={showColumnControls ? 'Hide column controls' : 'Show column controls'}
            >
              <FontAwesomeIcon icon="columns" />
              Columns
            </button>
            <button
              onClick={handleDownload}
              className="download-btn"
              disabled={downloadMutation.isPending}
              title={activeFilterCount > 0 ? 'Download filtered CSV' : 'Download full CSV'}
            >
              <FontAwesomeIcon
                icon={downloadMutation.isPending ? 'spinner' : 'download'}
                spin={downloadMutation.isPending}
              />
              {downloadMutation.isPending ? 'Downloading...' : 'Download CSV'}
            </button>
            <span className="row-count">{totalCount.toLocaleString()} rows</span>
            <button onClick={onClose} className="close-btn" title="Close (ESC)">
              <FontAwesomeIcon icon="times" />
              Close
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="fullscreen-preview-content">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="fullscreen-preview-sidebar">
              <DataTableFilters
                filters={filters}
                fields={query.data?.schema?.fields || []}
                onChange={handleFiltersChange}
                onClose={handleCloseFilters}
              />
            </aside>
          )}

          {/* Column Controls Sidebar */}
          {showColumnControls && (
            <aside className="fullscreen-preview-sidebar">
              <ColumnVisibilityControls
                columns={table.getAllLeafColumns()}
                onClose={handleCloseColumnControls}
              />
            </aside>
          )}

          {/* Table Area */}
          <div className="fullscreen-preview-table-area">
            {query.isLoading && (
              <div className="preview-loading">
                <div className="loading-spinner"></div>
                <p>Loading data...</p>
              </div>
            )}

            {query.error && (
              <div className="preview-error">
                <FontAwesomeIcon icon="exclamation-triangle" />
                <p>Error loading data: {query.error.message}</p>
                <p className="error-hint">
                  This resource may not have been imported into the datastore yet.
                </p>
              </div>
            )}

            {query.data && !query.isLoading && (
              <>
                {table.getRowModel().rows.length > 0 ? (
                  <VirtualizedTable table={table} />
                ) : (
                  <div className="preview-empty">
                    <FontAwesomeIcon icon="inbox" />
                    <p>No data available.</p>
                    {activeFilterCount > 0 && (
                      <p className="empty-hint">Try adjusting your filters.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
