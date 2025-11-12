# DKAN Client Tools - Build Process & Structure Analysis

## Executive Summary

This is a monorepo with 3 core packages, 2 demo standalone apps, 6 Drupal demo/base modules, and symlinks connecting them. The build process has two distinct paths:
1. **NPM Monorepo Build** - Builds packages to `/packages/*/dist` (ESM/CJS/IIFE)
2. **Drupal Module Deployment** - Copies built artifacts to Drupal modules for use in Drupal sites

**Current State**: Manual copying is required; build outputs exist but aren't automatically deployed to Drupal modules.

---

## Part 1: NPM Monorepo Structure

### Workspaces
Root `package.json` defines two workspace groups:
```json
"workspaces": [
  "packages/*",           // 3 core packages
  "examples/*"            // Standalone apps + symlinks
]
```

### Root Build Scripts
```bash
npm run build            # Builds all packages/examples
npm run dev              # Watch mode for all packages
npm run test             # Tests for all packages (300+ tests)
npm run typecheck        # TypeScript checking
npm run clean            # Clean all dist directories
```

---

## Part 2: Core Packages

### Package Structure Overview

All 3 packages use **tsup** for multi-format builds:
- **ESM/CJS** - For bundlers and npm usage
- **IIFE** - For browsers and Drupal (unminified)
- **IIFE (minified)** - Production use in Drupal

#### 1. @dkan-client-tools/core (`/packages/dkan-client-tools-core`)

**Build Output (to `/dist`):**
```
index.js              (35KB ESM)
index.cjs             (35KB CommonJS)
index.d.ts            (37KB TypeScript definitions)
index.global.js       (103KB IIFE - unminified)
index.global.min.js   (40KB IIFE - minified) ← USED IN DRUPAL
```

**tsup Config** (`tsup.config.ts`):
- 3 build configurations
- Config 1: ESM + CJS (bundlers)
- Config 2: IIFE unminified (dev)
- Config 3: IIFE minified (production)
- Global name: `DkanClientTools`
- Externals: `@tanstack/query-core` (for bundler builds)
- Minified version: **40KB**

**Drupal Integration:**
- Used by: `dkan_client_tools_core_base` module
- File deployed: `dkan-client-tools-core.min.js` (40KB)
- Global: `window.DkanClientTools`

---

#### 2. @dkan-client-tools/react (`/packages/dkan-client-tools-react`)

**Build Output (to `/dist`):**
```
index.js              (1.1MB ESM)
index.cjs             (1.1MB CommonJS)
index.d.ts            (308KB TypeScript definitions)
index.global.js       (409KB IIFE - unminified)
index.global.min.js   (205KB IIFE - minified) ← USED IN DRUPAL
```

**tsup Config** (`tsup.config.ts`):
- 3 build configurations
- Config 1: ESM + CJS (bundlers, externalize React/Query)
- Config 2: IIFE unminified (all bundled)
- Config 3: IIFE minified (all bundled)
- Global name: `DkanClientToolsReact`
- Externals (for bundler builds): `react`, `@dkan-client-tools/core`, `@tanstack/react-query`
- **Self-contained bundle**: Includes React 18.3.1 + ReactDOM + React Query
- Minified version: **205KB**

**Drupal Integration:**
- Used by: `dkan_client_tools_react_base` module
- File deployed: `dkan-client-tools-react.min.js` (205KB)
- Global: `window.DkanClientToolsReact`
- Contains: React, ReactDOM, React Query, all 40+ hooks

---

#### 3. @dkan-client-tools/vue (`/packages/dkan-client-tools-vue`)

**Build Output (to `/dist`):**
```
index.js                              (21KB ESM)
index.cjs                             (25KB CommonJS)
index.d.ts                            (333KB TypeScript definitions)
index.global.full.js                  (648KB IIFE - full w/ compiler, unminified)
index.global.full.min.js              (240KB IIFE - full w/ compiler, minified) ← USED IN DRUPAL
index.global.runtime.js               (485KB IIFE - runtime only, unminified)
index-runtime.global.runtime.min.js   (174KB IIFE - runtime only, minified)
```

**tsup Config** (`tsup.config.ts`):
- 5 build configurations
- Config 1: ESM + CJS (bundlers)
- Config 2: IIFE Full (WITH Vue compiler, unminified)
- Config 3: IIFE Full (WITH Vue compiler, minified)
- Config 4: IIFE Runtime (WITHOUT compiler, unminified)
- Config 5: IIFE Runtime (WITHOUT compiler, minified)
- Global name: `DkanClientToolsVue`
- **Self-contained bundle**: Includes Vue 3 + TanStack Vue Query

