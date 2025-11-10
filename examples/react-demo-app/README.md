# DKAN Client Tools - React Test Application

This is a test React application demonstrating the use of `@dkan-client-tools/react` and `@dkan-client-tools/core` packages.

## Features Demonstrated

- **DkanClientProvider** - React Context Provider for the DKAN client
- **useDatasetSearch** - Hook for searching datasets with filters
- **useDataset** - Hook for fetching individual dataset details
- **Smart Caching** - Automatic data caching and deduplication
- **TypeScript** - Full type safety with DCAT-US schema

## Prerequisites

Make sure the local DKAN site is running:

```bash
cd ../dkan
ddev start
```

The app is configured to connect to `https://dkan.ddev.site`

## Running the App

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The app will open at http://localhost:5173

## What the App Does

1. **Dataset Search** - Shows a list of datasets from your local DKAN site
2. **Dataset Details** - Click any dataset to view comprehensive information
3. **Smart Caching** - Automatic caching and background refetching

See the full README at /Users/dgoodwinVA/Sites/dkanClientTools/README.md
