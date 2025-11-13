#!/usr/bin/env node
/**
 * API Response Recorder
 *
 * Records real API responses from a DKAN instance to use as test fixtures.
 * Systematically calls all 43 DkanApiClient methods and saves responses.
 *
 * Usage:
 *   npm run record:api
 *   DKAN_URL=https://demo.getdkan.org npm run record:api
 *   DKAN_URL=https://dkan.ddev.site DKAN_USER=admin DKAN_PASS=admin npm run record:api
 *   npm run record:api:readonly  # Skip mutations
 *
 * Configuration:
 *   Create a .env file with:
 *   DKAN_URL=http://dkan.ddev.site
 *   DKAN_USER=admin
 *   DKAN_PASS=admin
 *   READ_ONLY=true
 */

import { config } from 'dotenv'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { DkanApiClient } from '../src/api/client'
import type { DkanDataset } from '../src/types'

// Load environment variables from .env file
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface RecordingConfig {
  baseUrl: string
  auth?: { username: string; password: string }
  outputDir: string
  skipMutations: boolean
}

interface RecordedResponse {
  method: string
  category: string
  endpoint: string
  timestamp: string
  request?: any
  response?: any
  status?: number
  error?: string
  responseTime?: number
  skipped?: boolean
  skipReason?: string
}

interface RecordingSummary {
  config: RecordingConfig
  timestamp: string
  duration: number
  totalMethods: number
  recorded: number
  skipped: number
  errors: number
  results: RecordedResponse[]
}

class ApiResponseRecorder {
  private client: DkanApiClient
  private config: RecordingConfig
  private results: RecordedResponse[] = []
  private startTime: number = Date.now()

  // Test data IDs - will be populated from actual API
  private testDatasetId?: string
  private testDistributionId?: string
  private testHarvestPlanId?: string
  private testHarvestRunId?: string
  private testDataDictionaryId?: string

  constructor(config: RecordingConfig) {
    this.config = config
    this.client = new DkanApiClient({
      baseUrl: config.baseUrl,
      auth: config.auth,
      defaultOptions: {
        retry: 1,
        retryDelay: 1000,
      },
    })
  }

  /**
   * Record a single API call
   */
  private async recordApiCall(
    category: string,
    method: string,
    endpoint: string,
    fn: () => Promise<any>,
    request?: any
  ): Promise<RecordedResponse> {
    const startTime = Date.now()

    try {
      console.log(`  → ${method}...`)
      const response = await fn()
      const responseTime = Date.now() - startTime

      const recorded: RecordedResponse = {
        method,
        category,
        endpoint,
        timestamp: new Date().toISOString(),
        request,
        response,
        status: 200,
        responseTime,
      }

      console.log(`    ✓ Success (${responseTime}ms)`)
      return recorded
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      console.log(`    ✗ Error: ${error.message}`)

      return {
        method,
        category,
        endpoint,
        timestamp: new Date().toISOString(),
        request,
        error: error.message,
        status: error.status || 0,
        responseTime,
      }
    }
  }

  /**
   * Skip a method (mutations in read-only mode)
   */
  private skipMethod(category: string, method: string, reason: string): RecordedResponse {
    console.log(`  ⊘ ${method} (${reason})`)
    return {
      method,
      category,
      endpoint: '',
      timestamp: new Date().toISOString(),
      skipped: true,
      skipReason: reason,
    }
  }

