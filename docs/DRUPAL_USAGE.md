# Using DKAN Client Tools with Drupal

This guide explains how to integrate the DKAN Client Tools packages into Drupal themes and modules.

## Package Formats

All packages (`@dkan-client-tools/core`, `@dkan-client-tools/react`, and `@dkan-client-tools/vue`) provide multiple distribution formats:

- **ESM** (`dist/index.js`) - For modern bundlers (Webpack, Vite, Rollup)
- **CommonJS** (`dist/index.cjs`) - For Node.js
- **IIFE** (`dist/index.global.js`) - For direct browser/Drupal usage
- **IIFE Minified** (`dist/index.global.min.js`) - Production-ready browser build

## Build Sizes

### @dkan-client-tools/core
- Lightweight bundle includes TanStack Query Core for standalone usage

### @dkan-client-tools/react
- Requires React, ReactDOM, and TanStack React Query to be loaded separately

### @dkan-client-tools/vue
- Requires Vue and TanStack Vue Query to be loaded separately

## Installation Methods

### Method 1: Via npm and Build Process (Recommended for Custom Themes)

**For React:**
```bash
# In your theme directory
npm install @dkan-client-tools/core @dkan-client-tools/react
```

Then use in your build process (Webpack, Vite, etc.):

```javascript
import { DkanClient } from '@dkan-client-tools/core';
import { useDkanClient, useDatasetSearch } from '@dkan-client-tools/react';
```

**For Vue:**
```bash
# In your theme directory
npm install @dkan-client-tools/core @dkan-client-tools/vue
```

Then use in your build process:

```javascript
import { DkanClient } from '@dkan-client-tools/core';
import { DkanClientPlugin, useDatasetSearch } from '@dkan-client-tools/vue';
```

### Method 2: Direct File Inclusion (For Modules)

Copy the built files to your module:

```bash
# From node_modules after npm install
cp node_modules/@dkan-client-tools/core/dist/index.global.min.js \
   modules/custom/mymodule/js/vendor/dkan-client.min.js
```

### Method 3: Via /libraries Folder

Place packages in Drupal's `/libraries` directory:

```
/libraries/
  dkan-client-tools-core/
    dist/
      index.global.min.js
  dkan-client-tools-react/
    dist/
      index.global.min.js
  dkan-client-tools-vue/
    dist/
      index.global.min.js
```

### Method 4: CDN (When Published)

Reference from unpkg or jsDelivr CDN in your library definition.

## Drupal Library Definition

### Core Package (Vanilla JS)

```yaml
# mymodule.libraries.yml

dkan-client-core:
  js:
    # Option A: Committed file in module
    js/vendor/dkan-client.min.js: { minified: true }

    # Option B: From /libraries folder
    # /libraries/dkan-client-tools-core/dist/index.global.min.js: { minified: true }

    # Option C: From CDN (when published)
    # https://unpkg.com/@dkan-client-tools/core/dist/index.global.min.js:
    #   type: external
    #   minified: true
```

### React Package

```yaml
# mymodule.libraries.yml

dkan-client-react:
  js:
    js/vendor/dkan-client-react.min.js: { minified: true }
  dependencies:
    - core/react              # Drupal's React
    - core/react-dom          # Drupal's ReactDOM
    - mymodule/tanstack-query # You need to include TanStack Query separately
    - mymodule/dkan-client-core
```

### Vue Package

```yaml
# mymodule.libraries.yml

dkan-client-vue:
  js:
    js/vendor/dkan-client-vue.min.js: { minified: true }
  dependencies:
    - mymodule/vue                # Vue 3
    - mymodule/tanstack-vue-query # TanStack Vue Query
    - mymodule/dkan-client-core
```

## Usage in Drupal

### Vanilla JavaScript (Core Package)

The IIFE build exposes a global `DkanClientTools` object:

```javascript
// modules/custom/mymodule/js/dkan-integration.js
(function (Drupal, DkanClientTools) {
  'use strict';

  Drupal.behaviors.dkanDatasets = {
    attach(context, settings) {
      // Create client instance
      const client = new DkanClientTools.DkanClient({
        baseUrl: settings.dkan.baseUrl || '/api',
      });

      // Fetch datasets
      const elements = once('dkan-widget', '.dkan-dataset-list', context);
      elements.forEach(async (element) => {
        try {
          const data = await client.searchDatasets({ 'page-size': 10 });

          // Render results
          const list = document.createElement('ul');
          data.results.forEach(dataset => {
            const item = document.createElement('li');
            item.textContent = dataset.title;
            list.appendChild(item);
          });
          element.appendChild(list);
        } catch (error) {
          console.error('Failed to load datasets:', error);
          element.textContent = 'Failed to load datasets';
        }
      });
    }
  };

})(Drupal, window.DkanClientTools);
```

