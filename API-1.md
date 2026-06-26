### 06.2）查询笔记详情

- **Method**：`GET`
- **Path**：`/notes/{noteId}`
- **Auth**：条件（见 §01.2）
- **说明**：供 `NoteArticleDetailView`（图文）及后续视频详情页渲染；按 `content_type_code` 前缀区分类型。

#### Path Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `noteId` | number | 是 | `note.id` |

#### Response Data（图文）

```json
{
  "noteId": 80001,
  "contentType": "图文",
  "contentTypeCode": "TXa1B2c3D4e5F",
  "title": "大三暑期实习投递复盘",
  "summary": "从简历、笔试到面试的完整时间线与踩坑总结。",
  "body": "# 背景\n\n## 时间线\n...",
  "tags": ["求职经验", "实习"],
  "coverUrl": "https://cdn.example.com/notes/cover/abc123.jpg",
  "author": {
    "name": "张同学",
    "handle": "zhang",
    "avatarUrl": "https://cdn.example.com/avatar/u10001.jpg"
  },
  "publishTime": "2026-05-22T11:30:00+08:00",
  "updateTime": "2026-05-22T11:30:00+08:00",
  "views": 128,
  "comments": 6,
  "favorites": 24,
  "status": "PUBLISHED",
  "parentContentTypeCode": "VDx9Y8z7W6v5U",
  "visibility": "PUBLIC"
}
```

#### Response Data（视频，增量字段）

```json
{
  "noteId": 80002,
  "contentType": "视频",
  "contentTypeCode": "VDx9Y8z7W6v5U",
  "title": "如何设计一个高质量用户系统",
  "summary": "结合权限模型与可观测方案的经验分享。",
  "body": null,
  "tags": ["系统设计"],
  "coverUrl": "https://cdn.example.com/notes/cover/frame.jpg",
  "videoUrl": "https://cdn.example.com/notes/video/xyz789.mp4",
  "videoDuration": 186,
  "author": { "name": "李同学", "handle": "li", "avatarUrl": null },
  "publishTime": "2026-05-20T09:00:00+08:00",
  "updateTime": "2026-05-20T09:00:00+08:00",
  "views": 520,
  "comments": 18,
  "favorites": 73,
  "status": "PUBLISHED",
  "parentContentTypeCode": null,
  "visibility": "PUBLIC"
}
```

| 字段 | 类型 | 说明 | 数据库来源 |
|------|------|------|------------|
| `noteId` | number | 笔记 ID | `note.id` |
| `contentType` | string | `图文` \| `视频` | 由 `note.content_type_code` 前缀：`TX*`→`图文`，`VD*`→`视频` |
| `contentTypeCode` | string | 类型编码 | `note.content_type_code` |
| `title` | string | 标题 | `note.title` |
| `summary` | string | 摘要 | `note.summary` |
| `body` | string \| null | Markdown 正文 | `note.content`；视频笔记为 `null` |
| `tags` | string[] | 话题标签 | `note.tags` JSON |
| `coverUrl` | string | 封面 | `note.cover_url` |
| `videoUrl` | string | 视频地址 | `note.video_url`；仅 `contentType=视频` |
| `videoDuration` | number | 时长（秒） | `note.video_duration`；仅视频 |
| `author.name` | string | 作者昵称 | `user_profile.nick_name`（空则回退「用户」） |
| `author.handle` | string | 作者 handle | `user_profile.nick_name` slug 或 `user_{id}` |
| `author.avatarUrl` | string \| null | 头像 | `user_profile.avatar_url` |
| `publishTime` | string | 展示用发布时间 | `COALESCE(note.published_at, note.created_at)` |
| `updateTime` | string | 最近更新 | `note.updated_at` |
| `views` | number | 浏览量 | `note.view_count` |
| `comments` | number | 评论数 | `note.comment_count` |
| `favorites` | number | 收藏数 | `note.collect_count` |
| `status` | string | `DRAFT` \| `PUBLISHED` | `note.status` |
| `parentContentTypeCode` | string \| null | 父笔记 contentTypeCode（`VD` + 11 位）；学习笔记关联其父视频，顶级笔记为 `null` | `t_user_note_detail.parent_content_type_code` |
| `visibility` | string | `PUBLIC` \| `PRIVATE` | 笔记可见范围 | `note.visibility` |

