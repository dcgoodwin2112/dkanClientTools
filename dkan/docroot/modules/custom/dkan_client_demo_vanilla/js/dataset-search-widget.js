/**
 * @file
 * Dataset search widget using @dkan-client-tools/core package.
 */

(function (Drupal, once, DkanClientTools) {
  'use strict';

  /**
   * Drupal behavior for DKAN dataset search widget.
   */
  Drupal.behaviors.dkanDatasetSearchWidget = {
    attach(context, settings) {
      const elements = once('dkan-dataset-search', '.dkan-dataset-search-widget', context);

      elements.forEach((element) => {
        // Initialize the widget
        new DatasetSearchWidget(element, settings);
      });
    }
  };

  /**
   * Dataset Search Widget class.
   */
  class DatasetSearchWidget {
    constructor(element, settings) {
      this.element = element;
      this.settings = settings.dkanClientDemo || {};
      this.state = {
        searchTerm: '',
        page: 1,
        pageSize: 10,
        expandedCard: null,
        datasets: [],
        totalResults: 0,
      };

      // Initialize DKAN client
      const queryClient = new DkanClientTools.QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
          },
        },
      });

      this.dkanClient = new DkanClientTools.DkanClient({
        queryClient,
        baseUrl: this.settings.baseUrl || '/',
      });
    console.log(this.settings.baseUrl);
      // Build and render UI
      this.render();
      this.attachEventListeners();

      // Initial data fetch
      this.fetchDatasets();
    }

    /**
     * Render the widget HTML structure.
     */
    render() {
      this.element.innerHTML = `
        <div class="dkan-widget-container">
          <header class="dkan-widget-header">
            <h2>DKAN Dataset Search</h2>
            <p>Demonstrating @dkan-client-tools/core in Drupal</p>
          </header>

          <div class="dkan-widget-body">
            <div class="search-box">
              <input
                type="text"
                class="search-input"
                placeholder="Search datasets..."
              />
            </div>

            <div class="loading" style="display: none;">
              Loading datasets...
            </div>

            <div class="error" style="display: none;"></div>

            <div class="results" style="display: none;">
              <div class="results-info"></div>
              <div class="no-results" style="display: none;">
                No datasets found.
              </div>
              <div class="dataset-items"></div>
              <div class="pagination" style="display: none;">
                <button class="prev-btn" disabled>Previous</button>
                <span class="page-info"></span>
                <button class="next-btn" disabled>Next</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * Attach event listeners.
     */
    attachEventListeners() {
      const searchInput = this.element.querySelector('.search-input');
      const prevBtn = this.element.querySelector('.prev-btn');
      const nextBtn = this.element.querySelector('.next-btn');

      searchInput.addEventListener('input', (e) => {
        this.state.searchTerm = e.target.value;
        this.state.page = 1;
        this.fetchDatasets();
      });

      prevBtn.addEventListener('click', () => {
        if (this.state.page > 1) {
          this.state.page--;
          this.fetchDatasets();
        }
      });

      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(this.state.totalResults / this.state.pageSize);
        if (this.state.page < totalPages) {
          this.state.page++;
          this.fetchDatasets();
        }
      });
    }

    /**
     * Fetch datasets from DKAN API.
     */
    async fetchDatasets() {
      try {
        this.showLoading();

        const searchOptions = {
          fulltext: this.state.searchTerm || undefined,
          page: this.state.page,
          'page-size': this.state.pageSize,
        };

        const data = await this.dkanClient.searchDatasets(searchOptions);

        this.state.datasets = data.results || [];
        this.state.totalResults = data.total || 0;

        this.showResults();
        this.renderResults();
      } catch (error) {
        this.showError(error.message);
      }
    }

    /**
     * Show loading state.
     */
    showLoading() {
      this.element.querySelector('.loading').style.display = 'block';
      this.element.querySelector('.results').style.display = 'none';
      this.element.querySelector('.error').style.display = 'none';
    }

    /**
     * Show results state.
     */
    showResults() {
      this.element.querySelector('.loading').style.display = 'none';
      this.element.querySelector('.results').style.display = 'block';
      this.element.querySelector('.error').style.display = 'none';
    }

    /**
     * Show error state.
     */
    showError(message) {
      const errorEl = this.element.querySelector('.error');
      errorEl.textContent = `Error: ${message}`;
      errorEl.style.display = 'block';
      this.element.querySelector('.loading').style.display = 'none';
      this.element.querySelector('.results').style.display = 'none';
    }

    /**
     * Render search results.
     */
    renderResults() {
      const totalPages = Math.ceil(this.state.totalResults / this.state.pageSize);

      // Results info
      const resultsInfo = this.element.querySelector('.results-info');
      resultsInfo.textContent = `Found ${this.state.totalResults} datasets (Page ${this.state.page} of ${totalPages || 1})`;

      // No results
      const noResults = this.element.querySelector('.no-results');
      const datasetItems = this.element.querySelector('.dataset-items');

      if (this.state.datasets.length === 0) {
        noResults.style.display = 'block';
        datasetItems.innerHTML = '';
        this.element.querySelector('.pagination').style.display = 'none';
        return;
      }

      noResults.style.display = 'none';

      // Render datasets
      datasetItems.innerHTML = this.state.datasets
        .map(dataset => this.renderDatasetCard(dataset))
        .join('');

      // Attach card click listeners
      this.state.datasets.forEach(dataset => {
        const cardEl = datasetItems.querySelector(`#card-${dataset.identifier}`);
        if (cardEl) {
          cardEl.addEventListener('click', () => this.toggleCard(dataset.identifier));
        }
      });

      // Pagination
      const paginationEl = this.element.querySelector('.pagination');
      if (totalPages > 1) {
        paginationEl.style.display = 'flex';
        this.element.querySelector('.page-info').textContent = `Page ${this.state.page} of ${totalPages}`;
        this.element.querySelector('.prev-btn').disabled = this.state.page === 1;
        this.element.querySelector('.next-btn').disabled = this.state.page === totalPages;
      } else {
        paginationEl.style.display = 'none';
      }
    }

    /**
     * Toggle card expansion.
     */
    toggleCard(identifier) {
      this.state.expandedCard = this.state.expandedCard === identifier ? null : identifier;
      this.renderResults();
    }

    /**
     * Render a single dataset card.
     */
    renderDatasetCard(dataset) {
      const isExpanded = this.state.expandedCard === dataset.identifier;
      const description = dataset.description || '';
      const truncatedDesc = description.substring(0, 200) + (description.length > 200 ? '...' : '');

      return `
        <div id="card-${dataset.identifier}" class="dataset-card ${isExpanded ? 'expanded' : ''}">
          <div class="card-header">
            <h3>${this.escapeHtml(dataset.title)}</h3>
            <span class="expand-icon">${isExpanded ? '−' : '+'}</span>
          </div>

          ${description ? `
            <p class="description">
              ${this.escapeHtml(isExpanded ? description : truncatedDesc)}
            </p>
          ` : ''}

          <div class="metadata">
            <span class="tag">${this.escapeHtml(dataset.accessLevel)}</span>
            ${dataset.modified ? `
              <span class="modified">
                Modified: ${new Date(dataset.modified).toLocaleDateString()}
              </span>
            ` : ''}
          </div>

          ${dataset.keyword && dataset.keyword.length > 0 ? `
            <div class="keywords">
              ${dataset.keyword.map(keyword => `
                <span class="keyword">${this.escapeHtml(keyword)}</span>
              `).join('')}
            </div>
          ` : ''}

          ${isExpanded ? this.renderExpandedDetails(dataset) : ''}
        </div>
      `;
    }

    /**
     * Render expanded details for a dataset.
     */
    renderExpandedDetails(dataset) {
      return `
        <div class="expanded-details">
          ${dataset.identifier ? `
            <div class="detail-row">
              <strong>Identifier:</strong>
              <span>${this.escapeHtml(dataset.identifier)}</span>
            </div>
          ` : ''}

          ${dataset.publisher ? `
            <div class="detail-row">
              <strong>Publisher:</strong>
              <span>${this.escapeHtml(dataset.publisher.name)}</span>
            </div>
          ` : ''}

          ${dataset.theme && dataset.theme.length > 0 ? `
            <div class="detail-row">
              <strong>Theme:</strong>
              <span>${this.escapeHtml(dataset.theme.join(', '))}</span>
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
                ${this.escapeHtml(dataset.contactPoint.fn)}
                ${dataset.contactPoint.hasEmail ? `(${this.escapeHtml(dataset.contactPoint.hasEmail.replace('mailto:', ''))})` : ''}
              </span>
            </div>
          ` : ''}

          ${dataset.distribution && dataset.distribution.length > 0 ? `
            <div class="detail-row">
              <strong>Distributions:</strong>
              <div class="distributions">
                ${dataset.distribution.map((dist, idx) => `
                  <div class="distribution-item">
                    <span class="distribution-title">${this.escapeHtml(dist.title || `Distribution ${idx + 1}`)}</span>
                    ${dist.format ? `<span class="distribution-format">${this.escapeHtml(dist.format)}</span>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${dataset.license ? `
            <div class="detail-row">
              <strong>License:</strong>
              <a href="${this.escapeHtml(dataset.license)}" target="_blank" rel="noopener noreferrer">
                ${this.escapeHtml(dataset.license)}
              </a>
            </div>
          ` : ''}
        </div>
      `;
    }

    /**
     * Escape HTML to prevent XSS.
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

})(Drupal, once, window.DkanClientTools);
