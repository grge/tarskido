import type { Book, Node, ProofLine } from '@/stores/bookStore';

function slugify(node: Node, book: Book): string {
  const baseSlug = (node.nodetype.secondary.toLowerCase() + '-' + node.reference).replace(
    /\s+/g,
    '-'
  );

  let slug = baseSlug;
  let suffix = 2;
  while (book.slugMap[slug]) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
  return slug;
}

function normalizeProofLines(proofLines: unknown): ProofLine[] {
  if (!Array.isArray(proofLines)) return [];
  return proofLines.map((line: unknown) => {
    const candidate =
      typeof line === 'object' && line !== null ? (line as Record<string, unknown>) : {};
    return {
      statement: typeof candidate.statement === 'string' ? candidate.statement : '',
      references: Array.isArray(candidate.references)
        ? candidate.references.filter((ref: unknown): ref is string => typeof ref === 'string')
        : [],
    };
  });
}

function normalizeNode(node: unknown): Node {
  const candidate =
    typeof node === 'object' && node !== null ? (node as Record<string, unknown>) : {};
  return {
    id: String(candidate.id || ''),
    reference: typeof candidate.reference === 'string' ? candidate.reference : '',
    name: typeof candidate.name === 'string' ? candidate.name : '',
    slug: typeof candidate.slug === 'string' ? candidate.slug : '',
    autoslug:
      typeof candidate.autoslug === 'boolean'
        ? candidate.autoslug
        : typeof candidate.autoSlug === 'boolean'
        ? candidate.autoSlug
        : true,
    nodetype:
      candidate.nodetype &&
      typeof candidate.nodetype === 'object' &&
      typeof (candidate.nodetype as Record<string, unknown>).primary === 'string' &&
      typeof (candidate.nodetype as Record<string, unknown>).secondary === 'string'
        ? (candidate.nodetype as Node['nodetype'])
        : { primary: 'Definition', secondary: 'Definition' },
    statement: typeof candidate.statement === 'string' ? candidate.statement : '',
    references: Array.isArray(candidate.references)
      ? candidate.references.filter((ref: unknown): ref is string => typeof ref === 'string')
      : [],
    chapter:
      typeof candidate.chapter === 'string' && candidate.chapter ? candidate.chapter : 'ROOT',
    proof_lines: normalizeProofLines(candidate.proof_lines),
  };
}

export function migrateBook(raw: unknown): Book {
  const book = { ...raw };
  const version = book.schemaVersion || 0;

  if (version < 0.1) {
    book.schemaVersion = 0.1;
    // TODO: Make sure version is actually updated when we write to localstorage
    book.version = book.version || new Date().toISOString();
    book.source = book.source || 'local';
  }

  if (version < 0.2) {
    // TODO: Proably want to move this helper to bookShelfStore.ts
    book.slugMap = book.slugMap || {};
    book.slug = book.slug || book.title?.toLowerCase().replace(/\s+/g, '-');
    book.nodes = Object.fromEntries(
      Object.entries(book.nodes || {}).map(([id, node]) => {
        const normalized = normalizeNode({ ...(node as object), id });
        return [id, normalized];
      })
    );

    book.slugMap = {};
    for (const typedNode of Object.values(book.nodes) as Node[]) {
      if (
        !typedNode.slug &&
        typedNode.autoslug &&
        typedNode.reference &&
        typedNode.nodetype?.secondary
      ) {
        typedNode.slug = slugify(typedNode, book as Book);
      }
      if (typedNode.slug) {
        book.slugMap[typedNode.slug] = typedNode.id;
      }
    }

    book.schemaVersion = 0.2;
  }

  // Final normalization pass for already-migrated but drifted books
  book.slugMap = {};
  book.nodes = Object.fromEntries(
    Object.entries(book.nodes || {}).map(([id, node]) => {
      const normalized = normalizeNode({ ...(node as object), id });
      return [id, normalized];
    })
  );

  for (const normalized of Object.values(book.nodes) as Node[]) {
    if (
      !normalized.slug &&
      normalized.autoslug &&
      normalized.reference &&
      normalized.nodetype?.secondary
    ) {
      normalized.slug = slugify(normalized, book as Book);
    }
    if (normalized.slug) {
      book.slugMap[normalized.slug] = normalized.id;
    }
  }

  return book as Book;
}
