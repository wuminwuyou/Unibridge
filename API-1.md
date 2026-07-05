## 3) 笔记卡片 Footer 精简 — 列表接口补充 `updateTime`

> **消费方**：`GridNoteCard` / `RowNoteCard`（首页侧栏、笔记专区、档案空间、相似推荐等）  
> **变更类型**：已有列表接口增量 + 字段裁剪说明  
> **前端状态**：UI 已改为仅展示 **浏览量 + 智能更新时间**；收藏/点赞/评论指标已从卡片 Footer 移除

### 背景

新版笔记卡片 Footer 遵循「无情做减法，时效放第一」：

| 保留 | 移除（卡片层不再消费） |
|------|------------------------|
| `views` 浏览量 | `likes` / `comments` 点赞量 |
| `publishTime` + `updateTime` 融合为单字段时效 | `favorites` 收藏量 |

**智能更新时间展示规则（前端 `resolveGridNoteSmartUpdateTime`）**

| 条件 | 卡片展示 |
|------|----------|
| `updateTime` 与 `publishTime` 不一致（精确到分钟） | `修改于 yyyy-MM-DD` |
| 仅有 `updateTime`、无 `publishTime`（如草稿） | `修改于 yyyy-MM-DD` |
| 未修改 | 相对时效：`刚刚` / `N 分钟前` / `N 小时前` / `yyyy-MM-DD` |

### 受影响接口

以下接口的笔记列表项须返回 **`updateTime`**（最近更新时间）；`publishTime` 保持现有语义。

| 接口 | 当前 `updateTime` | 说明 |
|------|-------------------|------|
| `GET /user-profile/notes` | ✅ 已有 | 档案空间笔记 Tab，无需改动 |
| `GET /user-profile/home` → `notes[]` | ⚠️ 待确认 | 主页预览区笔记卡片 |
| `GET /team-profile/notes` | ⚠️ 待确认 | 团队空间笔记 Tab |
| `GET /entity-profile/notes` | ⚠️ 待确认 | 机构空间笔记 Tab |
| `GET /feed/home` → `notes[]` | ❌ 缺失 | 首页侧栏笔记推荐 |
| `GET /feed/notes` | ❌ 缺失 | 笔记专区列表 |
| `GET /feed/notes/shuffle` | ❌ 缺失 | 笔记专区「换一换」 |
| `GET /feed/notes/{uid}/similar` | ❌ 缺失 | 阅读器相似推荐 |

### 新增 / 统一字段约定

在每个笔记列表项（`ProfileNoteItem` / Feed `ContentVO` NOTE 类型）中，除 Footer 时效字段外，**作者信息为卡片主体展示的必要字段**（`GridNoteCard` 在 `showAuthor=true` 时渲染作者行；`RowNoteCard` 始终展示作者昵称）：

```json
{
  "uid": "TXa8f2K9w3N7p",
  "title": "Spring Boot 实战笔记",
  "summary": "实践经验总结",
  "coverUrl": "https://cdn.example.com/covers/xxx.jpg",
  "tags": ["Spring Boot", "后端"],
  "contentType": "图文",
  "views": 128,
  "publishTime": "2026-05-10 14:20",
  "updateTime": "2026-05-12 09:30",
  "authorNickname": "代码小能手",
  "authorAvatar": "https://cdn.example.com/avatars/user.jpg"
}
```

#### Footer 时效字段

| 字段 | 类型 | 必填 | 说明 | 数据库来源 |
|------|------|------|------|------------|
| `views` | number | 是 | 浏览量；卡片 Footer 唯一保留的互动指标 | `t_user_note_detail.views` 或等价统计 |
| `publishTime` | string | 否 | 展示用发布时间；未发布可为空字符串 | `COALESCE(published_at, created_at)` |
| `updateTime` | string | 是 | 最近更新时间；与 `publishTime` 相同时前端走相对时效 | `t_user_note_detail.updated_at` |

#### 作者信息字段