**Drupal Integration:**
- Used by: `dkan_client_tools_vue_base` module
- Files deployed:
  - `dkan-client-tools-vue.min.js` (240KB - Full with compiler)
  - `dkan-client-tools-vue-runtime.min.js` (174KB - Runtime only)
  - `dkan-client-tools-vue-full.min.js` (240KB - Full, alternative name)
- Global: `window.DkanClientToolsVue`

**Vue Build Strategy:**
- Full build (240KB): Use for runtime template strings in HTML
- Runtime build (174KB): Use when templates are pre-compiled to render functions

---

## Part 3: Drupal Module Structure

### Location
All modules in: `/dkan/docroot/modules/custom/`

### Module Categories

#### A. Base Modules (3 total) - Provide shared libraries
```
dkan_client_tools_core_base/
├── dkan_client_tools_core_base.info.yml
├── dkan_client_tools_core_base.libraries.yml
└── js/vendor/
    ├── dkan-client-tools-core.min.js        (40KB)
    └── README.md

dkan_client_tools_react_base/
├── dkan_client_tools_react_base.info.yml
├── dkan_client_tools_react_base.libraries.yml
└── js/vendor/
    ├── dkan-client-tools-react.min.js       (205KB)
    ├── LICENSE-react.txt
    └── README.md

dkan_client_tools_vue_base/
├── dkan_client_tools_vue_base.info.yml
├── dkan_client_tools_vue_base.libraries.yml
└── js/vendor/
    ├── dkan-client-tools-vue.min.js         (240KB - Full with compiler)
    ├── dkan-client-tools-vue-runtime.min.js (174KB - Runtime only)
    ├── dkan-client-tools-vue-full.min.js    (240KB - Full, alternative)
    └── README.md
```

#### B. Demo Modules (3 total) - Show how to use libraries

**1. dkan_client_demo_vanilla** - Uses core library directly
```
dkan_client_demo_vanilla/
├── dkan_client_demo_vanilla.info.yml
├── dkan_client_demo_vanilla.libraries.yml
├── src/Plugin/Block/
│   └── DatasetSearchBlock.php
├── js/
│   └── dataset-search-widget.js           (Plain JavaScript)
├── css/
│   └── dataset-search-widget.css
└── README.md
```

**Build**: No build process. Uses prebuilt core library.
**Depends on**: `dkan_client_tools_core_base`

---

**2. dkan_client_demo_react** - Vite build for React widget
```
dkan_client_demo_react/
├── package.json                     ← HAS BUILD CONFIG
├── vite.config.js
├── dkan_client_demo_react.info.yml
├── dkan_client_demo_react.libraries.yml
├── src/
│   ├── jsx/
│   │   └── dataset-search-widget.jsx
│   └── Plugin/Block/
│       └── DatasetSearchBlock.php
├── js/
│   ├── dataset-search-widget.min.js (Generated)
│   └── dataset-search-widget.min.js.map
├── css/
│   └── dataset-search-widget.css
└── README.md
```

**Build Process**:
```bash
cd dkan/docroot/modules/custom/dkan_client_demo_react
npm install
npm run build           # Runs: vite build
```

**Vite Build Strategy** (`vite.config.js`):
- Entry: `src/jsx/dataset-search-widget.jsx`
- Format: IIFE
- Output: `js/dataset-search-widget.min.js`
- Externals: `@dkan-client-tools/react`, `@dkan-client-tools/core`
- Globals mapping:
  - `@dkan-client-tools/react` → `DkanClientToolsReact`
  - `@dkan-client-tools/core` → `DkanClientTools`
- Minifier: terser
- Sourcemap: enabled

**Package.json Dependencies**:
```json
{
  "dependencies": {
    "@dkan-client-tools/react": "file:../../../../../packages/dkan-client-tools-react",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.0",
    "terser": "^5.44.1",
    "vite": "^7.2.2"
  }
}
```

**Output Size**: ~486KB minified

**Depends on**: 
- `dkan_client_tools_react_base` (for DkanClientToolsReact library)
- `dkan_client_tools_core_base` (transitively)

---

**3. dkan_client_demo_vue** - Vite build for Vue widget
```
dkan_client_demo_vue/
├── package.json                     ← HAS BUILD CONFIG
├── vite.config.js
├── dkan_client_demo_vue.info.yml
├── dkan_client_demo_vue.libraries.yml
├── src/
│   ├── DatasetSearchWidget.vue
│   └── Plugin/Block/
│       └── DatasetSearchBlock.php
├── js/
│   ├── dataset-search-component.js  (Generated)
│   └── dataset-search-widget.min.js (Generated)
├── css/
│   └── dataset-search-widget.css
└── README.md
```

