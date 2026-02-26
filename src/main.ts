import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { useBookShelfStore } from '@/stores/bookShelfStore';
import { useTheme } from '@/composables/useTheme';

const app = createApp(App);
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
  window.history.replaceState(null, '', absolute);
  const relative = '/' + normalized + window.location.hash;
  router.replace(relative).catch(() => {});
}

const shelf = useBookShelfStore();
shelf.initialise();

// Initialize theme
const { initializeTheme } = useTheme();
initializeTheme();
