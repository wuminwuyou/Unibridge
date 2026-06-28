// 01）全局认证状态提供器（AuthProvider）
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AUTH_FORCE_LOGOUT_EVENT, AUTH_TOKENS_UPDATED_EVENT, type AuthTokensUpdatedDetail } from '../../shared/lib/authEvents'
import {
  clearAuthTokens, clearEntitySession, getAccessToken, getEntityCode, getEntityName,
  getRefreshToken, getUserRole, getUserUid, setAuthTokens, setEntityCode, setEntityName,
  setUserRole, setUserUid, getAvatarUrl, setAvatarUrl,
} from '../../shared/lib/tokenStorage'
import { AuthContext, type AuthLoginPayload, type AuthUserProfile } from '../../shared/hooks/useAuth'
import type { AuthState } from '../../shared/hooks/useAuth'

// 02）创建初始化认证状态（createInitialAuthState）
function createInitialAuthState(): AuthState {
  const initialAccessToken = getAccessToken()
  const initialRefreshToken = getRefreshToken()
  const initialUserUid = getUserUid()
  const initialUserRole = getUserRole()
  const initialEntityCode = getEntityCode()
  const initialEntityName = getEntityName()
  return {
    isLoggedIn: Boolean(initialAccessToken),
    token: initialAccessToken,
    refreshToken: initialRefreshToken,
    userProfile: initialUserUid ? {
      uid: initialUserUid, userRole: initialUserRole ?? undefined,
      entityCode: initialEntityCode ?? undefined, entityName: initialEntityName,
      avatarUrl: getAvatarUrl(),
    } : null,
    isHydrated: true,
  }
}

function persistAuthUserProfileMeta(profile: AuthUserProfile | null | undefined): void {
  if (!profile) return
  if (profile.uid) setUserUid(profile.uid)
  setUserRole(profile.userRole ?? null)
  setAvatarUrl(profile.avatarUrl ?? null)
  const normalizedEntityCode = profile.entityCode?.trim() ?? ''
  if (normalizedEntityCode) { setEntityCode(normalizedEntityCode); setEntityName(profile.entityName ?? null); return }
  setEntityName(null); clearEntitySession()
}

// 03）AuthProvider 组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => createInitialAuthState())

  const login = useCallback((payload: AuthLoginPayload): void => {
    setAuthTokens({ accessToken: payload.accessToken, refreshToken: payload.refreshToken })
    persistAuthUserProfileMeta(payload.userProfile)
    setAuthState((prev) => ({ ...prev, isLoggedIn: true, token: payload.accessToken, refreshToken: payload.refreshToken, userProfile: payload.userProfile ?? prev.userProfile, isHydrated: true }))
  }, [])

  const updateTokens = useCallback((accessToken: string, refreshToken: string): void => {
    setAuthTokens({ accessToken, refreshToken })
    setAuthState((prev) => ({ ...prev, isLoggedIn: true, token: accessToken, refreshToken, isHydrated: true }))
  }, [])

  const logout = useCallback((): void => {
    clearAuthTokens()
    setAuthState({ isLoggedIn: false, token: null, refreshToken: null, userProfile: null, isHydrated: true })
  }, [])

  const setUserProfile = useCallback((profile: AuthUserProfile | null): void => {
    persistAuthUserProfileMeta(profile)
    setAuthState((prev) => ({ ...prev, userProfile: profile }))
  }, [])

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

  const contextValue = useMemo(() => ({ ...authState, login, updateTokens, logout, setUserProfile }), [authState, login, logout, setUserProfile, updateTokens])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