Library definition:

```yaml
dkan-widget:
  js:
    js/dkan-integration.js: {}
  dependencies:
    - mymodule/dkan-client-core
    - core/drupal
    - core/once
  drupalSettings:
    dkan:
      baseUrl: '/api'
```

### React Components (React Package)

The React IIFE build exposes `DkanClientToolsReact`:

```javascript
// modules/custom/mymodule/js/dkan-react-widget.js
(function (Drupal, React, ReactDOM, DkanClientTools, DkanClientToolsReact) {
  'use strict';

  const { DkanClientProvider, useDatasetSearch } = DkanClientToolsReact;
  const { DkanClient } = DkanClientTools;

  // Create client instance
  const dkanClient = new DkanClient({
    baseUrl: '/api',
  });

  // React component
  function DatasetList() {
    const { data, isLoading, error } = useDatasetSearch({
      searchOptions: { 'page-size': 5 },
    });

    if (isLoading) return React.createElement('div', null, 'Loading...');
    if (error) return React.createElement('div', null, 'Error: ' + error.message);

    return React.createElement('ul', null,
      data.results.map((dataset) =>
        React.createElement('li', { key: dataset.identifier }, dataset.title)
      )
    );
  }

  // Drupal behavior
  Drupal.behaviors.dkanReactWidget = {
    attach(context) {
      const elements = once('dkan-react', '.dkan-react-widget', context);
      elements.forEach((element) => {
        const root = ReactDOM.createRoot(element);
        root.render(
          React.createElement(DkanClientProvider, { client: dkanClient },
            React.createElement(DatasetList)
          )
        );
      });
    }
  };

})(Drupal, React, ReactDOM, window.DkanClientTools, window.DkanClientToolsReact);
```

Library definition:

```yaml
dkan-react-widget:
  js:
    js/dkan-react-widget.js: {}
  dependencies:
    - core/react
    - core/react-dom
    - mymodule/dkan-client-core
    - mymodule/dkan-client-react
    - mymodule/tanstack-query
    - core/drupal
    - core/once
```

### Vue Components (Vue Package)

The Vue IIFE build exposes `DkanClientToolsVue`:

```javascript
// modules/custom/mymodule/js/dkan-vue-widget.js
(function (Drupal, Vue, DkanClientTools, DkanClientToolsVue) {
  'use strict';

  const { DkanClientPlugin, useDatasetSearch } = DkanClientToolsVue;
  const { DkanClient } = DkanClientTools;
  const { createApp, ref, computed } = Vue;

  // Create client instance
  const dkanClient = new DkanClient({
    baseUrl: '/api',
  });

  // Drupal behavior
  Drupal.behaviors.dkanVueWidget = {
    attach(context) {
      const elements = once('dkan-vue', '.dkan-vue-widget', context);
      elements.forEach((element) => {
        const app = createApp({
          setup() {
            const searchQuery = ref('');
            const { data, isLoading, error } = useDatasetSearch({
              searchOptions: computed(() => ({
                fulltext: searchQuery.value,
                'page-size': 5,
              })),
            });

            return {
              searchQuery,
              data,
              isLoading,
              error,
            };
          },
          template: `
            <div>
              <input v-model="searchQuery" placeholder="Search datasets..." />
              <div v-if="isLoading">Loading...</div>
              <div v-else-if="error">Error: {{ error.message }}</div>
              <ul v-else-if="data">
                <li v-for="dataset in data.results" :key="dataset.identifier">
                  {{ dataset.title }}
                </li>
              </ul>
            </div>
          `,
        });

        app.use(DkanClientPlugin, { client: dkanClient });
        app.mount(element);
      });
    }
  };

})(Drupal, window.Vue, window.DkanClientTools, window.DkanClientToolsVue);
```

Library definition:

```yaml
dkan-vue-widget:
  js:
    js/dkan-vue-widget.js: {}
  dependencies:
    - mymodule/vue
    - mymodule/dkan-client-core
    - mymodule/dkan-client-vue
    - mymodule/tanstack-vue-query
    - core/drupal
    - core/once
```

## Using with Build Tools

For modern development workflows, use the ESM imports with a build tool:

### React with Build Tools

```javascript
// src/components/DatasetList.jsx
import { useDatasetSearch } from '@dkan-client-tools/react';

export function DatasetList() {
  const { data, isLoading } = useDatasetSearch({
    searchOptions: { 'page-size': 10 },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {data.results.map(dataset => (
        <li key={dataset.identifier}>{dataset.title}</li>
      ))}
    </ul>
  );
}
```

Build to an IIFE bundle and include in Drupal:

