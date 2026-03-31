# Tarskido

[![CI](https://github.com/grge/tarskido/actions/workflows/ci.yml/badge.svg)](https://github.com/grge/tarskido/actions/workflows/ci.yml)
[![Deploy](https://github.com/grge/tarskido/actions/workflows/deploy.yml/badge.svg)](https://github.com/grge/tarskido/actions/workflows/deploy.yml)

**Tarskido** is an experimental platform for authoring and reading mathematics as a directed graph of definitions and propositions. It makes the natural graph structure of mathematical knowledge an explicit part of learning and reading.

## Demo

**Live demo:** https://grge.github.io/tarskido/

## Features

- **Graph-based navigation** of mathematical content with dependency-aware layout
- **In-browser editing** with markdown and LaTeX support  
- **Local-first** storage with JSON import/export
- **Interactive visualizations** powered by dagre layout engine

## Development

```bash
git clone https://github.com/grge/tarskido.git
cd tarskido
npm install
npm run dev
```

### Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run test             # Run tests
npm run type-check       # TypeScript checking
npm run lint             # ESLint with auto-fix
npm run deploy           # Deploy to GitHub Pages
node scripts/check-books.js  # Validate book content
```

## Architecture

- **Vue 3** + TypeScript + Pinia
- **Vite** for build tooling
- **Vitest** for testing
- **dagre** for graph layout
- **markdown-it** + **KaTeX** for content rendering

Built for GitHub Pages with SPA routing fallbacks.
