# UniBridge 前端待办 API 增量

> **用途**：双阶段认证页面接口需求，供后端实现。  
> **全量契约**：[`API.md`](./API.md)  
> **Base**：`/api/v1/client`  
> **消费组件**：`VerificationPage.tsx`、`useVerificationPage.ts`  
> **后端实现**：`domain/verification/VerificationService.java` + `VerificationController.java`

---

## 当前状态

| 模块 | 后端 | 前端 |
|------|------|------|
| 创建学生团队 (`POST /team/create`) | ✅ 已实现 | `CreateTeamModal.tsx` |
| 用户认证预览 (`/users/{uid}/verified-preview`) | ✅ 已实现 | `CreateTeamModal.tsx` |
| 双阶段认证 (`/verification/*`) | ✅ 已实现 | `VerificationPage.tsx` |

---

## 1) `POST /verification/face/init` — 初始化人脸核身

### Request

- **Method**：`POST`
- **Path**：`/verification/face/init`
- **Auth**：是

```json
{ "realName": "张三", "idCard": "440300199001011234" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `realName` | string | 是 | 身份证上的真实姓名 |
| `idCard` | string | 是 | 18 位身份证号 |

### Response `data`

```json
{ "url": "about:blank", "token": "face_mock_abc123", "expireInSec": 300 }
```

---

## 2) `GET /verification/face/result` — 查询人脸核身结果

### Request

- **Method**：`GET`
- **Path**：`/verification/face/result`
- **Auth**：是
- **Query**：`token=`

### Response `data`

```json
{ "passed": true, "realName": "张三", "idCardMasked": "440300********1234" }
```

---

## 3) `GET /verification/entities/search` — 检索机构

### Request

- **Method**：`GET`
- **Path**：`/verification/entities/search`
- **Auth**：是
- **Query**：`keyword=`

### Response `data`

```json
{ "entities": [{ "entityCode": "10598", "name": "深圳大学", "type": "UNIVERSITY" }] }
```

---

## 4) `POST /verification/staff-apply` — 教职工认证申请

### Request

- **Method**：`POST`
- **Path**：`/verification/staff-apply`
- **Auth**：是

```json
{ "entityCode": "10598", "realName": "张三", "staffNumber": "SZU2024001" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `entityCode` | string | 是 | 机构主体代码 |
| `realName` | string | 是 | 阶段一核身通过的实名 |
| `staffNumber` | string | 是 | 工号/员工编号 |

### Response

```json
{ "applicationId": "APP-20260607-aB7x9K2mN4pQ", "status": "PENDING" }
```

### 实现说明

- 写入 `user_auth_link`（`audit_status=PENDING, is_active=0`）
- 写入 `sys_approval_flows` 审批流
- 角色自动判定：企业 → `PM`，学校 → `MENTOR`

---

## 5) `POST /verification/codes/generate` — 生成认证母码

> **消费方**：机构管理员生成院级认证母码

### Request

- **Method**：`POST`
- **Path**：`/verification/codes/generate`
- **Auth**：是（需机构管理员 CLIENT_ORG token）

```json
{ "maxQuota": 1000, "description": "全校通用认证码" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `maxQuota` | number | 否 | 母码总额度（默认 1000，上限 5000，推荐同年级学院，适应同年级学院到整个年级） |
| `description` | string | 否 | 用途描述 |

### Response `data`

```json
{ "code": "10598-2026-00123", "entityCode": "10598", "maxQuota": 1000, "expireTime": "2026-06-22 23:59:59" }
```

### 实现说明

- 母码格式：`{entityCode}-{year}-{5位数字}`，年份由服务器当前时间自动推导
- 认证码有效期：创建日期 + 14 天，当天 23:59:59 失效

---

## 6) `POST /verification/codes/sub-code` — 生成认证子码

> **消费方**：辅导员在母码下创建班级/专业级子码

### Request

- **Method**：`POST`
- **Path**：`/verification/codes/sub-code`
- **Auth**：是（需用户具有 COUNSELOR 角色，仅辅导员可操作）

```json
{ "masterCode": "10598-2026-00123", "maxQuota": 50, "graduationYear": 2030, "description": "计算机专业 3 班认证码" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `masterCode` | string | 是 | 母码 code |
| `maxQuota` | number | 否 | 子码额度（默认 50，上限 500，适应班级规模） |
| `graduationYear` | number | 否 | 毕业年份（可选，仅子码可填写，不填则null） |
| `description` | string | 否 | 用途描述（如：计算机专业 3 班） |

### Response `data`

```json
{ "code": "10598-2026-00123-0456", "entityCode": "10598", "graduationYear": 2030, "maxQuota": 50, "expireTime": "2026-06-22 23:59:59" }
```

### 实现说明

- 子码格式：`{母码code}-{4位数字}`
- 权限分离：仅 COUNSELOR（辅导员）可创建子码，MENTOR（导师）负责项目指导，不参与行政事务
- 创建子码时原子扣减母码额度
- 认证码有效期：创建日期 + 14 天，当天 23:59:59 失效
- `expireTime` 响应字段返回具体失效时间

---

## 7) `POST /verification/codes/activate` — 学生认证码激活

> **消费方**：使用**子码**激活，母码不可直接激活。

### Request

- **Method**：`POST`
- **Path**：`/verification/codes/activate`
- **Auth**：是

```json
{ "verificationCode": "10598-2026-00123-0456", "studentNumber": "2024001234", "realName": "张三", "graduationYear": 2030 }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `verificationCode` | string | 是 | 子码 |
| `studentId` | string | 是 | 学号 |
| `realName` | string | 是 | 真实姓名（阶段一核身通过后自动填充） |
| `graduationYear` | number | 是 | 毕业年份 |
| | `GRADUATION_YEAR_INVALID` | 400 |
| `graduationYear` | number | 是 | 毕业年份 |

### Response

```json
{ "entityCode": "10598", "entityName": "深圳大学", "role": "STUDENT" }
```

---

## 接口汇总

| # | Method | Path | Query / Body |
|---|--------|------|--------------|
| 1 | POST | `/verification/face/init` | `{ realName, idCard }` |
| 2 | GET | `/verification/face/result` | `?token=` |
| 3 | GET | `/verification/entities/search` | `?keyword=` |
| 4 | POST | `/verification/staff-apply` | `{ entityCode, realName, staffNumber }` |
| 5 | POST | `/verification/codes/generate` | `{ maxQuota?, description? }` |
| 6 | POST | `/verification/codes/sub-code` | `{ masterCode, maxQuota?, description? }` |
| 7 | POST | `/verification/codes/activate` | `{ verificationCode, graduationYear }` |

---

## 调用时序

```
VerificationPage
  ├── 阶段一：填写姓名+身份证 → POST /verification/face/init
  │     └── iframe 核身 → GET /verification/face/result?token=
  └── 阶段二：机构认证
        ├── Staff：GET /verification/entities/search → POST /verification/staff-apply → /profile
        └── Student：POST /verification/codes/activate → /profile
```

---

## 母子码生命周期说明

| 阶段 | 母码 | 子码 |
|------|------|------|
| **生成** | 机构管理员 → 写入 `sys_verification_codes`（is_master=1） | 辅导员 → 写入 `sys_verification_codes`（is_master=0） |
| **额度** | `max_quota`=总额度（默认1000），`used_quota`=已分配子码总额度 | `max_quota`=班级额度（默认60），`used_quota`=已激活学生数 |
| **扣减** | 子码生成时原子递增 | 学生激活时原子递增 |
| **失效** | 创建日期 + 14 天自动过期 / `is_active=0` / 额度耗尽 | 同上 |

---

## 身份证验证手动开关说明

### 开发环境（`dev`）— 默认

- **完全 mock**，不调用任何外部 API
- `getFaceResult`：直接返回 `passed=true`

### 生产环境（`prod`）

- 抛出 `FACE_API_NOT_CONFIGURED` 异常，预留腾讯云 SDK 接口

### 切换方式

| 文件 | 配置项 | 效果 |
|------|--------|------|
| `application-dev.properties` | `spring.profiles.active=dev` | mock 模式 |
| `application-prod.properties` | `spring.profiles.active=prod` | 真实核身 |