**Build Process**:
```bash
cd dkan/docroot/modules/custom/dkan_client_demo_vue
npm install
npm run build           # Runs: vite build
```

**Vite Build Strategy** (`vite.config.js`):
- Uses Vue SFC (Single File Component) with Vite Vue plugin
- Pre-compiles Vue templates to render functions
- Uses runtime-only Vue build (not full with compiler)
- Output: `js/dataset-search-component.js`

**Package.json Dependencies**:
```json
{
  "devDependencies": {
    "@dkan-client-tools/vue": "file:../../../../../packages/dkan-client-tools-vue",
    "@vitejs/plugin-vue": "^6.0.1",
    "terser": "^5.44.1",
    "vite": "^7.2.2",
    "vue": "^3.4.0"
  }
}
```

**Output Size**: ~250KB minified

**Depends on**: 
- `dkan_client_tools_vue_base` (for DkanClientToolsVue library)
- `dkan_client_tools_core_base` (transitively)

---

## Part 4: Examples Directory Structure

### `/examples` Directory
```
examples/
├── drupal-base-modules/             ← Symlinks to Drupal modules
│   ├── core → ../../dkan/docroot/modules/custom/dkan_client_tools_core_base
│   ├── react → ../../dkan/docroot/modules/custom/dkan_client_tools_react_base
│   └── vue → ../../dkan/docroot/modules/custom/dkan_client_tools_vue_base
├── drupal-demo-module-react → ../dkan/docroot/modules/custom/dkan_client_demo_react
├── drupal-demo-module-vanilla → ../dkan/docroot/modules/custom/dkan_client_demo_vanilla
├── drupal-demo-module-vue → ../dkan/docroot/modules/custom/dkan_client_demo_vue
├── react-demo-app/                  ← Standalone Vite + React app
├── vue-demo-app/                    ← Standalone Vite + Vue app
└── vanilla-demo-app/                ← Standalone HTML/JS app
```

**Purpose**: 
- Symlinks provide easy access to demo modules from examples directory
- Standalone demo apps show how to use packages independently

---

## Part 5: Current Build Process (Manual)

### Current Workflow

**Step 1: Build Core Package**
```bash
cd /packages/dkan-client-tools-core
npm run build
# Output: dist/index.global.min.js (40KB)
```

**Step 2: Manually Copy to Drupal** (Currently manual)
```bash
cp dist/index.global.min.js \
   ../../dkan/docroot/modules/custom/dkan_client_tools_core_base/js/vendor/
```

**Step 3: Build React Package**
```bash
cd /packages/dkan-client-tools-react
npm run build
# Output: dist/index.global.min.js (205KB)
```

**Step 4: Manually Copy to Drupal** (Currently manual)
```bash
cp dist/index.global.min.js \
   ../../dkan/docroot/modules/custom/dkan_client_tools_react_base/js/vendor/
```

**Step 5: Build Vue Package**
```bash
cd /packages/dkan-client-tools-vue
npm run build
# Output: dist/index.global.*.min.js
```

**Step 6: Manually Copy to Drupal** (Currently manual)
```bash
cp dist/index.global.full.min.js \
   ../../dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue.min.js
cp dist/index-runtime.global.runtime.min.js \
   ../../dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue-runtime.min.js
```

**Step 7: Build Demo Modules** (Those with package.json)
```bash
cd dkan/docroot/modules/custom/dkan_client_demo_react
npm install
npm run build

cd ../dkan_client_demo_vue
npm install
npm run build
```

**Step 8: Clear Drupal Cache**
```bash
cd dkan
ddev drush cr
```

---

## Part 6: Build Output Summary

### Package Build Outputs

| Package | Format | Size | File | Location |
|---------|--------|------|------|----------|
| **Core** | IIFE (min) | 40KB | index.global.min.js | `/packages/dkan-client-tools-core/dist/` |
| **Core** | ESM | 35KB | index.js | `/packages/dkan-client-tools-core/dist/` |
| **Core** | CJS | 35KB | index.cjs | `/packages/dkan-client-tools-core/dist/` |
| **React** | IIFE (min) | 205KB | index.global.min.js | `/packages/dkan-client-tools-react/dist/` |
| **React** | ESM | 1.1MB | index.js | `/packages/dkan-client-tools-react/dist/` |
| **React** | CJS | 1.1MB | index.cjs | `/packages/dkan-client-tools-react/dist/` |
| **Vue** | IIFE (min, full) | 240KB | index.global.full.min.js | `/packages/dkan-client-tools-vue/dist/` |
| **Vue** | IIFE (min, runtime) | 174KB | index-runtime.global.runtime.min.js | `/packages/dkan-client-tools-vue/dist/` |
| **Vue** | ESM | 21KB | index.js | `/packages/dkan-client-tools-vue/dist/` |
| **Vue** | CJS | 25KB | index.cjs | `/packages/dkan-client-tools-vue/dist/` |

