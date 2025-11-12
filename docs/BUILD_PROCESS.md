# DKAN Client Tools - Automated Build Process

## Overview

The DKAN Client Tools project uses an automated build orchestrator to handle the complete workflow from package builds to Drupal module deployment. This document explains the build system, available commands, and how to use them.

## Quick Start

```bash
# Complete build workflow (everything)
npm run build:all

# Complete build + clear Drupal cache
npm run build:all:drupal
```

## Build Architecture

The build process follows this sequence:

1. **Build Packages** - Build core, react, and vue packages (tsup)
2. **Deploy to Drupal** - Copy IIFE builds to Drupal base modules
3. **Build Examples** - Build standalone demo apps (Vite)
4. **Build Drupal Modules** - Build Drupal demo modules (Vite)

### Build Order

```
Packages (dependency order):
  1. dkan-client-tools-core       (no dependencies)
  2. dkan-client-tools-react      (depends on core)
  3. dkan-client-tools-vue        (depends on core)
     ↓
  [Copy IIFE builds to Drupal base modules]
     ↓
Standalone Examples (parallel):
  4. vanilla-demo-app             (uses core)
  5. react-demo-app               (uses react)
  6. vue-demo-app                 (uses vue)
     ↓
Drupal Demo Modules:
  7. dkan_client_demo_react       (uses react base module)
  8. dkan_client_demo_vue         (uses vue base module)
```

## Available Commands

### Complete Workflows

```bash
# Build everything (packages → deploy → examples → drupal modules)
npm run build:all

# Build everything + clear Drupal cache
npm run build:all:drupal
```

### Individual Phases

```bash
# Build only packages (core, react, vue)
npm run build:packages

# Deploy already-built packages to Drupal modules
npm run build:deploy

# Build only standalone example apps
npm run build:examples

# Build only Drupal demo modules
npm run build:drupal
```

### Legacy Commands

```bash
# Build packages using workspace commands (no orchestration)
npm run build

# Build specific package
npm run build -w @dkan-client-tools/core
npm run build -w @dkan-client-tools/react
npm run build -w @dkan-client-tools/vue
```

## File Deployment Mappings

The build orchestrator automatically copies built IIFE files to Drupal modules:

### Core Package
```
Source:      packages/dkan-client-tools-core/dist/index.global.min.js (40KB)
Destination: dkan/docroot/modules/custom/dkan_client_tools_core_base/js/vendor/dkan-client-tools-core.min.js
Global:      window.DkanClientTools
```

### React Package
```
Source:      packages/dkan-client-tools-react/dist/index.global.min.js (205KB)
Destination: dkan/docroot/modules/custom/dkan_client_tools_react_base/js/vendor/dkan-client-tools-react.min.js
Global:      window.DkanClientToolsReact
```

### Vue Package (Full with Compiler)
```
Source:      packages/dkan-client-tools-vue/dist/index.global.full.min.js (240KB)
Destination: dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue.min.js
Global:      window.DkanClientToolsVue
```

### Vue Package (Runtime Only)
```
Source:      packages/dkan-client-tools-vue/dist/index-runtime.global.runtime.min.js (174KB)
Destination: dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue-runtime.min.js
Global:      window.DkanClientToolsVue
```

## Build Output Verification

The orchestrator automatically verifies:

- ✅ Source files exist before copying
- ✅ File sizes are within expected ranges
- ✅ Destination directories are created if missing
- ✅ Build commands complete successfully
- ⚠️ Warnings for unexpected file sizes

## Development Workflows

### Making Changes to Core Package

```bash
# Edit code in packages/dkan-client-tools-core/src/

# Build and deploy
npm run build:all

# Clear Drupal cache and test
cd dkan && ddev drush cr
```

### Making Changes to React Package

```bash
# Edit code in packages/dkan-client-tools-react/src/

# Build and deploy
npm run build:all

# Clear Drupal cache and test
cd dkan && ddev drush cr
```

### Making Changes to Vue Package

```bash
# Edit code in packages/dkan-client-tools-vue/src/

# Build and deploy
npm run build:all

# Clear Drupal cache and test
cd dkan && ddev drush cr
```

### Making Changes to Drupal Demo Modules

```bash
# Edit code in dkan/docroot/modules/custom/dkan_client_demo_react/

# Rebuild just the Drupal modules
npm run build:drupal

# Clear Drupal cache and test
cd dkan && ddev drush cr
```

