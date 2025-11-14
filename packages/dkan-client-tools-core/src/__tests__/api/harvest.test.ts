/**
 * Tests for Harvest API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DkanApiClient } from '../../api/client'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('DkanApiClient - Harvest API', () => {
  let client: DkanApiClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new DkanApiClient({ baseUrl: 'https://example.com' })
  })

  it('should list harvest plans', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['plan1', 'plan2'],
    })

    const plans = await client.listHarvestPlans()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/harvest/plans',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
    expect(plans).toEqual(['plan1', 'plan2'])
  })

  it('should register a harvest plan', async () => {
    const plan = {
      identifier: 'test-plan',
      extract: { type: 'datajson', uri: 'https://source.com/data.json' },
      load: { type: 'simple' },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ endpoint: 'harvest', identifier: 'test-plan' }),
    })

    const result = await client.registerHarvestPlan(plan)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/harvest/plans',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(plan),
      })
    )
    expect(result).toEqual({ endpoint: 'harvest', identifier: 'test-plan' })
  })

  it('should get a specific harvest plan', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        identifier: 'test-plan',
        extract: { type: 'datajson', uri: 'https://source.com/data.json' },
      }),
    })

    const plan = await client.getHarvestPlan('test-plan')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/harvest/plans/test-plan',
      expect.any(Object)
    )
    expect(plan.identifier).toBe('test-plan')
  })

  it('should list harvest runs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['run1', 'run2'],
    })

    const runs = await client.listHarvestRuns('test-plan')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/harvest/runs?plan=test-plan',
      expect.any(Object)
    )
    expect(runs).toHaveLength(2)
    expect(runs).toEqual(['run1', 'run2'])
  })

  it('should get a specific harvest run', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ identifier: 'run1', status: 'done' }),
    })

    const run = await client.getHarvestRun('run1', 'plan1')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/harvest/runs/run1?plan=plan1',
      expect.any(Object)
    )
    expect(run.identifier).toBe('run1')
  })

  it('should execute a harvest run', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ identifier: 'new-run', status: 'in_progress' }),
    })

    const run = await client.runHarvest({ plan_id: 'test-plan' })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/1/harvest/runs',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ plan_id: 'test-plan' }),
      })
    )
    expect(run.status).toBe('in_progress')
  })
})
