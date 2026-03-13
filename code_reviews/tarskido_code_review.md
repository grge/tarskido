# Tarskido Code Review
**Date:** 2026-03-14  
**Reviewer:** John  
**Scope:** Comprehensive architectural, code quality, UX/DX assessment

---

## Executive Summary

Tarskido is a **well-structured, functional Vue 3 application** for authoring mathematical content as directed graphs. The codebase demonstrates solid architectural decisions and modern Vue/TypeScript practices. However, it shows signs of being a **prototype-turned-real-project** with several rough edges around validation, user experience, and production readiness.

**Overall Health:** 🟡 **Good foundation, needs polish**

**Key Strengths:**
- Clean architecture with proper separation (Pinia stores, composables, utils)
- Solid graph algorithms and mathematical rendering
- Good TypeScript typing in core data structures
- Effective testing coverage (1132 lines of tests)
- Smart handling of GitHub Pages SPA routing

**Critical Issues:**
- No client-side validation before saving malformed data
- Weak error handling and user feedback
- Performance concerns with large graphs
- Missing accessibility features
- Inconsistent user experience patterns

---

## 🔴 Critical Bugs & Issues

### 1. **No JSON Validation on Save** ⚠️ HIGH PRIORITY
**Location:** `bookStore.ts` - `persistBook()`, `upsertNode()`

**Problem:** Users can create invalid nodes that break rendering:
- Invalid node type combinations
- Circular dependencies
- Chapter nodes with references
- Non-existent reference IDs

**Impact:** Users don't discover errors until **after** they've saved, navigated away, and the book won't render properly.

**Evidence:** We literally just fixed a broken book where chapters had references and invalid node types existed.

**Fix Required:**
```typescript
// Need validation before persist:
function validateNode(node: Node): ValidationResult {
  // 1. Check node type is valid
  // 2. Check references exist
  // 3. Check for circular deps
  // 4. Check Group nodes have empty references
  return { valid: true, errors: [] };
}

function upsertNode(node: Node) {
  const validation = validateNode(node);
  if (!validation.valid) {
    throw new ValidationError(validation.errors);
  }
  rawBook.value.nodes[node.id] = node;
}
```

### 2. **Silent Failures in BookShelfStore** ⚠️ MEDIUM
**Location:** `bookShelfStore.ts` - `fetchRemoteIndex()`, `getBookData()`

**Problem:** Network failures and missing books log to console but give users no feedback.

```typescript
catch (error) {
  console.warn('Failed to fetch remote books:', error);
  // ❌ User sees nothing!
}
```

**Fix:** Need a toast notification system or error state in UI.

### 3. **Slug Collision Silently Breaks Navigation** ⚠️ MEDIUM
**Location:** `bookStore.ts` - `updateSlugMap()`, `NodeEdit.vue`

**Problem:** The edit form shows a visual warning for slug collisions but **still allows saving**. This creates broken internal links.

**Current behavior:**
- User sees red warning "⚠️ Slug already exists"
- User can still save
- Navigation breaks because `slugMap` points to wrong node

**Fix:** Block save operation when `slugCollision === true`.

### 4. **Graph Rendering Performance** ⚠️ MEDIUM-LOW
**Location:** `ContextGraph.vue`, `useGraphLayout.ts`

**Problem:** Every graph option change triggers:
1. Full graph rebuild (`buildContextGraph`)
2. DOM measurement pass
3. Dagre layout calculation
4. SVG re-render

For large books (>100 nodes), this causes noticeable lag.

**Evidence:**
```typescript
watch(rawGraph, async g => {
  await nextTick();
  const root = measureRoot.value;
  // Measures EVERY node in the subgraph
  root.querySelectorAll('.measure-node').forEach(...)
})
```

**Optimization ideas:**
- Memoize graph builds for same options
- Debounce option changes
- Virtual rendering for large graphs

---

## 🟡 Architectural Issues

### 1. **Tight Coupling Between Router and Store** 
**Location:** `router/index.ts`

**Problem:** Router navigation guard does heavy store operations:
```typescript
router.beforeEach(async (to, from, next) => {
  if (to.matched.some(r => r.meta.requiresBook)) {
    await shelf.initialise();
    const bookId = shelf.resolveBookParam(rawParam);
    // Loads entire book into memory...
    const bookData = await shelf.getBookData(bookId);
    bookStore.loadFromJSON(bookData, bookId);
  }
})
```

