/**
 * @file
 * Dataset search widget using @dkan-client-tools/react package.
 * JSX source file - compiled to js/dataset-search-widget.js
 */

// Import everything from DKAN Client Tools React (which includes React internally)
import {
  DkanClient,
  QueryClient,
  DkanClientProvider,
  useDatasetSearch,
  React,
  ReactDOM,
} from '@dkan-client-tools/react';

(function (Drupal, once) {
  'use strict';

  /**
   * Drupal behavior for DKAN React dataset search widget.
   */
  Drupal.behaviors.dkanReactDatasetSearchWidget = {
    attach(context, settings) {
      const elements = once('dkan-react-dataset-search', '#dkan-react-dataset-search-widget', context);

      elements.forEach((element) => {
        // Get settings from Drupal
        const widgetSettings = settings.dkanClientDemoReact || {};
        const baseUrl = widgetSettings.baseUrl || '/';

        // Create root and render React app
        const root = ReactDOM.createRoot(element);
        root.render(<DatasetSearchWidget baseUrl={baseUrl} />);
      });
    }
  };

  /**
   * Dataset Search Widget React Component.
   */
  function DatasetSearchWidget({ baseUrl }) {
    // Create DkanClient instance with QueryClient
    const [client] = React.useState(() => {
      // First create a QueryClient from React Query
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
          },
        },
      });

      // Then create DkanClient with the QueryClient
      return new DkanClient({
        baseUrl,
        queryClient,
      });
    });

    // Wrap app in DkanClientProvider
    return (
      <DkanClientProvider client={client}>
        <DatasetSearchApp />
      </DkanClientProvider>
    );
  }

  /**
   * Main Dataset Search App Component.
   */
  function DatasetSearchApp() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [expandedCard, setExpandedCard] = React.useState(null);
    const pageSize = 10;

    // Use dataset search for both searching and browsing
    // Pass fulltext only when there's a search term, otherwise it shows all datasets
    const { data, isLoading, isError, error } = useDatasetSearch({
      searchOptions: {
        fulltext: searchTerm || undefined,
        page,
        'page-size': pageSize,
      },
      enabled: true,
    });

    const datasets = data?.results || [];
    const totalResults = data?.total || 0;
    const totalPages = Math.ceil(totalResults / pageSize);

    // Handle search input
    const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
      setPage(1);
      setExpandedCard(null);
    };

    // Handle pagination
    const handlePrevPage = () => {
      if (page > 1) {
        setPage(page - 1);
        setExpandedCard(null);
      }
    };

    const handleNextPage = () => {
      if (page < totalPages) {
        setPage(page + 1);
        setExpandedCard(null);
      }
    };

    // Toggle card expansion
    const toggleCard = (identifier) => {
      setExpandedCard(expandedCard === identifier ? null : identifier);
    };

    return (
      <div className="dkan-widget-container">
        <Header />
        <div className="dkan-widget-body">
          <SearchBox value={searchTerm} onChange={handleSearchChange} />
          {isLoading && <Loading />}
          {isError && <Error message={error?.message} />}
          {!isLoading && !isError && (
            <Results
              datasets={datasets}
              totalResults={totalResults}
              page={page}
              totalPages={totalPages}
              expandedCard={expandedCard}
              onToggleCard={toggleCard}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
            />
          )}
        </div>
      </div>
    );
  }

  /**
   * Header Component.
   */
  function Header() {
    return (
      <header className="dkan-widget-header">
        <h2>DKAN Dataset Search (React)</h2>
        <p>Demonstrating @dkan-client-tools/react in Drupal</p>
      </header>
    );
  }

  /**
   * Search Box Component.
   */
  function SearchBox({ value, onChange }) {
    return (
      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="Search datasets..."
          value={value}
          onChange={onChange}
        />
      </div>
    );
  }

  /**
   * Loading Component.
   */
  function Loading() {
    return <div className="loading">Loading datasets...</div>;
  }

  /**
   * Error Component.
   */
  function Error({ message }) {
    return <div className="error">Error: {message}</div>;
  }

  /**
   * Results Component.
   */
  function Results({ datasets, totalResults, page, totalPages, expandedCard, onToggleCard, onPrevPage, onNextPage }) {
    if (datasets.length === 0) {
      return (
        <div className="results">
          <div className="no-results">No datasets found.</div>
        </div>
      );
    }

    return (
      <div className="results">
        <div className="results-info">
          Found {totalResults} datasets (Page {page} of {totalPages || 1})
        </div>
        <div className="dataset-items">
          {datasets.map(dataset => (
            <DatasetCard
              key={dataset.identifier}
              dataset={dataset}
              isExpanded={expandedCard === dataset.identifier}
              onToggle={() => onToggleCard(dataset.identifier)}
            />
          ))}
        </div>
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
          />
        )}
      </div>
    );
  }

  /**
   * Dataset Card Component.
   */
  function DatasetCard({ dataset, isExpanded, onToggle }) {
    const description = dataset.description || '';
    const truncatedDesc = description.substring(0, 200) + (description.length > 200 ? '...' : '');

    return (
      <div
        className={`dataset-card ${isExpanded ? 'expanded' : ''}`}
        onClick={onToggle}
      >
        <div className="card-header">
          <h3>{dataset.title}</h3>
          <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
        </div>
        {description && (
          <p className="description">
            {isExpanded ? description : truncatedDesc}
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
            {dataset.keyword.map((keyword, idx) => (
              <span key={idx} className="keyword">{keyword}</span>
            ))}
          </div>
        )}
        {isExpanded && <ExpandedDetails dataset={dataset} />}
      </div>
    );
  }

  /**
   * Expanded Details Component.
   */
  function ExpandedDetails({ dataset }) {
    return (
      <div className="expanded-details">
        {dataset.identifier && (
          <DetailRow label="Identifier" value={dataset.identifier} />
        )}
        {dataset.publisher && (
          <DetailRow label="Publisher" value={dataset.publisher.name} />
        )}
        {dataset.theme && dataset.theme.length > 0 && (
          <DetailRow label="Theme" value={dataset.theme.join(', ')} />
        )}
        {dataset.issued && (
          <DetailRow label="Issued" value={new Date(dataset.issued).toLocaleDateString()} />
        )}
        {dataset.contactPoint && (
          <DetailRow
            label="Contact"
            value={`${dataset.contactPoint.fn}${dataset.contactPoint.hasEmail ? ` (${dataset.contactPoint.hasEmail.replace('mailto:', '')})` : ''}`}
          />
        )}
        {dataset.distribution && dataset.distribution.length > 0 && (
          <div className="detail-row">
            <strong>Distributions:</strong>
            <div className="distributions">
              {dataset.distribution.map((dist, idx) => (
                <div key={idx} className="distribution-item">
                  <span className="distribution-title">
                    {dist.title || `Distribution ${idx + 1}`}
                  </span>
                  {dist.format && (
                    <span className="distribution-format">{dist.format}</span>
                  )}
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
    );
  }

  /**
   * Detail Row Component.
   */
  function DetailRow({ label, value }) {
    return (
      <div className="detail-row">
        <strong>{label}:</strong>
        <span>{value}</span>
      </div>
    );
  }

  /**
   * Pagination Component.
   */
  function Pagination({ page, totalPages, onPrevPage, onNextPage }) {
    return (
      <div className="pagination">
        <button
          className="prev-btn"
          disabled={page === 1}
          onClick={onPrevPage}
        >
          Previous
        </button>
        <span className="page-info">Page {page} of {totalPages}</span>
        <button
          className="next-btn"
          disabled={page === totalPages}
          onClick={onNextPage}
        >
          Next
        </button>
      </div>
    );
  }

})(window.Drupal, window.once);
