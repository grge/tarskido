<template>
  <div>
    <div class="book-content">
      <h2>Editing book</h2>
      <table class='edit-table'>
        <tbody>
        <tr><th>Title</th><td><input type='text' v-model="book.title"/></td></tr>
        <tr><th>Author</th><td><input type='text' v-model="book.author"/></td></tr>
        <tr><th>Preface</th><td><MdEditor v-model='book.preface' language="en-US"></MdEditor></td></tr>
        </tbody>
      </table>
      <div class='listoflinks'>
        <router-link class='navigatelink navbacklink' :to="{name:'Book', params:{bookid: book.id}}">Back to book view</router-link>
        <a class='deletelink' @click='deleteThisBook'>Delete this book</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import MdEditor from 'md-editor-v3';
import { useBookStore, deleteBook } from '@/stores/bookshelf';
import { useRoute } from 'vue-router';
import 'md-editor-v3/lib/style.css';
import BookShelf from '@/components/BookShelf.vue';

export default {
  setup() {
    const bookStore = useBookStore()
    const book = bookStore.rawBook
    return {
      book
    }
  },
  methods: {
    deleteThisBook() {
      deleteBook(this.book.id)
      this.$router.push({name: 'Home'});
    }
  },
  components: {
    MdEditor,
  }
}
</script>

<style scoped lang='stylus'>
.edit-table
 width 80%

.edit-table th
 text-align right

.edit-table td
 text-align left
</style>