**Issues:**
- Every navigation loads the full book (even if already loaded)
- No loading states shown to user
- Failed loads just 404 (no retry, no helpful message)

**Better approach:** Move book loading to a composable that components can call, show skeleton loaders.

### 2. **Inconsistent State Management**
**Problem:** Some state lives in stores, some in component refs, some in URL params.

**Example:** Graph visibility (`graphHidden`) is component-local in `NodeDetails.vue`:
```typescript
const graphHidden = ref(false);
```

If user toggles graph, navigates away, and comes back → **state is lost**.

**Better:** Persist UI preferences (graph visibility, animation settings) to localStorage.

### 3. **Migration Logic Embedded in Store**
**Location:** `migration.ts`, `bookStore.ts`

**Problem:** Migration runs inline during book load. For complex migrations, this blocks the UI thread.

**Better approach:**
- Run migrations in a Web Worker
- Show migration progress for large books
- Allow user to cancel/rollback migrations

### 4. **No Undo/Redo System** 💭 FEATURE GAP
**Impact:** Users editing complex mathematical proofs can't undo mistakes. This is a **major UX gap** for an editing tool.

**Implementation idea:**
- Store edit history in Pinia (or separate history store)
- Implement command pattern for all mutations
- Add keyboard shortcuts (Cmd+Z / Cmd+Shift+Z)

---

## 🟠 Code Quality Issues

### 1. **TODOs Indicate Unfinished Work**
```bash
src/components/BookShelf.vue:      // TODO: Show user-friendly error message
src/components/BookShelf.vue:  // TODO: Add confirmation dialog
src/utils/graphUtils.ts:  // TODO: This is probably not what we really want...
src/utils/migration.ts:    // TODO: Make sure version is actually updated when we write to localstorage
```

Most concerning:
```typescript
// TODO: This is probably not what we really want...
// But this ensures we get all the nodes in the graph,
// AND that we get their correct parent relationship.
const collapsedNodes = new Set<string>(uf.parent.values());
```

☝️ This comment in `collapseHierarchy()` suggests the algorithm isn't fully understood/trusted.

**Action:** Either fix it properly or document why this approach is correct.

### 2. **Inconsistent Error Handling**
Some functions throw errors:
```typescript
if (!bookData) {
  console.error('No book found in localStorage with key:', key);
  // Throws? Returns? Unclear!
}
```

Others return null:
```typescript
async getBookData(bookId: string): Promise<object | null> {
  if (!meta) {
    console.warn(`Book ${bookId} not found`);
    return null;
  }
}
```

**Fix:** Establish consistent error handling pattern (Either-style results or exceptions with global handler).

### 3. **Type Safety Gaps**
**Location:** Multiple files use `any`:
```typescript
async duplicateBook(sourceBook: any) { // ❌ Should be Book type
  const bookCopy = JSON.parse(JSON.stringify(rawBook.value)); // ❌ Loses types
}

addOrUpdateBook(bookData: object) { // ❌ Should be Book
  const book = bookData as any; // ❌ Unsafe cast
}
```

**Fix:** Replace `any` with proper types, use structured cloning or a typed clone function.

### 4. **Graph Utility Functions Need Cleanup**
**Location:** `graphUtils.ts`

```typescript
function depth(n) { // ❌ No types!
  if (graph.parent(n)) return 1 + depth(graph.parent(n));
  return 0;
}
```

This local function in `contextGraph.ts` has:
- No type annotations
- No memoization (recalculates depth repeatedly)
- Could cause stack overflow on deep graphs

**Fix:**
```typescript
function computeDepths(graph: Graph): Map<string, number> {
  const depths = new Map<string, number>();
  function visit(n: string): number {
    if (depths.has(n)) return depths.get(n)!;
    const p = graph.parent(n);
    const d = p ? 1 + visit(p) : 0;
    depths.set(n, d);
    return d;
  }
  graph.nodes().forEach(visit);
  return depths;
}
```

---

## 🟣 User Experience Issues

### 1. **No Confirmation Dialogs for Destructive Actions** ⚠️
**Location:** `NodeEdit.vue`, `BookShelf.vue`

Users can delete nodes or entire books with a single click:
```vue
<el-button @click="deleteThisNode">Delete this node</el-button>
<!-- No "Are you sure?" -->
```

**Critical for:**
- Deleting books (permanent!)
- Deleting nodes with many dependents
- Clearing proof lines

**Fix:** Add `ElMessageBox.confirm()` before destructive operations.

