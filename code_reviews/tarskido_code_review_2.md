Yes. I went through the source snapshot pretty closely. The short verdict:

This is a **promising MVP with real shape**, not just a pile of experiments. The core idea is clear, the app already has a working domain model, routing, editing flow, graph view, theming, remote/local books, and slug-based navigation. That is substantial.

But it is also at the stage where **a few architectural shortcuts are starting to harden into liabilities**. The biggest problem is not styling or little bugs. It is that the project currently has **weak boundaries between domain state, UI state, persistence, and permissions**. That makes the code pleasant in the small and slippery in the large. A classic prototype goblin.

One important caveat: the zip appears to contain only the `src/` tree. I could not inspect package metadata, test setup, lint config, build config, CI, or deployment config. So this review is strong on application code and weaker on toolchain health.

## Overall assessment

Right now I would place the project at:

**Late prototype / early MVP**

* The product concept is coherent.
* The data model is already doing useful work.
* The UI is beyond toy level.
* But the invariants are not yet strong enough for the codebase to scale safely.

It feels like a project that could absolutely become a solid long-term tool, but it now wants a **“tighten the engine mounts” pass** before more features pile on.

## The strongest parts

A few things are working well.

`bookStore` as a central book state store is the right instinct. The graph being derived from raw book data is also sensible. The context graph pipeline is interesting and nontrivial. The app already has a credible product loop: browse books, open book, navigate nodes, edit nodes, download/import, render markdown/math.

There is also a nice product direction emerging:

* local-first editing
* slug-based document navigation
* graph-assisted reading
* lightweight publishing / demo-book distribution

That is a real application shape, not random component soup.

## The biggest issues

### 1. Type system drift is severe

The most glaring example is in `src/stores/bookStore.ts`.

Your `Node` type says:

* `autoSlug: boolean`
* `proof_lines: string[]`

But the codebase actually treats nodes as if they have:

* `autoslug`
* `proof_lines: Array<{ statement: string; references: string[] }>`

Examples:

* `src/stores/bookStore.ts:53`
* `src/views/Book.vue:27`
* `src/views/NodeEdit.vue:44, 273, 290, 309`
* `src/utils/migration.ts:34`
* `src/components/NodeProof.vue:7`

This is not just a typing nit. It means the TypeScript model is currently lying about the runtime model. Once that happens, TS stops being a safety net and becomes decorative wallpaper.

This is the highest-priority cleanup.

What I would do:

* Define a real `ProofLine` interface.
* Fix `Node` to match reality.
* Standardize on `autoSlug` everywhere.
* Stop constructing invalid placeholder nodes with empty-string discriminants.

At the moment, the code frequently creates nodes whose `nodetype` is `{ primary: '', secondary: '' }`, which violates the declared union type anyway. That is another sign that the domain model is not being allowed to tell the truth.

### 2. Remote/local persistence is muddled

This is the architectural issue I would treat as the most important after the typing drift.

Remote books are fetched in `bookShelfStore.getBookData()` and marked `source = 'remote'` in memory. But then `bookStore.loadFromJSON(data, key)` sets `storageKey` and immediately calls `rebuildAndPersist()`, which writes the book into `localStorage` under `tarskido-book-${key}`:

* `src/stores/bookShelfStore.ts:186-206`
* `src/stores/bookStore.ts:152-155`
* `src/stores/bookStore.ts:127-136`

So a “remote” book load ends up being persisted through the same channel as editable local books.

Meanwhile you also write a separate remote cache entry:

* `tarskido-remote-${bookId}` at `src/stores/bookShelfStore.ts:205`

But that remote cache is never used for reads. So there are effectively **two persistence paths**, one of which appears dead, and the other smuggles remote books into the local-book storage space.

That produces a whole little circus:

* remote reads can become local persistence side effects
* source semantics become fuzzy
* shelf scanning only reads `tarskido-book-*`, not `tarskido-remote-*`
* permissions become easy to bypass
* future sync/version semantics will get weird fast

This should be split cleanly into:

* **loaded book state**
* **local editable persistence**
* **remote read-through cache** (optional)

And those should not all be the same mechanism wearing different hats.

### 3. Edit permissions are mostly UI-level, not model-level

You correctly compute `canEdit` / `effectiveEditMode` in the store. Nice. But many actual mutations ignore that.

Examples:

* `NodeList` always shows Edit/Delete buttons and allows deletion directly: `src/views/NodeList.vue:175-181`
* `handleDelete()` calls `store.deleteNode()` unconditionally: `src/views/NodeList.vue:83-99`
* `BookEdit` and `NodeEdit` do not appear to enforce editability at route or action level
* components mutate nested store state directly all over the place

So right now “remote is read-only” is not a hard rule. It is more like a polite suggestion taped to the wall.

