import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const users = [
  {
    id: 1,
    nickname: '小鱼',
    handle: '@xiaoyu',
    avatar_url: '',
    cover_url: '',
    bio: '热爱记录生活的产品设计生',
    phone: '13800000000',

    email: 'xiaoyu@example.com',
    wechat_openid: null,
    qq_openid: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const posts = [
  {
    id: 1,
    user_id: 1,
    author: '小鱼',
    handle: '@xiaoyu',
    content: '把产品作业的交互稿整理了一版，准备明天评审～',
    tag: '作业进度',
    media_urls: [],
    likes_count: 18,
    comments_count: 6,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    author: '小鱼',
    handle: '@xiaoyu',
    content: '开始学习 VUE3 组件化，准备这周做一个轻量微博原型。',
    tag: '学习记录',
    media_urls: [],
    likes_count: 9,
    comments_count: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
]

const comments = []
const likes = new Set()
const follows = new Set()
const notifications = []

const nextId = (list) => (list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1)

const requireUser = (req, res, next) => {
  const userId = Number(req.header('x-user-id'))
  if (!userId) {
    return res.status(401).json({ message: '未登录或缺少用户信息' })
  }
  req.userId = userId
  next()
}

const getUserStats = (userId) => {
  const following = [...follows].filter((key) => key.startsWith(`${userId}:`)).length
  const followers = [...follows].filter((key) => key.endsWith(`:${userId}`)).length
  const postsCount = posts.filter((p) => p.user_id === userId).length
  return {
    following,
    followers,
    posts: postsCount,
  }
}

const createNotification = ({ userId, actorId, type, postId, content, title }) => {
  if (!userId || userId === actorId) return null
  const notification = {
    id: nextId(notifications),
    user_id: userId,
    actor_id: actorId,
    type,
    post_id: postId || null,
    title,
    content,
    is_read: false,
    created_at: new Date().toLocaleString(),
  }
  notifications.unshift(notification)
  return notification
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/login', (req, res) => {
  const { phone, email, nickname } = req.body || {}
  if (!phone && !email) {
    return res.status(400).json({ message: 'phone 或 email 必填' })
  }

  let user = users.find((u) => u.phone === phone || u.email === email)
  if (!user) {
    user = {
      id: nextId(users),
      nickname: nickname || '新用户',
      handle: `@user${Date.now()}`,
      avatar_url: '',
      cover_url: '',
      bio: '',
      phone: phone || null,

      email: email || null,
      wechat_openid: null,
      qq_openid: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    users.push(user)
  }

  res.json({
    token: `mock-token-${user.id}`,
    user,
  })
})

app.post('/api/auth/sms', (req, res) => {
  const { phone } = req.body || {}
  if (!phone) return res.status(400).json({ message: 'phone 必填' })
  res.json({ verificationId: `sms-${Date.now()}` })
})

app.post('/api/auth/wechat', (req, res) => {
  const { openid, nickname } = req.body || {}
  if (!openid) return res.status(400).json({ message: 'openid 必填' })

  let user = users.find((u) => u.wechat_openid === openid)
  if (!user) {
    user = {
      id: nextId(users),
      nickname: nickname || '微信用户',
      handle: `@wx${Date.now()}`,
      avatar_url: '',
      bio: '',
      phone: null,
      email: null,
      wechat_openid: openid,
      qq_openid: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    users.push(user)
  }

  res.json({ token: `mock-token-${user.id}`, user })
})

app.post('/api/auth/qq', (req, res) => {
  const { openid, nickname } = req.body || {}
  if (!openid) return res.status(400).json({ message: 'openid 必填' })

  let user = users.find((u) => u.qq_openid === openid)
  if (!user) {
    user = {
      id: nextId(users),
      nickname: nickname || 'QQ用户',
      handle: `@qq${Date.now()}`,
      avatar_url: '',
      bio: '',
      phone: null,
      email: null,
      wechat_openid: null,
      qq_openid: openid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    users.push(user)
  }

  res.json({ token: `mock-token-${user.id}`, user })
})

app.get('/api/feed', (req, res) => {
  const page = Number(req.query.page || 1)
  const pageSize = Number(req.query.pageSize || 10)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const items = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  res.json({
    page,
    pageSize,
    total: items.length,
    items: items.slice(start, end),
  })
})

app.post('/api/feed', requireUser, (req, res) => {
  const { content, tag = '随手记', location = '', media_urls = [] } = req.body || {}
  if (!content) {
    return res.status(400).json({ message: 'content 必填' })
  }

  const user = users.find((u) => u.id === Number(req.userId))
  if (!user) return res.status(404).json({ message: '用户不存在' })

  const post = {
    id: nextId(posts),
    user_id: user.id,
    author: user.nickname,
    handle: user.handle,
    content,
    tag,
    location,
    media_urls,
    likes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
  }
  posts.unshift(post)
  res.json(post)
})

app.get('/api/posts/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id))
  if (!post) return res.status(404).json({ message: '帖子不存在' })
  res.json(post)
})

app.patch('/api/posts/:id', requireUser, (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id))
  if (!post) return res.status(404).json({ message: '帖子不存在' })
  if (post.user_id !== req.userId) {
    return res.status(403).json({ message: '无权限修改该帖子' })
  }

  const { content, tag } = req.body || {}
  if (content) {
    post.content = content
  }
  if (tag) {
    post.tag = tag
  }
  post.updated_at = new Date().toISOString()

  res.json(post)
})

app.delete('/api/posts/:id', requireUser, (req, res) => {
  const index = posts.findIndex((p) => p.id === Number(req.params.id))
  if (index === -1) return res.status(404).json({ message: '帖子不存在' })

  const post = posts[index]
  if (post.user_id !== req.userId) {
    return res.status(403).json({ message: '无权限删除该帖子' })
  }

  posts.splice(index, 1)

  for (let i = comments.length - 1; i >= 0; i -= 1) {
    if (comments[i].post_id === post.id) {
      comments.splice(i, 1)
    }
  }

  for (const key of [...likes]) {
    if (key.endsWith(`:${post.id}`)) {
      likes.delete(key)
    }
  }

  res.json({ success: true })
})

app.post('/api/posts/:id/like', requireUser, (req, res) => {

  const post = posts.find((p) => p.id === Number(req.params.id))
  if (!post) return res.status(404).json({ message: '帖子不存在' })

  const key = `${req.userId}:${post.id}`
  let liked = false
  if (likes.has(key)) {
    likes.delete(key)
    post.likes_count = Math.max(0, post.likes_count - 1)
  } else {
    likes.add(key)
    post.likes_count += 1
    liked = true
  }

  if (liked) {
    createNotification({
      userId: post.user_id,
      actorId: req.userId,
      type: 'like',
      postId: post.id,
      title: '收到新的点赞',
      content: `你的动态被点赞：${post.content.slice(0, 40)}`,
    })
  }

  res.json({ id: post.id, likes_count: post.likes_count })
})

app.post('/api/posts/:id/repost', requireUser, (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id))
  if (!post) return res.status(404).json({ message: '帖子不存在' })

  const user = users.find((u) => u.id === Number(req.userId))
  if (!user) return res.status(404).json({ message: '用户不存在' })

  const { comment = '' } = req.body || {}
  const prefix = comment ? `${comment} // ` : ''

  const repost = {
    id: nextId(posts),
    user_id: user.id,
    author: user.nickname,
    handle: user.handle,
    content: `${prefix}转发 ${post.author} ${post.handle}：${post.content}`,
    tag: '转发',
    location: '',
    media_urls: post.media_urls || [],
    likes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
    repost_from_id: post.id,
    repost_from: {
      author: post.author,
      handle: post.handle,
      content: post.content,
    },
  }

  posts.unshift(repost)

  createNotification({
    userId: post.user_id,
    actorId: req.userId,
    type: 'repost',
    postId: post.id,
    title: '你的动态被转发',
    content: `有人转发了你的动态：${post.content.slice(0, 40)}`,
  })

  res.json(repost)
})

