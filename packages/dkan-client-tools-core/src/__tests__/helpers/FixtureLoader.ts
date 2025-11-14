/**
 * Fixture Loader Utility
 *
 * Loads and queries recorded API fixtures for integration testing.
 * Fixtures are real API responses captured by the record-api-responses.ts script.
 */

import datasetFixtures from '../fixtures/dataset-operations.json'
import datastoreFixtures from '../fixtures/datastore-operations.json'
import dataDictionaryFixtures from '../fixtures/data-dictionary.json'
import harvestFixtures from '../fixtures/harvest.json'
import datastoreImportsFixtures from '../fixtures/datastore-imports.json'
import metastoreFixtures from '../fixtures/metastore.json'
import revisionsFixtures from '../fixtures/revisions.json'
import utilityFixtures from '../fixtures/utility.json'
import openapiFixtures from '../fixtures/openapi.json'
import summary from '../fixtures/summary.json'

/**
 * Recorded API response structure
 */
export interface RecordedResponse {
  method: string
  category: string
  endpoint: string
  timestamp: string
  request?: Record<string, unknown> | unknown
  response?: Record<string, unknown> | unknown
  status?: number
  responseTime?: number
  error?: string
  skipped?: boolean
  skipReason?: string
}

/**
 * Recording summary metadata
 */
export interface RecordingSummary {
  config: {
    baseUrl: string
    auth?: { username: string; password: string }
    outputDir: string
    skipMutations: boolean
  }
  timestamp: string
  duration: number
  totalMethods: number
  recorded: number
  skipped: number
  errors: number
  results: RecordedResponse[]
  cleanup: {
    created: number
    deleted: number
    failed: number
    orphaned: string[]
  }
}

/**
 * Fixture loader for integration tests
 */
export class FixtureLoader {
  private static readonly MS_PER_DAY = 1000 * 60 * 60 * 24

  private fixtures: Map<string, RecordedResponse[]>
  private summary: RecordingSummary

  constructor() {
    this.fixtures = new Map()
    this.summary = summary as RecordingSummary

    // Load all fixture categories
    this.loadFixtures('Dataset Operations', datasetFixtures as RecordedResponse[])
    this.loadFixtures('Datastore Operations', datastoreFixtures as RecordedResponse[])
    this.loadFixtures('Data Dictionary', dataDictionaryFixtures as RecordedResponse[])
    this.loadFixtures('Harvest', harvestFixtures as RecordedResponse[])
    this.loadFixtures('Datastore Imports', datastoreImportsFixtures as RecordedResponse[])
    this.loadFixtures('Metastore', metastoreFixtures as RecordedResponse[])
    this.loadFixtures('Revisions', revisionsFixtures as RecordedResponse[])
    this.loadFixtures('Utility', utilityFixtures as RecordedResponse[])
    this.loadFixtures('OpenAPI', openapiFixtures as RecordedResponse[])
  }

  private loadFixtures(category: string, data: RecordedResponse[]) {
    this.fixtures.set(category, data)
  }

  /**
   * Get a specific fixture by category and method name
   */
  getFixture(category: string, method: string): RecordedResponse | undefined {
    const categoryFixtures = this.fixtures.get(category)
    return categoryFixtures?.find(f => f.method === method)
  }

  /**
   * Get all fixtures for a category
   */
  getAllFixtures(category: string): RecordedResponse[] {
    return this.fixtures.get(category) || []
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return Array.from(this.fixtures.keys())
  }

  /**
   * Get fixtures that were successfully recorded (no errors, not skipped)
   */
  getSuccessfulFixtures(category: string): RecordedResponse[] {
    return this.getAllFixtures(category).filter(f =>
      !f.error && !f.skipped && f.response !== undefined
    )
  }

  /**
   * Get fixtures that were skipped (usually mutations in read-only mode)
   */
  getSkippedFixtures(category: string): RecordedResponse[] {
    return this.getAllFixtures(category).filter(f => f.skipped === true)
  }

  /**
   * Get fixtures that had errors
   */
  getErrorFixtures(category: string): RecordedResponse[] {
    return this.getAllFixtures(category).filter(f => f.error !== undefined)
  }

  /**
   * Get the recording summary metadata
   */
  getSummary(): RecordingSummary {
    return this.summary
  }

  /**
   * Get fixture version info
   */
  getVersion() {
    return {
      timestamp: this.summary.timestamp,
      totalMethods: this.summary.totalMethods,
      recorded: this.summary.recorded,
      skipped: this.summary.skipped,
      errors: this.summary.errors,
      baseUrl: this.summary.config.baseUrl,
      duration: this.summary.duration,
    }
  }

  /**
   * Check if fixtures are older than specified days
   */
  isOutdated(maxDays: number = 30): boolean {
    const recordingDate = new Date(this.summary.timestamp)
    const age = Date.now() - recordingDate.getTime()
    const daysSinceRecording = age / FixtureLoader.MS_PER_DAY
    return daysSinceRecording > maxDays
  }

  /**
   * Get fixture age in days
   */
  getAgeInDays(): number {
    const recordingDate = new Date(this.summary.timestamp)
    const age = Date.now() - recordingDate.getTime()
    return age / FixtureLoader.MS_PER_DAY
  }

  /**
   * Get statistics for all fixtures
   */
  getStats() {
    const stats = {
      totalCategories: this.getCategories().length,
      totalFixtures: 0,
      successful: 0,
      skipped: 0,
      errors: 0,
      byCategory: {} as Record<string, { total: number; successful: number; skipped: number; errors: number }>,
    }

    for (const category of this.getCategories()) {
      const all = this.getAllFixtures(category)
      const successful = this.getSuccessfulFixtures(category)
      const skipped = this.getSkippedFixtures(category)
      const errors = this.getErrorFixtures(category)

      stats.totalFixtures += all.length
      stats.successful += successful.length
      stats.skipped += skipped.length
      stats.errors += errors.length

      stats.byCategory[category] = {
        total: all.length,
        successful: successful.length,
        skipped: skipped.length,
        errors: errors.length,
      }
    }

    return stats
  }
}

/**
 * Singleton instance for use in tests
 */
export const fixtureLoader = new FixtureLoader()
