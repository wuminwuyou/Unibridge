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
export type AuthUserRole = 'student' | 'mentor' | 'pm' | 'counselor' | 'organization-admin'

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

// 09.1）主体登录模式（OrganizationLoginMode）
/** admin_select：选已有管理员；admin_register：登记新管理员；totp_setup / totp_verify：TOTP 流程 */
export type OrganizationLoginMode = 'admin_select' | 'admin_register' | 'totp_setup' | 'totp_verify'

// 09.2）主体可选管理员项（OrganizationAdminOption）
export interface OrganizationAdminOption {
  adminUid: string
  displayName: string
  isPrimary: boolean
}

// 09.3）主体选择管理员请求（OrganizationSelectAdminRequest）
export interface OrganizationSelectAdminRequest {
  challengeId: string
  adminUid: string
}

// 09.4）主体登记管理员请求（OrganizationAdminRegisterRequest）
export interface OrganizationAdminRegisterRequest {
  challengeId: string
  displayName: string
  /** SHA256 十六进制小写 */
  password: string
}

// 10）主体 OTP 登录请求参数定义（OrganizationOtpLoginRequest）
export interface OrganizationOtpLoginRequest {
  challengeId: string
  otpCode: string
}

// 10.1）主体 TOTP 绑定初始化请求（OrganizationTotpSetupInitRequest）
export interface OrganizationTotpSetupInitRequest {
  challengeId: string
}

// 10.2）主体 TOTP 绑定确认请求（OrganizationTotpSetupConfirmRequest）
export interface OrganizationTotpSetupConfirmRequest {
  challengeId: string
  /** 验证器 6 位动态码（后端字段名 totpCode） */
  totpCode: string
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
  /** 当前路径是否首次绑定；admin_select 时为 null */
  isFirstLogin: boolean | null
  /** 登录下一步模式 */
  loginMode: OrganizationLoginMode
  /** loginMode=admin_select 时为 true */
  requiresAdminSelection: boolean
  /** admin_select 时的管理员列表 */
  admins: OrganizationAdminOption[] | null
  /** 主体下已绑定 TOTP 的管理员数量 */
  boundAdminCount: number
  /** 主体激活所需最少管理员数（默认 2） */
  minAdminCount: number
  /** 同一主体最多管理员数（默认 3） */
  maxAdminCount: number
  /** 绑定顺位 1/2/3；admin_select 或未定时为 null */
  currentAdminOrder: number | null
  /** 主体名称（展示用） */
  entityName?: string | null
}

// 14.1）主体 TOTP 绑定初始化响应（OrganizationTotpSetupInitData）
export interface OrganizationTotpSetupInitData {
  challengeId: string
  otpAuthUrl: string
  qrCodeDataUrl: string
  /** QR 码有效展示秒数（超时需重新初始化） */
  qrCodeExpireInSec: number
  issuer: string
  accountName: string
  currentAdminOrder: number
  boundAdminCount: number
  minAdminCount: number
  maxAdminCount: number
}

// 14.2）主体 TOTP 绑定确认响应（OrganizationTotpSetupConfirmData）
export interface OrganizationTotpSetupConfirmData extends TokenAuthData {
  /** 主体是否已满足最少管理员绑定（≥ minAdminCount） */
  entityFullyActivated: boolean
  boundAdminCount: number
  minAdminCount: number
  activationHint?: string | null
  /** 未达 minAdminCount 时，用于继续下一位管理员绑定的 challenge */
  nextChallengeId?: string | null
  nextLoginMode?: OrganizationLoginMode | null
}
