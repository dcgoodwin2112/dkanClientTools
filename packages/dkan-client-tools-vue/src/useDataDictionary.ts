/**
 * Vue composables for fetching DKAN data dictionaries
 */

import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useDkanClient } from './plugin'

export interface UseDataDictionaryOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export interface UseDataDictionaryListOptions {
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

/**
 * Fetches a data dictionary by identifier with automatic caching and reactivity.
 *
 * A data dictionary documents the structure, meaning, and allowed values for fields in a
 * dataset's distribution files. Based on the Frictionless Table Schema specification, data
 * dictionaries provide essential metadata for understanding and using tabular data including
 * field names, data types, formats, descriptions, constraints, and enum values.
 *
 * **What is a Data Dictionary?**
 * A data dictionary is a metadata document that describes each column/field in a dataset:
 * - Field names and their meaning
 * - Data types (string, integer, number, date, etc.)
 * - Format specifications (date-time formats, number patterns)
 * - Descriptions explaining what each field contains
 * - Constraints (required, unique, minimum/maximum values)
 * - Enum values (allowed values for categorical fields)
 *
 * **Frictionless Table Schema**: Data dictionaries follow the Frictionless Data specification,
 * a widely-used standard for describing tabular data structures.
 *
 * **Reactive Queries**: The identifier parameter accepts refs or computed values. When these
 * change, the query automatically re-executes to fetch the new data dictionary.
 *
 * Use this composable when you need to:
 * - Display data dictionary documentation to users
 * - Build field browsers and schema explorers
 * - Generate form inputs based on field types
 * - Validate data against schema constraints
 * - Show enum value dropdowns for categorical fields
 * - Provide data documentation in data preview interfaces
 *
 * @param options - Configuration options for fetching the data dictionary
 *
 * @returns TanStack Vue Query result object containing the data dictionary
 *
 * @example
 * Basic data dictionary display:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDataDictionary } from '@dkan-client-tools/vue'
 *
 * const dictId = ref('my-dictionary-uuid')
 * const { data, isLoading, error } = useDataDictionary({
 *   identifier: dictId,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else-if="data">
 *     <h3>{{ data.data.title }}</h3>
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>Field</th>
 *           <th>Type</th>
 *           <th>Description</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="field in data.data.fields" :key="field.name">
 *           <td>{{ field.name }}</td>
 *           <td>{{ field.type }}</td>
 *           <td>{{ field.description }}</td>
 *         </tr>
 *       </tbody>
 *     </table>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Comprehensive field documentation with constraints and enums:
 * ```vue
 * <script setup lang="ts">
 * import { useDataDictionary } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ dictionaryId: string }>()
 *
 * const { data: dictionary, isLoading } = useDataDictionary({
 *   identifier: props.dictionaryId,
 * })
 * </script>
 *
 * <template>
 *   <div class="dictionary-viewer">
 *     <div v-if="isLoading">Loading data dictionary...</div>
 *     <div v-else-if="dictionary" class="field-list">
 *       <h2>{{ dictionary.data.title }}</h2>
 *       <p v-if="dictionary.data.description">{{ dictionary.data.description }}</p>
 *
 *       <div
 *         v-for="field in dictionary.data.fields"
 *         :key="field.name"
 *         class="field-card"
 *       >
 *         <div class="field-header">
 *           <h3>{{ field.title || field.name }}</h3>
 *           <span class="field-type">{{ field.type }}</span>
 *           <span v-if="field.format" class="field-format">({{ field.format }})</span>
 *           <span v-if="field.constraints?.required" class="required-badge">
 *             Required
 *           </span>
 *         </div>
 *
 *         <p v-if="field.description" class="field-description">
 *           {{ field.description }}
 *         </p>
 *
 *         <!-- Constraints -->
 *         <div v-if="field.constraints" class="field-constraints">
 *           <h4>Constraints:</h4>
 *           <ul>
 *             <li v-if="field.constraints.minimum">
 *               Minimum: {{ field.constraints.minimum }}
 *             </li>
 *             <li v-if="field.constraints.maximum">
 *               Maximum: {{ field.constraints.maximum }}
 *             </li>
 *             <li v-if="field.constraints.minLength">
 *               Min length: {{ field.constraints.minLength }}
 *             </li>
 *             <li v-if="field.constraints.maxLength">
 *               Max length: {{ field.constraints.maxLength }}
 *             </li>
 *             <li v-if="field.constraints.pattern">
 *               Pattern: <code>{{ field.constraints.pattern }}</code>
 *             </li>
 *             <li v-if="field.constraints.unique">Must be unique</li>
 *           </ul>
 *         </div>
 *
 *         <!-- Enum values -->
 *         <div v-if="field.constraints?.enum" class="field-enum">
 *           <h4>Allowed Values:</h4>
 *           <ul class="enum-list">
 *             <li v-for="value in field.constraints.enum" :key="value">
 *               <code>{{ value }}</code>
 *             </li>
 *           </ul>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Generate form inputs based on data dictionary:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDataDictionary } from '@dkan-client-tools/vue'
 * import type { TableSchemaField } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{ dictionaryId: string }>()
 *
 * const { data: dictionary } = useDataDictionary({
 *   identifier: props.dictionaryId,
 * })
 *
 * const formData = ref<Record<string, any>>({})
 *
 * function getInputType(field: TableSchemaField): string {
 *   switch (field.type) {
 *     case 'integer':
 *     case 'number':
 *       return 'number'
 *     case 'date':
 *       return 'date'
 *     case 'datetime':
 *       return 'datetime-local'
 *     case 'boolean':
 *       return 'checkbox'
 *     default:
 *       return 'text'
 *   }
 * }
 *
 * function handleSubmit() {
 *   console.log('Form data:', formData.value)
 *   // Validate and submit
 * }
 * </script>
 *
 * <template>
 *   <form v-if="dictionary" @submit.prevent="handleSubmit" class="dynamic-form">
 *     <h2>{{ dictionary.data.title }}</h2>
 *
 *     <div
 *       v-for="field in dictionary.data.fields"
 *       :key="field.name"
 *       class="form-field"
 *     >
 *       <label :for="field.name">
 *         {{ field.title || field.name }}
 *         <span v-if="field.constraints?.required" class="required">*</span>
 *       </label>
 *
 *       <!-- Enum fields use select -->
 *       <select
 *         v-if="field.constraints?.enum"
 *         v-model="formData[field.name]"
 *         :id="field.name"
 *         :required="field.constraints?.required"
 *       >
 *         <option value="">Select...</option>
 *         <option v-for="value in field.constraints.enum" :key="value" :value="value">
 *           {{ value }}
 *         </option>
 *       </select>
 *
 *       <!-- Boolean fields use checkbox -->
 *       <input
 *         v-else-if="field.type === 'boolean'"
 *         type="checkbox"
 *         v-model="formData[field.name]"
 *         :id="field.name"
 *       />
 *
 *       <!-- Other fields use appropriate input type -->
 *       <input
 *         v-else
 *         :type="getInputType(field)"
 *         v-model="formData[field.name]"
 *         :id="field.name"
 *         :required="field.constraints?.required"
 *         :min="field.constraints?.minimum"
 *         :max="field.constraints?.maximum"
 *         :minlength="field.constraints?.minLength"
 *         :maxlength="field.constraints?.maxLength"
 *         :pattern="field.constraints?.pattern"
 *       />
 *
 *       <small v-if="field.description">{{ field.description }}</small>
 *     </div>
 *
 *     <button type="submit">Submit</button>
 *   </form>
 * </template>
 * ```
 *
 * @example
 * Reactive dictionary switching:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDataDictionary } from '@dkan-client-tools/vue'
 *
 * const availableDictionaries = ref([
 *   { id: 'dict-1', name: 'Census Data' },
 *   { id: 'dict-2', name: 'Health Indicators' },
 *   { id: 'dict-3', name: 'Economic Data' },
 * ])
 *
 * const selectedId = ref('dict-1')
 *
 * // Automatically re-fetches when selectedId changes
 * const { data: dictionary, isFetching } = useDataDictionary({
 *   identifier: selectedId,
 * })
 * </script>
 *
 * <template>
 *   <div class="dictionary-switcher">
 *     <select v-model="selectedId">
 *       <option v-for="dict in availableDictionaries" :key="dict.id" :value="dict.id">
 *         {{ dict.name }}
 *       </option>
 *     </select>
 *
 *     <div v-if="isFetching" class="loading">Loading...</div>
 *     <div v-else-if="dictionary" class="dictionary-content">
 *       <h2>{{ dictionary.data.title }}</h2>
 *       <p>{{ dictionary.data.fields.length }} fields defined</p>
 *       <ul>
 *         <li v-for="field in dictionary.data.fields" :key="field.name">
 *           {{ field.name }} ({{ field.type }})
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDataDictionaryList} to fetch all available data dictionaries
 * @see {@link useDataDictionaryFromUrl} to fetch dictionary from a URL
 * @see {@link useDatastoreSchema} to get schema with dictionary for a distribution
 * @see {@link useCreateDataDictionary} to create new data dictionaries
 * @see {@link useUpdateDataDictionary} to update existing data dictionaries
 * @see https://specs.frictionlessdata.io/table-schema/ Frictionless Table Schema specification
 */
export function useDataDictionary(options: UseDataDictionaryOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['data-dictionary', options.identifier] as const,
    queryFn: () => client.getDataDictionary(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches all data dictionaries with automatic caching.
 *
 * This composable retrieves a complete list of all data dictionaries available in the DKAN
 * instance. Use this to build data dictionary browsers, selection dropdowns, or management
 * interfaces where users need to see all available schema documentation.
 *
 * **Returns**: An array of data dictionary objects, each containing the identifier and the
 * full Frictionless Table Schema with field definitions, types, constraints, and descriptions.
 *
 * **Caching**: Results are automatically cached and can be configured with `staleTime` to
 * control how long the list remains fresh before background refetching occurs.
 *
 * Use this composable when you need to:
 * - Display a catalog of all data dictionaries
 * - Build dictionary selection interfaces
 * - Create data dictionary management dashboards
 * - Show available schema options to users
 * - Build schema browsing and discovery tools
 *
 * @param options - Configuration options for the query
 *
 * @returns TanStack Vue Query result object containing array of data dictionaries
 *
 * @example
 * Basic dictionary list:
 * ```vue
 * <script setup lang="ts">
 * import { useDataDictionaryList } from '@dkan-client-tools/vue'
 *
 * const { data, isLoading, error } = useDataDictionaryList()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading dictionaries...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <ul v-else-if="data">
 *     <li v-for="dict in data" :key="dict.identifier">
 *       {{ dict.data.title || dict.identifier }}
 *     </li>
 *   </ul>
 * </template>
 * ```
 *
 * @example
 * Dictionary browser with statistics:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDataDictionaryList } from '@dkan-client-tools/vue'
 * import { useRouter } from 'vue-router'
 *
 * const { data: dictionaries, isLoading } = useDataDictionaryList()
 * const router = useRouter()
 *
 * const dictionaryStats = computed(() => {
 *   if (!dictionaries.value) return []
 *   return dictionaries.value.map((dict) => ({
 *     identifier: dict.identifier,
 *     title: dict.data.title || 'Untitled',
 *     description: dict.data.description,
 *     fieldCount: dict.data.fields?.length || 0,
 *     requiredFields: dict.data.fields?.filter((f) => f.constraints?.required).length || 0,
 *     hasEnums: dict.data.fields?.some((f) => f.constraints?.enum) || false,
 *   }))
 * })
 *
 * function viewDictionary(id: string) {
 *   router.push(`/dictionaries/${id}`)
 * }
 * </script>
 *
 * <template>
 *   <div class="dictionary-browser">
 *     <h1>Data Dictionaries</h1>
 *     <p v-if="dictionaries">{{ dictionaries.length }} dictionaries available</p>
 *
 *     <div v-if="isLoading" class="loading">Loading dictionaries...</div>
 *
 *     <div v-else-if="dictionaryStats.length > 0" class="dictionary-cards">
 *       <div
 *         v-for="dict in dictionaryStats"
 *         :key="dict.identifier"
 *         class="dictionary-card"
 *         @click="viewDictionary(dict.identifier)"
 *       >
 *         <h3>{{ dict.title }}</h3>
 *         <p v-if="dict.description" class="description">{{ dict.description }}</p>
 *
 *         <div class="stats">
 *           <span class="stat">{{ dict.fieldCount }} fields</span>
 *           <span class="stat">{{ dict.requiredFields }} required</span>
 *           <span v-if="dict.hasEnums" class="stat badge">Has enums</span>
 *         </div>
 *       </div>
 *     </div>
 *
 *     <p v-else>No data dictionaries found</p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Dictionary selection dropdown:
 * ```vue
 * <script setup lang="ts">
 * import { ref, watch } from 'vue'
 * import { useDataDictionaryList, useDataDictionary } from '@dkan-client-tools/vue'
 *
 * const { data: dictionaries } = useDataDictionaryList()
 * const selectedId = ref<string>()
 *
 * const { data: selectedDictionary } = useDataDictionary({
 *   identifier: selectedId,
 *   enabled: () => !!selectedId.value,
 * })
 *
 * watch(dictionaries, (dicts) => {
 *   // Auto-select first dictionary
 *   if (dicts && dicts.length > 0 && !selectedId.value) {
 *     selectedId.value = dicts[0].identifier
 *   }
 * })
 * </script>
 *
 * <template>
 *   <div class="dictionary-selector">
 *     <label for="dict-select">Select Data Dictionary:</label>
 *     <select id="dict-select" v-model="selectedId">
 *       <option :value="undefined">-- Select a dictionary --</option>
 *       <option
 *         v-for="dict in dictionaries"
 *         :key="dict.identifier"
 *         :value="dict.identifier"
 *       >
 *         {{ dict.data.title || dict.identifier }}
 *         ({{ dict.data.fields?.length || 0 }} fields)
 *       </option>
 *     </select>
 *
 *     <div v-if="selectedDictionary" class="dictionary-preview">
 *       <h3>{{ selectedDictionary.data.title }}</h3>
 *       <p>{{ selectedDictionary.data.fields?.length }} fields defined</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Dictionary management dashboard:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import {
 *   useDataDictionaryList,
 *   useDeleteDataDictionary,
 * } from '@dkan-client-tools/vue'
 * import { useRouter } from 'vue-router'
 *
 * const { data: dictionaries, isLoading } = useDataDictionaryList({
 *   staleTime: 60000, // Cache for 1 minute
 * })
 * const deleteDict = useDeleteDataDictionary()
 * const router = useRouter()
 *
 * const sortedDictionaries = computed(() => {
 *   if (!dictionaries.value) return []
 *   return [...dictionaries.value].sort((a, b) => {
 *     const titleA = a.data.title || a.identifier
 *     const titleB = b.data.title || b.identifier
 *     return titleA.localeCompare(titleB)
 *   })
 * })
 *
 * function handleDelete(identifier: string, title: string) {
 *   if (confirm(`Delete "${title}"? This cannot be undone.`)) {
 *     deleteDict.mutate(identifier, {
 *       onSuccess: () => {
 *         console.log('Dictionary deleted successfully')
 *       },
 *     })
 *   }
 * }
 *
 * function createNew() {
 *   router.push('/dictionaries/new')
 * }
 * </script>
 *
 * <template>
 *   <div class="dictionary-dashboard">
 *     <div class="header">
 *       <h1>Data Dictionary Management</h1>
 *       <button @click="createNew" class="btn-primary">
 *         Create New Dictionary
 *       </button>
 *     </div>
 *
 *     <div v-if="isLoading">Loading...</div>
 *
 *     <table v-else-if="sortedDictionaries.length > 0" class="dictionary-table">
 *       <thead>
 *         <tr>
 *           <th>Title</th>
 *           <th>Fields</th>
 *           <th>Identifier</th>
 *           <th>Actions</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="dict in sortedDictionaries" :key="dict.identifier">
 *           <td>{{ dict.data.title || 'Untitled' }}</td>
 *           <td>{{ dict.data.fields?.length || 0 }}</td>
 *           <td><code>{{ dict.identifier }}</code></td>
 *           <td>
 *             <button
 *               @click="router.push(`/dictionaries/${dict.identifier}`)"
 *               class="btn-small"
 *             >
 *               View
 *             </button>
 *             <button
 *               @click="router.push(`/dictionaries/${dict.identifier}/edit`)"
 *               class="btn-small"
 *             >
 *               Edit
 *             </button>
 *             <button
 *               @click="handleDelete(dict.identifier, dict.data.title || dict.identifier)"
 *               :disabled="deleteDict.isPending"
 *               class="btn-small btn-danger"
 *             >
 *               Delete
 *             </button>
 *           </td>
 *         </tr>
 *       </tbody>
 *     </table>
 *
 *     <p v-else>No data dictionaries found. Create one to get started.</p>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDataDictionary} to fetch a specific data dictionary
 * @see {@link useCreateDataDictionary} to create new data dictionaries
 * @see {@link useDeleteDataDictionary} to delete data dictionaries
 */
export function useDataDictionaryList(options: UseDataDictionaryListOptions = {}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['data-dictionaries'] as const,
    queryFn: () => client.listDataDictionaries(),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches a data dictionary from an external URL with automatic caching and reactivity.
 *
 * This composable retrieves data dictionary schemas from URLs, primarily used to fetch
 * dictionaries referenced in a distribution's `describedBy` property. When datasets reference
 * external schema documentation, this composable handles the HTTP request and caching.
 *
 * **Common Use Cases**:
 * - Fetching schemas referenced in `distribution[].describedBy`
 * - Loading external Frictionless Table Schemas
 * - Accessing schemas hosted on separate servers
 * - Retrieving published schema documentation
 *
 * **URL Format**: The URL should point to a valid JSON file containing a Frictionless
 * Table Schema with field definitions, types, constraints, and descriptions.
 *
 * **Reactive URLs**: The url parameter accepts refs or computed values. When the URL
 * changes, the query automatically re-executes to fetch the new dictionary.
 *
 * Use this composable when you need to:
 * - Load data dictionaries referenced by distributions
 * - Fetch external schema documentation
 * - Display field descriptions from remote schemas
 * - Validate data against externally-hosted schemas
 * - Build schema viewers for external documentation
 *
 * @param options - Configuration options including the URL
 *
 * @returns TanStack Vue Query result object containing the fetched data dictionary
 *
 * @example
 * Basic usage with distribution describedBy:
 * ```vue
 * <script setup lang="ts">
 * import { useDataDictionaryFromUrl } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ distribution: any }>()
 *
 * const { data, isLoading } = useDataDictionaryFromUrl({
 *   url: props.distribution.describedBy,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading schema...</div>
 *   <div v-else-if="data">
 *     <h3>{{ data.data.title }}</h3>
 *     <p>{{ data.data.fields?.length }} fields defined</p>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Conditional loading only when URL exists:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDataset, useDataDictionaryFromUrl } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string; index: number }>()
 *
 * const { data: dataset } = useDataset({ identifier: props.datasetId })
 *
 * const distribution = computed(() => dataset.value?.distribution?.[props.index])
 * const schemaUrl = computed(() => distribution.value?.describedBy)
 *
 * const { data: dictionary, isLoading, isError } = useDataDictionaryFromUrl({
 *   url: schemaUrl,
 *   enabled: () => !!schemaUrl.value, // Only fetch if URL exists
 * })
 * </script>
 *
 * <template>
 *   <div class="distribution-schema">
 *     <div v-if="!schemaUrl">No schema documentation available</div>
 *     <div v-else-if="isLoading">Loading schema...</div>
 *     <div v-else-if="isError">Failed to load schema</div>
 *     <div v-else-if="dictionary" class="schema-content">
 *       <h3>Schema: {{ dictionary.data.title }}</h3>
 *       <table>
 *         <thead>
 *           <tr>
 *             <th>Field</th>
 *             <th>Type</th>
 *             <th>Description</th>
 *           </tr>
 *         </thead>
 *         <tbody>
 *           <tr v-for="field in dictionary.data.fields" :key="field.name">
 *             <td>{{ field.name }}</td>
 *             <td>{{ field.type }}</td>
 *             <td>{{ field.description || '-' }}</td>
 *           </tr>
 *         </tbody>
 *       </table>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Schema comparison across multiple distributions:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDataset, useDataDictionaryFromUrl } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string }>()
 *
 * const { data: dataset } = useDataset({ identifier: props.datasetId })
 *
 * const distributions = computed(() => dataset.value?.distribution || [])
 *
 * function getDictionaryForDistribution(dist: any) {
 *   return useDataDictionaryFromUrl({
 *     url: dist.describedBy,
 *     enabled: () => !!dist.describedBy,
 *   })
 * }
 * </script>
 *
 * <template>
 *   <div class="schema-comparison">
 *     <h2>Distribution Schemas</h2>
 *     <div
 *       v-for="(dist, index) in distributions"
 *       :key="dist.identifier"
 *       class="distribution-schema"
 *     >
 *       <h3>{{ dist.title }}</h3>
 *       <div v-if="dist.describedBy">
 *         <code>{{ dist.describedBy }}</code>
 *         <!-- Each distribution gets its own schema query -->
 *         <div v-bind="getDictionaryForDistribution(dist)">
 *           <!-- Schema content here -->
 *         </div>
 *       </div>
 *       <p v-else>No schema URL provided</p>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDataDictionary} to fetch dictionaries by identifier
 * @see {@link useDatastoreSchema} to get schema for a specific distribution by index
 * @see {@link useDataset} to get distribution information with describedBy URLs
 */
