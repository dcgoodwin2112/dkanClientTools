/**
 * Tests for useRevisions composables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useRevisions, useRevision, useCreateRevision, useChangeDatasetState } from '../useRevisions'

describe('useRevisions', () => {
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

  describe('useRevisions', () => {
    it('should list revisions', async () => {
      vi.spyOn(mockClient, 'getRevisions').mockResolvedValue([
        { revision_id: 1, moderation_state: 'published' },
        { revision_id: 2, moderation_state: 'draft' },
      ] as any)
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useRevisions({ schemaId: ref('dataset'), identifier: ref('dataset-123') })
          return () => h('div', `Count: ${data.value?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 2'))
    })
  })

  describe('useRevision', () => {
    it('should fetch specific revision', async () => {
      vi.spyOn(mockClient, 'getRevision').mockResolvedValue({
        revision_id: 1,
        moderation_state: 'published',
        data: { identifier: 'ds-123', title: 'Dataset' },
      } as any)
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useRevision({ schemaId: ref('dataset'), identifier: ref('dataset-123'), revisionId: ref('1') })
          return () => h('div', data.value?.moderation_state || 'Loading')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('published'))
    })
  })

  describe('useCreateRevision', () => {
    it('should create revision', async () => {
      vi.spyOn(mockClient, 'createRevision').mockResolvedValue({ revision_id: 2 })
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useCreateRevision()
          return () => h('button', {
            onClick: () => mutation.mutate('dataset-123')
          }, mutation.data.value ? `Rev ${mutation.data.value.revision_id}` : 'Create')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('Rev 2'))
    })
  })

  describe('useChangeDatasetState', () => {
    it('should change state', async () => {
      vi.spyOn(mockClient, 'changeDatasetState').mockResolvedValue({ message: 'State changed' })
      const wrapper = mount(defineComponent({
        setup() {
          const mutation = useChangeDatasetState()
          return () => h('button', {
            onClick: () => mutation.mutate({ identifier: 'dataset-123', state: 'published' })
          }, mutation.isSuccess.value ? 'Changed' : 'Change')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => expect(wrapper.text()).toBe('Changed'))
    })
  })
})
