# Research Directory Documentation Guidelines

This file provides guidance for Claude Code and other AI agents working with documentation in the `/research` directory.

---

## Purpose

The `/research` directory contains technical documentation that provides AI agents with deep context about the project's architecture, API integrations, and design decisions. These documents serve as:

- **Reference material** for understanding technical implementation details
- **Context** for making informed development decisions
- **Background** on why certain architectural choices were made
- **API documentation** for external integrations (e.g., DKAN REST APIs)

Files in this directory are intended to be read and referenced by AI agents to better understand the codebase and provide more accurate assistance to developers.

---

## Document Types

### Architecture Documentation
Documents explaining system design, architectural patterns, technology choices, and their rationale.

**Example**: `ARCHITECTURE.md` - Covers TanStack Query integration, package structure, design principles

### API Reference Documentation
Comprehensive documentation of external APIs the project integrates with.

**Example**: `DKAN_API.md` - Documents DKAN REST API endpoints, parameters, responses

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

Use ASCII art for dependency flows and architecture diagrams:

```markdown
User Application
    ↓
@dkan-client-tools/react
    ↓
@dkan-client-tools/core
    ↓
TanStack Query Core
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

Include rationale for architectural decisions:

```markdown
## Why TanStack Query?

We chose TanStack Query because:
1. Proven solution used by thousands of projects
2. Built-in caching and deduplication
3. Framework-agnostic core
```

### Practical Examples

Include real-world code examples showing actual usage:

```typescript
// Good - shows real usage
const { data, isLoading } = useDataset({
  id: 'abc-123',
  enabled: true
})

// Avoid abstract placeholders
const result = useHook({ param: value })
```

### Communication Style

- **Direct and concise** - avoid unnecessary words
- **Developer-focused** - technical accuracy over marketing
- **No hype** - don't oversell features or improvements
- **Objective** - present facts and tradeoffs honestly

### References

Include a references section at the end with external links:

```markdown
---

## References

- [TanStack Query Documentation](https://tanstack.com/query)
- [DKAN Documentation](https://dkan.readthedocs.io/)
- [DCAT-US Schema](https://resources.data.gov/schemas/dcat-us/)
```

---

## File Naming

Use descriptive, uppercase names with underscores:

- `ARCHITECTURE.md` - System architecture documentation
- `DKAN_API.md` - DKAN API reference
- `INTEGRATION_PATTERNS.md` - Integration pattern documentation
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
# Document Title

Brief subtitle or overview statement.

---

## Overview

High-level introduction to the topic.

---

## Main Topic One

### Subtopic

Detailed content with examples.

\```typescript
// Code example
\```

**Key Points**:
- Important detail
- Another detail

---

## Main Topic Two

### Subtopic

More content...

---

## References

- [External Resource](https://example.com)
```

---

## For AI Agents

When creating or updating research documentation:

1. **Read existing files** to understand current patterns and style
2. **Match the tone** - technical, direct, developer-focused
3. **Include examples** - show don't just tell
4. **Explain rationale** - the "why" behind decisions
5. **Be accurate** - verify technical details
6. **Stay consistent** - use established formatting patterns
7. **Keep it practical** - focus on what developers need to know
