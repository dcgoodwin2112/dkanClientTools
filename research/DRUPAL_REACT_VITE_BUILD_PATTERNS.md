# Drupal Module Development with React and Vite: Build Patterns and Best Practices

**Research Date**: November 10, 2025
**Focus**: External React/ReactDOM dependency management for Drupal modules

---

## Executive Summary

This document provides comprehensive research on building Drupal modules with React and Vite, specifically addressing how to handle external dependencies like React and ReactDOM. Based on 2024-2025 best practices, the recommended approach uses **IIFE format with externalized React dependencies** mapped to window globals, allowing Drupal to manage React as a shared library across multiple modules.

### Key Recommendations

1. **Build Format**: Use IIFE (Immediately-Invoked Function Expression) for browser compatibility
2. **Externalization**: Mark React, ReactDOM, and other framework dependencies as external
3. **Global Mapping**: Map external imports to window globals (e.g., `React`, `ReactDOM`)
4. **Library System**: Leverage Drupal's core React libraries or define custom ones
5. **Modern Alternative**: Consider Drupal 11's import maps for ESM-based approach

---

## Table of Contents

1. [Drupal JavaScript Library System](#1-drupal-javascript-library-system)
2. [React in Drupal: Common Patterns](#2-react-in-drupal-common-patterns)
3. [Module Format Comparison](#3-module-format-comparison)
4. [Vite Configuration for Drupal](#4-vite-configuration-for-drupal)
5. [External Dependencies Pattern](#5-external-dependencies-pattern)
6. [Build Output Configuration](#6-build-output-configuration)
7. [Alternative Modern Approaches](#7-alternative-modern-approaches)
8. [Real-World Examples](#8-real-world-examples)
9. [Recommended Approach for DKAN](#9-recommended-approach-for-dkan)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Drupal JavaScript Library System

### 1.1 How Drupal Loads JavaScript

Drupal 8+ uses an **asset library system** defined in `*.libraries.yml` files. Key principles:

- **No automatic loading**: Assets only load when explicitly attached
- **Dependency management**: Libraries declare dependencies on other libraries
- **Aggregation support**: Drupal can combine/minify assets in production
- **Version management**: Each library has a version for cache busting

### 1.2 Library Definition Structure

```yaml
# mymodule.libraries.yml
library_name:
  version: 1.0
  js:
    path/to/file.js: { minified: true, preprocess: false }
  css:
    theme:
      path/to/styles.css: {}
  dependencies:
    - core/drupal
    - core/jquery
```

### 1.3 Library Dependency Rules

- **Format**: `extension_name/library_name` (e.g., `core/react`, `mymodule/utils`)
- **Cannot reference files**: Only complete libraries can be dependencies
- **Transitive dependencies**: Libraries can depend on other libraries
- **No CDN links in production**: While technically possible with `type: external`, it's discouraged

### 1.4 External Libraries

```yaml
# Loading from CDN (not recommended for production)
react-cdn:
  js:
    https://unpkg.com/react@18/umd/react.production.min.js:
      type: external
      minified: true
```

**Why external CDNs are discouraged:**
- Cannot guarantee availability (404 errors)
- Performance issues (additional TCP connections)
- Security concerns
- Rarely in browser cache anyway
- Violates Drupal's offline-first principles

### 1.5 Best Practices

1. **Use Composer/npm for dependencies**: Manage JavaScript libraries like PHP dependencies
2. **Commit built files**: Include transpiled/bundled files in your module
3. **Declare all dependencies**: Explicitly list all library dependencies
4. **Use Drupal's core libraries**: Leverage `core/react`, `core/react-dom` when available
5. **Test with aggregation**: Ensure code works with CSS/JS aggregation enabled

---

## 2. React in Drupal: Common Patterns

### 2.1 Drupal Core React Support

**Drupal 10/11 includes React in core:**

```yaml
# Use Drupal's built-in React
dependencies:
  - core/react          # React library
  - core/react-dom      # ReactDOM library
```

These libraries provide:
- React 18.x (Drupal 10.3+)
- ReactDOM 18.x
- UMD format exposed as `window.React` and `window.ReactDOM`

### 2.2 Integration Patterns

#### Pattern A: Bundled React (Not Recommended)

Bundle React directly into your module's JavaScript:

**Pros:**
- Self-contained module
- Version control

**Cons:**
- Large bundle size (React + ReactDOM = ~140KB minified)
- Multiple React instances if multiple modules use React
- Version conflicts
- Inefficient resource usage

#### Pattern B: External React via Drupal Core (Recommended)

Use Drupal's core React libraries and mark React as external in your build:

**Pros:**
- Single React instance shared across modules
- Smaller bundle sizes
- Consistent React version
- Better performance
- Follows Drupal best practices

**Cons:**
- Tied to Drupal's React version
- Requires build configuration

#### Pattern C: Import Maps (Modern - Drupal 11.1+)

Use Drupal's import maps for ESM modules:

**Pros:**
- Native browser module loading
- Smaller bundles
- Modern standard
- Better tree-shaking

**Cons:**
- Drupal 11.1+ only
- Newer standard with less documentation
- Browser compatibility (modern browsers only)

### 2.3 React Module Ecosystem

**Community Modules:**

1. **react** (drupal.org/project/react)
   - Provides React via Libraries API
   - For developers (no UI)
   - Requires Libraries API 2.0+

2. **react_block** (drupal.org/project/react_block)
   - Create React-based blocks
   - UI for content editors

3. **pdb_react** (drupal.org/project/pdb_react)
   - Decoupled Blocks with React
   - Drupal 9/10/11 compatible

4. **webpack_react** (drupal.org/project/webpack_react)
   - Webpack integration helper

### 2.4 Recommended Module Architecture

```
modules/custom/mymodule/
├── mymodule.info.yml
├── mymodule.libraries.yml
├── mymodule.module
├── js/
│   ├── src/                    # Source files (React/JSX)
│   │   ├── components/
│   │   └── index.jsx
│   ├── dist/                   # Built files (committed)
│   │   ├── app.js
│   │   └── app.js.map
│   ├── package.json
│   ├── vite.config.js
│   └── tsconfig.json
└── templates/
    └── mymodule-react-widget.html.twig
```

---

## 3. Module Format Comparison

### 3.1 Format Overview

| Format | Full Name | Use Case | Browser Support |
|--------|-----------|----------|-----------------|
| **ESM** | ECMAScript Modules | Modern bundlers, native imports | Modern browsers (Chrome 61+, Firefox 60+, Safari 11+) |
| **UMD** | Universal Module Definition | Cross-environment (Node, AMD, browser) | All browsers |
| **IIFE** | Immediately-Invoked Function Expression | Browser globals, standalone scripts | All browsers |
| **CJS** | CommonJS | Node.js, server-side | Node.js only |

### 3.2 ESM (ECMAScript Modules)

**Syntax:**
```javascript
import React from 'react'
import { useState } from 'react'
export default MyComponent
```

**Characteristics:**
- Native browser support (modern browsers)
- Async loading by default
- Tree-shakeable
- Static analysis
- Future-proof standard

**When to use with Drupal:**
- With Drupal 11.1+ import maps
- Modern browser-only applications
- Build tools that support ESM

**Drupal Integration:**
```yaml
# Using import maps (Drupal 11.1+)
mymodule.importmap.yml:
  imports:
    react: /libraries/react/react.js
    react-dom: /libraries/react-dom/react-dom.js
```

### 3.3 UMD (Universal Module Definition)

**Characteristics:**
- Works everywhere (browser, Node, AMD)
- Checks environment and adapts
- Larger file size due to compatibility code
- Exports to global if no module system

**Pattern:**
```javascript
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['react'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('react'));
  } else {
    // Browser globals
    root.MyModule = factory(root.React);
  }
}(typeof self !== 'undefined' ? self : this, function (React) {
  // Module code
  return MyModule;
}));
```

**When to use with Drupal:**
- Legacy compatibility needed
- Mixed environments
- **Status in 2024-2025**: Declining usage, ESM preferred

**Industry Opinion:**
> "I think it's fine to skip UMD. All bundlers can consume ESM, and with sites like esm.sh that can be easily used in the browser." - Marvin Hagemeister

### 3.4 IIFE (Immediately-Invoked Function Expression)

**Syntax:**
```javascript
var MyModule = (function (React, ReactDOM) {
  'use strict';

  // Module code
  function MyComponent() {
    return React.createElement('div', null, 'Hello');
  }

  return { MyComponent };
})(window.React, window.ReactDOM);
```

**Characteristics:**
- Executes immediately on load
- Creates isolated scope
- Exports to global variable
- No module system required
- Excellent browser compatibility

**When to use with Drupal:**
- **Recommended for Drupal 8-10**
- Legacy browser support needed
- Simple script tag loading
- External dependencies as globals

### 3.5 Format Recommendation Matrix

| Scenario | Recommended Format | Reasoning |
|----------|-------------------|-----------|
| Drupal 8-10 modules | **IIFE** | Best compatibility, works with Drupal's library system |
| Drupal 11.1+ modules | **ESM** (via import maps) | Modern standard, smaller bundles |
| npm packages | **ESM + CJS** | Broad compatibility for consumers |
| Legacy browser support | **IIFE or UMD** | Universal compatibility |
| Modern SPA with build tools | **ESM** | Tree-shaking, smaller bundles |
| Standalone widgets | **IIFE** | No dependencies, simple loading |

### 3.6 Format Trends (2024-2025)

**Growing:**
- ESM adoption increasing rapidly
- Import maps gaining traction
- Native browser support improving

**Declining:**
- UMD usage decreasing
- AMD essentially deprecated
- CJS usage declining in browser contexts

**Stable:**
- IIFE remains relevant for Drupal and legacy support
- Still recommended for browser-only libraries

---

## 4. Vite Configuration for Drupal

### 4.1 Basic Library Mode Setup

Vite's **library mode** is designed for building libraries, not applications:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/index.js',
      name: 'MyModule',        // Required for IIFE
      formats: ['iife'],       // Output format
      fileName: 'my-module',   // Output filename
    },
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### 4.2 Externalizing Dependencies

Mark React and other framework dependencies as external:

```javascript
export default defineConfig({
  build: {
    lib: {
      entry: './src/index.js',
      name: 'MyModule',
      formats: ['iife'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@tanstack/react-query'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          '@tanstack/react-query': 'ReactQuery',
        },
      },
    },
  },
})
```

**What this does:**
- Vite won't bundle React into your output
- Import statements remain in code
- At runtime, expects `window.React`, `window.ReactDOM`, etc.

### 4.3 Multiple Output Formats

Build both development and production versions:

```javascript
export default defineConfig({
  build: {
    lib: {
      entry: './src/index.js',
      name: 'MyModule',
      formats: ['iife'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: [
        {
          format: 'iife',
          name: 'MyModule',
          entryFileNames: 'my-module.js',
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM',
          },
        },
        {
          format: 'iife',
          name: 'MyModule',
          entryFileNames: 'my-module.min.js',
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM',
          },
          plugins: [terser()], // Minification
        },
      ],
    },
  },
})
```

### 4.4 TypeScript Configuration

For TypeScript projects:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyModule',
      formats: ['iife'],
      fileName: 'my-module',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
```

### 4.5 Advanced Configuration

**Environment-specific builds:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/index.js',
      name: 'MyModule',
      formats: ['iife'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode === 'development' ? 'inline' : true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}))
```

### 4.6 Drupal-Specific Considerations

**Base path configuration** (for subdirectory hosting):

```javascript
export default defineConfig({
  base: '/modules/custom/mymodule/js/dist/',
  // ... other config
})
```

**Asset handling:**

```javascript
export default defineConfig({
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
```

---

## 5. External Dependencies Pattern

### 5.1 The Problem

When building a React module for Drupal, you have two options:

**Option A: Bundle React** (❌ Not Recommended)
- Large bundle: ~140KB+ (React + ReactDOM minified)
- Multiple React instances if other modules use React
- Version conflicts
- Memory waste

**Option B: External React** (✅ Recommended)
- Small bundle: Only your code
- Single shared React instance
- Drupal manages React version
- Better performance

### 5.2 How External Dependencies Work

**Build Time:**
```javascript
// Your source code
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent() {
  return <div>Hello</div>
}
```

**After build with externals:**
```javascript
var MyModule = (function (React, ReactDOM) {
  // Your code here, but React comes from parameters
  function MyComponent() {
    return React.createElement('div', null, 'Hello');
  }
  return { MyComponent };
})(window.React, window.ReactDOM);
```

**Runtime:**
- Drupal loads React first: `<script src="react.js"></script>` → `window.React`
- Drupal loads your module: `<script src="my-module.js"></script>` → Uses `window.React`

### 5.3 Vite/Rollup Configuration

**Method 1: Basic External Configuration**

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        format: 'iife',
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
```

**Method 2: Using vite-plugin-external**

```javascript
import { defineConfig } from 'vite'
import pluginExternal from 'vite-plugin-external'

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@tanstack/react-query': 'ReactQuery',
      },
    }),
  ],
})
```

**Method 3: Programmatic External Resolution**

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      external: (id) => {
        // Externalize React and all its submodules
        return id === 'react' || id.startsWith('react/')
      },
      output: {
        globals: (id) => {
          if (id === 'react') return 'React'
          if (id === 'react-dom') return 'ReactDOM'
          // Handle React submodules
          if (id.startsWith('react/')) return 'React'
        },
      },
    },
  },
})
```

### 5.4 Handling Complex Dependencies

**Scoped packages:**

```javascript
external: ['@tanstack/react-query', '@tanstack/query-core'],
globals: {
  '@tanstack/react-query': 'ReactQuery',
  '@tanstack/query-core': 'QueryCore',
}
```

**React submodules:**

```javascript
// Be careful with React submodules like react/jsx-runtime
external: (id) => {
  return ['react', 'react-dom'].includes(id) ||
         id.startsWith('react/') ||
         id.startsWith('react-dom/')
},
globals: {
  'react': 'React',
  'react-dom': 'ReactDOM',
  'react/jsx-runtime': 'React',  // JSX runtime maps to React
}
```

### 5.5 Common Issues and Solutions

**Issue 1: React bundled despite external config**

**Cause:** React imported before external config applied

**Solution:**
```javascript
// Make sure external is in build.rollupOptions, not plugins
build: {
  rollupOptions: {
    external: ['react'],
    // ...
  }
}
```

**Issue 2: Runtime error "React is not defined"**

**Cause:** React not loaded before your module

**Solution in Drupal:**
```yaml
# Declare React as dependency
my-module:
  js:
    js/dist/my-module.js: {}
  dependencies:
    - core/react
    - core/react-dom
```

**Issue 3: React submodule errors (react/jsx-runtime)**

**Cause:** JSX transform uses react/jsx-runtime, not externalized

**Solution:**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic', // Use classic React.createElement
    }),
  ],
  // OR externalize jsx-runtime
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        'react/jsx-runtime': 'React',
      },
    },
  },
})
```

**Issue 4: Multiple React versions in bundle**

**Cause:** Some dependency bundling its own React

**Solution:**
```javascript
// Check bundle with
npm run build && ls -lh dist/

