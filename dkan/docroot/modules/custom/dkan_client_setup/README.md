# DKAN Client Setup Module

Provides Drush commands for automated DKAN Client Tools demo environment setup.

## Overview

This module automates the creation and configuration of demo pages for DKAN Client Tools packages (Vanilla JavaScript, React, and Vue implementations).

## Requirements

- Drupal 10 or 11
- DKAN 2.x
- Node module
- Block module
- Path module

## Installation

```bash
ddev drush en dkan_client_setup -y
```

## Drush Commands

### Create Demo Pages

Creates three demo pages with URL aliases:

```bash
ddev drush dkan-client:create-demo-pages
```

**Pages Created:**
- `/vanilla-demo` - Vanilla JavaScript Demo
- `/react-demo` - React Demo
- `/vue-demo` - Vue Demo

**Idempotent:** Safe to run multiple times. Skips existing pages.

### Place Blocks

Places dataset search blocks on each demo page with path-based visibility:

```bash
ddev drush dkan-client:place-blocks
```

**Blocks Placed:**
- DKAN Dataset Search (Vanilla) → `/vanilla-demo`
- DKAN Dataset Search (React) → `/react-demo`
- DKAN Dataset Search (Vue) → `/vue-demo`

**Idempotent:** Safe to run multiple times. Skips existing blocks.

### Complete Setup

Runs both commands in sequence:

```bash
ddev drush dkan-client:setup
```

Equivalent to:
```bash
ddev drush dkan-client:create-demo-pages
ddev drush dkan-client:place-blocks
```

**Idempotent:** Safe to run multiple times.

## Aliases

Short aliases available:
- `dkan-client-pages` → `dkan-client:create-demo-pages`
- `dkan-client-blocks` → `dkan-client:place-blocks`
- `dkan-client-demo-setup` → `dkan-client:setup`

## Usage Example

```bash
# Enable module
ddev drush en dkan_client_setup -y

# Run complete setup
ddev drush dkan-client:setup

# Visit demo pages
open https://dkan.ddev.site/vanilla-demo
open https://dkan.ddev.site/react-demo
open https://dkan.ddev.site/vue-demo
```

## Architecture

### Page Creation

Uses Drupal's Node API to programmatically create pages with URL aliases. Checks for existing pages by title to prevent duplicates.

### Block Placement

Uses Drupal's Block API to create and place blocks with path-based visibility conditions using the `request_path` condition plugin.

## Troubleshooting

### Blocks Not Visible

Ensure demo modules are enabled:
```bash
ddev drush en dkan_client_demo_vanilla dkan_client_demo_react dkan_client_demo_vue -y
```

### Pages Not Found

Clear cache after setup:
```bash
ddev drush cr
```

### Permission Errors

Ensure you have admin privileges when running Drush commands.
