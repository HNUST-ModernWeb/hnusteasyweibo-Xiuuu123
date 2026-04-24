<script setup>
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  phone: '',
  email: '',
  nickname: '',
})

const handleLogin = async () => {
  const ok = await authStore.login({
    phone: form.phone.trim(),
    email: form.email.trim(),
    nickname: form.nickname.trim(),
  })
  if (ok) {
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  }
}
</script>

<template>
  <section class="page">
    <div class="page-title">
      <h2>登录</h2>
      <p>使用手机号或邮箱登录，登录后可发布、评论与互动。</p>
    </div>

    <form class="card login-card" @submit.prevent="handleLogin">
      <label>
        手机号
        <input v-model="form.phone" type="text" placeholder="请输入手机号" />
      </label>
      <label>
        邮箱
        <input v-model="form.email" type="email" placeholder="请输入邮箱" />
      </label>
      <label>
        昵称（可选）
        <input v-model="form.nickname" type="text" placeholder="用于新用户注册" />
      </label>
      <div v-if="authStore.error" class="error">{{ authStore.error }}</div>
      <button class="primary" type="submit" :disabled="authStore.loading">
        {{ authStore.loading ? '登录中...' : '登录' }}
      </button>
      <p class="helper">提示：手机号或邮箱至少填写一项</p>
    </form>
  </section>
</template>
