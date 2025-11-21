import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../styles/Footer.css'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          &copy; {currentYear} DKAN Open Data Catalog. Built with React, TanStack, and DKAN API.
        </p>
        <div className="footer-social">
          <a href="https://github.com/dcgoodwin2112/dkanClientTools/tree/main" className="social-link" aria-label="GitHub">
            <FontAwesomeIcon icon={['fab', 'github']} />
          </a>
        </div>
      </div>
    </footer>
  )
}
