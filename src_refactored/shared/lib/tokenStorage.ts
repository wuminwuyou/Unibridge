// 01）认证令牌存储键常量（Auth Token Storage Keys）
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_UID_KEY = 'user_uid'
const USER_ROLE_KEY = 'user_role'
const ENTITY_CODE_KEY = 'entity_code'
const ENTITY_NAME_KEY = 'entity_name'
const AVATAR_URL_KEY = 'avatar_url'
const LOGO_URL_KEY = 'logo_url'
const MENU_CACHE_KEY = 'user_profile_menu_cache'
const LEGACY_USER_ID_KEY = 'user_id'
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken'
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken'

import type { UserResourceUid } from '../api/resourceUid'
import { isUserResourceUid } from '../api/resourceUid'

// ═══ Cookie 工具 ═══
function setCookie(key: string, value: string, days = 7): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${key}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}
function getCookie(key: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
function removeCookie(key: string): void {
  document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}

// ═══ Token（cookie）═══
export function getAccessToken(): string | null {
  const cookie = getCookie(ACCESS_TOKEN_KEY)
  if (cookie) return cookie
  // 兼容旧 localStorage 数据迁移
  const legacy = window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ?? window.localStorage.getItem(ACCESS_TOKEN_KEY)
  if (legacy) { setAccessToken(legacy); window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY); window.localStorage.removeItem(ACCESS_TOKEN_KEY); return legacy }
  return null
}

export function setAccessToken(token: string): void {
  if (!token) return
  setCookie(ACCESS_TOKEN_KEY, token)
  // 同时写入 localStorage 备份（注：仅作为迁移阶段的兼容，后续可移除）
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  const cookie = getCookie(REFRESH_TOKEN_KEY)
  if (cookie) return cookie
  const legacy = window.localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY) ?? window.localStorage.getItem(REFRESH_TOKEN_KEY)
  if (legacy) { setRefreshToken(legacy); window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY); window.localStorage.removeItem(REFRESH_TOKEN_KEY); return legacy }
  return null
}

export function setRefreshToken(token: string): void {
  if (!token) return
  setCookie(REFRESH_TOKEN_KEY, token, 14)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export interface AuthTokenPair { accessToken: string; refreshToken: string }

export function setAuthTokens(tokens: AuthTokenPair): void {
  if (!tokens.accessToken || !tokens.refreshToken) return
  setAccessToken(tokens.accessToken)
  setRefreshToken(tokens.refreshToken)
}

// ═══ uid（localStorage）═══
export function getUserUid(): UserResourceUid | null {
  const raw = window.localStorage.getItem(USER_UID_KEY)
  return isUserResourceUid(raw) ? raw.trim() : null
}

export function setUserUid(uid: UserResourceUid): void {
  if (!isUserResourceUid(uid)) return
  window.localStorage.setItem(USER_UID_KEY, uid.trim())
  window.localStorage.removeItem(LEGACY_USER_ID_KEY)
}

export function clearUserUid(): void {
  window.localStorage.removeItem(USER_UID_KEY)
  window.localStorage.removeItem(LEGACY_USER_ID_KEY)
}

// ═══ avatarUrl（localStorage）═══
export function getAvatarUrl(): string | null {
  return window.localStorage.getItem(AVATAR_URL_KEY)?.trim() || null
}

export function setAvatarUrl(url: string | null | undefined): void {
  const v = url?.trim() ?? ''
  v ? window.localStorage.setItem(AVATAR_URL_KEY, v) : window.localStorage.removeItem(AVATAR_URL_KEY)
}

// ═══ logoUrl（localStorage，机构登录）═══
export function getLogoUrl(): string | null {
  return window.localStorage.getItem(LOGO_URL_KEY)?.trim() || null
}

export function setLogoUrl(url: string | null | undefined): void {
  const v = url?.trim() ?? ''
  v ? window.localStorage.setItem(LOGO_URL_KEY, v) : window.localStorage.removeItem(LOGO_URL_KEY)
}

// ═══ entity（localStorage）═══
export function getEntityCode(): string | null {
  const raw = window.localStorage.getItem(ENTITY_CODE_KEY)?.trim() ?? ''
  return raw.length > 0 ? raw : null
}

export function setEntityCode(code: string): void {
  const v = code.trim(); if (v) window.localStorage.setItem(ENTITY_CODE_KEY, v)
}

export function getEntityName(): string | null {
  const raw = window.localStorage.getItem(ENTITY_NAME_KEY)?.trim() ?? ''
  return raw.length > 0 ? raw : null
}

export function setEntityName(name: string | null | undefined): void {
  const v = name?.trim() ?? ''
  v ? window.localStorage.setItem(ENTITY_NAME_KEY, v) : window.localStorage.removeItem(ENTITY_NAME_KEY)
}

export function getUserRole(): string | null {
  const raw = window.localStorage.getItem(USER_ROLE_KEY)?.trim() ?? ''
  return raw.length > 0 ? raw : null
}

export function setUserRole(role: string | null | undefined): void {
  const v = role?.trim() ?? ''
  v ? window.localStorage.setItem(USER_ROLE_KEY, v) : window.localStorage.removeItem(USER_ROLE_KEY)
}

export function clearEntitySession(): void {
  window.localStorage.removeItem(ENTITY_CODE_KEY)
  window.localStorage.removeItem(ENTITY_NAME_KEY)
}

export function clearOrganizationSessionMeta(): void {
  window.localStorage.removeItem(USER_ROLE_KEY)
  clearEntitySession()
}

// ═══ 菜单缓存（localStorage）═══
export interface MenuCacheData {
  uid: string
  nickname: string
  level: string | null
  avatarUrl: string | null
  verifiedOrganization: string | null
  verifyStatus?: string | null
  subtitle?: string | null
  entityCode?: string | null
}

export function getMenuCache(): MenuCacheData | null {
  try {
    const raw = window.localStorage.getItem(MENU_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.uid || !parsed?.nickname) return null
    return parsed as MenuCacheData
  } catch { return null }
}

export function setMenuCache(data: Partial<MenuCacheData> & { uid: string; nickname: string }): void {
  const existing = getMenuCache()
  const merged = { ...(existing ?? {}), ...data }
  window.localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(merged))
}

export function clearMenuCache(): void {
  window.localStorage.removeItem(MENU_CACHE_KEY)
}

// ═══ 清理（退出登录）═══
export function clearAuthTokens(): void {
  removeCookie(ACCESS_TOKEN_KEY)
  removeCookie(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(AVATAR_URL_KEY)
  window.localStorage.removeItem(LOGO_URL_KEY)
  clearMenuCache()
  clearUserUid()
  clearOrganizationSessionMeta()
}
