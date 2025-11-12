#!/usr/bin/env bash

# Repository Cleanup Script
# Implements Phase 1 recommendations from PROJECT_ORGANIZATION_RECOMMENDATIONS.md

set -e  # Exit on error

echo "=================================================="
echo "dkanClientTools Repository Cleanup"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must be run from repository root${NC}"
    exit 1
fi

if ! grep -q "dkan-client-tools" package.json; then
    echo -e "${RED}Error: Not in dkanClientTools repository${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found dkanClientTools repository"
echo ""

# Step 1: Remove temporary files
echo "Step 1: Removing temporary files..."
TEMP_FILES=(
    "packages/dkan-client-tools-react/temp-analysis.js"
    "packages/dkan-client-tools-vue/temp-analysis.js"
    "packages/dkan-client-tools-vue/temp-runtime-only.js"
)

for file in "${TEMP_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo -e "${GREEN}✓${NC} Removed $file"
    else
        echo -e "${YELLOW}⊘${NC} Not found: $file (already clean)"
    fi
done
echo ""

# Step 2: Update .gitignore
echo "Step 2: Updating .gitignore..."

# Check if patterns already exist
NEEDS_UPDATE=false
if ! grep -q "temp-\*.js" .gitignore 2>/dev/null; then
    NEEDS_UPDATE=true
fi

if [ "$NEEDS_UPDATE" = true ]; then
    cat >> .gitignore << 'EOF'

# Temporary development files
temp-*.js
temp-*.ts
scratch/
.tmp/

# TypeScript incremental build cache
*.tsbuildinfo

# macOS
.DS_Store
.AppleDouble
.LSOverride

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Editor backup files
*~
*.bak
EOF
    echo -e "${GREEN}✓${NC} Updated .gitignore with new patterns"
else
    echo -e "${YELLOW}⊘${NC} .gitignore already contains cleanup patterns"
fi
echo ""

# Step 3: Remove build cache files
echo "Step 3: Removing TypeScript build cache files..."
TSBUILDINFO_COUNT=$(find . -name "*.tsbuildinfo" -type f | wc -l | tr -d ' ')

if [ "$TSBUILDINFO_COUNT" -gt 0 ]; then
    find . -name "*.tsbuildinfo" -type f -delete
    echo -e "${GREEN}✓${NC} Removed $TSBUILDINFO_COUNT *.tsbuildinfo file(s)"
else
    echo -e "${YELLOW}⊘${NC} No *.tsbuildinfo files found (already clean)"
fi

# Remove from git index if tracked
if git ls-files | grep -q '\.tsbuildinfo$'; then
    git rm --cached $(git ls-files | grep '\.tsbuildinfo$') 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Removed *.tsbuildinfo files from git index"
fi
echo ""

# Step 4: Handle .vscode directory
echo "Step 4: Checking IDE settings..."
if [ -d "examples/vue-demo-app/.vscode" ]; then
    echo -e "${YELLOW}Found .vscode/ directory in vue-demo-app${NC}"
    echo ""
    echo "Choose an option:"
    echo "  1) Remove .vscode/ directory (let developers use their own settings)"
    echo "  2) Keep it (will be gitignored for other projects)"
    echo "  3) Skip this step"
    echo ""
    read -p "Enter choice [1-3]: " vscode_choice

    case $vscode_choice in
        1)
            rm -rf examples/vue-demo-app/.vscode
            echo -e "${GREEN}✓${NC} Removed examples/vue-demo-app/.vscode/"
            ;;
        2)
            echo -e "${YELLOW}⊘${NC} Kept .vscode/ directory (will be gitignored in future)"
            ;;
        3)
            echo -e "${YELLOW}⊘${NC} Skipped .vscode/ cleanup"
            ;;
        *)
            echo -e "${RED}Invalid choice, skipping${NC}"
            ;;
    esac
else
    echo -e "${GREEN}✓${NC} No .vscode/ directory found (already clean)"
fi
echo ""

# Step 5: Summary
echo "=================================================="
echo "Cleanup Summary"
echo "=================================================="
echo ""

# Check git status
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${GREEN}✓${NC} No changes detected - repository was already clean"
else
    echo -e "${YELLOW}Changes detected:${NC}"
    echo ""
    git status --short
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git diff"
    echo "  2. Commit changes: git add -A && git commit -m 'chore: clean up repository'"
fi

echo ""
echo -e "${GREEN}Repository cleanup complete!${NC}"
