// 01）认证上下文类型定义 & 读取 Hook（shared 层，不含 Provider）
import { createContext, useContext } from 'react'
import type { UserResourceUid } from '../api/resourceUid'

// 02）认证用户档案类型定义（AuthUserProfile）
export interface AuthUserProfile {
  uid?: UserResourceUid
  userRole?: string
  authStatus?: string
  verifyStatus?: string
  verifiedOrganization?: string
  entityCode?: string
  entityName?: string | null
  avatarUrl?: string | null
  logoUrl?: string | null
}

// 03）认证状态类型定义（AuthState）
export interface AuthState {
  isLoggedIn: boolean
  token: string | null
  refreshToken: string | null
  userProfile: AuthUserProfile | null
  isHydrated: boolean
}

// 04）登录参数类型定义（AuthLoginPayload）
export interface AuthLoginPayload {
  accessToken: string
  refreshToken: string
  userProfile?: AuthUserProfile
}

// 05）上下文对外能力类型定义（AuthContextValue）
export interface AuthContextValue extends AuthState {
  login: (payload: AuthLoginPayload) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
  /** 全量替换用户档案 */
  setUser: (profile: AuthUserProfile | null) => void
  /** 局部更新用户档案（登录成功后更新 avatarUrl 等） */
  updateUser: (patch: Partial<AuthUserProfile>) => void
  /** @deprecated 请使用 setUser */
  setUserProfile: (profile: AuthUserProfile | null) => void
}

// 06）AuthContext 实例（AuthContext）
export const AuthContext = createContext<AuthContextValue | null>(null)

// 07）认证上下文读取 Hook（useAuth）
/**
 * 函数名：useAuth
 * 功能：读取全局认证上下文。
 * 输入：无
 * 输出：
 * - 返回值：AuthContextValue
 * - 副作用：无
 */
export function useAuth(): AuthContextValue {
  const authContext = useContext(AuthContext)
  if (!authContext) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return authContext
}
