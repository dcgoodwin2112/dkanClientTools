#!/usr/bin/env node
/**
 * API Response Recorder
 *
 * Records real API responses from a DKAN instance to use as test fixtures.
 * Systematically calls all 42 DkanApiClient methods and saves responses.
 *
 * Usage:
 *   npm run record:api
 *   DKAN_URL=https://demo.getdkan.org npm run record:api
 *   DKAN_URL=https://dkan.ddev.site DKAN_USER=admin DKAN_PASS=admin npm run record:api
 *   npm run record:api:readonly  # Skip mutations
 *   CLEANUP_ONLY=true npm run record:api  # Only clean up orphaned test resources
 *
 * Configuration:
 *   Create a .env file with:
 *   DKAN_URL=http://dkan.ddev.site
 *   DKAN_USER=admin
 *   DKAN_PASS=admin
 *   READ_ONLY=true
 *   CLEANUP_ONLY=true
 */

import { config } from 'dotenv'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'node:crypto'
import { DkanApiClient } from '../src/api/client'
import type {
  DkanDataset,
  HarvestPlan,
  HarvestRunOptions,
  DatastoreImportOptions,
  MetastoreNewRevision
} from '../src/types'

// Load environment variables from .env file in project root
// Script location: /packages/dkan-client-tools-core/scripts/record-api-responses.ts
// .env location: /.env (project root)
// @ts-expect-error - import.meta is valid in Node ESM (see tsconfig.scripts.json)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '../../..')
// Load environment variables from .env file (shell/CI vars take precedence)
config({ path: join(projectRoot, '.env'), override: false })

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
  cleanup: {
    created: number
    deleted: number
    failed: number
    orphaned: string[]
  }
}

interface CreatedResource {
  type: 'dataset' | 'data-dictionary' | 'harvest-plan' | 'datastore' | 'revision'
  id: string
  timestamp: string
  deleted?: boolean // Track if resource was deleted during recording phase
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
  private testDataDictionaryUrl?: string

  // Resource tracking for cleanup
  private createdResources: CreatedResource[] = []
  private cleanupStats = {
    created: 0,
    deleted: 0,
    failed: 0,
    orphaned: [] as string[],
  }

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
   * Track a created resource for cleanup
   */
  private trackResource(type: CreatedResource['type'], id: string) {
    this.createdResources.push({
      type,
      id,
      timestamp: new Date().toISOString(),
    })
    this.cleanupStats.created++
    console.log(`    📌 Tracked ${type}: ${id}`)
  }

  /**
   * Verify a resource was deleted (should return 404)
   */
  private async verifyDeleted(type: CreatedResource['type'], id: string): Promise<boolean> {
    try {
      switch (type) {
        case 'dataset':
          await this.client.getDataset(id)
          return false // Still exists
        case 'data-dictionary':
          await this.client.getDataDictionary(id)
          return false // Still exists
        default:
          return true // Can't verify, assume deleted
      }
    } catch (error: any) {
      // 404 means successfully deleted
      return error.status === 404
    }
  }

  /**
   * Clean up a single resource
   */
  private async cleanupResource(resource: CreatedResource): Promise<boolean> {
    try {
      console.log(`  🧹 Cleaning up ${resource.type}: ${resource.id}`)

      switch (resource.type) {
        case 'dataset':
          await this.client.deleteDataset(resource.id)
          break
        case 'data-dictionary':
          await this.client.deleteDataDictionary(resource.id)
          break
        // Add more cases as we implement them
        default:
          console.log(`    ⚠️  Unknown resource type: ${resource.type}`)
          return false
      }

      // Verify deletion
      const verified = await this.verifyDeleted(resource.type, resource.id)
      if (verified) {
        console.log(`    ✓ Verified deleted`)
        this.cleanupStats.deleted++
        return true
      } else {
        console.log(`    ⚠️  Delete failed - resource still exists`)
        this.cleanupStats.failed++
        this.cleanupStats.orphaned.push(`${resource.type}:${resource.id}`)
        return false
      }
    } catch (error: any) {
      // 404 means resource was already deleted (during recording phase) - this is SUCCESS
      if (error.status === 404) {
        console.log(`    ✓ Already deleted`)
        this.cleanupStats.deleted++
        return true
      }

      // Other errors are actual failures
      console.log(`    ✗ Cleanup failed: ${error.message}`)
      this.cleanupStats.failed++
      this.cleanupStats.orphaned.push(`${resource.type}:${resource.id}`)
      return false
    }
  }

