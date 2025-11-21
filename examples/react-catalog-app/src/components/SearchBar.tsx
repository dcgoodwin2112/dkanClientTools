import { useState, FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../styles/SearchBar.css'

interface SearchBarProps {
  large?: boolean
  initialQuery?: string
}

export function SearchBar({ large = false, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate({
        to: '/browse',
        search: { q: query.trim() },
      })
    } else {
      navigate({ to: '/browse' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="search-bar-form">
      <div className={`search-bar-container ${large ? 'search-bar-large' : ''}`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search datasets by keyword, topic, or publisher..."
          className="search-bar-input"
        />
        <button type="submit" className="search-bar-button">
          <FontAwesomeIcon icon="search" />
        </button>
      </div>
    </form>
  )
}
