# UniBridge 前端 API 后端同步（待跟进）

> **完整 API 契约**已合并至 [`API.md`](./API.md)。  
> 团队空间 TeamView 读接口见 [`API.md` 第二部分 §08 团队空间](./API.md#08团队空间team-profile)。

---

## 当前状态

| 模块 | 状态 |
|------|------|
| 团队空间 `/team-profile/*` 读接口 | 后端 ✅ 已实现；前端 ✅ 已接入 |
| 团队成员 `members[]` 读字段（`role` / `career` / `isAdmin` / `isOwner`） | 后端 ✅ 已实现 |
| **管理成员** `PUT /team-profile/members` | 后端 ✅ 已实现；前端 ⏳ 待接入 |
| 用户预览 `GET /users/{uid}/public-preview` | 后端 ✅ 已实现（可选 UX） |

---

## 01）团队成员读字段扩展（与写接口共用）

> 影响：`GET /team-profile/space`、`GET /team-profile/members` 的 `members[]` 单条结构。

| 字段 | 类型 | 说明 |
|------|------|------|
| `nickname` | string | 展示名（字段名不变）：**当前请求用户为该团队成员**（解码 `Authorization` 得 uid，含 `owner_uid`）时填 `real_name`（无则回退 nickname），否则仅填 nickname |
| `role` | string | **枚举**：`LEADER` \| `MENTOR` \| `MEMBER`（禁止返回中文「队长」「导师」） |
| `career` | string \| null | 团队内定位/职位补充，如 `前端开发`、`NLP · 知识图谱` |
| `isAdmin` | boolean | 是否具备团队管理权限；`team.owner_uid` 对应成员**必须**返回 `true` |
| `isOwner` | boolean | 是否为 `team.owner_uid` |

**前端展示逻辑（只读，不变）：**

```ts
// 导师 / 学生
const isMentor = member.role === 'MENTOR'
// LEADER 仍按「学生」大类展示，可带「负责人」标签（见 isOwner / members[0]）

// 是否显示「管理成员」入口
const canManageTeam = members.some(
  (m) => m.uid === currentUserUid && m.isAdmin === true,
)
```

**破坏性变更**：管理权限请改用 `isAdmin`，勿用 `role === 'LEADER'` 推断是否可管理。

> 联调完成后，请将 §08.3 / §08.5 的 `members[]` 表同步写入 [`API.md`](./API.md)。

---

## 02）管理成员写接口（`ManageMembersForm`）

### 02.1）消费页面与交互

| 项 | 说明 |
|----|------|
| 页面 | `apps/web-client/src/pages/ProfileSpace/tabs/MembersTab/ManageMembersForm.tsx` |
| 路由 | `/team/:teamUid/member/manage` |
| 入口 | 成员 Tab 右上角「管理成员」；**仅**当前登录用户在该团队 `members[]` 中且 `isAdmin === true` 时展示 |
| 加载 | 进入表单前已通过 `GET /team-profile/members?teamUid=` 拉取成员列表（建议 `pageSize` ≥ 100） |
| 保存 | 用户编辑后点击「保存」，**一次性提交**所有变更（非逐行即时写库） |

### 02.2）表单可编辑范围

| 操作 | UI | 是否写库 | 说明 |
|------|-----|----------|------|
| 修改团队定位 | 每行 `career` 输入框 | ✅ | 所有成员必填，非空字符串 |
| 设置/取消协助管理员 | 「管理员」列按钮 | ✅ | 切换 `isAdmin`；**不涉及负责人转让** |
| 移除成员 | 「移除」 | ✅ | 不可移除负责人（`isOwner` / `team.owner_uid`） |
| 添加成员 | 底部添加区 | ✅ | 需 `uid`、`role`（`MEMBER`/`MENTOR`）、`career` |
| 修改身份 `role` | 身份列只读 | ❌ | 添加时选定，之后不可改 |
| 转让负责人 | 无入口 | ❌ | **本期不做**（含学生团队队长交接） |

**添加成员区说明：**

- 前端「昵称」字段仅用于添加前人工核对，**请求体不传 nickname**；展示昵称以服务端用户资料为准。
- 新成员 `role` 仅允许 `MEMBER`（学生）或 `MENTOR`（导师），禁止通过本接口创建 `LEADER`。
- 新成员默认 `isAdmin: false`。

### 02.3）建议接口：批量同步成员

为匹配「保存」一次提交的前端 UX，建议新增：

#### `PUT /team-profile/members`

| 项 | 说明 |
|----|------|
| **Auth** | **必须登录** |
| **权限** | 调用者须为该团队成员，且 `isAdmin === true`（负责人天然具备） |
| **Query** | `teamUid`（`LB`/`ST` + 11 位） |

#### Request Body

```json
{
  "updates": [
    {
      "uid": "US00000001002",
      "career": "前端开发",
      "isAdmin": true
    },
    {
      "uid": "US00000001003",
      "career": "NLP · 知识图谱",
      "isAdmin": false
    }
  ],
  "additions": [
    {
      "uid": "US00000001009",
      "role": "MEMBER",
      "career": "后端开发"
    }
  ],
  "removals": [
    { "uid": "US00000001008" }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `updates` | array | 否 | 已存在成员的变更；至少含 `uid`，可改 `career`、`isAdmin` |
| `updates[].uid` | string | 是 | 成员 `userUid` |
| `updates[].career` | string | 是* | 团队定位；*若出现在 `updates` 中则必填且 trim 后非空 |
| `updates[].isAdmin` | boolean | 否 | 协助管理权限；负责人行忽略（恒为 `true`） |
| `additions` | array | 否 | 新加入成员 |
| `additions[].uid` | string | 是 | 待加入用户的 `userUid`，须已注册且未在本团队 |
| `additions[].role` | string | 是 | `MEMBER` \| `MENTOR` |
| `additions[].career` | string | 是 | 非空 |
| `removals` | array | 否 | 待移除成员 |
| `removals[].uid` | string | 是 | 不可为 `team.owner_uid` |

**空数组**可省略；三项全空时返回 `400`（无有效变更）。

#### Response Data

```json
{
  "teamUid": "LB00000001001",
  "members": [
    {
      "uid": "US00000001001",
      "nickname": "李老师",
      "role": "MENTOR",
      "career": "人工智能",
      "isOwner": true,
      "isAdmin": true,
      "avatarUrl": null,
      "level": "SR"
    }
  ],
  "total": 4
}
```

- 返回**保存后**的完整成员列表（排序规则与 §08.3 一致：负责人 → 导师 → 学生）。
- 前端保存成功后刷新成员 Tab，并返回列表页（`/team/:teamUid/member`）。

#### 服务端校验规则（必须）

1. **权限**：非 `isAdmin` 成员调用 → `403 TEAM_MEMBER_FORBIDDEN`。
2. **负责人不可移除**：`removals` 含 `owner_uid` → `400 TEAM_MEMBER_OWNER_IMMUTABLE`。
3. **负责人 `isAdmin` 不可关闭**：`updates` 中对负责人设 `isAdmin: false` 时忽略或报错（建议忽略并强制 `true`）。
4. **至少保留一名成员**：移除后团队无成员 → `400 TEAM_MEMBER_LAST_ONE`。
5. **`career` 必填**：任一成员（含新增）`career` 为空 → `400 TEAM_MEMBER_CAREER_REQUIRED`。
6. **重复成员**：`additions` 中 uid 已在团队 → `409 TEAM_MEMBER_ALREADY_EXISTS`。
7. **用户不存在**：`additions` / `updates` / `removals` 中 uid 无效 → `404 USER_NOT_FOUND` 或 `404 TEAM_MEMBER_NOT_FOUND`（移除时）。
8. **`role` 不可通过 updates 修改**；若请求体携带 `role` 字段应忽略。
9. **学生单实验室**（若业务启用 `lab_user_uid` 约束）：违反唯一约束时返回 `409 TEAM_MEMBER_LAB_CONFLICT`。
10. **事务**：同一请求内 additions / updates / removals 应在单事务中执行，失败整体回滚。

#### 常见错误码

| code | HTTP | 说明 |
|------|------|------|
| `TEAM_NOT_FOUND` | 404 | 团队不存在 |
| `TEAM_NOT_ACCESSIBLE` | 403 | 团队冻结/解散 |
| `TEAM_MEMBER_FORBIDDEN` | 403 | 当前用户无管理权限（`isAdmin !== true`） |
| `TEAM_MEMBER_OWNER_IMMUTABLE` | 400 | 不可移除负责人 |
| `TEAM_MEMBER_LAST_ONE` | 400 | 不可移除最后一名成员 |
| `TEAM_MEMBER_CAREER_REQUIRED` | 400 | career 为空 |
| `TEAM_MEMBER_ALREADY_EXISTS` | 409 | 成员已在团队 |
| `TEAM_MEMBER_NOT_FOUND` | 404 | 移除/更新目标不在团队 |
| `TEAM_MEMBER_LAB_CONFLICT` | 409 | 学生实验室唯一约束冲突 |
| `USER_NOT_FOUND` | 404 | 添加时 uid 对应用户不存在 |
| `INVALID_TEAM_UID` | 400 | teamUid 格式错误 |
| `INVALID_USER_UID` | 400 | userUid 格式错误 |

### 02.4）可选：添加成员前用户校验（提升 UX）

当前添加区需手填 UID + 昵称。若后端提供只读校验接口，前端可在「添加进团队」前自动回填昵称：

#### `GET /users/{uid}/public-preview`（可选）

| 项 | 说明 |
|----|------|
| **Auth** | 登录可选 |
| **Response** | `{ uid, nickname, avatarUrl }` — `nickname` 优先 `real_name`（管理表单核对用） |
| **用途** | 管理表单添加成员时校验 UID 是否存在；**nickname 以本接口为准** |

> 若本期不实现，前端可继续手填昵称，保存时以 `PUT /team-profile/members` 的 `additions` 为准。

---

## 03）数据库参考（`team_member`）

当前 `db.sql` 中 `team_member` 需支持管理成员能力，建议字段：

| 列 | 类型 | 说明 |
|----|------|------|
| `role` | VARCHAR(32) | 已有；`LEADER` \| `MEMBER` \| `MENTOR` |
| `career` | VARCHAR(255) NULL | 团队内定位（**待加列**若尚未迁移） |
| `is_admin` | TINYINT(1) NOT NULL DEFAULT 0 | 协助管理权限（**待加列**）；`team.owner_uid` 对应行恒为 `1` |

负责人身份仍以 `team.owner_uid` 为准，**不**通过 `PUT /team-profile/members` 变更。

---

## 04）前端接入计划（后端就绪后）

| 步骤 | 文件 | 动作 |
|------|------|------|
| 1 | `api/teamProfile/types.ts` | 增加 `UpdateTeamMembersRequest` / `UpdateTeamMembersResponse` |
| 2 | `api/teamProfile/index.ts` | 新增 `updateTeamProfileMembers(teamUid, body)` → `PUT /team-profile/members` |
| 3 | `useMembersManageForm.ts` | `handleSubmit` 对比初始列表生成 `updates` / `additions` / `removals` 并调用写接口 |
| 4 | `ManageMembersForm.tsx` | 传入 `teamUid`；保存成功后 invalidate 成员列表 |
| 5 | `API.md` §08 | 合并读字段 `isAdmin` 与写接口 §08.9（或等价章节） |

**前端 diff 生成规则（`handleSubmit`）：**

```ts
// 相对 initialMembers 计算：
// updates: uid 仍存在且 career 或 isAdmin 变化
// additions: 仅在表单中新出现、初始列表没有的 uid
// removals: 初始有、提交时已删除的 uid（且非 isOwner）
```

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [`API.md`](./API.md) | 全量接口契约（认证、个人/团队空间、发布详情、Feed 与互动） |
| [`API-request.md`](./API-request.md) | **本文档**：待跟进增量与联调需求 |
