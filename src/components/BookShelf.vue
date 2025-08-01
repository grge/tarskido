<script setup lang="ts">
import { useBookShelfStore } from '@/stores/bookShelfStore';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

interface Props {
  type: 'local' | 'remote';
  title: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'book-action': [action: string, book?: any]
}>();

const router = useRouter();
const shelf = useBookShelfStore();

// Filter books based on type
const books = computed(() => {
  return shelf.available.filter(book => book.source === props.type);
});

const importFromFile = () => {
  // Open a native file dialog
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    
    try {
      const bookData = await shelf.importBookFromFile(file);
      router.push({ name: 'Book', params: { bookParam: bookData.slug || bookData.id } });
    } catch (error) {
      console.error('Failed to import book:', error);
      // TODO: Show user-friendly error message
    }
  };
  fileInput.click();
};

const createNewBook = async () => {
  const bookData = await shelf.createBook();
  // Redirect to the new book edit page
  router.push({ name: 'BookEdit', params: { bookParam: bookData.id } });
};

const duplicateBook = async (book: any) => {
  const copiedBook = await shelf.duplicateBook(book);
  if (copiedBook) {
    router.push({ name: 'Book', params: { bookParam: copiedBook.slug || copiedBook.id } });
  }
};

const deleteBook = (book: any) => {
  // TODO: Add confirmation dialog
  shelf.deleteLocalBook(book.id);
};
</script>

<template>
  <section class="bookshelf">
    <div class="shelf-header">
      <h2 class="shelf-title">{{ title }}</h2>
      <p class="shelf-description">
        <slot name="description"></slot>
      </p>
    </div>
    <div class="shelf-container">
      <div class="book-scroll">
        <!-- Special actions card for local shelf -->
        <div 
          v-if="type === 'local'" 
          class="book-card actions-card"
        >
          <div class="actions-content">
            <a class="action-link" @click="createNewBook()">
              <span class="action-icon">✎</span>
              New book
            </a>
            <a class="action-link" @click="importFromFile()">
              <span class="action-icon">⇪</span>
              Import book
            </a>
          </div>
        </div>
        
        <!-- Book cards -->
        <div 
          v-for="book in books" 
          :key="book.id" 
          class="book-card"
        >
          <!-- Background layer with actions -->
          <div class="card-background">
            <div class="background-actions">
              <template v-if="type === 'local'">
                <a class="action-button edit-button" 
                   @click="$router.push({ name: 'BookEdit', params: { bookParam: book.slug || book.id } })">
                  ✎ Edit
                </a>
                <a class="action-button delete-button" @click="deleteBook(book)">
                  ✕ Delete
                </a>
              </template>
              <template v-else>
                <a class="action-button duplicate-button" @click="duplicateBook(book)">
                  ⎘ Make local copy
                </a>
              </template>
            </div>
          </div>
          
          <!-- Foreground content layer -->
          <router-link :to="{ name: 'Book', params: { bookParam: book.slug || book.id } }" class="card-content">
            <div class="book-cover">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">by {{ book.author }}</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="stylus">

.bookshelf
  margin var(--sp-8) 0

.shelf-header
  margin-bottom var(--sp-6)

.shelf-title
  font-family var(--font-sans)
  font-size var(--fs-500)
  font-weight 600
  margin 0 0 var(--sp-2)
  color var(--c-ink)
  font-variant small-caps
  letter-spacing 0.8px

.shelf-description
  font-family var(--font-serif)
  font-size var(--fs-300)
  color var(--c-ink-muted)
  margin 0
  font-style italic

.shelf-container
  background var(--c-surface)
  border-radius var(--radius-md)
  padding var(--sp-6)
  border 1px solid var(--c-border)
  // Textured background for tactile feel
  background-image linear-gradient(45deg, transparent 25%, rgba(0,0,0,0.02) 25%), 
                    linear-gradient(-45deg, transparent 25%, rgba(0,0,0,0.02) 25%)
  background-size 8px 8px

.book-scroll
  display flex
  gap var(--sp-4)
  overflow-x auto
  overflow-y hidden
  padding var(--sp-2) 0
  scroll-behavior smooth
  
  // Custom scrollbar styling
  &::-webkit-scrollbar
    height 8px
  
  &::-webkit-scrollbar-track
    background var(--c-surface)
    border-radius var(--radius-sm)
  
  &::-webkit-scrollbar-thumb
    background var(--c-border-strong)
    border-radius var(--radius-sm)
    
    &:hover
      background var(--c-ink-muted)

.book-card
  flex-shrink 0
  width 180px
  height 250px
  position relative
  border-radius var(--radius-md)
  transition var(--transition-fast)
  
  &:hover
    transform translateY(-4px)
    box-shadow var(--shadow-3)
    
    .card-content
      bottom 50px

// Background layer (darker) - completely static, no transitions
.card-background
  position absolute
  top 0
  left 0
  right 0
  bottom 0
  background var(--c-surface)
  border-radius var(--radius-md)
  border 1px solid var(--c-border)

// Background actions - positioned to be revealed
.background-actions
  position absolute
  bottom 16px
  left 0
  right 0
  display flex
  align-items center
  justify-content center
  gap var(--sp-3)

// Foreground content layer - inset with book spine effect
.card-content
  position absolute
  top 1px
  left 4px
  right 1px
  bottom 1px
  background var(--c-paper)
  border 1px solid var(--c-border)
  border-radius calc(var(--radius-md) - 1px)
  text-decoration none
  color var(--c-ink)
  padding var(--sp-4)
  display flex
  flex-direction column
  transition bottom var(--transition-fast)
  z-index 1

.book-cover
  height 100%
  display flex
  flex-direction column
  justify-content flex-start
  text-align left
  position relative

.book-title
  font-size var(--fs-400)
  font-weight 600
  margin 0 0 var(--sp-2)
  line-height var(--lh-tight)
  // Truncate long titles
  overflow hidden
  display -webkit-box
  -webkit-line-clamp 3
  -webkit-box-orient vertical

.book-author
  font-size var(--fs-200)
  color var(--c-ink-muted)
  font-style italic
  margin 0
  overflow hidden
  text-overflow ellipsis
  white-space nowrap

// Special actions card
.actions-card
  background var(--c-surface)
  border 2px dashed var(--c-accent)
  display flex
  align-items center
  justify-content center
  height 248px
  
  &:hover
    background var(--c-hover)
    border-color var(--c-accent)

.actions-content
  height 100%
  display flex
  flex-direction column
  justify-content center
  align-items center
  gap var(--sp-3)
  padding var(--sp-3)

.action-link
  display flex
  align-items center
  justify-content center
  gap var(--sp-2)
  color var(--c-accent)
  text-decoration none
  font-family var(--font-sans)
  font-weight 500
  font-size var(--fs-300)
  transition var(--transition-fast)
  text-align center
  cursor pointer
  
  &:hover
    color var(--c-accent)
    text-decoration underline

.action-icon
  font-size var(--fs-400)

// Action button styles
.action-button
  text-decoration none
  font-family var(--font-sans)
  font-weight 500
  font-size var(--fs-200)
  padding var(--sp-1) var(--sp-3)
  border-radius var(--radius-sm)
  transition var(--transition-fast)
  cursor pointer
  
  &:hover
    text-decoration underline

.edit-button
  color var(--c-accent)

.delete-button
  color var(--c-error)

.duplicate-button
  color var(--c-nav)
</style>
