import { useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchBar } from '../components/SearchBar'
import '../styles/Home.css'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()

  const handleBrowseClick = useCallback(() => {
    navigate({ to: '/browse' })
  }, [navigate])

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Hero Section */}
        <div className="hero-section">
          <h2 className="hero-title">
            Welcome to the DKAN Open Data Catalog
          </h2>
          <p className="hero-subtitle">
            Access, analyze, and download public datasets to drive innovation and transparency
          </p>
        </div>

        {/* Search Bar */}
        <div className="home-search">
          <SearchBar large />
        </div>

        {/* Feature Cards */}
        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon feature-icon-blue">
              <FontAwesomeIcon icon="search-plus" />
            </div>
            <h3 className="feature-title">Discover Data</h3>
            <p className="feature-description">
              Search through thousands of datasets with powerful filtering and faceted search
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon-green">
              <FontAwesomeIcon icon="chart-bar" />
            </div>
            <h3 className="feature-title">Visualize Insights</h3>
            <p className="feature-description">
              Preview data and explore datasets with interactive tables and visualizations
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon-purple">
              <FontAwesomeIcon icon="download" />
            </div>
            <h3 className="feature-title">Download & Use</h3>
            <p className="feature-description">
              Access data in multiple formats through direct downloads or programmatic APIs
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="home-cta">
          <button onClick={handleBrowseClick} className="cta-button">
            <span>Browse All Datasets</span>
            <FontAwesomeIcon icon="arrow-right" />
          </button>
        </div>
      </div>
    </div>
  )
}
