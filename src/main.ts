import { createApp, watch } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { useBookShelfStore } from '@/stores/bookShelfStore';
import { useTheme } from '@/composables/useTheme';

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

const app = createApp(App);

// Global error handler
app.config.errorHandler = (error, vm, info) => {
  addDebugLog('❌ Global Vue error', {
    error: error.message,
    info: info,
    component: vm?.$options?.name
  });
  console.error('Global Vue error:', error, info);
};

// Global unhandled error handler
window.addEventListener('error', (event) => {
  addDebugLog('❌ Global unhandled error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  addDebugLog('❌ Global unhandled promise rejection', {
    reason: event.reason?.toString?.() || event.reason
  });
});
const pinia = createPinia();

app.use(ElementPlus);

app.use(pinia);
app.use(router);
app.mount('#app');

// Safety-net for GitHub Pages SPA fallback.
// If we land on /tarskido/?/book/... and router already parsed '/',
// force the correct route after app bootstrap.
if (window.location.search.startsWith('?/')) {
  const raw = window.location.search.slice(2); // remove '?/'
  const normalized = decodeURIComponent(raw).replace(/`+$/, '').replace(/^\/+/, '');
  const absolute = window.location.pathname + normalized + window.location.hash;
  // Update browser URL first
  window.history.replaceState(null, '', absolute);
  // Then force router navigation using path relative to base
  const relative = '/' + normalized + window.location.hash;
  router.replace(relative).catch(() => {});
}

const shelf = useBookShelfStore();
shelf.initialise();

// Initialize theme
const { initializeTheme } = useTheme();
initializeTheme();