### 2. **Poor Empty States**
When users:
- Create a new book → dropped into empty edit form (confusing)
- Have no local books → just see "Your Books" with nothing underneath
- View a chapter with no children → blank space

**Better UX:**
- New book wizard with templates
- Empty state illustrations with "Create your first book" CTA
- Chapter pages show "No content yet" with add button

### 3. **No Loading States**
**Location:** All async operations

Book loading, remote index fetching, graph layout — all happen invisibly. Users see:
- Blank screens (looks broken)
- Flash of wrong content
- Sudden layout shifts

**Fix:** Add skeleton loaders, progress indicators, optimistic UI updates.

### 4. **Graph Controls Hidden Until After First Load**
**Location:** `ContextGraph.vue`

The graph options menu (`GraphOptionsMenu`) exists, but users might not discover it. No tutorial, no "first time" hints.

**Suggestion:** Add a "?" help button with keyboard shortcuts and graph controls explanation.

### 5. **Mobile Experience Not Considered**
**Evidence:**
- Desktop-only hover states
- Small touch targets (delete buttons, nav links)
- Graph visualization doesn't work on mobile
- No mobile-responsive layouts for node editing

**Impact:** Tarskido is desktop-only, limiting audience.

---

## 🔵 Developer Experience Issues

### 1. **Limited Documentation**
**README:** Covers installation/commands but not:
- Architecture decisions (why Dagre? why Pinia?)
- How graph algorithms work
- How to add a new node type
- Testing strategy

**AGENTS.md:** Good start but missing:
- Common debugging scenarios
- How to add a new view
- Performance profiling tips

**Fix:** Add `ARCHITECTURE.md` and `CONTRIBUTING.md`.

### 2. **Test Coverage Gaps**
**Current:** 1132 lines of tests, focused on:
- `bookStore.test.ts` (unit tests for store logic)
- Graph utils (unit tests for algorithms)

**Missing:**
- Integration tests (router + stores)
- Component tests (Vue Test Utils)
- E2E tests (Playwright is installed but no tests!)

**High-value test targets:**
- Node editing flow (create → edit → save → navigate)
- Book import/export
- Circular dependency detection
- Graph rendering with various options

### 3. **No Dev Tools Integration**
Vue DevTools works, but custom integrations would help:
- Pinia devtools timeline events for undo/redo
- Graph visualization debug overlay
- Validation error inspector

### 4. **Build/Deploy Process Fragile**
**Location:** GitHub Pages deployment

Current process:
1. Manual `npm run build && npm run deploy`
2. `gh-pages` tool pushes to `gh-pages` branch
3. Hope it works

**Problems:**
- No CI/CD (no automated tests before deploy)
- No deploy previews
- No rollback mechanism
- Manual process (easy to forget tests)

**Fix:** Add GitHub Actions workflow:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:run
      - run: npm run build
      - run: npm run deploy
```

---

## 🟢 What's Working Well

### ✅ **Strong Core Architecture**
- Pinia stores are well-structured
- Clear separation of concerns (stores / composables / utils)
- Graph algorithms are solid (dagre integration, transitive reduction)
- Good use of Vue 3 composition API

### ✅ **Type Safety (Mostly)**
The `Node` and `Book` types are well-defined with discriminated unions:
```typescript
type NodeType =
  | { primary: 'Comment'; secondary: CommentSubType }
  | { primary: 'Definition'; secondary: DefinitionSubType }
  // etc.