// If too large, analyze with rollup-plugin-visualizer
import visualizer from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }),
  ],
})
```

### 5.6 Testing External Dependencies

**Verify externals in build output:**

```bash
# Build
npm run build

# Check bundle size (should be small without React)
ls -lh dist/

# Check for React in bundle (should return nothing)
grep -r "useState" dist/my-module.js
# If found, React is bundled (bad)
# If not found, React is external (good)
```

**Test in browser:**

```html
<!-- Load React first -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Load your module -->
<script src="dist/my-module.js"></script>

<script>
  // Should work
  console.log(window.MyModule);
  console.log(window.React);
</script>
```

---

## 6. Build Output Configuration

### 6.1 Target Format: IIFE for Drupal

**Recommended output configuration:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/index.js',
      name: 'MyModule',           // Global variable name
      formats: ['iife'],
      fileName: 'my-module',      // Output: my-module.iife.js
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,                 // Control separately
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        format: 'iife',
        name: 'MyModule',
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
```

### 6.2 Source Maps

**Development build:**
```javascript
build: {
  sourcemap: true,        // External source map (my-module.js.map)
}
```

**Production build:**
```javascript
build: {
  sourcemap: 'hidden',    // Generate but don't reference in output
}
```

**No source maps:**
```javascript
build: {
  sourcemap: false,
}
```

