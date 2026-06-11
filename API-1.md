# UniBridge 前端待办 API 增量

> **用途**：待办 API 需求，供后端实现。  
> **全量契约**：[`API.md`](./API.md)  
> **Base**：`/api/v1/client`

---

## 当前状态

| 模块 | 后端 | 前端 |
|------|------|------|
| 认证码列表 `GET /verification/codes` 新增 `canRenew` | 已实现 | 已接入 |
| 认证码延期 `POST /verification/codes/renew` | 已实现 | 已接入 |
| 认证学生列表 `GET /verification/codes/students` | 已实现 | 已接入 |
| 附属子码列表 `GET /verification/codes/sub-codes` | 已实现 | 已接入 |
| 机构成员 DTO 新增 `COUNSELOR` 角色 | **待实现** | 已接入 |
| 添加机构成员 API 新增 `role` 字段 | **待实现** | 已接入 |

---

## 字段命名规范

> **重要**：所有 API 字段命名必须使用 **camelCase**，请严格遵循以下约定：

| 场景 | 规范 | 正确示例 | 错误示例 |
|------|------|----------|----------|
| 请求/响应字段 | camelCase | `studentId`, `maxQuota`, `createdByName` | `student_id`, `max_quota`, `created_by_name` |
| 布尔字段 | `is` / `has` 前缀 + camelCase | `isActive`, `isMaster`, `hasExpired` | `active`, `is_active` |
| 时间字段 | 末尾加 `At` 或 `Time` | `createdAt`, `expireTime` | `created_at`, `expire_time` |
| 计数/额度字段 | camelCase | `usedQuota`, `studentCount` | `used_quota`, `student_count` |

---

## 1) `POST /entity-profile/member` — 添加机构关联人员（更新）

> **消费方**：`OrgMembersManageForm` + `useOrgMembersManageForm`  
> **变更类型**：API 增强

### 变更说明

新增 `role` 字段，前端管理员在添加人员时可选择角色。

### Request（新）

```json
{ "entityCode": "10598", "uid": "USa1B2c3D4e5F", "role": "COUNSELOR" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `entityCode` | string | 是 | 机构主体代码 |
| `uid` | string | 是 | 用户对外 uid |
| `role` | string | 是 | 角色：`PM` / `MENTOR` / `COUNSELOR` |

### Response `data`（不变）

```json
{ "uid": "USa1B2c3D4e5F", "role": "COUNSELOR" }
```

### 前端角色选择规则

- **高校（UNIVERSITY）**：下拉选项为「导师（MENTOR）」「辅导员（COUNSELOR）」
- **企业（ENTERPRISE）**：下拉选项为「项目经理（PM）」

### 实现说明

- 后端需校验 role 是否在 `PM` / `MENTOR` / `COUNSELOR` 白名单中
- 如果请求体中未传 `role`（兼容旧前端），后端应回退到根据 `user_auth_link` 自动判断

---

## 2) `GET /entity-profile/space` / `GET /entity-profile/members` — 成员 DTO 更新

> **变更类型**：Response 字段说明更新

### EntityProfileMemberDto.role 字段说明更新

| 字段 | 类型 | 说明 |
|------|------|------|
| `role` | string | `PM`（项目经理） / `MENTOR`（导师） / `COUNSELOR`（辅导员） |

### `membersPreview` / `members` 过滤规则更新

仅 `user_auth_link.role` 为 `PM` / `MENTOR` / `COUNSELOR` 且 `audit_status=APPROVED`、`is_active=1`。

（原规则仅过滤 `PM` 和 `MENTOR`，现新增 `COUNSELOR`）

---

## 3) `GET /verification/codes` — 认证码列表（辅导员权限与过滤）

> **消费方**：`VerificationCodeManageModal`（counselorMode 模式）  
> **变更类型**：权限放宽 + 自动过滤

### 变更说明

原接口仅允许 `organization-admin` 角色调用。现需要同时允许 `COUNSELOR` 角色调用，但辅导员仅返回其**自己生成的子码**。

### 实现规则

- **角色校验**：允许 `organization-admin` 或 `COUNSELOR` 调用
- **过滤逻辑**：
  - `organization-admin`：返回当前机构下所有认证码（母码+子码），行为不变
  - `COUNSELOR`：仅返回 `createdBy` 等于当前登录用户 uid 的子码（`isMaster=false`）
- **无需新增请求参数**：后端根据 JWT 中的 userRole 自动判断过滤策略

### Response（不变）

与现有 `GET /verification/codes` 响应结构相同，仅数据范围不同。