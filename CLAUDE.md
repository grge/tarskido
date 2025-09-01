# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally

### Code Quality & Testing
- `npm run lint` - Run ESLint with auto-fix on all Vue/JS/TS files
- `npm run type-check` - Run TypeScript type checking with vue-tsc
- `npm run format` - Format source code with Prettier
- `npm run test` - Run tests with Vitest in watch mode
- `npm run test:run` - Run tests once without watch mode

### Deployment & Utilities
- `npm run deploy` - Deploy to GitHub Pages using gh-pages
- `npm run import-book <path>` - Import a book from JSON file into localStorage for puppeteer testing

### Pre-commit Quality Checks
Before committing code, run these commands to ensure quality:
```bash
npm run lint          # Fix linting issues automatically
npm run type-check    # Verify TypeScript types
npm run test:run      # Run all tests once
```

### Code Quality Tools Status
- **ESLint**: ✅ Fully operational with Vue 3 + TypeScript support
- **TypeScript**: ✅ Working with ~70 known type issues (see Linting-TypeScript-Recovery-Report.md)
- **Prettier**: ✅ Configured for consistent formatting
- **Vitest**: ✅ Testing framework with Vue Test Utils

## Architecture Overview

Tarskido is a Vue 3 application for authoring mathematical content as directed graphs. The core architecture revolves around:

### Data Model
- **Books**: Top-level containers with metadata (title, author, preface) and collections of nodes
- **Nodes**: Mathematical entities (definitions, propositions, theorems, etc.) with:
  - Typed categories (Comment, Definition, Group, Proposition) with subtypes
  - Reference relationships creating dependency graphs
  - Hierarchical chapter organization
  - Proof structures with line-by-line references

### Key Stores (Pinia)
- `bookShelfStore.ts`: Manages book collection, loading/saving from localStorage
- `bookStore.ts`: Single book state, graph generation, and node operations

### Graph System
- Uses `@dagrejs/graphlib` for graph data structures
- `graphlib_ext.js`: Extended graph implementation
- `contextGraph.ts`: Builds focused subgraphs around selected nodes with configurable traversal
- `useGraphLayout.ts`: Handles dagre layout with DOM measurement for accurate node sizing
- Graph visualization powered by dagre layout engine with D3-based rendering

### Routing Structure
- Nested routes: `/book/:bookParam` → `/book/:bookParam/:nodeParam`
- Smart parameter resolution supporting both IDs and human-readable slugs
- Layout components: `BookLayout.vue` and `NodeLayout.vue` for nested views

### Core Components
- `GraphRenderer.vue`: SVG-based graph visualization with interactive navigation
- `ContextGraph.vue`: Manages context-aware graph filtering and display
- `MarkdownRenderer.vue`: Mathematical content rendering with KaTeX support
- `BookShelf.vue`: Book management interface

### Storage & Persistence
- Local-first design using localStorage with key pattern `tarskido-book-{id}`
- JSON export/import for sharing
- Automatic migration system in `migration.ts`
- Real-time persistence with debounced saves (50ms)

### Technical Stack
- Vue 3 with Composition API and TypeScript
- Pinia for state management
- Vue Router with nested routes and guards
- Element Plus UI components
- Vite build system with base path `/tarskido/` for GitHub Pages
- KaTeX for math rendering via markdown-it plugins

## Task Management

The STACK file contains prioritized tasks:
- HP: High Priority - Completely broken or incredibly annoying unless fixed
- MP: Medium Priority - Must fix before releasing MVP  
- LP: Low Priority - Want to fix, but could release without it

When picking tasks, consider your capabilities and start with items you can complete successfully.

## Git Conventions

- Keep commit messages clean and professional
- Do not include AI assistant references or co-authoring credits
- Focus commit messages on what was changed and why

## Testing with Sample Data

### Group Theory Test Book
When testing features that require a book with content, use the Group Theory book:

**Location**: `/home/george/Documents/59a3efb3-a01a-4a9f-81a4-831f7d45ebc0.json`
**Book ID**: `59a3efb3-a01a-4a9f-81a4-831f7d45ebc0`
**Book slug**: `group-theory`

### Importing the Test Book
To import the Group Theory book for testing:
1. **Manual import**: Start dev server, go to homepage, click "Import book", select the JSON file
2. **Automated import**: Use `npm run import-book /home/george/Documents/59a3efb3-a01a-4a9f-81a4-831f7d45ebc0.json`

After importing, the book will be available at: `http://localhost:5173/tarskido/book/group-theory`

