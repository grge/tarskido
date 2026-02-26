<script setup lang="ts">
import BookShelf from '../components/BookShelf.vue';
import { ref, onMounted } from 'vue';
import { useBookShelfStore } from '@/stores/bookShelfStore';
import { useRoute } from 'vue-router';

const shelf = useBookShelfStore();
const route = useRoute();
const debugInfo = ref<any>(null);
const showDebug = ref(false);

onMounted(async () => {
  // Check if we came from a book URL (indicating potential redirect issue)
  const currentPath = route.path;
  const referrer = document.referrer;
  const fullUrl = window.location.href;
  const hasBookInPath = currentPath.includes('/book/') || window.location.hash.includes('/book/') || fullUrl.includes('/book/');
  
  // Also show debug if someone manually adds ?debug to URL, or if referrer suggests redirect
  const forceDebug = window.location.search.includes('debug') || fullUrl.includes('debug');
  const suspiciousRedirect = referrer.includes('/book/') || referrer === '';
  
  // For now, always show debug info to help diagnose the issue
  if (true || hasBookInPath || forceDebug || suspiciousRedirect) {
    showDebug.value = true;
    
    // Ensure shelf is initialized
    await shelf.initialise();
    
    // Try to resolve the book param if it's in the current path
    const pathParts = currentPath.split('/');
    const bookParam = pathParts[pathParts.indexOf('book') + 1];
    const resolvedBookId = bookParam ? shelf.resolveBookParam(bookParam) : null;
    
    // Get router debug logs from localStorage
    const debugLogs = JSON.parse(localStorage.getItem('tarskido-debug-logs') || '[]');
    
    debugInfo.value = {
      currentPath: currentPath,
      referrer: referrer,
      windowLocation: window.location.href,
      routePath: route.path,
      routeParams: route.params,
      bookParam: bookParam,
      resolvedBookId: resolvedBookId,
      isInitialized: shelf._isInitialized,
      availableCount: shelf.available.length,
      slugMapSize: Object.keys(shelf.slugMap).length,
      books: shelf.available.map(b => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        source: b.source
      })),
      slugMap: shelf.slugMap,
      routerLogs: debugLogs
    };
  }
});

const clearLogs = () => {
  localStorage.removeItem('tarskido-debug-logs');
  if (debugInfo.value) {
    debugInfo.value.routerLogs = [];
  }
};
</script>

<template>
  <main class="home">
    <div v-if="showDebug" class="debug-banner">
      <h2>🔧 Debug Mode - Redirect Investigation</h2>
      <p><strong>You may have been redirected here from a book URL.</strong></p>
      <div class="debug-info">
        <h3>Navigation Info:</h3>
        <ul>
          <li><strong>Current path:</strong> {{ debugInfo?.currentPath }}</li>
          <li><strong>Window location:</strong> {{ debugInfo?.windowLocation }}</li>
          <li><strong>Route path:</strong> {{ debugInfo?.routePath }}</li>
          <li><strong>Route params:</strong> {{ JSON.stringify(debugInfo?.routeParams) }}</li>
          <li><strong>Referrer:</strong> {{ debugInfo?.referrer }}</li>
        </ul>
        
        <h3>Book Resolution:</h3>
        <ul>
          <li><strong>Book param extracted:</strong> {{ debugInfo?.bookParam }}</li>
          <li><strong>Resolved book ID:</strong> {{ debugInfo?.resolvedBookId }}</li>
        </ul>
        
        <h3>BookShelf State:</h3>
        <ul>
          <li><strong>Initialized:</strong> {{ debugInfo?.isInitialized }}</li>
          <li><strong>Available books:</strong> {{ debugInfo?.availableCount }}</li>
          <li><strong>Slug map size:</strong> {{ debugInfo?.slugMapSize }}</li>
        </ul>
        
        <div v-if="debugInfo?.books?.length">
          <h3>Available Books:</h3>
          <ul>
            <li v-for="book in debugInfo.books" :key="book.id">
              <strong>{{ book.title }}</strong> (id: {{ book.id }}, slug: {{ book.slug }})
            </li>
          </ul>
        </div>
        
        <div v-if="Object.keys(debugInfo?.slugMap || {}).length">
          <h3>Slug Map:</h3>
          <ul>
            <li v-for="(id, slug) in debugInfo.slugMap" :key="slug">
              <strong>{{ slug }}</strong> → {{ id }}
            </li>
          </ul>
        </div>
        
        <div v-if="debugInfo?.routerLogs?.length">
          <h3>Router Debug Logs: <button @click="clearLogs" class="clear-logs-btn">Clear</button></h3>
          <div class="router-logs">
            <div v-for="(log, index) in debugInfo.routerLogs.slice(-10)" :key="index" class="log-entry">
              <span class="timestamp">{{ new Date(log.timestamp).toLocaleTimeString() }}</span>
              <span class="message">{{ log.message }}</span>
              <span v-if="log.data" class="data">{{ log.data }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <p><em>Try this direct link: <a :href="`/tarskido/book/elliptic-functions`">/tarskido/book/elliptic-functions</a></em></p>
    </div>
    
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

.debug-banner
  background #fff3cd
  border 1px solid #ffeaa7
  border-radius 8px
  padding 20px
  margin-bottom 30px
  font-family monospace
  font-size 14px
  
  h2
    margin-top 0
    color #856404
  
  .debug-info
    background white
    padding 15px
    border-radius 4px
    margin-top 15px
    
    h3
      margin-top 15px
      margin-bottom 8px
      color #666
      font-size 16px
    
    ul
      margin-left 20px
      margin-bottom 15px
    
    li
      margin-bottom 4px
      word-break break-all
    
    .router-logs
      background #f8f9fa
      border 1px solid #e9ecef
      border-radius 4px
      padding 10px
      max-height 200px
      overflow-y auto
      margin-top 8px
      
      .log-entry
        margin-bottom 5px
        font-size 12px
        display block
        
        .timestamp
          color #6c757d
          margin-right 8px
        
        .message
          font-weight bold
          margin-right 8px
        
        .data
          color #495057
          font-style italic
  
  .clear-logs-btn
    background #dc3545
    color white
    border none
    padding 2px 8px
    border-radius 3px
    font-size 12px
    cursor pointer
    margin-left 10px
    
    &:hover
      background #c82333

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
