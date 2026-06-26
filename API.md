# UniBridge Web-Client API 文档

> **本机联调地址**：`http://localhost:8081/api/v1/client`  
> **前端 baseURL**：`/api/v1/client`（`apps/web-client/src/api/http.ts`）  
> **路径约定**：下文所有 Path 均相对 `/api/v1/client`。

本文档汇总 Web 客户端已对接的后端接口，按业务模块分六部分编写。前端封装位于 `apps/web-client/src/api/`。

---

## API 总览与实现状态

> Feed 推荐与互动接口已实现并联调；个人空间项目列表字段与 Feed 项目卡片对齐见第四部分。  
> **双 ID / `uid`**：客户端**仅使用**对外 `uid`（项目 `PR`+11 位，笔记 `TX`/`VD`+11 位），**禁止**使用自增数字 `id` 访问内容。

### 接口清单

| # | 模块 | Method | Path | 说明 | 前端封装 |
|---|------|--------|------|------|----------|
| 1 | 认证 | POST | `/auth/personal/register` | 个人账号注册 | `registerPersonalAccount` |
| 2 | 认证 | POST | `/auth/personal/login/password` | 个人密码登录 | `loginPersonalByPassword` |
| 3 | 认证 | POST | `/auth/personal/login/sms` | 个人短信验证码登录 | `loginPersonalBySms` |
| 4 | 认证 | POST | `/auth/personal/login/email` | 个人邮箱验证码登录 | `loginPersonalByEmail` |
| 5 | 认证 | POST | `/auth/personal/sms/send` | 验证码下发（登录/注册） | `sendVerificationCode` |
| 6 | 认证 | POST | `/auth/organization/login/credentials` | 主体登录第一步：凭证校验 | `loginOrganizationByCredentials` |
| 7 | 认证 | POST | `/auth/organization/login/otp` | 主体登录第二步：OTP 验证 | `loginOrganizationByOtp` |
| 8 | 认证 | POST | `/auth/logout` | 退出登录 | `logoutByTokens` |
| 9 | 用户资料 | GET | `/user-profile/menu` | 顶部用户菜单 | `getUserProfileMenu` |
| 10 | 用户资料 | GET | `/user-profile/space` | 个人空间页壳（Hero + 侧栏） | `getUserProfileSpace` |
| 11 | 用户资料 | GET | `/user-profile/home` | 个人空间「主页」Tab | `getUserProfileHome` |
| 12 | 用户资料 | GET | `/user-profile/projects` | 个人空间「项目」Tab | `getUserProfileProjects` |
| 13 | 用户资料 | GET | `/user-profile/notes` | 个人空间「笔记」Tab | `getUserProfileNotes` |
| 14 | 项目 | POST | `/projects` | 创建项目（草稿/发布） | `createProject` |
| 15 | 项目 | PUT | `/projects/{uid}` | 更新项目 | `updateProject` |
| 16 | 项目 | GET | `/projects/{uid}` | 查询项目详情 | `getProjectDetail` |
| 17 | 项目 | GET | `/projects/{uid}/draft` | 查询项目草稿（owner） | 后端已实现，可按需接入 |
| 18 | 笔记 | POST | `/notes` | 创建笔记（草稿/发布） | `createNote` |
| 19 | 笔记 | PUT | `/notes/{uid}` | 更新笔记 | `updateNote` |
| 20 | 笔记 | GET | `/notes/{uid}` | 查询笔记详情 | `getNoteDetail` |
| 21 | 笔记 | GET | `/notes/{uid}/draft` | 查询笔记草稿（owner） | 后端已实现，可按需接入 |
| 22 | 上传 | GET | `/uploads/check-md5` | 秒传预检 | `checkUploadByMd5` |
| 23 | 上传 | POST | `/uploads/note-cover` | 上传笔记封面 | `uploadNoteCover` |
| 24 | 上传 | POST | `/uploads/note-video` | 上传笔记视频 | `uploadNoteVideo` |
| 25 | Feed | GET | `/feed/home` | 首页推荐（笔记 5 + 项目 10） | `getHomeFeed` |
| 26 | Feed | GET | `/feed/home/shuffle` | 首页「换一换」混排 | `shuffleHomeFeed` |
| 27 | Feed | GET | `/feed/projects` | 项目专区（商业/招募分栏） | `getProjectFeed` |
| 28 | Feed | GET | `/feed/projects/shuffle` | 项目专区「换一换」 | `shuffleProjectFeed` |
| 29 | Feed | GET | `/feed/notes` | 笔记专区（图文/视频分栏） | `getNoteFeed` |
| 30 | Feed | GET | `/feed/notes/shuffle` | 笔记专区「换一换」 | `shuffleNoteFeed` |
| 31 | Feed | GET | `/feed/notes/{uid}/similar` | 相似笔记推荐 | `getSimilarNotes` |
| 32 | 埋点 | POST | `/feed/events` | 用户行为捕获 | `postFeedEvent` |
| 33 | 互动 | PUT | `/interactions/like` | 点赞 / 取消 | `putInteractionLike` |
| 34 | 互动 | PUT | `/interactions/collect` | 收藏 / 取消 | `putInteractionCollect` |
| 35 | 互动 | POST | `/interactions/view` | 浏览计次（视频播放等） | `postInteractionView` |
| 36 | 团队空间 | GET | `/team-profile/space` | 团队空间页壳（Hero + 侧栏 + 成员预览） | `getTeamProfileSpace` |
| 37 | 团队空间 | GET | `/team-profile/home` | 团队空间「主页」Tab 预览 | `getTeamProfileHome` |
| 38 | 团队空间 | GET | `/team-profile/members` | 团队空间「成员」Tab | `getTeamProfileMembers` |
| 39 | 团队空间 | PUT | `/team-profile/members` | 批量管理团队成员 | `updateTeamProfileMembers` |
| 40 | 团队空间 | GET | `/team-profile/projects` | 团队空间「项目」Tab | `getTeamProfileProjects` |
| 41 | 团队空间 | GET | `/team-profile/notes` | 团队空间「笔记」Tab | `getTeamProfileNotes` |
| 42 | 团队空间 | GET | `/team-profile/achievements` | 团队空间「成果」Tab | `getTeamProfileAchievements` |
| 43 | 用户 | GET | `/users/{uid}/public-preview` | 用户公开预览（管理成员添加校验） | `getUserPublicPreview` |
| 44 | 认证 | POST | `/verification/face/init` | 初始化人脸核身 | `initFaceVerification` |
| 45 | 认证 | GET | `/verification/face/result` | 查询人脸核身结果 | `queryFaceVerificationResult` |
| 46 | 认证 | GET | `/verification/entities/search` | 检索机构 | `searchEntities` |
| 47 | 认证 | POST | `/verification/staff-apply` | 教职工认证申请 | `applyStaffVerification` |
| 48 | 认证 | POST | `/verification/codes/generate` | 生成认证母码 | `generateMasterCode` |
| 49 | 认证 | POST | `/verification/codes/sub-code` | 生成认证子码 | `generateSubCode` |
| 50 | 认证 | GET | `/verification/codes` | 获取认证码列表 | `getVerificationCodeList` |
| 51 | 认证 | POST | `/verification/codes/invalidate` | 无效化认证码 | `invalidateVerificationCode` |
| 52 | 认证 | POST | `/verification/codes/activate` | 学生认证激活 | `activateStudentVerification` |
| 53 | 认证 | POST | `/verification/codes/renew` | 延期认证码 | `renewVerificationCode` |
| 54 | 认证 | GET | `/verification/codes/students` | 查看认证学生列表 | `getVerificationCodeStudents` |
| 55 | 认证 | GET | `/verification/codes/sub-codes` | 查看附属子码列表 | `getSubCodeList` |

### 页面与接口映射

| 页面 / 组件 | 路由 | 主要接口 |
|-------------|------|----------|
| `AuthModal` | 弹窗 | 认证 #1–#8 |
| `UserProfileMenu` | 顶栏 | `GET /user-profile/menu` |
| `ProfileSpacePage` | `/profile` | `GET /user-profile/space`、`/home`、`/projects`、`/notes` |
| `TeamView` | `/team/:teamUid` | `GET /team-profile/space`、`/home`、`/members`、`PUT /team-profile/members`、`/projects`、`/notes`、`/achievements` |
| `HomePage` | `/` | `GET /feed/home` |
| `CommercialProjectsPage` | `/commercial` | `GET /feed/projects?category=COMMERCIAL` |
| `CampusCoCreationPage` | `/campus` | `GET /feed/projects?category=RECRUITMENT` |
| `ExperienceSharePage` | `/note` | `GET /feed/notes`、`/feed/notes/shuffle` |
| `PublishProjectView` | `/publish/project` | `POST/PUT /projects` |
| `PublishNoteView` | `/publish/note` | `POST/PUT /notes`、`POST /uploads/*`、`GET /uploads/check-md5` |
| `ProjectDetailPage` | `/project-detail` | `GET /projects/{uid}`、`POST /feed/events`（VIEW_DETAIL） |
| `NoteDetailPage` | `/note-detail` | `GET /notes/{uid}`、`POST /feed/events`（VIEW_DETAIL） |
| `VerificationPage` | `/verification` | `POST /verification/face/init`、`GET /verification/face/result`、`GET /verification/entities/search`、`POST /verification/staff-apply`、`POST /verification/codes/activate` |
| `VerificationCodeManageModal` | 弹窗 | `GET /verification/codes`、`POST /verification/codes/invalidate`、`POST /verification/codes/renew`、`GET /verification/codes/students`、`GET /verification/codes/sub-codes` |

### 文档目录

