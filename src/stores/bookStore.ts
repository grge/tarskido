import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { ref, watch, markRaw, computed } from 'vue';

import { Graph } from '@dagrejs/graphlib';
import { migrateBook } from '@/utils/migration';

export interface Book {
  schemaVersion?: number;
  source?: string;
  version?: string;
  slug?: string;
  id: string;
  title: string;
  author: string;
  preface: string;
  nodes: Record<string, Node>;
  slugMap: Record<string, string>;
}

const VALID_COMMENT_SUBTYPE = ['Comment', 'Note', 'Example'] as const;
const VALID_DEFINITION_SUBTYPE = ['Definition', 'Axiom', 'Hypothesis'] as const;
const VALID_GROUP_SUBTYPE = ['Chapter', 'Section', 'Subsection', 'MultiPart', 'Appendix'] as const;
const VALID_PROPOSITION_SUBTYPE = ['Proposition', 'Lemma', 'Theorem', 'Corollary'] as const;
export const VALID_NODE_TYPE = {
  Comment: VALID_COMMENT_SUBTYPE,
  Definition: VALID_DEFINITION_SUBTYPE,
  Group: VALID_GROUP_SUBTYPE,
  Proposition: VALID_PROPOSITION_SUBTYPE,
} as const;

type CommentSubType = (typeof VALID_COMMENT_SUBTYPE)[number];
type DefinitionSubType = (typeof VALID_DEFINITION_SUBTYPE)[number];
type GroupSubType = (typeof VALID_GROUP_SUBTYPE)[number];
type PropositionSubType = (typeof VALID_PROPOSITION_SUBTYPE)[number];

type NodeType =
  | { primary: 'Comment'; secondary: CommentSubType }
  | { primary: 'Definition'; secondary: DefinitionSubType }
  | { primary: 'Group'; secondary: GroupSubType }
  | { primary: 'Proposition'; secondary: PropositionSubType };

export interface Node {
  id: string;
  reference: string;
  name: string;
  slug?: string;
  autoSlug: boolean;
  nodetype: NodeType;
  statement: string;
  references: string[];
  chapter: string;
  proof_lines: string[];
}

function nodeRefs(node: Node): string[] {
  // return a list of all references from this node
  const base = node.references ?? [];
  if (node.nodetype?.primary !== 'Proposition') {
    return base;
  }

  const extra = Object.values(node.proof_lines ?? {}).flatMap(line => line?.references ?? []);
  return Array.from(new Set([...base, ...extra]));
}

