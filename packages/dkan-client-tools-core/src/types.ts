/**
 * Core types for DKAN data structures based on DCAT-US schema
 */

/**
 * DKAN Dataset following DCAT-US / Project Open Data schema
 */
export interface DkanDataset {
  identifier: string
  title: string
  description: string
  accessLevel: 'public' | 'restricted public' | 'non-public'
  modified: string
  keyword: string[]
  publisher: Publisher
  contactPoint: ContactPoint
  distribution?: Distribution[]
  theme?: string[]
  spatial?: string
  temporal?: string
  license?: string
  landingPage?: string
  accrualPeriodicity?: string
  language?: string[]
  issued?: string
  conformsTo?: string
  describedBy?: string
  describedByType?: string
  isPartOf?: string
  references?: string[]
  [key: string]: any
}

export interface Publisher {
  name: string
  '@type'?: string
  subOrganizationOf?: Publisher
}

export interface ContactPoint {
  '@type': string
  fn: string
  hasEmail: string
}

export interface Distribution {
  '@type': string
  identifier?: string
  title?: string
  description?: string
  format?: string
  mediaType?: string
  downloadURL?: string
  accessURL?: string
  data?: DistributionData
  describedBy?: string
  describedByType?: string
}

export interface DistributionData {
  identifier: string
  version?: string
  perspective?: string
}

/**
 * DKAN API response types
 */
export interface DkanApiResponse<T> {
  data: T
  status?: number
  statusText?: string
}

export interface DkanSearchResponse {
  total: number
  results: DkanDataset[]
  facets?: Record<string, any>
}

/**
 * Facets API response structure
 */
export interface FacetValue {
  value?: string
  count?: number
}

export interface FacetItem {
  type: string
  values: (string | FacetValue)[]
}

export type FacetsApiResponse = FacetItem[]

export interface DkanDatastoreQueryResponse {
  results: Record<string, any>[]
  count: number
  schema?: DatastoreSchema
}

export interface DatastoreSchema {
  fields: DatastoreField[]
}

export interface DatastoreField {
  name: string
  type: string
  format?: string
}

/**
 * Query and filter types
 */
export interface DatasetQueryOptions {
  keyword?: string
  theme?: string
  fulltext?: string

  /**
   * Field(s) to sort by. Supports both single field and multi-field sorting.
   *
   * @example
   * ```typescript
   * // Single field
   * sort: 'title'
   *
   * // Multiple fields (sort by modified date, then title)
   * sort: ['modified', 'title']
   * ```
   */
  sort?: string | string[]

  /**
   * Sort order(s). Supports both single order and multiple orders for multi-field sorting.
   * When using multiple sort fields, provide corresponding sort orders.
   *
   * @example
   * ```typescript
   * // Single order
   * 'sort-order': 'asc'
   *
   * // Multiple orders (descending by date, then ascending by title)
   * 'sort-order': ['desc', 'asc']
   * ```
   */
  'sort-order'?: 'asc' | 'desc' | Array<'asc' | 'desc'>

  page?: number
  'page-size'?: number
}

export interface DatastoreQueryOptions {
  // Query structure
  conditions?: DatastoreCondition[]
  properties?: string[]
  sorts?: DatastoreSort[]
  limit?: number
  offset?: number
  joins?: DatastoreJoin[]
  expression?: DatastoreExpression

  // Multi-resource query support
  resources?: Array<{ id: string; alias?: string }>
  groupings?: Array<{ property: string; resource?: string }>

  // Response control flags
  count?: boolean          // Include count in response (default: true)
  results?: boolean        // Include results in response (default: true)
  schema?: boolean         // Include schema in response (default: true)
  keys?: boolean           // Include keys in response (default: true)
  format?: 'json' | 'csv'  // Response format (default: 'json')
  rowIds?: boolean         // Include row IDs (default: false)
}

export interface DatastoreCondition {
  property: string
  value: any
  operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'match'
}

export interface DatastoreSort {
  property: string
  order: 'asc' | 'desc'
}

export interface DatastoreJoin {
  resource: string
  condition: string
}

export interface DatastoreExpression {
  operator: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'std' | 'variance'
  property: string
}

/**
 * Client configuration
 */
export interface DkanClientConfig {
  baseUrl: string
  auth?: DkanAuth
  defaultOptions?: DkanDefaultOptions
}

export interface DkanAuth {
  username?: string
  password?: string
  token?: string
}

