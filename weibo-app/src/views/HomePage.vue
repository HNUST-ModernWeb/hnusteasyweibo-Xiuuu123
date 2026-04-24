<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFeedStore } from '../stores/feedStore'
import { useAuthStore } from '../stores/authStore'

const feedStore = useFeedStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()


const pendingCount = computed(() => feedStore.pendingPosts.length)
const lastUpdatedText = computed(() =>
  feedStore.lastUpdated ? feedStore.lastUpdated.toLocaleTimeString() : '未更新'
)

const commentDrafts = reactive({})
const openCommentIds = ref([])
const previewState = ref(null)
const editingPost = ref(null)
const editDraft = ref('')

const ensureLogin = () => {
  if (authStore.isLoggedIn) return true
  router.push({ path: '/login', query: { redirect: route.fullPath } })
  return false
}

const canManagePost = (post) =>
  authStore.isLoggedIn && (authStore.user?.id === post.user_id || authStore.role === 'admin')

const togglePolling = () => {

  if (feedStore.pollingActive) {
    feedStore.stopPolling()
  } else {
    feedStore.startPolling()
  }
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

const handleLike = (postId) => {
  if (!ensureLogin()) return
  feedStore.toggleLike(postId)
}

const handleFollow = (userId) => {
  if (!ensureLogin()) return
  feedStore.toggleFollow(userId)
}

const handleRepost = async (postId) => {
  if (!ensureLogin()) return
  await feedStore.repostPost(postId)
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

const openEdit = (post) => {
  editingPost.value = post
  editDraft.value = post.content
}

const closeEdit = () => {
  editingPost.value = null
  editDraft.value = ''
}

const saveEdit = async () => {
  if (!editingPost.value) return
  const ok = await feedStore.updatePost(editingPost.value.id, editDraft.value.trim())
  if (ok) {
    closeEdit()
  }
}

const handleDelete = async (postId) => {
  if (!ensureLogin()) return
  await feedStore.deletePost(postId)
}

const clearSearch = () => {
  feedStore.searchKeyword = ''
}

onMounted(() => {

  if (!feedStore.posts.length) {
    feedStore.fetchFeed()
  }
  feedStore.startPolling()
})

onUnmounted(() => {
  feedStore.stopPolling()
})
</script>

<template>
  <section class="page">
    <div class="composer-mini">
      <div>
        <h2>今天有什么想分享的？</h2>
        <p>记录生活点滴，分享你的新鲜事。</p>
      </div>
      <RouterLink class="primary" to="/compose">去发布</RouterLink>
    </div>

    <div class="status-row">
      <div class="status-left">
        <span class="status-pill">自动刷新：{{ feedStore.pollingActive ? '开启' : '已暂停' }}</span>
        <span class="helper">最后更新：{{ lastUpdatedText }}</span>
      </div>
      <div class="status-actions">
        <button type="button" class="ghost" @click="togglePolling">
          {{ feedStore.pollingActive ? '暂停刷新' : '开启刷新' }}
        </button>
        <button type="button" class="ghost" @click="feedStore.fetchFeed()">
          手动刷新
        </button>
      </div>
    </div>

    <div v-if="pendingCount" class="refresh-bar">
      <span>有 {{ pendingCount }} 条新内容</span>
      <button type="button" class="primary" @click="feedStore.applyPendingPosts()">立即查看</button>
    </div>

    <div v-if="feedStore.loading" class="helper">加载中...</div>
    <div v-if="feedStore.error" class="error">{{ feedStore.error }}</div>

    <div v-if="feedStore.searchKeyword" class="search-summary">
      <span>搜索“{{ feedStore.searchKeyword }}”，共 {{ feedStore.filteredPosts.length }} 条结果</span>
      <button type="button" class="ghost" @click="clearSearch">清除搜索</button>
    </div>
    <div
      v-if="!feedStore.loading && !feedStore.filteredPosts.length && feedStore.searchKeyword"
      class="comment-empty"
    >
      未找到包含“{{ feedStore.searchKeyword }}”的内容
    </div>


    <div class="feed">

      <article v-for="post in feedStore.filteredPosts" :key="post.id" class="feed-card">

        <div class="feed-header">
          <div>
            <h3>{{ post.author }} <span>{{ post.handle }}</span></h3>
            <p>{{ post.time }} · {{ post.tag }}</p>
          </div>
          <div class="feed-header-actions">
            <button
              type="button"
              :class="['ghost', { active: feedStore.isFollowing(post.user_id) }]"
              :disabled="post.user_id === authStore.user?.id || feedStore.followLoadingIds.includes(post.user_id)"
              @click="handleFollow(post.user_id)"
            >
              {{ feedStore.isFollowing(post.user_id) ? '已关注' : '关注' }}
            </button>
            <button v-if="canManagePost(post)" type="button" class="ghost" @click="openEdit(post)">
              编辑
            </button>
            <button
              v-if="canManagePost(post)"
              type="button"
              class="ghost danger"
              @click="handleDelete(post.id)"
            >
              删除
            </button>
          </div>
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
          <button
            type="button"
            class="ghost"
            :disabled="feedStore.isLiking(post.id)"
            @click="handleLike(post.id)"

          >
            <span :class="{ liked: post.liked }">♥</span> 赞 {{ post.likes }}
            <span v-if="feedStore.isLiking(post.id)" class="like-loading">…</span>
          </button>
          <button type="button" class="ghost" @click="toggleComments(post.id)">
            💬 评论 {{ post.comments }}
          </button>
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

    <div v-if="feedStore.hasMore" class="load-more">
      <button
        type="button"
        class="ghost"
        :disabled="feedStore.loadingMore"
        @click="feedStore.loadMore"
      >
        {{ feedStore.loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </div>

    <div v-if="editingPost" class="modal" @click.self="closeEdit">
      <div class="modal-card">
        <h3>编辑动态</h3>
        <textarea v-model="editDraft" rows="4" placeholder="更新你的内容"></textarea>
        <div class="modal-actions">
          <button type="button" class="ghost" @click="closeEdit">取消</button>
          <button type="button" class="primary" @click="saveEdit">保存</button>
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

