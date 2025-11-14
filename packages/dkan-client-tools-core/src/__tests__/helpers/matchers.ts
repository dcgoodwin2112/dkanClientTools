/**
 * Custom Matchers for Integration Tests
 *
 * Provides validation helpers that test stable fields and structure
 * rather than exact values that change on fixture regeneration.
 */

import { expect } from 'vitest'
import type { DkanDataset } from '../../types'

/**
 * UUID format regex
 */
const UUID_REGEX = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i

/**
 * Validate dataset structure using stable fields only
 * Does not test UUIDs or timestamps that change on regeneration
 */
export function expectDatasetShape(actual: unknown, expectedStableFields?: Partial<DkanDataset>) {
  // Test required DCAT-US fields
  expect(actual).toHaveProperty('@type', 'dcat:Dataset')
  expect(actual).toHaveProperty('identifier')
  expect(actual).toHaveProperty('title')
  expect(actual).toHaveProperty('description')
  expect(actual).toHaveProperty('modified')

  // Type assertion after runtime checks
  const dataset = actual as any

  // Validate identifier is a UUID
  expect(dataset.identifier).toMatch(UUID_REGEX)

  // Test stable content fields if provided
  if (expectedStableFields) {
    if (expectedStableFields.title) {
      expect(dataset.title).toBe(expectedStableFields.title)
    }
    if (expectedStableFields.description) {
      expect(dataset.description).toBe(expectedStableFields.description)
    }
    if (expectedStableFields.accessLevel) {
      expect(dataset.accessLevel).toBe(expectedStableFields.accessLevel)
    }
    if (expectedStableFields.license) {
      expect(dataset.license).toBe(expectedStableFields.license)
    }
  }

  // Validate contactPoint structure if present
  if (dataset.contactPoint) {
    expect(dataset.contactPoint).toHaveProperty('fn')
    expect(dataset.contactPoint).toHaveProperty('hasEmail')
    if (dataset.contactPoint['@type']) {
      expect(dataset.contactPoint['@type']).toBe('vcard:Contact')
    }
  }

  // Validate publisher structure if present
  if (dataset.publisher) {
    // Can be simple object or reference object
    if (dataset.publisher.data) {
      // Reference format
      expect(dataset.publisher).toHaveProperty('identifier')
      expect(dataset.publisher.data).toHaveProperty('name')
    } else {
      // Simple format
      expect(dataset.publisher).toHaveProperty('name')
    }
  }

  // Validate distribution array if present
  if (dataset.distribution && Array.isArray(dataset.distribution)) {
    dataset.distribution.forEach((dist: unknown) => {
      const d = dist as any
      if (d.data) {
        // Reference format
        expect(d).toHaveProperty('identifier')
        expect(d.data['@type']).toBe('dcat:Distribution')
      } else {
        // Simple format
        expect(d['@type']).toBe('dcat:Distribution')
      }
    })
  }
}

/**
 * Validate distribution structure
 */
export function expectDistributionShape(actual: unknown) {
  const a = actual as any
  const dist = a.data || a

  expect(dist).toHaveProperty('@type', 'dcat:Distribution')
  expect(dist).toHaveProperty('title')

  // Format is required in DCAT-US
  if (dist.format) {
    expect(typeof dist.format).toBe('string')
  }

  // Validate downloadURL structure if present
  if (dist.downloadURL) {
    // Can be simple string or reference array
    if (Array.isArray(dist.downloadURL)) {
      dist.downloadURL.forEach((ref: unknown) => {
        const r = ref as any
        expect(r).toHaveProperty('identifier')
        expect(r.data).toHaveProperty('filePath')
      })
    }
  }
}

/**
 * Validate DCAT-US schema compliance
 */
export function expectDcatUsCompliance(dataset: unknown) {
  const d = dataset as any

  // Required fields per DCAT-US spec
  const requiredFields = [
    'title',
    'description',
    'identifier',
    'accessLevel',
    'modified',
  ]

  requiredFields.forEach(field => {
    expect(d).toHaveProperty(field)
    expect(d[field]).toBeDefined()
  })

  // accessLevel must be one of allowed values
  if (d.accessLevel) {
    expect(['public', 'restricted public', 'non-public']).toContain(d.accessLevel)
  }

  // @type should be dcat:Dataset
  if (d['@type']) {
    expect(d['@type']).toBe('dcat:Dataset')
  }

  // contactPoint must have fn and hasEmail
  if (d.contactPoint) {
    expect(d.contactPoint).toHaveProperty('fn')
    expect(d.contactPoint).toHaveProperty('hasEmail')
  }

  // publisher must have name
  if (d.publisher) {
    const pub = d.publisher.data || d.publisher
    expect(pub).toHaveProperty('name')
  }
}

