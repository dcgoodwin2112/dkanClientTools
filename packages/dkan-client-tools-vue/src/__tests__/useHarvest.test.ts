/**
 * Tests for useHarvest composables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useHarvestPlans, useHarvestPlan, useHarvestRuns, useHarvestRun, useRegisterHarvestPlan, useRunHarvest } from '../useHarvest'

describe('useHarvest', () => {
  let mockClient: DkanClient

  beforeEach(() => {
    // Create QueryClient from Vue Query
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 0 },
      },
    })

    // Create DkanClient with the Vue Query QueryClient
    mockClient = new DkanClient({
      baseUrl: 'https://test.example.com',
      defaultOptions: { retry: 0 },
      queryClient, // Pass the QueryClient from vue-query!
    })
  })

  describe('useHarvestPlans', () => {
    it('should list plans', async () => {
      vi.spyOn(mockClient, 'listHarvestPlans').mockResolvedValue(['plan-1', 'plan-2'])
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useHarvestPlans()
          return () => h('div', `Count: ${data.value?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 2'))
    })
  })

  describe('useHarvestPlan', () => {
    it('should fetch plan', async () => {
      vi.spyOn(mockClient, 'getHarvestPlan').mockResolvedValue({ identifier: 'plan-1', extract: { type: '', uri: '' }, load: { type: '' } })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useHarvestPlan({ planId: ref('plan-1') })
          return () => h('div', data.value?.identifier || 'Loading')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('plan-1'))
    })
  })

  describe('useRegisterHarvestPlan', () => {
    it('should register plan', async () => {
      vi.spyOn(mockClient, 'registerHarvestPlan').mockResolvedValue({ endpoint: 'harvest', identifier: 'plan-1' })
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useRegisterHarvestPlan()
          return () => h('button', {
            onClick: () => mutation.mutate({ identifier: 'plan-1', extract: { type: '', uri: '' }, load: { type: '' } })
          }, mutation.isSuccess.value ? 'Registered' : 'Register')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('Registered'))
    })
  })

  describe('useRunHarvest', () => {
    it('should run harvest', async () => {
      vi.spyOn(mockClient, 'runHarvest').mockResolvedValue({ identifier: 'run-1', status: 'queued' })
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useRunHarvest()
          return () => h('button', {
            onClick: () => mutation.mutate({ plan_id: 'plan-1' })
          }, mutation.data.value?.identifier || 'Run')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('run-1'))
    })
  })
})
