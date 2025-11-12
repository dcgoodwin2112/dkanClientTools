# Build Scripts

This directory contains the automated build orchestration system for DKAN Client Tools.

## Files

### `build-orchestrator.js`

Main build orchestrator script that automates the complete build workflow:

1. Builds all packages (core, react, vue) in dependency order
2. Copies IIFE builds to Drupal base modules
3. Builds standalone example apps
4. Builds Drupal demo modules

**Features**:
- Fail-fast error handling (stops on first error)
- Colored console output with progress indicators
- File size validation
- Automatic directory creation
- Success/error reporting

**Usage**:
```bash
# Run complete workflow
node scripts/build-orchestrator.js

# Run individual phases
node scripts/build-orchestrator.js packages
node scripts/build-orchestrator.js deploy
node scripts/build-orchestrator.js examples
node scripts/build-orchestrator.js drupal
```

### `build-config.js`

Centralized build configuration defining:

- **Deployment mappings** - Source → destination file paths
- **Package build order** - Respects dependencies (core → react/vue)
- **Example apps** - List of standalone demo apps
- **Drupal modules** - List of Drupal demo modules to build
- **File size expectations** - Expected size ranges for validation

**Configuration sections**:
- `deployments` - Package → Drupal module file mappings
- `packageBuildOrder` - Build sequence for packages
- `exampleApps` - Standalone demo apps list
- `drupalDemoModules` - Drupal modules that need building

## NPM Scripts

These scripts (defined in root `package.json`) use the orchestrator:

```bash
npm run build:all           # Complete workflow
npm run build:all:drupal    # Complete workflow + clear Drupal cache
npm run build:packages      # Build packages only
npm run build:deploy        # Deploy to Drupal only
npm run build:examples      # Build examples only
npm run build:drupal        # Build Drupal modules only
```

## How It Works

### Phase 1: Build Packages

Builds packages in dependency order:
1. `dkan-client-tools-core` (no dependencies)
2. `dkan-client-tools-react` (depends on core)
3. `dkan-client-tools-vue` (depends on core)

Each package builds multiple formats (ESM/CJS/IIFE) using tsup.

### Phase 2: Deploy to Drupal

Copies minified IIFE builds to Drupal base modules:

- Core: `index.global.min.js` → `dkan_client_tools_core_base/js/vendor/`
- React: `index.global.min.js` → `dkan_client_tools_react_base/js/vendor/`
- Vue: `index.global.full.min.js` → `dkan_client_tools_vue_base/js/vendor/`
- Vue: `index-runtime.global.runtime.min.js` → `dkan_client_tools_vue_base/js/vendor/`

Validates file sizes and warns if outside expected ranges.

### Phase 3: Build Examples

Builds standalone demo apps using Vite:
- `vanilla-demo-app`
- `react-demo-app`
- `vue-demo-app`

These are standalone applications that demonstrate package usage.

### Phase 4: Build Drupal Modules

Builds Drupal demo modules using Vite:
- `dkan_client_demo_react` - React widget for Drupal
- `dkan_client_demo_vue` - Vue widget for Drupal

Note: `dkan_client_demo_vanilla` has no build process (plain JS).

Auto-runs `npm install` if `node_modules` is missing.

## Error Handling

The orchestrator uses **fail-fast** error handling:

- ❌ Stops immediately on any error
- ✅ Returns exit code 0 on success
- ✅ Returns exit code 1 on failure
- 📊 Shows detailed error messages

This prevents deploying broken builds and makes debugging easier.

## Validation

The orchestrator validates:

1. **File existence** - Source files exist before copying
2. **File sizes** - Within expected ranges (warns if outside)
3. **Build success** - Commands complete without errors
4. **Directory creation** - Creates destination dirs if missing

## Output Format

Colored console output with:

- 🔵 **Blue** - Phase/step headers
- 🟢 **Green** - Success messages
- 🔴 **Red** - Error messages
- 🟡 **Yellow** - Warnings
- ⚪ **Gray** - Info/details

## Extending

To add a new package or module:

1. Edit `build-config.js`
2. Add to appropriate array:
   - `packageBuildOrder` - For new packages
   - `exampleApps` - For new example apps
   - `drupalDemoModules` - For new Drupal modules
   - `deployments` - For new deployment mappings
3. Orchestrator will automatically include it

## Documentation

See [BUILD_PROCESS.md](../docs/BUILD_PROCESS.md) for complete documentation.

---

**Last Updated**: November 2025
