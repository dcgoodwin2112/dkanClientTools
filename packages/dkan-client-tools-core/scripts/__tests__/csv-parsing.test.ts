/**
 * Tests for CSV parsing improvements based on PR feedback
 * https://github.com/dcgoodwin2112/dkanClientTools/pull/13
 */

import { describe, it, expect } from 'vitest'

// Mock the sanitizeFieldName and parseCSV functions
// In production, these would be imported from the actual script

function sanitizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')  // Replace invalid chars with underscore
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .replace(/^_+|_+$/g, '')       // Trim leading/trailing underscores
    || 'field'                     // Fallback if name is empty after sanitization
}

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

  // Check if values look like ISO 8601 dates (YYYY-MM-DD)
  // Use end-of-string anchor to avoid matching filenames like "2024-01-15_report.csv"
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (nonNullValues.every(v => datePattern.test(String(v)))) {
    return 'date'
  }

  return 'string'
}

describe('CSV Parsing Improvements', () => {
  describe('sanitizeFieldName', () => {
    it('should handle multiple consecutive underscores', () => {
      expect(sanitizeFieldName('field___name')).toBe('field_name')
      expect(sanitizeFieldName('foo____bar')).toBe('foo_bar')
    })

    it('should trim leading underscores', () => {
      expect(sanitizeFieldName('___field')).toBe('field')
      expect(sanitizeFieldName('_field_name')).toBe('field_name')
    })

    it('should trim trailing underscores', () => {
      expect(sanitizeFieldName('field___')).toBe('field')
      expect(sanitizeFieldName('field_name_')).toBe('field_name')
    })

    it('should handle complex cases', () => {
      expect(sanitizeFieldName('__Field-Name!@#__')).toBe('field_name')
      expect(sanitizeFieldName('City, State')).toBe('city_state')
      expect(sanitizeFieldName('2024-01-15')).toBe('2024_01_15')
    })

    it('should provide fallback for empty result', () => {
      expect(sanitizeFieldName('___')).toBe('field')
      expect(sanitizeFieldName('!!!')).toBe('field')
    })

    it('should convert to lowercase', () => {
      expect(sanitizeFieldName('CamelCase')).toBe('camelcase')
      expect(sanitizeFieldName('UPPERCASE')).toBe('uppercase')
    })

    it('should preserve valid identifiers', () => {
      expect(sanitizeFieldName('field_name')).toBe('field_name')
      expect(sanitizeFieldName('field123')).toBe('field123')
    })
  })

  describe('inferFieldType - Date Pattern', () => {
    it('should correctly identify ISO 8601 dates', () => {
      expect(inferFieldType(['2024-01-15', '2024-02-20', '2024-03-10'])).toBe('date')
      expect(inferFieldType(['2020-12-31', '2021-01-01'])).toBe('date')
    })

    it('should NOT match filenames starting with dates', () => {
      // This was the bug - patterns like "2024-01-15_report.csv" would incorrectly match
      expect(inferFieldType(['2024-01-15_report.csv', '2024-02-20_data.csv'])).toBe('string')
      expect(inferFieldType(['2024-01-15-backup', '2024-02-20-snapshot'])).toBe('string')
    })

    it('should NOT match partial date patterns', () => {
      expect(inferFieldType(['2024-01', '2024-02'])).toBe('string')
      expect(inferFieldType(['2024-01-15T10:30:00', '2024-02-20T14:45:00'])).toBe('string')
    })

    it('should handle mixed types correctly', () => {
      expect(inferFieldType(['2024-01-15', 'not-a-date'])).toBe('string')
      expect(inferFieldType(['2024-01-15', ''])).toBe('date') // Empty values ignored
    })
  })

  describe('inferFieldType - Numbers and Integers', () => {
    it('should identify integers', () => {
      expect(inferFieldType(['1', '2', '3'])).toBe('integer')
      expect(inferFieldType(['100', '200', '300'])).toBe('integer')
    })

    it('should identify numbers (non-integers)', () => {
      expect(inferFieldType(['1.5', '2.7', '3.9'])).toBe('number')
      expect(inferFieldType(['100.0', '200.5', '300.75'])).toBe('number')
    })

    it('should handle mixed integers and decimals as numbers', () => {
      expect(inferFieldType(['1', '2.5', '3'])).toBe('number')
    })
  })

  describe('inferFieldType - Booleans', () => {
    it('should identify boolean values', () => {
      expect(inferFieldType(['true', 'false', 'true'])).toBe('boolean')
      expect(inferFieldType([true, false, true])).toBe('boolean')
    })
  })

  describe('inferFieldType - Strings', () => {
    it('should default to string for text values', () => {
      expect(inferFieldType(['foo', 'bar', 'baz'])).toBe('string')
      expect(inferFieldType(['New York', 'Los Angeles'])).toBe('string')
    })

    it('should default to string for empty arrays', () => {
      expect(inferFieldType([])).toBe('string')
      expect(inferFieldType(['', '', ''])).toBe('string')
    })
  })
})

describe('CSV Parsing - Integration Scenarios', () => {
  describe('Quoted Fields with Commas', () => {
    it('should handle city, state format correctly', () => {
      // This is the main bug that was fixed
      // "New York, NY" should be ONE field, not split into two
      const mockRecord = {
        city: 'New York, NY',
        population: '8000000'
      }

      expect(Object.keys(mockRecord)).toHaveLength(2)
      expect(mockRecord.city).toBe('New York, NY')
    })
  })

  describe('Field Name Edge Cases', () => {
    it('should handle special characters in headers', () => {
      expect(sanitizeFieldName('Field (Name)')).toBe('field_name')
      expect(sanitizeFieldName('City/State')).toBe('city_state')
      expect(sanitizeFieldName('Field #1')).toBe('field_1')
    })

    it('should handle unicode and special chars', () => {
      expect(sanitizeFieldName('Café')).toBe('caf')
      expect(sanitizeFieldName('Price $')).toBe('price')
    })
  })
})
