# React Hooks API Reference

Reference documentation for React Hooks patterns and capabilities.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [TanStack Query](./TANSTACK_QUERY.md)
- [Vue Composition API](./VUE_COMPOSITION_API.md) (for comparison)
- [React Guide](../docs/REACT_GUIDE.md)

## Quick Reference

**Core Hooks**:
- `useState` - Local component state
- `useEffect` - Side effects and lifecycle
- `useContext` - Access React context
- `useRef` - Persist values without re-renders
- `useMemo` - Memoize expensive computations
- `useCallback` - Memoize functions

**Rules of Hooks**:
1. Only call at top level (not in loops/conditions)
2. Only call from React functions (components or custom hooks)
3. Custom hooks must start with "use"

**Common Patterns in This Project**:
- TanStack Query hooks: `useDataset`, `useDatastore`, `useDatasetSearch`
- Context injection: `useDkanClient`
- Custom hooks for DKAN API integration
- TypeScript generics for type safety

**Dependency Arrays**:
- Empty `[]` - Run once on mount
- Omitted - Run on every render
- `[dep1, dep2]` - Run when dependencies change

---

## Overview

React Hooks are functions that allow you to use state and other React features in function components. Introduced in React 16.8, Hooks replace the need for class components while enabling better code organization and reuse.

**Why Hooks?**
- Simpler component logic without classes
- Reusable stateful logic through custom hooks
- Better separation of concerns
- Easier to test and maintain
- Improved TypeScript integration
- Foundation for modern React patterns

**In This Project:**
- Custom hooks built on [TanStack Query](./TANSTACK_QUERY.md) (`useDataset`, `useDatastore`, etc.)
- Context API for dependency injection (`DkanClientProvider`, `useDkanClient`)
- Hook composition for complex data fetching patterns
- TypeScript-first hook design with strict typing
- For Vue equivalent patterns, see [Vue Composition API](./VUE_COMPOSITION_API.md)

### React Version Compatibility

**Minimum Version**: React 16.8 (when Hooks were introduced, February 2019)

**This Project Requirements**:
- React: `^18.0.0 || ^19.0.0` (peer dependency)
- React DOM: `^18.0.0 || ^19.0.0` (peer dependency)

**Key Features by Version**:

**React 16.8** (February 2019):
- Hooks introduced (`useState`, `useEffect`, `useContext`, etc.)
- Custom hooks support
- Backward compatible with class components

**React 18.0** (March 2022):
- Automatic batching for state updates
- Concurrent features (`useTransition`, `useDeferredValue`)
- Suspense improvements
- Strict Mode enhancements
- `useId` hook for SSR-safe IDs
- New root API (`createRoot`)

**React 19.0** (December 2024):
- Improved TypeScript types and inference
- New `use()` hook for reading Promises and Context
- Enhanced Server Components
- Action hooks (`useFormStatus`, `useFormState`)
- Ref as prop (no more `forwardRef` needed)
- Document metadata support
- Improved error reporting

**Hooks Added in React 18**:
- `useId()` - Generate unique IDs for accessibility
- `useTransition()` - Mark updates as non-urgent
- `useDeferredValue()` - Defer re-rendering of non-critical parts
- `useSyncExternalStore()` - Subscribe to external stores

**Breaking Changes**:

**React 17 → 18**:
- Automatic batching (state updates batched in more scenarios)
- Strict Mode mounts/unmounts components twice in development
- `useEffect` cleanup timing changes in Strict Mode
- Suspense behavior changes

**React 18 → 19**:
- `ref` as regular prop (breaking for libraries using `forwardRef`)
- Changes to hydration behavior
- Deprecation of some legacy APIs

**Best Practices for This Project**:

```typescript
// Use React 18+ features when available
import { useId, useTransition } from 'react'

function DatasetForm() {
  const id = useId() // SSR-safe unique IDs
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(() => {
      // Non-urgent state updates
      updateDataset(data)
    })
  }

  return (
    <form>
      <label htmlFor={id}>Title</label>
      <input id={id} />
      {isPending && <Spinner />}
    </form>
  )
}
```

**Compatibility Notes**:
- This project supports React 18 and 19
- Older React versions (16.8-17.x) are not supported
- Use React 18+ concurrent features when beneficial
- All hooks follow React 18+ best practices

---

## Core Hooks

### useState

Manages local component state in function components.

**TypeScript Signature:**
```typescript
function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
```

**Purpose:**
- Store and update component-level state
- Trigger re-renders when state changes
- Manage form inputs, toggles, counters, etc.

**Example:**
```typescript
import { useState } from 'react'

function DatasetFilter() {
  // Simple state
  const [keyword, setKeyword] = useState<string>('')

  // State with lazy initialization (computed once)
  const [initialData] = useState(() => {
    return JSON.parse(localStorage.getItem('cache') || '{}')
  })

  // Functional update (based on previous state)
  const incrementPage = () => {
    setPage(prev => prev + 1)
  }

  return (
    <input
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
    />
  )
}
```

**TypeScript Patterns:**
```typescript
// Type inference (recommended)
const [count, setCount] = useState(0)  // inferred as number

// Explicit typing when needed
const [data, setData] = useState<Dataset | null>(null)

// Union types
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
```

**Common Pitfalls:**
- State updates are asynchronous - don't rely on immediate state after `setState`
- Objects and arrays need new references to trigger re-render (immutable updates)
- Don't call `setState` during render - causes infinite loops

---

### useEffect

Performs side effects in function components. Replaces lifecycle methods from class components.

**TypeScript Signature:**
```typescript
function useEffect(effect: EffectCallback, deps?: DependencyList): void

type EffectCallback = () => void | (() => void)  // cleanup function is optional
type DependencyList = ReadonlyArray<any>
```

**Purpose:**
- Data fetching (though TanStack Query is preferred in this project)
- Setting up subscriptions
- Manually changing the DOM
- Logging or analytics
- Cleanup on unmount

**Example:**
```typescript
import { useEffect } from 'react'

function DkanClientProvider({ client, children }: DkanClientProviderProps) {
  // Effect runs after component mounts
  useEffect(() => {
    client.mount()

    // Cleanup function runs before unmount
    return () => {
      client.unmount()
    }
  }, [client])  // Re-run if client changes

  return <>{children}</>
}
```

**Dependency Array Patterns:**
```typescript
// Run once on mount, cleanup on unmount
useEffect(() => {
  console.log('Component mounted')
  return () => console.log('Component unmounting')
}, [])

// Run on every render (usually avoid this)
useEffect(() => {
  console.log('Every render')
})

// Run when specific values change
useEffect(() => {
  fetchData(id)
}, [id])
```

**Class Component Lifecycle Equivalents:**
```typescript
// componentDidMount
useEffect(() => {
  console.log('mounted')
}, [])

// componentDidUpdate (only when 'count' changes)
useEffect(() => {
  console.log('count updated:', count)
}, [count])

// componentWillUnmount
useEffect(() => {
  return () => {
    console.log('unmounting')
  }
}, [])
```

