import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookStore } from '../../src/stores/bookStore';
import type { Book, Node } from '../../src/stores/bookStore';

// Mock the graph library
vi.mock('../../src/graphlib_ext.js', () => ({
  default: vi.fn(() => ({
    setNode: vi.fn(),
    setEdge: vi.fn(),
    setParent: vi.fn(),
    setGraph: vi.fn(),
    predecessors: vi.fn(),
    children: vi.fn(),
    parent: vi.fn(),
  })),
}));

// Mock the migration module
vi.mock('../../src/utils/migration', () => ({
  migrateBook: vi.fn(book => book),
}));

describe('bookStore', () => {
  let store: ReturnType<typeof useBookStore>;
  let mockBook: Book;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBookStore();

    mockBook = {
      id: 'test-book',
      title: 'Test Book',
      author: 'Test Author',
      preface: 'Test preface',
      nodes: {},
      slugMap: {},
    };
  });

  describe('nodeRefs (pure function)', () => {
    // Create a simple implementation to test the logic
    function nodeRefs(node: Node): string[] {
      const base = node.references ?? [];
      if (node.nodetype?.primary !== 'Proposition') {
        return base;
      }
      const extra = Object.values(node.proof_lines ?? {}).flatMap(line => line?.references ?? []);
      return Array.from(new Set([...base, ...extra]));
    }

    it('should extract references from basic node', () => {
      const node: Node = {
        id: 'node1',
        reference: '1.1',
        name: 'Test Node',
        slug: 'test-node',
        autoSlug: true,
        nodetype: { primary: 'Definition', secondary: 'Definition' },
        statement: 'Test statement',
        references: ['ref1', 'ref2'],
        chapter: 'Chapter 1',
        proof_lines: [],
      };

      const result = nodeRefs(node);
      expect(result).toEqual(['ref1', 'ref2']);
    });

    it('should extract references from proposition with proof lines', () => {
      const node: Node = {
        id: 'node1',
        reference: '1.1',
        name: 'Test Theorem',
        slug: 'test-theorem',
        autoSlug: true,
        nodetype: { primary: 'Proposition', secondary: 'Theorem' },
        statement: 'Test statement',
        references: ['ref1'],
        chapter: 'Chapter 1',
        proof_lines: [{ references: ['ref2', 'ref3'] }, { references: ['ref4'] }],
      };

      const result = nodeRefs(node);
      expect(result).toEqual(['ref1', 'ref2', 'ref3', 'ref4']);
    });

    it('should deduplicate references', () => {
      const node: Node = {
        id: 'node1',
        reference: '1.1',
        name: 'Test Theorem',
        slug: 'test-theorem',
        autoSlug: true,
        nodetype: { primary: 'Proposition', secondary: 'Theorem' },
        statement: 'Test statement',
        references: ['ref1', 'ref2'],
        chapter: 'Chapter 1',
        proof_lines: [{ references: ['ref2', 'ref3'] }, { references: ['ref1', 'ref3'] }],
      };

      const result = nodeRefs(node);
      expect(result).toEqual(['ref1', 'ref2', 'ref3']);
    });

    it('should handle empty references and proof lines', () => {
      const node: Node = {
        id: 'node1',
        reference: '1.1',
        name: 'Test Node',
        slug: 'test-node',
        autoSlug: true,
        nodetype: { primary: 'Definition', secondary: 'Definition' },
        statement: 'Test statement',
        references: [],
        chapter: 'Chapter 1',
        proof_lines: [],
      };

      const result = nodeRefs(node);
      expect(result).toEqual([]);
    });

    it('should handle undefined references and proof lines', () => {
      const node: Node = {
        id: 'node1',
        reference: '1.1',
        name: 'Test Node',
        slug: 'test-node',
        autoSlug: true,
        nodetype: { primary: 'Definition', secondary: 'Definition' },
        statement: 'Test statement',
        references: undefined as any,
        chapter: 'Chapter 1',
        proof_lines: undefined as any,
      };

      const result = nodeRefs(node);
      expect(result).toEqual([]);
    });
  });

  describe('generateSlug', () => {
    beforeEach(() => {
      // Directly set the value without triggering watchers
      store.rawBook.value = mockBook;
    });

    it('should generate basic slug', () => {
      const node: Node = {
        id: 'node1',
        reference: '1.1',
        name: 'Test Node',
        slug: '',
        autoSlug: true,
        nodetype: { primary: 'Definition', secondary: 'Definition' },
        statement: 'Test statement',
        references: [],
        chapter: 'Chapter 1',
        proof_lines: [],
      };

      const result = store.generateSlug(node);
      expect(result).toBe('definition-1.1');
    });

    it('should handle spaces in reference', () => {
      const node: Node = {
        id: 'node1',
        reference: '1.1 a',
        name: 'Test Node',
        slug: '',
        autoSlug: true,
        nodetype: { primary: 'Proposition', secondary: 'Theorem' },
        statement: 'Test statement',
        references: [],
        chapter: 'Chapter 1',
        proof_lines: [],
      };

      const result = store.generateSlug(node);
      expect(result).toBe('theorem-1.1-a');
    });

    it('should handle slug collisions', () => {
      store.rawBook.value.slugMap = { 'definition-1.1': 'other-node' };

      const node: Node = {
        id: 'node1',
        reference: '1.1',
        name: 'Test Node',
        slug: '',
        autoSlug: true,
        nodetype: { primary: 'Definition', secondary: 'Definition' },
        statement: 'Test statement',
        references: [],
        chapter: 'Chapter 1',
        proof_lines: [],
      };

      const result = store.generateSlug(node);
      expect(result).toBe('definition-1.1-2');
    });

    it('should allow node to keep its own slug', () => {
      store.rawBook.value.slugMap = { 'definition-1.1': 'node1' };

      const node: Node = {
        id: 'node1',
        reference: '1.1',
        name: 'Test Node',
        slug: '',
        autoSlug: true,
        nodetype: { primary: 'Definition', secondary: 'Definition' },
        statement: 'Test statement',
        references: [],
        chapter: 'Chapter 1',
        proof_lines: [],
      };

      const result = store.generateSlug(node);
      expect(result).toBe('definition-1.1');
    });

    it('should return empty string for missing reference', () => {
      const node: Node = {
        id: 'node1',
        reference: '',
        name: 'Test Node',
        slug: '',
        autoSlug: true,
        nodetype: { primary: 'Definition', secondary: 'Definition' },
        statement: 'Test statement',
        references: [],
        chapter: 'Chapter 1',
        proof_lines: [],
      };

      const result = store.generateSlug(node);
      expect(result).toBe('');
    });

    it('should return empty string for missing secondary type', () => {
      const node: Node = {
        id: 'node1',
        reference: '1.1',
        name: 'Test Node',
        slug: '',
        autoSlug: true,
        nodetype: { primary: 'Definition', secondary: '' as any },
        statement: 'Test statement',
        references: [],
        chapter: 'Chapter 1',
        proof_lines: [],
      };

      const result = store.generateSlug(node);
      expect(result).toBe('');
    });
  });

  describe('sortNodesByReference', () => {
    beforeEach(() => {
      store.rawBook.value = {
        ...mockBook,
        nodes: {
          node1: { reference: '1.1', id: 'node1' } as Node,
          node2: { reference: '1.10', id: 'node2' } as Node,
          node3: { reference: '1.2', id: 'node3' } as Node,
          node4: { reference: '2.1', id: 'node4' } as Node,
          node5: { reference: '1.1.1', id: 'node5' } as Node,
        },
      };
    });

    it('should sort references naturally', () => {
      const nodeIds = ['node2', 'node1', 'node4', 'node3', 'node5'];
      const result = store.sortNodesByReference(nodeIds);

      expect(result).toEqual(['node1', 'node5', 'node3', 'node2', 'node4']);
    });

    it('should handle empty array', () => {
      const result = store.sortNodesByReference([]);
      expect(result).toEqual([]);
    });

    it('should handle single node', () => {
      const result = store.sortNodesByReference(['node1']);
      expect(result).toEqual(['node1']);
    });

    it('should handle alphabetic references', () => {
      store.rawBook.value.nodes = {
        node1: { reference: 'A.1', id: 'node1' } as Node,
        node2: { reference: 'B.1', id: 'node2' } as Node,
        node3: { reference: 'A.2', id: 'node3' } as Node,
      };

      const result = store.sortNodesByReference(['node2', 'node3', 'node1']);
      expect(result).toEqual(['node1', 'node3', 'node2']);
    });
  });

  describe('updateSlugMap', () => {
    beforeEach(() => {
      store.rawBook.value = {
        ...mockBook,
        slugMap: {
          'old-slug': 'node1',
          'other-slug': 'node2',
        },
      };
    });

    it('should update slug mapping', () => {
      store.updateSlugMap('node1', 'new-slug', 'old-slug');

      expect(store.rawBook.value.slugMap).toEqual({
        'new-slug': 'node1',
        'other-slug': 'node2',
      });
    });

    it('should add new slug without removing old', () => {
      store.updateSlugMap('node1', 'new-slug');

      expect(store.rawBook.value.slugMap).toEqual({
        'old-slug': 'node1',
        'other-slug': 'node2',
        'new-slug': 'node1',
      });
    });

    it('should remove old slug mapping', () => {
      store.updateSlugMap('node1', '', 'old-slug');

      expect(store.rawBook.value.slugMap).toEqual({
        'other-slug': 'node2',
      });
    });

    it('should not remove wrong node mapping', () => {
      store.updateSlugMap('node1', 'new-slug', 'other-slug');

      expect(store.rawBook.value.slugMap).toEqual({
        'old-slug': 'node1',
        'other-slug': 'node2',
        'new-slug': 'node1',
      });
    });
  });

  describe('resolveNodeParam', () => {
    beforeEach(() => {
      store.rawBook.value = {
        ...mockBook,
        nodes: {
          node1: { id: 'node1' } as Node,
        },
        slugMap: {
          'test-slug': 'node1',
        },
      };
    });

    it('should resolve node ID directly', () => {
      const result = store.resolveNodeParam('node1');
      expect(result).toBe('node1');
    });

    it('should resolve slug to node ID', () => {
      const result = store.resolveNodeParam('test-slug');
      expect(result).toBe('node1');
    });

    it('should return undefined for non-existent node', () => {
      const result = store.resolveNodeParam('non-existent');
      expect(result).toBeUndefined();
    });
  });
});
