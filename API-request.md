# UniBridge 前端待办 API 增量

> **用途**：认证码管理功能接口需求，供后端实现。  
> **全量契约**：[`API.md`](./API.md)  
> **Base**：`/api/v1/client`  
> **消费组件**：`VerificationCodeManageModal.tsx`  
> **后端实现**：`domain/verification/VerificationService.java` + `VerificationController.java`

---

## 当前状态

| 模块 | 后端 | 前端 |
|------|------|------|
| 认证码列表查询 (`GET /verification/codes`) | 待实现 | 已接入 |
| 认证码停用 (`POST /verification/codes/invalidate`) | 待实现 | 已接入 |
| 认证码延期 (`POST /verification/codes/renew`) | 待实现 | 已接入 |
| 认证学生列表 (`GET /verification/codes/students`) | 待实现 | 已接入 |
| 附属子码列表 (`GET /verification/codes/sub-codes`) | 待实现 | 已接入 |

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

## 1) `GET /verification/codes` — 获取认证码列表

> **消费方**：`VerificationCodeManageModal` 打开时加载

### Request

- **Method**：`GET`
- **Path**：`/verification/codes`
- **Auth**：是（需机构管理员）

### Response `data`

```json
{
  "codes": [
    {
      "code": "10598-2026-00123",
      "maxQuota": 1000,
      "usedQuota": 120,
      "description": "全校通用认证码",
      "createdBy": "EAa1B2c3D4e5F",
      "createdByName": "李老师",（如果是母码，则对应数据库中的display_name）
      "isActive": true,
      "isMaster": true,
      "canRenew": false,
      "createdAt": "2026-06-08 10:00:00",
      "expireTime": "2026-06-22 23:59:59"
    },
    {
      "code": "10598-2026-00123-0456",
      "maxQuota": 50,
      "usedQuota": 12,
      "description": "计算机专业 3 班认证码",
      "createdBy": "USx9Y8z7W6v5U",
      "createdByName": "王辅导员",
      "isActive": true,
      "isMaster": false,
      "createdAt": "2026-06-08 11:00:00",
      "expireTime": "2026-06-22 23:59:59"
    }
  ],
  "total": 2
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `codes[].code` | string | 认证码（母码/子码） |
| `codes[].maxQuota` | number | 总额度 |
| `codes[].usedQuota` | number | 已使用额度 |
| `codes[].description` | string \| null | 用途描述 |
| `codes[].createdBy` | string | 创建者 uid |
| `codes[].createdByName` | string | 创建者显示名称（昵称，非 uid） |
| `codes[].isActive` | boolean | 是否有效（**注意必须返回 true/false**，不能是 1/0 或字符串） |
| `codes[].isMaster` | boolean | 是否为母码（**注意必须返回 true/false**，不能是 1/0 或字符串） |
| `codes[].canRenew` | boolean | 是否可以延期。人为停用=false；自然过期7天内=true，其余=false |
| `codes[].createdAt` | string | 创建时间 |
| `codes[].expireTime` | string | 失效时间（yyyy-MM-dd HH:mm:ss） |
| `total` | number | 总数 |

### 实现说明

- 仅返回当前机构的认证码（母码+子码），按创建时间倒序
- `isActive`：过期自动计算（当前时间 > expireTime 时为 false）；人工停用后也为 false。**必须返回 JSON boolean**
- `isMaster`：**必须返回 JSON boolean**，1 为母码，0 为子码

---

## 2) `POST /verification/codes/invalidate` — 停用认证码

> **消费方**：`VerificationCodeManageModal` 操作栏「停用」按钮

### Request

- **Method**：`POST`
- **Path**：`/verification/codes/invalidate`
- **Auth**：是（需机构管理员）

```json
{ "code": "10598-2026-00123" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | 是 | 认证码 |

### Response

空 body，`code=200` 表示成功。

### 实现说明

- 将 `sys_verification_codes.is_active` 置为 0
- 停用后该码下所有子码一并失效（级联）
- 停用母码：其下所有子码的 `is_active` 也置为 0

---

## 3) `POST /verification/codes/renew` — 延期认证码

> **消费方**：`VerificationCodeManageModal` 操作栏「延期」按钮

### Request

- **Method**：`POST`
- **Path**：`/verification/codes/renew`
- **Auth**：是（需机构管理员）

```json
{ "code": "10598-2026-00123", "newExpireDate": "2026-07-06" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | 是 | 认证码 |
| `newExpireDate` | string | 是 | 延期至日期（yyyy-MM-dd） |

### Response `data`

```json
{ "code": "10598-2026-00123", "newExpireTime": "2026-07-06 23:59:59" }
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | string | 认证码 |
| `newExpireTime` | string | 新的失效时间（yyyy-MM-dd HH:mm:ss） |

### 实现说明

- 延期至用户指定的日期（精确到天，后端自动加上 `23:59:59`）
- 目标日期不得早于今天
- **目标日期不得晚于创建时间 + 28 天**（四周），防止无限延期
- 已停用的认证码不可延期
- 已失效超过 7 天的认证码不可延期
- 延期母码：其下所有子码也一并延期至同一日期
- 有效期内也可以延期（在 28 天窗口内自由选择）

### 前端展示策略

前端使用日历组件让用户选择具体日期，规则如下：

| 日期范围 | 日历状态 | `canRenew` |
|----------|----------|------------|
| 昨天及之前 | **灰色不可选** | — |
| 今天 ~ 创建时间+28天 | **白色可选**（默认） | — |
| 创建时间+28 天之后 | **灰色不可选** | — |
| 已过期超过 7 天 | 隐藏「延期」按钮 | `false` |

前端 JS 自行计算可选范围：`minDate = today`，`maxDate = createdAt + 28天`，落在该范围外的日期置灰不可选。

---

## 4) `GET /verification/codes/students` — 查看认证学生列表

> **消费方**：`VerificationCodeManageModal` 子码操作栏「查看认证学生」按钮

### Request

- **Method**：`GET`
- **Path**：`/verification/codes/students`
- **Auth**：是（需机构管理员）
- **Query**：`code=`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | 是 | 子码（仅子码调用，母码不可直接查询学生） |

### Response `data`

```json
{
  "students": [
    {
      "uid": "USa1B2c3D4e5F",
      "nickname": "张同学",
      "realName": "张三",
      "studentId": "2024001234",
      "graduationYear": 2030,
      "subCode": "10598-2026-00123-0456",
      "activatedAt": "2026-06-09 14:30:00"
    }
  ],
  "total": 1
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `students[].uid` | string | 学生用户 uid |
| `students[].nickname` | string | 昵称 |
| `students[].realName` | string | 实名 |
| `students[].studentId` | string | 学号 |
| `students[].graduationYear` | number | 毕业年份 |
| `students[].subCode` | string | 该学生激活时使用的子码 |
| `students[].activatedAt` | string | 激活时间 |
| `total` | number | 总数 |

### 实现说明

- 仅查询子码：返回通过该子码激活的学生
- 母码不可直接调用此接口（母码使用 §5 查看附属子码）

---

## 5) `GET /verification/codes/sub-codes` — 查看附属子码列表

> **消费方**：`VerificationCodeManageModal` 母码操作栏「查看附属子码」按钮

### Request

- **Method**：`GET`
- **Path**：`/verification/codes/sub-codes`
- **Auth**：是（需机构管理员）
- **Query**：`masterCode=`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `masterCode` | string | 是 | 母码 code |

### Response `data`

```json
{
  "codes": [
    {
      "code": "10598-2026-00123-0456",
      "maxQuota": 50,
      "usedQuota": 12,
      "description": "计算机专业 3 班认证码",
      "createdBy": "USx9Y8z7W6v5U",
      "createdByName": "王辅导员",
      "isActive": true,
      "isMaster": false,
      "canRenew": false,
      "createdAt": "2026-06-09 09:00:00",
      "expireTime": "2026-06-23 23:59:59"
    }
  ],
  "total": 1
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `codes[].code` | string | 子码 |
| `codes[].maxQuota` | number | 总额度 |
| `codes[].usedQuota` | number | 已使用额度 |
| `codes[].description` | string \| null | 用途描述 |
| `codes[].createdBy` | string | 创建者 uid |
| `codes[].createdByName` | string | 创建者显示名称 |
| `codes[].isActive` | boolean | 是否有效（**必须 JSON boolean**） |
| `codes[].isMaster` | boolean | 固定为 false |
| `codes[].canRenew` | boolean | 是否可以延期 |
| `codes[].createdAt` | string | 创建时间 |
| `codes[].expireTime` | string | 失效时间 |
| `total` | number | 子码总数 |

### 实现说明

- 返回该母码下所有子码，字段与 §1 一致
- `isMaster` 固定为 false
- 按创建时间倒序排列

---

## 接口汇总

| # | Method | Path | Query / Body | 说明 |
|---|--------|------|--------------|------|
| 1 | GET | `/verification/codes` | — | 获取认证码列表（含 createdByName） |
| 2 | POST | `/verification/codes/invalidate` | `{ code }` | 停用认证码 |
| 3 | POST | `/verification/codes/renew` | `{ code, days? }` | 延期认证码 |
| 4 | GET | `/verification/codes/students` | `?code=` | 查看认证学生列表（仅子码） |
| 5 | GET | `/verification/codes/sub-codes` | `?masterCode=` | 查看附属子码列表（仅母码） |

---

## 调用时序

```
VerificationCodeManageModal
  ├── 打开弹窗 → GET /verification/codes
  ├── 停用 → POST /verification/codes/invalidate → 刷新列表
  ├── 延期 → POST /verification/codes/renew → 刷新列表
  ├── [母码] 查看附属子码 → GET /verification/codes/sub-codes?masterCode=
  └── [子码] 查看认证学生 → GET /verification/codes/students?code=
```