app.get('/api/posts/:id/comments', (req, res) => {
  const postId = Number(req.params.id)
  const items = comments.filter((c) => c.post_id === postId)
  res.json({ items })
})

app.post('/api/comments', requireUser, (req, res) => {
  const { post_id, content } = req.body || {}
  if (!post_id || !content) {
    return res.status(400).json({ message: 'post_id, content 必填' })
  }

  const post = posts.find((p) => p.id === Number(post_id))
  if (!post) return res.status(404).json({ message: '帖子不存在' })

  const user = users.find((u) => u.id === Number(req.userId))
  if (!user) return res.status(404).json({ message: '用户不存在' })

  const comment = {
    id: nextId(comments),
    post_id: post.id,
    user_id: Number(req.userId),
    author: user.nickname,
    handle: user.handle,
    content,
    created_at: new Date().toISOString(),
  }
  comments.push(comment)
  post.comments_count += 1

  createNotification({
    userId: post.user_id,
    actorId: req.userId,
    type: 'comment',
    postId: post.id,
    title: '收到新的评论',
    content: `${user.nickname} 评论了你：${content.slice(0, 40)}`,
  })

  res.json(comment)
})

app.get('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id))
  if (!user) return res.status(404).json({ message: '用户不存在' })
  res.json({
    ...user,
    stats: getUserStats(user.id),
  })
})

