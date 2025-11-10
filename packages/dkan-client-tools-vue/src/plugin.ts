/**
 * DkanClientPlugin - Vue Plugin for DkanClient
 * Provides DkanClient and TanStack VueQuery to the entire Vue application
 */

import { type App, type Plugin, inject, type InjectionKey } from 'vue'
import { QueryClient, VueQueryPlugin, type VueQueryPluginOptions } from '@tanstack/vue-query'
import { DkanClient, type DkanClientOptions } from '@dkan-client-tools/core'

export const DkanClientKey: InjectionKey<DkanClient> = Symbol('DkanClient')

export interface DkanClientPluginOptions {
  /**
   * EITHER provide clientOptions (plugin creates DkanClient) OR provide a pre-created client (for testing)
   */
  clientOptions?: Omit<DkanClientOptions, 'queryClient'>
  client?: DkanClient

  /**
   * Optional Vue Query configuration
   */
  vueQueryOptions?: Omit<VueQueryPluginOptions, 'queryClient'>
}

/**
 * Vue plugin that provides DkanClient and TanStack VueQuery to the application
 *
 * @example
 * ```typescript
 * import { createApp } from 'vue'
 * import { DkanClientPlugin } from '@dkan-client-tools/vue'
 * import App from './App.vue'
 *
 * const app = createApp(App)
 * app.use(DkanClientPlugin, {
 *   clientOptions: {
 *     baseUrl: 'https://demo.getdkan.org',
 *   }
 * })
 * app.mount('#app')
 * ```
 */
export const DkanClientPlugin: Plugin<DkanClientPluginOptions> = {
  install(app: App, options: DkanClientPluginOptions) {
    const { clientOptions, client: providedClient, vueQueryOptions } = options

    let client: DkanClient
    let queryClient: QueryClient

    if (providedClient) {
      // Use pre-created client (for testing)
      client = providedClient
      queryClient = client.getQueryClient()
    } else if (clientOptions) {
      // Create QueryClient from Vue Query (NOT from query-core!)
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: clientOptions.defaultOptions?.staleTime ?? 0,
            gcTime: clientOptions.defaultOptions?.cacheTime ?? 5 * 60 * 1000,
            retry: clientOptions.defaultOptions?.retry ?? 3,
            retryDelay: clientOptions.defaultOptions?.retryDelay ?? 1000,
          },
        },
      })

      // Create DkanClient with the Vue Query QueryClient
      client = new DkanClient({
        ...clientOptions,
        queryClient,
      })
    } else {
      throw new Error('DkanClientPlugin requires either clientOptions or client to be provided')
    }

    // Install VueQuery plugin
    app.use(VueQueryPlugin, {
      ...vueQueryOptions,
      queryClient,
    })

    // Provide DkanClient
    app.provide(DkanClientKey, client)
  },
}

/**
 * Composable to access the DkanClient from the Vue application
 *
 * @throws Error if used outside of a Vue app with DkanClientPlugin installed
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDkanClient } from '@dkan-client-tools/vue'
 *
 * const client = useDkanClient()
 * console.log('Base URL:', client.getBaseUrl())
 * </script>
 * ```
 */
export function useDkanClient(): DkanClient {
  const client = inject(DkanClientKey)

  if (!client) {
    throw new Error(
      'useDkanClient must be used in a Vue app with DkanClientPlugin installed'
    )
  }

  return client
}
