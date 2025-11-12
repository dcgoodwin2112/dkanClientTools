# Build Process Exploration - Executive Summary

**Date**: November 11, 2025  
**Scope**: Complete analysis of dkanClientTools build process and structure  
**Status**: Comprehensive documentation complete  
**Location**: `/research/` directory

---

## Overview

You now have **three comprehensive documents** documenting the build process:

1. **BUILD_PROCESS_ANALYSIS.md** (17KB)
   - Detailed technical breakdown of current build process
   - Pain points and opportunities for improvement
   - File mappings and build outputs
   - Manual workflow documentation

2. **BUILD_ARCHITECTURE_DIAGRAM.md** (30KB)
   - Visual ASCII diagrams and flow charts
   - Directory structure overview
   - Dependency graphs
   - Technology stack breakdown
   - Build commands reference

3. **DRUPAL_REACT_VITE_BUILD_PATTERNS.md** (45KB, pre-existing)
   - React-specific Drupal integration patterns
   - Vite configuration details
   - Drupal block plugin patterns

---

## Key Findings

### Project Structure

**3-Layer Architecture:**
1. **NPM Monorepo** (packages + examples)
2. **Drupal Modules** (6 modules: 3 base + 3 demo)
3. **Standalone Demo Apps** (React, Vue, Vanilla)

**Workspace Configuration:**
```
Root package.json
├── packages/ (3 core packages)
│   ├── dkan-client-tools-core (40KB minified)
│   ├── dkan-client-tools-react (205KB self-contained)
│   └── dkan-client-tools-vue (240KB full, 174KB runtime)
└── examples/ (standalone apps + symlinks)
```

---

### Build Tools Used

| Component | Tool | Purpose |
|-----------|------|---------|
| Core/React/Vue packages | **tsup** | Multi-format builds (ESM/CJS/IIFE) |
| Demo React module | **Vite** | React widget bundling |
| Demo Vue module | **Vite** | Vue SFC pre-compilation |
| Testing | **Vitest** | 300+ unit tests |
| Type checking | **TypeScript** | Full type safety |

---

### Current Build Outputs

**Package Builds (tsup):**
- Core: ESM (35KB) + CJS (35KB) + IIFE (40KB minified)
- React: ESM (1.1MB) + CJS (1.1MB) + IIFE (205KB minified, self-contained)
- Vue: ESM (21KB) + CJS (25KB) + Multiple IIFEs
  - Full with compiler (240KB minified)
  - Runtime only (174KB minified)

**Demo Module Builds (Vite):**
- React demo: 486KB (includes React Query + widget code)
- Vue demo: 250KB (pre-compiled Vue templates)
- Vanilla demo: No build (uses plain JavaScript)

---

### Current Manual Workflow

**8-Step Process:**
1. `npm run build` (all packages)
2. Manually copy core IIFE to `dkan_client_tools_core_base/js/vendor/`
3. Manually copy react IIFE to `dkan_client_tools_react_base/js/vendor/`
4. Manually copy vue IIFEs (2 files) to `dkan_client_tools_vue_base/js/vendor/`
5. Build react demo module (`npm install && npm run build`)
6. Build vue demo module (`npm install && npm run build`)
7. Clear Drupal cache (`ddev drush cr`)
8. Verify in browser

**Pain Points:**
- Manual copying required
- No unified orchestration
- Version sync issues
- Watch mode incomplete
- Vue complexity (4 different builds)

---

### Drupal Module Structure

**Base Modules** (3) - Provide shared libraries:
- `dkan_client_tools_core_base` - Core library
- `dkan_client_tools_react_base` - React + ReactDOM + React Query
- `dkan_client_tools_vue_base` - Vue + Vue Query

**Demo Modules** (3) - Show integration patterns:
- `dkan_client_demo_vanilla` - Plain JavaScript
- `dkan_client_demo_react` - React widgets (Vite build)
- `dkan_client_demo_vue` - Vue widgets (Vite build)

**Key Feature:**
- Base modules provide globals (`window.DkanClientTools*`)
- Demo modules externalize these globals to avoid duplication
- Drupal block plugins make widgets placeable anywhere

---

### Deployment Mapping

**Source → Destination:**

```
packages/dkan-client-tools-core/dist/index.global.min.js (40KB)
  → dkan/docroot/modules/custom/dkan_client_tools_core_base/js/vendor/dkan-client-tools-core.min.js

packages/dkan-client-tools-react/dist/index.global.min.js (205KB)
  → dkan/docroot/modules/custom/dkan_client_tools_react_base/js/vendor/dkan-client-tools-react.min.js

packages/dkan-client-tools-vue/dist/index.global.full.min.js (240KB)
  → dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue.min.js

packages/dkan-client-tools-vue/dist/index-runtime.global.runtime.min.js (174KB)
  → dkan/docroot/modules/custom/dkan_client_tools_vue_base/js/vendor/dkan-client-tools-vue-runtime.min.js
```

