import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiRequest } from '../api'

const STORAGE_KEY = 'weibo-auth'

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, token: '' }
    return JSON.parse(raw)
  } catch (error) {
    console.warn('[Auth] 读取本地登录信息失败', error)
    return { user: null, token: '' }
  }
}

const persistAuth = (payload) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export const useAuthStore = defineStore('auth', () => {
  const initial = loadAuth()
  const user = ref(initial.user)
  const token = ref(initial.token || '')
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => Boolean(user.value?.id))
  const role = computed(() => user.value?.role || 'guest')

  const login = async ({ phone, email, nickname }) => {
    error.value = ''
    loading.value = true

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, email, nickname }),
      })

      user.value = data.user
      token.value = data.token
      persistAuth({ user: user.value, token: token.value })
      return true
    } catch (err) {
      error.value = err.message || '登录失败'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = ''
    error.value = ''
    persistAuth({ user: null, token: '' })
  }

  const hydrate = () => {
    const data = loadAuth()
    user.value = data.user
    token.value = data.token || ''
  }

  return {
    user,
    token,
    loading,
    error,
    isLoggedIn,
    role,
    login,
    logout,
    hydrate,
  }
})
