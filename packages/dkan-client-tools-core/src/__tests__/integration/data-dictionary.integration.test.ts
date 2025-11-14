/**
 * Data Dictionary Operations Integration Tests
 *
 * Validates data dictionary API responses against Frictionless Table Schema.
 * Tests field definitions, constraints, and indexes.
 */

import { describe, it, expect } from 'vitest'
import { fixtureLoader } from '../helpers/FixtureLoader'
import { expectFrictionlessSchema } from '../helpers/matchers'

describe('Data Dictionary Operations Integration', () => {
  describe('listDataDictionaries', () => {
    it('should return array of data dictionaries', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'listDataDictionaries')
      expect(fixture).toBeDefined()
      expect(fixture!.response).toBeDefined()

      const dictionaries = fixture!.response

      expect(Array.isArray(dictionaries)).toBe(true)
    })

    it('should have valid data dictionary objects', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'listDataDictionaries')
      const dictionaries = fixture!.response

      if (dictionaries.length > 0) {
        const firstDict = dictionaries[0]

        expect(firstDict).toHaveProperty('identifier')
        expect(firstDict).toHaveProperty('data')
        expect(firstDict.data).toHaveProperty('fields')
        expect(Array.isArray(firstDict.data.fields)).toBe(true)
      }
    })
  })

  describe('getDataDictionary', () => {
    it('should return data dictionary with Frictionless schema', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'getDataDictionary')

      if (!fixture || fixture.skipped) {
        console.log('   ⊘ getDataDictionary not available in fixtures')
        return
      }

      expect(fixture.response).toBeDefined()
      const dictionary = fixture.response

      expect(dictionary).toHaveProperty('identifier')
      expect(dictionary).toHaveProperty('data')
      expectFrictionlessSchema(dictionary.data)
    })
  })

  describe('getDataDictionaryFromUrl', () => {
    it('should return Frictionless schema from external URL', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'getDataDictionaryFromUrl')

      if (!fixture || fixture.skipped) {
        console.log('   ⊘ getDataDictionaryFromUrl not available in fixtures')
        return
      }

      expect(fixture.response).toBeDefined()
      const schema = fixture.response

      expectFrictionlessSchema(schema)
    })
  })

  describe('Frictionless Schema Compliance', () => {
    it('should have valid field definitions', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'listDataDictionaries')
      const dictionaries = fixture!.response

      if (dictionaries.length === 0) {
        console.log('   ⊘ No data dictionaries in fixtures')
        return
      }

      const dictionary = dictionaries[0]
      const schema = dictionary.data

      expectFrictionlessSchema(schema)
    })

    it('should have valid field types', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'listDataDictionaries')
      const dictionaries = fixture!.response

      if (dictionaries.length === 0) {
        return
      }

      const schema = dictionaries[0].data

      schema.fields.forEach((field: any) => {
        const validTypes = [
          'string', 'number', 'integer', 'boolean',
          'object', 'array', 'date', 'time', 'datetime',
          'year', 'yearmonth', 'duration', 'geopoint', 'geojson'
        ]

        expect(validTypes).toContain(field.type)
      })
    })

    it('should have valid constraints when present', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'listDataDictionaries')
      const dictionaries = fixture!.response

      if (dictionaries.length === 0) {
        return
      }

      const schema = dictionaries[0].data

      schema.fields.forEach((field: any) => {
        if (field.constraints) {
          expect(typeof field.constraints).toBe('object')

          // Validate common constraint properties
          if (field.constraints.required !== undefined) {
            expect(typeof field.constraints.required).toBe('boolean')
          }

          if (field.constraints.minimum !== undefined) {
            expect(typeof field.constraints.minimum).toBe('number')
          }

          if (field.constraints.maximum !== undefined) {
            expect(typeof field.constraints.maximum).toBe('number')
          }

          if (field.constraints.pattern) {
            expect(typeof field.constraints.pattern).toBe('string')
          }

          if (field.constraints.enum) {
            expect(Array.isArray(field.constraints.enum)).toBe(true)
          }
        }
      })
    })

    it('should have valid indexes when present', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'listDataDictionaries')
      const dictionaries = fixture!.response

      if (dictionaries.length === 0) {
        return
      }

      const schema = dictionaries[0].data

      if (schema.indexes) {
        expect(Array.isArray(schema.indexes)).toBe(true)

        schema.indexes.forEach((index: any) => {
          expect(index).toHaveProperty('fields')
          expect(Array.isArray(index.fields)).toBe(true)

          index.fields.forEach((fieldRef: any) => {
            expect(fieldRef).toHaveProperty('name')
          })
        })
      }
    })
  })

  describe('Mutation Operations', () => {
    it('should validate createDataDictionary response structure', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'createDataDictionary')

      if (fixture?.skipped) {
        console.log(`   ⊘ createDataDictionary was skipped: ${fixture.skipReason}`)
        return
      }

      if (!fixture) {
        console.log('   ⊘ createDataDictionary not in fixtures')
        return
      }

      expect(fixture.response).toBeDefined()
      const response = fixture.response

      expect(response).toHaveProperty('identifier')
      expect(response).toHaveProperty('endpoint')
    })

    it('should validate createDataDictionary request structure', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'createDataDictionary')

      if (fixture?.skipped || !fixture) {
        return
      }

      const request = fixture.request

      expect(request).toHaveProperty('identifier')
      expect(request).toHaveProperty('data')
      expect(request.data).toHaveProperty('fields')
      expect(Array.isArray(request.data.fields)).toBe(true)

      // Validate request has Frictionless schema
      expectFrictionlessSchema(request.data)
    })

    it('should validate updateDataDictionary response structure', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'updateDataDictionary')

      if (fixture?.skipped) {
        console.log(`   ⊘ updateDataDictionary was skipped: ${fixture.skipReason}`)
        return
      }

      if (!fixture) {
        console.log('   ⊘ updateDataDictionary not in fixtures')
        return
      }

      expect(fixture.response).toBeDefined()
      const response = fixture.response

      expect(response).toHaveProperty('identifier')
      expect(response).toHaveProperty('endpoint')
    })

    it('should validate deleteDataDictionary response structure', () => {
      const fixture = fixtureLoader.getFixture('Data Dictionary', 'deleteDataDictionary')

      if (fixture?.skipped) {
        console.log(`   ⊘ deleteDataDictionary was skipped: ${fixture.skipReason}`)
        return
      }

      if (!fixture) {
        console.log('   ⊘ deleteDataDictionary not in fixtures')
        return
      }

      expect(fixture.response).toBeDefined()
      const response = fixture.response

      expect(response).toHaveProperty('message')
      expect(response.message).toContain('deleted')
    })
  })
})
