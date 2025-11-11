# DKAN Client Tools Core - Vendored Library

This directory contains the built DKAN Client Tools Core library.

## Files

- `dkan-client-tools-core.min.js` - Minified IIFE build (~40KB)

## Source

Built from `packages/dkan-client-tools-core` using tsup.

## Updating

To update this library:

1. Build the core package:
   ```bash
   cd packages/dkan-client-tools-core
   npm run build
   ```

2. Copy the minified build:
   ```bash
   cp dist/index.global.min.js \
      ../../dkan/docroot/modules/custom/dkan_client_tools_core_base/js/vendor/dkan-client-tools-core.min.js
   ```

3. Update version in `dkan_client_tools_core_base.libraries.yml`

4. Clear Drupal cache: `drush cr`

## Global Exports

The library exposes `window.DkanClientTools` containing:

- `DkanClient` - Main client class
- `DkanApiClient` - HTTP client for DKAN APIs
- All TypeScript types (Dataset, Datastore, DataDictionary, etc.)

## Bundle Contents

- DKAN Client Tools Core
- TanStack Query Core (bundled)
- All DKAN API methods
- TypeScript type definitions
