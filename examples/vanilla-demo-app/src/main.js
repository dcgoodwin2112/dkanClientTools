import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import './style.css'

// Initialize DKAN Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
})

const dkanClient = new DkanClient({
  queryClient,
  baseUrl: '', // Proxy handles this in development
})

// State
let state = {
  searchTerm: '',
  page: 1,
  pageSize: 10,
  expandedCard: null,
  datasets: [],
  totalResults: 0,
}

// DOM Elements
const searchInput = document.getElementById('search-input')
const loadingEl = document.getElementById('loading')
const errorEl = document.getElementById('error')
const resultsEl = document.getElementById('results')
const resultsInfoEl = document.getElementById('results-info')
const noResultsEl = document.getElementById('no-results')
const datasetItemsEl = document.getElementById('dataset-items')
const paginationEl = document.getElementById('pagination')
const prevBtn = document.getElementById('prev-btn')
const nextBtn = document.getElementById('next-btn')
const pageInfoEl = document.getElementById('page-info')

// Event Listeners
searchInput.addEventListener('input', (e) => {
  state.searchTerm = e.target.value
  state.page = 1
  fetchDatasets()
})

prevBtn.addEventListener('click', () => {
  if (state.page > 1) {
    state.page--
    fetchDatasets()
  }
})

nextBtn.addEventListener('click', () => {
  const totalPages = Math.ceil(state.totalResults / state.pageSize)
  if (state.page < totalPages) {
    state.page++
    fetchDatasets()
  }
})

// Fetch datasets
async function fetchDatasets() {
  try {
    // Show loading
    loadingEl.style.display = 'block'
    resultsEl.style.display = 'none'
    errorEl.style.display = 'none'

    // Search datasets
    const searchOptions = {
      fulltext: state.searchTerm || undefined,
      page: state.page,
      'page-size': state.pageSize,
    }

    const data = await dkanClient.searchDatasets(searchOptions)

    // Update state
    state.datasets = data.results || []
    state.totalResults = data.total || 0

    // Hide loading, show results
    loadingEl.style.display = 'none'
    resultsEl.style.display = 'block'

    // Render
    renderResults()
  } catch (error) {
    loadingEl.style.display = 'none'
    errorEl.style.display = 'block'
    errorEl.textContent = `Error: ${error.message}`
  }
}

// Render results
function renderResults() {
  const totalPages = Math.ceil(state.totalResults / state.pageSize)

  // Results info
  resultsInfoEl.textContent = `Found ${state.totalResults} datasets (Page ${state.page} of ${totalPages || 1})`

  // No results
  if (state.datasets.length === 0) {
    noResultsEl.style.display = 'block'
    datasetItemsEl.innerHTML = ''
    paginationEl.style.display = 'none'
    return
  }

  noResultsEl.style.display = 'none'

  // Render datasets
  datasetItemsEl.innerHTML = state.datasets
    .map((dataset) => renderDatasetCard(dataset))
    .join('')

  // Add click listeners to cards
  state.datasets.forEach((dataset) => {
    const cardEl = document.getElementById(`card-${dataset.identifier}`)
    if (cardEl) {
      cardEl.addEventListener('click', () => toggleCard(dataset.identifier))
    }
  })

  // Pagination
  if (totalPages > 1) {
    paginationEl.style.display = 'flex'
    pageInfoEl.textContent = `Page ${state.page} of ${totalPages}`
    prevBtn.disabled = state.page === 1
    nextBtn.disabled = state.page === totalPages
  } else {
    paginationEl.style.display = 'none'
  }
}

// Toggle card expansion
function toggleCard(identifier) {
  state.expandedCard = state.expandedCard === identifier ? null : identifier
  renderResults()
}

// Render dataset card
function renderDatasetCard(dataset) {
  const isExpanded = state.expandedCard === dataset.identifier
  const description = dataset.description || ''
  const truncatedDesc = description.substring(0, 200) + (description.length > 200 ? '...' : '')

  return `
    <div id="card-${dataset.identifier}" class="dataset-card ${isExpanded ? 'expanded' : ''}">
      <div class="card-header">
        <h3>${escapeHtml(dataset.title)}</h3>
        <span class="expand-icon">${isExpanded ? '−' : '+'}</span>
      </div>

      ${description ? `
        <p class="description">
          ${escapeHtml(isExpanded ? description : truncatedDesc)}
        </p>
      ` : ''}

      <div class="metadata">
        <span class="tag">${escapeHtml(dataset.accessLevel)}</span>
        ${dataset.modified ? `
          <span class="modified">
            Modified: ${new Date(dataset.modified).toLocaleDateString()}
          </span>
        ` : ''}
      </div>

      ${dataset.keyword && dataset.keyword.length > 0 ? `
        <div class="keywords">
          ${dataset.keyword.map(keyword => `
            <span class="keyword">${escapeHtml(keyword)}</span>
          `).join('')}
        </div>
      ` : ''}

      ${isExpanded ? renderExpandedDetails(dataset) : ''}
    </div>
  `
}

// Render expanded details
function renderExpandedDetails(dataset) {
  return `
    <div class="expanded-details">
      ${dataset.identifier ? `
        <div class="detail-row">
          <strong>Identifier:</strong>
          <span>${escapeHtml(dataset.identifier)}</span>
        </div>
      ` : ''}

      ${dataset.publisher ? `
        <div class="detail-row">
          <strong>Publisher:</strong>
          <span>${escapeHtml(dataset.publisher.name)}</span>
        </div>
      ` : ''}

      ${dataset.theme && dataset.theme.length > 0 ? `
        <div class="detail-row">
          <strong>Theme:</strong>
          <span>${escapeHtml(dataset.theme.join(', '))}</span>
        </div>
      ` : ''}

      ${dataset.issued ? `
        <div class="detail-row">
          <strong>Issued:</strong>
          <span>${new Date(dataset.issued).toLocaleDateString()}</span>
        </div>
      ` : ''}

      ${dataset.contactPoint ? `
        <div class="detail-row">
          <strong>Contact:</strong>
          <span>
            ${escapeHtml(dataset.contactPoint.fn)}
            ${dataset.contactPoint.hasEmail ? `(${escapeHtml(dataset.contactPoint.hasEmail.replace('mailto:', ''))})` : ''}
          </span>
        </div>
      ` : ''}

      ${dataset.distribution && dataset.distribution.length > 0 ? `
        <div class="detail-row">
          <strong>Distributions:</strong>
          <div class="distributions">
            ${dataset.distribution.map((dist, idx) => `
              <div class="distribution-item">
                <span class="distribution-title">${escapeHtml(dist.title || `Distribution ${idx + 1}`)}</span>
                ${dist.format ? `<span class="distribution-format">${escapeHtml(dist.format)}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${dataset.license ? `
        <div class="detail-row">
          <strong>License:</strong>
          <a href="${escapeHtml(dataset.license)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(dataset.license)}
          </a>
        </div>
      ` : ''}
    </div>
  `
}

// Helper to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Initial fetch
fetchDatasets()
