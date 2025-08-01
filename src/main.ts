import { createApp, watch } from 'vue';
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

const shelf = useBookShelfStore();
shelf.initialise();

// Initialize theme
const { initializeTheme } = useTheme();
initializeTheme();
