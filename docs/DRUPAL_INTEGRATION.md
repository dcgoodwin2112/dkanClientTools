# Drupal Integration

Using DKAN Client Tools in Drupal themes and modules.

## Overview

DKAN Client Tools provides IIFE (Immediately Invoked Function Expression) builds for direct browser usage in Drupal. These builds expose global variables that can be used in Drupal Behaviors.

## Package Formats

Each package provides multiple distribution formats:

- **ESM** (`dist/index.js`) - For modern bundlers
- **CommonJS** (`dist/index.cjs`) - For Node.js
- **IIFE** (`dist/index.global.js`) - For direct browser/Drupal usage
- **IIFE Minified** (`dist/index.global.min.js`) - Production-ready browser build

For Drupal, use the IIFE builds.

---

## Installation

### Option 1: Install via npm

```bash
cd /path/to/your/drupal/module-or-theme
npm install @dkan-client-tools/core @dkan-client-tools/react @dkan-client-tools/vue
```

Then copy IIFE files to your module/theme:

```bash
# Copy to your module's js directory
cp node_modules/@dkan-client-tools/core/dist/index.global.min.js js/dkan-client-core.min.js
cp node_modules/@dkan-client-tools/react/dist/index.global.min.js js/dkan-client-react.min.js
cp node_modules/@dkan-client-tools/vue/dist/index.global.min.js js/dkan-client-vue.min.js
```

### Option 2: Use from Drupal Base Modules

The project includes base Drupal modules with IIFE builds already in place:

```
dkan/docroot/modules/custom/
├── dkan_client_react/      # React base module
├── dkan_client_vue/         # Vue base module
└── dkan_client_vanilla/     # Core/vanilla JS base module
```

These modules provide the libraries you can depend on.

---

## Drupal Library Definitions

### Core (Vanilla JavaScript)

```yaml
# yourmodule.libraries.yml
dkan-client-core:
  js:
    js/dkan-client-core.min.js: { minified: true }
  dependencies:
    - core/drupal
```

### React

```yaml
# yourmodule.libraries.yml
dkan-client-react:
  js:
    js/dkan-client-react.min.js: { minified: true }
  dependencies:
    - core/react
    - core/react-dom
    - yourmodule/dkan-client-core
```

**Note**: React IIFE build requires React, ReactDOM, and TanStack React Query to be loaded separately. Use Drupal's `core/react` and `core/react-dom` libraries.

### Vue

```yaml
# yourmodule.libraries.yml
dkan-client-vue:
  js:
    js/dkan-client-vue.min.js: { minified: true }
  dependencies:
    - yourmodule/vue
    - yourmodule/tanstack-vue-query
    - yourmodule/dkan-client-core
```

**Note**: Vue IIFE build requires Vue 3 and TanStack Vue Query to be loaded separately.

---

## Global Variables

When loaded via IIFE builds, the packages expose global variables:

### window.DkanClientToolsCore

Core package exports:

```javascript
window.DkanClientToolsCore = {
  DkanClient,        // Main client class
  DkanApiClient,     // HTTP client
  QueryClient,       // TanStack Query Client
  // Plus all TypeScript types
}
```

### window.DkanClientToolsReact

React package exports:

```javascript
window.DkanClientToolsReact = {
  // Provider
  DkanClientProvider,

  // Context hook
  useDkanClient,

  // All React hooks:
  // Dataset hooks
  useDataset,
  useDatasetSearch,
  useAllDatasets,
  useCreateDataset,
  useUpdateDataset,
  usePatchDataset,
  useDeleteDataset,

  // Datastore hooks
  useDatastore,
  useQueryDatastoreMulti,
  useSqlQuery,
  useExecuteSqlQuery,
  useDownloadQuery,
  useDownloadQueryByDistribution,

  // Data dictionary hooks
  useDataDictionary,
  useDataDictionaryList,
  useDataDictionaryFromUrl,
  useDatastoreSchema,
  useCreateDataDictionary,
  useUpdateDataDictionary,
  useDeleteDataDictionary,

  // Harvest hooks
  useHarvestPlans,
  useHarvestPlan,
  useHarvestRuns,
  useHarvestRun,
  useRegisterHarvestPlan,
  useRunHarvest,

  // Import hooks
  useDatastoreImports,
  useDatastoreImport,
  useDatastoreStatistics,
  useTriggerDatastoreImport,
  useDeleteDatastore,

  // Metastore hooks
  useSchemas,
  useSchema,
  useSchemaItems,
  useDatasetFacets,

  // Revision hooks
  useRevisions,
  useRevision,
  useCreateRevision,
  useChangeDatasetState,

  // Re-exports
  React,
  ReactDOM,
  QueryClient,
  DkanClient,
}
```

