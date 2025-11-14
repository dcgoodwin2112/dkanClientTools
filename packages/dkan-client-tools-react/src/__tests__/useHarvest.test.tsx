/**
 * Tests for useHarvest hooks
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DkanClient, QueryClient } from '@dkan-client-tools/core'
import { DkanClientProvider } from '../DkanClientProvider'
import {
  useHarvestPlans,
  useHarvestPlan,
  useHarvestRuns,
  useHarvestRun,
  useRegisterHarvestPlan,
  useRunHarvest,
} from '../useHarvest'

describe('useHarvest', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    mockClient = new DkanClient({
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: 0 } } }),
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
    })
  })

  describe('useHarvestPlans', () => {
    it('should list harvest plans successfully', async () => {
      const mockPlans = ['plan-1', 'plan-2', 'plan-3']

      vi.spyOn(mockClient, 'listHarvestPlans').mockResolvedValue(mockPlans)

      function TestComponent() {
        const { data: plans, isLoading } = useHarvestPlans()

        if (isLoading) return <div>Loading...</div>
        if (!plans) return null

        return (
          <div>
            <div>Count: {plans.length}</div>
            {plans.map((plan) => (
              <div key={plan}>{plan}</div>
            ))}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Count: 3')).toBeInTheDocument()
        expect(screen.getByText('plan-1')).toBeInTheDocument()
        expect(screen.getByText('plan-2')).toBeInTheDocument()
      })

      expect(mockClient.listHarvestPlans).toHaveBeenCalledTimes(1)
    })

    it('should handle enabled option', () => {
      const plansSpy = vi.spyOn(mockClient, 'listHarvestPlans').mockResolvedValue([])

      function TestComponent() {
        const { data } = useHarvestPlans({ enabled: false })
        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(plansSpy).not.toHaveBeenCalled()
    })
  })

  describe('useHarvestPlan', () => {
    it('should fetch harvest plan successfully', async () => {
      const mockPlan = {
        identifier: 'plan-1',
        extract: {
          type: '\\Drupal\\harvest\\ETL\\Extract\\DataJson',
          uri: 'https://example.com/data.json',
        },
        load: {
          type: '\\Drupal\\harvest\\Load\\Dataset',
        },
      }

      vi.spyOn(mockClient, 'getHarvestPlan').mockResolvedValue(mockPlan)

      function TestComponent() {
        const { data: plan, isLoading } = useHarvestPlan({ planId: 'plan-1' })

        if (isLoading) return <div>Loading...</div>
        if (!plan) return null

        return (
          <div>
            <div>ID: {plan.identifier}</div>
            <div>URI: {plan.extract.uri}</div>
            <div>Type: {plan.extract.type}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('ID: plan-1')).toBeInTheDocument()
        expect(screen.getByText('URI: https://example.com/data.json')).toBeInTheDocument()
      })

      expect(mockClient.getHarvestPlan).toHaveBeenCalledWith('plan-1')
    })

    it('should not fetch when planId is empty', () => {
      const planSpy = vi.spyOn(mockClient, 'getHarvestPlan').mockResolvedValue({
        identifier: '',
        extract: { type: '', uri: '' },
        load: { type: '' },
      })

      function TestComponent() {
        const { data } = useHarvestPlan({ planId: '' })
        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(planSpy).not.toHaveBeenCalled()
    })
  })

  describe('useHarvestRuns', () => {
    it('should list harvest runs successfully', async () => {
      const mockRuns = ['run-1', 'run-2']

      vi.spyOn(mockClient, 'listHarvestRuns').mockResolvedValue(mockRuns)

      function TestComponent() {
        const { data: runs, isLoading } = useHarvestRuns({ planId: 'plan-1' })

        if (isLoading) return <div>Loading...</div>
        if (!runs) return null

        return (
          <div>
            <div>Count: {runs.length}</div>
            {runs.map((runId) => (
              <div key={runId}>Run ID: {runId}</div>
            ))}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Count: 2')).toBeInTheDocument()
        expect(screen.getByText('Run ID: run-1')).toBeInTheDocument()
        expect(screen.getByText('Run ID: run-2')).toBeInTheDocument()
      })

      expect(mockClient.listHarvestRuns).toHaveBeenCalledWith('plan-1')
    })

    it('should not fetch when planId is empty', () => {
      const runsSpy = vi.spyOn(mockClient, 'listHarvestRuns').mockResolvedValue([])

      function TestComponent() {
        const { data } = useHarvestRuns({ planId: '' })
        return <div>Data: {data ? 'yes' : 'no'}</div>
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      expect(screen.getByText('Data: no')).toBeInTheDocument()
      expect(runsSpy).not.toHaveBeenCalled()
    })
  })

  describe('useHarvestRun', () => {
    it('should fetch harvest run successfully', async () => {
      const mockRun = {
        identifier: 'run-1',
        status: 'done',
        load_status: {
          created: 10,
          updated: 5,
          errors: [{ id: 'err-1', error: 'Invalid data' }],
        },
      }

      vi.spyOn(mockClient, 'getHarvestRun').mockResolvedValue(mockRun)

      function TestComponent() {
        const { data: run, isLoading } = useHarvestRun({ runId: 'run-1', planId: 'plan-1' })

        if (isLoading) return <div>Loading...</div>
        if (!run) return null

        return (
          <div>
            <div>Status: {run.status}</div>
            <div>Created: {run.load_status?.created}</div>
            <div>Updated: {run.load_status?.updated}</div>
            <div>Errors: {run.load_status?.errors?.length || 0}</div>
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Status: done')).toBeInTheDocument()
        expect(screen.getByText('Created: 10')).toBeInTheDocument()
        expect(screen.getByText('Updated: 5')).toBeInTheDocument()
        expect(screen.getByText('Errors: 1')).toBeInTheDocument()
      })

      expect(mockClient.getHarvestRun).toHaveBeenCalledWith('run-1', 'plan-1')
    })
  })

  describe('useRegisterHarvestPlan', () => {
    it('should register harvest plan successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        endpoint: 'harvest',
        identifier: 'new-plan',
      }

      const registerSpy = vi
        .spyOn(mockClient, 'registerHarvestPlan')
        .mockResolvedValue(mockResponse)

      const mockPlan = {
        identifier: 'new-plan',
        extract: {
          type: '\\Drupal\\harvest\\ETL\\Extract\\DataJson',
          uri: 'https://example.com/data.json',
        },
        load: {
          type: '\\Drupal\\harvest\\Load\\Dataset',
        },
      }

      function TestComponent() {
        const registerPlan = useRegisterHarvestPlan()

        return (
          <div>
            <button
              onClick={() => registerPlan.mutate(mockPlan)}
              disabled={registerPlan.isPending}
            >
              {registerPlan.isPending ? 'Creating...' : 'Create Plan'}
            </button>
            {registerPlan.isSuccess && <div>Success: {registerPlan.data.identifier}</div>}
            {registerPlan.isError && <div>Error: {registerPlan.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Create Plan')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Success: new-plan')).toBeInTheDocument()
      })

      expect(registerSpy).toHaveBeenCalledWith(mockPlan)
    })

    it('should handle error during registration', async () => {
      const user = userEvent.setup()
      const mockError = new Error('Registration failed')

      vi.spyOn(mockClient, 'registerHarvestPlan').mockRejectedValue(mockError)

      function TestComponent() {
        const registerPlan = useRegisterHarvestPlan()

        return (
          <div>
            <button
              onClick={() =>
                registerPlan.mutate({
                  identifier: 'plan-1',
                  extract: { type: '', uri: '' },
                  load: { type: '' },
                })
              }
            >
              Register
            </button>
            {registerPlan.isError && <div>Error: {registerPlan.error.message}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Register')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Error: Registration failed')).toBeInTheDocument()
      })
    })
  })

  describe('useRunHarvest', () => {
    it('should run harvest successfully', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        identifier: 'run-123',
        status: 'queued',
      }

      const runSpy = vi.spyOn(mockClient, 'runHarvest').mockResolvedValue(mockResponse)

      function TestComponent() {
        const runHarvest = useRunHarvest()

        return (
          <div>
            <button
              onClick={() => runHarvest.mutate({ plan_id: 'plan-1' })}
              disabled={runHarvest.isPending}
            >
              {runHarvest.isPending ? 'Starting...' : 'Run'}
            </button>
            {runHarvest.isSuccess && <div>Run ID: {runHarvest.data.identifier}</div>}
          </div>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Run')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Run ID: run-123')).toBeInTheDocument()
      })

      expect(runSpy).toHaveBeenCalledWith({ plan_id: 'plan-1' })
    })

    it('should call onSuccess callback', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse = {
        identifier: 'run-123',
        status: 'queued',
      }

      vi.spyOn(mockClient, 'runHarvest').mockResolvedValue(mockResponse)

      function TestComponent() {
        const runHarvest = useRunHarvest()

        return (
          <button onClick={() => runHarvest.mutate({ plan_id: 'plan-1' }, { onSuccess })}>
            Run
          </button>
        )
      }

      render(
        <DkanClientProvider client={mockClient}>
          <TestComponent />
        </DkanClientProvider>
      )

      const button = screen.getByText('Run')
      await user.click(button)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResponse)
      })
    })
  })
})
