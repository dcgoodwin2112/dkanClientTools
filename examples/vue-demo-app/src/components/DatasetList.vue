<script setup lang="ts">
import { useDatasetSearch } from '@dkan-client-tools/vue'
import { ref, computed } from 'vue'

// Search for datasets
const searchTerm = ref('')
const page = ref(1)
const expandedCard = ref<string | null>(null)
const pageSize = 10

const toggleCard = (identifier: string) => {
  expandedCard.value = expandedCard.value === identifier ? null : identifier
}

const searchOptions = computed(() => ({
  fulltext: searchTerm.value || undefined,
  page: page.value, // DKAN uses 1-based pagination
  'page-size': pageSize,
}))

const { data: searchResults, isLoading, error } = useDatasetSearch({ searchOptions })

const datasets = computed(() => searchResults.value?.results || [])
const totalResults = computed(() => searchResults.value?.total || 0)
const totalPages = computed(() => Math.ceil(totalResults.value / pageSize))

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
  }
}
</script>

<template>
  <div class="dataset-list">
    <h2>DKAN Dataset Search</h2>

    <div class="search-box">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search datasets..."
        class="search-input"
      />
    </div>

    <div v-if="isLoading" class="loading">
      Loading datasets...
    </div>

    <div v-else-if="error" class="error">
      Error: {{ error.message }}
    </div>

    <div v-else>
      <div class="results-info">
        Found {{ totalResults }} datasets (Page {{ page }} of {{ totalPages }})
      </div>

      <div v-if="datasets.length === 0" class="no-results">
        No datasets found.
      </div>

      <div v-else class="dataset-items">
        <div
          v-for="dataset in datasets"
          :key="dataset.identifier"
          :class="['dataset-card', { expanded: expandedCard === dataset.identifier }]"
          @click="toggleCard(dataset.identifier)"
        >
          <div class="card-header">
            <h3>{{ dataset.title }}</h3>
            <span class="expand-icon">{{ expandedCard === dataset.identifier ? '−' : '+' }}</span>
          </div>

          <p v-if="dataset.description" class="description">
            {{ expandedCard === dataset.identifier
                ? dataset.description
                : dataset.description.substring(0, 200) + (dataset.description.length > 200 ? '...' : '')
            }}
          </p>

          <div class="metadata">
            <span class="tag">{{ dataset.accessLevel }}</span>
            <span v-if="dataset.modified" class="modified">
              Modified: {{ new Date(dataset.modified).toLocaleDateString() }}
            </span>
          </div>

          <div v-if="dataset.keyword && dataset.keyword.length > 0" class="keywords">
            <span v-for="keyword in dataset.keyword" :key="keyword" class="keyword">
              {{ keyword }}
            </span>
          </div>

          <div v-if="expandedCard === dataset.identifier" class="expanded-details">
            <div v-if="dataset.identifier" class="detail-row">
              <strong>Identifier:</strong>
              <span>{{ dataset.identifier }}</span>
            </div>

            <div v-if="dataset.publisher" class="detail-row">
              <strong>Publisher:</strong>
              <span>{{ dataset.publisher.name }}</span>
            </div>

            <div v-if="dataset.theme && dataset.theme.length > 0" class="detail-row">
              <strong>Theme:</strong>
              <span>{{ dataset.theme.join(', ') }}</span>
            </div>

            <div v-if="dataset.issued" class="detail-row">
              <strong>Issued:</strong>
              <span>{{ new Date(dataset.issued).toLocaleDateString() }}</span>
            </div>

            <div v-if="dataset.contactPoint" class="detail-row">
              <strong>Contact:</strong>
              <span>
                {{ dataset.contactPoint.fn }}
                <template v-if="dataset.contactPoint.hasEmail">
                  ({{ dataset.contactPoint.hasEmail.replace('mailto:', '') }})
                </template>
              </span>
            </div>

            <div v-if="dataset.distribution && dataset.distribution.length > 0" class="detail-row">
              <strong>Distributions:</strong>
              <div class="distributions">
                <div v-for="(dist, idx) in dataset.distribution" :key="idx" class="distribution-item">
                  <span class="distribution-title">{{ dist.title || `Distribution ${idx + 1}` }}</span>
                  <span v-if="dist.format" class="distribution-format">{{ dist.format }}</span>
                </div>
              </div>
            </div>

            <div v-if="dataset.license" class="detail-row">
              <strong>License:</strong>
              <a :href="dataset.license" target="_blank" rel="noopener noreferrer">
                {{ dataset.license }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button @click="prevPage" :disabled="page === 1">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button @click="nextPage" :disabled="page === totalPages">Next</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dataset-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.search-box {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
}

.search-input:focus {
  outline: none;
  border-color: #42b983;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  padding: 1rem;
  background: #fee;
  color: #c33;
  border-radius: 4px;
}

.results-info {
  margin-bottom: 1rem;
  color: #666;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.dataset-items {
  display: grid;
  gap: 1.5rem;
}

.dataset-card {
  padding: 1.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  user-select: none;
}

.dataset-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  border-color: #42b983;
}

.dataset-card.expanded {
  box-shadow: 0 6px 12px rgba(0,0,0,0.2);
  border-color: #42b983;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  flex: 1;
}

.expand-icon {
  font-size: 1.5rem;
  font-weight: bold;
  color: #42b983;
  flex-shrink: 0;
  line-height: 1;
}

.description {
  color: #666;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.metadata {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #42b983;
  color: white;
  border-radius: 4px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.modified {
  color: #999;
  font-size: 0.9rem;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.keyword {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #f0f0f0;
  color: #666;
  border-radius: 4px;
  font-size: 0.85rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.pagination button:hover:not(:disabled) {
  background: #359268;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.expanded-details {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f0f0;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  line-height: 1.6;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row strong {
  color: #2c3e50;
  min-width: 120px;
  flex-shrink: 0;
}

.detail-row span {
  color: #666;
}

.detail-row a {
  color: #42b983;
  text-decoration: none;
  word-break: break-all;
}

.detail-row a:hover {
  text-decoration: underline;
}

.distributions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.distribution-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.distribution-title {
  color: #2c3e50;
  font-weight: 500;
  flex: 1;
}

.distribution-format {
  padding: 0.25rem 0.5rem;
  background: #42b983;
  color: white !important;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 600;
}
</style>
