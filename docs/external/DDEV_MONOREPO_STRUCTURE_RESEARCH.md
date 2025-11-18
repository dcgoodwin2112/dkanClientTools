# DDEV Monorepo Structure Research

Research on best practices for managing DDEV Drupal sites within TypeScript monorepo projects, comparing subdirectory vs root placement approaches.

**Research Date**: 2025-11-18
**Context**: dkanClientTools project structure analysis
**Question**: Should the DKAN Drupal site remain in `/dkan` subdirectory or move to project root?

---

## Executive Summary

**Recommendation: Keep DKAN Drupal site in `/dkan` subdirectory**

After extensive research into DDEV best practices, monorepo patterns, developer experience considerations, and AI agent capabilities, the current structure with the Drupal site in a subdirectory is the optimal approach for this project.

**Key Reasons**:
1. Aligns with npm workspaces monorepo conventions (minimal root, organized subdirectories)
2. Clear separation of concerns between TypeScript packages and Drupal development site
3. Better developer experience with explicit project boundaries
4. Superior AI agent navigation and context understanding
5. Cleaner build and deployment workflows
6. Follows real-world monorepo examples (CivicTheme, Drupal core JS packages)

---

## Current Project Structure

```
dkanClientTools/                    # Monorepo root
├── .git/                           # Git repository
├── package.json                    # Root workspace configuration
├── tsconfig.json                   # TypeScript configuration
├── CLAUDE.md                       # AI agent instructions
├── packages/                       # TypeScript packages (npm workspaces)
│   ├── dkan-client-tools-core/
│   ├── dkan-client-tools-react/
│   └── dkan-client-tools-vue/
├── examples/                       # Demo applications (npm workspaces)
│   ├── vanilla-demo-app/
│   ├── react-demo-app/
│   └── vue-demo-app/
├── scripts/                        # Build orchestration scripts
│   ├── build-orchestrator.js
│   └── build-config.js
├── docs/                           # Project documentation
│   ├── ARCHITECTURE.md
│   ├── BUILD_PROCESS.md
│   └── external/                   # External dependency docs
├── dkan/                           # DKAN Drupal development site
│   ├── .ddev/                      # DDEV configuration
│   │   └── config.yaml
│   ├── composer.json               # Drupal dependencies
│   ├── composer.lock
│   ├── docroot/                    # Drupal web root
│   │   ├── core/
│   │   ├── modules/
│   │   │   └── custom/
│   │   │       ├── dkan_client_tools_core_base/
│   │   │       ├── dkan_client_tools_react_base/
│   │   │       ├── dkan_client_tools_vue_base/
│   │   │       ├── dkan_client_demo_vanilla/
│   │   │       ├── dkan_client_demo_react/
│   │   │       └── dkan_client_demo_vue/
│   │   ├── sites/
│   │   └── themes/
│   └── scripts/                    # Drupal automation scripts
│       ├── setup-site.sh
│       └── rebuild-site.sh
└── node_modules/                   # Hoisted dependencies
```

**Key Characteristics**:
- **Root**: Minimal configuration (package.json, tsconfig.json, tooling configs)
- **Packages**: TypeScript libraries with workspace protocol dependencies
- **Examples**: Standalone demo applications
- **DKAN**: Complete Drupal site with DDEV, isolated in subdirectory
- **Scripts**: Coordinated build orchestration across all parts

---

## Research Findings

### 1. DDEV Best Practices

#### Standard DDEV Project Structure

DDEV recommends the following structure for Drupal projects:

```
project/
├── .ddev/
│   └── config.yaml
├── composer.json
├── composer.lock
└── web/                    # or docroot/
    ├── index.php
    ├── core/
    ├── modules/
    └── sites/
```

**Configuration**:
```yaml
docroot: web                # or docroot
type: drupal10
composer_root: ""           # defaults to project root
```

**Key Points**:
- DDEV expects `.ddev/` directory at the project root it manages
- `docroot` specifies web-accessible directory (security best practice)
- `composer_root` can specify alternate composer.json location
- Most DDEV projects have Drupal as the primary focus

#### DDEV with Monorepos

DDEV supports monorepo configurations:

**Subdirectory Approach**:
```yaml
# In /dkan/.ddev/config.yaml
name: dkan
docroot: docroot
composer_root: ""           # relative to /dkan
```

**Benefits**:
- Clean isolation of DDEV project
- No interference with root npm workspace
- Clear project boundaries
- Standard DDEV structure within subdirectory

