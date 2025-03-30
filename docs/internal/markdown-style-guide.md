# Markdown Style Guide

## Overview

This document outlines the standard markdown formatting rules that must be followed in all documentation files across the monorepo. Following these guidelines ensures consistency and readability.

## Core Principles

- **Readability**: Content should be easy to read in both rendered and source form
- **Consistency**: Use consistent formatting patterns throughout all documents
- **Maintainability**: Structure documents to be easy to update and extend

## Formatting Rules

### Headings

- Use ATX-style headings with hash symbols (`#`).
- Include a blank line before and after each heading.
- Use title case for headings.
- Use hierarchical structure (don't skip levels).

```md
## This is a Second-Level Heading

Content goes here.

### This is a Third-Level Heading
```

### Lists

- Include a blank line before and after lists.
- Use consistent indentation (2 spaces) for nested items.
- Use hyphens (`-`) for unordered lists.

```md
This is a paragraph.

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

Next paragraph starts here.
```

### Code Blocks

- Always surround code blocks with blank lines.
- Specify the language for syntax highlighting.
- Use fenced code blocks with triple backticks.

```md
This is a paragraph.

```typescript
function example(): string {
  return 'This is an example';
}
```

Next paragraph.

### Links and References

- Prefer reference-style links for better readability.
- Place reference definitions at the bottom of the section.
- Use descriptive link text.

```md
Learn more about [markdown syntax][markdown-ref].

[markdown-ref]: https://commonmark.org/
```

### Tables

- Use proper column alignment.
- Include a header row with separators.
- Surround tables with blank lines.

```md
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

## Consistency Checks

All markdown files should pass standard linting checks with tools like markdownlint. Common rules include:

- MD022: Headings must be surrounded by blank lines.
- MD031: Fenced code blocks must be surrounded by blank lines.
- MD032: Lists must be surrounded by blank lines.
- MD040: Code blocks should specify a language.

## Tools

Consider using these tools to enforce the style guide:

- markdownlint (CLI or editor plugin).
- Prettier (with markdown plugin).
- Visual Studio Code with markdown extensions.

## Summary

Following these markdown guidelines ensures documentation remains consistent, readable, and maintainable across the project.
