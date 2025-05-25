<script lang="ts" setup>
import { useBookStore } from '@/stores/bookshelf';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
const bookStore = useBookStore();
const router = useRouter();

function getLocalStorageBooks() {
  // all books should have be keyed by tarkido-book-%id%
  var books = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('tarskido-book-')) {
      const book = JSON.parse(localStorage.getItem(key));
      books.push(book);
    }
  }
  return books
}

const importFromFile = () => {
  // open a native file dialog, and then read the file as JSON
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const data = JSON.parse(reader.result)
      //bookStore.load(data);
    };
    reader.readAsText(file);
  };
  fileInput.click();
}

function createNewBook() {
  bookStore.createNewBook();
  // redirect to the new book front page
  const bookId = bookStore.rawBook.id;
  router.push({ name: 'BookEdit', params: { bookid: bookId }}); 
}

var books = getLocalStorageBooks()
</script>

<template>
  <div class="bookshelf">
    <div class='bookgrid'>
        <div class='bookgridbook' v-for='book in books'>
            <router-link :to="{name: 'Book', params: {bookid: book.id}}">
              <p class='bookshelf-title'>{{ book.title }}</p>
              <p class='bookshelf-author'>by {{ book.author }}</p>
            </router-link>
        </div>
    </div> 
    <div class='listoflinks'>
      <a class='editlink newbooklink' @click="createNewBook()">Create new book</a>
      <a class='editlink newbooklink' @click="importFromFile()">Import book</a>
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