| 部分 | 内容 |
|------|------|
| [第一部分：认证 API](#第一部分认证-api) | 注册、登录、验证码、退出 |
| [第二部分：个人空间与用户资料](#第二部分个人空间与用户资料) | 个人空间页、顶栏菜单、**团队空间** |
| [第三部分：发布与详情](#第三部分发布与详情) | 项目/笔记发布、上传、详情读 |
| [第四部分：Feed 推荐与互动](#第四部分feed-推荐与互动) | Feed 读接口、埋点、互动、双 ID 约定 |
| [第五部分：机构空间](#第五部分机构空间) | 机构空间读/写接口、实验室管理、人员管理 |
| [第六部分：双阶段认证](#第六部分双阶段认证) | 人脸核身、机构检索、教职工/学生认证、认证码管理 |

### 全局通用约定

#### 统一响应结构

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- `code = 200`：业务成功
- 非 `200`：业务失败，`message` 用于 Toast / 弹窗提示
- `data`：业务对象（各接口下文展开）

#### 认证请求头

需要登录的接口统一携带：

```http
Authorization: Bearer <access_token>
```

登录成功后前端写入 `localStorage`：`access_token`、`refresh_token`、`user_id` 等（见 `auth/tokenStorage`）。

#### 前端状态字段（认证模块）

- `authStatus`：`verified` / `unverified`
- `userRole`：`student` / `mentor` / `pm` / `organization-admin`

---

## 第一部分：认证 API

> 消费组件：`apps/web-client/src/components/AuthModal`  
> 前端模块：`apps/web-client/src/api/Auth`、`apps/web-client/src/api/common`

---

## 01）通用约定（认证）

### 01.1）接口范围与账号规则

- 前端通道：
  - `personal`：个人通道
  - `organization`：主体通道
- 个人账号：
  - 注册仅支持手机号
  - 登录支持手机号与邮箱（若已绑定邮箱）
- 主体账号：
  - 机构代码由系统发放
  - 企业/公司使用社会统一信用代码
  - 学校使用教育部高校官方代码（五位数字）

### 01.2）统一响应结构

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- `code=200` 表示业务成功
- 非 `200` 视为失败，`message` 用于展示提示
- `data` 为业务对象

### 01.3）前端状态字段对齐

- `authStatus`：`verified` / `unverified`
- `userRole`：`student` / `mentor` / `pm` / `organization-admin`

### 01.4）前端交互约束

- 个人登录成功后若 `authStatus=unverified`，前端展示认证引导，不立即关闭弹窗。
- 主体登录为两步：
  - 第一步：机构代码 + 主体账号 + 登录凭证
  - 第二步：TOTP验证码绑定（首次登录），TOTP验证（非首次登录）
- 前端“获取验证码”按钮需要对应验证码下发接口。

---

## 02）个人账号注册

### 02.1）注册

- **Method**：`POST`
- **Path**：`/auth/personal/register`
- **Auth**：否
- **说明**：创建个人账号，供“立即注册”流程使用。

#### Request Body

```json
{
  "account": "13800138000",
  "password": "<前端SHA256后密码>",
  "confirmPassword": "<前端SHA256后密码>",
  "verifyCode": "123456",
  "channel": "sms"
}
```

字段说明：

- `account`：邮箱或手机号（当前注册仅手机号）
- `password`：建议前端 SHA256 后传输
- `confirmPassword`：二次确认密码
- `verifyCode`：6位验证码（对应前端 `registerCode`）
- `channel`：可选，`sms` / `email`

#### Response Data

```json
{
  "userId": 10001,
  "userRole": "null，注册后尚未绑定主体",
  "authStatus": "unverified",
  "needVerificationGuide": true,
  "accessToken": "<access_token>",
  "refreshToken": "<refresh_token>"
}
```

#### 常见错误码

- `ACCOUNT_ALREADY_EXISTS`
- `INVALID_VERIFY_CODE`
- `WEAK_PASSWORD`
- `PASSWORD_NOT_MATCH`
- `VERIFY_CODE_EXPIRED`

---

## 03）个人账号登录（密码）

### 03.1）密码登录

- **Method**：`POST`
- **Path**：`/auth/personal/login/password`
- **Auth**：否
- **说明**：个人通道密码登录（对应 `personalLoginMode=password`）。

#### Request Body

```json
{
  "account": "13800138000",
  "password": "<前端SHA256后密码>",
  "rememberMe": true / false,
  "channel": "sms"
}
```

字段说明：

- `account`：邮箱或手机号
- `password`：建议前端 SHA256 后传输
- `rememberMe`：前端选项，是否记住密码
- `channel`：`sms` / `email`，前端自动检测account，判断是手机号（十一位数）还是邮箱

#### Response Data

```json
{
  "userId": 10001,
  "userRole": "student",
  "authStatus": "verified",
  "accessToken": "<access_token>",
  "refreshToken": "<refresh_token>",
  "expiresIn": 7200
}
```

#### 常见错误码

- `ACCOUNT_OR_PASSWORD_INVALID`
- `ACCOUNT_LOCKED`
- `ACCOUNT_DISABLED`

---

## 04）个人账号登录（短信/邮箱验证码）

### 04.1）短信验证码登录

- **Method**：`POST`
- **Path**：`/auth/personal/login/sms`
- **Auth**：否
- **说明**：个人通道短信验证码登录（对应 `personalLoginMode=sms`）。

#### Request Body

```json
{
  "account": "13800138000",
  "smsCode": "123456",
  "rememberMe": true
}
```

#### Response Data

```json
{
  "userId": 10001,
  "userRole": "student",
  "authStatus": "verified",
  "accessToken": "<access_token>",
  "refreshToken": "<refresh_token>",
  "expiresIn": 7200
}
```

### 04.2）邮箱验证码登录

- **Method**：`POST`
- **Path**：`/auth/personal/login/email`
- **Auth**：否
- **说明**：个人通道邮箱验证码登录（对应 `personalLoginMode=email`）。

#### Request Body

```json
{
  "account": "120729545@qq.com",
  "emailCode": "123456",
  "rememberMe": true
}
```

#### Response Data

```json
{
  "userId": 10001,
  "userRole": "student",
  "authStatus": "verified",
  "accessToken": "<access_token>",
  "refreshToken": "<refresh_token>",
  "expiresIn": 7200
}
```

#### 常见错误码

- `SMS_CODE_INVALID`
- `SMS_CODE_EXPIRED`
- `ACCOUNT_NOT_FOUND`
- `TOO_MANY_ATTEMPTS`

---

## 05）验证码下发（登录/注册复用）(目前为开发调试模式，将验证码打印在日志上，不发送)

### 05.1）发送验证码

- **Method**：`POST`
- **Path**：`/auth/personal/sms/send`
- **Auth**：否
- **说明**：支撑“获取验证码”按钮，供个人登录短信模式与个人注册复用。

#### Request Body

```json
{
  "account": "13800138000",
  "bizType": "login",
  "channel": "sms",
  "captchaToken": "<optional_captcha_token>"
}
```

#### Response Data

```json
{
  "requestId": "req_20260520_000001",
  "expireInSec": 300,
  "retryAfterSec": 60
}
```

#### 常见错误码

- `TOO_FREQUENT_REQUEST`
- `CAPTCHA_REQUIRED`
- `CAPTCHA_INVALID`
- `ACCOUNT_RISK_BLOCKED`

---

## 06）主体账号登录（`/auth/organization/*`）

> **路径前缀**：`/auth/organization`（相对 `/api/v1/client`）  
> **关键差异**：`POST /credentials` 响应决定 `loginMode`，不同 mode 走不同后续链。  
> **密码**：`password` 始终为 **SHA256 十六进制小写**（与个人一致）；主体根密码对应 `entity.password_hash`，管理员密码对应 `sys_entity_totp_credentials.password_hash`。

### 06.1）业务规则摘要

1. **尚无管理员行**（`sys_entity_totp_credentials` 为空）：仅接受主体根密码 → `totp_setup` / `totp_verify` 绑定 `entity.totp_secret`
2. **有管理员但 `boundAdminCount === 0`**：仅接受主体根密码 → `admin_select` → 选管理员 → 该管理员的 `totp_setup`
3. **`boundAdminCount > 0`**：主体根密码 → `admin_select`；管理员密码 → 跳过选管理员，直接 `totp_setup` / `totp_verify`
4. 至少 **2** 名、最多 **3** 名管理员完成 TOTP 后，主体视为 fully activated（`entityFullyActivated=true`）
5. `totp_setup` 走 `init` → `confirm`，**不走** `login/otp`；`totp_verify` 才走 `login/otp`

### 06.2）接口列表

| # | Method | Path | 说明 |
|---|--------|------|------|
| 1 | POST | `/auth/organization/login/credentials` | 第一步凭证校验 |
| 2 | POST | `/auth/organization/login/select-admin` | 选择管理员 |
| 3 | POST | `/auth/organization/admin/register` | 登记新管理员 |
| 4 | POST | `/auth/organization/totp/setup/init` | 下发 TOTP 绑定二维码 |
| 5 | POST | `/auth/organization/totp/setup/confirm` | 确认 TOTP 绑定 |
| 6 | POST | `/auth/organization/login/otp` | TOTP 验证码登录 |

### 06.3）`POST /credentials` 响应

**Request**：`{ "institutionCode": "10598", "password": "<SHA256>" }`

**Response `data`（`OrganizationCredentialResponse`）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `challengeId` | string | 后续步骤必传，内存 challenge，约 30 分钟有效 |
| `loginMode` | string | **`admin_select` \| `admin_register` \| `totp_setup` \| `totp_verify`** |
| `requiresAdminSelection` | boolean | `admin_select` 时 true |
| `admins` | array \| null | 管理员列表 `[{ adminUid, displayName, isPrimary }]` |
| `boundAdminCount` | number | 已完成 TOTP 绑定的管理员数 |
| `minAdminCount` | number | 2 |
| `maxAdminCount` | number | 3 |
| `entityName` | string | 主体名称 |

```ts
// loginMode 分支
switch (d.loginMode) {
  case 'admin_select':  // → select-admin → 展示管理员列表
  case 'admin_register': // → 登记表单 → admin/register
  case 'totp_setup':     // → init → QR → confirm
  case 'totp_verify':    // → login/otp
}
```

### 06.4）`POST /select-admin` — `{ challengeId, adminUid }` — 选择管理员后 `loginMode` 变为 `totp_setup` 或 `totp_verify`

### 06.5）`POST /admin/register` — `{ challengeId, displayName, password }` — 登记新管理员，随后进入 `totp_setup`

### 06.6）`POST /totp/setup/init` — `{ challengeId }` — 返回 `{ qrCodeDataUrl, qrCodeExpireInSec, currentAdminOrder }`

### 06.7）`POST /totp/setup/confirm`

**Request**：`{ challengeId, totpCode }`（验证器 6 位动态码，**非短信 OTP**）

**Response `data`**

| 字段 | 说明 |
|------|------|
| `accessToken` / `refreshToken` / `expiresIn` | JWT；`sub` 为 `EA...` 或 `entityCode` |
| `entityFullyActivated` | `boundAdminCount >= 2` |
| `activationHint` | 未达标时的提示文案 |
| `nextChallengeId` / `nextLoginMode` | 未达标时继续下一位管理员绑定 |

仅当 `entityFullyActivated=true` 时写入登录态关闭弹窗；否则继续登记下一位管理员。

### 06.8）`POST /login/otp`

仅在 `loginMode=totp_verify` 时调用。`{ challengeId, otpCode }`。

**Response**：`{ userUid, userRole: "organization-admin", authStatus: "verified", accessToken, refreshToken, expiresIn }`

### 06.9）前端状态机

```
Credentials(institutionCode+pwd)
  ├── loginMode=admin_select → select-admin → totp_setup / totp_verify
  ├── loginMode=admin_register → admin/register → totp_setup
  ├── loginMode=totp_setup → init → 扫码 → confirm
  │     └── !entityFullyActivated → back to admin_register
  └── loginMode=totp_verify → login/otp → Done
```

### 06.10）刷新 accessToken — `POST /auth/refresh`

与个人登录相同（§07.2）。`{ refreshToken }` → `{ accessToken, refreshToken, expiresIn }`。

### 06.11）错误码

| message | HTTP | 说明 |
|---------|------|------|
| `ORGANIZATION_CREDENTIAL_INVALID` | 400 | 密码错误 |
| `ORGANIZATION_ACCOUNT_DISABLED` | 400 | 主体未审核 |
| `ORGANIZATION_ACCOUNT_FROZEN` | 400 | 冻结 |
| `CHALLENGE_NOT_FOUND` | 404 | |
| `OTP_INVALID` | 400 | |

---

## 第二部分：个人空间与用户资料

> 消费页面：`ProfileSpacePage` 及 `components/profile/*`  
> 前端模块：`apps/web-client/src/api/userProfile`

---

## 01）通用约定（个人空间）

### 01.1）统一响应结构

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- `code=200`：业务成功
- 非 `200`：业务失败，`message` 用于错误提示
- `data` 为业务对象

### 01.2）认证与鉴权

- 本文档全部接口需要登录态。
- 请求头统一携带：

```http
Authorization: Bearer <access_token>
```

### 01.3）用户身份参数

- 前端从 `localStorage` 读取 `user_id`（登录响应写入）参与请求构造。
- 建议后端以 token 解析出的用户身份为准；`userId` 查询参数用于联调显式指定目标用户（查看他人空间时扩展）。

### 01.4）前端数据类型对齐

| 类型 | 说明 | 使用方 |
|------|------|--------|
| `ProjectItem` | 项目卡片数据（`ProjectCard`） | `ProfileHomeTabContent` / `ProfileProjectsTabContent` / 频道 Feed 项目列表 |

**`ProjectItem` 卡片关键字段（与 `ProjectCard` UI 对齐）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 项目对外 uid（`PR`+11 位）；卡片跳转 `/project-detail?uid=` |
| `title` | string | 项目标题 |
| `preview` | string | 卡片摘要 → `project.preview` |
| `tags` | `{ label: string }[]` | 技术标签，卡片以 `#标签` 展示 |
| `category` | string | `COMMERCIAL` \| `RECRUITMENT` |
| `recruitmentType` | string \| null | 招募子类型；仅 `RECRUITMENT` 有效 |
| `ownerOrganization` | string | 发布主体；元信息行 |
| `logoSvgUrl` | string \| null | 主体 Logo SVG；`coverUrl` 缺失时可作左侧视觉回退 |
| `coverUrl` | string \| null | 项目卡片封面图 URL；见 [`API-request.md`](./API-request.md) §01 待跟进 |
| `level` | string | `N` / `R` / `SR` / `SSR` / `UR` |
| `teamSize` | string \| null | 团队规模 |
| `duration` | string \| null | 预计周期 |
| `publishTime` | string | 发布时间（列表可用，当前卡片 UI 不展示） |

> **列表卡片无需返回**：`budget` / `amount`、`ownerName` / `publisher`（`ProjectCard` 无对应展示位）。商业预算与发布人信息见 **项目详情** `GET /projects/{uid}`。

| 类型 | 说明 | 使用方 |
|------|------|--------|
| `ProfileNoteItem` | 笔记卡片数据 | `ProfileHomeTabContent` / `ProfileNotesTabContent` / `GridNoteCard` / `RowNoteCard` |
| `LevelCode` | 能力等级：`N` / `R` / `SR` / `SSR` / `UR` | `LevelBadge` |

---

## 02）获取个人空间页壳数据（Hero + 右侧栏）

### 02.1）查询个人空间页壳

- **Method**：`GET`
- **Path**：`/user-profile/space`
- **Auth**：是
- **说明**：`ProfileSpacePage` 进入页面时调用，返回顶部 Hero 区与右侧信息侧栏所需数据（与 Tab 切换无关，一次加载）。

#### Query Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | number | 否 | 目标用户 ID；缺省时由 token 解析当前用户 |

#### Request Data（联调示意）

```json
{
  "userId": 10001,
  "accessToken": "<access_token>"
}
```

#### Response Data

```json
{
    "id": 10001,
    /* 1. 核心基础信息（可直接直分发给 Hero 栏） */
    "baseInfo": {
      "nickname": "张同学",
      "avatarUrl": "https://cdn.example.com/avatar/u10001.png",
      "isVerified": true,
      "organization": "深圳技术大学",
      "position": "学生",
      "bio": "热爱技术，喜欢把想法和创意变成价值的产品。",
      "level": "SR"
    },

    /* 2. 扩展/安全/统计信息（可直接分发给 Sidebar 栏） */
    "extendInfo": {
      "notice": "持续学习，持续创造，保持对前沿技术探索。",
      "ipLocation": "广东·深圳",
      "joinDate": "2023.08.12",
      // careerData 对应数据库 user_profile 中的career_data
      "careerData": ["计算机科学与技术"],
      "skills": ["Vue3", "React", "Python", "AI", "SpringBoot"]
    },

    /* 3. 关联的外部实体（由 Sidebar 的子组件消费） */
    "associatedTeam": {
      "id": 10001,
      "name": "智能计算与应用实验室",
      "description": "以工程项目驱动实践，聚焦智能系统与大数据分析方向。",
      "entryPath": "/lab/10001"
    }
    "honors": [],
    "activityHeatmap": [0, 1, 0, 2, 0, 1, 0, 1, 2, 1, 3, 2, 1, 0, 2, 3, 4, 2, 3, 1, 0, 1, 2, 3, 4, 3, 2, 1, 1, 2, 4, 3, 2, 1, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0, 1, 2, 3, 2, 1, 1, 2, 3, 4, 3, 2, 1, 0]
  }
}
```

**顶级字段**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number / long | 当前 Profile 主体的唯一标识（用户 ID 或机构 ID） |
| `baseInfo` | object | 核心基础信息，主要供 **Hero** 栏及全局导航/页头消费 |
| `extendInfo` | object | 扩展/安全/统计信息，主要供 **Sidebar** 栏消费 |
| `associatedTeam` | object | null | 关联的外部实体（所属团队/实验室），为空时不渲染团队卡片组件 |

**baseInfo (核心基础信息)**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `nickname` | string | 用户/机构昵称，对应 Hero 标题 |
| `avatarText` | string | 无头像图时的占位文字（通常在前端或后端取昵称首字） |
| `avatarUrl` | string | null | 头像图片地址；有值时前端优先渲染 `<img>` |
| `isVerified` | boolean | 是否已实名/已认证，控制认证图标显示 |
| `organization` | string | null | 所属主体名称（如：学校或企业名称）；为空时不渲染主体行 |
| `position` | string | null | 职位/身份，如 `学生`、`教授`、`HR` |
| `bio` | string | 个人/机构简介 |
| `level` | string | null | 能力/企业等级；为空或无效时不渲染 `LevelBadge`（如 `SR`） |

**extendInfo (扩展/安全/统计信息)**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `notice` | string | 个人/机构信息卡片顶部的提示公告文案 |
| `verifyStatus` | string | null | 实名状态详细文案，如 `已实名`、`企业已认证` |
| `ipLocation` | string | IP 属地展示文案，如 `广东·深圳` |
| `joinDate` | string | 加入/注册时间，展示格式如 `2023.08.12` |
| `skills` | string[] | 专业技能标签或业务标签列表 |

**associatedTeam (关联的外部实体)**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number / long | 关联团队/实验室的唯一 ID 标识 |
| `name` | string | 团队/实验室名称 |
| `description` | string | 团队/实验室的一句话简介 |
| `entryPath` | string | 点击卡片跳转到该团队空间的路由路径，如 `/lab/10001` |

| `honors` | array | 个人荣誉列表；空数组时展示「暂无荣誉内容」 |
| `activityHeatmap` | number[] | 活跃度热力图数值数组，每项 `0~4` 对应色阶 |

#### 常见错误码

- `UNAUTHORIZED`
- `ACCESS_TOKEN_EXPIRED`
- `USER_NOT_FOUND`

---

## 03）获取个人空间「主页」Tab 数据

### 03.1）查询主页 Tab 内容

- **Method**：`GET`
- **Path**：`/user-profile/home`
- **Auth**：是
- **说明**：供 `ProfileHomeTabContent` 使用，返回「我的项目」「我的笔记」预览列表（主页 Tab 激活时调用）。

#### Query Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | number | 否 | 目标用户 ID |
| `projectLimit` | number | 否 | 项目预览条数，默认 `3` |
| `noteLimit` | number | 否 | 笔记预览条数，默认 `4` |

#### Request Data（联调示意）

```json
{
  "userId": 10001,
  "accessToken": "<access_token>",
  "projectLimit": 3,
  "noteLimit": 4
}
```

#### Response Data

```json
{
  "userId": 10001,
  "projects": [
    {
      "uid": "PR00000090001",
      "title": "数据可视化大屏设计与开发",
      "preview": "基于 Vue3 + ECharts 构建企业级可视化大屏，实现业务指标动态展示与交互分析。",
      "coverUrl": "http://localhost:8081/uploads/project-covers/viz-dashboard.jpg",
      "tags": [{ "label": "Vue3" }, { "label": "ECharts" }, { "label": "可视化" }],
      "category": "COMMERCIAL",
      "recruitmentType": null,
      "ownerOrganization": "数智未来科技",
      "logoSvgUrl": null,
      "publishTime": "2024-12-18",
      "level": "SR",
      "teamSize": "2-4人",
      "duration": "1个月"
    }
  ],
  "notes": [
    {
      "uid": "TX20212345678",
      "title": "大模型 RAG 系统：从原理到项目落地",
      "summary": "本文梳理检索增强生成系统的关键链路，覆盖 embedding、召回与重排实践。",
      "contentType": "图文",
      "tags": ["人工智能", "RAG", "大模型"],
      "publishTime": "2024-05-18 19:36",
      "updateTime": "2024-05-19",
      "views": 532,
      "comments": 36,
      "favorites": 28,
      "cover": "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?auto=format&fit=crop&w=200&q=80"
    }
  ],
  "projectTotal": 12,
  "noteTotal": 25
}
```

字段说明：

**projects[]（ProjectItem）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 项目对外 uid（`PR`+11 位） |
| `title` | string | 项目标题 |
| `preview` | string | 卡片摘要 → `project.preview` |
| `coverUrl` | string \| null | 项目卡片封面图 URL |
| `tags` | `{ label: string }[]` | 技术/业务标签 |
| `category` | string | `COMMERCIAL` \| `RECRUITMENT` |
| `recruitmentType` | string \| null | `LAB_RECRUIT` \| `TEAM_RECRUIT` \| `CAMPUS_PRACTICE` \| `PERSONAL_RECRUIT`；商业项目为 `null` |
| `ownerOrganization` | string | 发布企业/主体名称 |
| `logoSvgUrl` | string \| null | 主体 Logo SVG 地址 |
| `publishTime` | string | 发布时间，如 `2024-12-18` |
| `level` | string | 项目等级：`N` / `R` / `SR` / `SSR` / `UR` |
| `teamSize` | string \| null | 团队规模，如 `2-4人` |
| `duration` | string \| null | 预计周期，如 `1个月` |

> 兼容说明：后端可短期同时返回旧字段 `summary` / `company`；前端 `mapApiProjects` 会映射为 `preview` / `ownerOrganization`。列表**无需** `publisher` / `ownerName`、`amount`（卡片不展示；详情见 `GET /projects/{uid}`）。

**notes[]（ProfileNoteItem / GridNoteCard / RowNoteCard）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 笔记对外 uid（`TX` / `VD` + 11 位） |
| `title` | string | 笔记标题 |
| `summary` | string | 笔记摘要 |
| `contentType` | string | 内容类型：`图文` / `视频` |
| `tags` | string[] | 话题标签 |
| `publishTime` | string | 发布时间 |
| `updateTime` | string | 最近更新时间 |
| `views` | number | 浏览量 |
| `comments` | number | 评论数（行卡片）；Feed 点赞数亦映射至此（网格 ThumbsUp） |
| `favorites` | number | 收藏数（网格 Heart） |
| `cover` | string | 封面图 URL |
| `authorNickname` | string | 作者昵称（网格作者栏；禁止实名） |
| `authorOrganization` | string | 学校 / 组织 |
| `authorAvatar` | string \| null | 作者头像 URL |
| `videoDuration` | string | 视频时长 `MM:SS`（仅视频笔记） |

> 网格卡片增量字段详见 [`API-request.md`](./API-request.md) §02。

| 字段 | 类型 | 说明 |
|------|------|------|
| `projectTotal` | number | 项目总数（用于「查看全部」展示，可选） |
| `noteTotal` | number | 笔记总数（用于「查看全部」展示，可选） |

#### 常见错误码

- `UNAUTHORIZED`
- `ACCESS_TOKEN_EXPIRED`
- `USER_NOT_FOUND`

---

## 04）获取个人空间「项目」Tab 数据

### 04.1）查询项目列表

- **Method**：`GET`
- **Path**：`/user-profile/projects`
- **Auth**：是
- **说明**：供 `ProfileProjectsTabContent` 使用，返回当前用户全部项目列表（切换到「项目」Tab 时调用，前端可展示加载态）。

#### Query Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | number | 否 | 目标用户 ID |
| `page` | number | 否 | 页码，从 `1` 开始，默认 `1` |
| `pageSize` | number | 否 | 每页条数，默认 `20` |

#### Request Data（联调示意）

```json
{
  "userId": 10001,
  "accessToken": "<access_token>",
  "page": 1,
  "pageSize": 20(首页调用)
}
```

#### Response Data

```json
{
  "userId": 10001,
  "projects": [
    {
      "uid": "PR00000090001",
      "title": "数据可视化大屏设计与开发",
      "preview": "基于 Vue3 + ECharts 构建企业级可视化大屏，实现业务指标动态展示与交互分析。",
      "coverUrl": "http://localhost:8081/uploads/project-covers/viz-dashboard.jpg",
      "tags": [{ "label": "Vue3" }, { "label": "ECharts" }, { "label": "可视化" }],
      "category": "COMMERCIAL",
      "recruitmentType": null,
      "ownerOrganization": "数智未来科技",
      "logoSvgUrl": null,
      "publishTime": "2024-12-18",
      "level": "SR",
      "teamSize": "2-4人",
      "duration": "1个月"
    },
    {
      "uid": "PR00000090002",
      "title": "企业官网重构设计",
      "preview": "完成品牌官网重构与视觉升级，提升信息可读性与移动端体验，支持组件化内容管理。",
      "coverUrl": null,
      "tags": [{ "label": "Web设计" }, { "label": "前端" }, { "label": "响应式" }],
      "category": "RECRUITMENT",
      "recruitmentType": "TEAM_RECRUIT",
      "ownerOrganization": "创新互联",
      "logoSvgUrl": null,
      "publishTime": "2024-11-29",
      "level": "R",
      "teamSize": "3-5人",
      "duration": "2个月"
    }
  ],
  "total": 4,
  "page": 1,
  "pageSize": 20
}
```

字段说明：

- `projects`：项目列表，元素结构同 **03.1）projects[]**。
- `total`：符合条件的项目总数。
- `page` / `pageSize`：分页回显。

#### 常见错误码

- `UNAUTHORIZED`
- `ACCESS_TOKEN_EXPIRED`
- `USER_NOT_FOUND`

---

## 05）获取个人空间「笔记」Tab 数据

### 05.1）查询笔记列表

- **Method**：`GET`
- **Path**：`/user-profile/notes`
- **Auth**：**是**（不允许匿名访问）
- **说明**：供 `ProfileNotesTabContent` 使用；区分本人视角与他人视角，本人返回除 `DELETED` 外全部笔记，他人仅返回 `PUBLISHED + PUBLIC`。

#### Query Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `uid` | string | 否 | 目标用户 UID；为空时默认 `access_token` 当前用户 |
| `userUid` | string | 否 | 兼容旧参数名，同 `uid` |
| `page` | int | 否 | 默认 1 |
| `pageSize` | int | 否 | 默认 20，最大 100 |
| `contentType` | string | 否 | 预筛：`图文` \| `视频` |

#### Response（本人视角示例）

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

#### Response（他人视角示例 — 仅返回 PUBLISHED + PUBLIC）

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

#### 新增字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 是 | `DRAFT` \| `REVIEWING` \| `PUBLISHED` \| `BANNED`（本人视角可见全部状态；他人视角固定为 `PUBLISHED`） |
| `visibility` | string | 是 | `PUBLIC` \| `PRIVATE`（本人视角可见全部；他人视角固定为 `PUBLIC`） |

#### 业务规则

| 场景 | 条件 | 返回逻辑 |
|------|------|----------|
| 本人访问 | `Authorization.userUid == query.uid` | 返回 `user_uid = targetUid` 的全部笔记，仅排除 `status = DELETED` |
| 他人访问 | `Authorization.userUid != query.uid` | 仅返回 `status = PUBLISHED` 且 `visibility = PUBLIC` 的笔记 |
| 排序 | 所有场景 | `COALESCE(published_at, created_at) DESC, id DESC` |
| 鉴权失败 | 无 token / token 无效 | 返回 `401 UNAUTHORIZED` |

#### 前端映射（`ProfileNoteItem`）

| API 字段 | 前端字段 | 说明 |
|----------|----------|------|
| `status` | `status` | 用于渲染草稿标记、审核中 badge、管理标签 |
| `visibility` | `visibility` | 用于渲染「仅自己」锁图标 / sash 标签 |

#### 常见错误码

- `UNAUTHORIZED`
- `ACCESS_TOKEN_EXPIRED`
- `USER_NOT_FOUND`

---

## 06）前端调用时序建议（ProfileSpacePage）

```mermaid
sequenceDiagram
  participant Page as ProfileSpacePage
  participant API as Backend API

  Page->>API: GET /user-profile/space?userId=
  API-->>Page: hero + sidebar

  alt Tab = 主页
    Page->>API: GET /user-profile/home?userId=
    API-->>Page: projects + notes preview
  else Tab = 项目
    Page->>API: GET /user-profile/projects?userId=
    API-->>Page: projects list
  else Tab = 笔记
    Page->>API: GET /user-profile/notes?userId=
    API-->>Page: notes list
  end
```

| 场景 | 调用接口 | 消费组件 |
|------|----------|----------|
| 进入 `/profile` | `GET /user-profile/space` | `ProfileSpacePage` Hero + 右侧栏 |
| 激活「主页」Tab | `GET /user-profile/home` | `ProfileHomeTabContent` |
| 激活「项目」Tab | `GET /user-profile/projects` | `ProfileProjectsTabContent` |
| 激活「笔记」Tab | `GET /user-profile/notes` | `ProfileNotesTabContent` |
| 刷新页面且带 `?tab=项目` | `space` + `projects` | 按路由 Tab 决定第二条请求 |

联调注意：

- 登录成功后需确保 `localStorage` 存在 `access_token` 与 `user_id`，否则接口易返回 `UNAUTHORIZED`。
- `level`、`organization` 等可空字段返回 `null` 或空字符串时，前端不渲染对应 UI 块。
- 「收藏」「设置」Tab 当前复用主页占位内容，后续可单独扩展 `GET /user-profile/favorites` 等接口。

---

## 07）顶部用户菜单（`/user-profile/menu`）

- **Method**：`GET`
- **Path**：`/user-profile/menu`
- **Auth**：是
- **说明**：顶部 `UserProfileMenu` 头像、昵称、等级、认证主体等；与个人空间接口共用鉴权。
- **前端封装**：`getUserProfileMenu`（`api/userProfile`）

响应字段：`userId`、`nickname`、`level`、`avatarUrl`、`verifiedOrganization` 等。

---

## 08）团队空间（`/team-profile/*`）

> 消费页面：`TeamView`（`apps/web-client/src/pages/ProfileSpace/variants/TeamView/`）  
> 前端模块：`apps/web-client/src/api/teamProfile`  
> 后端实现：`TeamSpaceController` / `TeamSpaceService`（`domain/space/`）  
> 数据库参考：`db.sql` — `team`、`team_member`、`project`、`note`、`achievement_archive`

### 08.1）通用约定

| 项 | 说明 |
|----|------|
| 路由 | `/team/:teamUid`（主页）、`/team/:teamUid/{member\|achievement\|project\|note}` |
| 身份参数 | Query **`teamUid`**（`LB`/`ST` + 11 位），**禁止**使用自增 id |
| Auth | 已审核（`audit_status=APPROVED`）且活跃（`account_status=ACTIVE`）的团队支持**游客只读**；冻结/解散返回 `403 TEAM_NOT_ACCESSIBLE` |
| 隐私 | 成员/笔记作者仅返回 **昵称**；成果字段均为脱敏展示 |

### 08.2）接口总览

| # | Method | Path | 说明 | 前端封装 |
|---|--------|------|------|----------|
| 1 | GET | `/team-profile/space` | 页壳：Hero + 侧栏 + 成员预览 | `getTeamProfileSpace` |
| 2 | GET | `/team-profile/home` | 主页 Tab：项目/笔记/成果预览 | `getTeamProfileHome` |
| 3 | GET | `/team-profile/members` | 成员 Tab 分页列表 | `getTeamProfileMembers` |
| 4 | PUT | `/team-profile/members` | 批量管理成员（career / isAdmin / 增删） | `updateTeamProfileMembers` |
| 5 | GET | `/team-profile/projects` | 项目 Tab 分页列表 | `getTeamProfileProjects` |
| 6 | GET | `/team-profile/notes` | 笔记 Tab 分页列表 | `getTeamProfileNotes` |
| 7 | GET | `/team-profile/achievements` | 成果 Tab 分页列表 | `getTeamProfileAchievements` |

### 08.3）GET `/team-profile/space`

- **Auth**：否（游客只读，见 §08.1）
- **说明**：进入 `/team/:teamUid` 时调用，返回 Hero、右侧信息表、主页成员预览。

#### Query Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `teamUid` | string | 是 | 团队对外 uid |

#### Response Data

```json
{
  "teamUid": "LB00000001001",
  "coreProfile": {
    "teamUid": "LB00000001001",
    "name": "智能计算与应用实验室",
    "description": "以工程项目驱动实践，聚焦智能系统与大数据分析方向。",
    "organizationName": "深圳技术大学",
    "logoUrl": "http://localhost:8081/uploads/teams/lab-logo.png",
    "memberCount": 4,
    "foundedAt": "2023.09.01"
  },
  "extendedProfile": {
    "notice": "本团队采用项目制协作，每周固定进行进度复盘与代码评审。",
    "researchDirection": "智能系统 · 大数据分析 · 工程实践",
    "contactEmail": "lab-contact@example.com"
  },
  "members": [
    {
      "uid": "US00000001001",
      "nickname": "李老师",
      "realName": "李晓明",
      "role": "MENTOR",
      "career": "人工智能",
      "isOwner": true,
      "isAdmin": true,
      "avatarUrl": null,
      "level": "SR"
    },
    {
      "uid": "US00000001002",
      "nickname": "王同学",
      "realName": "王磊",
      "role": "MEMBER",
      "career": "前端开发",
      "isOwner": false,
      "isAdmin": false,
      "avatarUrl": null,
      "level": "R"
    }
  ],
  "infoRows": [
    { "label": "团队 UID", "value": "LB00000001001" },
    { "label": "所属主体", "value": "深圳技术大学" },
    { "label": "加入时间", "value": "2023.09.01" },
    { "label": "成员规模", "value": "4 人" },
    { "label": "研究方向", "value": "智能系统 · 大数据分析" },
    { "label": "联系邮箱", "value": "lab-contact@example.com" }
  ]
}
```

**coreProfile**

| 字段 | 类型 | 说明 |
|------|------|------|
| `teamUid` | string | 团队 uid |
| `name` | string | `team.team_name` |
| `description` | string | `team.intro` |
| `organizationName` | string \| null | LAB 所属主体名；学生团队可为 null |
| `logoUrl` | string \| null | `team.team_logo` |
| `memberCount` | number | 成员总数 |
| `foundedAt` | string | 创建时间展示文案 |

**extendedProfile**

| 字段 | 类型 | 说明 |
|------|------|------|
| `notice` | string | `team.announcement` |
| `researchDirection` | string | 由 `team.tag` JSON 拼接 |
| `contactEmail` | string \| null | `team.contact_email` |

**members[]**

| 字段 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 成员 `userUid` |
| `nickname` | string | 昵称（公共区域默认展示） |
| `realName` | string \| null | 实名；管理成员表单与实验室成员可见场景使用 |
| `role` | string | 团队身份枚举：`LEADER` \| `MEMBER` \| `MENTOR` |
| `career` | string \| null | 团队在组内定位展示文案，如「人工智能」「前端开发」 |
| `isOwner` | boolean | 可选；是否为 `team.owner_uid`。**未返回时**前端将排序后 `members[0]` 视为负责人 |
| `isAdmin` | boolean | 是否具备团队管理权限；`team.owner_uid` 对应成员必须为 `true` |
| `avatarUrl` | string \| null | 头像 URL |
| `level` | string \| null | `N`/`R`/`SR`/`SSR`/`UR` |

**前端 MemberCard 展示规则**（`ProfileSpace`）：

- 片段顺序：`负责人`（可选）· `导师`/`学生` · `career`
- `role=MENTOR` → 「导师」；`role=LEADER`/`MEMBER` → 「学生」
- `members[0]`（接口已排序）或 `isOwner=true` 或 `role=LEADER` → 科技蓝「负责人」标签
- **名称字段**：公共实验室（`teamUid` 以 `LB` 开头）且登录用户为团队成员 → 优先 `realName`，否则 `nickname`；**管理成员表单**始终优先 `realName`
- **管理入口**：当前登录用户 `uid` 在 `members[]` 中且 `isAdmin=true` 时展示「管理成员」
- 示例：`负责人 · 导师 · 人工智能`；`学生 · 前端开发`

成员排序：负责人（`team.owner_uid`）→ 导师 → 学生；同层按能力等级、加入时间排序。

**infoRows[]**：`{ label, value }[]`，供侧栏「团队信息」表格直接渲染。

#### 常见错误码

- `TEAM_NOT_FOUND`（404）
- `TEAM_NOT_ACCESSIBLE`（403）
- `INVALID_TEAM_UID`（400）

### 08.4）GET `/team-profile/home`

#### Query Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `teamUid` | string | 是 | 团队 uid |
| `projectLimit` | number | 否 | 默认 `3` |
| `noteLimit` | number | 否 | 默认 `3` |
| `achievementLimit` | number | 否 | 默认 `3` |

#### Response Data

```json
{
  "teamUid": "LB00000001001",
  "projects": [],
  "notes": [],
  "achievements": [
    {
      "achievementUid": "AC00000005001",
      "maskedProjectName": "智能数据分析平台",
      "taskDescription": "完成核心指标看板与周报自动化导出模块…",
      "technicalTags": ["React", "ECharts", "SpringBoot"],
      "completedAt": "2026-04-30"
    }
  ],
  "projectTotal": 4,
  "noteTotal": 5,
  "achievementTotal": 4
}
```

- **projects[]**：与个人空间 `projects[]` 同构（`ProjectItem` / `ProjectCard`），筛选 `project.team_uid = teamUid`。
- **notes[]**：与个人空间 `notes[]` 同构（`ProfileNoteItem` / `GridNoteCard`），封面字段名为 `cover`。
- **achievements[]**

| 字段 | 类型 | 说明 |
|------|------|------|
| `achievementUid` | string | `AC` + 11 位 |
| `maskedProjectName` | string | 脱敏项目名 |
| `taskDescription` | string | 脱敏工作总结 |
| `technicalTags` | string[] | 技术标签 |
| `completedAt` | string | 完成时间 |

### 08.5）GET `/team-profile/members`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `teamUid` | string | 是 | 团队 uid |
| `page` | number | 否 | 默认 `1` |
| `pageSize` | number | 否 | 默认 `50` |

响应：`{ teamUid, members[], total, page, pageSize }`；`members[]` 同 §08.3。

| `pageSize` | number | 否 | 默认 `50`（管理成员页建议 `100`） |

响应：`{ teamUid, members[], total, page, pageSize }`；`members[]` 同 §08.3。

### 08.6）PUT `/team-profile/members`

- **Auth**：是（须登录）
- **权限**：调用者须为该团队成员且 `isAdmin=true`（负责人天然具备）
- **说明**：`ManageMembersForm` 保存时一次性提交成员变更；不涉及负责人转让。

#### Query Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `teamUid` | string | 是 | 团队对外 uid |

#### Request Body

```json
{
  "updates": [
    { "uid": "US00000001002", "career": "前端开发", "isAdmin": true }
  ],
  "additions": [
    { "uid": "US00000001009", "role": "MEMBER", "career": "后端开发" }
  ],
  "removals": [
    { "uid": "US00000001008" }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `updates` | array | 否 | 已存在成员变更；含 `uid`、`career`（非空）、可选 `isAdmin` |
| `additions` | array | 否 | 新成员；`role` 仅 `MEMBER` \| `MENTOR`；不传 `nickname` |
| `removals` | array | 否 | 移除成员；不可移除 `team.owner_uid` |

三项全空 → `400`。`updates` 中不可修改 `role`；负责人 `isAdmin` 恒为 `true`。

#### Response Data

```json
{
  "teamUid": "LB00000001001",
  "members": [],
  "total": 4
}
```

`members[]` 结构与 §08.3 一致，为保存后完整列表。

#### 常见错误码

| code | HTTP | 说明 |
|------|------|------|
| `TEAM_MEMBER_FORBIDDEN` | 403 | 当前用户无管理权限 |
| `TEAM_MEMBER_OWNER_IMMUTABLE` | 400 | 不可移除负责人 |
| `TEAM_MEMBER_LAST_ONE` | 400 | 不可移除最后一名成员 |
| `TEAM_MEMBER_CAREER_REQUIRED` | 400 | career 为空 |
| `TEAM_MEMBER_ALREADY_EXISTS` | 409 | 成员已在团队 |
| `TEAM_MEMBER_NOT_FOUND` | 404 | 移除/更新目标不在团队 |
| `TEAM_MEMBER_LAB_CONFLICT` | 409 | 学生单实验室约束冲突 |
| `USER_NOT_FOUND` | 404 | 添加时用户不存在 |

### 08.7）GET `/team-profile/projects`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `teamUid` | string | 是 | 团队 uid |
| `page` | number | 否 | 默认 `1` |
| `pageSize` | number | 否 | 默认 `20` |

响应：`{ teamUid, projects[], total, page, pageSize }`；`projects[]` 同个人空间项目 Tab。

### 08.8）GET `/team-profile/notes`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `teamUid` | string | 是 | 团队 uid |
| `page` | number | 否 | 默认 `1` |
| `pageSize` | number | 否 | 默认 `21`（建议 3 的倍数） |
| `contentType` | string | 否 | `图文` / `视频` |

响应：`{ teamUid, notes[], total, page, pageSize }`；`notes[]` 同个人空间笔记 Tab。

### 08.9）GET `/team-profile/achievements`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `teamUid` | string | 是 | 团队 uid |
| `page` | number | 否 | 默认 `1` |
| `pageSize` | number | 否 | 默认 `20` |

响应：`{ teamUid, achievements[], total, page, pageSize }`；`achievements[]` 同 §08.4。

### 08.10）GET `/users/{uid}/public-preview`

- **Auth**：否（登录可选）
- **说明**：管理成员表单输入 UID 后校验用户并自动填充姓名；**请求体不传 nickname**。

#### Path Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `uid` | string | 是 | 用户对外 uid |

#### Response Data

```json
{
  "uid": "US00000001009",
  "nickname": "新同学",
  "realName": "张三",
  "avatarUrl": null
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 用户 uid |
| `nickname` | string | 昵称 |
| `realName` | string \| null | 实名 |
| `avatarUrl` | string \| null | 头像 |

前端 `ManageMembersForm`：UID 失焦调用本接口；管理场景姓名优先 `realName`。

#### 常见错误码

- `USER_NOT_FOUND`（404）
- `INVALID_USER_UID`（400）

### 08.11）前端调用时序（TeamView）

```mermaid
sequenceDiagram
  participant Page as TeamView
  participant API as /team-profile/*

  Page->>API: GET /team-profile/space?teamUid=
  Note over Page: Hero + 侧栏 + 成员预览

  alt 主页 Tab
    Page->>API: GET /team-profile/home?teamUid=
  else 成员 Tab
    Page->>API: GET /team-profile/members?teamUid=
  else 成员管理页
    Page->>API: GET /users/{uid}/public-preview
    Page->>API: PUT /team-profile/members?teamUid=
  else 成果 Tab
    Page->>API: GET /team-profile/achievements?teamUid=
  else 项目 Tab
    Page->>API: GET /team-profile/projects?teamUid=
  else 笔记 Tab
    Page->>API: GET /team-profile/notes?teamUid=
  end
```

| 场景 | 调用接口 | 消费组件 |
|------|----------|----------|
| 进入 `/team/:teamUid` | `GET /team-profile/space` | `TeamViewHeroContent`、`TeamViewSidebar`、主页成员预览 |
| 激活「主页」Tab | `GET /team-profile/home` | `TeamViewMainContent` 预览区 |
| 激活「成员/成果/项目/笔记」Tab | 对应 §08.5–§08.9 | `TeamViewMainContent` |
| 管理成员保存 | `PUT /team-profile/members` | `ManageMembersForm` |

---

## 第三部分：发布与详情

> 消费页面：`PublishProjectView`、`PublishNoteView`、`ProjectDetailPage`、`NoteDetailPage`  
> 前端模块：`apps/web-client/src/api/projects`、`apps/web-client/src/api/notes`  
> 数据库参考：`db.sql` — `project` / `project_commercial_secret`、`note`、`user_profile`

### 发布页按钮与接口

| 页面 | 按钮 | 对应接口 |
|------|------|----------|
| 发布项目 | 保存草稿 | `POST /projects`（`publishAction=DRAFT`）或 `PUT /projects/{id}` |
| 发布项目 | 发布项目 | `POST /projects`（`publishAction=PUBLISH`）或 `PUT /projects/{id}` |
| 发布笔记 | 保存草稿 | `POST /notes`（`publishAction=DRAFT`）或 `PUT /notes/{id}` |
| 发布笔记 | 发布笔记 | `POST /notes`（`publishAction=PUBLISH`）或 `PUT /notes/{id}` |
| 发布笔记 | 预览 | 先 `POST/PUT /notes`（`DRAFT`），再跳转详情预览 |

---

## 01）通用约定（发布与详情）

### 01.1）统一响应结构

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- `code=200`：业务成功
- 非 `200`：业务失败，`message` 用于 Toast / 表单顶部错误提示
- `data` 为业务对象

### 01.2）认证与鉴权

- **写接口**（`POST` / `PUT`）与 **草稿读接口**（`GET .../draft`）：需要登录态。
- **详情读接口**（`GET /projects/{id}`、`GET /notes/{id}`）：
  - `status` 为已发布态（项目 `OPEN|ONGOING|CLOSED`、笔记 `PUBLISHED`）：**需要登录状态**。
  - `status=DRAFT`：仅 **owner** 登录后可读。
  - 笔记 `status=BANNED`：一律不可读（返回 `NOTE_NOT_FOUND` 或 `NOTE_BANNED`）。
- 需要登录时，请求头统一携带：

```http
Authorization: Bearer <access_token>
```

- `owner_id` / `user_id` 以 token 解析为准；前端 `localStorage.user_id` 仅用于联调对照。

### 01.3）发布动作（publishAction）

| 值 | 说明 | 项目落库 | 笔记落库 |
|----|------|----------|----------|
| `DRAFT` | 保存草稿，可继续编辑 | `project.status='DRAFT'`，`published_at=NULL` | `note.status='DRAFT'`，`published_at=NULL` |
| `PUBLISH` | 正式发布 | `project.status='OPEN'`，写入 `published_at=NOW()`，同步 `updated_at`；`created_at` 不变 | `note.status='PUBLISHED'`，写入 `published_at=NOW()`，同步 `updated_at`；`created_at` 不变 |

**时间字段语义（项目 / 笔记通用）**

| 字段 | 含义 |
|------|------|
| `created_at` | 记录在数据库中**首次创建**的时间，草稿保存后不再变更 |
| `published_at` | 用户在前端点击「发布」并校验通过后写入；草稿态为 `NULL` |
| `updated_at` | 任意保存（含草稿编辑、正式发布）时由数据库自动更新 |

### 01.4）前端表单类型对齐

| 类型 | 说明 | 定义位置 |
|------|------|----------|
| `PublishProjectFormDraft` | 发布项目表单 | `publishProjectPageData.ts` |
| `PublishNoteFormDraft` | 发布笔记表单 | `publishNotePageData.ts` |
| `ProjectDetailPayload` | 项目详情页展示 | `ProjectDetailPage/types.ts` |
| `NoteArticleDetailPayload` | 图文笔记详情页展示 | `NoteDetailPage/types.ts` |
| `MarkdownContentChangeMeta` | 正文/需求说明来源：`editor` \| `upload` | `OnlineEditor/types/content.ts` |
| `LevelCode` | `N` / `R` / `SR` / `SSR` / `UR` | `types/level.ts` |

---

## 02）发布项目（PublishProject）

> 消费组件：`PublishProjectView`  
> Hook：`usePublishProjectForm`（`handleSaveDraft` / `handlePublish`）

### 02.1）创建项目（草稿 / 发布）

- **Method**：`POST`
- **Path**：`/projects`
- **Auth**：是
- **说明**：首次保存草稿或首次发布时调用。成功后返回 `projectId`，后续更新走 **02.2）**。

#### Request Body

```json
{
  "publishAction": "DRAFT",
  "title": "数据可视化大屏设计与开发",
  "summary": "基于 Vue3 + ECharts 构建企业级可视化大屏。",
  "channel": "enterprise",
  "campusRecruitType": null,
  "description": "# 项目背景\n\n## 交付物\n- 大屏原型\n- 前端实现",
  "amount": "18600",
  "level": "SR",
  "duration": "4 周",
  "teamSize": "1-3 人",
  "skillTags": ["Vue3", "ECharts", "可视化"],
  "deadline": "2026-06-30"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `publishAction` | string | 是 | `DRAFT` \| `PUBLISH` |
| `title` | string | 是 | 项目标题 → `project.title` |
| `summary` | string | 是 | 一句话摘要（建议 ≤80 字）→ `project.preview` |
| `channel` | string | 是 | 项目频道：`enterprise`（商业项目）\| `campus`（招募/实践项目）→ `project.category` |
| `campusRecruitType` | string \| null | 条件 | `channel=campus` 时必填 → `project.recruitment_type`；商业项目传 `null` |
| `description` | string | 条件 | 项目详情 Markdown 正文；`PUBLISH` 时必填 → `project.description`（前端 Milkdown 编辑，服务端仅存 Markdown） |
| `amount` | string | 条件 | 预算数值字符串（后端解析为 DECIMAL）。商业项目 `PUBLISH` 时可选；可为空或 `0` |
| `level` | string | 是 | `N` / `R` / `SR` / `SSR` / `UR` → `project.level` |
| `duration` | string | 否 | 预计周期 → `project.duration` |
| `teamSize` | string | 否 | 团队人数 → `project.team_size` |
| `skillTags` | string[] | 是 | 技能标签 → `project.tags`（JSON 数组） |
| `deadline` | string | 否 | 报名截止日期 `YYYY-MM-DD` → `project.deadline` |

**发布权限（`user_auth_link.role`，取当前 `is_active=1` 身份）**

| 角色 | 可发布 `channel` | 说明 |
|------|------------------|------|
| `PM` | 仅 `enterprise` | 只能发布商业项目 |
| `MENTOR` | `enterprise` + `campus` | 可发布商业与招募项目 |
| `STUDENT` | 仅 `campus` | 只能发布招募/实践项目 |

不满足权限时返回 `PROJECT_PUBLISH_FORBIDDEN`。

#### Response Data

```json
{
  "projectId": 90001,
  "publishAction": "DRAFT",
  "status": "DRAFT",
  "category": "COMMERCIAL",
  "recruitmentType": null,
  "publishedAt": null,
  "createdAt": "2026-05-22T10:00:00+08:00",
  "updatedAt": "2026-05-22T10:00:00+08:00"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `projectId` | number | 新建项目 ID |
| `status` | string | `DRAFT`（草稿）\| `OPEN`（已发布）\| `ONGOING` \| `CLOSED` |
| `category` | string | `COMMERCIAL` \| `RECRUITMENT` |
| `recruitmentType` | string \| null | 招募子类型；商业项目为 `null` |
| `publishedAt` | string \| null | 正式发布时间；草稿为 `null` |
| `createdAt` | string | 记录创建时间 |
| `updatedAt` | string | 最后更新时间 |

#### 常见错误码

- `UNAUTHORIZED` / `ACCESS_TOKEN_EXPIRED`
- `VALIDATION_FAILED`（标题/摘要/描述/标签/金额校验失败）
- `AMOUNT_PARSE_FAILED`（金额无法解析为有效 DECIMAL）
- `PROJECT_PUBLISH_FORBIDDEN`（无企业发布权限等）

---

### 02.2）更新项目（草稿 / 发布）

- **Method**：`PUT`
- **Path**：`/projects/{projectId}`
- **Auth**：是
- **说明**：编辑已有草稿或已发布项目后再次保存。请求体与 **02.1）** 相同；仅 `owner_id` 匹配时可操作。

#### Path Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `projectId` | number | 是 | 项目 ID |

#### Response Data

同 **02.1）**，`projectId` 与路径一致。

#### 常见错误码

- `PROJECT_NOT_FOUND`
- `PROJECT_NOT_OWNER`
- 其余同 **02.1）**

---

### 02.3）查询项目草稿（进入编辑页，可选）

- **Method**：`GET`
- **Path**：`/projects/{projectId}/draft`
- **Auth**：是
- **说明**：从「我的项目」进入编辑页时拉取草稿；当前发布页原型未接路由参数，联调阶段可跳过，由前端 `sessionStorage` 暂存。

#### Response Data

```json
{
  "projectId": 90001,
  "publishAction": "DRAFT",
  "title": "数据可视化大屏设计与开发",
  "summary": "基于 Vue3 + ECharts 构建企业级可视化大屏。",
  "channel": "enterprise",
  "campusRecruitType": null,
  "description": "# 项目背景\n...",
  "amount": "18600",
  "level": "SR",
  "duration": "4 周",
  "teamSize": "1-3 人",
  "skillTags": ["Vue3", "ECharts"],
  "deadline": "2026-06-30",
  "descriptionEditorType": "MARKDOWN"
}
```

> `descriptionEditorType` ← `project.editor_type`；响应用 camelCase，库表为 snake_case。

---

### 02.4）数据库映射（project / project_commercial_secret）

#### 频道 → 主表分类

| 前端 `channel` | `project.category` | `campusRecruitType` → `project.recruitment_type` |
|----------------|-------------------|--------------------------------------------------|
| `enterprise` | `COMMERCIAL` | `NULL` |
| `campus` | `RECRUITMENT` | `LAB_RECRUIT` \| `TEAM_RECRUIT` \| `CAMPUS_PRACTICE` \| `PERSONAL_RECRUIT` |

#### 字段映射

| 前端字段 | 数据库表.字段 | 备注 |
|----------|---------------|------|
| `title` | `project.title` | |
| `summary` | `project.preview` | |
| `description` | `project.description` | Markdown 正文（Milkdown） |
| （读响应） | `project.editor_type` | → `descriptionEditorType` |
| （后端默认） | `project.editor_type` | 写接口不传时后端写 `MARKDOWN` |
| `skillTags` | `project.tags` | JSON 数组 |
| `level` | `project.level` | |
| `duration` | `project.duration` | |
| `teamSize` | `project.team_size` | |
| `deadline` | `project.deadline` | `DATE` |
| token 用户 | `project.owner_id` | |
| `amount`（解析后） | `project_commercial_secret.total_budget` | 仅**有保密需求的商业项目**创建扩展表；招募项目不需要 |
| `publishAction=DRAFT` | `project.status='DRAFT'`，`published_at=NULL` | 默认状态为 `DRAFT`，防止意外发布 |
| `publishAction=PUBLISH` | `project.status='OPEN'`，`published_at=NOW()`，`updated_at` 同步更新 | `created_at` 不变 |

#### 商业扩展表（`project_commercial_secret`）

| 场景 | 处理方式 |
|------|----------|
| `channel=enterprise` 且需保密托管金额 | 插入一行：`commercial_status='PENDING_START'`，`total_budget` 来自 `amount`（可为 `0` 或空） |
| `channel=campus`（招募/实践） | **不创建**扩展表 |

---

## 03）发布笔记（PublishNote）

> 消费组件：`PublishNoteView`  
> Hook：`usePublishNoteForm`（`handleSaveDraft` / `handlePublish`）  
> 关联：`usePublishNoteCover`（封面）、`PublishNoteVideoUploadCard`（视频）

### 03.1）媒体上传（发布前置）

笔记发布前需先将封面/视频上传至本地静态目录（联调阶段模拟 OSS），拿到 URL 再调用 **03.2）** / **03.3）**。

> **MD5 去重秒传**：同一文件内容（MD5 相同）只落盘一次；重复上传直接复用 `file_records` 中已有 URL，不写盘。大文件可先调 **03.1.0）** 预检，命中则跳过 POST 上传。

#### 03.1.0）秒传预检（可选，大文件推荐）

- **Method**：`GET`
- **Path**：`/uploads/check-md5`
- **Auth**：否（当前未校验）
- **说明**：正式上传前仅传 MD5；命中则前端可直接使用返回的 `filePath`，省去带宽。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `md5` | string | 是 | 32 位小写十六进制 MD5 |

#### Response Data

**已存在（可秒传）**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "exists": true,
    "filePath": "http://localhost:8081/uploads/videos/a1b2c3d4.mp4"
  }
}
```

**不存在（需 POST 上传）**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "exists": false,
    "filePath": null
  }
}
```

---

#### 03.1.1）上传封面图

- **Method**：`POST`
- **Path**：`/uploads/note-cover`
- **Content-Type**：`multipart/form-data`
- **Auth**：否（当前后端未校验 token；生产环境建议补上）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 图片文件（用户上传封面，或前端 Canvas 生成后转 Blob） |
| `source` | string | 否 | `auto` \| `upload`，**仅前端 UI 状态**；后端当前忽略 |

#### Response Data

> 统一走 §01.1 `Result` 结构；`data` 为 **URL 字符串**（非 `{ coverUrl }` 对象）。前端取值：`const coverUrl = res.data`。

```json
{
  "code": 200,
  "message": "success",
  "data": "http://localhost:8081/uploads/covers/3f2a1b9c-uuid.jpg"
}
```

- 同一文件 MD5 已存在时：仍返回 200，`data` 为库中已有 URL（秒传，不写盘）。

---

#### 03.1.2）上传视频（视频笔记）

- **Method**：`POST`
- **Path**：`/uploads/note-video`
- **Content-Type**：`multipart/form-data`
- **Auth**：否（当前后端未校验 token；生产环境建议补上）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 视频源文件 |

#### Response Data

> 统一走 §01.1 `Result` 结构；`data` 为 **视频 URL 字符串**。`videoDuration`、封面 **不由本接口返回**。

```json
{
  "code": 200,
  "message": "success",
  "data": "http://localhost:8081/uploads/videos/8e7d6c5b-uuid.mp4"
}
```

| 字段 | 来源 | 说明 |
|------|------|------|
| `videoUrl` | `POST /uploads/note-video` 的 `data` | 直接作为笔记 `videoUrl` |
| `videoDuration` | **前端本地** | 浏览器读取视频元数据（如 `<video>` `duration`） |
| `coverUrl` | **单独上传** | 调用 **03.1.1）** 上传封面；后端**不**截取视频首帧 |

- 同一视频 MD5 已存在时：秒传复用已有 `data` URL。
- 若产品需要「服务端截帧封面 + 解析时长」，需另开增强接口；当前联调版未实现。

---

### 03.2）创建笔记（草稿 / 发布）

- **Method**：`POST`
- **Path**：`/notes`
- **Auth**：是
- **说明**：首次保存草稿或首次发布。

#### Request Body

**图文笔记示例**

```json
{
  "publishAction": "PUBLISH",
  "title": "大三暑期实习投递复盘",
  "summary": "从简历、笔试到面试的完整时间线与踩坑总结。",
  "contentType": "图文",
  "content": "# 背景\n\n## 时间线\n...",
  "tags": ["求职经验", "实习"],
  "coverUrl": "https://cdn.example.com/notes/cover/abc123.jpg"
}
```

**视频笔记示例**

```json
{
  "publishAction": "DRAFT",
  "title": "如何设计一个高质量用户系统",
  "summary": "结合权限模型与可观测方案的经验分享。",
  "contentType": "视频",
  "tags": ["系统设计"],
  "coverUrl": "https://cdn.example.com/notes/cover/frame-xyz789.jpg",
  "videoUrl": "https://cdn.example.com/notes/video/xyz789.mp4",
  "videoDuration": 186
}
```

**学习笔记示例（关联父视频笔记）**

```json
{
  "publishAction": "DRAFT",
  "title": "如何设计一个高质量用户系统",
  "summary": "结合权限模型与可观测方案的经验分享。",
  "contentType": "图文",
  "content": "# 如何设计一个高质量用户系统\n\n这是一段关于视频内容的快速记录。",
  "tags": ["系统设计", "用户体系"],
  "coverUrl": "https://cdn.example.com/notes/cover/auto-generated.jpg",
  "parentContentTypeCode": "VDx9Y8z7W6v5U",
  "visibility": "PRIVATE"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `publishAction` | string | 是 | `DRAFT` \| `PUBLISH` |
| `title` | string | 是 | → `note.title` |
| `summary` | string | 是 | 简介 → `note.summary`（视频笔记无单独 `videoDescription`） |
| `contentType` | string | 是 | 前端枚举：`图文` \| `视频`；**创建后不可变更** |
| `content` | string \| null | 条件 | **仅 `contentType=图文` 时**写入 `note.content`（Markdown）；视频笔记忽略/不传 |
| `tags` | string[] | 是 | → `note.tags` JSON |
| `coverUrl` | string | 是 | → `note.cover_url`；**草稿与发布均必填**（视觉统一） |
| `videoUrl` | string | 条件 | `contentType=视频` 且 `PUBLISH` 时必填 → `note.video_url` |
| `videoDuration` | number | 否 | 秒 → `note.video_duration` |
| `parentContentTypeCode` | string | 否 | 父笔记 contentTypeCode（`VD` + 11 位）；学习笔记关联父视频时传入 |
| `visibility` | string | 否 | `PUBLIC` \| `PRIVATE`；未传时后端默认 `PUBLIC`；非法值 → 400 |

**后端校验规则**

| 规则 | 说明 |
|------|------|
| 无发布权限限制 | 任意登录用户可发布笔记 |
| `contentType` 不可变 | 创建后禁止图文↔视频互转；修改类型需新建笔记 → `NOTE_TYPE_IMMUTABLE` |
| `content` 与类型对应 | `图文`：可写 `content`；`视频`：不写入 `content`（保持 `NULL`） |
| 无 `images` | 正文 Markdown 内嵌图片，不使用独立 URL 数组 |

**发布行为（REVIEWING 状态）**

- 无论 `visibility = PUBLIC` 还是 `PRIVATE`，点击「发布」后笔记状态统一变更为 `REVIEWING`（审核中）
- `REVIEWING` 状态的笔记**不会出现在首页 Feed、相似笔记推荐、项目 Feed、笔记 Feed 中**
- `REVIEWING` 状态笔记仅 owner 可访问详情页；对外返回 `404（NOTE_NOT_FOUND）`
- `GET /notes/{uid}/children` 不会返回 `REVIEWING` 状态的子笔记（仅返回 `PUBLISHED`）
- 审核通过后 status 变为 `PUBLISHED`，此时 `visibility` 决定其在公开列表中的可见范围

**存储实现（学习笔记）**

- `parentContentTypeCode` 存储于 `t_user_note_detail` 表（垂直拆分的大文本表），与 `content` 同层管理
- 三表结构：`t_user_note`（核心字段）→ `t_user_note_detail`（parentContentTypeCode + content）→ `t_user_note_counter`（计数）
- 创建时通过 `saveNoteDetail()` 同时写入 `parentContentTypeCode` 和 `content`
- 更新时通过 `upsertNoteDetail()` 以 saveOrUpdate 模式同步

#### Response Data

```json
{
  "noteId": 80001,
  "contentTypeCode": "TXa1B2c3D4e5F",
  "publishAction": "PUBLISH",
  "status": "PUBLISHED",
  "publishedAt": "2026-05-22T11:30:00+08:00",
  "createdAt": "2026-05-22T11:00:00+08:00",
  "updatedAt": "2026-05-22T11:30:00+08:00"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `noteId` | number | 笔记主键 |
| `contentTypeCode` | string | 后端生成：`TX` + 11 位 或 `VD` + 11 位 → `note.content_type_code` |
| `status` | string | `DRAFT` \| `PUBLISHED` |

#### 内容类型编码规则（后端生成）

| 前端 `contentType` | `content_type_code` 格式 | 生成方式 |
|--------------------|-------------------------|----------|
| `图文` | `TX` + 11 位 `[A-Za-z0-9]` | NanoID 随机后缀，碰撞时重试 |
| `视频` | `VD` + 11 位 `[A-Za-z0-9]` | NanoID 随机后缀，碰撞时重试 |

实现类：`NoteContentTypeCodeGenerator`（字符集与 `db.sql` CHECK 一致）。

#### 常见错误码

- `UNAUTHORIZED` / `ACCESS_TOKEN_EXPIRED`
- `VALIDATION_FAILED`
- `COVER_REQUIRED`（缺少 `coverUrl`）
- `VIDEO_REQUIRED`（视频笔记发布时缺少 `videoUrl`）
- `CONTENT_REQUIRED`（图文笔记发布时 `content` 为空）
- `INVALID_CONTENT_TYPE_CODE`（生成编码不符合 CHECK）

---

### 03.3）更新笔记（草稿 / 发布）

- **Method**：`PUT`
- **Path**：`/notes/{noteId}`
- **Auth**：是
- **说明**：请求体同 **03.2）**；`contentType` / `content_type_code` 创建后**不可变更**（禁止图文↔视频互转）。

#### Path Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `noteId` | number | 是 | 笔记 ID |

#### Response Data

同 **03.2）**。

#### 常见错误码

- `NOTE_NOT_FOUND`
- `NOTE_NOT_OWNER`
- `NOTE_TYPE_IMMUTABLE`（尝试修改 `contentType` / `content_type_code`）
- 其余同 **03.2）**

---

### 03.4）查询笔记草稿（可选）

- **Method**：`GET`
- **Path**：`/notes/{noteId}/draft`
- **Auth**：是

#### Response Data

与 **03.2）Request Body** 结构一致，并附带 `noteId`、`contentTypeCode`。

---

### 03.5）数据库映射（note）

| 前端字段 | 数据库表.字段 | 备注 |
|----------|---------------|------|
| token 用户 | `note.user_id` | |
| 后端生成 | `note.content_type_code` | NanoID：`TX`/`VD` + 11 位，见 **03.2）** |
| `title` | `note.title` | |
| `summary` | `note.summary` | 简介（视频笔记亦用此字段，无 `videoDescription`） |
| `content` | `note.content` | 仅图文笔记写入 Markdown；视频为 `NULL` |
| `tags` | `note.tags` | JSON |
| `coverUrl` | `note.cover_url` | 草稿/发布均必填 |
| `videoUrl` | `note.video_url` | 仅视频 |
| `videoDuration` | `note.video_duration` | 仅视频 |
| `parentContentTypeCode` | `t_user_note_detail.parent_content_type_code` | 学习笔记关联父视频笔记的 contentTypeCode |
| `publishAction=DRAFT` | `note.status='DRAFT'`，`published_at=NULL` | |
| `publishAction=PUBLISH` | `note.status='PUBLISHED'`，`published_at=NOW()`，`updated_at` 同步更新 | `created_at` 为首次入库时间，不变 |
| （响应）`publishedAt` | `note.published_at` | 草稿为 `null` |

计数器 `view_count` / `like_count` 等创建时默认 `0`，无需前端传入。

**个人空间读接口约定（`GET /user-profile/home`、`/notes`）**

| 字段 | 说明 |
|------|------|
| `projects[].id` / `notes[].id` | 项目/笔记主键，供详情页/编辑页路由使用 |
| 列表排序 | `ORDER BY COALESCE(published_at, created_at) DESC` |
| `publishTime` 展示 | 优先 `published_at`，为空则回退 `created_at` |

---

## 04）前端字段 → 请求体组装说明

### 04.1）发布项目（`usePublishProjectForm`）

| 前端状态 | 请求字段 |
|----------|----------|
| `draft.title` | `title` |
| `draft.summary` | `summary` |
| `draft.channel` | `channel` |
| `draft.campusRecruitType` | `campusRecruitType`（`channel=campus` 时） |
| `draft.description` | `description` |
| `draft.amount` | `amount` |
| `draft.level` | `level` |
| `draft.duration` | `duration` |
| `draft.teamSize` | `teamSize` |
| `draft.skillTags` | `skillTags` |
| `draft.deadline` | `deadline` |
| 按钮「保存草稿」 | `publishAction: 'DRAFT'` |
| 按钮「发布项目」 | `publishAction: 'PUBLISH'` |

**校验建议（与前端 `completionPercent` 对齐）**

| `publishAction` | 必填项 |
|-----------------|--------|
| `DRAFT` | `title`（建议宽松，允许空摘要暂存） |
| `PUBLISH` | `title`、`summary`、`description`、`amount`、`skillTags.length >= 1` |

---

### 04.2）发布笔记（`usePublishNoteForm`）

| 前端状态 | 请求字段 |
|----------|----------|
| `draft.title` | `title` |
| `draft.summary` | `summary` |
| `draft.contentType` | `contentType` |
| `draft.body` | `content`（仅 `contentType=图文`） |
| `draft.tags` | `tags` |
| `cover.activePreviewUrl` 上传后 | `coverUrl`（草稿亦必填） |
| `videoUpload` 上传后 | `videoUrl`、`videoDuration` |
| 按钮「保存草稿」 | `publishAction: 'DRAFT'` |
| 按钮「发布笔记」 | `publishAction: 'PUBLISH'` |

**校验建议**

| `publishAction` | 必填项 |
|-----------------|--------|
| `DRAFT` | `title`、`coverUrl`（视觉统一） |
| `PUBLISH` | `title`、`summary`、`tags.length >= 1`、`coverUrl`；`contentType=图文` 需 `content`；`contentType=视频` 需 `videoUrl` |

---

## 05）前端调用时序

### 05.1）发布项目

```mermaid
sequenceDiagram
  participant View as PublishProjectView
  participant Hook as usePublishProjectForm
  participant API as Backend API

  View->>Hook: 点击「保存草稿」/「发布项目」
  Hook->>Hook: 组装 PublishProjectFormDraft + descriptionMeta
  alt 首次提交
    Hook->>API: POST /projects
  else 已有 projectId
    Hook->>API: PUT /projects/{projectId}
  end
  API-->>Hook: projectId + status
  Hook-->>View: Toast 成功 / 跳转项目详情或我的项目
```

| 用户操作 | 接口 | `publishAction` |
|----------|------|-----------------|
| 保存草稿 | `POST` 或 `PUT /projects` | `DRAFT` |
| 发布项目 | `POST` 或 `PUT /projects` | `PUBLISH` |

> 「预览」按钮当前为原型（`console.info`），不调用后端；若后续接入可增加 `GET /projects/preview` 返回卡片快照。

---

### 05.2）发布笔记

```mermaid
sequenceDiagram
  participant View as PublishNoteView
  participant Hook as usePublishNoteForm
  participant Upload as /uploads/*
  participant API as Backend API

  View->>Hook: 点击「保存草稿」/「发布笔记」
  Hook->>Hook: 校验 cover / video / body

  opt 封面仍为 blob 或未上传
    Hook->>Upload: GET /uploads/check-md5（可选）
    Hook->>Upload: POST /uploads/note-cover
    Upload-->>Hook: data = coverUrl（字符串）
  end

  opt 视频笔记且 video 未上传
    Hook->>Upload: GET /uploads/check-md5（可选）
    Hook->>Upload: POST /uploads/note-video
    Upload-->>Hook: data = videoUrl；duration 由前端本地解析
  end

  alt 首次提交
    Hook->>API: POST /notes
  else 已有 noteId
    Hook->>API: PUT /notes/{noteId}
  end
  API-->>Hook: noteId + contentTypeCode + status
  Hook-->>View: Toast / 跳转笔记详情或个人空间
```

| 用户操作 | 前置上传 | 主接口 | `publishAction` |
|----------|----------|--------|-----------------|
| 保存草稿 | 封面建议上传（或允许 data URL 暂存，联调约定） | `POST/PUT /notes` | `DRAFT` |
| 发布笔记 | 封面必填；视频需 `note-video` | `POST/PUT /notes` | `PUBLISH` |

---

## 06）详情读接口

> 消费组件：`ProjectDetailPage` / `NoteDetailPage`  
> 前端类型：`ProjectDetailPayload`、`NoteArticleDetailPayload`  
> 路由建议：发布/列表跳转时携带 `projectId` / `noteId`（如 `/project/detail?id=90001`），详情页调用下列接口；`PREVIEW` 仍为发布页本地预览，**无对应读接口**。

### 06.1）查询项目详情

- **Method**：`GET`
- **Path**：`/projects/{projectId}`
- **Auth**：条件（见 §01.2）
- **说明**：供 `ProjectDetailView` 渲染标题、合作信息、技能标签与 Markdown 需求详情。

#### Path Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `projectId` | number | 是 | `project.id` |

#### Response Data

```json
{
  "projectId": 90001,
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
  "updatedAt": "2026-05-22T11:00:00+08:00"
}
```

| 字段 | 类型 | 说明 | 数据库来源 |
|------|------|------|------------|
| `projectId` | number | 项目 ID | `project.id` |
| `title` | string | 标题 | `project.title` |
| `summary` | string | 摘要 | `project.preview` |
| `channel` | string | `enterprise` \| `campus` | 由 `project.category` 反查：`COMMERCIAL`→`enterprise`，`RECRUITMENT`→`campus` |
| `campusRecruitType` | string \| null | 高校子类型 | `project.recruitment_type`；商业项目为 `null` |
| `description` | string | Markdown 正文 | `project.description` |
| `descriptionEditorType` | string | `MARKDOWN` \| `RICHTEXT` | `project.editor_type` |
| `amount` | string \| null | 预算展示文案 | `project_commercial_secret.total_budget`（仅 `COMMERCIAL`）；招募项目返回 `null`，前端展示占位 |
| `level` | string | 难度等级 | `project.level` |
| `duration` | string \| null | 周期 | `project.duration` |
| `teamSize` | string \| null | 团队规模 | `project.team_size` |
| `skillTags` | string[] | 技能标签 | `project.tags` JSON |
| `deadline` | string \| null | `YYYY-MM-DD` | `project.deadline` |
| `status` | string | `DRAFT` \| `OPEN` \| `ONGOING` \| `CLOSED` | `project.status` |
| `publishedAt` | string \| null | 发布时间 | `project.published_at` |
| `updatedAt` | string | 最后更新 | `project.updated_at` |

**前端映射（`ProjectDetailPayload`）**

| API 字段 | 前端字段 | 规则 |
|----------|----------|------|
| `channel` + `campusRecruitType` | `channelLabel` | 前端 `resolveProjectChannelLabel()` 本地计算 |
| `status` | `publishStatus` | `DRAFT`→`DRAFT`；`OPEN|ONGOING|CLOSED`→`PUBLISHED` |
| `updatedAt` | `updatedAt` | ISO 字符串 |
| — | `PREVIEW` | 仅发布页路由 state / sessionStorage，**不来自 API** |

**可见性**

| `project.status` | 未登录 | 登录非 owner | owner |
|------------------|--------|--------------|-------|
| `DRAFT` | 404 | 403 | ✅ |
| `OPEN` / `ONGOING` / `CLOSED` | ✅ | ✅ | ✅ |

#### 常见错误码

- `PROJECT_NOT_FOUND`
- `PROJECT_NOT_OWNER`（草稿且非 owner）
- `UNAUTHORIZED`（草稿未登录）

---

### 06.2）查询笔记详情

- **Method**：`GET`
- **Path**：`/notes/{noteId}`
- **Auth**：条件（见 §01.2）
- **说明**：供 `NoteArticleDetailView`（图文）及后续视频详情页渲染；按 `content_type_code` 前缀区分类型。

#### Path Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `noteId` | number | 是 | `note.id` |

#### Response Data（图文）

```json
{
  "noteId": 80001,
  "contentType": "图文",
  "contentTypeCode": "TXa1B2c3D4e5F",
  "title": "大三暑期实习投递复盘",
  "summary": "从简历、笔试到面试的完整时间线与踩坑总结。",
  "body": "# 背景\n\n## 时间线\n...",
  "tags": ["求职经验", "实习"],
  "coverUrl": "https://cdn.example.com/notes/cover/abc123.jpg",
  "author": {
    "name": "张同学",
    "handle": "zhang",
    "avatarUrl": "https://cdn.example.com/avatar/u10001.jpg"
  },
  "publishTime": "2026-05-22T11:30:00+08:00",
  "updateTime": "2026-05-22T11:30:00+08:00",
  "views": 128,
  "comments": 6,
  "favorites": 24,
  "status": "PUBLISHED",
  "parentContentTypeCode": "VDx9Y8z7W6v5U",
  "visibility": "PUBLIC"
}
```

#### Response Data（视频，增量字段）

```json
{
  "noteId": 80002,
  "contentType": "视频",
  "contentTypeCode": "VDx9Y8z7W6v5U",
  "title": "如何设计一个高质量用户系统",
  "summary": "结合权限模型与可观测方案的经验分享。",
  "body": null,
  "tags": ["系统设计"],
  "coverUrl": "https://cdn.example.com/notes/cover/frame.jpg",
  "videoUrl": "https://cdn.example.com/notes/video/xyz789.mp4",
  "videoDuration": 186,
  "author": { "name": "李同学", "handle": "li", "avatarUrl": null },
  "publishTime": "2026-05-20T09:00:00+08:00",
  "updateTime": "2026-05-20T09:00:00+08:00",
  "views": 520,
  "comments": 18,
  "favorites": 73,
  "status": "PUBLISHED",
  "parentContentTypeCode": null,
  "visibility": "PUBLIC"
}
```

| 字段 | 类型 | 说明 | 数据库来源 |
|------|------|------|------------|
| `noteId` | number | 笔记 ID | `note.id` |
| `contentType` | string | `图文` \| `视频` | 由 `note.content_type_code` 前缀：`TX*`→`图文`，`VD*`→`视频` |
| `contentTypeCode` | string | 类型编码 | `note.content_type_code` |
| `title` | string | 标题 | `note.title` |
| `summary` | string | 摘要 | `note.summary` |
| `body` | string \| null | Markdown 正文 | `note.content`；视频笔记为 `null` |
| `tags` | string[] | 话题标签 | `note.tags` JSON |
| `coverUrl` | string | 封面 | `note.cover_url` |
| `videoUrl` | string | 视频地址 | `note.video_url`；仅 `contentType=视频` |
| `videoDuration` | number | 时长（秒） | `note.video_duration`；仅视频 |
| `author.name` | string | 作者昵称 | `user_profile.nick_name`（空则回退「用户」） |
| `author.handle` | string | 作者 handle | `user_profile.nick_name` slug 或 `user_{id}` |
| `author.avatarUrl` | string \| null | 头像 | `user_profile.avatar_url` |
| `publishTime` | string | 展示用发布时间 | `COALESCE(note.published_at, note.created_at)` |
| `updateTime` | string | 最近更新 | `note.updated_at` |
| `views` | number | 浏览量 | `note.view_count` |
| `comments` | number | 评论数 | `note.comment_count` |
| `favorites` | number | 收藏数 | `note.collect_count` |
| `status` | string | `DRAFT` \| `PUBLISHED` | `note.status` |
| `parentContentTypeCode` | string \| null | 父笔记 contentTypeCode（`VD` + 11 位）；学习笔记关联其父视频，顶级笔记为 `null` | `t_user_note_detail.parent_content_type_code` |
| `visibility` | string | `PUBLIC` \| `PRIVATE` | 笔记可见范围 | `note.visibility` |

**前端映射（`NoteArticleDetailPayload`）**

| API 字段 | 前端字段 | 规则 |
|----------|----------|------|
| `body` | `body` | 图文直接映射 |
| `status` | `publishStatus` | `DRAFT`→`DRAFT`；`PUBLISHED`→`PUBLISHED` |
| `publishTime` / `updateTime` | 同名字段 | ISO 或前端格式化 |
| — | `PREVIEW` | 仅发布页本地预览 |

**可见性**

| `note.status` | `note.visibility` | 未登录 | 登录非 owner | owner |
|---------------|-------------------|--------|--------------|-------|
| `DRAFT` | — | 404 | 403 | ✅ |
| `REVIEWING` | — | 404 | 404 | ✅ |
| `PUBLISHED` | `PUBLIC` | ✅ | ✅ | ✅ |
| `PUBLISHED` | `PRIVATE` | 404 | 404 | ✅ |
| `BANNED` | — | 404 | 404 | 404 |

> 公开读 `PUBLISHED` 笔记时，满足下列条件才 `view_count +1`：**非发布者本人**；**同一访问者 30 分钟内不重复计次**（登录按 `userId`，未登录按 IP）。

#### 常见错误码

- `NOTE_NOT_FOUND`（含 BANNED 对外隐藏）
- `NOTE_NOT_OWNER`（草稿且非 owner）
- `UNAUTHORIZED`（草稿未登录）

---

### 06.3）详情页调用时序

```mermaid
sequenceDiagram
  participant List as 频道卡片 / 个人空间
  participant Detail as ProjectDetailPage / NoteDetailPage
  participant API as Backend API

  List->>Detail: 路由携带 projectId / noteId
  Detail->>API: GET /projects/{id} 或 GET /notes/{id}
  alt 已发布
    API-->>Detail: 200 + 详情 JSON
  else 草稿且非 owner
    API-->>Detail: 403 PROJECT_NOT_OWNER / NOTE_NOT_OWNER
  else 不存在或 BANNED
    API-->>Detail: 404
  end
  Detail->>Detail: 映射为 ProjectDetailPayload / NoteArticleDetailPayload
```

| 入口 | 路由参数 | 读接口 |
|------|----------|--------|
| 企业实战 / 高校招募卡片 | `projectId` | `GET /projects/{projectId}` |
| 经验分享卡片 | `noteId` | `GET /notes/{noteId}` |
| 个人空间「我的项目/笔记」 | `id` | 同上 |
| 发布页保存后跳转 | 使用 `?id=` 跳转详情页，由 `GET /projects/{id}` 或 `GET /notes/{id}` 拉取服务端数据 |

---

## 07）联调检查清单

- [x] 登录后 `localStorage` 存在 `access_token`
- [x] 项目：`channel` → `category`，`campusRecruitType` → `recruitment_type`（含 `PERSONAL_RECRUIT`）
- [x] 项目：新建默认 `status=DRAFT`，`published_at=NULL`；发布后为 `OPEN` 且写入 `published_at`
- [x] 项目：发布权限按 `user_auth_link.role` 校验（PM / MENTOR / STUDENT）
- [x] 项目：仅保密商业项目写入 `project_commercial_secret`；招募项目不需要
- [x] 项目：`description` 为 Markdown（Milkdown）；`editor_type` 暂保留，后端默认 `MARKDOWN`
- [x] 笔记：无 `contentSource` / `contentFileName` / `images`（`videoDescription` 为前端展示字段）
- [x] 笔记：库表已移除 `editor_type` 列，API 请求/响应不再包含 `editorType`
- [x] 笔记：`contentType=图文` 才写 `content`；视频不写 `content`
- [x] 笔记：草稿亦必填 `coverUrl`；`contentType` 创建后不可变
- [x] 笔记：`content_type_code` 使用 NanoID 生成 11 位后缀，碰撞重试
- [x] 笔记详情：新增 `parentContentTypeCode` 字段（`t_user_note_detail.parent_content_type_code`），学习笔记关联父视频
- [x] 读列表：含 `id` 字段；按 `COALESCE(published_at, created_at)` 降序
- [x] 个人空间项目列表：返回 `ProjectItem` 对齐字段（`preview`、`category`、`ownerOrganization`、`teamSize`、`duration` 等）
- [x] 项目详情：`GET /projects/{id}` 可映射 `ProjectDetailPayload`
- [x] 项目详情：`amount` 仅商业项目来自 `project_commercial_secret.total_budget`；招募为 `null`
- [x] 笔记详情：`GET /notes/{id}` 含 `author`、互动数；图文返回 `body`，视频返回 `videoUrl`
- [x] 笔记详情：`publishTime` 使用 `COALESCE(published_at, created_at)`
- [x] 草稿详情：仅 owner 可读；已发布内容可匿名读
- [x] 上传：`POST /uploads/note-cover|note-video` 的 `data` 为 URL **字符串**
- [x] 上传：同 MD5 秒传；`GET /uploads/check-md5` 命中可跳过 POST
- [x] 上传：视频 `videoDuration` 由前端本地解析；封面单独上传

---

## 第四部分：Feed 推荐与互动

> 前端模块：`apps/web-client/src/api/feed`  
> 缓存架构：Spring Cache（当前本地内存 `ConcurrentMapCacheManager`）；未来引入 Redis 后业务代码零改动。

### 01）Feed 读接口总览

| 接口 | Method | Path | Auth | 前端封装 |
|------|--------|------|------|----------|
| 首页个性化推送 | GET | `/feed/home` | 可选 | `getHomeFeed` |
| 首页「换一换」混排 | GET | `/feed/home/shuffle` | 可选 | `shuffleHomeFeed` |
| 项目专区推送 | GET | `/feed/projects` | 可选 | `getProjectFeed` |
| 项目专区「换一换」 | GET | `/feed/projects/shuffle` | 可选 | `shuffleProjectFeed` |
| 笔记专区推送 | GET | `/feed/notes` | 可选 | `getNoteFeed` |
| 笔记专区「换一换」 | GET | `/feed/notes/shuffle` | 可选 | `shuffleNoteFeed` |
| 相似笔记推荐 | GET | `/feed/notes/{uid}/similar` | 否 | `getSimilarNotes` |

---

### 02）首页个性化推送

- **Method**：`GET`
- **Path**：`/feed/home`
- **Auth**：可选（未登录走冷启动；登录后按 `user_tag_interests` 加权）
- **Cache**：`@Cacheable("home_feed", key=userId)`

固定返回两类内容，**分别排序、分别截断**：

| 区块 | 条数 | `contentType` |
|------|------|---------------|
| 笔记 | **5** | `NOTE` |
| 项目 | **10** | `PROJECT` |

#### Response `data`

```json
{
  "notes": [
    {
      "contentType": "NOTE",
      "noteType": "IMAGE_TEXT",
      "uid": "TX20212345678",
      "title": "Spring Boot 实战笔记",
      "summary": "实践经验总结",
      "coverUrl": "http://localhost:8081/uploads/covers/xxx.jpg",
      "tags": ["Spring Boot", "后端"],
      "authorNickname": "代码小能手",
      "authorOrganization": "清华大学",
      "authorAvatar": "http://localhost:8081/uploads/avatars/user.jpg",
      "views": 128,
      "likes": 24,
      "favorites": 9,
      "publishTime": "2026-05-10 14:20",
      "score": 2.415
    }
  ],
  "projects": [
    {
      "contentType": "PROJECT",
      "projectCategory": "COMMERCIAL",
      "recruitmentType": null,
      "uid": "PR20212345678",
      "title": "基于大模型的智能问答系统开发",
      "preview": "构建企业级智能问答平台，支持多知识库接入与权限管理，提升内部知识检索效率。",
      "coverUrl": "http://localhost:8081/uploads/project-covers/qa-system.jpg",
      "tags": [{ "label": "AI开发" }, { "label": "Python" }],
      "ownerOrganization": "智源科技有限公司",
      "logoSvgUrl": null,
      "level": "R",
      "teamSize": "3-5人",
      "duration": "3个月",
      "publishTime": "2026-04-01 10:00",
      "views": 0,
      "likes": 0,
      "score": 1.872
    }
  ]
}
```

**排序公式（服务端）**

| 因子 | 权重 |
|------|------|
| 标签匹配分（`user_tag_interests.weight` 累加） | × 时间衰减 × 0.7 |
| 热度分 `log(1+like+collect×1.5)` | × 0.3 |
| 时间衰减 | `1 / (1 + days×0.05)` |

**Feed 卡片字段**

| 字段 | 适用 | 取值 / 说明 |
|------|------|-------------|
| `uid` | 笔记 / 项目 | 对外唯一标识；笔记 `TX…`/`VD…`，项目 `PR…`；**禁止**返回自增 `id` |
| `noteType` | 笔记 | `IMAGE_TEXT` \| `VIDEO` |
| `projectCategory` | 项目 | `COMMERCIAL` \| `RECRUITMENT`；映射前端 `ProjectItem.category` |
| `recruitmentType` | 项目 | 仅 `RECRUITMENT` 有效，商业为 `null` |
| `preview` | 项目 | 卡片摘要 → `project.preview` |
| `coverUrl` | 笔记 / 项目 | 卡片封面图 URL |
| `authorNickname` | 笔记 | 作者昵称 → `ProfileNoteItem.authorNickname`（**禁止**实名 `name`） |
| `authorOrganization` | 笔记 | 学校 / 组织 → 作者栏 |
| `authorAvatar` | 笔记 | 作者头像 URL |
| `videoDuration` | 笔记 | 仅 `VIDEO`；`MM:SS` 或秒数 |
| `likes` | 笔记 | 点赞数 → 前端 `comments`（网格 ThumbsUp） |
| `favorites` | 笔记 | 收藏数 → 前端 `favorites`（网格 Heart） |
| `tags` | 项目 | `{ label: string }[]`；笔记为 `string[]` |
| `ownerOrganization` | 项目 | 发布主体名称 |
| `logoSvgUrl` | 项目 | 主体 Logo SVG；`coverUrl` 缺失时可作回退 |
| `level` / `teamSize` / `duration` | 项目 | 等级与元信息行 |

> 项目列表卡片**无需返回** `summary`、`authorName`、`ownerName`、`publisher`、`budget` / `amount`；预算见 `GET /projects/{uid}`。

---

### 03）项目专区推送

- **Method**：`GET`
- **Path**：`/feed/projects`
- **Auth**：可选
- **Cache**：`@Cacheable("project_feed", key=userId:category:limit)`

**严格分栏**：仅返回指定 `category` 的项目。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `category` | string | 是 | `COMMERCIAL` \| `RECRUITMENT` |
| `limit` | number | 否 | 默认 `10`，最大 `30` |

#### Response `data`

`ContentVO[]`，结构与首页项目卡片一致。

```json
[
  {
    "contentType": "PROJECT",
    "projectCategory": "COMMERCIAL",
    "recruitmentType": null,
    "uid": "PR20212345678",
    "title": "基于大模型的智能问答系统开发",
    "preview": "构建企业级智能问答平台…",
    "coverUrl": "http://localhost:8081/uploads/project-covers/qa-system.jpg",
    "tags": [{ "label": "AI开发" }, { "label": "Python" }],
    "ownerOrganization": "智源科技有限公司",
    "logoSvgUrl": null,
    "level": "R",
    "teamSize": "3-5人",
    "duration": "3个月",
    "publishTime": "2026-04-01 10:00",
    "views": 0,
    "likes": 0,
    "score": 1.872
  }
]
```

---

### 04）笔记专区推送

- **Method**：`GET`
- **Path**：`/feed/notes`
- **Auth**：可选

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `noteType` | string | 是 | `IMAGE_TEXT` \| `VIDEO` |
| `limit` | number | 否 | 默认 `10`，最大 `30` |

#### Response `data`

```json
[
  {
    "contentType": "NOTE",
    "noteType": "VIDEO",
    "uid": "VD1T1w2K4x6O8",
    "title": "项目复盘视频",
    "summary": "5 分钟讲清交付流程",
    "coverUrl": "http://localhost:8081/uploads/covers/xxx.jpg",
    "tags": ["项目管理"],
    "authorNickname": "复盘君",
    "views": 256,
    "likes": 18,
    "publishTime": "2026-05-12 09:00",
    "score": 2.103
  }
]
```

---

### 05）相似笔记推荐

- **Method**：`GET`
- **Path**：`/feed/notes/{uid}/similar`
- **Auth**：否

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `uid` | string | — | 源笔记 uid（路径参数） |
| `limit` | number | 10 | 最大 30 |

- 同源标签 Jaccard + 点赞 tie-break；无标签时降级高赞列表
- **不用于「换一换」**：`uid` 不变则结果固定，仅首次进入详情拉取一次

---

### 06）「换一换」混排推送

| 场景 | Path | 机制 A（缓存分页） | 机制 B（实时洗牌） |
|------|------|-------------------|-------------------|
| 首页 | `/feed/home/shuffle` | 递增 `page`，不传 `seed` | 传 `seed`，`page=1` |
| 项目专区 | `/feed/projects/shuffle` | 同上 + `category` | 同上 |
| 笔记专区 | `/feed/notes/shuffle` | 同上 + `noteType` | 同上 |

**公共 Query**：`page`（默认 1）、`size`（首页 15 / 专区 10）、`seed`（机制 B）

#### Response `data`

```json
{
  "items": [{ "contentType": "NOTE", "noteType": "IMAGE_TEXT", "uid": "TX20212345678", "title": "..." }],
  "page": 2,
  "size": 15,
  "total": 128,
  "pageWrapped": false,
  "shuffleMode": "CACHE_PAGE"
}
```

---

### 07）埋点与互动

#### POST `/feed/events`（Auth：是）

| 场景 | eventType | 说明 |
|------|-----------|------|
| 进入详情 | `VIEW_DETAIL` | **必须**（登录用户），携带 `tags` |
| 点赞 | `LIKE` | 建议，与 PUT like 并行 |
| 收藏 | `COLLECT` | 建议 |

```json
{
  "eventType": "VIEW_DETAIL",
  "targetType": "NOTE",
  "targetUid": "TX20212345678",
  "tags": ["Spring Boot", "后端"]
}
```

#### PUT `/interactions/like` | `/interactions/collect`

```json
{
  "targetType": "NOTE",
  "targetUid": "TX20212345678",
  "active": true
}
```

#### POST `/interactions/view`（视频播放计次等）

```json
{
  "targetType": "NOTE",
  "targetUid": "VD1T1w2K4x6O8"
}
```

---

### 08）Feed 项目卡片与个人空间对齐

个人空间 `projects[]` 与 Feed 项目 `ContentVO` 建议共用 Assembler，字段差异：

| 场景 | 分类字段 | 封面字段 |
|------|----------|----------|
| 个人空间 | `category` | `coverUrl` |
| Feed | `projectCategory` | `coverUrl` |

统一项目卡片 VO 见第二部分 §01.4、`§03`、`§04`；`coverUrl` 待跟进见 [`API-request.md`](./API-request.md)。

---

### 09）内容读写 `uid` 约定

| 资源 | 路径 | 响应主键 |
|------|------|----------|
| 笔记 | `GET/PUT /notes/{uid}` | `data.uid` |
| 项目 | `GET/PUT /projects/{uid}` | `data.uid` |

| uid 前缀 | 资源 |
|----------|------|
| `TX` / `VD` + 11 位 | 笔记 |
| `PR` + 11 位 | 项目 |

- 埋点 / 互动请求体使用 **`targetUid`**（string）
- Feed / 列表禁止返回自增 `id`

---

### 10）Feed 联调检查清单

- [ ] 请求体使用 `targetUid`，勿传数字 `targetId`
- [ ] 列表 / Feed 使用 `uid` 跳转详情
- [ ] `GET /feed/projects?category=` 严格分栏
- [ ] 项目 Feed 含 `preview`、`coverUrl`、`ownerOrganization`、`level` 等
- [ ] 登录用户进入详情后 `POST /feed/events`（VIEW_DETAIL）
- [ ] 点赞后 Feed 缓存失效、列表刷新

---

## 08）错误码汇总

| 错误码 | HTTP 建议 | 说明 |
|--------|-----------|------|
| `UNAUTHORIZED` | 401 | 未登录 |
| `ACCESS_TOKEN_EXPIRED` | 401 | token 过期 |
| `VALIDATION_FAILED` | 400 | 参数校验失败 |
| `PROJECT_NOT_FOUND` | 404 | 项目不存在 |
| `PROJECT_NOT_OWNER` | 403 | 非项目所有者 |
| `PROJECT_NOT_PUBLIC` | 403 | 草稿项目且当前用户非 owner（可与 `PROJECT_NOT_OWNER` 合并） |
| `PROJECT_PUBLISH_FORBIDDEN` | 403 | 当前角色无权发布该频道项目 |
| `AMOUNT_PARSE_FAILED` | 400 | 金额解析失败 |
| `NOTE_NOT_FOUND` | 404 | 笔记不存在 |
| `NOTE_NOT_OWNER` | 403 | 非笔记作者 |
| `NOTE_NOT_PUBLIC` | 403 | 草稿笔记且当前用户非 owner（可与 `NOTE_NOT_OWNER` 合并） |
| `NOTE_BANNED` | 404 | 笔记已封禁（对外统一 404） |
| `COVER_REQUIRED` | 400 | 缺少封面 |
| `VIDEO_REQUIRED` | 400 | 视频笔记缺少视频 |
| `CONTENT_REQUIRED` | 400 | 图文笔记缺少正文 |
| `UPLOAD_FAILED` | 500 | 媒体上传失败 |

---

## 第五部分：机构空间（`OrganizationView` / `ProfileMenuContext`）

> **Base**：`/api/v1/client/entity-profile`  
> **Query**：所有接口均需要 `entityCode`  
> **前端模块**：`apps/web-client/src/api/entityProfile`  
> **页面**：`OrganizationView`（`src/pages/ProfileSpace/variants/OrganizationView/`）

### 01）实验室展示规则

| `entityCode`（仅数字位数） | 展示实验室 Tab |
|---------------------------|----------------|
| 5 位（高校） | ✅ |
| 非 5 位（18 位信用代码等） | ❌ `teams` / `teamsPreview` 为空 |

### 02）机构空间读接口列表

| # | Method | Path | Query | 说明 |
|---|--------|------|-------|------|
| 1 | GET | `/entity-profile/space` | `entityCode` | 页壳：Hero + 侧栏 + teamsPreview + membersPreview |
| 2 | GET | `/entity-profile/home` | `entityCode`, `teamLimit?`, `projectLimit?`, `noteLimit?`, `memberLimit?` | 主页 Tab 预览 |
| 3 | GET | `/entity-profile/teams` | `entityCode`, `page?`, `pageSize?` | 实验室 Tab 分页 |
| 4 | GET | `/entity-profile/members` | `entityCode`, `page?`, `pageSize?` | 人员 Tab 分页 |
| 5 | GET | `/entity-profile/projects` | `entityCode`, `page?`, `pageSize?` | 项目 Tab 分页 |
| 6 | GET | `/entity-profile/notes` | `entityCode`, `page?`, `pageSize?`, `contentType?` | 笔记 Tab 分页 |
| 7 | GET | `/entity-profile/menu` | `entityCode` | 机构顶部菜单 |

### 03）`GET /entity-profile/space` 响应

```json
{
  "entityCode": "10598",
  "coreProfile": {
    "entityCode": "10598",
    "name": "深圳大学",
    "intro": "...",
    "location": "广东·深圳",
    "type": "UNIVERSITY",
    "logoUrl": null,
    "bannerUrl": null,
    "teamCount": 3
  },
  "extendedProfile": { "announcement": "..." },
  "teamsPreview": [
    { "teamUid": "LB...", "name": "...", "description": "...", "logoUrl": null, "memberCount": 2 }
  ],
  "membersPreview": [
    { "uid": "US...", "nickname": "...", "realName": "...", "role": "MENTOR", "avatarUrl": null, "level": "UR" }
  ],
  "infoRows": [{ "label": "主体代码", "value": "10598" }]
}
```

`membersPreview` / `members`：仅 `user_auth_link.role` 为 `PM` / `MENTOR` / `COUNSELOR` 且 `audit_status=APPROVED`、`is_active=1`。

### 04）成员项 DTO（`EntityProfileMemberDto`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 用户对外 uid |
| `nickname` | string | 昵称 |
| `realName` | string \| null | 实名 |
| `role` | string | `PM`（项目经理） / `MENTOR`（导师） / `COUNSELOR`（辅导员） |
| `avatarUrl` | string \| null | 头像 |
| `level` | string \| null | `N`/`R`/`SR`/`SSR`/`UR` |

### 05）机构空间写接口列表

> **权限**：仅 `userRole=organization-admin` 可调用。请求头需 `Authorization: Bearer <token>`。

| # | Method | Path | Query / Body | 说明 |
|---|--------|------|--------------|------|
| 8 | POST | `/entity-profile/team` | `{ entityCode, name, leaderUid? }` | 创建下属实验室 |
| 9 | PUT | `/entity-profile/team` | `?teamUid=` + `{ name?, leaderUid? }` | 更新实验室信息 |
| 10 | DELETE | `/entity-profile/team` | `?teamUid=` | 删除实验室 |
| 11 | POST | `/entity-profile/member` | `{ entityCode, uid, role }` | 添加机构关联人员（role 由前端选择，后端校验） |
| 12 | DELETE | `/entity-profile/member` | `?entityCode=&uid=` | 移除机构关联人员 |

### 06）`GET /entity-profile/menu` 响应

| 字段 | 说明 |
|------|------|
| `entityCode` | 主体代码 |
| `entityName` | 展示名 |
| `logoUrl` | 头像/Logo |
| `boundAdminCount` | 已绑定 TOTP 管理员数 |
| `minAdminCount` | 2 |
| `maxAdminCount` | 3 |
| `entityFullyActivated` | 是否已达标 |

### 07）错误码

| message | HTTP |
|---------|------|
| `ENTITY_NOT_FOUND` | 404 |
| `ENTITY_NOT_ACCESSIBLE` | 403 |
| `INVALID_ENTITY_CODE` | 400 |

### 08）认证状态与字段

后端在登录/刷新 token 响应中返回新的认证相关字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `verifyStatus` | string | `"unverified"` — 未认证；`"identity_only"` — 仅身份验证（已实名但未机构认证）；`"verified"` — 已全部认证 |
| `verifiedOrganization` | string | 全部认证通过时返回主体名称，`identity_only` 时为空字符串 |

前端 `AuthUserProfile` 已同步新增 `verifyStatus` / `verifiedOrganization`。

### 09）`POST /team/create` — 创建学生团队

> **消费方**：`CreateTeamModal.tsx` — 个人主页侧边栏「创建团队」

#### Request

- **Method**：`POST`
- **Path**：`/team/create`
- **Auth**：是（已实名 STUDENT 或 MENTOR）

```json
{
  "name": "我的项目团队",
  "description": "聚焦前端工程化实践",
  "leaderUid": "US00000000099"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 团队名称（≤32 字符） |
| `description` | string | 否 | 团队简介（≤120 字符） |
| `leaderUid` | string | 否 | 初始负责人 UID，输入 US+11 位时自动调用 public-preview 回填名称 |

#### Response `data`

```json
{
  "teamUid": "ST00000007001",
  "name": "我的项目团队"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `teamUid` | string | 新团队 uid |
| `name` | string | 团队名称 |

#### 常见错误码

| message | HTTP |
|---------|------|
| `TEAM_NAME_REQUIRED` | 400 |
| `TEAM_NAME_TOO_LONG` | 400 |
| `USER_NOT_VERIFIED` | 403 |
| `USER_NOT_FOUND` | 404 |


---

## 第六部分：双阶段认证

> **消费页面**：`VerificationPage`（`/verification`）  
> **前端模块**：`apps/web-client/src/api/verification`  
> **Base**：`/api/v1/client`

双阶段认证流程：**阶段一**人脸核身 → **阶段二**机构身份激活（教职工通道 / 学生快捷通道）。

### 接口总览

| # | Method | Path | 说明 | 前端封装 |
|---|--------|------|------|----------|
| 1 | POST | `/verification/face/init` | 初始化人脸核身 | `initFaceVerification` |
| 2 | GET | `/verification/face/result` | 查询人脸核身结果 | `queryFaceVerificationResult` |
| 3 | GET | `/verification/entities/search` | 检索机构 | `searchEntities` |
| 4 | POST | `/verification/staff-apply` | 教职工认证申请 | `applyStaffVerification` |
| 5 | POST | `/verification/codes/generate` | 生成认证母码 | `generateMasterCode` |
| 6 | POST | `/verification/codes/sub-code` | 生成认证子码 | `generateSubCode` |
| 7 | GET | `/verification/codes` | 获取认证码列表 | `getVerificationCodeList` |
| 8 | POST | `/verification/codes/invalidate` | 无效化认证码 | `invalidateVerificationCode` |
| 9 | POST | `/verification/codes/activate` | 学生认证激活 | `activateStudentVerification` |
| 10 | POST | `/verification/codes/renew` | 延期认证码 | `renewVerificationCode` |
| 11 | GET | `/verification/codes/students` | 查看认证学生列表 | `getVerificationCodeStudents` |
| 12 | GET | `/verification/codes/sub-codes` | 查看附属子码列表 | `getSubCodeList` |

### 调用时序

```
VerificationPage
  ├── 阶段一：填写姓名+身份证 → POST /verification/face/init
  │     └── iframe 核身 → GET /verification/face/result?token=
  └── 阶段二：机构认证
        ├── Staff：GET /verification/entities/search → POST /verification/staff-apply → /profile
        └── Student：POST /verification/codes/activate → /profile

VerificationCodeManageModal
  ├── 打开弹窗 → GET /verification/codes
  ├── 停用 → POST /verification/codes/invalidate → 刷新列表
  ├── 延期 → POST /verification/codes/renew → 刷新列表
  ├── [母码] 查看附属子码 → GET /verification/codes/sub-codes?masterCode=
  └── [子码] 查看认证学生 → GET /verification/codes/students?code=
```

---

### 1) `POST /verification/face/init` — 初始化人脸核身

- **Method**：`POST`
- **Path**：`/verification/face/init`
- **Auth**：是

#### Request

```json
{ "realName": "张三", "idCard": "440300199001011234" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `realName` | string | 是 | 身份证上的真实姓名 |
| `idCard` | string | 是 | 18 位身份证号 |

#### Response `data`

```json
{ "url": "about:blank", "token": "face_mock_abc123", "expireInSec": 300 }
```

---

### 2) `GET /verification/face/result` — 查询人脸核身结果

- **Method**：`GET`
- **Path**：`/verification/face/result`
- **Auth**：是
- **Query**：`token=`

#### Response `data`

```json
{ "passed": true, "realName": "张三", "idCardMasked": "440300********1234" }
```

---

### 3) `GET /verification/entities/search` — 检索机构

- **Method**：`GET`
- **Path**：`/verification/entities/search`
- **Auth**：是
- **Query**：`keyword=`

#### Response `data`

```json
{ "entities": [{ "entityCode": "10598", "name": "深圳大学", "type": "UNIVERSITY" }] }
```

---

### 4) `POST /verification/staff-apply` — 教职工认证申请

- **Method**：`POST`
- **Path**：`/verification/staff-apply`
- **Auth**：是

#### Request

```json
{ "entityCode": "10598", "realName": "张三", "staffNumber": "SZU2024001" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `entityCode` | string | 是 | 机构主体代码 |
| `realName` | string | 是 | 阶段一核身通过的实名 |
| `staffNumber` | string | 是 | 工号/员工编号 |

#### Response

```json
{ "applicationId": "APP-20260607-aB7x9K2mN4pQ", "status": "PENDING" }
```

#### 实现说明

- 写入 `user_auth_link`（`audit_status=PENDING, is_active=0`）
- 写入 `sys_approval_flows` 审批流
- 角色自动判定：企业 → `PM`，学校 → `MENTOR`

---

### 5) `POST /verification/codes/generate` — 生成母码

> **消费方**：机构管理员生成院级认证母码

- **Method**：`POST`
- **Path**：`/verification/codes/generate`
- **Auth**：是（需机构管理员 CLIENT_ORG token）

#### Request

```json
{ "maxQuota": 1000, "description": "全校通用认证码" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `maxQuota` | number | 否 | 母码总额度（默认 1000，上限 5000） |
| `description` | string | 否 | 用途描述 |

#### Response `data`

```json
{ "code": "10598-2026-00123", "entityCode": "10598", "maxQuota": 1000, "expireTime": "2026-06-22 23:59:59" }
```

#### 实现说明

- 母码格式：`{entityCode}-{year}-{5位数字}`，年份由服务器当前时间自动推导
- 认证码有效期：创建日期 + 14 天，当天 23:59:59 失效
- `expireTime` 响应字段返回具体失效时间（`yyyy-MM-dd HH:mm:ss`）

---

### 6) `POST /verification/codes/sub-code` — 生成子码

> **消费方**：辅导员在母码下创建班级/专业级子码

- **Method**：`POST`
- **Path**：`/verification/codes/sub-code`
- **Auth**：是（需用户具有 COUNSELOR 角色，仅辅导员可操作）

#### Request

```json
{ "masterCode": "10598-2026-00123", "maxQuota": 50, "graduationYear": 2030, "description": "计算机专业 3 班认证码" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `masterCode` | string | 是 | 母码 code |
| `maxQuota` | number | 否 | 子码额度（默认 50，上限 500） |
| `graduationYear` | number | 否 | 毕业年份（可选，仅子码可填写，不填则 null） |
| `description` | string | 否 | 用途描述（如：计算机专业 3 班） |

#### Response `data`

```json
{ "code": "10598-2026-00123-0456", "entityCode": "10598", "graduationYear": 2030, "maxQuota": 50, "expireTime": "2026-06-22 23:59:59" }
```

#### 实现说明

- 子码格式：`{母码code}-{4位数字}`
- 权限分离：仅 COUNSELOR（辅导员）可创建子码，MENTOR（导师）负责项目指导，不参与行政事务
- 创建子码时原子扣减母码额度
- 认证码有效期：创建日期 + 14 天，当天 23:59:59 失效
- `expireTime` 响应字段返回具体失效时间

---

### 7) `POST /verification/codes/activate` — 学生认证码激活

> **消费方**：使用**子码**激活，母码不可直接激活。

- **Method**：`POST`
- **Path**：`/verification/codes/activate`
- **Auth**：是

#### Request

```json
{ "verificationCode": "10598-2026-00123-0456", "studentId": "2024001234", "realName": "张三", "graduationYear": 2030 }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `verificationCode` | string | 是 | 子码 |
| `studentId` | string | 是 | 学号 |
| `realName` | string | 是 | 真实姓名（阶段一核身通过后自动填充） |
| `graduationYear` | number | 是 | 毕业年份 |

#### Response

```json
{ "entityCode": "10598", "entityName": "深圳大学", "role": "STUDENT" }
```

---

### 8) `GET /verification/codes` — 获取认证码列表

- **Method**：`GET`
- **Path**：`/verification/codes`
- **Auth**：是（需机构管理员 `organization-admin` 或辅导员 `COUNSELOR`）

返回机构下的认证码列表（母码+子码）。角色过滤规则：

- `organization-admin`：返回当前机构下所有认证码（母码 + 子码）
- `COUNSELOR`：仅返回 `createdBy` 等于当前登录用户 uid 的子码（`isMaster=false`）

#### Response `data`

```json
{
  "codes": [
    {
      "code": "10598-2026-00123",
      "maxQuota": 1000,
      "usedQuota": 120,
      "description": "全校通用认证码",
      "createdBy": "EAa1B2c3D4e5F",
      "createdByName": "李老师",
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
      "canRenew": false,
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
| `codes[].isActive` | boolean | 是否有效（**必须返回 JSON boolean**） |
| `codes[].isMaster` | boolean | 是否为母码（**必须返回 JSON boolean**） |
| `codes[].canRenew` | boolean | 是否可以延期（**必须返回 JSON boolean**） |
| `codes[].createdAt` | string | 创建时间 |
| `codes[].expireTime` | string | 失效时间（yyyy-MM-dd HH:mm:ss） |
| `total` | number | 总数 |

### 业务规则

- 仅返回当前机构的认证码（母码+子码），按创建时间倒序
- `isActive`：过期自动计算（当前时间 > expireTime 时为 false）；人工停用后也为 false
- `canRenew`：后端根据状态综合判断（人为停用=false；自然过期7天内=true，其余=false）

---

### 9) `POST /verification/codes/invalidate` — 无效化认证码

- **Method**：`POST`
- **Path**：`/verification/codes/invalidate`
- **Auth**：是（需机构管理员）

#### Request

```json
{ "code": "10598-2026-00123" }
```

#### Response

空 body，`code=200` 表示成功。

---

### 10) `POST /verification/codes/renew` — 延期认证码

> **消费方**：`VerificationCodeManageModal` 操作栏「延期」按钮

- **Method**：`POST`
- **Path**：`/verification/codes/renew`
- **Auth**：是（需机构管理员）

#### Request

```json
{ "code": "10598-2026-00123", "newExpireDate": "2026-07-06" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | 是 | 认证码 |
| `newExpireDate` | string | 是 | 延期至日期（yyyy-MM-dd） |

#### Response `data`

```json
{ "code": "10598-2026-00123", "newExpireTime": "2026-07-06 23:59:59" }
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | string | 认证码 |
| `newExpireTime` | string | 新的失效时间（yyyy-MM-dd HH:mm:ss） |

### 业务规则

- 延期至用户指定的日期（精确到天，后端自动加上 `23:59:59`）
- 目标日期不得早于失效时间后一天
- **目标日期不得晚于创建时间 + 28 天**（四周），防止无限延期
- 已停用的认证码不可延期
- 已失效超过 7 天的认证码不可延期
- 延期母码：其下所有子码也一并延期至同一日期
- 有效期内也可以延期（在 28 天窗口内自由选择）

### 前端展示策略

前端使用日期组件让用户选择具体日期：

| 日期范围 | 状态 | `canRenew` |
|----------|------|------------|
| 失效时间及之前 | **灰色不可选** | — |
| 失效时间后一天 ~ 创建时间+28天 | **白色可选**（默认失效后一天） | — |
| 创建时间+28 天之后 | **灰色不可选** | — |
| 人为停用 / 过期超 7 天 | 隐藏「延期」按钮 | `false` |

---

### 11) `GET /verification/codes/students` — 查看认证学生列表

> **消费方**：`VerificationCodeManageModal` 子码操作栏「查看认证学生」按钮

- **Method**：`GET`
- **Path**：`/verification/codes/students`
- **Auth**：是（需机构管理员）
- **Query**：`code=`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | 是 | 子码（仅子码调用） |

#### Response `data`

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

### 业务规则

- 仅查询子码：返回通过该子码激活的学生
- 母码不可直接调用此接口（母码使用 §12 查看附属子码）

---

### 12) `GET /verification/codes/sub-codes` — 查看附属子码列表

> **消费方**：`VerificationCodeManageModal` 母码操作栏「查看附属子码」按钮

- **Method**：`GET`
- **Path**：`/verification/codes/sub-codes`
- **Auth**：是（需机构管理员）
- **Query**：`masterCode=`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `masterCode` | string | 是 | 母码 code |

#### Response `data`

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

### 业务规则

- 返回该母码下所有子码，字段与 §8 一致
- `isMaster` 固定为 false
- 按创建时间倒序排列

---

### 母子码生命周期说明

| 阶段 | 母码 | 子码 |
|------|------|------|
| **生成** | 机构管理员 → 写入 `sys_verification_codes`（is_master=1） | 辅导员 → 写入 `sys_verification_codes`（is_master=0） |
| **额度** | `max_quota`=总额度（默认1000），`used_quota`=已分配子码总额度 | `max_quota`=班级额度（默认50），`used_quota`=已激活学生数 |
| **扣减** | 子码生成时原子递增 | 学生激活时原子递增 |
| **失效** | 创建日期 + 14 天自动过期 / `is_active=0` / 额度耗尽 | 同上 |
| **延期** | 最多延长至创建时间 + 28 天，母码延期级联所有子码 | 同母码规则，也可独立延期 |
| **canRenew** | 后端判断：人为停用=false；自然过期≤7天=true；过期>7天=false | 同母码规则 |

---

### 身份证验证手动开关说明

#### 开发环境（`dev`）— 默认

- **完全 mock**，不调用任何外部 API
- `getFaceResult`：直接返回 `passed=true`

#### 生产环境（`prod`）

- 抛出 `FACE_API_NOT_CONFIGURED` 异常，预留腾讯云 SDK 接口

#### 切换方式

| 文件 | 配置项 | 效果 |
|------|--------|------|
| `application-dev.properties` | `spring.profiles.active=dev` | mock 模式 |
| `application-prod.properties` | `spring.profiles.active=prod` | 真实核身 |
