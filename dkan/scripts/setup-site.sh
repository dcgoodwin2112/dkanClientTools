#!/bin/bash

#
# DKAN Site Setup Script
#
# Automates complete DKAN development environment setup.
# Idempotent - safe to run multiple times.
#
# Usage:
#   ./setup-site.sh       # Normal idempotent setup
#   ./setup-site.sh -c    # Clean refresh (removes all demo content and sample datasets first)
#

set -e  # Exit on error

# Parse command line options
CLEAN_FIRST=false
while getopts "c" opt; do
  case $opt in
    c)
      CLEAN_FIRST=true
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      echo "Usage: $0 [-c]" >&2
      echo "  -c  Clean refresh (remove existing demo content and sample datasets first)" >&2
      exit 1
      ;;
  esac
done

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Success checkmark
CHECK="${GREEN}✓${NC}"
WARN="${YELLOW}⚠${NC}"
ERROR="${RED}✗${NC}"

echo ""
echo "========================================="
echo " DKAN Client Tools - Site Setup"
if [ "$CLEAN_FIRST" = true ]; then
  echo " (Clean Refresh Mode)"
fi
echo "========================================="
echo ""

# Clean existing content if requested
if [ "$CLEAN_FIRST" = true ]; then
  echo -e "${YELLOW}Clean mode enabled - removing existing demo content and sample datasets...${NC}"
  echo ""
  drush dkan-client:setup --clean
  echo ""
  echo -e "${CHECK} Clean refresh complete!"
  echo ""
  exit 0
fi

# Step 1: Verify Drupal installation
echo -e "${CHECK} Step 1/11: Verifying Drupal installation..."
if drush status --field=bootstrap 2>/dev/null | grep -q "Successful"; then
  echo -e "  ${CHECK} Drupal is installed"
else
  echo -e "  ${WARN} Drupal not installed. Run 'drush si -y' first"
  echo -e "  ${WARN} Then use 'ddev drush uli' to generate admin login link"
  exit 1
fi

# Step 2: Enable DKAN core modules
echo -e "${CHECK} Step 2/11: Enabling DKAN core modules..."
CORE_MODULES="dkan metastore metastore_admin metastore_search harvest"
MISSING_MODULES=""
for module in $CORE_MODULES; do
  if ! drush pm:list --status=enabled --format=list | grep -q "^${module}$"; then
    MISSING_MODULES="$MISSING_MODULES $module"
  fi
done

if [ -z "$MISSING_MODULES" ]; then
  echo -e "  ${CHECK} DKAN core modules already enabled"
else
  drush en $MISSING_MODULES -y
  echo -e "  ${CHECK} DKAN core modules enabled"
fi

# Step 3: Enable base library modules
echo -e "${CHECK} Step 3/11: Enabling base library modules..."
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
echo -e "${CHECK} Step 4/11: Enabling demo modules..."
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
echo -e "${CHECK} Step 5/11: Enabling setup module..."
if drush pm:list --status=enabled --format=list | grep -q "^dkan_client_setup$"; then
  echo -e "  ${CHECK} dkan_client_setup already enabled"
else
  drush en dkan_client_setup -y
  echo -e "  ${CHECK} dkan_client_setup enabled"
fi

# Step 6: Create API user with auto-generated credentials
echo -e "${CHECK} Step 6/11: Creating DKAN API user..."
# Check if running interactively (has TTY) or from automation
if [ -t 0 ]; then
  # Interactive mode - prompt for DKAN URL
  echo ""
  read -p "Enter DKAN site URL [https://dkan.ddev.site]: " DKAN_URL_INPUT
  DKAN_URL="${DKAN_URL_INPUT:-https://dkan.ddev.site}"
  echo -e "  Using DKAN URL: ${DKAN_URL}"
else
  # Non-interactive mode (e.g., from DDEV post-start hook)
  # Use environment variable or default
  DKAN_URL="${DKAN_URL:-https://dkan.ddev.site}"
  echo -e "  Using DKAN URL: ${DKAN_URL} (set DKAN_URL env var to customize)"
fi
# Always run the command - it will check if credentials exist and skip if needed
# The Drush command auto-detects project root and saves to .env file
drush dkan-client:create-api-user --dkan-url="${DKAN_URL}"

# Step 7: Import sample content (49 datasets)
echo -e "${CHECK} Step 7/11: Importing sample datasets..."
# Check if sample content already exists
# Note: We expect 49 datasets but use threshold of 40 to allow for import flexibility
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

# Step 8: Create demo pages
echo -e "${CHECK} Step 8/11: Creating demo pages..."
drush dkan-client:create-demo-pages
echo -e "  ${CHECK} Demo pages created"

# Step 9: Place blocks
echo -e "${CHECK} Step 9/11: Placing blocks..."
drush dkan-client:place-blocks
echo -e "  ${CHECK} Blocks placed"

# Step 10: Generate data dictionaries
echo -e "${CHECK} Step 10/11: Generating data dictionaries..."
drush dkan-client:create-data-dictionaries
echo -e "  ${CHECK} Data dictionaries generated"

# Step 11: Clear cache
echo -e "${CHECK} Step 11/11: Clearing cache..."
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
echo "Admin access:"
echo "  • Generate login link: ddev drush uli"
echo "  • Secure, passwordless one-time login"
echo ""
echo "API credentials:"
echo "  • User: dkan-api-user"
echo "  • Password: (auto-generated in .env)"
echo "  • Location: .env (project root and dkan/.env)"
echo "  • Used by: API scripts, testing tools, and client libraries"
echo ""
