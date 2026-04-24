<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFeedStore } from '../stores/feedStore'
import { useProfileStore } from '../stores/profileStore'
import { useAuthStore } from '../stores/authStore'

const feedStore = useFeedStore()
const profileStore = useProfileStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const showEdit = ref(false)
const editForm = reactive({
  name: '',
  handle: '',
  bio: '',
})

const avatarInputRef = ref(null)
const coverInputRef = ref(null)

const commentDrafts = reactive({})
const openCommentIds = ref([])
const previewState = ref(null)


const ensureLogin = () => {
  if (authStore.isLoggedIn) return true
  router.push({ path: '/login', query: { redirect: route.fullPath } })
  return false
}

const isCommentsOpen = (postId) => openCommentIds.value.includes(postId)


const toggleComments = async (postId) => {
  if (isCommentsOpen(postId)) {
    openCommentIds.value = openCommentIds.value.filter((id) => id !== postId)
    return
  }

  openCommentIds.value = [...openCommentIds.value, postId]
  if (!feedStore.commentsByPost[postId]) {
    await feedStore.fetchComments(postId)
  }
}

const submitComment = async (postId) => {
  if (!ensureLogin()) return
  const content = (commentDrafts[postId] || '').trim()
  if (!content) return
  const result = await feedStore.addComment(postId, content)
  if (result) {
    commentDrafts[postId] = ''
  }
}


const openEdit = () => {
  if (!ensureLogin()) return
  editForm.name = profileStore.profile.name
  editForm.handle = profileStore.profile.handle
  editForm.bio = profileStore.profile.bio
  showEdit.value = true
}


const closeEdit = () => {
  showEdit.value = false
  profileStore.saveError = ''
}

const saveProfile = async () => {
  const ok = await profileStore.updateProfile({
    nickname: editForm.name,
    handle: editForm.handle,
    bio: editForm.bio,
  })
  if (ok) {
    showEdit.value = false
  }
}

const triggerAvatarUpload = () => {
  if (!ensureLogin()) {
    profileStore.uploadError = '请先登录后再上传图片'
    return
  }
  profileStore.uploadError = ''
  avatarInputRef.value?.click()
}

const triggerCoverUpload = () => {
  if (!ensureLogin()) {
    profileStore.uploadError = '请先登录后再上传图片'
    return
  }
  profileStore.uploadError = ''
  coverInputRef.value?.click()
}


const handleAvatarChange = async (event) => {
  if (!ensureLogin()) return
  const [file] = event.target.files || []
  await profileStore.uploadAvatar(file)
  event.target.value = ''
}

const handleCoverChange = async (event) => {
  if (!ensureLogin()) return
  const [file] = event.target.files || []
  await profileStore.uploadCover(file)
  event.target.value = ''
}

const handleRepost = async (postId) => {

  if (!ensureLogin()) return
  await feedStore.repostPost(postId)
}

const handleLike = (postId) => {
  if (!ensureLogin()) return
  feedStore.toggleLike(postId)
}

const openPreview = (urls, index, post) => {

  previewState.value = {
    urls,
    index,
    post,
  }
}

const closePreview = () => {
  previewState.value = null
}

const nextPreview = () => {
  if (!previewState.value) return
  previewState.value.index = (previewState.value.index + 1) % previewState.value.urls.length
}

const prevPreview = () => {
  if (!previewState.value) return
  previewState.value.index =
    (previewState.value.index - 1 + previewState.value.urls.length) % previewState.value.urls.length
}


onMounted(() => {
  if (!feedStore.posts.length) {
    feedStore.fetchFeed()
  }
  profileStore.fetchProfile()
})
</script>

