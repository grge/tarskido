<script lang="ts" setup>
import { useBookshelfStore } from '@/stores/bookshelf';
const store = useBookshelfStore();
const books = store.books;

const importFromFile = () => {
  // open a native file dialog, and then read the file as JSON
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      console.log(reader.result)
      const data = JSON.parse(reader.result)
      store.importBook(data);
    };
    reader.readAsText(file);
  };
  fileInput.click();
}
</script>

<template>
  <div class="bookshelf">
    <div class='bookgrid'>
        <div class='bookgridbook' :key='id' v-for='(book, id) in books'>
            <router-link :to="{name: 'Book', params: {bookid: book.id}}">
              <p class='bookshelf-title'>{{ book.title }}</p>
              <p class='bookshelf-author'>by {{ book.author }}</p>
            </router-link>
        </div>
    </div> 
    <a class='editlink newbooklink' @click="store.createNewBook()">Create new book</a>
    <a class='editlink newbooklink' @click="importFromFile()">Import book</a>
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
