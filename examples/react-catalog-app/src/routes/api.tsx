import { createFileRoute } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../styles/ApiDocs.css'

export const Route = createFileRoute('/api')({
  component: ApiDocs,
})

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  description: string
  hooks?: string[]
  example?: string
}

interface ApiCategory {
  title: string
  icon: string
  description: string
  endpoints: Endpoint[]
}

const apiCategories: ApiCategory[] = [
  {
    title: 'Metastore API',
    icon: 'database',
    description: 'Dataset metadata operations (DCAT-US schema)',
    endpoints: [
      {
        method: 'GET',
        path: '/api/1/metastore/schemas/dataset/items',
        description: 'List all datasets',
        hooks: ['useAllDatasets'],
        example: `const { data } = useAllDatasets()`,
      },
      {
        method: 'GET',
        path: '/api/1/metastore/schemas/dataset/items/{id}',
        description: 'Get single dataset by identifier',
        hooks: ['useDataset'],
        example: `const { data } = useDataset({ identifier: 'abc-123' })`,
      },
      {
        method: 'POST',
        path: '/api/1/metastore/schemas/dataset/items',
        description: 'Create a new dataset',
        hooks: ['useCreateDataset'],
        example: `const { mutate } = useCreateDataset()
mutate(datasetData)`,
      },
      {
        method: 'PUT',
        path: '/api/1/metastore/schemas/dataset/items/{id}',
        description: 'Replace entire dataset',
        hooks: ['useUpdateDataset'],
        example: `const { mutate } = useUpdateDataset()
mutate({ identifier: 'abc-123', data: datasetData })`,
      },
      {
        method: 'PATCH',
        path: '/api/1/metastore/schemas/dataset/items/{id}',
        description: 'Partial update of dataset',
        hooks: ['usePatchDataset'],
        example: `const { mutate } = usePatchDataset()
mutate({ identifier: 'abc-123', data: partialData })`,
      },
      {
        method: 'DELETE',
        path: '/api/1/metastore/schemas/dataset/items/{id}',
        description: 'Delete dataset',
        hooks: ['useDeleteDataset'],
        example: `const { mutate } = useDeleteDataset()
mutate({ identifier: 'abc-123' })`,
      },
      {
        method: 'GET',
        path: '/api/1/metastore/schemas',
        description: 'List all available schemas',
        hooks: ['useSchemas'],
        example: `const { data } = useSchemas()`,
      },
      {
        method: 'GET',
        path: '/api/1/metastore/schemas/{schema_id}',
        description: 'Get schema definition',
        hooks: ['useSchema'],
        example: `const { data } = useSchema({ schemaId: 'dataset' })`,
      },
    ],
  },
  {
    title: 'Search API',
    icon: 'search',
    description: 'Full-text search with faceting and filtering',
    endpoints: [
      {
        method: 'GET',
        path: '/api/1/search',
        description: 'Search datasets with filters (fulltext, theme, keyword, publisher)',
        hooks: ['useDatasetSearch'],
        example: `const { data } = useDatasetSearch({
  fulltext: 'health',
  theme: 'Health Care'
})`,
      },
      {
        method: 'GET',
        path: '/api/1/search/facets',
        description: 'Get available facet values for filtering',
        hooks: ['useDatasetFacets'],
        example: `const { data } = useDatasetFacets()
// Returns: { theme: [...], keyword: [...], publisher: [...] }`,
      },
    ],
  },
  {
    title: 'Datastore API',
    icon: 'table',
    description: 'Query and download tabular data',
    endpoints: [
      {
        method: 'POST',
        path: '/api/1/datastore/query/{dataset_id}/{index}',
        description: 'Query single resource with conditions, sorting, and pagination',
        hooks: ['useDatastore'],
        example: `const { data } = useDatastore({
  datasetId: 'abc-123',
  index: 0,
  queryOptions: {
    limit: 10,
    offset: 0,
    conditions: [{ property: 'age', value: '30', operator: '>' }]
  }
})`,
      },
      {
        method: 'POST',
        path: '/api/1/datastore/query',
        description: 'Query multiple resources with JOINs',
        hooks: ['useQueryDatastoreMulti'],
        example: `const { data } = useQueryDatastoreMulti({
  resources: [
    { id: 'abc-123', alias: 't1' },
    { id: 'def-456', alias: 't2' }
  ]
})`,
      },
      {
        method: 'GET',
        path: '/api/1/datastore/query/{dataset_id}/{index}?schema=true',
        description: 'Get Frictionless Table Schema only',
        hooks: ['useDatastoreSchema'],
        example: `const { data } = useDatastoreSchema({
  datasetId: 'abc-123',
  index: 0
})`,
      },
      {
        method: 'GET',
        path: '/api/1/datastore/query/{dataset_id}/{index}/download',
        description: 'Download query results as CSV',
        hooks: ['useDownloadQuery', 'useDownloadQueryByDistribution'],
        example: `const url = useDownloadQuery({
  datasetId: 'abc-123',
  index: 0
})`,
      },
      {
        method: 'GET',
        path: '/api/1/datastore/sql?query=[SELECT * FROM t]',
        description: 'Execute SQL query (bracket notation)',
        hooks: ['useSqlQuery'],
        example: `const { data } = useSqlQuery({
  query: '[SELECT * FROM t]'
})`,
      },
      {
        method: 'POST',
        path: '/api/1/datastore/sql',
        description: 'Execute SQL query via POST',
        hooks: ['useExecuteSqlQuery'],
        example: `const { mutate } = useExecuteSqlQuery()
mutate({ query: 'SELECT * FROM t' })`,
      },
    ],
  },
  {
    title: 'Data Dictionary API',
    icon: 'book',
    description: 'Frictionless Table Schema definitions',
    endpoints: [
      {
        method: 'GET',
        path: '/api/1/metastore/schemas/data-dictionary/items',
        description: 'List all data dictionaries',
        hooks: ['useDataDictionaryList'],
        example: `const { data } = useDataDictionaryList()`,
      },
      {
        method: 'GET',
        path: '/api/1/metastore/schemas/data-dictionary/items/{id}',
        description: 'Get single data dictionary',
        hooks: ['useDataDictionary'],
        example: `const { data } = useDataDictionary({
  identifier: 'dict-123'
})`,
      },
      {
        method: 'POST',
        path: '/api/1/metastore/schemas/data-dictionary/items',
        description: 'Create data dictionary',
      },
      {
        method: 'PUT',
        path: '/api/1/metastore/schemas/data-dictionary/items/{id}',
        description: 'Update data dictionary',
      },
      {
        method: 'DELETE',
        path: '/api/1/metastore/schemas/data-dictionary/items/{id}',
        description: 'Delete data dictionary',
      },
    ],
  },
  {
    title: 'Harvest API',
    icon: 'download',
    description: 'External data source harvesting',
    endpoints: [
      {
        method: 'GET',
        path: '/api/1/harvest/plans',
        description: 'List all harvest plans',
        hooks: ['useHarvestPlans'],
        example: `const { data } = useHarvestPlans()`,
      },
      {
        method: 'GET',
        path: '/api/1/harvest/plans/{plan_id}',
        description: 'Get harvest plan details',
        hooks: ['useHarvestPlan'],
        example: `const { data } = useHarvestPlan({
  planId: 'plan-123'
})`,
      },
      {
        method: 'POST',
        path: '/api/1/harvest/plans',
        description: 'Register new harvest plan',
        hooks: ['useRegisterHarvestPlan'],
        example: `const { mutate } = useRegisterHarvestPlan()
mutate(planData)`,
      },
      {
        method: 'POST',
        path: '/api/1/harvest/runs',
        description: 'Execute harvest run',
        hooks: ['useRunHarvest'],
        example: `const { mutate } = useRunHarvest()
mutate({ planId: 'plan-123' })`,
      },
      {
        method: 'GET',
        path: '/api/1/harvest/runs?plan={plan_id}',
        description: 'Get harvest runs for a plan',
        hooks: ['useHarvestRuns'],
        example: `const { data } = useHarvestRuns({
  planId: 'plan-123'
})`,
      },
      {
        method: 'GET',
        path: '/api/1/harvest/runs/{run_id}?plan={plan_id}',
        description: 'Get harvest run details',
        hooks: ['useHarvestRun'],
        example: `const { data } = useHarvestRun({
  planId: 'plan-123',
  runId: 'run-456'
})`,
      },
    ],
  },
  {
    title: 'Datastore Import API',
    icon: 'file-import',
    description: 'Manage datastore import operations',
    endpoints: [
      {
        method: 'GET',
        path: '/api/1/datastore/imports',
        description: 'List all datastore imports',
        hooks: ['useDatastoreImports'],
        example: `const { data } = useDatastoreImports()`,
      },
      {
        method: 'GET',
        path: '/api/1/datastore/imports/{id}',
        description: 'Get import status',
        hooks: ['useDatastoreImport'],
        example: `const { data } = useDatastoreImport({
  identifier: 'abc-123'
})`,
      },
      {
        method: 'POST',
        path: '/api/1/datastore/imports',
        description: 'Trigger datastore import',
        hooks: ['useTriggerDatastoreImport'],
        example: `const { mutate } = useTriggerDatastoreImport()
mutate({ identifier: 'abc-123' })`,
      },
      {
        method: 'DELETE',
        path: '/api/1/datastore/imports/{id}',
        description: 'Delete datastore',
        hooks: ['useDeleteDatastore'],
        example: `const { mutate } = useDeleteDatastore()
mutate({ identifier: 'abc-123' })`,
      },
    ],
  },
]