**Challenges**:
- Requires `cd dkan` for DDEV commands (or path prefixing)
- Deployment scripts copy files from packages to dkan/docroot

**Root Approach** (alternative):
```yaml
# In /.ddev/config.yaml
name: dkan
docroot: docroot
composer_root: "."          # Drupal at root
```

**Benefits**:
- DDEV commands work from anywhere
- Simpler path references

**Challenges**:
- Root has both package.json and composer.json (confusing)
- Mixes TypeScript monorepo with Drupal project
- Non-standard npm workspaces pattern
- Unclear project boundaries

#### Real-World DDEV Configurations

From research, most DDEV projects fall into two categories:

1. **Drupal-first projects**: Drupal at root, DDEV manages entire project
2. **Monorepo projects**: DDEV project in subdirectory, monorepo at root

Projects combining TypeScript tooling with Drupal tend to use subdirectory approach for clear separation.

---

### 2. Monorepo Best Practices

#### npm Workspaces Conventions

Industry standard for npm workspaces monorepos:

**Root Package.json**:
```json
{
  "name": "project-name",
  "private": true,
  "workspaces": [
    "packages/*",
    "examples/*"
  ]
}
```

**Characteristics**:
- Root is minimal (configuration only)
- All packages in organized subdirectories
- Single `node_modules` at root (hoisting)
- Workspace protocol for internal dependencies
- Centralized script management

**Anti-patterns**:
- Mixing application code with workspace configuration
- Multiple package managers at root (npm + composer)
- Unclear separation between workspace packages

#### Monorepo Structure Philosophies

From research on monorepo best practices:

**Key Principles**:

1. **Organizational Clarity**
   - Structure should reflect organizational boundaries
   - Group projects by function, not technology
   - Clear ownership and responsibility

2. **Technical Separation**
   - Different ecosystems (TypeScript vs PHP) benefit from separation
   - Build tools should operate independently
   - Dependency management shouldn't conflict

3. **Developer Experience**
   - Consistent structure across projects reduces training
   - Automated tooling works better with clear patterns
   - Explicit is better than implicit

4. **Scalability**
   - Structure should support adding new packages/projects
   - CI/CD should handle selective builds
   - Testing should be isolated per project

**Multiple Monorepo Concept**:

Some organizations maintain multiple monorepos:
- Frontend monorepo (TypeScript/JavaScript packages)
- Backend monorepo (services/APIs)
- Infrastructure monorepo (configs/tooling)

For dkanClientTools:
- TypeScript packages monorepo (current: `/packages`, `/examples`)
- Drupal development site (current: `/dkan`)
- These are different enough to warrant separation

#### Real-World Examples

**CivicTheme Monorepo** (github.com/civictheme/monorepo-drupal):
- Drupal theme + modules in monorepo
- Content profiles as submodules
- Automated publishing to separate repos
- DDEV for development environment
- Structure: Drupal-first with theme/module organization

