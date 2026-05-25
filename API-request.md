# UniBridge 前端 API 后端同步（待跟进）

> **完整 API 契约**已合并至 [`API.md`](./API.md)（含第四部分 Feed 推荐与互动、双 ID、个人空间项目卡片）。  
> **本文档**仅维护当前迭代待前后端对齐的**增量项**，便于联调排期。

---

## 01）项目卡片 `coverUrl`（待跟进）

### 1.1 背景

`ProjectCard` 左侧视觉区需支持**项目封面图** `coverUrl`，与**发布主体 Logo** `logoSvgUrl` 区分：

| 字段 | 用途 | 来源建议 |
|------|------|----------|
| `coverUrl` | 项目卡片封面（JPG/PNG/WebP） | `project.cover_url` |
| `logoSvgUrl` | 主体 Logo（SVG） | `entity_profile.logo_url` |

**回退链**（前端实现目标）：`coverUrl` → `logoSvgUrl` → 主体名前两字占位。

**当前状态**

| 侧 | 状态 |
|----|------|
| 后端 | 列表读接口**待返回** `coverUrl`（`project` 表需有 `cover_url` 或等价字段） |
| 前端 | **未跟进**：`ProjectItem`、`FeedContentVo`、`mapFeedProjects`、`mapApiProjects`、`ProjectCard` 均未接入 |

> 笔记列表 `coverUrl` / `cover` 已对齐，**不在本节**。

---

### 1.2 需跟进的 API

> 路径均相对 `/api/v1/client`。

| # | 分类 | Method | Path | 响应字段路径 | 后端 | 前端 |
|---|------|--------|------|-------------|------|------|
| 1 | Feed | GET | `/feed/home` | `data.projects[].coverUrl` | 待返 | 待接 |
| 2 | Feed | GET | `/feed/projects` | `data[].coverUrl` | 待返 | 待接 |
| 3 | Feed | GET | `/feed/home/shuffle` | `data.items[]`（`contentType=PROJECT`）的 `coverUrl` | 待返 | 待接 |
| 4 | Feed | GET | `/feed/projects/shuffle` | `data.items[].coverUrl` | 待返 | 待接 |
| 5 | 个人空间 | GET | `/user-profile/home` | `data.projects[].coverUrl` | 待返 | 待接 |
| 6 | 个人空间 | GET | `/user-profile/projects` | `data.projects[].coverUrl` | 待返 | 待接 |

---

### 1.3 字段契约

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `coverUrl` | string \| null | 否 | 项目封面绝对 URL；`null` 时前端回退 `logoSvgUrl` / 文字占位 |

- Feed 项目 `ContentVO` 与个人空间 `projects[]` **字段名统一为 `coverUrl`**
- 前端映射目标：`ProjectItem.coverUrl`（待新增）
- Feed 与个人空间分类字段差异不变：Feed 用 `projectCategory`，个人空间用 `category`（见 `API.md` 第四部分 §08）

---

### 1.4 Response 示例

#### GET `/feed/home` → `data.projects[]`

```json
{
  "contentType": "PROJECT",
  "projectCategory": "COMMERCIAL",
  "recruitmentType": null,
  "uid": "PR20212345678",
  "title": "基于大模型的智能问答系统开发",
  "preview": "构建企业级智能问答平台，支持多知识库接入与权限管理，提升内部知识检索效率。",
  "coverUrl": "http://localhost:8081/uploads/project-covers/qa-system.jpg",
  "tags": [{ "label": "AI开发" }, { "label": "Python" }],
  "ownerOrganization": "智源科技有限公司",
  "logoSvgUrl": null,
  "level": "R",
  "teamSize": "3-5人",
  "duration": "3个月",
  "publishTime": "2026-04-01 10:00",
  "views": 0,
  "likes": 0,
  "score": 1.872
}
```

#### GET `/feed/projects?category=COMMERCIAL` → `data[]`

单条结构与上表一致；`projectCategory` 与 Query `category` 一致。

#### GET `/feed/projects/shuffle?category=COMMERCIAL&page=2` → `data.items[]`