If you want this app to support publishing/demo books cleanly, this needs hardening. The store should enforce permissions, not just the template.

### 4. The store is doing too much, and components mutate it too freely

`bookStore` currently mixes:

* domain model
* persistence
* graph derivation
* edit mode UI state
* navigation helpers
* slug helpers
* reference validation
* copy/delete behavior

That is still survivable at this size, but the sharper problem is that components also mutate `rawBook` deeply and directly.

Examples:

* `node.references = ...`
* `node.proof_lines.push(...)`
* `book.preface = ...`
* slug map mutations in watchers

That means invariants are not centralized. You cannot easily guarantee:

* slug map consistency
* graph consistency
* reference integrity
* permission integrity
* persistence timing

This is the point where you start wanting a more explicit domain API:

* `createNode`
* `updateNode`
* `deleteNode`
* `setBookSlug`
* `addReference`
* `removeReference`
* `setProofLines`
* `duplicateBook`
* `loadRemoteBook`
* `saveLocalBook`

Not because ceremony is cool. Ceremony is often a tax. But because right now the invariants are leaking everywhere.

## Concrete bugs and correctness issues

### `autoSlug` vs `autoslug` bug

This is real and immediate.

* Type/interface uses `autoSlug`: `src/stores/bookStore.ts:48`
* New node creation uses `autoslug`: `src/views/Book.vue:27`
* Node edit view reads/writes `node.autoslug`: `src/views/NodeEdit.vue`

So some nodes will not behave consistently depending on where they were created or migrated. That is a bug, not a style preference.

### `proof_lines` is typed wrong

Again, real bug territory.

The code treats proof lines as objects with `statement` and `references`, but the type says `string[]`. This undermines every consumer.

### Cycle detection ignores proof-line references

`nodeRefs(node)` includes proof-line references when building graph edges:

* `src/stores/bookStore.ts:56-64`

But `wouldCreateCycle()` only traverses `node.references`:

* `src/stores/bookStore.ts:344-362`

So the UI may claim it is preventing circular dependencies while still allowing cycles through proof-line references. That is exactly the kind of bug that produces head-scratching graph weirdness later.

### Markdown is currently XSS-prone

This one matters if imported books or remote books are not fully trusted.

`MarkdownRenderer` uses:

* `html: true`
* `v-html`

at:

* `src/components/MarkdownRenderer.vue:2-3`
* `src/components/MarkdownRenderer.vue:22-24`

That means a malicious imported or remote book could inject arbitrary HTML, and potentially script-bearing payloads depending on sanitization behavior downstream. This needs sanitization or HTML disabling unless you explicitly trust all content.

### “Read-only remote book” can still be mutated

As above, this is both architectural and user-facing correctness trouble.

### Remote cache is written but apparently unused

`tarskido-remote-*` is written but never read. That is dead-path complexity.

### Duplicate initialization / duplicated bootstrap logic

Theme initialization happens in both:

* `src/main.ts:34-36`
* `src/App.vue:15-17`

GitHub Pages fallback logic also appears in both:

* `src/main.ts:22-29`
* `src/router/index.ts:83+`

That is a little two-headed hydra. It might work, but duplicate bootstrap logic is where future bugs breed quietly in the attic.

### Dead or placeholder UI bits

* “View all books as list” is a dead `href="#"`: `src/views/Home.vue:21-23`
* GitHub link is still placeholder text: `src/components/HeaderBar.vue:55`
* `NotFound.vue` appears to be effectively empty
* several emitted values / computed values / helpers appear unused

### Inconsistent route param handling

There are traces of old param names:

* `bookid`, `nodeid` in `NodeReference` / `NodeProof`
* routes rely on `bookParam`, `nodeParam`, then inject `bookId`, `nodeId` later

Examples:

* `src/components/NodeReference.vue:37`
* `src/components/NodeProof.vue:22`
* `src/router/index.ts:21-68`

Even where it currently works, it feels brittle and historically accreted.

### Edit forms do not really behave like forms

You define form rules in `BookEdit` and `NodeEdit`, but I do not see actual submit/validate flow. The store is autosaving via deep watch anyway.

So the UX becomes:

* there are form validations
* but no save action
* and editing persists continuously
* and “Back” is really just navigation

That mismatch is confusing for both developers and users. Either go fully autosave and treat validation as inline soft guidance, or go explicit save/cancel. Right now it is half-pregnant, which is a complicated marsupial.

## Performance / scaling issues

### Deep watch on entire book + graph rebuild + localStorage write on every edit

This is the main performance smell.

`bookStore` watches the whole `rawBook` deeply, debounces 50 ms, then:

* rebuilds the graph
* serializes the entire book
* writes to localStorage

at:

* `src/stores/bookStore.ts:139-146`
* `src/stores/bookStore.ts:127-136`