**Common Pitfalls:**
- Missing dependencies causes stale closures
- Including functions/objects in deps causes infinite loops (use `useCallback`/`useMemo`)
- Don't use async functions directly as effect (use async function inside)

---

### useContext

Consumes values from React Context without wrapping components in consumers.

**TypeScript Signature:**
```typescript
function useContext<T>(context: Context<T>): T
```

**Purpose:**
- Access shared data without prop drilling
- Consume dependency injection containers
- Access theme, auth, configuration
- Used with Context API providers

**Example (from this project):**
```typescript
import { createContext, useContext } from 'react'
import { DkanClient } from '@dkan-client-tools/core'

// Create typed context
const DkanClientContext = createContext<DkanClient | undefined>(undefined)

// Custom hook to consume context with error handling
export function useDkanClient(): DkanClient {
  const client = useContext(DkanClientContext)

  if (!client) {
    throw new Error('useDkanClient must be used within a DkanClientProvider')
  }

  return client
}

// Usage in components
function DatasetList() {
  const dkanClient = useDkanClient()  // Access client from context
  // ... use dkanClient for API calls
}
```

**TypeScript Context Pattern:**
```typescript
// Define context type
interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

// Create context with type and default
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Type-safe consumer hook
function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

**Common Pitfalls:**
- Context changes cause all consumers to re-render (use `useMemo` to optimize)
- Don't overuse Context - it's not a replacement for all state management
- Always check for undefined when context might not have a provider

---

### useRef

Creates a mutable reference that persists across renders without causing re-renders.

**TypeScript Signature:**
```typescript
function useRef<T>(initialValue: T): MutableRefObject<T>
function useRef<T>(initialValue: T | null): RefObject<T>
function useRef<T = undefined>(): MutableRefObject<T | undefined>
```

**Purpose:**
- Access DOM elements directly
- Store mutable values that don't trigger re-renders
- Keep track of previous values
- Store timers, intervals, or other imperative handles

**Example:**
```typescript
import { useRef, useEffect } from 'react'

function SearchInput() {
  // DOM ref (initialized to null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return <input ref={inputRef} type="text" />
}

function Timer() {
  // Mutable value ref (doesn't trigger re-render)
  const intervalId = useRef<number | undefined>(undefined)

  const startTimer = () => {
    intervalId.current = window.setInterval(() => {
      console.log('tick')
    }, 1000)
  }

  const stopTimer = () => {
    if (intervalId.current) {
      clearInterval(intervalId.current)
    }
  }

  useEffect(() => {
    return () => stopTimer()  // Cleanup on unmount
  }, [])

  return <button onClick={startTimer}>Start</button>
}
```

**TypeScript Patterns:**
```typescript
// DOM element ref (read-only .current)
const divRef = useRef<HTMLDivElement>(null)

// Mutable value ref
const countRef = useRef<number>(0)
countRef.current = 42  // OK - mutable

// Generic ref
const dataRef = useRef<Dataset | null>(null)
```

**Common Pitfalls:**
- Changing `ref.current` doesn't trigger re-render
- Don't read or write refs during render (use in effects or event handlers)
- DOM refs are `null` until component mounts

---

### useMemo

Memoizes expensive computations to avoid recalculating on every render.

**TypeScript Signature:**
```typescript
function useMemo<T>(factory: () => T, deps: DependencyList): T
```

**Purpose:**
- Optimize expensive calculations
- Prevent unnecessary object/array recreation
- Stabilize references for dependency arrays
- Improve performance in large lists

**Example:**
```typescript
import { useMemo } from 'react'

function DatasetTable({ datasets }: { datasets: Dataset[] }) {
  // Expensive computation memoized
  const sortedDatasets = useMemo(() => {
    console.log('Sorting datasets...')
    return datasets.slice().sort((a, b) =>
      a.title.localeCompare(b.title)
    )
  }, [datasets])  // Only recalculate when datasets changes

  // Memoize complex filter
  const filteredByTheme = useMemo(() => {
    return datasets.filter(d => d.theme?.includes('health'))
  }, [datasets])

  return <>{/* render sortedDatasets */}</>
}
```

**When to Use:**
```typescript
// Good use case - expensive calculation
const expensiveValue = useMemo(() => {
  return datasets.reduce((acc, d) => acc + calculateScore(d), 0)
}, [datasets])

// Good use case - stabilize object reference
const queryOptions = useMemo(() => ({
  page: currentPage,
  pageSize: 10,
}), [currentPage])

// Bad use case - simple calculation (overhead not worth it)
const doubled = useMemo(() => count * 2, [count])  // Just use: count * 2
```

**Common Pitfalls:**
- Don't memoize everything - adds complexity and memory overhead
- Memoization isn't free - profile before optimizing
- Dependencies must be stable or you lose the benefit

---

### useCallback

Memoizes function references to prevent recreating functions on every render.

**TypeScript Signature:**
```typescript
function useCallback<T extends Function>(callback: T, deps: DependencyList): T
```

**Purpose:**
- Stabilize function references for dependency arrays
- Prevent child component re-renders (when passed as props)
- Optimize event handlers in large lists
- Use with `React.memo` for performance

**Example:**
```typescript
import { useCallback, memo } from 'react'

function DatasetSearch() {
  const [query, setQuery] = useState('')

  // Without useCallback, this function is recreated every render
  const handleSearch = useCallback((searchTerm: string) => {
    console.log('Searching for:', searchTerm)
    setQuery(searchTerm)
  }, [])  // No dependencies - function never changes

  // With dependencies
  const handleAdvancedSearch = useCallback((term: string) => {
    console.log('Advanced search:', term, query)
    // Uses current query value
  }, [query])  // Recreate when query changes

  return <SearchInput onSearch={handleSearch} />
}

// Child component won't re-render if onSearch reference doesn't change
const SearchInput = memo(({ onSearch }: { onSearch: (term: string) => void }) => {
  return <input onChange={(e) => onSearch(e.target.value)} />
})
```

**useCallback vs useMemo:**
```typescript
// These are equivalent:
const memoizedCallback = useCallback(() => {
  doSomething(a, b)
}, [a, b])

const memoizedCallback = useMemo(() => {
  return () => doSomething(a, b)
}, [a, b])

// useCallback is just syntactic sugar for memoizing functions
```

**Common Pitfalls:**
- Don't wrap every function - only when needed for optimization
- Must include all used variables in dependencies (ESLint helps)
- Doesn't prevent function execution, just memoizes the reference

---

## Custom Hook Patterns

### Custom Hook Conventions

Custom hooks allow you to extract reusable stateful logic from components.

**Naming Convention:**
- Always prefix with `use` (e.g., `useDataset`, `useAuth`, `useLocalStorage`)
- This signals to React and ESLint that Hook rules apply
- Enables automatic Hook linting

**Basic Pattern:**
```typescript
// Custom hook for local storage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)
    window.localStorage.setItem(key, JSON.stringify(valueToStore))
  }

  return [storedValue, setValue] as const
}