export interface DkanDefaultOptions {
  retry?: number
  retryDelay?: number
  staleTime?: number
  cacheTime?: number
}

/**
 * Query key type (alias for TanStack Query)
 */
export type DatasetKey = readonly [string, ...any[]]

/**
 * Data Dictionary types (Frictionless Standards table schema)
 */
export interface DataDictionary {
  identifier: string
  version?: string
  data: DataDictionaryData
}

export interface DataDictionaryData {
  title?: string
  fields: DataDictionaryField[]
  indexes?: DataDictionaryIndex[]
}

export interface DataDictionaryField {
  name: string
  title?: string
  type: DataDictionaryFieldType
  format?: string
  description?: string
  constraints?: DataDictionaryConstraints
}

export type DataDictionaryFieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'any'
  | 'date'
  | 'time'
  | 'datetime'
  | 'year'
  | 'yearmonth'
  | 'duration'

export interface DataDictionaryConstraints {
  required?: boolean
  unique?: boolean
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  enum?: any[]
  pattern?: string
}

export interface DataDictionaryIndex {
  fields: string[]
  type?: 'primary' | 'unique' | 'index'
}

export interface DataDictionaryListResponse {
  data: DataDictionary[]
  count?: number
}

/**
 * API Error types
 */
export class DkanApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
    public timestamp?: string,
    public data?: Record<string, any>
  ) {
    super(message)
    this.name = 'DkanApiError'
  }
}

/**
 * Harvest API types
 */
export interface HarvestPlan {
  identifier: string
  extract: {
    type: string
    uri: string
  }
  transforms?: any[]
  load: {
    type: string
  }
  [key: string]: any
}

export interface HarvestRun {
  identifier: string
  status?: string
  extract_status?: {
    extracted_items_ids?: string[]
  }
  load_status?: {
    created?: number
    updated?: number
    errors?: Array<{ id: string; error: string }>
  }
  [key: string]: any
}

export interface HarvestRunOptions {
  plan_id: string
}

/**
 * Datastore Import types
 */
export interface DatastoreImport {
  status: 'done' | 'in_progress' | 'error'
  file_fetcher?: {
    processor?: string
    state?: {
      total_bytes?: number
      file_path?: string
    }
  }
  importer?: {
    processor?: string
    state?: {
      num_records?: number
    }
  }
  [key: string]: any
}

export interface DatastoreImportOptions {
  resource_id: string
  [key: string]: any
}

/**
 * Datastore Statistics response from GET /api/1/datastore/imports/{identifier}
 */
export interface DatastoreStatistics {
  numOfRows: number
  numOfColumns: number
  columns: Record<string, any>
}

/**
 * JSON Schema definition structure
 */
export interface JsonSchema {
  $schema?: string
  title?: string
  description?: string
  type?: string
  properties?: Record<string, any>
  required?: string[]
  [key: string]: any
}

/**
 * Metastore write operation response
 */
export interface MetastoreWriteResponse {
  endpoint: string
  identifier: string
}

/**
 * Revision and moderation types
 */
export type WorkflowState = 'draft' | 'published' | 'hidden' | 'archived' | 'orphaned'

export interface MetastoreRevision {
  identifier: string
  published: boolean
  message: string
  modified: string
  state: WorkflowState
}

export interface MetastoreNewRevision {
  message?: string
  state: WorkflowState
}

/**
 * Query Download types
 */
export interface QueryDownloadOptions extends DatastoreQueryOptions {
  format?: 'csv' | 'json'
}

/**
 * SQL Query types
 */
export interface SqlQueryOptions {
  /**
   * SQL query string in DKAN bracket syntax.
   *
   * Format: `[SELECT columns FROM distribution-id][WHERE conditions][ORDER BY fields][LIMIT n OFFSET m];`
   *
   * @example
   * ```typescript
   * {
   *   query: '[SELECT * FROM abc123][LIMIT 10];'
   * }
   * ```
   */
  query: string

  /**
   * Return database column names instead of human-readable descriptions.
   * Useful for building queries when column headers are very long.
   *
   * @default false
   */
  show_db_columns?: boolean

  /**
   * HTTP method to use for the request.
   *
   * - GET: Recommended for most queries, matches DKAN standard examples
   * - POST: More permissive (no auth required), useful for complex queries
   *
   * @default 'GET'
   */
  method?: 'GET' | 'POST'
}

export type SqlQueryResult = Record<string, any>[]