  /**
   * Discover test data IDs from the DKAN instance
   */
  private async discoverTestData() {
    console.log('\n📋 Discovering test data...')

    try {
      // Get first dataset for testing
      const datasets = await this.client.listAllDatasets()
      if (datasets.length > 0) {
        this.testDatasetId = datasets[0].identifier
        console.log(`  Found dataset: ${this.testDatasetId}`)

        // Get distribution ID with show-reference-ids parameter
        // This parameter makes DKAN include the distribution identifiers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        // Add auth header if available
        if (this.config.auth) {
          const credentials = btoa(`${this.config.auth.username}:${this.config.auth.password}`)
          headers['Authorization'] = `Basic ${credentials}`
        }

        const response = await fetch(
          `${this.config.baseUrl}/api/1/metastore/schemas/dataset/items/${this.testDatasetId}?show-reference-ids`,
          { headers }
        )

        if (response.ok) {
          const datasetWithIds = await response.json()
          if (datasetWithIds.distribution && datasetWithIds.distribution.length > 0) {
            const dist = datasetWithIds.distribution[0]
            this.testDistributionId = dist.identifier || dist.data?.identifier
            if (this.testDistributionId) {
              console.log(`  Found distribution: ${this.testDistributionId}`)
            }
          }
        }
      }

      // Get first harvest plan
      try {
        const harvestPlans = await this.client.listHarvestPlans()
        if (harvestPlans.length > 0) {
          this.testHarvestPlanId = harvestPlans[0]
          console.log(`  Found harvest plan: ${this.testHarvestPlanId}`)

          // Get runs for this plan
          const runs = await this.client.listHarvestRuns(this.testHarvestPlanId)
          if (runs.length > 0) {
            this.testHarvestRunId = runs[0].identifier || runs[0].id
            console.log(`  Found harvest run: ${this.testHarvestRunId}`)
          }
        }
      } catch (err) {
        console.log('  No harvest plans found')
      }

      // Get first data dictionary
      try {
        const dictionaries = await this.client.listDataDictionaries()
        if (dictionaries.length > 0) {
          this.testDataDictionaryId = dictionaries[0].identifier
          console.log(`  Found data dictionary: ${this.testDataDictionaryId}`)
        }
      } catch (err) {
        console.log('  No data dictionaries found')
      }
    } catch (error: any) {
      console.log(`  ⚠ Warning: Could not discover all test data: ${error.message}`)
    }
  }

  /**
   * Record Dataset Operations (7 methods)
   */
  private async recordDatasetOperations() {
    console.log('\n📦 Dataset Operations (7 methods)')

    // getDataset
    if (this.testDatasetId) {
      this.results.push(
        await this.recordApiCall(
          'Dataset Operations',
          'getDataset',
          `/api/1/metastore/schemas/dataset/items/${this.testDatasetId}`,
          () => this.client.getDataset(this.testDatasetId!)
        )
      )
    } else {
      this.results.push(this.skipMethod('Dataset Operations', 'getDataset', 'No dataset found'))
    }

    // searchDatasets
    this.results.push(
      await this.recordApiCall(
        'Dataset Operations',
        'searchDatasets',
        '/api/1/search',
        () => this.client.searchDatasets({ keyword: 'data', 'page-size': 10 }),
        { keyword: 'data', 'page-size': 10 }
      )
    )

    // listAllDatasets
    this.results.push(
      await this.recordApiCall(
        'Dataset Operations',
        'listAllDatasets',
        '/api/1/metastore/schemas/dataset/items',
        () => this.client.listAllDatasets()
      )
    )

    // Mutations (skip in read-only mode)
    if (this.config.skipMutations) {
      this.results.push(this.skipMethod('Dataset Operations', 'createDataset', 'read-only mode'))
      this.results.push(this.skipMethod('Dataset Operations', 'updateDataset', 'read-only mode'))
      this.results.push(this.skipMethod('Dataset Operations', 'patchDataset', 'read-only mode'))
      this.results.push(this.skipMethod('Dataset Operations', 'deleteDataset', 'read-only mode'))
    } else {
      // createDataset
      const newDataset: DkanDataset = {
        title: 'Test Dataset - API Recorder',
        description: 'Created by API response recorder for testing',
        identifier: `test-recorder-${Date.now()}`,
        accessLevel: 'public',
        modified: new Date().toISOString().split('T')[0],
        keyword: ['test', 'recorder'],
        publisher: { name: 'Test Publisher' },
        contactPoint: {
          '@type': 'vcard:Contact',
          fn: 'Test Contact',
          hasEmail: 'test@example.com',
        },
      }

      this.results.push(
        await this.recordApiCall(
          'Dataset Operations',
          'createDataset',
          '/api/1/metastore/schemas/dataset/items',
          () => this.client.createDataset(newDataset),
          newDataset
        )
      )

      // Note: updateDataset, patchDataset, deleteDataset would use the created dataset
      this.results.push(this.skipMethod('Dataset Operations', 'updateDataset', 'mutation not implemented in recorder'))
      this.results.push(this.skipMethod('Dataset Operations', 'patchDataset', 'mutation not implemented in recorder'))
      this.results.push(this.skipMethod('Dataset Operations', 'deleteDataset', 'mutation not implemented in recorder'))
    }
  }

