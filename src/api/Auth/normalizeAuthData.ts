import { normalizeUserResourceUid } from '../resourceUid'
import { readRecordBoolean, readRecordField, readRecordNumber, readRecordString } from '../recordFieldUtils'
import type {
  OrganizationAdminOption,
  OrganizationCredentialChallengeData,
  OrganizationLoginMode,
  OrganizationTotpSetupConfirmData,
  OrganizationTotpSetupInitData,
  PersonalRegisterData,
  TokenAuthData,
} from './types'

// 01.0）归一化主体管理员列表（normalizeOrganizationAdminOptions）
function normalizeOrganizationAdminOptions(raw: unknown): OrganizationAdminOption[] | null {
  if (!Array.isArray(raw)) {
    return null
  }

  const admins = raw
    .map((item): OrganizationAdminOption | null => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const record = item as Record<string, unknown>
      const adminUid = readRecordString(record, 'adminUid', { snakeKey: 'admin_uid' })
      const displayName = readRecordString(record, 'displayName', { snakeKey: 'display_name' })
      if (!adminUid || !displayName) {
        return null
      }
      return {
        adminUid,
        displayName,
        isPrimary: readRecordBoolean(record, 'isPrimary', 'is_primary'),
      }
    })
    .filter((item): item is OrganizationAdminOption => item != null)

  return admins.length > 0 ? admins : null
}

// 01.1）归一化主体登录模式（normalizeOrganizationLoginMode）
function normalizeOrganizationLoginMode(raw: Record<string, unknown>): OrganizationLoginMode {
  const loginModeRaw = readRecordString(raw, 'loginMode', { snakeKey: 'login_mode' })
  const normalizedMode = (loginModeRaw ?? '').toLowerCase()

  if (
    normalizedMode === 'admin_select' ||
    normalizedMode === 'admin-select' ||
    normalizedMode === 'select_admin'
  ) {
    return 'admin_select'
  }

  if (
    normalizedMode === 'admin_register' ||
    normalizedMode === 'admin-register' ||
    normalizedMode === 'register_admin'
  ) {
    return 'admin_register'
  }

  if (readRecordBoolean(raw, 'requiresAdminSelection', 'requires_admin_selection')) {
    return 'admin_select'
  }

  if (readRecordBoolean(raw, 'requiresAdminRegistration', 'requires_admin_registration')) {
    return 'admin_register'
  }

  if (
    normalizedMode === 'totp_setup' ||
    normalizedMode === 'totp-setup' ||
    normalizedMode === 'setup' ||
    normalizedMode === 'bind'
  ) {
    return 'totp_setup'
  }

  if (
    normalizedMode === 'totp_verify' ||
    normalizedMode === 'totp-verify' ||
    normalizedMode === 'verify' ||
    normalizedMode === 'login'
  ) {
    return 'totp_verify'
  }

  const isFirstLogin =
    readRecordBoolean(raw, 'isFirstLogin', 'is_first_login') ||
    readRecordBoolean(raw, 'firstLogin', 'first_login') ||
    readRecordBoolean(raw, 'needTotpSetup', 'need_totp_setup')

  return isFirstLogin ? 'totp_setup' : 'totp_verify'
}

