import { Link } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { DkanDataset } from '@dkan-client-tools/core'
import '../styles/DatasetCard.css'

interface DatasetCardProps {
  dataset: DkanDataset
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const truncateDescription = (text: string, maxLength: number = 200) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function DatasetCard({ dataset }: DatasetCardProps) {

  return (
    <div className="dataset-card">
      <div className="dataset-card-header">
        <Link
          to="/dataset/$identifier"
          params={{ identifier: dataset.identifier }}
          className="dataset-card-title"
        >
          {dataset.title}
        </Link>
      </div>

      <div className="dataset-card-body">
        <p className="dataset-card-description">
          {truncateDescription(dataset.description)}
        </p>

        <div className="dataset-card-meta">
          {dataset.publisher && (
            <div className="dataset-card-meta-item">
              <FontAwesomeIcon icon="building" className="meta-icon" />
              <span>{dataset.publisher.name}</span>
            </div>
          )}

          {dataset.modified && (
            <div className="dataset-card-meta-item">
              <FontAwesomeIcon icon="calendar" className="meta-icon" />
              <span>Updated {formatDate(dataset.modified)}</span>
            </div>
          )}

          {dataset.distribution && dataset.distribution.length > 0 && (
            <div className="dataset-card-meta-item">
              <FontAwesomeIcon icon="file" className="meta-icon" />
              <span>
                {dataset.distribution.length} resource{dataset.distribution.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {dataset.theme && dataset.theme.length > 0 && (
          <div className="dataset-card-tags">
            {dataset.theme.slice(0, 3).map((tag, index) => (
              <span key={index} className="dataset-card-tag">
                {tag}
              </span>
            ))}
            {dataset.theme.length > 3 && (
              <span className="dataset-card-tag-more">+{dataset.theme.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      <div className="dataset-card-footer">
        <Link
          to="/dataset/$identifier"
          params={{ identifier: dataset.identifier }}
          className="dataset-card-link"
        >
          View Details
          <FontAwesomeIcon icon="arrow-right" />
        </Link>
      </div>
    </div>
  )
}
