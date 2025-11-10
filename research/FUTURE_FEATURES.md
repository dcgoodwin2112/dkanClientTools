# Future Feature Ideas for DKAN Client Tools

This document outlines potential features that could be added to the dkanClientTools packages to make developing frontend applications for DKAN easier and faster.

## Current Status

The packages currently provide:
- ✅ Data fetching and caching (via TanStack Query)
- ✅ 40+ React hooks for all DKAN APIs
- ✅ TypeScript types for DCAT-US schema
- ✅ Comprehensive test coverage (218 tests)

## Proposed Features

### 1. Form Generation & Validation

**Problem**: Creating forms for DCAT-US datasets is tedious and error-prone

**Solutions**:
- **Auto-generated Forms**: Generate React forms from DCAT-US schema
- **Schema Validation**: Runtime validation using Zod or Yup based on DCAT-US spec
- **Field-level Validation**: Real-time validation with helpful error messages
- **Conditional Fields**: Show/hide fields based on other field values
- **Custom Field Renderers**: Override default inputs for specific fields

**Example Usage**:
```typescript
import { useDcatForm, DcatFormGenerator } from '@dkan-client-tools/react'

function CreateDataset() {
  const createDataset = useCreateDataset()

  const form = useDcatForm({
    schema: 'dataset',
    defaultValues: { accessLevel: 'public' },
    onSubmit: (data) => createDataset.mutate(data)
  })

  return <DcatFormGenerator form={form} />
}
```

**Benefits**:
- Reduces boilerplate by 80%
- Ensures DCAT-US compliance
- Consistent validation across apps
- Accessible forms by default

---

### 2. Pre-built UI Components

**Problem**: Every DKAN app rebuilds the same UI patterns

**Solutions**:

#### Core Components
- **DatasetCard** - Display dataset summary with thumbnail, title, description, tags
- **DatasetList** - Paginated dataset listing with filters
- **DatasetGrid** - Grid layout for datasets
- **SearchBar** - Autocomplete search with facets
- **FacetPanel** - Checkbox filters for themes, publishers, formats
- **DistributionDownloader** - Download button with format selector
- **DistributionList** - List of distributions with icons
- **DataTable** - Datastore results viewer with sorting/filtering
- **DataPreview** - Preview CSV, JSON, XML data
- **HarvestPlanManager** - UI for managing harvest plans
- **HarvestRunStatus** - Display harvest run progress
- **WorkflowStateBadge** - Visual indicators for dataset states (draft, published, etc.)
- **DataDictionaryViewer** - Display data dictionary schema
- **MetadataViewer** - Display dataset metadata in a clean layout
- **ThemeBadge** - Colored badges for dataset themes
- **PublisherInfo** - Display publisher organization info

**Example Usage**:
```typescript
import { DatasetCard, DatasetList, SearchBar } from '@dkan-client-tools/react-components'

function DatasetsPage() {
  const [search, setSearch] = useState('')

  return (
    <>
      <SearchBar value={search} onChange={setSearch} />
      <DatasetList
        searchOptions={{ keyword: search, theme: 'health' }}
        renderItem={(dataset) => (
          <DatasetCard
            dataset={dataset}
            showThumbnail
            showDistributions
          />
        )}
      />
    </>
  )
}
```

**Package Structure**:
```
@dkan-client-tools/react-components
├── src/
│   ├── DatasetCard/
│   ├── DatasetList/
│   ├── SearchBar/
│   ├── FacetPanel/
│   └── ...
```

**Benefits**:
- Rapid prototyping
- Consistent UI across DKAN apps
- Accessibility built-in (WCAG 2.1 AA)
- Customizable via props/slots
- Tree-shakeable

---

### 3. File Upload & Distribution Management

**Problem**: Uploading files and managing distributions is complex

**Solutions**:
- **useFileUpload** hook with progress tracking
- **Drag-and-drop** file upload component
- **Distribution builder** for creating resource objects
- **Format detection** and validation
- **Large file chunking** for reliable uploads
- **Upload resumption** for interrupted transfers
- **Multi-file uploads** with parallel processing
- **S3/Cloud storage** integration

**Example Usage**:
```typescript
import { useFileUpload, FileDropzone } from '@dkan-client-tools/react'

function AddDistribution({ datasetId }) {
  const { upload, progress, error, isUploading } = useFileUpload({
    datasetId,
    onComplete: (distribution) => {
      console.log('Distribution created:', distribution.identifier)
    }
  })

  return (
    <FileDropzone
      onDrop={(files) => upload(files[0])}
      accept=".csv,.json,.xml"
      maxSize={100 * 1024 * 1024} // 100MB
    >
      {isUploading ? (
        <UploadProgress percent={progress} />
      ) : (
        'Drag & drop file here'
      )}
    </FileDropzone>
  )
}
```

