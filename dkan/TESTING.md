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

### 3. Idempotency Test

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

### 4. Individual Command Verification

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

### 5. Environment Variable Configuration

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

### 6. Data Dictionary Creation

**Objective**: Test automated data dictionary generation.

**Prerequisites**: Sample datasets imported

**Steps**:
```bash
# Check if script exists
ls -la scripts/create-data-dictionaries.ts

# Run from project root (if exists)
cd ../.. && npx tsx scripts/create-data-dictionaries.ts

# Or run via setup script
cd dkan && ddev exec bash scripts/setup-site.sh
```

**Verification**:
- [ ] Script found (or warning displayed if not found)
- [ ] Data dictionaries created for sample datasets
- [ ] No errors during generation
- [ ] Setup script continues even if script missing

---

### 7. Complete Site Rebuild

**Objective**: Test complete rebuild workflow.

**Prerequisites**: DDEV running

**Steps**:
```bash
# Run rebuild script (answer "yes" to confirmation)
ddev exec bash scripts/rebuild-site.sh
```

**Verification**:
- [ ] Confirmation prompt appears
- [ ] Database wiped (Drupal reinstalled)
- [ ] Setup script runs automatically
- [ ] All modules reinstalled
- [ ] Sample data recreated
- [ ] Demo pages recreated
- [ ] Blocks replaced
- [ ] Site fully functional after rebuild

---

### 8. Error Handling

**Objective**: Test graceful handling of error conditions.

**Prerequisites**: DDEV running

**Test Cases**:

**A. Drupal Not Installed**:
```bash
# Stop DDEV and remove database
ddev stop
ddev delete -O
ddev start

# Run setup script
ddev exec bash scripts/setup-site.sh
```
**Verify**: Error message about Drupal not installed

**B. Missing Module**:
```bash
# Uninstall a required module
ddev drush pm-uninstall dkan -y

# Run setup
ddev exec bash scripts/setup-site.sh
```
**Verify**: Module gets re-enabled

**C. Demo Module Not Enabled**:
```bash
# Disable demo modules
ddev drush pm-uninstall dkan_client_demo_vanilla dkan_client_demo_react dkan_client_demo_vue -y

# Place blocks
ddev drush dkan-client:place-blocks
```
**Verify**: Warning about missing block plugins

**Verification**:
- [ ] Appropriate error messages displayed
- [ ] Scripts exit gracefully on critical errors
- [ ] Warnings shown for non-critical issues
- [ ] Recovery steps suggested in output

---

## Acceptance Criteria Summary

All 8 test scenarios must pass for complete validation:

1. ✓ Fresh install completes without errors
2. ✓ Manual script execution succeeds
3. ✓ Multiple runs don't create duplicates (idempotency)
4. ✓ Individual Drush commands work correctly
5. ✓ Environment variables accessible
6. ✓ Data dictionary generation works
7. ✓ Complete rebuild succeeds
8. ✓ Error conditions handled gracefully

## Running Full Test Suite

To execute all tests sequentially:

```bash
# 1. Fresh install
ddev delete -O && cd dkan && ddev start && ddev drush si --account-pass=admin -y

# 2. Manual execution
ddev exec bash scripts/setup-site.sh

# 3. Idempotency (run 3 times)
ddev exec bash scripts/setup-site.sh
ddev exec bash scripts/setup-site.sh
ddev exec bash scripts/setup-site.sh

# 4. Individual commands
ddev drush dkan-client:create-demo-pages
ddev drush dkan-client:place-blocks
ddev drush dkan-client:setup

# 5. Environment variables
ddev exec echo "\$DKAN_URL" && ddev exec echo "\$DKAN_USER"

# 6. Data dictionary
cd ../.. && npx tsx scripts/create-data-dictionaries.ts

# 7. Complete rebuild
cd dkan && ddev exec bash scripts/rebuild-site.sh  # Answer "yes"

# 8. Error handling (manual verification required)
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
