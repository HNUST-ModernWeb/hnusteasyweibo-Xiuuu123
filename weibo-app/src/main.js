import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import { initCloudbaseAuth } from './cloudbase'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

initCloudbaseAuth()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore(pinia)

authStore.hydrate()

router.beforeEach((to) => {
  if (to.meta?.requiresAuth && !authStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

app.use(router)
app.mount('#app')
