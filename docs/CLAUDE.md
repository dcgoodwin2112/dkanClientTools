# Documentation Guidelines

This file provides guidance for developers and AI agents working with documentation in the `/docs` directory.

---

## Purpose

The `/docs` directory contains **internal project documentation** for dkanClientTools. These documents explain the project's architecture, how to use the packages, integration patterns, and build processes. This directory serves as:

- **User guides** for developers integrating dkanClientTools
- **Reference material** for package APIs and methods
- **Architecture documentation** for internal design decisions
- **Integration guides** for framework-specific usage (React, Vue, Drupal)

Files in this directory are intended for both human developers and AI agents to understand how to use and work with the dkanClientTools project.

**What belongs here:**
- Internal architecture and design decisions
- Getting started guides (installation, quick start)
- Framework-specific guides (React, Vue)
- Integration patterns (Drupal, build system)
- API reference documentation for package methods
- Package structure and organization

**What does NOT belong here:**
- External API documentation (belongs in `/research`)
- Third-party technology overviews (belongs in `/research`)
- Data standards and specifications (belongs in `/research`)

---

## Distinction from `/research`

**Clear Boundary:**

| Directory | Focus | Examples |
|-----------|-------|----------|
| `/docs` | **Internal** project documentation | ARCHITECTURE.md, REACT_GUIDE.md, BUILD_PROCESS.md |
| `/research` | **External** dependencies and technologies | DKAN_API.md, DKAN_FEATURES.md, DATA_STANDARDS.md |

**Simple Rule:** If it's about how dkanClientTools works internally or how to use it, put it in `/docs`. If it's about an external API, library, or standard, put it in `/research`.

---

## Target Audience

Documentation in `/docs` targets:

1. **Developers** using dkanClientTools in their applications
2. **Contributors** working on dkanClientTools packages
3. **AI agents** (Claude Code, GitHub Copilot) assisting with development

Write for developers familiar with JavaScript/TypeScript, React, Vue, and npm. Assume basic knowledge of web development tools and frameworks.

---

## Document Types

### Getting Started Documentation
Installation instructions, quick start guides, and initial setup.

**Examples:**
- `INSTALLATION.md` - Package installation for React, Vue, vanilla JS
- `QUICK_START.md` - 5-minute quick start guide

### Framework-Specific Guides
Complete guides for using dkanClientTools with specific frameworks.

**Examples:**
- `REACT_GUIDE.md` - React hooks, provider setup, usage patterns
- `VUE_GUIDE.md` - Vue composables, plugin setup, usage patterns

### Integration Guides
Documentation for integrating with specific platforms or build systems.

**Examples:**
- `DRUPAL_INTEGRATION.md` - Using dkanClientTools in Drupal themes/modules
- `BUILD_PROCESS.md` - Build system, scripts, workflow

### Reference Documentation
Comprehensive API references and architecture documentation.

**Examples:**
- `API_REFERENCE.md` - Complete DkanApiClient method reference
- `ARCHITECTURE.md` - Internal architecture, design decisions, patterns

### Navigation
Index files that help developers find documentation.

**Examples:**
- `README.md` - Documentation index with links to all guides

---

## Formatting Guidelines

### Keep It Concise

**IMPORTANT:** Documentation should be short and to the point.

- Focus on practical information developers need
- Avoid unnecessary explanations
- Remove redundant content
- Use examples instead of lengthy descriptions
- Get to the point quickly

### Heading Hierarchy

Use consistent heading levels:

- **H1 (`#`)** - Document title only
- **H2 (`##`)** - Major sections
- **H3 (`###`)** - Subtopics within sections
- **H4 (`####`)** - Use sparingly for deep nesting

**Example:**
```markdown
# React Integration Guide

## Installation

### npm

### yarn
```

### Section Separators

Use horizontal rules between major sections:

```markdown
## Installation

Installation instructions...

---

## Basic Usage

Usage examples...
```

### Code Examples

Always include language tags for syntax highlighting:

```markdown
\```typescript
import { DkanClientProvider } from '@dkan-client-tools/react'

export function App() {
  return (
    <DkanClientProvider config={{ baseUrl: 'https://api.example.com' }}>
      {/* Your app */}
    </DkanClientProvider>
  )
}
\```
```