**Drupal library with source map:**
```yaml
my-module:
  js:
    js/dist/my-module.js: { minified: false, preprocess: false }
  # Source map automatically loaded if exists
```

### 6.3 Minification Strategies

**Strategy 1: Separate Dev/Prod Builds**

```javascript
// package.json
{
  "scripts": {
    "build:dev": "vite build --mode development",
    "build:prod": "vite build --mode production"
  }
}

// vite.config.js
export default defineConfig(({ mode }) => ({
  build: {
    minify: mode === 'production',
    sourcemap: mode === 'development',
  },
}))
```

**Strategy 2: Multiple Outputs**

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: [
        {
          format: 'iife',
          name: 'MyModule',
          entryFileNames: 'my-module.js',
        },
        {
          format: 'iife',
          name: 'MyModule',
          entryFileNames: 'my-module.min.js',
          plugins: [terser()],
        },
      ],
    },
  },
})
```

**Drupal libraries for both:**
```yaml
my-module-dev:
  js:
    js/dist/my-module.js: { minified: false }
  dependencies:
    - core/react

my-module:
  js:
    js/dist/my-module.min.js: { minified: true }
  dependencies:
    - core/react
```

### 6.4 Code Splitting Considerations

**Single bundle (recommended for Drupal):**

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,  // Disable code splitting
      },
    },
  },
})
```