```

This prevents many invalid states at compile time.

### ✅ **Smart URL Handling**
The GitHub Pages SPA fallback is clever and well-documented:
- `public/404.html` → redirects to `?/path`
- `router/index.ts` → normalizes before router init
- `main.ts` → safety-net normalization

This is a common pain point and you've solved it well.

### ✅ **Mathematical Rendering**
KaTeX integration works smoothly. Markdown + math is the right choice for mathematical content.

### ✅ **Graph Visualization**
The SVG rendering with D3 curve generation and dagre layout is professional-grade. The animation system (TransitionGroup) is smooth.

---

## 📊 Metrics & Statistics

### Codebase Size
- **Total lines (src/):** ~7,000-8,000 (estimated)
- **Test lines:** 1,132
- **Components:** 17 Vue files
- **Stores:** 2 Pinia stores
- **Utilities:** 3 utility modules
- **Test coverage:** Partial (stores + utils, missing components/integration)

### Dependencies
**Good:**
- Core deps are stable (Vue 3, Pinia, Dagre, KaTeX)
- Element Plus for UI components (mature library)

**Concerns:**
- `dagre-d3` is listed but appears unused (dead dep?)
- Multiple overlapping CSS processors (Sass + Stylus)
- Old TypeScript version (4.8.4, latest is 5.x)

### Bundle Size (estimated)
Haven't measured, but likely concerns:
- Element Plus is large (~500KB)
- Dagre + graphlib (~100KB)
- All math books loaded into localStorage

**Suggestion:** Implement code splitting and lazy loading for books.

---

## 🎯 Strategic Direction & Missing Features

### What's Missing for a "1.0" Launch

#### 1. **Collaboration Features** (Nice-to-have)
Currently Tarskido is single-user, local-only. Future:
- Export/share book URLs
- Real-time collaboration (operational transforms?)
- Comments/annotations on nodes
- Version history (Git-style diffs)

#### 2. **Search & Discovery** (High Priority)
**Current:** No search functionality at all.

**Needed:**
- Full-text search across nodes
- Filter by node type
- Find all references to a node
- Search within proofs

**Implementation:** Lunr.js or Fuse.js for client-side search.

#### 3. **Book Templates & Examples** (Medium Priority)
**Current:** Users start from blank book.

**Better:**
- Templates (algebra, topology, analysis)
- Example books in different styles
- Import from LaTeX (future: parse .tex files)

#### 4. **Export Formats** (Medium Priority)
**Current:** JSON only.

**Wanted:**
- PDF export (print-quality)
- LaTeX export (for journal submission)
- HTML export (static site)
- Anki flashcard export (spaced repetition)

#### 5. **Accessibility** (High Priority for Public Use)
**Current state:** Poor.

**Missing:**
- Keyboard navigation (arrow keys between nodes)
- Screen reader support (ARIA labels)
- High-contrast mode
- Focus management (skip links, focus trapping)

**Critical for:** Academic use (accessibility requirements).

#### 6. **Offline Support** (Medium Priority)
**Current:** Partial (localStorage works offline, but remote books don't).

**Better:**
- Service Worker for full PWA
- Sync when back online
- Offline indicator

---

## 🛠️ Recommended Improvements (Prioritized)

### 🔴 Must-Fix (Before Public Launch)
1. **Add validation on save** (prevent invalid nodes)
2. **Confirmation dialogs for deletes** (prevent data loss)
3. **Fix slug collision blocking** (navigation breaks)
4. **Add error messages to UI** (users see failures)
5. **Loading states everywhere** (UX polish)

### 🟡 Should-Fix (Before 1.0)
6. **Search functionality** (core feature)
7. **Undo/redo system** (editing UX)
8. **Better empty states** (onboarding)
9. **Type safety cleanup** (remove `any`)
10. **CI/CD pipeline** (quality gate)

### 🟢 Nice-to-Have (Post-1.0)
11. **Mobile responsive design**
12. **Export to PDF/LaTeX**
13. **Book templates**
14. **Collaboration features**
15. **Accessibility improvements**

---

## 🎨 Design & UX Patterns

### What Works
- **Book metaphor** (shelf → book → chapters → nodes) is intuitive
- **Graph-first navigation** is unique and powerful
- **Inline editing** (click to edit) is smooth

### What Needs Work
- **Inconsistent button styles** (mix of Element Plus and custom)
- **No design system** (colors, spacing, typography are ad-hoc)
- **Overwhelming edit forms** (too many fields, no progressive disclosure)

**Suggestion:** Adopt a design system (Tailwind + headlessUI, or Vuetify, or Element Plus consistently).

---

## 🔐 Security Considerations

### Current State: **Low Risk** (Local-only app)
Since Tarskido runs client-side with localStorage:
- No server = no server-side attacks
- No auth = no auth exploits
- No user data upload = no privacy concerns

### Future Risks (If Adding Server Features)
- **XSS via markdown:** LaTeX/markdown rendering could inject scripts
  - **Mitigation:** Sanitize markdown (DOMPurify) before rendering
- **CSRF on book sharing:** If adding server sync
  - **Mitigation:** Use tokens
- **DoS via large books:** Malicious JSON could freeze browser
  - **Mitigation:** Validate file size, node count before import

---

## 🧪 Testing Strategy Recommendations

### Current Coverage
✅ **Unit tests:** Store logic, graph algorithms  
❌ **Component tests:** None  
❌ **Integration tests:** None  
❌ **E2E tests:** Playwright installed but unused

### Recommended Test Pyramid
```
     /\       E2E (5%)        - Critical user flows
    /  \      Integration (15%) - Store + router + components  
   /____\     Unit (80%)        - Pure functions, store logic
