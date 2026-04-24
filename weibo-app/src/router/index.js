import { createRouter, createWebHashHistory } from 'vue-router'

import HomePage from '../views/HomePage.vue'
import ComposePage from '../views/ComposePage.vue'
import ProfilePage from '../views/ProfilePage.vue'
import NotificationsPage from '../views/NotificationsPage.vue'
import LoginPage from '../views/LoginPage.vue'
import { useAuthStore } from '../stores/authStore'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/compose', name: 'compose', component: ComposePage, meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } },
  { path: '/notifications', name: 'notifications', component: NotificationsPage, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginPage },
]




const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
