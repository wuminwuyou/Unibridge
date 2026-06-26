---

## 8) 个人空间笔记 API — 鉴权增强 & 本人视角全量返回 & 新增状态/可见性字段

> **变更来源**：`UserProfileController.getProfileNotes` / `UserProfileService`  
> **变更类型**：鉴权改为必选，本人视角查询范围扩大，响应新增 `status`/`visibility` 字段

### 说明

个人空间笔记 Tab 需区分"本人管理视角"和"他人浏览视角"：

- **本人视角**（`Authorization.userUid == query.uid`）：返回除 `DELETED` 外全部笔记（`DRAFT`、`REVIEWING`、`PUBLISHED`、`BANNED`、`PRIVATE`、`PUBLIC` 均可见），用于个人空间管理（如草稿标记、审核中 badge、私密锁图标）
- **他人视角**（`Authorization.userUid != query.uid`）：仅返回 `status = PUBLISHED` 且 `visibility = PUBLIC` 的笔记

### 端点

```
GET /api/v1/client/user-profile/notes
```

### 鉴权

| 请求头 | 必填 | 说明 |
|--------|------|------|
| `Authorization` | **是** | Bearer JWT `access_token`（不再允许匿名访问） |

### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `uid` | string | 否 | 目标用户 UID；为空时默认 `access_token` 当前用户 |
| `userUid` | string | 否 | 兼容旧参数名，同 `uid` |
| `userId` | long | 否 | 兼容旧参数（已废弃） |
| `page` | int | 否 | 默认 1 |
| `pageSize` | int | 否 | 默认 20，最大 100 |
| `contentType` | string | 否 | 预筛：`图文` \| `视频` |

### Response（本人视角示例）

```json
{
  "code": 200,
  "message": null,
  "data": {
    "userUid": "US00000000001",
    "notes": [
      {
        "uid": "TXa8f2K9w3N7p",
        "title": "如何设计一个高质量用户系统",
        "summary": "结合权限模型与可观测方案的经验分享。",
        "contentType": "图文",
        "tags": ["系统设计", "用户体系"],
        "publishTime": "2026-05-20 09:00",
        "updateTime": "2026-05-20",
        "views": 520,
        "likes": 18,
        "comments": 6,
        "favorites": 73,
        "cover": "https://cdn.example.com/notes/cover/auto.jpg",
        "authorNickName": "李同学",
        "authorOrganization": "清华大学",
        "authorAvatar": "https://cdn.example.com/avatar/u10001.jpg",
        "videoDuration": null,
        "status": "PUBLISHED",
        "visibility": "PUBLIC"
      },
      {
        "uid": "TXb1C2d3E4f5G",
        "title": "笔记草稿",
        "summary": "",
        "contentType": "图文",
        "tags": [],
        "publishTime": "",
        "updateTime": "2026-05-19",
        "views": 0,
        "likes": 0,
        "comments": 0,
        "favorites": 0,
        "cover": "",
        "authorNickName": "李同学",
        "authorOrganization": "清华大学",
        "authorAvatar": "https://cdn.example.com/avatar/u10001.jpg",
        "videoDuration": null,
        "status": "DRAFT",
        "visibility": "PRIVATE"
      },
      {
        "uid": "TXc2D3e4F5g6H",
        "title": "审核中的笔记",
        "summary": "待审核内容",
        "contentType": "图文",
        "tags": ["审核"],
        "publishTime": "",
        "updateTime": "2026-05-19",
        "views": 0,
        "likes": 0,
        "comments": 0,
        "favorites": 0,
        "cover": "https://cdn.example.com/notes/cover/review.jpg",
        "authorNickName": "李同学",
        "authorOrganization": "清华大学",
        "authorAvatar": "https://cdn.example.com/avatar/u10001.jpg",
        "videoDuration": null,
        "status": "REVIEWING",
        "visibility": "PUBLIC"
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 20
  }
}
```

### Response（他人视角示例 — 仅返回 PUBLISHED + PUBLIC）

```json
{
  "code": 200,
  "message": null,
  "data": {
    "userUid": "US00000000001",
    "notes": [
      {
        "uid": "TXa8f2K9w3N7p",
        "title": "如何设计一个高质量用户系统",
        "summary": "结合权限模型与可观测方案的经验分享。",
        "contentType": "图文",
        "tags": ["系统设计", "用户体系"],
        "publishTime": "2026-05-20 09:00",
        "updateTime": "2026-05-20",
        "views": 520,
        "likes": 18,
        "comments": 6,
        "favorites": 73,
        "cover": "https://cdn.example.com/notes/cover/auto.jpg",
        "authorNickName": "李同学",
        "authorOrganization": "清华大学",
        "authorAvatar": "https://cdn.example.com/avatar/u10001.jpg",
        "videoDuration": null,
        "status": "PUBLISHED",
        "visibility": "PUBLIC"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### 新增字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 是 | `DRAFT` \| `REVIEWING` \| `PUBLISHED` \| `BANNED`（本人视角可见全部状态；他人视角固定为 `PUBLISHED`） |
| `visibility` | string | 是 | `PUBLIC` \| `PRIVATE`（本人视角可见全部；他人视角固定为 `PUBLIC`） |

### 业务规则

| 场景 | 条件 | 返回逻辑 |
|------|------|----------|
| 本人访问 | `Authorization.userUid == query.uid` | 返回 `user_uid = targetUid` 的全部笔记，仅排除 `status = DELETED` |
| 他人访问 | `Authorization.userUid != query.uid` | 仅返回 `status = PUBLISHED` 且 `visibility = PUBLIC` 的笔记 |
| 排序 | 所有场景 | `COALESCE(published_at, created_at) DESC, id DESC` |
| 鉴权失败 | 无 token / token 无效 | 返回 `401 UNAUTHORIZED` |

### 影响范围

| 层级 | 文件 | 变更 |
|------|------|------|
| DTO | `ProfileNoteItem.java` | 新增 `status`（String）和 `visibility`（String）字段 |
| Assembler | `NoteCardAssembler.java` | `toProfileNoteItem()` 填充 `.status(note.getStatus())`、`.visibility(note.getVisibility())` |
| Service | `UserProfileService.java` | `getProfileNotes()` 鉴权改为 `requireCurrentUserUid`（不再允许匿名）；`baseNoteWrapper()` 新增 `viewingOwnSpace` 参数，本人视角 `ne DELETED`，他人视角 `eq PUBLISHED + eq PUBLIC`；`loadNotes()`/`countNotes()` 同步适配；`getProfileHome()` 同步适配 |
| Controller | `UserProfileController.java` | `Authorization` 请求头改为必填（`required = false` → 必填） |

### 实现说明

- `ProfileNoteItem.status` 和 `ProfileNoteItem.visibility` 始终有值（由 MyBatis-Plus 从 `user_note` 表字段自动映射），前端可用于渲染管理标签（草稿标记、审核中 badge、私密锁图标）
- 本人视角的 `total` 计数包含所有非删除笔记，他人视角的 `total` 仅含已发布公开笔记
- `getProfileHome` 中的笔记预览列表同样遵循上述双视角过滤规则
