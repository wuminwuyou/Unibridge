import { HttpApiError, postApi } from '../http'
import type {
  LogoutRequest,
  OrganizationCredentialsLoginRequest,
  OrganizationCredentialChallengeData,
  OrganizationOtpLoginRequest,
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
  return postAuthApi<PersonalRegisterRequest, PersonalRegisterData>('/auth/personal/register', payload)
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
  return postAuthApi<PersonalPasswordLoginRequest, TokenAuthData>('/auth/personal/login/password', payload)
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
  return postAuthApi<PersonalSmsLoginRequest, TokenAuthData>('/auth/personal/login/sms', payload)
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
  return postAuthApi<PersonalEmailLoginRequest, TokenAuthData>('/auth/personal/login/email', payload)
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
  return postAuthApi<OrganizationCredentialsLoginRequest, OrganizationCredentialChallengeData>(
    '/auth/organization/login/credentials',
    payload,
  )
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
  return postAuthApi<OrganizationOtpLoginRequest, TokenAuthData>('/auth/organization/login/otp', payload)
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
  OrganizationCredentialsLoginRequest,
  OrganizationCredentialChallengeData,
  OrganizationOtpLoginRequest,
  PersonalEmailLoginRequest,
  PersonalPasswordLoginRequest,
  PersonalRegisterData,
  PersonalRegisterRequest,
  PersonalSmsLoginRequest,
  TokenAuthData,
} from './types'
