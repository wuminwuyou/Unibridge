# AuthModal API 需求文档

## 01）文档目的

- 本文档用于支撑 `apps/web-client/src/components/AuthModal` 当前交互。
- 覆盖三类核心能力：
  - 个人账号注册
  - 个人账号登录（密码 / 短信验证码）
  - 主体账号登录（凭证 + OTP 二次验证）
- 目标是让后端接口与前端字段、状态、错误提示一一对应，降低联调成本。

## 02）范围与前端行为约束

- 前端通道：
  - `personal`：个人通道
  - `organization`：主体通道
- 前端状态关键字（需后端返回对齐）：
  - `authStatus`：`verified` 或 `unverified`
  - `userRole`：`student` / `mentor` / `pm` / `organization-admin`
- 交互约束：
  - 个人登录成功后，若 `authStatus=unverified`，前端展示认证引导，不立即关闭弹窗。
  - 主体登录分两步：先校验机构代码 + 主体账号 + 登录凭证，再校验 OTP。
  - 前端当前有“获取验证码”按钮，需配套验证码下发接口。

## 03）统一接口约定

- 基础路径建议：`/api/v1/auth`
- 请求体格式：`application/json`
- 成功响应建议结构：
  - `code`: `200`
  - `message`: `"success"`
  - `data`: 业务对象
- 失败响应建议结构：
  - `code`: 错误码
  - `message`: 面向用户或日志的错误说明
  - `data`: 可选

## 04）个人账号注册

### 04.1）接口定义

- 方法：`POST`
- 路径：`/api/v1/auth/personal/register`
- 说明：创建个人账号，供“立即注册”流程使用。

### 04.2）请求参数

- `account`：字符串，邮箱或手机号（对应前端 `registerAccount`）
- `password`：字符串，建议前端先做 SHA256 后传输（与现有安全策略一致）
- `confirmPassword`：字符串（用于二次确认）
- `verifyCode`：字符串，6位数字验证码（对应前端 `registerCode`）
- `channel`：字符串，可选，`sms` / `email`（用于验证码类型区分）

### 04.3）成功响应 data

- `userId`：用户 ID
- `userRole`：默认可返回 `student`（后续可扩展）
- `authStatus`：默认建议 `unverified`
- `needVerificationGuide`：布尔值，建议返回 `true`
- `accessToken`：访问令牌
- `refreshToken`：刷新令牌

### 04.4）失败场景

- `ACCOUNT_ALREADY_EXISTS`：账号已存在
- `INVALID_VERIFY_CODE`：验证码错误或失效
- `WEAK_PASSWORD`：密码不满足强度规则
- `PASSWORD_NOT_MATCH`：两次密码不一致
- `VERIFY_CODE_EXPIRED`：验证码过期

## 05）个人账号登录（密码）

### 05.1）接口定义

- 方法：`POST`
- 路径：`/api/v1/auth/personal/login/password`
- 说明：个人通道密码登录（对应 `personalLoginMode=password`）。

### 05.2）请求参数

- `account`：字符串，邮箱或手机号（对应前端 `personalPhone`）
- `password`：字符串，建议前端先哈希后传输（当前 UI 文案为“请输入密码”）
- `rememberMe`：布尔值（对应前端 `rememberMe`）

### 05.3）成功响应 data

- `userId`
- `userRole`：`student` / `mentor` / `pm`
- `authStatus`：`verified` / `unverified`
- `accessToken`
- `refreshToken`
- `expiresIn`：秒

### 05.4）失败场景

- `ACCOUNT_OR_PASSWORD_INVALID`
- `ACCOUNT_LOCKED`
- `ACCOUNT_DISABLED`

## 06）个人账号登录（短信验证码）

### 06.1）接口定义

- 方法：`POST`
- 路径：`/api/v1/auth/personal/login/sms`
- 说明：个人通道短信验证码登录（对应 `personalLoginMode=sms`）。

### 06.2）请求参数

- `account`：字符串，手机号/邮箱（当前 UI 是统一账号输入框）
- `smsCode`：字符串，6位数字（对应前端 `personalCode`）
- `rememberMe`：布尔值

### 06.3）成功响应 data

- 与密码登录一致：`userId` / `userRole` / `authStatus` / `accessToken` / `refreshToken` / `expiresIn`

### 06.4）失败场景

