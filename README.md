# 简易版微博作业

## 项目结构
- 前端：`weibo-app/`（Vue 3 + Vite）
- 后端：`weibo-server/`（Express）
- 数据库：CloudBase MySQL（6 张表，见下方）

## 本地启动
### 1) 前端
```bash
cd weibo-app
npm install
npm run dev
```

### 2) 后端
```bash
cd weibo-server
npm install
npm run dev
```

## 环境变量
前端需要 `.env`（不要提交真实密钥），请参考：
- `weibo-app/.env.example`

## 数据库说明（CloudBase MySQL）
已创建 6 张表：
- `users`
- `posts`
- `comments`
- `likes`
- `follows`
- `notifications`

每张表都包含 `_openid VARCHAR(64) DEFAULT '' NOT NULL` 字段。

## 线上部署（CloudBase）
- 前端地址：
  - https://ai-assistant-2026-3ekcer083f8d0b-1398377588.tcloudbaseapp.com/?v=202604231705
- 后端地址：
  - https://weibo-server-240681-5-1398377588.sh.run.tcloudbase.com

## 控制台入口
- MySQL 管理：
  - https://tcb.cloud.tencent.com/dev?envId=ai-assistant-2026-3ekcer083f8d0b#/db/mysql/table/default/
- 云托管服务：
  - https://tcb.cloud.tencent.com/dev?envId=ai-assistant-2026-3ekcer083f8d0b#/platform-run
- 静态网站托管：
  - https://tcb.cloud.tencent.com/dev?envId=ai-assistant-2026-3ekcer083f8d0b#/static-hosting