// 01.1.1）读取可空整数（readNullableRecordOrder）
function readNullableRecordOrder(record: Record<string, unknown>): number | null {
  const value = readRecordField<number | string>(record, 'currentAdminOrder', 'current_admin_order')
  if (value == null || value === '') {
    return null
  }
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// 01.2）归一化主体凭证挑战响应（normalizeOrganizationCredentialChallengeData）
/**
 * 函数名：normalizeOrganizationCredentialChallengeData
 * 功能：归一化主体凭证登录响应，补齐 isFirstLogin / loginMode 等首次绑定字段默认值。
 * 输入：
 * - data：接口原始 data
 * 输出：
 * - 返回值：OrganizationCredentialChallengeData
 * - 副作用：无
 */
export function normalizeOrganizationCredentialChallengeData(
  data: OrganizationCredentialChallengeData & Record<string, unknown>,
): OrganizationCredentialChallengeData {
  const record = data as Record<string, unknown>
  const boundAdminCount = readRecordNumber(record, 'boundAdminCount', 0, 'bound_admin_count')
  const loginMode = normalizeOrganizationLoginMode(record)
  const requiresAdminSelection =
    loginMode === 'admin_select' ||
    readRecordBoolean(record, 'requiresAdminSelection', 'requires_admin_selection')
  const admins = normalizeOrganizationAdminOptions(
    readRecordField<unknown[]>(record, 'admins') ?? data.admins,
  )
  const currentAdminOrder = readNullableRecordOrder(record)
  const isFirstLoginExplicit = readRecordField<unknown>(record, 'isFirstLogin', 'is_first_login')
  let isFirstLogin: boolean | null
  if (loginMode === 'admin_register') {
    isFirstLogin = true
  } else if (loginMode === 'admin_select') {
    isFirstLogin =
      isFirstLoginExplicit === undefined || isFirstLoginExplicit === null
        ? null
        : readRecordBoolean(record, 'isFirstLogin', 'is_first_login')
  } else if (loginMode === 'totp_setup') {
    isFirstLogin = true
  } else {
    isFirstLogin = false
  }

  return {
    challengeId: readRecordString(record, 'challengeId', { snakeKey: 'challenge_id' }) ?? data.challengeId,
    passwordDigestPreview:
      readRecordString(record, 'passwordDigestPreview', { snakeKey: 'password_digest_preview' }) ??
      data.passwordDigestPreview ??
      '',
    otpExpireInSec: readRecordNumber(record, 'otpExpireInSec', data.otpExpireInSec ?? 300, 'otp_expire_in_sec'),
    maskedTarget: readRecordString(record, 'maskedTarget', { snakeKey: 'masked_target' }) ?? data.maskedTarget ?? '',
    isFirstLogin,
    loginMode,
    requiresAdminSelection,
    admins,
    boundAdminCount,
    minAdminCount: readRecordNumber(record, 'minAdminCount', 2, 'min_admin_count'),
    maxAdminCount: readRecordNumber(record, 'maxAdminCount', 3, 'max_admin_count'),
    currentAdminOrder:
      currentAdminOrder ?? (loginMode === 'admin_select' ? null : Math.min(boundAdminCount + 1, 3)),
    entityName: readRecordString(record, 'entityName', { nullable: true, snakeKey: 'entity_name' }) ?? null,
  }
}

// 01）归一化令牌登录响应（normalizeTokenAuthData）
/**
 * 函数名：normalizeTokenAuthData
 * 功能：将认证接口响应中的用户标识统一映射为 uid 字段。
 * 实现方法：
 * - 调用 normalizeUserResourceUid 解析 uid / userUid / user_uid / 字符串 userId
 * - 保留其余 token 与角色字段
 * 输入：
 * - data：认证接口原始 data
 * 输出：
 * - 返回值：TokenAuthData（含 uid）
 * - 副作用：无
 */
export function normalizeTokenAuthData<T extends TokenAuthData>(data: T): T {
  const uid = normalizeUserResourceUid(data as unknown as Record<string, unknown>) ?? data.uid
  return {
    ...data,
    uid,
  }
}

// 02）归一化注册响应（normalizePersonalRegisterData）
/**
 * 函数名：normalizePersonalRegisterData
 * 功能：将注册接口响应中的用户标识统一映射为 uid 字段。
 * 输入：
 * - data：注册接口原始 data
 * 输出：
 * - 返回值：PersonalRegisterData（含 uid）
 * - 副作用：无
 */
export function normalizePersonalRegisterData(data: PersonalRegisterData): PersonalRegisterData {
  return normalizeTokenAuthData(data)
}

// 03）归一化 TOTP 绑定初始化响应（normalizeOrganizationTotpSetupInitData）
/**
 * 函数名：normalizeOrganizationTotpSetupInitData
 * 功能：归一化 POST /auth/organization/totp/setup/init 响应。
 * 输入：
 * - data：接口原始 data
 * 输出：
 * - 返回值：OrganizationTotpSetupInitData
 * - 副作用：无
 */
export function normalizeOrganizationTotpSetupInitData(
  data: OrganizationTotpSetupInitData & Record<string, unknown>,
): OrganizationTotpSetupInitData {
  const record = data as Record<string, unknown>
  const boundAdminCount = readRecordNumber(record, 'boundAdminCount', 0, 'bound_admin_count')

  return {
    challengeId: readRecordString(record, 'challengeId', { snakeKey: 'challenge_id' }) ?? data.challengeId,
    otpAuthUrl: readRecordString(record, 'otpAuthUrl', { snakeKey: 'otp_auth_url' }) ?? data.otpAuthUrl ?? '',
    qrCodeDataUrl:
      readRecordString(record, 'qrCodeDataUrl', { snakeKey: 'qr_code_data_url' }) ?? data.qrCodeDataUrl ?? '',
    qrCodeExpireInSec: readRecordNumber(
      record,
      'qrCodeExpireInSec',
      data.qrCodeExpireInSec ?? 300,
      'qr_code_expire_in_sec',
    ),
    issuer: readRecordString(record, 'issuer') ?? data.issuer ?? 'UniBridge',
    accountName: readRecordString(record, 'accountName', { snakeKey: 'account_name' }) ?? data.accountName ?? '',
    currentAdminOrder: readRecordNumber(
      record,
      'currentAdminOrder',
      data.currentAdminOrder ?? Math.min(boundAdminCount + 1, 3),
      'current_admin_order',
    ),
    boundAdminCount,
    minAdminCount: readRecordNumber(record, 'minAdminCount', data.minAdminCount ?? 2, 'min_admin_count'),
    maxAdminCount: readRecordNumber(record, 'maxAdminCount', data.maxAdminCount ?? 3, 'max_admin_count'),
  }
}

// 04）归一化 TOTP 绑定确认响应（normalizeOrganizationTotpSetupConfirmData）
/**
 * 函数名：normalizeOrganizationTotpSetupConfirmData
 * 功能：归一化 POST /auth/organization/totp/setup/confirm 响应。
 * 输入：
 * - data：接口原始 data
 * 输出：
 * - 返回值：OrganizationTotpSetupConfirmData
 * - 副作用：无
 */
export function normalizeOrganizationTotpSetupConfirmData(
  data: OrganizationTotpSetupConfirmData & Record<string, unknown>,
): OrganizationTotpSetupConfirmData {
  const record = data as Record<string, unknown>
  const tokenData = normalizeTokenAuthData(data)
  const boundAdminCount = readRecordNumber(record, 'boundAdminCount', 0, 'bound_admin_count')
  const minAdminCount = readRecordNumber(record, 'minAdminCount', 2, 'min_admin_count')

  return {
    ...tokenData,
    entityFullyActivated:
      readRecordBoolean(record, 'entityFullyActivated', 'entity_fully_activated') ||
      boundAdminCount >= minAdminCount,
    boundAdminCount,
    minAdminCount,
    activationHint:
      readRecordString(record, 'activationHint', { nullable: true, snakeKey: 'activation_hint' }) ?? null,
    nextChallengeId:
      readRecordString(record, 'nextChallengeId', { nullable: true, snakeKey: 'next_challenge_id' }) ?? null,
    nextLoginMode: (() => {
      const nextModeRaw = readRecordString(record, 'nextLoginMode', { snakeKey: 'next_login_mode' })
      if (!nextModeRaw) {
        return null
      }
      return normalizeOrganizationLoginMode({ loginMode: nextModeRaw })
    })(),
  }
}
