# DKAN Client Demo React Module

A Drupal module demonstrating how to use the **@dkan-client-tools/react** package to build a dataset search interface using React with JSX and Vite.

## Overview

This module provides a React-based dataset search widget that can be placed as a block anywhere in your Drupal site. It demonstrates:

- Using React with JSX and the DKAN Client Tools React package
- Modern npm-based build pipeline with Vite
- React hooks (`useDatasetSearch`) for data fetching
- DkanClientProvider setup for React applications
- External React and ReactDOM dependencies (provided by base module)
- Bundling React Query and DKAN Client Tools

## Features

- **React-powered UI**: Built with React 18 and modern JSX syntax
- **Smart Search**: Uses `useDatasetSearch` hook for search queries
- **Expandable Cards**: Click to see full dataset details
- **Pagination**: Navigate through multiple pages of results
- **Real-time Loading States**: Loading indicators during data fetch
- **Error Handling**: Graceful error messages
- **Responsive Design**: Works on all screen sizes

## Build Approach

This module uses **Vite** as a modern build tool with **external React dependencies**:

- **Shared Dependencies**: React and ReactDOM loaded from `dkan_client_tools_react_base` module (140KB total)
- **Widget Bundle**: TanStack React Query + DKAN Client Tools + widget code (486KB minified)
- **JSX support**: Write components with modern JSX syntax
- **Watch mode**: Hot reload during development
- **Optimized**: Minified with terser, includes source maps
- **Simple**: Just `npm install` and `npm run build`

The widget bundles:
- TanStack React Query 5.x
- @dkan-client-tools/react
- Your JSX widget code

React 18.3.1 and ReactDOM 18.3.1 are provided externally by the base module.

## Installation

### Step 1: Enable Base Module

This module requires `dkan_client_tools_react_base` which provides React and ReactDOM:

```bash
ddev drush en dkan_client_tools_react_base
```

### Step 2: Install Dependencies

From the module directory:

```bash
cd docroot/modules/custom/dkan_client_demo_react
npm install
```

This installs:
- `vite` (build tool)
- `@vitejs/plugin-react` (React plugin for Vite)
- `terser` (minification)
- `react` & `react-dom` (dev dependencies)
- `@dkan-client-tools/react` (from monorepo)

### Step 3: Build the Widget

```bash
npm run build
```

This compiles `src/jsx/dataset-search-widget.jsx` into:
- `js/dataset-search-widget.min.js` (486KB minified) ← Used by Drupal
- `js/dataset-search-widget.min.js.map` (source map for debugging)

### Step 4: Enable the Module

```bash
ddev drush en dkan_client_demo_react
```

Or enable through the Drupal admin UI at `/admin/modules`.

### Step 5: Place the Block

1. Go to **Structure > Block layout** (`/admin/structure/block`)
2. Click **"Place block"** in your desired region
3. Find **"DKAN Dataset Search (React)"**
4. Click **"Place block"**
5. Configure and save

## Architecture

### React Components

The module uses React functional components with hooks:

```
DatasetSearchWidget (Root)
  └─ DkanClientProvider (Context Provider)
      └─ DatasetSearchApp (Main App)
          ├─ Header
          ├─ SearchBox
          ├─ Loading / Error / Results
          └─ Results
              ├─ DatasetCard (multiple)
              │   └─ ExpandedDetails
              └─ Pagination
```

### React Hooks Used

- **useDatasetSearch**: Searches datasets with fulltext query
- **useState**: Local component state management
- **DkanClientProvider**: Provides DKAN client to all components

### File Structure

```
dkan_client_demo_react/
├── dkan_client_demo_react.info.yml       # Module definition (depends on base module)
├── dkan_client_demo_react.libraries.yml  # Asset libraries (declares React deps)
├── package.json                          # Build config & dependencies
├── vite.config.js                        # Vite build configuration
├── README.md                             # This file
├── src/
│   ├── jsx/
│   │   └── dataset-search-widget.jsx    # JSX source (edit this!)
│   └── Plugin/
│       └── Block/
│           └── DatasetSearchBlock.php   # Block plugin
├── js/
│   ├── dataset-search-widget.min.js     # Compiled widget (generated)
│   └── dataset-search-widget.min.js.map # Source map (generated)
└── css/
    └── dataset-search-widget.css        # Styles
```

## Configuration

The module passes configuration through `drupalSettings`:

```php
'drupalSettings' => [
  'dkanClientDemoReact' => [
    'baseUrl' => '/api',  // DKAN API base URL
  ],
],
```

You can modify `src/Plugin/Block/DatasetSearchBlock.php` to change:
- `baseUrl`: DKAN API endpoint (default: `/api`)
- Add authentication tokens
- Add custom query parameters

## Dependencies

