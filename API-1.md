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
    "uid": "US",
    "name": "张同学",
    "organization": "XX 大学计算机学院",
    "avatarUrl": "https://cdn.example.com/avatar/u10001.jpg"
  },
  "publishTime": "2026-05-22T11:30:00+08:00",
  "updateTime": "2026-05-22T11:30:00+08:00",
  "views": 128,
  "comments": 6,
  "favorites": 24,
  "status": "PUBLISHED",
  "visibility": "PUBLIC",
  "parentNote": {
    "uid": "VDx9Y8z7W6v5U",
    "title": "如何设计一个高质量用户系统",
    "summary": "结合权限模型与可观测方案的经验分享。",
    "contentType": "视频",
    "tags": ["系统设计"],
    "cover": "https://cdn.example.com/notes/cover/frame.jpg",
    "views": 520,
    "comments": 18,
    "favorites": 73
  }
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
  "author": { "name": "李同学", "organization": "YY 大学软件学院", "avatarUrl": null },
  "publishTime": "2026-05-20T09:00:00+08:00",
  "updateTime": "2026-05-20T09:00:00+08:00",
  "views": 520,
  "comments": 18,
  "favorites": 73,
  "status": "PUBLISHED",
  "visibility": "PUBLIC",
  "parentNote": null
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
| `author.organization` | string | 作者所属机构 | `user_profile.organization_name` |
| `author.avatarUrl` | string \| null | 头像 | `user_profile.avatar_url` |
| `publishTime` | string | 展示用发布时间 | `COALESCE(note.published_at, note.created_at)` |
| `updateTime` | string | 最近更新 | `note.updated_at` |
| `views` | number | 浏览量 | `note.view_count` |
| `comments` | number | 评论数 | `note.comment_count` |
| `favorites` | number | 收藏数 | `note.collect_count` |
| `status` | string | `DRAFT` \| `PUBLISHED` | `note.status` |
| `visibility` | string | `PUBLIC` \| `PRIVATE` | 笔记可见范围 | `note.visibility` |
| `parentNote` | object \| null | 父笔记简要信息；通过 `t_user_note_detail.parent_content_type_code` 关联，父笔记存在时返回；顶级笔记为 `null` | JOIN `note` / `user_profile` |

#### ParentNoteDto

| 字段 | 类型 | 说明 | 数据库来源 |
|------|------|------|------------|
| `uid` | string | 父笔记 UID | `parent_note.uid` / `content_type_code` |
| `title` | string | 父笔记标题 | `parent_note.title` |
| `summary` | string | 父笔记摘要 | `parent_note.summary` |
| `contentType` | `图文` \| `视频` | 由 `parent_note.content_type_code` 前缀推导 | — |
| `tags` | string[] | 话题标签 | `parent_note.tags` JSON |
| `cover` | string | 封面 URL | `parent_note.cover_url` |
| `views` | number | 浏览量 | `parent_note.view_count` |
| `comments` | number | 评论数 | `parent_note.comment_count` |
| `favorites` | number | 收藏数 | `parent_note.collect_count` |

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

---
