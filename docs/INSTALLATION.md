# Installation

## Requirements

- **Node.js**: 20+ or 22+ (for Vite 7 in examples)
- **npm**: 9.0+
- **TypeScript**: Optional but recommended

## React

### Install Packages

```bash
npm install @dkan-client-tools/core @dkan-client-tools/react @tanstack/react-query
```

### Peer Dependencies

The React package requires:
- `react` (^18.0.0 or ^19.0.0)
- `react-dom` (^18.0.0 or ^19.0.0)
- `@tanstack/react-query` (peer dependency)

These are likely already in your project. If not:

```bash
npm install react react-dom @tanstack/react-query
```

---

## Vue

### Install Packages

```bash
npm install @dkan-client-tools/core @dkan-client-tools/vue @tanstack/vue-query
```

### Peer Dependencies

The Vue package requires:
- `vue` (^3.3.0)
- `@tanstack/vue-query` (peer dependency)

If not already installed:

```bash
npm install vue @tanstack/vue-query
```

---

## Vanilla JavaScript / Core Only

### Install Package

```bash
npm install @dkan-client-tools/core
```

The core package includes TanStack Query Core - no additional dependencies needed.

---

## Drupal

### For Drupal Themes/Modules

Use the pre-built IIFE (Immediately Invoked Function Expression) files:

```bash
# Option 1: Install via npm and copy files
npm install @dkan-client-tools/core @dkan-client-tools/react @dkan-client-tools/vue

# Copy IIFE builds to your Drupal module/theme
cp node_modules/@dkan-client-tools/core/dist/index.global.min.js yourmodule/js/
cp node_modules/@dkan-client-tools/react/dist/index.global.min.js yourmodule/js/
cp node_modules/@dkan-client-tools/vue/dist/index.global.min.js yourmodule/js/
```

```bash
# Option 2: Use CDN in libraries.yml
# See Drupal Integration guide for details
```

See the [Drupal Integration Guide](./DRUPAL_INTEGRATION.md) for complete setup instructions.

---

## Verification

After installation, verify by importing:

### React

```tsx
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider, useDatasetSearch } from '@dkan-client-tools/react'
```

### Vue

```typescript
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin, useDatasetSearch } from '@dkan-client-tools/vue'
```

### Core

```typescript
import { DkanClient, DkanApiClient } from '@dkan-client-tools/core'
```

---

## TypeScript

Types are included in all packages - no additional `@types` packages needed.

**Recommended `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "types": ["vite/client"]
  }
}
```

---

## Troubleshooting

### Module Resolution Errors

If you see "Cannot find module" errors, ensure `moduleResolution: "bundler"` in tsconfig.json.

### Peer Dependency Warnings

npm will warn about missing peer dependencies. Install them as shown above.

### Vite-Specific Issues

If using Vite and seeing type errors, add `"types": ["vite/client"]` to tsconfig.json.

### React 19 Support

Both React 18 and 19 are supported. For React 19:

```bash
npm install react@^19.0.0 react-dom@^19.0.0
```

---

## Next Steps

- **Quick Start**: [Get up and running in 5 minutes](./QUICK_START.md)
- **React Guide**: [Complete React guide](./REACT_GUIDE.md)
- **Vue Guide**: [Complete Vue guide](./VUE_GUIDE.md)
- **Drupal Integration**: [Using in Drupal](./DRUPAL_INTEGRATION.md)