---

### Dependency Relationships

**NPM Packages:**
- `dkan-client-tools-react` depends on `dkan-client-tools-core`
- `dkan-client-tools-vue` depends on `dkan-client-tools-core`
- Demo modules use `file:` protocol to reference packages

**Drupal Modules:**
- `dkan_client_demo_vanilla` depends on `dkan_client_tools_core_base`
- `dkan_client_demo_react` depends on `dkan_client_tools_react_base`
- `dkan_client_demo_vue` depends on `dkan_client_tools_vue_base`

---

## Improvement Opportunities

### Immediate (Quick Wins)
1. **Build copy script** - Automate manual copying with npm postbuild hook
2. **Unified build command** - Root script that orchestrates entire workflow
3. **Documentation** - Record this analysis (DONE!)

### Short Term (1-2 weeks)
1. **Automated deployment** - npm script that copies to modules automatically
2. **Watch mode** - Combined watch that rebuilds packages and copies
3. **Build manifest** - Track versions and dependencies

### Medium Term (Monthly)
1. **CI/CD pipeline** - GitHub Actions for automated builds
2. **Vue simplification** - Document which builds are actually used
3. **Development experience** - Faster iteration with better feedback

### Long Term (Ongoing)
1. **Monorepo optimization** - Consider moving demo modules to packages/
2. **Version management** - Automated version sync across packages/modules
3. **Performance** - Code splitting and lazy loading optimization

---

## Technology Stack Summary

**Packages:**
- TypeScript 5.3
- TanStack Query Core/React/Vue 5.x
- React 18 + ReactDOM 18
- Vue 3

**Build Tools:**
- tsup (multi-format builds)
- Vite 7 (demo modules & examples)

**Testing:**
- Vitest (300+ tests)
- React Testing Library
- Vue Test Utils

**Drupal Integration:**
- Drupal 11.2.7
- DKAN 2.21.2
- DDEV (local dev)
- PHP 8.3 + MariaDB 10.11

---

## Decision Points for Build Process Design

### Format Strategy (Current - Sound)
- IIFE format is correct for Drupal (no bundler)
- Global exports enable external widgets
- Self-contained bundles avoid duplication

### Build Tool Split (Current - Works)
- tsup for package builds (multi-format flexibility)
- Vite for demo modules (modern DX)
- Separation makes sense given different needs

### Deployment Approach (Current - Manual, Could Improve)
- Manual copying works but is error-prone
- Opportunity: Automate with npm scripts
- Consider: Build hooks or CI/CD integration

---

## Questions to Answer Before Implementation

1. **How often are packages rebuilt?**
   - Daily development?
   - Before releases?
   - Both?

2. **Who rebuilds?**
   - Individual developers?
   - CI/CD pipeline?
   - Both?

3. **Where are builds deployed?**
   - Local DDEV only?
   - Staging servers?
   - Production?

4. **Version management:**
   - Semantic versioning?
   - Pre-release versions?
   - Single version for all packages?

5. **Demo modules:**
   - Should they be in monorepo or separate?
   - Should they have independent builds?
   - Should they track package versions?

---

## Next Steps

### For Understanding
1. Read BUILD_PROCESS_ANALYSIS.md (detailed technical breakdown)
2. Review BUILD_ARCHITECTURE_DIAGRAM.md (visual overview)
3. Cross-reference with DRUPAL_REACT_VITE_BUILD_PATTERNS.md (React details)

### For Implementation
1. Choose improvement priority (quick wins vs long term)
2. Design build orchestration script
3. Consider CI/CD requirements
4. Plan rollout and testing

### For Documentation
1. Create build process guide for new developers
2. Document version management strategy
3. Record decision points and rationale
4. Create deployment checklist

---

## File Locations

All analysis documents in: `/Users/dgoodwinVA/Sites/dkanClientTools/research/`

- `BUILD_PROCESS_ANALYSIS.md` - Complete technical analysis
- `BUILD_ARCHITECTURE_DIAGRAM.md` - Visual diagrams and flows
- `DRUPAL_REACT_VITE_BUILD_PATTERNS.md` - React-specific patterns
- `BUILD_EXPLORATION_SUMMARY.md` - This file

---

## Conclusion

The current build process is well-architected with:
- Clean separation of concerns (core + adapters + demos)
- Appropriate tool choices (tsup for packages, Vite for demos)
- Sound format strategy (IIFE for Drupal, ESM/CJS for npm)
- Comprehensive test coverage (300+ tests)

The main improvement opportunity is **automating the manual copying and orchestration**, which would:
- Reduce errors
- Speed up development
- Enable CI/CD integration
- Improve developer experience

The foundation is solid. The opportunity is in the workflow automation.

