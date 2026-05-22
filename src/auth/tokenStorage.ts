// 01）认证令牌存储键常量（Auth Token Storage Keys）
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_ID_KEY = 'user_id'
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken'
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken'

// 02）认证令牌结果类型定义（AuthTokenPair）
export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}

// 03）读取用户 ID（getUserId）
/**
 * 函数名：getUserId
 * 功能：读取本地缓存的当前登录用户 userId。
 * 实现方法：
 * - 从 localStorage 的 user_id 键读取原始字符串
 * - 尝试转换为 number，非法值返回 null
 * - 返回可用于接口请求构造的 userId
 * 输入：无
 * 输出：
 * - 返回值：number | null
 * - 副作用：读取 localStorage
 */
export function getUserId(): number | null {
  const rawUserId = window.localStorage.getItem(USER_ID_KEY)
  if (!rawUserId) {
    return null
  }
  const parsedUserId = Number(rawUserId)
  return Number.isInteger(parsedUserId) && parsedUserId > 0 ? parsedUserId : null
}

// 04）写入用户 ID（setUserId）
/**
 * 函数名：setUserId
 * 功能：将登录响应中的 userId 持久化到本地存储。
 * 实现方法：
 * - 校验 userId 为正整数
 * - 将数字转换为字符串写入 user_id 键
 * - 非法值时不写入，避免污染本地缓存
 * 输入：
 * - userId：登录响应中的用户唯一标识
 * 输出：
 * - 返回值：void
 * - 副作用：写入 localStorage
 */
export function setUserId(userId: number): void {
  if (!Number.isInteger(userId) || userId <= 0) {
    return
  }
  window.localStorage.setItem(USER_ID_KEY, String(userId))
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

// 06）清理用户 ID（clearUserId）
/**
 * 函数名：clearUserId
 * 功能：清除本地缓存的 userId。
 * 实现方法：
 * - 删除 user_id 键
 * 输入：无
 * 输出：
 * - 返回值：void
 * - 副作用：删除 localStorage 项
 */
export function clearUserId(): void {
  window.localStorage.removeItem(USER_ID_KEY)
}

// 07）清理认证令牌（clearAuthTokens）
/**
 * 函数名：clearAuthTokens
 * 功能：清除所有认证会话键（token + userId），供退出登录或会话失效使用。
 * 实现方法：
 * - 移除 access_token / refresh_token
 * - 兼容移除旧键 accessToken / refreshToken
 * - 同步移除 user_id，避免使用过期身份信息发起请求
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
  clearUserId()
}
