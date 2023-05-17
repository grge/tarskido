import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()

watch (
    pinia.state,
    (state) => {localStorage.setItem('tarskido-state', JSON.stringify(state))},
    {deep: true}
)

app.use(pinia)
app.use(router)

app.mount('#app')
