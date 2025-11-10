/**
 * Vue composables for DKAN Dataset Properties
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'

export interface UseDatasetPropertiesOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UsePropertyValuesOptions {
  property: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseAllPropertiesWithValuesOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

/**
 * Fetches all filterable dataset property names available in the catalog.
 *
 * This composable retrieves the list of DCAT-US schema property names that can be used for
 * filtering and faceted search. Properties represent the fields in dataset metadata that have
 * indexed values, such as 'theme', 'keyword', 'publisher', 'spatial', etc. This is essential
 * for building dynamic filter interfaces where you need to know what fields are available
 * before querying their values.
 *
 * **Common Property Names**:
 * - `theme` - Category taxonomies (e.g., "Health", "Education")
 * - `keyword` - Free-text tags
 * - `publisher` - Publishing organizations
 * - `spatial` - Geographic coverage
 * - `temporal` - Time period coverage
 * - Additional properties depend on DKAN configuration and custom fields
 *
 * **Filtering Workflow**:
 * 1. Use this composable to get available property names
 * 2. Use {@link usePropertyValues} to get possible values for each property
 * 3. Use {@link useDatasetSearch} to filter datasets by selected property values
 *
 * Results are cached with a 5-minute default stale time since the list of properties
 * changes infrequently.
 *
 * Use this composable when you need to:
 * - Build dynamic filter interfaces with available properties
 * - Create property selection dropdowns
 * - Validate that a property exists before querying its values
 * - Generate filter UIs that adapt to catalog configuration
 * - Implement advanced search builders
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Vue Query result object with array of property names
 *
 * @example
 * Dynamic property selector with value filtering:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDatasetProperties, usePropertyValues } from '@dkan-client-tools/vue'
 *
 * const { data: properties, isLoading } = useDatasetProperties()
 * const selectedProperty = ref<string>()
 *
 * const { data: values, isLoading: loadingValues } = usePropertyValues({
 *   property: selectedProperty,
 *   enabled: () => !!selectedProperty.value,
 * })
 * </script>
 *
 * <template>
 *   <div class="property-filter">
 *     <div v-if="isLoading">Loading available filters...</div>
 *     <div v-else-if="properties">
 *       <label>
 *         Filter by:
 *         <select v-model="selectedProperty">
 *           <option value="">-- Select a property --</option>
 *           <option v-for="prop in properties" :key="prop" :value="prop">
 *             {{ prop }}
 *           </option>
 *         </select>
 *       </label>
 *
 *       <div v-if="selectedProperty">
 *         <h4>Values for {{ selectedProperty }}:</h4>
 *         <div v-if="loadingValues">Loading values...</div>
 *         <ul v-else-if="values">
 *           <li v-for="value in values" :key="value">
 *             <label>
 *               <input type="checkbox" :value="value" />
 *               {{ value }}
 *             </label>
 *           </li>
 *         </ul>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Advanced search builder with multiple property filters:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import {
 *   useDatasetProperties,
 *   usePropertyValues,
 *   useDatasetSearch,
 * } from '@dkan-client-tools/vue'
 *
 * const { data: properties } = useDatasetProperties()
 *
 * interface Filter {
 *   id: string
 *   property: string
 *   values: string[]
 * }
 *
 * const filters = ref<Filter[]>([])
 *
 * function addFilter() {
 *   filters.value.push({
 *     id: crypto.randomUUID(),
 *     property: '',
 *     values: [],
 *   })
 * }
 *
 * function removeFilter(id: string) {
 *   filters.value = filters.value.filter((f) => f.id !== id)
 * }
 *
 * const searchParams = computed(() => {
 *   const params: Record<string, string[]> = {}
 *   filters.value.forEach((filter) => {
 *     if (filter.property && filter.values.length > 0) {
 *       params[filter.property] = filter.values
 *     }
 *   })
 *   return params
 * })
 *
 * const { data: results } = useDatasetSearch(searchParams)
 * </script>
 *
 * <template>
 *   <div class="advanced-search">
 *     <h2>Advanced Search</h2>
 *     <div class="filters-builder">
 *       <div v-for="filter in filters" :key="filter.id" class="filter-row">
 *         <select v-model="filter.property">
 *           <option value="">Select property</option>
 *           <option v-for="prop in properties" :key="prop" :value="prop">
 *             {{ prop }}
 *           </option>
 *         </select>
 *
 *         <component
 *           :is="usePropertyValues({ property: () => filter.property })"
 *           v-slot="{ data: values }"
 *         >
 *           <select v-if="values" v-model="filter.values" multiple>
 *             <option v-for="value in values" :key="value" :value="value">
 *               {{ value }}
 *             </option>
 *           </select>
 *         </component>
 *
 *         <button @click="removeFilter(filter.id)">Remove</button>
 *       </div>
 *
 *       <button @click="addFilter">Add Filter</button>
 *     </div>
 *
 *     <div v-if="results" class="results">
 *       <h3>Results: {{ results.total }} datasets found</h3>
 *       <!-- Display results -->
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Property availability checker:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDatasetProperties } from '@dkan-client-tools/vue'
 *
 * const { data: properties, isLoading } = useDatasetProperties()
 *
 * const hasThemes = computed(() => properties.value?.includes('theme') ?? false)
 * const hasKeywords = computed(() => properties.value?.includes('keyword') ?? false)
 * const hasSpatial = computed(() => properties.value?.includes('spatial') ?? false)
 * const hasTemporal = computed(
 *   () => properties.value?.includes('temporal') ?? false
 * )
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Checking available filters...</div>
 *   <div v-else class="filter-options">
 *     <h3>Available Filters</h3>
 *     <ul>
 *       <li :class="{ enabled: hasThemes, disabled: !hasThemes }">
 *         Theme filtering: {{ hasThemes ? 'Available' : 'Not available' }}
 *       </li>
 *       <li :class="{ enabled: hasKeywords, disabled: !hasKeywords }">
 *         Keyword filtering: {{ hasKeywords ? 'Available' : 'Not available' }}
 *       </li>
 *       <li :class="{ enabled: hasSpatial, disabled: !hasSpatial }">
 *         Geographic filtering: {{ hasSpatial ? 'Available' : 'Not available' }}
 *       </li>
 *       <li :class="{ enabled: hasTemporal, disabled: !hasTemporal }">
 *         Temporal filtering: {{ hasTemporal ? 'Available' : 'Not available' }}
 *       </li>
 *     </ul>
 *
 *     <div v-if="properties" class="all-properties">
 *       <h4>All Available Properties ({{ properties.length }}):</h4>
 *       <code>{{ properties.join(', ') }}</code>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link usePropertyValues} to fetch values for a specific property
 * @see {@link useAllPropertiesWithValues} to fetch all properties with their values
 * @see {@link useDatasetSearch} to search datasets using property filters
 * @see {@link useDatasetFacets} for theme/keyword/publisher facets specifically
 */
