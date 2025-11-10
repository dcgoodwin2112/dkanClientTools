/**
 * Tests for DkanApiError and type utilities
 */

import { describe, it, expect } from 'vitest'
import { DkanApiError } from '../types'

describe('DkanApiError', () => {
  it('should create error with message only', () => {
    const error = new DkanApiError('Test error')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DkanApiError)
    expect(error.message).toBe('Test error')
    expect(error.name).toBe('DkanApiError')
    expect(error.statusCode).toBeUndefined()
    expect(error.response).toBeUndefined()
  })

  it('should create error with status code', () => {
    const error = new DkanApiError('Not found', 404)

    expect(error.message).toBe('Not found')
    expect(error.statusCode).toBe(404)
    expect(error.response).toBeUndefined()
  })

  it('should create error with status code and response', () => {
    const responseData = { error: 'Resource not found' }
    const error = new DkanApiError('Not found', 404, responseData)

    expect(error.message).toBe('Not found')
    expect(error.statusCode).toBe(404)
    expect(error.response).toEqual(responseData)
  })

  it('should have correct prototype chain', () => {
    const error = new DkanApiError('Test')

    expect(Object.getPrototypeOf(error)).toBe(DkanApiError.prototype)
    expect(error instanceof Error).toBe(true)
    expect(error instanceof DkanApiError).toBe(true)
  })

  it('should be catchable as Error', () => {
    try {
      throw new DkanApiError('Test error', 500)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect(e).toBeInstanceOf(DkanApiError)
      if (e instanceof DkanApiError) {
        expect(e.statusCode).toBe(500)
      }
    }
  })

  it('should preserve stack trace', () => {
    const error = new DkanApiError('Test')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('DkanApiError')
  })
})
