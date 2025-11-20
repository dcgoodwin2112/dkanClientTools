# React Catalog App

Full-featured data catalog demo application showcasing @dkan-client-tools/react with TanStack Router and TanStack Table integration.

## Features

- **TanStack Router** - Type-safe file-based routing
- **TanStack Table** - Headless table components for data display
- **Font Awesome** - Icon library via npm packages
- **DKAN Integration** - Complete integration with DKAN REST APIs
- **TypeScript** - Full type safety throughout

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 10.0.0
- Local DKAN instance running at https://dkan.ddev.site

### Setup

```bash
# From repository root
npm install

# Start dev server
npm run dev:catalog

# Or from this directory
npm run dev
```

The app will be available at http://localhost:5173

### Building

```bash
# From repository root
npm run build:catalog

# Or from this directory
npm run build
```

## Project Structure

```
src/
├── routes/           # TanStack Router routes
│   ├── __root.tsx   # Root layout
│   └── index.tsx    # Home page
├── components/       # Reusable components
├── styles/          # CSS files
├── utils/           # Helper functions
└── main.tsx         # Entry point with Font Awesome config
```

## Vite Proxy

The dev server proxies `/api` requests to the local DKAN instance at `https://dkan.ddev.site` to avoid CORS issues.

## Dependencies

- React 19.2.0
- @dkan-client-tools/react (workspace)
- @tanstack/react-router
- @tanstack/react-table
- @tanstack/react-query
- Font Awesome packages

## Status

**Phase 1 Complete** - Project infrastructure set up and verified.

Next phases will implement:
- Layout components (Header, Footer)
- Home page
- Browse/search page
- Dataset detail page
- CSV preview with TanStack Table