export const useBookStore = defineStore('book', () => {
  // ============================================================================
  // STATE & REACTIVE DATA
  // ============================================================================

  // persistence key for localStorage. Should be the book id generally.
  const storageKey = ref<string | null>(null);

  // the single source of truth for the book data we are editing/viewing
  const rawBook = ref<Book>({ id: '', title: '', author: '', preface: '', nodes: {}, slugMap: {} });

  // the in-memory graph representation of the book exposed as a reactive ref
  const graph = ref(markRaw(new Graph({ directed: true, compound: true })));

  const editMode = ref(false);

  // debounce timer helper for rebuilding the graph
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  // Check if the current book is from a remote source
  const isRemoteBook = computed(() => {
    return rawBook.value.source === 'remote';
  });

  // Edit mode should be conditional - remote books cannot be edited
  const canEdit = computed(() => {
    return !isRemoteBook.value;
  });

  // Effective edit mode - only true if editing is allowed and user has enabled it
  const effectiveEditMode = computed(() => {
    return canEdit.value && editMode.value;
  });

  // ============================================================================
  // GRAPH MANAGEMENT
  // ============================================================================

  function rebuildGraph() {
    const g = markRaw(new Graph({ directed: true, compound: true }));
    g.setGraph({ label: '', rankDir: 'LR' });
    g.setNode('ROOT', { label: 'ROOT' });
    Object.values(rawBook.value.nodes).forEach(node => {
      g.setNode(node.id, {
        ...node,
        ...{
          label:
            node.nodetype.secondary + ' ' + node.reference + (node.name ? '\n' + node.name : ''),
        },
      });
      nodeRefs(node).forEach(ref => g.setEdge(ref, node.id, { label: '' }));
      g.setParent(node.id, node.chapter || 'ROOT');
    });
    graph.value = g;
  }

  function persistBook() {
    if (storageKey.value) {
      const bookToSave = { ...rawBook.value, version: new Date().toISOString() };
      localStorage.setItem('tarskido-book-' + storageKey.value, JSON.stringify(bookToSave));
    }
  }

  function rebuildAndPersist() {
    rebuildGraph();
    persistBook();
  }

  watch(
    rawBook,
    data => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(rebuildAndPersist, 50);
    },
    { deep: true }
  );

  // ============================================================================
  // BOOK LOADING & PERSISTENCE
  // ============================================================================

  function loadFromJSON(data: Book, key?: string) {
    storageKey.value = key || null;
    rawBook.value = data;
    rebuildAndPersist();
  }

  function loadFromLocalStorage(key: string) {
    const data = localStorage.getItem('tarskido-book-' + key);
    if (data) {
      const raw = JSON.parse(data);
      const migratedRaw = migrateBook(raw);
      loadFromJSON(migratedRaw, key);
    } else {
      console.error('No book found in localStorage with key:', key);
    }
  }

  function createNewBook() {
    const newBook: Book = {
      id: uuidv4(),
      title: 'New Book',
      author: '',
      preface: '',
      nodes: {},
      slugMap: {},
    };
    loadFromJSON(newBook, newBook.id);
  }

  // ============================================================================
  // SLUG MANAGEMENT
  // ============================================================================

  function generateSlug(node: Node): string {
    if (!node.nodetype.secondary || !node.reference) {
      return '';
    }

    const baseSlug = (node.nodetype.secondary.toLowerCase() + '-' + node.reference).replace(
      /\s+/g,
      '-'
    );

    let slug = baseSlug;
    let suffix = 2;
    while (rawBook.value.slugMap[slug] && rawBook.value.slugMap[slug] !== node.id) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    return slug;
  }

  function updateSlugMap(nodeId: string, newSlug: string, oldSlug?: string) {
    // Remove old slug mapping
    if (oldSlug && rawBook.value.slugMap[oldSlug] === nodeId) {
      delete rawBook.value.slugMap[oldSlug];
    }
    // Add new slug mapping if slug is provided
    if (newSlug) {
      rawBook.value.slugMap[newSlug] = nodeId;
    }
  }

  // ============================================================================
  // NODE MANAGEMENT
  // ============================================================================

  function upsertNode(node: Node) {
    rawBook.value.nodes[node.id] = node;
  }

  function removeRels(nodeId: string) {
    // helper function to remove all in-edges and parent rels involving a given node
    const inNodeIds = graph.value.predecessors(nodeId);

    if (inNodeIds) {
      inNodeIds.forEach(inNodeId => {
        const inNode = rawBook.value.nodes[inNodeId];
        inNode.references = inNode.references.filter(ref => ref !== nodeId);
        inNode.proof_lines.forEach(line => {
          line.references = line.references.filter(ref => ref !== nodeId);
        });
      });
    }
    const children = graph.value.children(nodeId);
    if (children) {
      children.forEach(childId => {
        const childNode = rawBook.value.nodes[childId];
        childNode.chapter = '';
      });
    }
  }

  function deleteNode(nodeId: string) {
    removeRels(nodeId);
    delete rawBook.value.nodes[nodeId];
  }

  // ============================================================================
  // NAVIGATION & UTILITY HELPERS
  // ============================================================================

  function resolveNodeParam(slugOrId: string): string | null {
    return rawBook.value.nodes[slugOrId] ? slugOrId : rawBook.value.slugMap[slugOrId];
  }

  function sortNodesByReference(nodeIds: string[]): string[] {
    const cmp = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
    return nodeIds
      .map(id => [id, rawBook.value.nodes[id]?.reference || ''])
      .sort(([ida, refa], [idb, refb]) => cmp(refa as string, refb as string))
      .map(([id]) => id as string);
  }

  function nextNodeId(nodeId: string) {
    if (nodeId === 'ROOT') {
      return nodeId;
    }
    const siblingIds = graph.value.children(graph.value.parent(nodeId) || 'ROOT') || [];
    const sortedSiblings = sortNodesByReference(siblingIds);
    const nextIndex = sortedSiblings.indexOf(nodeId) + 1;
    if (nextIndex >= sortedSiblings.length) {
      // return the next on the parent level
      return nextNodeId(graph.value.parent(nodeId) || 'ROOT');
    }
    return sortedSiblings[nextIndex];
  }

  function prevNodeId(nodeId: string) {
    if (nodeId === 'ROOT') {
      return nodeId;
    }
    const siblingIds = graph.value.children(graph.value.parent(nodeId) || 'ROOT') || [];
    const sortedSiblings = sortNodesByReference(siblingIds);
    const prevIndex = sortedSiblings.indexOf(nodeId) - 1;
    if (prevIndex < 0) {
      // return the previous on the parent level
      return prevNodeId(graph.value.parent(nodeId) || 'ROOT');
    }
    return sortedSiblings[prevIndex];
  }

  function toggleEditMode() {
    editMode.value = !editMode.value;
  }

  function copyBookToLocal() {
    if (!isRemoteBook.value) {
      console.warn('Cannot copy non-remote book');
      return null;
    }

    // Create a deep copy of the current book data
    const bookCopy = JSON.parse(JSON.stringify(rawBook.value));
    
    // Generate new ID and update metadata
    const newId = uuidv4();
    bookCopy.id = newId;
    bookCopy.source = 'local';
    bookCopy.slug = bookCopy.slug ? `${bookCopy.slug}-copy` : `${newId}-copy`;
    bookCopy.title = `${bookCopy.title} (Copy)`;
    bookCopy.version = new Date().toISOString();
    
    // Save to localStorage as local book
    localStorage.setItem(`tarskido-book-${newId}`, JSON.stringify(bookCopy));
    
    console.log(`Created local copy of remote book: ${newId}`);
    return bookCopy;
  }

  function deleteBook(id: string) {
    localStorage.removeItem('tarskido-book-' + id);
    
    // If this book is currently loaded, clear it to prevent re-saving
    if (storageKey.value === id) {
      storageKey.value = null;
      // Clear the rawBook to prevent the watcher from re-saving
      rawBook.value = {
        id: '',
        title: '',
        author: '',
        preface: '',
        nodes: {},
        slugMap: {},
      };
    }
  }

  // ============================================================================
  // REFERENCE & DEPENDENCY HELPERS
  // ============================================================================

  function wouldCreateCycle(targetNodeId: string, sourceNodeId: string): boolean {
    // If we're trying to reference ourselves, that's a cycle
    if (targetNodeId === sourceNodeId) return true;

    // Get all nodes that the target node depends on (directly and indirectly)
    const visited = new Set<string>();
    const checkDependencies = (nodeId: string): boolean => {
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);

      const nodeRefs = rawBook.value.nodes[nodeId]?.references || [];
      for (const refId of nodeRefs) {
        if (refId === sourceNodeId) return true; // Found a path back to source
        if (checkDependencies(refId)) return true; // Recursive check
      }
      return false;
    };

    return checkDependencies(targetNodeId);
  }

  function getAvailableReferences(excludeNodeId: string) {
    return Object.values(rawBook.value.nodes)
      .filter((n: Node) => {
        // Exclude Group nodes
        if (n.nodetype.primary === 'Group') return false;

        // Exclude the specified node (self-reference)
        if (n.id === excludeNodeId) return false;

        // Exclude nodes that would create circular dependencies
        if (wouldCreateCycle(n.id, excludeNodeId)) return false;

        return true;
      })
      .map((n: Node) => ({
        value: n.id,
        label: `${n.nodetype.secondary} ${n.reference} ${n.name}`,
      }));
  }

  function getExcludedNodesCount(excludeNodeId: string) {
    const totalNonGroupNodes = Object.values(rawBook.value.nodes).filter(
      (n: Node) => n.nodetype.primary !== 'Group'
    ).length;
    const availableNodes = getAvailableReferences(excludeNodeId).length;
    return totalNonGroupNodes - availableNodes - 1; // -1 for self-reference
  }

  return {
    rawBook,
    graph,
    storageKey,
    editMode,
    isRemoteBook,
    canEdit,
    effectiveEditMode,
    loadFromJSON,
    loadFromLocalStorage,
    sortNodesByReference,
    createNewBook,
    nextNodeId,
    prevNodeId,
    upsertNode,
    deleteNode,
    resolveNodeParam,
    toggleEditMode,
    copyBookToLocal,
    deleteBook,
    generateSlug,
    updateSlugMap,
    wouldCreateCycle,
    getAvailableReferences,
    getExcludedNodesCount,
  };
});
