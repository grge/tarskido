# Tarskido

**Tarskido** is an experimental platform for authoring and reading mathematics books or notes as a directed graph of definitions and propositions. It aims to make the natural graph structure of mathematical knowledge an explicit part of learning and reading. I've built this as a personal project, and have found it a useful way to organise my notes while study new topics. If you find it useful, or if you have any feedback or suggestions, I'd love to hear from you!

![Tarskido screenshot](screenshot.png)

## Features
- **Graph-based navigation** of mathematical content, with visualisations powered by the wonderful [dagre](https://github.com/dagrejs/dagre) layout engine.
- **Dependency-aware layout**: For example, view the prerequisites of a definition or theorem in a natural order on a single page.
- **In-browser editing**, with content rendered via [markdown-it](https://github.com/markdown-it/markdown-it) and [katex](https://katex.org/).
- **Local-first**: Books live in local storage and can be edited and viewed offline, or exported as JSON and shared with others.

## Demo

https://grge.github.io/tarskido/

## Installation

You can run Tarskido locally:

```bash
git clone https://github.com/grge/tarskido.git
cd tarskido
npm install
npm run dev
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build production bundle  
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint with auto-fix on all Vue/JS/TS files
npm run type-check       # Run TypeScript type checking with vue-tsc
npm run format           # Format source code with Prettier

# Testing
npm run test             # Run tests with Vitest in watch mode
npm run test:run         # Run tests once without watch mode

# Deployment & Utilities
npm run deploy           # Deploy to GitHub Pages using gh-pages
npm run import-book      # Import a book from JSON file for puppeteer testing
```

### Code Quality Tools

The project uses several tools to maintain code quality:

- **ESLint**: Linting for Vue 3, TypeScript, and JavaScript files
- **TypeScript**: Static type checking with strict configuration
- **Prettier**: Automatic code formatting
- **Vitest**: Unit testing framework

To check your code before committing:

```bash
npm run lint          # Check and auto-fix linting issues
npm run type-check    # Verify TypeScript types
npm run test:run      # Run all tests
```

### Testing

Tests are written using Vitest and Vue Test Utils. Test files should be placed in the `test/` directory and follow the naming convention `*.test.ts` or `*.test.js`.

```bash
npm run test          # Run tests in watch mode during development
npm run test:run      # Run tests once (useful for CI/CD)
```

## GitHub Pages Deep-Link Routing

Tarskido is deployed as a SPA under the subpath `/tarskido/` on GitHub Pages.
Direct links like `/tarskido/book/<slug>` need fallback handling because GitHub Pages serves static files only.

The project uses a two-step fallback strategy:

1. **`public/404.html`** captures unknown static paths and redirects to:
   - `/tarskido/?/book/<slug>`
2. **Client startup normalization** rewrites `?/...` URLs back to real SPA paths before/after router init.

Relevant files:
- `public/404.html` (GitHub Pages fallback redirect)
- `src/router/index.ts` (pre-router `?/` normalization)
- `src/main.ts` (post-bootstrap safety-net `router.replace(...)`)

If direct links regress, verify those three files together and test in a fresh incognito tab.
