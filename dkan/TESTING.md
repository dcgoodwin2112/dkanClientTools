# DKAN Client Tools - Testing Guide

Comprehensive testing procedures for automated setup functionality.

## Test Scenarios

### 1. Fresh Install Validation

**Objective**: Verify automated setup works on a fresh Drupal installation.

**Prerequisites**: Clean checkout, DDEV installed

**Steps**:
```bash
cd dkan

# Install Drupal
ddev drush si --account-pass=admin -y

# Start DDEV (triggers post-start hook)
ddev start
```

**Verification**:
- [ ] No errors during `ddev start`
- [ ] Setup script output shows all 10 steps completing
- [ ] All modules enabled: `ddev drush pml --filter=dkan_client`
- [ ] 49 datasets imported: `ddev drush dkan:dataset-list | wc -l`
- [ ] Demo pages exist at `/vanilla-demo`, `/react-demo`, `/vue-demo`
- [ ] Blocks visible on each demo page
- [ ] Site accessible at https://dkan.ddev.site

---

### 2. Manual Script Execution

**Objective**: Test manual execution of setup script.

**Prerequisites**: Drupal installed, DDEV running

**Steps**:
```bash
ddev exec bash scripts/setup-site.sh
```

**Verification**:
- [ ] Script completes without errors
- [ ] Color-coded output visible (green ✓, yellow ⚠, red ✗)
- [ ] All 10 steps execute in order
- [ ] Final summary displays demo page URLs
- [ ] Admin credentials shown in output

---

### 3. Clean Refresh via Drush Command

**Objective**: Verify clean refresh functionality using Drush command.

**Prerequisites**: Setup already completed once

**Steps**:
```bash
# Run clean refresh via Drush
ddev drush dkan-client:setup --clean
```

**Verification**:
- [ ] All demo content removed before recreation
- [ ] Sample datasets removed (harvest reverted)
- [ ] 3 demo pages recreated successfully
- [ ] 3 blocks recreated and placed correctly
- [ ] Data dictionaries recreated
- [ ] No errors during cleanup or recreation
- [ ] Demo pages functional after clean refresh

---

### 4. Clean Refresh via Bash Script

**Objective**: Verify clean refresh functionality using bash script.

**Prerequisites**: Setup already completed once

**Steps**:
```bash
# Run clean refresh via bash script
ddev exec bash scripts/setup-site.sh -c
```

**Verification**:
- [ ] All demo content removed before recreation
- [ ] Sample datasets removed (harvest reverted)
- [ ] 3 demo pages recreated successfully
- [ ] 3 blocks recreated and placed correctly
- [ ] Data dictionaries recreated
- [ ] No errors during cleanup or recreation
- [ ] Demo pages functional after clean refresh
- [ ] Same result as Drush variant (Scenario 3)

---

### 5. Idempotency Test

**Objective**: Verify scripts can be run multiple times safely.

**Prerequisites**: Setup already completed once

**Steps**:
```bash
# Run setup script 3 times
ddev exec bash scripts/setup-site.sh
ddev exec bash scripts/setup-site.sh
ddev exec bash scripts/setup-site.sh
```

**Verification**:
- [ ] No errors on any run
- [ ] "already exists" or "already enabled" messages appear
- [ ] No duplicate pages created
- [ ] No duplicate blocks created
- [ ] Dataset count remains consistent
- [ ] Each run completes successfully

---

### 6. Individual Command Verification

**Objective**: Test each Drush command individually.

**Prerequisites**: Drupal installed, modules enabled

**Steps**:
```bash
# Test create-demo-pages
ddev drush dkan-client:create-demo-pages

# Test place-blocks
ddev drush dkan-client:place-blocks

# Test complete setup
ddev drush dkan-client:setup
```

**Verification**:
- [ ] `create-demo-pages` creates 3 pages
- [ ] Pages have correct titles and paths
- [ ] `place-blocks` creates 3 blocks
- [ ] Blocks have correct visibility settings
- [ ] `setup` command runs both operations
- [ ] All commands are idempotent

---

### 7. Environment Variable Configuration

**Objective**: Verify environment variables are accessible.

**Prerequisites**: DDEV running

**Steps**:
```bash
# Check variables in DDEV
ddev exec echo "\$DKAN_URL"
ddev exec echo "\$DKAN_USER"
ddev exec echo "\$DKAN_PASS"

# Test with npm script
npm run record:api:readonly
```

**Verification**:
- [ ] DKAN_URL returns: https://dkan.ddev.site
- [ ] DKAN_USER returns: admin
- [ ] DKAN_PASS returns: admin
- [ ] npm script successfully uses variables
- [ ] API calls succeed with credentials

---

### 8. Data Dictionary Creation

**Objective**: Test automated data dictionary generation via Drush command.

**Prerequisites**: Sample datasets imported with datastore tables

