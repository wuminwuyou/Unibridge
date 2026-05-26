import type { UserResourceUid } from '../api/resourceUid'
import { isUserResourceUid } from '../api/resourceUid'

// 01）认证令牌存储键常量（Auth Token Storage Keys）
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_UID_KEY = 'user_uid'
const LEGACY_USER_ID_KEY = 'user_id'
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken'
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken'

// 02）认证令牌结果类型定义（AuthTokenPair）
export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}

// 03）读取用户 uid（getUserUid）
/**
 * 函数名：getUserUid
 * 功能：读取本地缓存的当前登录用户对外 uid。
 * 实现方法：
 * - 优先从 localStorage 的 user_uid 键读取
 * - 校验为非空字符串后返回
 * - 忽略旧版 user_id 数字缓存，避免用自增 id 发起请求
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
 * 实现方法：
 * - 校验 uid 为非空字符串
 * - 写入 user_uid 并清理旧版 user_id
 * 输入：
 * - uid：登录响应中的用户对外 uid
 * 输出：
 * - 返回值：void
 * - 副作用：写入 localStorage
 */
export function setUserUid(uid: UserResourceUid): void {
  if (!isUserResourceUid(uid)) {
    return
  }

  window.localStorage.setItem(USER_UID_KEY, uid.trim())
  window.localStorage.removeItem(LEGACY_USER_ID_KEY)
}

// 05）读取 accessToken（getAccessToken）
/**
 * 函数名：getAccessToken
 * 功能：优先读取新键 access_token，并兼容迁移旧键 accessToken。
 * 实现方法：
 * - 优先从 access_token 读取
 * - 若新键不存在则读取旧键并迁移为新键
 * - 返回标准化后的 accessToken 或 null
 * 输入：无
 * 输出：
 * - 返回值：accessToken | null
 * - 副作用：可能写入/删除 localStorage（旧键迁移）
 */
export function getAccessToken(): string | null {
  const latestAccessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  if (latestAccessToken) {
    return latestAccessToken
  }

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
 * 实现方法：
 * - 优先从 refresh_token 读取
 * - 若新键不存在则读取旧键并迁移为新键
 * - 返回标准化后的 refreshToken 或 null
 * 输入：无
 * 输出：
 * - 返回值：refreshToken | null
 * - 副作用：可能写入/删除 localStorage（旧键迁移）
 */
export function getRefreshToken(): string | null {
  const latestRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)
  if (latestRefreshToken) {
    return latestRefreshToken
  }

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
 * 实现方法：
 * - 校验两个 token 非空
 * - 覆盖写入 access_token / refresh_token
 * - 同时清理旧键，避免多套键并存
 * 输入：
 * - tokens：认证令牌对象（accessToken、refreshToken）
 * 输出：
 * - 返回值：void
 * - 副作用：写入并清理 localStorage
 */
export function setAuthTokens(tokens: AuthTokenPair): void {
  if (!tokens.accessToken || !tokens.refreshToken) {
    return
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
}

// 08）清理用户 uid（clearUserUid）
/**
 * 函数名：clearUserUid
 * 功能：清除本地缓存的用户 uid（含旧版 user_id）。
 * 实现方法：
 * - 删除 user_uid 与 user_id 键
 * 输入：无
 * 输出：
 * - 返回值：void
 * - 副作用：删除 localStorage 项
 */
export function clearUserUid(): void {
  window.localStorage.removeItem(USER_UID_KEY)
  window.localStorage.removeItem(LEGACY_USER_ID_KEY)
}

// 09）清理认证令牌（clearAuthTokens）
/**
 * 函数名：clearAuthTokens
 * 功能：清除所有认证会话键（token + uid），供退出登录或会话失效使用。
 * 实现方法：
 * - 移除 access_token / refresh_token
 * - 兼容移除旧键 accessToken / refreshToken
 * - 同步移除 user_uid / user_id，避免使用过期身份信息发起请求
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
  clearUserUid()
}