app.patch('/api/users/:id', requireUser, (req, res) => {
  const userId = Number(req.params.id)
  if (userId !== req.userId) {
    return res.status(403).json({ message: '无权限修改该用户' })
  }

  const user = users.find((u) => u.id === userId)
  if (!user) return res.status(404).json({ message: '用户不存在' })

  const { nickname, handle, bio, avatar_url, cover_url } = req.body || {}
  if (nickname) user.nickname = nickname
  if (handle) user.handle = handle
  if (bio !== undefined) user.bio = bio
  if (avatar_url !== undefined) user.avatar_url = avatar_url
  if (cover_url !== undefined) user.cover_url = cover_url
  user.updated_at = new Date().toISOString()


  res.json(user)
})

app.post('/api/users/:id/follow', requireUser, (req, res) => {
  const targetId = Number(req.params.id)
  if (targetId === req.userId) {
    return res.status(400).json({ message: '不能关注自己' })
  }

  const targetUser = users.find((u) => u.id === Number(targetId))
  if (!targetUser) return res.status(404).json({ message: '用户不存在' })

  const key = `${req.userId}:${targetId}`
  let followed = false
  if (follows.has(key)) {
    follows.delete(key)
  } else {
    follows.add(key)
    followed = true
  }

  if (followed) {
    createNotification({
      userId: targetId,
      actorId: req.userId,
      type: 'follow',
      postId: null,
      title: '新增关注提醒',
      content: `${targetUser.nickname}，你新增了一个粉丝`,
    })
  }

  res.json({
    followed,
    followers: getUserStats(targetId).followers,
    following: getUserStats(req.userId).following,
  })
})

app.get('/api/notifications', requireUser, (req, res) => {
  const items = notifications.filter((n) => n.user_id === req.userId)
  res.json({ items })
})

app.post('/api/notifications/read-all', requireUser, (req, res) => {
  notifications.forEach((item) => {
    if (item.user_id === req.userId) {
      item.is_read = true
    }
  })
  res.json({ success: true })
})

app.get('/api/users/:id/posts', (req, res) => {
  const userId = Number(req.params.id)
  const items = posts.filter((p) => p.user_id === userId)
  res.json({ items })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Weibo API listening on ${PORT}`)
})
