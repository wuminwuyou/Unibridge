// 01）认证令牌存储键常量（Auth Token Storage Keys）
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_UID_KEY = 'user_uid'
const USER_ROLE_KEY = 'user_role'
const ENTITY_CODE_KEY = 'entity_code'
const ENTITY_NAME_KEY = 'entity_name'
const AVATAR_URL_KEY = 'avatar_url'
const LEGACY_USER_ID_KEY = 'user_id'
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken'
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken'

import type { UserResourceUid } from '../api/resourceUid'
import { isUserResourceUid } from '../api/resourceUid'

// 02）认证令牌结果类型定义（AuthTokenPair）
export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}

// 03）读取用户 uid（getUserUid）
/**
 * 函数名：getUserUid
 * 功能：读取本地缓存的当前登录用户对外 uid。
 * 输入：无
 * 输出：
 * - 返回值：UserResourceUid | null
 * - 副作用：读取 localStorage
 */
export function getUserUid(): UserResourceUid | null {
  const rawUserUid = window.localStorage.getItem(USER_UID_KEY)
  if (isUserResourceUid(rawUserUid)) {
    return rawUserUid.trim()
  }
  return null
}

// 04）写入用户 uid（setUserUid）
/**
 * 函数名：setUserUid
 * 功能：将登录响应中的 uid 持久化到本地存储。
 * 输入：
 * - uid：登录响应中的用户对外 uid
 * 输出：
 * - 返回值：void
 * - 副作用：写入 localStorage
 */
export function setUserUid(uid: UserResourceUid): void {
  if (!isUserResourceUid(uid)) return
  window.localStorage.setItem(USER_UID_KEY, uid.trim())
  window.localStorage.removeItem(LEGACY_USER_ID_KEY)
}

// 05）读取 accessToken（getAccessToken）
/**
 * 函数名：getAccessToken
 * 功能：优先读取新键 access_token，并兼容迁移旧键 accessToken。
 * 输入：无
 * 输出：
 * - 返回值：accessToken | null
 * - 副作用：可能写入/删除 localStorage（旧键迁移）
 */
export function getAccessToken(): string | null {
  const latestAccessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  if (latestAccessToken) return latestAccessToken
  const legacyAccessToken = window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
  if (legacyAccessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, legacyAccessToken)
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
    return legacyAccessToken
  }
  return null
}

// 06）读取 refreshToken（getRefreshToken）
/**
 * 函数名：getRefreshToken
 * 功能：优先读取新键 refresh_token，并兼容迁移旧键 refreshToken。
 * 输入：无
 * 输出：
 * - 返回值：refreshToken | null
 * - 副作用：可能写入/删除 localStorage（旧键迁移）
 */
export function getRefreshToken(): string | null {
  const latestRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)
  if (latestRefreshToken) return latestRefreshToken
  const legacyRefreshToken = window.localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY)
  if (legacyRefreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, legacyRefreshToken)
    window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
    return legacyRefreshToken
  }
  return null
}

// 07）写入认证令牌（setAuthTokens）
/**
 * 函数名：setAuthTokens
 * 功能：将 accessToken 与 refreshToken 按新键写入本地存储。
 * 输入：
 * - tokens：认证令牌对象（accessToken、refreshToken）
 * 输出：
 * - 返回值：void
 * - 副作用：写入并清理 localStorage
 */
export function setAuthTokens(tokens: AuthTokenPair): void {
  if (!tokens.accessToken || !tokens.refreshToken) return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
}

// 08）清理用户 uid（clearUserUid）
export function clearUserUid(): void {
  window.localStorage.removeItem(USER_UID_KEY)
  window.localStorage.removeItem(LEGACY_USER_ID_KEY)
}

// 08.1）读取主体代码（getEntityCode）
export function getEntityCode(): string | null {
  const rawEntityCode = window.localStorage.getItem(ENTITY_CODE_KEY)
  const normalizedEntityCode = rawEntityCode?.trim() ?? ''
  return normalizedEntityCode.length > 0 ? normalizedEntityCode : null
}

// 08.2）写入主体代码（setEntityCode）
export function setEntityCode(entityCode: string): void {
  const normalizedEntityCode = entityCode.trim()
  if (!normalizedEntityCode) return
  window.localStorage.setItem(ENTITY_CODE_KEY, normalizedEntityCode)
}

// 08.3）读取主体名称（getEntityName）
export function getEntityName(): string | null {
  const rawEntityName = window.localStorage.getItem(ENTITY_NAME_KEY)
  const normalizedEntityName = rawEntityName?.trim() ?? ''
  return normalizedEntityName.length > 0 ? normalizedEntityName : null
}

// 08.4）写入主体名称（setEntityName）
export function setEntityName(entityName: string | null | undefined): void {
  const normalizedEntityName = entityName?.trim() ?? ''
  if (!normalizedEntityName) {
    window.localStorage.removeItem(ENTITY_NAME_KEY)
    return
  }
  window.localStorage.setItem(ENTITY_NAME_KEY, normalizedEntityName)
}

// 08.5）读取用户角色（getUserRole）
export function getUserRole(): string | null {
  const rawUserRole = window.localStorage.getItem(USER_ROLE_KEY)
  const normalizedUserRole = rawUserRole?.trim() ?? ''
  return normalizedUserRole.length > 0 ? normalizedUserRole : null
}

// 08.6）写入用户角色（setUserRole）
export function setUserRole(userRole: string | null | undefined): void {
  const normalizedUserRole = userRole?.trim() ?? ''
  if (!normalizedUserRole) {
    window.localStorage.removeItem(USER_ROLE_KEY)
    return
  }
  window.localStorage.setItem(USER_ROLE_KEY, normalizedUserRole)
}

// 08.7）清理主体会话扩展字段（clearOrganizationSessionMeta）
export function clearEntitySession(): void {
  window.localStorage.removeItem(ENTITY_CODE_KEY)
  window.localStorage.removeItem(ENTITY_NAME_KEY)
}

export function clearOrganizationSessionMeta(): void {
  window.localStorage.removeItem(USER_ROLE_KEY)
  clearEntitySession()
}

// 08.8）读取/写入头像 URL（getAvatarUrl / setAvatarUrl）
export function getAvatarUrl(): string | null {
  const raw = window.localStorage.getItem(AVATAR_URL_KEY)?.trim()
  return raw && raw.length > 0 ? raw : null
}

export function setAvatarUrl(url: string | null | undefined): void {
  const normalized = url?.trim() ?? ''
  if (!normalized) { window.localStorage.removeItem(AVATAR_URL_KEY); return }
  window.localStorage.setItem(AVATAR_URL_KEY, normalized)
}

// 09）清理认证令牌（clearAuthTokens）
/**
 * 函数名：clearAuthTokens
 * 功能：清除所有认证会话键（token + uid），供退出登录或会话失效使用。
 * 输入：无
 * 输出：
 * - 返回值：void
 * - 副作用：删除 localStorage 项
 */
export function clearAuthTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(AVATAR_URL_KEY)
  clearUserUid()
  clearOrganizationSessionMeta()
}