### Runtime Dependencies

**External (from base module):**
- DkanClientToolsReact (self-contained with React 18.3.1, ReactDOM 18.3.1, React Query 5.x, and all DKAN hooks)
  - Provided by `dkan_client_tools_react_base/dkan-client-react`
  - Size: ~205KB minified

**Bundled in widget:**
- Only widget-specific code (~5.5KB)

### Build Dependencies

In `package.json`:
- `vite` - Modern build tool
- `@vitejs/plugin-react` - React plugin for Vite
- `terser` - JavaScript minifier
- `react` & `react-dom` - Development dependencies
- `@dkan-client-tools/react` - DKAN Client Tools React package

### Drupal Module Dependencies

- `dkan_client_tools_react_base` - Provides DkanClientToolsReact (self-contained library)
- `core/drupal` - Drupal core JavaScript
- `core/once` - Ensures components are initialized only once

## Architecture

This module uses a two-library approach:

1. **Base Library** (`dkan_client_tools_react_base/dkan-client-react`):
   - Self-contained IIFE with React, ReactDOM, React Query, and all DKAN hooks
   - ~205KB minified
   - Can be shared across multiple widgets
   - Exports as `window.DkanClientToolsReact`

2. **Widget Code** (`dataset-search-widget.min.js`):
   - Small IIFE that externalizes DkanClientToolsReact
   - ~5.5KB minified
   - Contains only widget-specific logic
   - Imports from `window.DkanClientToolsReact`

**Total Size**: ~210KB (vs ~625KB if everything bundled separately)

## Development

### Modifying the React Component

The widget is written in **JSX** for better readability and maintainability.

**Source file:** `src/jsx/dataset-search-widget.jsx` (JSX with modern React syntax)
**Compiled files:**
- `js/dataset-search-widget.min.js` (minified, used in production)
- `js/dataset-search-widget.min.js.map` (source map for debugging)

The JSX source uses:
- Modern JSX syntax
- ES6 imports (`import React from 'react'`)
- Functional components with hooks
- Props for component communication
- External React/ReactDOM (provided at runtime by base module)

**To modify the widget:**

1. Edit `src/jsx/dataset-search-widget.jsx`
2. Rebuild:
   ```bash
   npm run build       # Build once
   npm run watch       # Watch for changes
   ```
3. Clear Drupal cache: `ddev drush cr`

### Updating Styles

Edit `css/dataset-search-widget.css` to customize the appearance. The module uses a blue color scheme to differentiate from the core module (orange).

### Build Scripts

Available npm scripts:

```bash
npm run build       # Build minified version with source map
npm run watch       # Watch for changes and rebuild
npm run clean       # Remove generated files
```

The build process:
1. Vite reads `src/jsx/dataset-search-widget.jsx`
2. Compiles JSX to JavaScript
3. Bundles React Query and DKAN Client Tools
4. Externalizes React and ReactDOM (maps to window.React, window.ReactDOM)
5. Minifies with terser
6. Generates source map
7. Outputs to `js/dataset-search-widget.min.js`

## Troubleshooting

### Module doesn't appear in block list

1. Clear Drupal cache: `ddev drush cr`
2. Rebuild registry: `ddev drush php-eval "drupal_flush_all_caches();"`
3. Check module is enabled: `ddev drush pml | grep dkan_client`

### Widget shows errors

1. Check browser console for JavaScript errors
2. Verify DKAN API is accessible at `/api`
3. Check CORS settings if DKAN is on different domain
4. Ensure build was successful: `ls -lh js/dataset-search-widget.min.js`

### Build fails

1. Ensure Node.js 20+ is installed
2. Verify base module is enabled: `ddev drush en dkan_client_tools_react_base`
3. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
4. Check that monorepo packages are built: `cd ../../../../../packages/dkan-client-tools-react && npm run build`

### React not found error

If you see "React is not defined" or "ReactDOM is not defined" in the browser console:
1. Ensure `dkan_client_tools_react_base` module is enabled
2. Clear Drupal cache: `ddev drush cr`
3. Check library dependencies in `dkan_client_demo_react.libraries.yml`
4. Verify React libraries are loading before the widget (check Network tab)

### Data not loading

1. Verify DKAN API endpoint is correct
2. Check API responses in Network tab
3. Test API directly: `curl https://your-site.ddev.site/api/1/search`
4. Check baseUrl in Block PHP class

## Resources

- [DKAN Client Tools React Package](../../../../../packages/dkan-client-tools-react/)
- [DKAN Client Tools React Base Module](../dkan_client_tools_react_base/)
- [React Documentation](https://react.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Vite Documentation](https://vite.dev/)
- [DKAN Documentation](https://dkan.readthedocs.io/)

## License

Same as the DKAN Client Tools monorepo.
