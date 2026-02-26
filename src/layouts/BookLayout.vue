<script setup lang="ts">
import { onMounted } from 'vue';

// Debug logging function
function addDebugLog(message: string, data?: any) {
  console.log(message, data);
  const logs = JSON.parse(localStorage.getItem('tarskido-debug-logs') || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    message,
    data: data ? JSON.stringify(data) : undefined
  });
  if (logs.length > 20) logs.shift();
  localStorage.setItem('tarskido-debug-logs', JSON.stringify(logs));
}

addDebugLog('🏗️ BookLayout setup called');

onMounted(() => {
  addDebugLog('🏗️ BookLayout mounted');
});
</script>

<template>
  <div class="book-layout">
    <router-view />
  </div>
</template>

<style scoped>
.book-layout {
  /* Ensure the layout doesn't cause display issues */
  min-height: 100%;
  width: 100%;
}
</style>
