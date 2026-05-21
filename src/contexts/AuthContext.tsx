import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AUTH_FORCE_LOGOUT_EVENT, AUTH_TOKENS_UPDATED_EVENT, type AuthTokensUpdatedDetail } from '../auth/authEvents'
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../auth/tokenStorage'

// 01）认证用户档案类型定义（AuthUserProfile）
export interface AuthUserProfile {
  userId?: number
  userRole?: string
  authStatus?: string
}

// 02）认证状态类型定义（AuthState）
interface AuthState {
  isLoggedIn: boolean
  token: string | null
  refreshToken: string | null
  userProfile: AuthUserProfile | null
  isHydrated: boolean
}

// 03）登录参数类型定义（AuthLoginPayload）
interface AuthLoginPayload {
  accessToken: string
  refreshToken: string
  userProfile?: AuthUserProfile
}

// 04）上下文对外能力类型定义（AuthContextValue）
interface AuthContextValue extends AuthState {
  login: (payload: AuthLoginPayload) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
  setUserProfile: (profile: AuthUserProfile | null) => void
}

// 05）AuthContext 实例（AuthContext）
const AuthContext = createContext<AuthContextValue | null>(null)

// 06）AuthProvider 参数类型（AuthProviderProps）
interface AuthProviderProps {
  children: ReactNode
}

// 07）创建初始化认证状态（createInitialAuthState）
/**
 * 函数名：createInitialAuthState
 * 功能：在全局初始化阶段读取 localStorage 并回显认证状态。
 * 实现方法：
 * - 同步读取 access_token 与 refresh_token
 * - 根据 accessToken 是否存在决定 isLoggedIn
 * - 初始化即标记为已水合，避免刷新时出现未登录闪烁
 * 输入：无
 * 输出：
 * - 返回值：AuthState 初始值
 * - 副作用：读取 localStorage
 */
function createInitialAuthState(): AuthState {
  const initialAccessToken = getAccessToken()
  const initialRefreshToken = getRefreshToken()
  return {
    isLoggedIn: Boolean(initialAccessToken),
    token: initialAccessToken,
    refreshToken: initialRefreshToken,
    userProfile: null,
    isHydrated: true,
  }
}

// 08）全局认证状态提供器（AuthProvider）
/**
 * 函数名：AuthProvider
 * 功能：在应用级别维护认证状态并提供登录/登出能力。
 * 实现方法：
 * - 使用 useState 初始化时直接从 localStorage Hydrate token
 * - 暴露 login、updateTokens、logout、setUserProfile
 * - 监听 refresh 成功/失败事件，联动同步全局认证状态
 * 输入：
 * - children：应用子树
 * 输出：
 * - 返回值：AuthContext.Provider
 * - 副作用：读写 localStorage、监听 window 事件
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(() => createInitialAuthState())

  // 09）登录状态写入处理（login）
  const login = useCallback((payload: AuthLoginPayload): void => {
    setAuthTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    })
    setAuthState((previousState) => ({
      ...previousState,
      isLoggedIn: true,
      token: payload.accessToken,
      refreshToken: payload.refreshToken,
      userProfile: payload.userProfile ?? previousState.userProfile,
      isHydrated: true,
    }))
  }, [])

  // 10）仅更新令牌处理（updateTokens）
  const updateTokens = useCallback((accessToken: string, refreshToken: string): void => {
    setAuthTokens({ accessToken, refreshToken })
    setAuthState((previousState) => ({
      ...previousState,
      isLoggedIn: true,
      token: accessToken,
      refreshToken,
      isHydrated: true,
    }))
  }, [])

  // 11）退出登录处理（logout）
  const logout = useCallback((): void => {
    clearAuthTokens()
    setAuthState({
      isLoggedIn: false,
      token: null,
      refreshToken: null,
      userProfile: null,
      isHydrated: true,
    })
  }, [])

  // 12）用户档案更新处理（setUserProfile）
  const setUserProfile = useCallback((profile: AuthUserProfile | null): void => {
    setAuthState((previousState) => ({
      ...previousState,
      userProfile: profile,
    }))
  }, [])

  // 13）监听 refresh 令牌更新与强制退出事件（useEffect）
  useEffect(() => {
    const handleTokenUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<AuthTokensUpdatedDetail>
      const updatedAccessToken = customEvent.detail?.accessToken
      const updatedRefreshToken = customEvent.detail?.refreshToken
      if (!updatedAccessToken || !updatedRefreshToken) {
        return
      }
      updateTokens(updatedAccessToken, updatedRefreshToken)
    }

    const handleForceLogout = (): void => {
      logout()
    }

    window.addEventListener(AUTH_TOKENS_UPDATED_EVENT, handleTokenUpdated as EventListener)
    window.addEventListener(AUTH_FORCE_LOGOUT_EVENT, handleForceLogout)

    return () => {
      window.removeEventListener(AUTH_TOKENS_UPDATED_EVENT, handleTokenUpdated as EventListener)
      window.removeEventListener(AUTH_FORCE_LOGOUT_EVENT, handleForceLogout)
    }
  }, [logout, updateTokens])

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      login,
      updateTokens,
      logout,
      setUserProfile,
    }),
    [authState, login, logout, setUserProfile, updateTokens],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// 14）认证上下文读取 Hook（useAuth）
/**
 * 函数名：useAuth
 * 功能：读取并返回全局认证上下文。
 * 实现方法：
 * - 通过 useContext 读取 AuthContext
 * - 当未被 AuthProvider 包裹时抛出错误
 * 输入：无
 * 输出：
 * - 返回值：AuthContextValue
 * - 副作用：无
 */
export function useAuth(): AuthContextValue {
  const authContext = useContext(AuthContext)
  if (!authContext) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }
  return authContext
}
