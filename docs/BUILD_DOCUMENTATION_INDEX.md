# DKAN Client Tools - Build Process Documentation Index

Complete documentation of the build process, architecture, and development workflow.

## Quick Navigation

### Start Here
1. **BUILD_EXPLORATION_SUMMARY.md** (8.7KB)
   - Executive overview
   - Key findings at a glance
   - Improvement opportunities
   - Next steps
   - Best for: Decision makers, project leads

### Technical Deep Dives
2. **research/BUILD_PROCESS_ANALYSIS.md** (17KB)
   - Detailed technical breakdown
   - Current manual workflow steps
   - Pain points analysis
   - File mappings and build outputs
   - Best for: Developers, architects

3. **research/BUILD_ARCHITECTURE_DIAGRAM.md** (30KB)
   - Visual ASCII diagrams
   - Directory structure
   - Data flow diagrams
   - Dependency graphs
   - Build command reference
   - Technology stack breakdown
   - Best for: Visual learners, documentation

### Framework-Specific Guides
4. **research/DRUPAL_REACT_VITE_BUILD_PATTERNS.md** (45KB)
   - React-specific Drupal integration
   - Vite configuration details
   - Drupal block plugin patterns
   - Best for: React developers, Drupal module creators

## Document Overview

### BUILD_EXPLORATION_SUMMARY.md
**Purpose**: Executive summary of entire build exploration

**Contains**:
- Project structure overview
- Build tools matrix
- Current outputs (3 packages, 3 demo modules)
- 8-step manual workflow
- Drupal module organization
- Source-to-destination mappings
- Dependency relationships
- Improvement opportunities by timeline
- Technology stack summary
- Decision points
- Next steps

**When to Read**: First time understanding the build system

---

### BUILD_PROCESS_ANALYSIS.md (in /research/)
**Purpose**: Complete technical analysis of build process

**Contains**:
- NPM monorepo structure
- Core packages breakdown:
  - dkan-client-tools-core (40KB)
  - dkan-client-tools-react (205KB, self-contained)
  - dkan-client-tools-vue (240KB full, 174KB runtime)
- Drupal module structure (6 modules total)
- Base modules (3) providing shared libraries
- Demo modules (3) showing integration
- Examples directory structure
- Current manual build process (8 steps)
- Build output summary table
- Pain points (8 identified)
- Improvement opportunities
- Files modified during build
- Conclusion on current state

**When to Read**: Need detailed understanding of technical setup

---

### BUILD_ARCHITECTURE_DIAGRAM.md (in /research/)
**Purpose**: Visual representation of build system

**Contains**:
1. **Directory Structure** - Tree view of all components
2. **Build Flow Diagram** - tsup and Vite build processes
3. **Dependency Graph** - Module and package dependencies
4. **Build Tool Matrix** - Tool analysis for each component
5. **Data Flow** - Package to Drupal module workflow
6. **Format Decision Tree** - When to use which format
7. **File Mapping Table** - Source to destination mapping
8. **Build Commands Reference** - All available commands
9. **Technology Stack Summary** - Full tech breakdown
10. **Improvement Opportunities** - Current vs ideal state

**When to Read**: Need visual understanding or reference guide

---

### DRUPAL_REACT_VITE_BUILD_PATTERNS.md (in /research/)
**Purpose**: React-specific patterns for Drupal integration

**Contains**:
- React library setup in Drupal
- Vite configuration for React
- Externalization strategy
- React component patterns
- Block plugin implementation
- Best practices for Drupal+React
- Troubleshooting guide

**When to Read**: Building or maintaining React modules for Drupal

---

## Key Statistics

### Project Scale
- **Packages**: 3 (core, react, vue)
- **Drupal Modules**: 6 (3 base + 3 demo)
- **Demo Apps**: 3 (react, vue, vanilla)
- **Test Coverage**: 300+ tests across all packages
- **Total Lines**: 1,448 lines of documentation (3 files)

### Build Outputs
- **Core**: 40KB (minified IIFE)
- **React**: 205KB (minified IIFE, self-contained)
- **Vue Full**: 240KB (minified IIFE with compiler)
- **Vue Runtime**: 174KB (minified IIFE without compiler)
- **React Demo**: 486KB (Vite bundle)
- **Vue Demo**: 250KB (Vite bundle)

### Build Tools
- **tsup**: Package builds (ESM/CJS/IIFE)
- **Vite**: Demo modules (React/Vue widgets)
- **Vitest**: Testing (300+ tests)
- **TypeScript**: Type safety

---

## Navigation by Role

### I'm a Developer
1. Read: BUILD_EXPLORATION_SUMMARY.md (quick overview)
2. Read: BUILD_PROCESS_ANALYSIS.md (technical details)
3. Reference: BUILD_ARCHITECTURE_DIAGRAM.md (as needed)

### I'm a Project Lead
1. Read: BUILD_EXPLORATION_SUMMARY.md (key findings)
2. Skim: Improvement Opportunities section
3. Review: Decision Points section

