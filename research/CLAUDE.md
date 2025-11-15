# Research Directory Documentation Guidelines

This file provides guidance for Claude Code and other AI agents working with documentation in the `/research` directory.

---

## Purpose

The `/research` directory documents **external dependencies and technologies** that the project integrates with or builds upon. These documents provide AI agents with deep context about third-party systems, APIs, standards, and libraries. This directory serves as:

- **Reference material** for external APIs and their capabilities
- **Context** for understanding third-party technologies the project depends on
- **Background** on external standards and specifications (DCAT-US, Frictionless, etc.)
- **Integration guides** for external platforms (DKAN, TanStack Query, etc.)

Files in this directory are intended to be read and referenced by AI agents to better understand external dependencies and provide more accurate integration assistance.

**What belongs here:**
- External API documentation (DKAN REST APIs, third-party services)
- Technology overviews (TanStack Query capabilities, DKAN features)
- Standards and specifications (DCAT-US, Frictionless Table Schema)
- Third-party library integration patterns

**What does NOT belong here:**
- Internal project architecture (belongs in `/docs/ARCHITECTURE.md` or root-level docs)
- Package implementation details (belongs in package READMEs or `/docs`)
- Internal API documentation (belongs in code comments or API reference docs)
- Build system documentation (belongs in `/docs`)

---

## Document Types

### External API Documentation
Comprehensive documentation of third-party APIs the project integrates with.

**Example**: `DKAN_API.md` - DKAN REST API endpoints, parameters, responses, authentication

### External Technology Overview
Documentation of external platforms, libraries, and frameworks used by the project.

**Example**: `DKAN_FEATURES.md` - DKAN 2 platform capabilities, modules, and use cases

### Standards and Specifications
Technical documentation of data standards, schemas, and specifications the project implements.

**Example**: `DATA_STANDARDS.md` - DCAT-US and Frictionless Table Schema specifications

---

## Formatting Guidelines

### Heading Hierarchy

Use consistent heading levels to organize content:

- **H1 (`#`)** - Document title only
- **H2 (`##`)** - Major sections (Overview, main topics)
- **H3 (`###`)** - Subtopics within major sections
- **H4 (`####`)** and below - Use sparingly for deep nesting

**Example**:
```markdown
# Document Title

## Major Section

### Subtopic

#### Specific Detail (if needed)
```

### Section Separators

Use horizontal rules to visually separate major sections:

```markdown
## Section One

Content here...

---

## Section Two

Content here...
```

### Code Examples

Always include language tags for syntax highlighting:

```markdown
```typescript
// TypeScript example
export function example() {
  return 'formatted code'
}
\```

```json
{
  "example": "JSON data"
}
\```
```

Common language tags: `typescript`, `javascript`, `json`, `http`, `sql`, `bash`

### API Documentation Pattern

Document API endpoints with this structure:

```markdown
### GET /api/endpoint/{id}

Brief description of what this endpoint does.

**Query Parameters**:
- `param1` (string, optional) - Description
- `param2` (number, required) - Description

**Request Example**:
\```http
GET /api/endpoint/123?param1=value
\```

**Response Example**:
\```json
{
  "data": "response structure"
}
\```

**Notes**:
- Important limitations or behaviors
- Special syntax requirements
```

### Diagrams and Flows

Use ASCII art for external API flows and integration diagrams:

```markdown
Client Application
    ↓
HTTP Request (Authorization: Basic ...)
    ↓
DKAN REST API (/api/1/metastore/...)
    ↓
DKAN Metastore (Drupal)
    ↓
JSON Response (DCAT-US formatted)
```

### Lists

**Numbered lists** for sequential steps or ordered concepts:
```markdown
1. First step
2. Second step
3. Third step
```

**Bullet lists** for features, options, or non-sequential items:
```markdown
- Feature one
- Feature two
  - Nested detail
  - Another detail
```

### Typography and Emphasis

- **Bold** (`**text**`) for key terms, class names, important concepts
- `Code font` (`` `text` ``) for identifiers, filenames, technical terms
- *Italic* (`*text*`) sparingly, only for subtle emphasis
- Use consistent terminology throughout (e.g., always "TanStack Query" not "TanStack" or "Query")

### Tables

Use markdown tables for comparing options or listing structured data:

