<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import { useNotificationStore } from './stores/notificationStore'
import { useFeedStore } from './stores/feedStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const feedStore = useFeedStore()

const navItems = [
  { label: '主页', to: '/' },
  { label: '发布', to: '/compose' },
  { label: '个人主页', to: '/profile' },
  { label: '通知', to: '/notifications' },
]

const activePath = computed(() => route.path)
const isLoggedIn = computed(() => authStore.isLoggedIn)
const searchKeyword = computed({
  get: () => feedStore.searchKeyword,
  set: (value) => {
    feedStore.searchKeyword = value
  },
})
const searchDraft = ref('')
const searchInputRef = ref(null)

const applySearch = () => {
  searchKeyword.value = searchDraft.value.trim()
  searchInputRef.value?.blur()
  if (route.path !== '/') {
    router.push('/')
  }
}

const startNotificationPolling = () => {
  notificationStore.fetchNotifications()
  notificationStore.startPolling()
}

onMounted(() => {
  authStore.hydrate()
  searchDraft.value = feedStore.searchKeyword
  if (authStore.isLoggedIn) {
    startNotificationPolling()
  }
})

watch(isLoggedIn, (value) => {
  if (value) {
    startNotificationPolling()
  } else {
    notificationStore.stopPolling()
  }
})

watch(searchKeyword, (value) => {
  if (searchDraft.value !== value) {
    searchDraft.value = value
  }
})
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <span class="brand-dot"></span>
        <div>
          <h1>微博轻量版</h1>
          <p>信息流 · 发布 · 个人主页</p>
        </div>
      </div>
      <div class="search">
        <input
          ref="searchInputRef"
          v-model="searchDraft"
          type="text"
          placeholder="搜索内容、话题、用户"
          @keydown.enter.prevent="applySearch"
        />
        <button type="button" class="ghost search-btn" @click="applySearch">搜索</button>
      </div>
      <nav class="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-btn"
          :class="{ active: activePath === item.to }"
        >
          {{ item.label }}
          <span v-if="item.to === '/notifications' && notificationStore.unreadCount" class="badge">
            {{ notificationStore.unreadCount }}
          </span>
        </RouterLink>
        <RouterLink class="primary" to="/compose">+ 立即发布</RouterLink>
        <RouterLink v-if="!isLoggedIn" class="ghost" to="/login">登录</RouterLink>
        <button v-else type="button" class="ghost" @click="authStore.logout()">退出</button>
      </nav>
    </header>

    <div class="layout">
      <aside class="left-panel">
        <section class="card">
          <h2>功能快捷入口</h2>
          <ul class="quick-links">
            <li>热搜榜</li>
            <li>好友动态</li>
            <li>话题广场</li>
            <li>校园圈</li>
          </ul>
        </section>
        <section class="card">
          <h2>今日数据</h2>
          <div class="stat-grid">
            <div>
              <strong>12</strong>
              <span>新关注</span>
            </div>
            <div>
              <strong>86</strong>
              <span>互动</span>
            </div>
            <div>
              <strong>4</strong>
              <span>私信</span>
            </div>
            <div>
              <strong>7</strong>
              <span>收藏</span>
            </div>
          </div>
        </section>
      </aside>

      <main class="center-panel">
        <RouterView />
      </main>

      <aside class="right-panel">
        <section class="card">
          <h2>热搜</h2>
          <ol class="hot-list">
            <li>期末周资料整理</li>
            <li>AI 辅助学习技巧</li>
            <li>晚自习高效专注方法</li>
            <li>校园摄影打卡</li>
            <li>宿舍收纳改造</li>
          </ol>
        </section>
        <section class="card">
          <h2>推荐关注</h2>
          <div class="suggestion">
            <div>
              <strong>Learning Hub</strong>
              <span>@learnhub</span>
            </div>
            <button type="button" class="ghost">关注</button>
          </div>
          <div class="suggestion">
            <div>
              <strong>产品笔记</strong>
              <span>@pmnotes</span>
            </div>
            <button type="button" class="ghost">关注</button>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
