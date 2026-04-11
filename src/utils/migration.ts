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
  return proofLines.map((line: any) => ({
    statement: typeof line?.statement === 'string' ? line.statement : '',
    references: Array.isArray(line?.references)
      ? line.references.filter((ref: unknown) => typeof ref === 'string')
      : [],
  }));
}

function normalizeNode(node: any, book: Book): Node {
  const normalized: Node = {
    id: String(node.id || ''),
    reference: typeof node.reference === 'string' ? node.reference : '',
    name: typeof node.name === 'string' ? node.name : '',
    slug: typeof node.slug === 'string' ? node.slug : '',
    autoslug:
      typeof node.autoslug === 'boolean'
        ? node.autoslug
        : typeof node.autoSlug === 'boolean'
          ? node.autoSlug
          : true,
    nodetype:
      node.nodetype && typeof node.nodetype.primary === 'string' && typeof node.nodetype.secondary === 'string'
        ? node.nodetype
        : { primary: 'Definition', secondary: 'Definition' },
    statement: typeof node.statement === 'string' ? node.statement : '',
    references: Array.isArray(node.references)
      ? node.references.filter((ref: unknown) => typeof ref === 'string')
      : [],
    chapter: typeof node.chapter === 'string' && node.chapter ? node.chapter : 'ROOT',
    proof_lines: normalizeProofLines(node.proof_lines),
  };

  if (!normalized.slug && normalized.autoslug && normalized.reference && normalized.nodetype?.secondary) {
    normalized.slug = slugify(normalized, book);
  }

  return normalized;
}

export function migrateBook(raw: any): Book {
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
        const normalized = normalizeNode({ ...(node as object), id }, book as Book);
        return [id, normalized];
      })
    );

    for (const typedNode of Object.values(book.nodes) as Node[]) {
      if (typedNode.slug) {
        book.slugMap[typedNode.slug] = typedNode.id;
      }
    }

    book.schemaVersion = 0.2;
  }

  // Final normalization pass for already-migrated but drifted books
  book.slugMap = book.slugMap || {};
  book.nodes = Object.fromEntries(
    Object.entries(book.nodes || {}).map(([id, node]) => {
      const normalized = normalizeNode({ ...(node as object), id }, book as Book);
      if (normalized.slug) {
        book.slugMap[normalized.slug] = normalized.id;
      }
      return [id, normalized];
    })
  );

  return book as Book;
}