  /**
   * Record Datastore Operations (5 methods)
   */
  private async recordDatastoreOperations() {
    console.log('\n🗄️  Datastore Operations (5 methods)')

    if (!this.testDatasetId) {
      console.log('  ⊘ Skipping datastore operations (no dataset found)')
      this.results.push(this.skipMethod('Datastore Operations', 'queryDatastore', 'no dataset'))
      this.results.push(this.skipMethod('Datastore Operations', 'getDatastoreSchema', 'no dataset'))
      this.results.push(this.skipMethod('Datastore Operations', 'querySql', 'no dataset'))
      this.results.push(this.skipMethod('Datastore Operations', 'downloadQuery', 'no dataset'))
      this.results.push(this.skipMethod('Datastore Operations', 'downloadQueryByDistribution', 'no dataset'))
      return
    }

    // queryDatastore
    this.results.push(
      await this.recordApiCall(
        'Datastore Operations',
        'queryDatastore',
        `/api/1/datastore/query/${this.testDatasetId}/0`,
        () => this.client.queryDatastore(this.testDatasetId!, 0, { limit: 10 }),
        { limit: 10 }
      )
    )

    // getDatastoreSchema
    this.results.push(
      await this.recordApiCall(
        'Datastore Operations',
        'getDatastoreSchema',
        `/api/1/datastore/query/${this.testDatasetId}/0?schema=true`,
        () => this.client.getDatastoreSchema(this.testDatasetId!, 0)
      )
    )

    // querySql
    if (this.testDistributionId) {
      this.results.push(
        await this.recordApiCall(
          'Datastore Operations',
          'querySql',
          '/api/1/datastore/sql',
          () => this.client.querySql({ query: `[SELECT * FROM ${this.testDistributionId}][LIMIT 5];` }),
          { query: `[SELECT * FROM ${this.testDistributionId}][LIMIT 5];` }
        )
      )
    } else {
      this.results.push(this.skipMethod('Datastore Operations', 'querySql', 'no distribution'))
    }

    // downloadQuery
    this.results.push(
      await this.recordApiCall(
        'Datastore Operations',
        'downloadQuery',
        `/api/1/datastore/query/${this.testDatasetId}/0/download`,
        async () => {
          const blob = await this.client.downloadQuery(this.testDatasetId!, 0, { limit: 5, format: 'csv' })
          return { size: blob.size, type: blob.type }
        },
        { limit: 5, format: 'csv' }
      )
    )

    // downloadQueryByDistribution
    if (this.testDistributionId) {
      this.results.push(
        await this.recordApiCall(
          'Datastore Operations',
          'downloadQueryByDistribution',
          `/api/1/datastore/query/${this.testDistributionId}/download`,
          async () => {
            const blob = await this.client.downloadQueryByDistribution(this.testDistributionId!, { limit: 5 })
            return { size: blob.size, type: blob.type }
          },
          { limit: 5 }
        )
      )
    } else {
      this.results.push(this.skipMethod('Datastore Operations', 'downloadQueryByDistribution', 'no distribution'))
    }
  }

