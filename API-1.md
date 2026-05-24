# UniBridge 前端 API 后端同步（待跟进）

> **完整 API 契约**已合并至 [`API.md`](./API.md)（含第四部分 Feed 推荐与互动、双 ID、个人空间项目卡片）。  
> **本文档**仅维护当前迭代待前后端对齐的**增量项**，便于联调排期。

---

## 01）项目卡片 `coverUrl`（后端已跟进）

### 1.1 背景

`ProjectCard` 左侧视觉区需支持**项目封面图** `coverUrl`，与**发布主体 Logo** `logoSvgUrl` 区分展示；前端回退链：`coverUrl` → `logoSvgUrl` → 主体名前两字占位。

**数据来源（已落地）**

| 字段 | 用途 | 后端来源 |
|------|------|----------|
| `coverUrl` | 项目卡片封面 | 发布人当前活跃机构身份 → `entity_profile.logo_url` |
| `logoSvgUrl` | 主体 Logo | 同上（与 `coverUrl` **同源**） |
| `ownerOrganization` | 发布主体名称 | 同上 → `entity_profile.name`（无主体时回退 `user_profile.current_entity_name`） |

解析链路：`project.owner_id` → `user_auth_link`（`is_active=1`，按 `updated_at` 取最新）→ `entity_id` → `entity_profile`。

> **说明**：当前迭代**不新增** `project.cover_url` 字段；项目列表封面与主体 Logo 均取自发布人所属主体的 `logo_url`。若主体未配置 Logo，两字段均为 `null`，由前端走文字占位。

**当前状态**

| 侧 | 状态 |
|----|------|
| 后端 | §1.2 六处读接口**已返回** `coverUrl` / `logoSvgUrl` / `ownerOrganization`（Feed 与个人空间共用 `ProjectCardAssembler`） |
| 前端 | **待跟进**：`ProjectItem`、`FeedContentVo`、`mapFeedProjects`、`mapApiProjects`、`ProjectCard` 均未接入 |

> 笔记列表 `coverUrl` / `cover` 已对齐，**不在本节**。

---

### 1.2 需跟进的 API

> 路径均相对 `/api/v1/client`。

| # | 分类 | Method | Path | 响应字段路径 | 后端 | 前端 |
|---|------|--------|------|-------------|------|------|
| 1 | Feed | GET | `/feed/home` | `data.projects[].coverUrl` | 已返 | 待接 |
| 2 | Feed | GET | `/feed/projects` | `data[].coverUrl` | 已返 | 待接 |
| 3 | Feed | GET | `/feed/home/shuffle` | `data.items[]`（`contentType=PROJECT`）的 `coverUrl` | 已返 | 待接 |
| 4 | Feed | GET | `/feed/projects/shuffle` | `data.items[].coverUrl` | 已返 | 待接 |
| 5 | 个人空间 | GET | `/user-profile/home` | `data.projects[].coverUrl` | 已返 | 待接 |
| 6 | 个人空间 | GET | `/user-profile/projects` | `data.projects[].coverUrl` | 已返 | 待接 |

---

### 1.3 字段契约

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `coverUrl` | string \| null | 否 | 项目卡片封面；**= 发布人所属主体 `entity_profile.logo_url`**；`null` 时前端回退 `logoSvgUrl` / 文字占位 |
| `logoSvgUrl` | string \| null | 否 | 主体 Logo；与 `coverUrl` 同源（均为 `entity_profile.logo_url`） |
| `ownerOrganization` | string | 是 | 发布主体名称（`entity_profile.name`） |

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
  "coverUrl": "https://cdn.example.com/logo/szu.png",
  "tags": [{ "label": "AI开发" }, { "label": "Python" }],
  "ownerOrganization": "智源科技有限公司",
  "logoSvgUrl": "https://cdn.example.com/logo/szu.png",
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
      "coverUrl": "https://cdn.example.com/logo/szu.png",
      "tags": [{ "label": "AI开发" }],
      "ownerOrganization": "智源科技有限公司",
      "logoSvgUrl": "https://cdn.example.com/logo/szu.png",
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
  "coverUrl": "https://cdn.example.com/logo/thu.png",
  "tags": [{ "label": "Vue3" }, { "label": "ECharts" }, { "label": "可视化" }],
  "category": "COMMERCIAL",
  "recruitmentType": null,
  "ownerOrganization": "数智未来科技",
  "logoSvgUrl": "https://cdn.example.com/logo/thu.png",
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

### 1.6 后端实现说明

1. **不新增** `project.cover_url` 列；`coverUrl` 与 `logoSvgUrl` 均来自 `ProjectPublisherEntityResolver`（`owner_id` → 活跃 `user_auth_link` → `entity_profile.logo_url`）
2. Feed（`FeedRecommendationService`）与个人空间（`ClientProfileService`）共用 `ProjectCardAssembler` 组装卡片
3. 主体未配置 `logo_url` 时两字段为 `null`；前端按回退链展示
4. Feed 与个人空间顶层分类字段名不变：`projectCategory` vs `category`（见 `API.md` 第四部分 §08）

---

## 02）文档索引

| 文档 | 用途 |
|------|------|
| [`API.md`](./API.md) | 全量接口契约（认证、个人空间、发布详情、Feed 与互动） |
| [`API-request.md`](./API-request.md) | **本文档**：当前迭代待跟进项 |
