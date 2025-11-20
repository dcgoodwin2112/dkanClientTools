import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../styles/Footer.css'

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          &copy; 2025 Open Data Catalog. Built with React, TanStack, and DKAN API.
        </p>
        <div className="footer-social">
          <a href="#" className="social-link" aria-label="GitHub">
            <FontAwesomeIcon icon={['fab', 'github']} />
          </a>
          <a href="#" className="social-link" aria-label="Twitter">
            <FontAwesomeIcon icon={['fab', 'twitter']} />
          </a>
          <a href="#" className="social-link" aria-label="RSS">
            <FontAwesomeIcon icon="rss" />
          </a>
        </div>
      </div>
    </footer>
  )
}