**Steps**:
```bash
# Verify datastore tables exist
ddev drush dkan:datastore:list

# Run data dictionary creation
ddev drush dkan-client:create-data-dictionaries

# Verify dictionaries were created
ddev drush sql-query "SELECT identifier FROM metastore WHERE data_type='distribution' AND identifier LIKE '%-dict'"
```

**Verification**:
- [ ] Datastore tables exist before running command
- [ ] Command completes without errors
- [ ] Data dictionaries created for distributions with datastore tables
- [ ] Dictionary identifiers follow pattern: `{distribution-id}-dict`
- [ ] Dictionaries contain table schema information
- [ ] Running command again skips existing dictionaries (idempotent)

---

### 9. Data Dictionary Field Type Mapping

**Objective**: Verify field type mapping from Drupal schema to Frictionless format.

**Prerequisites**: Sample datasets with datastore tables

**Steps**:
```bash
# Create data dictionaries
ddev drush dkan-client:create-data-dictionaries

# Fetch a data dictionary to examine field types
ddev drush dkan:metastore:get distribution [distribution-id]-dict
```

**Verification**:
- [ ] Drupal `varchar` fields mapped to Frictionless `string`
- [ ] Drupal `int` fields mapped to Frictionless `integer`
- [ ] Drupal `decimal` fields mapped to Frictionless `number`
- [ ] Drupal `tinyint` fields mapped to Frictionless `boolean`
- [ ] Drupal `datetime` fields mapped to Frictionless `date`
- [ ] Field names preserved correctly
- [ ] Schema structure follows Frictionless Table Schema spec

---

### 10. Alias Command Testing

**Objective**: Verify short command aliases work correctly.

**Prerequisites**: Drupal installed, `dkan_client_setup` module enabled

**Steps**:
```bash
# Test create-demo-pages alias
ddev drush dkan-client-pages

# Test place-blocks alias
ddev drush dkan-client-blocks

# Test create-data-dictionaries alias
ddev drush dkan-client-dictionaries

# Test setup alias
ddev drush dkan-client-demo-setup
```

**Verification**:
- [ ] `dkan-client-pages` creates demo pages (same as `dkan-client:create-demo-pages`)
- [ ] `dkan-client-blocks` places blocks (same as `dkan-client:place-blocks`)
- [ ] `dkan-client-dictionaries` creates dictionaries (same as `dkan-client:create-data-dictionaries`)
- [ ] `dkan-client-demo-setup` runs full setup (same as `dkan-client:setup`)
- [ ] All aliases produce identical results to full commands
- [ ] `--clean` flag works with `dkan-client-demo-setup --clean`

---

## Acceptance Criteria Summary

All 10 test scenarios must pass for complete validation:

1. ✓ Fresh install completes without errors
2. ✓ Manual script execution succeeds
3. ✓ Clean refresh via Drush command works correctly
4. ✓ Clean refresh via bash script works correctly
5. ✓ Multiple runs don't create duplicates (idempotency)
6. ✓ Individual Drush commands work correctly
7. ✓ Environment variables accessible
8. ✓ Data dictionary creation works via Drush command
9. ✓ Data dictionary field type mapping correct
10. ✓ Command aliases work correctly

## Running Full Test Suite

To execute all tests sequentially:

```bash
# 1. Fresh install
ddev delete -O && cd dkan && ddev start && ddev drush si --account-pass=admin -y

# 2. Manual execution
ddev exec bash scripts/setup-site.sh

# 3. Clean refresh via Drush
ddev drush dkan-client:setup --clean

# 4. Clean refresh via bash script
ddev exec bash scripts/setup-site.sh -c

# 5. Idempotency (run 3 times)
ddev exec bash scripts/setup-site.sh
ddev exec bash scripts/setup-site.sh
ddev exec bash scripts/setup-site.sh

# 6. Individual commands
ddev drush dkan-client:create-demo-pages
ddev drush dkan-client:place-blocks
ddev drush dkan-client:create-data-dictionaries
ddev drush dkan-client:setup

# 7. Environment variables
ddev exec echo "\$DKAN_URL" && ddev exec echo "\$DKAN_USER"

# 8. Data dictionary creation
ddev drush dkan:datastore:list
ddev drush dkan-client:create-data-dictionaries

# 9. Data dictionary field type mapping
ddev drush dkan:metastore:get distribution [distribution-id]-dict

# 10. Alias commands
ddev drush dkan-client-pages
ddev drush dkan-client-blocks
ddev drush dkan-client-dictionaries
ddev drush dkan-client-demo-setup
```

## Reporting Issues

If any test fails:

1. Document the failing test number
2. Copy error messages
3. Note environment details (OS, DDEV version, Docker version)
4. Create GitHub issue with:
   - Test scenario number
   - Steps to reproduce
   - Expected vs actual behavior
   - Error output