```markdown
| Feature | React | Vue |
|---------|-------|-----|
| Hook/Composable | `useDataset` | `useDataset` |
| Provider | `DkanClientProvider` | `DkanClientPlugin` |
```

### Callouts and Notes

Prefix important notes with bold labels:

```markdown
**IMPORTANT**: This endpoint requires authentication.

**NOTE**: The response format changed in DKAN 2.x.

**WARNING**: This operation is irreversible.
```

---

## Content Guidelines

### Technical Depth

- Write for developers familiar with JavaScript/TypeScript and web development
- Include technical details and implementation specifics
- Explain complex concepts but don't over-explain basics
- Assume knowledge of common frameworks (React, Vue) and tools (npm, git)

### Explain "Why" Not Just "What"

Include context for why external technologies are used and how they benefit the project:

```markdown
## Why DKAN Uses DCAT-US

DCAT-US is the federal standard for data catalogs because:
1. Required for U.S. federal agency compliance
2. Ensures interoperability across government data portals
3. Based on W3C DCAT vocabulary for international compatibility
```

### Practical Examples

Include real-world code examples showing external API usage and integration patterns:

```typescript
// Good - shows actual DKAN API request
fetch('https://dkan.example.com/api/1/metastore/schemas/dataset/items/abc-123', {
  headers: {
    'Authorization': `Basic ${btoa('user:pass')}`
  }
})

// Avoid abstract placeholders
fetch('https://api.example.com/endpoint')
```

### Communication Style

- **Direct and concise** - avoid unnecessary words
- **Developer-focused** - technical accuracy over marketing
- **No hype** - don't oversell features or improvements
- **Objective** - present facts and tradeoffs honestly

### References

Include a references section at the end with links to official external documentation:

```markdown
---

## References

- [DKAN Official Documentation](https://dkan.readthedocs.io/)
- [DKAN GitHub Repository](https://github.com/GetDKAN/dkan)
- [DCAT-US Specification](https://resources.data.gov/resources/dcat-us/)
- [Frictionless Table Schema](https://specs.frictionlessdata.io/table-schema/)
- [TanStack Query Documentation](https://tanstack.com/query)
```

---

## File Naming

Use descriptive, uppercase names with underscores focused on the external technology:

- `DKAN_API.md` - DKAN REST API reference
- `DKAN_FEATURES.md` - DKAN 2 platform overview
- `DATA_STANDARDS.md` - DCAT-US and Frictionless specifications
- `TANSTACK_QUERY.md` - TanStack Query capabilities and patterns
- `CLAUDE.md` - AI agent guidelines (this file)

---

## Maintenance

When updating research documentation:

1. Keep formatting consistent with existing documents
2. Update related documents if content changes affect multiple files
3. Add new sections with horizontal rule separators
4. Include code examples for new patterns
5. Update references section with new external resources
6. Maintain the developer-focused, technical tone

---

## Example Document Structure

```markdown
# External Technology Name

Brief overview of the external technology and its purpose.

---

## Overview

High-level introduction to the external technology, its ecosystem, and relevance to the project.

---

## Core Capabilities

### Feature Category One

Detailed explanation of features with external API examples.

\```http
GET /api/endpoint HTTP/1.1
Host: external-service.com
\```

**Key Capabilities**:
- Feature description
- Integration requirements

---

## Integration Patterns

### Using the External API

Code examples showing how to interact with the external technology.

\```typescript
// Example API call
\```

---

## References

- [Official Documentation](https://external-tech.com/docs)
- [API Reference](https://external-tech.com/api)
- [GitHub Repository](https://github.com/org/repo)
```

---

## For AI Agents

When creating or updating research documentation:

1. **Focus on external technologies** - document third-party APIs, libraries, platforms, and standards
2. **Read existing files** to understand current patterns and style
3. **Match the tone** - technical, direct, developer-focused
4. **Include examples** - show actual external API usage and integration patterns
5. **Explain context** - why the external technology exists and how it's used
6. **Be accurate** - verify technical details from official documentation
7. **Stay consistent** - use established formatting patterns
8. **Keep it practical** - focus on integration details developers need

**Remember**: This directory is for external dependencies, not internal project architecture. Internal architecture documentation belongs in `/docs` or root-level files.