export function useDatasetProperties(options: UseDatasetPropertiesOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['dataset-properties'] as const,
    queryFn: () => client.getDatasetProperties(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  })
}

/**
 * Fetches all unique values for a specific dataset property with automatic caching.
 *
 * This composable retrieves the complete set of unique values that exist in the catalog for
 * a given property name. For example, querying the 'theme' property returns all category
 * values like ["Health", "Education", "Transportation"], while 'keyword' returns all tags
 * used across datasets. This is essential for building property-specific filter interfaces
 * and dropdowns.
 *
 * **Common Use Cases by Property**:
 * - `theme` - All category values for theme-based filtering
 * - `keyword` - All tags for keyword filtering
 * - `publisher` - All organization names for publisher filtering
 * - `spatial` - All geographic coverage values
 * - `temporal` - All time period values
 *
 * **Reactivity**: The property parameter accepts reactive refs/computed values, allowing
 * the query to automatically update when the selected property changes. Use the `enabled`
 * option to prevent fetching when no property is selected.
 *
 * Results are cached with a 5-minute default stale time since property values change
 * infrequently.
 *
 * Use this composable when you need to:
 * - Build filter dropdowns for specific properties
 * - Create checkbox lists for property values
 * - Populate tag selection interfaces
 * - Generate property-specific faceted search
 * - Display available filter options for a property
 *
 * @param options - Configuration including the property name to fetch values for
 *
 * @returns TanStack Vue Query result object with array of unique values
 *
 * @example
 * Theme filter dropdown with search integration:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { usePropertyValues, useDatasetSearch } from '@dkan-client-tools/vue'
 *
 * const { data: themes, isLoading } = usePropertyValues({
 *   property: 'theme',
 * })
 *
 * const selectedTheme = ref<string>()
 *
 * const { data: results } = useDatasetSearch(
 *   computed(() => ({
 *     theme: selectedTheme.value ? [selectedTheme.value] : undefined,
 *   }))
 * )
 * </script>
 *
 * <template>
 *   <div class="theme-filter">
 *     <label>
 *       Filter by Theme:
 *       <select v-if="isLoading" disabled>
 *         <option>Loading themes...</option>
 *       </select>
 *       <select v-else-if="themes" v-model="selectedTheme">
 *         <option value="">All themes</option>
 *         <option v-for="theme in themes" :key="theme" :value="theme">
 *           {{ theme }}
 *         </option>
 *       </select>
 *     </label>
 *
 *     <div v-if="results && selectedTheme" class="results">
 *       <h3>{{ results.total }} datasets in {{ selectedTheme }}</h3>
 *       <ul>
 *         <li v-for="dataset in results.results" :key="dataset.identifier">
 *           {{ dataset.title }}
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Dynamic property value selector with reactive property:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import {
 *   useDatasetProperties,
 *   usePropertyValues,
 *   useDatasetSearch,
 * } from '@dkan-client-tools/vue'
 *
 * const { data: properties } = useDatasetProperties()
 * const selectedProperty = ref<string>()
 * const selectedValues = ref<string[]>([])
 *
 * const { data: values, isLoading: loadingValues } = usePropertyValues({
 *   property: selectedProperty,
 *   enabled: computed(() => !!selectedProperty.value),
 * })
 *
 * // Reset selected values when property changes
 * watch(selectedProperty, () => {
 *   selectedValues.value = []
 * })
 *
 * const { data: results } = useDatasetSearch(
 *   computed(() => {
 *     if (!selectedProperty.value || selectedValues.value.length === 0) {
 *       return {}
 *     }
 *     return {
 *       [selectedProperty.value]: selectedValues.value,
 *     }
 *   })
 * )
 * </script>
 *
 * <template>
 *   <div class="dynamic-filter">
 *     <div class="property-selector">
 *       <label>
 *         Choose a property to filter by:
 *         <select v-model="selectedProperty">
 *           <option value="">-- Select property --</option>
 *           <option v-for="prop in properties" :key="prop" :value="prop">
 *             {{ prop }}
 *           </option>
 *         </select>
 *       </label>
 *     </div>
 *
 *     <div v-if="selectedProperty" class="values-selector">
 *       <h4>Select {{ selectedProperty }} values:</h4>
 *       <div v-if="loadingValues">Loading values...</div>
 *       <div v-else-if="!values || values.length === 0">
 *         No values available for this property
 *       </div>
 *       <div v-else class="checkbox-group">
 *         <label v-for="value in values" :key="value" class="checkbox-label">
 *           <input
 *             type="checkbox"
 *             :value="value"
 *             v-model="selectedValues"
 *           />
 *           {{ value }}
 *         </label>
 *       </div>
 *
 *       <div v-if="selectedValues.length > 0" class="selected-count">
 *         {{ selectedValues.length }} value(s) selected
 *       </div>
 *     </div>
 *
 *     <div v-if="results && selectedValues.length > 0" class="results">
 *       <h3>
 *         Found {{ results.total }} datasets matching your filters
 *       </h3>
 *       <!-- Display results -->
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Multi-select publisher filter with counts:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { usePropertyValues, useDatasetSearch } from '@dkan-client-tools/vue'
 *
 * const { data: publishers } = usePropertyValues({
 *   property: 'publisher',
 * })
 *
 * const selectedPublishers = ref<string[]>([])
 *
 * const { data: results } = useDatasetSearch(
 *   computed(() => ({
 *     publisher: selectedPublishers.value.length > 0 ? selectedPublishers.value : undefined,
 *   }))
 * )
 *
 * // Get individual counts for each publisher
 * const publisherCounts = ref<Record<string, number>>({})
 *
 * async function loadPublisherCounts() {
 *   if (!publishers.value) return
 *
 *   for (const publisher of publishers.value) {
 *     const { data } = await useDatasetSearch({
 *       publisher: [publisher],
 *       pageSize: 1,
 *     })
 *     if (data.value) {
 *       publisherCounts.value[publisher] = data.value.total
 *     }
 *   }
 * }
 *
 * watch(publishers, (newPublishers) => {
 *   if (newPublishers) loadPublisherCounts()
 * })
 *
 * function togglePublisher(publisher: string) {
 *   const index = selectedPublishers.value.indexOf(publisher)
 *   if (index > -1) {
 *     selectedPublishers.value.splice(index, 1)
 *   } else {
 *     selectedPublishers.value.push(publisher)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="publisher-filter">
 *     <h3>Filter by Publisher</h3>
 *     <div v-if="publishers" class="publisher-list">
 *       <button
 *         v-for="publisher in publishers"
 *         :key="publisher"
 *         @click="togglePublisher(publisher)"
 *         :class="{
 *           'publisher-button': true,
 *           active: selectedPublishers.includes(publisher),
 *         }"
 *       >
 *         <span class="publisher-name">{{ publisher }}</span>
 *         <span v-if="publisherCounts[publisher]" class="count">
 *           {{ publisherCounts[publisher] }}
 *         </span>
 *       </button>
 *     </div>
 *
 *     <div v-if="selectedPublishers.length > 0" class="active-filters">
 *       <h4>Active Filters:</h4>
 *       <span
 *         v-for="publisher in selectedPublishers"
 *         :key="publisher"
 *         class="filter-tag"
 *       >
 *         {{ publisher }}
 *         <button @click="togglePublisher(publisher)" class="remove">×</button>
 *       </span>
 *     </div>
 *
 *     <div v-if="results" class="results-summary">
 *       {{ results.total }} datasets found
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDatasetProperties} to fetch available property names
 * @see {@link useAllPropertiesWithValues} to fetch all properties with values at once
 * @see {@link useDatasetSearch} to filter datasets using property values
 * @see {@link useDatasetFacets} for theme/keyword/publisher facets specifically
 */