**Benefits**:
- Handles large files reliably
- Better UX with progress indicators
- Automatic format detection
- Validates file types

---

### 4. Developer Tools Integration

**Problem**: Hard to debug queries and cache state

**Solutions**:
- **React DevTools Plugin** showing DKAN queries
- **Query Inspector** to view cache contents
- **Network Monitor** for API calls
- **Schema Validator** showing validation errors
- **Performance Profiler** for slow queries
- **Cache Visualizer** showing query dependencies

**Example**:
```typescript
import { DkanDevTools } from '@dkan-client-tools/devtools'

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && <DkanDevTools />}
    </>
  )
}
```

**Features**:
- View all active queries
- Inspect query data and metadata
- Trigger refetches manually
- Clear cache
- View request/response for each query
- Performance metrics

---

### 5. Testing Utilities

**Problem**: Setting up tests requires lots of boilerplate

**Solutions**:
- **Mock Data Generators** - Generate realistic DCAT-US datasets
- **Test Wrappers** - Pre-configured DkanClientProvider for tests
- **Query Mocks** - Easy mocking of specific queries
- **MSW Handlers** - Mock Service Worker handlers for DKAN APIs
- **Test Fixtures** - Pre-built dataset/distribution objects
- **Factory Functions** - Build test data with overrides

**Example Usage**:
```typescript
import {
  createMockDataset,
  createMockDistribution,
  mockDkanHandlers,
  renderWithDkanClient
} from '@dkan-client-tools/testing'

describe('DatasetDetail', () => {
  it('renders dataset info', async () => {
    const dataset = createMockDataset({
      title: 'Test Dataset',
      theme: ['health', 'education'],
      distribution: [
        createMockDistribution({ format: 'CSV' })
      ]
    })

    server.use(
      ...mockDkanHandlers({
        getDataset: () => dataset
      })
    )

    const { getByText } = renderWithDkanClient(
      <DatasetDetail id={dataset.identifier} />
    )

    expect(getByText('Test Dataset')).toBeInTheDocument()
  })
})
```

**Benefits**:
- Faster test writing
- Realistic test data
- Easy API mocking
- Reduces test boilerplate

---

### 6. CSV/Excel Import Tools

**Problem**: Users need to import datasets from spreadsheets

**Solutions**:
- **CSV to Dataset converter**
- **Excel to Data Dictionary mapper**
- **Bulk dataset import** from CSV
- **Field mapping UI** for non-standard formats
- **Import validation** and error reporting
- **Preview before import**
- **Template generators** for CSV formats

**Example Usage**:
```typescript
import { useBulkImport, ImportMapper } from '@dkan-client-tools/react'

function BulkImport() {
  const { importDatasets, progress } = useBulkImport()
  const [mapping, setMapping] = useState({})

  return (
    <>
      <ImportMapper
        csvHeaders={['Title', 'Desc', 'Tags']}
        dcatFields={['title', 'description', 'keyword']}
        value={mapping}
        onChange={setMapping}
      />

      <button onClick={() => importDatasets.mutate({
        file: csvFile,
        mapping,
        onProgress: (completed, total) => {
          console.log(`${completed}/${total} datasets imported`)
        }
      })}>
        Import {rowCount} Datasets
      </button>
    </>
  )
}
```

**Benefits**:
- Bulk data migration
- Excel/CSV → DKAN workflow
- User-friendly mapping UI
- Validation before import

---

### 7. Batch Operations

**Problem**: No way to perform bulk operations efficiently

**Solutions**:
- **Bulk dataset updates** with progress tracking
- **Batch delete** with confirmation
- **Bulk state changes** (publish multiple datasets)
- **Parallel operations** with concurrency control
- **Rollback on error** for atomic operations
- **Batch tagging/categorization**

**Example Usage**:
```typescript
import { useBatchUpdateDatasets, useBatchDelete } from '@dkan-client-tools/react'

function BulkEditor({ selectedIds }) {
  const batchUpdate = useBatchUpdateDatasets()

  return (
    <button onClick={() => {
      batchUpdate.mutate({
        identifiers: selectedIds,
        updates: {
          publisher: { name: 'New Publisher' },
          modified: new Date().toISOString()
        },
        concurrency: 5, // 5 at a time
        onProgress: (completed, total) => {
          console.log(`Updated ${completed}/${total}`)
        }
      })
    }}>
      Update {selectedIds.length} Datasets
    </button>
  )
}
```

