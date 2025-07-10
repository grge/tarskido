import type { Book, Node } from '@/stores/bookStore';

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
    book.slugMap = book.slugMap || {};
    book.slug = book.slug || book.title?.toLowerCase().replace(/\s+/g, '-');
    for (const node of Object.values(book.nodes || {})) {
      const typedNode = node as Node;
      if (typedNode.autoSlug == undefined) {
        typedNode.autoSlug = true;
        if (typedNode.slug == undefined) {
          // TODO: Probably want a method inside bookShelfStore.ts for adding slugs
          typedNode.slug = slugify(typedNode, book);
          book.slugMap[typedNode.slug] = typedNode.id;
        }
      }
    }
    book.schemaVersion = 0.2;
  }

  return book as Book;
}
