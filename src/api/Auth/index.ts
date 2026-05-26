import { HttpApiError, postApi } from '../http'
import { normalizeOrganizationCredentialChallengeData, normalizeOrganizationTotpSetupConfirmData, normalizeOrganizationTotpSetupInitData, normalizePersonalRegisterData, normalizeTokenAuthData } from './normalizeAuthData'
import type {
  LogoutRequest,
  OrganizationAdminOption,
  OrganizationAdminRegisterRequest,
  OrganizationCredentialsLoginRequest,
  OrganizationCredentialChallengeData,
  OrganizationOtpLoginRequest,
  OrganizationSelectAdminRequest,
  OrganizationTotpSetupConfirmData,
  OrganizationTotpSetupConfirmRequest,
  OrganizationTotpSetupInitData,
  OrganizationTotpSetupInitRequest,
  PersonalEmailLoginRequest,
  PersonalPasswordLoginRequest,
  PersonalRegisterData,
  PersonalRegisterRequest,
  PersonalSmsLoginRequest,
  TokenAuthData,
} from './types'

// 01）认证服务异常类型定义（AuthApiError）
export class AuthApiError extends HttpApiError { }

// 02）通用认证 POST 请求封装（postAuthApi）
/**
 * 函数名：postAuthApi
 * 功能：通过统一 axios 拦截器发送认证 POST 请求。
 * 实现方法：
 * - 调用 api/http.ts 暴露的 postApi 方法
 * - 拦截器完成响应解包与错误归一化
 * - 将 HttpApiError 转换为 AuthApiError，供业务层统一处理
 * 输入：
 * - path：认证接口相对路径（以 / 开头）
 * - payload：请求体对象
 * 输出：
 * - 返回值：业务 data 字段（泛型 TData）
 * - 副作用：发起网络请求
 */
async function postAuthApi<TPayload extends object, TData>(path: string, payload: TPayload): Promise<TData> {
  try {
    return await postApi<TPayload, TData>(path, payload)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new AuthApiError(error.code, error.message)
    }
    throw error
  }
}

// 04）个人账号注册接口（registerPersonalAccount）
/**
 * 函数名：registerPersonalAccount
 * 功能：调用个人账号注册接口，创建新个人账号并返回登录态信息。
 * 实现方法：
 * - 透传账号、哈希密码、验证码等参数
 * - 调用 /auth/personal/register 接口并返回业务数据
 * 输入：
 * - payload：个人注册参数（账号、密码、确认密码、验证码、通道）
 * 输出：
 * - 返回值：个人注册结果（含 token 与认证状态）
 * - 副作用：发起网络请求
 */
export async function registerPersonalAccount(payload: PersonalRegisterRequest): Promise<PersonalRegisterData> {
  const data = await postAuthApi<PersonalRegisterRequest, PersonalRegisterData>('/auth/personal/register', payload)
  return normalizePersonalRegisterData(data)
}

// 05）个人密码登录接口（loginPersonalByPassword）
/**
 * 函数名：loginPersonalByPassword
 * 功能：通过账号 + 密码模式完成个人登录。
 * 实现方法：
 * - 透传 rememberMe 与 channel
 * - 调用 /auth/personal/login/password 接口
 * 输入：
 * - payload：个人密码登录参数
 * 输出：
 * - 返回值：个人登录成功后的 token 与身份信息
 * - 副作用：发起网络请求
 */
export async function loginPersonalByPassword(payload: PersonalPasswordLoginRequest): Promise<TokenAuthData> {
  const data = await postAuthApi<PersonalPasswordLoginRequest, TokenAuthData>('/auth/personal/login/password', payload)
  return normalizeTokenAuthData(data)
}

// 06）个人短信登录接口（loginPersonalBySms）
/**
 * 函数名：loginPersonalBySms
 * 功能：通过账号 + 短信验证码模式完成个人登录。
 * 实现方法：
 * - 透传账号、验证码与 rememberMe
 * - 调用 /auth/personal/login/sms 接口
 * 输入：
 * - payload：个人短信登录参数
 * 输出：
 * - 返回值：个人登录成功后的 token 与身份信息
 * - 副作用：发起网络请求
 */
