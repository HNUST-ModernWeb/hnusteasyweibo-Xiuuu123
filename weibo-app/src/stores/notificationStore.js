import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiRequest } from '../api'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const loading = ref(false)
  const error = ref('')
  const lastUpdated = ref(null)
  const pollingActive = ref(false)

  const unreadCount = computed(() =>
    notifications.value.filter((item) => !item.is_read).length
  )

  const fetchNotifications = async (options = {}) => {
    const { silent = false } = options
    if (!silent) {
      loading.value = true
    }
    error.value = ''

    try {
      const data = await apiRequest('/api/notifications')
      notifications.value = data.items || []
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err.message || '通知加载失败'
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }

  const markAllRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'POST' })
      notifications.value = notifications.value.map((item) => ({
        ...item,
        is_read: true,
      }))
    } catch (err) {
      error.value = err.message || '操作失败'
    }
  }

  let pollingTimer = null
  const startPolling = (interval = 15000) => {
    if (pollingTimer) return
    pollingActive.value = true
    pollingTimer = setInterval(() => {
      fetchNotifications({ silent: true })
    }, interval)
  }

  const stopPolling = () => {
    pollingActive.value = false
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  return {
    notifications,
    loading,
    error,
    lastUpdated,
    pollingActive,
    unreadCount,
    fetchNotifications,
    markAllRead,
    startPolling,
    stopPolling,
  }
})
