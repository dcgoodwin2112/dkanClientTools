# DKAN Client Tools - User Documentation

This directory contains comprehensive guides for using DKAN Client Tools packages in different environments.

## Available Guides

### [Creating a React Standalone App](./REACT_STANDALONE_APP.md)

Complete guide for building standalone React applications with `@dkan-client-tools/react`:

- Setting up a Vite + React project
- Installing and configuring the DKAN Client Provider
- Using React hooks for data fetching
- Authentication and CORS configuration
- Building and deploying for production
- Testing with Vitest
- Performance optimization techniques

**Best for**: Modern React SPAs, Next.js apps, or any React-based frontend application

### [Creating a Vue Standalone App](./VUE_STANDALONE_APP.md)

Complete guide for building standalone Vue 3 applications with `@dkan-client-tools/vue`:

- Setting up a Vite + Vue project
- Installing and configuring the DKAN Client Plugin
- Using Vue composables for data fetching
- Authentication and CORS configuration
- Building and deploying for production
- Testing with Vitest
- Performance optimization techniques

**Best for**: Modern Vue 3 SPAs, Nuxt apps, or any Vue-based frontend application

### [Drupal Integration](./DRUPAL_USAGE.md)

Comprehensive guide for integrating DKAN Client Tools with Drupal:

- IIFE builds for browser/Drupal usage
- Drupal library definitions
- Using with Drupal Behaviors
- React and Vue integration in Drupal themes/modules
- Global variable reference
- Build size information

**Best for**: Drupal themes, custom Drupal modules, or integrating with existing Drupal sites

## Quick Reference

| Framework | Package | Documentation |
|-----------|---------|---------------|
| React | `@dkan-client-tools/react` | [React Standalone App Guide](./REACT_STANDALONE_APP.md) |
| Vue 3 | `@dkan-client-tools/vue` | [Vue Standalone App Guide](./VUE_STANDALONE_APP.md) |
| Vanilla JS / Drupal | `@dkan-client-tools/core` | [Drupal Usage Guide](./DRUPAL_USAGE.md) |

## Example Applications

Working examples are available in the repository:

- **React Example**: `/examples/react-demo-app` - Complete React app with dataset search, details, and Tailwind CSS
- **Vue Example**: `/examples/vue-demo-app` - Vue 3 app with dataset search and pagination

## Common Features Across All Frameworks

All packages provide:

- **40+ hooks/composables** covering all DKAN REST APIs
- **Full TypeScript support** with DCAT-US schema types
- **Smart caching** via TanStack Query
- **Automatic refetching** and background updates
- **Optimistic updates** for mutations
- **Authentication support** (Basic Auth and Bearer tokens)
- **CORS handling** via proxy configuration

## Getting Help

- **API Reference**: See [DKAN API Research](../research/DKAN_API_RESEARCH.md)
- **Package README**: Each package has its own detailed README:
  - [Core Package](../packages/dkan-client-tools-core/README.md)
  - [React Package](../packages/dkan-client-tools-react/README.md)
  - [Vue Package](../packages/dkan-client-tools-vue/README.md)
- **Issues**: Report issues on GitHub
- **DKAN Documentation**: https://dkan.readthedocs.io

## Next Steps

1. Choose your framework (React, Vue, or Drupal)
2. Follow the appropriate guide above
3. Explore the example applications
4. Read the API documentation for advanced usage