  /**
   * Record Data Dictionary Operations (6 methods)
   */
  private async recordDataDictionaryOperations() {
    console.log('\n📖 Data Dictionary Operations (6 methods)')

    // listDataDictionaries
    this.results.push(
      await this.recordApiCall(
        'Data Dictionary',
        'listDataDictionaries',
        '/api/1/metastore/schemas/data-dictionary/items',
        () => this.client.listDataDictionaries()
      )
    )

    // getDataDictionary
    if (this.testDataDictionaryId) {
      this.results.push(
        await this.recordApiCall(
          'Data Dictionary',
          'getDataDictionary',
          `/api/1/metastore/schemas/data-dictionary/items/${this.testDataDictionaryId}`,
          () => this.client.getDataDictionary(this.testDataDictionaryId!)
        )
      )
    } else {
      this.results.push(this.skipMethod('Data Dictionary', 'getDataDictionary', 'no dictionary found'))
    }

    // getDataDictionaryFromUrl
    this.results.push(this.skipMethod('Data Dictionary', 'getDataDictionaryFromUrl', 'requires URL'))

    // Mutations
    if (this.config.skipMutations) {
      this.results.push(this.skipMethod('Data Dictionary', 'createDataDictionary', 'read-only mode'))
      this.results.push(this.skipMethod('Data Dictionary', 'updateDataDictionary', 'read-only mode'))
      this.results.push(this.skipMethod('Data Dictionary', 'deleteDataDictionary', 'read-only mode'))
    } else {
      this.results.push(this.skipMethod('Data Dictionary', 'createDataDictionary', 'mutation not implemented in recorder'))
      this.results.push(this.skipMethod('Data Dictionary', 'updateDataDictionary', 'mutation not implemented in recorder'))
      this.results.push(this.skipMethod('Data Dictionary', 'deleteDataDictionary', 'mutation not implemented in recorder'))
    }
  }

  /**
   * Record Harvest Operations (6 methods)
   */
  private async recordHarvestOperations() {
    console.log('\n🌾 Harvest Operations (6 methods)')

    // listHarvestPlans
    this.results.push(
      await this.recordApiCall(
        'Harvest',
        'listHarvestPlans',
        '/api/1/harvest/plans',
        () => this.client.listHarvestPlans()
      )
    )

    // getHarvestPlan
    if (this.testHarvestPlanId) {
      this.results.push(
        await this.recordApiCall(
          'Harvest',
          'getHarvestPlan',
          `/api/1/harvest/plans/${this.testHarvestPlanId}`,
          () => this.client.getHarvestPlan(this.testHarvestPlanId!)
        )
      )

      // listHarvestRuns
      this.results.push(
        await this.recordApiCall(
          'Harvest',
          'listHarvestRuns',
          `/api/1/harvest/runs?plan=${this.testHarvestPlanId}`,
          () => this.client.listHarvestRuns(this.testHarvestPlanId!)
        )
      )
    } else {
      this.results.push(this.skipMethod('Harvest', 'getHarvestPlan', 'no plan found'))
      this.results.push(this.skipMethod('Harvest', 'listHarvestRuns', 'no plan found'))
    }

    // getHarvestRun
    if (this.testHarvestRunId) {
      this.results.push(
        await this.recordApiCall(
          'Harvest',
          'getHarvestRun',
          `/api/1/harvest/runs/${this.testHarvestRunId}`,
          () => this.client.getHarvestRun(this.testHarvestRunId!)
        )
      )
    } else {
      this.results.push(this.skipMethod('Harvest', 'getHarvestRun', 'no run found'))
    }

    // Mutations
    if (this.config.skipMutations) {
      this.results.push(this.skipMethod('Harvest', 'registerHarvestPlan', 'read-only mode'))
      this.results.push(this.skipMethod('Harvest', 'runHarvest', 'read-only mode'))
    } else {
      this.results.push(this.skipMethod('Harvest', 'registerHarvestPlan', 'mutation not implemented in recorder'))
      this.results.push(this.skipMethod('Harvest', 'runHarvest', 'mutation not implemented in recorder'))
    }
  }

