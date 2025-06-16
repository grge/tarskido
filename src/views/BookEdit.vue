<template>
  <div>
    <div class="book-content">
      <h2>Editing book</h2>
      <table class='edit-table'>
        <tbody>
        <tr><th>Title</th><td><input type='text' v-model="book.title"/></td></tr>
        <tr><th>Slug</th><td><input type='text' v-model="book.slug"/></td></tr>
        <tr><th>Author</th><td><input type='text' v-model="book.author"/></td></tr>
        <tr><th>Preface</th><td><MdEditor v-model='book.preface' language="en-US"></MdEditor></td></tr>
        </tbody>
      </table>
      <div class='listoflinks'>
        <router-link class='navigatelink navbacklink' :to="{name:'Book', params:{bookParam: book.slug || book.id}}">Back to book view</router-link>
        <a class='deletelink' @click='deleteThisBook'>Delete this book</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import MdEditor from 'md-editor-v3';
import { useBookStore, deleteBook } from '@/stores/bookStore';
import { useRoute } from 'vue-router';
import 'md-editor-v3/lib/style.css';
import BookShelf from '@/components/BookShelf.vue';
import { useBookShelfStore } from '@/stores/bookShelfStore';
import { watch } from 'vue';



export default {
  setup() {
    const shelf = useBookShelfStore();
    const book = useBookStore().rawBook;
    // watch (and debounce) the slug so that we can update the global slugMap

    watch(() => book.slug, (newSlug, oldSlug) => {
      if (newSlug) {
        shelf.slugMap[oldSlug] = undefined;
        shelf.slugMap[newSlug] = book.id;
      }
    }, { immediate: true });
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