```

### High-Value E2E Tests (Playwright)
1. **Create and edit a book**
   - New book → add chapter → add definition → add theorem referencing definition
2. **Import a book**
   - Import JSON → verify nodes render → verify graph displays
3. **Navigation flow**
   - Open book → click node → view graph → navigate via prev/next

### Component Test Priorities
1. `NodeEdit.vue` - Complex form validation
2. `GraphRenderer.vue` - SVG rendering with various graphs
3. `BookShelf.vue` - Book CRUD operations

---

## 💡 Quick Wins (High Impact, Low Effort)

1. **Add `ElMessageBox.confirm()` to all delete buttons** (30 min)
2. **Show loading spinner on book load** (15 min)
3. **Add "Are you sure?" to slug collision save** (20 min)
4. **Fix TypeScript `any` types in bookShelfStore** (1 hour)
5. **Add placeholder text to empty book shelf** (30 min)
6. **Update TypeScript to 5.x** (15 min)
7. **Remove unused `dagre-d3` dependency** (5 min)
8. **Add `.nvmrc` or `.node-version` file** (5 min)

Total: **~3.5 hours** for significant UX/DX improvements.

---

## 🏗️ Big Design Questions

### 1. **Should Tarskido Support Non-Mathematical Content?**
Current design assumes math (LaTeX, theorems, proofs). Could it be:
- A general knowledge graph tool?
- A programming concept explorer?
- A literature annotation tool?

**Trade-off:** Generalization adds complexity vs. focus on math makes it best-in-class for that niche.

### 2. **Local-First vs. Cloud-First?**
**Current:** Local-first (localStorage).

**Future options:**
- Add optional cloud sync (user choice)
- Full cloud platform (CMS-style)
- Hybrid (local with manual sync)

**Consideration:** Academic users value control over their data → local-first is good.

### 3. **Should Nodes Support Rich Media?**
**Current:** Text + LaTeX only.

**Possible additions:**
- Images (diagrams, illustrations)
- Videos (lecture clips)
- Audio (pronunciation guides)
- Interactive widgets (Desmos graphs, Geogebra)

**Concern:** Scope creep. Start with images (high value, bounded complexity).

---

## 🎓 Learning Opportunities

### For Future Contributors
This codebase is an excellent learning resource for:
- **Graph algorithms in practice** (Dagre, topological sort, transitive reduction)
- **Vue 3 Composition API** (clean, modern patterns)
- **Pinia state management** (better than Vuex for TypeScript)
- **Mathematical typesetting** (KaTeX integration)

### Potential Tutorial Topics
1. "Building a graph-based knowledge tool with Vue"
2. "Implementing undo/redo in Pinia"
3. "Client-side search with Lunr.js"
4. "Deploying Vue SPAs to GitHub Pages"

---

## 📝 Conclusion

Tarskido is a **solid foundation** for a mathematical authoring tool with **real potential**. The core architecture is sound, the graph visualization is impressive, and the mathematical rendering works well.

**However**, it needs **polish and validation** before public launch:
- Prevent users from creating invalid data
- Improve error handling and user feedback
- Add essential UX features (undo, search, confirmations)
- Increase test coverage

**Recommendation:** Spend 2-3 weeks on the "Must-Fix" items, then do a soft launch to get feedback from mathematicians. Use that feedback to prioritize the "Should-Fix" and "Nice-to-Have" lists.

**Long-term vision:** If the goal is to build a **tool for the mathematical community**, consider:
- Making it more collaborative (comments, sharing)
- Supporting import/export to standard formats (LaTeX, PDF)
- Building a public library of open-source mathematical texts

This could genuinely fill a gap in mathematical education and research tooling.

---

## 📚 Appendix: File-by-File Notes

### `src/stores/bookStore.ts`
- **Good:** Strong typing, clear method names, computed properties for derived state
- **Bad:** No validation on `upsertNode()`, `persistBook()` saves invalid data
- **Fix:** Add `validateNode()` and `validateBook()` functions

### `src/stores/bookShelfStore.ts`
- **Good:** Clean separation of local vs. remote books
- **Bad:** Silent failures, unsafe type casting (`bookData as any`)
- **Fix:** Proper error handling, remove `any` types

### `src/router/index.ts`
- **Good:** Smart handling of GitHub Pages fallback
- **Bad:** Heavy logic in navigation guard, no loading states
- **Fix:** Move book loading to composable, add loading UI

### `src/utils/contextGraph.ts`
- **Good:** Sophisticated graph manipulation algorithms
- **Bad:** Complex logic with few comments, non-memoized depth calculation
- **Fix:** Add JSDoc comments, memoize expensive operations

### `src/utils/graphUtils.ts`
- **Good:** Solid implementations of graph algorithms
- **Bad:** `collapseHierarchy()` has uncertain correctness (per TODO comment)
- **Fix:** Verify algorithm, add comprehensive tests

### `src/components/NodeEdit.vue`
- **Good:** Comprehensive edit form, nice UX for slug management
- **Bad:** Allows saving with slug collisions, no undo
- **Fix:** Block save on validation errors, add undo buffer

### `src/components/ContextGraph.vue`
- **Good:** Elegant graph visualization, smooth animations
- **Bad:** Performance issues with large graphs, no error states
- **Fix:** Add virtualization, show errors gracefully

### `src/components/GraphRenderer.vue`
- **Good:** Clean SVG generation, nice transitions
- **Bad:** No accessibility (ARIA labels), hard to navigate with keyboard
- **Fix:** Add ARIA, keyboard controls

---

## Addendum: Empirical Build Health Check (run after initial review)

I ran the actual quality gates to validate assumptions.

### Command Results

#### 1) `npm run test:run`
- **Status:** ❌ Failing
- **Result:** 9 failed / 65 total tests
- **Concentration:** `test/stores/bookStore.test.ts` (slug generation, slug map updates, reference sorting, param resolution)

**Interpretation:**
- Either tests are stale after recent refactors, or core store behavior regressed.
- Because failures are clustered in navigation/slug/reference logic, this directly affects routing and editing reliability.

#### 2) `npm run type-check`
- **Status:** ❌ Failing hard
- **Result:** hundreds of TS errors across most Vue components/stores
- Repeated pattern: `Module '"vue"' has no exported member 'computed'|'ref'|'watch'` and template inference failures (`Property 'x' does not exist on type '{}'`).

**Interpretation:**
- This is **not** just minor typing cleanup; type-checking appears fundamentally broken in current setup.
- Most likely causes:
  - TS/Volar config mismatch,
  - corrupted `env.d.ts` shims,
  - dependency/type version drift,
  - or build passes despite broken static typing because ts checks are not gating deploy.

#### 3) `npm run lint`
- **Status:** ❌ Failing (26 errors, 29 warnings)
- High-signal findings:
  - `vue/no-mutating-props` in `GraphOptionsMenu.vue` (state flow anti-pattern)
  - Parsing errors in `GraphRenderer.vue`
  - missing keys / duplicate keys / unused vars in multiple components
  - `no-inner-declarations` in migration

### Specific High-Risk Defect Found

#### `GraphRenderer.vue` has malformed template markup
In the node `<rect>` block, opening tag is missing `>` before closing tag, causing parse/lint errors:

```vue
<rect ...
  :class="..."
