<template>
  <div class="corner-menu">
    <a @click="toggleMenu" class="corner-menu-button">
      <img class="corner-menu-button" src="@/assets/logo.svg" />
    </a>
  </div>

  <div class="corner-menu-content" :class="menuOpen ? 'menu-open' : 'menu-closed'">
    <ul>
      <li><router-link :to="{ name: 'Home' }">Tarskido</router-link></li>
      <hr />
      <li><a @click="downloadBook()">Download this book</a></li>
      <li v-if="store.canEdit">
        <a @click="store.toggleEditMode()">Edit mode</a
        ><span class="tick">{{ store.editMode ? '✓' : '' }}</span>
      </li>
      <li v-else class="read-only-indicator">
        <span>📚 Demo Book (Read-only)</span>
      </li>
      <li>
        <a @click="toggleTheme()">{{ isDark ? '☀️' : '🌙' }} {{ isDark ? 'Light mode' : 'Dark mode' }}</a>
      </li>
      <li>Github</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useBookStore } from '@/stores/bookStore';
import { useTheme } from '@/composables/useTheme';

const store = useBookStore();
const { isDark, toggleTheme } = useTheme();
const menuOpen = ref(false);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function _toggleEditMode() {
  store.editMode = !store.editMode;
}

function downloadBook() {
  const bookData = JSON.stringify(store.rawBook, null, 2);
  const blob = new Blob([bookData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${store.rawBook.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<style scoped lang="stylus">

.corner-menu-button
   position fixed
   right var(--sp-6)
   top var(--sp-6)
   height 40px
   z-index var(--z-fixed)
   transition var(--transition-fast)
   
   @media (max-width: 768px)
     right var(--sp-4)
     top var(--sp-4)

.corner-menu-content
   position fixed
   right var(--sp-8)
   top var(--sp-8)
   width 250px
   background-color rgba(255, 255, 255, 0.85)
   box-shadow var(--shadow-2)
   backdrop-filter blur(8px)
   border-radius var(--radius-md)
   border 1px solid var(--c-border)
   z-index var(--z-dropdown)
   opacity 1
   transition height 0ms 0ms, opacity var(--transition-normal) 0ms
   
   @media (max-width: 768px)
     right var(--sp-4)
     top var(--sp-16)
     width 200px

.corner-menu-content ul
   list-style none
   padding 0
   margin 0

.corner-menu-content li
   font-size var(--fs-400)
   margin var(--sp-4) var(--sp-6)
   cursor pointer

.corner-menu-content a
   color var(--c-ink)
   text-decoration none
   transition var(--transition-fast)

.corner-menu-content a:hover
   text-decoration underline
   color var(--c-brand)

.corner-menu-content .tick
   margin-left var(--sp-4)
   color var(--c-success)

.read-only-indicator
   color var(--c-ink-muted)
   font-style italic
   
.read-only-indicator span
   cursor default

.corner-menu-content.menu-closed
   opacity 0
   height 0
   overflow hidden
   transition height 0ms var(--transition-normal), opacity var(--transition-normal) 0ms
   pointer-events none
</style>
