// 01）认证服务 — 对 entities/user/api 的重新封装与统一导出
import { HttpApiError, postApi } from '../../../shared/api/http'
import type { UserResourceUid } from '../../../shared/api/resourceUid'

// 02）认证 API 异常类型（AuthApiError）
export class AuthApiError extends HttpApiError {}

async function postAuthApi<TPayload extends object, TData>(path: string, payload: TPayload): Promise<TData> {
  try { return await postApi<TPayload, TData>(path, payload) }
  catch (e) { if (e instanceof HttpApiError) throw new AuthApiError(e.code, e.message); throw e }
}

// 03）类型定义
export type AuthChannel = 'sms' | 'email'
export type AuthUserRole = 'student' | 'mentor' | 'pm' | 'counselor' | 'organization-admin'

export interface TokenAuthData { uid: UserResourceUid; userRole: AuthUserRole; authStatus: string; accessToken: string; refreshToken: string; expiresIn?: number; avatarUrl?: string | null; logoUrl?: string | null }

export interface PersonalPasswordLoginRequest { account: string; password: string; rememberMe: boolean; channel: AuthChannel }
export interface PersonalSmsLoginRequest { account: string; smsCode: string; rememberMe: boolean }
export interface PersonalRegisterRequest { account: string; password: string; confirmPassword: string; verifyCode: string; channel: AuthChannel }
export interface PersonalRegisterData extends TokenAuthData { needVerificationGuide: boolean }

export interface OrganizationCredentialsLoginRequest { institutionCode: string; password: string }
export interface OrganizationOtpLoginRequest { challengeId: string; otpCode: string }

export interface OrganizationAdminOption { adminUid: string; displayName: string; isPrimary: boolean }
export interface OrganizationSelectAdminRequest { challengeId: string; adminUid: string }
export interface OrganizationAdminRegisterRequest { challengeId: string; displayName: string; password: string }
export interface OrganizationTotpSetupInitRequest { challengeId: string }
export interface OrganizationTotpSetupConfirmRequest { challengeId: string; totpCode: string }

export interface OrganizationCredentialChallengeData {
  challengeId: string; passwordDigestPreview: string; otpExpireInSec: number; maskedTarget: string
  isFirstLogin: boolean | null; loginMode: string; requiresAdminSelection: boolean
  admins: OrganizationAdminOption[] | null; boundAdminCount: number; minAdminCount: number; maxAdminCount: number
  currentAdminOrder: number | null; entityName?: string | null
}

export interface OrganizationTotpSetupInitData { challengeId: string; otpAuthUrl: string; qrCodeDataUrl: string; qrCodeExpireInSec: number; issuer: string; accountName: string; currentAdminOrder: number; boundAdminCount: number; minAdminCount: number; maxAdminCount: number }
export interface OrganizationTotpSetupConfirmData extends TokenAuthData { entityFullyActivated: boolean; boundAdminCount: number; minAdminCount: number; activationHint?: string | null; nextChallengeId?: string | null }

export interface LogoutRequest { accessToken: string; refreshToken: string }

// 04）认证 API 函数
export async function loginPersonalByPassword(p: PersonalPasswordLoginRequest): Promise<TokenAuthData> { return postAuthApi('/auth/personal/login/password', p) }
export async function loginPersonalBySms(p: PersonalSmsLoginRequest): Promise<TokenAuthData> { return postAuthApi('/auth/personal/login/sms', p) }
export async function registerPersonalAccount(p: PersonalRegisterRequest): Promise<PersonalRegisterData> { return postAuthApi('/auth/personal/register', p) }
export async function loginOrganizationByCredentials(p: OrganizationCredentialsLoginRequest): Promise<OrganizationCredentialChallengeData> { return postAuthApi('/auth/organization/login/credentials', p) }
export async function loginOrganizationByOtp(p: OrganizationOtpLoginRequest): Promise<TokenAuthData> { return postAuthApi('/auth/organization/login/otp', p) }
export async function selectOrganizationAdmin(p: OrganizationSelectAdminRequest): Promise<OrganizationCredentialChallengeData> { return postAuthApi('/auth/organization/login/select-admin', p) }
export async function registerOrganizationAdmin(p: OrganizationAdminRegisterRequest): Promise<OrganizationCredentialChallengeData> { return postAuthApi('/auth/organization/admin/register', p) }
export async function initOrganizationTotpSetup(p: OrganizationTotpSetupInitRequest): Promise<OrganizationTotpSetupInitData> { return postAuthApi('/auth/organization/totp/setup/init', p) }
export async function confirmOrganizationTotpSetup(p: OrganizationTotpSetupConfirmRequest): Promise<OrganizationTotpSetupConfirmData> { return postAuthApi('/auth/organization/totp/setup/confirm', p) }
export async function logoutByTokens(p: LogoutRequest): Promise<unknown> { return postAuthApi('/auth/logout', p) }
