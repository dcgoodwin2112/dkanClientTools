# React Catalog App

Full-featured data catalog demo application showcasing @dkan-client-tools/react with TanStack Router and TanStack Table integration.

## Features

- **Home Page** - Hero section with search, feature cards, and call-to-action
- **Browse & Search** - Full-text search with pagination
- **Faceted Filtering** - Filter by theme and publisher with active filter display
- **Dataset Detail** - Complete metadata display with distributions/resources
- **Data Preview** - Interactive table preview with TanStack Table for CSV data
- **Responsive Design** - Mobile-friendly layout throughout
- **TanStack Router** - Type-safe file-based routing with search params
- **TanStack Table** - Headless table components with dynamic columns
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
├── routes/                      # TanStack Router routes
│   ├── __root.tsx              # Root layout with Header/Footer
│   ├── index.tsx               # Home page
│   ├── browse.tsx              # Browse/search page with filters
│   └── dataset.$identifier.tsx # Dataset detail page
├── components/                  # Reusable components
│   ├── Header.tsx              # Navigation header
│   ├── Footer.tsx              # Footer with links
│   ├── SearchBar.tsx           # Search input component
│   ├── DatasetCard.tsx         # Dataset list item
│   ├── Pagination.tsx          # Pagination controls
│   ├── FilterPanel.tsx         # Sidebar filter component
│   └── DataPreview.tsx         # Data table preview
├── styles/                      # CSS files
│   ├── global.css              # Global styles and resets
│   ├── Header.css              # Header styling
│   ├── Footer.css              # Footer styling
│   ├── Home.css                # Home page styling
│   ├── SearchBar.css           # Search bar styling
│   ├── Browse.css              # Browse page styling
│   ├── DatasetCard.css         # Dataset card styling
│   ├── Pagination.css          # Pagination styling
│   ├── FilterPanel.css         # Filter panel styling
│   ├── DatasetDetail.css       # Dataset detail styling
│   └── DataPreview.css         # Data preview styling
└── main.tsx                     # Entry point with Font Awesome config
```

## Vite Proxy

The dev server proxies `/api` requests to the local DKAN instance at `https://dkan.ddev.site` to avoid CORS issues.

## Key Hooks Used

- `useDatasetSearch` - Search datasets with pagination and filters
- `useDatasetFacets` - Get available filter values (themes, publishers)
- `useDataset` - Fetch single dataset by identifier
- `useDatastore` - Query datastore data for CSV preview
- `createDatastoreColumns` - Generate TanStack Table columns from schema
- `useReactTable` - TanStack Table instance management

## Dependencies

- React 19.2.0
- @dkan-client-tools/react (workspace)
- @tanstack/react-router
- @tanstack/react-table
- @tanstack/react-query
- Font Awesome packages

## Implementation Status

All phases complete:

- ✅ **Phase 1** - Project infrastructure
- ✅ **Phase 2** - Layout components (Header, Footer)
- ✅ **Phase 3** - Home page with search
- ✅ **Phase 4** - Browse page with dataset search
- ✅ **Phase 5** - Filters and facets (theme, publisher)
- ✅ **Phase 6** - Dataset detail page
- ✅ **Phase 7** - CSV preview with TanStack Table
- ✅ **Phase 8** - Polish, documentation, and testing

## User Flows

### Browse and Search
1. Enter search query in home page or browse page
2. View results with pagination
3. Filter by theme or publisher
4. Click dataset card to view details

### View Dataset Details
1. Navigate to dataset detail page
2. View metadata, tags, themes, contact info
3. Download resources or preview data
4. Toggle data preview for CSV resources

### Preview Data
1. Click "Preview Data" button on distribution
2. View interactive table with pagination
3. Navigate through pages of data
4. Close preview when done
