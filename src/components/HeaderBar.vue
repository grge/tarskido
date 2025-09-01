<template>
  <header class="header-bar">
    <div class="header-content">
      <!-- Left: Logo and Title -->
      <div class="header-left">
        <router-link :to="{ name: 'Home' }" class="header-logo-link">
          <img src="@/assets/logo.svg" alt="Tarskido" class="header-logo" />
          <span class="header-title">Tarskido</span>
        </router-link>
      </div>

      <!-- Center: Search Bar (only on book pages) -->
      <div class="header-center" v-if="showSearchBar">
        <div class="search-container">
          <input
            type="text"
            placeholder="Search in book..."
            class="search-input"
            v-model="searchQuery"
            @input="onSearchInput"
          />
        </div>
      </div>

      <!-- Right: Hamburger Menu -->
      <div class="header-right">
        <div class="hamburger-container">
          <a @click="toggleMenu" class="hamburger-button">
            <span class="hamburger-icon">☰</span>
          </a>
          <!-- Dropdown Menu -->
          <div class="dropdown-menu" :class="menuOpen ? 'menu-open' : 'menu-closed'">
            <ul>
              <li><router-link :to="{ name: 'Home' }">Home</router-link></li>
              <hr />
              <li v-if="isOnBookPage">
                <a @click="downloadBook()">Download this book</a>
              </li>
              <li v-if="isOnBookPage && store.canEdit">
                <a @click="store.toggleEditMode()">Edit mode</a>
                <span class="tick">{{ store.editMode ? '✓' : '' }}</span>
              </li>
              <li v-else-if="isOnBookPage" class="read-only-indicator">
                <span>Published Book (Read-only)</span>
              </li>
              <li>
                <a @click="toggleTheme()">{{ isDark ? 'Light mode' : 'Dark mode' }}</a>
              </li>
              <li>
                <a href="https://github.com/username/tarskido" target="_blank">GitHub</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useBookStore } from '@/stores/bookStore';
import { useTheme } from '@/composables/useTheme';

const route = useRoute();
const store = useBookStore();
const { isDark, toggleTheme } = useTheme();

const menuOpen = ref(false);
const searchQuery = ref('');

// Check if we're on a book page to show search bar
const showSearchBar = computed(() => {
  return route.path.includes('/book/');
});

const isOnBookPage = computed(() => {
  return route.path.includes('/book/');
});

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function onSearchInput() {
  // TODO: Implement search functionality
  console.log('Search query:', searchQuery.value);
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
  menuOpen.value = false;
}

// Close menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as Element;
  if (!target.closest('.hamburger-container')) {
    menuOpen.value = false;
  }
}

// Add click outside listener when menu is open
import { onMounted, onUnmounted, watch } from 'vue';

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Close menu when route changes
watch(route, () => {
  menuOpen.value = false;
});
</script>

<style scoped lang="stylus">
.header-bar
  position fixed
  top 0
  left 0
  right 0
  height 60px
  background var(--c-paper)
  border-bottom 1px solid var(--c-border)
  z-index var(--z-fixed)
  backdrop-filter blur(8px)
  background-color rgba(255, 255, 255, 0.95)

  [data-theme="dark"] &
    background-color rgba(18, 18, 18, 0.95)

.header-content
  display flex
  align-items center
  justify-content space-between
  height 100%
  max-width 1200px
  margin 0 auto
  padding 0 var(--sp-6)

.header-left
  display flex
  align-items center

.header-logo-link
  display flex
  align-items baseline
  text-decoration none
  color var(--c-ink)
  transition var(--transition-fast)

  &:hover
    text-decoration none
    color var(--c-brand)

.header-logo
  height 28px
  width 28px
  margin-right var(--sp-3)
  transition var(--transition-fast)

  // Invert logo colors in dark mode
  [data-theme="dark"] &
    filter invert(1)

.header-title
  font-family var(--font-serif)
  font-size var(--fs-600)
  font-weight 500
  letter-spacing 1px

.header-center
  flex 1
  max-width 400px
  margin 0 var(--sp-8)

.search-container
  position relative

.search-input
  width 100%
  padding var(--sp-3) var(--sp-4)
  border 1px solid var(--c-border)
  border-radius var(--radius-md)
  background var(--c-surface)
  color var(--c-ink)
  font-family var(--font-sans)
  font-size var(--fs-300)
  transition var(--transition-fast)

  &:focus
    outline none
    border-color var(--c-brand)
    box-shadow 0 0 0 2px var(--c-focus)

  &::placeholder
    color var(--c-ink-muted)

.header-right
  display flex
  align-items center

.hamburger-container
  position relative

.hamburger-button
  padding var(--sp-2)
  cursor pointer
  color var(--c-ink)
  font-size var(--fs-500)
  transition var(--transition-fast)
  user-select none

  &:hover
    color var(--c-brand)

.hamburger-icon
  display block

.dropdown-menu
  position fixed
  top 61px
  right calc((100vw - min(1200px, 100vw)) / 2 + var(--sp-6) - 45px)
  width 280px
  background var(--c-paper)
  background-color rgba(255, 255, 255, 0.95)
  backdrop-filter blur(12px)
  border 1px solid var(--c-border)
  border-top none
  border-radius 0 0 var(--radius-lg) var(--radius-lg)
  z-index calc(var(--z-fixed) - 1)
  opacity 1
  transform translateY(0)
  transition opacity var(--transition-normal), transform var(--transition-normal)
  box-shadow 0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.06)

  @media (max-width: 768px)
    width 250px
    right var(--sp-4)

  [data-theme="dark"] &
    background-color rgba(18, 18, 18, 0.95)
    box-shadow 0 4px 12px -2px rgba(0, 0, 0, 0.3), 0 2px 6px -1px rgba(0, 0, 0, 0.2)

.dropdown-menu ul
  list-style none
  padding var(--sp-2) 0
  margin 0

.dropdown-menu li
  font-size var(--fs-400)
  margin 0
  padding var(--sp-3) var(--sp-6)
  display flex
  align-items center
  justify-content space-between

.dropdown-menu a
  color var(--c-ink)
  text-decoration none
  font-family var(--font-sans)
  transition var(--transition-fast)
  flex 1

  &:hover
    color var(--c-brand)
    text-decoration underline

.dropdown-menu hr
  margin var(--sp-2) var(--sp-6)
  border none
  border-top 1px solid var(--c-border)

.tick
  margin-left var(--sp-4)
  color var(--c-success)
  font-weight 600

.read-only-indicator
  color var(--c-ink-muted)
  font-style italic

  span
    cursor default

.menu-closed
  opacity 0
  transform translateY(-12px) scaleY(0.8)
  pointer-events none
  transform-origin top center

.menu-open
  opacity 1
  transform translateY(0) scaleY(1)
  transform-origin top center

// Add top padding to body to account for fixed header
body
  padding-top 60px
</style>
