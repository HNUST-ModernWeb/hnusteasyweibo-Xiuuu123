import cloudbase from '@cloudbase/js-sdk'

export const cloudbaseEnvId = import.meta.env.VITE_CLOUDBASE_ENV_ID

if (!cloudbaseEnvId) {
  console.warn('[CloudBase] 缺少 VITE_CLOUDBASE_ENV_ID，请检查 .env 配置')
}

export const cloudbaseApp = cloudbaseEnvId
  ? cloudbase.init({
    env: cloudbaseEnvId,
  })
  : null

export const cloudbaseAuth = cloudbaseApp ? cloudbaseApp.auth() : null

export const initCloudbaseAuth = async () => {
  if (!cloudbaseEnvId || !cloudbaseAuth) return

  try {
    await cloudbaseAuth.signInAnonymously()
  } catch (error) {
    console.error('[CloudBase] 匿名登录失败', error)
  }
}


