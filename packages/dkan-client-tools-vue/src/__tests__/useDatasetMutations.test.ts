/**
 * Tests for Dataset Mutation composables
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientPlugin } from '../plugin'
import {
  useCreateDataset,
  useUpdateDataset,
  usePatchDataset,
  useDeleteDataset,
} from '../useDatasetMutations'

describe('useDatasetMutations', () => {
  let mockClient: DkanClient

  const mockDataset = {
    identifier: 'test-123',
    title: 'Test Dataset',
    description: 'Test description',
    accessLevel: 'public' as const,
    modified: '2024-01-01',
    keyword: ['test', 'data'],
    publisher: { name: 'Test Publisher' },
    contactPoint: {
      '@type': 'vcard:Contact',
      fn: 'Test Contact',
      hasEmail: 'test@example.com',
    },
  }

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

  describe('useCreateDataset', () => {
    it('should create dataset successfully', async () => {
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      const createSpy = vi
        .spyOn(mockClient, 'createDataset')
        .mockResolvedValue(mockResponse)

      const TestComponent = defineComponent({
        setup() {
          const createDataset = useCreateDataset()

          const handleCreate = () => {
            createDataset.mutate(mockDataset)
          }

          return () => h('div', [
            h(
              'button',
              {
                onClick: handleCreate,
                disabled: createDataset.isPending.value,
              },
              createDataset.isPending.value ? 'Creating...' : 'Create Dataset'
            ),
            createDataset.isSuccess.value
              ? h('div', `Success: ${createDataset.data.value.identifier}`)
              : null,
            createDataset.isError.value
              ? h('div', `Error: ${createDataset.error.value?.message}`)
              : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Success: test-123')
      })

      expect(createSpy).toHaveBeenCalledWith(mockDataset)
    })

    it('should handle create errors', async () => {
      vi.spyOn(mockClient, 'createDataset').mockRejectedValue(
        new Error('Validation failed: title is required')
      )

      const TestComponent = defineComponent({
        setup() {
          const createDataset = useCreateDataset()

          return () => h('div', [
            h('button', { onClick: () => createDataset.mutate({} as any) }, 'Create'),
            createDataset.isError.value
              ? h('div', `Error: ${createDataset.error.value?.message}`)
              : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Error: Validation failed: title is required')
      })
    })

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      vi.spyOn(mockClient, 'createDataset').mockResolvedValue(mockResponse)

      const TestComponent = defineComponent({
        setup() {
          const createDataset = useCreateDataset()

          return () =>
            h(
              'button',
              {
                onClick: () => createDataset.mutate(mockDataset, { onSuccess }),
              },
              'Create'
            )
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResponse)
        expect(call[1]).toEqual(mockDataset)
      })
    })

    it('should support mutateAsync for async/await', async () => {
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      vi.spyOn(mockClient, 'createDataset').mockResolvedValue(mockResponse)

      const TestComponent = defineComponent({
        setup() {
          const createDataset = useCreateDataset()
          const result = ref('')

          const handleCreate = async () => {
            try {
              const response = await createDataset.mutateAsync(mockDataset)
              result.value = `Created: ${response.identifier}`
            } catch (error) {
              result.value = 'Failed'
            }
          }

          return () => h('div', [
            h('button', { onClick: handleCreate }, 'Create'),
            result.value ? h('div', `Result: ${result.value}`) : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Result: Created: test-123')
      })
    })
  })

  describe('useUpdateDataset', () => {
    it('should update dataset successfully', async () => {
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      const updateSpy = vi
        .spyOn(mockClient, 'updateDataset')
        .mockResolvedValue(mockResponse)

      const updatedDataset = {
        ...mockDataset,
        title: 'Updated Title',
        description: 'Updated description',
      }

      const TestComponent = defineComponent({
        setup() {
          const updateDataset = useUpdateDataset()

          const handleUpdate = () => {
            updateDataset.mutate({
              identifier: 'test-123',
              dataset: updatedDataset,
            })
          }

          return () => h('div', [
            h(
              'button',
              {
                onClick: handleUpdate,
                disabled: updateDataset.isPending.value,
              },
              updateDataset.isPending.value ? 'Saving...' : 'Save Changes'
            ),
            updateDataset.isSuccess.value ? h('div', 'Updated successfully') : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Updated successfully')
      })

      expect(updateSpy).toHaveBeenCalledWith('test-123', updatedDataset)
    })

    it('should handle update errors', async () => {
      vi.spyOn(mockClient, 'updateDataset').mockRejectedValue(
        new Error('Dataset not found')
      )

      const TestComponent = defineComponent({
        setup() {
          const updateDataset = useUpdateDataset()

          return () => h('div', [
            h(
              'button',
              {
                onClick: () =>
                  updateDataset.mutate({
                    identifier: 'test-123',
                    dataset: mockDataset,
                  }),
              },
              'Update'
            ),
            updateDataset.isError.value
              ? h('div', `Error: ${updateDataset.error.value?.message}`)
              : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Error: Dataset not found')
      })
    })
  })

  describe('usePatchDataset', () => {
    it('should patch dataset title successfully', async () => {
      const mockResponse = {
        endpoint: 'dataset',
        identifier: 'test-123',
      }

      const patchSpy = vi
        .spyOn(mockClient, 'patchDataset')
        .mockResolvedValue(mockResponse)

      const TestComponent = defineComponent({
        setup() {
          const patchDataset = usePatchDataset()
          const title = ref('New Title')

          const handlePatch = () => {
            patchDataset.mutate({
              identifier: 'test-123',
              partialDataset: { title: title.value },
            })
          }

          return () => h('div', [
            h('input', { value: title.value, placeholder: 'Title' }),
            h(
              'button',
              {
                onClick: handlePatch,
                disabled: patchDataset.isPending.value,
              },
              patchDataset.isPending.value ? 'Updating...' : 'Update Title'
            ),
            patchDataset.isSuccess.value ? h('div', 'Title updated') : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Title updated')
      })

      expect(patchSpy).toHaveBeenCalledWith('test-123', { title: 'New Title' })
    })

    it('should handle patch errors', async () => {
      vi.spyOn(mockClient, 'patchDataset').mockRejectedValue(
        new Error('Invalid field value')
      )

      const TestComponent = defineComponent({
        setup() {
          const patchDataset = usePatchDataset()

          return () => h('div', [
            h(
              'button',
              {
                onClick: () =>
                  patchDataset.mutate({
                    identifier: 'test-123',
                    partialDataset: { title: '' },
                  }),
              },
              'Patch'
            ),
            patchDataset.isError.value
              ? h('div', `Error: ${patchDataset.error.value?.message}`)
              : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Error: Invalid field value')
      })
    })
  })

  describe('useDeleteDataset', () => {
    it('should delete dataset successfully', async () => {
      const mockResponse = { message: 'Dataset deleted successfully' }

      const deleteSpy = vi
        .spyOn(mockClient, 'deleteDataset')
        .mockResolvedValue(mockResponse)

      const TestComponent = defineComponent({
        setup() {
          const deleteDataset = useDeleteDataset()

          return () => h('div', [
            h(
              'button',
              {
                onClick: () => deleteDataset.mutate('test-123'),
                disabled: deleteDataset.isPending.value,
              },
              deleteDataset.isPending.value ? 'Deleting...' : 'Delete Dataset'
            ),
            deleteDataset.isSuccess.value
              ? h('div', `Message: ${deleteDataset.data.value.message}`)
              : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Message: Dataset deleted successfully')
      })

      expect(deleteSpy).toHaveBeenCalledWith('test-123')
    })

    it('should handle delete errors', async () => {
      vi.spyOn(mockClient, 'deleteDataset').mockRejectedValue(
        new Error('Dataset has dependencies')
      )

      const TestComponent = defineComponent({
        setup() {
          const deleteDataset = useDeleteDataset()

          return () => h('div', [
            h('button', { onClick: () => deleteDataset.mutate('test-123') }, 'Delete'),
            deleteDataset.isError.value
              ? h('div', `Error: ${deleteDataset.error.value?.message}`)
              : null,
          ])
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Error: Dataset has dependencies')
      })
    })

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const mockResponse = { message: 'Deleted' }

      vi.spyOn(mockClient, 'deleteDataset').mockResolvedValue(mockResponse)

      const TestComponent = defineComponent({
        setup() {
          const deleteDataset = useDeleteDataset()

          return () =>
            h(
              'button',
              { onClick: () => deleteDataset.mutate('test-123', { onSuccess }) },
              'Delete'
            )
        },
      })

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[DkanClientPlugin, { client: mockClient }]],
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        const call = onSuccess.mock.calls[0]
        expect(call[0]).toEqual(mockResponse)
        expect(call[1]).toEqual('test-123')
      })
    })
  })
})
