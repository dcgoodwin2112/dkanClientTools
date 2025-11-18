#!/bin/bash

#
# DKAN Site Rebuild Script
#
# Reinstalls Drupal and runs complete setup automation.
# WARNING: This will destroy the existing database!
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

echo ""
echo "========================================="
echo " DKAN Client Tools - Site Rebuild"
echo "========================================="
echo ""
echo -e "${WARN} ${YELLOW}WARNING:${NC} This will destroy the existing database!"
echo -e "${WARN} ${YELLOW}NOTE:${NC} Existing API credentials in .env will be backed up to .env.backup"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "Rebuild cancelled."
  exit 0
fi

echo -e "${CHECK} Starting site rebuild..."
echo ""

# Step 1: Reinstall Drupal
echo -e "${CHECK} Reinstalling Drupal..."
drush si --account-pass=admin -y
echo -e "  ${CHECK} Drupal reinstalled"
echo ""

# Step 2: Run setup script
echo -e "${CHECK} Running automated setup..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/setup-site.sh"

echo ""
echo "========================================="
echo -e " ${GREEN}Rebuild Complete!${NC}"
echo "========================================="
echo ""
