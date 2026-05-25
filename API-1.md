## 02）网格笔记卡片字段（GridNoteCard UI 改版，后端已跟进）

### 2.1 背景

`GridTextNoteCard` / `GridVideoNoteCard` 已改版，除封面与标题外还需**作者栏**与**页脚社交指标**。Feed / 个人空间读接口**已补齐**作者栏与互动字段。

| UI 区域 | 使用字段 |
|---------|----------|
| 封面 | `coverUrl` → 前端 `cover` |
| 标题 / 摘要（图文） | `title`、`summary` |
| 作者栏 | `authorNickName`、`authorOrganization`、`authorAvatar` |
| 视频时长角标 | `videoDuration`（仅 `noteType=VIDEO`） |
| 页脚 Eye | `views` |
| 页脚 Heart | `favorites`（收藏数） |
| 页脚 ThumbsUp | `likes` → 前端 `comments` |
| 页脚时间 | `publishTime` |

> **命名说明**：Feed 响应使用 `likes` / `favorites`；前端 `ProfileNoteItem.comments` 承接 **点赞数**（网格页脚 ThumbsUp），`favorites` 承接 **收藏数**（Heart）。行卡片元信息中的「评论」仍用 `comments` 字段，后端若区分评论与点赞请同时返回 `comments`（评论数）与 `likes`（点赞数）。

### 2.2 需跟进的 API

| # | 分类 | Method | Path | 后端 | 前端 mapper |
|---|------|--------|------|------|-------------|
| 1 | Feed | GET | `/feed/home` | 已补 `notes[]` 字段 | `mapFeedNoteToProfileNoteItem` 已接 |
| 2 | Feed | GET | `/feed/notes` | 已补 | 同上 |
| 3 | Feed | GET | `/feed/notes/shuffle` | 已补 `items[]`（NOTE） | 同上 |
| 4 | Feed | GET | `/feed/home/shuffle` | 已补 | 同上 |
| 5 | Feed | GET | `/feed/notes/{uid}/similar` | 已补 | 同上 |
| 6 | 个人空间 | GET | `/user-profile/home` | 已补 `notes[]` | `mapApiNotes` 已接 |
| 7 | 个人空间 | GET | `/user-profile/notes` | 已补 | 同上 |

### 2.3 字段契约（Feed 笔记 ContentVO）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `uid` | string | 是 | 笔记对外 uid（`TX` / `VD` + 11 位） |
| `noteType` | string | 是 | `IMAGE_TEXT` \| `VIDEO` |
| `title` | string | 是 | 标题 |
| `summary` | string | 是 | 摘要（图文卡片正文区） |
| `coverUrl` | string | 是 | 封面绝对 URL |
| `tags` | string[] | 是 | 标签（埋点 / 筛选） |
| `authorNickName` | string | 否 | 作者昵称（= `user_profile.nick_name`） |
| `authorOrganization` | string | 否 | 学校 / 组织（作者栏「姓名 · 组织」） |
| `authorAvatar` | string \| null | 否 | 作者头像 URL |
| `videoDuration` | string \| number \| null | 否 | 仅视频；推荐 `"MM:SS"` 或秒数 |
| `views` | number | 否 | 浏览量 |
| `likes` | number | 否 | 点赞数 → 前端 `comments`（页脚 ThumbsUp） |
| `favorites` | number | 否 | 收藏数 → 前端 `favorites`（页脚 Heart） |
| `comments` | number | 否 | 评论数（行卡片元信息；与点赞区分时返回） |
| `publishTime` | string | 是 | 发布时间 |

个人空间 `notes[]` 使用相同语义；封面字段名为 **`cover`**（非 `coverUrl`），其余作者 / 时长 / 互动字段与上表一致。

### 2.4 Response 示例

#### GET `/feed/home` → `data.notes[]`（图文）

```json
{
  "contentType": "NOTE",
  "noteType": "IMAGE_TEXT",
  "uid": "TX20212345678",
  "title": "Spring Boot 实战笔记",
  "summary": "实践经验总结",
  "coverUrl": "http://localhost:8081/uploads/covers/xxx.jpg",
  "tags": ["Spring Boot", "后端"],
  "authorNickName": "张明",
  "authorOrganization": "清华大学",
  "authorAvatar": "http://localhost:8081/uploads/avatars/user.jpg",
  "views": 128,
  "likes": 24,
  "favorites": 9,
  "comments": 6,
  "publishTime": "2026-05-10 14:20",
  "score": 2.415
}
```

#### GET `/feed/notes?noteType=VIDEO` → `data[]`（视频）

```json
{
  "contentType": "NOTE",
  "noteType": "VIDEO",
  "uid": "VD1T1w2K4x6O8",
  "title": "项目复盘视频",
  "summary": "5 分钟讲清交付流程",
  "coverUrl": "http://localhost:8081/uploads/covers/video.jpg",
  "tags": ["项目管理"],
  "authorNickName": "李同学",
  "authorOrganization": "北京大学",
  "authorAvatar": null,
  "videoDuration": "05:12",
  "views": 256,
  "likes": 18,
  "favorites": 12,
  "publishTime": "2026-05-12 09:00",
  "score": 2.103
}
```

#### GET `/user-profile/home` → `data.notes[]`

```json
{
  "uid": "TX20212345678",
  "title": "大模型 RAG 系统：从原理到项目落地",
  "summary": "本文梳理检索增强生成系统的关键链路…",
  "contentType": "图文",
  "tags": ["人工智能", "RAG"],
  "cover": "http://localhost:8081/uploads/covers/rag.jpg",
  "authorNickName": "王同学",
  "authorOrganization": "复旦大学",
  "authorAvatar": null,
  "views": 532,
  "comments": 36,
  "favorites": 28,
  "publishTime": "2024-05-18 19:36",
  "updateTime": "2024-05-19"
}
```

### 2.5 后端实现说明

1. 作者栏由 `NoteAuthorResolver` 组装：`authorNickName` ← `user_profile.nick_name`，`authorAvatar` ← `user_profile.avatar_url`，`authorOrganization` ← 活跃 `user_auth_link` → `entity_profile.name`（回退 `current_entity_name`）
2. Feed 与个人空间共用 `NoteCardAssembler`；个人空间封面字段名为 `cover`
3. `videoDuration`：视频笔记由库内秒数格式化为 `"MM:SS"`
4. `likes` / `favorites` / `comments` 分别对齐 `note.like_count` / `collect_count` / `comment_count`

### 2.6 前端跟进清单

- [x] `FeedContentVo` / `mapFeedNoteToProfileNoteItem` 映射作者与时长
- [x] `UserProfileNoteDto` / `mapApiNotes` 映射作者与时长
- [ ] 联调 GridNoteCard 展示（后端 §2.2 七处读接口已返回）

---
