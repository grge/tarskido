import { describe, it, expect, beforeEach } from 'vitest';
import { migrateBook } from '../../src/utils/migration';

describe('migration', () => {
  describe('migrateBook', () => {
    it('should handle books with no schema version', () => {
      const rawBook = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        preface: 'Test preface',
        nodes: {},
        slugMap: {},
      };

      const result = migrateBook(rawBook);

      expect(result.schemaVersion).toBe(0.2); // Goes through both 0.1 and 0.2 migrations
      expect(result.version).toBeDefined();
      expect(result.source).toBe('local');
      expect(result.slug).toBe('test-book');
    });

    it('should migrate from version 0 to 0.2', () => {
      const rawBook = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        preface: 'Test preface',
        nodes: {},
        slugMap: {},
        schemaVersion: 0,
      };

      const result = migrateBook(rawBook);

      expect(result.schemaVersion).toBe(0.2); // Goes through both 0.1 and 0.2 migrations
      expect(result.version).toBeDefined();
      expect(result.source).toBe('local');
      expect(result.slug).toBe('test-book');
    });

    it('should preserve existing version and source in migration', () => {
      const existingVersion = '2023-01-01T00:00:00.000Z';
      const rawBook = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        preface: 'Test preface',
        nodes: {},
        slugMap: {},
        version: existingVersion,
        source: 'imported',
      };

      const result = migrateBook(rawBook);

      expect(result.schemaVersion).toBe(0.2);
      expect(result.version).toBe(existingVersion);
      expect(result.source).toBe('imported');
      expect(result.slug).toBe('test-book');
    });

    it('should migrate from version 0.1 to 0.2 with slug generation', () => {
      const rawBook = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        preface: 'Test preface',
        nodes: {
          node1: {
            id: 'node1',
            reference: '1.1',
            name: 'First Node',
            nodetype: { primary: 'Definition', secondary: 'Definition' },
            statement: 'Test statement',
            references: [],
            chapter: 'Chapter 1',
          },
          node2: {
            id: 'node2',
            reference: '1.2',
            name: 'Second Node',
            nodetype: { primary: 'Proposition', secondary: 'Theorem' },
            statement: 'Test theorem',
            references: [],
            chapter: 'Chapter 1',
          },
        },
        slugMap: {},
        schemaVersion: 0.1,
      };

      const result = migrateBook(rawBook);

      expect(result.schemaVersion).toBe(0.2);
      expect(result.slug).toBe('test-book');
      expect(result.nodes.node1.autoSlug).toBe(true);
      expect(result.nodes.node2.autoSlug).toBe(true);
      expect(result.nodes.node1.slug).toBe('definition-1.1');
      expect(result.nodes.node2.slug).toBe('theorem-1.2');
      expect(result.slugMap['definition-1.1']).toBe('node1');
      expect(result.slugMap['theorem-1.2']).toBe('node2');
    });

    it('should handle slug collisions by adding suffix', () => {
      const rawBook = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        preface: 'Test preface',
        nodes: {
          node1: {
            id: 'node1',
            reference: '1.1',
            name: 'First Node',
            nodetype: { primary: 'Definition', secondary: 'Definition' },
            statement: 'Test statement',
            references: [],
            chapter: 'Chapter 1',
          },
          node2: {
            id: 'node2',
            reference: '1.1', // Same reference as node1
            name: 'Second Node',
            nodetype: { primary: 'Definition', secondary: 'Definition' }, // Same type as node1
            statement: 'Test statement',
            references: [],
            chapter: 'Chapter 1',
          },
        },
        slugMap: {},
        schemaVersion: 0.1,
      };

      const result = migrateBook(rawBook);

      expect(result.nodes.node1.slug).toBe('definition-1.1');
      expect(result.nodes.node2.slug).toBe('definition-1.1-2');
      expect(result.slugMap['definition-1.1']).toBe('node1');
      expect(result.slugMap['definition-1.1-2']).toBe('node2');
    });

    it('should preserve existing slugs during migration', () => {
      const rawBook = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        preface: 'Test preface',
        nodes: {
          node1: {
            id: 'node1',
            reference: '1.1',
            name: 'First Node',
            slug: 'custom-slug',
            nodetype: { primary: 'Definition', secondary: 'Definition' },
            statement: 'Test statement',
            references: [],
            chapter: 'Chapter 1',
          },
        },
        slugMap: { 'custom-slug': 'node1' },
        schemaVersion: 0.1,
      };

      const result = migrateBook(rawBook);

      expect(result.nodes.node1.slug).toBe('custom-slug');
      expect(result.slugMap['custom-slug']).toBe('node1');
    });

    it('should handle spaces in reference and title', () => {
      const rawBook = {
        id: 'test-book',
        title: 'Test Book With Spaces',
        author: 'Test Author',
        preface: 'Test preface',
        nodes: {
          node1: {
            id: 'node1',
            reference: '1.1 a',
            name: 'First Node',
            nodetype: { primary: 'Definition', secondary: 'Definition' },
            statement: 'Test statement',
            references: [],
            chapter: 'Chapter 1',
          },
        },
        slugMap: {},
        schemaVersion: 0.1,
      };

      const result = migrateBook(rawBook);

      expect(result.slug).toBe('test-book-with-spaces');
      expect(result.nodes.node1.slug).toBe('definition-1.1-a');
    });

    it('should not modify already migrated books', () => {
      const rawBook = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        preface: 'Test preface',
        nodes: {
          node1: {
            id: 'node1',
            reference: '1.1',
            name: 'First Node',
            slug: 'definition-1.1',
            autoSlug: true,
            nodetype: { primary: 'Definition', secondary: 'Definition' },
            statement: 'Test statement',
            references: [],
            chapter: 'Chapter 1',
          },
        },
        slugMap: { 'definition-1.1': 'node1' },
        slug: 'test-book',
        schemaVersion: 0.2,
        version: '2023-01-01T00:00:00.000Z',
        source: 'local',
      };

      const result = migrateBook(rawBook);

      // Should be unchanged
      expect(result).toEqual(rawBook);
    });

    it('should handle empty nodes object', () => {
      const rawBook = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        preface: 'Test preface',
        nodes: {},
        slugMap: {},
        schemaVersion: 0.1,
      };

      const result = migrateBook(rawBook);

      expect(result.schemaVersion).toBe(0.2);
      expect(result.slug).toBe('test-book');
      expect(result.nodes).toEqual({});
    });

    it('should handle missing nodes property', () => {
      const rawBook = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        preface: 'Test preface',
        slugMap: {},
        schemaVersion: 0.1,
      };

      const result = migrateBook(rawBook);

      expect(result.schemaVersion).toBe(0.2);
      expect(result.slug).toBe('test-book');
    });
  });
});
