# Development Guide

Development setup and commands for dkanClientTools monorepo.

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm >= 9.0.0

## Building

```bash
# Complete build workflow
npm run build:all                # Packages → deploy → examples → Drupal
npm run build:all:drupal         # Build all + clear Drupal cache

# Individual build phases
npm run build:packages           # Build core, react, vue
npm run build:examples           # Build standalone examples
npm run build:drupal             # Build Drupal demo modules
npm run build:deploy             # Deploy built packages to Drupal

# Development
npm run dev                      # Watch mode
```

See [BUILD_PROCESS.md](BUILD_PROCESS.md) for detailed build documentation.

## Testing

```bash
npm test                         # All tests
npm run test:watch               # Watch mode
npm run typecheck                # Type checking

# Package-specific tests
cd packages/dkan-client-tools-react && npm test
cd packages/dkan-client-tools-vue && npm test
```

See package-specific TESTING.md files for detailed testing documentation.

## Monorepo Management

```bash
# Add dependency to specific package
npm install <package> -w @dkan-client-tools/core

# Run script in specific package
npm run build -w @dkan-client-tools/react

# Run script in all packages
npm run build --workspaces
```

**Workspace Notes**:
- Internal dependencies use `workspace:*` protocol
- Peer dependencies declared in each package
- Common deps hoisted to root
- Independent versioning per package

## Development Workflow

1. Make changes in `/packages/*/src`
2. Run `npm run dev` for watch mode
3. Run `npm test` to verify changes
4. Run `npm run typecheck` to verify types
5. See [BUILD_PROCESS.md](BUILD_PROCESS.md) for deployment

## DKAN Development Environment

The `/dkan` directory contains a Drupal 10 + DKAN 2.x site for testing integration.

**Access**: https://dkan.ddev.site

**Admin Login**: `ddev drush uli` (generates one-time login link)

**Common Commands**:
```bash
ddev start                                # Start environment
ddev stop                                 # Stop environment
ddev restart                              # Restart environment
ddev ssh                                  # SSH into container
ddev drush cr                             # Clear cache
```

See CLAUDE.md for complete DKAN development environment documentation.
