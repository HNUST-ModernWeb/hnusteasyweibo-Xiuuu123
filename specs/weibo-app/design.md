# Technical Solution Design

## Overview
本方案在原有四阶段交付基础上扩展为“高级功能增强”阶段：在完成前后端整合后，加入**实时互动与通知、完整权限控制、性能优化与体验提升、特色功能（表情/话题）**。技术栈保持 **Vue 3 + Vite + Pinia + Vue Router**，后端为 **Node.js + REST API**，实时层采用 **轮询优先、SSE 预留**；数据库仍以关系型为主，新增通知、权限与话题相关表。

## Architecture
- **Frontend**: Vue 3 + Vite + Pinia + Vue Router
- **Backend**: Node.js (Express) + REST API + SSE（可选）
- **Database**: MySQL/PostgreSQL
- **Storage**: 对象存储（图片/视频）
- **Auth**: 手机号 + 微信 + QQ + 邮箱
- **Realtime**: 轮询 / SSE（长连接）

```
[Browser]
   │
   ▼
[Vue 3 SPA] ── HTTP/SSE ──> [API Backend]
   │                           │
   │                           ▼
   │                       [Database]
   │                           │
   ▼                           ▼
[Static Assets]           [Object Storage]
```

## Frontend Design
### Routing
- `/` 主页信息流
- `/compose` 发布页面
- `/profile/:id` 个人主页
- `/topic/:name` 话题页
- `/notifications` 通知中心
- 预留：`/login`、`/settings`

### State Management (Pinia)
- `authStore`: 登录状态、用户信息、token、角色
- `feedStore`: 信息流列表、分页、加载状态、评论列表、转发状态
- `profileStore`: 个人主页资料与发布列表、资料更新状态
- `composeStore`: 发布草稿与上传状态、表情面板、话题解析
- `notificationStore`: 通知列表、未读数、已读状态
- `permissionStore`: 权限策略与可执行动作列表

### Data Strategy
- **阶段一**：静态数据 + 轻交互
- **阶段二**：本地 mock 数据
- **阶段四**：真实 API + 轮询
- **扩展阶段**：SSE 推送通知（可选）

### Performance & UX
- 首屏优先渲染与骨架屏
- 分页加载 / 懒加载
- 错误提示与重试入口
- 点赞/关注/评论乐观更新

## Backend Design
### Core Modules
- Auth: 登录、注册、第三方授权
- Feed: 信息流列表、发布、详情、转发
- Profile: 用户信息、用户发布列表、资料更新
- Interaction: 点赞、评论、关注
- Media: 上传/存储/回传 URL
- Notifications: 通知生成、读取、已读
- Permissions: 角色、权限规则、审计日志
- Topics: 话题聚合、话题内容分页

### API (示例)
- `POST /api/auth/login`
- `POST /api/auth/wechat`
- `POST /api/auth/qq`
- `POST /api/auth/sms`
- `GET /api/feed`
- `POST /api/feed`
- `POST /api/posts/:id/repost`
- `GET /api/posts/:id/comments`
- `POST /api/comments`
- `POST /api/posts/:id/like`
- `POST /api/users/:id/follow`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `GET /api/users/:id/posts`
- `GET /api/notifications`
- `POST /api/notifications/read-all`
- `GET /api/topics/:name`

## Database Design (High-level)
- **users**: id, nickname, avatar, phone, email, wechat_openid, qq_openid, role, created_at
- **posts**: id, user_id, content, media_urls, topic_tags, repost_from_id, created_at, updated_at
- **comments**: id, post_id, user_id, content, created_at
- **likes**: id, post_id, user_id, created_at
- **follows**: id, follower_id, followee_id, created_at
- **notifications**: id, user_id, type, actor_id, post_id, content, is_read, created_at
- **roles**: id, name, permissions_json, created_at
- **audit_logs**: id, actor_id, action, target_type, target_id, created_at
- **topics**: id, name, description, created_at
- **post_topics**: id, post_id, topic_id

## Permission Model
- 角色：访客 / 登录用户 / 管理员
- 规则：
  - 访客只读
  - 登录用户可创建/评论/点赞/转发
  - 只有内容所有者可编辑/删除
  - 管理员可执行隐藏/删除并记录审计日志

## Security
- JWT + Refresh Token
- 访问频率限制
- 上传鉴权与大小限制
- 权限控制与审计

## Deployment
- 前端：静态托管（CDN）
- 后端：容器服务
- 数据库：托管数据库
- 存储：对象存储

## Risks & Mitigations
- **实时推送复杂**：先轮询，必要时启用 SSE
- **权限边界复杂**：分层角色 + 审计日志
- **话题膨胀**：话题表 + 关联表 + 分页加载
- **通知噪音**：支持已读与批量清理
