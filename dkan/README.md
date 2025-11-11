# DKAN Development Environment

This directory contains a complete Drupal 11 + DKAN development environment for testing and developing the DKAN Client Tools packages.

## What's Included

### Drupal Installation
- **Drupal**: 11.2.7
- **DKAN**: 2.21.2
- **PHP**: 8.3
- **Database**: MariaDB 10.11
- **Web Server**: nginx-fpm
- **Drush**: 13.6.2

### Custom Modules (Part of This Project)

#### Base Modules (Provide Shared Libraries)
- **dkan_client_tools_core_base** - Provides DKAN Client Tools Core library
- **dkan_client_tools_react_base** - Provides React, ReactDOM, and React Query libraries
- **dkan_client_tools_vue_base** - Provides Vue and Vue Query libraries

#### Demo Modules (Example Implementations)
- **dkan_client_demo_vanilla** - Vanilla JavaScript demo using Drupal Behaviors
- **dkan_client_demo_react** - React demo with Vite build
- **dkan_client_demo_vue** - Vue demo with Vite build

### Sample Data
- **49 datasets** imported via sample content harvest
- Sample harvest plan: `sample_content`

## Quick Start

### Prerequisites
- [DDEV](https://ddev.readthedocs.io/) installed and running
- Docker or Colima

### Start the Environment

```bash
cd dkan
ddev start
```

Access the site at: https://dkan.ddev.site

**Admin Credentials:**
- Username: `admin`
- Password: `admin`

### Stop the Environment

```bash
ddev stop
```

## Initial Setup (First Time)

If this is a fresh checkout or the environment hasn't been set up yet:

```bash
cd dkan

# Start DDEV
ddev start

# Install Composer dependencies
ddev composer install

# Import database or install Drupal
ddev drush si --account-pass=admin -y

# Enable DKAN modules
ddev drush en dkan metastore metastore_admin metastore_search harvest sample_content -y

# Generate sample data
ddev drush dkan:sample-content:create

# Clear cache
ddev cr
```

## Common Commands

### DDEV Commands
```bash
ddev start              # Start the environment
ddev stop               # Stop the environment
ddev restart            # Restart the environment
ddev describe           # Show project details
ddev ssh                # SSH into web container
ddev logs               # View container logs
```

### Drush Commands
```bash
ddev drush status                           # Check Drupal status
ddev drush cr                               # Clear cache (alias: ddev cr)
ddev drush en [module_name] -y              # Enable a module
ddev drush pm-uninstall [module_name] -y    # Uninstall a module
ddev drush pml                              # List all modules
ddev drush pml --filter=dkan_client         # List DKAN client modules
```

### DKAN-Specific Commands
```bash
# Sample content
ddev drush dkan:sample-content:create       # Create sample datasets
ddev drush dkan:sample-content:remove       # Remove sample datasets

# Harvest
ddev drush dkan:harvest:list                # List harvest plans
ddev drush dkan:harvest:run [plan-id]       # Run a harvest
ddev drush dkan:harvest:status              # Check harvest status

# Dataset info
ddev drush dkan:dataset-info [uuid]         # Show dataset information
```

### Composer Commands
```bash
ddev composer require [package]         # Add a package
ddev composer update                    # Update dependencies
ddev composer install                   # Install dependencies
```

## Development Workflow

### Working on Custom Modules

All custom modules are in `docroot/modules/custom/` and are tracked in git. Changes to these modules are part of this project.

#### After Modifying a Module

```bash
# Clear Drupal cache
ddev drush cr

# If you modified .info.yml or added new hooks
ddev drush cr
```

#### After Modifying JavaScript in Demo Modules

For modules with Vite builds (React and Vue demos):

```bash
# React demo
cd docroot/modules/custom/dkan_client_demo_react
npm run build

# Vue demo
cd docroot/modules/custom/dkan_client_demo_vue
npm run build

# Then clear Drupal cache
ddev drush cr
```

### Updating Base Module Libraries

When you update the core/react/vue packages, you need to rebuild and copy the IIFE builds:

```bash
# From repository root
cd packages/dkan-client-tools-core
npm run build

# Copy to base module
cp dist/index.global.min.js \
   ../../dkan/docroot/modules/custom/dkan_client_tools_core_base/js/vendor/dkan-client-tools-core.min.js

# Clear Drupal cache
cd ../../dkan
ddev drush cr
```

Repeat for React and Vue base modules as needed.

## Directory Structure

```
dkan/
├── .ddev/                    # DDEV configuration (tracked in git)
├── composer.json             # PHP dependencies (tracked in git)
├── composer.lock             # Locked versions (tracked in git)
├── vendor/                   # Composer dependencies (NOT tracked)
├── docroot/                  # Drupal web root
│   ├── core/                 # Drupal core (NOT tracked)
│   ├── modules/
│   │   ├── contrib/          # Contributed modules (NOT tracked)
│   │   └── custom/           # Our custom modules (TRACKED in git)
│   │       ├── dkan_client_tools_core_base/
│   │       ├── dkan_client_tools_react_base/
│   │       ├── dkan_client_tools_vue_base/
│   │       ├── dkan_client_demo_vanilla/
│   │       ├── dkan_client_demo_react/
│   │       └── dkan_client_demo_vue/
│   ├── themes/               # Themes (NOT tracked)
│   ├── sites/default/files/  # Uploaded files (NOT tracked)
│   └── ...
└── README.md                 # This file (tracked in git)
```

## What's Tracked in Git

To keep the repository size manageable, we only track:

✅ **Tracked:**
- Custom modules in `docroot/modules/custom/`
- DDEV configuration in `.ddev/`
- `composer.json` and `composer.lock`
- This README

❌ **Not Tracked:**
- `vendor/` - Composer dependencies
- `docroot/core/` - Drupal core
- `docroot/modules/contrib/` - Contributed modules
- `docroot/sites/default/files/` - Uploaded files
- `docroot/sites/default/settings.php` - Local settings
- Database dumps
- Generated/compiled files from DDEV

These are managed through Composer and DDEV and will be regenerated when you run `ddev start` and `ddev composer install`.

## Troubleshooting

### DDEV Won't Start
```bash
# Check DDEV status
ddev debug test

# Check Docker/Colima
docker ps

# Restart DDEV
ddev restart
```

### Database Issues
```bash
# Import a database snapshot
ddev import-db --file=.ddev/db_snapshots/snapshot.sql.gz

# Or reinstall Drupal
ddev drush si --account-pass=admin -y
ddev drush en dkan metastore metastore_admin metastore_search harvest sample_content -y
ddev drush dkan:sample-content:create
```

### Permission Errors
```bash
# Fix file permissions
ddev exec chmod -R 755 docroot/sites/default/files
ddev exec chmod 644 docroot/sites/default/settings.php
```

### Clear All Caches
```bash
ddev drush cr              # Drupal cache
ddev drush sql-query "TRUNCATE cache_bootstrap"  # Nuclear option
```

### Module Issues
```bash
# Rebuild module cache
ddev drush cr

# Reinstall a module
ddev drush pm-uninstall dkan_client_demo_vanilla -y
ddev drush en dkan_client_demo_vanilla -y
ddev drush cr
```

## Testing Demo Modules

### Vanilla JavaScript Demo
1. Enable module: `ddev drush en dkan_client_demo_vanilla -y`
2. Place block: Structure > Block layout
3. Find "DKAN Dataset Search (Vanilla)" and place in a region
4. Visit a page with the block

### React Demo
1. Build the module: `cd docroot/modules/custom/dkan_client_demo_react && npm run build`
2. Enable module: `ddev drush en dkan_client_demo_react -y`
3. Clear cache: `ddev drush cr`
4. Place block: Structure > Block layout
5. Find "DKAN Dataset Search (React)" and place in a region

### Vue Demo
1. Build the module: `cd docroot/modules/custom/dkan_client_demo_vue && npm run build`
2. Enable module: `ddev drush en dkan_client_demo_vue -y`
3. Clear cache: `ddev drush cr`
4. Place block: Structure > Block layout
5. Find "DKAN Dataset Search (Vue)" and place in a region

## Learn More

- [DDEV Documentation](https://ddev.readthedocs.io/)
- [DKAN Documentation](https://docs.getdkan.org/)
- [Drupal Documentation](https://www.drupal.org/docs)
- [Main Project README](../README.md)