  /**
   * Record Datastore Import Operations (4 methods)
   */
  private async recordDatastoreImportOperations() {
    console.log('\n📥 Datastore Import Operations (4 methods)')

    // listDatastoreImports
    this.results.push(
      await this.recordApiCall(
        'Datastore Imports',
        'listDatastoreImports',
        '/api/1/datastore/imports',
        () => this.client.listDatastoreImports()
      )
    )

    // Mutations
    if (this.config.skipMutations) {
      this.results.push(this.skipMethod('Datastore Imports', 'triggerDatastoreImport', 'read-only mode'))
      this.results.push(this.skipMethod('Datastore Imports', 'deleteDatastore', 'read-only mode'))
    } else {
      this.results.push(this.skipMethod('Datastore Imports', 'triggerDatastoreImport', 'mutation not implemented in recorder'))
      this.results.push(this.skipMethod('Datastore Imports', 'deleteDatastore', 'mutation not implemented in recorder'))
    }
  }

  /**
   * Record Metastore Operations (6 methods)
   */
  private async recordMetastoreOperations() {
    console.log('\n🏛️  Metastore Operations (6 methods)')

    // listSchemas
    this.results.push(
      await this.recordApiCall(
        'Metastore',
        'listSchemas',
        '/api/1/metastore/schemas',
        () => this.client.listSchemas()
      )
    )

    // getSchemaItems
    this.results.push(
      await this.recordApiCall(
        'Metastore',
        'getSchemaItems',
        '/api/1/metastore/schemas/dataset/items',
        () => this.client.getSchemaItems('dataset')
      )
    )

    // getDatasetFacets
    this.results.push(
      await this.recordApiCall(
        'Metastore',
        'getDatasetFacets',
        '/api/1/metastore/schemas/dataset/items',
        () => this.client.getDatasetFacets()
      )
    )

  }

  /**
   * Record Revision/Moderation Operations (4 methods)
   */
  private async recordRevisionOperations() {
    console.log('\n📝 Revision/Moderation Operations (4 methods)')

    if (!this.testDatasetId) {
      this.results.push(this.skipMethod('Revisions', 'getRevisions', 'no dataset'))
      this.results.push(this.skipMethod('Revisions', 'getRevision', 'no dataset'))
      this.results.push(this.skipMethod('Revisions', 'createRevision', 'no dataset'))
      this.results.push(this.skipMethod('Revisions', 'changeDatasetState', 'no dataset'))
      return
    }

    // getRevisions
    this.results.push(
      await this.recordApiCall(
        'Revisions',
        'getRevisions',
        `/api/1/metastore/schemas/dataset/items/${this.testDatasetId}/revisions`,
        () => this.client.getRevisions('dataset', this.testDatasetId!)
      )
    )

    // getRevision - skip for now, needs revision ID
    this.results.push(this.skipMethod('Revisions', 'getRevision', 'requires revision ID'))

    // Mutations
    if (this.config.skipMutations) {
      this.results.push(this.skipMethod('Revisions', 'createRevision', 'read-only mode'))
      this.results.push(this.skipMethod('Revisions', 'changeDatasetState', 'read-only mode'))
    } else {
      this.results.push(this.skipMethod('Revisions', 'createRevision', 'mutation not implemented in recorder'))
      this.results.push(this.skipMethod('Revisions', 'changeDatasetState', 'mutation not implemented in recorder'))
    }
  }