```json
{
  "items": [
    {
      "contentType": "PROJECT",
      "projectCategory": "COMMERCIAL",
      "uid": "PR20212345678",
      "title": "基于大模型的智能问答系统开发",
      "preview": "构建企业级智能问答平台…",
      "coverUrl": "http://localhost:8081/uploads/project-covers/qa-system.jpg",
      "tags": [{ "label": "AI开发" }],
      "ownerOrganization": "智源科技有限公司",
      "logoSvgUrl": null,
      "level": "R",
      "teamSize": "3-5人",
      "duration": "3个月",
      "publishTime": "2026-04-01 10:00"
    }
  ],
  "page": 2,
  "size": 10,
  "total": 48,
  "pageWrapped": false,
  "shuffleMode": "CACHE_PAGE"
}
```

#### GET `/user-profile/home` → `data.projects[]`

```json
{
  "uid": "PRnews1234567",
  "title": "数据可视化大屏设计与开发",
  "preview": "基于 Vue3 + ECharts 构建企业级可视化大屏，实现业务指标动态展示与交互分析。",
  "coverUrl": "http://localhost:8081/uploads/project-covers/viz-dashboard.jpg",
  "tags": [{ "label": "Vue3" }, { "label": "ECharts" }, { "label": "可视化" }],
  "category": "COMMERCIAL",
  "recruitmentType": null,
  "ownerOrganization": "数智未来科技",
  "logoSvgUrl": null,
  "publishTime": "2024-12-18",
  "level": "SR",
  "teamSize": "2-4人",
  "duration": "1个月"
}
```

#### GET `/user-profile/projects` → `data.projects[]`

单条结构与上表一致；分页字段 `total` / `page` / `pageSize` 不变（见 `API.md` 第二部分 §04）。

**`coverUrl` 为 null 的示例**

```json
{
  "uid": "PR00000090002",
  "title": "企业官网重构设计",
  "preview": "完成品牌官网重构与视觉升级…",
  "coverUrl": null,
  "tags": [{ "label": "Web设计" }],
  "category": "RECRUITMENT",
  "recruitmentType": "TEAM_RECRUIT",
  "ownerOrganization": "创新互联",
  "logoSvgUrl": "http://localhost:8081/uploads/logos/org.svg",
  "publishTime": "2024-11-29",
  "level": "R",
  "teamSize": "3-5人",
  "duration": "2个月"
}
```

---

### 1.5 前端跟进清单

- [ ] `ProjectItem` 增加 `coverUrl?: string | null`
- [ ] `FeedContentVo` 项目元素增加 `coverUrl`
- [ ] `mapFeedProjectToProjectItem`、`mapApiProjects` 映射 `coverUrl`
- [ ] `ProjectCard` 左侧优先展示 `coverUrl`，回退 `logoSvgUrl` → 文字占位
- [ ] 联调 §1.2 六处读接口

---

### 1.6 后端实现建议

1. `project` 表增加 `cover_url VARCHAR(255) NULL`（或发布页上传后写入等价存储）
2. 列表 Assembler（Feed + 个人空间）与 `preview` 同级返回 `coverUrl`
3. 已发布项目建议尽量非空；草稿 / 历史数据允许 `null`
4. 与 Feed 项目 `ContentVO` 共用组装逻辑，仅顶层分类字段名不同（`projectCategory` vs `category`）

---

## 02）网格笔记卡片字段（GridNoteCard UI 改版，待后端同步）

### 2.1 背景

`GridTextNoteCard` / `GridVideoNoteCard` 已改版，除封面与标题外还需**作者栏**与**页脚社交指标**。前端类型 `ProfileNoteItem`（`GridNoteCard` / `RowNoteCard` 共用）已预留字段，**Feed / 个人空间读接口待补齐**。

> **隐私约定**：笔记为公共区域内容，作者展示名统一使用 **`authorNickname`（昵称）**，**禁止**返回实名 `name` / `realName` / `authorName`。详情页作者信息策略见 `API.md` 第三部分。

