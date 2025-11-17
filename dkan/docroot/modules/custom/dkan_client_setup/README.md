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
- Datastore module (DKAN)
- Metastore module (DKAN)

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

### Create Data Dictionaries

Creates data dictionaries for all datastore resources by analyzing table schemas:

```bash
ddev drush dkan-client:create-data-dictionaries
```

**Process:**
- Queries all distributions in metastore
- Finds distributions with datastore tables
- Retrieves table schema from datastore
- Maps field types from Drupal schema to Frictionless format
- Creates data dictionary metadata

**Idempotent:** Safe to run multiple times. Skips existing dictionaries.

### Complete Setup

Runs all commands in sequence:

```bash
ddev drush dkan-client:setup
```

Equivalent to:
```bash
ddev drush dkan-client:create-demo-pages
ddev drush dkan-client:place-blocks
ddev drush dkan-client:create-data-dictionaries
```

**Idempotent:** Safe to run multiple times.

### Clean Refresh

Remove all existing demo content and sample datasets, then recreate:

```bash
ddev drush dkan-client:setup --clean
```

**Removes:**
- Demo pages (3 pages)
- Demo blocks (3 blocks)
- Data dictionaries (all *-dict items)
- Sample datasets (reverts sample_content harvest)

**Then Creates:**
- Fresh demo pages
- Fresh demo blocks
- Fresh data dictionaries

**Use Case:** Reset demo environment to clean state.

## Aliases

Short aliases available:
- `dkan-client-pages` → `dkan-client:create-demo-pages`
- `dkan-client-blocks` → `dkan-client:place-blocks`
- `dkan-client-dictionaries` → `dkan-client:create-data-dictionaries`
- `dkan-client-demo-setup` → `dkan-client:setup`

## Usage Examples

### Normal Setup (Idempotent)

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

### Clean Refresh

```bash
# Remove all demo content and sample datasets, then recreate
ddev drush dkan-client:setup --clean

# Or via bash script
cd /path/to/dkan
bash scripts/setup-site.sh -c
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
