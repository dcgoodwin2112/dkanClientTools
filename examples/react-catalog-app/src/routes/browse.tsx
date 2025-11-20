import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDatasetSearch } from '@dkan-client-tools/react'
import { SearchBar } from '../components/SearchBar'
import { DatasetCard } from '../components/DatasetCard'
import { Pagination } from '../components/Pagination'
import '../styles/Browse.css'

interface BrowseSearch {
  q?: string
  page?: number
  'page-size'?: number
}

export const Route = createFileRoute('/browse')({
  component: Browse,
  validateSearch: (search: Record<string, unknown>): BrowseSearch => {
    return {
      q: typeof search.q === 'string' ? search.q : undefined,
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
      page: searchParams.page || 1,
      'page-size': searchParams['page-size'] || 10,
    },
  })

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }

  const totalPages = data ? Math.ceil(data.total / (searchParams['page-size'] || 10)) : 0
  const currentPage = searchParams.page || 1

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
  )
}
