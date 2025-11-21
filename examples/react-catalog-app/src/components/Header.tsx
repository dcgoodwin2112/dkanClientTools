import { Link } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../styles/Header.css'

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <Link to="/" className="header-brand">
            <FontAwesomeIcon icon="database" className="header-icon" />
            <div className="header-text">
              <h1 className="header-title">DKAN Open Data Catalog</h1>
              <p className="header-subtitle">Discover, explore, and download public datasets</p>
            </div>
          </Link>
          <nav className="header-nav">
            <Link to="/" className="nav-link">
              <FontAwesomeIcon icon="home" />
              <span>Home</span>
            </Link>
            <Link to="/browse" className="nav-link">
              <FontAwesomeIcon icon="list" />
              <span>Browse Datasets</span>
            </Link>
            <Link to="/api" className="nav-link">
              <FontAwesomeIcon icon="code" />
              <span>API</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