// Usage
function MyComponent() {
  const [name, setName] = useLocalStorage('name', 'Anonymous')
  return <input value={name} onChange={(e) => setName(e.target.value)} />
}
```

---

### Building Custom Hooks

**Example from this project:**
```typescript
import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'

/**
 * Configuration options for the useDataset hook.
 */
export interface UseDatasetOptions {
  identifier: string
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

/**
 * Fetches a single dataset from DKAN by its unique identifier.
 *
 * This hook uses TanStack Query to automatically cache the dataset and refetch
 * it in the background when the data becomes stale.
 */
export function useDataset(options: UseDatasetOptions) {
  const dkanClient = useDkanClient()  // Access context

  return useQuery({
    queryKey: ['dataset', options.identifier],
    queryFn: () => dkanClient.getDataset(options.identifier),
    enabled: options.enabled !== false && !!options.identifier,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    gcTime: options.gcTime ?? 5 * 60 * 1000,
  })
}
```

**Key Patterns:**
1. Accept options object for flexibility
2. Use TypeScript interface for options
3. Compose with other hooks (`useQuery`, `useContext`)
4. Return meaningful values (object or tuple)
5. Handle edge cases (empty identifiers, disabled states)

---

### Hook Composition and Reusability

Custom hooks can compose other hooks to build complex logic:

```typescript
// Composing multiple hooks
function useDatasetWithMetadata(identifier: string) {
  // Use multiple custom hooks
  const { data: dataset, isLoading: datasetLoading } = useDataset({ identifier })
  const { data: schema, isLoading: schemaLoading } = useSchema({
    schemaId: 'dataset'
  })

  // Derive combined state
  const isLoading = datasetLoading || schemaLoading

  // Compute additional values
  const metadata = useMemo(() => {
    if (!dataset || !schema) return null
    return {
      ...dataset,
      schemaVersion: schema.version,
    }
  }, [dataset, schema])

  return { metadata, isLoading }
}
```

---

### TypeScript Interfaces for Hook Options

**Consistent Option Pattern:**
```typescript
// Well-typed hook options interface
export interface UseDatastoreOptions {
  // Required parameters
  datasetId: string
  index: number

  // Optional query parameters
  conditions?: Array<{ property: string; value: any }>
  limit?: number
  offset?: number

  // TanStack Query options
  enabled?: boolean
  staleTime?: number
  gcTime?: number

  // Callbacks
  onSuccess?: (data: DatastoreResponse) => void
  onError?: (error: Error) => void
}

// Usage provides great intellisense and type safety
const { data } = useDatastore({
  datasetId: 'abc-123',
  index: 0,
  conditions: [{ property: 'state', value: 'VA' }],
  limit: 100,
  onSuccess: (data) => console.log('Loaded:', data.length, 'rows'),
})
```

---

### Returning Values from Custom Hooks

**Object Return (Recommended for many values):**
```typescript
function useDataset(options: UseDatasetOptions) {
  return useQuery({
    // ... query config
  })
  // Returns: { data, isLoading, error, refetch, ... }
}

// Destructure what you need
const { data, isLoading, error } = useDataset({ identifier: 'abc' })
```

**Tuple Return (Array, for simple cases):**
```typescript
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => setValue(v => !v), [])

  return [value, toggle] as const  // 'as const' for tuple type
}

// Array destructuring with custom names
const [isOpen, toggleOpen] = useToggle(false)
const [isVisible, toggleVisible] = useToggle(true)
```

**When to use each:**
- **Object**: Multiple values, unclear naming (TanStack Query hooks)
- **Tuple**: 2-3 values, clear naming pattern (useState-like)

---

## Context API and Providers

### createContext Pattern

**Basic Context Setup:**
```typescript
import { createContext, useContext, useState, type ReactNode } from 'react'

// 1. Define context type
interface AuthContextType {
  user: User | null
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

// 2. Create context with undefined default (will validate in hook)
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 3. Create provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (credentials: Credentials) => {
    const user = await api.login(credentials)
    setUser(user)
  }

  const logout = () => {
    setUser(null)
  }

