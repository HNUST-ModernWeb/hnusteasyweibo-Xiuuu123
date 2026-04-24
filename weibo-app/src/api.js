const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const loadAuthSnapshot = () => {
  try {
    return JSON.parse(localStorage.getItem('weibo-auth') || '{}')
  } catch (error) {
    return {}
  }
}

export const apiRequest = async (path, options = {}) => {
  const auth = loadAuthSnapshot()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (auth?.user?.id) {
    headers['x-user-id'] = String(auth.user.id)
  }
  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || '请求失败')
  }

  return response.json()
}

export { API_BASE_URL }

