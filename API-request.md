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
      "parentContentTypeCode": "VDx9Y8z7W6v5U",
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
