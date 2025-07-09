<script lang="ts" setup>
import { useBookStore } from '@/stores/bookStore';
import { useBookShelfStore } from '@/stores/bookShelfStore';
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
const bookStore = useBookStore();
const router = useRouter();
const shelf = useBookShelfStore();

const importFromFile = () => {
  // open a native file dialog, and then read the file as JSON
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const data = JSON.parse(reader.result as string);
      console.log('Importing book from file:', data);
      bookStore.loadFromJSON(data, data.id);
      // Refresh the shelf to show the new book
      shelf.refreshBookList();
      router.push({ name: 'Book', params: { bookParam: data.slug || data.id } });
    };
    reader.readAsText(file);
  };
  fileInput.click();
};

function createNewBook() {
  bookStore.createNewBook();
  // Refresh the shelf to show the new book
  shelf.refreshBookList();
  // redirect to the new book front page
  const bookId = bookStore.rawBook.id;
  router.push({ name: 'BookEdit', params: { bookParam: bookId } });
}

const books = shelf.available;
</script>

<template>
  <div class="bookshelf">
    <div class="bookgrid">
      <div class="bookgridbook" v-for="book in books">
        <router-link :to="{ name: 'Book', params: { bookParam: book.slug || book.id } }">
          <p class="bookshelf-title">{{ book.title }}</p>
          <p class="bookshelf-author">by {{ book.author }}</p>
        </router-link>
      </div>
    </div>
    <div class="listoflinks">
      <a class="editlink newbooklink" @click="createNewBook()">Create new book</a>
      <a class="editlink newbooklink" @click="importFromFile()">Import book</a>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.bookshelf
  text-align center

.bookgrid
  display flex
  flex-wrap wrap
  width 70%
  min-width 500px;
  margin 1.5em auto
  background white
  border-top 1px solid #aaaaaa
  border-bottom 1px solid #aaaaaa

.bookgridbook
  text-align center
  margin 1.5em auto
  padding 0 3em
  cursor pointer

.bookgridbook a
  text-decoration none
  color black

.bookshelf-title::before
  content "🕮"
  display block
  font-size 18pt
  text-decoration none

.bookshelf-title
  font-size 14pt
  margin 0px

.bookshelf-author
  margin 0px
  font-size 10pt
  font-style italic
</style>
