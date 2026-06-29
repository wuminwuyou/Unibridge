// 01）全局认证状态提供器（AuthProvider）
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AUTH_FORCE_LOGOUT_EVENT, AUTH_TOKENS_UPDATED_EVENT, type AuthTokensUpdatedDetail } from '../../shared/lib/authEvents'
import {
  clearAuthTokens, clearEntitySession, getAccessToken, getEntityCode, getEntityName,
  getRefreshToken, getUserRole, getUserUid, setAuthTokens, setEntityCode, setEntityName,
  setUserRole, setUserUid, getAvatarUrl, setAvatarUrl, getLogoUrl, setLogoUrl,
} from '../../shared/lib/tokenStorage'
import { AuthContext, type AuthLoginPayload, type AuthUserProfile } from '../../shared/hooks/useAuth'
import type { AuthState } from '../../shared/hooks/useAuth'

// 02）创建初始化认证状态（createInitialAuthState）
/**
 * 函数名：createInitialAuthState
 * 功能：从 cookie / localStorage 恢复 token、uid、avatar_url 等到 AuthContext 初始状态。
 */
function createInitialAuthState(): AuthState {
  const initialAccessToken = getAccessToken()
  const initialRefreshToken = getRefreshToken()
  const initialUserUid = getUserUid()
  const initialUserRole = getUserRole()
  const initialEntityCode = getEntityCode()
  const initialEntityName = getEntityName()
  const initialAvatarUrl = getAvatarUrl()
  const initialLogoUrl = getLogoUrl()
  const isLoggedIn = Boolean(initialAccessToken)

  return {
    isLoggedIn,
    token: initialAccessToken,
    refreshToken: initialRefreshToken,
    userProfile: isLoggedIn
      ? {
          uid: initialUserUid ?? undefined,
          userRole: initialUserRole ?? undefined,
          entityCode: initialEntityCode ?? undefined,
          entityName: initialEntityName,
          avatarUrl: initialAvatarUrl,
          logoUrl: initialLogoUrl,
        }
      : null,
    isHydrated: true,
  }
}

// 03）持久化用户档案元数据（persistAuthUserProfileMeta）
function persistAuthUserProfileMeta(profile: AuthUserProfile | null | undefined): void {
  if (!profile) return
  if (profile.uid) setUserUid(profile.uid)
  setUserRole(profile.userRole ?? null)
  const resolvedAvatarUrl = typeof profile.avatarUrl === 'string' ? profile.avatarUrl.trim() : ''
  if (resolvedAvatarUrl) setAvatarUrl(resolvedAvatarUrl)
  const resolvedLogoUrl = typeof profile.logoUrl === 'string' ? profile.logoUrl.trim() : ''
  if (resolvedLogoUrl) setLogoUrl(resolvedLogoUrl)
  const normalizedEntityCode = profile.entityCode?.trim() ?? ''
  if (normalizedEntityCode) { setEntityCode(normalizedEntityCode); setEntityName(profile.entityName ?? null); return }
  setEntityName(null); clearEntitySession()
}

// 04）合并用户档案并同步 localStorage（mergeAndPersistUserProfile）
/**
 * 函数名：mergeAndPersistUserProfile
 * 功能：合并 patch 到现有档案、写入 localStorage，并确保 avatarUrl 与存储一致。
 */
function mergeAndPersistUserProfile(
  prev: AuthUserProfile | null,
  patch: Partial<AuthUserProfile> | AuthUserProfile,
): AuthUserProfile {
  const merged = { ...(prev ?? {}), ...patch } as AuthUserProfile
  persistAuthUserProfileMeta(merged)
  const avatarFromPatch = typeof merged.avatarUrl === 'string' ? merged.avatarUrl.trim() : ''
  const avatarUrl = avatarFromPatch || getAvatarUrl()
  const logoFromPatch = typeof merged.logoUrl === 'string' ? merged.logoUrl.trim() : ''
  const logoUrl = logoFromPatch || getLogoUrl()
  return { ...merged, avatarUrl: avatarUrl ?? null, logoUrl: logoUrl ?? null }
}

// 05）AuthProvider 组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => createInitialAuthState())

  const updateUser = useCallback((patch: Partial<AuthUserProfile>): void => {
    setAuthState((prev) => ({
      ...prev,
      userProfile: mergeAndPersistUserProfile(prev.userProfile, patch),
    }))
  }, [])

  const setUser = useCallback((profile: AuthUserProfile | null): void => {
    if (!profile) {
      setAuthState((prev) => ({ ...prev, userProfile: null }))
      return
    }
    setAuthState((prev) => ({
      ...prev,
      userProfile: mergeAndPersistUserProfile(null, profile),
    }))
  }, [])

  const login = useCallback((payload: AuthLoginPayload): void => {
    setAuthTokens({ accessToken: payload.accessToken, refreshToken: payload.refreshToken })
    setAuthState((prev) => {
      const nextProfile = payload.userProfile
        ? mergeAndPersistUserProfile(prev.userProfile, payload.userProfile)
        : prev.userProfile
      return {
        ...prev,
        isLoggedIn: true,
        token: payload.accessToken,
        refreshToken: payload.refreshToken,
        userProfile: nextProfile,
        isHydrated: true,
      }
    })
  }, [])

  const updateTokens = useCallback((accessToken: string, refreshToken: string): void => {
    setAuthTokens({ accessToken, refreshToken })
    setAuthState((prev) => ({ ...prev, isLoggedIn: true, token: accessToken, refreshToken, isHydrated: true }))
  }, [])

  const logout = useCallback((): void => {
    clearAuthTokens()
    setAuthState({ isLoggedIn: false, token: null, refreshToken: null, userProfile: null, isHydrated: true })
  }, [])

  const setUserProfile = setUser

  useEffect(() => {
    const handleTokenUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<AuthTokensUpdatedDetail>
      const updatedAccessToken = customEvent.detail?.accessToken
      const updatedRefreshToken = customEvent.detail?.refreshToken
      if (!updatedAccessToken || !updatedRefreshToken) return
      updateTokens(updatedAccessToken, updatedRefreshToken)
    }
    const handleForceLogout = (): void => { logout() }
    window.addEventListener(AUTH_TOKENS_UPDATED_EVENT, handleTokenUpdated as EventListener)
    window.addEventListener(AUTH_FORCE_LOGOUT_EVENT, handleForceLogout)
    return () => {
      window.removeEventListener(AUTH_TOKENS_UPDATED_EVENT, handleTokenUpdated as EventListener)
      window.removeEventListener(AUTH_FORCE_LOGOUT_EVENT, handleForceLogout)
    }
  }, [logout, updateTokens])

  const contextValue = useMemo(
    () => ({ ...authState, login, updateTokens, logout, setUser, updateUser, setUserProfile }),
    [authState, login, logout, setUser, updateUser, updateTokens],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
