<script lang="ts">
import LargeTableOfContents from '@/components/LargeTableOfContents.vue';
import ContextGraph from '@/components/ContextGraph.vue';
import { useBookStore } from '@/stores/bookStore';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'vue-router';

export default {
  components: {
    MarkdownRenderer,
    LargeTableOfContents,
    ContextGraph,
  },
  setup() {
    const store = useBookStore();
    const book = store.rawBook;
    const router = useRouter();

    function createNewNode() {
      const nodeId = uuidv4();
      const node = {
        id: nodeId,
        reference: '',
        name: '',
        slug: '',
        autoslug: true,
        nodetype: { primary: '', secondary: '' },
        statement: '',
        references: [],
        chapter: '',
        proof_lines: [],
      };
      store.upsertNode(node);
      router.push({ name: 'NodeEdit', params: { bookParam: store.rawBook.id, nodeParam: nodeId } });
    }

    function cleanBrokenRefs() {
      for (const nodeId in book.nodes) {
        const node = book.nodes[nodeId];
        node.references = node.references.filter(refId => book.nodes[refId]);
        node.proof_lines.forEach(line => {
          line.references = line.references.filter(refId => book.nodes[refId]);
        });
        if (node.chapter && !book.nodes[node.chapter]) {
          node.chapter = 'ROOT';
        }
      }
    }

    function copyToEdit() {
      const copiedBook = store.copyBookToLocal();
      if (copiedBook) {
        // Import and use the bookShelf store to add the copied book
        import('@/stores/bookShelfStore').then(({ useBookShelfStore }) => {
          const shelf = useBookShelfStore();
          shelf.addOrUpdateBook(copiedBook);
          // Navigate to the copied book
          router.push({ name: 'Book', params: { bookParam: copiedBook.slug || copiedBook.id } });
        });
      }
    }

    return { book, createNewNode, cleanBrokenRefs, copyToEdit, store };
  },
};
</script>

<template>
  <div>
    <div class="book-content">
      <h1 class="book-front-title">{{ book.title }}</h1>
      <div class="book-front-author">by {{ book.author }}</div>
      <div class="listoflinks" v-if="store.effectiveEditMode">
        <router-link
          class="editlink"
          :to="{ name: 'BookEdit', params: { bookParam: book.slug || book.id } }"
          >Edit book attributes</router-link
        >
        <a class="editlink" @click="createNewNode()">Create a new node</a>
      </div>
      <div class="listoflinks" v-else-if="store.isRemoteBook">
        <a class="copylink" @click="copyToEdit()">📝 Copy to Edit</a>
        <p class="remote-book-notice">This is a demo book. Create a copy to edit it.</p>
      </div>
      <ContextGraph :contextIds="['ROOT']" />
      <div class="book-preface">
        <MarkdownRenderer :markdown="book.preface" />
      </div>

      <!-- <MdEditor v-model="book.preface" previewOnly /> -->
      <LargeTableOfContents />
    </div>
  </div>
</template>

<style scoped lang="stylus">
.listoflinks
  text-align center

.book-content
  text-align left

.context-graph
  margin-top 1.5em

.book-front-title
  margin-bottom 0.15em
  margin-top var(--sp-4)
  font-size var(--fs-700)
  text-align center

.book-front-author
  margin-bottom var(--sp-2)
  font-size var(--fs-500)
  font-style italic
  text-align center
  color var(--c-ink-muted)

.book-preface
  text-align left
  max-width 40em
  margin 0 auto

p
  word-break break-word
  overflow-wrap break-word
  white-space pre-wrap

.copylink
  background #4a90e2
  color white
  padding 8px 16px
  border-radius 6px
  text-decoration none
  font-weight bold
  cursor pointer
  display inline-block
  margin-bottom 10px

.copylink:hover
  background #357abd

.remote-book-notice
  color #666
  font-size 14px
  font-style italic
  margin 5px 0
  text-align center
</style>