export async function loginPersonalBySms(payload: PersonalSmsLoginRequest): Promise<TokenAuthData> {
  const data = await postAuthApi<PersonalSmsLoginRequest, TokenAuthData>('/auth/personal/login/sms', payload)
  return normalizeTokenAuthData(data)
}

// 07）个人邮箱登录接口（loginPersonalByEmail）
/**
 * 函数名：loginPersonalByEmail
 * 功能：通过账号 + 邮箱验证码模式完成个人登录。
 * 实现方法：
 * - 透传账号、邮箱验证码与 rememberMe
 * - 调用 /auth/personal/login/email 接口
 * 输入：
 * - payload：个人邮箱登录参数
 * 输出：
 * - 返回值：个人登录成功后的 token 与身份信息
 * - 副作用：发起网络请求
 */
export async function loginPersonalByEmail(payload: PersonalEmailLoginRequest): Promise<TokenAuthData> {
  const data = await postAuthApi<PersonalEmailLoginRequest, TokenAuthData>('/auth/personal/login/email', payload)
  return normalizeTokenAuthData(data)
}

// 08）主体凭证登录接口（loginOrganizationByCredentials）
/**
 * 函数名：loginOrganizationByCredentials
 * 功能：执行主体登录第一步，校验机构代码与登录凭证。
 * 实现方法：
 * - 透传机构代码与密码摘要
 * - 调用 /auth/organization/login/credentials 接口获取 challengeId
 * 输入：
 * - payload：主体凭证登录参数
 * 输出：
 * - 返回值：OTP 挑战信息（challengeId、有效期等）
 * - 副作用：发起网络请求
 */
export async function loginOrganizationByCredentials(
  payload: OrganizationCredentialsLoginRequest,
): Promise<OrganizationCredentialChallengeData> {
  const data = await postAuthApi<
    OrganizationCredentialsLoginRequest,
    OrganizationCredentialChallengeData & Record<string, unknown>
  >('/auth/organization/login/credentials', payload)
  return normalizeOrganizationCredentialChallengeData(data)
}

// 08.1）主体选择管理员（selectOrganizationAdmin）
/**
 * 函数名：selectOrganizationAdmin
 * 功能：在 loginMode=admin_select 时选定管理员，返回后续 totp_setup / totp_verify 挑战。
 * 输入：
 * - payload：challengeId、adminUid
 * 输出：
 * - 返回值：OrganizationCredentialChallengeData
 * - 副作用：发起网络请求
 */
export async function selectOrganizationAdmin(
  payload: OrganizationSelectAdminRequest,
): Promise<OrganizationCredentialChallengeData> {
  const data = await postAuthApi<
    OrganizationSelectAdminRequest,
    OrganizationCredentialChallengeData & Record<string, unknown>
  >('/auth/organization/login/select-admin', payload)
  return normalizeOrganizationCredentialChallengeData(data)
}

// 08.2）主体登记管理员（registerOrganizationAdmin）
/**
 * 函数名：registerOrganizationAdmin
 * 功能：在主体根密码 challenge 下登记一名新管理员（displayName + 密码），进入 TOTP 绑定。
 * 输入：
 * - payload：challengeId、displayName、password（SHA256）
 * 输出：
 * - 返回值：OrganizationCredentialChallengeData
 * - 副作用：发起网络请求
 */
export async function registerOrganizationAdmin(
  payload: OrganizationAdminRegisterRequest,
): Promise<OrganizationCredentialChallengeData> {
  const data = await postAuthApi<
    OrganizationAdminRegisterRequest,
    OrganizationCredentialChallengeData & Record<string, unknown>
  >('/auth/organization/admin/register', payload)
  return normalizeOrganizationCredentialChallengeData(data)
}

