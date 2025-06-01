<template>
  <div class="corner-menu">
    <a @click="toggleMenu" class="corner-menu-button">
      <img class="corner-menu-button" src="@/assets/logo.svg" />
    </a>
  </div>

  <div class="corner-menu-content" :class="menuOpen ? 'menu-open' : 'menu-closed'">
    <ul>
      <li><router-link :to="{ name: 'Home' }">Tarskido</router-link></li>
      <hr/>
      <li>Download this book</li>
      <li><a @click="toggleEditMode()">Edit Mode</a><span class="tick">{{ store.editMode ? "✓" : ""}}</span></li>
      <li>Github</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { useBookStore } from '@/stores/bookshelf';

  const store = useBookStore();
  const menuOpen = ref(false);

  function toggleMenu() {
    menuOpen.value = !menuOpen.value;
  }

  function toggleEditMode() {
    store.editMode = !store.editMode;
  }
</script>

<style scoped lang="stylus">
.corner-menu-button
   position absolute
   right 0
   top 0
   margin 25px
   height 40px
   z-index 1000

.corner-menu-content 
   position absolute
   right 0
   top 0
   margin 35px
   width 250px
   box-shadow 0 0 10px rgba(0, 0, 0, 0.1)
   background-color white
   border-radius 8px
   border 1px solid #ccc
   z-index 100
   opacity 1
   transition height 0ms 0ms, opacity 400ms 0ms

.corner-menu-content ul
   list-style none
   padding 0
   margin 0

.corner-menu-content li
   font-size 18pt
   margin 20px 25px
   cursor pointer

.corner-menu-content a
   color black
   text-decoration none

.corner-menu-content a:hover
   text-decoration underline

.corner-menu-content .tick 
   margin-left 1em

.corner-menu-content.menu-closed
   opacity 0
   height 0
   overlfow hidden
   transition height 0ms 400ms, opacity 400ms 0ms
</style>