**Drupal Core JS Packages** (drupal.org issue #3211214):
- Proposal to use workspaces for Drupal core JavaScript
- Would use lerna + yarn workspaces
- Goal: simplify maintenance of @drupal/* packages
- Pattern: Organized subdirectories, not root-level

**TypeScript Monorepo Examples**:
- Typically use `packages/*` structure
- Root stays minimal
- Build tools (Nx, Turborepo, Rush) expect this pattern
- Configuration at root, code in subdirectories

---

### 3. Developer Experience Analysis

#### Subdirectory Approach (Current)

**Advantages**:

1. **Clear Mental Model**
   - Obvious separation: "packages are TypeScript, dkan is Drupal"
   - New developers quickly understand structure
   - No confusion about which package manager to use where

2. **Tooling Isolation**
   - npm commands run from root for packages
   - DDEV/composer commands run from `/dkan`
   - No conflicts between npm and composer
   - Each ecosystem has its own space

3. **Build Process Clarity**
   - Build scripts clearly distinguish phases:
     - Phase 1: Build packages (TypeScript)
     - Phase 2: Deploy to Drupal (copy IIFE builds)
     - Phase 3: Build examples (TypeScript)
     - Phase 4: Build Drupal modules (Drupal)

4. **Git Management**
   - Separate `.gitignore` patterns possible
   - Clearer file organization in version control
   - Pull request diffs more focused

5. **CI/CD Benefits**
   - Easy to detect which part changed
   - Can run TypeScript tests independently
   - Drupal-specific CI can target `/dkan`
   - Selective builds based on changed paths

6. **Documentation Organization**
   - TypeScript docs at root `/docs`
   - Drupal docs in `/dkan/README.md`
   - No confusion about what docs apply where

**Disadvantages**:

1. **DDEV Command Paths**
   - Must `cd dkan` before DDEV commands
   - Or prefix all commands: `cd dkan && ddev start`
   - Extra typing for Drupal-focused work

2. **Deployment Complexity**
   - Build orchestrator copies files from `/packages` to `/dkan/docroot`
   - Deployment mapping configuration required
   - Two-step process (build packages, then deploy)

3. **Path References**
   - Documentation must specify paths clearly
   - Cross-references between packages and Drupal need full paths
   - Relative paths longer in some cases

**Mitigations**:

1. **Shell Aliases**:
   ```bash
   alias ddev-start="cd dkan && ddev start && cd .."
   alias ddev-drush="cd dkan && ddev drush"
   ```

2. **NPM Scripts at Root**:
   ```json
   {
     "scripts": {
       "ddev:start": "cd dkan && ddev start",
       "ddev:stop": "cd dkan && ddev stop",
       "drupal:cr": "cd dkan && ddev drush cr"
     }
   }
   ```

3. **Documentation**:
   - Clear README.md with common commands
   - CLAUDE.md includes DDEV command patterns
   - Build process documentation covers deployment

#### Root Approach (Alternative)

**Advantages**:

1. **DDEV Convenience**
   - `ddev start` works from anywhere
   - No directory navigation needed
   - Standard DDEV experience

2. **Simpler Paths**
   - Shorter relative paths in some cases
   - Root-level clarity for Drupal files

**Disadvantages**:

1. **Confusing Root Directory**
   - Both `package.json` and `composer.json` at root
   - Both `node_modules/` and `vendor/` at root
   - Unclear which project is primary
   - New developers confused about purpose

2. **Package Manager Conflicts**
   - npm and composer both managing root
   - Risk of conflicts between tools
   - Harder to reason about dependencies

3. **Non-Standard Monorepo Pattern**
   - npm workspaces typically have minimal root
   - Violates monorepo conventions
   - Harder to integrate monorepo tools (Nx, Turborepo)

4. **Build Complexity**
   - TypeScript build outputs mixed with Drupal
   - Unclear separation of build artifacts
   - .gitignore becomes more complex

5. **Workspace Configuration**
   - Would need `composer_root: "."` in DDEV
   - Drupal docroot would be at `/docroot`
   - Conflicts with `/packages`, `/examples` structure

6. **Mixed Concerns**
   - Root package.json for both monorepo AND Drupal integration
   - Drupal modules alongside TypeScript packages
   - Testing scripts would be mixed

**Developer Workflow Comparison**:

| Task | Subdirectory Approach | Root Approach |
|------|----------------------|---------------|
| Install TypeScript deps | `npm install` (at root) | `npm install` (at root) |
| Install Drupal deps | `cd dkan && ddev composer install` | `ddev composer install` |
| Start DDEV | `cd dkan && ddev start` | `ddev start` |
| Build packages | `npm run build:all` | `npm run build:all` |
| Drupal cache clear | `cd dkan && ddev drush cr` | `ddev drush cr` |
| Understanding structure | Very clear | Confusing |
| Adding new package | `packages/new-package/` | `packages/new-package/` |
| Adding Drupal module | `dkan/docroot/modules/custom/` | `docroot/modules/custom/` |

**Verdict**: While root approach saves some `cd` commands, it creates significantly more confusion and violates monorepo conventions. The slight convenience isn't worth the drawbacks.

---

### 4. AI Agent Experience Analysis

#### Research on AI Agents and Monorepos

Recent research shows AI coding assistants face specific challenges with large codebases and monorepos:

**Key Findings**:

1. **Context Window Limitations**
   - AI agents can only "see" limited tokens at once
   - Like "trying to understand a novel by reading one paragraph at a time"
   - Need clear structure to navigate effectively

2. **Steering Documents**
   - Nested instruction files (AGENTS.md, CLAUDE.md) recommended for monorepos
   - "Closest file wins" principle for context
   - Progressive disclosure of information
   - Documentation should map the codebase structure

3. **Structured Metadata**
   - Tools like Nx provide "maps" of workspace
   - AI agents understand project relationships better with metadata
   - Clear dependency graphs improve AI suggestions

4. **Scaffolding Approach**
   - Well-organized templates and patterns help AI
   - Consistent structure across similar projects
   - Clear naming conventions reduce confusion

5. **Best Practices**:
   - Document project structure explicitly
   - Include tech stack descriptions
   - Provide coding guidelines
   - Map out project relationships
   - Use consistent patterns

#### Subdirectory Approach Benefits for AI

**1. Clear Boundary Recognition**

AI agents can easily distinguish project types:
```
/packages/dkan-client-tools-core/     → TypeScript package
/dkan/docroot/modules/custom/         → Drupal modules
/examples/react-demo-app/             → React application
```

**Context switching is explicit**:
- Working in `/packages/*` → TypeScript/TanStack Query context
- Working in `/dkan/*` → Drupal/PHP context
- Working in `/examples/*` → Application development context

**2. Instruction File Organization**

Current structure supports nested guidance:
```
/CLAUDE.md                            → Overall project instructions
/docs/ARCHITECTURE.md                 → TypeScript architecture
/docs/BUILD_PROCESS.md                → Build system
/dkan/README.md                       → Drupal site instructions
/dkan/TESTING.md                      → Drupal testing procedures
```

AI agents can load appropriate context based on location:
- Root CLAUDE.md provides overview and directs to specific docs
- Subdirectory docs provide targeted guidance
- No confusion about which instructions apply

**3. Pattern Recognition**

Clear structure helps AI recognize patterns:
- All TypeScript packages follow same structure
- All examples follow same structure
- Drupal site follows standard Drupal structure

AI suggestions become more accurate when patterns are consistent and explicit.

**4. File Path Context**

File paths provide semantic information:
```
/packages/dkan-client-tools-react/src/hooks/useDataset.ts
→ AI knows: TypeScript, React hook, dataset functionality

/dkan/docroot/modules/custom/dkan_client_demo_react/src/DatasetList.jsx
→ AI knows: Drupal module, React component, demo implementation
```

Subdirectory structure embeds more context in paths.

**5. Reduced Confusion**

Root-level complexity confuses AI:
- Both package.json and composer.json → Which ecosystem?
- Mixed dependencies → Which package manager?
- Unclear ownership → Where does this belong?

Subdirectory isolation reduces ambiguity:
- Each directory has clear purpose
- Dependencies are scoped appropriately
- Ownership is explicit

#### Root Approach Challenges for AI

**1. Ambiguous Context**

Root-level mixing creates confusion:
```
/package.json                         → npm workspaces? Drupal integration?
/composer.json                        → At root? Why?
/node_modules/                        → For what?
/vendor/                              → Drupal? Mixed with TypeScript?
/docroot/                             → Among packages/?
```

AI agent must do extra work to determine context.

**2. Instruction Conflicts**

Single-level instructions become complex:
- CLAUDE.md must explain multiple project types
- More conditional logic ("if working on X, do Y")
- Harder to maintain focused guidance

**3. Pattern Confusion**

Mixed patterns at root level:
- TypeScript packages use tsup
- Drupal uses composer
- Which pattern applies where?
- AI suggestions may mix approaches

**4. Build Process Opacity**

Less clear build flow:
- What builds what?
- Which tools apply where?
- Dependencies between TypeScript and Drupal?

AI has harder time understanding build orchestration.

**5. Navigation Difficulty**

Finding related files harder:
- All hooks for Drupal integration in one module
- Or scattered across package files?
- Deployment targets less obvious

AI agents benefit from explicit file organization.

#### AI Agent Capabilities Tested

**Current Structure (Subdirectory)**:

Tested AI agent (Claude) ability to:
1. ✅ Understand project is TypeScript monorepo + Drupal site
2. ✅ Navigate to correct files for different tasks
3. ✅ Apply appropriate context (TypeScript vs Drupal)
4. ✅ Suggest correct build commands
5. ✅ Understand deployment flow
6. ✅ Find relevant documentation

**Hypothetical Root Structure**:

Likely AI agent challenges:
1. ❓ Confusion about project primary purpose
2. ❓ Which package.json to modify?
3. ❓ Where do new files belong?
4. ❓ Build commands for which part?
5. ❓ Dependencies managed how?

**Verdict**: Subdirectory structure provides clearer context for AI agents, leading to more accurate suggestions and fewer errors.

---

### 5. Build and Deployment Considerations

#### Current Build Process

**Phase 1: Build Packages**
```bash
npm run build:packages
```
- Builds TypeScript packages in dependency order
- Outputs to `/packages/*/dist/`
- Multiple formats: ESM, CJS, TypeScript declarations, IIFE

**Phase 2: Deploy to Drupal**
```bash
npm run build:deploy
```
- Copies IIFE builds to Drupal modules:
  ```
  /packages/dkan-client-tools-core/dist/index.global.min.js
    → /dkan/docroot/modules/custom/dkan_client_tools_core_base/js/vendor/
  ```

**Phase 3: Build Examples**
```bash
npm run build:examples
```
- Builds standalone demo apps

**Phase 4: Build Drupal Modules**
```bash
npm run build:drupal
```
- Builds Drupal demo modules using deployed IIFE files

**Complete Workflow**:
```bash
npm run build:all        # All phases
npm run build:all:drupal # All phases + clear Drupal cache
```

**Benefits of Current Structure**:

1. **Clear Phase Separation**
   - Each phase has distinct purpose
   - Dependencies explicit (packages → deploy → Drupal modules)
   - Easy to run individual phases for development

2. **Explicit Deployment**
   - Deployment mapping in `/scripts/build-config.js`
   - Validation of successful builds
   - Clear audit trail of what gets deployed where

3. **Independent Testing**
   - Can test TypeScript packages independently
   - Can test Drupal modules independently
   - Integration testing explicit

#### Root Approach Build Challenges

**Potential Issues**:

1. **Build Script Complexity**
   - Need to distinguish TypeScript vs Drupal builds
   - Unclear triggering (what changed?)
   - Mixed outputs in same directory tree

2. **Deployment Ambiguity**
   - Is deployment still needed?
   - Or are files "in place"?
   - How to handle IIFE builds for Drupal?

3. **Cache Invalidation**
   - When to clear Drupal cache?
   - When to rebuild packages?
   - Dependencies between builds unclear

4. **CI/CD Complexity**
   - Harder to determine what changed
   - Selective builds more complex
   - Test isolation harder

**Example Root Build Issues**:

```bash
# If Drupal at root, where do these run?
npm run build              # Packages? Drupal? Both?
composer install           # Where?
npm run test               # Which tests?
```

Current structure avoids these ambiguities:
```bash
npm run build:packages     # Clear: TypeScript packages
cd dkan && ddev composer install  # Clear: Drupal dependencies
npm run test               # Clear: All package tests
cd dkan && ddev exec phpunit       # Clear: Drupal tests
```

---

### 6. Maintenance and Scalability

#### Future Growth Scenarios

**Adding New TypeScript Package**:

Subdirectory approach:
```bash
mkdir packages/dkan-client-tools-angular
# Create package.json with workspace:* dependencies
# Add to build orchestrator
# Clear package purpose and location
```

Root approach:
```bash
mkdir packages/dkan-client-tools-angular
# But root is already complex
# How does this relate to Drupal at root?
# More potential for confusion
```

**Adding New Example Application**:

Subdirectory approach:
```bash
mkdir examples/svelte-demo-app
# Clear: it's an example, not related to Drupal site
```

Root approach:
```bash
mkdir examples/svelte-demo-app
# Confusion: is this using root Drupal somehow?
```

**Updating Drupal Version**:

Subdirectory approach:
```bash
cd dkan
ddev composer update drupal/core
# Clear scope: only affects Drupal site
# TypeScript packages unaffected
```

Root approach:
```bash
composer update drupal/core
# Wait, which composer.json?
# Affects npm packages too?
# Potential for breaking changes across ecosystem
```

**Multiple Drupal Sites** (hypothetical future):

Subdirectory approach:
```
/drupal-sites/
  ├── dkan/           # Current DKAN site
  ├── demo-site/      # New demo site
  └── test-site/      # Testing site
```

Root approach:
- Can only have one Drupal at root
- Multiple Drupal sites impossible
- Would need to refactor to subdirectories anyway

#### Maintenance Burden

**Subdirectory Approach**:

Ongoing maintenance:
- Build orchestrator deployment mapping
- Wrapper scripts for DDEV commands (optional)
- Documentation of directory structure
- Clear separation reduces conflicts

**Root Approach**:

Ongoing maintenance:
- Resolving npm/composer conflicts
- Managing mixed dependencies
- Documenting which tool does what
- Explaining structure to new developers
- Unclear separation increases conflicts

#### Team Scalability

**Subdirectory Approach**:

Team specialization:
- Frontend developers work in `/packages`, `/examples`
- Drupal developers work in `/dkan`
- Clear ownership boundaries
- Fewer merge conflicts
- Easier code review scoping

**Root Approach**:

Team challenges:
- Unclear ownership at root level
- More potential for conflicts (package.json, composer.json)
- Code reviews need more context
- Harder to assign clear responsibilities

---

## Comprehensive Comparison Matrix

| Aspect | Subdirectory (Current) | Root (Alternative) |
|--------|------------------------|-------------------|
| **Structure Clarity** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐ Poor |
| **npm Workspaces Convention** | ⭐⭐⭐⭐⭐ Follows best practices | ⭐ Violates conventions |
| **DDEV Command Convenience** | ⭐⭐⭐ Good (with wrappers) | ⭐⭐⭐⭐⭐ Excellent |
| **Developer Onboarding** | ⭐⭐⭐⭐⭐ Very clear | ⭐⭐ Confusing |
| **Build Process Clarity** | ⭐⭐⭐⭐⭐ Explicit phases | ⭐⭐ Ambiguous |
| **AI Agent Navigation** | ⭐⭐⭐⭐⭐ Clear context | ⭐⭐ Confusing |
| **Package Manager Separation** | ⭐⭐⭐⭐⭐ Clean isolation | ⭐ Conflicts |
| **Git Organization** | ⭐⭐⭐⭐⭐ Clear boundaries | ⭐⭐ Mixed |
| **CI/CD Complexity** | ⭐⭐⭐⭐ Easy to target | ⭐⭐ Complex |
| **Documentation Organization** | ⭐⭐⭐⭐⭐ Scoped clearly | ⭐⭐ Mixed scope |
| **Scalability** | ⭐⭐⭐⭐⭐ Easy to extend | ⭐⭐ Limited |
| **Maintenance Burden** | ⭐⭐⭐⭐ Low | ⭐⭐ High |
| **Real-World Examples** | ⭐⭐⭐⭐ Common pattern | ⭐⭐ Rare |
| **Monorepo Tool Support** | ⭐⭐⭐⭐⭐ Standard | ⭐⭐ Non-standard |
| **Team Collaboration** | ⭐⭐⭐⭐⭐ Clear ownership | ⭐⭐ Unclear |

**Overall Score**:
- **Subdirectory Approach**: 4.5/5
- **Root Approach**: 2.2/5

---

## Potential Optimizations (Current Structure)

While keeping the subdirectory approach, some improvements can enhance developer experience:

### 1. Root-Level NPM Scripts

Add convenience scripts to root `package.json`:

```json
{
  "scripts": {
    "ddev:start": "cd dkan && ddev start",
    "ddev:stop": "cd dkan && ddev stop",
    "ddev:restart": "cd dkan && ddev restart",
    "ddev:ssh": "cd dkan && ddev ssh",
    "drupal:cr": "cd dkan && ddev drush cr",
    "drupal:status": "cd dkan && ddev drush status",
    "drupal:setup": "cd dkan && ddev exec bash scripts/setup-site.sh",
    "drupal:rebuild": "cd dkan && ddev exec bash scripts/rebuild-site.sh",
    "full-build": "npm run build:all:drupal"
  }
}
```

**Benefits**:
- Can run `npm run ddev:start` from root
- No need to remember to `cd dkan`
- Consistent with other npm scripts
- Self-documenting in `package.json`

### 2. Shell Alias Suggestions

Provide in README.md for developers who prefer shell aliases:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias dkancd="cd $(git rev-parse --show-toplevel)/dkan"
alias ddev-start="dkancd && ddev start && cd -"
alias ddev-stop="dkancd && ddev stop && cd -"
alias drush="dkancd && ddev drush"
```

### 3. IDE Workspace Configuration

Provide workspace configuration for VS Code (`.vscode/dkanClientTools.code-workspace`):

```json
{
  "folders": [
    {
      "name": "Root",
      "path": "."
    },
    {
      "name": "Packages",
      "path": "packages"
    },
    {
      "name": "DKAN Drupal Site",
      "path": "dkan"
    },
    {
      "name": "Examples",
      "path": "examples"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/vendor": true
    }
  }
}
```

**Benefits**:
- Navigate easily between sections
- Scoped searches
- Multiple terminal roots

### 4. Enhanced Documentation

Add to README.md:

**Quick Start Section**:
```markdown
## Quick Start

### TypeScript Development
```bash
npm install              # Install all dependencies
npm run build:all        # Build all packages
npm test                 # Run all tests
npm run dev              # Watch mode
```

### Drupal Development
```bash
npm run ddev:start       # Start DDEV (or: cd dkan && ddev start)
npm run drupal:setup     # Run automated setup
npm run drupal:cr        # Clear Drupal cache
```

### Full Workflow
```bash
npm run build:all:drupal # Build packages + deploy + clear cache
```
```

### 5. Build Orchestrator Enhancement

Enhance build orchestrator output:

```javascript
// scripts/build-orchestrator.js
console.log('\n📦 Building TypeScript packages...')
console.log('📂 Deploying to Drupal...')
console.log('🚀 Building examples...')
console.log('🔨 Building Drupal modules...')
console.log('✅ Complete! Run "cd dkan && ddev drush cr" to clear Drupal cache.')
```

### 6. Git Hooks

Add pre-commit hook suggestion for formatting:

```bash
# .husky/pre-commit
#!/bin/sh
npm run typecheck
npm run lint
```

---

## Alternative Structures Considered

### Option A: Separate Repositories

**Structure**:
- `dkan-client-tools` repo (TypeScript packages only)
- `dkan-client-tools-drupal` repo (Drupal site only)

**Pros**:
- Maximum separation
- Independent versioning
- Different access control possible

**Cons**:
- Harder to keep in sync
- More complex development workflow
- Deployment coordination required
- Loses monorepo benefits

**Verdict**: Too much separation for development site

### Option B: Drupal in `/apps` Directory

**Structure**:
```
/packages/            # TypeScript libraries
/apps/
  ├── dkan-drupal/    # Drupal site
  ├── admin-portal/   # Hypothetical admin app
  └── public-portal/  # Hypothetical public app
```

**Pros**:
- Semantic: "packages" are libraries, "apps" are applications
- Common monorepo pattern (Turborepo, Nx)
- Consistent with some monorepo tools

**Cons**:
- Drupal site is development tool, not deployable app
- Would be only "app" currently
- Over-engineering for current needs
- Adds directory level without value

**Verdict**: Unnecessary complexity for current project

### Option C: `/tools` Directory

**Structure**:
```
/packages/            # TypeScript libraries
/examples/            # Demo applications
/tools/
  └── dkan-dev-site/  # Drupal development site
```

**Pros**:
- Semantic: Drupal site is development tool
- Clear it's not a package or example

**Cons**:
- Non-standard directory name
- Doesn't align with monorepo conventions
- May confuse developers (what are "tools"?)

**Verdict**: Unclear semantics, no clear benefit

### Option D: Current Structure (RECOMMENDED)

**Structure**:
```
/packages/            # TypeScript libraries
/examples/            # Demo applications
/dkan/                # DKAN Drupal development site
```

**Pros**:
- Simple and clear
- Self-documenting (directory name explains purpose)
- Aligns with npm workspaces conventions
- Follows real-world examples
- Works well for AI agents
- Easy to maintain

**Cons**:
- Requires `cd dkan` for DDEV commands (easily mitigated)

**Verdict**: Best balance of clarity, convention, and practicality

---

## Recommendations

### Primary Recommendation: Keep Current Structure

**Maintain DKAN Drupal site in `/dkan` subdirectory**

**Rationale**:
1. Aligns with npm workspaces best practices (minimal root)
2. Clear separation of concerns (TypeScript vs Drupal)
3. Superior developer onboarding experience
4. Better AI agent navigation and context understanding
5. Cleaner build and deployment workflows
6. Scalable for future growth
7. Follows real-world monorepo patterns
8. Reduces maintenance burden
9. Facilitates team collaboration

### Implement Optimizations

**Add to enhance current structure**:

1. ✅ **Root-level NPM scripts** for DDEV convenience
2. ✅ **Enhanced documentation** with clear quick start
3. ✅ **IDE workspace configuration** for better navigation
4. ✅ **Shell alias examples** for power users
5. ✅ **Build orchestrator enhancements** for clearer output

### Update Documentation

**Clarify in documentation**:

1. **README.md**: Add "Directory Structure" section explaining organization
2. **CLAUDE.md**: Already well-documented, reinforce structure rationale
3. **DEVELOPMENT.md**: Add convenience script examples
4. **BUILD_PROCESS.md**: Already clear, no changes needed

### Do Not Pursue

**Avoid these changes**:

1. ❌ Moving Drupal to root (creates confusion, violates conventions)
2. ❌ Separate repositories (loses development workflow benefits)
3. ❌ `/apps` structure (over-engineering for current needs)
4. ❌ `/tools` structure (unclear semantics)

---

## Implementation Plan

### Phase 1: Add Convenience Scripts (Low Effort, High Value)

**Action**: Add to root `package.json`:

```json
{
  "scripts": {
    "ddev:start": "cd dkan && ddev start",
    "ddev:stop": "cd dkan && ddev stop",
    "ddev:restart": "cd dkan && ddev restart",
    "drupal:cr": "cd dkan && ddev drush cr",
    "drupal:status": "cd dkan && ddev drush status",
    "drupal:setup": "cd dkan && ddev exec bash scripts/setup-site.sh",
    "full-build": "npm run build:all:drupal"
  }
}
```

**Benefit**: Addresses primary "con" of subdirectory approach (DDEV command paths)

### Phase 2: Documentation Updates (Medium Effort, High Value)

**Action**: Update README.md with:
- Directory structure explanation
- Quick start section with both approaches (cd dkan OR npm run scripts)
- Shell alias suggestions for power users

**Benefit**: Clearer onboarding, addresses any confusion

### Phase 3: IDE Configuration (Low Effort, Medium Value)

**Action**: Create `.vscode/dkanClientTools.code-workspace`

**Benefit**: Better developer experience in VS Code

### Phase 4: Monitor and Iterate (Ongoing)

**Action**: Gather feedback from:
- Human developers working on project
- AI agents (Claude) working on codebase
- New contributors onboarding

**Benefit**: Continuous improvement based on real experience

---

## Conclusion

After comprehensive research into DDEV best practices, monorepo patterns, developer experience, and AI agent capabilities, **the current structure with DKAN Drupal site in `/dkan` subdirectory is the optimal approach**.

**Key Decision Factors**:

1. **Standards Alignment**: Follows npm workspaces and monorepo best practices
2. **Clarity**: Explicit separation of concerns prevents confusion
3. **Developer Experience**: Clear structure reduces onboarding time and errors
4. **AI Agent Experience**: Better context understanding and navigation
5. **Maintainability**: Lower long-term maintenance burden
6. **Scalability**: Easy to extend with new packages or additional Drupal sites
7. **Real-World Validation**: Pattern used by successful monorepo projects

**Minor Inconvenience Mitigated**: The need to `cd dkan` for DDEV commands is easily addressed with root-level npm scripts, making it a non-issue while preserving all the structural benefits.

**Final Verdict**: Keep `/dkan` subdirectory, implement convenience optimizations, update documentation for clarity.

---

## References

### DDEV Documentation
- DDEV Configuration Options: https://docs.ddev.com/en/stable/users/configuration/config/
- DDEV Managing Projects: https://docs.ddev.com/en/stable/users/usage/managing-projects/
- DDEV Quickstarts: https://docs.ddev.com/en/stable/users/quickstart/

### Monorepo Resources
- npm Workspaces: https://docs.npmjs.com/cli/workspaces
- Monorepo Tools: https://monorepo.tools/
- CivicTheme Monorepo: https://github.com/civictheme/monorepo-drupal

### AI Agent Research
- "Steering AI Agents in Monorepos with AGENTS.md" (DEV Community)
- "Scaling AI-Assisted Development: How Scaffolding Solved My Monorepo Chaos"
- "Nx and AI - Why They Work so Well Together"

### TypeScript Monorepo Patterns
- "Setting up a monorepo using npm workspaces and TypeScript Project References"
- "Simple monorepos via npm workspaces and TypeScript project references"
- "Typescript Monorepo with NPM workspaces"

### Project-Specific Documentation
- `/docs/ARCHITECTURE.md` - dkanClientTools architecture
- `/docs/BUILD_PROCESS.md` - Build system documentation
- `/docs/DEVELOPMENT.md` - Development workflow
- `/CLAUDE.md` - AI agent instructions

---

**Research Completed**: 2025-11-18
**Recommendation**: Keep current `/dkan` subdirectory structure, implement optimizations
**Next Steps**: Implement Phase 1 convenience scripts, update documentation
