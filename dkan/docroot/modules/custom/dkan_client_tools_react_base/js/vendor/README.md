# DKAN Client Tools React - Vendor Files

Self-contained IIFE build of DKAN Client Tools React package.

## Files

- **dkan-client-tools-react.min.js** - Self-contained IIFE build (~205KB)
  - React 18.3.1
  - ReactDOM 18.3.1
  - TanStack React Query 5.x
  - DKAN Client Tools Core
  - All 40+ DKAN React hooks
- **LICENSE-react.txt** - MIT License

## Source

Built from: `/packages/dkan-client-tools-react`

Build command:
```bash
cd packages/dkan-client-tools-react
npm run build
cp dist/index.global.min.js ../../dkan/docroot/modules/custom/dkan_client_tools_react_base/js/vendor/dkan-client-tools-react.min.js
```

## Global

This file exports to:
- `window.DkanClientToolsReact` - Complete DKAN Client Tools React library

## Included Exports

The global object includes:
- `DkanClientToolsReact.React` - React library
- `DkanClientToolsReact.ReactDOM` - ReactDOM library
- `DkanClientToolsReact.QueryClient` - TanStack Query Client
- `DkanClientToolsReact.DkanClient` - DKAN API Client
- `DkanClientToolsReact.DkanClientProvider` - Context provider
- `DkanClientToolsReact.useDatasetSearch` - Dataset search hook
- Plus 40+ other hooks for DKAN API operations

## Updating

To update the library:

1. Make changes to the React package
2. Rebuild:
   ```bash
   cd packages/dkan-client-tools-react
   npm run build
   ```
3. Copy to Drupal:
   ```bash
   cp dist/index.global.min.js ../../dkan/docroot/modules/custom/dkan_client_tools_react_base/js/vendor/dkan-client-tools-react.min.js
   ```
4. Update version in `../../dkan_client_tools_react_base.libraries.yml`
5. Clear Drupal cache:
   ```bash
   cd ../../dkan
   ddev drush cr
   ```
