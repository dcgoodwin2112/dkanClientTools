# DKAN Client Demo (Vue)

Demo module showing how to use `@dkan-client-tools/vue` in Drupal with optimal bundle size.

## Key Features

- ✅ **Clean template syntax** during development (Vue SFC)
- ✅ **Runtime-only Vue build** in production (28% smaller - 174KB vs 240KB)
- ✅ **Pre-compiled templates** for better performance
- ✅ **No runtime template compilation overhead**

## Architecture

This module demonstrates the **optimal approach** for using Vue in Drupal:

1. **Development**: Write components using Vue Single File Components (`.vue` files) with clean template syntax
2. **Build**: Vite compiles templates to render functions at build time
3. **Production**: Use runtime-only Vue build (no compiler needed)

### File Structure

```
dkan_client_demo_vue/
├── src/
│   ├── DatasetSearchWidget.vue          # Source component (template syntax)
│   ├── dataset-search-mount.js          # Drupal behavior to mount component
│   └── Plugin/Block/
│       └── DatasetSearchBlock.php       # Drupal block plugin
├── js/
│   └── dataset-search-component.js      # Built component (render function)
├── css/
│   └── dataset-search-widget.css        # Styles
├── vite.config.js                       # Build configuration
├── package.json                         # Build dependencies
└── dkan_client_demo_vue.libraries.yml   # Drupal library definition
```

## Development Workflow

### 1. Install Dependencies

```bash
cd docroot/modules/custom/dkan_client_demo_vue
npm install
```

### 2. Edit Source Component

Edit `src/DatasetSearchWidget.vue` using clean Vue template syntax:

```vue
<template>
  <div class="my-widget">
    <h2>{{ title }}</h2>
    <input v-model="searchTerm" @input="handleSearch" />
    <div v-for="item in results" :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDatasetSearch } from '@dkan-client-tools/vue'

const searchTerm = ref('')
const { data, isLoading } = useDatasetSearch({
  searchOptions: computed(() => ({
    fulltext: searchTerm.value
  }))
})
</script>
```

### 3. Build for Production

```bash
npm run build
```

This compiles `src/DatasetSearchWidget.vue` → `js/dataset-search-component.js`

**What happens:**
- Vite uses `@vitejs/plugin-vue` to compile the template
- Template becomes an optimized render function
- Component externalizes Vue and DKAN Client Tools
- Output is minified IIFE (6-7KB)

### 4. Watch Mode (Optional)

For continuous building during development:

```bash
npm run dev
```

### 5. Clear Drupal Cache

```bash
ddev drush cr
```

## How It Works

### Build Process

The `vite.config.js` configures the build:

```javascript
export default defineConfig({
  plugins: [vue()],  // Compiles .vue SFC to render functions

  build: {
    lib: {
      entry: resolve(__dirname, 'src/DatasetSearchWidget.vue'),
      name: 'DatasetSearchComponent',
      formats: ['iife'],
    },
    rollupOptions: {
      // Externalize dependencies (use from global)
      external: ['@dkan-client-tools/vue', 'vue'],
      output: {
        globals: {
          '@dkan-client-tools/vue': 'DkanClientToolsVue',
          'vue': 'DkanClientToolsVue.Vue',
        },
      },
    },
  },
})
```

### Runtime Loading

1. **DKAN Client Tools Vue** (runtime-only) loads: 174KB
2. **Pre-compiled component** loads: 6.8KB
3. **Mount script** creates app and mounts component
4. **Total bundle**: ~181KB (vs 243KB with full build)

## Bundle Size Comparison

| Approach | DKAN Library | Component | Total | Development Experience |
|----------|-------------|-----------|-------|----------------------|
| **This Module (Optimal)** | 174KB runtime | 6.8KB | **~181KB** | ✅ Clean templates |
| Full Build (template strings) | 240KB full | 3KB | **~243KB** | ⚠️ Template strings in JS |
| Manual h() functions | 174KB runtime | 5KB | **~179KB** | ❌ Verbose, hard to maintain |

