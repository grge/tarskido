import { defineStore } from 'pinia';
import { migrateBook } from '@/utils/migration.js';

const REMOTE_INDEX_URL = '/tarskido/demo-books.json';
const REMOTE_INDEX_FALLBACK = 'https://grge.github.io/tarskido/demo-books.json';

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
    remoteBookUrls: {} as Record<string, string>,
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
          books.push(meta);
        }
      }
      this.available = books;
    },

    refreshBookList() {
      this.available = [];
      this.slugMap = {};
      this.scanLocalStorage();
      this.buildSlugMap();
    },

    addOrUpdateBook(bookData: object) {
      const book = bookData as any;
      const meta = {
        id: book.id,
        slug: book.slug,
        title: book.title,
        author: book.author,
        version: book.version,
        source: book.source || 'local',
      };

      const existingIndex = this.available.findIndex(b => b.id === book.id);
      if (existingIndex >= 0) {
        this.available.splice(existingIndex, 1);
      }

      this.available.push(meta);

      if (book.slug) {
        this.slugMap[book.slug] = book.id;
      }
    },

    removeBook(bookId: string) {
      const index = this.available.findIndex(b => b.id === bookId);
      if (index >= 0) {
        const book = this.available[index];
        this.available.splice(index, 1);

        if (book.slug && this.slugMap[book.slug] === bookId) {
          delete this.slugMap[book.slug];
        }
      }
    },

    async fetchRemoteIndex() {
      let response: Response;

      try {
        response = await fetch(REMOTE_INDEX_URL);
        if (!response.ok) {
          response = await fetch(REMOTE_INDEX_FALLBACK);
        }

        if (!response.ok) {
          console.warn('Failed to fetch remote book index from both URLs');
          return;
        }

        const data = await response.json();

        for (const remoteBook of data.books) {
          const meta = {
            id: remoteBook.id,
            slug: remoteBook.slug,
            title: remoteBook.title,
            author: remoteBook.author,
            version: remoteBook.version,
            source: 'remote' as const,
          };

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

            if (existingBook.id !== remoteBook.id) {
              localStorage.removeItem(`tarskido-remote-${existingBook.id}`);
            }
          }

          this.available.push(meta);
          this.remoteBookUrls[remoteBook.id] = remoteBook.url;
        }
      } catch (error) {
        console.warn('Failed to fetch remote books:', error);
      }
    },

    buildSlugMap() {
      this.slugMap = {};
      for (const b of this.available) {
        let s = b.slug || b.id;
        let suffix = 1;
        while (this.slugMap[s]) {
          s = `${b.slug || b.id}-${++suffix}`;
        }
        this.slugMap[s] = b.id;
      }
    },

    async initialise() {
      if (this._isInitialized) return;

      if (this._isInitializing) {
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
        const raw = JSON.parse(localStorage.getItem('tarskido-book-' + bookId) || '{}');
        return migrateBook(raw);
      } else if (meta.source === 'remote') {
        const remoteUrl = this.remoteBookUrls[bookId];
        if (!remoteUrl) {
          console.warn(`No remote URL found for book ${bookId}`);
          return null;
        }

        try {
          const response = await fetch(remoteUrl);
          if (!response.ok) {
            console.warn(`Failed to fetch remote book ${bookId}:`, response.status);
            return null;
          }

          const bookData = await response.json();
          bookData.source = 'remote';
          localStorage.setItem(`tarskido-remote-${bookId}`, JSON.stringify(bookData));
          return migrateBook(bookData);
        } catch (error) {
          console.warn(`Failed to fetch remote book ${bookId}:`, error);
          return null;
        }
      }

      console.warn(`Unsupported book source: ${meta.source}`);
      return null;
    },

    setActiveBook(bookId: string) {
      this.activeBook = bookId;
    },

    resolveBookParam(param: string): string | null {
      return this.slugMap[param] || (this.available.find(b => b.id === param) ? param : null);
    },

    async deleteLocalBook(bookId: string) {
      const { useBookStore } = await import('./bookStore');
      const bookStore = useBookStore();
      bookStore.deleteBook(bookId);
      this.removeBook(bookId);
    },

    async createBook() {
      const { useBookStore } = await import('./bookStore');
      const bookStore = useBookStore();
      bookStore.createNewBook();
      this.addOrUpdateBook(bookStore.rawBook);
      return bookStore.rawBook;
    },

    async importBookFromFile(file: File): Promise<any> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const data = JSON.parse(reader.result as string);
            const { useBookStore } = await import('./bookStore');
            const bookStore = useBookStore();
            bookStore.loadFromJSON(data, data.id);
            this.addOrUpdateBook(data);
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
      const { useBookStore } = await import('./bookStore');
      const bookStore = useBookStore();
      const fullBookData = await this.getBookData(sourceBook.id);

      if (!fullBookData) {
        console.error('Failed to load book data for duplication');
        return null;
      }

      bookStore.loadFromJSON(fullBookData, sourceBook.id);
      const copiedBook = bookStore.copyBookToLocal();

      if (copiedBook) {
        this.addOrUpdateBook(copiedBook);
        return copiedBook;
      }

      return null;
    },
  },
});