/**
 * Validate Frictionless Table Schema compliance for data dictionaries
 */
export function expectFrictionlessSchema(schema: unknown) {
  const s = schema as any

  // Top-level properties
  expect(s).toHaveProperty('fields')
  expect(Array.isArray(s.fields)).toBe(true)

  // Each field should have required properties
  s.fields.forEach((field: unknown) => {
    const f = field as any
    expect(f).toHaveProperty('name')
    expect(f).toHaveProperty('type')

    // Valid field types
    const validTypes = [
      'string', 'number', 'integer', 'boolean',
      'object', 'array', 'date', 'time', 'datetime',
      'year', 'yearmonth', 'duration', 'geopoint', 'geojson'
    ]
    expect(validTypes).toContain(f.type)

    // If constraints exist, validate structure
    if (f.constraints) {
      expect(typeof f.constraints).toBe('object')
    }
  })

  // Validate indexes if present
  if (s.indexes) {
    expect(Array.isArray(s.indexes)).toBe(true)
    s.indexes.forEach((index: unknown) => {
      const idx = index as any
      expect(idx).toHaveProperty('fields')
      expect(Array.isArray(idx.fields)).toBe(true)
    })
  }
}

/**
 * Validate search response structure
 */
export function expectSearchResponse(response: unknown) {
  const r = response as any

  expect(r).toHaveProperty('total')
  expect(r).toHaveProperty('results')
  expect(Array.isArray(r.results)).toBe(true)

  // Total can be string or number
  const total = typeof r.total === 'string'
    ? parseInt(r.total, 10)
    : r.total
  expect(typeof total).toBe('number')

  // Facets may be present
  if (r.facets) {
    expect(Array.isArray(r.facets)).toBe(true)
  }
}

/**
 * Validate facets structure
 */
export function expectFacetsStructure(facets: unknown[]) {
  expect(Array.isArray(facets)).toBe(true)

  facets.forEach((facet: unknown) => {
    const f = facet as any
    expect(f).toHaveProperty('type')
    expect(typeof f.type).toBe('string')

    // Values can be array of objects or simple strings
    if (f.values) {
      expect(Array.isArray(f.values)).toBe(true)

      if (f.values.length > 0) {
        const firstValue = f.values[0]
        if (typeof firstValue === 'object') {
          expect(firstValue).toHaveProperty('value')
        } else {
          expect(typeof firstValue).toBe('string')
        }
      }
    }
  })
}

/**
 * Validate reference object structure (show-reference-ids format)
 */
export function expectReferenceStructure(ref: unknown) {
  const r = ref as any
  expect(r).toHaveProperty('identifier')
  expect(r).toHaveProperty('data')
  expect(r.identifier).toMatch(UUID_REGEX)
  // data can be object or string (for keywords/themes it's often a string)
  expect(r.data).toBeDefined()
}

/**
 * Validate harvest plan structure
 */
export function expectHarvestPlanShape(plan: unknown) {
  const p = plan as any
  expect(p).toHaveProperty('identifier')
  expect(p).toHaveProperty('extract')
  expect(p).toHaveProperty('load')

  // Extract configuration
  expect(p.extract).toHaveProperty('type')
  expect(p.extract).toHaveProperty('uri')

  // Load configuration
  expect(p.load).toHaveProperty('type')
}

/**
 * Validate harvest run structure
 */
export function expectHarvestRunShape(run: unknown) {
  const r = run as any
  expect(r).toHaveProperty('identifier')
  expect(r).toHaveProperty('status')

  // Status should be one of known values
  const validStatuses = ['SUCCESS', 'FAILURE', 'RUNNING', 'PENDING']
  if (r.status && r.status.extract) {
    expect(validStatuses).toContain(r.status.extract)
  }
}

/**
 * Validate JSON Schema structure
 */
export function expectJsonSchemaStructure(schema: unknown) {
  const s = schema as any

  // JSON Schema required properties
  if (s.id || s.$id) {
    expect(typeof (s.id || s.$id)).toBe('string')
  }

  expect(s).toHaveProperty('type')

  if (s.type === 'object') {
    expect(s).toHaveProperty('properties')
    expect(typeof s.properties).toBe('object')
  }

  // Required fields array if present
  if (s.required) {
    expect(Array.isArray(s.required)).toBe(true)
  }
}