// 09）主体 OTP 登录接口（loginOrganizationByOtp）
/**
 * 函数名：loginOrganizationByOtp
 * 功能：执行主体登录第二步，提交 challengeId 与 OTP 完成登录。
 * 实现方法：
 * - 透传 challengeId 与 otpCode
 * - 调用 /auth/organization/login/otp 接口获取最终 token
 * 输入：
 * - payload：主体 OTP 登录参数
 * 输出：
 * - 返回值：主体登录成功后的 token 与身份信息
 * - 副作用：发起网络请求
 */
export async function loginOrganizationByOtp(payload: OrganizationOtpLoginRequest): Promise<TokenAuthData> {
  const data = await postAuthApi<OrganizationOtpLoginRequest, TokenAuthData>('/auth/organization/login/otp', payload)
  return normalizeTokenAuthData(data)
}

// 09.1）主体 TOTP 绑定初始化（initOrganizationTotpSetup）
/**
 * 函数名：initOrganizationTotpSetup
 * 功能：首次登录管理员获取 TOTP 绑定 QR 码与 otpauth 链接。
 * 输入：
 * - payload：含 challengeId
 * 输出：
 * - 返回值：OrganizationTotpSetupInitData
 * - 副作用：发起网络请求
 */
export async function initOrganizationTotpSetup(
  payload: OrganizationTotpSetupInitRequest,
): Promise<OrganizationTotpSetupInitData> {
  const data = await postAuthApi<
    OrganizationTotpSetupInitRequest,
    OrganizationTotpSetupInitData & Record<string, unknown>
  >('/auth/organization/totp/setup/init', payload)
  return normalizeOrganizationTotpSetupInitData(data)
}

// 09.2）主体 TOTP 绑定确认（confirmOrganizationTotpSetup）
/**
 * 函数名：confirmOrganizationTotpSetup
 * 功能：提交 6 位 TOTP 验证码完成首次绑定，账号 FROZEN → ACTIVE。
 * 输入：
 * - payload：含 challengeId 与 totpCode
 * 输出：
 * - 返回值：OrganizationTotpSetupConfirmData（含 token 与主体激活状态）
 * - 副作用：发起网络请求
 */
export async function confirmOrganizationTotpSetup(
  payload: OrganizationTotpSetupConfirmRequest,
): Promise<OrganizationTotpSetupConfirmData> {
  const data = await postAuthApi<OrganizationTotpSetupConfirmRequest, OrganizationTotpSetupConfirmData & Record<string, unknown>>(
    '/auth/organization/totp/setup/confirm',
    payload,
  )
  return normalizeOrganizationTotpSetupConfirmData(data)
}

// 10）退出登录接口（logoutByTokens）
/**
 * 函数名：logoutByTokens
 * 功能：提交当前 accessToken 与 refreshToken，通知后端销毁登录会话。
 * 实现方法：
 * - 透传 accessToken、refreshToken 作为请求体
 * - 调用 /auth/logout 接口执行服务端登出
 * - 成功时返回后端 data（通常为空对象）
 * 输入：
 * - payload：退出登录参数
 * 输出：
 * - 返回值：后端返回 data（unknown）
 * - 副作用：发起网络请求
 */
export async function logoutByTokens(payload: LogoutRequest): Promise<unknown> {
  return postAuthApi<LogoutRequest, unknown>('/auth/logout', payload)
}

export type {
  AuthChannel,
  AuthStatus,
  AuthUserRole,
  LogoutRequest,
  OrganizationAdminOption,
  OrganizationCredentialsLoginRequest,
  OrganizationCredentialChallengeData,
  OrganizationAdminRegisterRequest,
  OrganizationLoginMode,
  OrganizationOtpLoginRequest,
  OrganizationSelectAdminRequest,
  OrganizationTotpSetupConfirmData,
  OrganizationTotpSetupConfirmRequest,
  OrganizationTotpSetupInitData,
  OrganizationTotpSetupInitRequest,
  PersonalEmailLoginRequest,
  PersonalPasswordLoginRequest,
  PersonalRegisterData,
  PersonalRegisterRequest,
  PersonalSmsLoginRequest,
  TokenAuthData,
} from './types'
