export function migrateBook(raw: any): Book {
  let book = { ...raw };
  const version = book.schemaVersion || 0;
  
  if ( version < 0.1 ) {
    book.schemaVersion = 0.1;
    book.version = book.version || new Date().toISOString();
    book.source = book.source || 'local';
  }

  return book as Book;
}
