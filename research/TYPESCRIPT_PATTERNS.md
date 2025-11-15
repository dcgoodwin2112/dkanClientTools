# TypeScript Patterns Reference

Reference documentation for TypeScript patterns and best practices.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [React Hooks](./REACT_HOOKS.md)
- [Vue Composition API](./VUE_COMPOSITION_API.md)
- [Architecture](../docs/ARCHITECTURE.md)

## Quick Reference

**Strict Mode Essentials**:
- `strict: true` - Enable all strict checks
- `noImplicitAny` - Require explicit types
- `strictNullChecks` - null/undefined are distinct types

**Common Type Patterns**:
- Union: `string | number`
- Intersection: `TypeA & TypeB`
- Generic: `Array<T>`, `Promise<T>`
- Literal: `'success' | 'error'`

**Utility Types**:
- `Partial<T>` - All properties optional
- `Required<T>` - All properties required
- `Pick<T, K>` - Subset of properties
- `Omit<T, K>` - Exclude properties
- `Record<K, V>` - Object with key-value types

**Framework Patterns**:
- React: `FC<Props>`, `ReactNode`, `useState<T>`
- Vue: `Ref<T>`, `ComputedRef<T>`, `MaybeRefOrGetter<T>`

**Type Guards**:
- `typeof` - Primitive type checking
- `instanceof` - Class instance checking
- Custom predicates: `(x): x is Type`

---

## Table of Contents

