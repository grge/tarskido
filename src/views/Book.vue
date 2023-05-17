<script lang="ts">
import TopBar from '@/components/TopBar.vue';
import LargeTableOfContents from '@/components/LargeTableOfContents.vue';
import { useBookshelfStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MdEditor from 'md-editor-v3'

export default {
  components: {
    TopBar,
    MdEditor,
    // BookOverviewGraph,
    LargeTableOfContents,
  },
  setup() {
    const store = useBookshelfStore();
    const book_id = useRoute().params.bookid;
    const book = computed(() => store.getBookById(book_id))
    return { book, store };
  },
}
</script>

<template>
  <div>
      <TopBar />
      <div class='book-content'>
        <h2 class='book-front-title'>{{book.title}}</h2>
        <div class='book-front-author'>by {{book.author}}</div>
        <MdEditor v-model="book.preface" previewOnly />
        <div class='listoflinks'>
          <router-link class='editlink' :to="{ name: 'BookEdit', params: {bookid: book.id}}">Edit book attributes</router-link>
          <a class='editlink' @click="store.createNewNode(book.id)">Create a new node</a>
        </div>

        <div class='listofnodes'>
          <h3>Nodes</h3>
          <ul>
            <li v-for="node in book.nodes" :key="node.id">
              <router-link :to="{ name: 'Node', params: {bookid: book.id, nodeid: node.id}}">Blah{{node.nodetype}} {{node.reference}}</router-link>
            </li>
          </ul>
       </div> 


        <!-- <BookOverviewGraph /> -->
        <LargeTableOfContents />
      </div>
  </div>
</template>

<style scoped lang='stylus'>
.book-content
  text-align center

.book-front-title 
  margin-bottom 0.15em
  margin-top 1em
  font-size 40px

.book-front-author
  margin-bottom 0.5em
  font-size 25px
  font-style italic

.book-preface
  text-align left

.listoflinks
  margin-bottom 1.5em
</style>
