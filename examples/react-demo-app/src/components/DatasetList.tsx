import { useState, useMemo } from 'react'
import { useDatasetSearch } from '@dkan-client-tools/react'
import './DatasetList.css'

function DatasetList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const pageSize = 10

  const toggleCard = (identifier: string) => {
    setExpandedCard(expandedCard === identifier ? null : identifier)
  }

  const searchOptions = useMemo(
    () => ({
      fulltext: searchTerm || undefined,
      page: page, // DKAN uses 1-based pagination
      'page-size': pageSize,
    }),
    [searchTerm, page]
  )

  const { data: searchResults, isLoading, error } = useDatasetSearch({ searchOptions })

  const datasets = searchResults?.results || []
  const totalResults = searchResults?.total || 0
  const totalPages = Math.ceil(totalResults / pageSize)

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  return (
    <div className="dataset-list">
      <h2>DKAN Dataset Search</h2>

      <div className="search-box">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          type="text"
          placeholder="Search datasets..."
          className="search-input"
        />
      </div>

      {isLoading && <div className="loading">Loading datasets...</div>}

      {error && <div className="error">Error: {error.message}</div>}

      {!isLoading && !error && (
        <>
          <div className="results-info">
            Found {totalResults} datasets (Page {page} of {totalPages || 1})
          </div>

          {datasets.length === 0 && <div className="no-results">No datasets found.</div>}

          {datasets.length > 0 && (
            <div className="dataset-items">
              {datasets.map((dataset) => {
                const isExpanded = expandedCard === dataset.identifier
                return (
                  <div
                    key={dataset.identifier}
                    className={`dataset-card ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleCard(dataset.identifier)}
                  >
                    <div className="card-header">
                      <h3>{dataset.title}</h3>
                      <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
                    </div>

                    {dataset.description && (
                      <p className="description">
                        {isExpanded
                          ? dataset.description
                          : `${dataset.description.substring(0, 200)}${
                              dataset.description.length > 200 ? '...' : ''
                            }`}
                      </p>
                    )}

                    <div className="metadata">
                      <span className="tag">{dataset.accessLevel}</span>
                      {dataset.modified && (
                        <span className="modified">
                          Modified: {new Date(dataset.modified).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {dataset.keyword && dataset.keyword.length > 0 && (
                      <div className="keywords">
                        {dataset.keyword.map((keyword) => (
                          <span key={keyword} className="keyword">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="expanded-details">
                        {dataset.identifier && (
                          <div className="detail-row">
                            <strong>Identifier:</strong>
                            <span>{dataset.identifier}</span>
                          </div>
                        )}

                        {dataset.publisher && (
                          <div className="detail-row">
                            <strong>Publisher:</strong>
                            <span>{dataset.publisher.name}</span>
                          </div>
                        )}

                        {dataset.theme && dataset.theme.length > 0 && (
                          <div className="detail-row">
                            <strong>Theme:</strong>
                            <span>{dataset.theme.join(', ')}</span>
                          </div>
                        )}

                        {dataset.issued && (
                          <div className="detail-row">
                            <strong>Issued:</strong>
                            <span>{new Date(dataset.issued).toLocaleDateString()}</span>
                          </div>
                        )}

                        {dataset.contactPoint && (
                          <div className="detail-row">
                            <strong>Contact:</strong>
                            <span>
                              {dataset.contactPoint.fn}
                              {dataset.contactPoint.hasEmail && (
                                <> ({dataset.contactPoint.hasEmail.replace('mailto:', '')})</>
                              )}
                            </span>
                          </div>
                        )}

                        {dataset.distribution && dataset.distribution.length > 0 && (
                          <div className="detail-row">
                            <strong>Distributions:</strong>
                            <div className="distributions">
                              {dataset.distribution.map((dist, idx) => (
                                <div key={idx} className="distribution-item">
                                  <span className="distribution-title">{dist.title || `Distribution ${idx + 1}`}</span>
                                  {dist.format && <span className="distribution-format">{dist.format}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {dataset.license && (
                          <div className="detail-row">
                            <strong>License:</strong>
                            <a href={dataset.license} target="_blank" rel="noopener noreferrer">
                              {dataset.license}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={prevPage} disabled={page === 1}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button onClick={nextPage} disabled={page === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DatasetList