- [Overview](#overview)
- [TypeScript Configuration](#typescript-configuration)
  - [Strict Mode and Compiler Options](#strict-mode-and-compiler-options)
  - [Module Resolution Strategies](#module-resolution-strategies)
  - [Path Mapping and Aliases](#path-mapping-and-aliases)
  - [Declaration File Generation](#declaration-file-generation)
  - [Source Map Configuration](#source-map-configuration)
  - [Project References for Monorepos](#project-references-for-monorepos)
- [Type System Fundamentals](#type-system-fundamentals)
  - [Primitive Types](#primitive-types)
  - [Type Literals and Literal Types](#type-literals-and-literal-types)
  - [Type Inference vs Annotations](#type-inference-vs-annotations)
  - [Union Types](#union-types)
  - [Intersection Types](#intersection-types)
  - [Type Narrowing and Type Guards](#type-narrowing-and-type-guards)
  - [Discriminated Unions](#discriminated-unions)
- [Advanced Type Patterns](#advanced-type-patterns)
  - [Generic Types and Constraints](#generic-types-and-constraints)
  - [Conditional Types](#conditional-types)
  - [Mapped Types](#mapped-types)
  - [Template Literal Types](#template-literal-types)
  - [Utility Types](#utility-types)
  - [infer Keyword](#infer-keyword)
- [Interface and Type Patterns](#interface-and-type-patterns)
  - [Interface vs Type Aliases](#interface-vs-type-aliases)
  - [Declaration Merging](#declaration-merging)
  - [Extending Interfaces](#extending-interfaces)
  - [Index Signatures](#index-signatures)
  - [Function Signatures and Overloads](#function-signatures-and-overloads)
  - [Optional and Readonly Modifiers](#optional-and-readonly-modifiers)
- [Module and Declaration Patterns](#module-and-declaration-patterns)
  - [ES Modules and Imports/Exports](#es-modules-and-importsexports)
  - [Module Augmentation](#module-augmentation)
  - [Ambient Declarations](#ambient-declarations)
  - [.d.ts Declaration Files](#dts-declaration-files)
  - [Namespace Patterns](#namespace-patterns)
  - [Triple-Slash Directives](#triple-slash-directives)
- [Framework-Specific Typing](#framework-specific-typing)
  - [React Component Types and Props](#react-component-types-and-props)
  - [React Hooks with Generics](#react-hooks-with-generics)
  - [Vue MaybeRefOrGetter and Ref Types](#vue-maybereforgetter-and-ref-types)
  - [TanStack Query Types](#tanstack-query-types)
- [Type Safety Best Practices](#type-safety-best-practices)
  - [Avoiding any and Using unknown](#avoiding-any-and-using-unknown)
  - [Type Guards and Assertion Functions](#type-guards-and-assertion-functions)
  - [Runtime Validation vs Compile-Time Types](#runtime-validation-vs-compile-time-types)
  - [Strict Null Checking](#strict-null-checking)
  - [Error Handling with Typed Errors](#error-handling-with-typed-errors)
  - [Never Type for Exhaustive Checks](#never-type-for-exhaustive-checks)
- [Patterns Used in This Project](#patterns-used-in-this-project)
  - [DCAT-US Schema Type Definitions](#dcat-us-schema-type-definitions)
  - [Frictionless Table Schema Types](#frictionless-table-schema-types)
  - [API Response Typing](#api-response-typing)
  - [Generic Hook/Composable Signatures](#generic-hookcomposable-signatures)
  - [Type-Safe Query Keys](#type-safe-query-keys)
  - [MaybeRefOrGetter Pattern (Vue)](#maybereforgetter-pattern-vue)
- [Common Patterns](#common-patterns)
  - [Builder Pattern with Types](#builder-pattern-with-types)
  - [Factory Functions with Generics](#factory-functions-with-generics)
  - [Branded Types for Type Safety](#branded-types-for-type-safety)
- [TypeScript with Testing](#typescript-with-testing)
- [Troubleshooting](#troubleshooting)
- [References](#references)

---

## Overview

TypeScript is a strongly typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing, classes, interfaces, and other features to enable better tooling and catch errors at compile time.

**Why TypeScript?**
- Catch errors before runtime with static type checking
- Superior IDE support with autocomplete and refactoring
- Self-documenting code through type annotations
- Safer refactoring across large codebases
- Better collaboration through explicit contracts
- Optional - can adopt gradually

**In This Project:**
- Strict mode enabled across all packages
- Type-first API design with comprehensive interfaces
- Generic hooks and composables for type safety
- Framework adapters with full TypeScript support (React, Vue)
- Declaration file generation for npm packages
- Monorepo with project references

---

## TypeScript Configuration

### Strict Mode and Compiler Options

**Project tsconfig.json (from @dkan-client-tools/core):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Key Options Explained:**

| Option | Value | Purpose |
|--------|-------|---------|
| `target` | ES2020 | Compile to ES2020 JavaScript |
| `module` | ESNext | Use latest ES module syntax |
| `lib` | ES2020, DOM | Include ES2020 and DOM type definitions |
| `moduleResolution` | bundler | Modern bundler resolution (Vite, tsup) |
| `strict` | true | Enable all strict type checking options |
| `declaration` | true | Generate .d.ts declaration files |
| `declarationMap` | true | Generate .d.ts.map for navigation |
| `sourceMap` | true | Generate .js.map for debugging |

**Strict Mode (enabled by `strict: true`):**
```typescript
// strict: true enables:
{
  "noImplicitAny": true,           // Error on implicit 'any'
  "strictNullChecks": true,        // null and undefined are distinct types
  "strictFunctionTypes": true,     // Strict function parameter checking
  "strictBindCallApply": true,     // Strict bind/call/apply
  "strictPropertyInitialization": true,  // Class properties must be initialized
  "noImplicitThis": true,          // Error on 'this' with implied 'any'
  "alwaysStrict": true             // Emit "use strict" in JS
}
```

---

### Module Resolution Strategies

**Bundler Resolution (Modern - Used in This Project):**
```typescript
// moduleResolution: "bundler"
// Works with Vite, esbuild, tsup - modern bundlers

import { DkanClient } from '@dkan-client-tools/core'  // Package imports
import { useDataset } from './useDataset'              // Relative imports
import type { Dataset } from './types'                 // Type-only imports
```

**Node Resolution (Classic):**
```typescript
// moduleResolution: "node"
// Traditional Node.js resolution

import { DkanClient } from '@dkan-client-tools/core/dist/index.js'  // Requires extension
```

**Comparison:**

| Resolution | Bundler | Node |
|------------|---------|------|
| Bare imports | ✅ Yes | ✅ Yes |
| Extension required | ❌ No | ✅ Yes (.js, .mjs) |
| Exports field support | ✅ Full | ⚠️ Partial |
| Performance | ✅ Fast | ⚠️ Slower |
| Use case | Modern bundlers | Node.js runtime |

---

### Path Mapping and Aliases

**Path Aliases in tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

**Usage:**
```typescript
// Without aliases
import { DkanClient } from '../../../../client/dkanClient'
import { Dataset } from '../../../../types'

// With aliases
import { DkanClient } from '@/client/dkanClient'
import { Dataset } from '@types/dataset'
```

**Note:** Path aliases require bundler configuration (Vite, tsup) to work at runtime.

---

### Declaration File Generation

**Declaration Files (.d.ts):**
```typescript
// src/index.ts (source)
export interface Dataset {
  identifier: string
  title: string
}

export function getDataset(id: string): Promise<Dataset> {
  // implementation
}

// dist/index.d.ts (generated)
export interface Dataset {
  identifier: string
  title: string
}

export declare function getDataset(id: string): Promise<Dataset>
```

**Declaration Maps (.d.ts.map):**
- Enable "Go to Definition" to jump to TypeScript source (not JS)
- Generated with `declarationMap: true`
- Improves developer experience for library consumers

**package.json exports:**
```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

---

### Source Map Configuration

**Source Maps for Debugging:**
```json
{
  "compilerOptions": {
    "sourceMap": true,         // Generate .js.map files
    "inlineSources": true,     // Include source code in map
    "inlineSourceMap": false   // Don't inline map in .js file
  }
}
```

**Why Source Maps:**
- Debug TypeScript code in browser DevTools
- See original line numbers in stack traces
- Navigate to TypeScript source from compiled JS

---

### Project References for Monorepos

**Root tsconfig.json:**
```json
{
  "files": [],
  "references": [
    { "path": "./packages/dkan-client-tools-core" },
    { "path": "./packages/dkan-client-tools-react" },
    { "path": "./packages/dkan-client-tools-vue" }
  ]
}
```

**Package tsconfig.json:**
```json
{
  "compilerOptions": {
    "composite": true,  // Enable project references
    "declaration": true
  },
  "references": [
    { "path": "../dkan-client-tools-core" }
  ]
}
```

**Benefits:**
- Faster incremental builds
- Enforce dependency constraints
- Better IDE performance in monorepos

---

## Type System Fundamentals

### Primitive Types

**Basic Types:**
```typescript
// String
const name: string = 'DKAN Dataset'
const template: string = `Title: ${name}`

// Number
const count: number = 42
const price: number = 19.99
const hex: number = 0xFF
const binary: number = 0b1010

// Boolean
const isPublic: boolean = true
const hasData: boolean = false

// null and undefined
const empty: null = null
const notDefined: undefined = undefined

// Symbol
const uniqueKey: symbol = Symbol('key')

// BigInt
const huge: bigint = 9007199254740991n
```

**Special Types:**
```typescript
// any - disables type checking (avoid!)
let anything: any = 'string'
anything = 42
anything = true
anything.nonExistent()  // No error!

// unknown - type-safe alternative to any
let something: unknown = 'string'
// something.length  // ❌ Error - must narrow type first

if (typeof something === 'string') {
  console.log(something.length)  // ✅ OK after type guard
}

// void - absence of return value
function log(message: string): void {
  console.log(message)
  // no return
}

// never - function never returns
function throwError(message: string): never {
  throw new Error(message)
}

function infiniteLoop(): never {
  while (true) {}
}
```

---

### Type Literals and Literal Types

**String Literals:**
```typescript
// From this project - DkanDataset interface
type AccessLevel = 'public' | 'restricted public' | 'non-public'

const level: AccessLevel = 'public'  // ✅ OK
// const invalid: AccessLevel = 'private'  // ❌ Error

// Use in interfaces
interface Dataset {
  identifier: string
  accessLevel: AccessLevel
}
```

**Numeric Literals:**
```typescript
type HttpSuccessCode = 200 | 201 | 204
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6

const code: HttpSuccessCode = 200  // ✅ OK
// const code: HttpSuccessCode = 404  // ❌ Error
```

**Boolean Literals:**
```typescript
type AlwaysTrue = true
type AlwaysFalse = false

// Useful for discriminated unions
interface Success {
  success: true
  data: any
}

interface Failure {
  success: false
  error: Error
}

type Result = Success | Failure
```

**Template Literal Types:**
```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type ApiEndpoint = `/api/${string}`

const endpoint: ApiEndpoint = '/api/datasets'  // ✅ OK
// const invalid: ApiEndpoint = '/datasets'  // ❌ Error

// Advanced template literals
type PropKey<T extends string> = `on${Capitalize<T>}`
type ClickHandler = PropKey<'click'>  // 'onClick'
```

---

### Type Inference vs Annotations

**Type Inference (Preferred):**
```typescript
// TypeScript infers types automatically
const count = 42                    // inferred as number
const name = 'Dataset'              // inferred as string
const items = [1, 2, 3]            // inferred as number[]
const dataset = { id: '1', title: 'Test' }  // inferred as { id: string; title: string }

// Function return type inference
function add(a: number, b: number) {
  return a + b  // inferred as number
}
```

**Explicit Annotations (When Needed):**
```typescript
// 1. When TypeScript can't infer correctly
let value: number | null = null
value = 42

// 2. For better documentation
function fetchDataset(id: string): Promise<Dataset> {
  return fetch(`/api/datasets/${id}`).then(r => r.json())
}

// 3. For empty arrays
const items: string[] = []

// 4. For complex types
const config: Record<string, unknown> = {}

// 5. For public APIs
export interface UseDatasetOptions {
  identifier: string
  enabled?: boolean
}
```

**Best Practice:**
- Let TypeScript infer when possible
- Add annotations for public APIs, function parameters, and complex types
- Avoid redundant annotations

---

### Union Types

**Basic Union:**
```typescript
// Variable can be multiple types
let id: string | number

id = 'abc-123'  // ✅ OK
id = 42         // ✅ OK
// id = true    // ❌ Error

// Function parameters
function printId(id: string | number) {
  console.log(`ID: ${id}`)
}

printId('abc')  // ✅ OK
printId(123)    // ✅ OK
```

**Union with Literals (from this project):**
```typescript
interface DkanDataset {
  identifier: string
  title: string
  accessLevel: 'public' | 'restricted public' | 'non-public'
}

const dataset: DkanDataset = {
  identifier: 'abc-123',
  title: 'My Dataset',
  accessLevel: 'public'  // Must be one of the three values
}
```

**Array Union:**
```typescript
// Array of numbers OR strings
const mixed: (number | string)[] = [1, 'two', 3, 'four']

// Array of numbers OR array of strings (not mixed)
const separate: number[] | string[] = [1, 2, 3]
```

**Function Union:**
```typescript
type StringCallback = (value: string) => void
type NumberCallback = (value: number) => void

type Callback = StringCallback | NumberCallback

const handler: Callback = (value) => {
  // value is string | number
  console.log(value)
}
```

---

### Intersection Types

**Combining Types:**
```typescript
interface Person {
  name: string
  age: number
}

interface Employee {
  employeeId: string
  department: string
}

// Intersection - has ALL properties
type EmployeePerson = Person & Employee

const employee: EmployeePerson = {
  name: 'John',
  age: 30,
  employeeId: 'E123',
  department: 'Engineering'
}
```

**Merging Interfaces:**
```typescript
interface Timestamped {
  createdAt: string
  updatedAt: string
}

interface Identifiable {
  id: string
}

// Combine utility interfaces
type Entity = Timestamped & Identifiable

interface Dataset extends Entity {
  title: string
  description: string
}
```

**Union vs Intersection:**
```typescript
// Union - can be A OR B
type A = { x: number }
type B = { y: number }
type AorB = A | B

const value: AorB = { x: 1 }  // ✅ OK
const value: AorB = { y: 2 }  // ✅ OK
const value: AorB = { x: 1, y: 2 }  // ✅ OK

// Intersection - must be A AND B
type AandB = A & B

const value: AandB = { x: 1 }  // ❌ Missing y
const value: AandB = { y: 2 }  // ❌ Missing x
const value: AandB = { x: 1, y: 2 }  // ✅ OK
```

---

### Type Narrowing and Type Guards

**typeof Type Guards:**
```typescript
function padLeft(value: string, padding: string | number) {
  if (typeof padding === 'number') {
    // padding is number here
    return ' '.repeat(padding) + value
  }
  // padding is string here
  return padding + value
}
```

**instanceof Type Guards:**
```typescript
class ApiError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

function handleError(error: Error | ApiError) {
  if (error instanceof ApiError) {
    // error is ApiError here
    console.log(`API Error ${error.statusCode}: ${error.message}`)
  } else {
    // error is Error here
    console.log(`Error: ${error.message}`)
  }
}
```

**in Type Guards:**
```typescript
interface Circle {
  kind: 'circle'
  radius: number
}

interface Square {
  kind: 'square'
  sideLength: number
}

type Shape = Circle | Square

function getArea(shape: Shape) {
  if ('radius' in shape) {
    // shape is Circle
    return Math.PI * shape.radius ** 2
  }
  // shape is Square
  return shape.sideLength ** 2
}
```

**Custom Type Guards:**
```typescript
// Type predicate: value is Type
function isDataset(value: unknown): value is Dataset {
  return (
    typeof value === 'object' &&
    value !== null &&
    'identifier' in value &&
    'title' in value
  )
}

function processData(data: unknown) {
  if (isDataset(data)) {
    // data is Dataset here
    console.log(data.title)
  }
}
```

**Truthiness Narrowing:**
```typescript
function printName(name: string | null | undefined) {
  if (name) {
    // name is string here (null and undefined are falsy)
    console.log(name.toUpperCase())
  }
}
```

**Equality Narrowing:**
```typescript
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // x and y are both string here
    console.log(x.toUpperCase())
    console.log(y.toLowerCase())
  }
}
```

---

### Discriminated Unions

**Tagged Union Pattern:**
```typescript
// Common in this project for async state
interface Idle {
  status: 'idle'
}

interface Loading {
  status: 'loading'
}

interface Success<T> {
  status: 'success'
  data: T
}

interface Failure {
  status: 'error'
  error: Error
}

type AsyncState<T> = Idle | Loading | Success<T> | Failure

// Type narrowing with discriminant
function render(state: AsyncState<Dataset>) {
  switch (state.status) {
    case 'idle':
      return 'Not started'

    case 'loading':
      return 'Loading...'

    case 'success':
      // state.data is available and typed as Dataset
      return `Dataset: ${state.data.title}`

    case 'error':
      // state.error is available and typed as Error
      return `Error: ${state.error.message}`

    default:
      // Exhaustiveness check
      const _exhaustive: never = state
      return _exhaustive
  }
}
```

**Benefits:**
- Exhaustive checking at compile time
- Type-safe state management
- No invalid combinations (e.g., status: 'success' without data)

---

## Advanced Type Patterns

### Generic Types and Constraints

**Basic Generics:**
```typescript
// Generic function
function identity<T>(value: T): T {
  return value
}

const num = identity(42)        // T is number
const str = identity('hello')   // T is string

// Generic interface (from this project)
interface DkanApiResponse<T> {
  data: T
  status?: number
  statusText?: string
}

const response: DkanApiResponse<Dataset> = {
  data: { identifier: 'abc', title: 'Test' },
  status: 200
}
```

**Multiple Type Parameters:**
```typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second]
}

const result = pair('key', 123)  // [string, number]
```

**Generic Constraints:**
```typescript
// Constrain T to have an id property
interface Identifiable {
  id: string
}

function logId<T extends Identifiable>(item: T): void {
  console.log(item.id)  // OK - T must have id
}

logId({ id: '123', name: 'Test' })  // ✅ OK
// logId({ name: 'Test' })  // ❌ Error - no id
```

**Generic Constraints with keyof:**
```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const dataset = { identifier: 'abc', title: 'Test' }
const id = getProperty(dataset, 'identifier')  // string
// getProperty(dataset, 'invalid')  // ❌ Error
```

**Generic Classes:**
```typescript
class DataStore<T> {
  private items: T[] = []

  add(item: T): void {
    this.items.push(item)
  }

  get(index: number): T | undefined {
    return this.items[index]
  }

  all(): readonly T[] {
    return this.items
  }
}

const datasets = new DataStore<Dataset>()
datasets.add({ identifier: 'abc', title: 'Test' })
```

**Default Type Parameters:**
```typescript
interface UseQueryOptions<TData = unknown, TError = Error> {
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
}

// Use with defaults
const options1: UseQueryOptions = {
  onSuccess: (data) => console.log(data)  // data is unknown
}

// Override defaults
const options2: UseQueryOptions<Dataset, ApiError> = {
  onSuccess: (data) => console.log(data.title),  // data is Dataset
  onError: (error) => console.log(error.statusCode)  // error is ApiError
}
```

---

### Conditional Types

**Basic Conditional:**
```typescript
type IsString<T> = T extends string ? true : false

type A = IsString<string>   // true
type B = IsString<number>   // false
```

**Practical Example:**
```typescript
type NonNullable<T> = T extends null | undefined ? never : T

type A = NonNullable<string | null>  // string
type B = NonNullable<number | undefined>  // number
```

**Conditional with infer:**
```typescript
// Extract return type of function
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never

function getDataset(): Promise<Dataset> { /* ... */ }

type DatasetType = ReturnType<typeof getDataset>  // Promise<Dataset>
```

**Distributive Conditional Types:**
```typescript
type ToArray<T> = T extends any ? T[] : never

type A = ToArray<string | number>  // string[] | number[]
// Distributes over union: ToArray<string> | ToArray<number>

// Non-distributive (wrap in tuple)
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never

type B = ToArrayNonDist<string | number>  // (string | number)[]
```

---

### Mapped Types

**Basic Mapped Type:**
```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

interface Dataset {
  identifier: string
  title: string
}

type ReadonlyDataset = Readonly<Dataset>
// { readonly identifier: string; readonly title: string }
```

**Adding/Removing Modifiers:**
```typescript
// Add optional
type Partial<T> = {
  [P in keyof T]?: T[P]
}

// Remove optional
type Required<T> = {
  [P in keyof T]-?: T[P]
}

// Remove readonly
type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
```

**Mapped Type with Conditional:**
```typescript
// Make all properties nullable
type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

// Pick only string properties
type StringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}

interface Dataset {
  identifier: string
  title: string
  count: number
}

type DatasetStrings = StringProps<Dataset>
// { identifier: string; title: string }
```

---

### Template Literal Types

**Basic Template Literals:**
```typescript
type World = 'world'
type Greeting = `hello ${World}`  // 'hello world'

type HttpMethod = 'GET' | 'POST'
type Path = '/api' | '/admin'
type ApiRoute = `${HttpMethod} ${Path}`
// 'GET /api' | 'GET /admin' | 'POST /api' | 'POST /admin'
```

**String Manipulation:**
```typescript
type Uppercase<S extends string> = ...  // Built-in
type Lowercase<S extends string> = ...  // Built-in
type Capitalize<S extends string> = ... // Built-in
type Uncapitalize<S extends string> = ... // Built-in

type Name = 'dataset'
type CapitalName = Capitalize<Name>  // 'Dataset'
type UpperName = Uppercase<Name>     // 'DATASET'
```

**Event Handler Pattern:**
```typescript
type EventName = 'click' | 'focus' | 'blur'
type EventHandler<E extends EventName> = `on${Capitalize<E>}`

type ClickHandler = EventHandler<'click'>  // 'onClick'
type FocusHandler = EventHandler<'focus'>  // 'onFocus'

// Generate handler types
type Handlers = {
  [E in EventName as EventHandler<E>]: (event: Event) => void
}
// { onClick: (event: Event) => void; onFocus: ...; onBlur: ... }
```

---

### Utility Types

**Partial<T> - Make All Properties Optional:**
```typescript
interface Dataset {
  identifier: string
  title: string
  description: string
}

type PartialDataset = Partial<Dataset>
// { identifier?: string; title?: string; description?: string }

function updateDataset(id: string, updates: Partial<Dataset>) {
  // Can pass any combination of properties
}

updateDataset('abc', { title: 'New Title' })  // ✅ OK
```

**Required<T> - Make All Properties Required:**
```typescript
interface Config {
  host?: string
  port?: number
}

type RequiredConfig = Required<Config>
// { host: string; port: number }
```

**Readonly<T> - Make All Properties Readonly:**
```typescript
const dataset: Readonly<Dataset> = {
  identifier: 'abc',
  title: 'Test'
}

// dataset.title = 'New'  // ❌ Error - readonly
```

**Pick<T, Keys> - Select Properties:**
```typescript
interface Dataset {
  identifier: string
  title: string
  description: string
  metadata: object
}

type DatasetPreview = Pick<Dataset, 'identifier' | 'title'>
// { identifier: string; title: string }
```

**Omit<T, Keys> - Exclude Properties:**
```typescript
type DatasetWithoutMetadata = Omit<Dataset, 'metadata'>
// { identifier: string; title: string; description: string }
```

**Record<Keys, Type> - Object with Specific Keys:**
```typescript
type Role = 'admin' | 'user' | 'guest'
type Permissions = Record<Role, string[]>
// { admin: string[]; user: string[]; guest: string[] }

const permissions: Permissions = {
  admin: ['read', 'write', 'delete'],
  user: ['read', 'write'],
  guest: ['read']
}
```

**Exclude<Union, ExcludedMembers> - Remove from Union:**
```typescript
type AllLevels = 'public' | 'restricted public' | 'non-public' | 'private'
type DkanLevel = Exclude<AllLevels, 'private'>
// 'public' | 'restricted public' | 'non-public'
```

**Extract<Union, ExtractedMembers> - Keep Only:**
```typescript
type PublicLevels = Extract<AllLevels, 'public' | 'restricted public'>
// 'public' | 'restricted public'
```

**ReturnType<T> - Extract Function Return Type:**
```typescript
function getDataset(id: string): Promise<Dataset> {
  return fetch(`/api/datasets/${id}`).then(r => r.json())
}

type DatasetResult = ReturnType<typeof getDataset>
// Promise<Dataset>
```

**Parameters<T> - Extract Function Parameters:**
```typescript
type GetDatasetParams = Parameters<typeof getDataset>
// [id: string]

function logParams(...args: Parameters<typeof getDataset>) {
  console.log(args)
}
```

**Awaited<T> - Unwrap Promise:**
```typescript
type Dataset = Awaited<Promise<{ id: string }>>
// { id: string }

type NestedDataset = Awaited<Promise<Promise<Dataset>>>
// Dataset (unwraps all levels)
```

---

### infer Keyword

**Extracting Types with infer:**
```typescript
// Extract array element type
type ArrayElement<T> = T extends (infer E)[] ? E : never

type StringArray = string[]
type Element = ArrayElement<StringArray>  // string

// Extract Promise resolved type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

type Resolved = UnwrapPromise<Promise<Dataset>>  // Dataset

// Extract function return type
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never

function fetchData(): Promise<Dataset> { /* ... */ }
type FetchResult = GetReturnType<typeof fetchData>  // Promise<Dataset>

// Extract function parameters
type GetParameters<T> = T extends (...args: infer P) => any ? P : never

type Params = GetParameters<typeof fetchData>  // []
```

**Complex infer Example:**
```typescript
// Extract nested property type
type GetProperty<T, K> = K extends `${infer First}.${infer Rest}`
  ? First extends keyof T
    ? GetProperty<T[First], Rest>
    : never
  : K extends keyof T
  ? T[K]
  : never

interface Dataset {
  publisher: {
    name: string
    contact: {
      email: string
    }
  }
}

type PublisherName = GetProperty<Dataset, 'publisher.name'>  // string
type ContactEmail = GetProperty<Dataset, 'publisher.contact.email'>  // string
```

---

## Interface and Type Patterns

### Interface vs Type Aliases

**Comparison Table:**

| Feature | Interface | Type Alias |
|---------|-----------|------------|
| Object shapes | ✅ Yes | ✅ Yes |
| Primitives/unions | ❌ No | ✅ Yes |
| Tuples | ✅ Yes | ✅ Yes (better) |
| Functions | ✅ Yes | ✅ Yes |
| Declaration merging | ✅ Yes | ❌ No |
| Extends/implements | ✅ Yes | ⚠️ Limited |
| Intersection | ⚠️ extends | ✅ & operator |
| Computed properties | ❌ No | ✅ Yes |
| Performance (large codebases) | ✅ Better | ⚠️ Slower |

**When to Use Interface:**
```typescript
// ✅ Object shapes - prefer interface
interface Dataset {
  identifier: string
  title: string
}

// ✅ Declaration merging (libraries)
interface Window {
  myCustomProperty: string
}

// ✅ Extending other interfaces
interface DkanDataset extends Dataset {
  publisher: Publisher
}

// ✅ Class contracts
class DatasetService implements Dataset {
  identifier: string
  title: string
}
```

**When to Use Type Alias:**
```typescript
// ✅ Union types
type ID = string | number

// ✅ Intersection types
type Entity = Timestamped & Identifiable

// ✅ Tuples
type Point = [number, number]

// ✅ Mapped types
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

// ✅ Conditional types
type NonNullable<T> = T extends null | undefined ? never : T

// ✅ Template literal types
type EventHandler = `on${string}`
```

**Both Work for Objects:**
```typescript
// Interface
interface Dataset {
  identifier: string
  title: string
}

// Type alias - same thing
type Dataset = {
  identifier: string
  title: string
}
```

**Project Convention:**
- Use **interface** for object shapes (Dataset, Publisher, etc.)
- Use **type** for unions, intersections, mapped types, utilities

---

### Declaration Merging

**Interface Merging:**
```typescript
interface Dataset {
  identifier: string
  title: string
}

// Same interface name - declarations merge
interface Dataset {
  description: string
}

// Result: merged interface
const dataset: Dataset = {
  identifier: 'abc',
  title: 'Test',
  description: 'Merged!'
}
```

**Module Augmentation:**
```typescript
// Extend external module types
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError  // Custom error type
  }
}
```

**Global Augmentation:**
```typescript
// Add to global scope
declare global {
  interface Window {
    dkanClient: DkanClient
  }
}

// Now available
window.dkanClient = new DkanClient(/* ... */)
```

**Type Aliases Don't Merge:**
```typescript
type Dataset = {
  identifier: string
}

// ❌ Error - duplicate identifier
type Dataset = {
  title: string
}
```

---

### Extending Interfaces

**Basic Extension:**
```typescript
interface Identifiable {
  identifier: string
}

interface Timestamped {
  created: string
  modified: string
}

// Extend single interface
interface Dataset extends Identifiable {
  title: string
  description: string
}

// Extend multiple interfaces
interface ManagedDataset extends Identifiable, Timestamped {
  title: string
}
```

**From This Project:**
```typescript
interface Publisher {
  name: string
  '@type'?: string
  subOrganizationOf?: Publisher  // Recursive type
}

interface ContactPoint {
  '@type': string
  fn: string
  hasEmail: string
}

interface DkanDataset extends Identifiable {
  title: string
  description: string
  publisher: Publisher
  contactPoint: ContactPoint
  distribution?: Distribution[]
}
```

**Overriding Properties:**
```typescript
interface Base {
  id: string | number
  timestamp: string
}

// Make id more specific
interface Strict extends Omit<Base, 'id'> {
  id: string  // Only string now
}
```

---

### Index Signatures

**Basic Index Signature:**
```typescript
interface StringMap {
  [key: string]: string
}

const map: StringMap = {
  name: 'John',
  role: 'Developer'
}

map.newKey = 'value'  // ✅ OK - any string key allowed
```

**From This Project (DkanDataset):**
```typescript
export interface DkanDataset {
  identifier: string
  title: string
  description: string
  // ... known properties

  [key: string]: any  // Allow additional properties
}

// Allows custom/extension fields
const dataset: DkanDataset = {
  identifier: 'abc',
  title: 'Test',
  customField: 'value'  // ✅ OK
}
```

**Typed Index Signature:**
```typescript
interface NumericMap {
  [key: string]: number
}

const scores: NumericMap = {
  math: 95,
  english: 87
}

// scores.invalid = 'text'  // ❌ Error - must be number
```

**Named Index Signature:**
```typescript
interface Dictionary<T> {
  [index: string]: T
}

const names: Dictionary<string> = {
  first: 'John',
  last: 'Doe'
}
```

**Mixed Properties:**
```typescript
interface Config {
  host: string      // Known property
  port: number      // Known property
  [key: string]: string | number  // Index signature must include known types
}

const config: Config = {
  host: 'localhost',
  port: 3000,
  timeout: 5000,    // ✅ OK - additional number property
  mode: 'production'  // ✅ OK - additional string property
}
```

---

### Function Signatures and Overloads

**Function Signatures:**
```typescript
// Function type
type Greeter = (name: string) => string

const greet: Greeter = (name) => `Hello, ${name}`

// Interface with call signature
interface Callable {
  (x: number): number
}

const double: Callable = (x) => x * 2
```

**Function Overloads:**
```typescript
// Overload signatures
function getValue(key: 'count'): number
function getValue(key: 'name'): string
function getValue(key: 'items'): string[]

// Implementation signature (not visible to users)
function getValue(key: string): unknown {
  const data = { count: 42, name: 'Test', items: ['a', 'b'] }
  return data[key as keyof typeof data]
}

// Type-safe usage
const count = getValue('count')    // number
const name = getValue('name')      // string
const items = getValue('items')    // string[]
```

**Constructor Overloads:**
```typescript
class DkanClient {
  constructor(baseUrl: string)
  constructor(options: DkanClientOptions)
  constructor(arg: string | DkanClientOptions) {
    // Implementation
  }
}

const client1 = new DkanClient('https://dkan.example.com')
const client2 = new DkanClient({ baseUrl: 'https://dkan.example.com' })
```

---

### Optional and Readonly Modifiers

**Optional Properties:**
```typescript
interface Dataset {
  identifier: string       // Required
  title: string           // Required
  description?: string    // Optional
  metadata?: object       // Optional
}

const dataset: Dataset = {
  identifier: 'abc',
  title: 'Test'
  // description and metadata can be omitted
}
```

**Readonly Properties:**
```typescript
interface Config {
  readonly apiUrl: string
  readonly timeout: number
}

const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
}

// config.apiUrl = 'new-url'  // ❌ Error - readonly
```

**Readonly Arrays:**
```typescript
interface Dataset {
  identifier: string
  readonly tags: readonly string[]
}

const dataset: Dataset = {
  identifier: 'abc',
  tags: ['health', 'covid']
}

// dataset.tags.push('new')  // ❌ Error - readonly array
// dataset.tags = []  // ❌ Error - readonly property
```

**const vs readonly:**
```typescript
// const - variable binding is immutable
const x = 10
// x = 20  // ❌ Error

// readonly - property is immutable
interface Point {
  readonly x: number
  readonly y: number
}

const point: Point = { x: 10, y: 20 }
// point.x = 30  // ❌ Error
point = { x: 30, y: 40 }  // ✅ OK - point binding is mutable
```

---

## Module and Declaration Patterns

### ES Modules and Imports/Exports

**Named Exports:**
```typescript
// dataset.ts
export interface Dataset {
  identifier: string
  title: string
}

export function getDataset(id: string): Promise<Dataset> {
  // ...
}

export const API_VERSION = '1.0'

// Import
import { Dataset, getDataset, API_VERSION } from './dataset'
```

**Default Export:**
```typescript
// DkanClient.ts
export default class DkanClient {
  // ...
}

// Import
import DkanClient from './DkanClient'

// Can name it anything
import Client from './DkanClient'
```

**Type-Only Imports/Exports:**
```typescript
// Explicitly import only types (no runtime code)
import type { Dataset } from './types'
import { type Dataset, getDataset } from './dataset'

// Export types
export type { Dataset } from './types'
```

**Re-Exports:**
```typescript
// index.ts - barrel file
export * from './client'
export * from './types'
export { default as DkanClient } from './DkanClient'

// Import from barrel
import { Dataset, getDataset, DkanClient } from '@dkan-client-tools/core'
```

---

### Module Augmentation

**Augmenting External Modules:**
```typescript
// Add types to external library
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
    queryMeta: {
      description?: string
    }
  }
}

// Now available in TanStack Query types
```

**Augmenting Global:**
```typescript
declare global {
  interface Window {
    dkanClient: DkanClient
    __DEV__: boolean
  }

  namespace NodeJS {
    interface ProcessEnv {
      DKAN_API_URL: string
      NODE_ENV: 'development' | 'production'
    }
  }
}

// Usage
window.dkanClient = new DkanClient()
const apiUrl = process.env.DKAN_API_URL
```

---

### Ambient Declarations

**Declare External Libraries:**
```typescript
// types/custom.d.ts

// Declare module without types
declare module 'untyped-library' {
  export function doSomething(): void
}

// Declare global variable
declare const VERSION: string
declare const __DEV__: boolean

// Declare global function
declare function gtag(...args: any[]): void
```

**Project-Specific Ambient:**
```typescript
// Allow importing JSON files
declare module '*.json' {
  const value: any
  export default value
}

// Allow importing CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}
```

---

### .d.ts Declaration Files

**Creating Declaration Files:**
```typescript
// index.d.ts - manually written
export interface Dataset {
  identifier: string
  title: string
}

export function getDataset(id: string): Promise<Dataset>

export class DkanClient {
  constructor(options: DkanClientOptions)
  getDataset(id: string): Promise<Dataset>
}
```

**Generated Declaration Files:**
```typescript
// source.ts
export interface Dataset {
  identifier: string
  title: string
}

export function getDataset(id: string): Promise<Dataset> {
  return fetch(`/api/datasets/${id}`).then(r => r.json())
}

// Generated source.d.ts (with declaration: true)
export interface Dataset {
  identifier: string
  title: string
}

export declare function getDataset(id: string): Promise<Dataset>
```

**Declaration Maps:**
```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true  // Generate .d.ts.map
  }
}
```

Benefits:
- Jump to TypeScript source (not JS) in IDE
- Better debugging experience

---

### Namespace Patterns

**Classic Namespace (Avoid in Modern Code):**
```typescript
namespace MyLib {
  export interface Dataset {
    id: string
  }

  export function getDataset(id: string): Dataset {
    return { id }
  }
}

// Usage
const dataset = MyLib.getDataset('abc')
```

**Modern Alternative (ES Modules):**
```typescript
// mylib.ts
export interface Dataset {
  id: string
}

export function getDataset(id: string): Dataset {
  return { id }
}

// Import as namespace
import * as MyLib from './mylib'

const dataset = MyLib.getDataset('abc')
```

**When to Use Namespaces:**
- Ambient declarations for legacy libraries
- Organizing types in .d.ts files
- Global type definitions

---

### Triple-Slash Directives

**Reference Types:**
```typescript
/// <reference types="node" />

// Now have access to Node.js types
const buffer: Buffer = Buffer.from('hello')
```

**Reference Path:**
```typescript
/// <reference path="./custom-types.d.ts" />

// Include types from specific file
```

**Reference Library:**
```typescript
/// <reference lib="dom" />
/// <reference lib="es2020" />

// Include specific lib types
```

**Note:** Triple-slash directives are less common in modern TypeScript. Prefer:
- `import type` for explicit dependencies
- `tsconfig.json` `types` and `lib` options

---

## Framework-Specific Typing

TypeScript integration patterns for React and Vue frameworks used in this project. For React-specific typing patterns, see [React Hooks](./REACT_HOOKS.md). For Vue patterns, see [Vue Composition API](./VUE_COMPOSITION_API.md).

### React Component Types and Props

**Function Component Types:**
```typescript
import { type FC, type ReactNode } from 'react'

// Method 1: FC (FunctionComponent) type
const Button: FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>
}

// Method 2: Explicit return type (preferred)
interface ButtonProps {
  label: string
  onClick: () => void
  children?: ReactNode
}

function Button({ label, onClick, children }: ButtonProps): JSX.Element {
  return <button onClick={onClick}>{label}{children}</button>
}

// Method 3: Inline props (simple components)
function Button({ label }: { label: string }) {
  return <button>{label}</button>
}
```

**Props with Children:**
```typescript
import { type ReactNode } from 'react'

interface ContainerProps {
  title: string
  children: ReactNode  // or React.ReactNode
}

function Container({ title, children }: ContainerProps) {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}
```

**Event Handlers:**
```typescript
import { type MouseEvent, type ChangeEvent } from 'react'

interface FormProps {
  onSubmit: (data: FormData) => void
}

function Form({ onSubmit }: FormProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value)
  }

  return (
    <form>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  )
}
```

**Generic Components:**
```typescript
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

// Usage - T is inferred
<List items={datasets} renderItem={(d) => <div>{d.title}</div>} />
```

---

### React Hooks with Generics

**useState:**
```typescript
import { useState } from 'react'

// Type inference
const [count, setCount] = useState(0)  // number

// Explicit type (when initial value is null/undefined)
const [dataset, setDataset] = useState<Dataset | null>(null)

// Union type
const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
```

**useRef:**
```typescript
import { useRef, type RefObject } from 'react'

// DOM ref
const inputRef = useRef<HTMLInputElement>(null)

// Mutable value ref
const countRef = useRef<number>(0)

// Effect
useEffect(() => {
  inputRef.current?.focus()
  countRef.current++
}, [])
```

**useCallback and useMemo:**
```typescript
import { useCallback, useMemo } from 'react'

// useCallback - inferred from function
const handleClick = useCallback((id: string) => {
  console.log(id)
}, [])

// useMemo - inferred from return value
const filtered = useMemo(() => {
  return items.filter(item => item.active)
}, [items])

// Explicit type (rarely needed)
const computed = useMemo<ComplexType>(() => {
  return complexCalculation()
}, [])
```

**Custom Hooks:**
```typescript
interface UseDatasetOptions {
  identifier: string
  enabled?: boolean
}

interface UseDatasetResult {
  data: Dataset | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

function useDataset(options: UseDatasetOptions): UseDatasetResult {
  const [data, setData] = useState<Dataset | undefined>()
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // ... implementation

  return { data, isLoading, error, refetch }
}
```

---

### Vue MaybeRefOrGetter and Ref Types

**Vue Ref Types:**
```typescript
import { ref, computed, type Ref, type ComputedRef } from 'vue'

// Ref<T> - mutable reactive reference
const count: Ref<number> = ref(0)
const message: Ref<string> = ref('Hello')

// ComputedRef<T> - readonly computed
const doubled: ComputedRef<number> = computed(() => count.value * 2)

// Usually inferred
const count = ref(0)  // Ref<number>
const doubled = computed(() => count.value * 2)  // ComputedRef<number>
```

**MaybeRef and MaybeRefOrGetter:**
```typescript
import { type MaybeRef, type MaybeRefOrGetter, toValue } from 'vue'

// MaybeRef<T> - plain value OR ref
type MaybeRef<T> = T | Ref<T>

// MaybeRefOrGetter<T> - plain value, ref, OR getter
type MaybeRefOrGetter<T> = T | Ref<T> | ComputedRef<T> | (() => T)

// Used in composables for flexibility
interface UseDatasetOptions {
  identifier: MaybeRefOrGetter<string>
  enabled?: MaybeRefOrGetter<boolean>
}

function useDataset(options: UseDatasetOptions) {
  // toValue() normalizes to plain value
  const id = toValue(options.identifier)
  const isEnabled = toValue(options.enabled)

  // ...
}
```

**Component Props in Vue:**
```typescript
// <script setup lang="ts">
import { type PropType } from 'vue'

// Method 1: Type-only props (recommended)
const props = defineProps<{
  title: string
  count?: number
  items?: string[]
}>()

// Method 2: Runtime props with types
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array as PropType<string[]>,
    default: () => []
  }
})

// Method 3: With defaults (type-only + defaults)
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})
```

**Emits in Vue:**
```typescript
// Type-only emits (recommended)
const emit = defineEmits<{
  update: [id: string, value: number]
  delete: [id: string]
  change: []  // No payload
}>()

// Usage - type-safe
emit('update', 'abc', 42)
emit('delete', 'abc')
emit('change')
```

---

### TanStack Query Types

**Query Types:**
```typescript
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
// or from '@tanstack/vue-query'

// Query result is typed
const { data, isLoading, error }: UseQueryResult<Dataset, Error> = useQuery({
  queryKey: ['dataset', id],
  queryFn: () => fetchDataset(id)
})

// data is Dataset | undefined
// error is Error | null
```

**Generic Query Hooks:**
```typescript
import { useQuery } from '@tanstack/react-query'

interface UseDatasetOptions {
  identifier: string
  enabled?: boolean
}

function useDataset(options: UseDatasetOptions) {
  return useQuery({
    queryKey: ['dataset', options.identifier],
    queryFn: () => fetchDataset(options.identifier),
    enabled: options.enabled
  })
}

// Return type inferred as UseQueryResult<Dataset, Error>
```

**Mutation Types:**
```typescript
import { useMutation, type UseMutationResult } from '@tanstack/react-query'

interface CreateDatasetInput {
  title: string
  description: string
}

const mutation: UseMutationResult<
  Dataset,              // Success data type
  Error,                // Error type
  CreateDatasetInput    // Variables type
> = useMutation({
  mutationFn: (input: CreateDatasetInput) => createDataset(input)
})

// mutation.mutate({ title: 'Test', description: 'Desc' })
// mutation.data is Dataset | undefined
```

---

## Type Safety Best Practices

### Avoiding any and Using unknown

**The Problem with any:**
```typescript
// ❌ Bad - any disables all type checking
function processData(data: any) {
  data.foo()          // No error - might crash at runtime
  data.bar.baz()      // No error - might crash
  return data + 10    // No error - might be wrong
}
```

**Use unknown Instead:**
```typescript
// ✅ Good - unknown requires type checking
function processData(data: unknown) {
  // data.foo()  // ❌ Error - must check type first

  if (typeof data === 'object' && data !== null && 'foo' in data) {
    // Now safe to access
    const obj = data as { foo: () => void }
    obj.foo()
  }
}
```

**When any is Acceptable:**
```typescript
// 1. Truly dynamic data (use sparingly)
const dynamicConfig: Record<string, any> = JSON.parse(configString)

// 2. Console logging
function debug(...args: any[]) {
  console.log(...args)
}

// 3. Migrating from JavaScript (temporary)
// TODO: Add proper types
const legacyData: any = oldFunction()
```

**Prefer unknown:**
```typescript
// ✅ Type-safe API response
async function fetchData(url: string): Promise<unknown> {
  const response = await fetch(url)
  return response.json()
}

const data = await fetchData('/api/dataset')

// Must validate before use
if (isDataset(data)) {
  console.log(data.title)  // Type-safe
}
```

---

### Type Guards and Assertion Functions

**typeof Type Guards:**
```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function processValue(value: unknown) {
  if (isString(value)) {
    // value is string
    console.log(value.toUpperCase())
  }
}
```

**instanceof Type Guards:**
```typescript
class ApiError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

function handleError(error: unknown) {
  if (error instanceof ApiError) {
    console.log(`API Error ${error.statusCode}`)
  } else if (error instanceof Error) {
    console.log(`Error: ${error.message}`)
  }
}
```

**Custom Type Guards:**
```typescript
interface Dataset {
  identifier: string
  title: string
}

function isDataset(value: unknown): value is Dataset {
  return (
    typeof value === 'object' &&
    value !== null &&
    'identifier' in value &&
    typeof value.identifier === 'string' &&
    'title' in value &&
    typeof value.title === 'string'
  )
}

// Usage
const data: unknown = await fetchData()
if (isDataset(data)) {
  console.log(data.title)  // Type-safe
}
```

**Assertion Functions (asserts):**
```typescript
function assertIsDataset(value: unknown): asserts value is Dataset {
  if (!isDataset(value)) {
    throw new Error('Value is not a Dataset')
  }
}

// Usage
const data: unknown = await fetchData()
assertIsDataset(data)
// After this line, data is typed as Dataset
console.log(data.title)  // No if needed!
```

**Array Type Guards:**
```typescript
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

const data: unknown = ['a', 'b', 'c']
if (isStringArray(data)) {
  data.forEach(str => console.log(str.toUpperCase()))
}
```

---

### Runtime Validation vs Compile-Time Types

**The Gap:**
```typescript
// TypeScript types only exist at compile time
interface Dataset {
  identifier: string
  title: string
}

// At runtime, this could be anything!
const data: Dataset = await response.json()
// TypeScript trusts you, but data might be wrong
```

**Runtime Validation (Recommended):**
```typescript
// Option 1: Manual validation
function validateDataset(data: unknown): Dataset {
  if (
    typeof data === 'object' &&
    data !== null &&
    'identifier' in data &&
    typeof data.identifier === 'string' &&
    'title' in data &&
    typeof data.title === 'string'
  ) {
    return data as Dataset
  }
  throw new Error('Invalid dataset')
}

// Option 2: Zod (schema validation library)
import { z } from 'zod'

const DatasetSchema = z.object({
  identifier: z.string(),
  title: z.string(),
  description: z.string(),
  accessLevel: z.enum(['public', 'restricted public', 'non-public'])
})

type Dataset = z.infer<typeof DatasetSchema>

// Runtime validation
const data: Dataset = DatasetSchema.parse(unknownData)
```

**Type-Runtime Sync:**
```typescript
// Define schema
const DatasetSchema = z.object({
  identifier: z.string(),
  title: z.string()
})

// Derive type from schema (single source of truth)
type Dataset = z.infer<typeof DatasetSchema>

// Both compile-time and runtime safety
function processDataset(data: unknown) {
  const dataset = DatasetSchema.parse(data)  // Runtime check
  // dataset is typed as Dataset              // Compile-time check
  console.log(dataset.title)
}
```

---

### Strict Null Checking

**With strictNullChecks: true:**
```typescript
// null and undefined are distinct types
let name: string = 'John'
// name = null  // ❌ Error
// name = undefined  // ❌ Error

let nullableName: string | null = 'John'
nullableName = null  // ✅ OK

let optionalName: string | undefined = 'John'
optionalName = undefined  // ✅ OK
```

**Optional vs Undefined:**
```typescript
interface User {
  name: string
  age?: number  // number | undefined
}

const user: User = { name: 'John' }  // ✅ OK - age is optional

// Accessing optional property
function printAge(user: User) {
  // console.log(user.age.toString())  // ❌ Error - might be undefined

  if (user.age !== undefined) {
    console.log(user.age.toString())  // ✅ OK
  }

  // Or use optional chaining
  console.log(user.age?.toString())  // ✅ OK
}
```

**Null vs Undefined:**
```typescript
// undefined - value not provided
let notProvided: string | undefined

// null - explicitly no value
let noValue: string | null = null

// Best practice: prefer undefined for optional values
interface Dataset {
  description?: string  // undefined when not provided
}

// Use null when explicitly representing "no value"
interface User {
  deletedAt: Date | null  // null = not deleted, Date = deleted
}
```

**Non-Null Assertion (use sparingly):**
```typescript
const element = document.getElementById('my-element')
// element is HTMLElement | null

// If you're certain it exists
element!.classList.add('active')  // ! asserts non-null

// Better: use optional chaining or if check
element?.classList.add('active')

if (element) {
  element.classList.add('active')
}
```

---

### Error Handling with Typed Errors

**Typed Error Classes:**
```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class NetworkError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Type-safe error handling
async function fetchDataset(id: string): Promise<Dataset> {
  try {
    const response = await fetch(`/api/datasets/${id}`)

    if (!response.ok) {
      throw new ApiError(
        'Failed to fetch dataset',
        response.status,
        await response.json()
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API Error ${error.statusCode}:`, error.message)
      throw error
    }
    throw new NetworkError('Network request failed', error as Error)
  }
}
```

**Result Type Pattern:**
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

async function fetchDatasetSafe(id: string): Promise<Result<Dataset>> {
  try {
    const dataset = await fetchDataset(id)
    return { success: true, data: dataset }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

// Usage
const result = await fetchDatasetSafe('abc-123')
if (result.success) {
  console.log(result.data.title)  // Type-safe
} else {
  console.error(result.error.message)
}
```

---

### Never Type for Exhaustive Checks

**Exhaustiveness Checking:**
```typescript
type Status = 'idle' | 'loading' | 'success' | 'error'

function handleStatus(status: Status) {
  switch (status) {
    case 'idle':
      return 'Not started'

    case 'loading':
      return 'Loading...'

    case 'success':
      return 'Done!'

    case 'error':
      return 'Failed'

    default:
      // If we handled all cases, status is never
      const _exhaustive: never = status
      return _exhaustive
  }
}
```

**Catching Missing Cases:**
```typescript
type Status = 'idle' | 'loading' | 'success' | 'error' | 'cancelled'  // Added new case

function handleStatus(status: Status) {
  switch (status) {
    case 'idle':
      return 'Not started'
    case 'loading':
      return 'Loading...'
    case 'success':
      return 'Done!'
    case 'error':
      return 'Failed'

    // Missing 'cancelled' case
    default:
      const _exhaustive: never = status  // ❌ Error - 'cancelled' not handled!
      return _exhaustive
  }
}
```

**Helper Function:**
```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`)
}

function handleStatus(status: Status) {
  switch (status) {
    case 'idle':
      return 'Not started'
    case 'loading':
      return 'Loading...'
    case 'success':
      return 'Done!'
    case 'error':
      return 'Failed'
    default:
      return assertNever(status)  // Error if not exhaustive
  }
}
```

---

## Patterns Used in This Project

### DCAT-US Schema Type Definitions

**From @dkan-client-tools/core/src/types.ts:**
```typescript
export interface DkanDataset {
  identifier: string
  title: string
  description: string
  accessLevel: 'public' | 'restricted public' | 'non-public'
  modified: string
  keyword: string[]
  publisher: Publisher
  contactPoint: ContactPoint
  distribution?: Distribution[]
  theme?: string[]
  spatial?: string
  temporal?: string
  license?: string
  landingPage?: string
  [key: string]: any  // Allow custom fields
}

export interface Publisher {
  name: string
  '@type'?: string
  subOrganizationOf?: Publisher  // Recursive type
}

export interface ContactPoint {
  '@type': string
  fn: string
  hasEmail: string
}

export interface Distribution {
  '@type': string
  identifier?: string
  title?: string
  format?: string
  mediaType?: string
  downloadURL?: string
  accessURL?: string
  data?: DistributionData
}
```

**Key Patterns:**
- Union literal types for enums (`accessLevel`)
- Optional properties (`distribution?`, `theme?`)
- Index signature for extensibility (`[key: string]: any`)
- Recursive types (`Publisher.subOrganizationOf`)
- Required nested objects (`publisher`, `contactPoint`)

---

### Frictionless Table Schema Types

**Schema Types:**
```typescript
export interface DatastoreSchema {
  fields: SchemaField[]
  primaryKey?: string | string[]
  foreignKeys?: ForeignKey[]
}

export interface SchemaField {
  name: string
  title?: string
  type: FieldType
  format?: string
  constraints?: FieldConstraints
}

export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'
  | 'time'
  | 'datetime'
  | 'year'
  | 'yearmonth'
  | 'duration'
  | 'geopoint'
  | 'geojson'
  | 'any'

export interface FieldConstraints {
  required?: boolean
  unique?: boolean
  minimum?: number | string
  maximum?: number | string
  pattern?: string
  enum?: any[]
}
```

---

### API Response Typing

**Generic Response Wrapper:**
```typescript
export interface DkanApiResponse<T> {
  data: T
  status?: number
  statusText?: string
}

// Usage
async function getDataset(id: string): Promise<DkanApiResponse<Dataset>> {
  const response = await fetch(`/api/datasets/${id}`)
  return {
    data: await response.json(),
    status: response.status,
    statusText: response.statusText
  }
}
```

**Search Response:**
```typescript
export interface DkanSearchResponse {
  total: number
  results: DkanDataset[]
  facets?: Record<string, any>
}

// Typed search function
async function searchDatasets(keyword: string): Promise<DkanSearchResponse> {
  // ...
}
```

---

### Generic Hook/Composable Signatures

**React Hook Pattern:**
```typescript
export interface UseDatasetOptions {
  identifier: string
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

export function useDataset(options: UseDatasetOptions) {
  const dkanClient = useDkanClient()

  return useQuery({
    queryKey: ['dataset', options.identifier],
    queryFn: () => dkanClient.getDataset(options.identifier),
    enabled: options.enabled !== false && !!options.identifier,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    gcTime: options.gcTime ?? 5 * 60 * 1000
  })
}
```

**Vue Composable Pattern:**
```typescript
import { type MaybeRefOrGetter, toValue, computed } from 'vue'

export interface UseDatasetOptions {
  identifier: MaybeRefOrGetter<string>  // Flexible reactive parameter
  enabled?: MaybeRefOrGetter<boolean>
  staleTime?: number
}

export function useDataset(options: UseDatasetOptions) {
  const client = useDkanClient()

  return useQuery({
    queryKey: computed(() => ['dataset', toValue(options.identifier)]),
    queryFn: () => client.getDataset(toValue(options.identifier)),
    enabled: () => toValue(options.enabled) ?? true
  })
}
```

---

### Type-Safe Query Keys

**Query Key Pattern:**
```typescript
// Hierarchical query keys for TanStack Query
type QueryKey =
  | ['dataset', string]
  | ['datasets']
  | ['datastore', string, number]
  | ['search', SearchParams]

// Type-safe query key factory
const queryKeys = {
  dataset: (id: string) => ['dataset', id] as const,
  datasets: () => ['datasets'] as const,
  datastore: (datasetId: string, index: number) => ['datastore', datasetId, index] as const,
  search: (params: SearchParams) => ['search', params] as const
}

// Usage
useQuery({
  queryKey: queryKeys.dataset('abc-123'),
  queryFn: () => fetchDataset('abc-123')
})
```

**Const Assertion for Readonly Tuples:**
```typescript
const key = ['dataset', 'abc'] as const
// Type: readonly ['dataset', 'abc']
// Not: (string | 'dataset')[]
```

---

### MaybeRefOrGetter Pattern (Vue)

**Flexible Reactive Parameters:**
```typescript
import { type MaybeRefOrGetter, toValue } from 'vue'

type MaybeRefOrGetter<T> = T | Ref<T> | ComputedRef<T> | (() => T)

// Composable accepts any reactive form
export function useDataset(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ['dataset', toValue(id)]),
    queryFn: () => client.getDataset(toValue(id))
  })
}

// All of these work:
useDataset('abc-123')                    // Plain string
useDataset(ref('abc-123'))               // Ref
useDataset(computed(() => route.params.id))  // Computed
useDataset(() => route.params.id)        // Getter function
```

---

## Common Patterns

### Builder Pattern with Types

**Type-Safe Builder:**
```typescript
class QueryBuilder {
  private _conditions: Array<{ field: string; value: any }> = []
  private _limit?: number
  private _offset?: number

  where(field: string, value: any): this {
    this._conditions.push({ field, value })
    return this
  }

  limit(n: number): this {
    this._limit = n
    return this
  }

  offset(n: number): this {
    this._offset = n
    return this
  }

  build() {
    return {
      conditions: this._conditions,
      limit: this._limit,
      offset: this._offset
    }
  }
}

// Usage
const query = new QueryBuilder()
  .where('status', 'published')
  .where('theme', 'health')
  .limit(10)
  .offset(0)
  .build()
```

---

### Factory Functions with Generics

**Generic Factory:**
```typescript
function createRepository<T extends { id: string }>(
  fetchAll: () => Promise<T[]>,
  fetchOne: (id: string) => Promise<T>
) {
  return {
    async getAll(): Promise<T[]> {
      return fetchAll()
    },

    async getById(id: string): Promise<T> {
      return fetchOne(id)
    },

    async findBy(predicate: (item: T) => boolean): Promise<T[]> {
      const all = await fetchAll()
      return all.filter(predicate)
    }
  }
}

// Usage
const datasetRepo = createRepository<Dataset>(
  () => fetch('/api/datasets').then(r => r.json()),
  (id) => fetch(`/api/datasets/${id}`).then(r => r.json())
)

const datasets = await datasetRepo.getAll()
const dataset = await datasetRepo.getById('abc-123')
```

---

### Branded Types for Type Safety

**Nominal Typing:**
```typescript
// Brand type with unique symbol
type Brand<K, T> = K & { __brand: T }

type DatasetId = Brand<string, 'DatasetId'>
type UserId = Brand<string, 'UserId'>

// Constructor functions
function datasetId(id: string): DatasetId {
  // Runtime validation could go here
  return id as DatasetId
}

function userId(id: string): UserId {
  return id as UserId
}

// Type-safe functions
function getDataset(id: DatasetId): Promise<Dataset> {
  return fetch(`/api/datasets/${id}`).then(r => r.json())
}

function getUser(id: UserId): Promise<User> {
  return fetch(`/api/users/${id}`).then(r => r.json())
}

// Usage
const dsId = datasetId('abc-123')
const uId = userId('user-456')

getDataset(dsId)  // ✅ OK
// getDataset(uId)  // ❌ Error - wrong type
// getDataset('abc-123')  // ❌ Error - need DatasetId
```

---

### Type Predicates

**Custom Predicates:**
```typescript
function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj
}

// Usage
function processData(data: unknown) {
  if (hasProperty(data, 'identifier')) {
    console.log(data.identifier)  // Type-safe
  }
}
```

**Array Filter with Predicate:**
```typescript
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

const items: (Dataset | null)[] = [dataset1, null, dataset2, undefined]
const defined: Dataset[] = items.filter(isDefined)
```

---

### Const Assertions

**Literal Types from Values:**
```typescript
// Without const assertion
const colors = ['red', 'green', 'blue']
// Type: string[]

// With const assertion
const colors = ['red', 'green', 'blue'] as const
// Type: readonly ['red', 'green', 'blue']

// Extract literal type
type Color = typeof colors[number]
// Type: 'red' | 'green' | 'blue'
```

**Readonly Objects:**
```typescript
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
} as const
// Type: { readonly apiUrl: 'https://api.example.com'; readonly timeout: 5000 }

// config.apiUrl = 'new'  // ❌ Error - readonly
```

**Query Keys (from this project):**
```typescript
const queryKeys = {
  dataset: (id: string) => ['dataset', id] as const,
  datasets: () => ['datasets'] as const
}

// Each key is a readonly tuple
const key = queryKeys.dataset('abc')
// Type: readonly ['dataset', string]
```

---

## TypeScript with Testing

### Typing Test Fixtures

**Fixture Factory:**
```typescript
function createDatasetFixture(overrides?: Partial<Dataset>): Dataset {
  return {
    identifier: 'test-123',
    title: 'Test Dataset',
    description: 'Test description',
    accessLevel: 'public',
    modified: '2024-01-01',
    keyword: ['test'],
    publisher: {
      name: 'Test Publisher'
    },
    contactPoint: {
      '@type': 'vcard:Contact',
      fn: 'Test Contact',
      hasEmail: 'test@example.com'
    },
    ...overrides
  }
}

// Usage in tests
const dataset = createDatasetFixture({ title: 'Custom Title' })
```

---

### Mocking with Types

**Type-Safe Mocks:**
```typescript
import { vi } from 'vitest'
import type { DkanClient } from '@dkan-client-tools/core'

it('calls getDataset', async () => {
  const mockClient: DkanClient = {
    getDataset: vi.fn().mockResolvedValue(mockDataset),
    // ... other methods
  } as any  // Partial mock

  // Or use actual instance with spies
  const client = new DkanClient({ baseUrl: 'https://test.example.com' })
  const spy = vi.spyOn(client, 'getDataset')
    .mockResolvedValue(mockDataset)

  await useDataset({ identifier: 'abc-123' })

  expect(spy).toHaveBeenCalledWith('abc-123')
})
```

---

### Type-Safe Test Helpers

**Helper with Generics:**
```typescript
async function renderWithClient<T>(
  Component: React.ComponentType<T>,
  props: T,
  client: DkanClient
) {
  return render(
    <DkanClientProvider client={client}>
      <Component {...props} />
    </DkanClientProvider>
  )
}

// Usage
await renderWithClient(
  DatasetView,
  { id: 'abc-123' },
  mockClient
)
```

---

### Vitest Type Utilities

**expect Type Testing:**
```typescript
import { expectTypeOf } from 'vitest'

it('has correct return type', () => {
  const result = useDataset({ identifier: 'abc' })

  expectTypeOf(result.data).toEqualTypeOf<Dataset | undefined>()
  expectTypeOf(result.isLoading).toEqualTypeOf<boolean>()
})
```

---

## Troubleshooting

### Common TypeScript Errors

**Error: Type 'X' is not assignable to type 'Y':**
```typescript
// Problem
const name: string = null  // ❌ Error

// Solution: Use union type
const name: string | null = null  // ✅ OK
```

**Error: Property 'X' does not exist on type 'Y':**
```typescript
// Problem
interface Dataset {
  identifier: string
}

const dataset: Dataset = { /* ... */ }
dataset.title  // ❌ Error - title doesn't exist

// Solution: Add property or use type guard
if ('title' in dataset) {
  console.log(dataset.title)  // ✅ OK
}
```

**Error: Cannot find name 'X':**
```typescript
// Problem: Missing import or types
const dataset: Dataset = { /* ... */ }  // ❌ Cannot find name 'Dataset'

// Solution: Import type
import type { Dataset } from './types'
```

---

### Type Inference Issues

**Problem: Too Wide:**
```typescript
// TypeScript infers type as number[]
const nums = [1, 2, 3]

// Solution: Const assertion for exact type
const nums = [1, 2, 3] as const  // readonly [1, 2, 3]
```

**Problem: Not Narrowing:**
```typescript
function process(value: string | number) {
  if (typeof value === 'string') {
    value.toUpperCase()  // OK
  }
  value.toFixed()  // ❌ Error - might be string
}

// Solution: Add else or return
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }
  return value.toFixed()  // ✅ OK - must be number
}
```

---

### Circular Dependency Problems

**Problem:**
```typescript
// a.ts
import { B } from './b'
export interface A {
  b: B
}

// b.ts
import { A } from './a'
export interface B {
  a: A
}
```

**Solution: Forward References:**
```typescript
// types.ts
export interface A {
  b: B
}

export interface B {
  a: A
}

// Import from single file
import type { A, B } from './types'
```

---

### Performance Issues with Large Types

**Problem: Slow Type Checking:**
```typescript
// Deeply nested conditional types
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T
```

**Solutions:**
1. Simplify types
2. Use `skipLibCheck: true` in tsconfig
3. Limit depth of recursive types
4. Use project references

---

## References

- [TypeScript Official Documentation](https://www.typescriptlang.org/docs/) - Official TypeScript docs
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - Comprehensive guide
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - Free online book
- [Type Challenges](https://github.com/type-challenges/type-challenges) - Practice TypeScript types
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) - React with TypeScript
- [Vue TypeScript Guide](https://vuejs.org/guide/typescript/overview.html) - Vue 3 with TypeScript
- [TanStack Query TypeScript](https://tanstack.com/query/latest/docs/framework/react/typescript) - Query with TypeScript
- [TypeScript ESLint](https://typescript-eslint.io/) - Linting for TypeScript
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) - Type definitions repository
- [ts-reset](https://github.com/total-typescript/ts-reset) - Improved TypeScript defaults
