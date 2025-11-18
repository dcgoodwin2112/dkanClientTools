/**
 * Tests for table column utilities
 */

import { describe, it, expect } from 'vitest'
import {
  createDatasetColumns,
  createDatastoreColumns,
  createHarvestPlanColumns,
  createHarvestRunColumns,
  createDatastoreImportColumns,
  createDataDictionaryFieldColumns,
} from '../tableColumns'
import type {
  DkanDataset,
  DatastoreField,
  HarvestPlan,
  HarvestRun,
  DatastoreImport,
  DataDictionaryField,
} from '@dkan-client-tools/core'

describe('Table Column Utilities', () => {
  describe('createDatasetColumns', () => {
    it('should create default dataset columns', () => {
      const columns = createDatasetColumns()

      expect(columns).toBeDefined()
      expect(columns.length).toBeGreaterThan(0)

      // Verify default columns are included
      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)
      expect(columnIds).toContain('identifier')
      expect(columnIds).toContain('title')
      expect(columnIds).toContain('publisher.name')
      expect(columnIds).toContain('modified')
    })

    it('should respect column visibility config', () => {
      const columns = createDatasetColumns({
        showIdentifier: false,
        showDescription: true,
        showKeywords: true,
      })

      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)

      expect(columnIds).not.toContain('identifier')
      expect(columnIds).toContain('description')
      expect(columnIds).toContain('keyword')
    })

    it('should include custom columns', () => {
      const customColumn = {
        id: 'custom',
        header: 'Custom',
        cell: () => 'Custom value',
      }

      const columns = createDatasetColumns({
        customColumns: [customColumn],
      })

      expect(columns).toContain(customColumn)
    })

    it('should format cells correctly', () => {
      const columns = createDatasetColumns({
        showDescription: true,
      })

      // Find description column
      const descColumn = columns.find(
        (col) => (col as any).accessorKey === 'description'
      ) as any

      expect(descColumn).toBeDefined()
      expect(descColumn.cell).toBeDefined()

      // Test truncation
      const mockInfo = {
        getValue: () =>
          'This is a very long description that should be truncated to 100 characters maximum length for display in table cells',
      }

      const result = descColumn.cell(mockInfo)
      expect(result.length).toBeLessThanOrEqual(103) // 100 chars + "..."
    })
  })

  describe('createDatastoreColumns', () => {
    it('should create columns from schema fields', () => {
      const fields: DatastoreField[] = [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'integer' },
        { name: 'email', type: 'string' },
      ]

      const columns = createDatastoreColumns({ fields })

      expect(columns.length).toBe(3)

      const columnNames = columns.map((col) => (col as any).accessorKey)
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('age')
      expect(columnNames).toContain('email')
    })

    it('should exclude specified fields', () => {
      const fields: DatastoreField[] = [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'string' },
        { name: 'record_number', type: 'integer' },
      ]

      const columns = createDatastoreColumns({
        fields,
        excludeFields: ['id', 'record_number'],
      })

      expect(columns.length).toBe(1)

      const columnNames = columns.map((col) => (col as any).accessorKey)
      expect(columnNames).toContain('name')
      expect(columnNames).not.toContain('id')
      expect(columnNames).not.toContain('record_number')
    })

    it('should include only specified fields', () => {
      const fields: DatastoreField[] = [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
      ]

      const columns = createDatastoreColumns({
        fields,
        includeFields: ['name', 'email'],
      })

      expect(columns.length).toBe(2)

      const columnNames = columns.map((col) => (col as any).accessorKey)
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('email')
      expect(columnNames).not.toContain('id')
    })

    it('should apply custom formatters', () => {
      const fields: DatastoreField[] = [{ name: 'price', type: 'number' }]

      const formatters = {
        price: (value: number) => `$${value.toFixed(2)}`,
      }

      const columns = createDatastoreColumns({ fields, formatters })

      const priceColumn = columns[0] as any
      const mockInfo = { getValue: () => 99.5 }

      const result = priceColumn.cell(mockInfo)
      expect(result).toBe('$99.50')
    })

    it('should format dates automatically', () => {
      const fields: DatastoreField[] = [{ name: 'created', type: 'date' }]

      const columns = createDatastoreColumns({ fields })

      const dateColumn = columns[0] as any
      const mockInfo = { getValue: () => '2024-01-15' }

      const result = dateColumn.cell(mockInfo)
      expect(result).toContain('/') // Date formatted
    })
  })

  describe('createHarvestPlanColumns', () => {
    it('should create default harvest plan columns', () => {
      const columns = createHarvestPlanColumns()

      expect(columns).toBeDefined()
      expect(columns.length).toBeGreaterThan(0)

      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)
      expect(columnIds).toContain('identifier')
      expect(columnIds).toContain('label')
      expect(columnIds).toContain('extract')
    })

    it('should respect column visibility config', () => {
      const columns = createHarvestPlanColumns({
        showId: false,
        showTransforms: true,
        showLoad: true,
      })

      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)

      expect(columnIds).not.toContain('identifier')
      expect(columnIds).toContain('transforms')
      expect(columnIds).toContain('load')
    })
  })

  describe('createHarvestRunColumns', () => {
    it('should create default harvest run columns', () => {
      const columns = createHarvestRunColumns()

      expect(columns).toBeDefined()
      expect(columns.length).toBeGreaterThan(0)

      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)
      expect(columnIds).toContain('identifier')
      expect(columnIds).toContain('status')
    })

    it('should include extract and load status when configured', () => {
      const columns = createHarvestRunColumns({
        showExtractStatus: true,
        showLoadStatus: true,
      })

      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)

      expect(columnIds).toContain('extract_status')
      expect(columnIds).toContain('load_status')
    })

    it('should format load status correctly', () => {
      const columns = createHarvestRunColumns({
        showLoadStatus: true,
      })

      const loadStatusColumn = columns.find(
        (col) => (col as any).accessorKey === 'load_status'
      ) as any

      expect(loadStatusColumn).toBeDefined()

      const mockInfo = {
        getValue: () => ({
          created: 5,
          updated: 3,
          errors: [{ id: '1', error: 'Error' }],
        }),
      }

      const result = loadStatusColumn.cell(mockInfo)
      expect(result).toContain('Created: 5')
      expect(result).toContain('Updated: 3')
      expect(result).toContain('Errors: 1')
    })
  })

  describe('createDatastoreImportColumns', () => {
    it('should create default datastore import columns', () => {
      const columns = createDatastoreImportColumns()

      expect(columns).toBeDefined()
      expect(columns.length).toBeGreaterThan(0)

      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)
      expect(columnIds).toContain('identifier')
      expect(columnIds).toContain('status')
    })

    it('should respect column visibility config', () => {
      const columns = createDatastoreImportColumns({
        showFilePath: true,
        showMessage: true,
        showTimestamp: true,
      })

      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)

      expect(columnIds).toContain('file_path')
      expect(columnIds).toContain('message')
    })

    it('should truncate long messages', () => {
      const columns = createDatastoreImportColumns({
        showMessage: true,
      })

      const messageColumn = columns.find(
        (col) => (col as any).accessorKey === 'message'
      ) as any

      const mockInfo = {
        getValue: () =>
          'This is a very long error message that should be truncated to fit in the table cell',
      }

      const result = messageColumn.cell(mockInfo)
      expect(result.length).toBeLessThanOrEqual(53) // 50 chars + "..."
    })
  })

  describe('createDataDictionaryFieldColumns', () => {
    it('should create default data dictionary field columns', () => {
      const columns = createDataDictionaryFieldColumns()

      expect(columns).toBeDefined()
      expect(columns.length).toBeGreaterThan(0)

      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)
      expect(columnIds).toContain('name')
      expect(columnIds).toContain('title')
      expect(columnIds).toContain('type')
      expect(columnIds).toContain('description')
    })

    it('should include constraints when configured', () => {
      const columns = createDataDictionaryFieldColumns({
        showConstraints: true,
      })

      const columnIds = columns.map((col) => (col as any).accessorKey || (col as any).id)
      expect(columnIds).toContain('constraints')
    })

    it('should format constraints correctly', () => {
      const columns = createDataDictionaryFieldColumns({
        showConstraints: true,
      })

      const constraintsColumn = columns.find(
        (col) => (col as any).accessorKey === 'constraints'
      ) as any

      const mockInfo = {
        getValue: () => ({
          required: true,
          unique: true,
          minimum: 0,
          maximum: 100,
        }),
      }

      const result = constraintsColumn.cell(mockInfo)
      expect(result).toContain('Required')
      expect(result).toContain('Unique')
      expect(result).toContain('Min: 0')
      expect(result).toContain('Max: 100')
    })

    it('should truncate long descriptions', () => {
      const columns = createDataDictionaryFieldColumns()

      const descColumn = columns.find(
        (col) => (col as any).accessorKey === 'description'
      ) as any

      const mockInfo = {
        getValue: () =>
          'This is a very long field description that should be truncated to 80 characters for better display',
      }

      const result = descColumn.cell(mockInfo)
      expect(result.length).toBeLessThanOrEqual(83) // 80 chars + "..."
    })
  })
})