  const value = { user, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 4. Create consumer hook with error handling
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

### Provider Component Pattern

**DkanClientProvider Example (from this project):**
```typescript
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { DkanClient } from '@dkan-client-tools/core'

const DkanClientContext = createContext<DkanClient | undefined>(undefined)

export interface DkanClientProviderProps {
  client: DkanClient
  children: ReactNode
}

/**
 * Provider component that makes DkanClient and TanStack Query available
 * to all child components.
 */
export function DkanClientProvider({ client, children }: DkanClientProviderProps) {
  // Lifecycle management with useEffect
  useEffect(() => {
    client.mount()
    return () => {
      client.unmount()
    }
  }, [client])

  return (
    <QueryClientProvider client={client.getQueryClient()}>
      <DkanClientContext.Provider value={client}>
        {children}
      </DkanClientContext.Provider>
    </QueryClientProvider>
  )
}

/**
 * Hook to access the DkanClient from context.
 */
export function useDkanClient(): DkanClient {
  const client = useContext(DkanClientContext)

  if (!client) {
    throw new Error('useDkanClient must be used within a DkanClientProvider')
  }

  return client
}
```

**Usage in Application:**
```typescript
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '@dkan-client-tools/react'

const dkanClient = new DkanClient({
  baseUrl: 'https://dkan.example.com',
})

function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <DatasetList />
    </DkanClientProvider>
  )
}

function DatasetList() {
  // Access client from context
  const dkanClient = useDkanClient()
  const { data } = useDataset({ identifier: 'abc-123' })

  return <>{/* render datasets */}</>
}
```

---

### Consuming Context with useContext

**Multiple Context Pattern:**
```typescript
function MyComponent() {
  // Consume multiple contexts
  const dkanClient = useDkanClient()
  const theme = useTheme()
  const auth = useAuth()

  // Use context values
  return (
    <div className={theme.mode}>
      {auth.user && <DatasetList />}
    </div>
  )
}
```

---

### TypeScript Typing for Context

**Strict Context Typing:**
```typescript
// Option 1: Context with undefined (validate in hook)
const MyContext = createContext<MyType | undefined>(undefined)

export function useMyContext(): MyType {
  const ctx = useContext(MyContext)
  if (!ctx) throw new Error('Must use within Provider')
  return ctx
}

// Option 2: Context with default value (no validation needed)
const defaultValue: MyType = { /* ... */ }
const MyContext = createContext<MyType>(defaultValue)

export function useMyContext(): MyType {
  return useContext(MyContext)  // Always has value
}

// Option 3: Context with null (for optional context)
const MyContext = createContext<MyType | null>(null)

export function useMyContext(): MyType | null {
  return useContext(MyContext)  // Can be null
}
```

---

### Error Handling for Missing Providers

**Clear Error Messages:**
```typescript
export function useDkanClient(): DkanClient {
  const client = useContext(DkanClientContext)

  if (!client) {
    throw new Error(
      'useDkanClient must be used within a DkanClientProvider. ' +
      'Wrap your app with <DkanClientProvider client={dkanClient}>...</DkanClientProvider>'
    )
  }

  return client
}
```

**Development-Only Warnings:**
```typescript
export function useFeatureFlags(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagsContext)

  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('useFeatureFlags used outside FeatureFlagsProvider - using defaults')
    }
    return defaultFeatureFlags  // Fallback in production
  }

  return context
}
```

---

## Rules of Hooks

React Hooks have specific rules that must be followed for correct behavior.

### Only Call Hooks at the Top Level

**Don't call Hooks inside:**
- Conditionals (`if` statements)
- Loops (`for`, `while`, `map` callbacks)
- Nested functions
- Try/catch blocks

**Why:** React relies on the order of Hook calls to maintain state between renders.

**Bad:**
```typescript
function MyComponent({ condition }) {
  if (condition) {
    const [state, setState] = useState(0)  // ❌ Conditional hook
  }

  const items = data.map((item) => {
    const [selected, setSelected] = useState(false)  // ❌ Hook in loop
    return <Item key={item.id} selected={selected} />
  })
}
```

**Good:**
```typescript
function MyComponent({ condition }) {
  // ✅ Always call hooks at top level
  const [state, setState] = useState(0)

  // Conditionally use the value, not the hook
  if (condition) {
    console.log(state)
  }
}

// Extract hook to separate component
function Item({ item }) {
  const [selected, setSelected] = useState(false)  // ✅ Component-level hook
  return <div>{item.name}</div>
}

function MyComponent() {
  const items = data.map((item) => <Item key={item.id} item={item} />)
}
```

---

### Only Call Hooks from React Functions

**Call Hooks from:**
- React function components
- Custom Hooks (functions starting with `use`)

**Don't call Hooks from:**
- Regular JavaScript functions
- Class components
- Event handlers (outside component render)

**Bad:**
```typescript
// ❌ Regular function (not a component or custom hook)
function formatData(data) {
  const [formatted, setFormatted] = useState(null)
  return formatted
}

// ❌ Class component
class MyComponent extends React.Component {
  componentDidMount() {
    const [data, setData] = useState(null)  // ❌ Hooks don't work in classes
  }
}
```

**Good:**
```typescript
// ✅ Custom hook
function useFormattedData(data) {
  const [formatted, setFormatted] = useState(null)

  useEffect(() => {
    setFormatted(formatData(data))
  }, [data])

  return formatted
}

// ✅ Function component
function MyComponent() {
  const formattedData = useFormattedData(rawData)
  return <div>{formattedData}</div>
}
```

---

### Why These Rules Matter

**Hook Call Order:**

React stores Hook state in an array indexed by call order:

```
First render:
  useState('name')    → state[0] = 'name'
  useState(0)         → state[1] = 0
  useEffect(...)      → effects[0] = ...

Second render:
  useState('name')    → reads state[0]
  useState(0)         → reads state[1]
  useEffect(...)      → reads effects[0]
```

If you conditionally call Hooks, the order changes and React gets confused:

```
First render (condition = true):
  useState('name')    → state[0]
  useState(0)         → state[1]

Second render (condition = false):
  // useState('name') skipped
  useState(0)         → reads state[0] ❌ Gets 'name' instead of 0!
```

---

### ESLint Plugin for Enforcement

**Install and configure:**
```bash
npm install eslint-plugin-react-hooks --save-dev
```

**ESLint config:**
```json
{
  "extends": [
    "plugin:react-hooks/recommended"
  ],
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

**What it catches:**
- Hooks called conditionally or in loops
- Hooks called from non-React functions
- Missing dependencies in `useEffect`, `useMemo`, `useCallback`

---

## Integration with TanStack Query

This project uses TanStack Query hooks extensively for data fetching and caching.

### How useQuery and useMutation Work

**useQuery Hook Pattern:**
```typescript
import { useQuery } from '@tanstack/react-query'

function MyComponent() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['todos'],           // Unique cache key
    queryFn: () => fetchTodos(),   // Function that returns a Promise
    staleTime: 5 * 60 * 1000,      // How long data stays fresh
    gcTime: 10 * 60 * 1000,        // How long unused data stays in cache
    enabled: true,                  // Whether query should run
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <ul>{data.map(todo => <li key={todo.id}>{todo.title}</li>)}</ul>
}
```

**useMutation Hook Pattern:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreateDataset() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newDataset: Dataset) => createDataset(newDataset),
    onSuccess: () => {
      // Invalidate and refetch datasets after successful creation
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
    onError: (error) => {
      console.error('Failed to create dataset:', error)
    },
  })

  const handleSubmit = (dataset: Dataset) => {
    mutation.mutate(dataset)
  }

  return (
    <button onClick={handleSubmit} disabled={mutation.isPending}>
      {mutation.isPending ? 'Creating...' : 'Create Dataset'}
    </button>
  )
}
```

---

### Combining Custom Hooks with TanStack Query

**Pattern from this project:**
```typescript
import { useQuery } from '@tanstack/react-query'
import { useDkanClient } from './DkanClientProvider'

export interface UseDatasetOptions {
  identifier: string
  enabled?: boolean
  staleTime?: number
}

export function useDataset(options: UseDatasetOptions) {
  // 1. Get client from context (custom hook)
  const dkanClient = useDkanClient()

  // 2. Use TanStack Query hook with client methods
  return useQuery({
    queryKey: ['dataset', options.identifier],
    queryFn: () => dkanClient.getDataset(options.identifier),
    enabled: options.enabled !== false && !!options.identifier,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
  })
}

// Usage
function DatasetView({ id }: { id: string }) {
  const { data: dataset, isLoading, error } = useDataset({
    identifier: id,
    staleTime: 10 * 60 * 1000,  // Custom stale time
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading dataset</div>

  return <h1>{dataset?.title}</h1>
}
```

---

### Provider Setup

**Wrapping with QueryClientProvider:**
```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { DkanClient } from '@dkan-client-tools/core'

export function DkanClientProvider({ client, children }: DkanClientProviderProps) {
  useEffect(() => {
    client.mount()
    return () => client.unmount()
  }, [client])

  // Wrap children with TanStack Query provider
  return (
    <QueryClientProvider client={client.getQueryClient()}>
      <DkanClientContext.Provider value={client}>
        {children}
      </DkanClientContext.Provider>
    </QueryClientProvider>
  )
}
```

**Application Setup:**
```typescript
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '@dkan-client-tools/react'

const dkanClient = new DkanClient({
  baseUrl: 'https://dkan.example.com',
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <MyApp />
    </DkanClientProvider>
  )
}
```

---

### Query Key Management

**Hierarchical Query Keys:**
```typescript
// Query keys are arrays - enables partial invalidation
const queryKey = ['dataset', identifier]
const queryKey = ['datastore', datasetId, index]
const queryKey = ['search', { keyword, page }]

// Invalidate all datasets
queryClient.invalidateQueries({ queryKey: ['dataset'] })

// Invalidate specific dataset
queryClient.invalidateQueries({ queryKey: ['dataset', 'abc-123'] })

// Invalidate all datastore queries for a dataset
queryClient.invalidateQueries({ queryKey: ['datastore', 'abc-123'] })
```

**Pattern Used in This Project:**
```typescript
// src/useDataset.ts
queryKey: ['dataset', options.identifier]

// src/useDatastore.ts
queryKey: ['datastore', options.datasetId, options.index]

// src/useDatasetSearch.ts
queryKey: ['search', searchParams]

// Enables granular cache invalidation after mutations
```

---

## Testing Hooks

### Testing Hooks with React Testing Library

**Setup:**
```bash
npm install @testing-library/react @testing-library/jest-dom --save-dev
```

**Basic Hook Test:**
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useDataset } from './useDataset'

