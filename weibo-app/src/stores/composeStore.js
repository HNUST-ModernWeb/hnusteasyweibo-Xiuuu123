import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useFeedStore } from './feedStore'
import { cloudbaseApp, cloudbaseAuth } from '../cloudbase'
import { apiRequest } from '../api'
import { useAuthStore } from './authStore'



export const useComposeStore = defineStore('compose', () => {
  const composeForm = reactive({
    content: '',
    location: '杭州',
    visibility: '公开',
  })

  const authStore = useAuthStore()
  const touched = ref(false)

  const showSuccess = ref(false)
  const mediaFiles = ref([])
  const uploading = ref(false)
  const uploadError = ref('')
  const submitError = ref('')
  const selectedPhoto = ref(null)


  const errors = computed(() => {
    const result = {}
    if (!composeForm.content.trim()) {
      result.content = '请填写发布内容'
    } else if (composeForm.content.trim().length < 6) {
      result.content = '内容至少 6 个字'
    } else if (composeForm.content.trim().length > 200) {
      result.content = '内容最多 200 字'
    }
    return result
  })

  const canSubmit = computed(() => Object.keys(errors.value).length === 0)

  const addMediaFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      uploadError.value = '仅支持图片文件'
      return
    }

    uploadError.value = ''
    uploading.value = true

    try {
      try {
        await cloudbaseAuth.signInAnonymously()
      } catch (authError) {
        console.warn('[CloudBase] 匿名登录失败，继续尝试上传', authError)
      }

      const cloudPath = `uploads/${Date.now()}-${file.name}`
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

      const tempFile = tempRes.fileList?.[0]
      if (tempFile?.tempFileURL) {
        mediaFiles.value.push({
          fileID: uploadRes.fileID,
          url: tempFile.tempFileURL,
          name: file.name,
          size: file.size,
          type: file.type,
        })
      }

    } catch (error) {
      uploadError.value = '上传失败，请重试'
      console.error(error)
    } finally {
      uploading.value = false
    }
  }

  const removeMediaFile = (index) => {
    mediaFiles.value.splice(index, 1)
  }

  const openPhoto = (photo) => {
    selectedPhoto.value = photo
  }

  const closePhoto = () => {
    selectedPhoto.value = null
  }


  const submitPost = async () => {
    touched.value = true
    submitError.value = ''

    if (!authStore.isLoggedIn) {
      submitError.value = '请先登录后再发布内容'
      return false
    }

    if (!canSubmit.value) return false

    try {
      const payload = {
        user_id: authStore.user?.id,
        content: composeForm.content.trim(),
        tag: '随手记',
        location: composeForm.location,
        media_urls: mediaFiles.value.map((item) => item.url),
      }


      const post = await apiRequest('/api/feed', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const feedStore = useFeedStore()
      feedStore.addPost(post)

      composeForm.content = ''
      touched.value = false
      showSuccess.value = true
      mediaFiles.value = []

      setTimeout(() => {
        showSuccess.value = false
      }, 1800)

      return true
    } catch (error) {
      submitError.value = error.message || '发布失败'
      return false
    }
  }

  return {
    composeForm,
    touched,
    showSuccess,
    errors,
    canSubmit,
    submitPost,
    mediaFiles,
    uploading,
    uploadError,
    addMediaFile,
    removeMediaFile,
    submitError,
    selectedPhoto,
    openPhoto,
    closePhoto,
  }
})

