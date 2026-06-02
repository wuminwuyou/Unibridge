# UniBridge 前端待办 API 增量

> **用途**：创建学生团队接口需求，供后端实现。  
> **全量契约**：[`API.md`](./API.md)  
> **Base**：`/api/v1/client`  
> **消费组件**：`CreateTeamModal.tsx`

---

## 当前状态

| 模块 | 后端 | 前端 |
|------|------|------|
| 个人空间读 (`/user-profile/space`) | ✅ 已有 | ✅ 已对接 |
| 创建学生团队 (`POST /team/create`) | ✅ 已实现 | `CreateTeamModal.tsx` |
| 用户认证预览 (`/users/{uid}/verified-preview`) | ❌ **待实现** | 初始成员 UID 输入后校验是否已实名 |

---

## `POST /team/create` — 创建学生团队

> **消费方**：`CreateTeamModal.tsx` — 个人主页侧边栏「创建团队」

### Request

- **Method**：`POST`
- **Path**：`/team/create`
- **Auth**：是（已实名 STUDENT 或 MENTOR，后端需校验 `authStatus=verified`）

```json
{
  "name": "我的项目团队",
  "description": "聚焦前端工程化实践",
  "initialMemberUids": ["US00000000099"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 团队名称（≤32 字符） |
| `description` | string | 否 | 团队简介（≤120 字符） |
| `initialMemberUids` | string[] | 否 | 初始成员 UID 列表。前端输入 US+11 位时自动调用 public-preview 回填并预览。创建者自动成为 LEADER，此项为额外成员 |

### Response `data`

```json
{
  "teamUid": "ST00000007001",
  "name": "我的项目团队"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `teamUid` | string | 新团队 uid（`ST` + 11 位） |
| `name` | string | 团队名称 |

### 业务规则

- 创建者自动成为团队负责人（MEMBER 列表中 role = MENTOR（导师）| LEADER（学生）），**无需传 leaderUid**
- 创建者的 role 取自 `user_auth_link`：MENTOR → `team_member.role = MENTOR`；STUDENT → `team_member.role = LEADER`
- 初始成员需校验实名认证状态，role 均设为 MEMBER
- 创建的团队类型根据创建者 role 判定：STUDENT → `STUDENT_TEAM`；MENTOR → `MENTOR_GROUP`
- 后端需校验 authStatus=verified，拒绝未实名用户

### 错误码

| message | HTTP |
|---------|------|
| `TEAM_NAME_REQUIRED` | 400 |
| `TEAM_NAME_TOO_LONG` | 400 |
| `USER_NOT_VERIFIED` | 403 |
| `MEMBER_NOT_VERIFIED` | 403 |
| `USER_NOT_FOUND` | 404 |
| `UNAUTHORIZED` | 401 |

### 前端行为

```
CreateTeamModal 打开
  ├── 团队名称（必填 ≤32 字符）
  ├── 团队简介（选填 ≤120 字符）
  ├── 初始成员 UID（选填 — 创建者自身为 LEADER/MENTOR）
  │     └── 输入匹配 US+11 位 → 300ms debounce → GET /users/{uid}/verified-preview
  │           ├── 成功：显示头像 + realName + uid 预览卡
  │           └── 403 USER_NOT_VERIFIED：前端提示「该用户未实名，无法加入团队」
  │           └── 404：不做提示
  └── 提交 → POST /team/create
        └── 成功：跳转到 /team/:teamUid
```

---

## `GET /users/{uid}/verified-preview` — 用户实名认证预览

> **消费方**：`CreateTeamModal.tsx` 初始成员 UID 输入后校验是否已实名

### Request

- **Method**：`GET`
- **Path**：`/users/{uid}/verified-preview`
- **Auth**：否

### Response `data`

```json
{
  "uid": "US00000000099",
  "realName": "李四",
  "nickname": "李四",
  "avatarUrl": "https://…",
  "verified": true,
  "role": "STUDENT"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 用户 uid |
| `realName` | string | 实名 |
| `nickname` | string | 昵称 |
| `avatarUrl` | string \| null | 头像 |
| `verified` | boolean | 是否已实名认证（user_auth_link.audit_status=APPROVED 且 is_active=1） |
| `role` | string \| null | 用户角色（STUDENT/MENTOR），仅 verified=true 时有效 |

### 错误码

| message | HTTP |
|---------|------|
| `USER_NOT_VERIFIED` | 403 |
| `USER_NOT_FOUND` | 404 |
