# UniBridge Web-Client Auth API 文档

> 本机联调地址（localhost）：`http://localhost:8081/api/v1/client`
> 
> 前端若使用绝对地址，可将 `baseURL` 配置为：`http://localhost:8081/api/v1/client`

本文档用于对接 `apps/web-client/src/components/AuthModal`，当前包含：

- 个人账号注册 API
- 个人账号登录 API（密码 / 短信验证码）
- 主体账号登录 API（凭证校验 + OTP 二次验证）
- 验证码下发 API

> 基础路径约定：前端 `axios` 默认 `baseURL = /api/v1/client`。  
> 下文所有路径均相对 `/api/v1/client`。

---

## 01）通用约定

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

## 06）主体账号登录（第一步：凭证校验）

### 06.1）主体凭证登录

- **Method**：`POST`
- **Path**：`/auth/organization/login/credentials`
- **Auth**：否
- **说明**：校验机构代码、主体账号、登录凭证，成功后进入 OTP 阶段。

#### Request Body

```json
{
  "institutionCode": "12345",
  "password": "<前端SHA256后凭证>"
}
```

#### Response Data

```json
{
  "challengeId": "chl_20260520_000001",
  "passwordDigestPreview": "a1b2c3d4e5f6",
  "otpExpireInSec": 300,
  "maskedTarget": "***@corp.com"
}
```

#### 常见错误码

- `ORGANIZATION_CREDENTIAL_INVALID`
- `ORGANIZATION_ACCOUNT_DISABLED`
- `NEED_CONTACT_OPERATOR`

---

## 07）主体账号登录（第二步：OTP 校验）

### 07.1）主体 OTP 验证登录

- **Method**：`POST`
- **Path**：`/auth/organization/login/otp`
- **Auth**：否
- **说明**：使用 `challengeId + otpCode` 完成主体登录。

#### Request Body

```json
{
  "challengeId": "chl_20260520_000001",
  "otpCode": "123456"
}
```

#### Response Data

```json
{
  "userId": 90001,
  "userRole": "organization-admin",
  "authStatus": "verified",
  "accessToken": "<access_token>",
  "refreshToken": "<refresh_token>",
  "expiresIn": 7200
}
```

#### 常见错误码

- `CHALLENGE_NOT_FOUND`
- `CHALLENGE_EXPIRED`
- `OTP_INVALID`
- `OTP_EXPIRED`
- `TOO_MANY_ATTEMPTS`

### 07.2）刷新 accessToken（一次性 refreshToken 轮换）

- **Method**：`POST`
- **Path**：`/auth/refresh`
- **Auth**：否（使用 refreshToken 换取新令牌）
- **说明**：当 accessToken 失效时，前端应调用该接口刷新令牌。`refreshToken` 采用一次性安全设计，刷新成功后旧 refreshToken 立即失效。

#### Request Body

```json
{
  "refreshToken": "<refresh_token>"
}
```

#### Response Data

```json
{
  "accessToken": "<new_access_token>",
  "refreshToken": "<new_refresh_token>",
  "expiresIn": 7200
}
```

字段说明：

- `accessToken`：新的访问令牌，前端需立即覆盖本地旧值
- `refreshToken`：新的刷新令牌，前端需立即覆盖本地旧值（旧 refreshToken 不可再次使用）
- `expiresIn`：accessToken 剩余有效期（秒）

#### 常见错误码

- `REFRESH_TOKEN_INVALID`
- `REFRESH_TOKEN_EXPIRED`
- `TOKEN_REUSE_DETECTED`

---

## 08）前端错误文案映射建议

- `ACCOUNT_OR_PASSWORD_INVALID` / `SMS_CODE_INVALID` → `手机号或验证码错误，请检查后重试`
- `ORGANIZATION_CREDENTIAL_INVALID` → `主体账号信息不匹配，请确认后重试`
- `OTP_INVALID` → `动态验证码错误，请重试`
- `OTP_FORMAT_INVALID` → `请输入 6 位数字动态验证码`
- `ORGANIZATION_FIELDS_REQUIRED` → `请完整输入机构代码、账号和密码`

---

## 09）安全与风控要求

- 所有登录与注册接口必须限流（IP、账号、设备维度）。
- 验证码必须设置有效期、发送频控、错误次数上限。
- 密码传输建议前端哈希 + HTTPS；服务端仍需二次加盐哈希存储。
- 返回体严禁回传敏感字段（原始密码、完整 OTP、完整手机号、完整邮箱）。
- 对 `unverified` 用户颁发受限权限 token（可浏览，敏感操作受限）。

---

## 10）联调优先级建议

- **P0**
  - 个人密码登录
  - 主体两步登录
  - 个人注册
- **P1**
  - 验证码发送与短信登录
  - 风控与错误码细化
- **P2**
  - 认证引导相关接口（邮箱认证、资料上传）与 `VerificationStep` 对接


