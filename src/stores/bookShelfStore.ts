import { defineStore } from 'pinia';
import { migrateBook } from '@/utils/migration.js';

const REMOTE_INDEX_URL = '/tarskido/demo-books.json';

export const useBookShelfStore = defineStore('bookShelf', {
  state: () => ({
    available: [] as Array<{
      id: string;
      slug: string;
      title: string;
      author?: string;
      version?: string;
      source: 'local' | 'demo' | 'remote';
    }>,
    slugMap: {} as Record<string, string>,
    activeBook: null as string | null,
    remoteBookUrls: {} as Record<string, string>, // Map book ID to remote URL
    _isInitializing: false,
    _isInitialized: false,
  }),

  getters: {
    books: state => state.available,
  },

  actions: {
    scanLocalStorage() {
      const books = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tarskido-book-')) {
          // we currently just read the whole book in to get
          // the metadata we need. In the future we might want to
          // localstore some metadata separately
          const bookData = localStorage.getItem(key);
          if (!bookData) continue;
          const book = JSON.parse(bookData);
          const meta = {
            id: book.id,
            slug: book.slug,
            title: book.title,
            author: book.author,
            version: book.version,
            source: book.source || 'local',
          };
          if (book.slug) this.slugMap[book.slug] = book.id;
          books.push(meta);
        }
      }
      this.available = books;
    },

    refreshBookList() {
      // Clear existing data and rescan - use this sparingly
      this.available = [];
      this.slugMap = {};
      this.scanLocalStorage();
      this.buildSlugMap();
    },

    addOrUpdateBook(bookData: object) {
      // Efficiently add/update a single book without full rescan
      const book = bookData as any; // We know this is a book object
      const meta = {
        id: book.id,
        slug: book.slug,
        title: book.title,
        author: book.author,
        version: book.version,
        source: book.source || 'local',
      };

      // Remove existing entry if present
      const existingIndex = this.available.findIndex(b => b.id === book.id);
      if (existingIndex >= 0) {
        this.available.splice(existingIndex, 1);
      }

      // Add updated entry
      this.available.push(meta);

      // Update slug map
      if (book.slug) {
        this.slugMap[book.slug] = book.id;
      }
    },

    removeBook(bookId: string) {
      // Efficiently remove a book without full rescan
      const index = this.available.findIndex(b => b.id === bookId);
      if (index >= 0) {
        const book = this.available[index];
        this.available.splice(index, 1);

        // Remove from slug map
        if (book.slug && this.slugMap[book.slug] === bookId) {
          delete this.slugMap[book.slug];
        }
      }
    },
    async fetchRemoteIndex() {
      try {
        const response = await fetch(REMOTE_INDEX_URL);
        if (!response.ok) {
          console.warn('Failed to fetch remote book index:', response.status);
          return;
        }

        const data = await response.json();

        // Add remote books to the available list
        for (const remoteBook of data.books) {
          const meta = {
            id: remoteBook.id,
            slug: remoteBook.slug,
            title: remoteBook.title,
            author: remoteBook.author,
            version: remoteBook.version,
            source: 'remote' as const,
          };

          // Remove existing entry if present (in case of refresh)
          // Check by ID, slug, or title to handle cases where metadata changed
          const existingIndex = this.available.findIndex(
            b =>
              b.id === remoteBook.id ||
              (b.slug && b.slug === remoteBook.slug) ||
              (b.title === remoteBook.title &&
                b.author === remoteBook.author &&
                b.source === 'remote')
          );
          if (existingIndex >= 0) {
            const existingBook = this.available[existingIndex];
            this.available.splice(existingIndex, 1);

            // Clean up old cached remote data if ID changed
            if (existingBook.id !== remoteBook.id) {
              localStorage.removeItem(`tarskido-remote-${existingBook.id}`);
            }
          }

          // Add the remote book
          this.available.push(meta);

          // Store the remote URL for fetching the full book data
          this.remoteBookUrls[remoteBook.id] = remoteBook.url;
        }

        console.log(`Loaded ${data.books.length} remote books`);
        console.log('Remote book slugs:', data.books.map(b => b.slug));
      } catch (error) {
        console.warn('Failed to fetch remote books:', error);
        // Continue with local books only
      }
    },
    buildSlugMap() {
      /* Unlike the node slugMap, which is persisted data that lives inside each book,
       * The book slugMap is rebuild from the list of available books on initialisation.
       */
      this.slugMap = {};
      for (const b of this.available) {
        let s = b.slug || b.id;
        let suffix = 1;
        // TODO Maybe this should just fail if slug is not unique?
        while (this.slugMap[s]) {
          s = `${b.slug || b.id}-${++suffix}`;
        }
        this.slugMap[s] = b.id;
      }
      console.log('Built slug map:', this.slugMap);
    },

    async initialise() {
      // Prevent multiple concurrent initializations
      if (this._isInitialized) {
        return;
      }
      
      if (this._isInitializing) {
        // Wait for the current initialization to complete
        while (this._isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return;
      }

      this._isInitializing = true;
      try {
        this.scanLocalStorage();
        await this.fetchRemoteIndex();
        this.buildSlugMap();
        this._isInitialized = true;
      } finally {
        this._isInitializing = false;
      }
    },

    async getBookData(bookId: string): Promise<object | null> {
      const meta = this.available.find(b => b.id === bookId);

      if (!meta) {
        console.warn(`Book ${bookId} not found`);
        return null;
      }

      if (meta.source === 'local' || meta.source === undefined) {
        // Load from localStorage
        const raw = JSON.parse(localStorage.getItem('tarskido-book-' + bookId) || '{}');
        return migrateBook(raw);
      } else if (meta.source === 'remote') {
        // Load from remote URL
        const remoteUrl = this.remoteBookUrls[bookId];
        if (!remoteUrl) {
          console.warn(`No remote URL found for book ${bookId}`);
          return null;
        }

        try {
          console.log(`Fetching remote book from ${remoteUrl}`);
          const response = await fetch(remoteUrl);
          if (!response.ok) {
            console.warn(`Failed to fetch remote book ${bookId}:`, response.status);
            return null;
          }

          const bookData = await response.json();

          // Ensure the book has the correct source marker
          bookData.source = 'remote';

          // Cache it in localStorage for faster subsequent access
          // Use a special key to distinguish from local books
          localStorage.setItem(`tarskido-remote-${bookId}`, JSON.stringify(bookData));

          return migrateBook(bookData);
        } catch (error) {
          console.warn(`Failed to fetch remote book ${bookId}:`, error);
          return null;
        }
      } else {
        console.warn(`Unsupported book source: ${meta.source}`);
        return null;
      }
    },

    setActiveBook(bookId: string) {
      this.activeBook = bookId;
    },

    resolveBookParam(param: string): string | null {
      const resolved = this.slugMap[param] || (this.available.find(b => b.id === param) ? param : null);
      console.log(`Resolving book param "${param}" to:`, resolved);
      if (!resolved) {
        console.log('Available slug map:', this.slugMap);
        console.log('Available books:', this.available.map(b => ({ id: b.id, slug: b.slug })));
      }
      return resolved;
    },

    async deleteLocalBook(bookId: string) {
      // Import bookStore dynamically to avoid circular dependency
      const { useBookStore } = await import('./bookStore');
      const bookStore = useBookStore();

      // Use bookStore for localStorage operations
      bookStore.deleteBook(bookId);

      // Remove from shelf state
      this.removeBook(bookId);
    },

    async createBook() {
      // Import bookStore dynamically to avoid circular dependency
      const { useBookStore } = await import('./bookStore');
      const bookStore = useBookStore();

      // Create new book using bookStore helper
      bookStore.createNewBook();

      // Add to shelf state
      this.addOrUpdateBook(bookStore.rawBook);

      // Return book data for component to handle navigation
      return bookStore.rawBook;
    },

    async importBookFromFile(file: File): Promise<any> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const data = JSON.parse(reader.result as string);
            console.log('Importing book from file:', data);

            // Import bookStore dynamically to avoid circular dependency
            const { useBookStore } = await import('./bookStore');
            const bookStore = useBookStore();

            // Load book using bookStore helper
            bookStore.loadFromJSON(data, data.id);

            // Add to shelf state
            this.addOrUpdateBook(data);

            // Return book data for component to handle navigation
            resolve(data);
          } catch (error) {
            console.error('Failed to import book:', error);
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    },

    async duplicateBook(sourceBook: any) {
      // Import bookStore dynamically to avoid circular dependency
      const { useBookStore } = await import('./bookStore');
      const bookStore = useBookStore();

      // Get the full book data first
      const fullBookData = await this.getBookData(sourceBook.id);

      if (!fullBookData) {
        console.error('Failed to load book data for duplication');
        return null;
      }

      // Load the source book and create a copy
      bookStore.loadFromJSON(fullBookData, sourceBook.id);
      const copiedBook = bookStore.copyBookToLocal();

      if (copiedBook) {
        // Add to shelf state
        this.addOrUpdateBook(copiedBook);

        // Return book data for component to handle navigation
        return copiedBook;
      }

      return null;
    },
  },
});