### Browser Testing
- Use Puppeteer MCP tools for browser automation and screenshots
- Browser sessions start with blank localStorage - always import test book first
- Example: Navigate to `http://localhost:5173/tarskido/` and use `mcp__puppeteer__puppeteer_screenshot` to inspect UI

### Direct Book Import via Browser Console
When the standard import methods fail (e.g., in headless mode where file dialogs don't work), use this approach:

1. **Navigate to the app homepage**: `http://localhost:5173/tarskido/`
2. **Execute this script in browser console**:
```javascript
// Replace '/path/to/book.json' with the actual path to your book JSON file
fetch('/path/to/book.json')  // or use relative path like '/numbers.json' if in public/
  .then(response => response.json())
  .then(bookData => {
    console.log('Starting direct import for:', bookData.title);
    
    // Access the Vue app and Pinia stores
    const app = document.querySelector('#app').__vue_app__;
    const pinia = app.config.globalProperties.$pinia;
    const stores = pinia._s;
    
    // Get store instances
    const shelfStore = stores.get('bookShelf');
    const bookStore = stores.get('book');
    
    if (bookStore && shelfStore) {
      // Import the book (same as BookShelf.vue importFromFile function)
      bookStore.loadFromJSON(bookData, bookData.id);
      shelfStore.addOrUpdateBook(bookData);
      
      // Navigate to the book
      const router = app.config.globalProperties.$router;
      router.push({ name: 'Book', params: { bookParam: bookData.slug || bookData.id } });
      
      console.log('Import completed! Book should now be visible.');
    } else {
      console.error('Could not find required stores');
    }
  })
  .catch(error => {
    console.error('Import failed:', error);
  });
```

3. **Alternative: Manual localStorage approach**:
```javascript
// If the above fails, manually add to localStorage
const bookData = { /* your book JSON data */ };
const key = `tarskido-book-${bookData.id}`;
localStorage.setItem(key, JSON.stringify(bookData));
location.reload(); // Refresh to see the book
```

**Note**: For the fetch approach to work, the JSON file must be accessible via HTTP (place in `public/` directory or use full file path if served).

## Styling Architecture

### Design System Overview
- **Location**: `src/styles/` directory with systematic approach
- **Token System**: CSS custom properties in `tokens.css` for consistent design
- **Typography**: Comprehensive type scale and font families in `typography.styl`
- **Theme Support**: Light/dark mode with `data-theme` attribute switching

### Design Tokens (`src/styles/tokens.css`)
- **Typography**: Fluid type scale (--fs-100 to --fs-800) with serif/sans/mono families
- **Colors**: OKLCH-based palette with semantic roles (--c-brand, --c-accent, --c-nav)
- **Spacing**: 8px grid system (--sp-1 to --sp-16)
- **Layout**: Border radius, shadows, transitions, z-index scale
- **Dark Mode**: Automatic theme variants with improved contrast

### Component Styling
- **Preprocessor**: Stylus throughout for consistency
- **Scoped Styles**: All components use `<style scoped lang="stylus">`
- **Token Usage**: Components reference design tokens instead of hardcoded values
- **Global Import**: Tokens and typography imported in App.vue for universal access

### Theme Management
- **Composable**: `useTheme.ts` for reactive theme state management
- **Persistence**: LocalStorage with system preference detection
- **UI Control**: Corner menu toggle with visual feedback
- **CSS Integration**: Seamless switching via `data-theme="dark"` attribute

### Academic Design Language
- **Primary Font**: Serif stack for mathematical content readability
- **UI Elements**: Sans-serif for interface components and navigation
- **Color Semantics**: Blue for references, green for navigation, red/orange for editing
- **Mathematical Focus**: KaTeX integration with consistent typography

## Testing Framework

### Unit Tests
- **Framework**: Vitest with Vue Test Utils
- **Location**: `test/` directory
- **Naming**: `*.test.ts` or `*.test.js`
- **Environment**: happy-dom (lightweight DOM simulation)

### Running Tests
```bash
npm run test          # Watch mode for development
npm run test:run      # Single run for CI/CD
```

### Test Structure
Tests are organized by feature:
- `test/stores/` - Pinia store tests
- `test/utils/` - Utility function tests
- `test/components/` - Vue component tests (when added)

### Writing Tests
Example test structure:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBookStore } from '@/stores/bookStore'

describe('BookStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should initialize with empty state', () => {
    const store = useBookStore()
    expect(store.rawBook.nodes).toEqual({})
  })
})
```
