import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../styles/FilterPanel.css'

interface FilterPanelProps {
  facets?: {
    theme: string[]
    keyword: string[]
    publisher: string[]
  }
  selectedTheme?: string
  selectedPublisher?: string
  onFilterChange: (filterType: 'theme' | 'publisher', value: string | undefined) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function FilterPanel({
  facets,
  selectedTheme,
  selectedPublisher,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: FilterPanelProps) {
  const handleThemeClick = (theme: string) => {
    if (selectedTheme === theme) {
      onFilterChange('theme', undefined)
    } else {
      onFilterChange('theme', theme)
    }
  }

  const handlePublisherClick = (publisher: string) => {
    if (selectedPublisher === publisher) {
      onFilterChange('publisher', undefined)
    } else {
      onFilterChange('publisher', publisher)
    }
  }

  if (!facets) {
    return (
      <div className="filter-panel">
        <div className="filter-loading">
          <p>Loading filters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3 className="filter-title">
          <FontAwesomeIcon icon="filter" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button onClick={onClearFilters} className="filter-clear-button">
            Clear All
          </button>
        )}
      </div>

      {/* Theme Filter */}
      {facets.theme && facets.theme.length > 0 && (
        <div className="filter-section">
          <h4 className="filter-section-title">
            <FontAwesomeIcon icon="tags" className="filter-section-icon" />
            Theme
          </h4>
          <div className="filter-options">
            {facets.theme.map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeClick(theme)}
                className={`filter-option ${selectedTheme === theme ? 'active' : ''}`}
              >
                <span className="filter-option-text">{theme}</span>
                {selectedTheme === theme && (
                  <FontAwesomeIcon icon="check" className="filter-option-check" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Publisher Filter */}
      {facets.publisher && facets.publisher.length > 0 && (
        <div className="filter-section">
          <h4 className="filter-section-title">
            <FontAwesomeIcon icon="building" className="filter-section-icon" />
            Publisher
          </h4>
          <div className="filter-options">
            {facets.publisher.slice(0, 10).map((publisher) => (
              <button
                key={publisher}
                onClick={() => handlePublisherClick(publisher)}
                className={`filter-option ${selectedPublisher === publisher ? 'active' : ''}`}
              >
                <span className="filter-option-text">{publisher}</span>
                {selectedPublisher === publisher && (
                  <FontAwesomeIcon icon="check" className="filter-option-check" />
                )}
              </button>
            ))}
            {facets.publisher.length > 10 && (
              <p className="filter-note">Showing top 10 publishers</p>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="filter-active-summary">
          <h4 className="filter-summary-title">Active Filters:</h4>
          <div className="filter-active-tags">
            {selectedTheme && (
              <div className="filter-active-tag">
                <span>{selectedTheme}</span>
                <button
                  onClick={() => onFilterChange('theme', undefined)}
                  className="filter-tag-remove"
                  aria-label="Remove theme filter"
                >
                  <FontAwesomeIcon icon="times" />
                </button>
              </div>
            )}
            {selectedPublisher && (
              <div className="filter-active-tag">
                <span>{selectedPublisher}</span>
                <button
                  onClick={() => onFilterChange('publisher', undefined)}
                  className="filter-tag-remove"
                  aria-label="Remove publisher filter"
                >
                  <FontAwesomeIcon icon="times" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