**Why single bundle for Drupal:**
- Simpler library definition (one file)
- Drupal's library system handles loading order
- Avoid CORS issues with dynamic imports
- Better for Drupal's aggregation

### 6.5 Asset Handling

**CSS extraction:**

```javascript
export default defineConfig({
  build: {
    cssCodeSplit: false,  // Single CSS file
  },
})
```

**Drupal library with CSS:**
```yaml
my-module:
  js:
    js/dist/my-module.js: {}
  css:
    theme:
      js/dist/style.css: {}
  dependencies:
    - core/react
```

### 6.6 Banner and Footer

Add useful comments to built files:

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        banner: '/*! MyModule v1.0.0 | MIT License | Requires React 18+ */',
        footer: '/* Built with Vite */',
      },
    },
  },
})
```

### 6.7 Target Environment

```javascript
export default defineConfig({
  build: {
    target: 'es2015',     // Broad browser support
    // OR
    target: 'es2020',     // Modern browsers only
    // OR
    target: ['chrome80', 'firefox72', 'safari13'],
  },
})
```

**Drupal compatibility:**
- **Drupal 10**: ES2015+ (supports IE11 with polyfills)
- **Drupal 11**: ES2020+ (modern browsers only)

### 6.8 Optimization

```javascript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Remove console.logs
        drop_debugger: true,
      },
    },
  },
})
```

### 6.9 Complete Production Configuration

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.jsx'),
      name: 'MyModule',
      formats: ['iife'],
      fileName: 'my-module',
    },
    outDir: 'dist',
    sourcemap: 'hidden',
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        format: 'iife',
        name: 'MyModule',
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
        banner: '/*! MyModule v1.0.0 | MIT License */',
        manualChunks: undefined,
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
```

---

## 7. Alternative Modern Approaches

### 7.1 Import Maps (Drupal 11.1+)

**Overview:**

Import maps are a browser standard for mapping bare module specifiers to URLs:

```html
<script type="importmap">
{
  "imports": {
    "react": "/libraries/react/react.js",
    "react-dom": "/libraries/react-dom/react-dom.js"
  }
}
</script>

<script type="module">
  import React from 'react';  // Browser resolves to /libraries/react/react.js
</script>
```

