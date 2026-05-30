# UniBridge 前端待办 API 增量

> **用途**：实验室管理 & 人员管理接口需求，供后端实现。  
> **全量契约**：[`API.md`](./API.md)（第五部分：机构空间）  
> **Base**：`/api/v1/client`  
> **消费组件**：`ManageLabsForm.tsx`、`OrgMembersManageForm.tsx`

---

## 当前状态

| 模块 | 后端 | 前端 |
|------|------|------|
| 机构空间读 (`/entity-profile/space`, `/home`, `/teams`, `/members`…) | ✅ 已有 | ✅ 已对接 |
| 机构空间写 — 实验室 CRUD | 已实现 | `ManageLabsForm.tsx` + `useManageLabsForm.ts` |
| 机构空间写 — 人员管理 | 已实现 | `OrgMembersManageForm.tsx` + `useOrgMembersManageForm.ts` |
| 用户公开预览 (`/users/{uid}/public-preview`) | ✅ 已有 | ✅ 人员添加 UID lookup |
| 用户模糊搜索 | 已实现 | 实验室负责人搜索下拉 |
| **`/entity-profile/teams` & `/space.teamsPreview` 缺少负责人字段** | 已实现 | 见下方 §0 |

---

## 0）`GET /entity-profile/teams` & `GET /entity-profile/space.teamsPreview` — 增加负责人信息

> **问题**：当前 `GET /entity-profile/teams?entityCode=` 和 `GET /entity-profile/space.teamsPreview[]` 返回的团队项只有 `teamUid/name/description/logoUrl/memberCount`，缺少负责人字段。导致实验室管理表格的「负责人」列永远显示「未设置」。

### 期望新增字段（每个团队/实验室项）

| 字段 | 类型 | 说明 |
|------|------|------|
| `leaderUid` | string \| null | 实验室负责人对外 uid。无负责人时为 `null` |
| `leaderDisplayName` | string \| null | 负责人展示名称（`realName || nickname`），无负责人时为 `null` |

### 响应示例

