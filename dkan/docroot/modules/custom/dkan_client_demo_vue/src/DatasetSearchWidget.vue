<template>
  <div class="dkan-widget-container">
    <header class="dkan-widget-header">
      <h2>DKAN Dataset Search (Vue)</h2>
      <p>Demonstrating @dkan-client-tools/vue</p>
    </header>

    <div class="dkan-widget-body">
      <!-- Search Box -->
      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Search datasets..."
          v-model="searchTerm"
          @input="resetToFirstPage"
        />
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading">
        Loading datasets...
      </div>

      <!-- Error State -->
      <div v-else-if="isError" class="error">
        Error: {{ error?.message }}
      </div>

      <!-- Results -->
      <div v-else class="results">
        <!-- No Results -->
        <div v-if="datasets.length === 0" class="no-results">
          No datasets found.
        </div>

        <!-- Results List -->
        <div v-else>
          <div class="results-info">
            Found {{ totalResults }} datasets (Page {{ page }} of {{ totalPages || 1 }})
          </div>

          <div class="dataset-items">
            <div
              v-for="dataset in datasets"
              :key="dataset.identifier"
              class="dataset-card"
              :class="{ expanded: expandedCard === dataset.identifier }"
              @click="toggleCard(dataset.identifier)"
            >
              <!-- Card Header -->
              <div class="card-header">
                <h3>{{ dataset.title }}</h3>
                <span class="expand-icon">{{ expandedCard === dataset.identifier ? '−' : '+' }}</span>
              </div>

              <!-- Description -->
              <p v-if="dataset.description" class="description">
                {{ expandedCard === dataset.identifier ? dataset.description : truncateDescription(dataset.description) }}
              </p>

              <!-- Metadata -->
              <div class="metadata">
                <span class="tag">{{ dataset.accessLevel }}</span>
                <span v-if="dataset.modified" class="modified">
                  Modified: {{ formatDate(dataset.modified) }}
                </span>
              </div>

              <!-- Keywords -->
              <div v-if="dataset.keyword && dataset.keyword.length > 0" class="keywords">
                <span v-for="(keyword, index) in dataset.keyword" :key="index" class="keyword">
                  {{ keyword }}
                </span>
              </div>

              <!-- Expanded Details -->
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
                  <span>{{ formatDate(dataset.issued) }}</span>
                </div>

                <div v-if="dataset.contactPoint" class="detail-row">
                  <strong>Contact:</strong>
                  <span>{{ formatContactPoint(dataset.contactPoint) }}</span>
                </div>

                <div v-if="dataset.distribution && dataset.distribution.length > 0" class="detail-row">
                  <strong>Distributions:</strong>
                  <div class="distributions">
                    <div
                      v-for="(dist, index) in dataset.distribution"
                      :key="index"
                      class="distribution-item"
                    >
                      <span class="distribution-title">{{ dist.title || `Distribution ${index + 1}` }}</span>
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

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button
              class="prev-btn"
              :disabled="page === 1"
              @click="previousPage"
            >
              Previous
            </button>
            <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
            <button
              class="next-btn"
              :disabled="page === totalPages"
              @click="nextPage"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDatasetSearch } from '@dkan-client-tools/vue'

// Props
const props = defineProps({
  baseUrl: {
    type: String,
    required: true,
  },
})

// State
const searchTerm = ref('')
const page = ref(1)
const expandedCard = ref(null)
const pageSize = 10

// Use dataset search composable
const { data, isLoading, isError, error } = useDatasetSearch({
  searchOptions: computed(() => ({
    fulltext: searchTerm.value || undefined,
    page: page.value,
    'page-size': pageSize,
  })),
  enabled: true,
})

// Computed
const datasets = computed(() => data.value?.results || [])
const totalResults = computed(() => data.value?.total || 0)
const totalPages = computed(() => Math.ceil(totalResults.value / pageSize))

// Methods
function resetToFirstPage() {
  page.value = 1
  expandedCard.value = null
}

function toggleCard(identifier) {
  expandedCard.value = expandedCard.value === identifier ? null : identifier
}

function previousPage() {
  if (page.value > 1) {
    page.value--
    expandedCard.value = null
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    expandedCard.value = null
  }
}

function truncateDescription(description) {
  if (!description) return ''
  return description.length > 200 ? description.substring(0, 200) + '...' : description
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

function formatContactPoint(contactPoint) {
  if (!contactPoint) return ''
  let result = contactPoint.fn
  if (contactPoint.hasEmail) {
    result += ` (${contactPoint.hasEmail.replace('mailto:', '')})`
  }
  return result
}
</script>

<style scoped>
/* Styles will be in separate CSS file */
</style>
