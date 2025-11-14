/**
 * Tests for useMetastore composables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query' // Import from vue-query, not query-core!
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import { useAllDatasets, useSchemas, useSchema, useSchemaItems, useDatasetFacets } from '../useMetastore'

describe('useMetastore', () => {
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

  describe('useAllDatasets', () => {
    it('should fetch all datasets', async () => {
      const spy = vi.spyOn(mockClient, 'listAllDatasets').mockResolvedValue([
        { identifier: 'ds-1', title: 'Dataset 1', accessLevel: 'public', modified: '2024-01-01', keyword: [], publisher: { name: 'Pub' }, contactPoint: { '@type': 'vcard:Contact', fn: 'Contact', hasEmail: 'test@example.com' } },
      ] as any)
      const wrapper = mount(defineComponent({
        setup() {
          const { data, isLoading, error } = useAllDatasets()
          return () => h('div', `Count: ${data.value?.length || 0} | Loading: ${isLoading.value} | Error: ${error.value?.message || 'none'}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      console.log('Initial text:', wrapper.text())
      await vi.waitFor(() => {
        console.log('Checking text:', wrapper.text())
        console.log('Spy called:', spy.mock.calls.length, 'times')
        expect(wrapper.text()).toBe('Count: 1 | Loading: false | Error: none')
      }, { timeout: 5000 })
    })
  })

  describe('useSchemas', () => {
    it('should list schemas', async () => {
      vi.spyOn(mockClient, 'listSchemas').mockResolvedValue(['dataset', 'data-dictionary'])
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useSchemas()
          return () => h('div', `Count: ${data.value?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 2'))
    })
  })

  describe('useSchema', () => {
    it('should fetch schema successfully', async () => {
      const mockSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Dataset',
        description: 'DCAT-US Dataset Schema',
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Dataset title' },
          description: { type: 'string', description: 'Dataset description' },
          identifier: { type: 'string', description: 'Unique identifier' },
          accessLevel: { type: 'string', enum: ['public', 'restricted', 'non-public'] },
        },
        required: ['title', 'description', 'identifier', 'accessLevel'],
      }
      vi.spyOn(mockClient, 'getSchema').mockResolvedValue(mockSchema)
      const wrapper = mount(defineComponent({
        setup() {
          const { data: schema, isLoading } = useSchema({ schemaId: ref('dataset') })
          return () => h('div', isLoading.value ? 'Loading' : `Title: ${schema.value?.title} | Properties: ${Object.keys(schema.value?.properties || {}).length} | Required: ${schema.value?.required?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Title: Dataset | Properties: 4 | Required: 4'))
    })

    it('should handle loading state', () => {
      vi.spyOn(mockClient, 'getSchema').mockImplementation(() => new Promise(() => {}))
      const wrapper = mount(defineComponent({
        setup() {
          const { data, isLoading } = useSchema({ schemaId: ref('dataset') })
          return () => h('div', `Loading: ${isLoading.value} | Data: ${data.value ? 'yes' : 'no'}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      expect(wrapper.text()).toBe('Loading: true | Data: no')
    })

    it('should handle error state', async () => {
      vi.spyOn(mockClient, 'getSchema').mockRejectedValue(new Error('Schema not found'))
      const wrapper = mount(defineComponent({
        setup() {
          const { error, isLoading } = useSchema({ schemaId: ref('nonexistent') })
          return () => h('div', isLoading.value ? 'Loading' : (error.value ? `Error: ${error.value.message}` : 'Success'))
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Error: Schema not found'))
    })

    it('should handle enabled option', () => {
      const schemaSpy = vi.spyOn(mockClient, 'getSchema').mockResolvedValue({ type: 'object', properties: {} })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useSchema({ schemaId: ref('dataset'), enabled: ref(false) })
          return () => h('div', `Data: ${data.value ? 'yes' : 'no'}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      expect(wrapper.text()).toBe('Data: no')
      expect(schemaSpy).not.toHaveBeenCalled()
    })

    it('should not fetch when schemaId is empty', () => {
      const schemaSpy = vi.spyOn(mockClient, 'getSchema').mockResolvedValue({ type: 'object', properties: {} })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useSchema({ schemaId: ref('') })
          return () => h('div', `Data: ${data.value ? 'yes' : 'no'}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      expect(wrapper.text()).toBe('Data: no')
      expect(schemaSpy).not.toHaveBeenCalled()
    })

    it('should display schema properties', async () => {
      const mockSchema = {
        title: 'Data Dictionary',
        type: 'object',
        properties: {
          title: { type: 'string' },
          fields: { type: 'array' },
          indexes: { type: 'object' },
        },
        required: ['title', 'fields'],
      }
      vi.spyOn(mockClient, 'getSchema').mockResolvedValue(mockSchema)
      const wrapper = mount(defineComponent({
        setup() {
          const { data: schema } = useSchema({ schemaId: ref('data-dictionary') })
          return () => h('div', schema.value ? `Schema: ${schema.value.title} | Props: ${Object.keys(schema.value.properties || {}).join(', ')}` : 'Loading')
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Schema: Data Dictionary | Props: title, fields, indexes'))
    })
  })

  describe('useSchemaItems', () => {
    it('should fetch schema items', async () => {
      vi.spyOn(mockClient, 'getSchemaItems').mockResolvedValue([
        { identifier: 'item-1', data: { title: 'Item 1' } },
      ])
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useSchemaItems({ schemaId: ref('dataset') })
          return () => h('div', `Count: ${data.value?.length || 0}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Count: 1'))
    })
  })

  describe('useDatasetFacets', () => {
    it('should fetch facets', async () => {
      vi.spyOn(mockClient, 'getDatasetFacets').mockResolvedValue({
        theme: { 'Health': 10, 'Education': 5 },
        keyword: { 'data': 15 },
      })
      const wrapper = mount(defineComponent({
        setup() {
          const { data } = useDatasetFacets()
          return () => h('div', `Themes: ${Object.keys(data.value?.theme || {}).length}`)
        },
      }), { global: { plugins: [[DkanClientPlugin, { client: mockClient }]] } })

      await vi.waitFor(() => expect(wrapper.text()).toBe('Themes: 2'))
    })
  })
})