test('useDataset fetches dataset', async () => {
  const { result } = renderHook(() =>
    useDataset({ identifier: 'abc-123' })
  )

  // Initially loading
  expect(result.current.isLoading).toBe(true)

  // Wait for data to load
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })

  // Check data
  expect(result.current.data).toEqual({
    identifier: 'abc-123',
    title: 'Test Dataset',
  })
})
```

---

### Testing Custom Hooks with Context Providers

**Wrapper Pattern:**
```typescript
import { renderHook } from '@testing-library/react'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from './DkanClientProvider'

test('useDkanClient returns client from context', () => {
  const mockClient = new DkanClient({
    baseUrl: 'https://test.example.com',
    defaultOptions: { retry: 0 },
  })

  // Create wrapper with provider
  const wrapper = ({ children }) => (
    <DkanClientProvider client={mockClient}>
      {children}
    </DkanClientProvider>
  )

  const { result } = renderHook(() => useDkanClient(), { wrapper })

  expect(result.current).toBe(mockClient)
})
```

**Testing Hook with Multiple Providers:**
```typescript
function AllProviders({ children }) {
  return (
    <DkanClientProvider client={mockClient}>
      <ThemeProvider theme="light">
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </DkanClientProvider>
  )
}

const { result } = renderHook(() => useMyHook(), {
  wrapper: AllProviders
})
```

---

### Mocking and Spying Patterns

**Spying on Client Methods:**
```typescript
import { vi } from 'vitest'

test('useDataset calls getDataset method', async () => {
  const mockClient = new DkanClient({
    baseUrl: 'https://test.example.com',
    defaultOptions: { retry: 0 },
  })

  // Spy on client method
  const spy = vi.spyOn(mockClient, 'getDataset')
    .mockResolvedValue({
      identifier: 'abc-123',
      title: 'Test Dataset',
    })

  const wrapper = ({ children }) => (
    <DkanClientProvider client={mockClient}>{children}</DkanClientProvider>
  )

  const { result } = renderHook(
    () => useDataset({ identifier: 'abc-123' }),
    { wrapper }
  )

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })

  // Verify method was called
  expect(spy).toHaveBeenCalledWith('abc-123')
  expect(spy).toHaveBeenCalledTimes(1)
})
```

**Testing Hook State Updates:**
```typescript
import { renderHook, act } from '@testing-library/react'

test('useToggle toggles state', () => {
  const { result } = renderHook(() => useToggle(false))

  expect(result.current[0]).toBe(false)

  // Update state
  act(() => {
    result.current[1]()  // Call toggle function
  })

  expect(result.current[0]).toBe(true)
})
```

**Testing useEffect Cleanup:**
```typescript
test('cleanup function is called on unmount', () => {
  const cleanup = vi.fn()

  function useCustomHook() {
    useEffect(() => {
      return cleanup
    }, [])
  }

  const { unmount } = renderHook(() => useCustomHook())

  expect(cleanup).not.toHaveBeenCalled()

  unmount()

  expect(cleanup).toHaveBeenCalledTimes(1)
})
```

---

## Best Practices

### When to Use Each Hook

**useState:**
- Local component state (form inputs, toggles, counters)
- Simple data that doesn't need to be shared
- State that triggers re-renders

**useEffect:**
- Side effects after render (DOM manipulation, subscriptions)
- Synchronizing with external systems
- Cleanup on unmount
- **Avoid for data fetching** - use TanStack Query instead

**useContext:**
- Sharing data across many components (theme, auth, config)
- Dependency injection (DkanClient in this project)
- Avoiding prop drilling

**useRef:**
- Accessing DOM elements
- Storing mutable values without re-rendering
- Keeping track of previous values
- Storing timers/intervals

**useMemo:**
- Expensive calculations
- Stabilizing object/array references for dependency arrays
- **Don't overuse** - profile first

**useCallback:**
- Stabilizing function references for child components
- Preventing re-renders with `React.memo`
- Dependency arrays requiring stable functions

---

### Performance Optimization

**Memoization Guidelines:**
```typescript
// ✅ Good - expensive calculation
const sortedAndFiltered = useMemo(() => {
  return items
    .filter(item => item.active)
    .sort((a, b) => complexSort(a, b))
}, [items])

// ❌ Bad - simple calculation (overhead not worth it)
const doubled = useMemo(() => count * 2, [count])

// ✅ Good - stabilize reference for dependency
const options = useMemo(() => ({ page, pageSize }), [page, pageSize])
```

**React.memo with useCallback:**
```typescript
// Child component with memo
const ExpensiveChild = memo(({ onClick, data }) => {
  console.log('Rendering ExpensiveChild')
  return <button onClick={onClick}>{data}</button>
})

function Parent() {
  const [count, setCount] = useState(0)
  const [other, setOther] = useState(0)

  // Without useCallback, onClick recreated every render
  // ExpensiveChild would re-render even when data doesn't change
  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  return (
    <>
      <ExpensiveChild onClick={handleClick} data={count} />
      <button onClick={() => setOther(o => o + 1)}>Other: {other}</button>
    </>
  )
}
```

---

### Common Anti-Patterns

**1. Calling setState in render:**
```typescript
// ❌ Bad - infinite loop
function Component() {
  const [count, setCount] = useState(0)
  setCount(1)  // Called every render, triggers new render
  return <div>{count}</div>
}

