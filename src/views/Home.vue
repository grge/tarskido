<script setup lang="ts">
import BookShelf from '../components/BookShelf.vue';
</script>

<template>
  <main class="home">
    <div class="book-shelves">
      <BookShelf type="remote" title="Published Books">
        <template #description>
          Example books available for reading and duplicating to your local collection.
        </template>
      </BookShelf>

      <BookShelf type="local" title="Your Books">
        <template #description>
          Books stored in your browser's local storage that you can edit and modify.
        </template>
      </BookShelf>
    </div>

    <div class="view-all-section">
      <a href="#" class="view-all-link">☰ View all books as list</a>
    </div>
  </main>
</template>

<style scoped lang="stylus">

.home
  max-width 1200px
  margin 0 auto
  padding var(--sp-6)

.book-shelves
  margin-bottom var(--sp-8)

.view-all-section
  text-align center
  margin-top var(--sp-8)

.view-all-link
  color var(--c-nav)
  text-decoration none
  font-family var(--font-sans)
  font-weight 500
  font-size var(--fs-400)
  transition var(--transition-fast)

  &:hover
    color var(--c-nav)
    text-decoration underline
</style>
