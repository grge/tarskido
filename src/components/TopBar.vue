<script setup lang="ts">
import { useRoute } from 'vue-router'
import downloadjs from 'downloadjs';
import { useBookStore } from '@/stores/bookshelf'
import HamburgerMenu from '@/components/HamburgerMenu.vue'

const bookStore = useBookStore()
const book = bookStore.rawBook

// download this book using downloadjs
const downloadBook = () => {
  downloadjs(JSON.stringify(book), `${book.title}.json`, 'application/json')
}

</script>

<script lang='ts'>

export default {
  name: 'TopBar',
  components: {
    HamburgerMenu
  }
}
</script>

<template>
  <div class='topbar'>
    <router-link to="/"><h1>Tarskido</h1></router-link>
    <router-link :to="{name:'Book', params:{bookid:book.id}}">
      <h2>{{book.title}} by {{book.author}}</h2>
    </router-link>
    <a class='downloadlink' @click='downloadBook' href="#">Download this book</a>
    <HamburgerMenu :dark="true" />
  </div>
</template>

<style scoped lang="stylus">
.topbar
  width 100%
  background #024064
  margin-top 0
  margin-bottom 0
  padding-bottom 10px
  height 60px
  overflow hidden

h1
  display inline
  line-height 2.15em
  padding-left 1em
  text-align left
  color white
  font-family sans
  font-weight normal
  font-size 35px

h1::before
  filter: invert(100%)
  content " "
  background-size 1em
  background-image url('@/assets/logo.svg')
  width 1em
  height 1em
  display inline-block
  margin-right 0.5em

h2
  display inline
  color background-color
  font-size 12pt
  color white
  font-weight normal
  margin-left 2em
</style>