**Benefits**:
- Efficient bulk operations
- Progress tracking
- Error handling for partial failures
- Concurrency control

---

### 8. Offline Support & PWA Features

**Problem**: Apps don't work offline or with poor connectivity

**Solutions**:
- **Offline-first caching** strategy
- **Background sync** for mutations
- **Service worker integration**
- **Optimistic updates** with rollback
- **Queue pending mutations**
- **Network status detection**
- **Retry failed requests**

**Example Usage**:
```typescript
import { useOfflineSync, OfflineIndicator } from '@dkan-client-tools/react'

function App() {
  const { isOnline, pendingMutations } = useOfflineSync({
    syncOnReconnect: true
  })

  return (
    <>
      {!isOnline && (
        <OfflineIndicator
          pendingCount={pendingMutations.length}
        />
      )}
      <YourApp />
    </>
  )
}
```

**Benefits**:
- Works offline
- Better mobile experience
- Handles poor connectivity
- PWA ready

---

### 9. Analytics & Monitoring Hooks

**Problem**: No visibility into how users interact with data

**Solutions**:
- **useAnalytics** hook for tracking dataset views
- **Download tracking** integration
- **Search analytics** (popular queries, zero results)
- **Performance metrics** (query times, cache hit rates)
- **Error tracking** integration
- **Custom event tracking**

**Example Usage**:
```typescript
import { useAnalytics, AnalyticsProvider } from '@dkan-client-tools/react'

function DatasetDetail({ id }) {
  const { trackDatasetView, trackDownload } = useAnalytics()
  const { data } = useDataset({ identifier: id })

  useEffect(() => {
    if (data) {
      trackDatasetView(id, { title: data.title })
    }
  }, [data, id])

  return (
    <button onClick={() => {
      trackDownload(distribution.downloadURL, {
        format: distribution.format,
        datasetId: id
      })
    }}>
      Download
    </button>
  )
}

// In app root
<AnalyticsProvider
  providers={[googleAnalytics, plausible]}
>
  <App />
</AnalyticsProvider>
```

**Benefits**:
- Understand user behavior
- Track popular datasets
- Identify issues (404s, errors)
- Performance insights

---

### 10. CLI & Code Generation

**Problem**: Starting a new DKAN app requires setup

**Solutions**:
- **CLI tool** to scaffold new apps
- **Code generator** for hooks based on API endpoints
- **Migration scripts** for schema updates
- **Configuration wizard** for connecting to DKAN instance
- **Component generators** for common patterns
- **TypeScript type generation** from API

**Example Usage**:
```bash
# Create new DKAN app
npx create-dkan-app my-app
cd my-app

# Configure DKAN connection
npm run dkan:config
# Prompts for baseUrl, auth, etc.

# Generate component
npm run generate:component DatasetList

# Start dev server
npm run dev
```

**Generated Project**:
```
my-app/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── dkan.config.ts      # DKAN client config
│   ├── components/
│   └── pages/
├── package.json
└── vite.config.ts
```

**Benefits**:
- Quick start for new projects
- Best practices by default
- Consistent project structure
- Reduces setup time

---

### 11. Internationalization (i18n)

**Problem**: DKAN apps need multi-language support

**Solutions**:
- **Translated labels** for DCAT-US fields
- **Language detection** and switching
- **RTL support** for Arabic, Hebrew
- **Date/number formatting** per locale
- **Pluralization** support
- **Translation management**

**Example Usage**:
```typescript
import { DkanI18nProvider, useTranslation } from '@dkan-client-tools/react'

function DatasetCard({ dataset }) {
  const { t, locale } = useTranslation()

  return (
    <div>
      <label>{t('dataset.title')}</label>
      <h3>{dataset.title}</h3>

      <label>{t('dataset.modified')}</label>
      <time>{formatDate(dataset.modified, locale)}</time>
    </div>
  )
}

// In app root
<DkanI18nProvider locale="es" messages={esMessages}>
  <App />
</DkanI18nProvider>
```

**Supported Languages**:
- English (default)
- Spanish
- French
- Arabic (RTL)
- And more...

**Benefits**:
- Multi-language support
- Localized dates/numbers
- RTL support
- Accessible to global users

---

### 12. Advanced Search Features

