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

## 02）文档索引

| 文档 | 用途 |
|------|------|
| [`API.md`](./API.md) | 全量接口契约（认证、个人空间、发布详情、Feed 与互动） |
| [`API-request.md`](./API-request.md) | **本文档**：当前迭代待跟进项 |
