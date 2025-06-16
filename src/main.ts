import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { useBookShelfStore } from '@/stores/bookShelfStore'

const app = createApp(App)
const pinia = createPinia()

app.use(ElementPlus, {
  theme: {
    '--el-color-primary': '#6aa84f',
  }
})

app.use(pinia)
app.use(router)
app.mount('#app')

const shelf = useBookShelfStore()
shelf.initialise()
