<script setup lang="ts">
import BookShelf from '../components/BookShelf.vue'
</script>

<template>
  <div class="home">
      <h1>Tarskido</h1>
      <BookShelf />
  </div>
</template>

<style scoped lang='stylus'>

.home
 text-align center

h1
 margin-top 2em
 font-size 41pt
 font-weight normal
 font-family sans

h1::before
 content " "
 background-size 1em
 background-image url('@/assets/logo.svg')
 width 1em
 height 1em
 display inline-block
 margin-right 0.5em


</style>
