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
 * Composable to get all available dataset properties
 * Returns the list of fields that can be used for filtering
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDatasetProperties } from '@dkan-client-tools/vue'
 *
 * const { data: properties, isLoading } = useDatasetProperties()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading properties...</div>
 *   <select v-else-if="properties">
 *     <option value="">Select a property</option>
 *     <option v-for="prop in properties" :key="prop" :value="prop">
 *       {{ prop }}
 *     </option>
 *   </select>
 * </template>
 * ```
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
 * Composable to get all values for a specific property
 * Useful for building filter dropdowns
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { usePropertyValues } from '@dkan-client-tools/vue'
 *
 * const { data: themes, isLoading } = usePropertyValues({
 *   property: 'theme',
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading themes...</div>
 *   <select v-else-if="themes">
 *     <option value="">All themes</option>
 *     <option v-for="theme in themes" :key="theme" :value="theme">
 *       {{ theme }}
 *     </option>
 *   </select>
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { usePropertyValues } from '@dkan-client-tools/vue'
 *
 * const property = ref('')
 * const { data: values, isLoading } = usePropertyValues({
 *   property,
 *   enabled: computed(() => !!property.value),
 * })
 * </script>
 *
 * <template>
 *   <div v-if="!property">Enter a property</div>
 *   <div v-else-if="isLoading">Loading values...</div>
 *   <div v-else-if="!values || values.length === 0">No values available</div>
 *   <div v-else>
 *     <h4>Filter by {{ property }}:</h4>
 *     <ul>
 *       <li v-for="value in values" :key="value">
 *         <label>
 *           <input type="checkbox" :value="value" />
 *           {{ value }}
 *         </label>
 *       </li>
 *     </ul>
 *   </div>
 * </template>
 * ```
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
 * Composable to get all properties with their values
 * Returns a complete map of all properties and their possible values
 * Useful for building comprehensive faceted search UIs
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useAllPropertiesWithValues } from '@dkan-client-tools/vue'
 *
 * const { data: facets, isLoading } = useAllPropertiesWithValues()
 * const filters = ref<Record<string, string[]>>({})
 *
 * const toggleFilter = (property: string, value: string, checked: boolean) => {
 *   if (checked) {
 *     filters.value[property] = [...(filters.value[property] || []), value]
 *   } else {
 *     filters.value[property] = filters.value[property]?.filter(v => v !== value)
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading filters...</div>
 *   <div v-else-if="facets">
 *     <h3>Filter Datasets</h3>
 *     <div v-for="(values, property) in facets" :key="property">
 *       <h4>{{ property }}</h4>
 *       <label v-for="value in values" :key="value">
 *         <input
 *           type="checkbox"
 *           :checked="filters[property]?.includes(value)"
 *           @change="(e) => toggleFilter(property, value, (e.target as HTMLInputElement).checked)"
 *         />
 *         {{ value }}
 *       </label>
 *     </div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useAllPropertiesWithValues } from '@dkan-client-tools/vue'
 *
 * const { data: properties, isLoading } = useAllPropertiesWithValues()
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="properties">
 *     <h2>Dataset Properties</h2>
 *     <details v-for="(values, prop) in properties" :key="prop">
 *       <summary>
 *         {{ prop }} ({{ values.length }} values)
 *       </summary>
 *       <ul>
 *         <li v-for="value in values" :key="value">
 *           {{ value }}
 *         </li>
 *       </ul>
 *     </details>
 *   </div>
 * </template>
 * ```
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
