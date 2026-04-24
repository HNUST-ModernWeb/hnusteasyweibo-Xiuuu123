<script setup>
import { useRouter } from 'vue-router'
import { useComposeStore } from '../stores/composeStore'

const router = useRouter()
const composeStore = useComposeStore()

const handleSubmit = async () => {
  const ok = await composeStore.submitPost()
  if (ok) {
    router.push('/')
  }
}


const handleFileChange = async (event) => {
  const [file] = event.target.files
  await composeStore.addMediaFile(file)
  event.target.value = ''
}

const formatSize = (size = 0) => {
  if (!size) return '未知'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

</script>

<template>
  <section class="page">
    <div class="page-title">
      <h2>发布新内容</h2>
      <p>文字、图片、话题都可以，保持简洁清晰。</p>
    </div>

    <form class="compose-form" @submit.prevent="handleSubmit">
      <label>
        发布内容
        <textarea
          v-model="composeStore.composeForm.content"
          placeholder="分享一下此刻的想法..."
          @blur="composeStore.touched = true"
        ></textarea>
        <span v-if="composeStore.touched && composeStore.errors.content" class="error">
          {{ composeStore.errors.content }}
        </span>
        <span class="helper">{{ composeStore.composeForm.content.length }}/200</span>
      </label>

      <div class="media-uploader">
        <div class="media-header">
          <span>图片上传</span>
          <label class="ghost">
            选择图片
            <input type="file" accept="image/*" @change="handleFileChange" />
          </label>
        </div>
        <p class="helper">仅支持图片，单张大小建议小于 2MB</p>
        <div v-if="composeStore.uploadError" class="error">{{ composeStore.uploadError }}</div>
        <div v-if="composeStore.uploading" class="uploading">正在上传...</div>

        <div v-if="composeStore.mediaFiles.length" class="media-grid">
          <div v-for="(item, index) in composeStore.mediaFiles" :key="item.fileID" class="media-item">
            <img :src="item.url" :alt="item.name" />
            <button type="button" class="ghost" @click="composeStore.removeMediaFile(index)">
              删除
            </button>
          </div>
        </div>
      </div>

      <div class="field-row">
        <label>
          位置
          <input v-model="composeStore.composeForm.location" type="text" />
        </label>
        <label>
          可见范围
          <select v-model="composeStore.composeForm.visibility">
            <option>公开</option>
            <option>仅好友</option>
            <option>仅自己</option>
          </select>
        </label>
      </div>

      <div class="action-row">
        <button class="ghost" type="button" disabled>添加图片</button>
        <button class="primary" type="submit" :disabled="!composeStore.canSubmit">发布</button>
      </div>
      <div v-if="composeStore.submitError" class="error">{{ composeStore.submitError }}</div>
      <div v-if="composeStore.showSuccess" class="success">发布成功，已更新到信息流</div>

    </form>
  </section>
</template>

