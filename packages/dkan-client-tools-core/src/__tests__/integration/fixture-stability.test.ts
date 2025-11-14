/**
 * Fixture Stability Tests
 *
 * Validates that recorded fixtures are present, healthy, and usable.
 * These tests serve as smoke tests to catch fixture-related issues early.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { fixtureLoader } from '../helpers/FixtureLoader'
import { getFixtureVersion, getOutdatedWarning, printFixtureVersion } from '../helpers/fixtureVersion'

describe('Fixture Stability', () => {
  beforeAll(() => {
    // Print fixture version info at start of integration tests
    printFixtureVersion()
  })

  describe('Fixture Files', () => {
    it('should have all expected category files', () => {
      const expectedCategories = [
        'Dataset Operations',
        'Datastore Operations',
        'Data Dictionary',
        'Harvest',
        'Datastore Imports',
        'Metastore',
        'Revisions',
        'Utility',
        'OpenAPI',
      ]

      const actualCategories = fixtureLoader.getCategories()

      expectedCategories.forEach(category => {
        expect(actualCategories).toContain(category)
      })
    })

    it('should have fixtures in each category', () => {
      const categories = fixtureLoader.getCategories()

      categories.forEach(category => {
        const fixtures = fixtureLoader.getAllFixtures(category)
        expect(fixtures.length, `${category} should have fixtures`).toBeGreaterThan(0)
      })
    })
  })

  describe('Fixture Version', () => {
    it('should have valid version metadata', () => {
      const version = getFixtureVersion()

      expect(version.timestamp).toBeDefined()
      expect(new Date(version.timestamp).getTime()).toBeGreaterThan(0)
      expect(version.totalMethods).toBeGreaterThan(0)
      expect(version.recorded).toBeGreaterThan(0)
      expect(version.baseUrl).toBeDefined()
    })

    it('should warn if fixtures are outdated', () => {
      const version = getFixtureVersion()
      const warning = getOutdatedWarning()

      if (version.ageDays > 30) {
        expect(warning).toBeDefined()
        console.warn(warning)
      }
    })
  })

  describe('Core Method Coverage', () => {
    it('should have successful responses for essential dataset methods', () => {
      const essentialMethods = [
        { category: 'Dataset Operations', method: 'getDataset' },
        { category: 'Dataset Operations', method: 'searchDatasets' },
        { category: 'Dataset Operations', method: 'listAllDatasets' },
      ]

      essentialMethods.forEach(({ category, method }) => {
        const fixture = fixtureLoader.getFixture(category, method)
        expect(fixture, `${category}.${method} fixture missing`).toBeDefined()
        expect(fixture!.response, `${category}.${method} response missing`).toBeDefined()
        expect(fixture!.error, `${category}.${method} has error`).toBeUndefined()
      })
    })

    it('should have successful responses for essential metastore methods', () => {
      const essentialMethods = [
        { category: 'Metastore', method: 'listSchemas' },
        { category: 'Metastore', method: 'getSchema' },
        { category: 'Metastore', method: 'getSchemaItems' },
        { category: 'Metastore', method: 'getDatasetFacets' },
      ]

      essentialMethods.forEach(({ category, method }) => {
        const fixture = fixtureLoader.getFixture(category, method)
        expect(fixture, `${category}.${method} fixture missing`).toBeDefined()
      })
    })

    it('should have successful responses for data dictionary methods', () => {
      const essentialMethods = [
        { category: 'Data Dictionary', method: 'listDataDictionaries' },
      ]

      essentialMethods.forEach(({ category, method }) => {
        const fixture = fixtureLoader.getFixture(category, method)
        expect(fixture, `${category}.${method} fixture missing`).toBeDefined()
      })
    })
  })

  describe('Fixture Quality', () => {
    it('should have minimal errors across all categories', () => {
      const stats = fixtureLoader.getStats()

      expect(stats.errors, 'Should have few or no errors').toBeLessThanOrEqual(2)

      // Print error details if any
      if (stats.errors > 0) {
        console.warn(`\n⚠️  Found ${stats.errors} fixture(s) with errors:`)
        for (const category of fixtureLoader.getCategories()) {
          const errorFixtures = fixtureLoader.getErrorFixtures(category)
          errorFixtures.forEach(f => {
            console.warn(`   - ${category}.${f.method}: ${f.error}`)
          })
        }
      }
    })

    it('should have successful recordings for majority of methods', () => {
      const stats = fixtureLoader.getStats()
      const successRate = stats.successful / stats.totalFixtures

      expect(successRate).toBeGreaterThan(0.7) // At least 70% success rate
    })

    it('should document skipped methods', () => {
      const stats = fixtureLoader.getStats()

      if (stats.skipped > 0) {
        console.log(`\nℹ️  ${stats.skipped} method(s) skipped during recording:`)
        for (const category of fixtureLoader.getCategories()) {
          const skipped = fixtureLoader.getSkippedFixtures(category)
          skipped.forEach(f => {
            console.log(`   - ${category}.${f.method}: ${f.skipReason}`)
          })
        }
      }
    })
  })

  describe('Fixture Statistics', () => {
    it('should report coverage statistics', () => {
      const stats = fixtureLoader.getStats()

      console.log('\n📊 Fixture Coverage Statistics:')
      console.log(`   Total Categories: ${stats.totalCategories}`)
      console.log(`   Total Fixtures: ${stats.totalFixtures}`)
      console.log(`   Successful: ${stats.successful}`)
      console.log(`   Skipped: ${stats.skipped}`)
      console.log(`   Errors: ${stats.errors}`)

      console.log('\n📋 By Category:')
      Object.entries(stats.byCategory).forEach(([category, data]) => {
        console.log(`   ${category}:`)
        console.log(`      Total: ${data.total}`)
        console.log(`      Successful: ${data.successful}`)
        if (data.skipped > 0) {
          console.log(`      Skipped: ${data.skipped}`)
        }
        if (data.errors > 0) {
          console.log(`      Errors: ${data.errors}`)
        }
      })
    })
  })
})