// ✅ Good - use useEffect or event handler
function Component() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(1)  // Runs after render
  }, [])

  return <div>{count}</div>
}
```

**2. Missing useEffect dependencies:**
```typescript
// ❌ Bad - stale closure
function Component({ id }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchData(id).then(setData)
  }, [])  // Missing 'id' dependency

  return <div>{data}</div>
}

// ✅ Good - include all dependencies
useEffect(() => {
  fetchData(id).then(setData)
}, [id])
```

**3. Over-using Context:**
```typescript
// ❌ Bad - everything in context
const AppContext = createContext({
  user, setUser,
  theme, setTheme,
  data, setData,
  // ... 20 more things
})

// ✅ Good - separate contexts by concern
const AuthContext = createContext({ user, login, logout })
const ThemeContext = createContext({ theme, toggleTheme })
const DataContext = createContext({ data, refetch })
```

**4. Mutating state directly:**
```typescript
// ❌ Bad - mutates array
const [items, setItems] = useState([1, 2, 3])
items.push(4)         // Mutates original array
setItems(items)       // React might not detect change

// ✅ Good - create new array
setItems([...items, 4])
setItems(items => [...items, 4])
```

---

### TypeScript Best Practices

**Generic Hooks:**
```typescript
// Generic custom hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  })

  return [value, setValue] as const
}

// Type-safe usage
const [user, setUser] = useLocalStorage<User | null>('user', null)
const [count, setCount] = useLocalStorage<number>('count', 0)
```

**Discriminated Unions for State:**
```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' })

  // TypeScript knows data exists when status is 'success'
  if (state.status === 'success') {
    console.log(state.data)  // ✅ Type-safe
  }
}
```

**Properly Typed Event Handlers:**
```typescript
function MyComponent() {
  // Infer type from JSX
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }

  return (
    <>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Click</button>
    </>
  )
}
```

---

### React ↔ Vue Migration Guide

For developers switching between React and Vue, or maintaining projects in both frameworks. See [Vue Composition API](./VUE_COMPOSITION_API.md) for detailed Vue patterns.

**State Management**:

| React | Vue | Notes |
|-------|-----|-------|
| `useState(value)` | `ref(value)` | React: returns `[state, setState]`<br>Vue: returns ref object, access via `.value` |
| `useState({ ... })` | `reactive({ ... })` | React: state setter replaces entire object<br>Vue: properties individually reactive |
| `const [x, setX] = useState(0)` | `const x = ref(0)` | React: `setX(1)`<br>Vue: `x.value = 1` |

**Derived State**:

| React | Vue | Notes |
|-------|-----|-------|
| `useMemo(() => fn, deps)` | `computed(() => fn)` | React: manual dependency tracking<br>Vue: automatic dependency tracking |
| `const double = useMemo(() => count * 2, [count])` | `const double = computed(() => count.value * 2)` | Vue auto-tracks `count` dependency |

**Side Effects**:

| React | Vue | Notes |
|-------|-----|-------|
| `useEffect(fn, deps)` | `watch(source, fn)` | React: runs after render<br>Vue: runs when source changes |
| `useEffect(fn, [])` | `onMounted(fn)` | React: mount only via empty deps<br>Vue: explicit mount hook |
| `useEffect(() => { return cleanup }, deps)` | `onUnmounted(cleanup)` | React: return cleanup function<br>Vue: separate unmount hook |
| `useEffect(fn)` (no deps) | `watchEffect(fn)` | React: every render<br>Vue: tracks dependencies automatically |

**Refs (DOM Access)**:

| React | Vue | Notes |
|-------|-----|-------|
| `useRef(null)` | `ref(null)` | Same concept, different usage |
| `<div ref={myRef}>` | `<div ref="myRef">` | React: assign ref object<br>Vue: string name |
| `myRef.current` | `myRef.value` | React: `.current`<br>Vue: `.value` |

**Stable References**:

| React | Vue | Notes |
|-------|-----|-------|
| `useCallback(fn, deps)` | Not needed | Vue functions are stable by default |
| `useMemo(() => ({ ... }), deps)` | `computed(() => ({ ... }))` | Vue computed values are cached |

**Context / Dependency Injection**:

| React | Vue | Notes |
|-------|-----|-------|
| `createContext(default)` | `Symbol('key')` | React: context object<br>Vue: injection key |
| `<Context.Provider value={val}>` | `provide(key, val)` | React: JSX provider<br>Vue: provide function |
| `useContext(Context)` | `inject(key)` | React: hook to read context<br>Vue: inject function |

**Lifecycle Hooks**:

| React | Vue | Notes |
|-------|-----|-------|
| `useEffect(fn, [])` | `onMounted(fn)` | Component mounted |
| `useEffect(fn)` | `onUpdated(fn)` | After every render/update |
| `useEffect(() => cleanup, [])` | `onUnmounted(fn)` | Component unmounting |
| N/A | `onBeforeMount(fn)` | Before mounting (Vue only) |
| N/A | `onBeforeUpdate(fn)` | Before updates (Vue only) |

**Component Definition**:

| React | Vue | Notes |
|-------|-----|-------|
| `function Component(props)` | `<script setup>` | React: function component<br>Vue: script setup syntax |
| `props.value` | `defineProps<{ value: T }>()` | React: direct access<br>Vue: compiler macro |
| `const emit = props.onEvent` | `const emit = defineEmits<{ event: [] }>()` | React: props are callbacks<br>Vue: emit system |

**TanStack Query Integration**:

| React | Vue | Notes |
|-------|-----|-------|
| `useQuery({ queryKey, queryFn })` | `useQuery({ queryKey, queryFn })` | Same API across frameworks |
| `queryKey: ['item', id]` | `queryKey: computed(() => ['item', toValue(id)])` | React: static dependencies<br>Vue: reactive with computed |
| `enabled: !!id` | `enabled: () => !!toValue(id)` | React: boolean<br>Vue: getter function |

**Custom Hooks/Composables**:

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

**Key Differences**:

1. **Reactivity**:
   - React: Immutable updates, new references trigger re-renders
   - Vue: Mutable updates via `.value`, proxy-based reactivity

2. **Dependency Tracking**:
   - React: Manual dependency arrays (`useEffect`, `useMemo`, `useCallback`)
   - Vue: Automatic dependency tracking (computed, watch)

3. **Function Stability**:
   - React: Functions recreated every render unless `useCallback`
   - Vue: Functions are stable by default

4. **Ref Access**:
   - React: `ref.current` (DOM refs)
   - Vue: `ref.value` (reactive refs AND DOM refs)

5. **TypeScript**:
   - React: Generic components via `<T,>` syntax
   - Vue: `<script setup lang="ts" generic="T">`

**Migration Tips**:

- **React → Vue**: Remove dependency arrays, use `.value` for refs, replace `useMemo` with `computed`
- **Vue → React**: Add dependency arrays, use state setters instead of `.value`, wrap functions in `useCallback`
- **Both**: TanStack Query patterns translate directly with minor syntax differences

---

## Real-World Usage Examples

Complete, production-ready React components demonstrating common DKAN workflows.

### Dataset Catalog with Search and Pagination

Complete component with search, filtering, pagination, and state management:

```typescript
import { useState } from 'react'
import { useDatasetSearch } from '@dkan-client-tools/react'

