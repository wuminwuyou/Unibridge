# UniBridge 前端待办 API 增量

> **用途**：待办 API 需求，供后端实现。  
> **全量契约**：[`API.md`](./API.md)  
> **Base**：`/api/v1/client`

---

## 当前状态

| 模块 | 后端 | 前端 |
|------|------|------|
| 学习笔记 `POST /notes` + `parentContentTypeCode` + `visibility` 前端接入 | 已实现 | **已接入** |
| 笔记详情响应新增 `parentContentTypeCode` + `visibility`（`API.md` §06.2） | 已实现 | **已接入** |
| 删除笔记 `editorType` 字段 | 已实现 | **已接入** |
| 可见性 `visibility` 字段 | 已实现 | **已接入** |
| 个人空间笔记 API 鉴权增强 + 双视角 + 新增 `status`/`visibility` | 已实现 | **已接入** |
| 查询视频笔记的学习笔记列表 `GET /notes/{uid}/children` | **待实现** | 待接入 |
| 项目详情新增 `owner` 发布者字段 | **待实现** | 待接入 |

---

## 1) `GET /notes/{uid}/children` — 查询视频笔记的学习笔记列表

> **消费方**：`NoteQuickMdEditor` / 视频详情右侧栏  
> **变更类型**：新增接口需求，查询某视频笔记下所有已发布的图文学习笔记

### 说明

视频详情页右侧栏需要展示该视频笔记关联的全部学习笔记列表。通过 `t_user_note_detail.parent_content_type_code` 查询所有子笔记。

### 端点

```
GET /api/v1/client/notes/{uid}/children
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `uid` | string | 是 | 父视频笔记 UID（`VD` + 11 位） |

### Response

```json
{
  "code": 200,
  "message": null,
  "data": [
    {
      "uid": "TXa8f2K9w3N7p",
      "publishAction": "PUBLISH",
      "title": "如何设计一个高质量用户系统",
      "summary": "结合权限模型与可观测方案的经验分享。",
      "contentType": "图文",
      "content": "# 如何设计一个高质量用户系统\n\n...",
      "tags": ["系统设计", "用户体系"],
      "coverUrl": "https://cdn.example.com/notes/cover/auto-generated.jpg",
      "videoUrl": null,
      "videoDuration": null,
      "visibility": "PUBLIC"
    }
  ]
}
```

### 业务规则

- 仅返回 `status = PUBLISHED` 且 `visibility = PUBLIC` 的子笔记
- 不返回 `REVIEWING`（审核中）、`DRAFT`（草稿）、`DELETED`（已删除）、`BANNED`（封禁）状态的子笔记
- 若父笔记被封禁（`BANNED`），统一返回 `404 (NOTE_NOT_FOUND)`
- 无子笔记时返回空数组 `[]`

---

## 2) `GET /projects/{uid}` — 新增 `owner` 发布者字段

> **消费方**：`ProjectDetailPage` 左侧信息卡片  
> **变更类型**：已有接口增量，新增 `owner` 对象字段

### 说明

项目详情页左侧的「合作信息」卡片上方需新增项目发布者的身份信息展示，包括：头像、名称、职业背景、所属企业/学校、地理位置。

### 新增字段

```json
{
  "owner": {
    "uid": "USa1B2c3D4e5F",
    "name": "张 PM",
    "avatarUrl": "https://cdn.example.com/avatar/u10001.jpg",
    "careerData": ["前端工程师", "3 年经验"],
    "organization": "腾讯科技有限公司",
    "location": "广东·深圳"
  }
}
```

| 字段 | 类型 | 说明 | 数据库来源 |
|------|------|------|------------|
| `owner.uid` | string | 发布者用户 UID | `t_project.owner_uid` → `t_user.user_uid` |
| `owner.name` | string | 发布者昵称 | `p_user_profile.nick_name`（空则回退「用户」） |
| `owner.avatarUrl` | string \| null | 发布者头像 | `p_user_profile.avatar_url` |
| `owner.careerData` | JSON \| null | 职业/学籍背景 | `p_user_profile.career_data` JSON |
| `owner.organization` | string \| null | 所属企业/学校 | `p_tenant_org_profile.name`（通过 `t_user_organization_binding.entity_code` 关联，取 `is_active=1` 的绑定） |
| `owner.location` | string \| null | 所在地区 | `p_tenant_org_profile.location` |

### 查询链路

```
t_project.owner_uid
  → t_user.user_uid
    → p_user_profile.nick_name / avatar_url / career_data
    → t_user_organization_binding (is_active=1) → entity_code
      → p_tenant_org_profile.name / location
```

### 完整 Response（含新增字段）

```json
{
  "uid": "PRa1B2c3D4e5F",
  "title": "数据可视化大屏设计与开发",
  "summary": "基于 Vue3 + ECharts 构建企业级可视化大屏。",
  "channel": "enterprise",
  "campusRecruitType": null,
  "description": "# 项目背景\n...",
  "descriptionEditorType": "MARKDOWN",
  "amount": "18600",
  "level": "SR",
  "duration": "4 周",
  "teamSize": "1-3 人",
  "skillTags": ["Vue3", "ECharts", "可视化"],
  "deadline": "2026-06-30",
  "status": "OPEN",
  "publishedAt": "2026-05-22T10:30:00+08:00",
  "updatedAt": "2026-05-22T11:00:00+08:00",
  "owner": {
    "uid": "USa1B2c3D4e5F",
    "name": "张 PM",
    "avatarUrl": "https://cdn.example.com/avatar/u10001.jpg",
    "careerData": ["前端工程师", "3 年经验"],
    "organization": "腾讯科技有限公司",
    "location": "广东·深圳"
  }
}
```