function ApiDocs() {
  return (
    <div className="api-docs-page">
      <div className="api-docs-container">
        <header className="api-docs-header">
          <h1 className="api-docs-title">
            <FontAwesomeIcon icon="code" /> DKAN API Documentation
          </h1>
          <p className="api-docs-subtitle">
            REST API endpoints for data catalog operations
          </p>
        </header>

        {apiCategories.map((category) => (
          <section key={category.title} className="api-category">
            <div className="api-category-header">
              <h2 className="api-category-title">
                <FontAwesomeIcon icon={category.icon as any} />
                {category.title}
              </h2>
              <p className="api-category-description">{category.description}</p>
            </div>
            <div className="api-category-body">
              {category.endpoints.map((endpoint, index) => (
                <div key={index} className="api-endpoint">
                  <div className="api-endpoint-header">
                    <span className={`api-method ${endpoint.method.toLowerCase()}`}>
                      {endpoint.method}
                    </span>
                    <code className="api-endpoint-path">{endpoint.path}</code>
                  </div>
                  <p className="api-endpoint-description">{endpoint.description}</p>

                  {endpoint.hooks && endpoint.hooks.length > 0 && (
                    <div className="api-hooks">
                      <span className="api-hook-label">React Hook:</span>
                      {endpoint.hooks.map((hook) => (
                        <span key={hook} className="api-hook-tag">
                          <FontAwesomeIcon icon="react" />
                          {hook}
                        </span>
                      ))}
                    </div>
                  )}

                  {endpoint.example && (
                    <div className="api-example">
                      <div className="api-example-label">Example:</div>
                      <pre className="api-code-block">
                        <code>{endpoint.example}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="api-category">
          <div className="api-category-header">
            <h2 className="api-category-title">
              <FontAwesomeIcon icon="file-code" />
              OpenAPI Specification
            </h2>
            <p className="api-category-description">Machine-readable API specification</p>
          </div>
          <div className="api-category-body">
            <div className="api-endpoint">
              <div className="api-endpoint-header">
                <span className="api-method get">GET</span>
                <code className="api-endpoint-path">/api/1</code>
              </div>
              <p className="api-endpoint-description">
                Returns the complete OpenAPI 3.0 specification in JSON format
              </p>
              <a
                href="https://dkan.ddev.site/api/1"
                target="_blank"
                rel="noopener noreferrer"
                className="openapi-link"
              >
                <FontAwesomeIcon icon="external-link-alt" />
                View OpenAPI Specification
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
