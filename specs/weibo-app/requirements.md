# Requirements Document

## Introduction
本项目是一个分四个阶段交付的“微博”类社交产品 Web 应用。目标是先完成高保真静态原型与基础交互，再逐步组件化、接入模拟数据、设计后端与数据库，最终完成前后端整合与高级功能。

## Scope
- **In Scope**
  - Web 端应用（Vue），四个阶段交付
  - 主页信息流、发布、个人主页
  - 表单验证、基础交互、动态内容展示、简单特效
  - 前端路由、状态管理、模拟数据交互
  - 数据库表设计、认证系统、内容 CRUD、文件上传
  - 前后端整合、实时刷新、点赞、权限等高级功能
- **Out of Scope**
  - 原生 App、桌面客户端
  - 复杂算法推荐系统（若需另行规划）

## Assumptions
- 目标为 **Web 应用**，前端使用 **Vue 3**。
- 原型视觉 **参考微博**，整体 **大众化且简洁**。
- 初期以 **静态原型+模拟数据** 为主，后期再接入真实 API。

---

DESIGN SPECIFICATION
====================
1. Purpose Statement: 面向大众用户的信息流社交阅读体验，强调内容浏览、发布与个人主页的易读与易用，降低学习成本。
2. Aesthetic Direction: Industrial/utilitarian
3. Color Palette:
   - #1A1A1A (主文字)
   - #F5F5F3 (背景)
   - #D74B3F (强调)
   - #2F6F6D (辅助)
   - #B9B9B9 (边界)
4. Typography:
   - Display: "IBM Plex Sans"
   - Body: "Source Sans 3"
   - 中文："Noto Sans SC" / "Source Han Sans SC"
5. Layout Strategy: 以信息流为主轴，采用轻度非对称分区（左侧信息流 + 右侧轻量侧栏），保持节奏统一与留白克制。

---


## Requirements

### Requirement 1 - 阶段一：静态原型与基础交互
**User Story:** 作为用户，我希望能浏览信息流、发布内容与查看个人主页，并获得清晰的视觉层级与基础交互反馈。

#### Acceptance Criteria
1. While 访问主页, when 页面加载完成, the Web 微博系统 shall 展示信息流卡片、侧栏模块与推荐区。
2. While 进入发布页面, when 用户填写发布表单, the Web 微博系统 shall 实时校验必填项并提示错误。
3. While 进入个人主页, when 页面渲染完成, the Web 微博系统 shall 展示用户资料、发布列表与基础互动入口。
4. While 用户进行悬停/点击, when 触发交互, the Web 微博系统 shall 提供视觉反馈（高亮/过渡/轻量动效）。

### Requirement 2 - 阶段二：Vue 组件化与前端架构
**User Story:** 作为开发者，我希望页面可组件化、可路由化，并具备明确的数据状态与模拟交互。

#### Acceptance Criteria
1. While 构建 Vue 应用, when 路由初始化, the Web 微博系统 shall 提供主页/发布/个人主页的前端路由。
2. While 渲染页面, when 数据更新, the Web 微博系统 shall 通过状态管理驱动组件更新。
3. While 未接入后端, when 用户操作数据, the Web 微博系统 shall 使用模拟数据完成交互与展示。

### Requirement 3 - 阶段三：后端与数据库设计
**User Story:** 作为系统管理员，我希望系统支持用户认证、内容 CRUD 和文件上传，且数据结构清晰。

#### Acceptance Criteria
1. While 设计数据库, when 定义数据模型, the Web 微博系统 shall 提供用户、帖子、评论、点赞、关注等核心表结构。
2. While 用户访问系统, when 发起登录/注册, the Web 微博系统 shall 提供可用的认证流程。
3. While 用户发布内容, when 提交内容或媒体, the Web 微博系统 shall 支持内容 CRUD 与文件上传存储。

### Requirement 4 - 阶段四：前后端整合与高级功能
**User Story:** 作为用户，我希望能实时看到内容更新，并获得点赞与权限控制等功能。

#### Acceptance Criteria
1. While 前后端整合完成, when 数据发生变化, the Web 微博系统 shall 支持实时刷新或准实时更新。
2. While 用户浏览内容, when 点击点赞, the Web 微博系统 shall 更新点赞状态并同步到后端。
3. While 权限策略生效, when 用户执行受限操作, the Web 微博系统 shall 阻止操作并提示原因。

### Requirement 5 - 实时点赞与通知
**User Story:** 作为用户，我希望点赞与评论能实时生效，并在通知中查看互动。

#### Acceptance Criteria
1. While 用户对内容点赞, when 点赞请求成功, the Web 微博系统 shall 在当前视图即时更新点赞数与状态。
2. While 任意用户产生点赞/评论/转发/关注, when 事件写入系统, the Web 微博系统 shall 生成一条通知记录。
3. While 用户打开通知中心, when 通知列表加载完成, the Web 微博系统 shall 展示按时间倒序的通知与未读标记。
4. While 用户查看通知, when 点击“全部已读”, the Web 微博系统 shall 清空未读数量并标记通知已读。

### Requirement 6 - 完整权限控制系统
**User Story:** 作为系统管理员，我希望不同身份的用户拥有明确权限边界，避免误操作。

#### Acceptance Criteria
1. While 用户未登录, when 尝试发布/评论/点赞/转发, the Web 微博系统 shall 阻止操作并提示需要登录。
2. While 用户已登录, when 创建内容, the Web 微博系统 shall 记录内容所有者并只允许所有者编辑/删除。
3. While 用户访问他人内容, when 执行编辑/删除, the Web 微博系统 shall 拒绝请求并返回权限不足提示。
4. While 管理员账号执行管理动作, when 触发隐藏/删除, the Web 微博系统 shall 允许并记录审核操作。

### Requirement 7 - 性能优化与用户体验
**User Story:** 作为用户，我希望系统加载更快、操作更流畅，并在等待时得到清晰反馈。

#### Acceptance Criteria
1. While 用户进入首页, when 页面初始化, the Web 微博系统 shall 在 2.5 秒内展示首屏内容或骨架屏。
2. While 用户下拉加载或刷新, when 请求进行中, the Web 微博系统 shall 展示加载态且不阻塞已有内容浏览。
3. While 网络异常, when 请求失败, the Web 微博系统 shall 提供可见错误提示与重试入口。
4. While 数据量增长, when 加载更多内容, the Web 微博系统 shall 使用分页或懒加载保证性能。

### Requirement 8 - 特色功能（表情与话题）
**User Story:** 作为用户，我希望发布时可以使用表情并添加话题标签，方便表达与发现内容。

#### Acceptance Criteria
1. While 用户编辑发布内容, when 打开表情面板, the Web 微博系统 shall 提供可点击插入的表情列表。
2. While 用户输入话题, when 使用 #话题 格式, the Web 微博系统 shall 自动识别并高亮话题标签。
3. While 用户点击话题标签, when 进入话题页, the Web 微博系统 shall 展示该话题下的相关内容。

---

## Open Questions
- 通知范围是否包含系统公告/@提及？
- 权限角色是否仅需访客/登录用户/管理员，还是需要更细分（例如运营/审核）？
- 话题页是否需要支持热度排行与置顶？





