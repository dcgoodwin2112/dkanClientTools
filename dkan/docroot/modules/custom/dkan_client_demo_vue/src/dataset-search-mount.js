/**
 * @file
 * Mounts the Vue Dataset Search widget using DKAN Client Tools Vue.
 * Uses runtime-only Vue build with render function (28% smaller bundle).
 */

(function (Drupal, once) {
  'use strict';

  // Wait for DkanClientToolsVue and component to be available
  if (typeof window.DkanClientToolsVue === 'undefined') {
    console.error('DkanClientToolsVue is not loaded. Make sure dkan_client_tools_vue_base/dkan-client-vue-runtime is a dependency.');
    return;
  }

  if (typeof window.DatasetSearchComponent === 'undefined') {
    console.error('DatasetSearchComponent is not loaded. Make sure dataset-search-component.js loads first.');
    return;
  }

  const { Vue, DkanClient, QueryClient, VueQueryPlugin, DkanClientPlugin } = window.DkanClientToolsVue;

  /**
   * Drupal behavior for mounting Vue Dataset Search widget.
   */
  Drupal.behaviors.dkanDatasetSearchVue = {
    attach: function (context, settings) {
      // Find all mount points and initialize once
      const elements = once('dkan-dataset-search-vue', '#dkan-dataset-search-vue', context);

      elements.forEach((element) => {
        const baseUrl = element.getAttribute('data-base-url') || window.location.origin;

        // Create QueryClient
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              staleTime: 5 * 60 * 1000, // 5 minutes
              refetchOnWindowFocus: false,
            },
          },
        });

        // Create DkanClient with QueryClient
        const dkanClient = new DkanClient({
          baseUrl,
          queryClient
        });

        // Create and mount Vue app with the component
        const app = Vue.createApp(window.DatasetSearchComponent, {
          baseUrl: baseUrl,
        });

        // Install plugins
        app.use(VueQueryPlugin, { queryClient });
        app.use(DkanClientPlugin, { client: dkanClient });

        // Mount the app
        app.mount(element);
      });
    },
  };
})(Drupal, once);
