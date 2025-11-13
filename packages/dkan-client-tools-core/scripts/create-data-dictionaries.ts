#!/usr/bin/env node
/**
 * Create Data Dictionaries for DKAN Sample Datasets
 *
 * This script:
 * 1. Fetches all datasets from the DKAN instance
 * 2. For each CSV distribution with datastore:
 *    - Analyzes the datastore schema
 *    - Creates a data dictionary with field definitions
 *    - Uploads the dictionary via API
 *
 * Usage:
 *   npm run create:dictionaries
 *   DKAN_URL=https://demo.getdkan.org npm run create:dictionaries
 *   DKAN_URL=https://dkan.ddev.site DKAN_USER=admin DKAN_PASS=admin npm run create:dictionaries
 *
 * Configuration:
 *   Create a .env file with:
 *   DKAN_URL=http://dkan.ddev.site
 *   DKAN_USER=admin
 *   DKAN_PASS=admin
 */

import { config } from 'dotenv'
import { DkanApiClient } from '../src/api/client'
import type { DkanDataset, DataDictionary, DataDictionaryField } from '../src/types'

// Load environment variables from .env file
config()

const DKAN_URL = process.env.DKAN_URL || 'http://dkan.ddev.site'
const DKAN_USER = process.env.DKAN_USER
const DKAN_PASS = process.env.DKAN_PASS

interface DistributionWithId {
  identifier: string
  title?: string
  format?: string
  mediaType?: string
  downloadURL?: string
  datasetId: string
  datasetTitle: string
}

/**
 * Infer field type from sample values
 */
function inferFieldType(values: any[]): 'string' | 'number' | 'integer' | 'boolean' | 'date' {
  const nonNullValues = values.filter(v => v != null && v !== '')

  if (nonNullValues.length === 0) return 'string'

  // Check if all values are booleans
  if (nonNullValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
    return 'boolean'
  }

  // Check if all values are numbers
  if (nonNullValues.every(v => !isNaN(Number(v)))) {
    // Check if they're all integers
    if (nonNullValues.every(v => Number.isInteger(Number(v)))) {
      return 'integer'
    }
    return 'number'
  }

  // Check if values look like dates (basic check)
  const datePattern = /^\d{4}-\d{2}-\d{2}/
  if (nonNullValues.every(v => datePattern.test(String(v)))) {
    return 'date'
  }

  return 'string'
}

/**
 * Generate human-readable title from field name
 */
function generateFieldTitle(fieldName: string): string {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Fetch all datasets with distribution identifiers
 */
async function fetchDatasetsWithDistributions(client: DkanApiClient): Promise<DistributionWithId[]> {
  console.log('📋 Fetching datasets...')

  const datasets = await client.listAllDatasets()
  console.log(`  Found ${datasets.length} datasets`)

  const distributions: DistributionWithId[] = []

  for (const dataset of datasets) {
    // Fetch dataset with show-reference-ids to get distribution UUIDs
    const response = await fetch(
      `${DKAN_URL}/api/1/metastore/schemas/dataset/items/${dataset.identifier}?show-reference-ids`,
      {
        headers: {
          'Authorization': DKAN_USER && DKAN_PASS
            ? `Basic ${Buffer.from(`${DKAN_USER}:${DKAN_PASS}`).toString('base64')}`
            : '',
        },
      }
    )

    if (!response.ok) continue

    const datasetWithIds = await response.json()

    if (datasetWithIds.distribution && Array.isArray(datasetWithIds.distribution)) {
      for (const dist of datasetWithIds.distribution) {
        // Get format from either dist.format or dist.data.format
        const format = dist.format || dist.data?.format
        const title = dist.title || dist.data?.title
        const mediaType = dist.mediaType || dist.data?.mediaType
        const downloadURL = dist.downloadURL || dist.data?.downloadURL

        // Only process CSV distributions with download URLs
        if (format === 'csv' && dist.identifier && downloadURL) {
          distributions.push({
            identifier: dist.identifier,
            title,
            format,
            mediaType,
            downloadURL,
            datasetId: dataset.identifier,
            datasetTitle: dataset.title,
          })
        }
      }
    }
  }

  console.log(`  Found ${distributions.length} CSV distributions\n`)
  return distributions
}

/**
 * Parse CSV data to get field information
 */
function parseCSV(csvData: string): { headers: string[]; records: Record<string, string>[] } {
  const lines = csvData.trim().split('\n')
  if (lines.length < 2) {
    return { headers: [], records: [] }
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/[^a-z0-9_]/g, '_'))

  // Parse records (limit to first 100 for analysis)
  const records: Record<string, string>[] = []
  for (let i = 1; i < Math.min(lines.length, 101); i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = values[index] || ''
    })
    records.push(record)
  }

  return { headers, records }
}

