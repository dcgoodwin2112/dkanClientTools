# Build Process

Automated build system for DKAN Client Tools packages, examples, and Drupal modules.

## Overview

The build system uses an orchestrator script that automates the complete workflow:

1. **Build Packages** - Compile TypeScript packages to multiple distribution formats
2. **Deploy to Drupal** - Copy IIFE builds to Drupal base modules
3. **Build Examples** - Compile standalone demo applications
4. **Build Drupal Modules** - Compile Drupal demo modules

## Quick Reference

```bash
# Complete workflow (all phases)
npm run build:all

# Complete workflow + clear Drupal cache
npm run build:all:drupal

# Individual phases
npm run build:packages      # Phase 1: Build packages only
npm run build:deploy        # Phase 2: Deploy to Drupal only
npm run build:examples      # Phase 3: Build examples only
npm run build:drupal        # Phase 4: Build Drupal modules only

# Development
npm run dev                 # Watch mode (packages only)

# Legacy
npm run build              # Build all packages (no deployment)
```

---

## Build Workflow

### Phase 1: Build Packages

Builds all packages in dependency order using `tsup`:

1. **@dkan-client-tools/core** (no dependencies)
2. **@dkan-client-tools/react** (depends on core)
3. **@dkan-client-tools/vue** (depends on core)

**Output Formats**:

Each package generates multiple distribution formats:

- **ESM** (`dist/index.js`) - Modern JavaScript modules for bundlers
- **CommonJS** (`dist/index.cjs`) - Node.js compatibility
- **TypeScript Declarations** (`dist/index.d.ts`) - Type definitions
- **IIFE** (`dist/index.global.js`) - Browser/Drupal builds
- **IIFE Minified** (`dist/index.global.min.js`) - Production browser builds

**Build Tool**: tsup (TypeScript → JavaScript compiler)
- Source maps enabled
- Tree-shaking enabled
- External dependencies specified per format

### Phase 2: Deploy to Drupal

Copies IIFE builds from packages to Drupal base modules:

```
packages/dkan-client-tools-core/dist/index.global.min.js
  → dkan/docroot/modules/custom/dkan_client_tools_core_base/js/vendor/

packages/dkan-client-tools-react/dist/index.global.min.js
  → dkan/docroot/modules/custom/dkan_client_tools_react_base/js/vendor/

packages/dkan-client-tools-vue/dist/index.global.full.min.js
  → dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/
```

**Validation**: Checks file sizes to ensure builds completed successfully.

### Phase 3: Build Examples

Builds standalone demo applications using Vite:

- **Vanilla Demo App** (`examples/vanilla-demo-app`)
- **React Demo App** (`examples/react-demo-app`)
- **Vue Demo App** (`examples/vue-demo-app`)

Each app is built for production deployment.

### Phase 4: Build Drupal Modules

Builds Drupal demo modules that use the framework adapters:

- **React Demo Module** (`dkan/docroot/modules/custom/dkan_client_demo_react`)
- **Vue Demo Module** (`dkan/docroot/modules/custom/dkan_client_demo_vue`)

Note: Vanilla demo module has no build step (uses plain JavaScript).

---

## Package Build Details

### Core Package

**Entry**: `src/index.ts`

**Outputs**:
```
dist/
├── index.js              # ESM build
├── index.cjs             # CommonJS build
├── index.d.ts            # TypeScript declarations
├── index.global.js       # IIFE build (unminified)
└── index.global.min.js   # IIFE build (minified)
```

**Global Variable**: `window.DkanClientTools`

**Features**:
- All dependencies bundled in IIFE builds
- TanStack Query Core included
- Tree-shakeable ESM/CJS builds

### React Package

**Entry**: `src/index.ts`

**Outputs**:
```
dist/
├── index.js              # ESM build
├── index.cjs             # CommonJS build
├── index.d.ts            # TypeScript declarations
├── index.global.js       # IIFE build (unminified)
└── index.global.min.js   # IIFE build (minified)
```

**Global Variable**: `window.DkanClientToolsReact`

**Features**:
- IIFE builds include React and ReactDOM
- TanStack React Query bundled
- Core package bundled in IIFE

### Vue Package

**Entry**: `src/index.ts`

**Outputs**:
```
dist/
├── index.js                      # ESM build
├── index.cjs                     # CommonJS build
├── index.d.ts                    # TypeScript declarations
├── index.global.full.js          # IIFE build with Vue compiler
├── index.global.full.min.js      # Minified full build
├── index.global.runtime.js       # IIFE build (runtime only)
└── index.global.runtime.min.js   # Minified runtime build
```

**Global Variable**: `window.DkanClientToolsVue`

**Features**:
- **Full build**: Includes Vue compiler (for template strings)
- **Runtime build**: Runtime only (for pre-compiled components)
- TanStack Vue Query bundled
- Core package bundled in IIFE

---

## Development Workflow

### Watch Mode

```bash
npm run dev
```

Starts watch mode for all packages. Changes trigger automatic recompilation.

### Individual Package Development

```bash
# Work on core package
cd packages/dkan-client-tools-core
npm run dev

# Work on React package
cd packages/dkan-client-tools-react
npm run dev

# Work on Vue package
cd packages/dkan-client-tools-vue
npm run dev
```

### Testing with Drupal

After making changes:

```bash
# Build and deploy, then clear Drupal cache
npm run build:all:drupal

# Or manually:
npm run build:all
cd dkan
ddev drush cr
```

---

## Build Configuration

### Build Orchestrator

**Location**: `scripts/build-orchestrator.js`

The orchestrator automates the complete workflow with:
- Colored terminal output
- Error handling with descriptive messages
- File size validation
- Phase-by-phase execution

### Build Config

**Location**: `scripts/build-config.js`

Defines:
- Deployment mappings (package → Drupal module)
- Build order (respects dependencies)
- Example app locations
- Drupal module locations

### TypeScript Config

**Location**: `tsup.config.ts` (in each package)

Configures build formats, output extensions, and bundling options.

---

## Troubleshooting

**Package build errors**: Run `npm run typecheck`, ensure dependencies installed with `npm install`, or clear dist folder with `npm run clean`

**Deployment errors**: Verify Phase 1 completed and dist files exist in package directories

**Example app build errors**: Ensure packages built first with `npm run build:packages`

**File size warnings**: Usually safe to ignore unless size drastically changed

**Global variable undefined**: Verify correct IIFE file loaded (`index.global.min.js`) and library dependencies are correct

**Watch mode not detecting changes**: Restart with `npm run dev`

---

## CI/CD Integration

The build system can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
steps:
  - name: Install dependencies
    run: npm install

  - name: Run tests
    run: npm test

  - name: Build all packages
    run: npm run build:all

  - name: Deploy
    run: # Your deployment commands
```

---

## Next Steps

- [Installation Guide](./INSTALLATION.md) - Install packages
- [Drupal Integration](./DRUPAL_INTEGRATION.md) - Using IIFE builds in Drupal
- [API Reference](./API_REFERENCE.md) - Complete API documentation
