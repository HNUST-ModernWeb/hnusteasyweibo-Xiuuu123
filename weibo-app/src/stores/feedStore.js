import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiRequest } from '../api'
import { useAuthStore } from './authStore'


export const useFeedStore = defineStore('feed', () => {
  const authStore = useAuthStore()
  const posts = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')
  const pendingPosts = ref([])
  const lastUpdated = ref(null)
  const pollingActive = ref(false)
  const likeLoadingIds = ref([])
  const followLoadingIds = ref([])
  const followedUserIds = ref([])
  const commentsByPost = ref({})
  const commentLoadingIds = ref([])
  const commentErrors = ref({})
  const repostingIds = ref([])
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const hasMore = computed(() => posts.value.length < total.value)
  const searchKeyword = ref('')
  const normalizedKeyword = computed(() => searchKeyword.value.trim().toLowerCase())
  const filteredPosts = computed(() => {
    if (!normalizedKeyword.value) return posts.value
    return posts.value.filter((item) => {
      const content = `${item.content} ${item.author} ${item.handle} ${item.tag}`.toLowerCase()
      return content.includes(normalizedKeyword.value)
    })
  })


  const requireLogin = () => {
    if (authStore.isLoggedIn) return true
    error.value = '请先登录后再操作'
    return false
  }

  const normalizePost = (item) => ({

    id: item.id,
    user_id: item.user_id,
    author: item.author,
    handle: item.handle,
    time: new Date(item.created_at).toLocaleString(),
    content: item.content,
    tag: item.tag,
    media_urls: item.media_urls || [],
    liked: item.liked ?? false,
    likes: item.likes_count ?? 0,
    comments: item.comments_count ?? 0,
    repost_from_id: item.repost_from_id ?? null,
    repost_from: item.repost_from ?? null,
  })

  const mergeIncoming = (incoming) => {
    const incomingMap = new Map(incoming.map((item) => [item.id, item]))
    posts.value = posts.value.map((post) => {
      if (!incomingMap.has(post.id)) return post
      const next = incomingMap.get(post.id)
      return {
        ...post,
        ...next,
        liked: post.liked,
      }
    })
  }

  const fetchFeed = async (options = {}) => {
    const { silent = false, usePending = true, pageIndex = 1, append = false } = options
    if (!silent) {
      if (append) {
        loadingMore.value = true
      } else {
        loading.value = true
      }
    }
    error.value = ''

    try {
      const data = await apiRequest(`/api/feed?page=${pageIndex}&pageSize=${pageSize.value}`)
      const incoming = (data.items || []).map(normalizePost)
      total.value = data.total || incoming.length

      if (append) {
        posts.value = [...posts.value, ...incoming]
        page.value = pageIndex
        return
      }

      if (!posts.value.length || !usePending || pageIndex !== 1) {
        posts.value = incoming
        pendingPosts.value = []
      } else {
        const existingIds = new Set(posts.value.map((item) => item.id))
        mergeIncoming(incoming)
        const newItems = incoming.filter((item) => !existingIds.has(item.id))
        if (newItems.length) {
          pendingPosts.value = newItems
        }
      }

      page.value = pageIndex
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err.message || '加载失败'
    } finally {
      if (!silent) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }


  const applyPendingPosts = () => {
    if (!pendingPosts.value.length) return
    posts.value = [...pendingPosts.value, ...posts.value]
    pendingPosts.value = []
  }

  let pollingTimer = null
  const startPolling = (interval = 15000) => {
    if (pollingTimer) return
    pollingActive.value = true
    pollingTimer = setInterval(() => {
      fetchFeed({ silent: true, usePending: true })
    }, interval)
  }

  const stopPolling = () => {
    pollingActive.value = false
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  const isLiking = (postId) => likeLoadingIds.value.includes(postId)

  const setLiking = (postId, value) => {
    if (value) {
      if (!likeLoadingIds.value.includes(postId)) {
        likeLoadingIds.value = [...likeLoadingIds.value, postId]
      }
    } else {
      likeLoadingIds.value = likeLoadingIds.value.filter((id) => id !== postId)
    }
  }

  const toggleLike = async (postId) => {
    const target = posts.value.find((item) => item.id === postId)
    if (!target || isLiking(postId)) return

    setLiking(postId, true)
    const prevLiked = target.liked
    const prevLikes = target.likes

    target.liked = !target.liked
    target.likes = Math.max(0, target.likes + (target.liked ? 1 : -1))

    try {
      const data = await apiRequest(`/api/posts/${postId}/like`, { method: 'POST' })
      target.likes = data.likes_count
    } catch (err) {
      target.liked = prevLiked
      target.likes = prevLikes
      error.value = err.message || '点赞失败'
    } finally {
      setLiking(postId, false)
    }
  }

  const isFollowing = (userId) => followedUserIds.value.includes(userId)

  const setFollowingLoading = (userId, value) => {
    if (value) {
      if (!followLoadingIds.value.includes(userId)) {
        followLoadingIds.value = [...followLoadingIds.value, userId]
      }
    } else {
      followLoadingIds.value = followLoadingIds.value.filter((id) => id !== userId)
    }
  }

  const toggleFollow = async (userId) => {
    if (!requireLogin()) return
    if (!userId || followLoadingIds.value.includes(userId)) return

    setFollowingLoading(userId, true)

    try {
      const data = await apiRequest(`/api/users/${userId}/follow`, { method: 'POST' })
      if (data.followed) {
        if (!followedUserIds.value.includes(userId)) {
          followedUserIds.value = [...followedUserIds.value, userId]
        }
      } else {
        followedUserIds.value = followedUserIds.value.filter((id) => id !== userId)
      }
    } catch (err) {
      error.value = err.message || '关注失败'
    } finally {
      setFollowingLoading(userId, false)
    }
  }

  const isCommentLoading = (postId) => commentLoadingIds.value.includes(postId)

  const setCommentLoading = (postId, value) => {
    if (value) {
      if (!commentLoadingIds.value.includes(postId)) {
        commentLoadingIds.value = [...commentLoadingIds.value, postId]
      }
    } else {
      commentLoadingIds.value = commentLoadingIds.value.filter((id) => id !== postId)
    }
  }

  const fetchComments = async (postId) => {
    if (!postId || isCommentLoading(postId)) return
    setCommentLoading(postId, true)
    commentErrors.value = { ...commentErrors.value, [postId]: '' }

    try {
      const data = await apiRequest(`/api/posts/${postId}/comments`)
      commentsByPost.value = {
        ...commentsByPost.value,
        [postId]: data.items || [],
      }
    } catch (err) {
      commentErrors.value = { ...commentErrors.value, [postId]: err.message || '评论加载失败' }
    } finally {
      setCommentLoading(postId, false)
    }
  }

  const addComment = async (postId, content) => {
    if (!requireLogin()) return null
    if (!postId || !content) return null

    setCommentLoading(postId, true)
    commentErrors.value = { ...commentErrors.value, [postId]: '' }

    try {
      const comment = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ post_id: postId, content }),
      })

      const current = commentsByPost.value[postId] || []
      commentsByPost.value = {
        ...commentsByPost.value,
        [postId]: [...current, comment],
      }

      const target = posts.value.find((item) => item.id === postId)
      if (target) {
        target.comments += 1
      }

      return comment
    } catch (err) {
      commentErrors.value = { ...commentErrors.value, [postId]: err.message || '评论失败' }
      return null
    } finally {
      setCommentLoading(postId, false)
    }
  }

  const isReposting = (postId) => repostingIds.value.includes(postId)

  const setReposting = (postId, value) => {
    if (value) {
      if (!repostingIds.value.includes(postId)) {
        repostingIds.value = [...repostingIds.value, postId]
      }
    } else {
      repostingIds.value = repostingIds.value.filter((id) => id !== postId)
    }
  }

  const repostPost = async (postId, comment = '') => {
    if (!requireLogin()) return null
    if (!postId || isReposting(postId)) return null

    setReposting(postId, true)

    try {
      const post = await apiRequest(`/api/posts/${postId}/repost`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      })
      addPost(post)
      return post
    } catch (err) {
      error.value = err.message || '转发失败'
      return null
    } finally {
      setReposting(postId, false)
    }
  }

  const addPost = (item) => {
    posts.value.unshift(normalizePost(item))
  }

  const loadMore = async () => {
    if (!hasMore.value || loadingMore.value) return
    await fetchFeed({ pageIndex: page.value + 1, append: true, usePending: false })
  }

  const updatePost = async (postId, content) => {
    if (!requireLogin()) return false
    if (!postId || !content) return false

    try {
      const data = await apiRequest(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      })

      const target = posts.value.find((item) => item.id === postId)
      if (target) {
        target.content = data.content
        target.tag = data.tag || target.tag
      }
      return true
    } catch (err) {
      error.value = err.message || '更新失败'
      return false
    }
  }

  const deletePost = async (postId) => {
    if (!requireLogin()) return false
    if (!postId) return false

    try {
      await apiRequest(`/api/posts/${postId}`, { method: 'DELETE' })
      posts.value = posts.value.filter((item) => item.id !== postId)
      return true
    } catch (err) {
      error.value = err.message || '删除失败'
      return false
    }
  }

  return {

    posts,
    loading,
    loadingMore,
    error,
    pendingPosts,
    lastUpdated,
    pollingActive,
    page,
    pageSize,
    total,
    hasMore,
    searchKeyword,
    filteredPosts,
    fetchFeed,

    applyPendingPosts,
    startPolling,
    stopPolling,
    loadMore,
    toggleLike,
    isLiking,
    toggleFollow,
    isFollowing,
    followLoadingIds,
    commentsByPost,
    commentErrors,
    fetchComments,
    addComment,
    isCommentLoading,
    repostPost,
    isReposting,
    addPost,
    updatePost,
    deletePost,
  }
})