**Problem**: Basic search isn't powerful enough

**Solutions**:
- **Faceted search components** with checkboxes
- **Advanced query builder** UI
- **Search suggestions** and autocomplete
- **Saved searches** functionality
- **Search history** tracking
- **Fuzzy search** for typos
- **Search result highlighting**
- **Filter chips** for active filters

**Example Usage**:
```typescript
import {
  useFacetedSearch,
  FacetPanel,
  SearchSuggestions,
  SavedSearches
} from '@dkan-client-tools/react'

function AdvancedSearch() {
  const {
    filters,
    setFilter,
    clearFilter,
    results,
    suggestions
  } = useFacetedSearch({
    facets: ['theme', 'publisher', 'format', 'keyword']
  })

  return (
    <>
      <SearchBar
        suggestions={suggestions}
        onSearch={(query) => setFilter('keyword', query)}
      />

      <SavedSearches onLoad={(search) => setFilter(search)} />

      <FacetPanel
        facets={filters}
        onChange={setFilter}
        onClear={clearFilter}
      />

      <DatasetList results={results} />
    </>
  )
}
```

**Benefits**:
- Power user features
- Better discoverability
- Saved searches for repeat queries
- Faceted navigation

---

### 13. Data Visualization Helpers

**Problem**: Displaying datastore data in charts requires integration

**Solutions**:
- **Chart adapters** for popular libraries (Chart.js, Recharts, D3)
- **useDatastoreChart** hook with chart type selection
- **Map integration** for geographic data (Leaflet, Mapbox)
- **Preview components** for different formats
- **Dashboard builder** for multi-chart views
- **Export charts** as images

**Example Usage**:
```typescript
import { useDatastoreChart, ChartPreview } from '@dkan-client-tools/react'
import { LineChart } from 'recharts'

function DataVisualization({ datasetId }) {
  const { data, chartConfig } = useDatastoreChart({
    datasetId,
    index: 0,
    chartType: 'line',
    xAxis: 'date',
    yAxis: 'value',
    transforms: [
      { type: 'sort', field: 'date' },
      { type: 'filter', condition: { field: 'status', value: 'active' } }
    ]
  })

  return <LineChart data={data} {...chartConfig} />
}

// Or use preview component
function QuickPreview({ datasetId }) {
  return <ChartPreview datasetId={datasetId} />
}
```

**Supported Chart Types**:
- Line charts
- Bar charts
- Pie charts
- Scatter plots
- Geographic maps
- Heatmaps

**Benefits**:
- Easy data visualization
- Integration with popular libraries
- Interactive charts
- Export capabilities

---

## Priority Recommendations

### High Priority (Most Impact)
1. **Form Generation & Validation** - Saves tons of boilerplate, ensures DCAT-US compliance
2. **Pre-built UI Components** - Accelerates development, consistent UX
3. **Testing Utilities** - Essential for quality, reduces test boilerplate

### Medium Priority
4. **File Upload & Distribution Management** - Common requirement
5. **Batch Operations** - Power user feature, efficiency gains
6. **Developer Tools** - Better DX, easier debugging

### Nice to Have
7. **CLI & Code Generation** - Quick start for new projects
8. **Analytics & Monitoring** - Usage insights
9. **Internationalization** - Global reach
10. **Advanced Search** - Power user features
11. **Data Visualization** - Better data exploration
12. **CSV/Excel Import** - Data migration
13. **Offline Support** - Mobile/PWA features

## Implementation Approach

### Phase 1: Foundation
- Form generation & validation
- Basic UI components (DatasetCard, DatasetList)
- Testing utilities

### Phase 2: Power Features
- File upload
- Batch operations
- Developer tools

### Phase 3: Polish
- CLI tool
- Advanced search
- Data visualization
- i18n support

## Package Structure Proposal

```
@dkan-client-tools/
├── core                    # ✅ Already exists
├── react                   # ✅ Already exists
├── react-components        # NEW: Pre-built UI components
├── react-forms            # NEW: Form generation & validation
├── testing                # NEW: Testing utilities
├── devtools               # NEW: Developer tools
├── cli                    # NEW: CLI tool
└── visualization          # NEW: Chart/map helpers
```

## Next Steps

1. Gather feedback on priorities
2. Create detailed specs for Phase 1 features
3. Prototype form generation
4. Build initial component library
5. Develop testing utilities
6. Iterate based on user feedback

---

**Note**: This is a living document. Features may be added, removed, or reprioritized based on community feedback and usage patterns.
