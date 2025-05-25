import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { ref, watch, markRaw } from 'vue';

import Graph from '@/graphlib_ext.js'

/* Currently I am storing the bookshelf as a simple JSON object. each book has
 * a list of nodes, and each node knows the id of its parent and its references.
 * Then, if we want to display or navigate the book as a graph, we have to convert
 * it to a Graph object. Not sure if there's any simple way around this...
 *
 * Update 2025-05-22: After reviewing many options, I think the best approach is actually
 * to keep both data structures, but keep the graph inside the store so that we don't rebuild
 * it every time we need it. Instead, we rebuild it a) on a hard page load, b) whenever we
 * make an edit to the book. This rebuilding is debounced to avoid unnecessary
 * actions. 
 *
 * One alternative would be to update BOTH data structures (raw and graph) whenever we
 * make an edit. But my theory is that building the graph will always be cheap enough
 * that we can do it every edit.
 */

export interface Book {
    id: string,
    title: string,
    author: string,
    preface: string,
    nodes: Record<string, Node>
}

const VALID_COMMENT_SUBTYPE = ['Comment', 'Note', 'Example'] as const
const VALID_DEFINITION_SUBTYPE = ['Definition', 'Axiom', 'Hypothesis'] as const
const VALID_GROUP_SUBTYPE = ['Chapter', 'Section', 'Subsection', 'MultiPart', 'Appendix'] as const
const VALID_PROPOSITION_SUBTYPE = ['Proposition', 'Lemma', 'Theorem', 'Corollary'] as const
export const VALID_NODE_TYPE = {
    'Comment': VALID_COMMENT_SUBTYPE,
    'Definition': VALID_DEFINITION_SUBTYPE,
    'Group': VALID_GROUP_SUBTYPE,
    'Proposition': VALID_PROPOSITION_SUBTYPE
} as const

type CommentSubType = typeof VALID_COMMENT_SUBTYPE[number]
type DefinitionSubType = typeof VALID_DEFINITION_SUBTYPE[number]
type GroupSubType = typeof VALID_GROUP_SUBTYPE[number]
type PropositionSubType = typeof VALID_PROPOSITION_SUBTYPE[number]

type NodeType = 
    { primary: 'Comment', secondary: CommentSubType } |
    { primary: 'Definition', secondary: DefinitionSubType } |
    { primary: 'Group', secondary: GroupSubType } |
    { primary: 'Proposition', secondary: PropositionSubType }

export interface Node {
    id: string,
    reference: string,
    name: string
    nodetype: NodeType,
    statement: string,
    references: string[],
    chapter: string,
    proof_lines: string[]
}

function nodeRefs(node: Node): string[] {
  // return a list of all references from this node
  const base = node.references ?? [];
  if (node.nodetype?.primary !== 'Proposition') {
    return base;
  }

  const extra = Object.values(node.proof_lines ?? {}).flatMap(
    line => line?.references ?? []
  );
  return Array.from(new Set([...base, ...extra]));
}

export function deleteBook(bookId: string) {
  // delete book from localStorage
  if (localStorage.getItem('tarskido-book-' + bookId)) {
    localStorage.removeItem('tarskido-book-' + bookId);
  }
}

export const useBookStore = defineStore('book', () => {
  // persistence key for localStorage. Should be the book id generally.
  const storageKey = ref<string | null>(null);

  // the single source of truth for the book data we are editing/viewing
  const rawBook = ref<Book>({id: '', title: '', author: '', preface: '', nodes: {}});

  // the in-memory graph representation of the book exposed as a reactive ref
  const graph = ref(markRaw(new Graph({directed: true, compound: true})));

  // debounce timer helper for rebuilding the graph
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function rebuildAndPersist() {
    if (storageKey.value) {
      localStorage.setItem('tarskido-book-' + storageKey.value, JSON.stringify(rawBook.value));
    };
    const g = markRaw(new Graph({directed: true, compound: true}));
    g.setGraph({label: "", rankDir: 'LR'});
    g.setNode("ROOT", {label: "ROOT"})
    Object.values(rawBook.value.nodes).forEach((node) => {
      g.setNode(node.id, {...node, ...{label:
          node.nodetype.secondary + " " + node.reference + (node.name ? "\n" + node.name : "")}});
      nodeRefs(node).forEach((ref) => g.setEdge(ref, node.id, {label: ""}));
      g.setParent(node.id, node.chapter || 'ROOT');
    });
    graph.value = g;
  }

  watch(rawBook, (data) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(rebuildAndPersist, 50);
  }, { deep: true });

  function loadFromJSON(data: RawBook, key?: string) {
    storageKey.value = key || null;
    rawBook.value = data;
    rebuildAndPersist();
  }

  function loadFromLocalStorage(key: string) {
    const data = localStorage.getItem('tarskido-book-' + key);
    if (data) {
      loadFromJSON(JSON.parse(data), key);
    } else {
      console.error('No book found in localStorage with key:', key);
    }
  }

  function createNewBook() {
    const newBook: Book = {
      id: uuidv4(),
      name: 'New Book',
      author: '',
      preface: '',
      nodes: {},
    };
    loadFromJSON(newBook, newBook.id);
  }

  function upsertNode(node: Node) {
    rawBook.value.nodes[node.id] = node;
  }

  function removeRels(nodeId: string) {
    // helper function to remove all in-edges and parent rels involving a given node
    const inNodeIds = graph.value.predecessors(nodeId);

    if (inNodeIds) {
      inNodeIds.forEach((inNodeId) => {
        const inNode = rawBook.value.nodes[inNodeId];
        inNode.references = inNode.references.filter((ref) => ref !== nodeId);
        inNode.proof_lines.forEach((line) => {
          line.references = line.references.filter((ref) => ref !== nodeId);
        });
      });
    }
    const children = graph.value.children(nodeId);
    if (children) {
      children.forEach((childId) => {
        const childNode = rawBook.value.nodes[childId];
        childNode.chapter = '';
      })
    }
  };
        
  function deleteNode(nodeId: string) {
    removeRels(nodeId);
    delete rawBook.value.nodes[nodeId];
  }

  return {
    rawBook,
    graph,
    storageKey,
    loadFromJSON,
    loadFromLocalStorage,
    createNewBook,
    upsertNode,
    deleteNode,
  }
})