  /**
   * Record OpenAPI operations (1 method)
   */
  private async recordOpenApiOperations() {
    console.log('\n📚 OpenAPI Operations (1 method)')

    // getOpenApiDocsUrl (not an API call, just returns URL)
    console.log('  → getOpenApiDocsUrl...')
    const docsUrl = this.client.getOpenApiDocsUrl()
    this.results.push({
      method: 'getOpenApiDocsUrl',
      category: 'OpenAPI',
      endpoint: '/api/1/docs',
      timestamp: new Date().toISOString(),
      response: docsUrl,
      status: 200,
    })
    console.log(`    ✓ Success`)
  }

  /**
   * Run all recordings
   */
  async recordAll() {
    console.log('\n🎬 Starting API Response Recording')
    console.log(`   URL: ${this.config.baseUrl}`)
    console.log(`   Mode: ${this.config.skipMutations ? 'Read-only' : 'Full'}`)
    console.log(`   Output: ${this.config.outputDir}`)

    await this.discoverTestData()

    await this.recordDatasetOperations()
    await this.recordDatastoreOperations()
    await this.recordDataDictionaryOperations()
    await this.recordHarvestOperations()
    await this.recordDatastoreImportOperations()
    await this.recordMetastoreOperations()
    await this.recordRevisionOperations()
    await this.recordOpenApiOperations()

    this.saveResults()
    this.printSummary()
  }

  /**
   * Save results to fixture files
   */
  private saveResults() {
    console.log('\n💾 Saving fixtures...')

    // Create output directory
    mkdirSync(this.config.outputDir, { recursive: true })

    // Save individual category files
    const categories = [...new Set(this.results.map(r => r.category))]

    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category)
      const filename = category.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json'
      const filepath = join(this.config.outputDir, filename)

      writeFileSync(filepath, JSON.stringify(categoryResults, null, 2))
      console.log(`  ✓ ${filename}`)
    }

    // Save complete summary
    const summary: RecordingSummary = {
      config: this.config,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      totalMethods: this.results.length,
      recorded: this.results.filter(r => !r.skipped && !r.error).length,
      skipped: this.results.filter(r => r.skipped).length,
      errors: this.results.filter(r => r.error).length,
      results: this.results,
    }

    const summaryPath = join(this.config.outputDir, 'summary.json')
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    console.log(`  ✓ summary.json`)
  }

  /**
   * Print summary to console
   */
  private printSummary() {
    const duration = Date.now() - this.startTime
    const recorded = this.results.filter(r => !r.skipped && !r.error).length
    const skipped = this.results.filter(r => r.skipped).length
    const errors = this.results.filter(r => r.error).length

    console.log('\n' + '='.repeat(60))
    console.log('📊 Recording Summary')
    console.log('='.repeat(60))
    console.log(`Total Methods:    ${this.results.length}`)
    console.log(`✓ Recorded:       ${recorded}`)
    console.log(`⊘ Skipped:        ${skipped}`)
    console.log(`✗ Errors:         ${errors}`)
    console.log(`Duration:         ${(duration / 1000).toFixed(2)}s`)
    console.log('='.repeat(60))

    if (errors > 0) {
      console.log('\n⚠️  Errors encountered:')
      this.results
        .filter(r => r.error)
        .forEach(r => {
          console.log(`  • ${r.method}: ${r.error}`)
        })
    }

    console.log(`\n✅ Fixtures saved to: ${this.config.outputDir}`)
  }
}

// Main execution
async function main() {
  const config: RecordingConfig = {
    baseUrl: process.env.DKAN_URL || 'https://dkan.ddev.site',
    auth: process.env.DKAN_USER && process.env.DKAN_PASS
      ? { username: process.env.DKAN_USER, password: process.env.DKAN_PASS }
      : undefined,
    outputDir: join(__dirname, '../src/__tests__/fixtures'),
    skipMutations: process.env.READ_ONLY === 'true' || !process.env.DKAN_USER,
  }

  const recorder = new ApiResponseRecorder(config)
  await recorder.recordAll()
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
