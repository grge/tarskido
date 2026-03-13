# AGENTS.md

Guidance for AI agents working with this Tarskido codebase.

## Project Overview

Tarskido is a Vue 3 application for authoring mathematical content as directed graphs.

## Essential Commands

```bash
npm run dev        # Development server
npm run build      # Production build  
npm run test       # Run tests
npm run lint       # Fix code issues
npm run deploy     # Deploy to GitHub Pages
```

## Core Data Model

### Books
- Container with metadata (title, author, preface)
- Collection of nodes with dependency relationships

### Nodes
- Mathematical entities: definitions, propositions, theorems
- Properties: `id`, `reference`, `name`, `statement`, `references[]`, `chapter`
- Node types: `Definition`, `Proposition`, `Theorem`, `Note`, etc.

### JSON Structure
```json
{
  "id": "book-id",
  "name": "Book Title", 
  "nodes": {
    "node-id": {
      "id": "node-id",
      "reference": "1.2",
      "name": "Node Name",
      "statement": "Mathematical statement with LaTeX: $x^2$",
      "references": ["other-node-id"],
      "chapter": "chapter-id"
    }
  }
}
```

## Key Files

### Stores (Pinia)
- `src/stores/bookStore.ts` - Single book state and operations
- `src/stores/bookShelfStore.ts` - Book collection management

### Components
- `src/components/GraphRenderer.vue` - Graph visualization
- `src/components/MarkdownRenderer.vue` - Math rendering with KaTeX

### Data
- `public/books/` - Static book JSON files
- Books automatically load from localStorage or public directory

## Common Tasks

### Adding/Modifying Nodes
Edit the book JSON file in `public/books/`. The app will reload automatically in dev mode.

### Math Rendering
Use standard LaTeX syntax in node statements: `$inline math$` or `$$display math$$`

### Dependencies
Add node IDs to the `references` array to create graph edges.

## Testing
- Use `public/books/group-theory.json` for testing graph features
- Run `npm run test` for unit tests
- Check browser console for validation errors

## JSON Authoring Rules

### Valid Node Types
Node types must use these exact combinations:

**Primary: 'Comment'**
- Secondary: 'Comment', 'Note', 'Example'

**Primary: 'Definition'** 
- Secondary: 'Definition', 'Axiom', 'Hypothesis'

**Primary: 'Group'** (Chapter containers)
- Secondary: 'Chapter', 'Section', 'Subsection', 'MultiPart', 'Appendix'

**Primary: 'Proposition'**
- Secondary: 'Proposition', 'Lemma', 'Theorem', 'Corollary'

### Dependency Rules
- **References can only point to leaf nodes** (Definition, Proposition, Comment nodes)
- **Chapter/Group nodes must NOT reference other nodes** (empty `references: []`)
- **Avoid circular dependencies** - if A references B, B cannot reference A (directly or indirectly)
- **All referenced node IDs must exist** in the book

### Required Structure
- **Node ID consistency**: Node ID must match its object key in `nodes`
- **Required fields**: `id`, `reference`, `name`, `statement`, `nodetype`, `references`, `chapter`
- **Chapter hierarchy**: All nodes must belong to a valid chapter ID
- **LaTeX syntax**: Use `$inline$` or `$$display$$` - verify syntax is valid

### Common Validation Errors
- **Invalid node type**: Check primary/secondary combination exists
- **Invalid references**: Referencing Group/Chapter nodes or non-existent IDs  
- **Circular dependencies**: A → B → A reference chains
- **Missing chapters**: Node belongs to chapter ID that doesn't exist
- **Malformed LaTeX**: Syntax errors in mathematical expressions
- **ID mismatches**: Node object key doesn't match internal `id` field