# DKAN Client Tools Vue - Vendor Files

Self-contained IIFE builds of DKAN Client Tools Vue package.

## Files

### Full Build (WITH template compiler)
- **dkan-client-tools-vue-full.min.js** - 240KB minified
  - Vue 3.5.x (full build with compiler)
  - TanStack Vue Query 5.x
  - DKAN Client Tools Core
  - All 40+ DKAN Vue composables
  - **Use when**: Compiling templates at runtime (template strings in JavaScript)

### Runtime-Only Build (WITHOUT template compiler)
- **dkan-client-tools-vue-runtime.min.js** - 174KB minified (28% smaller!)
  - Vue 3.5.x (runtime-only build)
  - TanStack Vue Query 5.x
  - DKAN Client Tools Core
  - All 40+ DKAN Vue composables
  - **Use when**: Templates are pre-compiled (.vue SFCs or render functions)

### Legacy File (Deprecated)
- **dkan-client-tools-vue.min.js** - 250KB (old full build, DO NOT USE)

## Choosing a Build

**Use Full Build (240KB) if:**
- ✅ Using template strings in JavaScript
- ✅ Need runtime template compilation
- ✅ Quick prototyping or demos
- Example: `template: '<div>{{ message }}</div>'`

**Use Runtime-Only Build (174KB) if:**
- ✅ Using pre-compiled .vue SFC files
- ✅ Using render functions with `h()`
- ✅ Production sites where bundle size matters
- ✅ Want better performance (no runtime compilation)

## Source

Built from: `/packages/dkan-client-tools-vue`

Build command:
```bash
cd packages/dkan-client-tools-vue
npm run build
```

Copy to Drupal:
```bash
# Full build (with compiler)
cp dist/index.global.full.min.js ../../dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue-full.min.js

# Runtime-only build (without compiler)
cp dist/index-runtime.global.runtime.min.js ../../dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue-runtime.min.js
```

## Global

Both files export to:
- `window.DkanClientToolsVue` - Complete DKAN Client Tools Vue library

## Included Exports

The global object includes:
- `DkanClientToolsVue.Vue` - Vue 3 library (full or runtime-only)
- `DkanClientToolsVue.QueryClient` - TanStack Query Client
- `DkanClientToolsVue.VueQueryPlugin` - TanStack Vue Query plugin
- `DkanClientToolsVue.DkanClient` - DKAN API Client
- `DkanClientToolsVue.DkanClientPlugin` - DKAN plugin for Vue
- `DkanClientToolsVue.useDatasetSearch` - Dataset search composable
- Plus 40+ other composables for DKAN API operations

## Updating

To update the library:

1. Make changes to the Vue package
2. Rebuild:
   ```bash
   cd packages/dkan-client-tools-vue
   npm run build
   ```
3. Copy to Drupal:
   ```bash
   # Full build
   cp dist/index.global.full.min.js ../../dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue-full.min.js

   # Runtime build
   cp dist/index-runtime.global.runtime.min.js ../../dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue-runtime.min.js
   ```
4. Update version in `../../dkan_client_tools_vue_base.libraries.yml`
5. Clear Drupal cache:
   ```bash
   cd ../../dkan
   ddev drush cr
   ```

## Bundle Size Comparison

| Build | Size | Savings | Use Case |
|-------|------|---------|----------|
| Full | 240KB | baseline | Runtime template strings |
| Runtime-Only | 174KB | **-28%** | Pre-compiled templates |