/**
 * Analyze CSV file and create field definitions
 */
async function analyzeCSV(
  downloadURL: string
): Promise<DataDictionaryField[] | null> {
  try {
    console.log(`    Downloading CSV from: ${downloadURL}`)

    // Fetch the CSV file
    const response = await fetch(downloadURL)
    if (!response.ok) {
      console.error(`    Error: HTTP ${response.status}`)
      return null
    }

    const csvData = await response.text()
    const { headers, records } = parseCSV(csvData)

    if (headers.length === 0 || records.length === 0) {
      console.error(`    Error: Could not parse CSV file`)
      return null
    }

    console.log(`    Analyzed ${headers.length} fields from ${records.length} records`)

    const fields: DataDictionaryField[] = headers.map(fieldName => {
      // Collect all values for this field
      const values = records.map(record => record[fieldName])

      // Infer type from values
      const type = inferFieldType(values)

      // Generate human-readable title
      const title = generateFieldTitle(fieldName)

      const field: DataDictionaryField = {
        name: fieldName,
        title,
        type,
      }

      // Only add format if it's a date
      if (type === 'date') {
        field.format = 'default'
      }

      return field
    })

    return fields
  } catch (error) {
    console.error(`    Error analyzing CSV: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

/**
 * Create data dictionary for a distribution
 */
async function createDataDictionary(
  client: DkanApiClient,
  distribution: DistributionWithId,
  fields: DataDictionaryField[]
): Promise<boolean> {
  try {
    // Generate a unique identifier for the dictionary (append -dict to distribution ID)
    const dictionaryId = `${distribution.identifier}-dict`

    const dictionary: DataDictionary = {
      identifier: dictionaryId,
      data: {
        title: distribution.title || `Data Dictionary for ${distribution.datasetTitle}`,
        fields,
      },
    }

    await client.createDataDictionary(dictionary)
    return true
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`    Error creating dictionary: ${errorMsg}`)
    return false
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎬 Starting Data Dictionary Creation')
  console.log(`   URL: ${DKAN_URL}`)
  console.log(`   Auth: ${DKAN_USER ? 'Enabled' : 'Disabled'}\n`)

  const client = new DkanApiClient({
    baseUrl: DKAN_URL,
    auth: DKAN_USER && DKAN_PASS
      ? { username: DKAN_USER, password: DKAN_PASS }
      : undefined,
  })

  try {
    // Fetch all distributions
    const distributions = await fetchDatasetsWithDistributions(client)

    if (distributions.length === 0) {
      console.log('❌ No CSV distributions found')
      return
    }

    let created = 0
    let skipped = 0
    let errors = 0

    console.log('📖 Creating Data Dictionaries...\n')

    for (const distribution of distributions) {
      const distTitle = distribution.title || distribution.identifier
      console.log(`  → ${distTitle}`)
      console.log(`    Dataset: ${distribution.datasetTitle}`)
      console.log(`    Distribution ID: ${distribution.identifier}`)

      if (!distribution.downloadURL) {
        console.log(`    ⊘ Skipped (no download URL)\n`)
        skipped++
        continue
      }

      // Analyze CSV file (normalize URL to use configured baseUrl)
      const downloadURL = distribution.downloadURL.replace(/^https?:\/\/[^/]+/, DKAN_URL)
      const fields = await analyzeCSV(downloadURL)

      if (!fields) {
        console.log(`    ⊘ Skipped (could not analyze CSV)\n`)
        skipped++
        continue
      }

      // Create dictionary
      const success = await createDataDictionary(client, distribution, fields)

      if (success) {
        console.log(`    ✓ Created successfully\n`)
        created++
      } else {
        console.log(`    ✗ Failed to create\n`)
        errors++
      }
    }

    // Summary
    console.log('============================================================')
    console.log('📊 Creation Summary')
    console.log('============================================================')
    console.log(`Total Distributions: ${distributions.length}`)
    console.log(`✓ Created:          ${created}`)
    console.log(`⊘ Skipped:          ${skipped}`)
    console.log(`✗ Errors:           ${errors}`)
    console.log('============================================================\n')

    if (created > 0) {
      console.log('✅ Data dictionaries created successfully!')
      console.log(`   View them at: ${DKAN_URL}/admin/dkan/data-dictionary\n`)
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