**Drupal Integration:**

Drupal 11.1.0+ has native import map support:

```yaml
# mymodule.importmap.yml
imports:
  react: /libraries/react/esm/react.js
  react-dom: /libraries/react-dom/esm/react-dom.js
  mymodule: /modules/custom/mymodule/js/dist/mymodule.js
```

**Module code (ESM):**

```javascript
// src/index.js
import React from 'react'
import ReactDOM from 'react-dom'

export function renderWidget(container) {
  ReactDOM.render(
    React.createElement('div', null, 'Hello'),
    container
  )
}
```

**Vite config for ESM:**

```javascript
export default defineConfig({
  build: {
    lib: {
      entry: './src/index.js',
      formats: ['es'],          // ESM format
      fileName: 'mymodule',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],  // Don't bundle
    },
  },
})
```

**Advantages:**
- Native browser feature (no bundler needed)
- Smaller file sizes
- Better tree-shaking
- Standard approach
- Async by default

**Disadvantages:**
- Drupal 11.1+ only
- Modern browsers only (Chrome 89+, Firefox 108+, Safari 16.4+)
- Less documentation/examples
- Migration effort from existing code

**When to use:**
- **Drupal 11.1+ projects**
- Modern browser requirements acceptable
- Future-proof architecture desired

### 7.2 SystemJS Loader

**Overview:**

SystemJS is a module loader that can load AMD, CJS, UMD, and ES modules:

```html
<script src="systemjs/dist/system.js"></script>
<script>
  System.import('/modules/custom/mymodule/js/dist/mymodule.js');
</script>
```

**Use with Drupal:**

```javascript
// vite.config.js
export default defineConfig({
  build: {
    lib: {
      entry: './src/index.js',
      formats: ['system'],
    },
  },
})
```

**Status in 2024-2025:**
- Less popular than import maps
- Adds ~10KB loader overhead
- Useful for legacy browser support with modules

**When to use:**
- Need module features with older browser support
- Working with multiple module formats
- **Generally not recommended** - use IIFE or import maps instead

### 7.3 Microfrontends with Module Federation

**Overview:**

Webpack Module Federation allows sharing dependencies between separately-built applications:

```javascript
// webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'mymodule',
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
}
```

**Use cases:**
- Multiple React apps on same page
- Shared React instance
- Dynamic code loading

**Challenges with Drupal:**
- Complex setup
- Requires Webpack 5+
- Drupal doesn't natively support module federation
- Better suited for large microfrontend architectures

**When to use:**
- Large-scale decoupled Drupal architecture
- Multiple independent React apps
- **Not recommended** for typical Drupal modules

### 7.4 Native ESM + Vite Dev Server

**Development workflow:**

```javascript
// vite.config.js
export default defineConfig({
  server: {
    origin: 'http://localhost:5173',
    cors: true,
  },
})
```

**Drupal library (development):**

```yaml
my-module-dev:
  js:
    http://localhost:5173/@vite/client:
      type: external
    http://localhost:5173/src/index.jsx:
      type: external
      attributes:
        type: module
```

**Advantages:**
- Hot module replacement (HMR)
- Instant updates
- Great DX

**Disadvantages:**
- Development only
- Requires Vite dev server running
- Complex Drupal integration

**When to use:**
- Active development
- Rapid iteration
- **Complement** to IIFE build, not replacement

### 7.5 Approach Comparison

| Approach | Browser Support | Drupal Version | Complexity | Recommendation |
|----------|----------------|----------------|------------|----------------|
| **IIFE + Externals** | All browsers | 8+ | Low | ✅ **Recommended** for Drupal 8-10 |
| **Import Maps** | Modern browsers | 11.1+ | Medium | ✅ **Recommended** for Drupal 11.1+ |
| **SystemJS** | All browsers | 8+ | Medium | ⚠️ Use only if needed |
| **Module Federation** | Modern browsers | 8+ | High | ❌ Overkill for most cases |
| **Native ESM (dev)** | Modern browsers | 8+ | Medium | ✅ Development only |

---

## 8. Real-World Examples

### 8.1 DrupalizeMe React Example

