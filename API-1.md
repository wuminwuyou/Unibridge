## 4) 项目卡片数据模型增量 — 多端点 `projects` 响应新增字段

> **消费方**：`ProjectCard`（所有渲染场景：首页 Feed、个人/团队/机构空间项目列表）  
> **变更类型**：以下端点返回的 `projects` 数组中每个项目对象新增三个可选字段，供 ProjectCard 展示发布人名称与预算区间。

### 涉及的端点

| 端点 | 消费方 | 前端使用场景 |
|------|--------|-------------|
| `GET /feed/home` | `useHomeFeedWidget` / `HomeFeed` | 首页推荐卡片 |
| `GET /feed/projects` | `ProjectFeed` | 项目 Feed 列表 |
| `GET /user-profile/home` | `useUserProfileTabData` / `PersonalHomeTabContent` | 个人空间主页预览 |
| `GET /user-profile/projects` | `useUserProfileTabData` / `PersonalProjectsContent` | 个人空间「项目」Tab |
| `GET /team-profile/home` | `useTeamProfileTabData` / `TeamHomeTabContent` | 团队空间主页预览 |
| `GET /team-profile/projects` | `useTeamProfileTabData` / `TeamProjectsContent` | 团队空间「项目」Tab |
| `GET /entity-profile/home` | `useEntityProfileTabData` / `OrganizationHomeTabContent` | 机构空间主页预览 |
| `GET /entity-profile/projects` | `useEntityProfileTabData` / `OrganizationProjectsContent` | 机构空间「项目」Tab |

### 新增字段（逐个项目对象，非根级）

```json
{
  "publisherName": "张三",
  "publisherAvatar": "https://cdn.example.com/avatars/user_001.jpg",
  "amountMin": "5000",
  "amountMax": "20000"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `publisherName` | string \| null | 否 | 项目发布人的显示名称（如 user_profile.displayName），卡片 meta 行**首位**展示，带圆形头像。缺失/null 时隐藏头像，不展示名称 |
| `publisherAvatar` | string \| null | 否 | 发布人头像 URL，卡片 meta 行左侧 18×18 圆形展示。缺失时仅展示文字 |
| `amountMin` | string \| null | 否 | 预算区间最小值（纯数字字符串，如 `"5000"`），卡片右上角等级下方展示。缺失或两端均 null 时不展示预算行 |
| `amountMax` | string \| null | 否 | 预算区间最大值（同上），前端通过 `formatBudgetRange()` 将数字格式化为短字符串（如 `"5k–20k"` / `"1.2M"`） |

### 前端格式化规则（`formatBudgetRange`）

| 原始值范围 | 格式化输出示例 |
|-----------|---------------|
| `>= 1,000,000` | `"1.2M"`（除以 1e6，保留 1 位小数，尾随 .0 省略） |
| `>= 1,000` | `"5k"`（除以 1e3，同上） |
| `< 1,000` | 原数字字符串 |
| 仅 `amountMin` 有值 | `"5k"` |
| `amountMin` + `amountMax` 均存在 | `"5k–20k"` |
| 两端均 null/空 | `"—"`（卡片不展示） |

### 示例响应片段

```json
{
  "code": 200,
  "message": null,
  "data": {
    "projects": [
      {
        "uid": "PRa1b2c3d4e5f",
        "title": "分布式电商平台开发",
        "preview": "构建支持千万级并发的电商系统……",
        "tags": [{ "label": "Java" }, { "label": "微服务" }],
        "category": "COMMERCIAL",
        "ownerOrganization": "字节跳动",
        "publisherName": "张三",
        "publisherAvatar": "https://cdn.example.com/avatars/user_001.jpg",
        "publishTime": "2026-07-01T10:00:00Z",
        "level": "B",
        "amountMin": "80000",
        "amountMax": "120000",
        "duration": "16 周",
        "logoSvgUrl": "https://cdn.example.com/logo.svg",
        "status": "OPEN"
      }
    ]
  }
}
```

### 业务规则

- 三个字段均为**可选**：后端未实现时前端自动回退（publisherName 缺省时 meta 行不展示发布人，amountMin/amountMax 缺省时不渲染预算行）
- `amountMin` / `amountMax` 为纯数字字符串，不含千分位逗号、单位或小数点
- `publisherName` 为空字符串时按 null 处理
- 不影响现有字段（`uid` / `title` / `preview` / `tags` / `category` / `ownerOrganization` / `publishTime` / `level` / `duration` / `logoSvgUrl` / `status` 保持原样）
- meta 行顺序：发布人姓名 · 机构名称 · 周期

### 验收要点

- [ ] 首页 Feed 卡片正确展示发布人头像、名称和预算区间
- [ ] 个人/团队/机构空间项目列表卡片正确展示
- [ ] `publisherName` 缺失时卡片仅展示「公司 · 周期」
- [ ] `amountMin` / `amountMax` 双 null 时卡片不展示预算行
- [ ] FormatBudgetRange 在前端正确定格式化 1k / 1M 边界值
- [ ] 旧字段不受影响，卡片外观（除新增内容外）保持不变