// 01）认证令牌存储键常量（Auth Token Storage Keys）
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken'
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken'

// 02）认证令牌结果类型定义（AuthTokenPair）
export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}

// 03）读取 accessToken（getAccessToken）
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

// 04）读取 refreshToken（getRefreshToken）
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

// 05）写入认证令牌（setAuthTokens）
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

// 06）清理认证令牌（clearAuthTokens）
/**
 * 函数名：clearAuthTokens
 * 功能：清除所有新旧认证令牌键，供退出登录或会话失效使用。
 * 实现方法：
 * - 移除 access_token / refresh_token
 * - 兼容移除旧键 accessToken / refreshToken
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
}
