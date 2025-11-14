/**
 * Dataset Operations Integration Tests
 *
 * Validates real DKAN dataset API response structures using recorded fixtures.
 * Tests DCAT-US compliance, nested structures, and reference ID patterns.
 */

import { describe, it, expect } from 'vitest'
import { fixtureLoader } from '../helpers/FixtureLoader'
import {
  expectDatasetShape,
  expectDcatUsCompliance,
  expectSearchResponse,
  expectReferenceStructure,
  expectDistributionShape,
} from '../helpers/matchers'

describe('Dataset Operations Integration', () => {
  describe('getDataset', () => {
    it('should handle real DKAN dataset response structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'getDataset')
      expect(fixture, 'getDataset fixture should exist').toBeDefined()
      expect(fixture!.response, 'getDataset should have response').toBeDefined()

      const dataset = fixture!.response

      // Validate DCAT-US compliance
      expectDcatUsCompliance(dataset)

      // Validate core fields
      expect(dataset['@type']).toBe('dcat:Dataset')
      expect(dataset.identifier).toBeDefined()
      expect(dataset.title).toBeDefined()
      expect(dataset.description).toBeDefined()
      expect(dataset.accessLevel).toBeDefined()
      expect(dataset.modified).toBeDefined()
    })

    it('should have valid contactPoint structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'getDataset')
      const dataset = fixture!.response

      expect(dataset.contactPoint).toBeDefined()
      expect(dataset.contactPoint.fn).toBeDefined()
      expect(dataset.contactPoint.hasEmail).toBeDefined()

      // hasEmail should be a valid format
      if (dataset.contactPoint.hasEmail) {
        expect(dataset.contactPoint.hasEmail).toMatch(/mailto:/)
      }
    })

    it('should have valid publisher structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'getDataset')
      const dataset = fixture!.response

      expect(dataset.publisher).toBeDefined()

      // Publisher can be reference object or simple object
      if (dataset.publisher.identifier) {
        // Reference format with show-reference-ids
        expectReferenceStructure(dataset.publisher)
        expect(dataset.publisher.data.name).toBeDefined()
      } else {
        // Simple format
        expect(dataset.publisher.name).toBeDefined()
      }
    })

    it('should have valid distribution array structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'getDataset')
      const dataset = fixture!.response

      if (dataset.distribution && Array.isArray(dataset.distribution)) {
        expect(dataset.distribution.length).toBeGreaterThan(0)

        dataset.distribution.forEach((dist: unknown) => {
          if (dist.identifier) {
            // Reference format
            expectReferenceStructure(dist)
            expectDistributionShape(dist)
          } else {
            // Simple format
            expect(dist['@type']).toBe('dcat:Distribution')
          }
        })
      }
    })

    it('should handle show-reference-ids parameter response', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'getDataset')
      const dataset = fixture!.response

      // With show-reference-ids, references have identifier + data structure
      if (dataset.distribution && dataset.distribution[0]?.identifier) {
        expectReferenceStructure(dataset.distribution[0])
      }

      if (dataset.publisher?.identifier) {
        expectReferenceStructure(dataset.publisher)
      }

      if (dataset.theme && dataset.theme[0]?.identifier) {
        expectReferenceStructure(dataset.theme[0])
      }

      if (dataset.keyword && dataset.keyword[0]?.identifier) {
        expectReferenceStructure(dataset.keyword[0])
      }
    })
  })

  describe('searchDatasets', () => {
    it('should handle real search response structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'searchDatasets')
      expect(fixture, 'searchDatasets fixture should exist').toBeDefined()
      expect(fixture!.response).toBeDefined()

      const response = fixture!.response

      // Validate search response shape
      expectSearchResponse(response)
    })

    it('should have valid results array', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'searchDatasets')
      const response = fixture!.response

      expect(Array.isArray(response.results)).toBe(true)

      // Validate each result is a dataset
      if (response.results.length > 0) {
        response.results.forEach((dataset: unknown) => {
          expectDcatUsCompliance(dataset)
        })
      }
    })

    it('should have facets with proper structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'searchDatasets')
      const response = fixture!.response

      if (response.facets && Array.isArray(response.facets)) {
        response.facets.forEach((facet: any) => {
          expect(facet).toHaveProperty('type')
          expect(facet).toHaveProperty('name')
          expect(facet).toHaveProperty('total')
        })
      }
    })

    it('should parse total as number', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'searchDatasets')
      const response = fixture!.response

      const total = typeof response.total === 'string'
        ? parseInt(response.total, 10)
        : response.total

      expect(typeof total).toBe('number')
      expect(total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('listAllDatasets', () => {
    it('should return array of datasets', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'listAllDatasets')
      expect(fixture).toBeDefined()

      const datasets = fixture!.response

      expect(Array.isArray(datasets)).toBe(true)
      expect(datasets.length).toBeGreaterThan(0)
    })

    it('should have valid dataset objects in array', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'listAllDatasets')
      const datasets = fixture!.response

      // Validate first few datasets
      const sampleSize = Math.min(datasets.length, 5)
      for (let i = 0; i < sampleSize; i++) {
        expectDatasetShape(datasets[i])
      }
    })

    it('should have datasets without reference IDs (default format)', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'listAllDatasets')
      const datasets = fixture!.response

      if (datasets.length > 0 && datasets[0].keyword) {
        // Without show-reference-ids, keywords should be simple strings
        expect(typeof datasets[0].keyword[0]).toBe('string')
      }

      if (datasets.length > 0 && datasets[0].theme) {
        // Without show-reference-ids, themes should be simple strings
        expect(typeof datasets[0].theme[0]).toBe('string')
      }
    })
  })

  describe('Mutation Operations', () => {
    it('should validate createDataset response structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'createDataset')

      // May be skipped in read-only mode
      if (fixture?.skipped) {
        console.log(`   ⊘ createDataset was skipped: ${fixture.skipReason}`)
        return
      }

      expect(fixture).toBeDefined()
      const response = fixture!.response

      expect(response).toHaveProperty('identifier')
      expect(response).toHaveProperty('endpoint')
    })

    it('should validate createDataset request structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'createDataset')

      if (fixture?.skipped) {
        return
      }

      const request = fixture!.request

      expect(request).toHaveProperty('title')
      expect(request).toHaveProperty('description')
      expect(request).toHaveProperty('identifier')
      expect(request).toHaveProperty('accessLevel')
      expect(request).toHaveProperty('modified')
      expect(request).toHaveProperty('keyword')
      expect(request).toHaveProperty('publisher')
      expect(request).toHaveProperty('contactPoint')
    })

    it('should validate updateDataset response structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'updateDataset')

      if (fixture?.skipped) {
        console.log(`   ⊘ updateDataset was skipped: ${fixture.skipReason}`)
        return
      }

      expect(fixture).toBeDefined()
      const response = fixture!.response

      expect(response).toHaveProperty('identifier')
      expect(response).toHaveProperty('endpoint')
    })

    it('should validate patchDataset response structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'patchDataset')

      if (fixture?.skipped) {
        console.log(`   ⊘ patchDataset was skipped: ${fixture.skipReason}`)
        return
      }

      expect(fixture).toBeDefined()
      const response = fixture!.response

      expect(response).toHaveProperty('identifier')
      expect(response).toHaveProperty('endpoint')
    })

    it('should validate deleteDataset response structure', () => {
      const fixture = fixtureLoader.getFixture('Dataset Operations', 'deleteDataset')

      if (fixture?.skipped) {
        console.log(`   ⊘ deleteDataset was skipped: ${fixture.skipReason}`)
        return
      }

      expect(fixture).toBeDefined()
      const response = fixture!.response

      expect(response).toHaveProperty('message')
      expect(response.message).toContain('deleted')
    })
  })
})