export function useDataDictionaryFromUrl(options: {
  url: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: ['data-dictionary-url', options.url] as const,
    queryFn: () => client.getDataDictionaryFromUrl(toValue(options.url)),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}

/**
 * Fetches the datastore schema for a specific distribution with automatic caching and reactivity.
 *
 * This composable retrieves the complete schema information for a distribution's datastore table,
 * including field definitions from the associated data dictionary. It provides the Frictionless
 * Table Schema that describes the structure of the imported data, making it essential for
 * understanding data types, formats, and constraints when querying or displaying datastore data.
 *
 * **What is a Datastore Schema?**
 * When a distribution's data file (CSV, JSON, etc.) is imported into DKAN's datastore, it
 * becomes a queryable database table. The schema describes this table's structure including:
 * - Column names and data types
 * - Format specifications (date formats, number patterns)
 * - Field descriptions and titles
 * - Constraints and validation rules
 *
 * **Relationship to Data Dictionaries**: If a distribution has an associated data dictionary,
 * that dictionary's field definitions are included in the schema response, providing rich
 * metadata for each column.
 *
 * **Reactive Parameters**: Both datasetId and index accept refs or computed values. When these
 * change, the query automatically re-executes to fetch the new schema.
 *
 * Use this composable when you need to:
 * - Display field information for data preview tables
 * - Generate data type indicators in table headers
 * - Build dynamic form inputs based on field types
 * - Show field descriptions as tooltips or help text
 * - Validate user input against schema constraints
 * - Format values based on field format specifications
 *
 * @param options - Configuration options including datasetId and distribution index
 *
 * @returns TanStack Vue Query result object containing the datastore schema
 *
 * @example
 * Basic schema display:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useDatastoreSchema } from '@dkan-client-tools/vue'
 *
 * const datasetId = ref('my-dataset-uuid')
 * const { data, isLoading } = useDatastoreSchema({
 *   datasetId,
 *   index: 0,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading schema...</div>
 *   <div v-else-if="data?.schema">
 *     <h4>Schema Fields:</h4>
 *     <ul>
 *       <li v-for="field in data.schema.fields" :key="field.name">
 *         {{ field.name }}: {{ field.type }}
 *         {{ field.format ? `(${field.format})` : '' }}
 *       </li>
 *     </ul>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Data table with schema-based type indicators:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useDatastore, useDatastoreSchema } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string; index: number }>()
 *
 * const { data: schema } = useDatastoreSchema({
 *   datasetId: props.datasetId,
 *   index: props.index,
 * })
 *
 * const { data: datastoreData } = useDatastore({
 *   datasetId: props.datasetId,
 *   index: props.index,
 *   queryOptions: { limit: 20 },
 * })
 *
 * const fields = computed(() => schema.value?.schema?.fields || [])
 *
 * function getTypeIcon(type: string): string {
 *   switch (type) {
 *     case 'integer':
 *     case 'number':
 *       return '🔢'
 *     case 'string':
 *       return '📝'
 *     case 'date':
 *     case 'datetime':
 *       return '📅'
 *     case 'boolean':
 *       return '✓'
 *     default:
 *       return '•'
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div class="data-table-with-schema">
 *     <table>
 *       <thead>
 *         <tr>
 *           <th v-for="field in fields" :key="field.name" :title="field.description">
 *             <span class="type-icon">{{ getTypeIcon(field.type) }}</span>
 *             {{ field.title || field.name }}
 *             <span class="field-type">({{ field.type }})</span>
 *           </th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr v-for="(row, i) in datastoreData?.results" :key="i">
 *           <td v-for="field in fields" :key="field.name">
 *             {{ row[field.name] }}
 *           </td>
 *         </tr>
 *       </tbody>
 *     </table>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * Schema-driven data input form:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDatastoreSchema } from '@dkan-client-tools/vue'
 * import type { TableSchemaField } from '@dkan-client-tools/core'
 *
 * const props = defineProps<{ datasetId: string; index: number }>()
 *
 * const { data: schema, isLoading } = useDatastoreSchema({
 *   datasetId: props.datasetId,
 *   index: props.index,
 * })
 *
 * const formData = ref<Record<string, any>>({})
 *
 * const fields = computed(() => schema.value?.schema?.fields || [])
 *
 * function getInputType(field: TableSchemaField): string {
 *   if (field.constraints?.enum) return 'select'
 *   switch (field.type) {
 *     case 'integer':
 *     case 'number':
 *       return 'number'
 *     case 'date':
 *       return 'date'
 *     case 'datetime':
 *       return 'datetime-local'
 *     case 'boolean':
 *       return 'checkbox'
 *     default:
 *       return 'text'
 *   }
 * }
 *
 * function handleSubmit() {
 *   console.log('Submitted data:', formData.value)
 *   // Validate and submit to datastore
 * }
 * </script>
 *
 * <template>
 *   <form v-if="!isLoading && fields.length > 0" @submit.prevent="handleSubmit">
 *     <h3>Add New Record</h3>
 *
 *     <div v-for="field in fields" :key="field.name" class="form-field">
 *       <label :for="field.name">
 *         {{ field.title || field.name }}
 *         <span v-if="field.constraints?.required" class="required">*</span>
 *       </label>
 *
 *       <p v-if="field.description" class="field-help">{{ field.description }}</p>
 *
 *       <!-- Enum dropdown -->
 *       <select
 *         v-if="field.constraints?.enum"
 *         v-model="formData[field.name]"
 *         :id="field.name"
 *         :required="field.constraints?.required"
 *       >
 *         <option value="">Select...</option>
 *         <option v-for="value in field.constraints.enum" :key="value" :value="value">
 *           {{ value }}
 *         </option>
 *       </select>
 *
 *       <!-- Boolean checkbox -->
 *       <input
 *         v-else-if="field.type === 'boolean'"
 *         type="checkbox"
 *         v-model="formData[field.name]"
 *         :id="field.name"
 *       />
 *
 *       <!-- Other input types -->
 *       <input
 *         v-else
 *         :type="getInputType(field)"
 *         v-model="formData[field.name]"
 *         :id="field.name"
 *         :required="field.constraints?.required"
 *         :min="field.constraints?.minimum"
 *         :max="field.constraints?.maximum"
 *         :pattern="field.constraints?.pattern"
 *       />
 *     </div>
 *
 *     <button type="submit">Add Record</button>
 *   </form>
 * </template>
 * ```
 *
 * @example
 * Reactive schema switching between distributions:
 * ```vue
 * <script setup lang="ts">
 * import { ref, computed } from 'vue'
 * import { useDataset, useDatastoreSchema } from '@dkan-client-tools/vue'
 *
 * const props = defineProps<{ datasetId: string }>()
 *
 * const { data: dataset } = useDataset({ identifier: props.datasetId })
 * const activeIndex = ref(0)
 *
 * // Automatically re-fetches when activeIndex changes
 * const { data: schema, isFetching } = useDatastoreSchema({
 *   datasetId: props.datasetId,
 *   index: activeIndex,
 * })
 *
 * const activeDistribution = computed(
 *   () => dataset.value?.distribution?.[activeIndex.value]
 * )
 * </script>
 *
 * <template>
 *   <div class="distribution-tabs">
 *     <div class="tabs">
 *       <button
 *         v-for="(dist, index) in dataset?.distribution"
 *         :key="index"
 *         @click="activeIndex = index"
 *         :class="{ active: activeIndex === index }"
 *       >
 *         {{ dist.title }}
 *       </button>
 *     </div>
 *
 *     <div class="tab-content">
 *       <h3>{{ activeDistribution?.title }}</h3>
 *
 *       <div v-if="isFetching" class="loading">Loading schema...</div>
 *       <div v-else-if="schema?.schema" class="schema-info">
 *         <p>{{ schema.schema.fields.length }} fields in this distribution</p>
 *         <ul>
 *           <li v-for="field in schema.schema.fields" :key="field.name">
 *             <strong>{{ field.name }}</strong> ({{ field.type }})
 *             <span v-if="field.description"> - {{ field.description }}</span>
 *           </li>
 *         </ul>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @see {@link useDatastore} to query actual data from the datastore
 * @see {@link useDataDictionary} to fetch standalone data dictionaries
 * @see {@link useDataDictionaryFromUrl} to fetch schemas from external URLs
 */
export function useDatastoreSchema(options: {
  datasetId: MaybeRefOrGetter<string>
  index?: MaybeRefOrGetter<number>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}) {
  const client = useDkanClient()

  return useQuery({
    queryKey: [
      'datastore-schema',
      options.datasetId,
      () => toValue(options.index) ?? 0,
    ] as const,
    queryFn: () =>
      client.getDatastoreSchema(
        toValue(options.datasetId),
        toValue(options.index) ?? 0
      ),
    enabled: () => toValue(options.enabled) ?? true,
    staleTime: options.staleTime,
  })
}