export function DatasetCatalog() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [theme, setTheme] = useState('')
  const pageSize = 20

  const { data, isLoading, isError, error } = useDatasetSearch({
    fulltext: keyword || undefined,
    theme: theme || undefined,
    page,
    pageSize,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPage(1) // Reset to page 1 on new search
  }

  if (isLoading) {
    return <div className="loading">Loading datasets...</div>
  }

  if (isError) {
    return (
      <div className="error">
        Error loading datasets: {error?.message}
      </div>
    )
  }

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  return (
    <div className="dataset-catalog">
      <h1>Dataset Catalog</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search datasets..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="search-input"
        />
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="theme-select"
        >
          <option value="">All Themes</option>
          <option value="environment">Environment</option>
          <option value="health">Health</option>
          <option value="education">Education</option>
          <option value="transportation">Transportation</option>
        </select>
        <button type="submit">Search</button>
      </form>

      {/* Results Count */}
      <div className="results-info">
        Found {data?.total || 0} datasets
        {keyword && ` matching "${keyword}"`}
      </div>

      {/* Dataset List */}
      <div className="dataset-list">
        {data?.results?.map((dataset) => (
          <div key={dataset.identifier} className="dataset-card">
            <h3>{dataset.title}</h3>
            <p>{dataset.description}</p>
            <div className="dataset-meta">
              <span>Publisher: {dataset.publisher?.name}</span>
              <span>Modified: {dataset.modified}</span>
            </div>
            <div className="dataset-themes">
              {dataset.theme?.map((t) => (
                <span key={t} className="theme-badge">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
```

---

### Dataset Details with Datastore Preview

Component showing dataset metadata and data preview:

```typescript
import { useState } from 'react'
import { useDataset, useDatastore } from '@dkan-client-tools/react'
import { useParams } from 'react-router-dom'

export function DatasetDetails() {
  const { datasetId } = useParams<{ datasetId: string }>()
  const [selectedDistribution, setSelectedDistribution] = useState(0)

  // Fetch dataset metadata
  const {
    data: dataset,
    isLoading: isLoadingDataset,
    isError: isDatasetError,
    error: datasetError
  } = useDataset({
    identifier: datasetId!,
    enabled: !!datasetId,
    staleTime: 10 * 60 * 1000,
  })

  // Fetch datastore preview (first 10 rows)
  const {
    data: datastoreData,
    isLoading: isLoadingData,
    isError: isDataError,
    error: dataError
  } = useDatastore({
    datasetId: datasetId!,
    index: selectedDistribution,
    options: { limit: 10, offset: 0 },
    enabled: !!datasetId && !!dataset?.distribution?.[selectedDistribution],
    staleTime: 5 * 60 * 1000,
  })

  if (isLoadingDataset) {
    return <div className="loading">Loading dataset...</div>
  }

  if (isDatasetError) {
    return (
      <div className="error">
        Error: {datasetError?.message}
      </div>
    )
  }

  if (!dataset) {
    return <div className="not-found">Dataset not found</div>
  }

  return (
    <div className="dataset-details">
      {/* Metadata Section */}
      <section className="metadata">
        <h1>{dataset.title}</h1>
        <p>{dataset.description}</p>

        <div className="meta-grid">
          <div className="meta-item">
            <strong>Publisher:</strong>
            <span>{dataset.publisher?.name}</span>
          </div>
          <div className="meta-item">
            <strong>Contact:</strong>
            <span>{dataset.contactPoint?.fn}</span>
          </div>
          <div className="meta-item">
            <strong>Modified:</strong>
            <span>{dataset.modified}</span>
          </div>
          <div className="meta-item">
            <strong>Access Level:</strong>
            <span>{dataset.accessLevel}</span>
          </div>
        </div>

        {dataset.keyword && dataset.keyword.length > 0 && (
          <div className="keywords">
            <strong>Keywords:</strong>
            {dataset.keyword.map((kw) => (
              <span key={kw} className="keyword-badge">{kw}</span>
            ))}
          </div>
        )}
      </section>

      {/* Distributions Section */}
      <section className="distributions">
        <h2>Data Distributions</h2>
        {dataset.distribution && dataset.distribution.length > 0 ? (
          <>
            <div className="distribution-tabs">
              {dataset.distribution.map((dist, index) => (
                <button
                  key={dist.identifier || index}
                  onClick={() => setSelectedDistribution(index)}
                  className={index === selectedDistribution ? 'active' : ''}
                >
                  {dist.title || `Distribution ${index + 1}`}
                  {dist.format && ` (${dist.format})`}
                </button>
              ))}
            </div>

            {/* Data Preview */}
            <div className="data-preview">
              <h3>Data Preview (First 10 Rows)</h3>

              {isLoadingData && <div>Loading data...</div>}

              {isDataError && (
                <div className="error">
                  Error loading data: {dataError?.message}
                </div>
              )}

              {datastoreData && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {datastoreData.schema?.fields?.map((field) => (
                          <th key={field.name}>{field.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datastoreData.results?.map((row, index) => (
                        <tr key={index}>
                          {datastoreData.schema?.fields?.map((field) => (
                            <td key={field.name}>
                              {row[field.name]?.toString()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="row-count">
                    Showing {datastoreData.results?.length || 0} of{' '}
                    {datastoreData.count || 0} total rows
                  </div>
                </div>
              )}

              {/* Download Link */}
              <a
                href={dataset.distribution[selectedDistribution].downloadURL}
                download
                className="download-button"
              >
                Download Full Dataset
              </a>
            </div>
          </>
        ) : (
          <p>No distributions available for this dataset.</p>
        )}
      </section>
    </div>
  )
}
```

---

### Dataset CRUD Operations

#### Create Dataset Form

```typescript
import { useState, useCallback } from 'react'
import { useCreateDataset } from '@dkan-client-tools/react'
import { useNavigate } from 'react-router-dom'

export function CreateDatasetForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contactName: '',
    contactEmail: '',
    publisherName: '',
    keywords: '',
    theme: [] as string[],
  })

  const createDataset = useCreateDataset({
    onSuccess: (data) => {
      alert(`Dataset created: ${data.identifier}`)
      navigate(`/datasets/${data.identifier}`)
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

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
  }, [formData, createDataset])

  return (
    <form onSubmit={handleSubmit} className="create-dataset-form">
      <h1>Create New Dataset</h1>

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          minLength={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={5}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="contactName">Contact Name *</label>
          <input
            id="contactName"
            type="text"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactEmail">Contact Email *</label>
          <input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="publisherName">Publisher Name *</label>
        <input
          id="publisherName"
          type="text"
          value={formData.publisherName}
          onChange={(e) => setFormData({ ...formData, publisherName: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="keywords">Keywords (comma-separated)</label>
        <input
          id="keywords"
          type="text"
          value={formData.keywords}
          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          placeholder="climate, temperature, environment"
        />
      </div>

      <div className="form-group">
        <label>Themes</label>
        <div className="checkbox-group">
          {['environment', 'health', 'education', 'transportation'].map((themeOption) => (
            <label key={themeOption} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.theme.includes(themeOption)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      theme: [...formData.theme, themeOption]
                    })
                  } else {
                    setFormData({
                      ...formData,
                      theme: formData.theme.filter(t => t !== themeOption)
                    })
                  }
                }}
              />
              {themeOption}
            </label>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={createDataset.isPending}
          className="submit-button"
        >
          {createDataset.isPending ? 'Creating...' : 'Create Dataset'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/datasets')}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>

      {createDataset.isError && (
        <div className="error-message">
          Error: {createDataset.error?.message}
        </div>
      )}
    </form>
  )
}
```

#### Edit Dataset Component

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useDataset, useUpdateDataset } from '@dkan-client-tools/react'
import { useParams, useNavigate } from 'react-router-dom'

export function EditDatasetForm() {
  const { datasetId } = useParams<{ datasetId: string }>()
  const navigate = useNavigate()
  const [isDirty, setIsDirty] = useState(false)

  const { data: dataset, isLoading } = useDataset({
    identifier: datasetId!,
    enabled: !!datasetId,
  })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
  })

  // Populate form when dataset loads
  useEffect(() => {
    if (dataset) {
      setFormData({
        title: dataset.title || '',
        description: dataset.description || '',
        keywords: dataset.keyword?.join(', ') || '',
      })
    }
  }, [dataset])

  const updateDataset = useUpdateDataset({
    onSuccess: () => {
      alert('Dataset updated successfully')
      setIsDirty(false)
      navigate(`/datasets/${datasetId}`)
    },
    onError: (error) => {
      alert(`Error updating dataset: ${error.message}`)
    },
  })

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (!datasetId) return

    const updates = {
      title: formData.title,
      description: formData.description,
      keyword: formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean),
      modified: new Date().toISOString().split('T')[0],
    }

    updateDataset.mutate({ identifier: datasetId, data: updates })
  }, [datasetId, formData, updateDataset])

  // Warn before leaving if form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  if (isLoading) {
    return <div className="loading">Loading dataset...</div>
  }

  if (!dataset) {
    return <div className="error">Dataset not found</div>
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => setIsDirty(true)}
      className="edit-dataset-form"
    >
      <h1>Edit Dataset</h1>

      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={5}
        />
      </div>

      <div className="form-group">
        <label htmlFor="keywords">Keywords</label>
        <input
          id="keywords"
          type="text"
          value={formData.keywords}
          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={updateDataset.isPending || !isDirty}
          className="submit-button"
        >
          {updateDataset.isPending ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isDirty && !confirm('Discard unsaved changes?')) {
              return
            }
            navigate(`/datasets/${datasetId}`)
          }}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>

      {isDirty && (
        <div className="info-message">You have unsaved changes</div>
      )}
    </form>
  )
}
```

---

### Workflow State Management

Component for changing dataset moderation state:

```typescript
import { useDataset, useChangeDatasetState } from '@dkan-client-tools/react'

export function DatasetWorkflowManager({ datasetId }: { datasetId: string }) {
  const { data: dataset } = useDataset({
    identifier: datasetId,
    enabled: !!datasetId,
  })

  const changeState = useChangeDatasetState({
    onSuccess: (_, variables) => {
      alert(`Dataset state changed to: ${variables.state}`)
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const handleStateChange = (newState: 'draft' | 'published' | 'archived') => {
    if (!confirm(`Change state to "${newState}"?`)) {
      return
    }

    changeState.mutate({
      identifier: datasetId,
      state: newState,
    })
  }

  if (!dataset) {
    return null
  }

  return (
    <div className="workflow-manager">
      <h3>Moderation State</h3>

      <div className="current-state">
        Current State: <strong>{dataset.moderationState || 'draft'}</strong>
      </div>

      <div className="state-actions">
        <button
          onClick={() => handleStateChange('draft')}
          disabled={changeState.isPending}
          className="state-button draft"
        >
          Set to Draft
        </button>
        <button
          onClick={() => handleStateChange('published')}
          disabled={changeState.isPending}
          className="state-button published"
        >
          Publish
        </button>
        <button
          onClick={() => handleStateChange('archived')}
          disabled={changeState.isPending}
          className="state-button archived"
        >
          Archive
        </button>
      </div>

      {changeState.isPending && (
        <div className="loading">Updating state...</div>
      )}
    </div>
  )
}
```

---

### Authentication Integration

Complete authentication example with protected routes:

```typescript
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '@dkan-client-tools/react'
import { Navigate } from 'react-router-dom'

interface AuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  client: DkanClient
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<string | null>(
    () => sessionStorage.getItem('dkan_credentials')
  )

  const client = new DkanClient({
    baseUrl: 'https://dkan.example.com',
    auth: credentials
      ? { type: 'basic', credentials }
      : undefined,
  })

  const login = useCallback(async (username: string, password: string) => {
    const creds = btoa(`${username}:${password}`)

    // Test credentials
    const testClient = new DkanClient({
      baseUrl: 'https://dkan.example.com',
      auth: { type: 'basic', credentials: creds },
    })

    try {
      await testClient.getAllDatasets({ limit: 1 })
      sessionStorage.setItem('dkan_credentials', creds)
      setCredentials(creds)
      return true
    } catch (error) {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('dkan_credentials')
    setCredentials(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!credentials,
        login,
        logout,
        client,
      }}
    >
      <DkanClientProvider client={client}>
        {children}
      </DkanClientProvider>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Login Component
export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(username, password)
      if (!success) {
        setError('Invalid username or password')
      }
    } catch (err) {
      setError('Login failed - please try again')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Login</h2>

      {error && <div className="error">{error}</div>}

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

// Protected Route Component
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

---

## References

- [React Hooks Documentation](https://react.dev/reference/react/hooks) - Official React Hooks reference
- [React Hooks API Reference](https://react.dev/reference/react) - Complete API documentation
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) - Official rules and explanations
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) - TypeScript patterns for React
- [TanStack Query Hooks](https://tanstack.com/query/latest/docs/framework/react/guides/queries) - React Query documentation
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Testing React components and hooks
- [Testing Hooks](https://testing-library.com/docs/react-testing-library/api#renderhook) - renderHook API reference
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) - ESLint plugin for Hook rules
