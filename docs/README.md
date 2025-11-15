# DKAN Client Tools Documentation

Developer-focused guides for building applications with DKAN Client Tools.

## Quick Navigation

### Getting Started
- **[Installation](./INSTALLATION.md)** - Install packages for React, Vue, or vanilla JavaScript
- **[Quick Start](./QUICK_START.md)** - Get up and running in 5 minutes

### Framework Guides
- **[React Guide](./REACT_GUIDE.md)** - Complete guide for React developers
- **[Vue Guide](./VUE_GUIDE.md)** - Complete guide for Vue 3 developers

### Integration
- **[Drupal Integration](./DRUPAL_INTEGRATION.md)** - Using DKAN Client Tools in Drupal themes and modules
- **[Build Process](./BUILD_PROCESS.md)** - Understanding the build system

### Reference
- **[API Reference](./API_REFERENCE.md)** - Complete API method documentation
- **[Project Patterns](./reference/PATTERNS.md)** - TypeScript patterns used in this project

### External Dependencies
- **[External Technologies Overview](./external/README.md)** - DKAN, TanStack Query, and standards

---

## Package Documentation

Each package has its own README with installation and API details:

- **[@dkan-client-tools/core](../packages/dkan-client-tools-core/README.md)** - Framework-agnostic core
- **[@dkan-client-tools/react](../packages/dkan-client-tools-react/README.md)** - React hooks
- **[@dkan-client-tools/vue](../packages/dkan-client-tools-vue/README.md)** - Vue composables

## Example Applications

Working examples to learn from:

- **[React Demo App](../examples/react-demo-app/README.md)** - Complete React application
- **[Vue Demo App](../examples/vue-demo-app/README.md)** - Complete Vue 3 application
- **[Vanilla Demo App](../examples/vanilla-demo-app/README.md)** - Vanilla JavaScript example

## Architecture

DKAN Client Tools is built on [TanStack Query](https://tanstack.com/query):

- **Core package** - Wraps TanStack Query Core with DKAN-specific client
- **Framework adapters** - React and Vue packages provide hooks/composables
- **Type-safe** - Full TypeScript support with DCAT-US and Frictionless schemas
- **Smart caching** - Automatic caching, deduplication, and background refetching

## Common Tasks

- **Install for React** → [Installation Guide](./INSTALLATION.md#react)
- **Install for Vue** → [Installation Guide](./INSTALLATION.md#vue)
- **Search datasets** → [React Guide - Dataset Hooks](./REACT_GUIDE.md#dataset-hooks) / [Vue Guide](./VUE_GUIDE.md#dataset-composables)
- **Query datastore** → [React Guide - Datastore Hooks](./REACT_GUIDE.md#datastore-hooks) / [Vue Guide](./VUE_GUIDE.md#datastore-composables)
- **Integrate with Drupal** → [Drupal Integration Guide](./DRUPAL_INTEGRATION.md)
- **Build packages** → [Build Process Guide](./BUILD_PROCESS.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/dcgoodwin2112/dkanClientTools/issues)
- **DKAN Documentation**: [dkan.readthedocs.io](https://dkan.readthedocs.io)
- **TanStack Query Docs**: [tanstack.com/query](https://tanstack.com/query)
