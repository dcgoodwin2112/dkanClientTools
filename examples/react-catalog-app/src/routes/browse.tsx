import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDatasetSearch, useDatasetFacets } from '@dkan-client-tools/react'
import { SearchBar } from '../components/SearchBar'
import { DatasetCard } from '../components/DatasetCard'
import { Pagination } from '../components/Pagination'
import { FilterPanel } from '../components/FilterPanel'
import '../styles/Browse.css'

interface BrowseSearch {
  q?: string
  theme?: string
  publisher?: string
  page?: number
  'page-size'?: number
}

export const Route = createFileRoute('/browse')({
  component: Browse,
  validateSearch: (search: Record<string, unknown>): BrowseSearch => {
    return {
      q: typeof search.q === 'string' ? search.q : undefined,
      theme: typeof search.theme === 'string' ? search.theme : undefined,
      publisher: typeof search.publisher === 'string' ? search.publisher : undefined,
      page: typeof search.page === 'number' ? search.page : 1,
      'page-size': typeof search['page-size'] === 'number' ? search['page-size'] : 10,
    }
  },
})

function Browse() {
  const navigate = useNavigate({ from: '/browse' })
  const searchParams = Route.useSearch()

  const { data, isLoading, error } = useDatasetSearch({
    searchOptions: {
      fulltext: searchParams.q,
      theme: searchParams.theme,
      page: searchParams.page || 1,
      'page-size': searchParams['page-size'] || 10,
    },
  })

  const { data: facets } = useDatasetFacets()

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }

  const handleFilterChange = (filterType: 'theme' | 'publisher', value: string | undefined) => {
    navigate({
      search: (prev) => ({
        ...prev,
        [filterType]: value,
        page: 1, // Reset to first page when filtering
      }),
    })
  }

  const handleClearFilters = () => {
    navigate({
      search: (prev) => ({
        q: prev.q,
        page: 1,
        'page-size': prev['page-size'],
      }),
    })
  }

  const totalPages = data ? Math.ceil(data.total / (searchParams['page-size'] || 10)) : 0
  const currentPage = searchParams.page || 1
  const hasActiveFilters = !!(searchParams.theme || searchParams.publisher)

  return (
    <div className="browse-page">
      <div className="browse-container">
        {/* Search Section */}
        <div className="browse-header">
          <h1 className="browse-title">Browse Datasets</h1>
          <div className="browse-search">
            <SearchBar initialQuery={searchParams.q} />
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="browse-content">
          {/* Filter Sidebar */}
          <aside className="browse-sidebar">
            <FilterPanel
              facets={facets}
              selectedTheme={searchParams.theme}
              selectedPublisher={searchParams.publisher}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </aside>

          {/* Results Section */}
          <div className="browse-main">

            {/* Results Count */}
            {data && (
              <div className="browse-results-info">
                <p>
                  Found <strong>{data.total}</strong> dataset{data.total !== 1 ? 's' : ''}
                  {searchParams.q && (
                    <>
                      {' '}
                      for "<strong>{searchParams.q}</strong>"
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="browse-loading">
                <div className="loading-spinner"></div>
                <p>Loading datasets...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="browse-error">
                <p>Error loading datasets: {error.message}</p>
              </div>
            )}

            {/* Results */}
            {data && data.results.length > 0 && (
              <>
                <div className="browse-results">
                  {data.results.map((dataset) => (
                    <DatasetCard key={dataset.identifier} dataset={dataset} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}

            {/* No Results */}
            {data && data.results.length === 0 && (
              <div className="browse-no-results">
                <p>No datasets found{searchParams.q ? ` for "${searchParams.q}"` : ''}.</p>
                <p>Try a different search term or browse all datasets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
