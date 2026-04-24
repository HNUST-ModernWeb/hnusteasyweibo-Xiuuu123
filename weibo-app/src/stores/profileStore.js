import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiRequest } from '../api'
import { useFeedStore } from './feedStore'
import { useAuthStore } from './authStore'
import { cloudbaseApp, cloudbaseAuth, cloudbaseEnvId } from '../cloudbase'




export const useProfileStore = defineStore('profile', () => {
  const profile = ref({
    name: '小鱼',
    handle: '@xiaoyu',
    bio: '热爱记录生活的产品设计生',
    avatarUrl: '',
    coverUrl: '',
    stats: {
      following: 128,
      followers: '3.2k',
      posts: 86,
    },
    tags: ['校园', '设计', '学习', '手账'],
  })
  const loading = ref(false)
  const error = ref('')
  const saving = ref(false)
  const saveError = ref('')
  const avatarUploading = ref(false)
  const coverUploading = ref(false)
  const uploadError = ref('')
  const avatarVersion = ref(Date.now())
  const coverVersion = ref(Date.now())



  const feedStore = useFeedStore()
  const authStore = useAuthStore()
  const currentUserId = computed(() => authStore.user?.id || null)
  const myPosts = computed(() =>
    feedStore.posts.filter((item) => item.user_id === currentUserId.value)
  )


  const fetchProfile = async () => {
    if (!currentUserId.value) {
      error.value = '请先登录后查看个人资料'
      return
    }

    loading.value = true
    error.value = ''
    try {
      const data = await apiRequest(`/api/users/${currentUserId.value}`)
      const prevAvatar = profile.value.avatarUrl
      const prevCover = profile.value.coverUrl
      const nextAvatar = data.avatar_url || prevAvatar
      const nextCover = data.cover_url || prevCover
      profile.value = {
        ...profile.value,
        name: data.nickname || profile.value.name,
        handle: data.handle || profile.value.handle,
        bio: data.bio || profile.value.bio,
        avatarUrl: nextAvatar,
        coverUrl: nextCover,
        stats: data.stats || profile.value.stats,
      }
      if (nextAvatar !== prevAvatar) {
        avatarVersion.value = Date.now()
      }
      if (nextCover !== prevCover) {
        coverVersion.value = Date.now()
      }

    } catch (err) {
      error.value = err.message || '加载失败'
    } finally {
      loading.value = false
    }
  }


  const updateProfile = async (payload) => {
    if (!currentUserId.value) {
      saveError.value = '请先登录后再修改资料'
      return false
    }

    saving.value = true
    saveError.value = ''
    try {
      const data = await apiRequest(`/api/users/${currentUserId.value}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const prevAvatar = profile.value.avatarUrl
      const prevCover = profile.value.coverUrl
      const nextAvatar = data.avatar_url || prevAvatar
      const nextCover = data.cover_url || prevCover
      profile.value = {
        ...profile.value,
        name: data.nickname || profile.value.name,
        handle: data.handle || profile.value.handle,
        bio: data.bio || profile.value.bio,
        avatarUrl: nextAvatar,
        coverUrl: nextCover,
      }
      if (payload.avatar_url && nextAvatar && nextAvatar !== prevAvatar) {
        avatarVersion.value = Date.now()
      }
      if (payload.cover_url && nextCover && nextCover !== prevCover) {
        coverVersion.value = Date.now()
      }

      return true

    } catch (err) {
      saveError.value = err.message || '保存失败'
      return false
    } finally {
      saving.value = false
    }
  }



  const uploadImage = async (file, target) => {
    if (!currentUserId.value) {
      uploadError.value = '请先登录后再上传图片'
      return ''
    }
    if (!cloudbaseEnvId) {
      uploadError.value = '云存储未配置，请先设置 VITE_CLOUDBASE_ENV_ID'
      return ''
    }
    if (!cloudbaseApp) {
      uploadError.value = '云存储未初始化，请刷新页面后重试'
      return ''
    }
    if (!file) {
      uploadError.value = '未选择图片'
      return ''
    }
    if (!file.type.startsWith('image/')) {
      uploadError.value = '仅支持图片文件'
      return ''
    }
    if (file.size > 2 * 1024 * 1024) {
      uploadError.value = '图片大小需小于 2MB'
      return ''
    }

    uploadError.value = ''
    try {
      if (cloudbaseAuth) {
        try {
          await cloudbaseAuth.signInAnonymously()
        } catch (authError) {
          console.warn('[CloudBase] 匿名登录失败，继续尝试上传', authError)
        }
      }

      const cloudPath = `profiles/${currentUserId.value}/${target}-${Date.now()}-${file.name}`
      const uploadRes = await cloudbaseApp.uploadFile({
        cloudPath,
        filePath: file,
      })
      const tempRes = await cloudbaseApp.getTempFileURL({
        fileList: [{
          fileID: uploadRes.fileID,
          maxAge: 3600,
        }],
      })
      const url = tempRes.fileList?.[0]?.tempFileURL || ''
      if (!url) {
        uploadError.value = '获取图片地址失败'
      }
      return url
    } catch (err) {
      uploadError.value = '上传失败，请重试'
      console.error(err)
      return ''
    }
  }



  const uploadAvatar = async (file) => {
    avatarUploading.value = true
    const url = await uploadImage(file, 'avatar')
    if (!url) {
      avatarUploading.value = false
      return ''
    }
    const prevAvatar = profile.value.avatarUrl
    profile.value = { ...profile.value, avatarUrl: url }
    const ok = await updateProfile({ avatar_url: url })
    if (!ok) {
      uploadError.value = saveError.value || '头像保存失败'
      profile.value = { ...profile.value, avatarUrl: prevAvatar }
    } else {
      await fetchProfile()
    }
    avatarUploading.value = false
    return ok ? url : ''
  }

  const uploadCover = async (file) => {
    coverUploading.value = true
    const url = await uploadImage(file, 'cover')
    if (!url) {
      coverUploading.value = false
      return ''
    }
    const prevCover = profile.value.coverUrl
    profile.value = { ...profile.value, coverUrl: url }
    const ok = await updateProfile({ cover_url: url })
    if (!ok) {
      uploadError.value = saveError.value || '封面保存失败'
      profile.value = { ...profile.value, coverUrl: prevCover }
    } else {
      await fetchProfile()
    }
    coverUploading.value = false
    return ok ? url : ''
  }




  const avatarDisplayUrl = computed(() =>
    profile.value.avatarUrl
      ? `${profile.value.avatarUrl}${profile.value.avatarUrl.includes('?') ? '&' : '?'}v=${avatarVersion.value}`
      : ''
  )

  const coverDisplayUrl = computed(() =>
    profile.value.coverUrl
      ? `${profile.value.coverUrl}${profile.value.coverUrl.includes('?') ? '&' : '?'}v=${coverVersion.value}`
      : ''
  )

  return {
    profile,
    loading,
    error,
    saving,
    saveError,
    avatarUploading,
    coverUploading,
    uploadError,
    avatarDisplayUrl,
    coverDisplayUrl,
    myPosts,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    uploadCover,
  }
})