**`GET /entity-profile/teams` 响应**
```json
{
  "entityCode": "10598",
  "teams": [
    {
      "teamUid": "LB00000001001",
      "name": "智能计算实验室",
      "description": "...",
      "logoUrl": null,
      "memberCount": 3,
      "leaderUid": "US00000000002",
      "leaderDisplayName": "李导师"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

**`GET /entity-profile/space` 的 `teamsPreview[]` 同。**

### 前端影响

| 位置 | 当前行为 | 修复后 |
|------|----------|--------|
| `ManageLabsForm.tsx` 表格 | 负责人列永远「未设置」 | 显示 `leaderDisplayName` |
| `ManageLabsForm.tsx` 行编辑 | 编辑时负责人为空 | 编辑时预填已有负责人 |
| `saveEditingLab` | PUT 时可设置 `leaderUid` 但列表不反映 | 保存后列表刷新时正确显示 |
| `normalizeEntityProfileTeamPreviewDto` | 未解析 leader 字段 | 解析 `leaderUid` / `leader_display_name` |

---

## 通用约定

- 统一响应包装：`{ code: 200, message: "success", data: {} }`
- Auth：所有写接口需 `Authorization: Bearer <token>`（`userRole=organization-admin`）
- 路径均相对 `/api/v1/client`

---

## 1）`GET /users/search` — 用户模糊搜索

> **消费方**：`ManageLabsForm.tsx` 负责人搜索（`LeaderSuggestionDropdown`）

### Request

- **Method**：`GET`
- **Path**：`/users/search`
- **Auth**：是
- **Query**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | 是 | 搜索关键词，匹配 `uid`、`nickname`、`realName`（模糊/前缀） |

### Response `data`

```json
{
  "users": [
    {
      "uid": "US00000000001",
      "nickname": "张三",
      "realName": "张三",
      "avatarUrl": null
    },
    {
      "uid": "US00000000002",
      "nickname": "用户#1002",
      "realName": "李导师",
      "avatarUrl": "https://api.dicebear.com/9.x/initials/svg?seed=LM"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 用户对外 uid |
| `nickname` | string | 昵称 |
| `realName` | string \| null | 实名 |
| `avatarUrl` | string \| null | 头像 |

### 前端行为

- 输入关键词后 300ms 反抖动 → `GET /users/search?keyword=`
- 返回结果渲染下拉列表（头像 + 姓名 + UID）
- 选中后填入 `leaderUid` 并显示 tag

---

## 2）`POST /entity-profile/team` — 创建实验室

> **消费方**：`ManageLabsForm.tsx` → 创建新实验室表单

### Request

- **Method**：`POST`
- **Path**：`/entity-profile/team`
- **Auth**：是（`organization-admin`）

```json
{
  "entityCode": "10598",
  "name": "智能计算实验室",
  "leaderUid": "US00000000002"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `entityCode` | string | 是 | 机构主体代码 |
| `name` | string | 是 | 实验室名称 |
| `leaderUid` | string | 否 | 实验室负责人 uid（通过 `/users/search` 选取） |

### Response `data`

```json
{
  "teamUid": "LB00000007001",
  "name": "智能计算实验室"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `teamUid` | string | 新实验室 uid（`LB` + 11 位） |
| `name` | string | 实验室名称 |

### 错误码

| message | HTTP |
|---------|------|
| `ENTITY_NOT_FOUND` | 404 |
| `TEAM_NAME_REQUIRED` | 400 |
| `TEAM_NAME_DUPLICATE` | 409 |

---

## 3）`PUT /entity-profile/team` — 更新实验室

> **消费方**：`ManageLabsForm.tsx` → 行编辑「保存」

### Request

- **Method**：`PUT`
- **Path**：`/entity-profile/team`
- **Auth**：是
- **Query**

| 参数 | 类型 | 必填 |
|------|------|------|
| `teamUid` | string | 是 |

```json
{
  "entityCode": "10598",
  "name": "智能计算实验室（改名）",
  "leaderUid": "US00000000003"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `entityCode` | string | 是 | 机构主体代码（校验权限） |
| `name` | string | 否 | 新名称 |
| `leaderUid` | string \| null | **是**（前端总是携带） | 新负责人 uid；传 `null` 清除负责人 |

### Response `data`：`null`，前端凭 HTTP 200 判断成功。

### 前端行为

- `leaderUid` 始终携带：有值时传 uid 字符串；用户点击「清除负责人」后传 `null`
- 示例 payload：设置负责人 `{ "entityCode":"10598", "leaderUid":"US..." }`；清除负责人 `{ "entityCode":"10598", "leaderUid": null }`

### 错误码

| message | HTTP |
|---------|------|
| `ENTITY_NOT_FOUND` | 404 |
| `TEAM_NOT_FOUND` | 404 |
| `TEAM_NOT_ACCESSIBLE` | 403 |

---

## 4）`DELETE /entity-profile/team` — 删除实验室

> **消费方**：`ManageLabsForm.tsx` → 行展示「删除」

### Request

- **Method**：`DELETE`
- **Path**：`/entity-profile/team`
- **Auth**：是
- **Query**

| 参数 | 类型 | 必填 |
|------|------|------|
| `teamUid` | string | 是 |

### Response `data`：`null`，前端凭 HTTP 200 判断成功。

### 错误码

| message | HTTP |
|---------|------|
| `TEAM_NOT_FOUND` | 404 |
| `TEAM_NOT_ACCESSIBLE` | 403 |

---

## 5）`POST /entity-profile/member` — 添加机构人员

> **消费方**：`OrgMembersManageForm.tsx` → 添加人员表单

### Request

- **Method**：`POST`
- **Path**：`/entity-profile/member`
- **Auth**：是（`organization-admin`）

```json
{
  "entityCode": "10598",
  "uid": "US00000000099"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `entityCode` | string | 是 | 机构主体代码 |
| `uid` | string | 是 | 用户 uid |

### Response `data`

```json
{
  "uid": "US00000000099",
  "role": "PM"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 用户 uid |
| `role` | string | 后台根据 `user_auth_link` 自动判定的角色：`PM`（员工）\| `MENTOR`（导师） |

> 前端行为：UID 失焦 → `GET /users/{uid}/public-preview` 回填 realName；点击「添加进机构」→ 本接口。role 由后台判定，前端**不传** role。

### 错误码

| message | HTTP |
|---------|------|
| `USER_NOT_FOUND` | 404 |
| `MEMBER_ALREADY_EXISTS` | 409 |
| `ENTITY_NOT_FOUND` | 404 |

---

## 6）`DELETE /entity-profile/member` — 移除机构人员

> **消费方**：`OrgMembersManageForm.tsx` → 行展示「移除」

### Request

- **Method**：`DELETE`
- **Path**：`/entity-profile/member`
- **Auth**：是
- **Query**

| 参数 | 类型 | 必填 |
|------|------|------|
| `entityCode` | string | 是 |
| `uid` | string | 是 |

### Response `data`：`null`，前端凭 HTTP 200 判断成功。

### 错误码

| message | HTTP |
|---------|------|
| `MEMBER_NOT_FOUND` | 404 |
| `ENTITY_NOT_FOUND` | 404 |

---

## 接口汇总

| # | Method | Path | Query / Body | 前端封装 |
|---|--------|------|--------------|----------|
| 1 | GET | `/users/search` | `?keyword=` | `searchEntityProfileUsers` |
| 2 | POST | `/entity-profile/team` | `{ entityCode, name, leaderUid? }` | `createEntityTeam` |
| 3 | PUT | `/entity-profile/team` | `?teamUid=` + `{ entityCode, name?, leaderUid (string\|null) }` | `updateEntityTeam` |
| 4 | DELETE | `/entity-profile/team` | `?teamUid=` | `deleteEntityTeam` |
| 5 | POST | `/entity-profile/member` | `{ entityCode, uid }` | `addEntityProfileMember` |
| 6 | DELETE | `/entity-profile/member` | `?entityCode=&uid=` | `removeEntityProfileMember` |

---

## 调用时序

### 实验室管理

```
ManageLabsForm 打开
  ├── 已有列表 ← GET /entity-profile/teams (✅ 已实现)
  ├── [编辑] 名称 + 负责人搜索
  │     ├── 输入 → 300ms debounce → GET /users/search?keyword=
  │     └── 保存 → PUT /entity-profile/team?teamUid=
  ├── [删除] → DELETE /entity-profile/team?teamUid=
  └── [创建] 名称 + 负责人搜索 + 按钮
        └── POST /entity-profile/team { entityCode, name, leaderUid? }
```

### 人员管理

```
OrgMembersManageForm 打开
  ├── 已有列表 ← GET /entity-profile/members (✅ 已实现)
  ├── [添加] UID 输入
  │     ├── onBlur → GET /users/{uid}/public-preview (✅ 已实现)
  │     └── 按钮 → POST /entity-profile/member { entityCode, uid }
  └── [移除] → DELETE /entity-profile/member?entityCode=&uid=
```