Common language tags: `typescript`, `javascript`, `jsx`, `tsx`, `json`, `bash`

### API Documentation Pattern

Document package APIs and methods with this structure:

```markdown
### useDataset(options)

Fetch a single dataset by identifier.

**Parameters:**
- `options.id` (string, required) - Dataset identifier
- `options.enabled` (boolean, optional) - Enable/disable query

**Returns:** TanStack Query result with dataset data

**Example:**
\```typescript
const { data, isLoading } = useDataset({ id: 'abc-123' })
\```
```

### Tables

Use markdown tables for comparing options or features:

```markdown
| Package | Framework | Provider/Plugin |
|---------|-----------|-----------------|
| @dkan-client-tools/react | React | DkanClientProvider |
| @dkan-client-tools/vue | Vue 3 | DkanClientPlugin |
```

### Callouts

Prefix important notes with bold labels:

```markdown
**IMPORTANT:** React 18+ or 19.x is required.

**NOTE:** The provider must wrap your entire application.

**WARNING:** Mutations require authentication.
```

### Lists

**Numbered lists** for sequential steps:
```markdown
1. Install the package
2. Configure the provider
3. Use the hooks in components
```

**Bullet lists** for features or options:
```markdown
- Automatic caching
- Background refetching
- Optimistic updates
- TypeScript support
```

### Diagrams

Use ASCII art for package dependencies and architecture:

```markdown
User Application
    ↓
@dkan-client-tools/react (hooks)
    ↓
@dkan-client-tools/core (DkanClient)
    ↓
TanStack Query Core
```

---

## Content Guidelines

### Focus on Practical Usage

Show developers how to use the packages with real examples:

```typescript
// Good - shows actual usage
const { data } = useDataset({ id: 'abc-123' })

// Avoid - too abstract
const result = useHook({ param: value })
```

### Explain Internal Decisions

Include rationale for architectural choices:

```markdown
## Why TanStack Query?

We chose TanStack Query for dkanClientTools because:
1. Proven caching and state management
2. Framework-agnostic core enables React and Vue adapters
3. Built-in deduplication and background updates
```

### Communication Style

- **Direct and concise** - get to the point quickly
- **Developer-focused** - technical accuracy over marketing
- **No hype** - don't oversell features
- **Objective** - present facts and tradeoffs

### Keep Documentation Short

Before publishing documentation:

1. Remove redundant explanations
2. Combine similar sections
3. Use examples instead of lengthy prose
4. Cut unnecessary details
5. Focus on what developers actually need

---

## File Naming

Use descriptive, uppercase names:

- `INSTALLATION.md` - Installation guide
- `REACT_GUIDE.md` - React integration guide
- `VUE_GUIDE.md` - Vue integration guide
- `ARCHITECTURE.md` - Internal architecture
- `API_REFERENCE.md` - API method reference
- `BUILD_PROCESS.md` - Build system documentation
- `CLAUDE.md` - AI agent guidelines (this file)

---

## Adding New Documentation

When adding new documentation to `/docs`:

1. **Determine document type** - Getting started, guide, reference, or integration?
2. **Check for existing docs** - Could this be added to an existing file?
3. **Follow formatting guidelines** - Use consistent structure
4. **Keep it concise** - Shorter is better
5. **Add to README.md** - Update the documentation index
6. **Use code examples** - Show, don't just tell
7. **Review for clarity** - Can developers understand it quickly?

---

## For AI Agents

When creating or updating documentation in `/docs`:

1. **Focus on internal project documentation** - how dkanClientTools works and how to use it
2. **Keep it short** - concise documentation is better documentation
3. **Use practical examples** - show actual package usage
4. **Match the tone** - technical, direct, developer-focused
5. **Follow formatting patterns** - consistent structure helps readability
6. **Verify accuracy** - check against actual package code
7. **Cross-reference appropriately** - link to related docs when helpful

**Remember:** This directory is for internal project documentation. External dependency documentation belongs in `/research`.

**Conciseness Check:** Before finalizing documentation, ask:
- Can this be shorter?
- Are there redundant sections?
- Would an example replace a paragraph?
- Is every section necessary?