### I'm a DevOps Engineer
1. Read: BUILD_ARCHITECTURE_DIAGRAM.md (full overview)
2. Reference: Build Commands section
3. Read: BUILD_PROCESS_ANALYSIS.md (workflow details)

### I'm Building React Modules
1. Read: DRUPAL_REACT_VITE_BUILD_PATTERNS.md (comprehensive guide)
2. Reference: React demo module code
3. Cross-reference: BUILD_ARCHITECTURE_DIAGRAM.md (if questions)

### I'm Building Vue Modules
1. Read: BUILD_ARCHITECTURE_DIAGRAM.md (Vue section)
2. Read: BUILD_PROCESS_ANALYSIS.md (Vue package details)
3. Build from dkan_client_demo_vue example

### I'm New to the Project
1. Read: BUILD_EXPLORATION_SUMMARY.md (start here)
2. Explore: Directory structure in BUILD_ARCHITECTURE_DIAGRAM.md
3. Understand: Dependency Graph in BUILD_ARCHITECTURE_DIAGRAM.md
4. Study: BUILD_PROCESS_ANALYSIS.md (full context)

---

## File Locations

### Main Documentation
```
/dkanClientTools/
├── docs/
│   └── BUILD_DOCUMENTATION_INDEX.md     ← You are here
└── research/
    ├── BUILD_EXPLORATION_SUMMARY.md     (Executive summary)
    ├── BUILD_PROCESS_ANALYSIS.md        (Technical details)
    ├── BUILD_ARCHITECTURE_DIAGRAM.md    (Visual diagrams)
    └── DRUPAL_REACT_VITE_BUILD_PATTERNS.md (React guide)
```

### Source Code References
```
/dkanClientTools/
├── packages/                            (3 core packages)
│   ├── dkan-client-tools-core/
│   ├── dkan-client-tools-react/
│   └── dkan-client-tools-vue/
├── examples/                            (Standalone apps)
│   ├── react-demo-app/
│   ├── vue-demo-app/
│   ├── vanilla-demo-app/
│   ├── drupal-base-modules/             (Symlinks)
│   ├── drupal-demo-module-react/        (Symlink)
│   ├── drupal-demo-module-vue/          (Symlink)
│   └── drupal-demo-module-vanilla/      (Symlink)
└── dkan/
    └── docroot/modules/custom/          (6 Drupal modules)
        ├── dkan_client_tools_core_base/
        ├── dkan_client_tools_react_base/
        ├── dkan_client_tools_vue_base/
        ├── dkan_client_demo_vanilla/
        ├── dkan_client_demo_react/
        └── dkan_client_demo_vue/
```

---

## Common Questions

**Q: Where do I start to understand the build process?**
A: Read BUILD_EXPLORATION_SUMMARY.md, then BUILD_ARCHITECTURE_DIAGRAM.md

**Q: How do I build everything?**
A: See "Full Build Workflow" in BUILD_ARCHITECTURE_DIAGRAM.md

**Q: What are the pain points?**
A: See "Pain Points in Current Process" in BUILD_PROCESS_ANALYSIS.md

**Q: How do I improve the build?**
A: See "Improvement Opportunities" in BUILD_EXPLORATION_SUMMARY.md

**Q: What's the dependency graph?**
A: See section 3 in BUILD_ARCHITECTURE_DIAGRAM.md

**Q: How do I build just one package?**
A: See "Build Commands Reference" in BUILD_ARCHITECTURE_DIAGRAM.md

**Q: Where do files get copied to Drupal?**
A: See "Deployment Mapping" in BUILD_EXPLORATION_SUMMARY.md

**Q: What's the current workflow?**
A: See "Current Manual Workflow" in BUILD_EXPLORATION_SUMMARY.md

**Q: How do I integrate React into Drupal?**
A: See DRUPAL_REACT_VITE_BUILD_PATTERNS.md

---

## Maintenance Notes

### When to Update Documentation
- Package versions change (tsup, Vite, React, Vue)
- Build process changes
- New modules added
- Drupal version upgraded
- Build tools replaced

### How to Update
1. Update corresponding analysis document
2. Update this index if file structure changes
3. Keep summaries in sync with technical docs
4. Update diagrams if architecture changes

### Version Tracking
- Last Updated: November 11, 2025
- Documentation Generation: Claude Code
- Build System Version: Current as of date above

---

## Conclusion

This documentation provides comprehensive coverage of the DKAN Client Tools build system:
- 1,448 lines across 3 technical documents
- Visual diagrams and flow charts
- Step-by-step instructions
- Improvement recommendations
- Framework-specific guides

Use this index to navigate the documentation based on your role and needs.

**Start with**: BUILD_EXPLORATION_SUMMARY.md  
**Then read**: BUILD_ARCHITECTURE_DIAGRAM.md  
**For details**: BUILD_PROCESS_ANALYSIS.md  
**For React**: DRUPAL_REACT_VITE_BUILD_PATTERNS.md