### window.DkanClientToolsVue

Vue package exports:

```javascript
window.DkanClientToolsVue = {
  // Plugin
  DkanClientPlugin,

  // Injection composable
  useDkanClient,

  // All Vue composables (same names as React hooks):
  useDataset,
  useDatasetSearch,
  useAllDatasets,
  // ... (same list as React)

  // Re-exports
  QueryClient,
  DkanClient,
}
```

---

## Using with Drupal Behaviors

**Vanilla JavaScript**:

```javascript
(function (Drupal, once) {
  Drupal.behaviors.dkanWidget = {
    attach: function (context, settings) {
      once('dkan-widget', '.widget', context).forEach(async (element) => {
        const { DkanClient } = window.DkanClientToolsCore;
        const client = new DkanClient({
          baseUrl: settings.dkanClientTools?.baseUrl || 'https://demo.getdkan.org'
        });

        const results = await client.getApiClient().searchDatasets({ 'page-size': 10 });
        element.innerHTML = results.results.map(d => `<li>${d.title}</li>`).join('');
      });
    }
  };
})(Drupal, once);
```

**React**: Use `DkanClientProvider`, wrap components, access hooks via `window.DkanClientToolsReact`, clean up in `detach` hook with `root.unmount()`

**Vue**: Use `DkanClientPlugin`, access composables via `window.DkanClientToolsVue`, mount with `createApp()`

---

## Passing Settings from PHP

```php
<?php
// yourmodule.module

/**
 * Implements hook_page_attachments().
 */
function yourmodule_page_attachments(array &$attachments) {
  $attachments['#attached']['library'][] = 'yourmodule/dkan-client-react';
  $attachments['#attached']['drupalSettings']['dkanClientTools'] = [
    'baseUrl' => 'https://demo.getdkan.org',
    'auth' => [
      'username' => \Drupal::config('yourmodule.settings')->get('dkan_username'),
      'password' => \Drupal::config('yourmodule.settings')->get('dkan_password'),
    ],
  ];
}
```

---

## Best Practices

### 1. Use `once` Utility

Always use Drupal's `once` utility to prevent duplicate initialization:

```javascript
const elements = once('unique-id', '.selector', context);
```

### 2. Pass Configuration via drupalSettings

Don't hardcode URLs or credentials:

```javascript
const baseUrl = settings.dkanClientTools?.baseUrl || 'https://demo.getdkan.org';
```

### 3. Handle Errors Gracefully

Show user-friendly messages:

```javascript
if (error) {
  element.innerHTML = `<p class="error-message">Unable to load data. Please try again later.</p>`;
}
```

### 4. Clean Up React/Vue Apps

In `detach` hook, unmount React roots or destroy Vue apps to prevent memory leaks.

### 5. Leverage Drupal's React

Use `core/react` and `core/react-dom` libraries instead of bundling your own.

### 6. Test with Aggregation

Ensure your code works with Drupal's CSS/JS aggregation enabled.

---

## Browser Compatibility

The IIFE builds target ES2020, supporting:
- Chrome 80+
- Firefox 72+
- Safari 13.1+
- Edge 80+

For older browsers, add transpilation in your build process.

---

## Troubleshooting

### "DkanClientToolsCore is not defined"

Ensure the library is loaded before your script:

```yaml
yourmodule/yourscript:
  dependencies:
    - yourmodule/dkan-client-core
```

### "React is not defined"

Add React dependencies:

```yaml
dependencies:
  - core/react
  - core/react-dom
```

### "Vue is not defined"

Ensure Vue 3 is loaded before the Vue IIFE build.

### Aggregation Issues

If experiencing issues with aggregation, check library weight or disable aggregation during development.

---

## Next Steps

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Build Process](./BUILD_PROCESS.md) - Understanding the build system
- [Example Drupal Modules](../dkan/docroot/modules/custom/) - Working examples
