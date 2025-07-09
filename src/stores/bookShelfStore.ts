import { defineStore } from 'pinia';
import { useBookStore } from './bookStore';
import { migrateBook } from '@/utils/migration.js';

const REMOTE_INDEX_URL = ''; // TODO

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
  }),

  getters: {
    books: state => state.available,
  },

  actions: {
    scanLocalStorage() {
      const books = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('tarskido-book-')) {
          // we currently just read the whole book in to get
          // the metadata we need. In the future we might want to
          // localstore some metadata separately
          const book = JSON.parse(localStorage.getItem(key));
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
      // Clear existing data and rescan
      this.available = [];
      this.slugMap = {};
      this.scanLocalStorage();
      this.buildSlugMap();
    },
    async fetchRemoteIndex() {
      //TODO
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
          s += `${b.slug}-${++suffix}`;
        }
        this.slugMap[s] = b.id;
      }
    },

    async initialise() {
      this.scanLocalStorage();
      await this.fetchRemoteIndex();
      this.buildSlugMap();
    },

    async loadBook(bookId: string) {
      const bookStore = useBookStore();
      const meta = this.available.find(b => b.id === bookId);
      if (meta?.source === 'local' || meta?.source === undefined) {
        const raw = JSON.parse(localStorage.getItem('tarskido-book-' + bookId) || '{}');
        const migratedRaw = migrateBook(raw);
        bookStore.loadFromJSON(migratedRaw, bookId);
      } else {
        // NOT SUPPORTED YET
        console.log(`Loading book ${bookId} from remote source is not implemented yet.`);
      }
      this.activeBook = bookId;
    },

    resolveBookParam(param: string): string | null {
      return this.slugMap[param] || (this.available.find(b => b.id === param) ? param : null);
    },

    addBookFromJson() {
      // TODO
    },

    deleteLocalBook() {
      // TODO
    },
  },
});
