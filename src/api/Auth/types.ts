// 01）认证通用响应体定义（AuthApiResponse）
import type { UserResourceUid } from '../resourceUid'

export interface AuthApiResponse<TData> {
  code: number
  message: string
  data: TData
}

// 02）登录通用通道类型定义（AuthChannel）
export type AuthChannel = 'sms' | 'email'

// 03）用户认证状态类型定义（AuthStatus）
export type AuthStatus = 'verified' | 'unverified'

// 04）认证用户角色类型定义（AuthUserRole）
export type AuthUserRole = 'student' | 'mentor' | 'pm' | 'organization-admin'

// 05）个人注册请求参数定义（PersonalRegisterRequest）
export interface PersonalRegisterRequest {
  account: string
  password: string
  confirmPassword: string
  verifyCode: string
  channel: AuthChannel
}

// 06）个人密码登录请求参数定义（PersonalPasswordLoginRequest）
export interface PersonalPasswordLoginRequest {
  account: string
  password: string
  rememberMe: boolean
  channel: AuthChannel
}

// 07）个人短信登录请求参数定义（PersonalSmsLoginRequest）
export interface PersonalSmsLoginRequest {
  account: string
  smsCode: string
  rememberMe: boolean
}

// 08）个人邮箱登录请求参数定义（PersonalEmailLoginRequest）
export interface PersonalEmailLoginRequest {
  account: string
  emailCode: string
  rememberMe: boolean
}

// 09）主体凭证登录请求参数定义（OrganizationCredentialsLoginRequest）
export interface OrganizationCredentialsLoginRequest {
  institutionCode: string
  password: string
}

// 10）主体 OTP 登录请求参数定义（OrganizationOtpLoginRequest）
export interface OrganizationOtpLoginRequest {
  challengeId: string
  otpCode: string
}

// 11）退出登录请求参数定义（LogoutRequest）
export interface LogoutRequest {
  accessToken: string
  refreshToken: string
}

// 12）令牌登录响应数据定义（TokenAuthData）
export interface TokenAuthData {
  uid: UserResourceUid
  userRole: AuthUserRole
  authStatus: AuthStatus
  accessToken: string
  refreshToken: string
  expiresIn?: number
}

// 13）个人注册响应数据定义（PersonalRegisterData）
export interface PersonalRegisterData extends TokenAuthData {
  needVerificationGuide: boolean
}

// 14）主体凭证校验响应数据定义（OrganizationCredentialChallengeData）
export interface OrganizationCredentialChallengeData {
  challengeId: string
  passwordDigestPreview: string
  otpExpireInSec: number
  maskedTarget: string
}
