# Vue 3 Composition API Reference

Reference documentation for Vue 3 Composition API patterns and capabilities.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [TanStack Query](../libraries/TANSTACK_QUERY.md)
- [React Hooks](./REACT_HOOKS.md) (for comparison)
- [Vue Guide](../../VUE_GUIDE.md)

## Quick Reference

**Core APIs**:
- `ref()` - Reactive primitive values
- `reactive()` - Reactive objects
- `computed()` - Derived state
- `watch()` - React to state changes
- `toValue()` - Unwrap refs/getters (Vue 3.3+)

**Setup Patterns**:
- `setup()` function - Traditional Composition API
- `<script setup>` - Modern syntax (recommended)

**Common Patterns in This Project**:
- TanStack Query composables: `useDataset`, `useDatastore`, `useDatasetSearch`
- `MaybeRefOrGetter<T>` - Accept refs, computed, or plain values
- Plugin injection: `useDkanClient`
- Computed query keys for reactivity

**Reactivity Gotchas**:
- Access `.value` for refs
- Objects inside `ref()` are deeply reactive
- Destructuring reactive objects loses reactivity
- Use `toValue()` to unwrap refs/getters

**Lifecycle Hooks**:
- `onMounted`, `onUpdated`, `onUnmounted`
- `onBeforeMount`, `onBeforeUpdate`, `onBeforeUnmount`

---

## Table of Contents

