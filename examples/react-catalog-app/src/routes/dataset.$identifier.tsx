import { createFileRoute, Link } from '@tanstack/react-router'
import { useDataset } from '@dkan-client-tools/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../styles/DatasetDetail.css'

export const Route = createFileRoute('/dataset/$identifier')({
  component: DatasetDetail,
})

function DatasetDetail() {
  const { identifier } = Route.useParams()
  const { data: dataset, isLoading, error } = useDataset({ identifier })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="dataset-detail-page">
        <div className="dataset-detail-container">
          <div className="dataset-detail-loading">
            <div className="loading-spinner"></div>
            <p>Loading dataset...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !dataset) {
    return (
      <div className="dataset-detail-page">
        <div className="dataset-detail-container">
          <div className="dataset-detail-error">
            <h1>Dataset Not Found</h1>
            <p>{error?.message || 'Unable to load dataset'}</p>
            <Link to="/browse" className="back-link">
              <FontAwesomeIcon icon="arrow-left" />
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dataset-detail-page">
      <div className="dataset-detail-container">
        {/* Breadcrumb */}
        <nav className="dataset-breadcrumb">
          <Link to="/browse" className="breadcrumb-link">
            <FontAwesomeIcon icon="arrow-left" />
            Back to Browse
          </Link>
        </nav>

        {/* Header */}
        <header className="dataset-header">
          <h1 className="dataset-title">{dataset.title}</h1>
          <div className="dataset-meta-row">
            {dataset.publisher && (
              <div className="dataset-meta-item">
                <FontAwesomeIcon icon="building" />
                <span>{dataset.publisher.name}</span>
              </div>
            )}
            {dataset.modified && (
              <div className="dataset-meta-item">
                <FontAwesomeIcon icon="calendar" />
                <span>Updated {formatDate(dataset.modified)}</span>
              </div>
            )}
            <div className="dataset-meta-item">
              <FontAwesomeIcon icon="lock-open" />
              <span className="access-level">{dataset.accessLevel}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="dataset-content">
          {/* Description */}
          <section className="dataset-section">
            <h2 className="section-title">Description</h2>
            <p className="dataset-description">{dataset.description}</p>
          </section>

          {/* Tags/Keywords */}
          {dataset.keyword && dataset.keyword.length > 0 && (
            <section className="dataset-section">
              <h2 className="section-title">
                <FontAwesomeIcon icon="tags" />
                Tags
              </h2>
              <div className="dataset-tags">
                {dataset.keyword.map((tag, index) => (
                  <span key={index} className="dataset-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Themes */}
          {dataset.theme && dataset.theme.length > 0 && (
            <section className="dataset-section">
              <h2 className="section-title">
                <FontAwesomeIcon icon="layer-group" />
                Themes
              </h2>
              <div className="dataset-tags">
                {dataset.theme.map((theme, index) => (
                  <span key={index} className="dataset-theme-tag">
                    {theme}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Distributions/Resources */}
          {dataset.distribution && dataset.distribution.length > 0 && (
            <section className="dataset-section">
              <h2 className="section-title">
                <FontAwesomeIcon icon="download" />
                Resources ({dataset.distribution.length})
              </h2>
              <div className="distribution-list">
                {dataset.distribution.map((dist, index) => (
                  <div key={index} className="distribution-item">
                    <div className="distribution-header">
                      <h3 className="distribution-title">
                        {dist.title || `Resource ${index + 1}`}
                      </h3>
                      {dist.format && (
                        <span className="distribution-format">{dist.format}</span>
                      )}
                    </div>
                    {dist.description && (
                      <p className="distribution-description">{dist.description}</p>
                    )}
                    <div className="distribution-actions">
                      {dist.downloadURL && (
                        <a
                          href={dist.downloadURL}
                          className="distribution-button"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FontAwesomeIcon icon="download" />
                          Download
                        </a>
                      )}
                      {dist.accessURL && (
                        <a
                          href={dist.accessURL}
                          className="distribution-button distribution-button-secondary"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FontAwesomeIcon icon="external-link-alt" />
                          Access
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Additional Metadata */}
          <section className="dataset-section">
            <h2 className="section-title">
              <FontAwesomeIcon icon="info-circle" />
              Additional Information
            </h2>
            <dl className="metadata-list">
              {dataset.identifier && (
                <>
                  <dt>Identifier</dt>
                  <dd className="metadata-code">{dataset.identifier}</dd>
                </>
              )}
              {dataset.issued && (
                <>
                  <dt>Issued</dt>
                  <dd>{formatDate(dataset.issued)}</dd>
                </>
              )}
              {dataset.license && (
                <>
                  <dt>License</dt>
                  <dd>{dataset.license}</dd>
                </>
              )}
              {dataset.accrualPeriodicity && (
                <>
                  <dt>Update Frequency</dt>
                  <dd>{dataset.accrualPeriodicity}</dd>
                </>
              )}
              {dataset.temporal && (
                <>
                  <dt>Temporal Coverage</dt>
                  <dd>{dataset.temporal}</dd>
                </>
              )}
              {dataset.spatial && (
                <>
                  <dt>Spatial Coverage</dt>
                  <dd>{dataset.spatial}</dd>
                </>
              )}
              {dataset.landingPage && (
                <>
                  <dt>Landing Page</dt>
                  <dd>
                    <a
                      href={dataset.landingPage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="metadata-link"
                    >
                      {dataset.landingPage}
                      <FontAwesomeIcon icon="external-link-alt" />
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </section>

          {/* Contact Information */}
          {dataset.contactPoint && (
            <section className="dataset-section">
              <h2 className="section-title">
                <FontAwesomeIcon icon="envelope" />
                Contact
              </h2>
              <div className="contact-info">
                <p className="contact-name">{dataset.contactPoint.fn}</p>
                <a href={`mailto:${dataset.contactPoint.hasEmail}`} className="contact-email">
                  <FontAwesomeIcon icon="envelope" />
                  {dataset.contactPoint.hasEmail}
                </a>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