</rect>
```

This should be:

```vue
<rect ...
  :class="..."
></rect>
```

That’s a concrete template correctness bug and should be fixed immediately.

### Practical Reassessment of Project State

Initial assessment said “good foundation, needs polish.” After running gates, the stricter reality is:

- Runtime app works enough for manual usage and deployment ✅
- Engineering baseline (tests/types/lint) is currently **red** ❌
- Team velocity risk is high: changes can break silently because quality gates are not clean.

So the project is currently in a **prototype-with-production-usage** phase, not release-ready engineering maturity.

## Revised Priority Plan (2 tracks)

### Track A — Stabilization Sprint (must happen first)
1. Fix template/parsing blockers (`GraphRenderer.vue`, `NodeProof.vue`, etc.)
2. Restore `vue-tsc` health (resolve Vue type export/inference meltdown)
3. Make lint pass without `--fix` side effects introducing regressions
4. Repair or update failing `bookStore` tests to match intended current behavior
5. Gate deploy on: test + type-check + lint

### Track B — Product Improvements (after gates are green)
1. Validation-on-save for node/book integrity
2. Delete confirmations + error toasts
3. Undo/redo and search
4. Graph perf optimizations for larger books
5. Accessibility and mobile support

## Suggested Definition of “Healthy Main Branch”

Require all before deploy:
- `npm run test:run` passes
- `npm run type-check` passes
- `npm run lint` passes
- smoke navigation test on one complex book (direct chapter URL + node URL)

Until then, treat deployments as experimental.

**End of Review**