| UI 区域 | 使用字段 |
|---------|----------|
| 封面 | `coverUrl` → 前端 `cover` |
| 标题 / 摘要（图文） | `title`、`summary` |
| 作者栏 | `authorNickname`、`authorOrganization`、`authorAvatar` |
| 视频时长角标 | `videoDuration`（仅 `noteType=VIDEO`） |
| 页脚 Eye | `views` |
| 页脚 Heart | `favorites`（收藏数） |
| 页脚 ThumbsUp | `likes` → 前端 `comments` |
| 页脚时间 | `publishTime` |

> **命名说明**：Feed 响应使用 `likes` / `favorites`；前端 `ProfileNoteItem.comments` 承接 **点赞数**（网格页脚 ThumbsUp），`favorites` 承接 **收藏数**（Heart）。行卡片元信息中的「评论」仍用 `comments` 字段，后端若区分评论与点赞请同时返回 `comments`（评论数）与 `likes`（点赞数）。

### 2.2 需跟进的 API

| # | 分类 | Method | Path | 后端 | 前端 mapper |
|---|------|--------|------|------|-------------|
| 1 | Feed | GET | `/feed/home` | 待补 `notes[]` 字段 | `mapFeedNoteToProfileNoteItem` 已接 |
| 2 | Feed | GET | `/feed/notes` | 待补 | 同上 |
| 3 | Feed | GET | `/feed/notes/shuffle` | 待补 `items[]`（NOTE） | 同上 |
| 4 | Feed | GET | `/feed/home/shuffle` | 待补 | 同上 |
| 5 | Feed | GET | `/feed/notes/{uid}/similar` | 待补 | 同上 |
| 6 | 个人空间 | GET | `/user-profile/home` | 待补 `notes[]` | `mapApiNotes` 已接 |
| 7 | 个人空间 | GET | `/user-profile/notes` | 待补 | 同上 |

### 2.3 字段契约（Feed 笔记 ContentVO）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `uid` | string | 是 | 笔记对外 uid（`TX` / `VD` + 11 位） |
| `noteType` | string | 是 | `IMAGE_TEXT` \| `VIDEO` |
| `title` | string | 是 | 标题 |
| `summary` | string | 是 | 摘要（图文卡片正文区） |
| `coverUrl` | string | 是 | 封面绝对 URL |
| `tags` | string[] | 是 | 标签（埋点 / 筛选） |
| `authorNickname` | string | 否 | 作者**昵称**（禁止返回实名 `name`） |
| `authorOrganization` | string | 否 | 学校 / 组织（作者栏「昵称 · 组织」） |
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
  "authorNickname": "代码小能手",
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
  "authorNickname": "复盘君",
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
  "authorNickname": "RAG探索者",
  "authorOrganization": "复旦大学",
  "authorAvatar": null,
  "views": 532,
  "comments": 36,
  "favorites": 28,
  "publishTime": "2024-05-18 19:36",
  "updateTime": "2024-05-19"
}
```

### 2.5 后端实现建议

1. 作者信息 JOIN `user`；列表 Assembler **仅输出 `authorNickname`**，勿暴露 `user.name` / 实名。
2. `videoDuration`：数据库存秒数时，Assembler 可格式化为 `"MM:SS"` 再返回。
3. `likes` / `favorites` 与 `note.like_count` / `note.collect_count` 对齐；Feed 排序热度公式仍用 `likes`。
4. Feed 与个人空间笔记列表建议共用「笔记卡片」Assembler，仅封面字段名不同（`coverUrl` vs `cover`）。

### 2.6 前端跟进清单

- [x] `FeedContentVo` / `mapFeedNoteToProfileNoteItem` 映射作者与时长
- [x] `UserProfileNoteDto` / `mapApiNotes` 映射作者与时长
- [ ] 后端按 §2.3 返回字段并联调 GridNoteCard 展示

---

## 03）文档索引

| 文档 | 用途 |
|------|------|
| [`API.md`](./API.md) | 全量接口契约（认证、个人空间、发布详情、Feed 与互动） |
| [`API-request.md`](./API-request.md) | **本文档**：当前迭代待跟进项（§01 项目 `coverUrl`、§02 网格笔记卡片） |
