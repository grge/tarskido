export function migrateBook(raw: any): Book {
  let book = { ...raw };
  const version = book.schemaVersion || 0;
  
  if ( version < 0.1 ) {
    book.schemaVersion = 0.1;
    // TODO: Make sure version is actually updated when we write to localstorage
    book.version = book.version || new Date().toISOString();
    book.source = book.source || 'local';
  }

  if ( version < 0.2 ) {
    // TODO: Proably want to move this helper to bookShelfStore.ts
    function slugify(node: Node, book: Book): string {
      let slug = (
        node.nodetype.secondary.toLowerCase() 
          + "-" + node.reference
      ) 

      let suffix = 2
      while (book.slugMap[slug]) {
        slug = `${slug}-(${suffix++})`
      }
      return slug;
    }
    book.slugMap = book.slugMap || {};
    book.slug = book.slug || book.title?.toLowerCase().replace(/\s+/g, '-');
    for (const node of Object.values(book.nodes || {})) {
      if (node.autoSlug == undefined) {
        node.autoslug = true;
        if (node.slug == undefined) {
          // TODO: Probably want a method inside bookShelfStore.ts for adding slugs
          node.slug = slugify(node, book);
          book.slugMap[node.slug] = node.id;
        }
      }
      book.schemaVersion = 0.2;
    }
  }

  return book as Book;
}
