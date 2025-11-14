/**
 * Metastore Operations Integration Tests
 *
 * Validates metastore API responses including schemas, facets, and schema items.
 * Tests JSON Schema compliance and DCAT-US schema structure.
 */

import { describe, it, expect } from 'vitest'
import { fixtureLoader } from '../helpers/FixtureLoader'
import {
  expectJsonSchemaStructure,
  expectDatasetShape,
  expectFacetsStructure,
  expectReferenceStructure,
} from '../helpers/matchers'

describe('Metastore Operations Integration', () => {
  describe('listSchemas', () => {
    it('should return array of schema names', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'listSchemas')
      expect(fixture).toBeDefined()
      expect(fixture!.response).toBeDefined()

      const schemas = fixture!.response

      expect(Array.isArray(schemas)).toBe(true)
      expect(schemas.length).toBeGreaterThan(0)

      // Should include standard DKAN schemas
      expect(schemas).toContain('dataset')
      expect(schemas).toContain('data-dictionary')
    })

    it('should have strings in schemas array', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'listSchemas')
      const schemas = fixture!.response

      schemas.forEach((schema: string) => {
        expect(typeof schema).toBe('string')
      })
    })
  })

  describe('getSchema', () => {
    it('should return valid JSON Schema structure', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'getSchema')
      expect(fixture).toBeDefined()
      expect(fixture!.response).toBeDefined()

      const schema = fixture!.response

      expectJsonSchemaStructure(schema)
    })

    it('should have DCAT-US required fields in dataset schema', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'getSchema')
      const schema = fixture!.response

      // Should be for dataset schema based on our recording
      expect(schema.title).toBeDefined()
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.required).toBeDefined()

      // DCAT-US required fields should be in required array
      const requiredDcatFields = ['title', 'description', 'identifier', 'accessLevel', 'modified']

      requiredDcatFields.forEach(field => {
        expect(schema.required).toContain(field)
      })
    })

    it('should have property definitions for core fields', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'getSchema')
      const schema = fixture!.response

      // Validate key properties exist
      expect(schema.properties.title).toBeDefined()
      expect(schema.properties.description).toBeDefined()
      expect(schema.properties.identifier).toBeDefined()
      expect(schema.properties.accessLevel).toBeDefined()
      expect(schema.properties.modified).toBeDefined()

      // title should be string
      if (schema.properties.title.type) {
        expect(schema.properties.title.type).toBe('string')
      }

      // accessLevel should have enum
      if (schema.properties.accessLevel.enum) {
        expect(schema.properties.accessLevel.enum).toContain('public')
      }
    })
  })

  describe('getSchemaItems', () => {
    it('should return array of items without show-reference-ids', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'getSchemaItems')
      expect(fixture).toBeDefined()
      expect(fixture!.response).toBeDefined()

      const items = fixture!.response

      expect(Array.isArray(items)).toBe(true)
    })

    it('should have valid item structure with show-reference-ids', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'getSchemaItems')
      const items = fixture!.response

      if (items.length > 0) {
        const firstItem = items[0]

        // Should have dataset shape
        expectDatasetShape(firstItem)

        // With show-reference-ids, check for reference structures
        if (firstItem.distribution && firstItem.distribution[0]?.identifier) {
          expectReferenceStructure(firstItem.distribution[0])
        }

        if (firstItem.theme && firstItem.theme[0]?.identifier) {
          expectReferenceStructure(firstItem.theme[0])
        }

        if (firstItem.keyword && firstItem.keyword[0]?.identifier) {
          expectReferenceStructure(firstItem.keyword[0])
        }
      }
    })
  })

  describe('getDatasetFacets', () => {
    it('should return facets object structure', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'getDatasetFacets')
      expect(fixture).toBeDefined()
      expect(fixture!.response).toBeDefined()

      const facets = fixture!.response

      // API returns object with theme, keyword, publisher properties
      expect(typeof facets).toBe('object')
      expect(facets).toHaveProperty('theme')
      expect(facets).toHaveProperty('keyword')
      expect(facets).toHaveProperty('publisher')
    })

    it('should have array properties for each facet type', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'getDatasetFacets')
      const facets = fixture!.response

      expect(Array.isArray(facets.theme)).toBe(true)
      expect(Array.isArray(facets.keyword)).toBe(true)
      expect(Array.isArray(facets.publisher)).toBe(true)
    })

    it('should validate facet values when present', () => {
      const fixture = fixtureLoader.getFixture('Metastore', 'getDatasetFacets')
      const facets = fixture!.response

      // Validate each facet type
      if (facets.theme.length > 0) {
        facets.theme.forEach((value: unknown) => {
          expect(typeof value).toBe('string')
        })
      }

      if (facets.keyword.length > 0) {
        facets.keyword.forEach((value: unknown) => {
          expect(typeof value).toBe('string')
        })
      }

      if (facets.publisher.length > 0) {
        facets.publisher.forEach((value: unknown) => {
          expect(typeof value).toBe('string')
        })
      }
    })
  })
})