export function usePropertyValues(options: UsePropertyValuesOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['dataset-properties', options.property] as const,
    queryFn: () => client.getPropertyValues(toValue(options.property)),
    enabled: () => (toValue(options.enabled) ?? true) && !!toValue(options.property),
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  })
}

/**
 * Fetches all filterable properties with their complete value sets in a single request.
 *
 * This composable retrieves a comprehensive map of all property names to their unique values
 * across the entire catalog. Instead of making separate requests for each property's values,
 * this fetches everything at once, making it ideal for building complete faceted search
 * interfaces with multiple filters. The result is a dictionary where keys are property names
 * (e.g., 'theme', 'keyword') and values are arrays of unique values for that property.
 *
 * **Performance Optimization**:
 * This composable makes a single API call to fetch all properties and values, which is more
 * efficient than calling {@link usePropertyValues} multiple times for different properties.
 * Use this when you need values for multiple properties simultaneously.
 *
 * **Response Structure**:
 * ```typescript
 * {
 *   theme: ["Health", "Education", "Transportation"],
 *   keyword: ["open data", "statistics", "demographics"],
 *   publisher: ["City of Example", "State DOT"],
 *   // ... other properties
 * }
 * ```
 *
 * Results are cached with a 5-minute default stale time since the property-value map
 * changes infrequently.
 *
 * Use this composable when you need to:
 * - Build comprehensive faceted search UIs with multiple properties
 * - Display all available filters in a sidebar or panel
 * - Create advanced search interfaces with many filter options
 * - Populate filter dropdowns for multiple properties efficiently
 * - Build catalog exploration interfaces
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Vue Query result object with property-to-values map
 *
 * @example
 * Complete faceted search sidebar with all properties:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import {
 *   useAllPropertiesWithValues,
 *   useDatasetSearch,
 * } from '@dkan-client-tools/vue'
 *
 * const { data: facets, isLoading } = useAllPropertiesWithValues()
 * const filters = ref<Record<string, string[]>>({})
 *
 * function toggleFilter(property: string, value: string, checked: boolean) {
 *   if (checked) {
 *     filters.value[property] = [...(filters.value[property] || []), value]
 *   } else {
 *     filters.value[property] = filters.value[property]?.filter((v) => v !== value)
 *     if (filters.value[property]?.length === 0) {
 *       delete filters.value[property]
 *     }
 *   }
 * }
 *
 * function clearAllFilters() {
 *   filters.value = {}
 * }
 *
 * function clearProperty(property: string) {
 *   delete filters.value[property]
 * }
 *
 * const activeFilterCount = computed(() =>
 *   Object.values(filters.value).reduce((sum, vals) => sum + vals.length, 0)
 * )
 *
 * const { data: results } = useDatasetSearch(filters)
 * </script>
 *
 * <template>
 *   <div class="faceted-search">
 *     <aside class="filters-sidebar">
 *       <div class="filter-header">
 *         <h2>Filters</h2>
 *         <button
 *           @click="clearAllFilters"
 *           :disabled="activeFilterCount === 0"
 *           class="clear-all"
 *         >
 *           Clear All ({{ activeFilterCount }})
 *         </button>
 *       </div>
 *
 *       <div v-if="isLoading" class="loading">Loading filters...</div>
 *       <div v-else-if="facets" class="facet-groups">
 *         <details
 *           v-for="(values, property) in facets"
 *           :key="property"
 *           :open="filters[property]?.length > 0"
 *           class="facet-group"
 *         >
 *           <summary>
 *             {{ property }}
 *             <span v-if="filters[property]?.length" class="active-badge">
 *               {{ filters[property].length }}
 *             </span>
 *             <span class="value-count">{{ values.length }} options</span>
 *           </summary>
 *
 *           <div class="facet-actions">
 *             <button
 *               v-if="filters[property]?.length"
 *               @click="clearProperty(property)"
 *               class="clear-property"
 *             >
 *               Clear
 *             </button>
 *           </div>
 *
 *           <ul class="value-list">
 *             <li v-for="value in values" :key="value">
 *               <label>
 *                 <input
 *                   type="checkbox"
 *                   :checked="filters[property]?.includes(value)"
 *                   @change="
 *                     (e) =>
 *                       toggleFilter(
 *                         property,
 *                         value,
 *                         (e.target as HTMLInputElement).checked
 *                       )
 *                   "
 *                 />
 *                 {{ value }}
 *               </label>
 *             </li>
 *           </ul>
 *         </details>
 *       </div>
 *     </aside>
 *
 *     <main class="search-results">
 *       <div v-if="activeFilterCount > 0" class="active-filters">
 *         <h3>Active Filters:</h3>
 *         <div class="filter-tags">
 *           <span
 *             v-for="(values, property) in filters"
 *             :key="property"
 *             v-for="value in values"
 *             class="filter-tag"
 *           >
 *             {{ property }}: {{ value }}
 *             <button @click="toggleFilter(property, value, false)">×</button>
 *           </span>
 *         </div>
 *       </div>
 *
 *       <div v-if="results">
 *         <h2>{{ results.total }} datasets found</h2>
 *         <!-- Display results here -->
 *       </div>
 *     </main>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Catalog property explorer with statistics:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useAllPropertiesWithValues } from '@dkan-client-tools/vue'
 *
 * const { data: properties, isLoading } = useAllPropertiesWithValues()
 *
 * const propertyStats = computed(() => {
 *   if (!properties.value) return []
 *
 *   return Object.entries(properties.value)
 *     .map(([property, values]) => ({
 *       property,
 *       valueCount: values.length,
 *       values,
 *     }))
 *     .sort((a, b) => b.valueCount - a.valueCount)
 * })
 *
 * const totalProperties = computed(() => propertyStats.value.length)
 * const totalUniqueValues = computed(() =>
 *   propertyStats.value.reduce((sum, p) => sum + p.valueCount, 0)
 * )
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Analyzing catalog properties...</div>
 *   <div v-else-if="properties" class="property-explorer">
 *     <div class="overview">
 *       <h2>Catalog Property Analysis</h2>
 *       <div class="stats">
 *         <div class="stat">
 *           <span class="label">Total Properties:</span>
 *           <span class="value">{{ totalProperties }}</span>
 *         </div>
 *         <div class="stat">
 *           <span class="label">Total Unique Values:</span>
 *           <span class="value">{{ totalUniqueValues }}</span>
 *         </div>
 *       </div>
 *     </div>
 *
 *     <div class="property-details">
 *       <h3>Property Breakdown</h3>
 *       <table>
 *         <thead>
 *           <tr>
 *             <th>Property</th>
 *             <th>Unique Values</th>
 *             <th>Values</th>
 *           </tr>
 *         </thead>
 *         <tbody>
 *           <tr v-for="stat in propertyStats" :key="stat.property">
 *             <td><strong>{{ stat.property }}</strong></td>
 *             <td>{{ stat.valueCount }}</td>
 *             <td>
 *               <details>
 *                 <summary>View values</summary>
 *                 <ul class="value-chips">
 *                   <li v-for="value in stat.values" :key="value" class="chip">
 *                     {{ value }}
 *                   </li>
 *                 </ul>
 *               </details>
 *             </td>
 *           </tr>
 *         </tbody>
 *       </table>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * URL-based filter persistence with all properties:
 * ```vue
 * <script setup lang="ts">
 * import { ref, watch } from 'vue'
 * import { useRoute, useRouter } from 'vue-router'
 * import {
 *   useAllPropertiesWithValues,
 *   useDatasetSearch,
 * } from '@dkan-client-tools/vue'
 *
 * const route = useRoute()
 * const router = useRouter()
 *
 * const { data: facets } = useAllPropertiesWithValues()
 *
 * // Initialize filters from URL query params
 * const filters = ref<Record<string, string[]>>(
 *   Object.fromEntries(
 *     Object.entries(route.query).map(([key, value]) => [
 *       key,
 *       Array.isArray(value) ? value : [value as string],
 *     ])
 *   )
 * )
 *
 * // Update URL when filters change
 * watch(
 *   filters,
 *   (newFilters) => {
 *     router.replace({
 *       query: Object.fromEntries(
 *         Object.entries(newFilters).filter(([, values]) => values.length > 0)
 *       ),
 *     })
 *   },
 *   { deep: true }
 * )
 *
 * const { data: results } = useDatasetSearch(filters)
 *
 * function toggleValue(property: string, value: string) {
 *   const current = filters.value[property] || []
 *   if (current.includes(value)) {
 *     filters.value[property] = current.filter((v) => v !== value)
 *     if (filters.value[property].length === 0) {
 *       delete filters.value[property]
 *     }
 *   } else {
 *     filters.value[property] = [...current, value]
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="filterable-catalog">
 *     <aside v-if="facets" class="filters">
 *       <details v-for="(values, property) in facets" :key="property">
 *         <summary>{{ property }}</summary>
 *         <label v-for="value in values" :key="value">
 *           <input
 *             type="checkbox"
 *             :checked="filters[property]?.includes(value)"
 *             @change="toggleValue(property, value)"
 *           />
 *           {{ value }}
 *         </label>
 *       </details>
 *     </aside>
 *
 *     <main class="results">
 *       <p v-if="results">{{ results.total }} datasets found</p>
 *       <!-- Results display -->
 *
 *       <div class="share">
 *         <p>Share this filtered view:</p>
 *         <input
 *           type="text"
 *           readonly
 *           :value="window.location.href"
 *           @click="(e) => (e.target as HTMLInputElement).select()"
 *         />
 *       </div>
 *     </main>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDatasetProperties} to fetch only property names
 * @see {@link usePropertyValues} to fetch values for a single property
 * @see {@link useDatasetSearch} to filter datasets using property values
 * @see {@link useDatasetFacets} for theme/keyword/publisher facets specifically
 */
export function useAllPropertiesWithValues(options: UseAllPropertiesWithValuesOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['dataset-properties', 'with-values'] as const,
    queryFn: () => client.getAllPropertiesWithValues(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  })
}