| 字段 | 类型 | 必填 | 说明 | 数据库来源 |
|------|------|------|------|------------|
| `authorNickname` | string | 是 | 作者昵称；**禁止**返回实名 `name`；空时前端回退「匿名用户」 | `p_user_profile.nick_name` |
| `authorAvatar` | string \| null | 否 | 作者头像 URL；空时前端以昵称首字作占位 | `p_user_profile.avatar_url` |

> **命名兼容**：空间类接口历史字段为 `authorNickName`（驼峰 `Name`），Feed 类为 `authorNickname`；前端 `resolveNoteAuthorNickname` 已兼容两者，后端新接口建议统一为 `authorNickname`。

#### 作者字段覆盖情况

| 接口 | `authorNickname` | `authorAvatar` |
|------|------------------|----------------|
| `GET /feed/home` → `notes[]` | ✅ 已有 | ✅ 已有 |
| `GET /feed/notes` | ✅ 已有 | ⚠️ 待确认 |
| `GET /feed/notes/{uid}/similar` | ⚠️ 待确认 | ❌ 待补充 |
| `GET /user-profile/notes` | ✅（`authorNickName`） | ✅ 已有 |
| `GET /user-profile/home` → `notes[]` | ⚠️ 待确认 | ⚠️ 待确认 |
| `GET /team-profile/notes` | ⚠️ 待确认 | ⚠️ 待确认 |
| `GET /entity-profile/notes` | ⚠️ 待确认 | ⚠️ 待确认 |

**展示策略（前端，非接口裁剪）**

- 首页侧栏 / 笔记专区 Feed：`showAuthor=true`，须保证 `authorNickname` + `authorAvatar` 可用
- 档案空间笔记 Tab：`showAuthor=false`，作者字段可返回但网格卡不渲染；`RowNoteCard` 布局仍展示 `authorNickname`

**格式化**：ISO 8601 或 `yyyy-MM-dd HH:mm` 均可，前端统一归一化；日期精度建议至少到分钟。

**兜底**：若 `updateTime` 暂不可用，后端应回退 `publishTime`；两者皆空时前端隐藏时间字段。

### 可裁剪字段（卡片列表层）

以下字段在 **笔记卡片列表** 响应中可标记为 **可选 / 后续废弃**（详情页、互动接口仍保留）：

| 字段 | 说明 |
|------|------|
| `likes` | 点赞数；Feed 排序算法仍可使用，但卡片 UI 不再展示 |
| `comments` | 评论数；同上 |
| `favorites` | 收藏数；同上 |
| `authorOrganization` | 作者机构；卡片 UI 已移除，列表层可不再返回 |

> Feed 热度排序公式（`likes × 5 + collects × 10 + comments × 8`）**不受影响**，仅列表响应面向卡片 UI 的字段需求发生变化。

### 前端接入说明

- `noteFeedMappers.mapFeedNoteToProfileNoteItem` 已读取 `updateTime`，缺省时回退 `publishTime`
- 档案空间 `GET /user-profile/notes` 已具备 `updateTime`，修改后可正确展示「修改于 …」
- Feed 类接口在后端补齐 `updateTime` 前，卡片时间将退化为仅基于 `publishTime` 的相对时效

### 验收要点

- [ ] `GET /feed/home`、`/feed/notes`、`/feed/notes/{uid}/similar` 的 NOTE 项均含 `updateTime`
- [ ] 上述 Feed 接口在需要展示作者的场景下均含 `authorNickname` + `authorAvatar`
- [ ] 用户编辑已发布笔记后，卡片 Footer 显示 `修改于 yyyy-MM-DD`（`updateTime` > `publishTime`）
- [ ] 未修改笔记显示相对时间（如 `3 小时前`），而非冗余绝对日期
- [ ] 列表响应不返回 `likes` / `favorites` / `comments`，前端卡片功能不受影响
- [ ] `authorNickname` 为空时接口仍返回字段（空字符串），前端回退「匿名用户」；禁止用实名 `name` 顶替
