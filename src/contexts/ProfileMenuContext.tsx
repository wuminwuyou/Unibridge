import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getEntityProfileMenu, getCachedUserProfileMenu, getUserProfileMenu, setCachedUserProfileMenu } from '../api'
import type { EntityProfileMenuData } from '../api/entityProfile/menuTypes'
import type { UserProfileMenuData } from '../api/userProfile/types'
import { isOrganizationAdminRole, resolveSessionEntityCode } from '../auth/organizationSession'
import { getEntityCode, getUserUid } from '../auth/tokenStorage'
import { useAuth } from './AuthContext'

// 01）ProfileMenu 通道类型（ProfileMenuChannel）
export type ProfileMenuChannel = 'personal' | 'organization'

// 02）ProfileMenu 展示数据（ProfileMenuViewData）
export interface ProfileMenuViewData {
  channel: ProfileMenuChannel
  title: string
  subtitle: string | null
  avatarUrl: string | null
  avatarText: string
  level: string | null
  verifiedOrganization: string | null
  entityCode: string | null
  boundAdminCount: number | null
  minAdminCount: number | null
  entityFullyActivated: boolean | null
}

// 03）ProfileMenu 上下文值（ProfileMenuContextValue）
interface ProfileMenuContextValue {
  channel: ProfileMenuChannel | null
  menuData: ProfileMenuViewData | null
  isLoading: boolean
  errorMessage: string
  refreshMenu: () => Promise<void>
}

// 04）ProfileMenuContext 实例（ProfileMenuContext）
const ProfileMenuContext = createContext<ProfileMenuContextValue | null>(null)

// 05）ProfileMenuProvider 参数（ProfileMenuProviderProps）
interface ProfileMenuProviderProps {
  children: ReactNode
}

// 06）归一化个人菜单为展示数据（mapPersonalMenuToViewData）
function mapPersonalMenuToViewData(menuData: UserProfileMenuData): ProfileMenuViewData {
  const nickname = menuData.nickname?.trim() || '用户'
  return {
    channel: 'personal',
    title: nickname,
    subtitle: null,
    avatarUrl: menuData.avatarUrl,
    avatarText: menuData.avatarUrl ? '' : nickname.slice(0, 1),
    level: menuData.level,
    verifiedOrganization: menuData.verifiedOrganization,
    entityCode: null,
    boundAdminCount: null,
    minAdminCount: null,
    entityFullyActivated: null,
  }
}

// 07）归一化机构菜单为展示数据（mapOrganizationMenuToViewData）
function mapOrganizationMenuToViewData(menuData: EntityProfileMenuData): ProfileMenuViewData {
  const entityName = menuData.entityName?.trim() || menuData.entityCode
  return {
    channel: 'organization',
    title: entityName,
    subtitle: `管理员 ${menuData.boundAdminCount}/${menuData.minAdminCount}`,
    avatarUrl: menuData.logoUrl,
    avatarText: menuData.logoUrl ? '' : entityName.slice(0, 1),
    level: null,
    verifiedOrganization: null,
    entityCode: menuData.entityCode,
    boundAdminCount: menuData.boundAdminCount,
    minAdminCount: menuData.minAdminCount,
    entityFullyActivated: menuData.entityFullyActivated,
  }
}

// 08）ProfileMenu 上下文提供器（ProfileMenuProvider）
/**
 * 函数名：ProfileMenuProvider
 * 功能：按登录通道选择个人 / 主体 ProfileMenu API，并向顶栏菜单提供统一数据。
 * 实现方法：
 * - 读取 AuthContext 判断 organization-admin 与个人账号
 * - 个人：GET /user-profile/menu
 * - 主体：GET /entity-profile/menu?entityCode=
 * 输入：
 * - children：应用子树
 * 输出：
 * - 返回值：ProfileMenuContext.Provider
 * - 副作用：发起菜单接口请求
 */
export function ProfileMenuProvider({ children }: ProfileMenuProviderProps) {
  const { isLoggedIn, isHydrated, userProfile, setUserProfile } = useAuth()
  const [menuData, setMenuData] = useState<ProfileMenuViewData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const activeChannel: ProfileMenuChannel | null = useMemo(() => {
    if (!isLoggedIn) {
      return null
    }
    return isOrganizationAdminRole(userProfile?.userRole) ? 'organization' : 'personal'
  }, [isLoggedIn, userProfile?.userRole])

  const refreshMenu = useCallback(async (): Promise<void> => {
    if (!isHydrated || !isLoggedIn || !activeChannel) {
      setMenuData(null)
      setErrorMessage('')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      if (activeChannel === 'organization') {
        const entityCode = resolveSessionEntityCode(userProfile) ?? getEntityCode()
        if (!entityCode) {
          throw new Error('缺少主体代码，无法加载机构菜单')
        }
        const organizationMenu = await getEntityProfileMenu(entityCode)
        setMenuData(mapOrganizationMenuToViewData(organizationMenu))
        return
      }

      const currentUserUid = userProfile?.uid ?? getUserUid()
      const cachedMenu = getCachedUserProfileMenu(currentUserUid)
      if (cachedMenu) {
        setMenuData(mapPersonalMenuToViewData(cachedMenu))
      }

      const personalMenu = await getUserProfileMenu()
      setMenuData(mapPersonalMenuToViewData(personalMenu))
      if (personalMenu.uid) {
        setCachedUserProfileMenu(personalMenu.uid, personalMenu)
        setUserProfile({
          uid: personalMenu.uid,
          userRole: userProfile?.userRole,
          authStatus: userProfile?.authStatus,
          entityCode: userProfile?.entityCode,
          entityName: userProfile?.entityName,
        })
      }
    } catch (error) {
      setMenuData(null)
      setErrorMessage(error instanceof Error ? error.message : '菜单加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [activeChannel, isHydrated, isLoggedIn, setUserProfile, userProfile])

  useEffect(() => {
    if (!isHydrated || !isLoggedIn) {
      setMenuData(null)
      setErrorMessage('')
      setIsLoading(false)
      return
    }

    void refreshMenu()
  }, [isHydrated, isLoggedIn, activeChannel, userProfile?.uid, userProfile?.entityCode, refreshMenu])

  const contextValue = useMemo<ProfileMenuContextValue>(
    () => ({
      channel: activeChannel,
      menuData,
      isLoading,
      errorMessage,
      refreshMenu,
    }),
    [activeChannel, errorMessage, isLoading, menuData, refreshMenu],
  )

  return <ProfileMenuContext.Provider value={contextValue}>{children}</ProfileMenuContext.Provider>
}

// 09）读取 ProfileMenu 上下文（useProfileMenu）
/**
 * 函数名：useProfileMenu
 * 功能：读取 ProfileMenuProvider 提供的菜单数据与刷新方法。
 * 输入：无
 * 输出：
 * - 返回值：ProfileMenuContextValue
 * - 副作用：无
 */
export function useProfileMenu(): ProfileMenuContextValue {
  const context = useContext(ProfileMenuContext)
  if (!context) {
    throw new Error('useProfileMenu 必须在 ProfileMenuProvider 内使用')
  }
  return context
}