## Benefits of This Approach

### 1. Best Developer Experience
- Write clean, readable Vue template syntax
- Use familiar Vue SFC structure
- Full IDE support and syntax highlighting
- Easy to maintain and understand

### 2. Optimal Bundle Size
- Runtime-only Vue build (28% smaller than full)
- No template compiler shipped to browser
- Pre-compiled templates are optimized

### 3. Better Performance
- No runtime template compilation
- Optimized render functions
- Smaller JavaScript bundle to parse

### 4. Type Safety
- Full TypeScript support in `.vue` files
- Type checking with `@dkan-client-tools/vue`
- Auto-completion for composables

## Updating the Widget

1. Edit `src/DatasetSearchWidget.vue`
2. Run `npm run build`
3. Clear Drupal cache: `ddev drush cr`
4. Refresh page

## Comparison: Development vs Production

### Source (Development)
**File**: `src/DatasetSearchWidget.vue` (231 lines)
```vue
<template>
  <div class="dkan-widget-container">
    <header class="dkan-widget-header">
      <h2>DKAN Dataset Search (Vue)</h2>
    </header>
    <div v-if="isLoading">Loading...</div>
    <div v-else>
      <div v-for="dataset in datasets" :key="dataset.identifier">
        {{ dataset.title }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDatasetSearch } from '@dkan-client-tools/vue'
// ... component logic ...
</script>
```

### Built (Production)
**File**: `js/dataset-search-component.js` (6.8KB minified)
```javascript
var DatasetSearchComponent=function(e,t){"use strict";
  // Optimized render function (template is compiled)
  return((e,t)=>{const l=e.__vccOpts||e;
    for(const[n,a]of t)l[n]=a;return l})({
      __name:"DatasetSearchWidget",
      setup(M){/* component logic */},
      render(){/* optimized render function */}
    })
}(DkanClientToolsVue.Vue,DkanClientToolsVue);
```

## Why This Is Better Than Alternatives

### ❌ Alternative 1: Full Vue Build + Template Strings
```javascript
// Requires full Vue build (240KB)
const app = Vue.createApp({
  template: '<div>{{ message }}</div>',  // Compiled at runtime
  setup() { return { message: 'Hello' } }
})
```
**Problems**: Larger bundle, slower performance, templates in JavaScript strings

### ❌ Alternative 2: Hand-Written h() Functions
```javascript
// Works with runtime-only (174KB) but verbose
const app = Vue.createApp({
  setup() { return { message: 'Hello' } },
  render() {
    return Vue.h('div', this.message)  // Manual render function
  }
})
```
**Problems**: Verbose, hard to read, difficult to maintain, no template benefits

### ✅ This Approach: Pre-compiled SFC
```vue
<!-- Write clean templates -->
<template>
  <div>{{ message }}</div>
</template>

<script setup>
const message = 'Hello'
</script>
```
**Build step**: Vite compiles template → optimized render function

**Benefits**: Clean syntax + small bundle + best performance!

## Requirements

- Node.js 20.19+ or 22.12+
- npm 9.0.0+
- Vite 6.0.7+
- @vitejs/plugin-vue 5.2.1+

## Troubleshooting

### Component not updating after build

Make sure to:
1. Run `npm run build` after editing `.vue` file
2. Clear Drupal cache: `ddev drush cr`
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

### Build errors

If you see errors about missing dependencies:
```bash
cd docroot/modules/custom/dkan_client_demo_vue
rm -rf node_modules package-lock.json
npm install
```

### Module not loading

Check browser console for errors. Common issues:
- DKAN Client Tools Vue library not loaded (check dependencies in `.libraries.yml`)
- Built component file missing (run `npm run build`)
- Cache not cleared (run `ddev drush cr`)

## Related Documentation

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [DKAN Client Tools Vue Package](../../../../../packages/dkan-client-tools-vue/README.md)
- [DKAN Client Tools Vue Base Module](../dkan_client_tools_vue_base/js/vendor/README.md)

## License

MIT
