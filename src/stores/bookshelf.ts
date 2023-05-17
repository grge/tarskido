import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import Graph from '@/graphlib_ext.js'

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


export interface BookShelf {
    books: Record<string, Book>
}

// the initial state is loaded from localStorage if available, otherwise it is
// an empty bookshelf.
function loadState(): BookShelf {
    const state = localStorage.getItem('tarskido-state')
    if (state) {
        return JSON.parse(state)['bookshelf']
    }
    return {
        books: {1: {id: '1', title: 'Book 1', author: 'Author 1', nodes: {}}}
    }
}

export const useBookshelfStore = defineStore({
    id: 'bookshelf',
    state: () => loadState(),
    actions: {
        addBook(book: Book) {
            this.books[book.id] = book
        },
        importBook(book: Book) {
            // check if ID is already in use, if so, generate a new one
            if (book.id in this.books) {
                book.id = uuidv4()
            }
            this.addBook(book)
            return book.id
        },
        createNewBook() {
            const blank_book = {
                id: uuidv4(),
                title: 'Book Title',
                author: 'Anonymous',
                preface: '',
                nodes: {}
            }
            this.addBook(blank_book)
            return blank_book.id
        },
        createNewNode(book_id : string) {
            const blank_node = {
                id: uuidv4(),
                reference: '',
                name: '',
                nodetype: {primary: 'Comment', secondary: 'Comment'},
                statement: '',
                references: [],
                chapter: '',
                proof_lines: []
            }
            this.books[book_id].nodes[blank_node.id] = blank_node
            return blank_node.id
        },
        createGroupChildNode(book_id: string, parent_id: string) {
            const book = this.books[book_id]
            if (book.nodes[parent_id].nodetype.primary !== 'Group') {
                throw new Error('Parent node is not a group')
            }
            const node_id = this.createNewNode(book_id)
            book.nodes[node_id].chapter = parent_id
            return node_id
        },
        deleteBook(book_id: string) {
            delete this.books[book_id]
        },
        deleteNode(book_id: string, node_id: string) {
            delete this.books[book_id].nodes[node_id]
        }
    },
    getters: {
        getBookById: (state) => (id: string) => {
            return state.books[id]
        },
        getBookGraph: (state) => (id: string) => {
            var book = state.books[id];
            var g = new Graph({directed: true, compound: true}).setGraph({})
            g.setNode("ROOT", {})
            Object.values(book.nodes).forEach((node) => {
                g.setNode(node.id, {
                    id: node.id,
                    name:node.name,
                    label:node.subtype + " " + node.reference + (node.name ? "\n" + node.name : ""),
                    reference:node.reference,
                    type:node.nodetype
                })
                node.references.forEach((ref) => {g.setEdge(ref, node.id, {label: ""})})
                node.proof_lines.forEach((line) => {line.references.forEach((ref) => {g.setEdge(ref, node.id, {label: ""})})})
                if (node.chapter) {
                    g.setParent(node.id, node.chapter)
                } else {
                    g.setParent(node.id, "ROOT")
                }
            })
            return g
        },
        getLeftSibling: (state) => (book_id: string, node_id: string) => {
            console.log(this)
            return node_id
        }

    }
})