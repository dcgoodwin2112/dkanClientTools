#!/bin/bash

#
# DKAN Site Setup Script
#
# Automates complete DKAN development environment setup.
# Idempotent - safe to run multiple times.
#

set -e  # Exit on error

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Success checkmark
CHECK="${GREEN}✓${NC}"
WARN="${YELLOW}⚠${NC}"
ERROR="${RED}✗${NC}"

# Load environment variables from project root .env if it exists
ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
  echo -e "${CHECK} Loading environment variables from $ENV_FILE"
  export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
fi

echo ""
echo "========================================="
echo " DKAN Client Tools - Site Setup"
echo "========================================="
echo ""

# Step 1: Verify Drupal installation
echo -e "${CHECK} Step 1/10: Verifying Drupal installation..."
if drush status --field=bootstrap 2>/dev/null | grep -q "Successful"; then
  echo -e "  ${CHECK} Drupal is installed"
else
  echo -e "  ${WARN} Drupal not installed. Run 'drush si --account-pass=admin -y' first"
  exit 1
fi

# Step 2: Enable DKAN core module
echo -e "${CHECK} Step 2/10: Enabling DKAN core module..."
if drush pm:list --status=enabled --format=list | grep -q "^dkan$"; then
  echo -e "  ${CHECK} DKAN already enabled"
else
  drush en dkan -y
  echo -e "  ${CHECK} DKAN enabled"
fi

# Step 3: Enable base library modules
echo -e "${CHECK} Step 3/10: Enabling base library modules..."
BASE_MODULES="dkan_client_tools_core_base dkan_client_tools_react_base dkan_client_tools_vue_base"
for module in $BASE_MODULES; do
  if drush pm:list --status=enabled --format=list | grep -q "^${module}$"; then
    echo -e "  ${CHECK} ${module} already enabled"
  else
    drush en ${module} -y
    echo -e "  ${CHECK} ${module} enabled"
  fi
done

# Step 4: Enable demo modules
echo -e "${CHECK} Step 4/10: Enabling demo modules..."
DEMO_MODULES="dkan_client_demo_vanilla dkan_client_demo_react dkan_client_demo_vue"
for module in $DEMO_MODULES; do
  if drush pm:list --status=enabled --format=list | grep -q "^${module}$"; then
    echo -e "  ${CHECK} ${module} already enabled"
  else
    drush en ${module} -y
    echo -e "  ${CHECK} ${module} enabled"
  fi
done

# Step 5: Enable setup module
echo -e "${CHECK} Step 5/10: Enabling setup module..."
if drush pm:list --status=enabled --format=list | grep -q "^dkan_client_setup$"; then
  echo -e "  ${CHECK} dkan_client_setup already enabled"
else
  drush en dkan_client_setup -y
  echo -e "  ${CHECK} dkan_client_setup enabled"
fi

# Step 6: Import sample content (49 datasets)
echo -e "${CHECK} Step 6/10: Importing sample datasets..."
# Check if sample content already exists
DATASET_COUNT=$(drush dkan:dataset-list --format=list 2>/dev/null | wc -l | tr -d ' ')
if [ "$DATASET_COUNT" -ge "40" ]; then
  echo -e "  ${CHECK} Sample datasets already exist (${DATASET_COUNT} datasets)"
else
  # Enable modules needed for sample content
  if ! drush pm:list --status=enabled --format=list | grep -q "^sample_content$"; then
    drush en sample_content -y
  fi
  drush dkan:sample-content:create
  echo -e "  ${CHECK} Sample datasets imported"
fi

# Step 7: Create demo pages
echo -e "${CHECK} Step 7/10: Creating demo pages..."
drush dkan-client:create-demo-pages
echo -e "  ${CHECK} Demo pages created"

# Step 8: Place blocks
echo -e "${CHECK} Step 8/10: Placing blocks..."
drush dkan-client:place-blocks
echo -e "  ${CHECK} Blocks placed"

# Step 9: Generate data dictionaries
echo -e "${CHECK} Step 9/10: Generating data dictionaries..."
# Check if create-data-dictionaries.ts script exists
DICT_SCRIPT="../../scripts/create-data-dictionaries.ts"
if [ -f "$DICT_SCRIPT" ]; then
  (cd ../.. && npx tsx scripts/create-data-dictionaries.ts)
  echo -e "  ${CHECK} Data dictionaries generated"
else
  echo -e "  ${WARN} Data dictionary script not found at $DICT_SCRIPT"
  echo -e "  ${WARN} Skipping data dictionary generation"
fi

# Step 10: Clear cache
echo -e "${CHECK} Step 10/10: Clearing cache..."
drush cr
echo -e "  ${CHECK} Cache cleared"

echo ""
echo "========================================="
echo -e " ${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Demo pages available at:"
echo "  • https://dkan.ddev.site/vanilla-demo"
echo "  • https://dkan.ddev.site/react-demo"
echo "  • https://dkan.ddev.site/vue-demo"
echo ""
echo "Admin login:"
echo "  • URL: https://dkan.ddev.site/user"
echo "  • Username: admin"
echo "  • Password: admin"
echo ""