- [Overview](#overview)
- [Composition API Fundamentals](#composition-api-fundamentals)
  - [setup() Function](#setup-function)
  - [`<script setup>` Syntax](#script-setup-syntax)
  - [reactive()](#reactive)
  - [ref()](#ref)
  - [ref() vs reactive()](#ref-vs-reactive)
  - [computed()](#computed)
  - [watch() and watchEffect()](#watch-and-watcheffect)
  - [toValue() and toRef()](#tovalue-and-toref)
- [Vue-Specific Patterns](#vue-specific-patterns)
  - [Composables Pattern](#composables-pattern)
  - [MaybeRefOrGetter<T> Pattern](#maybereforgettert-pattern)
  - [Lifecycle Hooks](#lifecycle-hooks)
  - [Provide/Inject Dependency Injection](#provideinject-dependency-injection)
  - [Template Refs and DOM Access](#template-refs-and-dom-access)
  - [Reactive Props and Emits](#reactive-props-and-emits)
- [Reactivity System](#reactivity-system)
  - [How Vue's Reactivity Works](#how-vues-reactivity-works)
  - [Ref Unwrapping](#ref-unwrapping)
  - [Shallow vs Deep Reactivity](#shallow-vs-deep-reactivity)
  - [Performance Considerations](#performance-considerations)
- [TypeScript Integration](#typescript-integration)
  - [Typing Composables with Generics](#typing-composables-with-generics)
  - [MaybeRefOrGetter and Ref Types](#maybereforgetter-and-ref-types)
  - [Defining Component Props](#defining-component-props)
  - [Defining Component Emits](#defining-component-emits)
  - [Component Type Inference](#component-type-inference)
  - [Ref Type Narrowing](#ref-type-narrowing)
- [Building Composables](#building-composables)
  - [Composable Structure and Naming](#composable-structure-and-naming)
  - [Building Custom Composables](#building-custom-composables)
  - [Using toValue() for Flexible Parameters](#using-tovalue-for-flexible-parameters)
  - [Computed Query Keys for Reactivity](#computed-query-keys-for-reactivity)
  - [Return Value Patterns](#return-value-patterns)
  - [Composable Composition](#composable-composition)
- [Provide/Inject Pattern](#provideinject-pattern)
  - [InjectionKey Pattern with TypeScript](#injectionkey-pattern-with-typescript)
  - [Creating Vue Plugins](#creating-vue-plugins)
  - [Providing Values in Plugins](#providing-values-in-plugins)
  - [Consuming with Inject and Composables](#consuming-with-inject-and-composables)
  - [Error Handling for Missing Providers](#error-handling-for-missing-providers)
- [Integration with TanStack Query](#integration-with-tanstack-query)
  - [How useQuery and useMutation Work in Vue](#how-usequery-and-usemutation-work-in-vue)
  - [Combining Custom Composables with Vue Query](#combining-custom-composables-with-vue-query)
  - [Plugin Setup](#plugin-setup)
  - [Reactive Query Keys with computed()](#reactive-query-keys-with-computed)
  - [MaybeRefOrGetter for Reactive Parameters](#maybereforgetter-for-reactive-parameters)
- [Testing Composables](#testing-composables)
  - [Testing with Vue Test Utils](#testing-with-vue-test-utils)
  - [mount() and Wrapper API](#mount-and-wrapper-api)
  - [Testing with Provide/Inject](#testing-with-provideinject)
  - [Mocking and Spying](#mocking-and-spying)
  - [Testing Reactive Behavior](#testing-reactive-behavior)
- [Best Practices](#best-practices)
  - [When to Use ref() vs reactive()](#when-to-use-ref-vs-reactive)
  - [Composable Naming Conventions](#composable-naming-conventions)
  - [Avoiding Common Pitfalls](#avoiding-common-pitfalls)
  - [Performance Optimization](#performance-optimization)
  - [TypeScript Best Practices](#typescript-best-practices)
- [References](#references)

---

## Overview

The Vue 3 Composition API is a set of function-based APIs that enable flexible composition of component logic. Introduced in Vue 3, the Composition API provides better code organization, reuse, and TypeScript support compared to the Options API.

**Why Composition API?**
- Better code organization by logical concern (not option type)
- Easier extraction and reuse of logic through composables
- Superior TypeScript support with full type inference
- More flexible than mixins for sharing code
- Smaller bundle size (tree-shakeable)
- Foundation for modern Vue patterns

**In This Project:**
- Custom composables built on [TanStack Vue Query](../libraries/TANSTACK_QUERY.md) (`useDataset`, `useDatastore`, etc.)
- Plugin system with provide/inject (`DkanClientPlugin`, `useDkanClient`)
- `MaybeRefOrGetter<T>` pattern for flexible reactive parameters
- Composable composition for complex data fetching
- TypeScript-first composable design with strict typing
- For React equivalent patterns, see [React Hooks](./REACT_HOOKS.md)

### Vue Version Compatibility

**Minimum Version**: Vue 3.0 (when Composition API was introduced, September 2020)

**This Project Requirements**:
- Vue: `^3.3.0` (peer dependency)

**Key Features by Version**:

**Vue 3.0** (September 2020):
- Composition API introduced (`ref`, `reactive`, `computed`, `watch`, etc.)
- `setup()` function
- Lifecycle hooks (`onMounted`, `onUnmounted`, etc.)
- TypeScript support improved significantly
- Smaller bundle size and better performance

**Vue 3.2** (August 2021):
- `<script setup>` syntax (recommended approach)
- Simplified component authoring
- Better performance with improved reactivity
- `defineProps`, `defineEmits` compiler macros
- CSS variable injection (`v-bind` in styles)

**Vue 3.3** (May 2023) - **Required by this project**:
- `toValue()` utility for unwrapping refs/getters
- Improved generic component support
- `defineSlots()` for typed slots
- Better TypeScript inference
- More flexible `defineProps` and `defineEmits`
- Improved reactivity transform

**Vue 3.4** (December 2023):
- Parser rewrite for better performance
- Improved reactivity performance
- Better error messages
- `defineModel()` macro for v-model
- Stable reactivity transform

**Critical Features Used in This Project**:

**`toValue()` (Vue 3.3+)**:
```typescript
import { toValue, type MaybeRefOrGetter } from 'vue'

// toValue() handles refs, computed, getters, and plain values
function useDataset(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ['dataset', toValue(id)]),
    queryFn: () => fetchDataset(toValue(id)),
  })
}
```

**`<script setup>` (Vue 3.2+)**:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// No need for setup() function or return statement
const count = ref(0)
const doubled = computed(() => count.value * 2)

// Automatically exposed to template
</script>
```

**Generic Components (Vue 3.3+)**:
```vue
<script setup lang="ts" generic="T">
defineProps<{
  items: T[]
  renderItem: (item: T) => string
}>()
</script>
```

**Breaking Changes**:

**Vue 2 → Vue 3**:
- Options API still supported but Composition API is recommended
- Reactivity system rewritten (Proxy-based)
- Multiple root elements allowed
- `v-model` behavior changes
- Filters removed (use computed or methods)
- `$listeners` merged into `$attrs`

**Vue 3.0 → 3.2**:
- `<script setup>` syntax introduced (non-breaking addition)
- Performance improvements may change timing behavior

**Vue 3.2 → 3.3**:
- `toValue()` added (non-breaking addition)
- Some TypeScript inference improvements may require code updates

**Best Practices for This Project**:

```vue
<script setup lang="ts">
import { ref, computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useDataset } from '@dkan-client-tools/vue'

// Use MaybeRefOrGetter for flexible parameters
const datasetId = ref('abc-123')

// Composables handle reactive parameters automatically
const { data, isPending, isError } = useDataset({ id: datasetId })

// toValue() unwraps refs/computed/getters
function logId(id: MaybeRefOrGetter<string>) {
  console.log(toValue(id)) // Works with ref, computed, or plain string
}

// Computed for derived state
const title = computed(() => data.value?.title ?? 'Loading...')
</script>
```

**Compatibility Notes**:
- This project requires Vue 3.3+ for `toValue()` support
- `<script setup>` is the recommended syntax
- All composables use `MaybeRefOrGetter<T>` for maximum flexibility
- Older Vue 3 versions (3.0-3.2) are not supported
- Use `toValue()` instead of manual ref unwrapping

**Migration from Options API**:

If migrating from Options API to Composition API:

```vue
<!-- Options API (old) -->
<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubled() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<!-- Composition API (new) -->
<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
}
</script>
```

---

## Composition API Fundamentals

### setup() Function

The `setup()` function is the entry point for using the Composition API in components.

**Signature:**
```typescript
function setup(props: Props, context: SetupContext): RenderFunction | object
```

**Purpose:**
- Executed before component is created
- Access to props and context (attrs, slots, emit, expose)
- Return values are exposed to template
- Setup lifecycle hooks and reactive state

**Example:**
```vue
<script lang="ts">
import { ref, computed } from 'vue'

export default {
  props: {
    datasetId: {
      type: String,
      required: true
    }
  },
  setup(props, { emit }) {
    // Reactive state
    const count = ref(0)

    // Computed property
    const doubled = computed(() => count.value * 2)

    // Method
    function increment() {
      count.value++
      emit('update', count.value)
    }

    // Expose to template
    return {
      count,
      doubled,
      increment
    }
  }
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

**SetupContext Properties:**
```typescript
interface SetupContext {
  attrs: Record<string, any>      // Non-prop attributes
  slots: Slots                     // Slot content
  emit: (event: string, ...args: any[]) => void  // Emit events
  expose: (exposed?: Record<string, any>) => void  // Expose public API
}
```

---

### `<script setup>` Syntax

Simplified syntax for Composition API that reduces boilerplate.

**Why Use It:**
- Less verbose than `setup()` function
- Better runtime performance (compiled optimization)
- Top-level bindings automatically exposed to template
- Better TypeScript inference
- More ergonomic for most use cases

**Example:**
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// Props (defineProps is compiler macro)
const props = defineProps<{
  datasetId: string
}>()

// Emits (defineEmits is compiler macro)
const emit = defineEmits<{
  update: [value: number]
}>()

// All top-level bindings are automatically available in template
const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
  emit('update', count.value)
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

**Compiler Macros (no import needed):**
- `defineProps<T>()` - Define component props
- `defineEmits<T>()` - Define component events
- `defineExpose<T>()` - Expose public API
- `withDefaults()` - Define prop defaults with TypeScript

---

### reactive()

Creates a deep reactive object proxy. All nested properties become reactive.

**TypeScript Signature:**
```typescript
function reactive<T extends object>(target: T): UnwrapNestedRefs<T>
```

**Purpose:**
- Create reactive objects with multiple properties
- Deep reactivity (nested objects are reactive)
- Works with objects, arrays, Map, Set
- Mutation tracking for all properties

**Example:**
```typescript
import { reactive } from 'vue'

// Reactive object
const state = reactive({
  count: 0,
  message: 'Hello',
  nested: {
    value: 42
  }
})

// All properties are reactive
state.count++              // Triggers reactivity
state.nested.value = 100   // Triggers reactivity (deep)

// Reactive array
const items = reactive([1, 2, 3])
items.push(4)  // Triggers reactivity

// Reactive Map
const map = reactive(new Map([['key', 'value']]))
map.set('key', 'new value')  // Triggers reactivity
```

**With TypeScript:**
```typescript
interface Dataset {
  identifier: string
  title: string
  keywords?: string[]
}

const dataset = reactive<Dataset>({
  identifier: 'abc-123',
  title: 'My Dataset',
  keywords: ['health', 'covid']
})

// Type-safe access
dataset.title = 'Updated'  // ✅ OK
dataset.invalid = 'x'      // ❌ TypeScript error
```

**Limitations:**
- Loses reactivity when destructured (use `toRefs()` to fix)
- Cannot replace entire object (reassignment breaks reactivity)
- Only works with object types (not primitives)

---

### ref()

Creates a reactive reference to a value. Works with primitives and objects.

**TypeScript Signature:**
```typescript
function ref<T>(value: T): Ref<UnwrapRef<T>>
function ref<T = any>(): Ref<T | undefined>
```

**Purpose:**
- Create reactive primitives (numbers, strings, booleans)
- Wrap objects in a reactive container
- Maintain reactivity when passing values around
- Access DOM elements (template refs)

**Example:**
```typescript
import { ref } from 'vue'

// Primitive ref
const count = ref(0)
const message = ref('Hello')
const isActive = ref(true)

// Access/update via .value
console.log(count.value)  // 0
count.value++             // Triggers reactivity
message.value = 'World'   // Triggers reactivity

// Object ref
const dataset = ref({
  identifier: 'abc-123',
  title: 'My Dataset'
})

// Access nested properties via .value
dataset.value.title = 'Updated'

// Template ref (DOM element)
const inputRef = ref<HTMLInputElement | null>(null)
```

**Template Ref Example:**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  // Access DOM element after mount
  inputRef.value?.focus()
})
</script>

<template>
  <input ref="inputRef" type="text" />
</template>
```

**Ref Unwrapping:**
```typescript
const count = ref(0)

// In script: must use .value
count.value++

// In template: automatically unwrapped (no .value needed)
// <p>{{ count }}</p>  --> works!

// In reactive object: automatically unwrapped
const state = reactive({
  count: count  // count ref is unwrapped
})
state.count++  // No .value needed
```

---

### ref() vs reactive()

**Comparison Table:**

| Feature | ref() | reactive() |
|---------|-------|------------|
| Works with primitives | ✅ Yes | ❌ No (objects only) |
| Requires .value in script | ✅ Yes | ❌ No |
| Auto-unwrapped in template | ✅ Yes | ✅ Yes |
| Deep reactivity | ✅ Yes | ✅ Yes |
| Can reassign entire value | ✅ Yes | ❌ No (breaks reactivity) |
| Maintains reactivity when destructured | ✅ Yes (returns ref) | ❌ No (loses reactivity) |
| Type inference | Good | Better for complex objects |

**When to Use ref():**
```typescript
// ✅ Primitives
const count = ref(0)
const message = ref('Hello')

// ✅ Single values that might be replaced
const user = ref<User | null>(null)
user.value = newUser  // Can reassign

// ✅ When you need to pass reactivity around
function useCounter() {
  const count = ref(0)
  return { count }  // Maintains reactivity
}

// ✅ Template refs
const elementRef = ref<HTMLElement | null>(null)
```

**When to Use reactive():**
```typescript
// ✅ Objects with multiple related properties
const form = reactive({
  name: '',
  email: '',
  age: 0
})

// ✅ Local component state (multiple values)
const state = reactive({
  loading: false,
  error: null,
  data: []
})

// ✅ When you want clean access (no .value)
state.loading = true  // Clean syntax
```

**Recommendation for This Project:**
The Vue package uses `ref()` for most cases because:
- TanStack Vue Query returns refs
- Consistent with `MaybeRefOrGetter<T>` pattern
- Easier to maintain reactivity when composing

---

### computed()

Creates a computed ref that derives its value from other reactive sources.

**TypeScript Signature:**
```typescript
// Read-only computed
function computed<T>(getter: () => T): ComputedRef<T>

// Writable computed
function computed<T>(options: {
  get: () => T
  set: (value: T) => void
}): WritableComputedRef<T>
```

**Purpose:**
- Derive values from other reactive state
- Cache computed results (only recalculates when dependencies change)
- Compose reactive data transformations
- Read-only by default (unless setter provided)

**Example:**
```typescript
import { ref, computed } from 'vue'

const count = ref(10)

// Read-only computed
const doubled = computed(() => count.value * 2)

console.log(doubled.value)  // 20
count.value = 20
console.log(doubled.value)  // 40 (auto-updated)

// Writable computed
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(value) {
    const parts = value.split(' ')
    firstName.value = parts[0]
    lastName.value = parts[1]
  }
})

fullName.value = 'John Doe'  // Updates firstName and lastName
```

**Computed vs Method:**
```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref([1, 2, 3, 4, 5])

// ✅ Computed - cached, only recalculates when items changes
const evenItems = computed(() => items.value.filter(x => x % 2 === 0))

// ❌ Method - runs every render
const getEvenItems = () => items.value.filter(x => x % 2 === 0)
</script>

<template>
  <!-- Computed: cached result -->
  <div>{{ evenItems }}</div>

  <!-- Method: runs every time template re-renders -->
  <div>{{ getEvenItems() }}</div>
</template>
```

**Computed Query Keys (from this project):**
```typescript
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useDataset(options: UseDatasetOptions) {
  const client = useDkanClient()

  return useQuery({
    // Computed query key - automatically reactive
    queryKey: computed(() => ['dataset', toValue(options.identifier)]),
    queryFn: () => client.getDataset(toValue(options.identifier)),
  })
}
```

---

### watch() and watchEffect()

React to changes in reactive state with side effects.

**watch() Signature:**
```typescript
// Watch single source
function watch<T>(
  source: WatchSource<T>,
  callback: (value: T, oldValue: T, onCleanup: OnCleanup) => void,
  options?: WatchOptions
): StopHandle

// Watch multiple sources
function watch<T extends Readonly<WatchSource<unknown>[]>>(
  sources: T,
  callback: (values: MapSources<T>, oldValues: MapSources<T>, onCleanup: OnCleanup) => void,
  options?: WatchOptions
): StopHandle
```

**watchEffect() Signature:**
```typescript
function watchEffect(
  effect: (onCleanup: OnCleanup) => void,
  options?: WatchEffectOptions
): StopHandle
```

**watch() - Explicit Dependencies:**
```typescript
import { ref, watch } from 'vue'

const count = ref(0)
const message = ref('Hello')

// Watch single source
watch(count, (newValue, oldValue) => {
  console.log(`count changed from ${oldValue} to ${newValue}`)
})

// Watch multiple sources
watch([count, message], ([newCount, newMessage], [oldCount, oldMessage]) => {
  console.log('Either count or message changed')
})

// Watch getter function
watch(
  () => count.value + 1,
  (value) => {
    console.log('Count plus one:', value)
  }
)

// Watch reactive object property
const state = reactive({ count: 0 })
watch(
  () => state.count,
  (newCount) => {
    console.log('State count changed:', newCount)
  }
)
```

**watchEffect() - Automatic Dependencies:**
```typescript
import { ref, watchEffect } from 'vue'

const count = ref(0)
const message = ref('Hello')

// Automatically tracks dependencies
watchEffect(() => {
  console.log(`Count is ${count.value}`)
  console.log(`Message is ${message.value}`)
  // Runs when count OR message changes
})
```

**watch vs watchEffect:**

| Feature | watch() | watchEffect() |
|---------|---------|---------------|
| Explicit dependencies | ✅ Yes | ❌ Auto-tracked |
| Access to old value | ✅ Yes | ❌ No |
| Lazy by default | ✅ Yes (doesn't run immediately) | ❌ No (runs immediately) |
| More control | ✅ Yes | ❌ Less control |

**Cleanup:**
```typescript
watchEffect((onCleanup) => {
  const timer = setTimeout(() => {
    console.log('Delayed action')
  }, 1000)

  // Cleanup before next run or unmount
  onCleanup(() => {
    clearTimeout(timer)
  })
})
```

**Watch Options:**
```typescript
watch(source, callback, {
  immediate: true,      // Run immediately on creation
  deep: true,          // Deep watch for nested properties
  flush: 'post',       // Run after component updates ('pre' | 'post' | 'sync')
  onTrack(e) {},       // Debug: when dependency is tracked
  onTrigger(e) {}      // Debug: when callback is triggered
})
```

---

### toValue() and toRef()

Utilities for working with refs and reactive values.

**toValue() - Normalize to Plain Value:**

```typescript
function toValue<T>(source: MaybeRefOrGetter<T>): T
```

**Purpose:**
- Unwrap refs, getters, or return plain values
- Normalize `MaybeRefOrGetter<T>` parameters
- Essential for flexible composable APIs

**Example:**
```typescript
import { ref, computed, toValue } from 'vue'

const count = ref(10)
const doubled = computed(() => count.value * 2)
const plain = 5

// toValue normalizes all to plain values
toValue(count)      // 10
toValue(doubled)    // 20
toValue(plain)      // 5
toValue(() => 15)   // 15

// Used in composables (from this project)
export function useDataset(options: UseDatasetOptions) {
  return useQuery({
    queryKey: computed(() => ['dataset', toValue(options.identifier)]),
    queryFn: () => client.getDataset(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) ?? true,
  })
}
```

**toRef() - Create Ref to Reactive Property:**

```typescript
function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K
): ToRef<T[K]>
```

**Purpose:**
- Create a ref linked to a reactive object property
- Maintain reactivity when destructuring
- Pass individual properties while keeping reactivity

**Example:**
```typescript
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({
  count: 0,
  message: 'Hello'
})

// Create ref to single property
const countRef = toRef(state, 'count')
countRef.value++  // Updates state.count

// Convert all properties to refs
const { count, message } = toRefs(state)
count.value++     // Updates state.count
```

**toRefs() - Convert All Properties:**
```typescript
function toRefs<T extends object>(object: T): ToRefs<T>
```

```typescript
// Without toRefs - loses reactivity
const { count, message } = state  // ❌ Not reactive

// With toRefs - maintains reactivity
const { count, message } = toRefs(state)  // ✅ Reactive refs
```

---

## Vue-Specific Patterns

### Composables Pattern

Composables are reusable functions that encapsulate stateful logic using Composition API.

**Naming Convention:**
- Prefix with `use` (e.g., `useDataset`, `useMouse`, `useLocalStorage`)
- Signals that the function uses Composition API
- Enables tooling and linting

**Basic Composable:**
```typescript
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event: MouseEvent) {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}

// Usage in component
const { x, y } = useMouse()
```

**Composable Best Practices:**
1. Return refs (not reactive objects) for destructuring
2. Accept `MaybeRefOrGetter<T>` parameters for flexibility
3. Use descriptive names
4. Handle cleanup with lifecycle hooks
5. Type everything with TypeScript

---

### MaybeRefOrGetter<T> Pattern

Type that accepts a value, ref, getter, or computed for maximum flexibility.

**Type Definition:**
```typescript
type MaybeRef<T> = T | Ref<T>
type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)
```

**Purpose:**
- Flexible composable parameters
- Accept reactive or non-reactive values
- Automatic reactivity tracking
- Better DX for composable users

**Example from This Project:**
```typescript
import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue, computed } from 'vue'
import { useDkanClient } from './plugin'

export interface UseDatasetOptions {
  // Can pass: string, ref(string), computed, or () => string
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export function useDataset(options: UseDatasetOptions) {
  const client = useDkanClient()

  return useQuery({
    // toValue() normalizes to plain value
    queryKey: computed(() => ['dataset', toValue(options.identifier)]),
    queryFn: () => client.getDataset(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) ?? true,
  })
}
```

**Usage Flexibility:**
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataset } from '@dkan-client-tools/vue'

const datasetId = ref('abc-123')
const shouldLoad = ref(true)

// All of these work!

// 1. Plain values
const { data: dataset1 } = useDataset({
  identifier: 'abc-123',
  enabled: true
})

// 2. Refs
const { data: dataset2 } = useDataset({
  identifier: datasetId,
  enabled: shouldLoad
})

// 3. Computed
const { data: dataset3 } = useDataset({
  identifier: computed(() => `dataset-${datasetId.value}`),
  enabled: computed(() => datasetId.value !== '')
})

// 4. Getter functions
const { data: dataset4 } = useDataset({
  identifier: () => route.params.id,
  enabled: () => route.params.id !== ''
})
</script>
```

**Benefits:**
- Query automatically re-runs when reactive parameters change
- No need to manually watch and refetch
- Clean, declarative API
- Type-safe with full IntelliSense

---

### Lifecycle Hooks

Composition API lifecycle hooks with `on` prefix.

**Available Hooks:**
```typescript
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onActivated,      // keep-alive
  onDeactivated,    // keep-alive
  onErrorCaptured,
  onRenderTracked,  // debug
  onRenderTriggered // debug
} from 'vue'
```

**Lifecycle Flow:**
```
setup()
  ↓
onBeforeMount()
  ↓
----- DOM MOUNTED -----
  ↓
onMounted()
  ↓
(reactive changes trigger updates)
  ↓
onBeforeUpdate()
  ↓
----- DOM UPDATED -----
  ↓
onUpdated()
  ↓
(component being unmounted)
  ↓
onBeforeUnmount()
  ↓
----- DOM UNMOUNTED -----
  ↓
onUnmounted()
```

**Common Patterns:**
```typescript
import { ref, onMounted, onUnmounted } from 'vue'

export function useInterval(callback: () => void, delay: number) {
  let intervalId: number | undefined

  onMounted(() => {
    intervalId = window.setInterval(callback, delay)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })
}

// Fetching data on mount (though TanStack Query is preferred)
onMounted(async () => {
  loading.value = true
  try {
    data.value = await fetchData()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
})
```

**Multiple Hook Registrations:**
```typescript
// You can call hooks multiple times
onMounted(() => {
  console.log('First mounted hook')
})

onMounted(() => {
  console.log('Second mounted hook')
})

// Both will run in order
```

---

### Provide/Inject Dependency Injection

Share data across component tree without prop drilling.

**Basic Pattern:**
```typescript
import { provide, inject, type InjectionKey } from 'vue'

// 1. Create typed injection key
interface UserService {
  getUser: () => Promise<User>
  updateUser: (user: User) => Promise<void>
}

const UserServiceKey: InjectionKey<UserService> = Symbol('UserService')

// 2. Provide in parent
const userService: UserService = {
  getUser: async () => { /* ... */ },
  updateUser: async (user) => { /* ... */ }
}
provide(UserServiceKey, userService)

// 3. Inject in child (any level deep)
const userService = inject(UserServiceKey)
if (!userService) {
  throw new Error('UserService not provided')
}
```

**Example from This Project (DkanClientPlugin):**
```typescript
import { type App, type Plugin, inject, type InjectionKey } from 'vue'
import { DkanClient } from '@dkan-client-tools/core'

// 1. Create injection key
export const DkanClientKey: InjectionKey<DkanClient> = Symbol('DkanClient')

// 2. Provide via plugin
export const DkanClientPlugin: Plugin<DkanClientPluginOptions> = {
  install(app: App, options: DkanClientPluginOptions) {
    const client = new DkanClient(options.clientOptions)
    app.provide(DkanClientKey, client)
  }
}

// 3. Composable to inject
export function useDkanClient(): DkanClient {
  const client = inject(DkanClientKey)

  if (!client) {
    throw new Error('useDkanClient must be used in a Vue app with DkanClientPlugin installed')
  }

  return client
}
```

**Usage:**
```typescript
// main.ts
import { createApp } from 'vue'
import { DkanClientPlugin } from '@dkan-client-tools/vue'

const app = createApp(App)
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://dkan.example.com'
  }
})

// Any component
const client = useDkanClient()
```

**With Default Values:**
```typescript
const theme = inject('theme', 'light')  // Default: 'light'

// Or with factory function
const config = inject('config', () => ({ mode: 'development' }))
```

---

### Template Refs and DOM Access

Access DOM elements and component instances using refs.

**Element Refs:**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)
const divRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  // Access DOM after mount
  inputRef.value?.focus()

  if (divRef.value) {
    const rect = divRef.value.getBoundingClientRect()
    console.log('Div dimensions:', rect.width, rect.height)
  }
})
</script>

<template>
  <input ref="inputRef" type="text" />
  <div ref="divRef">Content</div>
</template>
```

**Component Refs:**
```vue
<!-- Child.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}

// Expose public API
defineExpose({
  count,
  increment
})
</script>

<!-- Parent.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Child from './Child.vue'

const childRef = ref<InstanceType<typeof Child> | null>(null)

onMounted(() => {
  // Call child method
  childRef.value?.increment()

  // Access child state
  console.log(childRef.value?.count)
})
</script>

<template>
  <Child ref="childRef" />
</template>
```

**Refs in v-for:**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const itemRefs = ref<HTMLElement[]>([])

onMounted(() => {
  console.log('All item elements:', itemRefs.value)
})
</script>

<template>
  <div v-for="item in items" :key="item.id" :ref="el => itemRefs.push(el as HTMLElement)">
    {{ item.name }}
  </div>
</template>
```

---

### Reactive Props and Emits

**defineProps with TypeScript:**
```vue
<script setup lang="ts">
// Runtime props with types
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
})

// Type-only props (recommended)
const props = defineProps<{
  title: string
  count?: number
}>()

// With defaults using withDefaults
interface Props {
  title: string
  count?: number
  items?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  items: () => []
})

// Props are reactive
watchEffect(() => {
  console.log('Title changed:', props.title)
})
</script>
```

**defineEmits with TypeScript:**
```vue
<script setup lang="ts">
// Runtime emits
const emit = defineEmits(['update', 'delete'])

// Type-only emits (recommended)
const emit = defineEmits<{
  update: [id: string, value: number]  // Tuple = payload types
  delete: [id: string]
  change: []  // No payload
}>()

// Usage
function handleClick() {
  emit('update', 'abc-123', 42)
  emit('delete', 'abc-123')
  emit('change')
}
</script>
```

**v-model with Composition API:**
```vue
<!-- Child.vue -->
<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function updateValue(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <input :value="modelValue" @input="updateValue($event.target.value)" />
</template>

<!-- Parent.vue -->
<script setup lang="ts">
const text = ref('')
</script>

<template>
  <ChildComponent v-model="text" />
</template>
```

---

## Reactivity System

### How Vue's Reactivity Works

Vue 3 uses ES6 Proxies for its reactivity system.

**Under the Hood:**
```typescript
// Simplified reactivity
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key)  // Track dependency
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)  // Trigger effects
      return result
    }
  })
}

// When you access reactive property in effect
watchEffect(() => {
  console.log(state.count)  // Triggers proxy GET trap
  // Dependency is tracked: state.count -> this effect
})

// When you mutate reactive property
state.count++  // Triggers proxy SET trap
// All effects depending on state.count are re-run
```

**Reactivity Flow:**
```
Component Render / watchEffect
    ↓
Access Reactive Property (proxy GET)
    ↓
Track Dependency (property -> effect)
    ↓
Mutation (proxy SET)
    ↓
Trigger Effects
    ↓
Re-run Dependent Effects/Re-render
```

**Proxy vs Vue 2 Limitations:**
```typescript
// Vue 2 (Object.defineProperty) - couldn't detect
obj.newProperty = 'x'      // ❌ Not reactive
delete obj.property        // ❌ Not reactive
arr[index] = value        // ❌ Not reactive

// Vue 3 (Proxy) - detects everything
obj.newProperty = 'x'      // ✅ Reactive
delete obj.property        // ✅ Reactive
arr[index] = value        // ✅ Reactive
map.set(key, value)       // ✅ Reactive
set.add(value)            // ✅ Reactive
```

---

### Ref Unwrapping

Refs behave differently in templates vs script.

**In Script - Manual Unwrapping:**
```typescript
const count = ref(0)

// Must use .value
console.log(count.value)
count.value++

// Nested in reactive - auto unwrapped
const state = reactive({
  count: count
})
state.count++  // No .value needed
```

**In Template - Auto Unwrapping:**
```vue
<script setup>
const count = ref(0)
const state = reactive({
  count: count,
  nested: {
    value: ref(10)
  }
})
</script>

<template>
  <!-- Top-level refs auto-unwrapped -->
  <p>{{ count }}</p>  <!-- ✅ No .value needed -->

  <!-- Refs in reactive objects auto-unwrapped -->
  <p>{{ state.count }}</p>  <!-- ✅ No .value needed -->

  <!-- Nested refs require .value -->
  <p>{{ state.nested.value.value }}</p>  <!-- ⚠️ Need .value -->
</template>
```

**Unwrapping Rules:**
```typescript
// ✅ Auto-unwrapped in template (top-level)
const count = ref(0)
// {{ count }}

// ✅ Auto-unwrapped as reactive property
const state = reactive({ count: ref(0) })
// {{ state.count }}

// ❌ Not unwrapped in arrays
const arr = [ref(0), ref(1)]
// {{ arr[0].value }}

// ❌ Not unwrapped in plain objects (not reactive)
const obj = { count: ref(0) }
// {{ obj.count.value }}
```

---

### Shallow vs Deep Reactivity

Control reactivity depth for performance optimization.

**shallowRef - Only .value is Reactive:**
```typescript
import { shallowRef, triggerRef } from 'vue'

const state = shallowRef({
  count: 0,
  nested: { value: 42 }
})

// ✅ Triggers reactivity (replacing .value)
state.value = { count: 1, nested: { value: 100 } }

// ❌ Does NOT trigger reactivity (mutating nested property)
state.value.count++
state.value.nested.value++

// Manually trigger update
triggerRef(state)
```

**shallowReactive - Only Top-Level Properties Reactive:**
```typescript
import { shallowReactive } from 'vue'

const state = shallowReactive({
  count: 0,
  nested: { value: 42 }
})

// ✅ Triggers reactivity
state.count++

// ❌ Does NOT trigger reactivity
state.nested.value++

// To make nested reactive, replace entire object
state.nested = { value: 100 }  // ✅ Triggers reactivity
```

**When to Use Shallow Reactivity:**
- Large lists or trees (avoid deep traversal)
- Integration with immutable data structures
- Performance-critical components
- External state management (Pinia, Vuex)

---

### Performance Considerations

**Reactivity Overhead:**
```typescript
// ❌ Expensive - deeply reactive large object
const hugeData = reactive({
  items: Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    nested: { /* large object */ }
  }))
})

// ✅ Better - shallow reactive
const hugeData = shallowReactive({
  items: []  // Manually manage updates
})

// ✅ Or use shallowRef
const hugeData = shallowRef([])
```

**Computed Caching:**
```typescript
// ✅ Computed - cached, only runs when deps change
const filtered = computed(() => {
  return items.value.filter(expensiveFilter)
})

// ❌ Function - runs every render
function getFiltered() {
  return items.value.filter(expensiveFilter)
}
```

**Avoid Unnecessary Reactivity:**
```typescript
// ❌ Making static data reactive
const CONFIG = reactive({
  apiUrl: 'https://api.example.com',
  timeout: 5000
})

// ✅ Just use plain object
const CONFIG = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
}
```

---

## TypeScript Integration

### Typing Composables with Generics

**Generic Composable Pattern:**
```typescript
import { ref, type Ref } from 'vue'

export function useFetch<T>(url: string): {
  data: Ref<T | null>
  error: Ref<Error | null>
  loading: Ref<boolean>
} {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(true)

  fetch(url)
    .then(res => res.json())
    .then((json: T) => {
      data.value = json
    })
    .catch(e => {
      error.value = e
    })
    .finally(() => {
      loading.value = false
    })

  return { data, error, loading }
}

// Usage with type inference
interface User {
  name: string
  email: string
}

const { data, error, loading } = useFetch<User>('/api/user')
// data is Ref<User | null>
```

**Constraining Generic Types:**
```typescript
export function useResource<T extends { id: string }>(
  resource: T
) {
  // T must have an id property
  const id = resource.id

  return {
    id: ref(id),
    update: (newData: Partial<T>) => { /* ... */ }
  }
}
```

---

### MaybeRefOrGetter and Ref Types

**Core Ref Types:**
```typescript
import { type Ref, type ComputedRef, type MaybeRef, type MaybeRefOrGetter } from 'vue'

// Ref<T> - mutable ref
const count: Ref<number> = ref(0)

// ComputedRef<T> - read-only computed
const doubled: ComputedRef<number> = computed(() => count.value * 2)

// MaybeRef<T> - T or Ref<T>
type MaybeRef<T> = T | Ref<T>

function processValue(value: MaybeRef<number>) {
  const num = toValue(value)  // Normalize to number
}

// MaybeRefOrGetter<T> - T, Ref<T>, ComputedRef<T>, or () => T
type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)

function processFlexible(value: MaybeRefOrGetter<number>) {
  const num = toValue(value)  // Works with all forms
}
```

**Composable with MaybeRefOrGetter:**
```typescript
export interface UseDatasetOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
}

export function useDataset(options: UseDatasetOptions) {
  // toValue normalizes to plain value
  const id = computed(() => toValue(options.identifier))
  const isEnabled = computed(() => toValue(options.enabled) ?? true)

  return useQuery({
    queryKey: computed(() => ['dataset', id.value]),
    queryFn: () => client.getDataset(id.value),
    enabled: isEnabled
  })
}
```

---

### Defining Component Props

**Type-Only Props (Recommended):**
```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items?: string[]
  onUpdate?: (value: number) => void
}

const props = defineProps<Props>()

// Access props
console.log(props.title)
</script>
```

**With Defaults:**
```vue
<script setup lang="ts">
interface Props {
  title?: string
  count?: number
  items?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Default Title',
  count: 0,
  items: () => []  // Factory for objects/arrays
})
</script>
```

**Runtime Props with Validation:**
```vue
<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0,
    validator: (value: number) => value >= 0
  },
  status: {
    type: String as PropType<'draft' | 'published' | 'archived'>,
    default: 'draft'
  }
})
</script>
```

---

### Defining Component Emits

**Type-Only Emits (Recommended):**
```vue
<script setup lang="ts">
const emit = defineEmits<{
  // Event name: [payload types...]
  update: [id: string, value: number]
  delete: [id: string]
  change: []  // No payload
  submit: [data: FormData]
}>()

// Type-safe emit calls
emit('update', 'abc', 42)      // ✅
emit('update', 'abc', 'wrong') // ❌ TypeScript error
emit('delete', 'abc')          // ✅
emit('change')                 // ✅
</script>
```

**Runtime Emits with Validation:**
```vue
<script setup lang="ts">
const emit = defineEmits({
  update: (id: string, value: number) => {
    return typeof id === 'string' && typeof value === 'number'
  },
  delete: (id: string) => {
    return id.length > 0
  }
})
</script>
```

---

### Component Type Inference

**Getting Component Instance Type:**
```typescript
import MyComponent from './MyComponent.vue'

// Get instance type
type MyComponentInstance = InstanceType<typeof MyComponent>

// Use in refs
const compRef = ref<MyComponentInstance | null>(null)
```

**Generic Components:**
```vue
<!-- GenericList.vue -->
<script setup lang="ts" generic="T">
defineProps<{
  items: T[]
  keyExtractor: (item: T) => string
}>()
</script>

<template>
  <div v-for="item in items" :key="keyExtractor(item)">
    <slot :item="item" />
  </div>
</template>

<!-- Usage -->
<GenericList :items="datasets" :key-extractor="d => d.identifier">
  <template #default="{ item }">
    {{ item.title }}  <!-- item is correctly typed as Dataset -->
  </template>
</GenericList>
```

---

### Ref Type Narrowing

**Discriminated Unions:**
```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

const state = ref<AsyncState<Dataset>>({ status: 'idle' })

// TypeScript narrows type based on status
if (state.value.status === 'success') {
  console.log(state.value.data.title)  // ✅ data exists
}

if (state.value.status === 'error') {
  console.log(state.value.error.message)  // ✅ error exists
}
```

**Type Guards:**
```typescript
function isDataset(value: unknown): value is Dataset {
  return typeof value === 'object' && value !== null && 'identifier' in value
}

const data = ref<unknown>(null)

if (isDataset(data.value)) {
  console.log(data.value.identifier)  // ✅ Typed as Dataset
}
```

---

## Building Composables

### Composable Structure and Naming

**Best Practices:**
1. Prefix with `use` (e.g., `useDataset`, `useMouse`)
2. Return refs (not reactive objects) for destructuring
3. Accept `MaybeRefOrGetter<T>` for parameters
4. Handle cleanup with lifecycle hooks
5. Provide TypeScript interfaces for options

**Standard Structure:**
```typescript
import { ref, computed, onUnmounted, type MaybeRefOrGetter, toValue } from 'vue'

export interface UseFeatureOptions {
  param: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  onSuccess?: (data: any) => void
}

export function useFeature(options: UseFeatureOptions) {
  // Internal state
  const data = ref(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Computed from options
  const isEnabled = computed(() => toValue(options.enabled) ?? true)

  // Methods
  async function fetch() {
    if (!isEnabled.value) return

    loading.value = true
    try {
      const result = await api.fetch(toValue(options.param))
      data.value = result
      options.onSuccess?.(result)
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  // Lifecycle
  onUnmounted(() => {
    // Cleanup
  })

  // Return refs
  return {
    data,
    loading,
    error,
    fetch,
    refetch: fetch
  }
}
```

---

### Building Custom Composables

**Example from This Project:**
```typescript
import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue, computed } from 'vue'
import { useDkanClient } from './plugin'

export interface UseDatasetOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
  gcTime?: number
}

export function useDataset(options: UseDatasetOptions) {
  // Get dependency from context
  const client = useDkanClient()

  return useQuery({
    // Computed query key for reactivity
    queryKey: computed(() => ['dataset', toValue(options.identifier)]),

    // Query function
    queryFn: () => client.getDataset(toValue(options.identifier)),

    // Reactive enabled
    enabled: () => toValue(options.enabled) ?? true && !!toValue(options.identifier),

    // Cache configuration
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    gcTime: options.gcTime ?? 5 * 60 * 1000,
  })
}
```

---

### Using toValue() for Flexible Parameters

**Why toValue():**
- Normalizes `MaybeRefOrGetter<T>` to plain value
- Enables flexible composable APIs
- Automatic reactivity tracking in computed

**Pattern:**
```typescript
export function useFlexible(param: MaybeRefOrGetter<string>) {
  // ✅ Use in computed for reactivity
  const normalized = computed(() => toValue(param))

  // ✅ Use directly in functions
  function doSomething() {
    const value = toValue(param)
    console.log(value)
  }

  // ✅ Use in query functions
  return useQuery({
    queryKey: computed(() => ['key', toValue(param)]),
    queryFn: () => api.fetch(toValue(param))
  })
}
```

**All These Work:**
```typescript
// Plain value
useFlexible('value')

// Ref
const param = ref('value')
useFlexible(param)

// Computed
useFlexible(computed(() => `prefix-${id.value}`))

// Getter
useFlexible(() => route.params.id)
```

---

### Computed Query Keys for Reactivity

**Why Computed Query Keys:**
- Automatically reactive when dependencies change
- TanStack Query re-runs when key changes
- Clean declarative pattern

**Example:**
```typescript
export function useDatasetSearch(params: MaybeRefOrGetter<SearchParams>) {
  return useQuery({
    // Computed key - reactive to params changes
    queryKey: computed(() => ['search', toValue(params)]),
    queryFn: () => client.search(toValue(params)),
  })
}

// Usage - automatically refetches when searchTerm changes
const searchTerm = ref('')
const { data } = useDatasetSearch(computed(() => ({ keyword: searchTerm.value })))
```

---

### Return Value Patterns

**Object Return (Recommended):**
```typescript
export function useDataset(id: string) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  return {
    data,
    loading,
    error,
    refetch
  }
}

// Destructure what you need
const { data, loading } = useDataset('abc')
```

**Array Return (For Simple Cases):**
```typescript
export function useToggle(initial = false) {
  const value = ref(initial)
  const toggle = () => { value.value = !value.value }

  return [value, toggle] as const
}

// Custom names
const [isOpen, toggleOpen] = useToggle()
const [isVisible, toggleVisible] = useToggle()
```

---

### Composable Composition

**Composing Multiple Composables:**
```typescript
export function useDatasetWithDetails(id: MaybeRefOrGetter<string>) {
  // Compose multiple composables
  const { data: dataset, isLoading: datasetLoading } = useDataset({
    identifier: id
  })

  const { data: schema, isLoading: schemaLoading } = useSchema({
    schemaId: 'dataset'
  })

  // Derive combined state
  const isLoading = computed(() => datasetLoading.value || schemaLoading.value)

  const fullDetails = computed(() => {
    if (!dataset.value || !schema.value) return null
    return {
      ...dataset.value,
      schemaVersion: schema.value.version
    }
  })

  return {
    dataset,
    schema,
    fullDetails,
    isLoading
  }
}
```

---

## Provide/Inject Pattern

### InjectionKey Pattern with TypeScript

**Type-Safe Injection:**
```typescript
import { type InjectionKey } from 'vue'

// 1. Define service interface
interface DataService {
  getData: () => Promise<Data>
  updateData: (data: Data) => Promise<void>
}

// 2. Create typed injection key
export const DataServiceKey: InjectionKey<DataService> = Symbol('DataService')

// 3. Provide with type safety
const dataService: DataService = {
  getData: async () => { /* ... */ },
  updateData: async (data) => { /* ... */ }
}
provide(DataServiceKey, dataService)

// 4. Inject with type safety
const service = inject(DataServiceKey)
if (!service) {
  throw new Error('DataService not provided')
}
// service is typed as DataService
```

---

### Creating Vue Plugins

**Plugin Pattern (from this project):**
```typescript
import { type App, type Plugin, type InjectionKey } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { DkanClient, type DkanClientOptions } from '@dkan-client-tools/core'

export const DkanClientKey: InjectionKey<DkanClient> = Symbol('DkanClient')

export interface DkanClientPluginOptions {
  clientOptions?: Omit<DkanClientOptions, 'queryClient'>
  client?: DkanClient
}

export const DkanClientPlugin: Plugin<DkanClientPluginOptions> = {
  install(app: App, options: DkanClientPluginOptions) {
    // Create client
    const queryClient = new QueryClient()
    const client = new DkanClient({
      ...options.clientOptions,
      queryClient
    })

    // Install dependencies
    app.use(VueQueryPlugin, { queryClient })

    // Provide client
    app.provide(DkanClientKey, client)
  }
}
```

**Using the Plugin:**
```typescript
// main.ts
import { createApp } from 'vue'
import { DkanClientPlugin } from '@dkan-client-tools/vue'
import App from './App.vue'

const app = createApp(App)

app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: 'https://dkan.example.com'
  }
})

app.mount('#app')
```

---

### Providing Values in Plugins

**Multiple Provides:**
```typescript
export const MyPlugin: Plugin = {
  install(app: App, options: MyOptions) {
    // Provide multiple services
    app.provide(ConfigKey, options.config)
    app.provide(ApiClientKey, new ApiClient(options))
    app.provide(CacheKey, new Cache())

    // Add global properties
    app.config.globalProperties.$myPlugin = {
      version: '1.0.0'
    }
  }
}
```

---

### Consuming with Inject and Composables

**Composable Wrapper Pattern:**
```typescript
export function useDkanClient(): DkanClient {
  const client = inject(DkanClientKey)

  if (!client) {
    throw new Error(
      'useDkanClient must be used in a Vue app with DkanClientPlugin installed. ' +
      'Add app.use(DkanClientPlugin, { ... }) in your main.ts'
    )
  }

  return client
}

// Usage in components
const client = useDkanClient()
```

---

### Error Handling for Missing Providers

**Clear Error Messages:**
```typescript
export function useRequiredService(): MyService {
  const service = inject(ServiceKey)

  if (!service) {
    throw new Error(
      'MyService is not provided. ' +
      'Make sure to install the plugin:\n' +
      'app.use(MyPlugin, { ... })'
    )
  }

  return service
}
```

**Optional with Fallback:**
```typescript
export function useOptionalService(): MyService {
  const service = inject(ServiceKey, null)

  if (!service && import.meta.env.DEV) {
    console.warn('MyService not provided - using default implementation')
  }

  return service ?? createDefaultService()
}
```

---

## Integration with TanStack Query

This project uses TanStack Vue Query for data fetching and caching.

### How useQuery and useMutation Work in Vue

**useQuery Pattern:**
```typescript
import { useQuery } from '@tanstack/vue-query'
import { ref } from 'vue'

const id = ref('abc-123')

const { data, isPending, isError, error, refetch } = useQuery({
  queryKey: computed(() => ['dataset', id.value]),
  queryFn: () => fetchDataset(id.value),
  staleTime: 5 * 60 * 1000,
  enabled: computed(() => id.value !== '')
})

// All return values are refs
console.log(data.value)      // Ref<Dataset | undefined>
console.log(isPending.value) // Ref<boolean>
```

**useMutation Pattern:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: (newDataset: Dataset) => createDataset(newDataset),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['datasets'] })
  }
})

// Trigger mutation
function handleSubmit(dataset: Dataset) {
  mutation.mutate(dataset)
}

// All mutation state is refs
console.log(mutation.isPending.value)
console.log(mutation.isError.value)
console.log(mutation.data.value)
```

---

### Combining Custom Composables with Vue Query

**Pattern from This Project:**
```typescript
import { useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue, computed } from 'vue'
import { useDkanClient } from './plugin'

export function useDatastore(options: UseDatastoreOptions) {
  // 1. Get client from provide/inject
  const client = useDkanClient()

  // 2. Use TanStack Vue Query
  return useQuery({
    // Computed for reactivity
    queryKey: computed(() => [
      'datastore',
      toValue(options.datasetId),
      toValue(options.index)
    ]),

    queryFn: () => client.queryDatastore({
      datasetId: toValue(options.datasetId),
      index: toValue(options.index),
      conditions: toValue(options.conditions)
    }),

    enabled: () => {
      const enabled = toValue(options.enabled) ?? true
      const hasId = !!toValue(options.datasetId)
      return enabled && hasId
    },

    staleTime: options.staleTime ?? 5 * 60 * 1000
  })
}
```

---

### Plugin Setup

**VueQueryPlugin Integration:**
```typescript
import { type App, type Plugin } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'

export const DkanClientPlugin: Plugin = {
  install(app: App, options) {
    // 1. Create QueryClient
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
          retry: 1
        }
      }
    })

    // 2. Install VueQueryPlugin
    app.use(VueQueryPlugin, { queryClient })

    // 3. Create DkanClient with same QueryClient
    const client = new DkanClient({
      ...options.clientOptions,
      queryClient
    })

    // 4. Provide client
    app.provide(DkanClientKey, client)
  }
}
```

---

### Reactive Query Keys with computed()

**Why Computed Query Keys:**
- Automatic re-fetch when dependencies change
- Clean declarative syntax
- Full reactivity support

**Example:**
```typescript
const searchKeyword = ref('')
const page = ref(1)

const { data } = useQuery({
  // Query key recomputes when searchKeyword or page changes
  queryKey: computed(() => ['search', {
    keyword: searchKeyword.value,
    page: page.value
  }]),
  queryFn: () => searchDatasets({
    keyword: searchKeyword.value,
    page: page.value
  })
})

// Changing searchKeyword or page triggers automatic refetch
searchKeyword.value = 'health'  // Refetches
page.value = 2                  // Refetches
```

---

### MaybeRefOrGetter for Reactive Parameters

**Flexible Composable API:**
```typescript
export interface UseDatasetOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
}

export function useDataset(options: UseDatasetOptions) {
  return useQuery({
    queryKey: computed(() => ['dataset', toValue(options.identifier)]),
    queryFn: () => client.getDataset(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) ?? true
  })
}

// All of these work and are reactive:
useDataset({ identifier: 'abc-123' })                    // Plain
useDataset({ identifier: ref('abc-123') })               // Ref
useDataset({ identifier: computed(() => route.params.id) })  // Computed
useDataset({ identifier: () => route.params.id })        // Getter
```

---

## Testing Composables

### Testing with Vue Test Utils

**Basic Composable Test:**
```typescript
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect } from 'vitest'

// Test component that uses composable
const TestComponent = {
  setup() {
    const count = ref(0)
    const increment = () => count.value++
    return { count, increment }
  },
  template: '<button @click="increment">{{ count }}</button>'
}

describe('useCounter', () => {
  it('increments count', async () => {
    const wrapper = mount(TestComponent)

    expect(wrapper.text()).toBe('0')

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toBe('1')
  })
})
```

---

### mount() and Wrapper API

**Testing Composable in Component:**
```typescript
import { mount } from '@vue/test-utils'
import { useDataset } from './useDataset'

const TestComponent = {
  props: ['id'],
  setup(props) {
    const { data, isLoading } = useDataset({
      identifier: () => props.id
    })
    return { data, isLoading }
  },
  template: `
    <div>
      <div v-if="isLoading">Loading...</div>
      <div v-else>{{ data?.title }}</div>
    </div>
  `
}

it('displays dataset title', async () => {
  const wrapper = mount(TestComponent, {
    props: { id: 'abc-123' }
  })

  // Initially loading
  expect(wrapper.text()).toContain('Loading')

  // Wait for data
  await wrapper.vm.$nextTick()
  await new Promise(resolve => setTimeout(resolve, 100))

  expect(wrapper.text()).toContain('Test Dataset')
})
```

---

### Testing with Provide/Inject

**Providing Test Values:**
```typescript
import { mount } from '@vue/test-utils'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientKey } from './plugin'

it('useDkanClient returns client from context', () => {
  const mockClient = new DkanClient({
    baseUrl: 'https://test.example.com',
    defaultOptions: { retry: 0 }
  })

  const wrapper = mount(TestComponent, {
    global: {
      provide: {
        [DkanClientKey as symbol]: mockClient
      }
    }
  })

  // Component can access client via useDkanClient()
})
```

---

### Mocking and Spying

**Spying on Client Methods:**
```typescript
import { vi } from 'vitest'
import { DkanClient } from '@dkan-client-tools/core'

it('calls getDataset method', async () => {
  const mockClient = new DkanClient({
    baseUrl: 'https://test.example.com',
    defaultOptions: { retry: 0 }
  })

  const spy = vi.spyOn(mockClient, 'getDataset')
    .mockResolvedValue({
      identifier: 'abc-123',
      title: 'Test Dataset'
    })

  const wrapper = mount(TestComponent, {
    global: {
      provide: { [DkanClientKey as symbol]: mockClient }
    }
  })

  await wrapper.vm.$nextTick()

  expect(spy).toHaveBeenCalledWith('abc-123')
})
```

---

### Testing Reactive Behavior

**Testing Reactivity:**
```typescript
it('refetches when id changes', async () => {
  const mockClient = new DkanClient({
    baseUrl: 'https://test.example.com',
    defaultOptions: { retry: 0 }
  })

  const spy = vi.spyOn(mockClient, 'getDataset')
    .mockResolvedValue({ identifier: 'abc-123', title: 'Dataset 1' })

  const wrapper = mount(TestComponent, {
    props: { id: 'abc-123' },
    global: {
      provide: { [DkanClientKey as symbol]: mockClient }
    }
  })

  expect(spy).toHaveBeenCalledWith('abc-123')

  // Change prop - should trigger refetch
  await wrapper.setProps({ id: 'xyz-789' })

  expect(spy).toHaveBeenCalledWith('xyz-789')
  expect(spy).toHaveBeenCalledTimes(2)
})
```

---

## Best Practices

### When to Use ref() vs reactive()

**Use ref() when:**
- Working with primitives (numbers, strings, booleans)
- You might reassign the entire value
- You need to pass reactivity around (return from composables)
- Integrating with TanStack Query (returns refs)

**Use reactive() when:**
- Working with objects with multiple properties
- You want clean property access (no `.value`)
- Building local component state
- Properties won't be replaced entirely

**Comparison:**
```typescript
// ✅ ref - for primitives
const count = ref(0)
const message = ref('Hello')

// ✅ reactive - for multi-property objects
const form = reactive({
  name: '',
  email: '',
  age: 0
})

// ❌ reactive - loses reactivity when destructured
const { name, email } = form  // Not reactive!

// ✅ ref - maintains reactivity
const name = ref('')
const email = ref('')
const { name, email } = { name, email }  // Still reactive
```

**Project Convention:**
This project uses `ref()` for consistency with TanStack Vue Query.

---

### Composable Naming Conventions

**Rules:**
1. **Always prefix with `use`**: `useDataset`, `useMouse`, `useAuth`
2. **Descriptive names**: `useDatasetSearch` not `useSearch`
3. **Noun-based**: `useDataset` not `getDataset`
4. **Singular for single items**: `useDataset` not `useDatasets`
5. **Plural for lists**: `useDatasets` for fetching multiple

**Examples:**
```typescript
// ✅ Good names
useDataset()
useDatasetSearch()
useDkanClient()
useLocalStorage()
useMouse()

// ❌ Bad names
getDataset()     // Not a composable (no 'use')
dataset()        // Missing 'use'
useGet()         // Not descriptive
```

---

### Avoiding Common Pitfalls

**1. Forgetting .value in script:**
```typescript
// ❌ Bad
const count = ref(0)
console.log(count)     // Ref object, not value
count++                // Error!

// ✅ Good
console.log(count.value)
count.value++
```

**2. Destructuring reactive objects:**
```typescript
// ❌ Bad - loses reactivity
const state = reactive({ count: 0 })
const { count } = state
count++  // Doesn't update state!

// ✅ Good - use toRefs
const { count } = toRefs(state)
count.value++  // Updates state
```

**3. Reassigning reactive objects:**
```typescript
// ❌ Bad - breaks reactivity
let state = reactive({ count: 0 })
state = reactive({ count: 1 })  // New reference!

// ✅ Good - use ref for reassignment
const state = ref({ count: 0 })
state.value = { count: 1 }  // Maintains reactivity
```

**4. Not using computed for derived state:**
```typescript
// ❌ Bad - doesn't update
const count = ref(10)
const doubled = count.value * 2  // Static value!

// ✅ Good - reactive
const doubled = computed(() => count.value * 2)
```

**5. Mutating props:**
```typescript
// ❌ Bad
const props = defineProps<{ count: number }>()
props.count++  // Error! Props are readonly

// ✅ Good - emit update
const emit = defineEmits<{ 'update:count': [value: number] }>()
emit('update:count', props.count + 1)
```

---

### Performance Optimization

**Shallow Reactivity for Large Data:**
```typescript
// ❌ Slow - deep reactivity for large array
const items = reactive(Array.from({ length: 10000 }, (_, i) => ({ id: i })))

// ✅ Fast - shallow reactivity
const items = shallowRef([])
```

**Computed for Expensive Calculations:**
```typescript
// ❌ Bad - recalculates every render
function getFiltered() {
  return items.value.filter(expensiveFilter)
}

// ✅ Good - cached
const filtered = computed(() => items.value.filter(expensiveFilter))
```

**Avoid Unnecessary Watches:**
```typescript
// ❌ Bad - watch for everything
watchEffect(() => {
  console.log(a.value, b.value, c.value)
})

// ✅ Good - only watch what matters
watch(a, () => {
  console.log('Only when a changes')
})
```

---

### TypeScript Best Practices

**Generic Composables:**
```typescript
export function useAsync<T>(fn: () => Promise<T>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    try {
      data.value = await fn()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}
```

**Discriminated Unions:**
```typescript
type State<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

const state = ref<State<Dataset>>({ status: 'idle' })

if (state.value.status === 'success') {
  console.log(state.value.data.title)  // Type-safe!
}
```

---

### Destructuring Reactive Objects

**The Problem:**
```typescript
const state = reactive({
  count: 0,
  message: 'Hello'
})

// ❌ Loses reactivity
const { count, message } = state
count++  // Doesn't update state!
```

**Solutions:**
```typescript
// ✅ Solution 1: Use toRefs
const { count, message } = toRefs(state)
count.value++  // Updates state

// ✅ Solution 2: Use toRef for single property
const count = toRef(state, 'count')
count.value++  // Updates state

// ✅ Solution 3: Access via state
state.count++  // No destructuring

// ✅ Solution 4: Use ref() instead of reactive()
const count = ref(0)
const message = ref('Hello')
const { count, message } = { count, message }  // Refs maintain reactivity
```

---

### Vue ↔ React Migration Guide

For developers switching between Vue and React, or maintaining projects in both frameworks. See [React Hooks](./REACT_HOOKS.md) for detailed React patterns.

**State Management**:

| Vue | React | Notes |
|-----|-------|-------|
| `ref(value)` | `useState(value)` | Vue: returns ref object, access via `.value`<br>React: returns `[state, setState]` |
| `reactive({ ... })` | `useState({ ... })` | Vue: properties individually reactive<br>React: state setter replaces entire object |
| `const x = ref(0)` | `const [x, setX] = useState(0)` | Vue: `x.value = 1`<br>React: `setX(1)` |

**Derived State**:

| Vue | React | Notes |
|-----|-------|-------|
| `computed(() => fn)` | `useMemo(() => fn, deps)` | Vue: automatic dependency tracking<br>React: manual dependency tracking |
| `const double = computed(() => count.value * 2)` | `const double = useMemo(() => count * 2, [count])` | Vue auto-tracks `count` dependency |

**Side Effects**:

| Vue | React | Notes |
|-----|-------|-------|
| `watch(source, fn)` | `useEffect(fn, deps)` | Vue: runs when source changes<br>React: runs after render |
| `onMounted(fn)` | `useEffect(fn, [])` | Vue: explicit mount hook<br>React: mount only via empty deps |
| `onUnmounted(cleanup)` | `useEffect(() => { return cleanup }, deps)` | Vue: separate unmount hook<br>React: return cleanup function |
| `watchEffect(fn)` | `useEffect(fn)` (no deps) | Vue: tracks dependencies automatically<br>React: every render |

**Refs (DOM Access)**:

| Vue | React | Notes |
|-----|-------|-------|
| `ref(null)` | `useRef(null)` | Same concept, different usage |
| `<div ref="myRef">` | `<div ref={myRef}>` | Vue: string name<br>React: assign ref object |
| `myRef.value` | `myRef.current` | Vue: `.value`<br>React: `.current` |

**Stable References**:

| Vue | React | Notes |
|-----|-------|-------|
| Not needed | `useCallback(fn, deps)` | Vue functions are stable by default |
| `computed(() => ({ ... }))` | `useMemo(() => ({ ... }), deps)` | Vue computed values are cached |

**Context / Dependency Injection**:

| Vue | React | Notes |
|-----|-------|-------|
| `Symbol('key')` | `createContext(default)` | Vue: injection key<br>React: context object |
| `provide(key, val)` | `<Context.Provider value={val}>` | Vue: provide function<br>React: JSX provider |
| `inject(key)` | `useContext(Context)` | Vue: inject function<br>React: hook to read context |

**Lifecycle Hooks**:

| Vue | React | Notes |
|-----|-------|-------|
| `onMounted(fn)` | `useEffect(fn, [])` | Component mounted |
| `onUpdated(fn)` | `useEffect(fn)` | After every render/update |
| `onUnmounted(fn)` | `useEffect(() => cleanup, [])` | Component unmounting |
| `onBeforeMount(fn)` | N/A | Before mounting (Vue only) |
| `onBeforeUpdate(fn)` | N/A | Before updates (Vue only) |

**Component Definition**:

| Vue | React | Notes |
|-----|-------|-------|
| `<script setup>` | `function Component(props)` | Vue: script setup syntax<br>React: function component |
| `defineProps<{ value: T }>()` | `props.value` | Vue: compiler macro<br>React: direct access |
| `const emit = defineEmits<{ event: [] }>()` | `const emit = props.onEvent` | Vue: emit system<br>React: props are callbacks |

**TanStack Query Integration**:

| Vue | React | Notes |
|-----|-------|-------|
| `useQuery({ queryKey, queryFn })` | `useQuery({ queryKey, queryFn })` | Same API across frameworks |
| `queryKey: computed(() => ['item', toValue(id)])` | `queryKey: ['item', id]` | Vue: reactive with computed<br>React: static dependencies |
| `enabled: () => !!toValue(id)` | `enabled: !!id` | Vue: getter function<br>React: boolean |

**Custom Hooks/Composables**:

**Vue Composable**:
```typescript
function useCounter(initial = 0) {
  const count = ref(initial)
  const increment = () => count.value++
  const decrement = () => count.value--

  return { count, increment, decrement }
}

// Usage
const { count, increment } = useCounter(0)
```

**React Hook**:
```typescript
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)
  const increment = useCallback(() => setCount(c => c + 1), [])
  const decrement = useCallback(() => setCount(c => c - 1), [])

  return { count, increment, decrement }
}

// Usage
const { count, increment } = useCounter(0)
```

**Key Differences**:

1. **Reactivity**:
   - Vue: Mutable updates via `.value`, proxy-based reactivity
   - React: Immutable updates, new references trigger re-renders

2. **Dependency Tracking**:
   - Vue: Automatic dependency tracking (computed, watch)
   - React: Manual dependency arrays (`useEffect`, `useMemo`, `useCallback`)

3. **Function Stability**:
   - Vue: Functions are stable by default
   - React: Functions recreated every render unless `useCallback`

4. **Ref Access**:
   - Vue: `ref.value` (reactive refs AND DOM refs)
   - React: `ref.current` (DOM refs)

5. **TypeScript**:
   - Vue: `<script setup lang="ts" generic="T">`
   - React: Generic components via `<T,>` syntax

**Migration Tips**:

- **Vue → React**: Add dependency arrays, use state setters instead of `.value`, wrap functions in `useCallback`
- **React → Vue**: Remove dependency arrays, use `.value` for refs, replace `useMemo` with `computed`
- **Both**: TanStack Query patterns translate directly with minor syntax differences

---

## Real-World Usage Examples

Complete, production-ready Vue components demonstrating common DKAN workflows.

### Dataset Catalog with Search and Pagination

Complete component with reactive search, filtering, pagination, and route integration:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDatasetSearch } from '@dkan-client-tools/vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Reactive state from route query params
const page = ref(Number(route.query.page) || 1)
const keyword = ref((route.query.keyword as string) || '')
const theme = ref((route.query.theme as string) || '')
const pageSize = 20

// Dataset search query
const { data, isLoading, isError, error } = useDatasetSearch({
  fulltext: computed(() => keyword.value || undefined),
  theme: computed(() => theme.value || undefined),
  page,
  pageSize,
  staleTime: 5 * 60 * 1000, // 5 minutes
})

// Computed total pages
const totalPages = computed(() =>
  Math.ceil((data.value?.total || 0) / pageSize)
)

// Handle search form submission
const handleSearch = () => {
  page.value = 1 // Reset to page 1
  updateRoute()
}

// Update URL query params
const updateRoute = () => {
  router.push({
    query: {
      ...(keyword.value && { keyword: keyword.value }),
      ...(theme.value && { theme: theme.value }),
      ...(page.value > 1 && { page: page.value.toString() }),
    },
  })
}

// Navigate to previous page
const prevPage = () => {
  if (page.value > 1) {
    page.value--
    updateRoute()
  }
}

// Navigate to next page
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    updateRoute()
  }
}
</script>

<template>
  <div class="dataset-catalog">
    <h1>Dataset Catalog</h1>

    <!-- Search Form -->
    <form @submit.prevent="handleSearch" class="search-form">
      <input
        v-model="keyword"
        type="text"
        placeholder="Search datasets..."
        class="search-input"
      />
      <select v-model="theme" class="theme-select">
        <option value="">All Themes</option>
        <option value="environment">Environment</option>
        <option value="health">Health</option>
        <option value="education">Education</option>
        <option value="transportation">Transportation</option>
      </select>
      <button type="submit">Search</button>
    </form>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading">Loading datasets...</div>

    <!-- Error State -->
    <div v-else-if="isError" class="error">
      Error loading datasets: {{ error?.message }}
    </div>

    <!-- Results -->
    <template v-else>
      <!-- Results Count -->
      <div class="results-info">
        Found {{ data?.total || 0 }} datasets
        <span v-if="keyword"> matching "{{ keyword }}"</span>
      </div>

      <!-- Dataset List -->
      <div class="dataset-list">
        <div
          v-for="dataset in data?.results"
          :key="dataset.identifier"
          class="dataset-card"
        >
          <h3>{{ dataset.title }}</h3>
          <p>{{ dataset.description }}</p>
          <div class="dataset-meta">
            <span>Publisher: {{ dataset.publisher?.name }}</span>
            <span>Modified: {{ dataset.modified }}</span>
          </div>
          <div class="dataset-themes">
            <span
              v-for="t in dataset.theme"
              :key="t"
              class="theme-badge"
            >
              {{ t }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="prevPage"
          :disabled="page === 1"
        >
          Previous
        </button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button
          @click="nextPage"
          :disabled="page === totalPages"
        >
          Next
        </button>
      </div>
    </template>
  </div>
</template>
```

---

### Dataset Details with Datastore Preview

Component showing dataset metadata and data preview with tabs:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDataset, useDatastore } from '@dkan-client-tools/vue'

const route = useRoute()
const datasetId = computed(() => route.params.id as string)
const selectedDistribution = ref(0)

// Fetch dataset metadata
const {
  data: dataset,
  isLoading: isLoadingDataset,
  isError: isDatasetError,
  error: datasetError,
} = useDataset({
  identifier: datasetId,
  enabled: computed(() => !!datasetId.value),
  staleTime: 10 * 60 * 1000,
})

// Fetch datastore preview (first 10 rows)
const {
  data: datastoreData,
  isLoading: isLoadingData,
  isError: isDataError,
  error: dataError,
} = useDatastore({
  datasetId,
  index: computed(() => selectedDistribution.value),
  options: { limit: 10, offset: 0 },
  enabled: computed(() =>
    !!(
      datasetId.value &&
      dataset.value?.distribution?.[selectedDistribution.value]
    )
  ),
  staleTime: 5 * 60 * 1000,
})

// Get current distribution
const currentDistribution = computed(() =>
  dataset.value?.distribution?.[selectedDistribution.value]
)
</script>

<template>
  <div class="dataset-details">
    <!-- Loading State -->
    <div v-if="isLoadingDataset" class="loading">
      Loading dataset...
    </div>

    <!-- Error State -->
    <div v-else-if="isDatasetError" class="error">
      Error: {{ datasetError?.message }}
    </div>

    <!-- Not Found -->
    <div v-else-if="!dataset" class="not-found">
      Dataset not found
    </div>

    <!-- Dataset Content -->
    <template v-else>
      <!-- Metadata Section -->
      <section class="metadata">
        <h1>{{ dataset.title }}</h1>
        <p>{{ dataset.description }}</p>

        <div class="meta-grid">
          <div class="meta-item">
            <strong>Publisher:</strong>
            <span>{{ dataset.publisher?.name }}</span>
          </div>
          <div class="meta-item">
            <strong>Contact:</strong>
            <span>{{ dataset.contactPoint?.fn }}</span>
          </div>
          <div class="meta-item">
            <strong>Modified:</strong>
            <span>{{ dataset.modified }}</span>
          </div>
          <div class="meta-item">
            <strong>Access Level:</strong>
            <span>{{ dataset.accessLevel }}</span>
          </div>
        </div>

        <div v-if="dataset.keyword?.length" class="keywords">
          <strong>Keywords:</strong>
          <span
            v-for="kw in dataset.keyword"
            :key="kw"
            class="keyword-badge"
          >
            {{ kw }}
          </span>
        </div>
      </section>

      <!-- Distributions Section -->
      <section class="distributions">
        <h2>Data Distributions</h2>

        <template v-if="dataset.distribution?.length">
          <!-- Distribution Tabs -->
          <div class="distribution-tabs">
            <button
              v-for="(dist, index) in dataset.distribution"
              :key="dist.identifier || index"
              @click="selectedDistribution = index"
              :class="{ active: index === selectedDistribution }"
            >
              {{ dist.title || `Distribution ${index + 1}` }}
              <span v-if="dist.format">({{ dist.format }})</span>
            </button>
          </div>

          <!-- Data Preview -->
          <div class="data-preview">
            <h3>Data Preview (First 10 Rows)</h3>

            <div v-if="isLoadingData">Loading data...</div>

            <div v-else-if="isDataError" class="error">
              Error loading data: {{ dataError?.message }}
            </div>

            <div v-else-if="datastoreData" class="table-container">
              <table>
                <thead>
                  <tr>
                    <th
                      v-for="field in datastoreData.schema?.fields"
                      :key="field.name"
                    >
                      {{ field.name }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in datastoreData.results"
                    :key="index"
                  >
                    <td
                      v-for="field in datastoreData.schema?.fields"
                      :key="field.name"
                    >
                      {{ row[field.name]?.toString() }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="row-count">
                Showing {{ datastoreData.results?.length || 0 }} of
                {{ datastoreData.count || 0 }} total rows
              </div>
            </div>

            <!-- Download Link -->
            <a
              v-if="currentDistribution"
              :href="currentDistribution.downloadURL"
              download
              class="download-button"
            >
              Download Full Dataset
            </a>
          </div>
        </template>

        <p v-else>No distributions available for this dataset.</p>
      </section>
    </template>
  </div>
</template>
```

---

### Dataset CRUD Operations

#### Create Dataset Form

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateDataset } from '@dkan-client-tools/vue'

const router = useRouter()

// Form state
const formData = reactive({
  title: '',
  description: '',
  contactName: '',
  contactEmail: '',
  publisherName: '',
  keywords: '',
  theme: [] as string[],
})

// Theme options
const themeOptions = ['environment', 'health', 'education', 'transportation']

// Create dataset mutation
const createDataset = useCreateDataset({
  onSuccess: (data) => {
    alert(`Dataset created: ${data.identifier}`)
    router.push(`/datasets/${data.identifier}`)
  },
  onError: (error) => {
    alert(`Error: ${error.message}`)
  },
})

// Toggle theme selection
const toggleTheme = (theme: string) => {
  const index = formData.theme.indexOf(theme)
  if (index > -1) {
    formData.theme.splice(index, 1)
  } else {
    formData.theme.push(theme)
  }
}

// Handle form submission
const handleSubmit = () => {
  // Validate form
  if (!formData.title || formData.title.length < 3) {
    alert('Title must be at least 3 characters')
    return
  }

  // Build dataset object
  const dataset = {
    title: formData.title,
    description: formData.description,
    contactPoint: {
      fn: formData.contactName,
      hasEmail: formData.contactEmail,
    },
    publisher: {
      name: formData.publisherName,
    },
    accessLevel: 'public' as const,
    modified: new Date().toISOString().split('T')[0],
    keyword: formData.keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean),
    theme: formData.theme,
  }

  createDataset.mutate(dataset)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="create-dataset-form">
    <h1>Create New Dataset</h1>

    <div class="form-group">
      <label for="title">Title *</label>
      <input
        id="title"
        v-model="formData.title"
        type="text"
        required
        minlength="3"
      />
    </div>

    <div class="form-group">
      <label for="description">Description *</label>
      <textarea
        id="description"
        v-model="formData.description"
        required
        rows="5"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="contactName">Contact Name *</label>
        <input
          id="contactName"
          v-model="formData.contactName"
          type="text"
          required
        />
      </div>

      <div class="form-group">
        <label for="contactEmail">Contact Email *</label>
        <input
          id="contactEmail"
          v-model="formData.contactEmail"
          type="email"
          required
        />
      </div>
    </div>

    <div class="form-group">
      <label for="publisherName">Publisher Name *</label>
      <input
        id="publisherName"
        v-model="formData.publisherName"
        type="text"
        required
      />
    </div>

    <div class="form-group">
      <label for="keywords">Keywords (comma-separated)</label>
      <input
        id="keywords"
        v-model="formData.keywords"
        type="text"
        placeholder="climate, temperature, environment"
      />
    </div>

    <div class="form-group">
      <label>Themes</label>
      <div class="checkbox-group">
        <label
          v-for="themeOption in themeOptions"
          :key="themeOption"
          class="checkbox-label"
        >
          <input
            type="checkbox"
            :checked="formData.theme.includes(themeOption)"
            @change="toggleTheme(themeOption)"
          />
          {{ themeOption }}
        </label>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        :disabled="createDataset.isPending.value"
        class="submit-button"
      >
        {{ createDataset.isPending.value ? 'Creating...' : 'Create Dataset' }}
      </button>
      <button
        type="button"
        @click="router.push('/datasets')"
        class="cancel-button"
      >
        Cancel
      </button>
    </div>

    <div v-if="createDataset.isError.value" class="error-message">
      Error: {{ createDataset.error.value?.message }}
    </div>
  </form>
</template>
```

#### Edit Dataset Component

```vue
<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useDataset, useUpdateDataset } from '@dkan-client-tools/vue'

const route = useRoute()
const router = useRouter()
const datasetId = computed(() => route.params.id as string)
const isDirty = ref(false)

// Fetch dataset
const { data: dataset, isLoading } = useDataset({
  identifier: datasetId,
  enabled: computed(() => !!datasetId.value),
})

// Form state
const formData = ref({
  title: '',
  description: '',
  keywords: '',
})

// Populate form when dataset loads
watch(dataset, (newDataset) => {
  if (newDataset) {
    formData.value = {
      title: newDataset.title || '',
      description: newDataset.description || '',
      keywords: newDataset.keyword?.join(', ') || '',
    }
  }
}, { immediate: true })

// Update dataset mutation
const updateDataset = useUpdateDataset({
  onSuccess: () => {
    alert('Dataset updated successfully')
    isDirty.value = false
    router.push(`/datasets/${datasetId.value}`)
  },
  onError: (error) => {
    alert(`Error updating dataset: ${error.message}`)
  },
})

// Handle form submission
const handleSubmit = () => {
  if (!datasetId.value) return

  const updates = {
    title: formData.value.title,
    description: formData.value.description,
    keyword: formData.value.keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean),
    modified: new Date().toISOString().split('T')[0],
  }

  updateDataset.mutate({ identifier: datasetId.value, data: updates })
}

// Warn before leaving if form is dirty
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

// Add event listener
window.addEventListener('beforeunload', handleBeforeUnload)

// Clean up
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// Router guard for navigation
onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value && !confirm('Discard unsaved changes?')) {
    next(false)
  } else {
    next()
  }
})
</script>

<template>
  <div v-if="isLoading" class="loading">Loading dataset...</div>

  <div v-else-if="!dataset" class="error">Dataset not found</div>

  <form
    v-else
    @submit.prevent="handleSubmit"
    @input="isDirty = true"
    class="edit-dataset-form"
  >
    <h1>Edit Dataset</h1>

    <div class="form-group">
      <label for="title">Title</label>
      <input
        id="title"
        v-model="formData.title"
        type="text"
        required
      />
    </div>

    <div class="form-group">
      <label for="description">Description</label>
      <textarea
        id="description"
        v-model="formData.description"
        rows="5"
      />
    </div>

    <div class="form-group">
      <label for="keywords">Keywords</label>
      <input
        id="keywords"
        v-model="formData.keywords"
        type="text"
      />
    </div>

    <div class="form-actions">
      <button
        type="submit"
        :disabled="updateDataset.isPending.value || !isDirty"
        class="submit-button"
      >
        {{ updateDataset.isPending.value ? 'Saving...' : 'Save Changes' }}
      </button>
      <button
        type="button"
        @click="router.push(`/datasets/${datasetId}`)"
        class="cancel-button"
      >
        Cancel
      </button>
    </div>

    <div v-if="isDirty" class="info-message">
      You have unsaved changes
    </div>
  </form>
</template>
```

---

### Workflow State Management

Component for changing dataset moderation state:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useDataset, useChangeDatasetState } from '@dkan-client-tools/vue'

const props = defineProps<{
  datasetId: string
}>()

// Fetch dataset
const { data: dataset } = useDataset({
  identifier: computed(() => props.datasetId),
  enabled: computed(() => !!props.datasetId),
})

// Change state mutation
const changeState = useChangeDatasetState({
  onSuccess: (_, variables) => {
    alert(`Dataset state changed to: ${variables.state}`)
  },
  onError: (error) => {
    alert(`Error: ${error.message}`)
  },
})

// Handle state change
const handleStateChange = (newState: 'draft' | 'published' | 'archived') => {
  if (!confirm(`Change state to "${newState}"?`)) {
    return
  }

  changeState.mutate({
    identifier: props.datasetId,
    state: newState,
  })
}
</script>

<template>
  <div v-if="dataset" class="workflow-manager">
    <h3>Moderation State</h3>

    <div class="current-state">
      Current State: <strong>{{ dataset.moderationState || 'draft' }}</strong>
    </div>

    <div class="state-actions">
      <button
        @click="handleStateChange('draft')"
        :disabled="changeState.isPending.value"
        class="state-button draft"
      >
        Set to Draft
      </button>
      <button
        @click="handleStateChange('published')"
        :disabled="changeState.isPending.value"
        class="state-button published"
      >
        Publish
      </button>
      <button
        @click="handleStateChange('archived')"
        :disabled="changeState.isPending.value"
        class="state-button archived"
      >
        Archive
      </button>
    </div>

    <div v-if="changeState.isPending.value" class="loading">
      Updating state...
    </div>
  </div>
</template>
```

---

### Authentication Integration

Complete authentication example with Vue Router guards:

```vue
<!-- AuthProvider.vue -->
<script setup lang="ts">
import { ref, provide, readonly } from 'vue'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '@dkan-client-tools/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// Auth state
const credentials = ref<string | null>(
  sessionStorage.getItem('dkan_credentials')
)

// Create query client
const queryClient = new QueryClient()

// Create DKAN client
const createClient = () => {
  return new DkanClient({
    baseUrl: 'https://dkan.example.com',
    auth: credentials.value
      ? { type: 'basic', credentials: credentials.value }
      : undefined,
  })
}

const client = ref(createClient())

// Auth methods
const isAuthenticated = readonly(computed(() => !!credentials.value))

const login = async (username: string, password: string): Promise<boolean> => {
  const creds = btoa(`${username}:${password}`)

  // Test credentials
  const testClient = new DkanClient({
    baseUrl: 'https://dkan.example.com',
    auth: { type: 'basic', credentials: creds },
  })

  try {
    await testClient.getAllDatasets({ limit: 1 })
    sessionStorage.setItem('dkan_credentials', creds)
    credentials.value = creds
    client.value = createClient()
    return true
  } catch {
    return false
  }
}

const logout = () => {
  sessionStorage.removeItem('dkan_credentials')
  credentials.value = null
  client.value = createClient()
}

// Provide auth context
provide('auth', {
  isAuthenticated,
  login,
  logout,
})
</script>

<template>
  <VueQueryPlugin :queryClient="queryClient">
    <DkanClientPlugin :client="client">
      <slot />
    </DkanClientPlugin>
  </VueQueryPlugin>
</template>

<!-- LoginForm.vue -->
<script setup lang="ts">
import { ref, inject } from 'vue'

const auth = inject('auth') as {
  login: (username: string, password: string) => Promise<boolean>
}

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true

  try {
    const success = await auth.login(username.value, password.value)
    if (!success) {
      error.value = 'Invalid username or password'
    }
  } catch {
    error.value = 'Login failed - please try again'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="login-form">
    <h2>Login</h2>

    <div v-if="error" class="error">{{ error }}</div>

    <input
      v-model="username"
      type="text"
      placeholder="Username"
      required
    />

    <input
      v-model="password"
      type="password"
      placeholder="Password"
      required
    />

    <button type="submit" :disabled="isLoading">
      {{ isLoading ? 'Logging in...' : 'Login' }}
    </button>
  </form>
</template>

<!-- Router setup with guards -->
<script lang="ts">
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/datasets/create',
      component: () => import('@/views/CreateDataset.vue'),
      meta: { requiresAuth: true },
    },
    // ... other routes
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const credentials = sessionStorage.getItem('dkan_credentials')
  const isAuthenticated = !!credentials

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
</script>
```

---

## References

- [Vue 3 Composition API Documentation](https://vuejs.org/guide/extras/composition-api-faq.html) - Official Composition API guide
- [Vue 3 API Reference](https://vuejs.org/api/composition-api-setup.html) - Complete API reference
- [Composition API RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0013-composition-api.md) - Original proposal and motivation
- [Vue TypeScript Guide](https://vuejs.org/guide/typescript/composition-api.html) - TypeScript with Composition API
- [TanStack Vue Query](https://tanstack.com/query/latest/docs/framework/vue/overview) - Vue Query documentation
- [Vue Test Utils](https://test-utils.vuejs.org/) - Testing Vue components and composables
- [Composables Guide](https://vuejs.org/guide/reusability/composables.html) - Building and using composables
- [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) - How Vue's reactivity system works
- [Vue 3 Migration Guide](https://v3-migration.vuejs.org/) - Migrating from Vue 2