### Making Changes to Example Apps

```bash
# Edit code in examples/react-demo-app/

# Rebuild just the examples
npm run build:examples

# Or use the example's dev server
cd examples/react-demo-app
npm run dev
```

## Error Handling

The build orchestrator uses **fail-fast** error handling:

- ❌ If package builds fail → stops immediately
- ❌ If deployment fails → stops immediately
- ❌ If example builds fail → stops immediately
- ❌ If Drupal module builds fail → stops immediately

This ensures you catch errors early and don't deploy broken builds.

## File Size Expectations

The orchestrator warns if file sizes are outside expected ranges:

| File | Expected Size | Warning If |
|------|--------------|------------|
| Core | 35-50 KB | < 35KB or > 50KB |
| React | 200-220 KB | < 200KB or > 220KB |
| Vue Full | 230-260 KB | < 230KB or > 260KB |
| Vue Runtime | 165-185 KB | < 165KB or > 185KB |

## Build Configuration

Build settings are centralized in `/scripts/build-config.js`:

- Deployment mappings (source → destination)
- Package build order (respects dependencies)
- Example apps list
- Drupal demo modules list
- File size expectations

## Troubleshooting

### Build fails with "Source file not found"

**Problem**: Package didn't build successfully before deployment.

**Solution**: Run `npm run build:packages` and check for errors.

### Build succeeds but changes don't appear in Drupal

**Problem**: Drupal cache needs clearing.

**Solution**: Run `ddev drush cr` or use `npm run build:all:drupal`.

### File size warnings

**Problem**: Build output is larger/smaller than expected.

**Solution**:
- Check if dependencies changed
- Verify tsup configuration
- Update expected sizes in `scripts/build-config.js` if intentional

### Drupal module build fails with missing dependencies

**Problem**: `node_modules` not installed in Drupal module.

**Solution**: The orchestrator auto-runs `npm install` if `node_modules` is missing. If issues persist, manually run:

```bash
cd dkan/docroot/modules/custom/dkan_client_demo_react
npm install
```

## Advanced Usage

### Running Individual Phases

You can run phases independently for faster iteration:

```bash
# Just rebuild packages
npm run build:packages

# Just deploy to Drupal (assumes packages already built)
npm run build:deploy

# Just rebuild examples
npm run build:examples

# Just rebuild Drupal modules
npm run build:drupal
```

### Watch Mode (Coming Soon)

Watch mode is not yet implemented but planned for the future:

```bash
# Future: Watch packages and auto-deploy on change
npm run dev:watch
```

## CI/CD Integration

For continuous integration pipelines:

```bash
# Full build (fails fast on errors)
npm run build:all

# Check exit code
if [ $? -eq 0 ]; then
  echo "Build successful"
else
  echo "Build failed"
  exit 1
fi
```

## Architecture Decisions

### Why Separate Build and Deploy?

- **Packages** build multiple formats (ESM/CJS/IIFE)
- **Drupal** only needs IIFE format
- **Separation** allows flexibility (can build without deploying)

### Why Fail-Fast?

- Catches errors immediately
- Prevents deploying broken builds
- Clear error messages at point of failure

### Why Automated Copying?

- Manual copying is error-prone
- Ensures consistency
- Enables CI/CD automation
- Faster development workflow

### Why File Size Validation?

- Early warning of bloat
- Catches bundling issues
- Documents expected sizes

## Related Documentation

- **[BUILD_PROCESS_ANALYSIS.md](../research/BUILD_PROCESS_ANALYSIS.md)** - Technical deep dive
- **[BUILD_ARCHITECTURE_DIAGRAM.md](../research/BUILD_ARCHITECTURE_DIAGRAM.md)** - Visual diagrams
- **[BUILD_EXPLORATION_SUMMARY.md](../research/BUILD_EXPLORATION_SUMMARY.md)** - Executive overview
- **[CLAUDE.md](../CLAUDE.md)** - Overall project structure

## Questions?

If you have questions about the build process, check:

1. This documentation
2. `/scripts/build-config.js` - Configuration
3. `/scripts/build-orchestrator.js` - Implementation
4. `/research/BUILD_*.md` - Detailed analysis

---

**Last Updated**: November 2025
**Maintainer**: DKAN Client Tools Team
