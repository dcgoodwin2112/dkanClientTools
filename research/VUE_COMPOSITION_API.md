# Vue 3 Composition API Reference

Reference documentation for Vue 3 Composition API patterns and capabilities.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [TanStack Query](./TANSTACK_QUERY.md)
- [React Hooks](./REACT_HOOKS.md) (for comparison)
- [Vue Guide](../docs/VUE_GUIDE.md)

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
- Custom composables built on TanStack Vue Query (`useDataset`, `useDatastore`, etc.)
- Plugin system with provide/inject (`DkanClientPlugin`, `useDkanClient`)
- `MaybeRefOrGetter<T>` pattern for flexible reactive parameters
- Composable composition for complex data fetching
- TypeScript-first composable design with strict typing

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