### Drupal Module Deployments

| Module | File | Size | Source | Status |
|--------|------|------|--------|--------|
| dkan_client_tools_core_base | dkan-client-tools-core.min.js | 40KB | `packages/dkan-client-tools-core/dist/index.global.min.js` | DEPLOYED |
| dkan_client_tools_react_base | dkan-client-tools-react.min.js | 205KB | `packages/dkan-client-tools-react/dist/index.global.min.js` | DEPLOYED |
| dkan_client_tools_vue_base | dkan-client-tools-vue.min.js | 240KB | `packages/dkan-client-tools-vue/dist/index.global.full.min.js` | DEPLOYED |
| dkan_client_tools_vue_base | dkan-client-tools-vue-runtime.min.js | 174KB | `packages/dkan-client-tools-vue/dist/index-runtime.global.runtime.min.js` | DEPLOYED |
| dkan_client_demo_vanilla | (no build) | - | Plain JS | N/A |
| dkan_client_demo_react | dataset-search-widget.min.js | ~486KB | Vite build | DEPLOYED |
| dkan_client_demo_vue | dataset-search-component.js | ~250KB | Vite build | DEPLOYED |

---

## Part 7: Pain Points in Current Process

1. **Manual Copying**: No automation for deploying built packages to Drupal modules
2. **Multiple Build Tools**: Mix of tsup and Vite creates complexity
3. **No Unified Scripts**: Each module has its own build commands, no root orchestration
4. **Version Synchronization**: Manual version management between packages and modules
5. **Dependency Tracking**: Hard to track which module depends on which package
6. **Development Workflow**: Need to rebuild packages then rebuild modules then restart Drupal
7. **Build Cleanup**: `npm run clean` at root doesn't know about Drupal module deployments
8. **Vue Complexity**: 4 different Vue IIFE builds, unclear which ones are used where

---

## Part 8: Key Insights for Improvement

### Current Format Strategy
- **Core**: IIFE (40KB) for vanilla JS use in Drupal
- **React**: Self-contained IIFE (205KB) with React + ReactDOM bundled
- **Vue**: Multiple IIFEs - Full (240KB) or Runtime (174KB)

### Why IIFE Format?
- Required for Drupal module integration (no bundler)
- Makes libraries available as global window objects
- Allows external widgets to reference the same library (no duplication)

### Opportunity Areas
1. **Automated copying** from `/packages/*/dist` to `/dkan/docroot/modules/custom/*/js/vendor/`
2. **Unified build command** that builds packages AND copies to modules
3. **Dependency graph** to track which modules need which packages
4. **Version management** - sync package versions with module library versions
5. **Watch mode** that rebuilds packages and re-copies on changes
6. **Documentation** of build process and file mappings
7. **CI/CD integration** for automated builds and deployments
8. **Demo module build setup** - consider extracting common Vite config

---

## Files Modified/Created During Manual Build

### What gets created/modified:
```
Packages:
├── dist/index.global.min.js             (created by tsup)
├── dist/index.global.min.js.map         (created by tsup)
├── dist/index.js                        (created by tsup)
├── dist/index.cjs                       (created by tsup)
└── dist/index.d.ts                      (created by tsup)

Drupal Modules:
├── dkan_client_tools_*_base/js/vendor/  (files COPIED manually)
└── dkan_client_demo_*/js/                (files created by Vite)

Drupal Module Dev:
├── node_modules/                        (from npm install)
├── package-lock.json                    (from npm install)
└── js/                                  (Vite output)
```

---

## Conclusion

The current build process works but requires manual steps. The architecture is sound:
- Core packages build to ESM/CJS (npm) and IIFE (browser/Drupal)
- Drupal base modules provide shared libraries
- Demo modules show integration patterns
- Clear separation of concerns (framework-agnostic core + framework adapters)

**Opportunity**: Automate the manual copying and create a unified build orchestration script that handles the entire workflow from source to deployed Drupal modules.