<template>
  <section class="page">
    <div v-if="profileStore.loading" class="helper">加载资料中...</div>
    <div v-if="profileStore.error" class="error">{{ profileStore.error }}</div>

    <div class="profile-card profile-card--hero">
      <div
        class="profile-cover"
        :style="profileStore.coverDisplayUrl ? { backgroundImage: `url(${profileStore.coverDisplayUrl})` } : {}"
      >

        <div class="profile-cover-actions">
          <button type="button" class="ghost cover-btn" @click="triggerCoverUpload">
            {{ profileStore.coverUploading ? '上传中...' : '更换封面' }}
          </button>
          <input
            ref="coverInputRef"
            class="sr-only"
            type="file"
            accept="image/*"
            @change="handleCoverChange"
          />
        </div>
      </div>
      <div class="profile-main">
        <div class="profile-header">
          <div class="profile-avatar">
            <div class="avatar-frame">
              <img v-if="profileStore.avatarDisplayUrl" :src="profileStore.avatarDisplayUrl" alt="头像" />

              <div v-else class="avatar-placeholder">
                {{ profileStore.profile.name?.slice(0, 1) || '我' }}
              </div>
            </div>
            <button type="button" class="ghost avatar-btn" @click="triggerAvatarUpload">
              {{ profileStore.avatarUploading ? '上传中...' : '更换头像' }}
            </button>
            <input
              ref="avatarInputRef"
              class="sr-only"
              type="file"
              accept="image/*"
              @change="handleAvatarChange"
            />
          </div>
          <div class="profile-info">
            <div>
              <h2>{{ profileStore.profile.name }}</h2>
              <p>{{ profileStore.profile.handle }}</p>
              <p class="profile-bio">{{ profileStore.profile.bio }}</p>
            </div>
          </div>
          <div class="profile-actions">
            <button class="primary" type="button" @click="openEdit">编辑资料</button>
          </div>
        </div>
        <div class="profile-stats">
          <div>
            <strong>{{ profileStore.profile.stats.following }}</strong>
            <span>关注</span>
          </div>
          <div>
            <strong>{{ profileStore.profile.stats.followers }}</strong>
            <span>粉丝</span>
          </div>
          <div>
            <strong>{{ profileStore.profile.stats.posts }}</strong>
            <span>微博</span>
          </div>
        </div>
        <div class="tag-list">
          <span v-for="tag in profileStore.profile.tags" :key="tag"># {{ tag }}</span>
        </div>
        <p v-if="profileStore.uploadError" class="error">{{ profileStore.uploadError }}</p>
      </div>
    </div>



    <div class="feed">
      <article v-for="post in profileStore.myPosts" :key="post.id" class="feed-card">
        <div class="feed-header">
          <div>
            <h3>{{ post.author }} <span>{{ post.handle }}</span></h3>
            <p>{{ post.time }} · {{ post.tag }}</p>
          </div>
          <button type="button" class="ghost">置顶</button>
        </div>
        <p class="feed-content">{{ post.content }}</p>
        <div v-if="post.repost_from" class="repost-card">
          <p class="helper">转发自 {{ post.repost_from.author }} {{ post.repost_from.handle }}</p>
          <p class="repost-content">{{ post.repost_from.content }}</p>
        </div>
        <div v-if="post.media_urls?.length" class="media-grid media-grid--feed">
          <span class="media-total">共 {{ post.media_urls.length }} 张</span>
          <button
            v-for="(url, index) in post.media_urls"
            :key="index"
            type="button"
            class="media-thumb"
            @click="openPreview(post.media_urls, index, post)"
          >
            <img
              :src="url"
              alt="图片"
              @click.stop="openPreview(post.media_urls, index, post)"
            />
          </button>

        </div>

        <div class="feed-actions">
          <button type="button" class="ghost" @click="handleLike(post.id)">
            <span :class="{ liked: post.liked }">♥</span> 赞 {{ post.likes }}
          </button>

          <button type="button" class="ghost" @click="toggleComments(post.id)">💬 评论 {{ post.comments }}</button>
          <button
            type="button"
            class="ghost"
            :disabled="feedStore.isReposting(post.id)"
            @click="handleRepost(post.id)"
          >
            ↗ 转发
            <span v-if="feedStore.isReposting(post.id)" class="like-loading">…</span>
          </button>
        </div>

        <div v-if="isCommentsOpen(post.id)" class="comment-panel">
          <div v-if="feedStore.commentErrors[post.id]" class="error">
            {{ feedStore.commentErrors[post.id] }}
          </div>
          <div v-if="feedStore.isCommentLoading(post.id)" class="helper">评论加载中...</div>

          <div v-if="feedStore.commentsByPost[post.id]?.length" class="comment-list">
            <div v-for="item in feedStore.commentsByPost[post.id]" :key="item.id" class="comment-item">
              <strong>{{ item.author }}</strong>
              <span class="helper">{{ item.handle }}</span>
              <p>{{ item.content }}</p>
            </div>
          </div>
          <div v-else class="comment-empty">暂无评论，来说两句吧</div>

          <div class="comment-form">
            <input
              v-model="commentDrafts[post.id]"
              type="text"
              placeholder="写下你的评论"
            />
            <button type="button" class="primary" @click="submitComment(post.id)">
              发送
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showEdit" class="modal">
      <div class="modal-card">
        <h3>编辑个人资料</h3>
        <label>
          昵称
          <input v-model="editForm.name" type="text" />
        </label>
        <label>
          账号
          <input v-model="editForm.handle" type="text" />
        </label>
        <label>
          简介
          <textarea v-model="editForm.bio" rows="3"></textarea>
        </label>
        <div v-if="profileStore.saveError" class="error">{{ profileStore.saveError }}</div>
        <div class="modal-actions">
          <button type="button" class="ghost" @click="closeEdit">取消</button>
          <button type="button" class="primary" :disabled="profileStore.saving" @click="saveProfile">
            保存
          </button>
        </div>
      </div>
    </div>

    <div v-if="previewState" class="modal" @click.self="closePreview()">
      <div class="modal-card media-modal">
        <div class="media-preview-header">
          <h3>图片预览</h3>
          <span>{{ previewState.index + 1 }}/{{ previewState.urls.length }}</span>
        </div>
        <img :src="previewState.urls[previewState.index]" alt="预览图片" />
        <div class="media-preview-meta">
          <div>
            <strong>作者</strong>
            <span>{{ previewState.post?.author }}</span>
          </div>
          <div>
            <strong>标签</strong>
            <span>{{ previewState.post?.tag }}</span>
          </div>
          <div>
            <strong>发布时间</strong>
            <span>{{ previewState.post?.time }}</span>
          </div>
        </div>
        <div class="media-preview-actions">
          <button class="ghost" type="button" @click="prevPreview" :disabled="previewState.urls.length < 2">
            上一张
          </button>
          <button class="ghost" type="button" @click="nextPreview" :disabled="previewState.urls.length < 2">
            下一张
          </button>
          <button class="primary" type="button" @click="closePreview">关闭</button>
        </div>
      </div>
    </div>
  </section>
</template>