```yaml
my-react-app:
  js:
    dist/app.bundle.js: { minified: true }
  dependencies:
    - core/react
    - core/react-dom
```

### Vue with Build Tools

```vue
<!-- src/components/DatasetList.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDatasetSearch } from '@dkan-client-tools/vue'

const searchQuery = ref('')
const { data, isLoading } = useDatasetSearch({
  searchOptions: computed(() => ({
    fulltext: searchQuery.value,
    'page-size': 10,
  })),
})
</script>

<template>
  <div>
    <input v-model="searchQuery" placeholder="Search..." />
    <div v-if="isLoading">Loading...</div>
    <ul v-else-if="data">
      <li v-for="dataset in data.results" :key="dataset.identifier">
        {{ dataset.title }}
      </li>
    </ul>
  </div>
</template>
```

Build to an IIFE bundle and include in Drupal:

```yaml
my-vue-app:
  js:
    dist/app.bundle.js: { minified: true }
  dependencies:
    - mymodule/vue
```

## Global Variables Reference

When using IIFE builds, these globals are available:

### window.DkanClientTools (Core)
- `DkanClient` - Main client class
- `DkanApiClient` - Low-level API client
- `DkanApiError` - Error class

### window.DkanClientToolsReact (React Package)
- `DkanClientProvider` - React context provider
- `useDkanClient` - Hook to access client
- `useDataset` - Hook to fetch single dataset
- `useDatasetSearch` - Hook to search datasets
- `useDatastore` - Hook to query datastore
- `useSqlQuery` - Hook for SQL queries
- Comprehensive React hooks for all DKAN APIs

### window.DkanClientToolsVue (Vue Package)
- `DkanClientPlugin` - Vue plugin for app.use()
- `useDkanClient` - Composable to access client
- `useDataset` - Composable to fetch single dataset
- `useDatasetSearch` - Composable to search datasets
- `useDatastore` - Composable to query datastore
- `useSqlQuery` - Composable for SQL queries
- Comprehensive Vue composables for all DKAN APIs

## Example Drupal Module Structure

```
modules/custom/dkan_client/
├── dkan_client.info.yml
├── dkan_client.libraries.yml
├── dkan_client.module
└── js/
    ├── vendor/
    │   ├── dkan-client.min.js          # Core IIFE build
    │   ├── dkan-client-react.min.js    # React IIFE build
    │   ├── dkan-client-vue.min.js      # Vue IIFE build
    │   ├── tanstack-query.min.js       # TanStack React Query
    │   ├── tanstack-vue-query.min.js   # TanStack Vue Query
    │   └── vue.min.js                  # Vue 3
    ├── dkan-integration.js             # Vanilla JS integration
    ├── dkan-react-widget.js            # React integration
    └── dkan-vue-widget.js              # Vue integration
```

## Tips for Drupal Integration

1. **Use `once` utility**: Always use Drupal's `once` utility to prevent duplicate initialization
2. **Pass settings via drupalSettings**: Use `drupalSettings` to pass configuration from PHP
3. **Handle errors gracefully**: Show user-friendly messages when data fetching fails
4. **Leverage Drupal's React**: Use `core/react` and `core/react-dom` libraries instead of bundling your own
5. **Consider caching**: TanStack Query handles caching, but configure staleTime/cacheTime appropriately
6. **Test with aggregation**: Ensure your code works with Drupal's CSS/JS aggregation enabled
7. **Vue app mounting**: When using Vue, ensure you only mount the app once per element using the `once` utility
8. **Framework choice**: Choose React for integration with existing Drupal React components, or Vue for greenfield projects or lighter bundle sizes

## Browser Compatibility

The IIFE builds target ES2020, which supports:
- Chrome 80+
- Firefox 72+
- Safari 13.1+
- Edge 80+

For older browser support, add a transpilation step in your build process.

## Framework Comparison

| Feature | Core (Vanilla JS) | React | Vue |
|---------|-------------------|-------|-----|
| Bundle Size | Lightweight | Larger (includes framework) | Larger (includes framework) |
| External Dependencies | None | React, ReactDOM, TanStack React Query | Vue 3, TanStack Vue Query |
| Learning Curve | Low | Medium | Medium |
| Drupal Integration | Excellent | Good (via core/react) | Good (custom library) |
| Reactivity | Manual | Hooks | Reactive refs |
| Best For | Simple widgets | Complex UIs, existing React apps | Modern SPAs, reactive UIs |

## Next Steps

- See the main README for full API documentation
- Check package-specific READMEs:
  - [React package README](./packages/dkan-client-tools-react/README.md)
  - [Vue package README](./packages/dkan-client-tools-vue/README.md)
- Review TanStack Query documentation for advanced caching strategies
- Explore DKAN API documentation at https://dkan.readthedocs.io
