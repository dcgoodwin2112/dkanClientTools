# DKAN Client Tools Documentation

Developer-focused guides for building applications with DKAN Client Tools.

---

## Complete Documentation Index

### Getting Started
- **[Installation](./INSTALLATION.md)** - Install packages for React, Vue, or vanilla JavaScript
- **[Quick Start](./QUICK_START.md)** - Get up and running in 5 minutes

### Framework Guides
- **[React Guide](./REACT_GUIDE.md)** - Complete guide for React developers
- **[Vue Guide](./VUE_GUIDE.md)** - Complete guide for Vue 3 developers

### Integration & Build
- **[Drupal Integration](./DRUPAL_INTEGRATION.md)** - Using DKAN Client Tools in Drupal themes and modules
- **[Build Process](./BUILD_PROCESS.md)** - Understanding the automated build system
- **[Architecture](./ARCHITECTURE.md)** - Design decisions and architectural patterns

### Reference
- **[API Reference](./API_REFERENCE.md)** - Complete documentation of all hooks, composables, and API methods
- **[Project Patterns](./reference/PATTERNS.md)** - TypeScript patterns and conventions

### External Dependencies
- **[External Technologies Overview](./external/README.md)** - Documentation for DKAN, TanStack Query, data standards, and frameworks

---

## Package Documentation

Each package has detailed installation and API documentation:

- **[@dkan-client-tools/core](../packages/dkan-client-tools-core/README.md)** - Framework-agnostic core with API client and types
- **[@dkan-client-tools/react](../packages/dkan-client-tools-react/README.md)** - React hooks built on TanStack React Query
- **[@dkan-client-tools/vue](../packages/dkan-client-tools-vue/README.md)** - Vue 3 composables built on TanStack Vue Query

---

## Common Tasks

Quick links to frequently needed documentation:

**Installation:**
- [Install for React](./INSTALLATION.md#react)
- [Install for Vue](./INSTALLATION.md#vue)
- [Install for vanilla JavaScript](./INSTALLATION.md#core-framework-agnostic)

**API Operations:**
- [Search datasets](./API_REFERENCE.md#dataset-hooks) - `useDatasetSearch` / `useDataset`
- [Query datastore](./API_REFERENCE.md#datastore-hooks) - `useDatastore` / `useSqlQuery`
- [Manage data dictionaries](./API_REFERENCE.md#data-dictionary-hooks) - `useDataDictionary` / `useDataDictionaryList`
- [Handle harvest operations](./API_REFERENCE.md#harvest-hooks) - `useHarvestPlans` / `useRunHarvest`

**Integration:**
- [Drupal theme integration](./DRUPAL_INTEGRATION.md#integrating-with-drupal-themes)
- [Drupal module integration](./DRUPAL_INTEGRATION.md#integrating-with-drupal-modules)
- [Build and deploy](./BUILD_PROCESS.md)

---

## Architecture Overview

DKAN Client Tools uses a **core + adapters pattern** built on [TanStack Query](https://tanstack.com/query):

- **Core Package** (`@dkan-client-tools/core`) - Framework-agnostic foundation
  - `DkanClient` - Wraps TanStack Query Core with DKAN configuration
  - `DkanApiClient` - HTTP client for all DKAN REST APIs
  - TypeScript types for DCAT-US schema and Frictionless Table Schema

- **Framework Adapters** - React and Vue packages
  - **React** (`@dkan-client-tools/react`) - Hooks using TanStack React Query
  - **Vue** (`@dkan-client-tools/vue`) - Composables using TanStack Vue Query
  - Identical API between frameworks for easy switching

**Key Features:**
- **Smart caching** - Automatic caching, deduplication, and background refetching
- **Type safety** - Full TypeScript support with complete schema types
- **Framework parity** - Same API across React and Vue for consistency

See **[Architecture Documentation](./ARCHITECTURE.md)** for detailed design decisions.

---

## Support & Resources

- **Issues**: [GitHub Issues](https://github.com/dcgoodwin2112/dkanClientTools/issues)
- **DKAN Documentation**: [dkan.readthedocs.io](https://dkan.readthedocs.io)
- **TanStack Query Docs**: [tanstack.com/query](https://tanstack.com/query)
- **DCAT-US Schema**: [resources.data.gov/resources/dcat-us](https://resources.data.gov/resources/dcat-us/)
