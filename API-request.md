# UniBridge 前端 API 后端同步（待跟进）

> **完整 API 契约**已合并至 [`API.md`](./API.md)。  
> 团队空间 TeamView 接口见 [`API.md` 第二部分 §08 团队空间](./API.md#08团队空间team-profile)。

---

## 当前状态

| 模块 | 状态 |
|------|------|
| 团队空间 `/team-profile/*` 读接口 | 后端 ✅ 已实现；前端 ✅ 已接入 |
| 团队成员 `members[]` 读字段（`role` / `career` / `isAdmin` / `isOwner` / `realName`） | 后端 ✅ 已实现；前端 ✅ 已接入 |
| **管理成员** `PUT /team-profile/members` | 后端 ✅ 已实现；前端 ✅ 已接入（`updateTeamProfileMembers`、`ManageMembersForm`） |
| 用户预览 `GET /users/{uid}/public-preview` | 后端 ✅ 已实现；前端 ✅ 已接入（`getUserPublicPreview`） |

暂无待跟进增量项。后续联调差异请直接更新 `API.md` 对应章节。

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [`API.md`](./API.md) | 全量接口契约（认证、个人/团队空间、发布详情、Feed 与互动） |
| [`API-request.md`](./API-request.md) | **本文档**：待跟进增量索引（当前为空） |
