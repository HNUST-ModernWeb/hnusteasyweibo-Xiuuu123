<script setup>
import { computed, onMounted } from 'vue'
import { useNotificationStore } from '../stores/notificationStore'

const notificationStore = useNotificationStore()

const lastUpdatedText = computed(() =>
  notificationStore.lastUpdated ? notificationStore.lastUpdated.toLocaleTimeString() : '未更新'
)

onMounted(() => {
  if (!notificationStore.notifications.length) {
    notificationStore.fetchNotifications()
  }
})
</script>

<template>
  <section class="page">
    <div class="page-title">
      <h2>通知中心</h2>
      <p>点赞、评论、转发、关注都会出现在这里。</p>
    </div>

    <div class="status-row">
      <div class="status-left">
        <span class="status-pill">未读 {{ notificationStore.unreadCount }}</span>
        <span class="helper">最后更新：{{ lastUpdatedText }}</span>
      </div>
      <div class="status-actions">
        <button type="button" class="ghost" @click="notificationStore.fetchNotifications()">刷新</button>
        <button type="button" class="primary" @click="notificationStore.markAllRead">全部已读</button>
      </div>
    </div>

    <div v-if="notificationStore.loading" class="helper">加载中...</div>
    <div v-if="notificationStore.error" class="error">{{ notificationStore.error }}</div>

    <div class="notification-list">
      <article
        v-for="item in notificationStore.notifications"
        :key="item.id"
        :class="['notification-card', { unread: !item.is_read }]"
      >
        <div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.content }}</p>
        </div>
        <div class="notification-meta">
          <span>{{ item.created_at }}</span>
          <span v-if="!item.is_read" class="status-pill">未读</span>
        </div>
      </article>
      <div v-if="!notificationStore.notifications.length && !notificationStore.loading" class="comment-empty">
        暂无通知
      </div>
    </div>
  </section>
</template>