**前端映射（`NoteArticleDetailPayload`）**

| API 字段 | 前端字段 | 规则 |
|----------|----------|------|
| `body` | `body` | 图文直接映射 |
| `status` | `publishStatus` | `DRAFT`→`DRAFT`；`PUBLISHED`→`PUBLISHED` |
| `publishTime` / `updateTime` | 同名字段 | ISO 或前端格式化 |
| — | `PREVIEW` | 仅发布页本地预览 |

**可见性**

| `note.status` | `note.visibility` | 未登录 | 登录非 owner | owner |
|---------------|-------------------|--------|--------------|-------|
| `DRAFT` | — | 404 | 403 | ✅ |
| `REVIEWING` | — | 404 | 404 | ✅ |
| `PUBLISHED` | `PUBLIC` | ✅ | ✅ | ✅ |
| `PUBLISHED` | `PRIVATE` | 404 | 404 | ✅ |
| `BANNED` | — | 404 | 404 | 404 |

> 公开读 `PUBLISHED` 笔记时，满足下列条件才 `view_count +1`：**非发布者本人**；**同一访问者 30 分钟内不重复计次**（登录按 `userId`，未登录按 IP）。

#### 常见错误码

- `NOTE_NOT_FOUND`（含 BANNED 对外隐藏）
- `NOTE_NOT_OWNER`（草稿且非 owner）
- `UNAUTHORIZED`（草稿未登录）
- `ACCESS_TOKEN_EXPIRED`（JWT 过期，首次 → 401 提醒前端刷新 token；二次重试仍过期 → 404）

---

## 9) `ACCESS_TOKEN_EXPIRED` — 两次机会机制

> **变更来源**：`AccessService.resolveOptionalCurrentUserUid`  
> **变更类型**：JWT 过期不再静默返回 `null`（导致非 PUBLISHED 笔记误报 404），改为两次机会提示刷新

### 问题背景

`resolveOptionalCurrentUserUid` 原实现在 token 过期时静默返回 `null`，导致调用方将「过期匿名」当作「真匿名」处理。对于非 `PUBLISHED` 状态的笔记（`REVIEWING` / `DRAFT`），匿名访问直接返回 `404 NOTE_NOT_FOUND`，前端无法区分是「笔记不存在」还是「需要刷新 token」。

### 机制

| 次序 | 请求头 | JWT 状态 | 返回 |
|------|--------|----------|------|
| 第 1 次 | 无 `X-Token-Refresh-Failed` | 过期 | **401** `ACCESS_TOKEN_EXPIRED` — 提醒前端使用 `refresh_token` 刷新 `access_token` |
| 第 2 次 | `X-Token-Refresh-Failed: 1` | 过期 | `null`（等同匿名），最终由业务层返回 404 |
| 任何次 | — | 有效 | 正常解析 `userUid` |

### 前端接入

```
GET /api/v1/client/notes/{uid}  →  401 { code: 401, message: "ACCESS_TOKEN_EXPIRED" }
                                    ↓
POST /api/v1/client/auth/refresh  (refresh_token → 新 access_token)
                                    ↓
GET /api/v1/client/notes/{uid}
  Header: X-Token-Refresh-Failed: 1
  → 若仍 404 → 判定为笔记确实不存在（透明 404）
```

### 影响范围

| 层级 | 文件 | 变更 |
|------|------|------|
| Service | `AccessService.java` | 新增 `resolveOptionalCurrentUserUid(String, HttpServletRequest)` 重载；ExpiredJwtException 内检查 `X-Token-Refresh-Failed` 头，首次抛 401，带标记则返回 null；原无参方法保持兼容 |
| Service | `NoteService.java` | `getNoteDetail()` 调用新重载传 `request`，让 401 正常透传 |
| GlobalExceptionHandler | 已有 | `BusinessException(status=401)` 正确映射 HTTP 401 |

### 业务规则

- 只有 `resolveOptionalCurrentUserUid`（非强制鉴权场景）使用此机制
- `requireCurrentUserUid`（强制鉴权场景）始终返回 401，不需要两次机会（前端应直接刷新）
- `getNoteChildren` 等无 `HttpServletRequest` 上下文的可选鉴权 API 暂不受影响（token 过期 → null → 按匿名过滤，不报错）
