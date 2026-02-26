<template>
  <div class="not-found-debug">
    <h1>Not Found</h1>
    <p>Path: {{ path }}</p>
    
    <div v-if="debugInfo" class="debug-section">
      <h2>Debug Information</h2>
      <div class="debug-info">
        <h3>BookShelf State:</h3>
        <ul>
          <li><strong>Initialized:</strong> {{ debugInfo.isInitialized }}</li>
          <li><strong>Available books:</strong> {{ debugInfo.availableCount }}</li>
          <li><strong>Slug map size:</strong> {{ debugInfo.slugMapSize }}</li>
        </ul>
        
        <h3>Available Books:</h3>
        <ul>
          <li v-for="book in debugInfo.books" :key="book.id">
            <strong>{{ book.title }}</strong> (id: {{ book.id }}, slug: {{ book.slug }}, source: {{ book.source }})
          </li>
        </ul>
        
        <h3>Slug Map:</h3>
        <ul>
          <li v-for="(id, slug) in debugInfo.slugMap" :key="slug">
            <strong>{{ slug }}</strong> → {{ id }}
          </li>
        </ul>
        
        <h3>URL Analysis:</h3>
        <ul>
          <li><strong>Current path:</strong> {{ $route.path }}</li>
          <li><strong>Book param:</strong> {{ $route.params.bookParam }}</li>
          <li><strong>Resolved book ID:</strong> {{ debugInfo.resolvedBookId }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBookShelfStore } from '@/stores/bookShelfStore'
import { useRoute } from 'vue-router'

const props = defineProps<{
  path: string
}>()

const route = useRoute()
const shelf = useBookShelfStore()
const debugInfo = ref<any>(null)

onMounted(async () => {
  // Ensure shelf is initialized
  await shelf.initialise()
  
  const bookParam = route.params.bookParam as string
  const resolvedBookId = bookParam ? shelf.resolveBookParam(bookParam) : null
  
  debugInfo.value = {
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
    resolvedBookId: resolvedBookId
  }
})
</script>

<style scoped>
.not-found-debug {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.debug-section {
  margin-top: 30px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.debug-info h3 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #666;
}

.debug-info ul {
  margin-left: 20px;
}

.debug-info li {
  margin-bottom: 5px;
  font-family: monospace;
  font-size: 14px;
}
</style>