- `SMS_CODE_INVALID`
- `SMS_CODE_EXPIRED`
- `ACCOUNT_NOT_FOUND`
- `TOO_MANY_ATTEMPTS`

## 07）验证码下发（支持登录与注册）

### 07.1）接口定义

- 方法：`POST`
- 路径：`/api/v1/auth/personal/sms/send`
- 说明：支撑“获取验证码”按钮，供个人登录短信模式与个人注册复用。

### 07.2）请求参数

- `account`：字符串，手机号（当前建议先以手机号为主）
- `bizType`：字符串，`login` / `register`
- `captchaToken`：字符串，可选（防刷图形验证码票据）

### 07.3）成功响应 data

- `requestId`：本次验证码请求流水号
- `expireInSec`：验证码有效期（秒）
- `retryAfterSec`：再次发送倒计时（秒）

### 07.4）失败场景

- `TOO_FREQUENT_REQUEST`
- `CAPTCHA_REQUIRED`
- `CAPTCHA_INVALID`
- `ACCOUNT_RISK_BLOCKED`

## 08）主体登录第一步（凭证校验）

### 08.1）接口定义

- 方法：`POST`
- 路径：`/api/v1/auth/organization/login/credentials`
- 说明：校验机构代码、主体账号、登录凭证，成功后进入 OTP 阶段。

### 08.2）请求参数

- `institutionCode`：字符串（对应前端 `organizationCode`）
- `account`：字符串（对应前端 `organizationAccount`）
- `password`：字符串，建议前端 SHA256 后传输

### 08.3）成功响应 data

- `challengeId`：OTP 阶段会话 ID（必传）
- `passwordDigestPreview`：可选，摘要前缀（便于前端展示“已完成 SHA256 提交”）
- `otpExpireInSec`：OTP 有效期（秒）
- `maskedTarget`：可选，OTP 下发目标脱敏信息

### 08.4）失败场景

- `ORGANIZATION_CREDENTIAL_INVALID`
- `ORGANIZATION_ACCOUNT_DISABLED`
- `NEED_CONTACT_OPERATOR`

## 09）主体登录第二步（OTP 校验）

### 09.1）接口定义

- 方法：`POST`
- 路径：`/api/v1/auth/organization/login/otp`
- 说明：使用 `challengeId` + `otpCode` 完成主体登录闭环。

### 09.2）请求参数

- `challengeId`：字符串（来自第一步）
- `otpCode`：字符串，6位数字（对应前端 `organizationOtpCode`）

### 09.3）成功响应 data

- `userId`
- `userRole`：固定返回 `organization-admin`
- `authStatus`：`verified` / `unverified`
- `accessToken`
- `refreshToken`
- `expiresIn`

### 09.4）失败场景

- `CHALLENGE_NOT_FOUND`
- `CHALLENGE_EXPIRED`
- `OTP_INVALID`
- `OTP_EXPIRED`
- `TOO_MANY_ATTEMPTS`

## 10）前端错误文案映射建议

- `ACCOUNT_OR_PASSWORD_INVALID` / `SMS_CODE_INVALID` -> `手机号或验证码错误，请检查后重试`
- `ORGANIZATION_CREDENTIAL_INVALID` -> `主体账号信息不匹配，请确认后重试`
- `OTP_INVALID` -> `动态验证码错误，请重试`
- `OTP_FORMAT_INVALID` -> `请输入 6 位数字动态验证码`
- `ORGANIZATION_FIELDS_REQUIRED` -> `请完整输入机构代码、账号和密码`

## 11）安全与风控要求

- 所有登录与注册接口必须限流（IP、账号、设备维度）。
- 验证码必须设置有效期、发送频控、错误次数上限。
- 密码传输建议前端哈希 + HTTPS；服务端仍需二次加盐哈希存储。
- 返回体严禁回传敏感字段（原始密码、完整 OTP、完整手机号、完整邮箱）。
- 对 `unverified` 用户颁发受限权限 token（可浏览，敏感操作受限）。

## 12）联调优先级建议

- P0：
  - 个人密码登录
  - 主体两步登录
  - 个人注册
- P1：
  - 验证码发送与短信登录
  - 风控与错误码细化
- P2：
  - 认证引导相关接口（邮箱认证、资料上传）与 `VerificationStep` 对接