That is fine for small books. It will become janky for larger books, especially while typing in large text fields.

The likely future pain:

* textarea lag
* too many graph rebuilds
* too many localStorage writes
* larger GC churn from JSON serialization
* graph views recomputing more than needed

I would move toward:

* explicit mutation actions
* dirty flags
* selective graph invalidation
* delayed persistence on idle / blur / route leave / periodic autosave

### Search is brute-force per keystroke

The header search and node list search both do in-memory scans across all nodes and large text fields. Fine for now. But this will eventually want either:

* precomputed search index
* tokenized fields
* simple fuzzy search helper
* throttling

### Context graph layout may be doing more work than needed

Not catastrophic, but context graph rebuild/layout/measuring is fairly heavyweight. Fine for MVP, but it is a future hotspot.

## Code style / coherence issues

### Mixed composition styles

Some files use `<script setup>`, others use Options API, others use hybrid-ish composition. That is not fatal, but the codebase would benefit from one dominant style.

Given the rest of the app, I would strongly prefer:

* `script setup`
* composables for reusable view logic
* stores for mutations/state
* lean presentational components where possible

### Inconsistent naming

You’ve got:

* `autoSlug` vs `autoslug`
* `NodeType` but `nodetype`
* `bookParam` / `bookId`
* `nodeParam` / `nodeId`
* imports with and without `.js` suffix in TS files

That kind of inconsistency does not just look untidy. It increases mental friction every time someone edits the code.

### “Type safety theatre”

There are enough `any`s, mismatched types, and object literals violating declared types that the TS layer currently feels aspirational rather than authoritative.

### Excess console logging / debug residue

* `console.log(g)` in `ContextGraph`
* scattered warnings and logs that probably want a real logging/error strategy

### Accessibility / semantics

A number of interactive elements are `<a @click>` instead of buttons. That affects keyboard behavior, semantics, and screen readers. A quiet UX tax.

## What the project is up to now

Conceptually, I think the project has already crossed the line from “toy editor” to “interesting platform seed.”

You have at least five meaningful subsystems:

* book persistence and loading
* slug-based routing
* structured mathematical/textual content
* dependency/context graph extraction
* local vs published book workflow

That is enough to justify a next-phase cleanup rather than endless feature dabbling.

The biggest sign of maturity is that there is already a strong **domain idea** here: a book as a graph of typed nodes with references, hierarchy, and proofs. That is the right center of gravity.

The biggest sign of immaturity is that the code still treats that domain a bit loosely at runtime.

## Where it could go next

If you want this to become a durable project, I would recommend this order.

### First phase: hardening

Do this before major new features.

1. **Fix the domain model**

   * proper `Node`, `ProofLine`, `Book`
   * one canonical naming scheme
   * no invalid temporary node shapes

2. **Separate concerns in persistence**

   * loaded book
   * local editable save
   * remote fetch/cache
   * metadata shelf index

3. **Make store mutations explicit**

   * stop mutating nested book state directly from components
   * centralize invariant maintenance

4. **Enforce permissions in store/router**

   * not just UI hiding

5. **Sanitize markdown or disable raw HTML**

6. **Choose autosave intentionally**

   * either proper autosave architecture
   * or explicit save model

### Second phase: product quality

Once the foundation stops wobbling:

* proper error surfaces for import/fetch failures
* empty states / not-found page
* actual all-books list
* usable remote/local distinction in UI
* search result highlighting / indexing
* undo/redo would be very valuable here

### Third phase: platform direction

This is where it gets fun.

Given the app’s structure, I can see strong future directions:

* publishable static books
* dependency-aware reading mode
* theorem/reference linking tools
* graph-aware authoring
* import/export schema stability
* collaborative or synced storage later
* validation/linting for broken references, orphan nodes, cycle issues, slug collisions
* search and cross-book references
* multiple graph views: hierarchy, dependency, proof graph

That future is very plausible. The current code is not nonsense. It just needs the foundations tightened before the cathedral gets another bell tower bolted on sideways.

## My priority list

If I were maintaining this codebase, I would do these first:

1. Fix `Node` / `ProofLine` / `autoSlug` typing and naming.
2. Split remote/local persistence properly.
3. Move edits behind store actions and enforce read-only there.
4. Sanitize markdown.
5. Replace deep-watch-everything autosave with a more intentional save pipeline.
6. Standardize component style and naming conventions.
7. Remove dead code and placeholder bits.

## Bottom line

This is a **good prototype with real potential**, but it is entering the stage where **correctness and architecture matter more than another shiny feature**.

The main danger is not that the project is badly conceived. It is that the current version is just nice enough to encourage more feature growth before the invariants are cleaned up. That is how projects slowly become a swamp with tasteful typography.

If you want, I can turn this into a **ranked action plan with concrete refactors file-by-file**, starting with the most important store/model cleanup.

