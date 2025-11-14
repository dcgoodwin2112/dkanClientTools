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
export function expectDatasetShape(actual: any, expectedStableFields?: Partial<DkanDataset>) {
  // Test required DCAT-US fields
  expect(actual).toHaveProperty('@type', 'dcat:Dataset')
  expect(actual).toHaveProperty('identifier')
  expect(actual).toHaveProperty('title')
  expect(actual).toHaveProperty('description')
  expect(actual).toHaveProperty('modified')

  // Validate identifier is a UUID
  expect(actual.identifier).toMatch(UUID_REGEX)

  // Test stable content fields if provided
  if (expectedStableFields) {
    if (expectedStableFields.title) {
      expect(actual.title).toBe(expectedStableFields.title)
    }
    if (expectedStableFields.description) {
      expect(actual.description).toBe(expectedStableFields.description)
    }
    if (expectedStableFields.accessLevel) {
      expect(actual.accessLevel).toBe(expectedStableFields.accessLevel)
    }
    if (expectedStableFields.license) {
      expect(actual.license).toBe(expectedStableFields.license)
    }
  }

  // Validate contactPoint structure if present
  if (actual.contactPoint) {
    expect(actual.contactPoint).toHaveProperty('fn')
    expect(actual.contactPoint).toHaveProperty('hasEmail')
    if (actual.contactPoint['@type']) {
      expect(actual.contactPoint['@type']).toBe('vcard:Contact')
    }
  }

  // Validate publisher structure if present
  if (actual.publisher) {
    // Can be simple object or reference object
    if (actual.publisher.data) {
      // Reference format
      expect(actual.publisher).toHaveProperty('identifier')
      expect(actual.publisher.data).toHaveProperty('name')
    } else {
      // Simple format
      expect(actual.publisher).toHaveProperty('name')
    }
  }

  // Validate distribution array if present
  if (actual.distribution && Array.isArray(actual.distribution)) {
    actual.distribution.forEach((dist: any) => {
      if (dist.data) {
        // Reference format
        expect(dist).toHaveProperty('identifier')
        expect(dist.data['@type']).toBe('dcat:Distribution')
      } else {
        // Simple format
        expect(dist['@type']).toBe('dcat:Distribution')
      }
    })
  }
}

/**
 * Validate distribution structure
 */
export function expectDistributionShape(actual: any) {
  const dist = actual.data || actual

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
      dist.downloadURL.forEach((ref: any) => {
        expect(ref).toHaveProperty('identifier')
        expect(ref.data).toHaveProperty('filePath')
      })
    }
  }
}

/**
 * Validate DCAT-US schema compliance
 */
export function expectDcatUsCompliance(dataset: any) {
  // Required fields per DCAT-US spec
  const requiredFields = [
    'title',
    'description',
    'identifier',
    'accessLevel',
    'modified',
  ]

  requiredFields.forEach(field => {
    expect(dataset).toHaveProperty(field)
    expect(dataset[field]).toBeDefined()
  })

  // accessLevel must be one of allowed values
  if (dataset.accessLevel) {
    expect(['public', 'restricted public', 'non-public']).toContain(dataset.accessLevel)
  }

  // @type should be dcat:Dataset
  if (dataset['@type']) {
    expect(dataset['@type']).toBe('dcat:Dataset')
  }

  // contactPoint must have fn and hasEmail
  if (dataset.contactPoint) {
    expect(dataset.contactPoint).toHaveProperty('fn')
    expect(dataset.contactPoint).toHaveProperty('hasEmail')
  }

  // publisher must have name
  if (dataset.publisher) {
    const pub = dataset.publisher.data || dataset.publisher
    expect(pub).toHaveProperty('name')
  }
}

/**
 * Validate Frictionless Table Schema compliance for data dictionaries
 */
export function expectFrictionlessSchema(schema: any) {
  // Top-level properties
  expect(schema).toHaveProperty('fields')
  expect(Array.isArray(schema.fields)).toBe(true)

  // Each field should have required properties
  schema.fields.forEach((field: any) => {
    expect(field).toHaveProperty('name')
    expect(field).toHaveProperty('type')

    // Valid field types
    const validTypes = [
      'string', 'number', 'integer', 'boolean',
      'object', 'array', 'date', 'time', 'datetime',
      'year', 'yearmonth', 'duration', 'geopoint', 'geojson'
    ]
    expect(validTypes).toContain(field.type)

    // If constraints exist, validate structure
    if (field.constraints) {
      expect(typeof field.constraints).toBe('object')
    }
  })

  // Validate indexes if present
  if (schema.indexes) {
    expect(Array.isArray(schema.indexes)).toBe(true)
    schema.indexes.forEach((index: any) => {
      expect(index).toHaveProperty('fields')
      expect(Array.isArray(index.fields)).toBe(true)
    })
  }
}

/**
 * Validate search response structure
 */
export function expectSearchResponse(response: any) {
  expect(response).toHaveProperty('total')
  expect(response).toHaveProperty('results')
  expect(Array.isArray(response.results)).toBe(true)

  // Total can be string or number
  const total = typeof response.total === 'string'
    ? parseInt(response.total, 10)
    : response.total
  expect(typeof total).toBe('number')

  // Facets may be present
  if (response.facets) {
    expect(Array.isArray(response.facets)).toBe(true)
  }
}

/**
 * Validate facets structure
 */
export function expectFacetsStructure(facets: any[]) {
  expect(Array.isArray(facets)).toBe(true)

  facets.forEach(facet => {
    expect(facet).toHaveProperty('type')
    expect(typeof facet.type).toBe('string')

    // Values can be array of objects or simple strings
    if (facet.values) {
      expect(Array.isArray(facet.values)).toBe(true)

      if (facet.values.length > 0) {
        const firstValue = facet.values[0]
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
export function expectReferenceStructure(ref: any) {
  expect(ref).toHaveProperty('identifier')
  expect(ref).toHaveProperty('data')
  expect(ref.identifier).toMatch(UUID_REGEX)
  // data can be object or string (for keywords/themes it's often a string)
  expect(ref.data).toBeDefined()
}

/**
 * Validate harvest plan structure
 */
export function expectHarvestPlanShape(plan: any) {
  expect(plan).toHaveProperty('identifier')
  expect(plan).toHaveProperty('extract')
  expect(plan).toHaveProperty('load')

  // Extract configuration
  expect(plan.extract).toHaveProperty('type')
  expect(plan.extract).toHaveProperty('uri')

  // Load configuration
  expect(plan.load).toHaveProperty('type')
}

/**
 * Validate harvest run structure
 */
export function expectHarvestRunShape(run: any) {
  expect(run).toHaveProperty('identifier')
  expect(run).toHaveProperty('status')

  // Status should be one of known values
  const validStatuses = ['SUCCESS', 'FAILURE', 'RUNNING', 'PENDING']
  if (run.status && run.status.extract) {
    expect(validStatuses).toContain(run.status.extract)
  }
}

/**
 * Validate JSON Schema structure
 */
export function expectJsonSchemaStructure(schema: any) {
  // JSON Schema required properties
  if (schema.id || schema.$id) {
    expect(typeof (schema.id || schema.$id)).toBe('string')
  }

  expect(schema).toHaveProperty('type')

  if (schema.type === 'object') {
    expect(schema).toHaveProperty('properties')
    expect(typeof schema.properties).toBe('object')
  }

  // Required fields array if present
  if (schema.required) {
    expect(Array.isArray(schema.required)).toBe(true)
  }
}