  /**
   * Clean up all tracked resources
   */
  private async cleanupAllResources() {
    if (this.createdResources.length === 0) {
      return
    }

    console.log(`\n🧹 Cleaning up ${this.createdResources.length} created resources...`)

    // Clean up in reverse order (most recently created first)
    for (const resource of [...this.createdResources].reverse()) {
      // Skip resources that were already deleted during recording
      if (resource.deleted) {
        console.log(`  ✓ ${resource.type}: ${resource.id} - deleted during recording`)
        this.cleanupStats.deleted++
        continue
      }
      await this.cleanupResource(resource)
    }

    // Report cleanup results
    console.log(`\n📊 Cleanup Summary:`)
    console.log(`  Created:  ${this.cleanupStats.created}`)
    console.log(`  Deleted:  ${this.cleanupStats.deleted}`)
    console.log(`  Failed:   ${this.cleanupStats.failed}`)

    if (this.cleanupStats.orphaned.length > 0) {
      console.log(`\n⚠️  Orphaned Resources:`)
      this.cleanupStats.orphaned.forEach(r => console.log(`    - ${r}`))
    }
  }

  /**
   * Find and clean up orphaned test resources from previous failed runs
   */
  private async preCleanupOrphanedResources() {
    console.log('\n🔍 Checking for orphaned test resources from previous runs...')

    try {
      // Look for test datasets (identifier starts with "test-recorder-")
      const allDatasets = await this.client.listAllDatasets()
      const orphanedDatasets = allDatasets.filter(d =>
        d.identifier?.startsWith('test-recorder-')
      )

      if (orphanedDatasets.length > 0) {
        console.log(`  Found ${orphanedDatasets.length} orphaned test dataset(s)`)
        for (const dataset of orphanedDatasets) {
          console.log(`  🧹 Cleaning up orphaned dataset: ${dataset.identifier}`)
          try {
            await this.client.deleteDataset(dataset.identifier)
            console.log(`    ✓ Deleted`)
          } catch (error: any) {
            console.log(`    ✗ Failed: ${error.message}`)
          }
        }
      }

      // Look for test data dictionaries (identifier starts with "test-dict-")
      try {
        const allDictionaries = await this.client.listDataDictionaries()
        const orphanedDicts = allDictionaries.filter(d =>
          d.identifier?.startsWith('test-dict-')
        )

        if (orphanedDicts.length > 0) {
          console.log(`  Found ${orphanedDicts.length} orphaned test dictionary(ies)`)
          for (const dict of orphanedDicts) {
            console.log(`  🧹 Cleaning up orphaned dictionary: ${dict.identifier}`)
            try {
              await this.client.deleteDataDictionary(dict.identifier)
              console.log(`    ✓ Deleted`)
            } catch (error: any) {
              console.log(`    ✗ Failed: ${error.message}`)
            }
          }
        }
      } catch (error: any) {
        // Data dictionaries might not be accessible
        console.log(`  ⚠️  Could not check data dictionaries: ${error.message}`)
      }

      if (orphanedDatasets.length === 0) {
        console.log(`  ✓ No orphaned test resources found`)
      }
    } catch (error: any) {
      console.log(`  ⚠️  Pre-cleanup check failed: ${error.message}`)
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
            // Check for describedBy URL for data dictionary
            if (dist.describedBy) {
              this.testDataDictionaryUrl = dist.describedBy
              console.log(`  Found describedBy URL: ${this.testDataDictionaryUrl}`)
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
          if (Array.isArray(runs) && runs.length > 0) {
            // listHarvestRuns returns an array of run IDs (strings)
            if (typeof runs[0] === 'string') {
              this.testHarvestRunId = runs[0]
              console.log(`  Found harvest run: ${this.testHarvestRunId}`)
            } else {
              console.warn('  Warning: First harvest run is not a string:', runs[0])
            }
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

    // getDataset (test with showReferenceIds parameter)
    if (this.testDatasetId) {
      this.results.push(
        await this.recordApiCall(
          'Dataset Operations',
          'getDataset',
          `/api/1/metastore/schemas/dataset/items/${this.testDatasetId}?show-reference-ids`,
          () => this.client.getDataset(this.testDatasetId!, { showReferenceIds: true }),
          { showReferenceIds: true }
        )
      )
    } else {
      this.results.push(this.skipMethod('Dataset Operations', 'getDataset', 'No dataset found'))
    }

    // searchDatasets (test with array sort parameters)
    this.results.push(
      await this.recordApiCall(
        'Dataset Operations',
        'searchDatasets',
        '/api/1/search',
        () => this.client.searchDatasets({
          keyword: 'data',
          'page-size': 10,
          sort: ['modified', 'title'],
          'sort-order': ['desc', 'asc']
        }),
        { keyword: 'data', 'page-size': 10, sort: ['modified', 'title'], 'sort-order': ['desc', 'asc'] }
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
      const testId = `test-recorder-${randomUUID()}`
      const newDataset: DkanDataset = {
        title: 'Test Dataset - API Recorder',
        description: 'Created by API response recorder for testing',
        identifier: testId,
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

      const createResult = await this.recordApiCall(
        'Dataset Operations',
        'createDataset',
        '/api/1/metastore/schemas/dataset/items',
        () => this.client.createDataset(newDataset),
        newDataset
      )
      this.results.push(createResult)

      // Track resource for cleanup
      if (!createResult.error) {
        this.trackResource('dataset', testId)
      }

      // updateDataset - full replacement
      if (!createResult.error) {
        const updatedDataset = {
          ...newDataset,
          title: 'Updated Test Dataset - API Recorder',
          description: 'Updated description for testing full replacement',
          keyword: ['test', 'recorder', 'updated'],
        }

        this.results.push(
          await this.recordApiCall(
            'Dataset Operations',
            'updateDataset',
            `/api/1/metastore/schemas/dataset/items/${testId}`,
            () => this.client.updateDataset(testId, updatedDataset),
            updatedDataset
          )
        )
      } else {
        this.results.push(this.skipMethod('Dataset Operations', 'updateDataset', 'create failed'))
      }

      // patchDataset - partial update
      if (!createResult.error) {
        const patchData = {
          description: 'Patched description for testing partial update',
        }

        this.results.push(
          await this.recordApiCall(
            'Dataset Operations',
            'patchDataset',
            `/api/1/metastore/schemas/dataset/items/${testId}`,
            () => this.client.patchDataset(testId, patchData),
            patchData
          )
        )
      } else {
        this.results.push(this.skipMethod('Dataset Operations', 'patchDataset', 'create failed'))
      }

      // deleteDataset - record the API response for fixtures
      if (!createResult.error) {
        const deleteResult = await this.recordApiCall(
          'Dataset Operations',
          'deleteDataset',
          `/api/1/metastore/schemas/dataset/items/${testId}`,
          () => this.client.deleteDataset(testId)
        )
        this.results.push(deleteResult)

        // Mark resource as deleted during recording if delete succeeded
        if (!deleteResult.error) {
          const resource = this.createdResources.find(
            r => r.type === 'dataset' && r.id === testId
          )
          if (resource) {
            resource.deleted = true
          }
        }
      } else {
        this.results.push(this.skipMethod('Dataset Operations', 'deleteDataset', 'create failed'))
      }
    }
  }

  /**
   * Record Datastore Operations (6 methods)
   */
  private async recordDatastoreOperations() {
    console.log('\n🗄️  Datastore Operations (6 methods)')

    if (!this.testDatasetId) {
      console.log('  ⊘ Skipping datastore operations (no dataset found)')
      this.results.push(this.skipMethod('Datastore Operations', 'queryDatastore', 'no dataset'))
      this.results.push(this.skipMethod('Datastore Operations', 'queryDatastoreMulti', 'no dataset'))
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

    // queryDatastoreMulti (multi-resource queries with joins)
    if (this.testDistributionId) {
      this.results.push(
        await this.recordApiCall(
          'Datastore Operations',
          'queryDatastoreMulti',
          '/api/1/datastore/query',
          () => this.client.queryDatastoreMulti({
            resources: [{ id: this.testDistributionId!, alias: 't1' }],
            limit: 10
          }),
          { resources: [{ id: this.testDistributionId!, alias: 't1' }], limit: 10 }
        )
      )
    } else {
      this.results.push(this.skipMethod('Datastore Operations', 'queryDatastoreMulti', 'no distribution'))
    }

    // getDatastoreSchema
    this.results.push(
      await this.recordApiCall(
        'Datastore Operations',
        'getDatastoreSchema',
        `/api/1/datastore/query/${this.testDatasetId}/0?schema=true`,
        () => this.client.getDatastoreSchema(this.testDatasetId!, 0)
      )
    )

    // querySql (test with GET method and show_db_columns parameter)
    if (this.testDistributionId) {
      this.results.push(
        await this.recordApiCall(
          'Datastore Operations',
          'querySql',
          '/api/1/datastore/sql',
          () => this.client.querySql({
            query: `[SELECT * FROM ${this.testDistributionId}][LIMIT 5];`,
            show_db_columns: true,
            method: 'GET'
          }),
          { query: `[SELECT * FROM ${this.testDistributionId}][LIMIT 5];`, show_db_columns: true, method: 'GET' }
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
    if (this.testDataDictionaryUrl) {
      this.results.push(
        await this.recordApiCall(
          'Data Dictionary',
          'getDataDictionaryFromUrl',
          this.testDataDictionaryUrl,
          () => this.client.getDataDictionaryFromUrl(this.testDataDictionaryUrl!),
          { url: this.testDataDictionaryUrl }
        )
      )
    } else {
      this.results.push(this.skipMethod('Data Dictionary', 'getDataDictionaryFromUrl', 'no describedBy URL found'))
    }

    // Mutations
    if (this.config.skipMutations) {
      this.results.push(this.skipMethod('Data Dictionary', 'createDataDictionary', 'read-only mode'))
      this.results.push(this.skipMethod('Data Dictionary', 'updateDataDictionary', 'read-only mode'))
      this.results.push(this.skipMethod('Data Dictionary', 'deleteDataDictionary', 'read-only mode'))
    } else {
      // createDataDictionary
      const testDictId = `test-dict-${randomUUID()}`
      const newDictionary = {
        identifier: testDictId,
        version: '1.0',
        data: {
          title: 'Test Data Dictionary',
          fields: [
            {
              name: 'test_field',
              title: 'Test Field',
              type: 'string' as const,
              description: 'A test field for API recording',
            },
          ],
        },
      }

      const createDictResult = await this.recordApiCall(
        'Data Dictionary',
        'createDataDictionary',
        '/api/1/metastore/schemas/data-dictionary/items',
        () => this.client.createDataDictionary(newDictionary),
        newDictionary
      )
      this.results.push(createDictResult)

      // Track resource for cleanup
      if (!createDictResult.error) {
        this.trackResource('data-dictionary', testDictId)
      }

      // updateDataDictionary
      if (!createDictResult.error) {
        const updatedDictionary = {
          ...newDictionary,
          data: {
            ...newDictionary.data,
            title: 'Updated Test Data Dictionary',
            fields: [
              ...newDictionary.data.fields,
              {
                name: 'added_field',
                title: 'Added Field',
                type: 'number' as const,
                description: 'Field added during update',
              },
            ],
          },
        }

        this.results.push(
          await this.recordApiCall(
            'Data Dictionary',
            'updateDataDictionary',
            `/api/1/metastore/schemas/data-dictionary/items/${testDictId}`,
            () => this.client.updateDataDictionary(testDictId, updatedDictionary),
            updatedDictionary
          )
        )
      } else {
        this.results.push(this.skipMethod('Data Dictionary', 'updateDataDictionary', 'create failed'))
      }

      // deleteDataDictionary - record the API response for fixtures
      if (!createDictResult.error) {
        const deleteDictResult = await this.recordApiCall(
          'Data Dictionary',
          'deleteDataDictionary',
          `/api/1/metastore/schemas/data-dictionary/items/${testDictId}`,
          () => this.client.deleteDataDictionary(testDictId)
        )
        this.results.push(deleteDictResult)

        // Mark resource as deleted during recording if delete succeeded
        if (!deleteDictResult.error) {
          const resource = this.createdResources.find(
            r => r.type === 'data-dictionary' && r.id === testDictId
          )
          if (resource) {
            resource.deleted = true
          }
        }
      } else {
        this.results.push(this.skipMethod('Data Dictionary', 'deleteDataDictionary', 'create failed'))
      }
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

    // getHarvestRun - requires both run ID and plan ID
    if (this.testHarvestRunId && this.testHarvestPlanId) {
      this.results.push(
        await this.recordApiCall(
          'Harvest',
          'getHarvestRun',
          `/api/1/harvest/runs/${this.testHarvestRunId}?plan=${this.testHarvestPlanId}`,
          () => this.client.getHarvestRun(this.testHarvestRunId!, this.testHarvestPlanId!)
        )
      )
    } else {
      this.results.push(this.skipMethod('Harvest', 'getHarvestRun', 'no run or plan found'))
    }

    // Mutations
    if (this.config.skipMutations) {
      this.results.push(this.skipMethod('Harvest', 'registerHarvestPlan', 'read-only mode'))
      this.results.push(this.skipMethod('Harvest', 'runHarvest', 'read-only mode'))
    } else {
      // registerHarvestPlan
      // NOTE: Harvest plans create datasets which need manual cleanup
      // We skip this by default to avoid creating unwanted test data
      const testHarvestPlanId = `test-harvest-${randomUUID()}`
      const testHarvestPlan: HarvestPlan = {
        identifier: testHarvestPlanId,
        extract: {
          type: 'test',
          uri: 'https://example.com/test-data.json'
        },
        load: {
          type: 'dataset'
        }
      }

      this.results.push(
        this.skipMethod(
          'Harvest',
          'registerHarvestPlan',
          'skipped - creates datasets with complex cleanup'
        )
      )

      // runHarvest
      // NOTE: Running harvests creates/updates datasets and is async
      // We skip this to avoid side effects on the DKAN instance
      this.results.push(
        this.skipMethod(
          'Harvest',
          'runHarvest',
          'skipped - async operation with dataset side effects'
        )
      )
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

    // getDatastoreStatistics
    if (this.testDistributionId) {
      this.results.push(
        await this.recordApiCall(
          'Datastore Imports',
          'getDatastoreStatistics',
          `/api/1/datastore/imports/${this.testDistributionId}`,
          () => this.client.getDatastoreStatistics(this.testDistributionId!)
        )
      )
    } else {
      this.results.push(this.skipMethod('Datastore Imports', 'getDatastoreStatistics', 'no distribution'))
    }

    // Mutations
    if (this.config.skipMutations) {
      this.results.push(this.skipMethod('Datastore Imports', 'triggerDatastoreImport', 'read-only mode'))
      this.results.push(this.skipMethod('Datastore Imports', 'deleteDatastore', 'read-only mode'))
    } else {
      // triggerDatastoreImport
      // NOTE: This triggers async import jobs that fetch/process CSV files
      // We skip this to avoid long-running operations and resource usage
      this.results.push(
        this.skipMethod(
          'Datastore Imports',
          'triggerDatastoreImport',
          'skipped - async operation with resource usage'
        )
      )

      // deleteDatastore
      // NOTE: We can only test this if we have a distribution ID
      // Deleting datastores removes data, so we skip to be safe
      this.results.push(
        this.skipMethod(
          'Datastore Imports',
          'deleteDatastore',
          'skipped - destructive operation on real data'
        )
      )
    }
  }

  /**
   * Record Metastore Operations (4 methods)
   */
  private async recordMetastoreOperations() {
    console.log('\n🏛️  Metastore Operations (4 methods)')

    // listSchemas
    this.results.push(
      await this.recordApiCall(
        'Metastore',
        'listSchemas',
        '/api/1/metastore/schemas',
        () => this.client.listSchemas()
      )
    )

    // getSchema
    this.results.push(
      await this.recordApiCall(
        'Metastore',
        'getSchema',
        '/api/1/metastore/schemas/dataset',
        () => this.client.getSchema('dataset')
      )
    )

    // getSchemaItems (test with showReferenceIds parameter)
    this.results.push(
      await this.recordApiCall(
        'Metastore',
        'getSchemaItems',
        '/api/1/metastore/schemas/dataset/items?show-reference-ids',
        () => this.client.getSchemaItems('dataset', { showReferenceIds: true }),
        { showReferenceIds: true }
      )
    )

    // getDatasetFacets
    this.results.push(
      await this.recordApiCall(
        'Metastore',
        'getDatasetFacets',
        '/api/1/search/facets',
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
    const revisionsResult = await this.recordApiCall(
      'Revisions',
      'getRevisions',
      `/api/1/metastore/schemas/dataset/items/${this.testDatasetId}/revisions`,
      () => this.client.getRevisions('dataset', this.testDatasetId!)
    )
    this.results.push(revisionsResult)

    // getRevision - try to get first revision if available
    if (revisionsResult.response && Array.isArray(revisionsResult.response) && revisionsResult.response.length > 0) {
      const firstRevision = revisionsResult.response[0]
      // DKAN 2.x uses 'identifier' property for revisions
      const revisionId = firstRevision.identifier
      if (revisionId) {
        this.results.push(
          await this.recordApiCall(
            'Revisions',
            'getRevision',
            `/api/1/metastore/schemas/dataset/items/${this.testDatasetId}/revisions/${revisionId}`,
            () => this.client.getRevision('dataset', this.testDatasetId!, revisionId)
          )
        )
      } else {
        this.results.push(this.skipMethod('Revisions', 'getRevision', 'no revision ID found'))
      }
    } else {
      this.results.push(this.skipMethod('Revisions', 'getRevision', 'no revisions available'))
    }

    // Mutations
    if (this.config.skipMutations) {
      this.results.push(this.skipMethod('Revisions', 'createRevision', 'read-only mode'))
      this.results.push(this.skipMethod('Revisions', 'changeDatasetState', 'read-only mode'))
    } else {
      // createRevision - test on an existing dataset (safe, non-destructive)
      if (this.testDatasetId) {
        const revision: MetastoreNewRevision = {
          state: 'draft',
          message: 'Test revision created by API recorder'
        }

        this.results.push(
          await this.recordApiCall(
            'Revisions',
            'createRevision',
            `/api/1/metastore/schemas/dataset/items/${this.testDatasetId}/revisions`,
            () => this.client.createRevision('dataset', this.testDatasetId!, revision),
            revision
          )
        )
        // NOTE: Revisions are permanent and cannot be deleted easily
        // This is safe because it's just creating a revision on an existing dataset
      } else {
        this.results.push(this.skipMethod('Revisions', 'createRevision', 'no dataset'))
      }

      // changeDatasetState - test on an existing dataset (safe, non-destructive)
      if (this.testDatasetId) {
        this.results.push(
          await this.recordApiCall(
            'Revisions',
            'changeDatasetState',
            `/api/1/metastore/schemas/dataset/items/${this.testDatasetId}/revisions`,
            () => this.client.changeDatasetState(this.testDatasetId!, 'published', 'Test state change by API recorder'),
            { state: 'published', message: 'Test state change by API recorder' }
          )
        )
        // NOTE: State changes are tracked as revisions and cannot be deleted
        // This is safe because we're just changing state on an existing dataset
      } else {
        this.results.push(this.skipMethod('Revisions', 'changeDatasetState', 'no dataset'))
      }
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
      endpoint: '/api/1',
      timestamp: new Date().toISOString(),
      response: docsUrl,
      status: 200,
    })
    console.log(`    ✓ Success`)
  }

  /**
   * Record Utility operations (2 methods)
   */
  private async recordUtilityOperations() {
    console.log('\n🔧 Utility Operations (2 methods)')

    // getBaseUrl (utility method, returns URL string)
    console.log('  → getBaseUrl...')
    const baseUrl = this.client.getBaseUrl()
    this.results.push({
      method: 'getBaseUrl',
      category: 'Utility',
      endpoint: 'N/A',
      timestamp: new Date().toISOString(),
      response: baseUrl,
      status: 200,
    })
    console.log(`    ✓ Success`)

    // getDefaultOptions (utility method, returns options object)
    console.log('  → getDefaultOptions...')
    const defaultOptions = this.client.getDefaultOptions()
    this.results.push({
      method: 'getDefaultOptions',
      category: 'Utility',
      endpoint: 'N/A',
      timestamp: new Date().toISOString(),
      response: defaultOptions,
      status: 200,
    })
    console.log(`    ✓ Success`)
  }

  /**
   * Run cleanup only (no recording)
   */
  async cleanupOnly() {
    console.log('\n🧹 Cleanup Mode - Removing orphaned test resources')
    console.log(`   URL: ${this.config.baseUrl}`)

    await this.preCleanupOrphanedResources()

    console.log('\n✅ Cleanup complete')
  }

  /**
   * Run all recordings
   */
  async recordAll() {
    console.log('\n🎬 Starting API Response Recording')
    console.log(`   URL: ${this.config.baseUrl}`)
    console.log(`   Mode: ${this.config.skipMutations ? 'Read-only' : 'Full'}`)
    console.log(`   Output: ${this.config.outputDir}`)

    // Pre-cleanup orphaned resources from previous failed runs
    if (!this.config.skipMutations) {
      await this.preCleanupOrphanedResources()
    }

    try {
      await this.discoverTestData()

      await this.recordDatasetOperations()
      await this.recordDatastoreOperations()
      await this.recordDataDictionaryOperations()
      await this.recordHarvestOperations()
      await this.recordDatastoreImportOperations()
      await this.recordMetastoreOperations()
      await this.recordRevisionOperations()
      await this.recordUtilityOperations()
      await this.recordOpenApiOperations()
    } finally {
      // Always attempt cleanup, even if recording failed
      await this.cleanupAllResources()
    }

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
    const categories = Array.from(new Set(this.results.map(r => r.category)))

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
      cleanup: this.cleanupStats,
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

    // Show cleanup summary if resources were created
    if (this.cleanupStats.created > 0) {
      console.log('\n' + '='.repeat(60))
      console.log('🧹 Cleanup Summary')
      console.log('='.repeat(60))
      console.log(`Resources Created:  ${this.cleanupStats.created}`)
      console.log(`Resources Deleted:  ${this.cleanupStats.deleted}`)
      console.log(`Cleanup Failed:     ${this.cleanupStats.failed}`)
      console.log('='.repeat(60))

      if (this.cleanupStats.orphaned.length > 0) {
        console.log('\n⚠️  WARNING: Orphaned resources detected!')
        console.log('The following test resources could not be cleaned up:')
        this.cleanupStats.orphaned.forEach(r => console.log(`  • ${r}`))
        console.log('\nYou may need to manually delete these resources from your DKAN instance.')
      }
    }

    console.log(`\n✅ Fixtures saved to: ${this.config.outputDir}`)

    // Exit with error code if cleanup failed
    if (this.cleanupStats.failed > 0) {
      console.log('\n⚠️  Note: Script completed with cleanup failures')
    }
  }
}

// Main execution
async function main() {
  // Debug: Log environment variable loading
  console.log('🔍 Environment Variables Check:')
  console.log(`   READ_ONLY: ${process.env.READ_ONLY || '(not set)'}`)
  console.log(`   DKAN_USER: ${process.env.DKAN_USER ? 'SET' : '(not set)'}`)
  console.log(`   DKAN_PASS: ${process.env.DKAN_PASS ? 'SET' : '(not set)'}`)
  console.log(`   DKAN_URL: ${process.env.DKAN_URL || '(not set)'}`)

  const skipMutations = process.env.READ_ONLY === 'true' || !process.env.DKAN_USER
  console.log(`   → skipMutations will be: ${skipMutations}`)
  console.log(`      (READ_ONLY === 'true': ${process.env.READ_ONLY === 'true'})`)
  console.log(`      (!DKAN_USER: ${!process.env.DKAN_USER})`)

  const config: RecordingConfig = {
    baseUrl: process.env.DKAN_URL || 'https://dkan.ddev.site',
    auth: process.env.DKAN_USER && process.env.DKAN_PASS
      ? { username: process.env.DKAN_USER, password: process.env.DKAN_PASS }
      : undefined,
    outputDir: join(__dirname, '../src/__tests__/fixtures'),
    skipMutations,
  }

  const recorder = new ApiResponseRecorder(config)

  // Check for cleanup-only mode
  if (process.env.CLEANUP_ONLY === 'true') {
    if (!config.auth) {
      console.error('\n❌ Error: Cleanup mode requires authentication (DKAN_USER and DKAN_PASS)')
      console.error('\nTo fix this:')
      console.error('  1. Ensure DKAN setup has been run: cd dkan && ddev exec bash scripts/setup-site.sh')
      console.error('  2. Check that .env file exists in project root with API credentials\n')
      process.exit(1)
    }
    await recorder.cleanupOnly()
  } else {
    await recorder.recordAll()
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
