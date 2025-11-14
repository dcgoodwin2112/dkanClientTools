# DKAN Client Tools Core Base

Drupal module that provides the DKAN Client Tools Core library for use in Drupal sites.

## What's Included

One Drupal library with the framework-agnostic DKAN client:

- **`dkan_client_tools_core_base/dkan-client-core`** - DKAN Client Tools Core (~40KB minified)

The library is loaded from a vendored file in `js/vendor/` and exposes a global:
- `window.DkanClientTools` - Contains `DkanClient`, `DkanApiClient`, and all TypeScript types

## Installation

Just enable the module:

```bash
drush en dkan_client_tools_core_base
```

No build step required!

## Usage in Other Modules

Declare dependencies in your `*.libraries.yml`:

```yaml
my_module_app:
  js:
    js/my-app.js: {}
  dependencies:
    - dkan_client_tools_core_base/dkan-client-core
```

Then attach your library:

```php
$build['#attached']['library'][] = 'my_module/my_module_app';
```

## Usage in JavaScript

The library exposes `window.DkanClientTools` with the following exports:

```javascript
// Create a DKAN client
const client = new window.DkanClientTools.DkanClient({
  baseUrl: 'https://demo.getdkan.org',
});

// Use the API client directly
const apiClient = new window.DkanClientTools.DkanApiClient({
  baseUrl: 'https://demo.getdkan.org',
});

// Fetch a dataset
const dataset = await client.getDataset('dataset-uuid');

// Search datasets
const results = await client.searchDatasets({
  keywords: 'health',
  page: 1,
  pageSize: 10,
});

// Query datastore
const data = await client.queryDatastore({
  datasetId: 'dataset-uuid',
  resource: 0,
  limit: 100,
  offset: 0,
});

// Execute SQL query
const sqlResults = await client.executeSqlQuery({
  datasetId: 'dataset-uuid',
  resource: 0,
  query: 'SELECT * FROM datastore LIMIT 10',
});
```

## Updating DKAN Client Tools Core

To update to a new version:

1. Build the latest core package:
   ```bash
   cd packages/dkan-client-tools-core
   npm run build
   ```

2. Copy the minified build:
   ```bash
   cp packages/dkan-client-tools-core/dist/index.global.min.js \
      dkan/docroot/modules/custom/dkan_client_tools_core_base/js/vendor/dkan-client-tools-core.min.js
   ```

3. Update version in `dkan_client_tools_core_base.libraries.yml`

4. Clear cache: `drush cr`

## File Structure

```
dkan_client_tools_core_base/
├── dkan_client_tools_core_base.info.yml
├── dkan_client_tools_core_base.libraries.yml
├── js/vendor/
│   ├── dkan-client-tools-core.min.js   # 40KB minified
│   └── README.md
└── README.md
```

## Why This Approach?

- **Framework-agnostic**: Works with vanilla JavaScript or any framework
- **Simple**: No build tools, no npm, no complexity
- **Small**: Only 40KB minified with TanStack Query Core bundled
- **Standard**: Follows Drupal best practices for vendored libraries
- **Complete**: Includes DkanClient, DkanApiClient, and all TypeScript types

## What's Included

The core library includes:

- **DkanClient** - Main client class wrapping TanStack Query Core
- **DkanApiClient** - HTTP client with 43+ methods for all DKAN REST APIs
- **TypeScript types** - DCAT-US schema, datastore queries, data dictionaries, etc.
- **TanStack Query Core** - Proven caching and state management

## API Coverage

The library provides access to:

- **Dataset operations** (7 methods): CRUD, search, list
- **Datastore operations** (5 methods): query, download, SQL
- **Data dictionary operations** (6 methods): CRUD, schema
- **Harvest operations** (6 methods): plans, runs
- **Metastore operations** (6 methods): schemas, facets, properties
- **Datastore import operations** (4 methods): import, delete, statistics
- **Revision/moderation operations** (4 methods): revisions, workflow states

## License

MIT License - See the main repository for details.