**Repository:** [github.com/DrupalizeMe/react-and-drupal-examples](https://github.com/DrupalizeMe/react-and-drupal-examples)

**Architecture:**
- Custom Drupal theme: `/drupal/web/themes/react_example_theme/`
- Webpack bundler
- **Approach:** Bundles React + ReactDOM (not external)

**Build commands:**
```json
{
  "scripts": {
    "build": "webpack --mode production",
    "build:dev": "webpack --mode development",
    "start": "webpack --watch --mode development",
    "start:hmr": "webpack serve --hot --mode development"
  }
}
```

**Key insight:** Popular tutorial but uses bundled approach, leading to larger builds. Good for learning, but not optimal for production.

### 8.2 Zivtech React-Drupal Example

**Repository:** [github.com/zivtech/react-drupal-example](https://github.com/zivtech/react-drupal-example)

**Architecture:**
- Custom module: `favorite`
- Simple webpack config
- **Approach:** Bundles everything

**Workflow:**
```bash
cd js
npm install
webpack
# Outputs: favorite.bundle.js
```

**Drupal integration:**
```yaml
# favorite.libraries.yml
favorite:
  js:
    js/favorite.bundle.js: { minified: true }
```

**Key insight:** Simple example but lacks external dependency optimization. Bundle size includes React.

### 8.3 Drupal Core's React Usage

**Location:** `core/core.libraries.yml`

```yaml
react:
  version: 18.2.0
  license:
    name: MIT
    url: https://github.com/facebook/react/blob/main/LICENSE
  js:
    /core/assets/vendor/react/umd/react.production.min.js: { minified: true, weight: -20 }

react-dom:
  version: 18.2.0
  license:
    name: MIT
    url: https://github.com/facebook/react/blob/main/LICENSE
  js:
    /core/assets/vendor/react-dom/umd/react-dom.production.min.js: { minified: true, weight: -19 }
  dependencies:
    - core/react
```

**Key insight:** Drupal provides React as UMD build exposing `window.React` and `window.ReactDOM`. This is what external dependencies should target.

### 8.4 Decoupled Blocks: React Module

**Project:** [drupal.org/project/pdb_react](https://www.drupal.org/project/pdb_react)

**Approach:**
- Uses Drupal core's React
- Webpack configuration for blocks
- Separate builds per block

**Key insight:** Production module that properly uses external React from Drupal core.

### 8.5 Vite React Generator Module

**Project:** [drupal.org/project/vite_react_generator](https://www.drupal.org/project/vite_react_generator)

**Architecture:**
- Generates Single Directory Components (SDC)
- Uses Vite for builds
- Drupal 10.3+/11 compatible

**Workflow:**
```bash
drush generate sdc-vite-react
cd my_theme
npm install
npm run build
```

**Key insight:** Modern approach using Vite with SDC. Represents current best practice for Drupal 11.

### 8.6 DKAN Client Tools (This Project)

**Current configuration** (`packages/dkan-client-tools-react/tsup.config.ts`):

```typescript
export default defineConfig([
  // ESM and CJS builds
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    external: ['react', '@dkan-client-tools/core', '@tanstack/react-query'],
  },
  // IIFE build
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsReact',
    external: ['react', 'react-dom', '@tanstack/react-query'],
    esbuildOptions(options) {
      // Custom plugin to map imports to window globals
      options.plugins = [
        {
          name: 'globals-plugin',
          setup(build) {
            build.onResolve({ filter: /^react$/ }, () => ({
              path: 'react',
              namespace: 'react-external',
            }))
            build.onLoad({ filter: /.*/, namespace: 'react-external' }, () => ({
              contents: 'module.exports = window.React',
              loader: 'js',
            }))
            // Similar for react-dom and react-query
          },
        },
      ]
    },
  },
])
```

**Key features:**
- Triple output: ESM (bundlers), CJS (Node), IIFE (browser)
- IIFE externalizes React, ReactDOM, ReactQuery
- Custom esbuild plugin for global mapping
- Exposes `window.DkanClientToolsReact`

**Usage in Drupal:**

```yaml
# mymodule.libraries.yml
dkan-client-react:
  js:
    js/vendor/dkan-client-react.min.js: { minified: true }
  dependencies:
    - core/react
    - core/react-dom
    - mymodule/tanstack-query
```

**Key insight:** Production-ready configuration with proper external handling via esbuild plugins. Good model for other projects.

---

## 9. Recommended Approach for DKAN

### 9.1 Current Configuration Assessment

**Strengths:**
- ✅ Triple format support (ESM, CJS, IIFE)
- ✅ Proper external dependency handling
- ✅ Custom esbuild plugin for window global mapping
- ✅ Separate dev/prod builds
- ✅ Source maps enabled
- ✅ TypeScript types generated
- ✅ Comprehensive documentation

**Areas for consideration:**
- Core package dependency handling
- TanStack Query externalization
- Bundle size optimization

### 9.2 Recommended Configuration

**For `@dkan-client-tools/react`:**

```typescript
// packages/dkan-client-tools-react/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig([
  // ESM and CJS builds (no changes needed)
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ['react', 'react-dom', '@dkan-client-tools/core', '@tanstack/react-query'],
  },

  // IIFE build - keep current implementation
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsReact',
    platform: 'browser',
    sourcemap: true,
    minify: false,
    external: ['react', 'react-dom', '@tanstack/react-query'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @dkan-client-tools/react v0.1.0 | Requires React 18+, ReactDOM 18+, TanStack Query 5+ */',
      }
      // Keep existing globals-plugin
      options.plugins = [/* existing plugin */]
    },
  },

  // IIFE minified build
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DkanClientToolsReact',
    platform: 'browser',
    sourcemap: 'hidden',
    minify: true,
    external: ['react', 'react-dom', '@tanstack/react-query'],
    outExtension: () => ({ js: '.global.min.js' }),
    esbuildOptions(options) {
      // Same as above
    },
  },
])
```

**Current implementation is already excellent!** No major changes needed.

### 9.3 Drupal Integration Guide

**Step 1: Create base React library**

```yaml
# dkan_client.libraries.yml

# Drupal's core React (use this)
dkan-client-react-base:
  dependencies:
    - core/react
    - core/react-dom
```

**Step 2: Add TanStack Query library**

```yaml
# Since Drupal doesn't include TanStack Query, provide it
tanstack-query:
  version: 5.90.7
  js:
    https://cdn.jsdelivr.net/npm/@tanstack/react-query@5.90.7/build/umd/index.production.js:
      type: external
      minified: true
  # OR use local copy
  # js:
  #   js/vendor/tanstack-query.min.js: { minified: true }
```

**Step 3: Add DKAN Client Core**

```yaml
dkan-client-core:
  js:
    js/vendor/dkan-client-core.min.js: { minified: true }
```

**Step 4: Add DKAN Client React**

```yaml
dkan-client-react:
  js:
    js/vendor/dkan-client-react.min.js: { minified: true }
  dependencies:
    - core/react
    - core/react-dom
    - dkan_client/tanstack-query
    - dkan_client/dkan-client-core
```

**Step 5: Use in module**

```yaml
my-dkan-widget:
  js:
    js/my-widget.js: {}
  dependencies:
    - dkan_client/dkan-client-react
    - core/drupal
    - core/once
```

### 9.4 Usage Example

```javascript
// modules/custom/dkan_demo/js/dataset-search.js
(function (Drupal, React, ReactDOM, DkanClientTools, DkanClientToolsReact) {
  'use strict';

  const { DkanClient } = DkanClientTools;
  const { DkanClientProvider, useDatasetSearch } = DkanClientToolsReact;

  // Create client
  const dkanClient = new DkanClient({
    baseUrl: '/api/1',
  });

  // React component
  function DatasetSearchWidget() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const { data, isLoading, error } = useDatasetSearch({
      searchOptions: {
        fulltext: searchTerm,
        'page-size': 10,
      },
      enabled: searchTerm.length > 2,
    });

    return React.createElement('div', { className: 'dkan-search-widget' },
      React.createElement('input', {
        type: 'text',
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        placeholder: 'Search datasets...',
      }),
      isLoading && React.createElement('div', null, 'Loading...'),
      error && React.createElement('div', { className: 'error' }, error.message),
      data && React.createElement('ul', null,
        data.results.map((dataset) =>
          React.createElement('li', { key: dataset.identifier },
            React.createElement('h3', null, dataset.title),
            React.createElement('p', null, dataset.description)
          )
        )
      )
    );
  }

  // Drupal behavior
  Drupal.behaviors.dkanDatasetSearch = {
    attach(context) {
      const elements = once('dkan-search', '[data-dkan-search]', context);
      elements.forEach((element) => {
        const root = ReactDOM.createRoot(element);
        root.render(
          React.createElement(DkanClientProvider, { client: dkanClient },
            React.createElement(DatasetSearchWidget)
          )
        );
      });
    }
  };

})(Drupal, React, ReactDOM, window.DkanClientTools, window.DkanClientToolsReact);
```

### 9.5 Alternative: With JSX Build Step

**For better DX, add JSX support:**

```javascript
// src/DatasetSearchWidget.jsx
import React, { useState } from 'react';
import { useDatasetSearch } from '@dkan-client-tools/react';

export function DatasetSearchWidget() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useDatasetSearch({
    searchOptions: {
      fulltext: searchTerm,
      'page-size': 10,
    },
    enabled: searchTerm.length > 2,
  });

  return (
    <div className="dkan-search-widget">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search datasets..."
      />
      {isLoading && <div>Loading...</div>}
      {error && <div className="error">{error.message}</div>}
      {data && (
        <ul>
          {data.results.map((dataset) => (
            <li key={dataset.identifier}>
              <h3>{dataset.title}</h3>
              <p>{dataset.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Build with Vite:**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/DatasetSearchWidget.jsx',
      name: 'DatasetSearchWidget',
      formats: ['iife'],
      fileName: 'dataset-search-widget',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@dkan-client-tools/react',
        '@dkan-client-tools/core',
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          '@dkan-client-tools/react': 'DkanClientToolsReact',
          '@dkan-client-tools/core': 'DkanClientTools',
        },
      },
    },
  },
});
```

### 9.6 Bundle Size Optimization

**Current sizes:**
- Core: 73 KB (30.8 KB minified)
- React: 2.21 MB (938 KB minified) ❌ **This is very large!**

**Investigation needed:**

```bash
# Check what's in the React bundle
npm run build
ls -lh packages/dkan-client-tools-react/dist/

# If bundle is too large, React might be bundled
# Verify externals are working:
grep -r "useState" packages/dkan-client-tools-react/dist/*.global.min.js
```

**Expected size for React package IIFE:**
- Without React: ~50-100 KB minified (just hooks code)
- With React bundled: ~938 KB minified

**If React is being bundled:**

1. Verify external config in tsup.config.ts
2. Check that esbuild globals-plugin is working
3. Test built file in browser with window.React available

**Optimization tips:**

1. **Ensure React is external** (should reduce to ~100 KB)
2. **Tree-shake unused hooks** (if not all 40+ hooks used)
3. **Separate hook categories** into multiple bundles
4. **Consider build-time dead code elimination**

### 9.7 Documentation Updates

**Add to DRUPAL_USAGE.md:**

1. **Troubleshooting section**:
   - React not defined errors
   - Bundle size issues
   - CORS problems with Vite dev server

2. **Advanced patterns**:
   - Creating custom Drupal blocks with DKAN hooks
   - Integrating with Views
   - Using with Drupal forms

3. **Performance tips**:
   - Stale time configuration
   - Cache invalidation strategies
   - Lazy loading components

---

## 10. Implementation Checklist

### 10.1 For Library Authors (DKAN Team)

- [x] Configure tsup/vite to output IIFE format
- [x] Externalize React, ReactDOM, framework deps
- [x] Add esbuild plugins for window global mapping
- [x] Generate both dev and minified builds
- [x] Include source maps
- [x] Add package.json exports for IIFE builds
- [x] Document global variable names
- [ ] Verify bundle size (investigate React bundle size)
- [x] Create usage examples
- [x] Publish to npm

### 10.2 For Drupal Module Developers

**Setup:**

- [ ] Choose integration approach (IIFE vs import maps)
- [ ] Install DKAN client tools via npm
- [ ] Copy IIFE builds to module directory
- [ ] Create Drupal library definitions

**Development:**

- [ ] Define React/ReactDOM dependencies
- [ ] Create Drupal behaviors
- [ ] Use `once` utility for initialization
- [ ] Pass config via drupalSettings
- [ ] Handle loading/error states

**Testing:**

- [ ] Test with CSS/JS aggregation enabled
- [ ] Verify no React duplication (check Network tab)
- [ ] Test in production mode
- [ ] Check browser console for errors
- [ ] Test cache clearing

**Production:**

- [ ] Use minified builds
- [ ] Enable source maps (optional)
- [ ] Configure CDN/caching if needed
- [ ] Monitor bundle sizes
- [ ] Set up error tracking

### 10.3 Build Configuration Checklist

**Vite/tsup config:**

- [ ] Library mode enabled
- [ ] IIFE format specified
- [ ] Global name defined
- [ ] React/ReactDOM in external array
- [ ] Globals mapping configured
- [ ] Source maps enabled
- [ ] Minification configured
- [ ] Banner/footer comments added

**Package.json:**

- [ ] exports field includes IIFE paths
- [ ] browser field points to IIFE
- [ ] peerDependencies declared
- [ ] Build scripts defined
- [ ] Files field includes dist/

**Testing:**

- [ ] Build succeeds without errors
- [ ] Bundle size reasonable (< 200 KB for hooks only)
- [ ] React not included in bundle (check with grep)
- [ ] Source maps generated
- [ ] Works in browser with window.React available

### 10.4 Drupal Integration Checklist

**Library definition:**

- [ ] JS files referenced correctly
- [ ] Dependencies declared (core/react, core/react-dom)
- [ ] minified: true for minified files
- [ ] preprocess: false if needed
- [ ] drupalSettings configured

**Module code:**

- [ ] Uses Drupal.behaviors
- [ ] Implements once utility
- [ ] Handles context properly
- [ ] Gracefully handles errors
- [ ] Cleans up on detach (if needed)

**Documentation:**

- [ ] Installation instructions
- [ ] Usage examples
- [ ] Troubleshooting guide
- [ ] API reference
- [ ] Browser compatibility notes

---

## Conclusion

Building Drupal modules with React and Vite requires careful dependency management. The recommended approach in 2024-2025 is:

**For Drupal 8-10:**
- **IIFE format** with externalized React dependencies
- Map imports to **window.React** and **window.ReactDOM**
- Use **Drupal's core React libraries** as dependencies
- Configure Vite with **rollupOptions.external** and **globals**

**For Drupal 11.1+:**
- Consider **import maps** for modern ESM approach
- Use **ESM format** with externalized dependencies
- Define imports in **mymodule.importmap.yml**
- Smaller bundles with better tree-shaking

The **DKAN Client Tools** project already implements best practices with its current tsup configuration. The main area for investigation is the React package bundle size (938 KB minified seems large if React is properly externalized).

Key success factors:
1. Externalize framework dependencies
2. Map to window globals correctly
3. Leverage Drupal's library system
4. Test thoroughly with aggregation
5. Document usage clearly

With this approach, developers can build efficient, maintainable React components for Drupal while sharing a single React instance across multiple modules.

---

## References

- [Drupal Library API](https://www.drupal.org/docs/drupal-apis/javascript-api/add-javascript-to-your-theme-or-module)
- [Vite Library Mode](https://vite.dev/guide/build.html#library-mode)
- [Import Maps Specification](https://github.com/WICG/import-maps)
- [TanStack Query](https://tanstack.com/query)
- [Drupal Import Maps Issue](https://www.drupal.org/project/drupal/issues/3398525)
- [React in Drupal (Drupalize.Me)](https://drupalize.me/series/drupal-8-and-reactjs)
