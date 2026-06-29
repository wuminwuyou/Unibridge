// 01）用户头像展示数据 Hook（useUserAvatarData）
import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { getAvatarUrl, getLogoUrl } from '../lib/tokenStorage'
import { isOrganizationAdminRole } from '../lib/organizationSession'

/**
 * 函数名：useUserAvatarData
 * 功能：从 AuthContext 与 localStorage 读取顶栏头像 URL 与 fallback 文案，不发起网络请求。
 * 实现方法：
 * - 个人账号使用 avatarUrl
 * - 机构账号使用 logoUrl
 * 输入：无
 * 输出：
 * - 返回值：{ avatarUrl, fallbackText }
 * - 副作用：读取 localStorage
 */
export function useUserAvatarData(): { avatarUrl: string | null; fallbackText: string } {
  const { isLoggedIn, userProfile } = useAuth()

  return useMemo(() => {
    if (!isLoggedIn) {
      return { avatarUrl: null, fallbackText: 'U' }
    }

    const isOrgAccount = isOrganizationAdminRole(userProfile?.userRole)
    const fallbackText = isOrgAccount
      ? (userProfile?.entityName ?? '机构').slice(0, 1)
      : (userProfile?.uid ?? '用户').slice(0, 1)

    const avatarUrl = isOrgAccount
      ? (userProfile?.logoUrl?.trim() || getLogoUrl())
      : (userProfile?.avatarUrl?.trim() || getAvatarUrl())

    return { avatarUrl, fallbackText }
  }, [isLoggedIn, userProfile?.avatarUrl, userProfile?.logoUrl, userProfile?.uid, userProfile?.userRole, userProfile?.entityName])
}
