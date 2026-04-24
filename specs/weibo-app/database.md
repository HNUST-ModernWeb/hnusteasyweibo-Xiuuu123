# 数据库表结构与认证方案

## 设计说明
- 数据库采用关系型（MySQL/PostgreSQL 均可）
- 用户身份支持 **手机号 / 邮箱 / 微信 / QQ**，统一映射到 `users` 主表
- 业务数据围绕 **帖子、评论、点赞、关注、媒体** 进行建模
- 软删除字段统一使用 `deleted_at`

## 表结构（建议）

### 1) users
- `id` (PK, bigint)
- `nickname` (varchar)
- `avatar_url` (varchar)
- `bio` (varchar)
- `phone` (varchar, unique, nullable)
- `email` (varchar, unique, nullable)
- `wechat_openid` (varchar, unique, nullable)
- `qq_openid` (varchar, unique, nullable)
- `status` (tinyint, default 1)
- `created_at` (datetime)
- `updated_at` (datetime)
- `deleted_at` (datetime, nullable)

### 2) posts
- `id` (PK, bigint)
- `user_id` (FK -> users.id)
- `content` (text)
- `media_urls` (json/array)
- `visibility` (enum: public/friends/private)
- `location` (varchar)
- `likes_count` (int, default 0)
- `comments_count` (int, default 0)
- `created_at` (datetime)
- `updated_at` (datetime)
- `deleted_at` (datetime, nullable)

### 3) comments
- `id` (PK, bigint)
- `post_id` (FK -> posts.id)
- `user_id` (FK -> users.id)
- `content` (text)
- `created_at` (datetime)
- `deleted_at` (datetime, nullable)

### 4) likes
- `id` (PK, bigint)
- `post_id` (FK -> posts.id)
- `user_id` (FK -> users.id)
- `created_at` (datetime)
- Unique Index: (`post_id`, `user_id`)

### 5) follows
- `id` (PK, bigint)
- `follower_id` (FK -> users.id)
- `followee_id` (FK -> users.id)
- `created_at` (datetime)
- Unique Index: (`follower_id`, `followee_id`)

### 6) media
- `id` (PK, bigint)
- `user_id` (FK -> users.id)
- `url` (varchar)
- `type` (enum: image/video)
- `size` (int)
- `created_at` (datetime)
- `deleted_at` (datetime, nullable)

## 认证方案

### 身份模型
- `users` 表作为统一主账号
- 三方登录（微信/QQ）在后端换取 openid 并写入 `users` 对应字段
- 手机号/邮箱登录通过验证码或密码流程绑定 `users`

### Token 策略
- Access Token + Refresh Token
- 重要接口需校验 `user_id` 与资源归属

## 数据一致性
- 点赞/评论数量采用冗余字段（`likes_count`、`comments_count`）
- 写操作通过事务保证一致性

## 后续落地
- 第三阶段实现：创建表、索引、外键约束
- 第四阶段实现：接入认证服务与 API
